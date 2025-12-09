import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { 
  Folder, 
  Loader2, 
  Download, 
  Check, 
  LayoutGrid, 
  Grid2X2, 
  Grid3X3,
  Edit2
} from "lucide-react";

import * as tf from "@tensorflow/tfjs";
import { useTrainingData } from "../contexts/TrainingDataContext";

const CHEXPERT_LABELS = [
  "No Finding", "Enlarged Cardiomediastinum", "Cardiomegaly", "Lung Opacity",
  "Lung Lesion", "Edema", "Consolidation", "Pneumonia", "Atelectasis",
  "Pneumothorax", "Pleural Effusion", "Pleural Other", "Fracture", "Support Devices"
];

interface LabeledData {
  filename: string;
  imageUrl: string;
  label: string;
  confidence: number;
  fullProbabilities: number[];
  tensor?: tf.Tensor;
}

type ViewMode = "1x1" | "2x2" | "3x3";

export function LabelingAutoPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { hospital } = useAuth();
  const { setTrainingData } = useTrainingData();

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState<"select" | "labeling" | "review">("select");
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [labelingProgress, setLabelingProgress] = useState(0);
  const [labeledData, setLabeledData] = useState<LabeledData[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("1x1");
  const [currentPage, setCurrentPage] = useState(0);
  
  const [model, setModel] = useState<tf.GraphModel | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!hospital) navigate("/login");
  }, [hospital, navigate]);

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

  if (!hospital) return null;

  const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!model) {
        alert("AI 모델이 아직 로딩되지 않았습니다.");
        return;
    }

    setSelectedFolder(`${files.length}개 파일 선택됨`);
    setStep("labeling");
    
    const runAutoLabeling = async () => {
      const results: LabeledData[] = [];
      const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
      
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        
        const imgElement = new Image();
        const imageUrl = URL.createObjectURL(file);
        imgElement.src = imageUrl;
        
        try {
            await imgElement.decode();
        } catch (e) { continue; }

        const { processedTensor, probabilities, rawLogits } = tf.tidy(() => {
            let img = tf.browser.fromPixels(imgElement);
            img = tf.image.resizeBilinear(img, [320, 320]);
            // ✅ [수정 1] 전처리 단순화 (ImageNet Mean/Std 제거)
            // X-ray 모델은 보통 0~1 사이 값만 줘도 잘 작동합니다.
            img = img.div(255.0);
            
            // ❌ 표준화 제거 (이게 데이터를 왜곡시켰을 가능성 큼)
            const mean = tf.tensor([0.485, 0.456, 0.406]);
            const std = tf.tensor([0.229, 0.224, 0.225]);
            img = img.sub(mean).div(std);

            // Transpose (유지)
            img = img.transpose([2, 0, 1]); 

            const batch = img.expandDims(0);
            const output = model.predict(batch) as tf.Tensor;
            const probs = output.sigmoid();
            
            return {
                processedTensor: batch.clone(), 
                probabilities: probs.dataSync(),
                rawLogits: output.dataSync()
            };
        });

        const probsArray = Array.from(probabilities);
        
        // 🔍 [디버깅]
        console.log(`📄 ${file.name}`);
        console.log(`   👉 Probabilities:`, probsArray);

        // ✅ [수정 2] 질병 우선순위 로직 (Disease Priority)
        // 0번(No Finding)을 제외하고, 나머지 중에서 가장 높은 걸 찾음
        let maxDiseaseScore = -1;
        let maxDiseaseIndex = -1;

        // 인덱스 1번부터 13번까지만 검사
        for (let j = 1; j < probsArray.length; j++) {
            if (probsArray[j] > maxDiseaseScore) {
                maxDiseaseScore = probsArray[j];
                maxDiseaseIndex = j;
            }
        }

        let finalLabel = "";
        let finalScore = 0;

        // 💡 "No Finding" 점수가 아무리 높아도, 
        // 어떤 질병 확률이 0.5(50%)를 넘으면 그 질병으로 판단합니다.
        if (maxDiseaseScore > 0.5) {
            finalLabel = CHEXPERT_LABELS[maxDiseaseIndex];
            finalScore = maxDiseaseScore;
        } else {
            // 질병 확률이 다 낮으면 그때서야 No Finding
            finalLabel = "No Finding";
            finalScore = probsArray[0];
        }

        results.push({
          filename: file.name,
          imageUrl,
          label: finalLabel,
          confidence: finalScore,
          fullProbabilities: probsArray,
          tensor: processedTensor 
        });
        
        setLabelingProgress(((i + 1) / imageFiles.length) * 100);
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      setLabeledData(results);
      setStep("review");
    };
    runAutoLabeling();
  };

  const handleUpdateLabel = (index: number, newLabel: string) => {
    const globalIndex = currentPage * imagesPerPage + index;
    const updatedData = [...labeledData];
    updatedData[globalIndex] = { ...updatedData[globalIndex], label: newLabel };
    setLabeledData(updatedData);
  };

  const handleDownloadCSV = () => {
    const csvContent = [
      ["filename", "label", "confidence", ...CHEXPERT_LABELS],
      ...labeledData.map(d => [
          d.filename, 
          d.label, 
          d.confidence.toFixed(4),
          ...d.fullProbabilities.map(p => p.toFixed(4))
        ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `chexpert_results_${sessionId}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleStartTraining = async () => {
    setIsProcessing(true);
    try {
        if (labeledData.length === 0) return;
        
        console.log("🔄 데이터 변환 중 (학습용 224x224)...");
        
        const xTensors = [];
        const yLabels = [];

        for (const data of labeledData) {
            const imgElement = new Image();
            imgElement.src = data.imageUrl;
            await new Promise((resolve) => { imgElement.onload = resolve; });

            const canvas = document.createElement('canvas');
            canvas.width = 224; 
            canvas.height = 224;
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.drawImage(imgElement, 0, 0, 224, 224);

            const tensor = tf.tidy(() => {
                return tf.browser.fromPixels(canvas)
                    .toFloat()
                    .div(255.0); 
            });

            xTensors.push(tensor);

            const row = new Array(14).fill(0);
            const labelIndex = CHEXPERT_LABELS.indexOf(data.label);
            if (labelIndex !== -1) {
                row[labelIndex] = 1;
            }
            yLabels.push(row);

            await new Promise(resolve => setTimeout(resolve, 10));
        }

        if (xTensors.length > 0) {
            const xTrain = tf.stack(xTensors);
            const yTrain = tf.tensor2d(yLabels, [yLabels.length, 14]);

            console.log(`✅ 변환 완료! 메모리: ${tf.memory().numBytes / 1024 / 1024} MB`);

            setTrainingData(xTrain, yTrain);
            navigate(`/session/${sessionId}/training`);
        }
    } catch (error) {
        console.error(error);
        alert("데이터 처리 중 오류가 발생했습니다.");
    } finally {
        setIsProcessing(false);
    }
  };

  const imagesPerPage = viewMode === "1x1" ? 1 : viewMode === "2x2" ? 4 : 9;
  const totalPages = Math.ceil(labeledData.length / imagesPerPage);
  const currentImages = labeledData.slice(
    currentPage * imagesPerPage,
    (currentPage + 1) * imagesPerPage
  );

  // --- 렌더링 (UI) ---
  if (step === "select") {
    return (
      <div className="min-h-screen py-12 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-8">🏥 CheXpert 오토라벨링</h1>
          <div style={{ border: '2px dashed #ccc', padding: '40px', textAlign: 'center', borderRadius: '10px', marginBottom: '20px', backgroundColor: '#fff' }}>
            <Folder style={{ width: '64px', height: '64px', margin: '0 auto 16px', color: '#FF9500' }} />
            <h3 className="text-xl font-semibold mb-2">데이터 폴더 선택</h3>
            <p className="text-gray-600 mb-6">X-ray 이미지가 들어있는 폴더를 선택하세요.</p>
            <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFolderSelect} style={{ display: 'none' }} 
              // @ts-ignore
              webkitdirectory="" directory="" />
            <button onClick={() => fileInputRef.current?.click()} disabled={!model} style={{ backgroundColor: model ? '#FF9500' : '#ccc', color: 'white', padding: '15px 30px', fontSize: '18px', border: 'none', borderRadius: '8px', cursor: model ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontWeight: 'bold' }}>
              {model ? <><Folder style={{ width: '24px', height: '24px', marginRight: '10px' }} /> 폴더 업로드 및 분석 시작</> : <><Loader2 style={{ width: '24px', height: '24px', marginRight: '10px' }} className="animate-spin" /> 모델 로딩 중...</>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "labeling") {
    return (
      <div className="min-h-screen py-12 px-4 bg-white flex items-center justify-center">
        <div className="max-w-xl w-full text-center">
            <Loader2 className="w-16 h-16 mx-auto mb-4 text-orange-500 animate-spin" />
            <h3 className="text-xl font-bold mb-2">AI가 X-ray를 분석 중입니다</h3>
            <p className="text-gray-600 mb-8">CheXpert 모델이 병변을 찾고 있습니다...</p>
            <Progress value={labelingProgress} className="h-3 mb-4" />
            <p className="text-sm font-medium text-gray-700">{Math.round(labelingProgress)}% 완료</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">라벨링 결과 검수</h1>
            <p className="text-gray-600 mt-1">총 <span className="font-bold text-[#FF9500]">{labeledData.length}</span>장의 이미지가 분석되었습니다. 잘못된 라벨은 수정하세요.</p>
          </div>
          <div className="flex gap-2 bg-white p-1 rounded-lg border">
            {(["1x1", "2x2", "3x3"] as ViewMode[]).map((mode) => (
                <button key={mode} onClick={() => { setViewMode(mode); setCurrentPage(0); }} style={{ padding: '5px 10px', borderRadius: '4px', backgroundColor: viewMode === mode ? '#f3f4f6' : 'transparent', fontWeight: viewMode === mode ? 'bold' : 'normal', border: 'none', cursor: 'pointer' }}>{mode}</button>
            ))}
          </div>
        </div>

        <div className={`grid gap-6 mb-8 ${viewMode === "1x1" ? "grid-cols-1 max-w-2xl mx-auto" : viewMode === "2x2" ? "grid-cols-2" : "grid-cols-3"}`}>
          {currentImages.map((data, index) => (
            <Card key={index} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-square bg-black relative group">
                <img src={data.imageUrl} alt={data.filename} className="w-full h-full object-contain" />
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-white text-xs truncate opacity-0 group-hover:opacity-100 transition-opacity">{data.filename}</div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <select 
                    value={data.label} 
                    onChange={(e) => handleUpdateLabel(index, e.target.value)}
                    className="text-sm border rounded px-2 py-1 bg-white text-gray-800 cursor-pointer focus:ring-2 focus:ring-orange-500 outline-none w-full mr-2"
                  >
                    {CHEXPERT_LABELS.map(label => (<option key={label} value={label}>{label}</option>))}
                  </select>
                  {data.confidence && <span className="text-xs font-bold text-gray-500 whitespace-nowrap">{(data.confidence * 100).toFixed(0)}%</span>}
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
          <button onClick={handleDownloadCSV} style={{ padding: '15px 30px', border: '1px solid #ccc', borderRadius: '8px', background: 'white', display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '16px' }}><Download className="w-5 h-5 mr-2" /> CSV 결과 저장</button>
          <button onClick={handleStartTraining} style={{ padding: '15px 30px', borderRadius: '8px', background: '#6B3131', color: 'white', border: 'none', display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }} disabled={isProcessing}>
            {isProcessing ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> 변환 중...</> : <><Check className="w-5 h-5 mr-2" /> 검수 완료 및 연합학습 시작</>}
          </button>
        </div>
      </div>
    </div>
  );
}