import { createContext, useContext, useState, ReactNode } from "react";

interface User {
  id: number;
  name: string;
  email: string;
  roleId: number;
  roleName: string;
  isAdmin?: boolean;
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  isAdmin: boolean;
  userName?: string;
  login: (userData: User, token: string) => void;
  logout: () => void;
  updateUser: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // 1. 유저 정보 초기화 (안전하게 파싱)
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("user");
      // null, "null", "undefined" 문자열이 들어오는 경우를 모두 확실히 방어합니다.
      if (saved && saved !== "undefined" && saved !== "null") {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("User storage parse error:", e);
      localStorage.removeItem("user"); // 고장난 데이터는 즉시 삭제
    }
    return null;
  });

  // 2. 로그인 상태 초기화 (토큰과 유저 정보가 "실제로" 있을 때만 true)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const token =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("token");
    // 토큰이 존재하고, 문자열 "undefined"가 아닐 때만 로그인된 것으로 인정합니다.
    return !!(token && token !== "undefined" && token !== "null" && user);
  });

  // ✅ 파생 상태 (변수)
  const isAdmin = user?.roleName === "ROLE_ADMIN";
  const userName = user?.name;

  const login = (userData: User, token: string) => {
    // 순서: 데이터 저장 -> 상태 업데이트 (순서가 중요합니다)
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("accessToken", token);
    localStorage.setItem("token", token);
    
    setUser(userData);
    setIsLoggedIn(true);
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("token");
    
    setUser(null);
    setIsLoggedIn(false);
  };

  const updateUser = (userData: User) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, userName, isAdmin, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
