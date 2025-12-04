import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Folder, Loader2, Download, Check, X } from "lucide-react";

interface LabeledData {
  filename: string;
  imageUrl: string;
  label: string;
  confidence: number;
}

type ViewMode = "1x1" | "2x2" | "3x3";

export function LabelingAutoPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { hospital } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState<"select" | "labeling" | "review">("select");
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [labelingProgress, setLabelingProgress] = useState(0);
  const [labeledData, setLabeledData] = useState<LabeledData[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("1x1");
  const [currentPage, setCurrentPage] = useState(0);

  // 세션 정보 (실제로는 API에서 가져옴)
  const sessionClasses = ["No Finding", "Pneumonia", "Atelectasis", "Cardiomegaly"];

  // 로그인 체크
  useEffect(() => {
    if (!hospital) {
      navigate("/login");
    }
  }, [hospital, navigate]);

  if (!hospital) {
    return null;
  }

  // 파일 선택 처리
  const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setSelectedFolder(`${files.length}개 파일 선택됨`);
    
    // 자동 라벨링 시작
    setStep("labeling");
    
    // 모의 자동 라벨링 프로세스
    const mockLabeling = async () => {
      const results: LabeledData[] = [];
      
      // 실제 선택된 이미지 파일들을 처리
      const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
      
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const reader = new FileReader();
        
        await new Promise((resolve) => {
          reader.onload = (event) => {
            const label = sessionClasses[Math.floor(Math.random() * sessionClasses.length)];
            const confidence = 0.75 + Math.random() * 0.24; // 75-99%
            
            results.push({
              filename: file.name,
              imageUrl: event.target?.result as string,
              label,
              confidence
            });
            
            setLabelingProgress(((i + 1) / imageFiles.length) * 100);
            resolve(null);
          };
          reader.readAsDataURL(file);
        });
        
        // 시뮬레이션을 위한 딜레이
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      setLabeledData(results);
      setStep("review");
    };

    mockLabeling();
  };

  // CSV 다운로드
  const handleDownloadCSV = () => {
    const csvContent = [
      ["filename", "label", "confidence"],
      ...labeledData.map(d => [d.filename, d.label, d.confidence.toFixed(4)])
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
    navigate(`/session/${sessionId}/training`);
  };

  // 뷰 모드에 따른 이미지 개수
  const imagesPerPage = viewMode === "1x1" ? 1 : viewMode === "2x2" ? 4 : 9;
  const totalPages = Math.ceil(labeledData.length / imagesPerPage);
  const currentImages = labeledData.slice(
    currentPage * imagesPerPage,
    (currentPage + 1) * imagesPerPage
  );

  // 파일 선택 단계
  if (step === "select") {
    return (
      <div className="min-h-screen py-12 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-gray-800 mb-8">자동 라벨링 - 데이터 선택</h1>

          <Card className="p-12 border-2 border-dashed text-center">
            <Folder className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="mb-2">데이터 폴더 선택</h3>
            <p className="text-gray-600 mb-6">
              라벨링할 이미지 파일들이 있는 폴더를 선택하세요
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFolderSelect}
              className="hidden"
              // @ts-ignore - webkitdirectory는 TypeScript에서 인식하지 못하지만 브라우저에서 작동함
              webkitdirectory=""
              directory=""
            />
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              style={{ backgroundColor: '#FF9500' }}
              className="text-white hover:opacity-90"
            >
              <Folder className="w-4 h-4 mr-2" />
              폴더 선택
            </Button>

            {selectedFolder && (
              <p className="mt-4 text-sm text-gray-700">{selectedFolder}</p>
            )}
          </Card>

          <Card className="mt-6 p-6 bg-blue-50 border-blue-200">
            <h4 className="mb-2 text-blue-900">자동 라벨링 안내</h4>
            <div className="space-y-2 text-sm text-blue-800">
              <p>• 폴더를 선택하면 그 안의 모든 이미지 파일이 로드됩니다</p>
              <p>• AI가 자동으로 이미지를 분석하여 라벨을 지정합니다</p>
              <p>• 라벨링 완료 후 검수 단계에서 결과를 확인할 수 있습니다</p>
              <p>• 잘못된 라벨은 검수 단계에서 수정 가능합니다</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // 라벨링 진행 단계
  if (step === "labeling") {
    return (
      <div className="min-h-screen py-12 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-gray-800 mb-8">자동 라벨링 진행 중</h1>

          <Card className="p-12 text-center">
            <Loader2 className="w-16 h-16 mx-auto mb-4 text-orange-500 animate-spin" />
            <h3 className="mb-2">AI가 데이터를 분석하고 있습니다</h3>
            <p className="text-gray-600 mb-6">잠시만 기다려주세요...</p>

            <Progress value={labelingProgress} className="mb-4" />
            <p className="text-sm text-gray-700">
              {Math.round(labelingProgress)}% 완료
            </p>
          </Card>
        </div>
      </div>
    );
  }

  // 검수 단계
  return (
    <div className="min-h-screen py-12 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-gray-800">라벨링 결과 검수</h1>
            <p className="text-gray-600 mt-1">
              총 {labeledData.length}개 이미지가 라벨링되었습니다
            </p>
          </div>

          {/* 뷰 모드 선택 */}
          <div className="flex gap-2">
            <Button
              variant={viewMode === "1x1" ? "default" : "outline"}
              onClick={() => {
                setViewMode("1x1");
                setCurrentPage(0);
              }}
              style={viewMode === "1x1" ? { backgroundColor: '#FF9500' } : {}}
              className={viewMode === "1x1" ? "text-white" : ""}
            >
              1x1
            </Button>
            <Button
              variant={viewMode === "2x2" ? "default" : "outline"}
              onClick={() => {
                setViewMode("2x2");
                setCurrentPage(0);
              }}
              style={viewMode === "2x2" ? { backgroundColor: '#FF9500' } : {}}
              className={viewMode === "2x2" ? "text-white" : ""}
            >
              2x2
            </Button>
            <Button
              variant={viewMode === "3x3" ? "default" : "outline"}
              onClick={() => {
                setViewMode("3x3");
                setCurrentPage(0);
              }}
              style={viewMode === "3x3" ? { backgroundColor: '#FF9500' } : {}}
              className={viewMode === "3x3" ? "text-white" : ""}
            >
              3x3
            </Button>
          </div>
        </div>

        {/* 이미지 그리드 */}
        <div className={`grid gap-4 mb-6 ${
          viewMode === "1x1" ? "grid-cols-1" :
          viewMode === "2x2" ? "grid-cols-2" :
          "grid-cols-3"
        }`}>
          {currentImages.map((data, index) => (
            <Card key={index} className="p-4 border-2">
              <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
                <img
                  src={data.imageUrl}
                  alt={data.filename}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600 truncate">{data.filename}</p>
                <div className="flex items-center justify-between">
                  <Badge
                    style={{ backgroundColor: '#FF9500' }}
                    className="text-white"
                  >
                    {data.label}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {(data.confidence * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mb-6">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
            >
              이전
            </Button>
            <span className="text-sm text-gray-700">
              {currentPage + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage === totalPages - 1}
            >
              다음
            </Button>
          </div>
        )}

        {/* 하단 액션 버튼 */}
        <div className="flex gap-4 justify-center">
          <Button
            variant="outline"
            onClick={handleDownloadCSV}
            className="px-6 py-6"
          >
            <Download className="w-4 h-4 mr-2" />
            CSV 다운로드
          </Button>
          <Button
            onClick={handleStartTraining}
            style={{ backgroundColor: '#6B3131' }}
            className="text-white hover:opacity-90 px-8 py-6"
          >
            <Check className="w-4 h-4 mr-2" />
            검수 완료 및 학습 시작
          </Button>
        </div>
      </div>
    </div>
  );
}