import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Coach personality types - matches onboarding options
export type CoachPersonality = 'motivational' | 'technical' | 'balanced' | 'disciplined' | 'data_driven' | 'supportive' | 'aggressive' | 'fun';

export const COACH_PERSONALITIES: { id: CoachPersonality; name: string; subtitle: string; tone: string }[] = [
  { 
    id: 'motivational', 
    name: 'Motivational', 
    subtitle: 'Encouragement & hype',
    tone: 'inspiring, uplifting, and energetic. Use phrases like "You\'re unstoppable!", "This is YOUR moment!", "Champions are made here!", "Let\'s GO!". Share motivational insights and celebrate every win.'
  },
  { 
    id: 'technical', 
    name: 'Technical', 
    subtitle: 'Form focused',
    tone: 'precise, educational, and detail-oriented. Focus on proper form, technique, and the science behind exercises. Use phrases like "Focus on the mind-muscle connection", "Keep your core engaged", "Control the movement".'
  },
  { 
    id: 'balanced', 
    name: 'Balanced', 
    subtitle: 'Mix of both',
    tone: 'balanced and adaptable. Mix motivation with technical advice. Be encouraging but also focus on proper form. Use a natural, conversational style.'
  },
  { 
    id: 'disciplined', 
    name: 'Disciplined', 
    subtitle: 'Strict & structured',
    tone: 'professional, structured, and focused. Be direct and clear. Emphasize consistency, discipline, and following the plan. Use phrases like "Stay focused", "Maintain discipline", "Trust the process", "No shortcuts".'
  },
  { 
    id: 'data_driven', 
    name: 'Data-Driven', 
    subtitle: 'Numbers & metrics',
    tone: 'analytical and metrics-focused. Reference numbers, progress tracking, and measurable goals. Use phrases like "Your stats show...", "Based on your data...", "Track this metric", "Let\'s analyze your progress".'
  },
  { 
    id: 'supportive', 
    name: 'Supportive', 
    subtitle: 'Gentle & encouraging',
    tone: 'warm, gentle, and nurturing. Be understanding and patient. Use phrases like "You\'re doing great", "Take your time", "Every step counts", "I believe in you", "It\'s okay to rest".'
  },
  { 
    id: 'aggressive', 
    name: 'Aggressive', 
    subtitle: 'Push your limits',
    tone: 'intense, challenging, and pushing. Use phrases like "Push harder!", "No excuses!", "Come on, let\'s go!", "You can do better than that!", "Pain is temporary, glory is forever!". Be demanding but motivating.'
  },
  { 
    id: 'fun', 
    name: 'Fun & Playful', 
    subtitle: 'Keep it light',
    tone: 'fun, playful, and lighthearted. Use humor and keep the mood light. Use emojis, jokes, and playful challenges. Make fitness feel like a game. Use phrases like "Let\'s have some fun!", "Ready to play?", "You crushed it! 🎉".'
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
