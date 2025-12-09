import { create } from 'zustand';

interface CoachStore {
  chatVisible: boolean;
  initialMessage: string | null;
  openChat: (message?: string) => void;
  closeChat: () => void;
}

export const useCoachStore = create<CoachStore>((set) => ({
  chatVisible: false,
  initialMessage: null,
  openChat: (message) => set({ chatVisible: true, initialMessage: message || null }),
  closeChat: () => set({ chatVisible: false, initialMessage: null }),
}));
