import { useState } from "react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { authFetch } from "../lib/authFetch";
import { readApiData, readApiErrorMessage } from "../lib/api";
import { Activity, Database, ShieldCheck } from "lucide-react";

interface LoginResponse {
  grantType: string;
  accessToken: string;
}

interface MyInfoResponse {
  id: number;
  name: string;
  email: string;
  roleId: number;
  roleName: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      const loginResponse = await authFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      if (!loginResponse.ok) {
        throw new Error(
          await readApiErrorMessage(loginResponse, "로그인에 실패했습니다."),
        );
      }

      const tokenData = await readApiData<LoginResponse>(loginResponse);
      localStorage.setItem("accessToken", tokenData.accessToken);
      localStorage.setItem("token", tokenData.accessToken);

      const myInfoResponse = await authFetch("/users/me");
      if (!myInfoResponse.ok) {
        throw new Error("사용자 정보를 불러오지 못했습니다.");
      }

      const myInfo = await readApiData<MyInfoResponse>(myInfoResponse);
      const userData = {
        id: myInfo.id,
        name: myInfo.name,
        email: myInfo.email,
        roleId: myInfo.roleId,
        roleName: myInfo.roleName,
        businessNumber: "",
        phone: "",
        address: "",
        managerName: myInfo.name,
        isAdmin: myInfo.roleName === "ROLE_ADMIN",
      };

      login(userData, tokenData.accessToken);
      navigate("/");
    } catch (error) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("token");
      const message = error instanceof Error ? error.message : "로그인 중 오류가 발생했습니다.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
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
            <p className="cohere-eyebrow text-white">HELIOS Secure Access</p>
            <h1>기관별 데이터를 연결하는 연합학습 콘솔</h1>
            <p>
              의료 영상은 병원 안에 두고, 모델 업데이트만 안전하게 공유합니다.
              로그인 후 세션, 라벨링, 학습 모니터를 한 흐름에서 관리하세요.
            </p>
            <div className="cohere-auth-stack">
              <div className="cohere-auth-row">
                <span>Privacy</span>
                <strong>Local-first training data</strong>
              </div>
              <div className="cohere-auth-row">
                <span>Pipeline</span>
                <strong>Labeling → FL → Diagnosis</strong>
              </div>
              <div className="cohere-auth-row">
                <span>Status</span>
                <strong>Research workspace ready</strong>
              </div>
            </div>
          </section>

          <section className="cohere-form-card">
            <div className="mb-8">
              <p className="cohere-eyebrow">Sign in</p>
              <h2 className="cohere-section-title mt-2">로그인</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                승인된 기관 계정으로 HELIOS 워크스페이스에 접속합니다.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="이메일을 입력해주세요."
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="h-12 border-slate-300 bg-white focus:border-[#0f62fe] focus:ring-[#0f62fe]"
                />
              </div>

              <div className="space-y-2">
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

              {errorMessage && (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {errorMessage}
                </p>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="cohere-gradient-button h-12 w-full"
              >
                {isSubmitting ? "로그인 중..." : "로그인"}
              </Button>
            </form>

            <div className="mt-8 grid gap-3 text-sm text-slate-600">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-4 w-4 text-[#0f62fe]" />
                <span>기관 승인 기반 접근 제어</span>
              </div>
              <div className="flex items-center gap-3">
                <Database className="h-4 w-4 text-[#0f62fe]" />
                <span>브라우저 내 라벨링 및 로컬 학습 데이터 유지</span>
              </div>
              <div className="flex items-center gap-3">
                <Activity className="h-4 w-4 text-[#0f62fe]" />
                <span>연합학습 라운드 실시간 추적</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
