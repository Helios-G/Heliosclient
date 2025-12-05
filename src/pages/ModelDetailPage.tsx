import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { ArrowLeft, Download } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";

export function ModelDetailPage() {
  const { modelId } = useParams();
  const navigate = useNavigate();
  const { hospital } = useAuth();

  // 로그인 체크
  useEffect(() => {
    if (!hospital) {
      navigate("/login");
    }
  }, [hospital, navigate]);

  if (!hospital) {
    return null;
  }

  // 모델 상세 정보 (실제로는 API에서 가져옴)
  const modelDetail = {
    title: "세션 제목/사용 데이터셋 (version)",
    updatedTime: "updated 5 hours ago",
    participatingHospitals: ["이산병원", "서울 중앙병원", "연세내과"],
    rounds: 3,
    learningRate: "자동",
    performance: {
      finalAccuracy: 94.2,
      finalLoss: 0.156,
      precision: 93.8,
      recall: 94.6,
      f1Score: 94.2
    },
    trainingHistory: [
      { round: 0, accuracy: 0.50, loss: 2.0 },
      { round: 1, accuracy: 0.78, loss: 1.2 },
      { round: 2, accuracy: 0.88, loss: 0.6 },
      { round: 3, accuracy: 0.942, loss: 0.156 }
    ],
    modelArchitecture: "ResNet-50",
    totalParameters: "25.6M",
    modelSize: "245 MB",
    framework: "TensorFlow 2.15",
    datasetInfo: {
      totalSamples: 15000,
      trainingSamples: 12000,
      validationSamples: 3000,
      classes: ["정상", "이상"],
      augmentation: "회전, 반전, 밝기 조정"
    },
    trainingConfig: {
      batchSize: 32,
      optimizer: "Adam",
      initialLearningRate: 0.001,
      lossFunction: "Categorical Crossentropy"
    },
    startTime: "2025-12-04 10:00:00",
    endTime: "2025-12-04 12:30:00",
    duration: "2시간 30분"
  };

  const handleDownload = () => {
    alert("모델 다운로드가 시작됩니다.");
  };

  return (
    <div className="min-h-screen py-12 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/download")}
            className="mb-4 -ml-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            목록으로 돌아가기
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-gray-800 mb-2">{modelDetail.title}</h1>
              <p className="text-gray-600">{modelDetail.updatedTime}</p>
            </div>
            <Button
              style={{ backgroundColor: '#FF9500' }}
              className="text-white hover:opacity-90 px-6 py-6"
              onClick={handleDownload}
            >
              <Download className="w-5 h-5 mr-2" />
              모델 다운로드
            </Button>
          </div>
        </div>

        {/* 참여 기관 */}
        <Card className="p-6 mb-6 border-2" style={{ backgroundColor: '#F5F5F5' }}>
          <p className="text-gray-700">
            <span style={{ color: '#6B3131' }}>참여 기관:</span>{" "}
            {modelDetail.participatingHospitals.join(", ")}
          </p>
        </Card>

        {/* 기본 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 border-2">
            <p className="text-sm text-gray-600 mb-1">라운드 수</p>
            <p className="text-2xl" style={{ color: '#6B3131' }}>
              {modelDetail.rounds}
            </p>
          </Card>
          <Card className="p-6 border-2">
            <p className="text-sm text-gray-600 mb-1">러닝률</p>
            <p className="text-2xl" style={{ color: '#6B3131' }}>
              {modelDetail.learningRate}
            </p>
          </Card>
          <Card className="p-6 border-2">
            <p className="text-sm text-gray-600 mb-1">모델 아키텍처</p>
            <p className="text-2xl" style={{ color: '#6B3131' }}>
              {modelDetail.modelArchitecture}
            </p>
          </Card>
        </div>

        {/* 성능 */}
        <Card className="p-8 mb-8 border-2">
          <h2 style={{ color: '#6B3131' }} className="mb-6">모델 성능</h2>
          
          {/* 주요 성능 지표 */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div 
              className="p-6 rounded-lg border-2 text-center"
              style={{ backgroundColor: '#FFF9F5' }}
            >
              <p className="text-sm text-gray-600 mb-2">Accuracy</p>
              <p className="text-3xl" style={{ color: '#FF9500' }}>
                {modelDetail.performance.finalAccuracy}%
              </p>
            </div>
            <div 
              className="p-6 rounded-lg border-2 text-center"
              style={{ backgroundColor: '#FFF9F5' }}
            >
              <p className="text-sm text-gray-600 mb-2">Loss</p>
              <p className="text-3xl" style={{ color: '#6B3131' }}>
                {modelDetail.performance.finalLoss}
              </p>
            </div>
          </div>

          {/* 성능 시각화 그래프 */}
          <div className="space-y-8">
            <div>
              <h3 className="mb-4" style={{ color: '#6B3131' }}>학습 과정 - Accuracy 변화</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={modelDetail.trainingHistory}>
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
                    name="Accuracy"
                    dot={{ fill: '#FF9500', r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h3 className="mb-4" style={{ color: '#6B3131' }}>학습 과정 - Loss 변화</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={modelDetail.trainingHistory}>
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
                    name="Loss"
                    dot={{ fill: '#6B3131', r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* 모델 구조 및 상세 정보 */}
        <Card className="p-8 mb-8 border-2">
          <h2 style={{ color: '#6B3131' }} className="mb-6">학습 상세 정보</h2>
          
          <div className="space-y-6">
            {/* 모델 아키텍처 */}
            <div>
              <h3 className="mb-3" style={{ color: '#6B3131' }}>모델 아키텍처</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg" style={{ backgroundColor: '#FFF9F5' }}>
                  <p className="text-sm text-gray-600 mb-1">네트워크</p>
                  <p>{modelDetail.modelArchitecture}</p>
                </div>
              </div>
            </div>

            {/* 학습 설정 */}
            <div>
              <h3 className="mb-3" style={{ color: '#6B3131' }}>학습 설정</h3>
              <div className="p-6 rounded-lg" style={{ backgroundColor: '#FFF9F5' }}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">배치 크기</p>
                    <p className="text-lg">{modelDetail.trainingConfig.batchSize}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">옵티마이저</p>
                    <p className="text-lg">{modelDetail.trainingConfig.optimizer}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">초기 학습률</p>
                    <p className="text-lg">{modelDetail.trainingConfig.initialLearningRate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">손실 함수</p>
                    <p className="text-lg">{modelDetail.trainingConfig.lossFunction}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 학습 시간 */}
            <div>
              <h3 className="mb-3" style={{ color: '#6B3131' }}>학습 일정</h3>
              <div className="p-6 rounded-lg" style={{ backgroundColor: '#FFF9F5' }}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">시작 시간</p>
                    <p className="text-lg">{modelDetail.startTime}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">종료 시간</p>
                    <p className="text-lg">{modelDetail.endTime}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">소요 시간</p>
                    <p className="text-lg">{modelDetail.duration}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* 사용 가이드 */}
        <Card className="p-6 border-2 border-blue-200 bg-blue-50">
          <h3 className="mb-3 text-blue-900">모델 사용 가이드</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>• 다운로드한 모델은 TensorFlow 2.x 이상에서 사용 가능합니다.</p>
            <p>• 입력 이미지 크기: 224x224 픽셀 (RGB)</p>
            <p>• 전처리: 이미지 정규화 필요 (0-1 범위)</p>
            <p>• 출력: Softmax 확률 분포 (각 클래스별 확률)</p>
            <p>• 의료 진단 보조 목적으로만 사용하며, 최종 진단은 전문의가 수행해야 합니다.</p>
          </div>
        </Card>

        {/* 하단 버튼 */}
        <div className="mt-8 flex justify-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate("/download")}
            className="px-8 py-6"
          >
            목록으로
          </Button>
          <Button
            style={{ backgroundColor: '#FF9500' }}
            className="text-white hover:opacity-90 px-8 py-6"
            onClick={handleDownload}
          >
            <Download className="w-5 h-5 mr-2" />
            모델 다운로드
          </Button>
        </div>
      </div>
    </div>
  );
}