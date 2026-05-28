import { Button } from "./ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  Activity,
  Building2,
  ChevronDown,
  Database,
  LogIn,
  ShieldCheck,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import logo from "../assets/logo-options/helios-logo-orbit.svg";

const navItems = [
  { label: "Overview", to: "/" },
  { label: "Sessions", to: "/session/list" },
  { label: "Models", to: "/download" },
];

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, user, isAdmin, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/92 backdrop-blur">
      <div className="mx-auto flex h-[72px] w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="flex min-w-0 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f62fe]"
        >
          <img src={logo} alt="HELIOS" className="h-12 w-auto object-contain" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const active =
              item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-blue-50 text-[#0f62fe]"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          {isLoggedIn && (
            <Link
              to="/playground"
              className={`ml-1 inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                location.pathname.startsWith("/playground")
                  ? "bg-blue-50 text-[#0f62fe]"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Activity className="h-4 w-4" />
              AI Review
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {isLoggedIn && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-9 border-slate-300 bg-white text-slate-800">
                  <Building2 className="h-4 w-4 text-[#0f62fe]" />
                  <span className="hidden max-w-32 truncate sm:inline">{user.name}</span>
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => navigate("/mypage")} className="cursor-pointer">
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  회원 정보
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/session/list")} className="cursor-pointer">
                  <Database className="mr-2 h-4 w-4" />
                  세션 콘솔
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/admin")} className="cursor-pointer">
                      관리자 페이지
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" className="hidden text-slate-700 sm:inline-flex" onClick={() => navigate("/login")}>
                <LogIn className="h-4 w-4" />
                로그인
              </Button>
              <Button className="bg-[#0f62fe] text-white hover:bg-[#0043ce]" onClick={() => navigate("/signup")}>
                기관 등록
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
