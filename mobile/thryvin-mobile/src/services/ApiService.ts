// API service to connect React Native app to Express.js backend
export interface ChatMessage {
  role: 'user' | 'coach';
  content: string;
  timestamp?: string;
}

export interface ChatResponse {
  response: string;
  coach?: string;
  confidence?: number;
  suggestions?: string[];
}

export interface WorkoutAdjustRequest {
  workoutId?: number;
  adjustmentType: 'time' | 'equipment' | 'injury' | 'intensity' | 'focus';
  parameters: {
    targetDuration?: number;
    availableEquipment?: string[];
    injuryLimitations?: string[];
    intensityLevel?: 'low' | 'medium' | 'high';
    focusAreas?: string[];
  };
  currentSets: Array<{
    exerciseId?: number;
    exerciseName: string;
    targetReps?: number;
    targetWeight?: number;
    targetDuration?: number;
    restTime?: number;
  }>;
}

export interface WorkoutAdjustResponse {
  adjustedSets: Array<{
    exerciseId?: number;
    exerciseName: string;
    targetReps?: number;
    targetWeight?: number;
    targetDuration?: number;
    restTime?: number;
    modifications: string[];
    reasoning: string;
  }>;
  totalDuration: number;
  adjustmentSummary: string;
  warnings?: string[];
}

class ApiService {
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
  private baseUrl = this.getBaseUrl();

  // AI Chat with coach
  async sendChatMessage(
    message: string,
    context?: {
      coach?: string;
      currentWorkout?: any;
      userProfile?: any;
      conversationHistory?: ChatMessage[];
    }
  ): Promise<ChatResponse | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          context,
        }),
        credentials: 'include',
      });

      if (response.ok) {
        return await response.json();
      }

      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error ${response.status}`);
    } catch (error) {
      console.error('Chat API error:', error);
      return null;
    }
  }

  // AI Workout adjustment
  async adjustWorkout(request: WorkoutAdjustRequest): Promise<WorkoutAdjustResponse | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/workout/adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        credentials: 'include',
      });

      if (response.ok) {
        return await response.json();
      }

      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error ${response.status}`);
    } catch (error) {
      console.error('Workout adjust API error:', error);
      return null;
    }
  }

  // Generate AI workout
  async generateWorkout(
    workoutType: string,
    duration: number,
    equipment: string[],
    focusAreas: string[]
  ): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/workout/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: workoutType,
          duration,
          equipment,
          focus: focusAreas.join(', '),
        }),
        credentials: 'include',
      });

      if (response.ok) {
        return await response.json();
      }

      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error ${response.status}`);
    } catch (error) {
      console.error('Generate workout API error:', error);
      return null;
    }
  }

  // Get user profile
  async getUserProfile(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/user`, {
        credentials: 'include',
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Get user profile error:', error);
      return null;
    }
  }

  // Update user profile
  async updateUserProfile(updates: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/user/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
        credentials: 'include',
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Update user profile error:', error);
      return null;
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`);
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  // Get app config
  async getConfig(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/config`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Get config error:', error);
      return null;
    }
  }
}

export const apiService = new ApiService();