import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { Folder, Loader2, Download, Check } from "lucide-react";

import * as tf from "@tensorflow/tfjs";
import { useTrainingData } from "../contexts/TrainingDataContext";
import { useSession } from "../contexts/SessionContext";
import { authFetch } from "../lib/authFetch";

// ─── 레이블 정의 ───────────────────────────────────────────────────────────────
const CHEXPERT_LABELS = [
  "No Finding", "Enlarged Cardiomediastinum", "Cardiomegaly", "Lung Opacity",
  "Lung Lesion", "Edema", "Consolidation", "Pneumonia", "Atelectasis",
  "Pneumothorax", "Pleural Effusion", "Pleural Other", "Fracture", "Support Devices"
];

const DR_LABELS = ["No DR", "Mild", "Moderate", "Severe", "Proliferative"];

// DR 레벨별 색상 (DR_autolabel.html과 동일한 배색)
const DR_LEVEL_COLORS: Record<string, string> = {
  "No DR":         "bg-green-100 text-green-800",
  "Mild":          "bg-cyan-100 text-cyan-800",
  "Moderate":      "bg-yellow-100 text-yellow-800",
  "Severe":        "bg-red-100 text-red-800",
  "Proliferative": "bg-red-200 text-red-900",
};

// ─── 유틸 ───────────────────────────────────────────────────────────────────────
function softmax(arr: number[]): number[] {
  const max = Math.max(...arr);
  const exp = arr.map(x => Math.exp(x - max));
  const sum = exp.reduce((a, b) => a + b, 0);
  return exp.map(x => x / sum);
}

// ─── 타입 ───────────────────────────────────────────────────────────────────────
type ModelType = "chexpert" | "dr";
type ViewMode  = "1x1" | "2x2" | "3x3";

interface LabeledData {
  filename: string;
  imageUrl: string;
  label: string;
  confidence: number;
  fullProbabilities: number[];
  tensor?: tf.Tensor;
}

// ═══════════════════════════════════════════════════════════════════════════════
export function LabelingAutoPage() {
  const { sessionId } = useParams();
  const navigate      = useNavigate();
  const { user }  = useAuth();
  const { setTrainingData } = useTrainingData();
  const { getSession, upsertSession } = useSession();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadedModelTypeRef = useRef<ModelType | null>(null);

  const [step,             setStep]             = useState<"select" | "labeling" | "review">("select");
  const [labelingProgress, setLabelingProgress] = useState(0);
  const [labeledData,      setLabeledData]      = useState<LabeledData[]>([]);
  const [viewMode,         setViewMode]         = useState<ViewMode>("1x1");
  const [currentPage,      setCurrentPage]      = useState(0);
  const [isProcessing,     setIsProcessing]     = useState(false);

  const [model,     setModel]     = useState<tf.GraphModel | tf.LayersModel | null>(null);
  const [modelType, setModelType] = useState<ModelType>("chexpert");
  const [sessionData, setSessionData] = useState<any | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  useEffect(() => {
    const loadSession = async () => {
      setIsSessionLoading(true);
      try {
        const localSession = getSession(sessionId || "");

        try {
          const response = await authFetch(`/sessions/${sessionId}`);
          if (response.ok) {
            const serverSession = await response.json();
            setSessionData(serverSession);
            upsertSession({
              id: String(serverSession.sessionId ?? sessionId ?? ""),
              title: serverSession.title ?? "제목 없음",
              dataType: serverSession.dataFormat ?? "X-ray",
              classNames:
                typeof serverSession.labelClassList === "string" && serverSession.labelClassList.length > 0
                  ? serverSession.labelClassList.split(",").map((item: string) => item.trim())
                  : [],
              algorithm: serverSession.algorithm ?? localSession?.algorithm ?? "FedAvg",
              rounds: serverSession.rounds ?? localSession?.rounds ?? 5,
              createdAt: serverSession.createdAt ?? localSession?.createdAt ?? new Date().toISOString(),
              createdBy: serverSession.createdBy ?? localSession?.createdBy ?? "unknown",
              status:
                serverSession.status === "IN_PROGRESS"
                  ? "running"
                  : serverSession.status === "COMPLETED"
                    ? "completed"
                    : "waiting",
              participants: serverSession.participantCount ?? localSession?.participants ?? 0,
              targetParticipants: serverSession.maxParticipants ?? localSession?.targetParticipants ?? 0,
            });
            return;
          }
        } catch (error) {
          console.warn("세션 상세를 서버에서 불러오지 못했습니다. 로컬 세션으로 계속합니다.", error);
        }

        setSessionData(localSession ?? null);
      } catch (err) {
        console.error("❌ 세션 로드 실패:", err);
      } finally {
        setIsSessionLoading(false);
      }
    };

    loadSession();
  }, [sessionId, getSession, upsertSession]);

  // ─── 모델 로딩: 세션 dataType === "Fundus" → DR, 나머지 → CheXpert ─────────
  useEffect(() => {
    const loadModel = async () => {
      if (isSessionLoading || !sessionData) return;

      try {
        const rawDataType = sessionData?.dataFormat ?? sessionData?.dataType ?? "X-ray";
        const isDR = rawDataType === "Fundus";
        const nextModelType: ModelType = isDR ? "dr" : "chexpert";
        setModelType(nextModelType);

        if (loadedModelTypeRef.current === nextModelType && model) {
          return;
        }

        await tf.setBackend("webgl");
        await tf.ready();

        if (isDR) {
          console.log("⏳ DR 당뇨망막병증 모델 로딩 중...");
          const m = await tf.loadLayersModel("/models/dr_tfjs_manual/model.json");
          setModel(m);
          loadedModelTypeRef.current = "dr";
          console.log("✅ DR 모델 로드 완료!");
        } else {
          console.log("⏳ CheXpert 모델 로딩 중...");
          const m = await tf.loadGraphModel("/models/chexpert_tfjs/model.json");
          setModel(m);
          loadedModelTypeRef.current = "chexpert";
          console.log("✅ CheXpert 모델 로드 완료!");
        }
      } catch (err) {
        console.error("❌ 모델 로드 실패:", err);
      }
    };

    loadModel();
  }, [isSessionLoading, sessionData]);

  if (!user) return null;

  const labels = modelType === "dr" ? DR_LABELS : CHEXPERT_LABELS;

  // ─── 폴더 선택 + 오토라벨링 실행 ─────────────────────────────────────────────
  const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (!model) { alert("AI 모델이 아직 로딩되지 않았습니다."); return; }

    const imageFiles = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      alert("이미지 파일만 업로드할 수 있습니다.");
      return;
    }

    setStep("labeling");
    const results: LabeledData[] = [];

    for (let i = 0; i < imageFiles.length; i++) {
      const file     = imageFiles[i];
      const imageUrl = URL.createObjectURL(file);
      const imgEl    = new Image();
      imgEl.src      = imageUrl;

      try {
        await imgEl.decode();
      } catch {
        URL.revokeObjectURL(imageUrl);
        continue;
      }

      if (modelType === "dr") {
        // ── DR: NHWC [1,224,224,3] → softmax → argmax ────────────────────────
        const input = tf.tidy(() => {
          let img = tf.browser.fromPixels(imgEl) as tf.Tensor3D;
          img = tf.image.resizeBilinear(img, [224, 224]) as tf.Tensor3D;
          img = img.div(255.0) as tf.Tensor3D;
          img = img.sub([0.485, 0.456, 0.406]).div([0.229, 0.224, 0.225]) as tf.Tensor3D;
          return img.expandDims(0); // [1,224,224,3]
        });

        const output = (model as tf.LayersModel).predict(input) as tf.Tensor;
        const logits = Array.from(await output.data());
        input.dispose();
        output.dispose();

        const probs = softmax(logits);
        const level = probs.indexOf(Math.max(...probs));

        results.push({
          filename:         file.name,
          imageUrl,
          label:            DR_LABELS[level],
          confidence:       probs[level],
          fullProbabilities: probs,
        });

      } else {
        // ── CheXpert: NCHW [1,3,320,320] → sigmoid → disease-priority ────────
        const { processedTensor, probabilities } = tf.tidy(() => {
          let img = tf.browser.fromPixels(imgEl) as tf.Tensor3D;
          img = tf.image.resizeBilinear(img, [320, 320]) as tf.Tensor3D;
          img = img.div(255.0) as tf.Tensor3D;
          img = img.sub([0.485, 0.456, 0.406]).div([0.229, 0.224, 0.225]) as tf.Tensor3D;
          img = img.transpose([2, 0, 1]) as tf.Tensor3D;
          const batch  = img.expandDims(0);
          const output = (model as tf.GraphModel).predict(batch) as tf.Tensor;
          const probs  = output.sigmoid();
          return { processedTensor: batch.clone(), probabilities: probs.dataSync() };
        });

        const probsArray = Array.from(probabilities);
        let maxDiseaseScore = -1, maxDiseaseIndex = -1;
        for (let j = 1; j < probsArray.length; j++) {
          if (probsArray[j] > maxDiseaseScore) { maxDiseaseScore = probsArray[j]; maxDiseaseIndex = j; }
        }
        const noFindingScore = probsArray[0];
        const finalLabel = maxDiseaseScore > 0.3
          ? CHEXPERT_LABELS[maxDiseaseIndex]
          : (noFindingScore > maxDiseaseScore ? CHEXPERT_LABELS[0] : CHEXPERT_LABELS[maxDiseaseIndex]);
        const finalScore = maxDiseaseScore > 0.3
          ? maxDiseaseScore
          : (noFindingScore > maxDiseaseScore ? noFindingScore : maxDiseaseScore);

        results.push({
          filename:          file.name,
          imageUrl,
          label:             finalLabel,
          confidence:        finalScore,
          fullProbabilities: probsArray,
          tensor:            processedTensor,
        });
      }

      setLabelingProgress(((i + 1) / imageFiles.length) * 100);
      await tf.nextFrame();
    }

    setLabeledData(results);
    if (results.length === 0) {
      alert("라벨링할 수 있는 이미지를 불러오지 못했습니다.");
      setStep("select");
      return;
    }
    setStep("review");
  };

  // ─── 라벨 수동 수정 ───────────────────────────────────────────────────────────
  const handleUpdateLabel = (index: number, newLabel: string) => {
    const globalIndex = currentPage * imagesPerPage + index;
    const updated = [...labeledData];
    updated[globalIndex] = { ...updated[globalIndex], label: newLabel };
    setLabeledData(updated);
  };

  // ─── CSV 다운로드 ─────────────────────────────────────────────────────────────
  const handleDownloadCSV = () => {
    const header  = modelType === "dr"
      ? ["filename", "label", "level", "confidence", ...DR_LABELS]
      : ["filename", "label", "confidence", ...CHEXPERT_LABELS];

    const rows = labeledData.map(d => {
      const base = [d.filename, d.label, d.confidence.toFixed(4)];
      if (modelType === "dr") {
        base.splice(2, 0, String(DR_LABELS.indexOf(d.label)));
      }
      return [...base, ...d.fullProbabilities.map(p => p.toFixed(4))];
    });

    const csv  = [header, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href  = url;
    link.download = `${modelType}_results_${sessionId}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ─── 학습 데이터 변환 + 연합학습 시작 ────────────────────────────────────────
  const handleStartTraining = async () => {
    setIsProcessing(true);
    try {
      if (labeledData.length === 0) {
        alert("라벨링된 데이터가 없습니다.");
        return;
      }
      const numClasses  = modelType === "dr" ? 5 : 14;
      const xTensors: tf.Tensor[] = [];
      const yLabels:  number[][]  = [];

      for (const data of labeledData) {
        const imgEl = new Image();
        imgEl.src   = data.imageUrl;
        await new Promise(resolve => { imgEl.onload = resolve; });

        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 224;
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.drawImage(imgEl, 0, 0, 224, 224);

        xTensors.push(tf.tidy(() =>
          tf.browser.fromPixels(canvas).toFloat().div(255.0)
        ));

        const row = new Array(numClasses).fill(0);
        const idx = labels.indexOf(data.label);
        if (idx !== -1) row[idx] = 1;
        yLabels.push(row);

        await new Promise(r => setTimeout(r, 10));
      }

      if (xTensors.length > 0) {
        const xAll = tf.stack(xTensors);
        const yAll = tf.tensor2d(yLabels, [yLabels.length, numClasses]);

        if (xTensors.length === 1) {
          setTrainingData(xAll, yAll, xAll.clone(), yAll.clone());
        } else {
          const testCount = Math.max(1, Math.floor(xTensors.length * 0.2));
          const trainCount = xTensors.length - testCount;

          setTrainingData(
            xAll.slice([0, 0, 0, 0], [trainCount, -1, -1, -1]),
            yAll.slice([0, 0], [trainCount, -1]),
            xAll.slice([trainCount, 0, 0, 0], [testCount, -1, -1, -1]),
            yAll.slice([trainCount, 0], [testCount, -1])
          );
        }
        console.log("✅ 학습 데이터 저장 완료:", {
          totalImages: labeledData.length,
          trainShape: xAll.shape,
          labelShape: yAll.shape,
        });
        navigate(`/session/${sessionId}/training`);
      } else {
        alert("학습용 텐서를 생성하지 못했습니다.");
      }
    } catch (err) {
      console.error(err);
      alert("데이터 처리 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  // ─── 페이지네이션 계산 ────────────────────────────────────────────────────────
  const imagesPerPage = viewMode === "1x1" ? 1 : viewMode === "2x2" ? 4 : 9;
  const totalPages    = Math.ceil(labeledData.length / imagesPerPage);
  const currentImages = labeledData.slice(
    currentPage * imagesPerPage,
    (currentPage + 1) * imagesPerPage
  );

  const modelTitle = modelType === "dr"
    ? "👁️ DR 당뇨망막병증 오토라벨링"
    : "🏥 CheXpert 오토라벨링";
  const modelDesc = modelType === "dr"
    ? "DR 모델이 안저 이미지를 5단계(Level 0~4)로 분류합니다."
    : "CheXpert 모델이 X-ray 이미지에서 병변을 탐지합니다.";

  // ─── STEP 1: 폴더 선택 ────────────────────────────────────────────────────────
  if (step === "select") {
    return (
      <div className="min-h-screen py-12 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{modelTitle}</h1>
          <p className="text-gray-500 mb-6">{modelDesc}</p>

          {/* DR 레벨 안내 배지 */}
          {modelType === "dr" && (
            <div className="mb-6 flex flex-wrap gap-2">
              {DR_LABELS.map((label, i) => (
                <span
                  key={i}
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${DR_LEVEL_COLORS[label]}`}
                >
                  Level {i}: {label}
                </span>
              ))}
            </div>
          )}

          <div style={{ border: "2px dashed #ccc", padding: "40px", textAlign: "center", borderRadius: "10px", marginBottom: "20px", backgroundColor: "#fff" }}>
            <Folder style={{ width: "64px", height: "64px", margin: "0 auto 16px", color: "#FF9500" }} />
            <h3 className="text-xl font-semibold mb-2">데이터 폴더 선택</h3>
            <p className="text-gray-600 mb-6">
              {modelType === "dr" ? "안저(Fundus) 이미지" : "X-ray 이미지"}가 들어있는 폴더를 선택하세요.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFolderSelect}
              style={{ display: "none" }}
              // @ts-ignore
              webkitdirectory="" directory=""
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={!model}
              style={{
                backgroundColor: model ? "#FF9500" : "#ccc",
                color: "white", padding: "15px 30px", fontSize: "18px",
                border: "none", borderRadius: "8px",
                cursor: model ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto", fontWeight: "bold",
              }}
            >
              {model
                && !isSessionLoading
                ? <><Folder style={{ width: "24px", height: "24px", marginRight: "10px" }} />폴더 업로드 및 분석 시작</>
                : <><Loader2 style={{ width: "24px", height: "24px", marginRight: "10px" }} className="animate-spin" />세션/모델 로딩 중...</>
              }
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── STEP 2: 라벨링 진행 ─────────────────────────────────────────────────────
  if (step === "labeling") {
    return (
      <div className="min-h-screen py-12 px-4 bg-white flex items-center justify-center">
        <div className="max-w-xl w-full text-center">
          <Loader2 className="w-16 h-16 mx-auto mb-4 text-orange-500 animate-spin" />
          <h3 className="text-xl font-bold mb-2">AI가 이미지를 분석 중입니다</h3>
          <p className="text-gray-600 mb-8">
            {modelType === "dr"
              ? "DR 모델이 당뇨망막병증 단계를 판별하고 있습니다..."
              : "CheXpert 모델이 병변을 찾고 있습니다..."}
          </p>
          <Progress value={labelingProgress} className="h-3 mb-4" />
          <p className="text-sm font-medium text-gray-700">{Math.round(labelingProgress)}% 완료</p>
        </div>
      </div>
    );
  }

  // ─── STEP 3: 검수 ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen py-12 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">

        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">라벨링 결과 검수</h1>
            <p className="text-gray-600 mt-1">
              총 <span className="font-bold text-[#FF9500]">{labeledData.length}</span>장 분석 완료.
              잘못된 라벨은 수정하세요.
            </p>
          </div>
          <div className="flex gap-2 bg-white p-1 rounded-lg border">
            {(["1x1", "2x2", "3x3"] as ViewMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => { setViewMode(mode); setCurrentPage(0); }}
                style={{
                  padding: "5px 10px", borderRadius: "4px",
                  backgroundColor: viewMode === mode ? "#f3f4f6" : "transparent",
                  fontWeight: viewMode === mode ? "bold" : "normal",
                  border: "none", cursor: "pointer",
                }}
              >{mode}</button>
            ))}
          </div>
        </div>

        {/* 이미지 그리드 */}
        <div className={`grid gap-6 mb-8 ${
          viewMode === "1x1" ? "grid-cols-1 max-w-2xl mx-auto"
          : viewMode === "2x2" ? "grid-cols-2"
          : "grid-cols-3"
        }`}>
          {currentImages.map((data, index) => (
            <Card key={index} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-square bg-black relative group">
                <img src={data.imageUrl} alt={data.filename} className="w-full h-full object-contain" />
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-white text-xs truncate opacity-0 group-hover:opacity-100 transition-opacity">
                  {data.filename}
                </div>
              </div>

              <div className="p-4">
                {modelType === "dr" ? (
                  // ── DR 카드 내용 ────────────────────────────────────────────
                  <div className="space-y-2">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${DR_LEVEL_COLORS[data.label] ?? ""}`}>
                      Level {DR_LABELS.indexOf(data.label)}: {data.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <select
                        value={data.label}
                        onChange={e => handleUpdateLabel(index, e.target.value)}
                        className="text-sm border rounded px-2 py-1 bg-white text-gray-800 cursor-pointer focus:ring-2 focus:ring-orange-500 outline-none w-full"
                      >
                        {DR_LABELS.map((label, i) => (
                          <option key={label} value={label}>Level {i}: {label}</option>
                        ))}
                      </select>
                      <span className="text-xs font-bold text-gray-500 whitespace-nowrap">
                        {(data.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    {/* 5단계 확률 막대 */}
                    <div className="space-y-1 pt-1">
                      {DR_LABELS.map((label, i) => (
                        <div key={label} className="flex items-center gap-2 text-xs">
                          <span className="w-20 truncate text-gray-500">Lv{i} {label}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full bg-orange-400 transition-all"
                              style={{ width: `${(data.fullProbabilities[i] ?? 0) * 100}%` }}
                            />
                          </div>
                          <span className="text-gray-400 w-7 text-right">
                            {((data.fullProbabilities[i] ?? 0) * 100).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  // ── CheXpert 카드 내용 (기존과 동일) ─────────────────────────
                  <div className="flex items-center justify-between">
                    <select
                      value={data.label}
                      onChange={e => handleUpdateLabel(index, e.target.value)}
                      className="text-sm border rounded px-2 py-1 bg-white text-gray-800 cursor-pointer focus:ring-2 focus:ring-orange-500 outline-none w-full mr-2"
                    >
                      {CHEXPERT_LABELS.map(label => (
                        <option key={label} value={label}>{label}</option>
                      ))}
                    </select>
                    <span className="text-xs font-bold text-gray-500 whitespace-nowrap">
                      {(data.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mb-8">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              style={{ padding: "8px 16px", border: "1px solid #ccc", borderRadius: "4px", background: "white" }}
            >이전</button>
            <span className="text-sm font-medium text-gray-700">{currentPage + 1} / {totalPages}</span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage === totalPages - 1}
              style={{ padding: "8px 16px", border: "1px solid #ccc", borderRadius: "4px", background: "white" }}
            >다음</button>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="flex gap-4 justify-center pb-12">
          <button
            onClick={handleDownloadCSV}
            style={{ padding: "15px 30px", border: "1px solid #ccc", borderRadius: "8px", background: "white", display: "flex", alignItems: "center", cursor: "pointer", fontSize: "16px" }}
          >
            <Download className="w-5 h-5 mr-2" /> CSV 결과 저장
          </button>
          <button
            onClick={handleStartTraining}
            disabled={isProcessing}
            style={{ padding: "15px 30px", borderRadius: "8px", background: "#6B3131", color: "white", border: "none", display: "flex", alignItems: "center", cursor: "pointer", fontSize: "16px", fontWeight: "bold" }}
          >
            {isProcessing
              ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />변환 중...</>
              : <><Check className="w-5 h-5 mr-2" />검수 완료 및 연합학습 시작</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
