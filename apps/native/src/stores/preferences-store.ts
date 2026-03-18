import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

interface ExercisePreference {
  exerciseId: string;
  exerciseName: string;
  preference: 'liked' | 'disliked';
  timestamp: string;
}

interface StarredExercise {
  exerciseId: string;
  exerciseName: string;
  videoUrl?: string;
  timestamp: string;
}

const MAX_STARRED = 3;

interface PreferencesStore {
  preferences: ExercisePreference[];
  starred: StarredExercise[];
  loadPreferences: () => Promise<void>;
  likeExercise: (exerciseId: string, exerciseName: string) => Promise<void>;
  dislikeExercise: (exerciseId: string, exerciseName: string) => Promise<void>;
  removePreference: (exerciseId: string) => Promise<void>;
  getPreference: (exerciseId: string) => 'liked' | 'disliked' | null;
  getLikedExercises: () => ExercisePreference[];
  getDislikedExercises: () => ExercisePreference[];
  // Star system
  starExercise: (exerciseId: string, exerciseName: string, videoUrl?: string) => Promise<boolean>;
  unstarExercise: (exerciseId: string) => Promise<void>;
  isStarred: (exerciseId: string) => boolean;
  getStarredExercises: () => StarredExercise[];
  // Replace flow
  replaceStarred: (oldId: string, newId: string, newName: string, videoUrl?: string) => Promise<void>;
}

export const usePreferencesStore = create<PreferencesStore>((set, get) => ({
  preferences: [],
  starred: [],
  
  loadPreferences: async () => {
    try {
      const [storedPrefs, storedStarred] = await Promise.all([
        AsyncStorage.getItem('exercise_preferences'),
        AsyncStorage.getItem('exercise_starred'),
      ]);
      set({
        preferences: storedPrefs ? JSON.parse(storedPrefs) : [],
        starred: storedStarred ? JSON.parse(storedStarred) : [],
      });
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  },
  
  likeExercise: async (exerciseId: string, exerciseName: string) => {
    const { preferences } = get();
    const existing = preferences.find(p => p.exerciseId === exerciseId);
    let updated;
    if (existing) {
      updated = preferences.map(p =>
        p.exerciseId === exerciseId
          ? { ...p, preference: 'liked' as const, timestamp: new Date().toISOString() }
          : p
      );
    } else {
      updated = [...preferences, { exerciseId, exerciseName, preference: 'liked' as const, timestamp: new Date().toISOString() }];
    }
    set({ preferences: updated });
    await AsyncStorage.setItem('exercise_preferences', JSON.stringify(updated));
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
      updated = [...preferences, { exerciseId, exerciseName, preference: 'disliked' as const, timestamp: new Date().toISOString() }];
    }
    set({ preferences: updated });
    await AsyncStorage.setItem('exercise_preferences', JSON.stringify(updated));
  },
  
  removePreference: async (exerciseId: string) => {
    const { preferences } = get();
    const updated = preferences.filter(p => p.exerciseId !== exerciseId);
    set({ preferences: updated });
    await AsyncStorage.setItem('exercise_preferences', JSON.stringify(updated));
  },
  
  getPreference: (exerciseId: string) => {
    const pref = get().preferences.find(p => p.exerciseId === exerciseId);
    return pref ? pref.preference : null;
  },
  
  getLikedExercises: () => get().preferences.filter(p => p.preference === 'liked'),
  getDislikedExercises: () => get().preferences.filter(p => p.preference === 'disliked'),

  // Star system — max 3
  starExercise: async (exerciseId: string, exerciseName: string, videoUrl?: string) => {
    const { starred } = get();
    if (starred.some(s => s.exerciseId === exerciseId)) return true; // already starred
    
    if (starred.length >= MAX_STARRED) {
      // Return false to signal the UI should show replace prompt
      return false;
    }
    
    const updated = [...starred, { exerciseId, exerciseName, videoUrl, timestamp: new Date().toISOString() }];
    set({ starred: updated });
    await AsyncStorage.setItem('exercise_starred', JSON.stringify(updated));
    return true;
  },

  unstarExercise: async (exerciseId: string) => {
    const { starred } = get();
    const updated = starred.filter(s => s.exerciseId !== exerciseId);
    set({ starred: updated });
    await AsyncStorage.setItem('exercise_starred', JSON.stringify(updated));
  },

  isStarred: (exerciseId: string) => get().starred.some(s => s.exerciseId === exerciseId),

  getStarredExercises: () => get().starred,

  replaceStarred: async (oldId: string, newId: string, newName: string, videoUrl?: string) => {
    const { starred } = get();
    const updated = starred
      .filter(s => s.exerciseId !== oldId)
      .concat({ exerciseId: newId, exerciseName: newName, videoUrl, timestamp: new Date().toISOString() });
    set({ starred: updated });
    await AsyncStorage.setItem('exercise_starred', JSON.stringify(updated));
  },
}));
