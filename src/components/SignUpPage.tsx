import { useState } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Building2, Mail, FileText, User, Phone, Lock, MapPin } from "lucide-react";

export function SignUpPage() {
  const [formData, setFormData] = useState({
    hospitalName: "",
    managerName: "",
    email: "",
    password: "",
    confirmPassword: "",
    businessNumber: "",
    phone: "",
    address: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 여기에 회원가입 로직 추가
    console.log("Form submitted:", formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen py-12 px-4" style={{ backgroundColor: '#FFF5EB' }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="mb-3" style={{ color: '#FF9500', fontSize: '2.5rem' }}>
            HELIOS
          </h1>
          <h2 style={{ color: '#6B3131' }}>병원 회원가입</h2>
          <p className="mt-3 text-gray-600">
            HELIOS 서비스 이용을 위한 병원 정보를 입력해주세요
          </p>
        </div>

        {/* Form Card */}
        <Card className="p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 병원명 */}
            <div className="space-y-2">
              <Label htmlFor="hospitalName" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" style={{ color: '#FF9500' }} />
                병원명 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="hospitalName"
                name="hospitalName"
                type="text"
                placeholder="병원명을 입력하세요"
                value={formData.hospitalName}
                onChange={handleChange}
                required
                className="border-gray-300 focus:border-[#FF9500] focus:ring-[#FF9500]"
              />
            </div>

            {/* 사업자번호 */}
            <div className="space-y-2">
              <Label htmlFor="businessNumber" className="flex items-center gap-2">
                <FileText className="w-4 h-4" style={{ color: '#FF9500' }} />
                사업자번호 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="businessNumber"
                name="businessNumber"
                type="text"
                placeholder="000-00-00000"
                value={formData.businessNumber}
                onChange={handleChange}
                required
                className="border-gray-300 focus:border-[#FF9500] focus:ring-[#FF9500]"
              />
              <p className="text-sm text-gray-500">
                사업자번호 10자리를 입력하세요 (예: 123-45-67890)
              </p>
            </div>

            {/* 담당자 이름 */}
            <div className="space-y-2">
              <Label htmlFor="managerName" className="flex items-center gap-2">
                <User className="w-4 h-4" style={{ color: '#FF9500' }} />
                담당자 이름 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="managerName"
                name="managerName"
                type="text"
                placeholder="담당자 이름을 입력하세요"
                value={formData.managerName}
                onChange={handleChange}
                required
                className="border-gray-300 focus:border-[#FF9500] focus:ring-[#FF9500]"
              />
            </div>

            {/* 담당자 이메일 */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" style={{ color: '#FF9500' }} />
                담당자 이메일 <span className="text-red-500">*</span>
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

            {/* 전화번호 */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" style={{ color: '#FF9500' }} />
                담당자 전화번호 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="010-0000-0000"
                value={formData.phone}
                onChange={handleChange}
                required
                className="border-gray-300 focus:border-[#FF9500] focus:ring-[#FF9500]"
              />
            </div>

            {/* 주소 */}
            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" style={{ color: '#FF9500' }} />
                병원 주소 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="address"
                name="address"
                type="text"
                placeholder="병원 주소를 입력하세요"
                value={formData.address}
                onChange={handleChange}
                required
                className="border-gray-300 focus:border-[#FF9500] focus:ring-[#FF9500]"
              />
            </div>

            {/* 비밀번호 */}
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="w-4 h-4" style={{ color: '#FF9500' }} />
                비밀번호 <span className="text-red-500">*</span>
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
              <p className="text-sm text-gray-500">
                8자 이상, 영문/숫자/특수문자 조합
              </p>
            </div>

            {/* 비밀번호 확인 */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                <Lock className="w-4 h-4" style={{ color: '#FF9500' }} />
                비밀번호 확인 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="비밀번호를 다시 입력하세요"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="border-gray-300 focus:border-[#FF9500] focus:ring-[#FF9500]"
              />
            </div>

            {/* 약관 동의 */}
            <div className="pt-4 border-t border-gray-200">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="terms"
                    required
                    className="mt-1"
                    style={{ accentColor: '#FF9500' }}
                  />
                  <label htmlFor="terms" className="text-sm text-gray-700">
                    [필수] HELIOS 서비스 이용약관에 동의합니다
                  </label>
                </div>
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="privacy"
                    required
                    className="mt-1"
                    style={{ accentColor: '#FF9500' }}
                  />
                  <label htmlFor="privacy" className="text-sm text-gray-700">
                    [필수] 개인정보 수집 및 이용에 동의합니다
                  </label>
                </div>
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="marketing"
                    className="mt-1"
                    style={{ accentColor: '#FF9500' }}
                  />
                  <label htmlFor="marketing" className="text-sm text-gray-700">
                    [선택] 마케팅 정보 수신에 동의합니다
                  </label>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full text-white py-6"
              style={{ backgroundColor: '#FF9500' }}
            >
              회원가입
            </Button>

            {/* Login Link */}
            <div className="text-center pt-4">
              <p className="text-sm text-gray-600">
                이미 계정이 있으신가요?{" "}
                <a href="#login" style={{ color: '#FF9500' }} className="hover:underline">
                  로그인
                </a>
              </p>
            </div>
          </form>
        </Card>

        {/* Additional Info */}
        <div className="mt-8 p-6 bg-white rounded-lg shadow-sm">
          <h3 className="mb-3" style={{ color: '#6B3131' }}>
            회원가입 시 유의사항
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• 정확한 병원 정보를 입력해주세요.</li>
            <li>• 사업자번호는 사업자등록증에 기재된 번호를 입력해주세요.</li>
            <li>• 담당자 이메일로 인증 메일이 발송됩니다.</li>
            <li>• 회원가입 승인 후 서비스를 이용하실 수 있습니다.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
