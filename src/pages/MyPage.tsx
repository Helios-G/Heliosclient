import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { 
  User, 
  Mail, 
  ShieldCheck, 
  History, 
  Clock, 
  CheckCircle2, 
  FileText,
  Award
} from "lucide-react";

const ROLE_DETAILS: Record<string, any> = {
  ROLE_USER: {
    title: "일반 회원 (Viewer)",
    description: "Helios 플랫폼의 기본 멤버입니다. 모델 결과물 조회 및 리포트 다운로드가 가능합니다.",
    cardStyle: { backgroundColor: "#F0F7FF", borderColor: "#BFDBFE" },
    textStyle: { color: "#1E3A8A" },
    iconBoxStyle: { backgroundColor: "#DBEAFE", color: "#3B82F6" },
  },
  ROLE_PENDING: {
    title: "권한 승인 대기중",
    description: "연합학습 참여를 위한 자격 심사가 진행 중입니다. 관리자 승인 후 기능이 활성화됩니다.",
    cardStyle: { backgroundColor: "#FFFBEB", borderColor: "#FDE68A" },
    textStyle: { color: "#92400E" },
    iconBoxStyle: { backgroundColor: "#FEF3C7", color: "#F59E0B" },
  },
  ROLE_PARTICIPANT: {
    title: "파트너 (Contributor)",
    description: "최종 승인된 파트너 계정입니다. 연합학습 세션에 직접 참여하여 기여할 수 있습니다.",
    cardStyle: { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" },
    textStyle: { color: "#065F46" },
    iconBoxStyle: { backgroundColor: "#D1FAE5", color: "#10B981" },
  }
};

export function MyPage() {
  const navigate = useNavigate();
  const { hospital } = useAuth();

  if (!hospital) return <div className="p-20 text-center text-gray-500 font-bold">로그인이 필요합니다.</div>;

  const currentRole = hospital.role || "ROLE_USER";
  const roleInfo = ROLE_DETAILS[currentRole] || ROLE_DETAILS["ROLE_USER"];

  return (
    <div className="min-h-screen py-20 px-4 bg-gray-50/50 pb-32">
      <div className="max-w-5xl mx-auto">
        
        {/* 상단 헤더 */}
        <div className="mb-16 text-center">
          <h1 className="text-4xl font-black text-[#5D4037] tracking-tight mb-3">마이페이지</h1>
          <p className="text-gray-500 font-medium text-base">사용자 계정 정보와 모델 기여 이력을 관리합니다.</p>
        </div>

        {/* 1. 멤버십 티어 섹션 (아이콘 깨짐 방지 및 여백 확대) */}
        <Card 
          className="p-6 shadow-sm relative overflow-hidden mb-4 border-2"
          style={roleInfo.cardStyle}
        >
            <div className="flex items-center gap-10 relative z-10">
                {/* 🌟 아이콘 깨짐 방지: 고정 크기 div와 flex-shrink-0 적용 */}
                <div 
                  className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0"
                  style={roleInfo.iconBoxStyle}
                >
                    <Award strokeWidth={1.5} className="w-10 h-10" />
                </div>
                <div className="flex-1">
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-2 block">
                        Current Membership
                    </span>
                    <h3 className="text-3xl font-black mb-3" style={roleInfo.textStyle}>
                        {roleInfo.title}
                    </h3>
                    <p className="text-gray-700 text-base font-medium leading-relaxed max-w-2xl">
                        {roleInfo.description}
                    </p>
                </div>
            </div>
            {/* 배경 아이콘 위치 조정 */}
            <ShieldCheck 
                strokeWidth={1} 
                className="w-0 h-50 absolute -right-10 -bottom-10 opacity-[0.05]" 
                style={{ color: roleInfo.iconBoxStyle.color }} 
            />
        </Card>

        {/* 2. 사용자 정보 섹션 (위아래 여백 확대) */}
        <Card className="p-0 border border-gray-200 shadow-sm bg-white overflow-hidden mb-4">
            <div className="px- py-3 border-b flex items-center gap-3" style={{ backgroundColor: '#FFF9F2', borderColor: '#FFE4C4' }}>
                <div className="w-1.5 h-5 rounded-full" style={{ backgroundColor: '#FF9500' }}></div>
                <h3 className="text-base font-bold" style={{ color: '#D97700' }}>기본 계정 정보</h3>
            </div>
            {/* 🌟 py-16으로 내부 위아래 공간을 대폭 늘림 */}
            <div className="py-16 px-10 grid md:grid-cols-2 gap-8 divide-x divide-gray-100">
                <div className="flex items-center gap-6 pl-4">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FFF4E5', color: '#FF9500' }}>
                        <User strokeWidth={1.5} className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-wide">성함 / 기관명</p>
                        <p className="text-xl font-bold text-gray-800">{hospital.name}</p>
                    </div>
                </div>
                <div className="flex items-center gap-6 pl-12">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#F5F1F0', color: '#6B3131' }}>
                        <Mail strokeWidth={1.5} className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-wide">이메일 계정</p>
                        <p className="text-xl font-bold text-gray-800">{hospital.email}</p>
                    </div>
                </div>
            </div>
        </Card>

        {/* 3. 모델 기여 이력 섹션 (위아래 여백 확대) */}
        <Card className="border border-gray-200 shadow-sm bg-white overflow-hidden mb-4">
            <div className="px-10 py-2 border-b flex justify-between items-center" style={{ backgroundColor: '#FDF8F5', borderColor: '#E6DCD5' }}>
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-5 rounded-full" style={{ backgroundColor: '#6B3131' }}></div>
                    <h3 className="text-base font-bold" style={{ color: '#6B3131' }}>모델 기여 이력</h3>
                </div>
                <div className="px-2 py-1.5 font-bold text-sm rounded-lg shadow-sm" style={{ backgroundColor: '#6B3131', color: 'white' }}>
                    Total {hospital.history?.length || 0}
                </div>
            </div>

            <div className="px-10 py-5"> {/* 🌟 py-10으로 테이블 위아래 간격 확보 */}
                <table className="w-full text-base text-left border-collapse">
                    <thead>
                        <tr className="text-gray-400 border-b border-gray-100">
                            <th className="pb-5 font-bold text-xs uppercase tracking-widest w-[15%] pl-2">Version</th>
                            <th className="pb-5 font-bold text-xs uppercase tracking-widest w-[40%]">Session Title</th>
                            <th className="pb-5 font-bold text-xs uppercase tracking-widest text-center w-[30%]">Completed Date</th>
                            <th className="pb-5 font-bold text-xs uppercase tracking-widest text-right w-[15%] pl-2">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {hospital.history && hospital.history.length > 0 ? (
                            hospital.history.map((item: any, idx: number) => (
                                <tr key={idx} className="hover:bg-gray-50 transition-colors group">
                                    <td className="py-6">
                                        <span className="font-mono font-black px-3 py-1.5 rounded-md text-sm border" style={{ backgroundColor: '#FFF4E5', color: '#FF9500', borderColor: '#FFE4C4' }}>
                                            {item.version}
                                        </span>
                                    </td>
                                    <td className="py-6 font-bold text-gray-700">{item.sessionTitle}</td>
                                    <td className="py-6 text-center text-gray-500 font-medium">
                                        <span className="inline-flex items-center gap-2">
                                            <Clock strokeWidth={2} className="w-4 h-4 opacity-40" />
                                            {item.completedAt}
                                        </span>
                                    </td>
                                    <td className="py-6 text-right">
                                        <div className="inline-flex items-center justify-end gap-2 font-bold px-4 py-2 rounded-full text-xs border" style={{ backgroundColor: '#D1FAE5', color: '#059669', borderColor: '#A7F3D0' }}>
                                            <CheckCircle2 strokeWidth={2.5} className="w-4 h-4" />
                                            완료
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="py-32 text-center">
                                    <FileText strokeWidth={1} color="#D1D5DB" className="w-16 h-16 mx-auto mb-5" />
                                    <p className="text-gray-400 font-bold text-base tracking-tight">아직 기여한 모델 이력이 없습니다.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>

        {/* 🌟 4. 하단 버튼 영역 (mt-24로 섹션과 확실히 분리) */}
        <div className="flex justify-center gap-8 mt-24">
            <Button 
                variant="outline" 
                onClick={() => navigate("/")} 
                style={{ padding: '1.2rem 0.8rem', fontSize: '1.05rem', borderRadius: '0.7rem' }}
                className="border-gray-300 text-gray-600 font-bold hover:bg-gray-50 shadow-sm transition-all active:scale-95"
            >
              메인으로
            </Button>
            <Button 
                onClick={() => {}}
                style={{ backgroundColor: '#6B3131', padding: '1.2rem 0.9rem', fontSize: '1.05rem', borderRadius: '0.7rem', color: 'white' }} 
                className="font-bold shadow-xl hover:opacity-90 transition-all active:scale-95"
            >
              회원 정보 수정
            </Button>
        </div>
      </div>
    </div>
  );
}