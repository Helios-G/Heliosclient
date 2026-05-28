import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { HeliosTaskType } from '../lib/taskTypes';

export interface Session {
  id: string;
  title: string;
  dataType: string;
  classNames: string[];
  taskType?: HeliosTaskType;
  algorithm?: string; // 알고리즘 필드 추가
  rounds: number;
  createdAt: string;
  createdBy: string;
  status: "waiting" | "running" | "completed"; // 상태 추가
  participants: number; // 참여자 수
  targetParticipants: number; // 목표 참여자 수
}

interface SessionContextType {
  sessions: Session[];
  addSession: (session: Session) => void;
  upsertSession: (session: Session) => void;
  getSession: (id: string) => Session | undefined;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

// ✅ 데모용 기본 데이터 (CheXpert 라벨 포함)
const DEMO_SESSIONS: Session[] = [
  {
    id: "demo-1",
    title: "폐암 진단 학습 (Demo)",
    dataType: "X-ray",
    classNames: ["No Finding", "Pneumonia", "Edema", "Consolidation"],
    algorithm: "FedAvg",
    rounds: 5,
    createdAt: new Date().toISOString(),
    createdBy: "서울대병원",
    status: "waiting",
    participants: 2,
    targetParticipants: 5
  },
  {
    id: "demo-2",
    title: "유방암 조기진단 AI 모델",
    dataType: "X-ray",
    classNames: ["No Finding", "Mass", "Nodule"],
    algorithm: "FedAdam",
    rounds: 8,
    createdAt: new Date().toISOString(),
    createdBy: "아산병원",
    status: "running",
    participants: 5,
    targetParticipants: 5
  },
  {
    id: "demo-3",
    title: "피부암 분류 모델",
    dataType: "Dermoscopy",
    classNames: ["Benign", "Malignant"],
    algorithm: "FedAvg",
    rounds: 3,
    createdAt: new Date().toISOString(),
    createdBy: "삼성서울병원",
    status: "completed",
    participants: 4,
    targetParticipants: 4
  }
];

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const sessionsRef = useRef<Session[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('helios_sessions');
    if (saved) {
      // 저장된 게 있으면 그거 사용
      setSessions(JSON.parse(saved));
    } else {
      // ✅ 저장된 게 없으면 데모 데이터 주입!
      setSessions(DEMO_SESSIONS);
      localStorage.setItem('helios_sessions', JSON.stringify(DEMO_SESSIONS));
    }
  }, []);

  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  const addSession = useCallback((session: Session) => {
    setSessions((prev) => {
      const updated = [session, ...prev];
      localStorage.setItem('helios_sessions', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const upsertSession = useCallback((session: Session) => {
    setSessions((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === session.id);
      if (existingIndex === -1) {
        const updated = [session, ...prev];
        localStorage.setItem('helios_sessions', JSON.stringify(updated));
        return updated;
      }

      const merged = { ...prev[existingIndex], ...session };
      const unchanged = JSON.stringify(prev[existingIndex]) === JSON.stringify(merged);
      if (unchanged) {
        return prev;
      }

      const updated = prev.map((item, index) => (index === existingIndex ? merged : item));

      localStorage.setItem('helios_sessions', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const getSession = useCallback((id: string) => {
    return sessionsRef.current.find(s => s.id === id);
  }, []);

  return (
    <SessionContext.Provider value={{ sessions, addSession, upsertSession, getSession }}>
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
