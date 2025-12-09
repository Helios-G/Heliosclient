export function Footer() {
  return (
    <footer style={{ backgroundColor: '#6B3131' }} className="text-white py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          {/* Company Info */}
          <div>
            <h3 className="mb-4 text-white">HELIOS</h3>
            <div className="space-y-1 text-gray-300">
              <p>회사명 : HELIOS</p>
              <p>전화 : 02-1234-5678</p>
              <p>주소 : 경기도 성남시 수정구 가천대학교 AI 공학관 </p>
            </div>
          </div>

          {/* Links */}
          <div className="flex gap-12">
            <a href="#about" className="text-gray-300 hover:text-white transition-colors">
              서비스 소개
            </a>
            <a href="#guide" className="text-gray-300 hover:text-white transition-colors">
              이용약관
            </a>
            <a href="#privacy" className="text-gray-300 hover:text-white transition-colors">
              개인정보처리방침
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}