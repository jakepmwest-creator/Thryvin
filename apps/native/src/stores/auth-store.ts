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
      // Demo mode: Accept test@example.com / password123 or any credentials
      if (!API_BASE_URL || API_BASE_URL.includes('localhost')) {
        // Offline/Demo mode
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
        
        const demoUser = {
          id: 1,
          name: 'Jake',
          email: credentials.email,
          trainingType: 'Aesthetics',
          goal: 'Build Muscle',
          coachingStyle: 'Motivational',
        };
        
        set({ user: demoUser, isLoading: false });
        
        // Save credentials securely for biometric login
        await SecureStore.setItemAsync('user_email', credentials.email);
        await SecureStore.setItemAsync('user_password', credentials.password);
        await SecureStore.setItemAsync('demo_user', JSON.stringify(demoUser));
        
        console.log('Login successful (Demo Mode):', demoUser.name);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const userData = await response.json();
      set({ user: userData, isLoading: false });
      
      // Save credentials securely for biometric login
      await SecureStore.setItemAsync('user_email', credentials.email);
      await SecureStore.setItemAsync('user_password', credentials.password);
      
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
      // Demo mode: Accept any registration
      if (!API_BASE_URL || API_BASE_URL.includes('localhost')) {
        // Offline/Demo mode
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
        
        const newUser = {
          id: Date.now(),
          name: userData.name || 'User',
          email: userData.email,
          trainingType: userData.trainingType,
          goal: userData.goal,
          coachingStyle: userData.coachingStyle,
        };
        
        set({ user: newUser, isLoading: false });
        await SecureStore.setItemAsync('demo_user', JSON.stringify(newUser));
        console.log('Registration successful (Demo Mode):', newUser.name);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      const newUser = await response.json();
      set({ user: newUser, isLoading: false });
      console.log('Registration successful:', newUser.name);
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
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
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
      const response = await fetch(`${API_BASE_URL}/api/auth/user`, {
        credentials: 'include',
      });

      if (response.ok) {
        const userData = await response.json();
        set({ user: userData, isLoading: false });
        console.log('User authenticated:', userData.name);
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