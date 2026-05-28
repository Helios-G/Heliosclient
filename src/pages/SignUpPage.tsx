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
    password: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8081";
      const response = await axios.post(`${BASE_URL}/auth/signup`, {
        name: formData.userName,     // 백엔드 SignupRequest 필드명 매핑
        email: formData.email,
        password: formData.password
      });

      if (response.status === 200 || response.status === 201) {
        // 기존 주석과 알림 유지
        alert("회원가입이 완료되었습니다. 로그인 후 이용해주세요.");
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
            <p className="cohere-eyebrow text-white">Account onboarding</p>
            <h1>HELIOS 워크스페이스 계정을 생성하세요</h1>
            <p>
              사용자명, 이메일, 비밀번호만 입력하면 계정을 만들고
              세션 기반 협업 학습과 AI Review 기능을 사용할 수 있습니다.
            </p>
            <div className="cohere-auth-stack">
              <div className="cohere-auth-row">
                <span>Step 01</span>
                <strong>계정 정보 입력</strong>
              </div>
              <div className="cohere-auth-row">
                <span>Step 02</span>
                <strong>로그인</strong>
              </div>
              <div className="cohere-auth-row">
                <span>Step 03</span>
                <strong>세션 생성 및 참여</strong>
              </div>
            </div>
          </section>

          <section className="cohere-form-card">
            <div className="mb-8">
              <p className="cohere-eyebrow">Create account</p>
              <h2 className="cohere-section-title mt-2">회원가입</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                사용할 계정 정보를 입력하면 바로 로그인 화면으로 이동합니다.
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

              <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-600">
                <div className="flex gap-3">
                  <Building2 className="mt-0.5 h-4 w-4 text-[#0f62fe]" />
                  <span>사용자명, 이메일, 비밀번호만으로 계정을 생성합니다.</span>
                </div>
                <div className="flex gap-3">
                  <FileCheck2 className="mt-0.5 h-4 w-4 text-[#0f62fe]" />
                  <span>가입 완료 후 로그인 화면으로 이동합니다.</span>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#0f62fe]" />
                  <span>로그인 후 세션 생성, 라벨링, AI Review를 사용할 수 있습니다.</span>
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
