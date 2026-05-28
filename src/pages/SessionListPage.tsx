import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { authFetch } from "../lib/authFetch";
import { Button } from "../components/ui/button";
import { Activity, Database, Plus, Users } from "lucide-react";
import { readApiData } from "../lib/api";
import { CohereMetricCard, CoherePage, CoherePageHeader } from "../components/CoherePage";

export function SessionListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [mySessions, setMySessions] = useState<any[]>([]); 
  const [allSessions, setAllSessions] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");
        const [myRes, allRes] = await Promise.all([
          authFetch(`/sessions/my`),
          authFetch(`/sessions`)
        ]);

        if (!myRes.ok || !allRes.ok) {
          throw new Error("세션 목록을 불러오지 못했습니다.");
        }

        const myData = await readApiData<any[]>(myRes);
        const allData = await readApiData<any[]>(allRes);

        setMySessions(Array.isArray(myData) ? myData : []);
        setAllSessions(Array.isArray(allData) ? allData : []);
      } catch (error) {
        console.error("데이터 로드 실패:", error);
        setMySessions([]);
        setAllSessions([]);
        setErrorMessage(error instanceof Error ? error.message : "데이터 로드 실패");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);

  if (!user) return null;

  // 필터링 로직
  const filteredSessions = allSessions.filter(session => {
    if (filter === "all") return true;
    const status = session.status;
    if (filter === "recruiting") return status === "WAITING";
    if (filter === "processing") return status === "IN_PROGRESS";
    if (filter === "completed") return status === "COMPLETED";
    return true;
  });

  const renderRow = (session: any, type: 'my' | 'all') => (
    <tr key={session.sessionId} className="transition-colors hover:bg-blue-50/50">
      <td className="border-b border-slate-100 px-6 py-4">
        <span className="inline-flex rounded bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
          {session.status === "IN_PROGRESS" ? "학습 중" 
            : session.status === "COMPLETED" ? "완료" 
            : "대기 중"}
        </span>
      </td>
      <td className="border-b border-slate-100 px-6 py-4 font-semibold text-slate-950">
        {session.title}
      </td>
      <td className="border-b border-slate-100 px-6 py-4 text-center text-slate-700">
        {session.currentParticipants} / {session.maxParticipants}
      </td>
      <td className="border-b border-slate-100 px-6 py-4 text-center">
        <Button 
          size="sm" 
          className={`w-20 rounded-md text-white ${
            session.status === "COMPLETED"
              ? "bg-slate-400 hover:bg-slate-400"
              : "bg-[#0f62fe] hover:bg-[#0043ce]"
          }`}
          onClick={() => navigate(`/session/${session.sessionId}/join`)}
          disabled={session.status === "COMPLETED"}
        >
          {session.status === "COMPLETED" ? "완료됨" : type === 'my' ? "현황" : "참여"}
        </Button>
      </td>
    </tr>
  );

  return (
    <CoherePage wide className="pb-24">
      <CoherePageHeader
        eyebrow="Session Console"
        title="학습 참여"
        description="참여 중인 세션의 준비 상태를 확인하거나 새 연합학습 세션을 생성하세요."
        actions={
          <Button onClick={() => navigate("/session/create")} className="cohere-gradient-button">
            <Plus className="w-4 h-4 mr-2" /> 세션 생성
          </Button>
        }
      />

      <div className="cohere-stat-grid mb-8">
        <CohereMetricCard label="전체 세션" value={allSessions.length} caption="현재 조회 가능한 연구 세션" />
        <CohereMetricCard label="참여 중" value={mySessions.length} caption="내 기관이 연결된 세션" tone="cyan" />
        <CohereMetricCard
          label="진행 중"
          value={allSessions.filter((session) => session.status === "IN_PROGRESS").length}
          caption="학습 라운드가 실행 중인 세션"
          tone="violet"
        />
      </div>

        <div className="cohere-surface mb-10 grid gap-5 p-6 md:grid-cols-3">
          <div className="flex gap-3">
            <Database className="mt-1 h-5 w-5 text-[#0f62fe]" />
            <div>
              <h3 className="font-semibold text-slate-950">라벨링 준비</h3>
              <p className="mt-1 text-sm text-slate-600">세션 참여 후 데이터 라벨링을 진행합니다.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Users className="mt-1 h-5 w-5 text-[#0f62fe]" />
            <div>
              <h3 className="font-semibold text-slate-950">기관 모집</h3>
              <p className="mt-1 text-sm text-slate-600">목표 기관 수가 채워지면 학습이 시작됩니다.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Activity className="mt-1 h-5 w-5 text-[#0f62fe]" />
            <div>
              <h3 className="font-semibold text-slate-950">결과 활용</h3>
              <p className="mt-1 text-sm text-slate-600">완료된 결과는 모델 다운로드와 진단실에서 활용합니다.</p>
            </div>
          </div>
          <div className="md:col-span-3">
            {errorMessage && <p className="text-red-600">{errorMessage}</p>}
          </div>
        </div>

        {/* 3. 참여 중인 세션 */}
        <div className="mb-12">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
            <div className="h-5 w-1 rounded-full bg-[#0f62fe]"></div> 참여 중인 세션
          </h3>
          <div className="cohere-table-shell">
            <div style={{ maxHeight: '220px', overflowY: 'auto' }} className="w-full custom-scrollbar">
              <table className="w-full text-left text-sm table-fixed relative">
                <thead className="sticky top-0 z-10 bg-[#101828] text-white shadow-sm">
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
        <div className="mb-6 mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <span className="font-semibold text-slate-800">세션 목록 필터</span>
          <div className="flex flex-wrap gap-2">
            {['all', 'recruiting', 'processing', 'completed'].map((f) => (
              <Button 
                key={f}
                variant="outline"
                onClick={() => setFilter(f)}
                className={`h-8 rounded-md border px-4 py-1 text-xs font-semibold transition-colors ${
                  filter === f
                    ? "border-[#0f62fe] bg-[#0f62fe] text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                {f === 'all' ? '전체' : f === 'recruiting' ? '대기 중' : f === 'processing' ? '진행 중' : '완료'}
              </Button>
            ))}
          </div>
        </div>

        {/* 5. 전체 세션 목록 */}
        <div className="mb-10 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div style={{ maxHeight: '450px', overflowY: 'auto' }} className="w-full custom-scrollbar">
            <table className="w-full text-left text-sm table-fixed relative">
              <thead className="sticky top-0 z-10 bg-[#101828] text-white shadow-sm">
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
    </CoherePage>
  );
}
