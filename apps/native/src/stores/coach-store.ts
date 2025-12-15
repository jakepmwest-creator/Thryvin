import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Coach personality types
export type CoachPersonality = 'friendly' | 'disciplined' | 'aggressive' | 'motivational';

export const COACH_PERSONALITIES: { id: CoachPersonality; name: string; description: string; tone: string }[] = [
  { 
    id: 'friendly', 
    name: 'Friendly', 
    description: 'Supportive and encouraging',
    tone: 'warm, supportive, and encouraging. Use phrases like "Great job!", "You\'ve got this!", "No worries, take your time". Be understanding and positive.'
  },
  { 
    id: 'disciplined', 
    name: 'Disciplined', 
    description: 'Structured and focused',
    tone: 'professional, structured, and focused. Be direct and clear. Emphasize consistency and proper form. Use phrases like "Stay focused", "Maintain discipline", "Follow the plan".'
  },
  { 
    id: 'aggressive', 
    name: 'Aggressive', 
    description: 'Intense and pushing',
    tone: 'intense, challenging, and pushing. Use phrases like "Push harder!", "No excuses!", "Come on, let\'s go!", "You can do better than that!". Be demanding but motivating.'
  },
  { 
    id: 'motivational', 
    name: 'Motivational', 
    description: 'Inspiring and uplifting',
    tone: 'inspiring, uplifting, and energetic. Use phrases like "You\'re unstoppable!", "This is YOUR moment!", "Champions are made here!". Share motivational insights.'
  },
];

interface CoachStore {
  coachName: string;
  coachPersonality: CoachPersonality;
  chatVisible: boolean;
  initialMessage: string | null;
  openChat: (message?: string) => void;
  closeChat: () => void;
  setCoachName: (name: string) => void;
  setCoachPersonality: (personality: CoachPersonality) => void;
  loadCoachSettings: () => Promise<void>;
  getPersonalityTone: () => string;
}

export const useCoachStore = create<CoachStore>((set, get) => ({
  coachName: 'Your Coach',
  coachPersonality: 'friendly',
  chatVisible: false,
  initialMessage: null,
  openChat: (message) => set({ chatVisible: true, initialMessage: message || null }),
  closeChat: () => set({ chatVisible: false, initialMessage: null }),
  setCoachName: async (name: string) => {
    set({ coachName: name });
    await AsyncStorage.setItem('coach_name', name);
  },
  setCoachPersonality: async (personality: CoachPersonality) => {
    set({ coachPersonality: personality });
    await AsyncStorage.setItem('coach_personality', personality);
  },
  loadCoachSettings: async () => {
    try {
      const name = await AsyncStorage.getItem('coach_name');
      const personality = await AsyncStorage.getItem('coach_personality') as CoachPersonality;
      if (name) {
        set({ coachName: name });
      }
      if (personality && ['friendly', 'disciplined', 'aggressive', 'motivational'].includes(personality)) {
        set({ coachPersonality: personality });
      }
    } catch (error) {
      console.error('Failed to load coach settings:', error);
    }
  },
  getPersonalityTone: () => {
    const personality = get().coachPersonality;
    const found = COACH_PERSONALITIES.find(p => p.id === personality);
    return found?.tone || COACH_PERSONALITIES[0].tone;
  },
  // Legacy function for backward compatibility
  loadCoachName: async () => {
    await get().loadCoachSettings();
  },
}));
