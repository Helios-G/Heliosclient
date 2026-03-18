import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Plus } from "lucide-react";

export function SessionListPage() {
  const navigate = useNavigate();
  const { hospital } = useAuth();
  
  const [mySessions, setMySessions] = useState<any[]>([]); 
  const [allSessions, setAllSessions] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!hospital) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
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

  // 필터링 로직
  const filteredSessions = allSessions.filter(session => {
    if (filter === "all") return true;
    const status = session.status;
    if (filter === "recruiting") return status === 0;
    if (filter === "processing") return status === 2;
    if (filter === "completed") return status === 3;
    return true;
  });

  const renderRow = (session: any, type: 'my' | 'all') => (
    <tr key={session.sessionId} className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 border-b border-gray-100">
        <span className="text-gray-600 font-medium">
          {session.status === 2 ? "학습 중" : session.status === 3 ? "완료" : "대기 중"}
        </span>
      </td>
      <td className="px-6 py-4 border-b border-gray-100 font-medium text-[#FF9500]">
        {session.title}
      </td>
      <td className="px-6 py-4 border-b border-gray-100 text-center">
        {session.currentParticipants} / {session.maxParticipants}
      </td>
      <td className="px-6 py-4 border-b border-gray-100 text-center">
        <Button 
          size="sm" 
          style={{ backgroundColor: session.status === 3 ? '#9CA3AF' : '#5D4037' }}
          className="text-white hover:opacity-90 w-20 rounded-md"
          onClick={() => navigate(`/session/${session.sessionId}/join`)}
          disabled={session.status === 3}
        >
          {session.status === 3 ? "완료됨" : type === 'my' ? "현황" : "참여"}
        </Button>
      </td>
    </tr>
  );

  return (
    <div className="min-h-screen py-12 px-4 bg-gray-50/30 pb-24">
      <div className="max-w-6xl mx-auto">
        
        {/* 1. 상단 헤더 & 생성 버튼 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#5D4037]">학습 참여</h1>
            <p className="text-gray-500 text-sm mt-1">참여 중인 프로젝트의 현황을 확인하거나 새로운 세션에 참여하세요.</p>
          </div>
          <Button onClick={() => navigate("/session/create")} style={{ backgroundColor: '#FF9500' }} className="text-white font-bold shadow-md">
            <Plus className="w-4 h-4 mr-2" /> 세션 생성
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

        {/* 3. 참여 중인 세션 */}
        <div className="mb-12">
          <h3 className="text-lg font-bold mb-4 text-gray-700 flex items-center gap-2">
            <div className="w-1 h-5 bg-[#5D4037] rounded-full"></div> 참여 중인 세션
          </h3>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            {/* ✅ 인라인 스타일로 maxHeight 강제 지정, overflow-y-scroll 로 항상 스크롤바 영역 확보 */}
            <div style={{ maxHeight: '220px', overflowY: 'auto' }} className="w-full custom-scrollbar">
              <table className="w-full text-left text-sm table-fixed relative">
                <thead className="text-white sticky top-0 z-10 shadow-sm" style={{ backgroundColor: '#5D4037' }}>
                  <tr>
                    <th className="px-6 py-4 font-medium w-[15%]">진행 상태</th>
                    <th className="px-6 py-4 font-medium w-[55%]">세션 제목</th>
                    <th className="px-6 py-4 font-medium text-center w-[15%]">참여 기관</th>
                    <th className="px-6 py-4 font-medium text-center w-[15%]">현황</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {mySessions.length > 0 ? mySessions.map(s => renderRow(s, 'my')) : (
                    <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400">참여 중인 세션이 없습니다.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 4. 세션 목록 필터바 */}
        <div className="flex items-center gap-4 mb-6 mt-8">
          <span className="text-gray-700 font-bold">세션 목록 필터</span>
          <div className="flex gap-2">
            {['all', 'recruiting', 'processing', 'completed'].map((f) => (
              <Button 
                key={f}
                variant="outline"
                onClick={() => setFilter(f)}
                style={{
                  backgroundColor: filter === f ? '#FF9500' : 'white',
                  color: filter === f ? 'white' : '#FF9500',
                  borderColor: '#FF9500'
                }}
                className="px-4 py-1 h-8 text-xs font-bold rounded-full transition-colors"
              >
                {f === 'all' ? '전체' : f === 'recruiting' ? '대기 중' : f === 'processing' ? '진행 중' : '완료'}
              </Button>
            ))}
          </div>
        </div>

        {/* 5. 전체 세션 목록 */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-10">
          {/* ✅ 인라인 스타일로 maxHeight 450px 강제 지정 */}
          <div style={{ maxHeight: '450px', overflowY: 'auto' }} className="w-full custom-scrollbar">
            <table className="w-full text-left text-sm table-fixed relative">
              <thead className="text-white sticky top-0 z-10 shadow-sm" style={{ backgroundColor: '#5D4037' }}>
                <tr>
                  <th className="px-6 py-4 font-medium w-[15%]">상태</th>
                  <th className="px-6 py-4 font-medium w-[55%]">세션 제목</th>
                  <th className="px-6 py-4 font-medium text-center w-[15%]">참여 기관</th>
                  <th className="px-6 py-4 font-medium text-center w-[15%]">참여하기</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredSessions.length > 0 ? filteredSessions.map(s => renderRow(s, 'all')) : (
                  <tr><td colSpan={4} className="px-6 py-20 text-center text-gray-400">등록된 세션이 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}