// apps/native/lib/api.ts
export type WeekRow = {
  id: number;
  userId: number;
  date: string;
  status: "pending" | "generating" | "ready" | "error";
  title?: string;
  updatedAt?: string;
};
export type BlockItem = {
  exercise_id: number;
  name: string;
  sets: number;
  reps: number | string;
  rest_sec?: number;
  load?: number;
};
export type DayPayload = {
  date: string;
  title: string;
  duration_min: number;
  coach_notes?: string;
  blocks: { type: "warmup" | "main" | "recovery"; items: BlockItem[] }[];
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

async function api(path: string, init: RequestInit = {}) {
  const fullUrl = `${API_BASE_URL}${path}`;
  const res = await fetch(fullUrl, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
  });
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.json();
}

export const getWeek = async (): Promise<{ workouts: WeekRow[] }> =>
  api("/api/workouts/week");

export async function postGenerateDay(date: string) {
  console.log("[API] postGenerateDay ->", date);
  return fetch(`${API_BASE_URL}/api/v1/workouts/generate-day`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ date }),
  });
}

export async function getDay(date: string) {
  console.log("[API] getDay ->", date);
  const r = await fetch(
    `${API_BASE_URL}/api/v1/workouts/day?date=${encodeURIComponent(date)}`,
    {
      credentials: "include",
    },
  );
  return r.json();
}

export const getTodayFallback = async (): Promise<{
  status: string;
  title?: string;
  payloadJson?: DayPayload;
}> => api("/api/v1/workouts/today");
