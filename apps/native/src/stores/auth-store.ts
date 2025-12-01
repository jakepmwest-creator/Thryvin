import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://soft-apes-tickle.loca.lt';

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
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
      
      // First check if there's a registered user with this email
      const storedEmail = await getStorageItem('user_email');
      const storedPassword = await getStorageItem('user_password');
      const storedUser = await getStorageItem('auth_user');
      
      // Check if credentials match a registered user
      if (storedEmail && storedPassword && storedUser) {
        if (credentials.email === storedEmail && credentials.password === storedPassword) {
          const userData = JSON.parse(storedUser);
          set({ user: userData, isLoading: false });
          console.log('Login successful (registered user):', userData.name);
          return;
        }
      }
      
      // If not found in storage, check against test account
      const validEmail = 'test@example.com';
      const validPassword = 'password123';
      
      if (credentials.email === validEmail && credentials.password === validPassword) {
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
        
        // Save credentials securely
        await setStorageItem('user_email', credentials.email);
        await setStorageItem('user_password', credentials.password);
        await setStorageItem('auth_user', JSON.stringify(userData));
        
        console.log('Login successful (test account):', userData.name);
        return;
      }
      
      // If we get here, credentials don't match anything
      throw new Error('Invalid email or password');
      
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
      await setStorageItem('auth_user', JSON.stringify(newUser));
      await setStorageItem('user_email', userData.email);
      if (userData.password) {
        await setStorageItem('user_password', userData.password);
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
      await deleteStorageItem('auth_user');
      await deleteStorageItem('user_email');
      await deleteStorageItem('user_password');
      
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

  clearError: () => set({ error: null }),
}));