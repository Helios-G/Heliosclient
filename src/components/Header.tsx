import { Button } from "./ui/button";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Building2, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, hospital, isAdmin, logout } = useAuth();

  const handleSectionClick = (sectionId: string) => {
    // 홈페이지가 아니면 먼저 홈으로 이동
    if (location.pathname !== '/') {
      navigate('/');
      // 페이지 로드 후 스크롤
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      // 이미 홈페이지면 바로 스크롤
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link 
          to="/"
          className="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <h1 style={{ color: '#FF9500' }}>HELIOS</h1>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link 
            to="/"
            className="hover:opacity-70 transition-opacity"
          >
            Home
          </Link>
          <button 
            onClick={() => handleSectionClick('about')}
            className="hover:opacity-70 transition-opacity"
          >
            서비스 설명
          </button>
          <button 
            onClick={() => handleSectionClick('guide')}
            className="hover:opacity-70 transition-opacity"
          >
            서비스 사용법
          </button>
        </nav>

        {/* Auth Buttons or Hospital Menu */}
        <div className="flex items-center gap-3">
          {isLoggedIn && hospital ? (
            // 로그인된 상태 - 병원명 드롭다운
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline"
                  className="gap-2 border-2 hover:border-[#FF9500]"
                >
                  <Building2 className="w-4 h-4" style={{ color: '#FF9500' }} />
                  <span>{hospital.name}</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem 
                  onClick={() => navigate('/upload')}
                  className="cursor-pointer"
                >
                  모델 업로드
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => navigate('/download')}
                  className="cursor-pointer"
                >
                  모델 다운로드
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => navigate('/mypage')}
                  className="cursor-pointer"
                >
                  회원 정보
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => navigate('/dashboard')}
                  className="cursor-pointer"
                >
                  대시보드
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => navigate('/admin')}
                      className="cursor-pointer"
                      style={{ color: '#FF9500' }}
                    >
                      관리자 페이지
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="cursor-pointer text-red-600"
                >
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            // 로그인 안된 상태 - 로그인/회원가입 버튼
            <>
              <Button 
                variant="ghost"
                className="hover:opacity-70"
                onClick={() => navigate('/login')}
              >
                로그인
              </Button>
              <Button 
                onClick={() => navigate('/signup')}
                style={{ backgroundColor: '#FF9500' }}
                className="text-white hover:opacity-90"
              >
                회원가입
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
