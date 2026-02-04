import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationService } from '../services/notificationService';
import { useWorkoutStore } from './workout-store';
import { useAwardsStore } from './awards-store';
import { storeToken, clearToken, getToken } from '../services/api-client';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://workout-data-cleanup.preview.emergentagent.com';

// Storage helpers - Use AsyncStorage for large data (user profiles can be >2KB)
// Only use SecureStore for small secrets (email, password, tokens)
const getStorageItem = async (key: string): Promise<string | null> => {
  try {
    // Small secrets use SecureStore
    if (['user_email', 'user_password', 'user_pin', 'biometric_token'].includes(key)) {
      return await SecureStore.getItemAsync(key);
    }
    // Large data uses AsyncStorage
    return await AsyncStorage.getItem(key);
  } catch (error) {
    // Fallback to AsyncStorage if SecureStore fails
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  }
};

const setStorageItem = async (key: string, value: string): Promise<void> => {
  try {
    // Small secrets use SecureStore (must be under 2048 bytes)
    if (['user_email', 'user_password', 'user_pin', 'biometric_token'].includes(key)) {
      await SecureStore.setItemAsync(key, value);
    } else {
      // Large data uses AsyncStorage
      await AsyncStorage.setItem(key, value);
    }
  } catch (error) {
    // Fallback to AsyncStorage
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.error('Storage error:', e);
    }
  }
};


const deleteStorageItem = async (key: string): Promise<void> => {
  try {
    // Try both to ensure cleanup
    await SecureStore.deleteItemAsync(key).catch(() => {});
    await AsyncStorage.removeItem(key).catch(() => {});
  } catch (error) {
    console.warn('Delete storage error:', error);
  }
};

interface User {
  id: number;
  name: string;
  email: string;
  trainingType?: string;
  goal?: string;
  coachingStyle?: string;
  trainingDays?: string | number;
  sessionDuration?: string | number;
  experience?: string;
  equipment?: string[];
  injuries?: string[];
  fitnessGoals?: string[];
  pushToken?: string;
}

// Function to clear ALL local data for a fresh user experience
async function clearAllLocalData(): Promise<void> {
  console.log('🧹 Clearing ALL local data for fresh user experience...');
  
  // Clear SecureStore items
  const secureStoreKeys = [
    'auth_user', 'user_email', 'user_password', 'user_pin',
    'week_workouts', 'week_workouts_date', 'week_workouts_version',
    'today_workout', 'today_workout_date', 'completed_workouts',
    'future_weeks', 'workout_stats', 'personal_bests',
    'biometric_enabled', 'biometrics_enabled',
    'user_badges', 'user_badges_v3',
  ];
  
  for (const key of secureStoreKeys) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (e) {
      // Ignore errors
    }
  }
  
  // Clear AsyncStorage items (profile image, settings, questionnaire, etc.)
  const asyncStorageKeys = [
    'user_profile_image', 'user_bio', 'user_name',
    'advancedQuestionnaire', 'advancedQuestionnaireSkipped',
    'tourCompleted', 'tourSkipped',
    'notifications_enabled', 'workout_reminders_enabled',
    'pin_enabled', 'user_pin',
    'weeklyScheduleCheckSnoozed', 'lastWeeklyScheduleCheck', 'currentWeekDays',
  ];
  
  // Import AsyncStorage dynamically to avoid issues
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    for (const key of asyncStorageKeys) {
      try {
        await AsyncStorage.removeItem(key);
      } catch (e) {
        // Ignore
      }
    }
  } catch (e) {
    console.log('AsyncStorage not available, skipping...');
  }
  
  // Also clear web localStorage if available
  if (typeof window !== 'undefined' && window.localStorage) {
    asyncStorageKeys.forEach(key => {
      try {
        window.localStorage.removeItem(key);
      } catch (e) {
        // Ignore
      }
    });
  }
  
  // Reset workout store
  try {
    useWorkoutStore.getState().resetAllData();
  } catch (e) {
    console.log('Workout store reset not available');
  }
  
  console.log('✅ All local data cleared!');
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  clearError: () => void;
  // QA helper - directly set user state (for Fast Tester Login)
  setUserDirectly: (user: User) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,

  // QA helper - directly set user state (for Fast Tester Login)
  setUserDirectly: async (userData: User) => {
    set({ user: userData, isLoading: false, error: null });
    await setStorageItem('auth_user', JSON.stringify(userData));
    await setStorageItem('user_email', userData.email);
    console.log('✅ User set directly (QA mode):', userData.name);
    
    // CRITICAL: Also load user data from backend for Fast Tester Login
    console.log('🔄 Loading user data from backend (QA mode)...');
    try {
      const workoutStore = useWorkoutStore.getState();
      await workoutStore.fetchWeekWorkouts();
      await workoutStore.fetchCompletedWorkouts();
      await workoutStore.fetchStats();
      
      const awardsStore = useAwardsStore.getState();
      await awardsStore.loadUserBadges();
      console.log('✅ User data loaded from backend (QA mode)');
    } catch (loadError) {
      console.warn('⚠️ Could not load data after QA login:', loadError);
    }
  },

  login: async (credentials: { email: string; password: string }) => {
    set({ isLoading: true, error: null });
    try {
      // Check if this is a DIFFERENT user logging in
      const currentUserId = get().user?.id;
      const storedUser = await getStorageItem('auth_user');
      const previousUserId = storedUser ? JSON.parse(storedUser).id : null;
      
      // Call the real backend API
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid email or password');
      }

      // If this is a DIFFERENT user, clear all old data first
      if (previousUserId && previousUserId !== data.user.id) {
        console.log('🔄 Different user logging in, clearing old data...');
        await clearAllLocalData();
      }

      // Backend returns user data on successful login
      const userData = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        trainingType: data.user.trainingType,
        goal: data.user.goal,
        coachingStyle: data.user.coachingStyle,
        trainingDays: data.user.trainingDays,
        sessionDuration: data.user.sessionDuration,
        experience: data.user.experience,
        equipment: data.user.equipment,
        injuries: data.user.injuries,
        fitnessGoals: data.user.fitnessGoals,
        hasCompletedOnboarding: true,
      };

      set({ user: userData, isLoading: false });

      // Store JWT access token for Bearer auth
      if (data.accessToken) {
        await storeToken(data.accessToken);
        console.log('✅ Access token stored');
      }

      // Save user data securely for persistence
      await setStorageItem('auth_user', JSON.stringify(userData));
      await setStorageItem('user_email', credentials.email);

      console.log('✅ Login successful:', userData.name);
      
      // CRITICAL: Re-fetch all user data from backend after login
      // This ensures the user sees their persisted data, not stale/empty state
      console.log('🔄 Loading user data from backend...');
      try {
        // Import and call workout store functions to load persisted data
        const workoutStore = useWorkoutStore.getState();
        await workoutStore.fetchWeekWorkouts();
        await workoutStore.fetchCompletedWorkouts();
        await workoutStore.fetchStats();
        console.log('✅ User workout data loaded from backend');
        
        // Also load user badges from backend
        const awardsStore = useAwardsStore.getState();
        await awardsStore.loadUserBadges();
        console.log('✅ User badges loaded from backend');
      } catch (loadError) {
        console.warn('⚠️ Could not load workout data after login:', loadError);
        // Non-critical - user can still use the app, data will load on next fetch
      }
      
      return;
      
    } catch (error) {
      console.error('❌ Login failed:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Login failed', 
        isLoading: false 
      });
      throw error;
    }
  },

  register: async (userData: any) => {
    set({ isLoading: true, error: null });
    try {
      // CRITICAL: Clear ALL local data FIRST for a completely fresh experience
      console.log('🆕 New user registration - clearing all old data first...');
      await clearAllLocalData();
      
      // Call the real backend API
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true',
        },
        body: JSON.stringify(userData),
      });

      // Get the raw text first to handle non-JSON responses
      const responseText = await response.text();
      
      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response:', responseText.substring(0, 100));
        throw new Error('Server returned an invalid response. Please try again.');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Backend returns user data on successful registration
      const newUser = {
        id: data.user.id,
        name: data.user.name || userData.name || 'User',
        email: data.user.email,
        trainingType: userData.trainingType,
        goal: userData.goal,
        coachingStyle: userData.coachingStyle,
        trainingDays: userData.trainingDays,
        sessionDuration: userData.sessionDuration,
        experience: userData.experience,
        equipment: userData.equipment,
        injuries: userData.injuries,
        fitnessGoals: userData.fitnessGoals,
        // Training schedule data
        trainingSchedule: userData.trainingSchedule || 'flexible',
        selectedDays: userData.selectedDays || [],
        specificDates: userData.specificDates || [],
        // Location/timezone data
        country: userData.country || null,
        timezone: userData.timezone || null,
        // Full onboarding responses from backend (includes all data)
        onboardingResponses: data.user.onboardingResponses || null,
        hasCompletedOnboarding: true,
        createdAt: new Date().toISOString(),
      };

      set({ user: newUser, isLoading: false });

      // Store JWT access token for Bearer auth
      if (data.accessToken) {
        await storeToken(data.accessToken);
        console.log('✅ Access token stored');
      }

      // Save user data securely for persistence
      await setStorageItem('auth_user', JSON.stringify(newUser));
      await setStorageItem('user_email', userData.email);

      console.log('✅ Registration successful:', newUser.name);
      console.log('Onboarding data saved:', Object.keys(newUser).join(', '));
    } catch (error) {
      console.error('❌ Registration failed:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Registration failed', 
        isLoading: false 
      });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      // Reset workout store data FIRST
      await useWorkoutStore.getState().resetAllData();
      
      // Clear JWT access token
      await clearToken();
      
      // Clear ALL stored user data for a fresh start on next login
      await deleteStorageItem('auth_user');
      await deleteStorageItem('user_email');
      await deleteStorageItem('user_password');
      await deleteStorageItem('user_pin');
      
      // Clear workout data (backup - in case resetAllData missed any)
      await deleteStorageItem('week_workouts');
      await deleteStorageItem('week_workouts_date');
      await deleteStorageItem('week_workouts_version');
      await deleteStorageItem('today_workout');
      await deleteStorageItem('today_workout_date');
      await deleteStorageItem('completed_workouts');
      await deleteStorageItem('future_weeks');
      await deleteStorageItem('workout_stats');
      await deleteStorageItem('personal_bests');
      
      // Clear questionnaire and tour data
      await deleteStorageItem('advancedQuestionnaire');
      await deleteStorageItem('advancedQuestionnaireSkipped');
      await deleteStorageItem('tourCompleted');
      await deleteStorageItem('tourSkipped');
      
      // Clear biometrics settings
      await deleteStorageItem('biometric_enabled');
      await deleteStorageItem('biometrics_enabled');
      
      // Also clear AsyncStorage items
      if (typeof window !== 'undefined' && window.localStorage) {
        const keysToRemove = [
          'advancedQuestionnaire', 'advancedQuestionnaireSkipped',
          'tourCompleted', 'tourSkipped', 'weeklyScheduleCheckSnoozed',
          'lastWeeklyScheduleCheck', 'currentWeekDays'
        ];
        keysToRemove.forEach(key => window.localStorage.removeItem(key));
      }
      
      set({ user: null, isLoading: false });
      console.log('✅ Logout successful - ALL user data cleared');
    } catch (error) {
      console.error('Logout failed:', error);
      set({ user: null, isLoading: false }); // Clear user anyway
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      // Check for stored authenticated user
      const storedUser = await getStorageItem('auth_user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        set({ user: userData, isLoading: false });
        console.log('User authenticated from storage:', userData.name);
      } else {
        set({ user: null, isLoading: false });
      }
    } catch (error) {
      console.log('User not authenticated');
      set({ user: null, isLoading: false });
    }
  },

  updateUser: async (updates: Partial<User>) => {
    try {
      const currentUser = get().user;
      if (!currentUser) return;

      const updatedUser = { ...currentUser, ...updates };
      set({ user: updatedUser });

      // Save to storage
      await setStorageItem('auth_user', JSON.stringify(updatedUser));
      console.log('✅ User updated:', updates);
    } catch (error) {
      console.error('❌ Failed to update user:', error);
    }
  },

  clearError: () => set({ error: null }),
}));