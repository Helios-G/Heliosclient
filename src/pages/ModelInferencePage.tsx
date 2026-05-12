import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { 
  Upload,
  Activity, 
  CheckCircle2, 
  Image as ImageIcon,
  AlertCircle,
  Loader2,
  Play,
  Cpu,
  RefreshCw,
  FileText
} from "lucide-react";
import * as tf from "@tensorflow/tfjs";
import { ensureGpuBackend } from "../lib/tfBackend";
import {
  PLAYGROUND_MODELS,
  getPlaygroundModelById,
  type PlaygroundModelSpec,
} from "../data/playgroundModels";
import { savePlaygroundReport } from "../lib/playgroundReport";
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

export function ModelInferencePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { hospital } = useAuth();
  const [selectedModelId, setSelectedModelId] = useState(() => getPlaygroundModelById(searchParams.get("model")).id);
  const [model, setModel] = useState<tf.LayersModel | tf.GraphModel | null>(null);
  const [imageURL, setImageURL] = useState<string | null>(null);
  const [results, setResults] = useState<{ name: string; score: number }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [loadedModelId, setLoadedModelId] = useState<string | null>(null);
  const [backendName, setBackendName] = useState<string>("");
  const [modelLoadError, setModelLoadError] = useState<string | null>(null);
  const [reportReady, setReportReady] = useState(false);
  
  // UI용 상태
  const [imageFileName, setImageFileName] = useState<string>("");

  const imageInputRef = useRef<HTMLInputElement>(null);
  const imageElementRef = useRef<HTMLImageElement>(null);
  const selectedModel = getPlaygroundModelById(selectedModelId);

  useEffect(() => {
    if (!hospital) {
      alert("로그인이 필요한 서비스입니다.");
      navigate("/login");
    }
  }, [hospital, navigate]);

  useEffect(() => {
    setSearchParams({ model: selectedModelId }, { replace: true });
  }, [selectedModelId, setSearchParams]);

  useEffect(() => {
    let cancelled = false;

    const loadSelectedModel = async () => {
      try {
        setIsModelLoading(true);
        setModelLoadError(null);
        setLoadedModelId(null);
        setResults([]);

        await ensureGpuBackend();
        const activeBackend = tf.getBackend();
        if (!cancelled) {
          setBackendName(activeBackend);
        }

        const loadedModel =
          selectedModel.loadType === "graph"
            ? await tf.loadGraphModel(selectedModel.modelPath)
            : await tf.loadLayersModel(selectedModel.modelPath);

        if (cancelled) {
          loadedModel.dispose();
          return;
        }

        setModel((previousModel) => {
          previousModel?.dispose();
          return loadedModel;
        });
        setLoadedModelId(selectedModel.id);
        console.log(`✅ 진단실 모델 로드 완료: ${selectedModel.title}`);
      } catch (error) {
        console.error("❌ 진단실 모델 로드 실패:", error);
        if (!cancelled) {
          setModel(null);
          setLoadedModelId(null);
          setModelLoadError("선택한 모델을 자동으로 불러오지 못했습니다.");
        }
      } finally {
        if (!cancelled) {
          setIsModelLoading(false);
        }
      }
    };

    loadSelectedModel();

    return () => {
      cancelled = true;
    };
  }, [selectedModel]);

  useEffect(() => {
    return () => {
      setModel((previousModel) => {
        previousModel?.dispose();
        return null;
      });
    };
  }, []);

  if (!hospital) return null;

  const handleModelSelect = (modelId: string) => {
    if (modelId === selectedModelId) {
      return;
    }
    setSelectedModelId(modelId);
    setModel((previousModel) => {
      previousModel?.dispose();
      return null;
    });
    setLoadedModelId(null);
    setResults([]);
    setReportReady(false);
  };

  // 2. 이미지 파일 선택 핸들러
  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setImageURL(reader.result);
          setImageFileName(file.name);
          setResults([]);
          setReportReady(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const buildChexpertResults = (prediction: tf.Tensor) => {
    const probs = Array.from(prediction.sigmoid().dataSync());
    return probs
      .map((score, index) => ({
        name: selectedModel.classes[index],
        score: score * 100,
      }))
      .sort((a, b) => b.score - a.score);
  };

  const buildDrResults = async (prediction: tf.Tensor) => {
    const logits = Array.from(await prediction.data());
    const maxLogit = Math.max(...logits);
    const expValues = logits.map((value) => Math.exp(value - maxLogit));
    const sum = expValues.reduce((acc, value) => acc + value, 0);

    return expValues
      .map((value, index) => ({
        name: selectedModel.classes[index],
        score: (value / sum) * 100,
      }))
      .sort((a, b) => b.score - a.score);
  };

  const buildReportDraft = (nextResults: { name: string; score: number }[], modelSpec: PlaygroundModelSpec) => {
    const generatedAt = new Date().toLocaleString("ko-KR");
    const top1 = nextResults[0];
    const top2 = nextResults[1];
    const top3 = nextResults[2];

    const recommendation =
      modelSpec.inferenceProfile === "chexpert-xray"
        ? "영상의학과 판독과 임상 증상, 과거 영상과의 비교를 통해 최종 판단하시기 바랍니다."
        : "안과 전문의 판독과 안저 소견, 환자 병력 정보를 함께 검토하시기 바랍니다.";

    return {
      generatedAt,
      draft: [
        "[AI 진단 리포트 초안]",
        `작성 시각: ${generatedAt}`,
        `사용 모델: ${modelSpec.title}`,
        `대상 도메인: ${modelSpec.domainLabel}`,
        "",
        "1. 요약",
        `- AI 분석 결과 가장 높은 가능성은 ${top1?.name ?? "-"} (${top1?.score.toFixed(1) ?? "0.0"}%) 입니다.`,
        top2 ? `- 다음 후보는 ${top2.name} (${top2.score.toFixed(1)}%) 입니다.` : "- 추가 후보 없음",
        top3 ? `- 세 번째 후보는 ${top3.name} (${top3.score.toFixed(1)}%) 입니다.` : "- 세 번째 후보 없음",
        "",
        "2. AI 소견",
        `- 입력 영상은 ${modelSpec.domainLabel} 기준으로 분석되었습니다.`,
        `- 상위 예측 클래스는 ${top1?.name ?? "-"}이며, 확률은 ${top1?.score.toFixed(1) ?? "0.0"}%입니다.`,
        "- 결과는 보조 참고용이며 단독으로 확정 진단에 사용하면 안 됩니다.",
        "",
        "3. 권장 확인 사항",
        `- ${recommendation}`,
        "- 환자 증상, 검사실 수치, 기존 검사 기록과 함께 종합 해석이 필요합니다.",
        "- 필요 시 추가 촬영 또는 전문 진료 연계를 고려하십시오.",
        "",
        "4. 주의",
        "- 본 문서는 프론트엔드에서 자동 생성된 초안입니다.",
        "- 최종 의료 판단과 공식 기록은 의료진이 확정해야 합니다.",
      ].join("\n"),
    };
  };

  // 3. 진단 실행
  const runInference = async () => {
    if (!model || !imageElementRef.current) return;

    setIsProcessing(true);
    
    try {
      const imgEl = imageElementRef.current;

      // 이미지 디코딩 대기
      if (imgEl.complete) {
          await imgEl.decode().catch(() => {});
      }

      // ✅ [핵심 수정] 전처리 로직을 모델 스펙(CheXpert)에 맞춤
      const tensor = tf.tidy(() => {
        let img = tf.browser.fromPixels(imgEl);

        if (selectedModel.inferenceProfile === "chexpert-xray") {
          img = tf.image.resizeBilinear(img, [320, 320]);
          img = img.div(255.0);
          img = img.sub([0.485, 0.456, 0.406]).div([0.229, 0.224, 0.225]);
          img = img.transpose([2, 0, 1]);
          return img.expandDims(0);
        }

        img = tf.image.resizeBilinear(img, [224, 224]);
        img = img.div(255.0);
        img = img.sub([0.485, 0.456, 0.406]).div([0.229, 0.224, 0.225]);
        return img.expandDims(0);
      });

      const prediction = model.predict(tensor) as tf.Tensor;
      const chartData =
        selectedModel.inferenceProfile === "chexpert-xray"
          ? buildChexpertResults(prediction)
          : await buildDrResults(prediction);

      setResults(chartData);
      const report = buildReportDraft(chartData, selectedModel);
      if (imageURL) {
        savePlaygroundReport({
          generatedAt: report.generatedAt,
          modelId: selectedModel.id,
          modelTitle: selectedModel.title,
          domainLabel: selectedModel.domainLabel,
          imageUrl: imageURL,
          imageFileName,
          results: chartData,
          draft: report.draft,
        });
      }
      setReportReady(true);
      prediction.dispose();
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
            모델 파일을 따로 관리하지 않아도, 필요한 모델을 고르면 자동으로 불러와 바로 테스트할 수 있습니다.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* [왼쪽] 설정 패널 */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* 1. 모델 선택 카드 */}
            <Card className={`p-6 border-2 transition-colors ${model ? 'border-green-200 bg-green-50' : 'border-dashed border-gray-300'}`}>
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-800">
                <Cpu className="w-5 h-5 text-orange-600" />
                1. 모델 선택
              </h3>

              <div className="space-y-3">
                {PLAYGROUND_MODELS.map((catalogModel) => {
                  const isSelected = selectedModelId === catalogModel.id;
                  return (
                    <button
                      key={catalogModel.id}
                      type="button"
                      onClick={() => handleModelSelect(catalogModel.id)}
                      className={`w-full rounded-lg border p-4 text-left transition ${
                        isSelected
                          ? "border-green-400 bg-green-50 shadow-sm"
                          : "border-gray-200 bg-white hover:border-orange-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-900">{catalogModel.title}</p>
                          <p className="text-sm text-gray-500">{catalogModel.subtitle}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {isSelected && !isModelLoading && loadedModelId === catalogModel.id ? (
                            <span className="text-xs font-medium text-green-700">로드 완료</span>
                          ) : null}
                          {isSelected && isModelLoading ? (
                            <span className="text-xs font-medium text-orange-700">자동 로드 중</span>
                          ) : null}
                          {isSelected ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : null}
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">{catalogModel.description}</p>
                      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                        <span>{catalogModel.domainLabel}</span>
                        <span>{catalogModel.classes.length} classes</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3 text-xs text-gray-500">
                  <span>GPU 백엔드: {backendName || "준비 중"}</span>
                  <span>{selectedModel.loadType === "graph" ? "GraphModel" : "LayersModel"}</span>
                </div>
                {modelLoadError ? (
                  <p className="mt-3 text-sm text-red-600">{modelLoadError}</p>
                ) : null}
              </div>
            </Card>

            {/* 2. 진단 시작 버튼 */}
            <Button 
              onClick={runInference}
              disabled={!model || !imageURL || isProcessing || isModelLoading}
              className="w-full py-6 text-lg font-bold shadow-lg transition-all hover:scale-[1.02]"
              style={{ 
                backgroundColor: model && imageURL && !isModelLoading ? '#6B3131' : '#E5E7EB',
                color: model && imageURL && !isModelLoading ? 'white' : '#9CA3AF',
                cursor: model && imageURL && !isModelLoading ? 'pointer' : 'not-allowed'
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
                  {selectedModel.title} 진단 시작
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={!reportReady}
              onClick={() => navigate("/playground/report")}
              className="w-full"
            >
              <FileText className="w-4 h-4 mr-2" />
              진단 리포트 페이지로 이동
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setImageURL(null);
                setImageFileName("");
                setResults([]);
                setReportReady(false);
              }}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              이미지와 결과 초기화
            </Button>
          </div>

          {/* [오른쪽] 결과 패널 (수정됨) */}
          <div className="lg:col-span-2">
            <Card className="p-8 border-2 shadow-sm mb-8">
              <div className="flex items-center justify-between gap-4 mb-6">
                <h3 className="font-bold text-xl flex items-center gap-2 text-gray-800">
                  <ImageIcon className="w-6 h-6 text-blue-600" />
                  의료 이미지 업로드
                </h3>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept={selectedModel.imageAccept}
                  onChange={handleImageFileSelect}
                  className="hidden"
                />
                <Button onClick={() => imageInputRef.current?.click()} variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  {imageURL ? "다른 이미지 선택" : "이미지 선택"}
                </Button>
              </div>

              {imageURL ? (
                <div className="space-y-4">
                  <div className="rounded-xl overflow-hidden border bg-black min-h-[420px] flex items-center justify-center">
                    <img
                      ref={imageElementRef}
                      src={imageURL}
                      alt="Medical Preview"
                      className="w-full h-full max-h-[680px] object-contain"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4 text-sm text-gray-500">
                    <p className="truncate">{imageFileName}</p>
                    <p>{selectedModel.domainLabel}</p>
                  </div>
                </div>
              ) : (
                <div className="min-h-[420px] rounded-xl border border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-center">
                  <ImageIcon className="w-14 h-14 text-gray-300 mb-4" />
                  <p className="text-base text-gray-600 mb-2">{selectedModel.domainLabel} 진단용 이미지를 올려주세요</p>
                  <p className="text-sm text-gray-500">업로드한 이미지는 이 영역에서 크게 미리 볼 수 있습니다.</p>
                </div>
              )}
            </Card>

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
                      선택한 모델 <strong>{selectedModel.title}</strong> 기준으로 <strong className="text-red-600">{results[0].name} ({results[0].score.toFixed(1)}%)</strong> 가능성이 가장 높습니다.
                      {selectedModel.inferenceProfile === "chexpert-xray" && results[0].score < 50 && " (확률이 낮아 정상일 가능성이 높습니다.)"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-[400px] flex flex-col items-center justify-center text-gray-400 border-2 border-dashed rounded-lg bg-gray-50">
                  <Activity className="w-16 h-16 mb-4 opacity-20" />
                  <p>모델을 고르고 이미지를 올린 뒤 진단을 시작하세요.</p>
                </div>
              )}
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
