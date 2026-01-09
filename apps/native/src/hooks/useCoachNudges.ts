// Phase 11.5: Coach Nudge Management Hook
// Handles fetching, displaying, and resolving nudges with session/frequency controls
// RULES: Max 1 nudge per session, dismissed = no more today

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '../stores/auth-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://trainee-assist.preview.emergentagent.com';

// Session tracking keys
const NUDGE_SESSION_KEY = '@coach_nudge_session_v2';
const NUDGE_DISMISS_KEY = '@coach_nudge_dismissed_date';
const NUDGE_SHOWN_TYPE_KEY = '@coach_nudge_shown_types';

export interface NudgeAction {
  label: string;
  action: 'accept' | 'decline' | 'ask_coach' | 'adjust' | 'dismiss';
  payload?: Record<string, any>;
}

export interface CoachNudge {
  id: number;
  userId: number;
  nudgeType: string;
  priority: number;
  message: string;
  actions: NudgeAction[];
  context?: Record<string, any>;
  expiresAt?: string;
  createdAt: string;
  seenAt?: string;
  resolvedAt?: string;
  resolution?: string;
}

type NudgeLocation = 'workout_hub' | 'exercise_detail' | 'home';
type CoachPersonality = 'aggressive' | 'disciplined' | 'friendly' | 'calm';

interface UseCoachNudgesOptions {
  location: NudgeLocation;
  autoFetch?: boolean;
  personality?: CoachPersonality;
}

interface NudgeEligibility {
  canShow: boolean;
  reason?: string;
}

export function useCoachNudges({ location, autoFetch = true, personality = 'friendly' }: UseCoachNudgesOptions) {
  const [nudges, setNudges] = useState<CoachNudge[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eligibility, setEligibility] = useState<NudgeEligibility>({ canShow: true });
  const hasShownThisSession = useRef(false);
  
  const { isLoggedIn, user } = useAuthStore();
  
  // Check eligibility before showing nudges
  const checkEligibility = useCallback(async (): Promise<NudgeEligibility> => {
    try {
      // Check if already dismissed today
      const dismissDate = await AsyncStorage.getItem(NUDGE_DISMISS_KEY);
      const today = new Date().toISOString().split('T')[0];
      
      if (dismissDate === today) {
        return { canShow: false, reason: 'dismissed_today' };
      }
      
      // Check if already shown this session (app lifetime)
      if (hasShownThisSession.current) {
        return { canShow: false, reason: 'shown_this_session' };
      }
      
      // Check 7-day repeat rule for same nudge type
      const shownTypesRaw = await AsyncStorage.getItem(NUDGE_SHOWN_TYPE_KEY);
      const shownTypes: Record<string, string> = shownTypesRaw ? JSON.parse(shownTypesRaw) : {};
      
      return { canShow: true };
    } catch (err) {
      console.error('[useCoachNudges] Error checking eligibility:', err);
      return { canShow: true }; // Default to showing on error
    }
  }, []);
  
  // Mark that a nudge was shown this session
  const markShownThisSession = useCallback(async (nudgeType: string) => {
    hasShownThisSession.current = true;
    
    // Track nudge type with date for 7-day rule
    try {
      const shownTypesRaw = await AsyncStorage.getItem(NUDGE_SHOWN_TYPE_KEY);
      const shownTypes: Record<string, string> = shownTypesRaw ? JSON.parse(shownTypesRaw) : {};
      shownTypes[nudgeType] = new Date().toISOString();
      await AsyncStorage.setItem(NUDGE_SHOWN_TYPE_KEY, JSON.stringify(shownTypes));
    } catch (err) {
      console.error('[useCoachNudges] Error marking shown:', err);
    }
  }, []);
  
  // Fetch active nudges for the location (respecting eligibility)
  const fetchNudges = useCallback(async () => {
    if (!isLoggedIn) {
      setNudges([]);
      return;
    }
    
    // Check eligibility first
    const elig = await checkEligibility();
    setEligibility(elig);
    
    if (!elig.canShow) {
      console.log(`[useCoachNudges] Not eligible: ${elig.reason}`);
      setNudges([]);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/coach/nudges?location=${location}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch nudges');
      }
      
      const data = await response.json();
      const fetchedNudges = data.nudges || [];
      
      // Filter by 7-day rule
      const shownTypesRaw = await AsyncStorage.getItem(NUDGE_SHOWN_TYPE_KEY);
      const shownTypes: Record<string, string> = shownTypesRaw ? JSON.parse(shownTypesRaw) : {};
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const filteredNudges = fetchedNudges.filter((nudge: CoachNudge) => {
        const lastShown = shownTypes[nudge.nudgeType];
        if (!lastShown) return true;
        return new Date(lastShown) < sevenDaysAgo;
      });
      
      // Only take the top 1 (max 1 per session)
      const finalNudges = filteredNudges.slice(0, 1);
      
      if (finalNudges.length > 0) {
        await markShownThisSession(finalNudges[0].nudgeType);
      }
      
      setNudges(finalNudges);
    } catch (err) {
      console.error('[useCoachNudges] Error fetching nudges:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setNudges([]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn, location, checkEligibility, markShownThisSession]);
  
  // Generate nudges for a specific context
  const generateNudges = useCallback(async (
    context: 'workout_start' | 'exercise_start' | 'home_view',
    exerciseInfo?: {
      name: string;
      previousWeight?: number;
      suggestedWeight?: number;
      movementPattern?: string;
    }
  ) => {
    if (!isLoggedIn) return;
    
    // Check eligibility
    const elig = await checkEligibility();
    if (!elig.canShow) {
      console.log(`[useCoachNudges] Not generating - not eligible: ${elig.reason}`);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/coach/nudges/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ context, exerciseInfo }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate nudges');
      }
      
      const data = await response.json();
      const generatedNudges = data.nudges || [];
      
      // Only take top 1
      const finalNudges = generatedNudges.slice(0, 1);
      
      if (finalNudges.length > 0) {
        await markShownThisSession(finalNudges[0].nudgeType);
      }
      
      setNudges(finalNudges);
    } catch (err) {
      console.error('[useCoachNudges] Error generating nudges:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn, checkEligibility, markShownThisSession]);
  
  // Resolve a nudge
  const resolveNudge = useCallback(async (
    nudgeId: number,
    resolution: 'accepted' | 'rejected' | 'dismissed',
    payload?: any
  ) => {
    try {
      // If dismissed, store dismiss date
      if (resolution === 'dismissed') {
        const today = new Date().toISOString().split('T')[0];
        await AsyncStorage.setItem(NUDGE_DISMISS_KEY, today);
      }
      
      await fetch(`${API_BASE_URL}/api/coach/nudges/${nudgeId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ resolution }),
      });
      
      // Remove from local state immediately
      setNudges(prev => prev.filter(n => n.id !== nudgeId));
      
      return { resolution, payload };
    } catch (err) {
      console.error('[useCoachNudges] Error resolving nudge:', err);
      // Still remove locally even if API fails
      setNudges(prev => prev.filter(n => n.id !== nudgeId));
      throw err;
    }
  }, []);
  
  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch && isLoggedIn) {
      fetchNudges();
    }
  }, [autoFetch, isLoggedIn]); // Don't include fetchNudges to avoid loops
  
  // Get the top nudge (highest priority)
  const topNudge = nudges.length > 0 ? nudges[0] : null;
  
  // Get user personality from auth store
  const userPersonality = useCallback((): CoachPersonality => {
    if (!user?.coachingStyle) return personality;
    
    const styleMap: Record<string, CoachPersonality> = {
      'direct-challenging': 'aggressive',
      'strict-structured': 'disciplined',
      'encouraging-positive': 'friendly',
      'calm-patient': 'calm',
      'supportive': 'friendly',
      'direct': 'aggressive',
      'analytical': 'disciplined',
    };
    
    return styleMap[user.coachingStyle] || personality;
  }, [user?.coachingStyle, personality]);
  
  return {
    nudges,
    topNudge,
    isLoading,
    error,
    eligibility,
    personality: userPersonality(),
    fetchNudges,
    generateNudges,
    resolveNudge,
    hasNudges: nudges.length > 0,
  };
}

// =============================================================================
// HOOK: Learning Events Logger
// =============================================================================

export function useLearningEvents() {
  const { isLoggedIn } = useAuthStore();
  
  const logEvent = useCallback(async (
    eventType: string,
    contextMode: string | null,
    topic: string,
    payload: Record<string, any> = {}
  ) => {
    if (!isLoggedIn) return;
    
    try {
      await fetch(`${API_BASE_URL}/api/learning/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ eventType, contextMode, topic, payload }),
      });
    } catch (err) {
      console.error('[useLearningEvents] Error logging event:', err);
    }
  }, [isLoggedIn]);
  
  // Convenience methods for common events
  const logSuggestionShown = useCallback((topic: string, payload: any) => {
    return logEvent('suggestion_shown', 'in_workout', topic, payload);
  }, [logEvent]);
  
  const logSuggestionAccepted = useCallback((topic: string, payload: any) => {
    return logEvent('suggestion_accepted', 'in_workout', topic, payload);
  }, [logEvent]);
  
  const logSuggestionRejected = useCallback((topic: string, payload: any) => {
    return logEvent('suggestion_rejected', 'in_workout', topic, payload);
  }, [logEvent]);
  
  const logWeightAdjusted = useCallback((exercise: string, delta: number, movementPattern?: string) => {
    return logEvent('weight_adjusted', 'in_workout', 'weight', {
      exercise,
      delta,
      movementPattern,
    });
  }, [logEvent]);
  
  const logExerciseSwapped = useCallback((fromExercise: string, toExercise: string, reason?: string) => {
    return logEvent('exercise_swapped', 'in_workout', 'swap', {
      fromExercise,
      toExercise,
      swapReason: reason,
    });
  }, [logEvent]);
  
  const logUserFeedback = useCallback((feedbackType: 'too_hard' | 'too_easy' | 'pain' | 'tired' | 'great') => {
    return logEvent('user_feedback', 'post_workout', 'feedback', { feedbackType });
  }, [logEvent]);
  
  const logWorkoutCompleted = useCallback((workoutId?: string) => {
    return logEvent('workout_completed', 'post_workout', 'completion', { workoutId });
  }, [logEvent]);
  
  const logWorkoutSkipped = useCallback((workoutId?: string, reason?: string) => {
    return logEvent('workout_skipped', null, 'skip', { workoutId, reason });
  }, [logEvent]);
  
  const logCoachPromptUsed = useCallback((promptType: string) => {
    return logEvent('coach_prompt_used', 'in_workout', 'prompt', { promptType });
  }, [logEvent]);
  
  return {
    logEvent,
    logSuggestionShown,
    logSuggestionAccepted,
    logSuggestionRejected,
    logWeightAdjusted,
    logExerciseSwapped,
    logUserFeedback,
    logWorkoutCompleted,
    logWorkoutSkipped,
    logCoachPromptUsed,
  };
}

export default useCoachNudges;
