import { useState, useCallback, useEffect } from 'react';

export type CloudMood = 'happy' | 'focused' | 'thinking' | 'tired' | 'excited' | 'neutral' | 'calm' | 'annoyed' | 'motivated' | 'celebratory';

export interface CloudMoodEvent {
  type: 'workout_complete' | 'goal_achieved' | 'streak_broken' | 'new_record' | 'login' | 'idle' | 'interaction' | 'navigation' | 'error' | 'celebration';
  intensity?: 'low' | 'medium' | 'high';
  duration?: number; // in milliseconds
}

export interface CloudMoodState {
  currentMood: CloudMood;
  intensity: number; // 0-1
  isTransitioning: boolean;
  lastEvent?: CloudMoodEvent;
}

export const useCloudMoodSystem = (initialMood: CloudMood = 'calm') => {
  const [moodState, setMoodState] = useState<CloudMoodState>({
    currentMood: initialMood,
    intensity: 0.5,
    isTransitioning: false
  });

  const [moodHistory, setMoodHistory] = useState<CloudMoodEvent[]>([]);

  // Mood mapping based on events
  const getMoodFromEvent = useCallback((event: CloudMoodEvent): { mood: CloudMood; intensity: number } => {
    switch (event.type) {
      case 'workout_complete':
        return { 
          mood: event.intensity === 'high' ? 'celebratory' : 'happy', 
          intensity: event.intensity === 'high' ? 0.9 : 0.7 
        };
      
      case 'goal_achieved':
        return { mood: 'celebratory', intensity: 0.95 };
      
      case 'new_record':
        return { mood: 'excited', intensity: 0.9 };
      
      case 'streak_broken':
        return { mood: 'motivated', intensity: 0.6 };
      
      case 'login':
        return { mood: 'happy', intensity: 0.6 };
      
      case 'idle':
        return { mood: 'calm', intensity: 0.3 };
      
      case 'interaction':
        return { 
          mood: event.intensity === 'high' ? 'excited' : 'focused', 
          intensity: event.intensity === 'high' ? 0.8 : 0.5 
        };
      
      case 'navigation':
        return { mood: 'thinking', intensity: 0.4 };
      
      case 'error':
        return { mood: 'annoyed', intensity: 0.7 };
      
      case 'celebration':
        return { mood: 'celebratory', intensity: 1.0 };
      
      default:
        return { mood: 'neutral', intensity: 0.5 };
    }
  }, []);

  // Trigger mood change based on event
  const triggerMoodEvent = useCallback((event: CloudMoodEvent) => {
    const { mood, intensity } = getMoodFromEvent(event);
    const duration = event.duration || 3000;

    setMoodState(prev => ({
      ...prev,
      isTransitioning: true
    }));

    // Transition to new mood
    setTimeout(() => {
      setMoodState(prev => ({
        currentMood: mood,
        intensity,
        isTransitioning: false,
        lastEvent: event
      }));
    }, 200);

    // Add to history
    setMoodHistory(prev => [...prev.slice(-9), event]);

    // Auto-return to calm after duration (unless it's a permanent state)
    if (event.type !== 'idle' && event.type !== 'login') {
      setTimeout(() => {
        setMoodState(prev => ({
          ...prev,
          currentMood: 'calm',
          intensity: 0.5,
          isTransitioning: false
        }));
      }, duration);
    }
  }, [getMoodFromEvent]);

  // Quick trigger methods for common events
  const workoutCompleted = useCallback((intensity: 'low' | 'medium' | 'high' = 'medium') => {
    triggerMoodEvent({ type: 'workout_complete', intensity });
  }, [triggerMoodEvent]);

  const goalAchieved = useCallback(() => {
    triggerMoodEvent({ type: 'goal_achieved', intensity: 'high', duration: 5000 });
  }, [triggerMoodEvent]);

  const newRecord = useCallback(() => {
    triggerMoodEvent({ type: 'new_record', intensity: 'high', duration: 4000 });
  }, [triggerMoodEvent]);

  const streakBroken = useCallback(() => {
    triggerMoodEvent({ type: 'streak_broken', intensity: 'medium', duration: 2000 });
  }, [triggerMoodEvent]);

  const userLogin = useCallback(() => {
    triggerMoodEvent({ type: 'login', intensity: 'medium', duration: 3000 });
  }, [triggerMoodEvent]);

  const userInteraction = useCallback((intensity: 'low' | 'medium' | 'high' = 'low') => {
    triggerMoodEvent({ type: 'interaction', intensity, duration: 1500 });
  }, [triggerMoodEvent]);

  const pageNavigation = useCallback(() => {
    triggerMoodEvent({ type: 'navigation', intensity: 'low', duration: 1000 });
  }, [triggerMoodEvent]);

  const celebrate = useCallback(() => {
    triggerMoodEvent({ type: 'celebration', intensity: 'high', duration: 6000 });
  }, [triggerMoodEvent]);

  const showError = useCallback(() => {
    triggerMoodEvent({ type: 'error', intensity: 'medium', duration: 2500 });
  }, [triggerMoodEvent]);

  // Auto-idle after period of inactivity
  useEffect(() => {
    let idleTimer: NodeJS.Timeout;

    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        triggerMoodEvent({ type: 'idle', intensity: 'low' });
      }, 30000); // 30 seconds of inactivity
    };

    const handleActivity = () => resetIdleTimer();

    // Listen for user activity
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keypress', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    resetIdleTimer();

    return () => {
      clearTimeout(idleTimer);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [triggerMoodEvent]);

  return {
    moodState,
    moodHistory,
    triggerMoodEvent,
    // Quick trigger methods
    workoutCompleted,
    goalAchieved,
    newRecord,
    streakBroken,
    userLogin,
    userInteraction,
    pageNavigation,
    celebrate,
    showError
  };
};