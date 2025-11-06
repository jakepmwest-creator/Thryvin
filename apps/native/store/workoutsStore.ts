import { create } from 'zustand';

export type Workout = { id: string; name: string; completed: boolean; date?: string };

type WorkoutsState = {
  workouts: Workout[];
  addWorkout: (w: Omit<Workout, 'id'>) => void;
  toggleComplete: (id: string) => void;
};

export const useWorkoutsStore = create<WorkoutsState>((set) => ({
  workouts: [],
  addWorkout: (w) =>
    set((s) => ({ workouts: [...s.workouts, { id: String(Date.now()), ...w }] })),
  toggleComplete: (id) =>
    set((s) => ({
      workouts: s.workouts.map((x) => (x.id === id ? { ...x, completed: !x.completed } : x)),
    })),
}));