import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useSession } from "../contexts/SessionContext";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { authFetch } from "../lib/authFetch";
import { readApiData, readApiErrorMessage } from "../lib/api";

import { 
  Database, 
  Users, 
  Tag, 
  Wand2, 
  MousePointerClick,
  Cpu,
  Loader2,
  ShieldCheck
} from "lucide-react";
import { CohereMetricCard, CoherePage, CoherePageHeader } from "../components/CoherePage";
import { inferTaskType, isSegmentationTask, labelForTaskType, SEGMENTATION_TASK } from "../lib/taskTypes";

export function SessionJoinPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getSession, upsertSession } = useSession();

  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const normalizeSession = (raw: any) => {
    let classNames: string[] = [];
    if (Array.isArray(raw.classList)) {
      classNames = raw.classList;
    } else if (Array.isArray(raw.classNames)) {
      classNames = raw.classNames;
    } else if (typeof raw.labelClassList === "string" && raw.labelClassList.length > 0) {
      classNames = raw.labelClassList.split(",").map((item: string) => item.trim());
    }

    return {
      id: String(raw.sessionId ?? raw.id ?? sessionId ?? ""),
      title: raw.title ?? "제목 없음",
      dataType: raw.dataFormat ?? raw.dataType ?? "X-ray",
      classNames,
      taskType: inferTaskType({ ...raw, classNames }),
      algorithm: raw.algorithm ?? "FedAvg",
      rounds: raw.rounds ?? 5,
      createdAt: raw.createdAt ?? new Date().toISOString(),
      createdBy: raw.createdBy ?? "unknown",
      status:
        raw.status === "IN_PROGRESS"
          ? "running"
          : raw.status === "COMPLETED"
            ? "completed"
            : "waiting",
      participants: raw.currentParticipants ?? raw.participants ?? 0,
      targetParticipants: raw.maxParticipants ?? raw.memberCount ?? 0,
    } as const;
  };

  useEffect(() => {
    // ✅ [나중에 인증 붙이면 주석 해제]
    // if (!user) {
    //   navigate("/login");
    //   return;
    // }

    const fetchSessionDetail = async () => {
      setIsLoading(true);
      try {
        const localSession = getSession(sessionId || "");
        
        const response = await authFetch(`/sessions/${sessionId}`);
        if (response.ok) {
          const serverSession = await readApiData<any>(response);
          console.log("🔍 백엔드에서 로드된 데이터:", serverSession);
          setSession(serverSession);
          const normalized = normalizeSession(serverSession);
          const currentLocal = getSession(normalized.id);
          if (JSON.stringify(currentLocal) !== JSON.stringify(normalized)) {
            upsertSession(normalized);
          }
        } else if (localSession) {
          console.log("🔍 로컬 메모리에서 로드된 데이터:", localSession);
          setSession(localSession);
        } else {
          alert("세션 정보를 찾을 수 없습니다.");
          navigate("/session/list");
        }
      } catch (err) {
        console.error("세션 로드 실패:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessionDetail();
  }, [sessionId]);

  // ✅ [나중에 인증 붙이면 주석 해제]
  // if (!user) return null;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f8fb]">
        <Loader2 className="h-8 w-8 animate-spin text-[#0f62fe]" />
        <span className="ml-3 font-medium text-slate-700">세션 데이터 동기화 중...</span>
      </div>
    );
  }

  if (!session) return null;

  // ==========================================
  // 🔍 [에러 방지 핵심 로직] 데이터 정규화
  // ==========================================

  let displayClasses: string[] = [];
  if (Array.isArray(session.classList)) {
    displayClasses = session.classList;
  } else if (Array.isArray(session.classNames)) {
    displayClasses = session.classNames;
  } else if (typeof session.labelClassList === 'string' && session.labelClassList.length > 0) {
    displayClasses = session.labelClassList.split(',').map((s: string) => s.trim());
  }

  const classCount = session.labelClassCount || session.classAmount || displayClasses.length || 0;
  const currentParticipants = session.currentParticipants || session.participants || 0;
  const maxParticipants = session.maxParticipants || session.memberCount || 5;
  const dataFormat = session.dataFormat || session.dataType || "X-ray";
  const taskType = inferTaskType({ ...session, classNames: displayClasses });

  // URL 파라미터 우선 허용, 없으면 로그인 사용자 ID 사용
  // 세션 참여 신청 후 라벨링 페이지로 이동
  const handleJoin = async (type: 'auto' | 'manual' | 'segmentation') => {
    if (!user?.id) {
      alert("로그인 사용자 정보를 확인할 수 없습니다. 다시 로그인해주세요.");
      navigate("/login");
      return;
    }

    try {
      const res = await authFetch(`/sessions/${sessionId}/join`, {
        method: "POST"
      });
      if (!res.ok) {
        const errorMessage = await readApiErrorMessage(res, "참여 신청 실패");
        if (errorMessage === "이미 참여 신청한 세션입니다.") {
          navigate(`/session/${sessionId}/labeling/${taskType === SEGMENTATION_TASK ? "segmentation" : type}`);
          return;
        }

        alert(errorMessage);
        return;
      }
      await readApiData(res);
      navigate(`/session/${sessionId}/labeling/${taskType === SEGMENTATION_TASK ? "segmentation" : type}`);
    } catch (e) {
      console.error("참여 신청 실패:", e);
      alert("참여 신청 중 오류가 발생했습니다.");
    }
  };

  // ==========================================

  return (
    <CoherePage>
        <CoherePageHeader
          eyebrow="Session Intake"
          title="세션 참여하기"
          description="선택한 세션의 계약 정보를 확인하고 라벨링 방식을 선택하세요."
        />

        <Card className="cohere-surface mb-10 p-8 shadow-none">
          <div className="mb-6 border-b border-slate-200 pb-4">
            <h2 className="text-2xl font-semibold text-slate-950">
              {session.title || "제목 없음"}
            </h2>
          </div>

          <div className="space-y-8">
            <div className="cohere-stat-grid">
              <CohereMetricCard label="데이터 형식" value={dataFormat} caption="세션 도메인" />
              <CohereMetricCard label="Task" value={labelForTaskType(taskType)} caption={isSegmentationTask({ ...session, classNames: displayClasses }) ? "병변 mask" : "라벨 분류"} tone="cyan" />
              <CohereMetricCard label="알고리즘" value={session.algorithm || "FedAvg"} caption="연합학습 집계 방식" tone="violet" />
            </div>

            <div>
              <div className="mb-3 flex items-center gap-2 text-slate-500">
                <Tag className="w-4 h-4" />
                <span className="text-sm font-medium">질환 목록</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {displayClasses.length > 0 ? (
                  displayClasses.map((name: string, index: number) => (
                    <Badge key={index} className="bg-blue-50 text-[#0f62fe] hover:bg-blue-50">
                      {name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-gray-400 text-sm italic">등록된 질환 정보가 없습니다.</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/70 p-4">
              <div className="flex items-center gap-2 text-slate-600">
                <Users className="w-5 h-5" />
                <span className="font-medium">참여 현황</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-2xl font-semibold text-[#0f62fe]">
                  {currentParticipants} / {maxParticipants}
                </span>
                <span className="text-sm text-gray-500">기관 참여 중</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <div>
            <p className="cohere-eyebrow">Choose workflow</p>
            <h3 className="cohere-section-title mt-2">라벨링 방법 선택</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card
              className="group cursor-pointer border border-slate-200 bg-white/84 p-6 shadow-sm transition-all hover:border-[#0f62fe] hover:shadow-md"
              onClick={() => handleJoin(taskType === SEGMENTATION_TASK ? 'segmentation' : 'auto')}
            >
              <div className="flex items-start gap-4">
                <div className="rounded-md bg-blue-50 p-3 group-hover:bg-blue-100">
                  <Wand2 className="h-6 w-6 text-[#0f62fe]" />
                </div>
                <div>
                  <h4 className="mb-2 font-semibold text-slate-950">자동 라벨링</h4>
                  <p className="mb-4 text-sm leading-6 text-slate-600">
                    {taskType === SEGMENTATION_TASK
                      ? "브라우저 TF.js 모델이 있으면 병변 mask를 자동 생성하고, 없으면 수동 검수로 이어집니다."
                      : "AI 모델을 사용하여 수천 장의 의료 영상을 몇 분 안에 자동으로 라벨링합니다."}
                  </p>
                </div>
              </div>
            </Card>

            <Card
              className="group cursor-pointer border border-slate-200 bg-white/84 p-6 shadow-sm transition-all hover:border-[#0f62fe] hover:shadow-md"
              onClick={() => handleJoin(taskType === SEGMENTATION_TASK ? 'segmentation' : 'manual')}
            >
              <div className="flex items-start gap-4">
                <div className="rounded-md bg-blue-50 p-3 group-hover:bg-blue-100">
                  <MousePointerClick className="h-6 w-6 text-[#0f62fe]" />
                </div>
                <div>
                  <h4 className="mb-2 font-semibold text-slate-950">수동 라벨링</h4>
                  <p className="mb-4 text-sm leading-6 text-slate-600">
                    {taskType === SEGMENTATION_TASK
                      ? "브러시와 지우개로 X-ray 병변 mask를 직접 작성합니다."
                      : "이미지를 하나씩 직접 확인하며 정확하게 라벨링을 수행합니다. (검수용으로 추천)"}
                  </p>
                </div>
              </div>
            </Card>
          </div>
          <div className="cohere-check-item">
            <ShieldCheck className="h-5 w-5" />
            <div>
              <strong>데이터는 브라우저 흐름 안에서 처리됩니다.</strong>
              <p>선택한 방식에 따라 라벨링이 끝나면 학습 데이터가 다음 단계로 전달됩니다.</p>
            </div>
          </div>
        </div>
    </CoherePage>
  );
}
