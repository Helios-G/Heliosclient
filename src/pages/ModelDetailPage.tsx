import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ArrowLeft, Download, Calendar, Building2, Layers, TrendingUp, Clock, Check, Database, Cpu } from "lucide-react";
import { mockContributedModels, mockDownloadModels } from "../data/mockContributedModels";
import { downloadModelFiles } from "../utils/download";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function ModelDetailPage() {
  const { modelId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const modelDetail =
    mockContributedModels.find((item) => item.id === modelId) ||
    mockDownloadModels.find((item) => item.id === modelId);
  const backPath = modelDetail?.source === "download" ? "/download" : "/mypage";
  const backLabel = modelDetail?.source === "download" ? "모델 다운로드로 돌아가기" : "기여 이력으로 돌아가기";
  const pageTitle = modelDetail?.source === "download" ? "모델 상세" : "모델 기여 상세";

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  if (!modelDetail) {
    return (
      <div className="cohere-page py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate(backPath)}
            className="mb-4 -ml-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {backLabel}
          </Button>
          <Card className="p-8 border-2 shadow-lg text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">모델 정보를 찾을 수 없습니다</h1>
            <p className="text-gray-600">백엔드 연동 전 임시 상세 페이지라 등록된 목 데이터만 표시됩니다.</p>
          </Card>
        </div>
      </div>
    );
  }

  const handleDownload = () => {
    downloadModelFiles(modelDetail.id);
  };

  return (
    <div className="cohere-page py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(backPath)}
            className="mb-4 -ml-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {backLabel}
          </Button>
        </div>

        <div className="mb-12 text-center">
          <h1 className="text-gray-800 mb-2">{pageTitle}</h1>
          <p className="text-gray-600">{modelDetail.sessionTitle}</p>
        </div>

        <Card className="p-10 mb-8 border-2 shadow-lg">
          <div className="flex justify-center mb-8">
            <div className="px-6 py-3 rounded-full" style={{ backgroundColor: "#E8F5E9" }}>
              <span className="text-green-700">✓ {modelDetail.status}</span>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h2 style={{ color: "#071225" }} className="mb-6 text-center">기여 모델 요약</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-lg border-2" style={{ backgroundColor: "#f7fbff" }}>
                <div className="flex items-center gap-3 mb-3">
                  <Layers className="w-5 h-5" style={{ color: "#0f62fe" }} />
                  <h4 style={{ color: "#071225" }}>버전</h4>
                </div>
                <p className="text-2xl">{modelDetail.version}</p>
              </div>

              <div className="p-6 rounded-lg border-2" style={{ backgroundColor: "#f7fbff" }}>
                <div className="flex items-center gap-3 mb-3">
                  <Building2 className="w-5 h-5" style={{ color: "#0f62fe" }} />
                  <h4 style={{ color: "#071225" }}>참여 기관 수</h4>
                </div>
                <p className="text-2xl">{modelDetail.participatingUsers}</p>
              </div>

              <div className="p-6 rounded-lg border-2" style={{ backgroundColor: "#f7fbff" }}>
                <div className="flex items-center gap-3 mb-3">
                  <TrendingUp className="w-5 h-5" style={{ color: "#0f62fe" }} />
                  <h4 style={{ color: "#071225" }}>총 라운드 수</h4>
                </div>
                <p className="text-2xl">{modelDetail.totalRounds} 라운드</p>
              </div>

              <div className="p-6 rounded-lg border-2" style={{ backgroundColor: "#f7fbff" }}>
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="w-5 h-5" style={{ color: "#0f62fe" }} />
                  <h4 style={{ color: "#071225" }}>학습 소요 시간</h4>
                </div>
                <p className="text-2xl">{modelDetail.trainingDuration}</p>
              </div>
            </div>

            <div>
              <h3 className="mb-4" style={{ color: "#071225" }}>결과 요약</h3>
              <div className="space-y-4">
                <div className="p-6 rounded-lg border-2" style={{ backgroundColor: "#f7fbff" }}>
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 style={{ color: "#071225" }} className="mb-1">최종 정확도 (Accuracy)</h4>
                      <p className="text-sm text-gray-600">기여 모델의 최종 정확도</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl" style={{ color: "#0f62fe" }}>
                        {(modelDetail.finalAccuracy * 100).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-lg border-2" style={{ backgroundColor: "#f7fbff" }}>
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 style={{ color: "#071225" }} className="mb-1">최종 손실 (Loss)</h4>
                      <p className="text-sm text-gray-600">학습 종료 시점의 손실 값</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl" style={{ color: "#071225" }}>
                        {modelDetail.finalLoss.toFixed(4)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-4" style={{ color: "#071225" }}>학습 시 성능 추이</h3>
              <div className="grid grid-cols-1 gap-6">
                <Card className="p-6 border-2">
                  <h4 className="mb-4" style={{ color: "#071225" }}>정확도 변화</h4>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={modelDetail.trainingHistory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="round" />
                      <YAxis domain={[0, 1]} tickFormatter={(value) => `${Math.round(value * 100)}%`} />
                      <Tooltip formatter={(value: number) => [`${(value * 100).toFixed(2)}%`, "Accuracy"]} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="accuracy"
                        stroke="#0f62fe"
                        strokeWidth={3}
                        name="Accuracy"
                        dot={{ fill: "#0f62fe", r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>

                <Card className="p-6 border-2">
                  <h4 className="mb-4" style={{ color: "#071225" }}>Loss 변화</h4>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={modelDetail.trainingHistory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="round" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => [value.toFixed(4), "Loss"]} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="loss"
                        stroke="#071225"
                        strokeWidth={3}
                        name="Loss"
                        dot={{ fill: "#071225", r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              </div>
            </div>

            <div>
              <h3 className="mb-4" style={{ color: "#071225" }}>학습 상세</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 rounded-lg border-2" style={{ backgroundColor: "#f7fbff" }}>
                  <div className="flex items-center gap-3 mb-3">
                    <Database className="w-5 h-5" style={{ color: "#0f62fe" }} />
                    <h4 style={{ color: "#071225" }}>데이터 형식</h4>
                  </div>
                  <p className="text-lg">{modelDetail.dataType}</p>
                </div>

                <div className="p-6 rounded-lg border-2" style={{ backgroundColor: "#f7fbff" }}>
                  <div className="flex items-center gap-3 mb-3">
                    <Cpu className="w-5 h-5" style={{ color: "#0f62fe" }} />
                    <h4 style={{ color: "#071225" }}>알고리즘</h4>
                  </div>
                  <p className="text-lg">{modelDetail.algorithm}</p>
                </div>

                <div className="p-6 rounded-lg border-2" style={{ backgroundColor: "#f7fbff" }}>
                  <div className="flex items-center gap-3 mb-3">
                    <Layers className="w-5 h-5" style={{ color: "#0f62fe" }} />
                    <h4 style={{ color: "#071225" }}>모델 구조</h4>
                  </div>
                  <p className="text-lg">{modelDetail.modelArchitecture}</p>
                </div>

                <div className="p-6 rounded-lg border-2" style={{ backgroundColor: "#f7fbff" }}>
                  <div className="flex items-center gap-3 mb-3">
                    <Check className="w-5 h-5" style={{ color: "#0f62fe" }} />
                    <h4 style={{ color: "#071225" }}>학습 완료 날짜</h4>
                  </div>
                  <p className="text-lg">{modelDetail.completedAt}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-4" style={{ color: "#071225" }}>학습 일정</h3>
              <div className="p-6 rounded-lg border-2" style={{ backgroundColor: "#f7fbff" }}>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5" style={{ color: "#0f62fe" }} />
                    <div>
                      <p className="text-sm text-gray-600">학습 시작 시간</p>
                      <p className="text-lg">{modelDetail.startTime}</p>
                    </div>
                  </div>
                  <div className="border-t border-gray-200 my-3"></div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5" style={{ color: "#0f62fe" }} />
                    <div>
                      <p className="text-sm text-gray-600">학습 종료 시간</p>
                      <p className="text-lg">{modelDetail.endTime}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="flex justify-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate(backPath)}
            className="px-8 py-6 border-2"
            style={{ borderColor: "#071225", color: "#071225" }}
          >
            {modelDetail.source === "download" ? "모델 다운로드로 이동" : "기여 이력으로 이동"}
          </Button>
          <Button
            style={{ backgroundColor: "#0f62fe" }}
            className="text-white hover:opacity-90 px-8 py-6"
            onClick={handleDownload}
          >
            <Download className="w-5 h-5 mr-2" />
            모델 다운로드
          </Button>
        </div>

        <Card className="mt-8 p-6 border-2 border-blue-200 bg-blue-50">
          <p className="text-sm text-blue-800">
            💡 현재 상세 페이지는 백엔드 모델 메타데이터 API가 준비되기 전까지 사용하는 임시 UI입니다.
            이후 실제 모델 요약, 버전 정보, 성능 지표를 서버 응답으로 대체하면 됩니다.
          </p>
        </Card>
      </div>
    </div>
  );
}
