import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// @ts-ignore
import { Flwr } from "../lib/flwr";
// @ts-ignore
import { MyFlowerClient } from "../lib/fl_client";

import { useTrainingData } from "../contexts/TrainingDataContext";
import { useSession } from "../contexts/SessionContext";

type TrainingStatus = "preparing" | "training" | "completed";

interface TrainingData {
  round: number;
  accuracy: number;
  loss: number;
}

export function SessionTrainingPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { hospital } = useAuth();
  
  // ✅ 4개 데이터 모두 가져오기
  const { xTrain, yTrain, xTest, yTest, setFinalMetrics } = useTrainingData();
  const { getSession } = useSession();
  
  const session = getSession(sessionId || "");
  
  const [status, setStatus] = useState<TrainingStatus>("preparing");
  const [trainingData, setTrainingData] = useState<TrainingData[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [logMessage, setLogMessage] = useState("서버 연결 대기 중...");
  
  const [startTime] = useState(new Date().toLocaleString());
  const lastMetricsRef = useRef({ acc: 0, loss: 0 });

  useEffect(() => {
    if (!hospital) navigate("/login");
  }, [hospital, navigate]);

  if (!hospital) return null;

  const startTraining = async () => {
    // 🔍 데이터 확인 로그
    console.log("📦 Context 데이터 확인:", { 
        xTrain: xTrain?.shape, 
        yTrain: yTrain?.shape, 
        xTest: xTest?.shape, 
        yTest: yTest?.shape 
    });

    // ✅ [수정] Train과 Test가 모두 있어야만 시작! (엄격한 검사)
    if (!xTrain || !yTrain || !xTest || !yTest) {
        alert("학습 또는 테스트 데이터가 누락되었습니다.\n라벨링 페이지에서 데이터를 다시 로드해주세요.");
        // 데이터가 없으면 다시 라벨링 페이지로
        navigate(`/session/${sessionId}/labeling/auto`); 
        return;
    }

    setStatus("training");
    setLogMessage("연합학습 서버(ws://localhost:8000)에 연결 시도 중...");

    try {
      const client = new MyFlowerClient();

      client.setRoundCallback((epoch: number, loss: number, acc: number) => {
        lastMetricsRef.current = { acc, loss };

        setTrainingData((prev) => {
          const newRound = prev.length + 1;
          setCurrentRound(newRound);
          setLogMessage(`Round ${newRound} 완료: 정확도 ${(acc * 100).toFixed(2)}%`);

          return [
            ...prev,
            {
              round: newRound,
              accuracy: parseFloat(acc.toFixed(4)),
              loss: parseFloat(loss.toFixed(4)),
            },
          ];
        });
      });

      // ✅ [수정] 진짜 데이터 4개를 모두 주입
      console.log("💉 Train/Test 데이터를 클라이언트에 주입합니다.");
      client.addData(xTrain, yTrain, xTest, yTest);

      const flwr = new Flwr();
      
      const userToken = hospital?.email ? hospital.email.split('@')[0] : "unknown_user";
      const algo = session?.algorithm || "FedAvg";

      // const wsUrl = `ws://localhost:8000/ws/fl/${sessionId}/${userToken}?algo=${algo}`;
      // const wsUrl = `ws://localhost:8000/ws/fl/${sessionId}/${userToken}?algo=${algo}&hospitalId=${hospital.id}`;
      // ✅ [수정] 테스트를 위해 주소창에 ?hId=2 라고 치면 2번 병원으로 접속하게 만듭니다.
      const urlParams = new URLSearchParams(window.location.search);
      const mockId = urlParams.get('hId') || hospital?.id || "1"; 

      // 새로운 FastAPI 서버 주소 (hospitalId 파라미터 포함)
      const wsUrl = `ws://localhost:8000/ws/fl/${sessionId}/${userToken}?algo=${algo}&hospitalId=${mockId}`;

      console.log(`🔗 웹소켓 연결 시도 (병원ID: ${mockId}): ${wsUrl}`);
      await flwr.connect(wsUrl, client);

      const finalResult = {
        accuracy: lastMetricsRef.current.acc,
        loss: lastMetricsRef.current.loss,
        rounds: 5,
        startTime: startTime,
        endTime: new Date().toLocaleString()
      };

      if (setFinalMetrics) {
          setFinalMetrics(finalResult);
          localStorage.setItem("session_result", JSON.stringify(finalResult));
          console.log("💾 결과 데이터 저장 완료:", finalResult);
      }

      setStatus("completed");
      setLogMessage("모든 학습 라운드가 완료되었습니다. 결과 페이지로 이동합니다...");
      
      setTimeout(() => {
        navigate(`/session/${sessionId}/results`); 
      }, 3000);

    } catch (err) {
      console.error(err);
      setLogMessage("❌ 서버 연결 실패! (파이썬 서버가 8000번 포트로 켜져있나요?)");
      setTimeout(() => setStatus("preparing"), 3000);
    }
  };

  const viewResults = () => {
    navigate(`/session/${sessionId}/results`);
  };

  return (
    <div className="min-h-screen py-12 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <h1 className="text-gray-800 text-2xl font-bold">
            {status === "preparing" && "학습 준비"}
            {status === "training" && "실시간 연합학습 진행 중 (Real-time)"}
            {status === "completed" && "학습 완료"}
          </h1>
          <p className="text-gray-500 mt-2">시스템 로그: {logMessage}</p>
        </div>

        {status === "preparing" && (
          <div className="space-y-6">
            <Card className="p-8 border-2" style={{ backgroundColor: '#FFF9F5' }}>
              <h3 className="mb-4 text-xl font-bold" style={{ color: '#6B3131' }}>학습 준비 완료</h3>
              <div className="space-y-2 text-gray-700">
                <p>• 데이터 전처리 및 오토라벨링이 완료되었습니다.</p>
                {/* 데이터 상태 표시 (Test 데이터 유무도 확인) */}
                <p>• 학습 데이터 상태: {xTrain && xTest ? <span className="text-green-600 font-bold">준비됨 (Train/Test Split OK)</span> : <span className="text-red-500 font-bold">없음 (다시 로드 필요)</span>}</p>
                <p>• <strong>Python 서버(port 8000)</strong>가 켜져 있는지 확인해주세요.</p>
                <p>• 아래 버튼을 누르면 실제 연합학습이 시작됩니다.</p>
              </div>
            </Card>

            <div className="flex justify-center">
              <Button
                style={{ backgroundColor: '#6B3131' }}
                className="text-white hover:opacity-90 px-12 py-8 text-lg font-bold rounded-xl shadow-lg transition-transform hover:scale-105"
                onClick={startTraining}
              >
                🚀 연합학습 시작하기
              </Button>
            </div>
          </div>
        )}

        {/* ... 나머지 차트 및 완료 UI는 동일 ... */}
        {status === "training" && (
          <div className="space-y-8">
            <Card className="p-8 border-2 shadow-md">
              <div className="mb-6 flex justify-between items-center">
                <div>
                  <h3 className="mb-2 text-xl font-bold" style={{ color: '#6B3131' }}>현재 Round: {currentRound}</h3>
                  <p className="text-gray-600">서버와 통신하며 모델을 학습시키고 있습니다...</p>
                </div>
                <div className="animate-pulse bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-bold">
                  ● Training Active
                </div>
              </div>

              <div className="mb-8">
                <h4 className="mb-4 font-semibold" style={{ color: '#6B3131' }}>정확도 (Accuracy)</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trainingData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="round" 
                      label={{ value: 'Round', position: 'insideBottom', offset: -15 }} 
                      domain={[1, 'auto']} 
                      allowDecimals={false} 
                    />
                    <YAxis domain={[0, 1]} label={{ value: 'Accuracy', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend verticalAlign="top" height={36}/>
                    <Line type="monotone" dataKey="accuracy" stroke="#FF9500" strokeWidth={3} name="정확도" dot={{ fill: '#FF9500', r: 4 }} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h4 className="mb-4 font-semibold" style={{ color: '#6B3131' }}>손실 (Loss)</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trainingData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="round" 
                      label={{ value: 'Round', position: 'insideBottom', offset: -15 }} 
                      allowDecimals={false}
                    />
                    <YAxis label={{ value: 'Loss', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend verticalAlign="top" height={36}/>
                    <Line type="monotone" dataKey="loss" stroke="#6B3131" strokeWidth={3} name="손실" dot={{ fill: '#6B3131', r: 4 }} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        )}

        {status === "completed" && (
          <div className="space-y-6">
            <Card className="p-8 border-2 border-green-200" style={{ backgroundColor: '#F0FDF4' }}>
              <div className="text-center">
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="mb-2 text-2xl font-bold text-green-800">연합학습 완료!</h3>
                <p className="text-green-700 mb-4">글로벌 모델 업데이트가 성공적으로 수행되었습니다.</p>
              </div>
            </Card>
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => navigate('/session/list')} className="px-8 py-6">세션 목록으로</Button>
              <Button style={{ backgroundColor: '#FF9500' }} className="text-white hover:opacity-90 px-12 py-6 font-bold" onClick={viewResults}>결과 상세 리포트 보기</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}