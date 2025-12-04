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
  Wand2
} from "lucide-react";

interface ImageFile {
  filename: string;
  imageUrl: string;
  label?: string;
}

export function LabelingManualPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { hospital } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState<"select" | "labeling">("select");
  const [images, setImages] = useState<ImageFile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedLabel, setSelectedLabel] = useState<string>("");

  // 세션 정보 (실제로는 API에서 가져옴 - ChexPert 예시)
  const sessionClasses = [
    "No Finding",
    "Atelectasis",
    "Cardiomegaly",
    "Consolidation",
    "Edema",
    "Pleural Effusion"
  ];

  // 로그인 체크
  useEffect(() => {
    if (!hospital) {
      navigate("/login");
    }
  }, [hospital, navigate]);

  if (!hospital) {
    return null;
  }

  // 파일/폴더 선택 처리
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const imageFiles: ImageFile[] = [];
    
    // 선택된 모든 이미지 파일 로드
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // 이미지 파일만 필터링
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
    updatedImages[currentIndex] = {
      ...updatedImages[currentIndex],
      label: label
    };
    setImages(updatedImages);

    // 다음 이미지로 자동 이동
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedLabel("");
    }
  };

  // AI 자동 라벨링 (남은 데이터)
  const handleAutoLabelRemaining = async () => {
    const confirm = window.confirm(
      `라벨링되지 않은 ${unlabeledCount}개의 이미지를 AI가 자동으로 라벨링합니다. 계속하시겠습니까?`
    );
    
    if (!confirm) return;

    const updatedImages = images.map(img => {
      if (!img.label) {
        // 랜덤 라벨 할당 (실제로는 AI 예측)
        return {
          ...img,
          label: sessionClasses[Math.floor(Math.random() * sessionClasses.length)]
        };
      }
      return img;
    });

    setImages(updatedImages);
    alert("AI 자동 라벨링이 완료되었습니다.");
  };

  // CSV 다운로드
  const handleDownloadCSV = () => {
    const csvContent = [
      ["filename", "label"],
      ...images.filter(img => img.label).map(img => [img.filename, img.label!])
    ]
      .map(row => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `labeling_results_${sessionId}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 학습 시작
  const handleStartTraining = () => {
    if (unlabeledCount > 0) {
      alert(`아직 ${unlabeledCount}개의 이미지가 라벨링되지 않았습니다.`);
      return;
    }
    navigate(`/session/${sessionId}/training`);
  };

  const labeledCount = images.filter(img => img.label).length;
  const unlabeledCount = images.length - labeledCount;
  const progress = images.length > 0 ? (labeledCount / images.length) * 100 : 0;

  // 파일 선택 단계
  if (step === "select") {
    return (
      <div className="min-h-screen py-12 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-gray-800 mb-8">수동 라벨링 - 데이터 선택</h1>

          <Card className="p-12 border-2 border-dashed text-center">
            <Folder className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="mb-2">데이터 폴더 선택</h3>
            <p className="text-gray-600 mb-6">
              라벨링할 이미지 파일들이 있는 폴더를 선택하세요
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              // @ts-ignore - webkitdirectory는 TypeScript에서 인식하지 못하지만 브라우저에서 작동함
              webkitdirectory=""
              directory=""
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              style={{ backgroundColor: '#FF9500' }}
              className="text-white hover:opacity-90"
            >
              <Folder className="w-4 h-4 mr-2" />
              폴더 선택
            </Button>
          </Card>

          <Card className="mt-6 p-6 bg-blue-50 border-blue-200">
            <h4 className="mb-2 text-blue-900">수동 라벨링 안내</h4>
            <div className="space-y-2 text-sm text-blue-800">
              <p>• 폴더를 선택하면 그 안의 모든 이미지 파일이 로드됩니다</p>
              <p>• 이미지를 하나씩 확인하며 직접 라벨을 지정합니다</p>
              <p>• 진행 중에도 "남은 데이터 AI로 자동 라벨링" 버튼으로 나머지를 자동화할 수 있습니다</p>
              <p>• 정확한 라벨링이 모델 성능에 중요한 영향을 미칩니다</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const currentImage = images[currentIndex];

  // 라벨링 단계
  return (
    <div className="min-h-screen py-12 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="text-gray-800">수동 라벨링</h1>
          <div className="flex items-center gap-4 mt-4">
            <Progress value={progress} className="flex-1" />
            <span className="text-sm text-gray-700 whitespace-nowrap">
              {labeledCount} / {images.length} 완료
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 이미지 표시 영역 */}
          <div className="lg:col-span-2">
            <Card className="p-6 border-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-800">
                  이미지 {currentIndex + 1} / {images.length}
                </h3>
                {currentImage?.label && (
                  <Badge
                    style={{ backgroundColor: '#00A86B' }}
                    className="text-white"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    {currentImage.label}
                  </Badge>
                )}
              </div>

              {/* 이미지 */}
              <div className="bg-gray-100 rounded-lg mb-4 aspect-square overflow-hidden">
                <img
                  src={currentImage?.imageUrl}
                  alt={currentImage?.filename}
                  className="w-full h-full object-contain"
                />
              </div>

              <p className="text-sm text-gray-600 mb-4 truncate">
                {currentImage?.filename}
              </p>

              {/* 네비게이션 */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentIndex(Math.max(0, currentIndex - 1));
                    setSelectedLabel("");
                  }}
                  disabled={currentIndex === 0}
                  className="flex-1"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  이전
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentIndex(Math.min(images.length - 1, currentIndex + 1));
                    setSelectedLabel("");
                  }}
                  disabled={currentIndex === images.length - 1}
                  className="flex-1"
                >
                  다음
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </Card>
          </div>

          {/* 라벨 선택 영역 */}
          <div className="space-y-4">
            <Card className="p-6 border-2">
              <h3 className="mb-4">라벨 선택</h3>

              {/* 버튼으로 라벨 선택 */}
              <div className="space-y-2">
                {sessionClasses.map((className) => (
                  <Button
                    key={className}
                    onClick={() => handleSaveLabel(className)}
                    variant={currentImage?.label === className ? "default" : "outline"}
                    className="w-full justify-start text-left"
                    style={
                      currentImage?.label === className
                        ? { backgroundColor: '#FF9500', color: 'white' }
                        : {}
                    }
                  >
                    {currentImage?.label === className && (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    {className}
                  </Button>
                ))}
              </div>
            </Card>

            {/* 통계 */}
            <Card className="p-6 border-2">
              <h4 className="mb-3">라벨링 통계</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">전체 이미지</span>
                  <span>{images.length}개</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">완료</span>
                  <span className="text-green-600">{labeledCount}개</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">남음</span>
                  <span className="text-orange-600">{unlabeledCount}개</span>
                </div>
              </div>
            </Card>

            {/* AI 자동 라벨링 */}
            {unlabeledCount > 0 && (
              <Button
                variant="outline"
                onClick={handleAutoLabelRemaining}
                className="w-full border-2"
                style={{ borderColor: '#6B3131', color: '#6B3131' }}
              >
                <Wand2 className="w-4 h-4 mr-2" />
                남은 데이터 AI로 자동 라벨링 ({unlabeledCount}개)
              </Button>
            )}
          </div>
        </div>

        {/* 하단 액션 버튼 */}
        <div className="flex gap-4 justify-center mt-8">
          <Button
            variant="outline"
            onClick={handleDownloadCSV}
            className="px-6 py-6"
            disabled={labeledCount === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            CSV 다운로드
          </Button>
          <Button
            onClick={handleStartTraining}
            style={{ backgroundColor: '#6B3131' }}
            className="text-white hover:opacity-90 px-8 py-6"
            disabled={unlabeledCount > 0}
          >
            <Check className="w-4 h-4 mr-2" />
            라벨링 완료 및 학습 시작
          </Button>
        </div>
      </div>
    </div>
  );
}
