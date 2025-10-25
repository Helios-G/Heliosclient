import { createContext, useContext, useState, ReactNode } from "react";

interface Hospital {
  id: string;
  name: string;
  email: string;
  businessNumber: string;
  phone: string;
  address: string;
  managerName: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  hospital: Hospital | null;
  login: (hospitalData: Hospital) => void;
  logout: () => void;
  updateHospital: (hospitalData: Hospital) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hospital, setHospital] = useState<Hospital | null>(null);

  const login = (hospitalData: Hospital) => {
    setIsLoggedIn(true);
    setHospital(hospitalData);
    // 실제로는 localStorage나 sessionStorage에 저장
    localStorage.setItem("hospital", JSON.stringify(hospitalData));
  };

  const logout = () => {
    setIsLoggedIn(false);
    setHospital(null);
    localStorage.removeItem("hospital");
  };

  const updateHospital = (hospitalData: Hospital) => {
    setHospital(hospitalData);
    localStorage.setItem("hospital", JSON.stringify(hospitalData));
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, hospital, login, logout, updateHospital }}>
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
