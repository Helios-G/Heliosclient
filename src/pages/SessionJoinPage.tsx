import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useSession } from "../contexts/SessionContext";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { authFetch } from "../lib/authFetch";

import { 
  Database, 
  Users, 
  Tag, 
  Wand2, 
  MousePointerClick,
  Cpu,
  Loader2 
} from "lucide-react";

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
          const serverSession = await response.json();
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        <span className="ml-3 font-medium">세션 데이터 동기화 중...</span>
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

  // URL 파라미터 우선 허용, 없으면 로그인 사용자 ID 사용
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('userId') || user?.id?.toString();

  // 세션 참여 신청 후 라벨링 페이지로 이동
  const handleJoin = async (type: 'auto' | 'manual') => {
    if (!userId) {
      alert("로그인 사용자 정보를 확인할 수 없습니다. 다시 로그인해주세요.");
      navigate("/login");
      return;
    }

    try {
      const res = await authFetch(`/sessions/${sessionId}/join?userId=${userId}`, {
        method: "POST"
      });
      if (!res.ok) {
        const err = await res.json();
        if (err?.error === "이미 참여 신청한 세션입니다.") {
          navigate(`/session/${sessionId}/labeling/${type}?userId=${userId}`);
          return;
        }

        alert(err.error || "참여 신청 실패");
        return;
      }
      navigate(`/session/${sessionId}/labeling/${type}?userId=${userId}`);
    } catch (e) {
      console.error("참여 신청 실패:", e);
      alert("참여 신청 중 오류가 발생했습니다.");
    }
  };

  // ==========================================

  return (
    <div className="min-h-screen py-12 px-4 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-gray-800 mb-2 font-bold text-3xl">세션 참여하기</h1>
          <p className="text-gray-600">선택하신 세션의 정보를 확인하고 라벨링 방식을 선택하세요.</p>
        </div>

        <Card className="p-8 mb-12 border-2 shadow-sm">
          <div className="mb-6 border-b pb-4">
            <h2 className="text-2xl font-bold" style={{ color: '#6B3131' }}>
              {session.title || "제목 없음"}
            </h2>
          </div>

          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="flex items-center gap-2 mb-2 text-gray-500">
                  <Database className="w-4 h-4" />
                  <span className="text-sm font-medium">데이터 형식</span>
                </div>
                <p className="text-lg font-semibold">{dataFormat}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2 text-gray-500">
                  <Tag className="w-4 h-4" />
                  <span className="text-sm font-medium">클래스 수</span>
                </div>
                <p className="text-lg font-semibold">{classCount}개</p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2 text-gray-500">
                  <Cpu className="w-4 h-4" />
                  <span className="text-sm font-medium">알고리즘</span>
                </div>
                <p className="text-lg font-semibold">{session.algorithm || "FedAvg"}</p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3 text-gray-500">
                <Tag className="w-4 h-4" />
                <span className="text-sm font-medium">질환 목록</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {displayClasses.length > 0 ? (
                  displayClasses.map((name: string, index: number) => (
                    <Badge key={index} style={{ backgroundColor: '#FF9500' }} className="text-white">
                      {name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-gray-400 text-sm italic">등록된 질환 정보가 없습니다.</span>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg flex items-center justify-between border">
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="w-5 h-5" />
                <span className="font-medium">참여 현황</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold text-[#6B3131]">
                  {currentParticipants} / {maxParticipants}
                </span>
                <span className="text-sm text-gray-500">기관 참여 중</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <h3 style={{ color: '#6B3131' }} className="text-xl font-bold">라벨링 방법 선택</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card 
              className="p-6 cursor-pointer hover:border-[#FF9500] hover:shadow-md transition-all border-2 group" 
              onClick={() => handleJoin('auto')}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-orange-50 group-hover:bg-orange-100">
                  <Wand2 className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-2">자동 라벨링</h4>
                  <p className="text-sm text-gray-600 mb-4">AI 모델을 사용하여 수천 장의 의료 영상을 몇 분 안에 자동으로 라벨링합니다.</p>
                </div>
              </div>
            </Card>

            <Card 
              className="p-6 cursor-pointer hover:border-[#FF9500] hover:shadow-md transition-all border-2 group" 
              onClick={() => handleJoin('manual')}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-orange-50 group-hover:bg-orange-100">
                  <MousePointerClick className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-2">수동 라벨링</h4>
                  <p className="text-sm text-gray-600 mb-4">이미지를 하나씩 직접 확인하며 정확하게 라벨링을 수행합니다. (검수용으로 추천)</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
