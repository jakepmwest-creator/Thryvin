import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ExercisePreference {
  exerciseId: string;
  exerciseName: string;
  preference: 'liked' | 'disliked';
  timestamp: string;
}

interface PreferencesStore {
  preferences: ExercisePreference[];
  loadPreferences: () => Promise<void>;
  likeExercise: (exerciseId: string, exerciseName: string) => Promise<void>;
  dislikeExercise: (exerciseId: string, exerciseName: string) => Promise<void>;
  removePreference: (exerciseId: string) => Promise<void>;
  getPreference: (exerciseId: string) => 'liked' | 'disliked' | null;
  getLikedExercises: () => ExercisePreference[];
  getDislikedExercises: () => ExercisePreference[];
}

export const usePreferencesStore = create<PreferencesStore>((set, get) => ({
  preferences: [],
  
  loadPreferences: async () => {
    try {
      const stored = await AsyncStorage.getItem('exercise_preferences');
      if (stored) {
        set({ preferences: JSON.parse(stored) });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  },
  
  likeExercise: async (exerciseId: string, exerciseName: string) => {
    const { preferences } = get();
    const existing = preferences.find(p => p.exerciseId === exerciseId);
    
    let updated;
    if (existing) {
      // Update existing
      updated = preferences.map(p => 
        p.exerciseId === exerciseId 
          ? { ...p, preference: 'liked' as const, timestamp: new Date().toISOString() }
          : p
      );
    } else {
      // Add new
      updated = [
        ...preferences,
        {
          exerciseId,
          exerciseName,
          preference: 'liked' as const,
          timestamp: new Date().toISOString(),
        }
      ];
    }
    
    set({ preferences: updated });
    await AsyncStorage.setItem('exercise_preferences', JSON.stringify(updated));
    console.log('✅ Liked:', exerciseName);
  },
  
  dislikeExercise: async (exerciseId: string, exerciseName: string) => {
    const { preferences } = get();
    const existing = preferences.find(p => p.exerciseId === exerciseId);
    
    let updated;
    if (existing) {
      updated = preferences.map(p => 
        p.exerciseId === exerciseId 
          ? { ...p, preference: 'disliked' as const, timestamp: new Date().toISOString() }
          : p
      );
    } else {
      updated = [
        ...preferences,
        {
          exerciseId,
          exerciseName,
          preference: 'disliked' as const,
          timestamp: new Date().toISOString(),
        }
      ];
    }
    
    set({ preferences: updated });
    await AsyncStorage.setItem('exercise_preferences', JSON.stringify(updated));
    console.log('❌ Disliked:', exerciseName);
  },
  
  removePreference: async (exerciseId: string) => {
    const { preferences } = get();
    const updated = preferences.filter(p => p.exerciseId !== exerciseId);
    set({ preferences: updated });
    await AsyncStorage.setItem('exercise_preferences', JSON.stringify(updated));
  },
  
  getPreference: (exerciseId: string) => {
    const { preferences } = get();
    const pref = preferences.find(p => p.exerciseId === exerciseId);
    return pref ? pref.preference : null;
  },
  
  getLikedExercises: () => {
    const { preferences } = get();
    return preferences.filter(p => p.preference === 'liked');
  },
  
  getDislikedExercises: () => {
    const { preferences } = get();
    return preferences.filter(p => p.preference === 'disliked');
  },
}));
