import  clientLog  from "../lib/clientlog";
import { createContext, useContext, useReducer, type ReactNode } from "react";
import {
  getWeek,
  getDay,
  postGenerateDay,
  getTodayFallback,
  type WeekRow,
  type DayPayload,
} from "../lib/api";
import { saveJson, loadJson } from "../lib/storage";
const TODAY_KEY = (date: string) => `workout:day:${date}`;
const WEEK_KEY = "workout:week:current";

// ---------- Types ----------

export type TodayRow = {
  date: string;
  status: "pending" | "generating" | "ready" | "error" | "not_found";
  title?: string;
  payloadJson?: DayPayload | null;
};

interface WorkoutsState {
  week: WeekRow[] | null;
  today: TodayRow | null;
  loading: boolean;
  generating: boolean;
  error: string | null;
}

interface WorkoutsActions {
  loadWeek: () => Promise<void>;
  loadToday: (date?: string) => Promise<void>;
  ensureToday: (date: string) => Promise<void>;
  pollUntilReady: (date: string, timeoutMs?: number) => Promise<TodayRow>;
  generateAndPoll: (date: string) => Promise<void>;
}

type WorkoutsContextType = WorkoutsState & WorkoutsActions;

const WorkoutsContext = createContext<WorkoutsContextType | undefined>(
  undefined,
);

// Actions for reducer
type Action =
  | { type: "SET_GENERATING"; payload: boolean }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_WEEK"; payload: WeekRow[] }
  | { type: "SET_TODAY"; payload: TodayRow | null }
  | { type: "SET_ERROR"; payload: string | null };

// ---------- Reducer ----------

function workoutsReducer(state: WorkoutsState, action: Action): WorkoutsState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_WEEK":
      return { ...state, week: action.payload, loading: false, error: null };
    case "SET_TODAY":
      return { ...state, today: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };
    case "SET_GENERATING":
      return { ...state, generating: action.payload };
    default:
      return state;
  }
}

// ---------- Provider ----------

export function WorkoutsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(workoutsReducer, {
    week: null,
    today: null,
    loading: false,
    generating: false,
    error: null,
  } satisfies WorkoutsState);

  // ----- loadWeek -----
  const loadWeek = async (): Promise<void> => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      
      // Pre-generate today's workout in background if needed
      const resolvedToday = new Date().toISOString().split('T')[0];
      ensureToday(resolvedToday);
      
      const response = await getWeek();
      dispatch({ type: "SET_WEEK", payload: response.workouts });
      console.log("WEEK_DEBUG", response.workouts?.length, response.workouts);
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? error.message : "Failed to load week",
      });
    }
  };

  // ----- loadToday -----
  const loadToday = async (date?: string): Promise<void> => {
    const resolvedDate = date || new Date().toISOString().split("T")[0];
    
    // Cache-first: Try cached "today" first
    const cached = await loadJson<TodayRow>(TODAY_KEY(resolvedDate));
    if (cached?.status === 'ready') {
      console.log('[CACHE_HIT_TODAY]', resolvedDate);
      dispatch({ type: 'SET_TODAY', payload: cached });
      return;
    }

    console.log("[NETWORK_FETCH]", resolvedDate);
    try {
      const dayResult: any = await getDay(resolvedDate);

      // If missing or server says not found -> use fallback
      if (!dayResult || (dayResult.status as string) === "not_found") {
        const fallback = await getTodayFallback();
        const ready = {
          date: resolvedDate,
          status: 'ready' as const,
          title: fallback.title,
          payloadJson: fallback.payloadJson,
        };
        await saveJson(TODAY_KEY(resolvedDate), ready);
        console.log('[CACHE_SAVE_TODAY]', resolvedDate);
        dispatch({ type: 'SET_TODAY', payload: ready });
        return;
      }

      // If the server already has a finished workout, cache it and stop
      if (dayResult.status === "ready") {
        const ready = {
          date: resolvedDate,
          status: 'ready' as const,
          title: dayResult.title,
          payloadJson: dayResult.payloadJson,
        };
        await saveJson(TODAY_KEY(resolvedDate), ready);
        console.log('[CACHE_SAVE_TODAY]', resolvedDate);
        dispatch({ type: 'SET_TODAY', payload: ready });
        return;
      }

      // Set initial today state from API (pending/generating)
      dispatch({
        type: "SET_TODAY",
        payload: {
          date: resolvedDate,
          status: dayResult.status,
          title: dayResult.title,
          payloadJson: dayResult.payloadJson,
        },
      });
      console.log("TODAY_DEBUG", dayResult.status, dayResult.title);

      // If still generating or pending, poll
      if (dayResult.status === "generating" || dayResult.status === "pending") {
        const startTime = Date.now();
        const maxPollTime = 45_000; // 45s

        while (Date.now() - startTime < maxPollTime) {
          await new Promise((resolve) => setTimeout(resolve, 2000)); // 2s
          try {
            const polledResult: any = await getDay(resolvedDate);

            console.log("TODAY_DEBUG", polledResult.status, polledResult.title);

            if (polledResult.status === "ready") {
              const ready = {
                date: resolvedDate,
                status: 'ready' as const,
                title: polledResult.title,
                payloadJson: polledResult.payloadJson,
              };
              await saveJson(TODAY_KEY(resolvedDate), ready);
              console.log('[CACHE_SAVE_TODAY]', resolvedDate);
              dispatch({ type: 'SET_TODAY', payload: ready });
              break;
            }

            // Update current today state while still polling
            dispatch({
              type: "SET_TODAY",
              payload: {
                date: resolvedDate,
                status: polledResult.status,
                title: polledResult.title,
                payloadJson: polledResult.payloadJson,
              },
            });
          } catch (pollError) {
            console.error("Error polling day:", pollError);
            // keep polling on error
          }
        }
      }
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload:
          error instanceof Error ? error.message : "Failed to load today",
      });
    }
  };

  // ----- ensureToday (call server generate if needed) -----
  const ensureToday = async (date: string): Promise<void> => {
    try {
      const r: any = await getDay(date);
      if (r?.status === 'pending' || r?.status === 'error' || !r) {
        console.log('[PREGEN]', date);
        await postGenerateDay(date);
      }
    } catch (error) {
      console.error("Error ensuring today:", error);
    }
  };

  // ----- pollUntilReady (utility) -----
  const pollUntilReady = async (
    date: string,
    timeoutMs = 45_000,
  ): Promise<TodayRow> => {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      try {
        const dayResult = (await getDay(date)) as TodayRow;
        if (dayResult.status === "ready") {
          return dayResult;
        }
      } catch (error) {
        console.error("Error polling day:", error);
      }

      // wait 2s before next attempt
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    // Timeout: return whatever the server currently has
    return (await getDay(date)) as TodayRow;
  };

  // ----- generateAndPoll -----
  const generateAndPoll = async (date: string): Promise<void> => {
    // Check cache first before generating
    const cachedToday = await loadJson<TodayRow>(TODAY_KEY(date));
    if (cachedToday && cachedToday.status === "ready") {
      dispatch({ type: "SET_TODAY", payload: cachedToday });
      return;
    }

    console.log("[NETWORK_GENERATE]", date);
    dispatch({ type: "SET_GENERATING", payload: true });
    try {
      await postGenerateDay(date);

      const t0 = Date.now();
      while (Date.now() - t0 < 45_000) {
        const d: any = await getDay(date);
        if (d?.status === "ready") {
          const readyPayload = {
            date: d.date,
            status: "ready" as const,
            title: d.title,
            payloadJson: d.payloadJson || {},
          };
          dispatch({ type: "SET_TODAY", payload: readyPayload });

          // Save to cache
          await saveJson(TODAY_KEY(date), readyPayload);
          console.log("TODAY_DEBUG", "ready", d.title);
          return;
        }
        await new Promise((res) => setTimeout(res, 2000));
      }

      console.warn("[NETWORK_TIMEOUT]", date);
    } finally {
      dispatch({ type: "SET_GENERATING", payload: false });
    }
  };

  const value: WorkoutsContextType = {
    ...state,
    loadWeek,
    loadToday,
    ensureToday,
    pollUntilReady,
    generateAndPoll,
  };

  return (
    <WorkoutsContext.Provider value={value}>
      {children}
    </WorkoutsContext.Provider>
  );
}

// ---------- Hook ----------

export function useWorkouts(): WorkoutsContextType {
  const context = useContext(WorkoutsContext);
  if (context === undefined) {
    throw new Error("useWorkouts must be used within a WorkoutsProvider");
  }
  return context;
}
