import { useState } from "react";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Mail, Lock } from "lucide-react";
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
    const mockHospitalData = {
      id: "H001",
      name: "서울중앙병원",
      email: formData.email,
      businessNumber: "123-45-67890",
      phone: "02-1234-5678",
      address: "서울특별시 강남구 테헤란로 123",
      managerName: "홍길동"
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
    <div className="min-h-screen py-12 px-4" style={{ backgroundColor: '#FFF5EB' }}>
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="mb-3" style={{ color: '#FF9500', fontSize: '2.5rem' }}>
            HELIOS
          </h1>
          <h2 style={{ color: '#6B3131' }}>로그인</h2>
          <p className="mt-3 text-gray-600">
            병원 관리자 계정으로 로그인하세요
          </p>
        </div>

        {/* Login Card */}
        <Card className="p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 이메일 */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" style={{ color: '#FF9500' }} />
                이메일
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="example@hospital.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="border-gray-300 focus:border-[#FF9500] focus:ring-[#FF9500]"
              />
            </div>

            {/* 비밀번호 */}
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="w-4 h-4" style={{ color: '#FF9500' }} />
                비밀번호
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={formData.password}
                onChange={handleChange}
                required
                className="border-gray-300 focus:border-[#FF9500] focus:ring-[#FF9500]"
              />
            </div>

            {/* 비밀번호 찾기 */}
            <div className="flex justify-end">
              <a 
                href="#forgot-password" 
                className="text-sm hover:underline"
                style={{ color: '#FF9500' }}
              >
                비밀번호를 잊으셨나요?
              </a>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full text-white py-6"
              style={{ backgroundColor: '#FF9500' }}
            >
              로그인
            </Button>

            {/* SignUp Link */}
            <div className="text-center pt-4">
              <p className="text-sm text-gray-600">
                아직 계정이 없으신가요?{" "}
                <button
                  type="button"
                  onClick={() => navigate('/signup')}
                  style={{ color: '#FF9500' }}
                  className="hover:underline"
                >
                  회원가입
                </button>
              </p>
            </div>
          </form>
        </Card>

        {/* Additional Info */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>로그인에 문제가 있으신가요?</p>
          <p className="mt-2">
            <a 
              href="#support" 
              style={{ color: '#FF9500' }}
              className="hover:underline"
            >
              고객센터 문의하기
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
