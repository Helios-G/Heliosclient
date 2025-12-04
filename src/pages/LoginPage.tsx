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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 실제로는 API 호출하여 인증
    // 여기서는 테스트를 위해 임시 데이터 사용
    // admin@helios.com으로 로그인하면 관리자 권한 부여
    const isAdminUser = formData.email === "admin@helios.com";
    
    const mockHospitalData = {
      id: isAdminUser ? "ADMIN" : "H001",
      name: isAdminUser ? "HELIOS 관리자" : "서울중앙병원",
      email: formData.email,
      businessNumber: "123-45-67890",
      phone: "02-1234-5678",
      address: "서울특별시 강남구 테헤란로 123",
      managerName: isAdminUser ? "시스템 관리자" : "홍길동",
      isAdmin: isAdminUser
    };

    login(mockHospitalData);
    navigate("/");
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