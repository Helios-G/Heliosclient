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
  Play
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

// CheXpert 클래스
const CLASSES = [
  "No Finding", "Enlarged Cardiomediastinum", "Cardiomegaly", "Lung Opacity",
  "Lung Lesion", "Edema", "Consolidation", "Pneumonia", "Atelectasis",
  "Pneumothorax", "Pleural Effusion", "Pleural Other", "Fracture", "Support Devices"
];

export function ModelInferencePage() {
  const navigate = useNavigate();
  const { hospital } = useAuth();

  const [model, setModel] = useState<tf.LayersModel | tf.GraphModel | null>(null);
  const [imageURL, setImageURL] = useState<string | null>(null);
  const [results, setResults] = useState<{ name: string; score: number }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // UI용 상태
  const [modelFileNames, setModelFileNames] = useState<string[]>([]);
  const [imageFileName, setImageFileName] = useState<string>("");

  // Input Refs (숨겨진 input을 클릭하기 위함)
  const modelInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const imageElementRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!hospital) {
      alert("로그인이 필요한 서비스입니다.");
      navigate("/login");
    }
  }, [hospital, navigate]);

  if (!hospital) return null;

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

      // 4. 모델 로드 시도 (GraphModel)
      const loadedModel = await tf.loadGraphModel(tf.io.browserFiles(sortedFiles));
      
      setModel(loadedModel);
      console.log("🎉 모델 로드 최종 성공!");

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
      setResults([]); // 결과 초기화
    }
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
        // 1. 이미지 로드
        let img = tf.browser.fromPixels(imgEl);
        
        // 2. 리사이징 (224 -> 320으로 변경!)
        img = tf.image.resizeBilinear(img, [320, 320]);
        
        // 3. 정규화 (0~1)
        img = img.div(255.0);

        // 4. 표준화 (ImageNet Mean/Std) - 모델 학습때 썼다면 필수
        const mean = tf.tensor([0.485, 0.456, 0.406]);
        const std = tf.tensor([0.229, 0.224, 0.225]);
        img = img.sub(mean).div(std);

        // 5. Transpose (NHWC -> NCHW) - 채널을 앞으로
        img = img.transpose([2, 0, 1]);

        // 6. 배치 차원 추가
        return img.expandDims(0); // [1, 3, 320, 320]
      });

      // 추론
      // GraphModel은 predict() 또는 execute() 사용
      let prediction;
      if (model instanceof tf.GraphModel) {
          prediction = model.predict(tensor) as tf.Tensor;
      } else {
          prediction = model.predict(tensor) as tf.Tensor;
      }
      
      // 결과 처리 (Sigmoid 적용)
      const probs = prediction.sigmoid().dataSync();
      
      // 결과 매핑
      const chartData = Array.from(probs).map((score, i) => ({
        name: CLASSES[i],
        score: score * 100
      })).sort((a, b) => b.score - a.score);

      setResults(chartData);
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
            학습된 모델을 업로드하고, 실제 X-ray 이미지를 넣어 성능을 테스트해보세요.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* [왼쪽] 설정 패널 */}
          <div className="lg:col-span-1 space-y-6">
            
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
                2. X-ray 업로드
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
                      alt="X-ray Preview" 
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
                  <p className="text-sm text-gray-500 mb-4">진단할 X-ray 이미지를 올려주세요</p>
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