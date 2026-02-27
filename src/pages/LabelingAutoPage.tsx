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
      
      // ✅ [최적화] 메모리 누수 방지를 위해 배치 처리
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        
        // 1. 이미지 URL 생성
        const imgElement = new Image();
        const imageUrl = URL.createObjectURL(file);
        imgElement.src = imageUrl;
        
        try {
            // ✅ [핵심 1] onload 대신 decode() 사용
            // 이미지가 GPU에서 사용할 준비가 될 때까지 확실하게 기다림 (0점 방지)
            await imgElement.decode();
        } catch (e) {
            console.error(`이미지 디코딩 실패 (건너뜀): ${file.name}`, e);
            URL.revokeObjectURL(imageUrl); // 실패한 URL 해제
            continue; 
        }

        // 2. 추론 및 텐서 생성 (메모리 관리 철저)
        const { processedTensor, probabilities, rawLogits } = tf.tidy(() => {
            // ✅ [핵심 2] Canvas 없이 이미지 태그에서 바로 변환 (메모리 절약)
            let img = tf.browser.fromPixels(imgElement);
            
            // 리사이징 (320x320)
            img = tf.image.resizeBilinear(img, [320, 320]);

            // 정규화 (0~1)
            img = img.div(255.0);
            
            // 표준화 (ImageNet Mean/Std) - CheXpert 모델 필수
            const mean = tf.tensor([0.485, 0.456, 0.406]);
            const std = tf.tensor([0.229, 0.224, 0.225]);
            img = img.sub(mean).div(std);

            // Transpose (NHWC -> NCHW)
            img = img.transpose([2, 0, 1]); 

            // 배치 차원 추가
            const batch = img.expandDims(0);
            
            const output = model.predict(batch) as tf.Tensor;
            const probs = output.sigmoid();
            
            return {
                processedTensor: batch.clone(), // 나중에 학습에 쓸 텐서만 복사해서 밖으로 뺌
                probabilities: probs.dataSync(),
                rawLogits: output.dataSync()
            };
        });

        const probsArray = Array.from(probabilities);
        
        // 🔍 [디버깅] 0점 나오는지 확인
        // console.log(`📄 ${file.name} -> Max Prob: ${Math.max(...probsArray).toFixed(4)}`);

        // 질병 우선순위 판단 로직
        let maxDiseaseScore = -1;
        let maxDiseaseIndex = -1;

        for (let j = 1; j < probsArray.length; j++) {
            if (probsArray[j] > maxDiseaseScore) {
                maxDiseaseScore = probsArray[j];
                maxDiseaseIndex = j;
            }
        }

        const noFindingScore = probsArray[0];
        let finalLabel = "";
        let finalScore = 0;

        if (maxDiseaseScore > 0.3) {
            finalLabel = CHEXPERT_LABELS[maxDiseaseIndex];
            finalScore = maxDiseaseScore;
        } else {
            if (noFindingScore > maxDiseaseScore) {
                finalLabel = CHEXPERT_LABELS[0];
                finalScore = noFindingScore;
            } else {
                finalLabel = CHEXPERT_LABELS[maxDiseaseIndex];
                finalScore = maxDiseaseScore;
            }
        }

        results.push({
          filename: file.name,
          imageUrl, // 검수 화면을 위해 유지
          label: finalLabel,
          confidence: finalScore,
          fullProbabilities: probsArray,
          tensor: processedTensor 
        });
        
        setLabelingProgress(((i + 1) / imageFiles.length) * 100);
        
        // ✅ [핵심 3] 브라우저 멈춤 방지 (UI 스레드 양보)
        // setTimeout 대신 tf.nextFrame()을 쓰면 가장 효율적으로 쉼
        await tf.nextFrame(); 
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
        
        console.log("🔄 데이터 변환 및 분할 중 (Train 80% / Test 20%)...");
        
        // 1. 데이터 무작위 섞기 (Shuffle)
        const shuffledData = [...labeledData].sort(() => Math.random() - 0.5);

        // 2. 80:20 분할
        const splitIdx = Math.floor(shuffledData.length * 0.8);
        const trainData = shuffledData.slice(0, splitIdx);
        const testData = shuffledData.slice(splitIdx);

        console.log(`📊 데이터 분할: 학습용 ${trainData.length}장 / 테스트용 ${testData.length}장`);

        // 텐서 변환 헬퍼 함수
        const convertToTensors = async (dataList: LabeledData[]) => {
            const xList = [];
            const yList =[];

            for (const data of dataList) {
                const imgElement = new Image();
                imgElement.src = data.imageUrl;
                await new Promise((resolve) => { imgElement.onload = resolve; });

                const canvas = document.createElement('canvas');
                canvas.width = 224; 
                canvas.height = 224;
                const ctx = canvas.getContext('2d');
                if (ctx) ctx.drawImage(imgElement, 0, 0, 224, 224);

                const tensor = tf.tidy(() => {
                    return tf.browser.fromPixels(canvas).toFloat().div(255.0);
                });
                xList.push(tensor);

                const row = new Array(14).fill(0);
                const labelIndex = CHEXPERT_LABELS.indexOf(data.label);
                if (labelIndex !== -1) row[labelIndex] = 1;
                yList.push(row);

                await new Promise(resolve => setTimeout(resolve, 5));
            }
            
            if (xList.length === 0) return null;
            
            return {
                x: tf.stack(xList),
                y: tf.tensor2d(yList,[yList.length, 14])
            };
        };

        // 3. Train / Test 텐서 생성
        const trainTensors = await convertToTensors(trainData);
        const testTensors = await convertToTensors(testData);

        if (trainTensors && testTensors) {
            console.log(`✅ 변환 완료! 메모리: ${tf.memory().numBytes / 1024 / 1024} MB`);
            
            // 4. Context에 4개 모두 저장!
            setTrainingData(trainTensors.x, trainTensors.y, testTensors.x, testTensors.y);
            navigate(`/session/${sessionId}/training`);
        } else {
            alert("데이터가 너무 적어서 Train/Test로 분할할 수 없습니다. (최소 2장 이상 필요)");
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