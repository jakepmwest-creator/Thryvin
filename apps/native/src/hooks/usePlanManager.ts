/**
 * usePlanManager Hook
 * 
 * PART B3-B5: Reliable plan management on mobile
 * - Calls /api/auth/me on focus
 * - Calls /api/workouts/plan/ensure
 * - Handles empty plans with retry
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuthStore } from '../stores/auth-store';
import { useWorkoutStore } from '../stores/workout-store';
import * as api from '../services/api-client';

interface PlanManagerState {
  isEnsuring: boolean;
  lastEnsureResult: api.PlanEnsureResponse | null;
  lastError: string | null;
}

export function usePlanManager() {
  const { user } = useAuthStore();
  const { fetchWeekWorkouts, weekWorkouts } = useWorkoutStore();
  
  const [state, setState] = useState<PlanManagerState>({
    isEnsuring: false,
    lastEnsureResult: null,
    lastError: null,
  });
  
  const retryCount = useRef(0);
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000;
  
  /**
   * Verify auth and ensure plan exists
   */
  const ensurePlanExists = useCallback(async () => {
    if (!user?.id) {
      console.log('[PlanManager] No user, skipping ensure');
      return;
    }
    
    // Check if token exists
    const hasToken = await api.hasToken();
    if (!hasToken) {
      console.log('[PlanManager] No token, skipping ensure');
      return;
    }
    
    setState(prev => ({ ...prev, isEnsuring: true, lastError: null }));
    
    try {
      // Step 1: Verify auth is still valid
      console.log('[PlanManager] Verifying auth...');
      const authResult = await api.verifyAuth();
      
      if (!authResult.ok) {
        console.log('[PlanManager] Auth invalid, user will be logged out');
        return;
      }
      
      // Step 2: Call ensure plan endpoint
      console.log('[PlanManager] Ensuring plan exists...');
      const ensureResult = await api.ensurePlan();
      
      if (!ensureResult.ok) {
        throw new Error(ensureResult.error || 'Failed to ensure plan');
      }
      
      console.log(`[PlanManager] Plan ensured: ${ensureResult.data?.workoutsCount} workouts`);
      
      setState(prev => ({
        ...prev,
        isEnsuring: false,
        lastEnsureResult: ensureResult.data || null,
      }));
      
      // Step 3: Fetch workouts if plan was generated or workouts are empty
      if (ensureResult.data?.generated || !weekWorkouts || weekWorkouts.length === 0) {
        console.log('[PlanManager] Fetching workouts...');
        await fetchWeekWorkouts();
      }
      
      // Reset retry count on success
      retryCount.current = 0;
      
    } catch (error: any) {
      console.error('[PlanManager] Error:', error.message);
      
      setState(prev => ({
        ...prev,
        isEnsuring: false,
        lastError: error.message,
      }));
      
      // Retry with backoff
      if (retryCount.current < MAX_RETRIES) {
        retryCount.current++;
        console.log(`[PlanManager] Retrying (${retryCount.current}/${MAX_RETRIES})...`);
        setTimeout(ensurePlanExists, RETRY_DELAY * retryCount.current);
      }
    }
  }, [user?.id, fetchWeekWorkouts, weekWorkouts]);
  
  // Run on screen focus
  useFocusEffect(
    useCallback(() => {
      console.log('[PlanManager] Screen focused, ensuring plan...');
      ensurePlanExists();
    }, [ensurePlanExists])
  );
  
  // Run on app state change (background -> active)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        console.log('[PlanManager] App became active, ensuring plan...');
        ensurePlanExists();
      }
    });
    
    return () => {
      subscription.remove();
    };
  }, [ensurePlanExists]);
  
  return {
    isEnsuring: state.isEnsuring,
    lastEnsureResult: state.lastEnsureResult,
    lastError: state.lastError,
    ensurePlan: ensurePlanExists,
  };
}

export default usePlanManager;
