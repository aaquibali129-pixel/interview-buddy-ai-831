import type { RoleId } from "./roles";

export type QAPair = { question: string; answer: string; seconds: number };

export type ReportCard = {
  scores: { question: string; score: number; comment: string }[];
  strengths: string[];
  weaknesses: string[];
  modelAnswer: { questionIndex: number; question: string; answer: string };
  overall: number;
};

export type StoredSession = {
  roleId: RoleId;
  pairs: QAPair[];
  report: ReportCard;
  completedAt: string;
};

const KEY = "interviewpilot:last-session";

export function saveSession(session: StoredSession) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, JSON.stringify(session));
}

export function loadSession(): StoredSession | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}
