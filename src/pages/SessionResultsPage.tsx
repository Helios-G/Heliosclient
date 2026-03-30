import { useNavigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTrainingData } from "../contexts/TrainingDataContext";
import { useSession } from "../contexts/SessionContext";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { downloadModelFiles } from "../utils/download"; // ✅ 헬퍼 함수 import
import { 
  Download, 
  Calendar, 
  Building2, 
  Layers, 
  TrendingUp,
  Clock,
  Check
} from "lucide-react";

export function SessionResultsPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { finalMetrics } = useTrainingData();
  const { getSession } = useSession();
  const session = getSession(sessionId || "");

  // 로그인 체크
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  // ✅ [수정됨] 디자인은 그대로, 데이터만 CheXpert 결과로 변경
  const storedResult = localStorage.getItem("session_result");
  const parsedResult = storedResult ? JSON.parse(storedResult) : null;
  const resultMetrics = finalMetrics || parsedResult;
  const startTime = resultMetrics?.startTime || new Date().toLocaleString();
  const endTime = resultMetrics?.endTime || new Date().toLocaleString();
  const durationText = (() => {
    const startMs = new Date(startTime).getTime();
    const endMs = new Date(endTime).getTime();
    if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs < startMs) {
      return "계산 불가";
    }
    const totalSeconds = Math.floor((endMs - startMs) / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}분 ${seconds}초`;
  })();

  const results = {
    sessionTitle: session?.title || "연합학습 결과",
    modelArchitecture: "CheXpert-Light (Custom CNN)",
    finalAccuracy: resultMetrics?.accuracy || 0,
    finalLoss: resultMetrics?.loss || 0,
    participatingUsers: session?.targetParticipants || 0,
    totalRounds: resultMetrics?.rounds || session?.rounds || 0,
    startTime,
    endTime,
    trainingDuration: durationText,
  };

  const handleDownload = () => {
    // 방금 학습한 모델 이름으로 다운로드
    downloadModelFiles("trained_chexnet_model");
  };

  return (
    <div className="min-h-screen py-12 px-4 bg-white">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-gray-800 mb-2">학습진행 현황</h1>
          <p className="text-gray-600">{results.sessionTitle}</p>
        </div>

        {/* 메인 결과 카드 (기존 디자인 유지) */}
        <Card className="p-10 mb-8 border-2 shadow-lg">
          {/* 학습 완료 상태 배지 */}
          <div className="flex justify-center mb-8">
            <div 
              className="px-6 py-3 rounded-full"
              style={{ backgroundColor: '#E8F5E9' }}
            >
              <span className="text-green-700">✓ 학습 완료</span>
            </div>
          </div>

          {/* 학습 완료 섹션 */}
          <div className="space-y-8">
            <div>
              <h2 style={{ color: '#6B3131' }} className="mb-6 text-center">학습 완료</h2>
            </div>

            {/* 결과 요약 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 모델 구조 */}
              <div 
                className="p-6 rounded-lg border-2"
                style={{ backgroundColor: '#FFF9F5' }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Layers className="w-5 h-5" style={{ color: '#FF9500' }} />
                  <h4 style={{ color: '#6B3131' }}>모델 구조</h4>
                </div>
                <p className="text-2xl">{results.modelArchitecture}</p>
              </div>

              {/* 참여 기관 수 */}
              <div 
                className="p-6 rounded-lg border-2"
                style={{ backgroundColor: '#FFF9F5' }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Building2 className="w-5 h-5" style={{ color: '#FF9500' }} />
                  <h4 style={{ color: '#6B3131' }}>참여 기관 수</h4>
                </div>
                <p className="text-2xl">{results.participatingUsers}</p>
              </div>

              {/* 라운드 수 */}
              <div 
                className="p-6 rounded-lg border-2"
                style={{ backgroundColor: '#FFF9F5' }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <TrendingUp className="w-5 h-5" style={{ color: '#FF9500' }} />
                  <h4 style={{ color: '#6B3131' }}>총 라운드 수</h4>
                </div>
                <p className="text-2xl">{results.totalRounds} 라운드</p>
              </div>

              {/* 학습 소요 시간 */}
              <div 
                className="p-6 rounded-lg border-2"
                style={{ backgroundColor: '#FFF9F5' }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="w-5 h-5" style={{ color: '#FF9500' }} />
                  <h4 style={{ color: '#6B3131' }}>학습 소요 시간</h4>
                </div>
                <p className="text-2xl">{results.trainingDuration}</p>
              </div>
            </div>

            {/* 성능 지표 */}
            <div>
              <h3 className="mb-4" style={{ color: '#6B3131' }}>결과요약</h3>
              
              <div className="space-y-4">
                {/* 정확도 */}
                <div 
                  className="p-6 rounded-lg border-2"
                  style={{ backgroundColor: '#FFF9F5' }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 style={{ color: '#6B3131' }} className="mb-1">최종 정확도 (Accuracy)</h4>
                      <p className="text-sm text-gray-600">모델의 예측 정확도</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl" style={{ color: '#FF9500' }}>
                        {(results.finalAccuracy * 100).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Loss */}
                <div 
                  className="p-6 rounded-lg border-2"
                  style={{ backgroundColor: '#FFF9F5' }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 style={{ color: '#6B3131' }} className="mb-1">최종 손실 (Loss)</h4>
                      <p className="text-sm text-gray-600">모델의 예측 오차</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl" style={{ color: '#6B3131' }}>
                        {results.finalLoss.toFixed(4)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 학습 일정 */}
            <div>
              <h3 className="mb-4" style={{ color: '#6B3131' }}>학습 일정</h3>
              
              <div 
                className="p-6 rounded-lg border-2"
                style={{ backgroundColor: '#FFF9F5' }}
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5" style={{ color: '#FF9500' }} />
                    <div>
                      <p className="text-sm text-gray-600">학습 시작 시간</p>
                      <p className="text-lg">{results.startTime}</p>
                    </div>
                  </div>
                  <div className="border-t border-gray-200 my-3"></div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5" style={{ color: '#FF9500' }} />
                    <div>
                      <p className="text-sm text-gray-600">학습 종료 시간</p>
                      <p className="text-lg">{results.endTime}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* 액션 버튼 */}
        <div className="flex justify-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="px-8 py-6 border-2"
            style={{ borderColor: '#6B3131', color: '#6B3131' }}
          >
            홈으로 이동
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

        {/* 추가 안내 */}
        <Card className="mt-8 p-6 border-2 border-blue-200 bg-blue-50">
          <p className="text-sm text-blue-800">
            💡 다운로드한 모델은 귀 병원의 임상 진단 시스템에 통합하여 사용할 수 있습니다. 
            모델 사용 시 주의사항은 다운로드 시 제공되는 문서를 참고해주세요.
          </p>
        </Card>
      </div>
    </div>
  );
}
