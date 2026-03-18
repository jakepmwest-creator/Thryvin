import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { getApiBaseUrl } from '../services/env';

const API_BASE_URL = getApiBaseUrl();

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
  _loaded: boolean;
  loadPreferences: () => Promise<void>;
  likeExercise: (exerciseId: string, exerciseName: string) => Promise<void>;
  dislikeExercise: (exerciseId: string, exerciseName: string) => Promise<void>;
  removePreference: (exerciseId: string) => Promise<void>;
  getPreference: (exerciseId: string) => 'liked' | 'disliked' | null;
  getLikedExercises: () => ExercisePreference[];
  getDislikedExercises: () => ExercisePreference[];
  starExercise: (exerciseId: string, exerciseName: string, videoUrl?: string) => Promise<boolean>;
  unstarExercise: (exerciseId: string) => Promise<void>;
  isStarred: (exerciseId: string) => boolean;
  getStarredExercises: () => StarredExercise[];
  replaceStarred: (oldId: string, newId: string, newName: string, videoUrl?: string) => Promise<void>;
}

// Helper: get auth token
async function getToken(): Promise<string | null> {
  try { return await SecureStore.getItemAsync('thryvin_access_token'); } catch { return null; }
}

// Helper: sync to backend (fire-and-forget)
async function syncToBackend(preferences: ExercisePreference[], starred: StarredExercise[]) {
  try {
    const token = await getToken();
    if (!token) return;
    await fetch(`${API_BASE_URL}/api/exercise-preferences`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ preferences, starred }),
    });
  } catch (err) {
    console.warn('[Prefs] Backend sync failed (will retry on next change):', err);
  }
}

// Helper: save to AsyncStorage (local backup)
async function saveLocal(preferences: ExercisePreference[], starred: StarredExercise[]) {
  await Promise.all([
    AsyncStorage.setItem('exercise_preferences', JSON.stringify(preferences)),
    AsyncStorage.setItem('exercise_starred', JSON.stringify(starred)),
  ]);
}

export const usePreferencesStore = create<PreferencesStore>((set, get) => ({
  preferences: [],
  starred: [],
  _loaded: false,

  loadPreferences: async () => {
    if (get()._loaded) return;
    try {
      // Try backend first
      const token = await getToken();
      if (token) {
        const res = await fetch(`${API_BASE_URL}/api/exercise-preferences`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.preferences?.length > 0 || data.starred?.length > 0) {
            set({ preferences: data.preferences || [], starred: data.starred || [], _loaded: true });
            // Also update local cache
            await saveLocal(data.preferences || [], data.starred || []);
            return;
          }
        }
      }

      // Fallback to local AsyncStorage
      const [storedPrefs, storedStarred] = await Promise.all([
        AsyncStorage.getItem('exercise_preferences'),
        AsyncStorage.getItem('exercise_starred'),
      ]);
      const prefs = storedPrefs ? JSON.parse(storedPrefs) : [];
      const stars = storedStarred ? JSON.parse(storedStarred) : [];
      set({ preferences: prefs, starred: stars, _loaded: true });
      
      // If we loaded from local, push to backend
      if (prefs.length > 0 || stars.length > 0) {
        syncToBackend(prefs, stars);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      set({ _loaded: true });
    }
  },

  likeExercise: async (exerciseId: string, exerciseName: string) => {
    const { preferences, starred } = get();
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
    await saveLocal(updated, starred);
    syncToBackend(updated, starred);
  },

  dislikeExercise: async (exerciseId: string, exerciseName: string) => {
    const { preferences, starred } = get();
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
    await saveLocal(updated, starred);
    syncToBackend(updated, starred);
  },

  removePreference: async (exerciseId: string) => {
    const { preferences, starred } = get();
    const updated = preferences.filter(p => p.exerciseId !== exerciseId);
    set({ preferences: updated });
    await saveLocal(updated, starred);
    syncToBackend(updated, starred);
  },

  getPreference: (exerciseId: string) => {
    const pref = get().preferences.find(p => p.exerciseId === exerciseId);
    return pref ? pref.preference : null;
  },

  getLikedExercises: () => get().preferences.filter(p => p.preference === 'liked'),
  getDislikedExercises: () => get().preferences.filter(p => p.preference === 'disliked'),

  starExercise: async (exerciseId: string, exerciseName: string, videoUrl?: string) => {
    const { starred, preferences } = get();
    if (starred.some(s => s.exerciseId === exerciseId)) return true;
    if (starred.length >= MAX_STARRED) return false;

    const updated = [...starred, { exerciseId, exerciseName, videoUrl, timestamp: new Date().toISOString() }];
    set({ starred: updated });
    await saveLocal(preferences, updated);
    syncToBackend(preferences, updated);
    return true;
  },

  unstarExercise: async (exerciseId: string) => {
    const { starred, preferences } = get();
    const updated = starred.filter(s => s.exerciseId !== exerciseId);
    set({ starred: updated });
    await saveLocal(preferences, updated);
    syncToBackend(preferences, updated);
  },

  isStarred: (exerciseId: string) => get().starred.some(s => s.exerciseId === exerciseId),
  getStarredExercises: () => get().starred,

  replaceStarred: async (oldId: string, newId: string, newName: string, videoUrl?: string) => {
    const { starred, preferences } = get();
    const updated = starred
      .filter(s => s.exerciseId !== oldId)
      .concat({ exerciseId: newId, exerciseName: newName, videoUrl, timestamp: new Date().toISOString() });
    set({ starred: updated });
    await saveLocal(preferences, updated);
    syncToBackend(preferences, updated);
  },
}));
