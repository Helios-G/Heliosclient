import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Session {
  id: string;
  title: string;
  dataType: string;
  classNames: string[]; // 여기가 핵심! (설정된 클래스들)
  createdAt: string;
  createdBy: string;
}

interface SessionContextType {
  sessions: Session[];
  addSession: (session: Session) => void;
  getSession: (id: string) => Session | undefined;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<Session[]>([]);

  // 앱 시작 시 로컬 스토리지에서 불러오기 (새로고침 해도 유지되게)
  useEffect(() => {
    const saved = localStorage.getItem('helios_sessions');
    if (saved) {
      setSessions(JSON.parse(saved));
    }
  }, []);

  const addSession = (session: Session) => {
    const updated = [...sessions, session];
    setSessions(updated);
    localStorage.setItem('helios_sessions', JSON.stringify(updated));
  };

  const getSession = (id: string) => {
    return sessions.find(s => s.id === id);
  };

  return (
    <SessionContext.Provider value={{ sessions, addSession, getSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}