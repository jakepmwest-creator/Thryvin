import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CoachStore {
  coachName: string;
  chatVisible: boolean;
  initialMessage: string | null;
  openChat: (message?: string) => void;
  closeChat: () => void;
  setCoachName: (name: string) => void;
  loadCoachName: () => Promise<void>;
}

export const useCoachStore = create<CoachStore>((set, get) => ({
  coachName: 'Your Coach',
  chatVisible: false,
  initialMessage: null,
  openChat: (message) => set({ chatVisible: true, initialMessage: message || null }),
  closeChat: () => set({ chatVisible: false, initialMessage: null }),
  setCoachName: async (name: string) => {
    set({ coachName: name });
    await AsyncStorage.setItem('coach_name', name);
  },
  loadCoachName: async () => {
    try {
      const name = await AsyncStorage.getItem('coach_name');
      if (name) {
        set({ coachName: name });
      }
    } catch (error) {
      console.error('Failed to load coach name:', error);
    }
  },
}));
