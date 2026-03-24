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
  LayoutGrid,
  Grid2X2,
  Grid3X3,
  Edit2
} from "lucide-react";

import * as tf from "@tensorflow/tfjs";
import { useTrainingData } from "../contexts/TrainingDataContext";

interface ImageFile {
  filename: string;
  imageUrl: string;
  label?: string;
  confidence?: number;
}

type ViewMode = "1x1" | "2x2" | "3x3";

// CheXpert 클래스 정의
const CHEXPERT_LABELS = [
  "No Finding", "Enlarged Cardiomediastinum", "Cardiomegaly", "Lung Opacity",
  "Lung Lesion", "Edema", "Consolidation", "Pneumonia", "Atelectasis",
  "Pneumothorax", "Pleural Effusion", "Pleural Other", "Fracture", "Support Devices"
];

export function LabelingManualPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setTrainingData } = useTrainingData();

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState<"select" | "labeling" | "review">("select");
  const [images, setImages] = useState<ImageFile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressValue, setProgressValue] = useState(0);

  const [viewMode, setViewMode] = useState<ViewMode>("1x1");
  const [currentPage, setCurrentPage] = useState(0);

  const [model, setModel] = useState<tf.GraphModel | null>(null);

  // 로그인 체크
  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  // ✅ 1. 모델 로드 (AutoPage와 동일)
  useEffect(() => {
    const loadModel = async () => {
      try {
        console.log("⏳ CheXpert 모델 로딩 중...");
        await tf.setBackend('webgl');
        await tf.ready();
        
        const loadedModel = await tf.loadGraphModel("/models/chexpert_tfjs/model.json");
        setModel(loadedModel);
        console.log("✅ CheXpert 모델 로드 완료!");
      } catch (err) {
        console.error("❌ 모델 로드 실패:", err);
      }
    };
    loadModel();
  }, []);

  if (!user) return null;

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

  // 수동 라벨 저장
  const handleSaveLabel = (label: string) => {
    const updatedImages = [...images];
    updatedImages[currentIndex] = { ...updatedImages[currentIndex], label: label };
    setImages(updatedImages);

    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // ✅ 2. 남은 데이터 자동 라벨링 (AutoPage 로직 적용)
  const handleAutoLabelRemaining = async () => {
    if (!model) {
      alert("모델이 아직 로드되지 않았습니다.");
      return;
    }

    const confirm = window.confirm(`남은 ${unlabeledCount}개 이미지를 AI로 자동 라벨링 하시겠습니까?`);
    if (!confirm) return;

    setIsProcessing(true);
    setProgressValue(0);

    const updatedImages = [...images];
    // 라벨이 없는 이미지들만 필터링
    const unlabeledIndices = updatedImages.map((img, idx) => !img.label ? idx : -1).filter(idx => idx !== -1);

    for (let i = 0; i < unlabeledIndices.length; i++) {
      const idx = unlabeledIndices[i];
      const img = updatedImages[idx];

      const imgElement = new Image();
      imgElement.src = img.imageUrl;
      
      try {
          await imgElement.decode();
      } catch (e) { continue; }

      // Canvas 최적화 (320x320 - 추론용)
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 320;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.drawImage(imgElement, 0, 0, 320, 320);

      const { label, confidence } = tf.tidy(() => {
        let tensor = tf.browser.fromPixels(canvas);
        
        // 1. 리사이징
        tensor = tf.image.resizeBilinear(tensor, [320, 320]);

        // 2. 정규화
        tensor = tensor.div(255.0);
        
        // 3. 표준화 (AutoPage와 동일하게 적용)
        const mean = tf.tensor([0.485, 0.456, 0.406]);
        const std = tf.tensor([0.229, 0.224, 0.225]);
        tensor = tensor.sub(mean).div(std);
        
        // 4. Transpose
        tensor = tensor.transpose([2, 0, 1]);
        const batch = tensor.expandDims(0);

        const output = model.predict(batch) as tf.Tensor;
        const probs = output.sigmoid().dataSync();
        
        // 질병 우선순위 로직
        let maxScore = -1;
        let maxIndex = 0;
        
        for(let j=1; j<probs.length; j++) {
            if(probs[j] > maxScore) {
                maxScore = probs[j];
                maxIndex = j;
            }
        }

        const noFindingScore = probs[0];
        let finalLabel = "";
        let finalScore = 0;

        if (maxScore > 0.3) {
            finalLabel = CHEXPERT_LABELS[maxIndex];
            finalScore = maxScore;
        } else {
            if (noFindingScore > maxScore) {
                finalLabel = CHEXPERT_LABELS[0];
                finalScore = noFindingScore;
            } else {
                finalLabel = CHEXPERT_LABELS[maxIndex];
                finalScore = maxScore;
            }
        }

        return { label: finalLabel, confidence: finalScore };
      });

      updatedImages[idx] = { ...img, label, confidence };
      setProgressValue(((i + 1) / unlabeledIndices.length) * 100);
      
      // UI 멈춤 방지
      await new Promise(resolve => setTimeout(resolve, 20));
    }

    setImages(updatedImages);
    setIsProcessing(false);
    alert("AI 자동 라벨링 완료! 검수 단계로 이동합니다.");
    handleGoToReview();
  };

  // 검수 단계 라벨 수정
  const handleUpdateLabelInReview = (index: number, newLabel: string) => {
    const globalIndex = currentPage * imagesPerPage + index;
    const updatedImages = [...images];
    updatedImages[globalIndex] = { ...updatedImages[globalIndex], label: newLabel };
    setImages(updatedImages);
  };

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

  const handleGoToReview = () => {
    if (unlabeledCount > 0) {
      alert(`아직 ${unlabeledCount}개의 이미지가 라벨링되지 않았습니다.`);
      return;
    }
    setStep("review");
    setCurrentPage(0);
  };

  // ✅ 3. 학습 시작 (AutoPage와 동일하게 224x224 변환)
  const handleStartTraining = async () => {
    setIsProcessing(true);
    try {
      console.log("🔄 데이터 변환 중 (학습용 224x224)...");
      
      const xTensors = [];
      const yLabels = [];

      for (const img of images) {
        if (!img.label) continue;
        
        const imageElement = new Image();
        imageElement.src = img.imageUrl;
        await new Promise((resolve) => { imageElement.onload = resolve; });

        // Canvas 최적화 (224x224 - 학습용)
        const canvas = document.createElement('canvas');
        canvas.width = 224; 
        canvas.height = 224;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(imageElement, 0, 0, 224, 224);
        }

        const tensor = tf.tidy(() => {
            return tf.browser.fromPixels(canvas)
              .toFloat()
              .div(255.0); // 정규화만 수행
        });
        
        xTensors.push(tensor);
        
        // 라벨 변환 (One-hot Encoding [14])
        const row = new Array(14).fill(0);
        const labelIndex = CHEXPERT_LABELS.indexOf(img.label);
        if (labelIndex !== -1) {
            row[labelIndex] = 1;
        }
        yLabels.push(row);
        
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      if (xTensors.length > 0) {
        const xTrain = tf.stack(xTensors);
        const yTrain = tf.tensor2d(yLabels, [yLabels.length, 14]);
        
        console.log(`✅ 변환 완료! 메모리 사용량: ${tf.memory().numBytes / 1024 / 1024} MB`);
        
        setTrainingData(xTrain, yTrain);
        navigate(`/session/${sessionId}/training`);
      }
    } catch (error) {
      console.error(error);
      alert("메모리 부족 오류가 발생했습니다. 이미지 개수를 줄여주세요.");
    } finally {
      setIsProcessing(false);
    }
  };

  const labeledCount = images.filter(img => img.label).length;
  const unlabeledCount = images.length - labeledCount;
  const progress = images.length > 0 ? (labeledCount / images.length) * 100 : 0;
  const currentImage = images[currentIndex];

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
          <h1 className="text-2xl font-bold text-gray-800 mb-8">수동 라벨링 - 데이터 선택</h1>
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
                  {CHEXPERT_LABELS.map((className) => (
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
                <Button 
                    variant="outline" 
                    onClick={handleAutoLabelRemaining} 
                    className="w-full border-2" 
                    style={{ borderColor: '#6B3131', color: '#6B3131' }}
                    disabled={isProcessing || !model}
                >
                  {isProcessing ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 분석 중 ({Math.round(progressValue)}%)...</>
                  ) : (
                    <><Wand2 className="w-4 h-4 mr-2" /> 남은 데이터 자동 라벨링</>
                  )}
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
            <h1 className="text-2xl font-bold text-gray-900">라벨링 결과 검수</h1>
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

        <div className={`grid gap-4 mb-6 ${viewMode === "1x1" ? "grid-cols-1 max-w-2xl mx-auto" : viewMode === "2x2" ? "grid-cols-2" : "grid-cols-3"}`}>
          {currentReviewImages.map((img, index) => (
            <Card key={index} className="p-4 border-2">
              <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
                <img src={img.imageUrl} alt={img.filename} className="w-full h-full object-contain" />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600 truncate">{img.filename}</p>
                <div className="flex items-center justify-between">
                  <select 
                    value={img.label} 
                    onChange={(e) => handleUpdateLabelInReview(index, e.target.value)}
                    className="text-sm border rounded px-2 py-1 bg-white text-gray-800 cursor-pointer focus:ring-2 focus:ring-orange-500 outline-none w-full mr-2"
                  >
                    {CHEXPERT_LABELS.map(label => (<option key={label} value={label}>{label}</option>))}
                  </select>
                  {img.confidence && <span className="text-xs font-bold text-gray-500 whitespace-nowrap">{(img.confidence * 100).toFixed(0)}%</span>}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mb-8">
            <button onClick={() => setCurrentPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0} style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: '4px', background: 'white' }}>이전</button>
            <span className="text-sm font-medium text-gray-700">{currentPage + 1} / {totalPages}</span>
            <button onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))} disabled={currentPage === totalPages - 1} style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: '4px', background: 'white' }}>다음</button>
          </div>
        )}

        <div className="flex gap-4 justify-center pb-12">
          <Button variant="outline" onClick={() => setStep("labeling")} className="px-6 py-6">
            <ChevronLeft className="w-4 h-4 mr-2" /> 수정하기
          </Button>
          <Button variant="outline" onClick={handleDownloadCSV} className="px-6 py-6">
            <Download className="w-4 h-4 mr-2" /> CSV 다운로드
          </Button>
          <Button onClick={handleStartTraining} style={{ backgroundColor: '#6B3131' }} className="text-white hover:opacity-90 px-8 py-6" disabled={isProcessing}>
            {isProcessing ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> 변환 중...</> : <><Check className="w-5 h-5 mr-2" /> 검수 완료 및 연합학습 시작</>}
          </Button>
        </div>
      </div>
    </div>
  );
}