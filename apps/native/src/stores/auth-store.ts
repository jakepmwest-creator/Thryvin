import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || '';

interface User {
  id: number;
  name: string;
  email: string;
  trainingType?: string;
  goal?: string;
  coachingStyle?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,

  login: async (credentials: { email: string; password: string }) => {
    set({ isLoading: true, error: null });
    try {
      // Validate credentials against stored test user
      // In production, this would be an API call
      const validEmail = 'test@example.com';
      const validPassword = 'password123';
      
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
      
      if (credentials.email !== validEmail || credentials.password !== validPassword) {
        throw new Error('Invalid email or password');
      }
      
      const userData = {
        id: 1,
        name: 'Test User',
        email: credentials.email,
        trainingType: 'general-fitness',
        goal: 'improve-health',
        coachingStyle: 'encouraging-positive',
        selectedCoach: 'nate-green',
        hasCompletedOnboarding: true,
      };
      
      set({ user: userData, isLoading: false });
      
      // Save credentials securely for biometric login
      await SecureStore.setItemAsync('user_email', credentials.email);
      await SecureStore.setItemAsync('user_password', credentials.password);
      await SecureStore.setItemAsync('auth_user', JSON.stringify(userData));
      
      console.log('Login successful:', userData.name);
    } catch (error) {
      console.error('Login failed:', error);
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
      // Simulate registration with local storage
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
      
      const newUser = {
        id: Date.now(),
        name: userData.name || 'User',
        email: userData.email,
        // Save all onboarding data
        ...userData,
        hasCompletedOnboarding: true,
        createdAt: new Date().toISOString(),
      };
      
      // Remove password from user object (keep secure)
      delete newUser.password;
      
      set({ user: newUser, isLoading: false });
      
      // Save user and credentials
      await SecureStore.setItemAsync('auth_user', JSON.stringify(newUser));
      await SecureStore.setItemAsync('user_email', userData.email);
      if (userData.password) {
        await SecureStore.setItemAsync('user_password', userData.password);
      }
      
      console.log('Registration successful:', newUser.name);
      console.log('Onboarding data saved:', Object.keys(newUser).join(', '));
    } catch (error) {
      console.error('Registration failed:', error);
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
      // Clear stored user data
      await SecureStore.deleteItemAsync('auth_user');
      await SecureStore.deleteItemAsync('user_email');
      await SecureStore.deleteItemAsync('user_password');
      
      set({ user: null, isLoading: false });
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout failed:', error);
      set({ user: null, isLoading: false }); // Clear user anyway
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      // Check for stored authenticated user
      const storedUser = await SecureStore.getItemAsync('auth_user');
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

  clearError: () => set({ error: null }),
}));