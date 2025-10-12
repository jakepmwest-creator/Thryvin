// Native biometric authentication service for React Native
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: number;
  email: string;
  name: string;
  hasCompletedOnboarding: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  biometricEnabled: boolean;
}

class AuthService {
  // Mobile-safe backend URL configuration
  private getBaseUrl(): string {
    // Priority order: Environment variable > Platform detection > Fallback
    
    // 1. Check for environment variable (allows custom LAN IP for physical devices)
    if (process.env.EXPO_PUBLIC_API_BASE_URL) {
      return process.env.EXPO_PUBLIC_API_BASE_URL;
    }
    
    // 2. For React Native, detect platform properly
    try {
      // Check if Platform module is available (React Native)
      const Platform = require('react-native').Platform;
      if (Platform.OS === 'android') {
        return process.env.EXPO_PUBLIC_ANDROID_API_URL || 'http://10.0.2.2:5000'; // Android emulator
      } else if (Platform.OS === 'ios') {
        return process.env.EXPO_PUBLIC_IOS_API_URL || 'http://127.0.0.1:5000'; // iOS simulator
      }
    } catch (e) {
      // Not React Native, probably web
    }
    
    // 3. Fallback for web/unknown
    return process.env.EXPO_PUBLIC_WEB_API_URL || 'http://localhost:5000';
  }
  private baseUrl = this.getBaseUrl(); // Connect to Express.js backend

  // Check if biometric authentication is available on device
  async isBiometricAvailable(): Promise<boolean> {
    try {
      // This would use expo-local-authentication in real implementation
      // For now, simulate availability check
      return true;
    } catch (error) {
      console.error('Biometric check failed:', error);
      return false;
    }
  }

  // Authenticate with biometrics (Face ID, Touch ID, Fingerprint)
  async authenticateWithBiometrics(): Promise<boolean> {
    try {
      // This would use expo-local-authentication.authenticateAsync() in real implementation
      // For now, simulate successful biometric auth
      console.log('Biometric authentication successful');
      return true;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return false;
    }
  }

  // Enable/disable biometric authentication
  async setBiometricEnabled(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem('biometric_enabled', JSON.stringify(enabled));
  }

  async isBiometricEnabled(): Promise<boolean> {
    const enabled = await AsyncStorage.getItem('biometric_enabled');
    return enabled ? JSON.parse(enabled) : false;
  }

  // Email/password authentication with backend
  async signIn(email: string, password: string): Promise<User | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      if (response.ok) {
        const user = await response.json();
        await this.storeAuthData(user);
        return user;
      }
      return null;
    } catch (error) {
      console.error('Sign in failed:', error);
      return null;
    }
  }

  // Sign up new user
  async signUp(email: string, password: string, name: string): Promise<User | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
        credentials: 'include',
      });

      if (response.ok) {
        const user = await response.json();
        await this.storeAuthData(user);
        return user;
      }
      return null;
    } catch (error) {
      console.error('Sign up failed:', error);
      return null;
    }
  }

  // Check current auth status
  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/user`, {
        credentials: 'include',
      });

      if (response.ok) {
        const user = await response.json();
        await this.storeAuthData(user);
        return user;
      }
      return null;
    } catch (error) {
      console.error('Get current user failed:', error);
      return null;
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Sign out failed:', error);
    } finally {
      await this.clearAuthData();
    }
  }

  // Store auth data locally
  private async storeAuthData(user: User): Promise<void> {
    await AsyncStorage.setItem('user_data', JSON.stringify(user));
    await AsyncStorage.setItem('is_authenticated', 'true');
  }

  // Clear auth data
  private async clearAuthData(): Promise<void> {
    await AsyncStorage.removeItem('user_data');
    await AsyncStorage.removeItem('is_authenticated');
  }

  // Get stored auth state
  async getStoredAuthState(): Promise<AuthState> {
    try {
      const [userData, isAuth, biometricEnabled] = await Promise.all([
        AsyncStorage.getItem('user_data'),
        AsyncStorage.getItem('is_authenticated'),
        this.isBiometricEnabled(),
      ]);

      return {
        isAuthenticated: isAuth === 'true',
        user: userData ? JSON.parse(userData) : null,
        biometricEnabled,
      };
    } catch (error) {
      console.error('Get stored auth state failed:', error);
      return {
        isAuthenticated: false,
        user: null,
        biometricEnabled: false,
      };
    }
  }
}

export const authService = new AuthService();