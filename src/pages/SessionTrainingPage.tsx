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
import { authFetch } from "../lib/authFetch";

type TrainingStatus = "preparing" | "training" | "waiting" | "completed";

interface TrainingData {
  round: number;
  accuracy: number;
  loss: number;
}

export function SessionTrainingPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { xTrain, yTrain, xTest, yTest, setFinalMetrics } = useTrainingData();
  const { getSession, upsertSession } = useSession();

  const session = getSession(sessionId || "");
  const [sessionMeta, setSessionMeta] = useState(session);

  const [status, setStatus] = useState<TrainingStatus>("preparing");
  const [trainingData, setTrainingData] = useState<TrainingData[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [totalRounds, setTotalRounds] = useState(session?.rounds || 5);
  const [logMessage, setLogMessage] = useState("서버 연결 대기 중...");
  const [currentParticipants, setCurrentParticipants] = useState(0);
  const [targetParticipants, setTargetParticipants] = useState(0);

  const [startTime] = useState(new Date().toLocaleString());
  const lastMetricsRef = useRef({ acc: 0, loss: 0 });
  const currentRoundRef = useRef(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!user && !params.get("hId")) navigate("/login");
  }, [user, navigate]);

  useEffect(() => {
    const loadSessionMeta = async () => {
      if (!sessionId) return;

      try {
        const response = await authFetch(`/sessions/${sessionId}`);
        if (!response.ok) return;

        const serverSession = await response.json();
        const normalizedSession = {
          id: String(serverSession.sessionId ?? sessionId),
          title: serverSession.title ?? session?.title ?? "제목 없음",
          dataType: serverSession.dataFormat ?? session?.dataType ?? "X-ray",
          classNames:
            typeof serverSession.labelClassList === "string" && serverSession.labelClassList.length > 0
              ? serverSession.labelClassList.split(",").map((item: string) => item.trim())
              : session?.classNames ?? [],
          algorithm: serverSession.algorithm ?? session?.algorithm ?? "FedAvg",
          rounds: serverSession.rounds ?? session?.rounds ?? 5,
          createdAt: serverSession.createdAt ?? session?.createdAt ?? new Date().toISOString(),
          createdBy: serverSession.createdBy ?? session?.createdBy ?? "unknown",
          status:
            serverSession.status === "IN_PROGRESS"
              ? "running"
              : serverSession.status === "COMPLETED"
                ? "completed"
                : "waiting",
          participants: serverSession.participantCount ?? session?.participants ?? 0,
          targetParticipants: serverSession.maxParticipants ?? session?.targetParticipants ?? 0,
        } as const;

        setSessionMeta(normalizedSession);
        setCurrentParticipants(normalizedSession.participants);
        setTargetParticipants(normalizedSession.targetParticipants);

        const currentLocal = getSession(normalizedSession.id);
        if (JSON.stringify(currentLocal) !== JSON.stringify(normalizedSession)) {
          upsertSession(normalizedSession);
        }
        setTotalRounds(normalizedSession.rounds);
      } catch (error) {
        console.warn("학습 페이지 세션 메타데이터를 서버에서 불러오지 못했습니다.", error);
      }
    };

    loadSessionMeta();
  }, [sessionId]);

  if (!user) return null;

  const startTraining = async () => {
    console.log("📦 Context 데이터 확인:", {
      xTrain: xTrain?.shape,
      yTrain: yTrain?.shape,
      xTest: xTest?.shape,
      yTest: yTest?.shape,
    });

    if (!xTrain || !yTrain || !xTest || !yTest) {
      alert("학습 또는 테스트 데이터가 누락되었습니다.\n라벨링 페이지에서 데이터를 다시 로드해주세요.");
      navigate(`/session/${sessionId}/labeling/auto`);
      return;
    }

    setStatus("waiting");
    setLogMessage("다른 참여자를 기다리는 중...");

    try {
      const client = new MyFlowerClient();
      const flwr = new Flwr();

      flwr.setStatusCallback((message: { currentRound?: number; totalRounds?: number; progress?: number }) => {
        // 첫 라운드 시작되면 waiting -> training 으로 전환
        setStatus("training");
        const nextRound = message.currentRound || 0;
        currentRoundRef.current = nextRound;
        setCurrentRound(nextRound);
        if (message.totalRounds) {
          setTotalRounds(message.totalRounds);
        }
        setLogMessage(
          `Round ${nextRound} / ${message.totalRounds || totalRounds} 진행 중 (${message.progress || 0}%)`
        );
      });

      client.setRoundCallback((epoch: number, loss: number, acc: number) => {
        lastMetricsRef.current = { acc, loss };

        setTrainingData((prev) => {
          const completedRound = currentRoundRef.current || prev.length + 1;
          setLogMessage(`Round ${completedRound} 완료: 정확도 ${(acc * 100).toFixed(2)}%`);

          return [
            ...prev,
            {
              round: completedRound,
              accuracy: parseFloat(acc.toFixed(4)),
              loss: parseFloat(loss.toFixed(4)),
            },
          ];
        });
      });

      console.log("💉 Train/Test 데이터를 클라이언트에 주입합니다.");
      client.addData(xTrain, yTrain, xTest, yTest);

      const userToken = user?.id?.toString() || "1";
      const algo = sessionMeta?.algorithm || session?.algorithm || "FedAvg";

      const urlParams = new URLSearchParams(window.location.search);
      const mockId = urlParams.get("hId") || user?.id?.toString() || "1";

      const wsUrl = `ws://localhost:8080/ws/fl/${sessionId}/${userToken}?algo=${algo}&userId=${mockId}`;

      console.log(`🔗 웹소켓 연결 시도 (사용자ID: ${mockId}): ${wsUrl}`);
      await flwr.connect(wsUrl, client);

      const finalResult = {
        accuracy: lastMetricsRef.current.acc,
        loss: lastMetricsRef.current.loss,
        rounds: totalRounds,
        startTime: startTime,
        endTime: new Date().toLocaleString(),
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
      setLogMessage("❌ 서버 연결 실패! (파이썬 서버가 8080번 포트로 켜져있나요?)");
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
            {status === "waiting" && "참여자 대기 중"}
            {status === "training" && "실시간 연합학습 진행 중 (Real-time)"}
            {status === "completed" && "학습 완료"}
          </h1>
          <p className="text-gray-500 mt-2">시스템 로그: {logMessage}</p>
        </div>

        {status === "preparing" && (
          <div className="space-y-6">
            <Card className="p-8 border-2" style={{ backgroundColor: "#FFF9F5" }}>
              <h3 className="mb-4 text-xl font-bold" style={{ color: "#6B3131" }}>
                학습 준비 완료
              </h3>
              <div className="space-y-2 text-gray-700">
                <p>• 데이터 전처리 및 오토라벨링이 완료되었습니다.</p>
                <p>
                  • 학습 데이터 상태:{" "}
                  {xTrain && xTest ? (
                    <span className="text-green-600 font-bold">준비됨 (Train/Test Split OK)</span>
                  ) : (
                    <span className="text-red-500 font-bold">없음 (다시 로드 필요)</span>
                  )}
                </p>
                <p>
                  • <strong>Python 서버(port 8080)</strong>가 켜져 있는지 확인해주세요.
                </p>
                <p>• 아래 버튼을 누르면 실제 연합학습이 시작됩니다.</p>
              </div>
            </Card>

            <div className="flex justify-center">
              <Button
                style={{ backgroundColor: "#6B3131" }}
                className="text-white hover:opacity-90 px-12 py-8 text-lg font-bold rounded-xl shadow-lg transition-transform hover:scale-105"
                onClick={startTraining}
              >
                🚀 연합학습 시작하기
              </Button>
            </div>
          </div>
        )}

        {status === "waiting" && (
          <div className="space-y-6">
            <Card className="p-8 border-2" style={{ backgroundColor: "#FFF9F5" }}>
              <div className="text-center space-y-4">
                <div className="text-5xl animate-pulse">⏳</div>
                <h3 className="text-xl font-bold" style={{ color: "#6B3131" }}>
                  다른 참여자를 기다리는 중...
                </h3>
                <p className="text-gray-600">
                  현재 참여자:{" "}
                  <span className="font-bold text-orange-500">
                    {currentParticipants} / {targetParticipants}명
                  </span>
                </p>
                <p className="text-gray-500 text-sm">
                  목표 인원이 모이면 자동으로 학습이 시작됩니다.
                </p>
              </div>
            </Card>
          </div>
        )}

        {status === "training" && (
          <div className="space-y-8">
            <Card className="p-8 border-2 shadow-md">
              <div className="mb-6 flex justify-between items-center">
                <div>
                  <h3 className="mb-2 text-xl font-bold" style={{ color: "#6B3131" }}>
                    현재 Round: {currentRound}
                  </h3>
                  <p className="text-sm text-gray-500">총 {totalRounds} 라운드</p>
                  <p className="text-gray-600">서버와 통신하며 모델을 학습시키고 있습니다...</p>
                </div>
                <div className="animate-pulse bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-bold">
                  ● Training Active
                </div>
              </div>

              <div className="mb-8">
                <h4 className="mb-4 font-semibold" style={{ color: "#6B3131" }}>
                  정확도 (Accuracy)
                </h4>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trainingData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="round"
                      label={{ value: "Round", position: "insideBottom", offset: -15 }}
                      domain={[1, "auto"]}
                      allowDecimals={false}
                    />
                    <YAxis domain={[0, 1]} label={{ value: "Accuracy", angle: -90, position: "insideLeft" }} />
                    <Tooltip />
                    <Legend verticalAlign="top" height={36} />
                    <Line
                      type="monotone"
                      dataKey="accuracy"
                      stroke="#FF9500"
                      strokeWidth={3}
                      name="정확도"
                      dot={{ fill: "#FF9500", r: 4 }}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h4 className="mb-4 font-semibold" style={{ color: "#6B3131" }}>
                  손실 (Loss)
                </h4>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trainingData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="round"
                      label={{ value: "Round", position: "insideBottom", offset: -15 }}
                      allowDecimals={false}
                    />
                    <YAxis label={{ value: "Loss", angle: -90, position: "insideLeft" }} />
                    <Tooltip />
                    <Legend verticalAlign="top" height={36} />
                    <Line
                      type="monotone"
                      dataKey="loss"
                      stroke="#6B3131"
                      strokeWidth={3}
                      name="손실"
                      dot={{ fill: "#6B3131", r: 4 }}
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
            <Card className="p-8 border-2 border-green-200" style={{ backgroundColor: "#F0FDF4" }}>
              <div className="text-center">
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="mb-2 text-2xl font-bold text-green-800">연합학습 완료!</h3>
                <p className="text-green-700 mb-4">글로벌 모델 업데이트가 성공적으로 수행되었습니다.</p>
              </div>
            </Card>
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => navigate("/session/list")} className="px-8 py-6">
                세션 목록으로
              </Button>
              <Button
                style={{ backgroundColor: "#FF9500" }}
                className="text-white hover:opacity-90 px-12 py-6 font-bold"
                onClick={viewResults}
              >
                결과 상세 리포트 보기
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}