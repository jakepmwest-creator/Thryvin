import { create } from 'zustand';
import { getWeek, getDay, type WeekRow, type DayPayload } from '@/lib/workouts-api';

interface WorkoutDay {
  meta: {
    title?: string;
    status?: 'empty' | 'scheduled' | 'completed' | 'pending' | 'generating' | 'ready' | 'error';
  };
  payload: {
    title?: string;
    exercises?: any[];
    duration_min?: number;
    emoji?: string;
    blocks?: DayPayload['blocks'];
    coach_notes?: string;
  };
}

interface WorkoutStore {
  selectedDateISO: string;
  daysByDate: Record<string, WorkoutDay>;
  todayISO: string;
  
  week: WeekRow[] | null;
  today: { date: string; status: string; title?: string; payloadJson?: DayPayload } | null;
  loading: boolean;
  error: string | null;
  
  setSelectedDate: (dateISO: string) => void;
  setWorkoutDay: (dateISO: string, workout: WorkoutDay) => void;
  initializeToday: () => void;
  
  loadWeek: () => Promise<void>;
  loadToday: (date?: string) => Promise<void>;
}

export const useWorkoutStore = create<WorkoutStore>((set, get) => ({
  selectedDateISO: '',
  daysByDate: {},
  todayISO: new Date().toISOString().split('T')[0],
  
  week: null,
  today: null,
  loading: false,
  error: null,
  
  setSelectedDate: (dateISO: string) => {
    set({ selectedDateISO: dateISO });
  },
  
  setWorkoutDay: (dateISO: string, workout: WorkoutDay) => {
    set((state) => ({
      daysByDate: {
        ...state.daysByDate,
        [dateISO]: workout
      }
    }));
  },
  
  initializeToday: () => {
    const today = new Date().toISOString().split('T')[0];
    const state = get();
    
    set({ 
      todayISO: today,
      selectedDateISO: state.selectedDateISO || today
    });
  },
  
  loadWeek: async () => {
    try {
      set({ loading: true, error: null });
      const response = await getWeek();
      console.log('WEEK_DEBUG', response.workouts);
      
      const newDaysByDate: Record<string, WorkoutDay> = {};
      
      response.workouts.forEach((workout) => {
        const dateISO = workout.date.split('T')[0];
        newDaysByDate[dateISO] = {
          meta: {
            title: workout.title,
            status: workout.status as any
          },
          payload: {
            title: workout.title,
            duration_min: 30
          }
        };
      });
      
      set({ 
        week: response.workouts, 
        daysByDate: newDaysByDate,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Failed to load week:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load week',
        loading: false 
      });
    }
  },
  
  loadToday: async (date?: string) => {
    const resolvedDate = date || new Date().toISOString().split('T')[0];
    
    try {
      const dayResult = await getDay(resolvedDate);
      console.log('TODAY_DEBUG', dayResult);
      
      set({
        today: {
          date: resolvedDate,
          status: dayResult.status,
          title: dayResult.title,
          payloadJson: dayResult.payloadJson
        }
      });
      
      const workoutDay: WorkoutDay = {
        meta: {
          title: dayResult.title,
          status: dayResult.status as any
        },
        payload: {
          title: dayResult.title,
          duration_min: dayResult.payloadJson?.duration_min,
          blocks: dayResult.payloadJson?.blocks,
          coach_notes: dayResult.payloadJson?.coach_notes
        }
      };
      
      set((state) => ({
        daysByDate: {
          ...state.daysByDate,
          [resolvedDate]: workoutDay
        }
      }));
      
      if (dayResult.status === 'generating' || dayResult.status === 'pending') {
        const startTime = Date.now();
        const maxPollTime = 45000;
        
        while (Date.now() - startTime < maxPollTime) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          try {
            const polledResult = await getDay(resolvedDate);
            console.log('TODAY_DEBUG (polling)', polledResult);
            
            set({
              today: {
                date: resolvedDate,
                status: polledResult.status,
                title: polledResult.title,
                payloadJson: polledResult.payloadJson
              }
            });
            
            const updatedWorkoutDay: WorkoutDay = {
              meta: {
                title: polledResult.title,
                status: polledResult.status as any
              },
              payload: {
                title: polledResult.title,
                duration_min: polledResult.payloadJson?.duration_min,
                blocks: polledResult.payloadJson?.blocks,
                coach_notes: polledResult.payloadJson?.coach_notes
              }
            };
            
            set((state) => ({
              daysByDate: {
                ...state.daysByDate,
                [resolvedDate]: updatedWorkoutDay
              }
            }));
            
            if (polledResult.status === 'ready') {
              break;
            }
          } catch (pollError) {
            console.error('Error polling day:', pollError);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load today:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load today'
      });
    }
  }
}));
