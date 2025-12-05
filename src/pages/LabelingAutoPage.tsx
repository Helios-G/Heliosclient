import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Folder, Loader2, Download, Check } from "lucide-react";

// ✅ TF.js 및 데이터 컨텍스트 추가
import * as tf from "@tensorflow/tfjs";
import { useTrainingData } from "../contexts/TrainingDataContext";

interface LabeledData {
  filename: string;
  imageUrl: string;
  label: string;
  confidence: number;
  tensor?: tf.Tensor; // 학습용 텐서 저장
}

type ViewMode = "1x1" | "2x2" | "3x3";

// CheXpert 클래스 정의 (0: Normal, 1: Pneumonia 등)
// 실제 모델 출력 순서와 맞춰야 함 (여기서는 데모용으로 2개만 사용)
const CLASSES = ["No Finding", "Pneumonia"];

export function LabelingAutoPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { hospital } = useAuth();
  const { setTrainingData } = useTrainingData(); // 전역 데이터 저장소

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState<"select" | "labeling" | "review">("select");
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [labelingProgress, setLabelingProgress] = useState(0);
  const [labeledData, setLabeledData] = useState<LabeledData[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("1x1");
  const [currentPage, setCurrentPage] = useState(0);
  const [model, setModel] = useState<tf.LayersModel | null>(null);

  // 로그인 체크
  useEffect(() => {
    if (!hospital) {
      navigate("/login");
    }
  }, [hospital, navigate]);

  // ✅ 1. 오토라벨링 모델 로드 (페이지 진입 시)
  useEffect(() => {
    const loadModel = async () => {
      try {
        console.log("⏳ 모델 로딩 중...");
        // public/web_model/model.json 경로 (없으면 MobileNet 사용)
        const loadedModel = await tf.loadLayersModel(
          "/web_model/model.json" 
        ).catch(() => {
            console.warn("로컬 모델 없음, MobileNet 사용");
            return tf.loadLayersModel("https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json");
        });
        
        setModel(loadedModel);
        console.log("✅ 모델 로드 완료!");
      } catch (err) {
        console.error("❌ 모델 로드 실패:", err);
      }
    };
    loadModel();
  }, []);

  if (!hospital) return null;

  // 파일 선택 처리
  const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!model) {
        alert("AI 모델이 아직 로딩되지 않았습니다. 잠시만 기다려주세요.");
        return;
    }

    setSelectedFolder(`${files.length}개 파일 선택됨`);
    setStep("labeling");
    
    // ✅ 2. 진짜 오토라벨링 실행
    const runAutoLabeling = async () => {
      const results: LabeledData[] = [];
      const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
      
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        
        // 이미지 로드 및 텐서 변환
        const imgElement = new Image();
        const imageUrl = URL.createObjectURL(file);
        imgElement.src = imageUrl;
        
        await new Promise((resolve) => { imgElement.onload = resolve; });

        // 전처리
        const tensor = tf.browser.fromPixels(imgElement)
            .resizeNearestNeighbor([224, 224])
            .toFloat()
            .div(255.0)
            .expandDims();

        // 추론 (Inference)
        const predictions = await model.predict(tensor) as tf.Tensor;
        const data = await predictions.data();
        
        // 결과 해석 (MobileNet은 1000개지만, 여기선 0번 인덱스 값으로 판단)
        // 실제 CheXNet이라면 data[7]이 Pneumonia 확률
        const score = data[0]; 
        const label = score > 0.5 ? "Pneumonia" : "No Finding";
        
        results.push({
          filename: file.name,
          imageUrl,
          label,
          confidence: score > 0.5 ? score : 1 - score,
          tensor: tensor // 나중에 학습에 쓰기 위해 저장
        });
        
        // 메모리 정리 (텐서는 나중에 쓸 거라 dispose 안 함, 예측 결과만 정리)
        predictions.dispose();
        
        setLabelingProgress(((i + 1) / imageFiles.length) * 100);
        
        // UI 업데이트를 위한 짧은 대기
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      setLabeledData(results);
      setStep("review");
    };

    runAutoLabeling();
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

  // ✅ 3. 학습 시작 (데이터 전송)
  const handleStartTraining = () => {
    if (labeledData.length === 0) return;

    console.log("🔄 학습 데이터 준비 중...");

    // 텐서들을 하나로 묶기 (Stack)
    const xTensors = labeledData.map(d => d.tensor!);
    const xTrain = tf.concat(xTensors, 0); // [N, 224, 224, 3]

    // 라벨 변환 (Pneumonia=1, No Finding=0)
    const yValues = labeledData.map(d => d.label === "Pneumonia" ? 1 : 0);
    const yTrain = tf.tensor2d(yValues, [yValues.length, 1]);

    // 전역 Context에 저장
    setTrainingData(xTrain, yTrain);
    console.log(`✅ 데이터 전송 완료! (${labeledData.length}개)`);

    navigate(`/session/${sessionId}/training`);
  };

  // 뷰 모드 관련 로직
  const imagesPerPage = viewMode === "1x1" ? 1 : viewMode === "2x2" ? 4 : 9;
  const totalPages = Math.ceil(labeledData.length / imagesPerPage);
  const currentImages = labeledData.slice(
    currentPage * imagesPerPage,
    (currentPage + 1) * imagesPerPage
  );

  // --- 렌더링 (UI) ---
  
  // 1. 파일 선택 단계
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
              // @ts-ignore
              webkitdirectory=""
              directory=""
            />
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              style={{ backgroundColor: '#FF9500' }}
              className="text-white hover:opacity-90"
              disabled={!model} // 모델 로딩 전에는 비활성화
            >
              {model ? (
                <>
                  <Folder className="w-4 h-4 mr-2" />
                  폴더 선택
                </>
              ) : (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  모델 로딩 중...
                </>
              )}
            </Button>

            {selectedFolder && (
              <p className="mt-4 text-sm text-gray-700">{selectedFolder}</p>
            )}
          </Card>

          <Card className="mt-6 p-6 bg-blue-50 border-blue-200">
            <h4 className="mb-2 text-blue-900">자동 라벨링 안내</h4>
            <div className="space-y-2 text-sm text-blue-800">
              <p>• 폴더를 선택하면 그 안의 모든 이미지 파일이 로드됩니다</p>
              <p>• <strong>브라우저 내장 AI (TF.js)</strong>가 이미지를 분석하여 라벨을 지정합니다</p>
              <p>• 데이터는 서버로 전송되지 않고 <strong>로컬에서 처리</strong>됩니다 (Privacy Safe)</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // 2. 라벨링 진행 단계
  if (step === "labeling") {
    return (
      <div className="min-h-screen py-12 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-gray-800 mb-8">자동 라벨링 진행 중</h1>

          <Card className="p-12 text-center">
            <Loader2 className="w-16 h-16 mx-auto mb-4 text-orange-500 animate-spin" />
            <h3 className="mb-2">AI가 데이터를 분석하고 있습니다</h3>
            <p className="text-gray-600 mb-6">잠시만 기다려주세요... (로컬 연산 중)</p>

            <Progress value={labelingProgress} className="mb-4" />
            <p className="text-sm text-gray-700">
              {Math.round(labelingProgress)}% 완료
            </p>
          </Card>
        </div>
      </div>
    );
  }

  // 3. 검수 단계 (기존 UI 유지)
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

          <div className="flex gap-2">
            <Button
              variant={viewMode === "1x1" ? "default" : "outline"}
              onClick={() => { setViewMode("1x1"); setCurrentPage(0); }}
              style={viewMode === "1x1" ? { backgroundColor: '#FF9500' } : {}}
              className={viewMode === "1x1" ? "text-white" : ""}
            >
              1x1
            </Button>
            <Button
              variant={viewMode === "2x2" ? "default" : "outline"}
              onClick={() => { setViewMode("2x2"); setCurrentPage(0); }}
              style={viewMode === "2x2" ? { backgroundColor: '#FF9500' } : {}}
              className={viewMode === "2x2" ? "text-white" : ""}
            >
              2x2
            </Button>
            <Button
              variant={viewMode === "3x3" ? "default" : "outline"}
              onClick={() => { setViewMode("3x3"); setCurrentPage(0); }}
              style={viewMode === "3x3" ? { backgroundColor: '#FF9500' } : {}}
              className={viewMode === "3x3" ? "text-white" : ""}
            >
              3x3
            </Button>
          </div>
        </div>

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
                    style={{ backgroundColor: data.label === "Pneumonia" ? '#dc3545' : '#28a745' }}
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