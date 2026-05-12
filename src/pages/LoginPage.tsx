import { useState } from "react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // 1. 로그인 API 호출
      const response = await fetch("http://localhost:8081/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      if (!response.ok) {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
        return;
      }

      const data = await response.json();
      const token = data.data.accessToken;

      // 2. 유저 정보 조회
      const userResponse = await fetch("http://localhost:8081/users/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userData = await userResponse.json();
      console.log("전체 응답:", userData);           // 구조 확인
console.log("userData.data:", userData.data);  // 현재 넘기는 값

      // 3. 로그인 처리
      login(userData.data, token);
      navigate("/");

    } catch (err) {
      setError("서버 연결에 실패했습니다.");
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

            {/* 에러 메시지 */}
            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            {/* 로그인 버튼 */}
            <Button
              type="submit"
              className="w-full py-6 text-white rounded-lg hover:opacity-90"
              style={{ backgroundColor: '#FF9500' }}
            >
              로그인
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}