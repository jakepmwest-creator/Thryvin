// Mock zustand store for development - replace with actual zustand when Expo is set up
interface AuthState {
  user: any | null;
  isLoading: boolean;
  error: string | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

// Simple state management for development
const createMockStore = (stateFunction: (set: any, get: any) => AuthState): (() => AuthState) => {
  let state = stateFunction(() => {}, () => {});
  return () => state;
};

// Mock auth store implementation for development
export const useAuthStore = createMockStore((set: any, get: any) => ({
  user: null,
  isLoading: false,
  error: null,

  login: async (credentials: { email: string; password: string }) => {
    try {
      // Mock login - replace with actual API calls when Expo is running
      console.log('Mock login:', credentials);
      const mockUser = { id: 1, name: 'Test User', email: credentials.email };
      return mockUser;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },

  register: async (userData: any) => {
    try {
      // Mock register - replace with actual API calls
      console.log('Mock register:', userData);
      const mockUser = { id: 1, name: userData.name, email: userData.email };
      return mockUser;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      console.log('Mock logout');
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  },

  checkAuth: async () => {
    try {
      console.log('Mock check auth');
      // Return null for no user
      return null;
    } catch (error) {
      console.log('User not authenticated');
    }
  },

  clearError: () => console.log('Clear error'),
}));