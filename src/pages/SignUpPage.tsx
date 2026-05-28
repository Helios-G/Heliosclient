import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // axios 추가
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Building2, CheckCircle2, FileCheck2 } from "lucide-react";

export function SignUpPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    userName: "",
    email: "",
    password: "",
    businessNumber: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // 실제 API 호출 로직 추가
      const response = await axios.post("http://localhost:8081/auth/signup", {
        name: formData.userName,     // 백엔드 SignupRequest 필드명 매핑
        email: formData.email,
        password: formData.password,
        businessNumber: formData.businessNumber
      });

      if (response.status === 200 || response.status === 201) {
        // 기존 주석과 알림 유지
        alert("회원가입이 완료되었습니다. 관리자 승인 후 이용 가능합니다.");
        navigate("/login");
      }
    } catch (error: any) {
      console.error("회원가입 에러:", error);
      // 백엔드에서 보낸 에러 메시지가 있다면 출력, 없으면 기본 메시지
      const errorMessage = error.response?.data?.message || "회원가입 중 오류가 발생했습니다.";
      alert(errorMessage);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="cohere-page px-4 py-12">
      <div className="cohere-page-wide">
        <div className="cohere-auth-shell">
          <section className="cohere-auth-visual">
            <p className="cohere-eyebrow text-white">Institution onboarding</p>
            <h1>연합학습 네트워크에 기관을 등록하세요</h1>
            <p>
              가입 신청 후 관리자 승인 절차를 거치면 의료 영상 라벨링과
              세션 기반 협업 학습에 참여할 수 있습니다.
            </p>
            <div className="cohere-auth-stack">
              <div className="cohere-auth-row">
                <span>Step 01</span>
                <strong>기관 정보 제출</strong>
              </div>
              <div className="cohere-auth-row">
                <span>Step 02</span>
                <strong>관리자 승인</strong>
              </div>
              <div className="cohere-auth-row">
                <span>Step 03</span>
                <strong>세션 참여 시작</strong>
              </div>
            </div>
          </section>

          <section className="cohere-form-card">
            <div className="mb-8">
              <p className="cohere-eyebrow">Create account</p>
              <h2 className="cohere-section-title mt-2">회원가입</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                기관 담당자 정보를 입력하면 승인 대기 상태로 접수됩니다.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="userName" className="block text-sm font-semibold text-slate-800">
                  사용자명
                </label>
                <Input
                  id="userName"
                  name="userName"
                  type="text"
                  placeholder="사용자명을 입력해주세요."
                  value={formData.userName}
                  onChange={handleChange}
                  required
                  className="h-12 border-slate-300 bg-white focus:border-[#0f62fe] focus:ring-[#0f62fe]"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-slate-800">
                  이메일
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="example@gmail.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="h-12 border-slate-300 bg-white focus:border-[#0f62fe] focus:ring-[#0f62fe]"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-semibold text-slate-800">
                  비밀번호
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="비밀번호를 입력해주세요."
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="h-12 border-slate-300 bg-white focus:border-[#0f62fe] focus:ring-[#0f62fe]"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="businessNumber" className="block text-sm font-semibold text-slate-800">
                  사업자 등록 번호
                </label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="businessNumber"
                    name="businessNumber"
                    type="text"
                    placeholder="000-00-0000"
                    value={formData.businessNumber}
                    onChange={handleChange}
                    required
                    className="h-12 flex-1 border-slate-300 bg-white focus:border-[#0f62fe] focus:ring-[#0f62fe]"
                  />
                  <Button
                    type="button"
                    className="h-12 rounded-full bg-[#0f62fe] px-5 text-white hover:bg-[#0043ce]"
                  >
                    인증
                  </Button>
                </div>
                <p className="text-xs text-slate-500">
                  000-00-00000 형식으로 기입해주세요.
                </p>
              </div>

              <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-600">
                <div className="flex gap-3">
                  <Building2 className="mt-0.5 h-4 w-4 text-[#0f62fe]" />
                  <span>가입 신청은 기관 단위로 검토됩니다.</span>
                </div>
                <div className="flex gap-3">
                  <FileCheck2 className="mt-0.5 h-4 w-4 text-[#0f62fe]" />
                  <span>가입 완료 시 개인정보 제공 동의로 간주됩니다.</span>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#0f62fe]" />
                  <span>승인 후 세션 생성과 참여 기능을 사용할 수 있습니다.</span>
                </div>
              </div>

              <Button type="submit" className="cohere-gradient-button h-12 w-full">
                회원가입
              </Button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
