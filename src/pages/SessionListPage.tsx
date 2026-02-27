import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Plus } from "lucide-react";

export function SessionListPage() {
  const navigate = useNavigate();
  const { hospital } = useAuth();
  
  const [mySessions, setMySessions] = useState<any[]>([]); 
  const [allSessions, setAllSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!hospital) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        // ✅ 무조건 백엔드에서 직접 가져옵니다.
        const [myRes, allRes] = await Promise.all([
          fetch(`/sessions/my?hospitalId=${hospital.id}`),
          fetch(`/sessions`)
        ]);

        const myData = await myRes.json();
        const allData = await allRes.json();

        setMySessions(myData);
        setAllSessions(allData);
      } catch (error) {
        console.error("데이터 로드 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [hospital, navigate]);

  if (!hospital) return null;

  // 테이블 행을 그리는 헬퍼 함수 (중복 제거)
  const renderRow = (session: any, type: 'my' | 'all') => (
    <tr key={session.sessionId} className="hover:bg-gray-50">
      <td className="px-6 py-4">
        <span className="text-gray-600 font-medium">
          {session.status === 2 ? "진행 중" : session.status === 3 ? "완료" : "대기 중"}
        </span>
      </td>
      <td className="px-6 py-4 font-medium text-[#FF9500]">
        {session.title}
      </td>
      <td className="px-6 py-4 text-center">
        {session.currentParticipants} / {session.maxParticipants}
      </td>
      <td className="px-6 py-4 text-center">
        <Button 
          size="sm" 
          style={{ backgroundColor: '#5D4037' }}
          className="text-white hover:opacity-90 w-20 rounded-md"
          onClick={() => navigate(`/session/${session.sessionId}/join`)}
          disabled={session.status === 3}
        >
          {type === 'my' ? "현황" : "참여"}
        </Button>
      </td>
    </tr>
  );

  return (
    
    <div className="min-h-screen py-12 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* 1. 상단 헤더 & 생성 버튼 */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">학습 참여</h1>
            <p className="text-gray-600">연합학습 세션에 참여하여 글로벌 모델 학습에 기여하세요</p>
          </div>
          <Button 
            onClick={() => navigate("/session/create")}
            style={{ backgroundColor: '#FF9500' }}
            className="text-white hover:opacity-90 px-6 py-2 font-bold"
          >
            <Plus className="w-4 h-4 mr-2" />
            세션 생성
          </Button>
        </div>

        {/* 2. 가이드 박스 */}
        <div className="p-8 mb-12 rounded-lg border border-[#F5E6D3]" style={{ backgroundColor: '#FFF9F5' }}>
          <h3 className="text-lg font-bold mb-4" style={{ color: '#6B3131' }}>연합학습 참여 가이드</h3>
          <div className="space-y-2 text-gray-700 text-sm">
            <p>원하는 세션의 참여하기 버튼을 클릭 후, 안내에 따라 라벨링을 진행합니다.</p>
            <p>조건 기관 수가 채워지면 학습이 자동 시작됩니다.</p>
            <p>완료된 목록은 모델 다운로드 페이지에서 다운받아 사용이 가능합니다.</p>
          </div>
        </div>

        {/* 참여 중인 세션 */}
        <div className="mb-12">
          <h3 className="text-lg font-bold mb-4 text-gray-700">참여 중인 세션</h3>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-left text-sm">
              <thead className="text-white" style={{ backgroundColor: '#5D4037' }}>
                <tr>
                  <th className="px-6 py-4">진행 상태</th>
                  <th className="px-6 py-4">세션 제목</th>
                  <th className="px-6 py-4 text-center">참여 기관</th>
                  <th className="px-6 py-4 text-center">현황</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y">
                {mySessions.length > 0 ? mySessions.map(s => renderRow(s, 'my')) : (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400">참여 중인 세션이 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 전체 세션 목록 */}
        <div>
          <h3 className="text-lg font-bold mb-4 text-gray-700">전체 세션 목록</h3>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-left text-sm">
              <thead className="text-white" style={{ backgroundColor: '#5D4037' }}>
                <tr>
                  <th className="px-6 py-4">상태</th>
                  <th className="px-6 py-4">세션 제목</th>
                  <th className="px-6 py-4 text-center">참여 기관</th>
                  <th className="px-6 py-4 text-center">참여하기</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y">
                {allSessions.length > 0 ? allSessions.map(s => renderRow(s, 'all')) : (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400">등록된 세션이 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}