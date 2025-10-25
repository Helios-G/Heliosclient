export function Footer() {
  return (
    <footer style={{ backgroundColor: '#6B3131' }} className="text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="mb-4" style={{ color: '#FF9500' }}>HELIOS</h3>
            <p className="text-gray-300">
              혁신적인 서비스로<br />
              더 나은 미래를 만들어갑니다.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-4">연락처</h4>
            <div className="space-y-2 text-gray-300">
              <p>이메일: contact@helios.com</p>
              <p>전화: 02-1234-5678</p>
              <p>주소: 서울특별시 강남구</p>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="mb-4">바로가기</h4>
            <div className="space-y-2">
              <a href="#about" className="block text-gray-300 hover:text-white transition-colors">
                서비스 소개
              </a>
              <a href="#guide" className="block text-gray-300 hover:text-white transition-colors">
                이용 가이드
              </a>
              <a href="#terms" className="block text-gray-300 hover:text-white transition-colors">
                이용약관
              </a>
              <a href="#privacy" className="block text-gray-300 hover:text-white transition-colors">
                개인정보처리방침
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-600 text-center text-gray-400">
          <p>&copy; 2025 HELIOS. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
