import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useSession } from "../contexts/SessionContext";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { 
  Database, 
  Users, 
  Tag, 
  Wand2, 
  MousePointerClick,
  Cpu,
  Check // ✅ [수정] 여기에 Check 아이콘 추가!
} from "lucide-react";

export function SessionJoinPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { hospital } = useAuth();
  const { getSession } = useSession();

  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    if (!hospital) {
      navigate("/login");
      return;
    }

    const foundSession = getSession(sessionId || "");
    if (foundSession) {
      setSession(foundSession);
    } else {
      alert("세션을 찾을 수 없습니다.");
      navigate("/session/list");
    }
  }, [sessionId, hospital, navigate, getSession]);

  if (!session) return null;

  const handleAutoLabeling = () => {
    navigate(`/session/${sessionId}/labeling/auto`);
  };

  const handleManualLabeling = () => {
    navigate(`/session/${sessionId}/labeling/manual`);
  };

  return (
    <div className="min-h-screen py-12 px-4 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-gray-800 mb-2">세션 참여하기</h1>
          <p className="text-gray-600">라벨링 방법을 선택하여 세션에 참여합니다</p>
        </div>

        {/* 세션 정보 카드 */}
        <Card className="p-8 mb-12 border-2">
          <div className="mb-6">
            <h2 className="text-xl font-bold" style={{ color: '#6B3131' }}>
              {session.title}
            </h2>
          </div>

          <div className="space-y-8">
            {/* 1열: 기본 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="flex items-center gap-2 mb-2 text-gray-600">
                  <Database className="w-4 h-4" />
                  <span className="text-sm font-medium">데이터 형식</span>
                </div>
                <p className="text-lg font-semibold">{session.dataType}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2 text-gray-600">
                  <Tag className="w-4 h-4" />
                  <span className="text-sm font-medium">클래스 수</span>
                </div>
                <p className="text-lg font-semibold">{session.classNames.length}개</p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2 text-gray-600">
                  <Cpu className="w-4 h-4" />
                  <span className="text-sm font-medium">알고리즘</span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold">
                    {session.algorithm || "FedAvg"}
                  </p>
                  <Badge variant="outline" className="text-xs text-gray-500">
                    {session.algorithm === "FedAdam" ? "Advanced" : "Basic"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* 2열: 질환 목록 */}
            <div>
              <div className="flex items-center gap-2 mb-3 text-gray-600">
                <Tag className="w-4 h-4" />
                <span className="text-sm font-medium">질환 목록</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {session.classNames.map((name: string, index: number) => (
                  <Badge 
                    key={index}
                    style={{ backgroundColor: '#FF9500' }}
                    className="text-white hover:bg-orange-600"
                  >
                    {name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* 3열: 참여 현황 */}
            <div>
              <div className="flex items-center gap-2 mb-2 text-gray-600">
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium">참여 현황</span>
              </div>
              <p className="text-lg font-semibold">
                {session.participants || 0} / {session.targetParticipants || 5} 병원
              </p>
            </div>
          </div>
        </Card>

        {/* 라벨링 방법 선택 */}
        <div className="space-y-6">
          <h3 style={{ color: '#6B3131' }} className="text-lg font-semibold">
            라벨링 방법 선택
          </h3>
          <p className="text-gray-600 -mt-4 mb-6">
            데이터를 자동으로 라벨링할지, 수동으로 라벨링할지 선택하세요
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 자동 라벨링 옵션 */}
            <Card 
              className="p-6 cursor-pointer hover:border-orange-500 hover:shadow-md transition-all border-2 group"
              onClick={handleAutoLabeling}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-orange-50 group-hover:bg-orange-100 transition-colors">
                  <Wand2 className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-2">자동 라벨링</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    AI가 자동으로 이미지를 분석하여 라벨을 지정합니다. 
                    라벨링 완료 후 검수 단계에서 결과를 확인하고 수정할 수 있습니다.
                  </p>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li className="flex items-center">
                      <Check className="w-3 h-3 mr-1 text-green-500" />
                      빠른 라벨링 속도
                    </li>
                    <li className="flex items-center">
                      <Check className="w-3 h-3 mr-1 text-green-500" />
                      대량의 데이터 처리에 적합
                    </li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* 수동 라벨링 옵션 */}
            <Card 
              className="p-6 cursor-pointer hover:border-orange-500 hover:shadow-md transition-all border-2 group"
              onClick={handleManualLabeling}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-orange-50 group-hover:bg-orange-100 transition-colors">
                  <MousePointerClick className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 mb-2">수동 라벨링</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    이미지를 하나씩 확인하며 직접 라벨을 지정합니다. 
                    진행 중 언제든지 남은 데이터를 AI로 자동 라벨링할 수 있습니다.
                  </p>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li className="flex items-center">
                      <Check className="w-3 h-3 mr-1 text-green-500" />
                      정확한 라벨링
                    </li>
                    <li className="flex items-center">
                      <Check className="w-3 h-3 mr-1 text-green-500" />
                      이미지 품질 확인 가능
                    </li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}