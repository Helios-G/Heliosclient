import { useState } from "react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { authFetch } from "../lib/authFetch";

interface LoginResponse {
  grantType: string;
  accessToken: string;
  userId: number;
}

interface MyInfoResponse {
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
        const errorText = await loginResponse.text();
        throw new Error(errorText || "로그인에 실패했습니다.");
      }

      const tokenData = (await loginResponse.json()) as LoginResponse;
      localStorage.setItem("accessToken", tokenData.accessToken);

      const myInfoResponse = await authFetch("/users/me");
      if (!myInfoResponse.ok) {
        throw new Error("사용자 정보를 불러오지 못했습니다.");
      }

      const myInfo = (await myInfoResponse.json()) as MyInfoResponse;
      const userData = {
        id: tokenData.userId,
        name: myInfo.name,
        email: myInfo.email,
        businessNumber: "",
        phone: "",
        address: "",
        managerName: myInfo.name,
        isAdmin: myInfo.roleName === "ROLE_ADMIN",
      };

      login(userData);
      navigate("/");
    } catch (error) {
      localStorage.removeItem("accessToken");
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
    <div className="min-h-screen py-16 px-4 bg-white">
      <div className="max-w-md mx-auto">
        {/* 제목 */}
        <div className="text-center mb-12">
          <h1 className="text-gray-900 mb-2">로그인</h1>
        </div>

        {/* 로그인 카드 */}
        <Card className="p-8 border-2 border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 이메일 */}
            <div className="space-y-2">
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="이메일을 입력해주세요."
                value={formData.email}
                onChange={handleChange}
                required
                className="border-gray-300 focus:border-[#FF9500] focus:ring-[#FF9500]"
              />
              <p className="text-xs text-gray-500">이메일을 다시 확인해주세요.</p>
            </div>

            {/* 비밀번호 */}
            <div className="space-y-2">
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="비밀번호를 입력해주세요."
                value={formData.password}
                onChange={handleChange}
                required
                className="border-gray-300 focus:border-[#FF9500] focus:ring-[#FF9500]"
              />
              <p className="text-xs text-gray-500">비밀번호를 다시 확인해주세요.</p>
            </div>

            {errorMessage && (
              <p className="text-sm text-red-600">{errorMessage}</p>
            )}

            {/* 로그인 버튼 */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-6 text-white rounded-lg hover:opacity-90"
              style={{ backgroundColor: '#FF9500' }}
            >
              {isSubmitting ? "로그인 중..." : "로그인"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
