import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";

type SessionStatus = "전체" | "진행중" | "열림" | "완료";
type SessionState = "대기 중" | "진행 중" | "완료";

interface Session {
  id: string;
  status: SessionState;
  title: string;
  participants: number;
  maxParticipants: number;
  progress: string;
}

export function SessionListPage() {
  const navigate = useNavigate();
  const { hospital } = useAuth();
  const [filter, setFilter] = useState<SessionStatus>("전체");

  // 로그인 체크
  useEffect(() => {
    if (!hospital) {
      navigate("/login");
    }
  }, [hospital, navigate]);

  if (!hospital) {
    return null;
  }

  // 모의 데이터
  const allSessions: Session[] = [
    {
      id: "1",
      status: "대기 중",
      title: "폐암 전단 학습",
      participants: 2,
      maxParticipants: 5,
      progress: "대기"
    },
    {
      id: "2",
      status: "진행 중",
      title: "유방암 조기진단 AI 모",
      participants: 5,
      maxParticipants: 5,
      progress: "진행중"
    },
    {
      id: "3",
      status: "완료",
      title: "피부암 분류 모델",
      participants: 4,
      maxParticipants: 4,
      progress: "완료"
    },
  ];

  const filterSessions = (sessions: Session[]) => {
    if (filter === "전체") return sessions;
    if (filter === "진행중") return sessions.filter(s => s.status === "진행 중");
    if (filter === "열림") return sessions.filter(s => s.status === "대기 중");
    if (filter === "완료") return sessions.filter(s => s.status === "완료");
    return sessions;
  };

  const filteredSessions = filterSessions(allSessions);

  const handleSessionClick = (sessionId: string) => {
    navigate(`/session/${sessionId}`);
  };

  return (
    <div className="min-h-screen py-12 px-4" style={{ backgroundColor: '#FFF5EB' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 style={{ color: '#6B3131' }}>학습 참여</h1>
            <p className="mt-2 text-gray-600">연합학습 세션에 참여하여 글로벌 모델 학습에 기여하세요</p>
          </div>
          <Button
            onClick={() => navigate("/session/create")}
            style={{ backgroundColor: '#FF9500' }}
            className="text-white hover:opacity-90 px-6 py-6"
          >
            세션 생성
          </Button>
        </div>

        {/* 연합학습 가이드 */}
        <Card className="p-6 mb-8 border-2" style={{ backgroundColor: '#FFF9F5' }}>
          <h3 className="mb-4" style={{ color: '#6B3131' }}>연합학습 참여 가이드</h3>
          <div className="space-y-2 text-gray-700">
            <p>
              <span style={{ color: '#6B3131' }}>최하는 세션의 참여하기 버튼 클릭 후,</span> 안내에 따라 라벨링을 진행 한 후 참여 대기 신청을 완료하면
            </p>
            <p>
              조건 기관 수 채워질 때 자동 실행 됨
            </p>
            <p>
              <span style={{ color: '#6B3131' }}>완료된 목록은</span> 모델 다운로드 페이지서 확인 참여 이메일서 확인 가능
            </p>
          </div>
        </Card>

        {/* 참여 중인 세션 */}
        <div className="mb-8">
          <h3 className="mb-4" style={{ color: '#6B3131' }}>참여 중인 세션</h3>
          
          <div className="border-2 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow style={{ backgroundColor: '#6B3131' }}>
                  <TableHead className="text-white">진행 상태</TableHead>
                  <TableHead className="text-white">세션 제목</TableHead>
                  <TableHead className="text-white">참여 기관 수</TableHead>
                  <TableHead className="text-white">현황</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>대기 중</TableCell>
                  <TableCell 
                    className="cursor-pointer hover:underline"
                    style={{ color: '#FF9500' }}
                    onClick={() => handleSessionClick("1")}
                  >
                    폐암 전단 학습
                  </TableCell>
                  <TableCell>2/5</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      style={{ backgroundColor: '#6B3131' }}
                      className="text-white hover:opacity-90"
                    >
                      현황
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>진행 중</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        {/* 세션 목록 필터 */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <h3 style={{ color: '#6B3131' }}>세션 목록 필터</h3>
            <div className="flex gap-2">
              {(["전체", "진행중", "열림", "완료"] as SessionStatus[]).map((status) => (
                <Button
                  key={status}
                  variant={filter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(status)}
                  style={
                    filter === status
                      ? { backgroundColor: '#FF9500', color: 'white' }
                      : { borderColor: '#FF9500', color: '#FF9500' }
                  }
                  className={filter === status ? "" : "hover:bg-orange-50"}
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* 세션 목록 테이블 */}
        <div className="border-2 rounded-lg overflow-hidden mb-8">
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow style={{ backgroundColor: '#6B3131' }}>
                  <TableHead className="text-white">진행 상태</TableHead>
                  <TableHead className="text-white">세션 제목</TableHead>
                  <TableHead className="text-white">참여 기관 수</TableHead>
                  <TableHead className="text-white">참여하기</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>{session.status}</TableCell>
                    <TableCell 
                      className="cursor-pointer hover:underline"
                      style={{ color: '#FF9500' }}
                      onClick={() => handleSessionClick(session.id)}
                    >
                      {session.title}
                    </TableCell>
                    <TableCell>
                      {session.participants}/{session.maxParticipants}
                    </TableCell>
                    <TableCell>
                      {session.status !== "완료" ? (
                        <Button
                          size="sm"
                          style={{ backgroundColor: '#6B3131' }}
                          className="text-white hover:opacity-90"
                          onClick={() => navigate(`/session/${session.id}/join`)}
                        >
                          참여
                        </Button>
                      ) : (
                        <span className="text-gray-400">완료됨</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}