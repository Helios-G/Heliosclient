import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

export function SignUpPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    hospitalName: "",
    email: "",
    password: "",
    businessNumber: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 간단한 회원가입 처리 (실제로는 API 호출)
    alert("회원가입이 신청되었습니다. 관리자 승인 후 이용 가능합니다.");
    navigate("/login");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen py-16 px-4 bg-white">
      <div className="max-w-xl mx-auto">
        {/* 제목 */}
        <div className="text-center mb-12">
          <h1 className="text-gray-900 mb-2">회원가입</h1>
        </div>

        {/* 폼 카드 */}
        <Card className="p-8 border-2 border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 병원명 */}
            <div className="space-y-2">
              <label htmlFor="hospitalName" className="block text-sm text-gray-900">
                병원명
              </label>
              <Input
                id="hospitalName"
                name="hospitalName"
                type="text"
                placeholder="병원명을 입력해주세요."
                value={formData.hospitalName}
                onChange={handleChange}
                required
                className="border-gray-300 focus:border-[#FF9500] focus:ring-[#FF9500]"
              />
            </div>

            {/* 이메일 */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm text-gray-900">
                이메일
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="병원 대표 이메일을 권장합니다."
                value={formData.email}
                onChange={handleChange}
                required
                className="border-gray-300 focus:border-[#FF9500] focus:ring-[#FF9500]"
              />
            </div>

            {/* 비밀번호 */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm text-gray-900">
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
                className="border-gray-300 focus:border-[#FF9500] focus:ring-[#FF9500]"
              />
            </div>

            {/* 사업자 등록 번호 */}
            <div className="space-y-2">
              <label htmlFor="businessNumber" className="block text-sm text-gray-900">
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
                  className="flex-1 border-gray-300 focus:border-[#FF9500] focus:ring-[#FF9500]"
                />
                <Button
                  type="button"
                  className="px-6 py-2 bg-[#4A9EFF] text-white hover:bg-[#3A8EEF] rounded-full"
                >
                  인증
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                정보수령, 000-00-00000형식으로 기입해주세요
              </p>
            </div>

            {/* 약관 동의 */}
            <div className="pt-4 space-y-3 text-sm">
              <p className="text-gray-700">
                가입완료시 위의 개인정보 동의로 간주하며, 등록되지 않은 의료기관 정보로
                이용약관에 동의한 것으로 간주합니다.
              </p>
              <p className="text-gray-700">
                당사에서 발생한 문의를 위 이름과 기관 이름으로 소통하게 됩니다.
              </p>
            </div>

            {/* 가입신청 버튼 */}
            <Button
              type="submit"
              className="w-full py-6 text-white rounded-lg hover:opacity-90"
              style={{ backgroundColor: '#FF9500' }}
            >
              회원가입
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
