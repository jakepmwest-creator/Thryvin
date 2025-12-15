import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { notificationService } from '../services/notificationService';
import { useWorkoutStore } from './workout-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://workout-bug-fix.preview.emergentagent.com';

// Web-compatible storage helpers
const getStorageItem = async (key: string): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    // Fallback to localStorage for web
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  }
};

const setStorageItem = async (key: string, value: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    // Fallback to localStorage for web
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    }
  }
};


const deleteStorageItem = async (key: string): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    // Fallback to localStorage for web
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
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
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,

  login: async (credentials: { email: string; password: string }) => {
    set({ isLoading: true, error: null });
    try {
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

      // Save user data securely for persistence
      await setStorageItem('auth_user', JSON.stringify(userData));
      await setStorageItem('user_email', credentials.email);

      console.log('✅ Login successful:', userData.name);
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
        hasCompletedOnboarding: true,
        createdAt: new Date().toISOString(),
      };

      set({ user: newUser, isLoading: false });

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