export type WeekRow = { 
  id: number; 
  userId: number; 
  date: string; 
  status: 'pending' | 'generating' | 'ready' | 'error'; 
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
  blocks: {
    type: 'warmup' | 'main' | 'recovery'; 
    items: BlockItem[];
  }[];
};

async function api(path: string, init: RequestInit = {}) {
  const res = await fetch(path, { 
    ...init, 
    credentials: 'include', 
    headers: { 
      'Content-Type': 'application/json', 
      ...(init.headers || {}) 
    }
  });
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.json();
}

export const getWeek = async (): Promise<{workouts: WeekRow[]}> => 
  api('/api/v1/workouts/week');

export const getDay = async (date: string): Promise<WeekRow & {payloadJson?: DayPayload; error_reason?: string}> =>
  api(`/api/v1/workouts/day?date=${encodeURIComponent(date)}`);

export const generateDay = async (date: string): Promise<{status: string; message: string}> =>
  api('/api/v1/workouts/generate-day', { method: 'POST', body: JSON.stringify({ date }) });
