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
      // Use the preview URL for Emergent platform
      const API_URL = 'https://28d88a1d-a878-4deb-9ffc-532c0d6fbf3a.preview.emergentagent.com';
      
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Invalid credentials' }));
        throw new Error(errorData.error || 'Invalid email or password');
      }

      const userData = await response.json();
      set({ user: userData.user || userData, isLoading: false });
      
      // Save credentials securely for biometric login
      await SecureStore.setItemAsync('user_email', credentials.email);
      await SecureStore.setItemAsync('user_password', credentials.password);
      await SecureStore.setItemAsync('auth_user', JSON.stringify(userData.user || userData));
      
      console.log('Login successful:', userData.user?.name || userData.name);
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
      const API_URL = 'https://28d88a1d-a878-4deb-9ffc-532c0d6fbf3a.preview.emergentagent.com';
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      
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
        return;
      }

      // Try API check
      const API_URL = 'https://28d88a1d-a878-4deb-9ffc-532c0d6fbf3a.preview.emergentagent.com';
      const response = await fetch(`${API_URL}/api/auth/user`, {
        credentials: 'include',
      });

      if (response.ok) {
        const userData = await response.json();
        set({ user: userData, isLoading: false });
        await SecureStore.setItemAsync('auth_user', JSON.stringify(userData));
        console.log('User authenticated from API:', userData.name);
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