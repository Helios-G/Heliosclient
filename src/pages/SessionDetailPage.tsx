import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Calendar,
  Users,
  Activity,
  Database,
  CheckCircle2,
  Clock,
  ArrowLeft,
} from "lucide-react";

interface SessionDetail {
  id: string;
  title: string;
  status: "대기 중" | "진행 중" | "완료";
  dataType: string;
  diseaseClasses: string[];
  participants: number;
  maxParticipants: number;
  createdDate: string;
  startDate?: string;
  endDate?: string;
  rounds: number;
  currentRound?: number;
  description: string;
  createdBy: string;
  participatingUsers: string[];
}

export function SessionDetailPage() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();

  // 로그인 체크
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  // 모의 데이터 (실제로는 API에서 가져와야 함)
  const getSessionData = (id: string): SessionDetail => {
    const sessions: Record<string, SessionDetail> = {
      "1": {
        id: "1",
        title: "폐암 전단 학습",
        status: "대기 중",
        dataType: "X-ray",
        diseaseClasses: [
          "특이사항 없음",
          "심장종격동 비대",
          "심장비대증",
          "폐 혼탁",
          "폐 병변",
          "폐부종",
          "폐경화",
          "폐렴",
          "무기폐",
          "기흉",
          "흉수",
          "기타 흉막 질환",
          "골절",
          "의료 보조 장치",
        ],
        participants: 2,
        maxParticipants: 5,
        createdDate: "2024-01-15",
        rounds: 10,
        description:
          "CheXpert 데이터셋을 기반으로 한 14개 클래스 흉부 X-ray 질환 분류 학습 세션입니다. 여러 병원의 데이터를 활용하여 정확도 높은 진단 AI를 개발합니다.",
        createdBy: "서울대병원",
        participatingUsers: ["서울대병원", "연세대병원"],
      },
      "2": {
        id: "2",
        title: "유방암 조기진단 AI 모",
        status: "진행 중",
        dataType: "Mammography",
        diseaseClasses: ["정상", "양성 종양", "악성 종양", "석회화"],
        participants: 5,
        maxParticipants: 5,
        createdDate: "2024-01-10",
        startDate: "2024-01-12",
        rounds: 15,
        currentRound: 8,
        description:
          "유방 촬영 영상을 통한 조기 유방암 진단 AI 모델 개발 세션입니다.",
        createdBy: "고려대병원",
        participatingUsers: [
          "고려대병원",
          "아산병원",
          "삼성서울병원",
          "세브란스병원",
          "가톨릭대병원",
        ],
      },
      "3": {
        id: "3",
        title: "피부암 분류 모델",
        status: "완료",
        dataType: "Dermoscopy",
        diseaseClasses: [
          "흑색종",
          "기저세포암",
          "편평세포암",
          "양성 병변",
          "정상",
        ],
        participants: 4,
        maxParticipants: 4,
        createdDate: "2023-12-20",
        startDate: "2023-12-22",
        endDate: "2023-12-25",
        rounds: 12,
        currentRound: 12,
        description:
          "피부경 이미지를 활용한 피부암 분류 모델 학습 세션입니다.",
        createdBy: "분당서울대병원",
        participatingUsers: [
          "분당서울대병원",
          "강남세브란스",
          "서울성모병원",
          "건국대병원",
        ],
      },
    };

    return (
      sessions[id] || {
        id,
        title: "세션 정보 없음",
        status: "대기 중",
        dataType: "Unknown",
        diseaseClasses: [],
        participants: 0,
        maxParticipants: 0,
        createdDate: "2024-01-01",
        rounds: 0,
        description: "세션 정보를 찾을 수 없습니다.",
        createdBy: "Unknown",
        participatingUsers: [],
      }
    );
  };

  const session = getSessionData(sessionId || "1");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "대기 중":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "진행 중":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "완료":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="cohere-page py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* 뒤로가기 버튼 */}
        <Button
          variant="ghost"
          onClick={() => navigate("/session/list")}
          className="mb-6 hover:bg-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          목록으로 돌아가기
        </Button>

        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 style={{ color: "#071225" }}>{session.title}</h1>
                <Badge
                  className={`${getStatusColor(session.status)} border px-3 py-1`}
                >
                  {session.status}
                </Badge>
              </div>
              <p className="text-gray-600">{session.description}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 좌측: 세션 정보 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 기본 정보 */}
            <Card className="p-6 border-2">
              <h3 className="mb-4" style={{ color: "#071225" }}>
                세션 기본 정보
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Database className="h-5 w-5 mt-0.5" style={{ color: "#0f62fe" }} />
                  <div className="flex-1">
                    <p className="text-gray-600 mb-1">데이터 형식</p>
                    <p className="font-medium">{session.dataType}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 mt-0.5" style={{ color: "#0f62fe" }} />
                  <div className="flex-1">
                    <p className="text-gray-600 mb-1">참여 기관</p>
                    <p className="font-medium">
                      {session.participants} / {session.maxParticipants} 기관
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Activity className="h-5 w-5 mt-0.5" style={{ color: "#0f62fe" }} />
                  <div className="flex-1">
                    <p className="text-gray-600 mb-1">학습 라운드</p>
                    <p className="font-medium">
                      {session.currentRound
                        ? `${session.currentRound} / ${session.rounds} 라운드`
                        : `총 ${session.rounds} 라운드`}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 mt-0.5" style={{ color: "#0f62fe" }} />
                  <div className="flex-1">
                    <p className="text-gray-600 mb-1">생성일</p>
                    <p className="font-medium">{session.createdDate}</p>
                    {session.startDate && (
                      <>
                        <p className="text-gray-600 mb-1 mt-2">시작일</p>
                        <p className="font-medium">{session.startDate}</p>
                      </>
                    )}
                    {session.endDate && (
                      <>
                        <p className="text-gray-600 mb-1 mt-2">종료일</p>
                        <p className="font-medium">{session.endDate}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* 질환 클래스 */}
            <Card className="p-6 border-2">
              <h3 className="mb-4" style={{ color: "#071225" }}>
                질환 클래스 ({session.diseaseClasses.length}개)
              </h3>
              <div className="flex flex-wrap gap-2">
                {session.diseaseClasses.map((diseaseClass, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="px-3 py-1"
                    style={{
                      borderColor: "#0f62fe",
                      color: "#071225",
                      backgroundColor: "#f7fbff",
                    }}
                  >
                    {diseaseClass}
                  </Badge>
                ))}
              </div>
            </Card>

            {/* 참여 병원 */}
            <Card className="p-6 border-2">
              <h3 className="mb-4" style={{ color: "#071225" }}>
                참여 중인 병원
              </h3>
              <div className="space-y-2">
                {session.participatingUsers.map((hosp, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-3 rounded-lg"
                    style={{ backgroundColor: "#f7fbff" }}
                  >
                    <CheckCircle2
                      className="h-4 w-4"
                      style={{ color: "#0f62fe" }}
                    />
                    <span className="font-medium">{hosp}</span>
                    {index === 0 && (
                      <Badge
                        variant="outline"
                        className="ml-auto"
                        style={{ borderColor: "#071225", color: "#071225" }}
                      >
                        생성자
                      </Badge>
                    )}
                  </div>
                ))}
                {session.participants < session.maxParticipants && (
                  <div
                    className="flex items-center gap-2 p-3 rounded-lg border-2 border-dashed"
                    style={{ borderColor: "#E0E0E0" }}
                  >
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-400">
                      {session.maxParticipants - session.participants}개 병원 대기 중
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* 우측: 액션 */}
          <div className="space-y-4">
            <Card className="p-6 border-2" style={{ backgroundColor: "#f7fbff" }}>
              <h3 className="mb-4" style={{ color: "#071225" }}>
                세션 참여
              </h3>

              {session.status === "완료" ? (
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <CheckCircle2
                      className="h-12 w-12 mx-auto mb-2"
                      style={{ color: "#4CAF50" }}
                    />
                    <p className="text-gray-600">학습이 완료되었습니다</p>
                  </div>
                  <Button
                    onClick={() => navigate(`/session/${session.id}/results`)}
                    className="w-full"
                    style={{ backgroundColor: "#0f62fe" }}
                  >
                    결과 보기
                  </Button>
                  <Button
                    onClick={() => navigate("/model/download")}
                    variant="outline"
                    className="w-full"
                    style={{ borderColor: "#071225", color: "#071225" }}
                  >
                    모델 다운로드
                  </Button>
                </div>
              ) : session.status === "진행 중" ? (
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <Activity
                      className="h-12 w-12 mx-auto mb-2"
                      style={{ color: "#0f62fe" }}
                    />
                    <p className="text-gray-600">학습이 진행 중입니다</p>
                    <p className="mt-2" style={{ color: "#071225" }}>
                      라운드 {session.currentRound} / {session.rounds}
                    </p>
                  </div>
                  <Button
                    onClick={() => navigate(`/session/${session.id}/training`)}
                    className="w-full"
                    style={{ backgroundColor: "#0f62fe" }}
                  >
                    학습 현황 보기
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <Clock
                      className="h-12 w-12 mx-auto mb-2"
                      style={{ color: "#0f62fe" }}
                    />
                    <p className="text-gray-600">참여 병원을 모집 중입니다</p>
                    <p className="mt-2" style={{ color: "#071225" }}>
                      {session.participants} / {session.maxParticipants} 기관
                    </p>
                  </div>
                  <Button
                    onClick={() => navigate(`/session/${session.id}/join`)}
                    className="w-full"
                    style={{ backgroundColor: "#0f62fe" }}
                  >
                    세션 참여하기
                  </Button>
                </div>
              )}
            </Card>

            {/* 세션 생성자 정보 */}
            <Card className="p-6 border-2">
              <h3 className="mb-4" style={{ color: "#071225" }}>
                세션 생성자
              </h3>
              <div className="text-center">
                <div
                  className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center"
                  style={{ backgroundColor: "#0f62fe" }}
                >
                  <Users className="h-8 w-8 text-white" />
                </div>
                <p className="font-medium" style={{ color: "#071225" }}>
                  {session.createdBy}
                </p>
                <p className="text-gray-500 mt-1">생성일: {session.createdDate}</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
