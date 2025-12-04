import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

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
  const [status, setStatus] = useState<TrainingStatus>("preparing");
  const [trainingData, setTrainingData] = useState<TrainingData[]>([]);
  const [currentRound, setCurrentRound] = useState(0);

  // 로그인 체크
  useEffect(() => {
    if (!hospital) {
      navigate("/login");
    }
  }, [hospital, navigate]);

  if (!hospital) {
    return null;
  }

  // 실시간 학습 데이터 시뮬레이션
  useEffect(() => {
    if (status === "training") {
      const interval = setInterval(() => {
        setCurrentRound((prev) => {
          const nextRound = prev + 1;
          
          // 10라운드까지만 진행
          if (nextRound > 10) {
            clearInterval(interval);
            setStatus("completed");
            return prev;
          }

          // 새로운 데이터 포인트 추가 (정확도는 증가, loss는 감소)
          setTrainingData((prevData) => [
            ...prevData,
            {
              round: nextRound,
              accuracy: Math.min(0.95, 0.5 + nextRound * 0.045 + Math.random() * 0.02),
              loss: Math.max(0.05, 2.0 - nextRound * 0.18 - Math.random() * 0.1),
            },
          ]);

          return nextRound;
        });
      }, 2000); // 2초마다 업데이트

      return () => clearInterval(interval);
    }
  }, [status]);

  // 학습 시작
  const startTraining = () => {
    setStatus("training");
    setTrainingData([
      { round: 0, accuracy: 0.5, loss: 2.0 }
    ]);
  };

  // 학습 완료 화면으로 이동
  const viewResults = () => {
    navigate(`/session/${sessionId}/results`);
  };

  return (
    <div className="min-h-screen py-12 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-gray-800">
            {status === "preparing" && "학습 준비"}
            {status === "training" && "실시간 학습 진행 현황"}
            {status === "completed" && "학습 완료"}
          </h1>
        </div>

        {/* 준비 단계 */}
        {status === "preparing" && (
          <div className="space-y-6">
            <Card className="p-8 border-2" style={{ backgroundColor: '#FFF9F5' }}>
              <h3 className="mb-4" style={{ color: '#6B3131' }}>학습 준비 완료</h3>
              <div className="space-y-2 text-gray-700">
                <p>• 모든 참여 기관의 데이터 준비가 완료되었습니다.</p>
                <p>• 연합학습을 시작하려면 아래 버튼을 클릭하세요.</p>
                <p>• 학습 중에는 페이지를 닫지 마세요.</p>
              </div>
            </Card>

            <div className="flex justify-center">
              <Button
                style={{ backgroundColor: '#6B3131' }}
                className="text-white hover:opacity-90 px-12 py-8 text-lg"
                onClick={startTraining}
              >
                학습 시작하기
              </Button>
            </div>
          </div>
        )}

        {/* 학습 중 - 실시간 그래프 */}
        {status === "training" && (
          <div className="space-y-8">
            <Card className="p-8 border-2">
              <div className="mb-6">
                <h3 className="mb-2" style={{ color: '#6B3131' }}>현재 라운드: {currentRound} / 10</h3>
                <p className="text-gray-600">학습이 진행 중입니다. 잠시만 기다려주세요...</p>
              </div>

              {/* 정확도 그래프 */}
              <div className="mb-8">
                <h4 className="mb-4" style={{ color: '#6B3131' }}>정확도 (Accuracy)</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trainingData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="round" 
                      label={{ value: 'Round', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      domain={[0, 1]}
                      label={{ value: 'Accuracy', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="accuracy" 
                      stroke="#FF9500" 
                      strokeWidth={3}
                      name="정확도"
                      dot={{ fill: '#FF9500', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Loss 그래프 */}
              <div>
                <h4 className="mb-4" style={{ color: '#6B3131' }}>손실 (Loss)</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trainingData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="round" 
                      label={{ value: 'Round', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      label={{ value: 'Loss', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="loss" 
                      stroke="#6B3131" 
                      strokeWidth={3}
                      name="손실"
                      dot={{ fill: '#6B3131', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        )}

        {/* 학습 완료 */}
        {status === "completed" && (
          <div className="space-y-6">
            <Card className="p-8 border-2" style={{ backgroundColor: '#F0FDF4' }}>
              <h3 className="mb-2 text-green-800">학습이 성공적으로 완료되었습니다!</h3>
              <p className="text-green-700">
                최종 결과를 확인하려면 아래 버튼을 클릭하세요.
              </p>
            </Card>

            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                onClick={() => navigate('/upload')}
                className="px-8 py-6"
              >
                세션 목록으로
              </Button>
              <Button
                style={{ backgroundColor: '#FF9500' }}
                className="text-white hover:opacity-90 px-12 py-6"
                onClick={viewResults}
              >
                학습 결과 확인
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}