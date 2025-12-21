import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useSession } from "../contexts/SessionContext";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Plus } from "lucide-react";

export function SessionListPage() {
  const navigate = useNavigate();
  const { hospital } = useAuth();
  const { sessions } = useSession();
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!hospital) {
      navigate("/login");
    }
  }, [hospital, navigate]);

  if (!hospital) return null;

  // 필터링 로직
  const filteredSessions = sessions.filter(session => {
    if (filter === "all") return true;
    const status = session.status || "waiting"; 
    if (filter === "recruiting") return status === "waiting";
    if (filter === "processing") return status === "running";
    if (filter === "completed") return status === "completed";
    return true;
  });

  // 참여 중인 세션 (데모용: 첫 번째 세션)
  const mySessions = sessions.length > 0 ? [sessions[0]] : [];

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

        {/* 3. 참여 중인 세션 */}
        <div className="mb-12">
          <h3 className="text-lg font-bold mb-4 text-gray-700">참여 중인 세션</h3>
          
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">
              <thead className="text-white" style={{ backgroundColor: '#6B3131' }}>
                <tr>
                  <th scope="col" className="px-6 py-4 font-medium w-[15%]">진행 상태</th>
                  <th scope="col" className="px-6 py-4 font-medium w-[55%]">세션 제목</th>
                  <th scope="col" className="px-6 py-4 font-medium text-center w-[15%]">참여 기관 수</th>
                  <th scope="col" className="px-6 py-4 font-medium text-center w-[15%]">현황</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 border-t border-gray-100">
                {mySessions.map((session) => (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="text-gray-600 font-medium">
                        {session.status === 'running' ? '진행 중' : '대기 중'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-[#FF9500]">
                      {session.title}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {session.participants} / {session.targetParticipants}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Button 
                        size="sm" 
                        style={{ backgroundColor: '#6B3131' }}
                        className="text-white hover:opacity-90 w-20 rounded-md"
                        onClick={() => navigate(`/session/${session.id}/join`)}
                      >
                        현황
                      </Button>
                    </td>
                  </tr>
                ))}
                {/* 빈 행 (디자인 유지용) */}
                <tr>
                  <td className="px-6 py-4 text-gray-400">진행 중</td>
                  <td className="px-6 py-4 text-gray-400">-</td>
                  <td className="px-6 py-4 text-center text-gray-400">-</td>
                  <td className="px-6 py-4 text-center text-gray-400">-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. 세션 목록 필터 (✅ 스타일 수정됨) */}
        <div className="flex items-center gap-4 mb-4">
          <span className="text-gray-700 font-medium">세션 목록 필터</span>
          <div className="flex gap-2">
            {[
              { id: 'all', label: '전체' },
              { id: 'recruiting', label: '대기 중' },
              { id: 'processing', label: '진행 중' },
              { id: 'completed', label: '완료' }
            ].map((btn) => {
              const isActive = filter === btn.id;
              return (
                <button
                  key={btn.id}
                  onClick={() => setFilter(btn.id)}
                  className="px-4 py-1.5 text-sm rounded-md border transition-colors"
                  style={{
                    // ✅ 인라인 스타일로 색상 강제 지정 (충돌 방지)
                    backgroundColor: isActive ? '#FF9500' : 'white',
                    color: isActive ? 'white' : '#FF9500',
                    borderColor: '#FF9500',
                    fontWeight: isActive ? 'bold' : 'normal',
                    cursor: 'pointer'
                  }}
                >
                  {btn.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. 전체 세션 목록 테이블 */}
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">
            <thead className="text-white" style={{ backgroundColor: '#6B3131' }}>
              <tr>
                <th scope="col" className="px-6 py-4 font-medium w-[15%]">진행 상태</th>
                <th scope="col" className="px-6 py-4 font-medium w-[55%]">세션 제목</th>
                <th scope="col" className="px-6 py-4 font-medium text-center w-[15%]">참여 기관 수</th>
                <th scope="col" className="px-6 py-4 font-medium text-center w-[15%]">참여하기</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 border-t border-gray-100">
              {filteredSessions.map((session) => (
                <tr key={session.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="text-gray-600 font-medium">
                      {session.status === "running" ? "진행 중" :
                       session.status === "completed" ? "완료" : "대기 중"}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-[#FF9500]">
                    {session.title}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {session.participants || 0} / {session.targetParticipants || 5}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Button 
                      size="sm"
                      style={{ backgroundColor: '#6B3131' }}
                      className="text-white hover:opacity-90 w-20 rounded-md"
                      onClick={() => navigate(`/session/${session.id}/join`)}
                      disabled={session.status === "completed"}
                    >
                      {session.status === "completed" ? "완료됨" : "참여"}
                    </Button>
                  </td>
                </tr>
              ))}
              
              {filteredSessions.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    해당하는 세션이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}