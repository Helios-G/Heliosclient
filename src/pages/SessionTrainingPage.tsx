import { useState, useEffect } from "react";
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
  
  const { xTrain, yTrain } = useTrainingData();
  
  const [status, setStatus] = useState<TrainingStatus>("preparing");
  const [trainingData, setTrainingData] = useState<TrainingData[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [logMessage, setLogMessage] = useState("서버 연결 대기 중...");

  useEffect(() => {
    if (!hospital) navigate("/login");
  }, [hospital, navigate]);

  if (!hospital) return null;

  const startTraining = async () => {
    setStatus("training");
    setLogMessage("연합학습 서버(ws://localhost:8080)에 연결 시도 중...");

    try {
      const client = new MyFlowerClient();

      // ✅ [수정 1] Round 계산 로직 변경
      // 기존: epoch + 1 (항상 1이 나옴)
      // 변경: 현재 데이터 개수 + 1 (1, 2, 3... 증가)
      client.setRoundCallback((epoch: number, loss: number, acc: number) => {
        setTrainingData((prev) => {
          const newRound = prev.length + 1; // 현재 쌓인 데이터 개수 + 1
          
          // 상단 상태 표시용 Round 업데이트
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

      console.log("📦 Context 데이터 확인:", { x: xTrain, y: yTrain });

      if (xTrain && yTrain) {
        console.log("💉 진짜 데이터를 클라이언트에 주입합니다.");
        client.addData(xTrain, yTrain);
      } else {
        console.warn("⚠️ 주의: 데이터가 없습니다! (새로고침 했거나 데이터 전송 실패)");
        setLogMessage("⚠️ 데이터가 없어 가짜 데이터로 학습합니다.");
      }

      const flwr = new Flwr();
      await flwr.connect("ws://localhost:8080", client);

      setStatus("completed");
      setLogMessage("모든 학습 라운드가 완료되었습니다. 결과 페이지로 이동합니다...");
      
      setTimeout(() => {
        navigate(`/session/${sessionId}/results`); 
      }, 3000);

    } catch (err) {
      console.error(err);
      setLogMessage("❌ 서버 연결 실패!");
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
                <p>• 학습 데이터 상태: {xTrain ? <span className="text-green-600 font-bold">준비됨 (Real Data)</span> : <span className="text-red-500 font-bold">없음 (Fake Data 사용 예정)</span>}</p>
                <p>• <strong>Python 서버(port 8080)</strong>가 켜져 있는지 확인해주세요.</p>
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

        {status === "training" && (
          <div className="space-y-8">
            <Card className="p-8 border-2 shadow-md">
              <div className="mb-6 flex justify-between items-center">
                <div>
                  {/* Epoch -> Round로 텍스트 변경 */}
                  <h3 className="mb-2 text-xl font-bold" style={{ color: '#6B3131' }}>현재 Round: {currentRound}</h3>
                  <p className="text-gray-600">서버와 통신하며 모델을 학습시키고 있습니다...</p>
                </div>
                <div className="animate-pulse bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-bold">
                  ● Training Active
                </div>
              </div>

              {/* 정확도 그래프 */}
              <div className="mb-8">
                <h4 className="mb-4 font-semibold" style={{ color: '#6B3131' }}>정확도 (Accuracy)</h4>
                <ResponsiveContainer width="100%" height={300}>
                  {/* ✅ [수정 2] margin 추가 및 Legend 위치 변경 */}
                  <LineChart data={trainingData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="round" 
                      // 라벨을 Round로 변경하고 위치 조정
                      label={{ value: 'Round', position: 'insideBottom', offset: -15 }} 
                      allowDecimals={false} // 소수점 안 나오게 (1, 2, 3...)
                    />
                    <YAxis 
                      domain={[0, 1]} 
                      label={{ value: 'Accuracy', angle: -90, position: 'insideLeft' }} 
                    />
                    <Tooltip />
                    {/* 범례를 위로 올려서 겹침 방지 */}
                    <Legend verticalAlign="top" height={36}/>
                    <Line 
                      type="monotone" 
                      dataKey="accuracy" 
                      stroke="#FF9500" 
                      strokeWidth={3} 
                      name="정확도" 
                      dot={{ fill: '#FF9500', r: 4 }} 
                      isAnimationActive={false} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Loss 그래프 */}
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
                    <YAxis 
                      label={{ value: 'Loss', angle: -90, position: 'insideLeft' }} 
                    />
                    <Tooltip />
                    <Legend verticalAlign="top" height={36}/>
                    <Line 
                      type="monotone" 
                      dataKey="loss" 
                      stroke="#6B3131" 
                      strokeWidth={3} 
                      name="손실" 
                      dot={{ fill: '#6B3131', r: 4 }} 
                      isAnimationActive={false}
                    />
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