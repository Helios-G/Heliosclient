import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Upload,
  FileUp,
  Activity,
  CheckCircle2,
  FileJson,
  FileDigit,
  Image as ImageIcon,
  AlertCircle,
  Loader2,
  Play,
  Eye
} from "lucide-react";
import * as tf from "@tensorflow/tfjs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

type ModelKind = "chexpert" | "dr";

interface ModelConfig {
  label: string;
  description: string;
  modality: string;
  loader: "graph" | "layers";
  inputSize: number;
  layout: "nchw" | "nhwc";
  classes: string[];
  baselineClass: string; // 정상/Negative 클래스 — heatmap 대상에서 제외
  preprocess: (img: tf.Tensor3D) => tf.Tensor;
  // model.predict 결과 → 확률값 ([0,1] 범위). 모델이 이미 softmax/sigmoid 적용되어 있으면 identity.
  toProbs: (raw: tf.Tensor) => tf.Tensor;
}

const MODEL_CONFIGS: Record<ModelKind, ModelConfig> = {
  chexpert: {
    label: "CheXpert (흉부 X-ray)",
    description: "14개 흉부 소견 다중 라벨 분류",
    modality: "흉부 X-ray",
    loader: "graph",
    inputSize: 320,
    layout: "nchw",
    classes: [
      "No Finding", "Enlarged Cardiomediastinum", "Cardiomegaly", "Lung Opacity",
      "Lung Lesion", "Edema", "Consolidation", "Pneumonia", "Atelectasis",
      "Pneumothorax", "Pleural Effusion", "Pleural Other", "Fracture", "Support Devices"
    ],
    baselineClass: "No Finding",
    preprocess: (img) => tf.tidy(() => {
      const resized = tf.image.resizeBilinear(img, [320, 320]).div(255.0);
      const mean = tf.tensor([0.485, 0.456, 0.406]);
      const std = tf.tensor([0.229, 0.224, 0.225]);
      const norm = (resized.sub(mean) as tf.Tensor3D).div(std) as tf.Tensor3D;
      return norm.transpose([2, 0, 1]).expandDims(0); // [1, 3, 320, 320]
    }),
    toProbs: (raw) => raw.sigmoid(),
  },
  dr: {
    label: "DR (망막 fundus)",
    description: "당뇨 망막병증 5단계 분류 (No_DR ~ Proliferate_DR)",
    modality: "망막 fundus",
    loader: "layers",
    inputSize: 224,
    layout: "nhwc",
    classes: ["No_DR", "Mild", "Moderate", "Severe", "Proliferate_DR"],
    baselineClass: "No_DR",
    preprocess: (img) => tf.tidy(() => {
      const resized = tf.image.resizeBilinear(img, [224, 224]);
      // InceptionV3 preprocess_input: (x/127.5) - 1 → [-1, 1]
      const norm = resized.div(127.5).sub(1.0);
      return norm.expandDims(0); // [1, 224, 224, 3]
    }),
    toProbs: (raw) => raw, // 모델 마지막 Dense에 softmax 포함
  },
};

// JET colormap (cv2.applyColorMap(..., COLORMAP_JET) 근사)
function jetColor(v: number): [number, number, number] {
  const x = Math.max(0, Math.min(1, v));
  const four = 4 * x;
  const r = Math.max(0, Math.min(1, Math.min(four - 1.5, -four + 4.5)));
  const g = Math.max(0, Math.min(1, Math.min(four - 0.5, -four + 3.5)));
  const b = Math.max(0, Math.min(1, Math.min(four + 0.5, -four + 2.5)));
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// gradcam.py 의 gradcam(): 대상 클래스 score 에 대한 그래디언트로부터 saliency map 생성
// GraphModel 등 중간 conv 출력 접근이 까다로워 입력 기준 그래디언트 사용 (vanilla-gradient saliency)
async function computeSaliencyMap(
  model: tf.LayersModel | tf.GraphModel,
  inputTensor: tf.Tensor,
  classIdx: number,
  layout: "nchw" | "nhwc",
  toProbs: (raw: tf.Tensor) => tf.Tensor
): Promise<number[][]> {
  const gradFn = tf.grad((x: tf.Tensor) => {
    const raw = model.predict(x) as tf.Tensor;
    const probs = toProbs(raw);
    return probs.flatten().gather(tf.tensor1d([classIdx], "int32")).sum() as tf.Scalar;
  });

  const grads = gradFn(inputTensor); // NCHW: [1,3,H,W] | NHWC: [1,H,W,3]
  const channelAxis = layout === "nchw" ? 1 : 3;

  const saliency2D = tf.tidy(() => {
    const absGrads = grads.abs();
    const reduced = absGrads.max(channelAxis).squeeze() as tf.Tensor2D;
    const minV = reduced.min();
    const maxV = reduced.max();
    return reduced.sub(minV).div(maxV.sub(minV).add(1e-8)) as tf.Tensor2D;
  });

  grads.dispose();
  const arr = (await saliency2D.array()) as number[][];
  saliency2D.dispose();
  return arr;
}

// gradcam.py 의 overlay() + pseudo-mask 시각화를 canvas 로 포팅
// canvas 는 내부에서 생성 (외부 ref 의존성 제거 → 2-click 버그 방지)
function renderHeatmapOverlay(
  imgEl: HTMLImageElement,
  saliency: number[][],
  alpha: number = 0.4,
  threshold: number = 0.5
): { overlayURL: string; maskedURL: string } {
  const canvas = document.createElement("canvas");
  const w = imgEl.naturalWidth || imgEl.width;
  const h = imgEl.naturalHeight || imgEl.height;
  const sH = saliency.length;
  const sW = saliency[0].length;

  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(imgEl, 0, 0, w, h);
  const baseImage = ctx.getImageData(0, 0, w, h);

  const overlayData = ctx.createImageData(w, h);
  const maskedData = ctx.createImageData(w, h);

  for (let y = 0; y < h; y++) {
    const sy = Math.min(sH - 1, Math.floor((y * sH) / h));
    for (let x = 0; x < w; x++) {
      const sx = Math.min(sW - 1, Math.floor((x * sW) / w));
      const v = saliency[sy][sx];
      const [hr, hg, hb] = jetColor(v);
      const i = (y * w + x) * 4;

      const br = baseImage.data[i];
      const bg = baseImage.data[i + 1];
      const bb = baseImage.data[i + 2];

      overlayData.data[i] = Math.round((1 - alpha) * br + alpha * hr);
      overlayData.data[i + 1] = Math.round((1 - alpha) * bg + alpha * hg);
      overlayData.data[i + 2] = Math.round((1 - alpha) * bb + alpha * hb);
      overlayData.data[i + 3] = 255;

      const keep = v >= threshold;
      const dim = keep ? 1.0 : 0.25;
      maskedData.data[i] = Math.round(br * dim);
      maskedData.data[i + 1] = Math.round(bg * dim);
      maskedData.data[i + 2] = Math.round(bb * dim);
      maskedData.data[i + 3] = 255;
    }
  }

  ctx.putImageData(overlayData, 0, 0);
  const overlayURL = canvas.toDataURL("image/png");

  ctx.putImageData(maskedData, 0, 0);
  const maskedURL = canvas.toDataURL("image/png");

  return { overlayURL, maskedURL };
}

export function ModelInferencePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [modelKind, setModelKind] = useState<ModelKind>("chexpert");
  const [model, setModel] = useState<tf.LayersModel | tf.GraphModel | null>(null);
  const [imageURL, setImageURL] = useState<string | null>(null);
  const [results, setResults] = useState<{ name: string; score: number }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // UI용 상태
  const [modelFileNames, setModelFileNames] = useState<string[]>([]);
  const [imageFileName, setImageFileName] = useState<string>("");

  // Grad-CAM heatmap 상태
  const [heatmapOverlayURL, setHeatmapOverlayURL] = useState<string | null>(null);
  const [heatmapMaskedURL, setHeatmapMaskedURL] = useState<string | null>(null);
  const [heatmapTargetClass, setHeatmapTargetClass] = useState<string>("");

  // Input Refs (숨겨진 input을 클릭하기 위함)
  const modelInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const imageElementRef = useRef<HTMLImageElement>(null);

  const cfg = MODEL_CONFIGS[modelKind];

  const resetResults = () => {
    setResults([]);
    setHeatmapOverlayURL(null);
    setHeatmapMaskedURL(null);
    setHeatmapTargetClass("");
  };

  const switchModelKind = (next: ModelKind) => {
    if (next === modelKind) return;
    setModelKind(next);
    if (model) {
      try { (model as any).dispose?.(); } catch { /* noop */ }
    }
    setModel(null);
    setModelFileNames([]);
    resetResults();
  };

  useEffect(() => {
    if (!user) {
      alert("로그인이 필요한 서비스입니다.");
      navigate("/login");
    }
  }, [user, navigate]);

  if (!user) return null;

  // 1. 모델 파일 선택 핸들러
  const handleModelFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length < 2) {
      alert("모델 파일(.json)과 가중치 파일(.bin)들을 모두 선택해주세요!");
      return;
    }

    try {
      setIsProcessing(true);

      // 1. 파일 목록을 배열로 변환
      const rawFiles = Array.from(fileList);

      // 2. model.json 찾기
      const jsonFile = rawFiles.find(f => f.name.endsWith('.json') && !f.name.startsWith('.'));
      
      // 3. .bin 파일들 찾기
      const binFiles = rawFiles.filter(f => f.name.endsWith('.bin') && !f.name.startsWith('.'));

      if (!jsonFile) {
        throw new Error("model.json 파일이 선택되지 않았습니다.");
      }

      if (binFiles.length === 0) {
        throw new Error("가중치 파일(.bin)이 선택되지 않았습니다.");
      }

      // 🔍 [디버깅] JSON 파일 내용 검증
      const jsonText = await jsonFile.text();
      try {
        JSON.parse(jsonText);
        console.log("✅ model.json 파싱 테스트 통과");
      } catch (e) {
        throw new Error("model.json 파일이 손상되었습니다.");
      }

      // ✅ [핵심 수정] 파일 순서 강제 정렬 (json을 무조건 맨 앞으로!)
      // TF.js는 첫 번째 파일을 모델 구조로 인식할 확률이 높습니다.
      const sortedFiles = [jsonFile, ...binFiles];

      console.log("📂 로드할 파일 순서:", sortedFiles.map(f => f.name));
      setModelFileNames(sortedFiles.map(f => f.name));

      // 4. 모델 로드 (cfg.loader 에 따라 분기)
      const loadedModel = cfg.loader === "graph"
        ? await tf.loadGraphModel(tf.io.browserFiles(sortedFiles))
        : await tf.loadLayersModel(tf.io.browserFiles(sortedFiles));

      setModel(loadedModel);
      resetResults();
      console.log("🎉 모델 로드 최종 성공!", { kind: modelKind, loader: cfg.loader });

    } catch (err: any) {
      console.error(err);
      alert(`모델 로드 실패:\n${err.message}`);
      setModelFileNames([]); 
      setModel(null);
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. 이미지 파일 선택 핸들러
  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageURL(url);
      setImageFileName(file.name);
      resetResults();
    }
  };

  // 3. 진단 실행
  const runInference = async () => {
    if (!model || !imageElementRef.current) return;

    setIsProcessing(true);

    try {
      const imgEl = imageElementRef.current;

      // 이미지 디코딩 대기 (naturalWidth 보장 위해 await 강제)
      await imgEl.decode().catch(() => {});

      // cfg 의 전처리 사용 (모델 종류에 따른 분기)
      const rawImg = tf.tidy(() => tf.browser.fromPixels(imgEl) as tf.Tensor3D);
      const tensor = cfg.preprocess(rawImg);
      rawImg.dispose();

      // 추론
      const prediction = model.predict(tensor) as tf.Tensor;
      const probsTensor = cfg.toProbs(prediction);
      const probs = await probsTensor.data();
      if (probsTensor !== prediction) probsTensor.dispose();
      prediction.dispose();

      const probsArr = Array.from(probs);
      const chartData = probsArr
        .map((score, i) => ({ name: cfg.classes[i] ?? `class_${i}`, score: score * 100 }))
        .sort((a, b) => b.score - a.score);

      setResults(chartData);

      // Grad-CAM 스타일 heatmap: 가장 높은 확률 클래스(baselineClass 제외)에 대해 생성
      try {
        const topAbnormal = probsArr
          .map((score, i) => ({ score, i }))
          .filter(({ i }) => cfg.classes[i] !== cfg.baselineClass)
          .sort((a, b) => b.score - a.score)[0];

        if (topAbnormal && imageElementRef.current) {
          const saliency = await computeSaliencyMap(
            model,
            tensor,
            topAbnormal.i,
            cfg.layout,
            cfg.toProbs
          );
          const { overlayURL, maskedURL } = renderHeatmapOverlay(
            imageElementRef.current,
            saliency,
            0.45,
            0.5
          );
          setHeatmapOverlayURL(overlayURL);
          setHeatmapMaskedURL(maskedURL);
          setHeatmapTargetClass(cfg.classes[topAbnormal.i]);
        }
      } catch (camErr) {
        console.warn("Heatmap 생성 실패:", camErr);
        setHeatmapOverlayURL(null);
        setHeatmapMaskedURL(null);
      }

      tf.dispose(tensor);

    } catch (err) {
      console.error(err);
      alert("진단 중 오류가 발생했습니다. 콘솔 로그를 확인해주세요.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI 진단실 (Playground)</h1>
          <p className="text-gray-600">
            학습된 모델을 업로드하고, 실제 {cfg.modality} 이미지를 넣어 성능을 테스트해보세요.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* [왼쪽] 설정 패널 */}
          <div className="lg:col-span-1 space-y-6">

            {/* 0. 모델 종류 선택 */}
            <Card className="p-6 border-2 border-gray-200">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-gray-800">
                <Activity className="w-5 h-5 text-purple-600" />
                모델 종류
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                업로드할 모델의 종류를 선택하세요. 전처리 및 클래스가 자동으로 매핑됩니다.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(MODEL_CONFIGS) as ModelKind[]).map((kind) => {
                  const c = MODEL_CONFIGS[kind];
                  const active = kind === modelKind;
                  return (
                    <button
                      key={kind}
                      type="button"
                      onClick={() => switchModelKind(kind)}
                      disabled={isProcessing}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        active
                          ? "border-orange-400 bg-orange-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      } ${isProcessing ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <div className={`text-sm font-bold ${active ? "text-orange-700" : "text-gray-700"}`}>
                        {c.label}
                      </div>
                      <div className="text-[11px] text-gray-500 mt-1 leading-tight">
                        {c.description}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1">
                        {c.inputSize}×{c.inputSize} · {c.layout.toUpperCase()} · {c.classes.length}-class
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* 1. 모델 업로드 카드 */}
            <Card className={`p-6 border-2 transition-colors ${model ? 'border-green-200 bg-green-50' : 'border-dashed border-gray-300'}`}>
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-800">
                <FileJson className="w-5 h-5 text-orange-600" /> 
                1. 모델 로드
              </h3>
              
              {/* 숨겨진 Input */}
              <input
                ref={modelInputRef}
                type="file"
                multiple
                accept=".json,.bin"
                onChange={handleModelFileSelect}
                className="hidden"
              />

              {model ? (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-green-700 font-bold mb-2">
                    <CheckCircle2 className="w-6 h-6" />
                    <span>모델 장착 완료!</span>
                  </div>
                  
                  <div className="bg-white p-3 rounded border border-green-200 mb-4 text-left">
                    {modelFileNames.map((name, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                        {name.endsWith('.json') ? <FileJson className="w-3 h-3 text-blue-500"/> : <FileDigit className="w-3 h-3 text-green-500"/>}
                        <span className="truncate">{name}</span>
                      </div>
                    ))}
                  </div>

                  <Button 
                    variant="outline" 
                    onClick={() => modelInputRef.current?.click()}
                    className="text-xs h-8 border-green-300 text-green-700 hover:bg-green-100"
                  >
                    다른 모델로 변경
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-4">
                    다운로드 받은 <strong>.json</strong>과 <strong>.bin</strong> 파일을<br/>
                    <strong>동시에</strong> 선택해주세요.
                  </p>
                  <Button 
                    onClick={() => modelInputRef.current?.click()}
                    className="w-full bg-white border-2 border-orange-200 text-orange-700 hover:bg-orange-50 hover:border-orange-300"
                  >
                    <FileUp className="w-4 h-4 mr-2" />
                    모델 파일 선택하기
                  </Button>
                </div>
              )}
            </Card>

            {/* 2. 이미지 업로드 카드 */}
            <Card className="p-6 border-2 border-gray-200">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-800">
                <ImageIcon className="w-5 h-5 text-blue-600" />
                2. {cfg.modality} 업로드
              </h3>
              
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageFileSelect}
                className="hidden"
              />

              {imageURL ? (
                <div className="space-y-4">
                  <div className="border rounded-lg overflow-hidden bg-black">
                    <img
                      ref={imageElementRef}
                      src={imageURL}
                      alt={`${cfg.modality} Preview`}
                      className="w-full h-auto object-contain max-h-[250px]"
                    />
                  </div>
                  <p className="text-xs text-center text-gray-500 truncate">{imageFileName}</p>
                  <Button 
                    variant="outline" 
                    onClick={() => imageInputRef.current?.click()}
                    className="w-full"
                  >
                    다른 이미지 선택
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <p className="text-sm text-gray-500 mb-4">진단할 {cfg.modality} 이미지를 올려주세요</p>
                  <Button onClick={() => imageInputRef.current?.click()} variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    이미지 선택
                  </Button>
                </div>
              )}
            </Card>

            {/* 3. 진단 시작 버튼 */}
            <Button 
              onClick={runInference}
              disabled={!model || !imageURL || isProcessing}
              className="w-full py-6 text-lg font-bold shadow-lg transition-all hover:scale-[1.02]"
              style={{ 
                backgroundColor: model && imageURL ? '#6B3131' : '#E5E7EB',
                color: model && imageURL ? 'white' : '#9CA3AF',
                cursor: model && imageURL ? 'pointer' : 'not-allowed'
              }}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  분석 중...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2 fill-current" />
                  AI 진단 시작
                </>
              )}
            </Button>
          </div>

          {/* [오른쪽] 결과 패널 (수정됨) */}
          <div className="lg:col-span-2">
            {/* ✅ h-full 제거하여 무한 확장 방지 */}
            <Card className="p-8 border-2 shadow-sm">
              <h3 className="font-bold text-xl mb-6 flex items-center gap-2 text-gray-800">
                <Activity className="w-6 h-6 text-green-600" /> 
                진단 결과 리포트
              </h3>

              {results.length > 0 ? (
                <div className="w-full animate-in fade-in duration-500">
                  
                  {/* ✅ 차트 영역에 고정 높이 부여 (400px) */}
                  <div className="h-[400px] w-full mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={results}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" domain={[0, 100]} unit="%" />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={150} 
                          tick={{fontSize: 12, fontWeight: 'bold'}}
                        />
                        <Tooltip 
                          formatter={(value: number) => [`${value.toFixed(2)}%`, '확률']}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Bar dataKey="score" barSize={20} radius={[0, 4, 4, 0]}>
                          {results.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.score > 50 ? "#ef4444" : "#3b82f6"} 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* 텍스트 결과 */}
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-orange-500" />
                      AI 소견:
                    </h4>
                    <p className="text-gray-700">
                      가장 높은 확률로 <strong className="text-red-600">{results[0].name} ({results[0].score.toFixed(1)}%)</strong> 소견이 의심됩니다.
                      {results[0].score < 50 && " (확률이 낮아 정상일 가능성이 높습니다.)"}
                    </p>
                  </div>

                  {/* Grad-CAM 시각화: 모델 주목 영역 */}
                  {(heatmapOverlayURL || heatmapMaskedURL) && (
                    <div className="mt-6 p-4 bg-white rounded-lg border-2 border-orange-100">
                      <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <Eye className="w-5 h-5 text-orange-600" />
                        모델이 주목한 영역
                        {heatmapTargetClass && (
                          <span className="ml-2 text-sm font-normal text-gray-500">
                            (대상 소견: <strong className="text-red-600">{heatmapTargetClass}</strong>)
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-gray-500 mb-4">
                        Grad-CAM 기반 saliency map — 빨간색에 가까울수록 모델이 해당 진단을 내릴 때 강하게 참고한 영역입니다.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {imageURL && (
                          <div className="text-center">
                            <div className="border rounded-lg overflow-hidden bg-black">
                              <img
                                src={imageURL}
                                alt="원본"
                                className="w-full h-auto object-contain max-h-[260px]"
                              />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">원본</p>
                          </div>
                        )}
                        {heatmapOverlayURL && (
                          <div className="text-center">
                            <div className="border rounded-lg overflow-hidden bg-black">
                              <img
                                src={heatmapOverlayURL}
                                alt="Grad-CAM 오버레이"
                                className="w-full h-auto object-contain max-h-[260px]"
                              />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">Heatmap 오버레이</p>
                          </div>
                        )}
                        {heatmapMaskedURL && (
                          <div className="text-center">
                            <div className="border rounded-lg overflow-hidden bg-black">
                              <img
                                src={heatmapMaskedURL}
                                alt="주목 영역 마스킹"
                                className="w-full h-auto object-contain max-h-[260px]"
                              />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">주목 영역만 강조</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div className="h-[400px] flex flex-col items-center justify-center text-gray-400 border-2 border-dashed rounded-lg bg-gray-50">
                  <Activity className="w-16 h-16 mb-4 opacity-20" />
                  <p>모델과 이미지를 업로드하고 진단을 시작하세요.</p>
                </div>
              )}
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}