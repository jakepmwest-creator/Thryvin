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

// Helper: sync to backend with retry (awaited, not fire-and-forget)
async function syncToBackend(preferences: ExercisePreference[], starred: StarredExercise[]) {
  const token = await getToken();
  if (!token) {
    console.warn('[Prefs] No token, skipping backend sync');
    return;
  }
  
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/exercise-preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ preferences, starred }),
      });
      if (res.ok) {
        console.log(`[Prefs] Backend sync OK (${preferences.length} prefs, ${starred.length} starred)`);
        return;
      }
      console.warn(`[Prefs] Backend sync HTTP ${res.status} (attempt ${attempt})`);
    } catch (err) {
      console.warn(`[Prefs] Backend sync failed (attempt ${attempt}):`, err);
    }
    if (attempt < 2) await new Promise(r => setTimeout(r, 1000));
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
      // Step 1: Load local AsyncStorage immediately (fast, always available)
      const [storedPrefs, storedStarred] = await Promise.all([
        AsyncStorage.getItem('exercise_preferences'),
        AsyncStorage.getItem('exercise_starred'),
      ]);
      const localPrefs = storedPrefs ? JSON.parse(storedPrefs) : [];
      const localStars = storedStarred ? JSON.parse(storedStarred) : [];

      // Set local data immediately so UI isn't empty
      if (localPrefs.length > 0 || localStars.length > 0) {
        set({ preferences: localPrefs, starred: localStars });
        console.log(`[Prefs] Loaded local: ${localPrefs.length} prefs, ${localStars.length} starred`);
      }

      // Step 2: Try backend (source of truth)
      const token = await getToken();
      if (token) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/exercise-preferences`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            const backendPrefs = data.preferences || [];
            const backendStars = data.starred || [];

            if (backendPrefs.length > 0 || backendStars.length > 0) {
              // Backend has data - use it as source of truth
              set({ preferences: backendPrefs, starred: backendStars, _loaded: true });
              await saveLocal(backendPrefs, backendStars);
              console.log(`[Prefs] Backend data loaded: ${backendPrefs.length} prefs, ${backendStars.length} starred`);
              return;
            } else if (localPrefs.length > 0 || localStars.length > 0) {
              // Backend is empty but local has data - push local to backend
              console.log('[Prefs] Backend empty, pushing local data to backend');
              syncToBackend(localPrefs, localStars);
            }
          }
        } catch (backendErr) {
          console.warn('[Prefs] Backend fetch failed, using local:', backendErr);
        }
      }

      // Finalize with whatever we have (local data or empty)
      set({ preferences: localPrefs, starred: localStars, _loaded: true });
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
    await syncToBackend(updated, starred);
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
    await syncToBackend(updated, starred);
  },

  removePreference: async (exerciseId: string) => {
    const { preferences, starred } = get();
    const updated = preferences.filter(p => p.exerciseId !== exerciseId);
    set({ preferences: updated });
    await saveLocal(updated, starred);
    await syncToBackend(updated, starred);
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
    await syncToBackend(preferences, updated);
    return true;
  },

  unstarExercise: async (exerciseId: string) => {
    const { starred, preferences } = get();
    const updated = starred.filter(s => s.exerciseId !== exerciseId);
    set({ starred: updated });
    await saveLocal(preferences, updated);
    await syncToBackend(preferences, updated);
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
    await syncToBackend(preferences, updated);
  },
}));
