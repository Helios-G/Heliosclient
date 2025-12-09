import { Button } from "./ui/button";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Building2, ChevronDown, Sun } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import logo from "../assets/logo.png";

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
          className="flex items-center gap-2 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <img
            src={logo}
            alt="HELIOS Logo"
            style={{ width: "140px", height: "auto" }}
            className="object-contain"
          />

        </Link>


        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link 
            to="/"
            className="text-gray-700 hover:opacity-70 transition-opacity"
          >
            홈
          </Link>
          <button 
            onClick={() => handleSectionClick('about')}
            className="text-gray-700 hover:opacity-70 transition-opacity"
          >
            서비스 소개
          </button>
          <Link 
            to="/upload"
            className="text-gray-700 hover:opacity-70 transition-opacity"
          >
            학습 참여
          </Link>
          <Link 
            to="/download"
            className="text-gray-700 hover:opacity-70 transition-opacity"
          >
            모델 다운로드
          </Link>
        </nav>

        {/* Auth Buttons or Hospital Menu */}
        <div className="flex items-center gap-3">
          {isLoggedIn && hospital ? (
            // 로그인된 상태 - 병원명 드롭다운
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline"
                  className="gap-2 border-2 hover:border-[#FF9500] bg-white"
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
                onClick={() => navigate('/login')}
                style={{ backgroundColor: '#FF9500' }}
                className="text-white hover:opacity-90"
              >
                로그인
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/signup')}
                style={{ borderColor: '#FF9500', color: '#FF9500' }}
                className="border-2 hover:bg-orange-50"
              >
                가입신청
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}