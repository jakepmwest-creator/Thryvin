// Zustand store for React Native app state management
import { create } from 'zustand';
import { authService, User, AuthState } from '../services/AuthService';
import { apiService } from '../services/ApiService';

interface AppState {
  // Auth state
  auth: AuthState;
  
  // App state
  isLoading: boolean;
  error: string | null;
  
  // User data
  userProfile: any;
  
  // Workout state
  currentWorkout: any;
  workoutHistory: any[];
  
  // Nutrition state
  dailyNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    calorieGoal: number;
    proteinGoal: number;
    carbGoal: number;
    fatGoal: number;
  };
  
  // AI Coach state
  chatHistory: Array<{
    role: 'user' | 'coach';
    content: string;
    timestamp: string;
  }>;
  
  // Actions
  actions: {
    // Auth actions
    initializeAuth: () => Promise<void>;
    signIn: (email: string, password: string) => Promise<boolean>;
    signUp: (email: string, password: string, name: string) => Promise<boolean>;
    signOut: () => Promise<void>;
    enableBiometrics: (enabled: boolean) => Promise<void>;
    authenticateWithBiometrics: () => Promise<boolean>;
    
    // App actions
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    
    // User actions
    loadUserProfile: () => Promise<void>;
    updateUserProfile: (updates: any) => Promise<void>;
    
    // Workout actions
    generateWorkout: (type: string, duration: number, equipment: string[], focus: string[]) => Promise<void>;
    startWorkout: (workout: any) => void;
    completeWorkout: (workout: any) => void;
    
    // Chat actions
    sendChatMessage: (message: string) => Promise<void>;
    clearChatHistory: () => void;
    
    // Nutrition actions
    updateNutrition: (nutrition: Partial<AppState['dailyNutrition']>) => void;
  };
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  auth: {
    isAuthenticated: false,
    user: null,
    biometricEnabled: false,
  },
  
  isLoading: false,
  error: null,
  userProfile: null,
  currentWorkout: null,
  workoutHistory: [],
  
  dailyNutrition: {
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    calorieGoal: 2000,
    proteinGoal: 150,
    carbGoal: 250,
    fatGoal: 67,
  },
  
  chatHistory: [],
  
  actions: {
    // Initialize auth state from storage
    initializeAuth: async () => {
      set({ isLoading: true });
      try {
        const authState = await authService.getStoredAuthState();
        set({ auth: authState });
        
        if (authState.isAuthenticated) {
          await get().actions.loadUserProfile();
        }
      } catch (error) {
        console.error('Initialize auth failed:', error);
        set({ error: 'Failed to initialize authentication' });
      } finally {
        set({ isLoading: false });
      }
    },

    // Sign in with email/password
    signIn: async (email: string, password: string) => {
      set({ isLoading: true, error: null });
      try {
        const user = await authService.signIn(email, password);
        if (user) {
          set({
            auth: {
              isAuthenticated: true,
              user,
              biometricEnabled: await authService.isBiometricEnabled(),
            }
          });
          await get().actions.loadUserProfile();
          return true;
        }
        set({ error: 'Invalid email or password' });
        return false;
      } catch (error) {
        set({ error: 'Sign in failed' });
        return false;
      } finally {
        set({ isLoading: false });
      }
    },

    // Sign up new user
    signUp: async (email: string, password: string, name: string) => {
      set({ isLoading: true, error: null });
      try {
        const user = await authService.signUp(email, password, name);
        if (user) {
          set({
            auth: {
              isAuthenticated: true,
              user,
              biometricEnabled: false,
            }
          });
          return true;
        }
        set({ error: 'Sign up failed' });
        return false;
      } catch (error) {
        set({ error: 'Sign up failed' });
        return false;
      } finally {
        set({ isLoading: false });
      }
    },

    // Sign out
    signOut: async () => {
      set({ isLoading: true });
      try {
        await authService.signOut();
        set({
          auth: {
            isAuthenticated: false,
            user: null,
            biometricEnabled: false,
          },
          userProfile: null,
          currentWorkout: null,
          chatHistory: [],
        });
      } catch (error) {
        console.error('Sign out failed:', error);
      } finally {
        set({ isLoading: false });
      }
    },

    // Enable/disable biometric authentication
    enableBiometrics: async (enabled: boolean) => {
      try {
        await authService.setBiometricEnabled(enabled);
        set({
          auth: {
            ...get().auth,
            biometricEnabled: enabled,
          }
        });
      } catch (error) {
        console.error('Enable biometrics failed:', error);
        set({ error: 'Failed to update biometric settings' });
      }
    },

    // Authenticate with biometrics
    authenticateWithBiometrics: async () => {
      try {
        const success = await authService.authenticateWithBiometrics();
        if (success) {
          const user = await authService.getCurrentUser();
          if (user) {
            set({
              auth: {
                isAuthenticated: true,
                user,
                biometricEnabled: true,
              }
            });
            await get().actions.loadUserProfile();
          }
        }
        return success;
      } catch (error) {
        console.error('Biometric auth failed:', error);
        return false;
      }
    },

    // App actions
    setLoading: (loading: boolean) => set({ isLoading: loading }),
    setError: (error: string | null) => set({ error }),

    // Load user profile
    loadUserProfile: async () => {
      try {
        const profile = await apiService.getUserProfile();
        set({ userProfile: profile });
      } catch (error) {
        console.error('Load user profile failed:', error);
      }
    },

    // Update user profile
    updateUserProfile: async (updates: any) => {
      try {
        const updatedProfile = await apiService.updateUserProfile(updates);
        if (updatedProfile) {
          set({ userProfile: updatedProfile });
        }
      } catch (error) {
        console.error('Update user profile failed:', error);
        set({ error: 'Failed to update profile' });
      }
    },

    // Helper function to map user profile to workout parameters
    mapUserProfileToWorkoutParams: () => {
      const { userProfile } = get();
      
      if (!userProfile) {
        console.error('mapUserProfileToWorkoutParams called without userProfile');
        throw new Error('User profile not loaded');
      }

      console.log('Mapping user profile to workout params:', {
        trainingType: userProfile.trainingType,
        sessionDurationPreference: userProfile.sessionDurationPreference,
        equipmentAccess: userProfile.equipmentAccess,
        focusAreas: userProfile.focusAreas,
        goal: userProfile.goal,
        hasCompletedAIOnboarding: userProfile.hasCompletedAIOnboarding
      });

      // Extract workout parameters from user profile onboarding data
      const workoutType = userProfile.trainingType || 'strength'; // calisthenics, strength, wellness
      const duration = userProfile.sessionDurationPreference || 30; // minutes
      
      // Parse equipment access from JSON string to array
      let equipment: string[] = [];
      if (userProfile.equipmentAccess) {
        try {
          if (typeof userProfile.equipmentAccess === 'string') {
            equipment = JSON.parse(userProfile.equipmentAccess);
          } else if (Array.isArray(userProfile.equipmentAccess)) {
            equipment = userProfile.equipmentAccess;
          } else {
            equipment = ['bodyweight']; // fallback
          }
        } catch (e) {
          console.warn('Failed to parse equipment access:', e, 'Raw value:', userProfile.equipmentAccess);
          equipment = ['bodyweight']; // fallback
        }
      } else {
        equipment = ['bodyweight']; // default
      }
      
      // Parse focus areas from JSON string to array, then convert to string for API
      let focusAreas: string[] = [];
      if (userProfile.focusAreas) {
        try {
          if (typeof userProfile.focusAreas === 'string') {
            focusAreas = JSON.parse(userProfile.focusAreas);
          } else if (Array.isArray(userProfile.focusAreas)) {
            focusAreas = userProfile.focusAreas;
          } else {
            focusAreas = ['full-body']; // fallback
          }
        } catch (e) {
          console.warn('Failed to parse focus areas:', e, 'Raw value:', userProfile.focusAreas);
          focusAreas = ['full-body']; // fallback
        }
      } else {
        // Use goal as focus area if no specific focus areas
        focusAreas = userProfile.goal ? [userProfile.goal] : ['full-body'];
      }

      // API expects focus as a comma-separated string, not array
      const focusString = focusAreas.join(', ');

      const result = {
        workoutType,
        duration,
        equipment,
        focus: focusString // Changed from focusAreas to focus (string)
      };

      console.log('Mapped workout parameters:', result);
      return result;
    },

    // Generate workout using user's onboarding preferences
    generateWorkout: async () => {
      console.log('Starting generateWorkout action');
      set({ isLoading: true, error: null });
      try {
        // Check if user is authenticated
        if (!get().auth.isAuthenticated) {
          console.warn('User not authenticated for workout generation');
          set({ error: 'Please sign in to generate personalized workouts' });
          return;
        }

        console.log('User authenticated, checking profile...');
        
        // Ensure user profile is loaded with retry logic
        let userProfile = get().userProfile;
        if (!userProfile) {
          console.log('User profile not loaded, attempting to load...');
          await get().actions.loadUserProfile();
          
          // Wait a moment for the state to update
          await new Promise(resolve => setTimeout(resolve, 100));
          userProfile = get().userProfile;
        }

        if (!userProfile) {
          console.error('Unable to load user profile after retry');
          set({ error: 'Unable to load your profile. Please check your connection and try again.' });
          return;
        }

        console.log('User profile loaded:', {
          id: userProfile.id,
          hasCompletedAIOnboarding: userProfile.hasCompletedAIOnboarding,
          trainingType: userProfile.trainingType
        });

        // Check if user has completed onboarding
        if (!userProfile.hasCompletedAIOnboarding) {
          console.warn('User has not completed AI onboarding');
          set({ error: 'Please complete your fitness onboarding to get personalized workouts' });
          return;
        }

        // Get workout parameters from user's onboarding data
        const { workoutType, duration, equipment, focus } = get().actions.mapUserProfileToWorkoutParams();
        
        // Validate all parameters before API call
        if (!workoutType || !duration || !equipment || equipment.length === 0) {
          console.error('Invalid workout parameters:', { workoutType, duration, equipment, focus });
          set({ error: 'Invalid workout preferences. Please update your profile and try again.' });
          return;
        }
        
        console.log('Generating workout with validated user preferences:', {
          workoutType,
          duration,
          equipment,
          focus,
          userId: userProfile.id,
          timestamp: new Date().toISOString()
        });

        // Make API call with properly mapped parameters
        const workout = await apiService.generateWorkout(workoutType, duration, equipment, focus);
        if (workout) {
          console.log('Workout generated successfully:', {
            title: workout.title,
            duration: workout.estimatedDuration,
            exerciseCount: workout.exercises?.length || 0
          });
          set({ currentWorkout: workout });
        } else {
          console.error('API returned empty workout');
          throw new Error('No workout received from AI service');
        }
      } catch (error) {
        console.error('Generate workout failed with error:', error);
        
        let errorMessage = 'Failed to generate workout. Please try again.';
        
        if (error instanceof Error) {
          if (error.message.includes('User profile not loaded')) {
            errorMessage = 'Please complete your profile setup first.';
          } else if (error.message.includes('onboarding')) {
            errorMessage = 'Please complete your fitness onboarding to get personalized workouts.';
          } else if (error.message.includes('connection') || error.message.includes('network')) {
            errorMessage = 'Connection error. Please check your internet and try again.';
          } else {
            errorMessage = error.message;
          }
        }
        
        set({ error: errorMessage });
      } finally {
        set({ isLoading: false });
        console.log('generateWorkout action completed');
      }
    },

    // Start workout
    startWorkout: (workout: any) => {
      set({ currentWorkout: { ...workout, status: 'in_progress', startedAt: new Date() } });
    },

    // Complete workout
    completeWorkout: (workout: any) => {
      const completed = { ...workout, status: 'completed', completedAt: new Date() };
      set({
        currentWorkout: null,
        workoutHistory: [...get().workoutHistory, completed],
      });
    },

    // Send chat message
    sendChatMessage: async (message: string) => {
      const userMessage = {
        role: 'user' as const,
        content: message,
        timestamp: new Date().toISOString(),
      };

      // Add user message immediately
      set({
        chatHistory: [...get().chatHistory, userMessage]
      });

      try {
        const response = await apiService.sendChatMessage(message, {
          coach: 'dylan-power',
          userProfile: get().userProfile,
          currentWorkout: get().currentWorkout,
          conversationHistory: get().chatHistory,
        });

        if (response) {
          const coachMessage = {
            role: 'coach' as const,
            content: response.response,
            timestamp: new Date().toISOString(),
          };

          set({
            chatHistory: [...get().chatHistory, coachMessage]
          });
        }
      } catch (error) {
        console.error('Send chat message failed:', error);
        set({ error: 'Failed to send message' });
      }
    },

    // Clear chat history
    clearChatHistory: () => set({ chatHistory: [] }),

    // Update nutrition
    updateNutrition: (nutrition: Partial<AppState['dailyNutrition']>) => {
      set({
        dailyNutrition: {
          ...get().dailyNutrition,
          ...nutrition,
        }
      });
    },
  },
}));