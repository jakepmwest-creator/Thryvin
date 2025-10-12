import { InsertUser, SelectUser, ApiResponse } from './types';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: any
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for session auth
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new ApiError(response.status, errorText || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(0, error instanceof Error ? error.message : 'Network error');
    }
  }

  // Auth endpoints
  async login(credentials: { email: string; password: string }): Promise<SelectUser> {
    return this.request<SelectUser>('POST', '/login', credentials);
  }

  async register(userData: InsertUser): Promise<SelectUser> {
    return this.request<SelectUser>('POST', '/register', userData);
  }

  async logout(): Promise<void> {
    return this.request<void>('POST', '/logout');
  }

  async getCurrentUser(): Promise<SelectUser> {
    return this.request<SelectUser>('GET', '/user');
  }

  // Workout endpoints
  async generateWorkout(params: {
    fitnessLevel: string;
    workoutType: string;
    duration: number;
    equipment?: string[];
  }): Promise<any> {
    return this.request('POST', '/workouts/generate', params);
  }

  // Add more endpoints as needed
}

// Default client instance
export const apiClient = new ApiClient();

// Convenience functions for React Query
export const authApi = {
  login: (credentials: { email: string; password: string }) => 
    apiClient.login(credentials),
  register: (userData: InsertUser) => 
    apiClient.register(userData),
  logout: () => 
    apiClient.logout(),
  getCurrentUser: () => 
    apiClient.getCurrentUser(),
};