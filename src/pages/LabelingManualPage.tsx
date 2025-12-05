import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { 
  Folder, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Check,
  Wand2,
  Loader2,
  LayoutGrid, // 아이콘 추가
  Grid2X2,
  Grid3X3
} from "lucide-react";

import * as tf from "@tensorflow/tfjs";
import { useTrainingData } from "../contexts/TrainingDataContext";

interface ImageFile {
  filename: string;
  imageUrl: string;
  label?: string;
}

type ViewMode = "1x1" | "2x2" | "3x3";

export function LabelingManualPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { hospital } = useAuth();
  const { setTrainingData } = useTrainingData();

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // ✅ Step에 'review' 추가
  const [step, setStep] = useState<"select" | "labeling" | "review">("select");
  const [images, setImages] = useState<ImageFile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // ✅ 검수 페이지용 State 추가
  const [viewMode, setViewMode] = useState<ViewMode>("1x1");
  const [currentPage, setCurrentPage] = useState(0);

  const sessionClasses = [
    "No Finding",
    "Atelectasis",
    "Cardiomegaly",
    "Consolidation",
    "Edema",
    "Pleural Effusion",
    "Pneumonia"
  ];

  useEffect(() => {
    if (!hospital) navigate("/login");
  }, [hospital, navigate]);

  if (!hospital) return null;

  // 파일 선택
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const imageFiles: ImageFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;
      
      const reader = new FileReader();
      await new Promise((resolve) => {
        reader.onload = (event) => {
          imageFiles.push({
            filename: file.name,
            imageUrl: event.target?.result as string,
            label: undefined
          });
          resolve(null);
        };
        reader.readAsDataURL(file);
      });
    }
    
    if (imageFiles.length === 0) {
      alert("이미지 파일이 없습니다.");
      return;
    }
    
    setImages(imageFiles);
    setStep("labeling");
  };

  // 라벨 저장
  const handleSaveLabel = (label: string) => {
    const updatedImages = [...images];
    updatedImages[currentIndex] = { ...updatedImages[currentIndex], label: label };
    setImages(updatedImages);

    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // AI 자동 라벨링 (남은 것)
  const handleAutoLabelRemaining = async () => {
    const confirm = window.confirm(`남은 ${unlabeledCount}개 이미지를 AI로 자동 라벨링 하시겠습니까?`);
    if (!confirm) return;

    const updatedImages = images.map(img => {
      if (!img.label) {
        return {
          ...img,
          label: sessionClasses[Math.floor(Math.random() * sessionClasses.length)]
        };
      }
      return img;
    });
    setImages(updatedImages);
  };

  // CSV 다운로드
  const handleDownloadCSV = () => {
    const csvContent = [
      ["filename", "label"],
      ...images.filter(img => img.label).map(img => [img.filename, img.label!])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `labeling_results_${sessionId}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ✅ 검수 화면으로 이동
  const handleGoToReview = () => {
    if (unlabeledCount > 0) {
      alert(`아직 ${unlabeledCount}개의 이미지가 라벨링되지 않았습니다.`);
      return;
    }
    setStep("review");
    setCurrentPage(0); // 페이지 초기화
  };

  // ✅ 학습 시작 (데이터 변환 및 전송)
  const handleStartTraining = async () => {
    setIsProcessing(true);
    try {
      console.log("🔄 데이터 변환 중...");
      const xTensors = [];
      const yLabels = [];

      for (const img of images) {
        if (!img.label) continue;
        const imageElement = new Image();
        imageElement.src = img.imageUrl;
        await new Promise((resolve) => { imageElement.onload = resolve; });

        const tensor = tf.browser.fromPixels(imageElement)
          .resizeNearestNeighbor([224, 224])
          .toFloat()
          .div(255.0);
        
        xTensors.push(tensor);
        const labelValue = img.label === "No Finding" ? 0 : 1;
        yLabels.push(labelValue);
      }

      if (xTensors.length > 0) {
        const xTrain = tf.stack(xTensors);
        const yTrain = tf.tensor2d(yLabels, [yLabels.length, 1]);
        setTrainingData(xTrain, yTrain);
        navigate(`/session/${sessionId}/training`);
      }
    } catch (error) {
      console.error(error);
      alert("오류 발생");
    } finally {
      setIsProcessing(false);
    }
  };

  const labeledCount = images.filter(img => img.label).length;
  const unlabeledCount = images.length - labeledCount;
  const progress = images.length > 0 ? (labeledCount / images.length) * 100 : 0;
  const currentImage = images[currentIndex];

  // 뷰 모드 계산
  const imagesPerPage = viewMode === "1x1" ? 1 : viewMode === "2x2" ? 4 : 9;
  const totalPages = Math.ceil(images.length / imagesPerPage);
  const currentReviewImages = images.slice(
    currentPage * imagesPerPage,
    (currentPage + 1) * imagesPerPage
  );

  // --- 1. 파일 선택 단계 ---
  if (step === "select") {
    return (
      <div className="min-h-screen py-12 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-gray-800 mb-8">수동 라벨링 - 데이터 선택</h1>
          <Card className="p-12 border-2 border-dashed text-center">
            <Folder className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="mb-2">데이터 폴더 선택</h3>
            <p className="text-gray-600 mb-6">라벨링할 이미지 파일들이 있는 폴더를 선택하세요</p>
            <input ref={fileInputRef} type="file" 
              // @ts-ignore
              webkitdirectory="" directory="" multiple onChange={handleFileSelect} className="hidden" />
            <Button onClick={() => fileInputRef.current?.click()} style={{ backgroundColor: '#FF9500' }} className="text-white hover:opacity-90">
              <Folder className="w-4 h-4 mr-2" /> 폴더 선택
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // --- 2. 라벨링 단계 ---
  if (step === "labeling") {
    return (
      <div className="min-h-screen py-12 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-gray-800">수동 라벨링 진행</h1>
            <div className="flex items-center gap-4 mt-4">
              <Progress value={progress} className="flex-1" />
              <span className="text-sm text-gray-700 whitespace-nowrap">{labeledCount} / {images.length} 완료</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="p-6 border-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-800">이미지 {currentIndex + 1} / {images.length}</h3>
                  {currentImage?.label && (
                    <Badge style={{ backgroundColor: '#00A86B' }} className="text-white">
                      <Check className="w-3 h-3 mr-1" /> {currentImage.label}
                    </Badge>
                  )}
                </div>
                <div className="bg-gray-100 rounded-lg mb-4 aspect-square overflow-hidden">
                  <img src={currentImage?.imageUrl} alt={currentImage?.filename} className="w-full h-full object-contain" />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))} disabled={currentIndex === 0} className="flex-1">
                    <ChevronLeft className="w-4 h-4 mr-1" /> 이전
                  </Button>
                  <Button variant="outline" onClick={() => setCurrentIndex(Math.min(images.length - 1, currentIndex + 1))} disabled={currentIndex === images.length - 1} className="flex-1">
                    다음 <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="p-6 border-2">
                <h3 className="mb-4">라벨 선택</h3>
                <div className="space-y-2">
                  {sessionClasses.map((className) => (
                    <Button
                      key={className}
                      onClick={() => handleSaveLabel(className)}
                      variant={currentImage?.label === className ? "default" : "outline"}
                      className="w-full justify-start text-left"
                      style={currentImage?.label === className ? { backgroundColor: '#FF9500', color: 'white' } : {}}
                    >
                      {currentImage?.label === className && <Check className="w-4 h-4 mr-2" />}
                      {className}
                    </Button>
                  ))}
                </div>
              </Card>
              
              {unlabeledCount > 0 && (
                <Button variant="outline" onClick={handleAutoLabelRemaining} className="w-full border-2" style={{ borderColor: '#6B3131', color: '#6B3131' }}>
                  <Wand2 className="w-4 h-4 mr-2" /> 남은 데이터 자동 라벨링
                </Button>
              )}
            </div>
          </div>

          <div className="flex gap-4 justify-center mt-8">
            <Button onClick={handleGoToReview} style={{ backgroundColor: '#6B3131' }} className="text-white hover:opacity-90 px-8 py-6" disabled={unlabeledCount > 0}>
              <Check className="w-4 h-4 mr-2" /> 라벨링 완료 및 결과 검수
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // --- 3. 검수(Review) 단계 ---
  return (
    <div className="min-h-screen py-12 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-gray-800">라벨링 결과 검수</h1>
            <p className="text-gray-600 mt-1">총 {images.length}개 이미지 라벨링 완료</p>
          </div>
          <div className="flex gap-2">
            <Button variant={viewMode === "1x1" ? "default" : "outline"} onClick={() => { setViewMode("1x1"); setCurrentPage(0); }} style={viewMode === "1x1" ? { backgroundColor: '#FF9500' } : {}} className={viewMode === "1x1" ? "text-white" : ""}>
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button variant={viewMode === "2x2" ? "default" : "outline"} onClick={() => { setViewMode("2x2"); setCurrentPage(0); }} style={viewMode === "2x2" ? { backgroundColor: '#FF9500' } : {}} className={viewMode === "2x2" ? "text-white" : ""}>
              <Grid2X2 className="w-4 h-4" />
            </Button>
            <Button variant={viewMode === "3x3" ? "default" : "outline"} onClick={() => { setViewMode("3x3"); setCurrentPage(0); }} style={viewMode === "3x3" ? { backgroundColor: '#FF9500' } : {}} className={viewMode === "3x3" ? "text-white" : ""}>
              <Grid3X3 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className={`grid gap-4 mb-6 ${viewMode === "1x1" ? "grid-cols-1" : viewMode === "2x2" ? "grid-cols-2" : "grid-cols-3"}`}>
          {currentReviewImages.map((img, index) => (
            <Card key={index} className="p-4 border-2">
              <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
                <img src={img.imageUrl} alt={img.filename} className="w-full h-full object-contain" />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600 truncate">{img.filename}</p>
                <div className="flex items-center justify-between">
                  <Badge style={{ backgroundColor: img.label === "Pneumonia" ? '#dc3545' : '#28a745' }} className="text-white">
                    {img.label}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mb-6">
            <Button variant="outline" onClick={() => setCurrentPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0}>이전</Button>
            <span className="text-sm text-gray-700">{currentPage + 1} / {totalPages}</span>
            <Button variant="outline" onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))} disabled={currentPage === totalPages - 1}>다음</Button>
          </div>
        )}

        <div className="flex gap-4 justify-center">
          <Button variant="outline" onClick={() => setStep("labeling")} className="px-6 py-6">
            <ChevronLeft className="w-4 h-4 mr-2" /> 수정하기
          </Button>
          <Button variant="outline" onClick={handleDownloadCSV} className="px-6 py-6">
            <Download className="w-4 h-4 mr-2" /> CSV 다운로드
          </Button>
          <Button onClick={handleStartTraining} style={{ backgroundColor: '#6B3131' }} className="text-white hover:opacity-90 px-8 py-6" disabled={isProcessing}>
            {isProcessing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 변환 중...</> : <><Check className="w-4 h-4 mr-2" /> 학습 시작</>}
          </Button>
        </div>
      </div>
    </div>
  );
}