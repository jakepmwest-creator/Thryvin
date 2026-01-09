import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Animated,
  PanResponder,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { VoiceInputButton } from './VoiceInputButton';
import { useWorkoutStore } from '../stores/workout-store';
import { useCoachStore } from '../stores/coach-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActionConfirmationModal, PendingActionDetails } from './ActionConfirmationModal';
import { QuickActionsDrawer, QuickActionItem, ALL_QUICK_ACTIONS } from './QuickActionsDrawer';
import { InlineSuggestedActions, WORKOUT_TYPE_SUGGESTIONS, GENERAL_SUGGESTIONS, SuggestedAction } from './InlineSuggestedActions';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

import { COLORS as THEME_COLORS } from '../constants/colors';

const COLORS = {
  accent: THEME_COLORS.gradientStart, // #A22BF6
  accentSecondary: THEME_COLORS.gradientEnd, // #FF4EC7
  white: THEME_COLORS.white,
  text: THEME_COLORS.text,
  lightGray: THEME_COLORS.lightGray,
  mediumGray: THEME_COLORS.mediumGray,
};

const BUTTON_SIZE = 60;
const EDGE_PADDING = 20;

// Use backend API instead of direct OpenAI calls
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://trainee-assist.preview.emergentagent.com';

// Helper to make authenticated API calls
const makeAuthenticatedRequest = async (
  endpoint: string, 
  method: string = 'POST', 
  body?: any
): Promise<{ ok: boolean; data?: any; error?: string }> => {
  try {
    // Use the correct token key that matches api-client.ts
    const token = await SecureStore.getItemAsync('thryvin_access_token');
    
    // Dev logging (never log actual token value)
    console.log(`🔐 [API] ${method} ${endpoint} | Token exists: ${!!token}`);
    
    if (!token) {
      console.log('❌ [API] No auth token found in SecureStore');
      return { ok: false, error: 'Not authenticated. Please log in again.' };
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    
    const data = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      console.log(`❌ [API] ${endpoint} failed:`, response.status, data.error || 'Unknown error');
      return { ok: false, error: data.error || `Request failed (${response.status})` };
    }
    
    console.log(`✅ [API] ${endpoint} success`);
    return { ok: true, data };
  } catch (error: any) {
    console.error(`❌ [API] ${endpoint} error:`, error.message);
    return { ok: false, error: error.message || 'Network error' };
  }
};

// Message type that can include inline suggestions
interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  showSuggestions?: boolean;
  suggestionType?: 'workout_type' | 'general';
}

// Workout context for in-workout coaching
interface WorkoutContext {
  workoutId?: string;
  workoutTitle?: string;
  workoutType?: string;
  currentExercise?: {
    name: string;
    sets?: number;
    reps?: number | string;
    restTime?: number;
  };
  remainingExercisesCount?: number;
  progressPercent?: number;
}

// Workout-specific quick prompts
const WORKOUT_QUICK_PROMPTS = [
  { id: 'weight', icon: 'barbell', label: 'Weight?', prompt: 'What weight should I use for this exercise?' },
  { id: 'form', icon: 'body', label: 'Form Tip', prompt: 'Give me a form tip for this exercise' },
  { id: 'rest', icon: 'timer-outline', label: 'Rest Time?', prompt: 'How long should I rest between sets?' },
  { id: 'swap', icon: 'swap-horizontal', label: 'Swap', prompt: 'Suggest a swap for this exercise' },
  { id: 'easier', icon: 'leaf', label: 'Easier', prompt: 'Make this exercise easier' },
  { id: 'reps', icon: 'repeat', label: 'Reps?', prompt: 'How many reps should I do?' },
];

interface FloatingCoachButtonProps {
  contextMode?: 'in_workout' | 'home' | 'chat';
  workoutContext?: WorkoutContext;
  onClose?: () => void;
}

export function FloatingCoachButton({ 
  contextMode = 'home',
  workoutContext,
  onClose,
}: FloatingCoachButtonProps) {
  const { swapWorkoutDays, forceRegenerateWeek, weekWorkouts, resetProgram } = useWorkoutStore();
  const { chatVisible, initialMessage, openChat, closeChat, coachName, loadCoachSettings } = useCoachStore();
  
  // Different greeting based on context
  const getInitialMessage = () => {
    if (contextMode === 'in_workout' && workoutContext?.currentExercise?.name) {
      return `Hey! I'm here to help with your ${workoutContext.workoutTitle || 'workout'}! 💪\n\nCurrently on: ${workoutContext.currentExercise.name}\n\nNeed help with weight, form, or want to swap this exercise?`;
    }
    if (contextMode === 'in_workout') {
      return `Hey! I'm here to help with your ${workoutContext?.workoutTitle || 'workout'}! 💪\n\nTap an exercise to focus on it, or ask me anything!`;
    }
    return "Hey! I'm your AI coach. 💪 I can help with workouts, swap your training days, adjust intensity, or answer fitness questions!";
  };
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', text: getInitialMessage() },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingActionDetails | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showQuickActionsDrawer, setShowQuickActionsDrawer] = useState(true);
  
  // Ref for auto-scrolling to bottom
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Auto-scroll when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);
  
  // Update greeting when exercise changes (but not too frequently)
  const currentExerciseName = workoutContext?.currentExercise?.name;
  useEffect(() => {
    if (contextMode === 'in_workout') {
      const newMessage = getInitialMessage();
      setMessages([{ role: 'assistant', text: newMessage }]);
    }
  }, [currentExerciseName]);
  
  // Load coach settings on mount
  useEffect(() => {
    loadCoachSettings();
  }, []);
  
  // Handle initial message from context
  useEffect(() => {
    if (chatVisible && initialMessage) {
      setInputText(initialMessage);
    }
  }, [chatVisible, initialMessage]);

  const pan = useRef(new Animated.ValueXY({ 
    x: SCREEN_WIDTH - BUTTON_SIZE - EDGE_PADDING, 
    y: SCREEN_HEIGHT - 200 
  })).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const isSignificantMove = Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
        if (isSignificantMove) {
          setIsDragging(true);
        }
        return isSignificantMove;
      },
      onPanResponderGrant: () => {
        pan.extractOffset();
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gesture) => {
        pan.flattenOffset();
        
        const currentX = pan.x._value;
        const currentY = pan.y._value;
        
        const finalX = Math.max(
          EDGE_PADDING,
          Math.min(currentX, SCREEN_WIDTH - BUTTON_SIZE - EDGE_PADDING)
        );
        const finalY = Math.max(
          100,
          Math.min(currentY, SCREEN_HEIGHT - BUTTON_SIZE - 100)
        );
        
        const snapX = finalX < SCREEN_WIDTH / 2 
          ? EDGE_PADDING 
          : SCREEN_WIDTH - BUTTON_SIZE - EDGE_PADDING;
        
        Animated.spring(pan, {
          toValue: { x: snapX, y: finalY },
          useNativeDriver: false,
          friction: 7,
          tension: 40,
        }).start();

        setTimeout(() => setIsDragging(false), 100);
      },
    })
  ).current;

  const handleButtonPress = () => {
    if (!isDragging) {
      openChat();
    }
  };

  // Call backend coach API (includes full user context: onboarding, advanced questionnaire, workout history)
  const callCoachAPI = async (userMessage: string) => {
    try {
      // Get auth token for Bearer auth
      const token = await SecureStore.getItemAsync('thryvin_access_token');
      
      // Get user ID from AsyncStorage for personalized context
      const userDataStr = await AsyncStorage.getItem('user_data');
      const userData = userDataStr ? JSON.parse(userDataStr) : null;
      const userId = userData?.id || userData?.userId;
      
      console.log('🤖 [COACH] Calling backend API with userId:', userId, 'hasToken:', !!token);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add Bearer token if available
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/coach/chat`, {
        method: 'POST',
        headers,
        credentials: 'include', // Include session cookies as fallback
        body: JSON.stringify({
          message: userMessage,
          coach: coachName || 'default',
          contextMode: contextMode, // Pass context mode for behavior adaptation
          // Note: Backend derives userId from session, not from body (security)
          conversationHistory: messages.slice(-6).map(m => ({
            role: m.role === 'assistant' ? 'coach' : 'user',
            content: typeof m.text === 'string' ? m.text : ''
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Coach API Error:', response.status, errorData);
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      const data = await response.json();
      return data.response || "I'm here to help! What would you like to know? 💪";
    } catch (error: any) {
      console.error('Coach API Error:', error);
      return `I'm having trouble connecting right now. ${error?.message || 'Please try again in a moment!'} 💪`;
    }
  };

  // Detect workout intents and handle locally
  const detectWorkoutIntent = (message: string): { handled: boolean; response?: string; action?: PendingActionDetails; showSuggestions?: boolean; suggestionType?: 'workout_type' | 'general' } => {
    // Safety check - ensure message is a string
    if (typeof message !== 'string') {
      console.error('detectWorkoutIntent received non-string:', typeof message, message);
      return { handled: false };
    }
    
    const lower = message.toLowerCase();
    
    // ===========================================================================
    // CRITICAL: Check for user REJECTION/CORRECTION first
    // If user says "not cardio" or "no, arms", invalidate pendingAction and re-detect
    // ===========================================================================
    const rejectionPatterns = [
      /^no[,.]?\s*/i,
      /^not\s+/i,
      /^that's\s+not/i,
      /^thats\s+not/i,
      /^wrong/i,
      /^i\s+(said|meant|want)/i,
      /^actually/i,
    ];
    
    const isRejection = rejectionPatterns.some(pattern => pattern.test(message.trim()));
    
    if (isRejection && pendingAction) {
      console.log('⚠️ [COACH] User rejection detected, invalidating pendingAction');
      
      // Try to detect what they actually want
      const bodyPartTypes = [
        'arms', 'arm', 'biceps', 'bicep', 'triceps', 'tricep',
        'chest', 'pecs', 'pec',
        'back', 'lats', 'lat',
        'legs', 'leg', 'quads', 'quad', 'hamstrings', 'hamstring', 'glutes', 'glute',
        'shoulders', 'shoulder', 'delts', 'delt',
        'core', 'abs', 'ab',
        'upper', 'lower', 'push', 'pull',
      ];
      
      let correctedType: string | null = null;
      for (const type of bodyPartTypes) {
        if (lower.includes(type)) {
          // Map to standard name
          if (type.includes('arm') || type.includes('bicep') || type.includes('tricep')) {
            correctedType = 'arms';
          } else if (type.includes('chest') || type.includes('pec')) {
            correctedType = 'chest';
          } else if (type.includes('back') || type.includes('lat')) {
            correctedType = 'back';
          } else if (type.includes('leg') || type.includes('quad') || type.includes('hamstring') || type.includes('glute')) {
            correctedType = 'legs';
          } else if (type.includes('shoulder') || type.includes('delt')) {
            correctedType = 'shoulders';
          } else if (type.includes('core') || type.includes('ab')) {
            correctedType = 'core';
          } else if (type === 'upper' || type === 'lower' || type === 'push' || type === 'pull') {
            correctedType = type;
          }
          break;
        }
      }
      
      if (correctedType) {
        // User corrected with a specific type
        const dayName = pendingAction.params?.date 
          ? new Date(pendingAction.params.date).toLocaleDateString('en-US', { weekday: 'long' })
          : 'today';
        
        return {
          handled: true,
          response: `Got it! I'll make it ${correctedType.toUpperCase()} instead. 💪\n\nAdding a ${correctedType} session for ${dayName}.\n\nPress the button to confirm!`,
          action: { 
            type: pendingAction.type, // Keep same action type
            params: { 
              ...pendingAction.params,
              workoutType: correctedType // Update the workout type
            } 
          }
        };
      } else {
        // Rejection without clear alternative - ask what they want with suggestions
        setPendingAction(null); // Clear pending action
        return {
          handled: true,
          response: "I understand, that's not what you wanted. 🤔\n\nTap what you'd like instead:",
          showSuggestions: true,
          suggestionType: 'workout_type',
        };
      }
    }
    
    // ADD WORKOUT intent (rest day → active day, or extra workout, or run/5K)
    // LOG UNEXPECTED WORKOUT intent - Initial request
    if ((lower.includes('unexpected workout') || lower.includes('did a workout') || lower.includes('forgot to log')) && 
        (lower.includes('log') || lower.includes('track') || lower.includes('record') || lower.includes('today'))) {
      return {
        handled: true,
        response: "Great! Let's log that workout. 📝\n\nTell me:\n1️⃣ What type? (Cardio, Strength, HIIT, Yoga, etc.)\n2️⃣ How long? (in minutes)\n3️⃣ Brief description of what you did\n\nJust type it all in one message, like: 'Strength workout, 45 mins, did chest and triceps'",
      };
    }
    
    // PARSE LOG WORKOUT DETAILS - When user provides workout info
    const workoutTypeKeywords = ['strength', 'cardio', 'hiit', 'yoga', 'flexibility', 'core', 'upper body', 'lower body', 'full body', 'legs', 'chest', 'back', 'arms'];
    const hasWorkoutType = workoutTypeKeywords.some(type => lower.includes(type));
    const durationMatch = message.match(/(\d+)\s*(min|mins|minute|minutes)/i);
    
    if (hasWorkoutType && durationMatch) {
      // Extract workout details
      let workoutType = 'workout';
      for (const type of workoutTypeKeywords) {
        if (lower.includes(type)) {
          workoutType = type;
          break;
        }
      }
      
      const duration = parseInt(durationMatch[1]);
      const description = message.replace(/\d+\s*(min|mins|minute|minutes)/gi, '').trim();
      
      return {
        handled: true,
        response: `Awesome! Here's how I'll log it:\n\n📋 **${workoutType.charAt(0).toUpperCase() + workoutType.slice(1)} Workout**\n⏱️ Duration: ${duration} minutes\n📝 Notes: ${description}\n\nPress the button below to confirm and save it!`,
        action: { 
          type: 'log_workout', 
          params: { 
            type: workoutType, 
            duration: duration, 
            description: description,
            date: new Date().toISOString()
          } 
        }
      };
    }
    
    // ADD WORKOUT intent (rest day → active day, or extra workout, or run/5K)
    const isAddWorkoutIntent = (
      (lower.includes('add') || lower.includes('feeling energetic') || lower.includes('extra') || 
       lower.includes('want to do') || lower.includes('suggest something') ||
       lower.includes('5k') || lower.includes('run') || lower.includes('jog') || 
       lower.includes('bike') || lower.includes('swim')) && 
      (lower.includes('workout') || lower.includes('session') || lower.includes('training') || 
       lower.includes('5k') || lower.includes('run') || lower.includes('jog') || lower.includes('cardio') || 
       lower.includes('something light') || lower.includes('rest day') ||
       lower.includes('arms') || lower.includes('chest') || lower.includes('back') || 
       lower.includes('legs') || lower.includes('shoulders') || lower.includes('upper') || 
       lower.includes('lower') || lower.includes('push') || lower.includes('pull'))
    );
    
    if (isAddWorkoutIntent) {
      // COMPREHENSIVE workout type detection - CHECK SPECIFIC TYPES FIRST before defaulting
      // Priority order: specific body parts > general types > cardio (last resort)
      const bodyPartTypes = [
        'arms', 'arm', 'biceps', 'bicep', 'triceps', 'tricep',
        'chest', 'pecs', 'pec',
        'back', 'lats', 'lat',
        'legs', 'leg', 'quads', 'quad', 'hamstrings', 'hamstring', 'glutes', 'glute',
        'shoulders', 'shoulder', 'delts', 'delt',
        'core', 'abs', 'ab',
        'upper', 'upper body',
        'lower', 'lower body',
        'push', 'push day',
        'pull', 'pull day',
        'full body', 'full-body',
      ];
      
      const generalTypes = ['strength', 'yoga', 'hiit', 'flexibility'];
      const cardioKeywords = ['run', 'jog', '5k', '10k', 'bike', 'cycle', 'swim', 'rowing', 'elliptical', 'treadmill', 'cardio'];
      
      let detectedType: string | null = null;
      let duration = 30; // default
      
      // 1. First check for specific body part types (most specific)
      for (const type of bodyPartTypes) {
        if (lower.includes(type)) {
          // Map variations to standard names
          if (type.includes('arm') || type.includes('bicep') || type.includes('tricep')) {
            detectedType = 'arms';
          } else if (type.includes('chest') || type.includes('pec')) {
            detectedType = 'chest';
          } else if (type.includes('back') || type.includes('lat')) {
            detectedType = 'back';
          } else if (type.includes('leg') || type.includes('quad') || type.includes('hamstring') || type.includes('glute')) {
            detectedType = 'legs';
          } else if (type.includes('shoulder') || type.includes('delt')) {
            detectedType = 'shoulders';
          } else if (type.includes('core') || type.includes('ab')) {
            detectedType = 'core';
          } else if (type === 'upper' || type === 'upper body') {
            detectedType = 'upper';
          } else if (type === 'lower' || type === 'lower body') {
            detectedType = 'lower';
          } else if (type.includes('push')) {
            detectedType = 'push';
          } else if (type.includes('pull')) {
            detectedType = 'pull';
          } else if (type.includes('full')) {
            detectedType = 'full body';
          }
          if (detectedType) break;
        }
      }
      
      // 2. Check for general workout types if no body part found
      if (!detectedType) {
        for (const type of generalTypes) {
          if (lower.includes(type)) {
            detectedType = type;
            break;
          }
        }
      }
      
      // 3. Check for cardio keywords only if nothing else matched
      if (!detectedType) {
        for (const keyword of cardioKeywords) {
          if (lower.includes(keyword)) {
            detectedType = 'cardio';
            // For runs, estimate duration based on distance
            if (lower.includes('5k')) {
              duration = 25;
            } else if (lower.includes('10k')) {
              duration = 50;
            }
            break;
          }
        }
      }
      
      // 4. FAIL CLOSED: If still no type detected, ASK FOR CLARIFICATION with quick action buttons
      if (!detectedType) {
        return {
          handled: true,
          response: "What type of workout would you like to add? 🤔\n\nTap one of the options below:",
          showSuggestions: true,
          suggestionType: 'workout_type',
        };
      }
      
      // Detect duration
      const durationMatch = lower.match(/(\d+)\s*(min|minute)/);
      if (durationMatch) {
        duration = parseInt(durationMatch[1]);
      }
      
      // Detect target day
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const dayMap: Record<string, number> = { 
        monday: 0, tuesday: 1, wednesday: 2, thursday: 3, 
        friday: 4, saturday: 5, sunday: 6,
        mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5, sun: 6
      };
      
      let targetDate: Date | null = null;
      
      // Check for specific day mentions
      for (const [key, index] of Object.entries(dayMap)) {
        if (lower.includes(key)) {
          const today = new Date();
          const currentDay = today.getDay() === 0 ? 6 : today.getDay() - 1;
          const daysDiff = index - currentDay;
          targetDate = new Date(today);
          targetDate.setDate(today.getDate() + daysDiff);
          break;
        }
      }
      
      // Check for "today"
      if (lower.includes('today') || !targetDate) {
        targetDate = new Date();
      }
      
      // Check if target date already has a completed workout
      const targetDateStr = targetDate.toDateString();
      const existingWorkout = weekWorkouts.find(w => new Date(w.date).toDateString() === targetDateStr);
      
      if (existingWorkout?.completed) {
        // Unlock completed workout for additions
        return {
          handled: true,
          response: `I can reopen your completed workout for ${targetDate.toLocaleDateString('en-US', { weekday: 'long' })}! 📝\n\nPress the button below to unlock it and add more exercises.`,
          action: { type: 'unlock_workout', params: { date: targetDate } }
        };
      } else {
        const dayName = targetDate.toLocaleDateString('en-US', { weekday: 'long' });
        return {
          handled: true,
          response: `Perfect! I'll add a ${duration}-minute ${detectedType} session to ${dayName}. 💪\n\nPress the button below to confirm!`,
          action: { type: 'add_workout', params: { date: targetDate, workoutType: detectedType, duration } }
        };
      }
    }
    
    // REMOVE WORKOUT intent
    if ((lower.includes('remove') || lower.includes('skip') || lower.includes('cancel') || lower.includes('get rid')) && 
        (lower.includes('workout') || lower.includes('day') || lower.includes('friday') || lower.includes('saturday'))) {
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const dayMap: Record<string, number> = { 
        monday: 0, tuesday: 1, wednesday: 2, thursday: 3, 
        friday: 4, saturday: 5, sunday: 6,
        mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5, sun: 6
      };
      
      let targetDay: number | null = null;
      for (const [key, index] of Object.entries(dayMap)) {
        if (lower.includes(key)) {
          targetDay = index;
          break;
        }
      }
      
      if (targetDay !== null) {
        const dayName = days[targetDay];
        return {
          handled: true,
          response: `Understood! 📅\n\nI'll remove the workout scheduled for ${dayName}.\n\nSay "yes" to confirm, and I'll update your plan.`,
          action: { type: 'remove_workout', params: { dayIndex: targetDay } }
        };
      } else {
        return {
          handled: true,
          response: "Which day's workout would you like to remove?\n\nJust tell me the day (e.g., 'Friday' or 'tomorrow')."
        };
      }
    }
    
    // Swap days intent
    if (lower.includes('swap') || lower.includes('switch') || lower.includes('move')) {
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const dayMap: Record<string, number> = { 
        monday: 0, tuesday: 1, wednesday: 2, thursday: 3, 
        friday: 4, saturday: 5, sunday: 6,
        mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5, sun: 6
      };
      
      // Find mentioned days
      const mentionedDays: number[] = [];
      for (const [key, index] of Object.entries(dayMap)) {
        if (lower.includes(key)) {
          mentionedDays.push(index);
        }
      }
      
      // Check for "today" and "tomorrow"
      if (lower.includes('today')) {
        const today = new Date().getDay();
        mentionedDays.push(today === 0 ? 6 : today - 1);
      }
      if (lower.includes('tomorrow')) {
        const today = new Date().getDay();
        const tomorrow = today === 6 ? 0 : today;
        mentionedDays.push(tomorrow);
      }
      
      if (mentionedDays.length >= 2) {
        const [from, to] = mentionedDays;
        return {
          handled: true,
          response: `Got it! I'll swap those workout days for you. 📅\n\nConfirm by tapping the button below, or just say "yes" to proceed!`,
          action: { type: 'swap', params: { from, to } }
        };
      } else {
        return {
          handled: true,
          response: "Which days would you like to swap? 📅\n\nTry saying: 'Swap Wednesday with Thursday' or 'Switch today and tomorrow'"
        };
      }
    }
    
    // SKIP DAY intent - Ask which day
    if ((lower.includes('skip') && (lower.includes('day') || lower.includes('workout'))) && !lower.includes('remove')) {
      const dayMap: Record<string, string> = { 
        monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', 
        friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
        mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', 
        fri: 'Friday', sat: 'Saturday', sun: 'Sunday'
      };
      
      let targetDay: string | null = null;
      for (const [key, dayName] of Object.entries(dayMap)) {
        if (lower.includes(key)) {
          targetDay = dayName;
          break;
        }
      }
      
      // Check for today/tomorrow
      if (lower.includes('today')) {
        targetDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      } else if (lower.includes('tomorrow')) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        targetDay = tomorrow.toLocaleDateString('en-US', { weekday: 'long' });
      }
      
      // If no day specified, ask which day
      if (!targetDay) {
        return {
          handled: true,
          response: "Which day would you like to skip? 📅\n\n• Today\n• Tomorrow\n• Or pick a specific day\n\nYour workout will be marked as skipped and you can reschedule if needed."
        };
      }
      
      return {
        handled: true,
        response: `Got it! I'll skip ${targetDay}'s workout. ⏭️\n\nDon't worry - you can always add it back later.\n\nPress confirm to skip this day!`,
        action: { 
          type: 'skip_day', 
          params: { 
            targetDay,
            date: new Date()
          } 
        }
      };
    }
    
    // REST DAY intent - Convert a day to rest
    if ((lower.includes('rest day') || lower.includes('rest') && lower.includes('day')) && !lower.includes('today is a rest')) {
      const dayMap: Record<string, string> = { 
        monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', 
        friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
        mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', 
        fri: 'Friday', sat: 'Saturday', sun: 'Sunday'
      };
      
      let targetDay: string | null = null;
      for (const [key, dayName] of Object.entries(dayMap)) {
        if (lower.includes(key)) {
          targetDay = dayName;
          break;
        }
      }
      
      // Check for today/tomorrow
      if (lower.includes('today')) {
        targetDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      } else if (lower.includes('tomorrow')) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        targetDay = tomorrow.toLocaleDateString('en-US', { weekday: 'long' });
      }
      
      // If no day specified, ask which day
      if (!targetDay) {
        return {
          handled: true,
          response: "Which day would you like to make a rest day? 😴\n\n• Today\n• Tomorrow\n• Or pick a specific day\n\nRest is important for recovery!"
        };
      }
      
      return {
        handled: true,
        response: `Rest day incoming! 😴 I'll convert ${targetDay} to a rest day.\n\nYour body needs recovery to get stronger!\n\nPress confirm to make it a rest day!`,
        action: { 
          type: 'rest_day', 
          params: { 
            targetDay,
            date: new Date()
          } 
        }
      };
    }
    
    // Stats inquiry - brief with link suggestion
    if (lower.includes('my stats') || lower.includes('my progress') || lower.includes('how many workouts') || lower.includes('streak')) {
      // Compute stats from weekWorkouts
      const completedCount = weekWorkouts.filter(w => w.completed && !w.isRestDay).length;
      const totalWorkouts = weekWorkouts.filter(w => !w.isRestDay).length;
      const thisWeekCompleted = weekWorkouts.slice(0, 7).filter(w => w.completed && !w.isRestDay).length;
      
      // Calculate streak
      let streak = 0;
      const sortedWorkouts = [...weekWorkouts].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      for (const workout of sortedWorkouts) {
        if (workout.completed && !workout.isRestDay) {
          streak++;
        } else if (!workout.isRestDay) {
          break;
        }
      }
      
      return {
        handled: true,
        response: `📊 **Quick Stats**\n\n• This week: ${thisWeekCompleted} workouts ✅\n• Current streak: ${streak} days 🔥\n• Total completed: ${completedCount}\n\n👉 Check your Profile tab for detailed stats!\n\nKeep crushing it! 💪`
      };
    }
    
    // Today's workout inquiry
    if (lower.includes("today's workout") || lower.includes('what is today') || lower.includes('my workout today') || lower.includes('what workout')) {
      const today = new Date().toDateString();
      const todayWorkout = weekWorkouts.find(w => new Date(w.date).toDateString() === today);
      
      if (todayWorkout?.isRestDay) {
        return {
          handled: true,
          response: "😴 Today is a rest day!\n\nTake time to recover. Your body builds muscle during rest!"
        };
      } else if (todayWorkout) {
        return {
          handled: true,
          response: `🏋️ **Today: ${todayWorkout.title}**\n\n⏱️ ${todayWorkout.duration} min • ${todayWorkout.exercises?.length || 0} exercises\n💪 Focus: ${todayWorkout.targetMuscles || todayWorkout.type}\n\nReady to crush it? Head to Workouts tab!`
        };
      }
      return { handled: false };
    }
    
    // Tomorrow's workout inquiry - brief preview
    if (lower.includes("tomorrow") && (lower.includes('workout') || lower.includes('what'))) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toDateString();
      const tomorrowWorkout = weekWorkouts.find(w => new Date(w.date).toDateString() === tomorrowStr);
      
      if (tomorrowWorkout?.isRestDay) {
        return {
          handled: true,
          response: "😴 Tomorrow is a **rest day**!\n\nEnjoy the recovery."
        };
      } else if (tomorrowWorkout) {
        return {
          handled: true,
          response: `📅 **Tomorrow: ${tomorrowWorkout.title}**\n\n⏱️ ${tomorrowWorkout.duration} min • ${tomorrowWorkout.exercises?.length || 0} exercises\n💪 Focus: ${tomorrowWorkout.targetMuscles || tomorrowWorkout.type}\n\nCheck Workouts tab for details!`
        };
      }
      return { handled: false };
    }
    
    // Reset program intent
    if (lower.includes('reset') || lower.includes('start over') || lower.includes('new program') || lower.includes('restart')) {
      return {
        handled: true,
        response: "🔄 Ready to reset your workout program?\n\nThis will:\n• Clear all current workouts\n• Generate a fresh 3-week plan\n• Keep your preferences and stats\n\n⚠️ This action cannot be undone.\n\nConfirm to reset?",
        action: { type: 'reset' }
      };
    }
    
    // Regenerate workout intent - pick a SPECIFIC DAY, not the whole 21 days
    if (lower.includes('new workout') || lower.includes('regenerate') || lower.includes('different workout') || lower.includes('fresh workout')) {
      // Check if they specified a day
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const dayMap: Record<string, string> = { 
        monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', 
        friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
        mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', 
        fri: 'Friday', sat: 'Saturday', sun: 'Sunday'
      };
      
      let targetDay: string | null = null;
      for (const [key, dayName] of Object.entries(dayMap)) {
        if (lower.includes(key)) {
          targetDay = dayName;
          break;
        }
      }
      
      // Check for today/tomorrow
      if (lower.includes('today')) {
        targetDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      } else if (lower.includes('tomorrow')) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        targetDay = tomorrow.toLocaleDateString('en-US', { weekday: 'long' });
      }
      
      // If no day specified, ask which day
      if (!targetDay) {
        return {
          handled: true,
          response: "Which day would you like me to regenerate? 📅\n\n• Today\n• Tomorrow\n• Or pick a specific day (Monday, Tuesday, etc.)\n\nThis will ONLY regenerate that one day, not your whole program!",
          showSuggestions: false,
        };
      }
      
      // Now ask for reason
      const hasReason = lower.includes('because') || lower.includes('want') || lower.includes('need') || lower.includes('bored');
      
      if (!hasReason && lower.split(' ').length < 8) {
        return {
          handled: true,
          response: `Regenerating ${targetDay}'s workout! 🔄\n\nQuick question - any specific reason? This helps me give you something better:\n\n• Bored with current exercises\n• Want more variety\n• Different muscle focus\n• Just want something fresh\n\nOr just say "go ahead" to regenerate!`,
          action: { 
            type: 'regenerate_day', 
            params: { 
              targetDay,
              date: new Date()
            } 
          }
        };
      }
      
      // Extract reason
      const reason = message.replace(/new workout|regenerate|different workout|fresh workout|for|today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday/gi, '').trim();
      
      return {
        handled: true,
        response: `Got it! 🔄 I'll regenerate ${targetDay}'s workout${reason ? ` based on: "${reason}"` : ''}.\n\nThis will:\n• Create fresh exercises for ${targetDay}\n• Keep your other days unchanged\n• Respect your preferences\n\nPress confirm to regenerate!`,
        action: { 
          type: 'regenerate_day', 
          params: { 
            targetDay,
            reason: reason || undefined,
            date: new Date()
          } 
        }
      };
    }
    
    // Intensity change - HARDER (don't regenerate, just UPDATE)
    if (lower.includes('harder') || lower.includes('more intense') || lower.includes('more challenging')) {
      // Check if they're specifying what to make harder
      if (lower.includes('what') || lower.length < 25) {
        // Ask for specifics
        return {
          handled: true,
          response: "Let's crank it up! 🔥\n\nWhat would you like to make harder?\n\n• More sets/reps\n• Heavier weights\n• Shorter rest periods\n• More difficult exercises\n\nJust tell me what you want to intensify!",
          showSuggestions: false,
        };
      }
      
      // They've given details - create update action
      const description = message.replace(/harder|more intense|more challenging|make|my|workout/gi, '').trim();
      return {
        handled: true,
        response: `Got it! 💪 I'll update your workout to make it harder${description ? `: "${description}"` : ''}.\n\nThis will:\n• Increase intensity\n• NOT regenerate the whole workout\n\nPress confirm to apply!`,
        action: { 
          type: 'update_workout', 
          params: { 
            modification: 'harder',
            description: description || undefined,
            date: new Date()
          } 
        }
      };
    }
    
    // Intensity change - EASIER (don't regenerate, just UPDATE)
    if (lower.includes('easier') || lower.includes('less intense') || lower.includes('tone it down')) {
      // Check if they're specifying what to make easier
      if (lower.includes('what') || lower.length < 25) {
        return {
          handled: true,
          response: "No problem! 🌿\n\nWhat would you like to make easier?\n\n• Fewer sets/reps\n• Lighter weights\n• Longer rest periods\n• Simpler exercises\n\nTell me what you'd like adjusted!",
          showSuggestions: false,
        };
      }
      
      const description = message.replace(/easier|less intense|tone it down|make|my|workout/gi, '').trim();
      return {
        handled: true,
        response: `Understood! 🌿 I'll update your workout to make it easier${description ? `: "${description}"` : ''}.\n\nThis will:\n• Reduce intensity\n• NOT regenerate the whole workout\n\nPress confirm to apply!`,
        action: { 
          type: 'update_workout', 
          params: { 
            modification: 'easier',
            description: description || undefined,
            date: new Date()
          } 
        }
      };
    }
    
    // Duration change - SHORTER (don't regenerate, just UPDATE)
    if (lower.includes('shorter') || lower.includes('quick') || lower.includes('less time') || (lower.includes('30') && lower.includes('min'))) {
      // Check if they're specifying details
      if (lower.includes('what') || lower.length < 20) {
        return {
          handled: true,
          response: "Need a quicker session? ⏱️\n\nHow short do you want it?\n\n• 15-20 min (express)\n• 25-30 min (quick)\n• 35-40 min (moderate)\n\nOr tell me how much time you have!",
          showSuggestions: false,
        };
      }
      
      // Try to extract duration
      const durationMatch = lower.match(/(\d+)\s*(min|minute)/);
      const targetDuration = durationMatch ? parseInt(durationMatch[1]) : 30;
      const description = message.replace(/shorter|quick|less time|\d+\s*(min|minute|minutes)?|make|my|workout/gi, '').trim();
      
      return {
        handled: true,
        response: `Got it! ⏱️ I'll make your workout shorter (~${targetDuration} min)${description ? `: "${description}"` : ''}.\n\nThis will:\n• Remove some exercises\n• Keep the most effective moves\n• NOT regenerate the whole workout\n\nPress confirm to apply!`,
        action: { 
          type: 'update_workout', 
          params: { 
            modification: 'shorter',
            duration: targetDuration,
            description: description || undefined,
            date: new Date()
          } 
        }
      };
    }
    
    // Duration change - LONGER (NEW - don't regenerate, just UPDATE)
    if (lower.includes('longer') || lower.includes('more time') || lower.includes('extended') || (lower.includes('60') && lower.includes('min'))) {
      // Check if they're specifying details
      if (lower.includes('what') || lower.length < 20) {
        return {
          handled: true,
          response: "Want a longer session? ⏳\n\nHow long do you want it?\n\n• 45-50 min (moderate)\n• 55-60 min (full)\n• 70+ min (extended)\n\nOr tell me how much time you have!",
          showSuggestions: false,
        };
      }
      
      const durationMatch = lower.match(/(\d+)\s*(min|minute)/);
      const targetDuration = durationMatch ? parseInt(durationMatch[1]) : 60;
      const description = message.replace(/longer|more time|extended|\d+\s*(min|minute|minutes)?|make|my|workout/gi, '').trim();
      
      return {
        handled: true,
        response: `Perfect! ⏳ I'll make your workout longer (~${targetDuration} min)${description ? `: "${description}"` : ''}.\n\nThis will:\n• Add more exercises/sets\n• Keep the workout balanced\n• NOT regenerate the whole workout\n\nPress confirm to apply!`,
        action: { 
          type: 'update_workout', 
          params: { 
            modification: 'longer',
            duration: targetDuration,
            description: description || undefined,
            date: new Date()
          } 
        }
      };
    }
    
    // Help / capabilities
    if (lower.includes('what can you do') || lower.includes('help') || lower.includes('commands')) {
      return {
        handled: true,
        response: "🤖 I can help you with:\n\n• 📅 **Swap days** - 'Swap Monday with Wednesday'\n• 🔄 **New workout** - 'Generate a new workout'\n• 📊 **Stats** - 'Show my progress'\n• 💪 **Intensity** - 'Make it harder'\n• ⏱️ **Duration** - 'Make it shorter'\n• 🔁 **Reset** - 'Reset my program'\n• ❓ **Questions** - Ask anything fitness-related!\n\nWhat would you like to do?"
      };
    }
    
    // Yes/confirm handling for pending action
    if (pendingAction && (lower === 'yes' || lower === 'confirm' || lower === 'do it' || lower === 'go ahead' || lower === 'ok')) {
      return { handled: true, response: 'executing_action' };
    }
    
    // Cancel pending action
    if (pendingAction && (lower === 'no' || lower === 'cancel' || lower === 'nevermind')) {
      setPendingAction(null);
      return {
        handled: true,
        response: "No problem! Action cancelled. 👍\n\nWhat else can I help you with?"
      };
    }
    
    // Handle standalone day name as response (when user just types "Thursday" etc.)
    // Check if last message was asking for a day
    const lastAssistantMsg = messages.filter(m => m.role === 'assistant').pop();
    const wasAskingForDay = lastAssistantMsg?.text?.includes('Which day') || 
                           lastAssistantMsg?.text?.includes('which day') ||
                           lastAssistantMsg?.text?.includes('What day');
    
    if (wasAskingForDay) {
      const dayMap: Record<string, string> = { 
        monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', 
        friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
        mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', 
        fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
        today: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
        tomorrow: (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toLocaleDateString('en-US', { weekday: 'long' }); })()
      };
      
      // Check if user's message is primarily a day name
      const cleanedInput = lower.trim();
      let detectedDay: string | null = null;
      
      for (const [key, dayName] of Object.entries(dayMap)) {
        if (cleanedInput === key || cleanedInput.startsWith(key + ' ') || cleanedInput.includes(key)) {
          detectedDay = dayName;
          break;
        }
      }
      
      if (detectedDay) {
        // Determine what action type based on the last question
        const isSkipQuestion = lastAssistantMsg?.text?.toLowerCase().includes('skip');
        const isRestQuestion = lastAssistantMsg?.text?.toLowerCase().includes('rest');
        const isRegenerateQuestion = lastAssistantMsg?.text?.toLowerCase().includes('regenerate');
        const isHarderQuestion = lastAssistantMsg?.text?.toLowerCase().includes('harder');
        const isEasierQuestion = lastAssistantMsg?.text?.toLowerCase().includes('easier');
        
        if (isSkipQuestion) {
          return {
            handled: true,
            response: `Got it! I'll skip ${detectedDay}'s workout. ⏭️\n\nDon't worry - you can always add it back later.\n\nPress confirm to skip!`,
            action: { type: 'skip_day', params: { targetDay: detectedDay } }
          };
        } else if (isRestQuestion) {
          return {
            handled: true,
            response: `Rest day incoming! 😴 I'll convert ${detectedDay} to a rest day.\n\nPress confirm to make it a rest day!`,
            action: { type: 'rest_day', params: { targetDay: detectedDay } }
          };
        } else if (isRegenerateQuestion) {
          return {
            handled: true,
            response: `Got it! 🔄 I'll regenerate ${detectedDay}'s workout with fresh exercises.\n\nPress confirm to regenerate!`,
            action: { type: 'regenerate_day', params: { targetDay: detectedDay } }
          };
        }
      }
    }
    
    return { handled: false };
  };
  
  // Execute pending action
  const executeAction = async (action: PendingActionDetails) => {
    try {
      switch (action.type) {
        case 'log_workout':
          if (action.params?.type && action.params?.duration) {
            setMessages(prev => [...prev, { 
              role: 'assistant', 
              text: `💾 Logging your ${action.params.type} workout...` 
            }]);
            
            // Create a workout entry
            const loggedWorkout = {
              id: `logged_${Date.now()}`,
              title: `${action.params.type.charAt(0).toUpperCase() + action.params.type.slice(1)} Workout`,
              type: action.params.type,
              duration: action.params.duration,
              date: action.params.date,
              completedAt: new Date().toISOString(),
              completed: true,
              caloriesBurn: Math.round(action.params.duration * 6),
              exercises: [
                {
                  id: '1',
                  name: action.params.description || 'Custom workout',
                  sets: 0,
                  reps: '0',
                  restTime: 0,
                  category: 'main',
                }
              ],
              overview: action.params.description || 'Logged manually',
              difficulty: 'Custom',
              targetMuscles: 'Various',
              isRestDay: false,
            };
            
            // Add to completed workouts and save
            const currentCompleted = useWorkoutStore.getState().completedWorkouts;
            const updatedCompleted = [loggedWorkout, ...currentCompleted];
            
            // Update store
            useWorkoutStore.setState({ completedWorkouts: updatedCompleted });
            
            // Save to storage
            await AsyncStorage.setItem('completed_workouts', JSON.stringify(updatedCompleted));
            
            // Force refresh all workout data and stats
            await useWorkoutStore.getState().fetchCompletedWorkouts();
            await useWorkoutStore.getState().fetchWeekWorkouts();
            await useWorkoutStore.getState().fetchStats();
            
            console.log('✅ Logged workout saved and stats refreshed');
            
            setMessages(prev => [...prev, { 
              role: 'assistant', 
              text: `Done! ✅ Your ${action.params.type} workout has been logged!\n\n💪 ${action.params.duration} minutes added to your stats\n🔥 ${Math.round(action.params.duration * 6)} calories burned\n\nKeep crushing it!` 
            }]);
          }
          break;
        case 'unlock_workout':
          if (action.params?.date) {
            const targetDate = new Date(action.params.date);
            const dateStr = targetDate.toDateString();
            
            setMessages(prev => [...prev, { 
              role: 'assistant', 
              text: `🔓 Unlocking your workout for ${targetDate.toLocaleDateString('en-US', { weekday: 'long' })}...` 
            }]);
            
            // Find and unlock the workout
            const workoutToUnlock = weekWorkouts.find(w => 
              new Date(w.date).toDateString() === dateStr
            );
            
            if (workoutToUnlock) {
              const updatedWorkouts = weekWorkouts.map(w => {
                if (new Date(w.date).toDateString() === dateStr) {
                  return { ...w, completed: false, completedAt: undefined };
                }
                return w;
              });
              
              useWorkoutStore.getState().setWeekWorkouts(updatedWorkouts);
              await AsyncStorage.setItem('week_workouts', JSON.stringify(updatedWorkouts));
              
              setMessages(prev => [...prev, { 
                role: 'assistant', 
                text: `Done! ✅ Your workout is unlocked. Head to the Workouts tab to continue where you left off! 💪` 
              }]);
            } else {
              throw new Error('Workout not found');
            }
          }
          break;
        case 'add_workout':
          if (action.params?.date && action.params?.workoutType) {
            setMessages(prev => [...prev, { 
              role: 'assistant', 
              text: `🔄 Adding your ${action.params.workoutType} workout...` 
            }]);
            
            const targetDate = new Date(action.params.date);
            const today = new Date();
            const isRestDay = weekWorkouts.find(w => 
              new Date(w.date).toDateString() === targetDate.toDateString()
            )?.isRestDay;
            
            let result;
            if (isRestDay) {
              // Replace rest day with workout
              result = await useWorkoutStore.getState().replaceRestDayWithWorkout(
                targetDate, 
                action.params.workoutType, 
                action.params.duration || 30
              );
            } else {
              // Add new workout
              result = await useWorkoutStore.getState().addWorkoutToDate(
                targetDate, 
                action.params.workoutType, 
                action.params.duration || 30
              );
            }
            
            if (result) {
              setMessages(prev => [...prev, { 
                role: 'assistant', 
                text: `Done! ✅ I've added a ${action.params.duration || 30}-minute ${action.params.workoutType} workout to your schedule.\n\nHead to the Workouts tab to start it when you're ready! 💪` 
              }]);
            } else {
              throw new Error('Failed to add workout');
            }
          }
          break;
        case 'remove_workout':
          if (action.params?.dayIndex !== undefined) {
            const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            const dayName = days[action.params.dayIndex];
            
            setMessages(prev => [...prev, { 
              role: 'assistant', 
              text: `🔄 Removing ${dayName}'s workout...` 
            }]);
            
            // Find the workout for that day
            const today = new Date();
            const currentDay = today.getDay() === 0 ? 6 : today.getDay() - 1; // Convert to Monday = 0
            const daysDiff = action.params.dayIndex - currentDay;
            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() + daysDiff);
            
            const removed = await useWorkoutStore.getState().removeWorkoutFromDate(targetDate);
            
            if (removed) {
              setMessages(prev => [...prev, { 
                role: 'assistant', 
                text: `Done! ✅ I've removed the workout scheduled for ${dayName}.\n\nYour schedule has been updated! 📅` 
              }]);
            } else {
              setMessages(prev => [...prev, { 
                role: 'assistant', 
                text: `Hmm, I couldn't find a workout for ${dayName}. It might already be removed or it's a rest day. 🤔` 
              }]);
            }
          }
          break;
        case 'swap':
          if (action.params?.from !== undefined && action.params?.to !== undefined) {
            const fromDayIndex = action.params.from;
            const toDayIndex = action.params.to;
            const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const fromDayName = daysOfWeek[fromDayIndex] || 'monday';
            const toDayName = daysOfWeek[toDayIndex] || 'wednesday';
            
            setMessages(prev => [...prev, { 
              role: 'assistant', 
              text: `🔄 Swapping ${fromDayName} and ${toDayName}...` 
            }]);
            
            // Call backend to swap days
            const swapResult = await makeAuthenticatedRequest('/api/coach/actions/execute', 'POST', {
              action: {
                type: 'SWAP_DAY',
                fromDay: fromDayName,
                toDay: toDayName,
              }
            });
            
            if (swapResult.ok) {
              // Also update local store
              await swapWorkoutDays(fromDayIndex, toDayIndex);
              setMessages(prev => [...prev, { 
                role: 'assistant', 
                text: `Done! ✅ I've swapped ${fromDayName.charAt(0).toUpperCase() + fromDayName.slice(1)}'s workout with ${toDayName.charAt(0).toUpperCase() + toDayName.slice(1)}'s. Check your schedule! 📅` 
              }]);
              await useWorkoutStore.getState().fetchWeekWorkouts();
            } else {
              setMessages(prev => [...prev, { 
                role: 'assistant', 
                text: `Hmm, I couldn't swap those days: ${swapResult.error}\n\nPlease try again! 🤔` 
              }]);
            }
          } else {
            setMessages(prev => [...prev, { 
              role: 'assistant', 
              text: "I need to know which two days you want to swap. Try saying 'Swap Monday with Wednesday' 📅" 
            }]);
          }
          break;
        
        // NEW: Update workout (harder/easier/shorter/longer) - UPDATES exercises, doesn't regenerate
        case 'update_workout':
          const mod = action.params?.modification || 'harder';
          const modLabels: Record<string, string> = {
            harder: 'more intense',
            easier: 'less intense',
            shorter: 'shorter',
            longer: 'longer'
          };
          
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            text: `🔄 Updating your workout to make it ${modLabels[mod]}...` 
          }]);
          
          // Call the NEW update-in-place endpoint - this MODIFIES exercises, doesn't regenerate
          const updateResult = await makeAuthenticatedRequest('/api/workouts/update-in-place', 'POST', {
            modification: mod,
            userFeedback: action.params?.description || null,
            targetDay: null, // null = today
          });
          
          if (updateResult.ok) {
            const summary = updateResult.data?.message || `Workout updated to be ${modLabels[mod]}`;
            setMessages(prev => [...prev, { 
              role: 'assistant', 
              text: `Done! ✅ ${summary}\n\nYour exercises have been adjusted - check your Workouts tab! 💪` 
            }]);
            // Refresh workouts to show updated exercises
            await useWorkoutStore.getState().fetchWeekWorkouts();
          } else {
            setMessages(prev => [...prev, { 
              role: 'assistant', 
              text: `Hmm, I couldn't update your workout: ${updateResult.error}\n\nPlease try again! 🤔` 
            }]);
          }
          break;
        
        // NEW: Regenerate single day - doesn't reset whole 21 days
        case 'regenerate_day':
          const targetDay = action.params?.targetDay || 'today';
          
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            text: `🔄 Regenerating ${targetDay}'s workout... This may take a moment.` 
          }]);
          
          // Call backend to regenerate single day
          const regenResult = await makeAuthenticatedRequest('/api/coach/actions/execute', 'POST', {
            action: {
              type: 'REGENERATE_SESSION',
              dayOfWeek: targetDay.toLowerCase(),
            }
          });
          
          if (regenResult.ok) {
            setMessages(prev => [...prev, { 
              role: 'assistant', 
              text: `Done! ✅ ${targetDay}'s workout has been regenerated with fresh exercises.\n\nYour other days remain unchanged. Go crush it! 💪` 
            }]);
            await useWorkoutStore.getState().fetchWeekWorkouts();
          } else {
            setMessages(prev => [...prev, { 
              role: 'assistant', 
              text: `Hmm, I couldn't regenerate ${targetDay}'s workout: ${regenResult.error}\n\nPlease try again! 🤔` 
            }]);
          }
          break;
        
        // NEW: Skip day - mark as skipped
        case 'skip_day':
          const skipDay = action.params?.targetDay || 'Today';
          
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            text: `⏭️ Skipping ${skipDay}'s workout...` 
          }]);
          
          // Call backend to skip day
          const skipResult = await makeAuthenticatedRequest('/api/coach/actions/execute', 'POST', {
            action: {
              type: 'SKIP_DAY',
              dayOfWeek: skipDay.toLowerCase(),
              reason: action.params?.reason || 'User requested skip',
            }
          });
          
          if (skipResult.ok) {
            setMessages(prev => [...prev, { 
              role: 'assistant', 
              text: `Done! ✅ ${skipDay}'s workout has been skipped.\n\nNo worries - consistency over perfection! You can always add it back later. 💪` 
            }]);
            await useWorkoutStore.getState().fetchWeekWorkouts();
          } else {
            setMessages(prev => [...prev, { 
              role: 'assistant', 
              text: `Hmm, I couldn't skip ${skipDay}'s workout: ${skipResult.error}\n\nPlease try again! 🤔` 
            }]);
          }
          break;
        
        // NEW: Rest day - convert to rest
        case 'rest_day':
          const restDay = action.params?.targetDay || 'Today';
          
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            text: `😴 Converting ${restDay} to a rest day...` 
          }]);
          
          // Call backend to convert to rest day
          const restResult = await makeAuthenticatedRequest('/api/coach/actions/execute', 'POST', {
            action: {
              type: 'SKIP_DAY',
              dayOfWeek: restDay.toLowerCase(),
              reason: 'Converted to rest day',
            }
          });
          
          if (restResult.ok) {
            setMessages(prev => [...prev, { 
              role: 'assistant', 
              text: `Done! ✅ ${restDay} is now a rest day.\n\nRest is when your muscles grow! Enjoy the recovery. 😴` 
            }]);
            await useWorkoutStore.getState().fetchWeekWorkouts();
          } else {
            setMessages(prev => [...prev, { 
              role: 'assistant', 
              text: `Hmm, I couldn't convert ${restDay} to a rest day: ${restResult.error}\n\nPlease try again! 🤔` 
            }]);
          }
          break;
        
        case 'regenerate':
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            text: "🔄 Regenerating your workout... This may take a moment." 
          }]);
          await forceRegenerateWeek();
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            text: "Done! ✅ Your workout has been regenerated with fresh exercises. Go crush it! 💪" 
          }]);
          break;
        case 'reset':
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            text: "🔄 Resetting your program... Creating a fresh 3-week plan." 
          }]);
          await resetProgram();
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            text: "Done! ✅ Your program has been reset. You have a brand new 3-week workout plan ready to go! 🎯" 
          }]);
          break;
      }
    } catch (error) {
      console.error('Action execution error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: "Oops, something went wrong. 😓 Please try again!" 
      }]);
    }
    setPendingAction(null);
  };

  const handleSend = async (directMessage?: string) => {
    // Guard: ensure directMessage is actually a string if provided
    const safeDirectMessage = typeof directMessage === 'string' ? directMessage : undefined;
    const messageToSend = safeDirectMessage || inputText.trim();
    
    if (!messageToSend || isLoading) return;

    const userMessage = messageToSend;
    setInputText('');
    
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    // First check for workout intents
    const intentResult = detectWorkoutIntent(userMessage);
    
    if (intentResult.handled) {
      if (intentResult.response === 'executing_action' && pendingAction) {
        // Show confirmation modal instead of executing directly
        setShowConfirmModal(true);
        setIsLoading(false);
      } else if (intentResult.response) {
        // Add message with potential suggestions
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          text: intentResult.response!,
          showSuggestions: intentResult.showSuggestions,
          suggestionType: intentResult.suggestionType,
        }]);
        if (intentResult.action) {
          setPendingAction(intentResult.action);
        }
      }
      setIsLoading(false);
      return;
    }
    
    // Otherwise, call backend coach API (includes full user context)
    const aiResponse = await callCoachAPI(userMessage);
    
    setMessages(prev => [...prev, { role: 'assistant', text: aiResponse }]);
    setIsLoading(false);
  };

  // Handle quick action from drawer
  const handleQuickActionFromDrawer = (action: QuickActionItem) => {
    setInputText(action.prompt);
    // Auto-send after selecting quick action
    setTimeout(() => {
      if (action.prompt) {
        setMessages(prev => [...prev, { role: 'user', text: action.prompt }]);
        setIsLoading(true);
        
        const intentResult = detectWorkoutIntent(action.prompt);
        if (intentResult.handled && intentResult.response) {
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            text: intentResult.response!,
            showSuggestions: intentResult.showSuggestions,
            suggestionType: intentResult.suggestionType,
          }]);
          if (intentResult.action) {
            setPendingAction(intentResult.action);
          }
        }
        setIsLoading(false);
        setInputText('');
      }
    }, 100);
  };

  // Handle inline suggestion selection
  const handleInlineSuggestion = (suggestion: SuggestedAction) => {
    setMessages(prev => [...prev, { role: 'user', text: suggestion.prompt }]);
    setIsLoading(true);
    
    const intentResult = detectWorkoutIntent(suggestion.prompt);
    if (intentResult.handled && intentResult.response) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: intentResult.response!,
        showSuggestions: intentResult.showSuggestions,
        suggestionType: intentResult.suggestionType,
      }]);
      if (intentResult.action) {
        setPendingAction(intentResult.action);
      }
    }
    setIsLoading(false);
  };

  // Handle confirmation modal confirm
  const handleConfirmAction = async () => {
    setShowConfirmModal(false);
    if (pendingAction) {
      await executeAction(pendingAction);
    }
  };

  // Handle confirmation modal cancel
  const handleCancelAction = () => {
    setShowConfirmModal(false);
    setPendingAction(null);
    setMessages(prev => [...prev, { 
      role: 'assistant', 
      text: "No problem! Action cancelled. 👍\n\nWhat else can I help you with?" 
    }]);
  };

  // Handle voice transcription
  const handleVoiceTranscription = (text: string) => {
    setInputText(prev => prev ? `${prev} ${text}` : text);
  };

  return (
    <>
      <Animated.View
        style={[
          styles.floatingButton,
          {
            transform: [
              { translateX: pan.x },
              { translateY: pan.y },
            ],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          onPress={handleButtonPress}
          activeOpacity={0.9}
          style={styles.touchable}
        >
          <LinearGradient
            colors={[COLORS.accent, COLORS.accentSecondary]}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="chatbubble-ellipses" size={26} color={COLORS.white} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      <Modal
        visible={chatVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeChat}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
          style={styles.modalContainer}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={closeChat}
          />
          
          <View style={styles.chatContainer}>
            <LinearGradient
              colors={[COLORS.accent, COLORS.accentSecondary]}
              style={styles.chatHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.headerContent}>
                <View style={styles.coachInfo}>
                  <View style={styles.coachAvatar}>
                    <Ionicons name="sparkles" size={20} color={COLORS.accent} />
                  </View>
                  <View>
                    <Text style={styles.coachName}>{coachName}</Text>
                    <Text style={styles.coachStatus}>Online • Ready to help</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={closeChat}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={28} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
              {messages.map((msg, i) => (
                <React.Fragment key={i}>
                  <View
                    style={[
                      styles.messageBubble,
                      msg.role === 'user' ? styles.userBubble : styles.assistantBubble,
                    ]}
                  >
                    {msg.role === 'user' ? (
                      <LinearGradient
                        colors={[COLORS.accent, COLORS.accentSecondary]}
                        style={styles.userBubbleGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Text style={[styles.messageText, styles.userText]}>
                          {typeof msg.text === 'string' ? msg.text : JSON.stringify(msg.text)}
                        </Text>
                      </LinearGradient>
                    ) : (
                      <>
                        <View style={styles.assistantIcon}>
                          <Ionicons name="sparkles" size={14} color={COLORS.accent} />
                        </View>
                        <Text style={[styles.messageText, styles.assistantText]}>
                          {typeof msg.text === 'string' ? msg.text : JSON.stringify(msg.text)}
                        </Text>
                      </>
                    )}
                  </View>
                  
                  {/* Show inline suggestions when confidence is low */}
                  {msg.showSuggestions && msg.role === 'assistant' && (
                    <InlineSuggestedActions
                      suggestions={msg.suggestionType === 'workout_type' ? WORKOUT_TYPE_SUGGESTIONS : GENERAL_SUGGESTIONS}
                      onSelect={handleInlineSuggestion}
                      title="Quick options:"
                    />
                  )}
                </React.Fragment>
              ))}
              {isLoading && (
                <View style={styles.loadingBubble}>
                  <ActivityIndicator color={COLORS.accent} />
                  <Text style={styles.loadingText}>Thinking...</Text>
                </View>
              )}
              
              {/* Action confirmation button - now opens modal */}
              {pendingAction && !isLoading && (
                <TouchableOpacity 
                  style={styles.confirmActionButton}
                  onPress={() => setShowConfirmModal(true)}
                >
                  <LinearGradient
                    colors={[COLORS.accent, COLORS.accentSecondary]}
                    style={styles.confirmActionGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="checkmark-circle" size={18} color={COLORS.white} />
                    <Text style={styles.confirmActionText}>
                      {pendingAction.type === 'swap' && 'Confirm Swap'}
                      {pendingAction.type === 'add_workout' && `Add ${pendingAction.params?.workoutType?.toUpperCase()} Session`}
                      {pendingAction.type === 'log_workout' && 'Log This Workout'}
                      {pendingAction.type === 'unlock_workout' && 'Unlock Workout'}
                      {pendingAction.type === 'remove_workout' && 'Remove Workout'}
                      {pendingAction.type === 'regenerate' && 'Confirm & Regenerate'}
                      {pendingAction.type === 'reset' && 'Reset Program'}
                      {pendingAction.type === 'update_workout' && `Make It ${pendingAction.params?.modification?.charAt(0).toUpperCase()}${pendingAction.params?.modification?.slice(1) || ''}`}
                      {pendingAction.type === 'regenerate_day' && `Regenerate ${pendingAction.params?.targetDay || 'Day'}`}
                      {pendingAction.type === 'skip_day' && `Skip ${pendingAction.params?.targetDay || 'Day'}`}
                      {pendingAction.type === 'rest_day' && `Make ${pendingAction.params?.targetDay || 'Day'} Rest Day`}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </ScrollView>
            
            {/* Workout-Specific Quick Prompts (only in workout mode) */}
            {contextMode === 'in_workout' && workoutContext?.currentExercise && (
              <View style={styles.workoutPromptsContainer}>
                <Text style={styles.workoutPromptsLabel}>
                  💪 {workoutContext.currentExercise.name}
                </Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.workoutPromptsScroll}
                >
                  {WORKOUT_QUICK_PROMPTS.map((prompt) => (
                    <TouchableOpacity
                      key={prompt.id}
                      style={styles.workoutPromptChip}
                      onPress={() => {
                        setInputText(prompt.prompt);
                        handleSend(prompt.prompt);
                      }}
                    >
                      <Ionicons name={prompt.icon as any} size={14} color={COLORS.accent} />
                      <Text style={styles.workoutPromptText}>{prompt.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Ask your coach anything..."
                  placeholderTextColor={COLORS.mediumGray}
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  editable={!isLoading}
                />
                <VoiceInputButton
                  onTranscription={handleVoiceTranscription}
                  size="small"
                  style={styles.inlineVoiceButton}
                />
              </View>
              <TouchableOpacity
                style={styles.sendButton}
                onPress={() => handleSend()}
                disabled={isLoading || !inputText.trim()}
              >
                <LinearGradient
                  colors={[COLORS.accent, COLORS.accentSecondary]}
                  style={styles.sendGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="send" size={18} color={COLORS.white} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Action Confirmation Modal */}
      <ActionConfirmationModal
        visible={showConfirmModal}
        action={pendingAction}
        onConfirm={handleConfirmAction}
        onCancel={handleCancelAction}
      />
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    zIndex: 9999,
  },
  touchable: {
    width: '100%',
    height: '100%',
  },
  buttonGradient: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalContainer: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  chatContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '85%',
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  chatHeader: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coachInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  coachAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coachName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 2,
  },
  coachStatus: {
    fontSize: 13,
    color: COLORS.white,
    opacity: 0.9,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  messagesContent: {
    padding: 20,
    gap: 12,
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    gap: 8,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  userBubbleGradient: {
    borderRadius: 18,
    padding: 14,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  assistantIcon: {
    marginTop: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    flex: 1,
  },
  userText: {
    color: COLORS.white,
    fontWeight: '500',
  },
  assistantText: {
    color: COLORS.text,
    fontWeight: '500',
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  loadingText: {
    fontSize: 15,
    color: COLORS.mediumGray,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    gap: 8,
    alignItems: 'flex-end',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 24,
    paddingRight: 4,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text,
    maxHeight: 100,
    minHeight: 44,
  },
  inlineVoiceButton: {
    marginRight: 4,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  sendGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmActionButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  confirmActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  confirmActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  // Workout-specific quick prompts styles
  workoutPromptsContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  workoutPromptsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  workoutPromptsScroll: {
    gap: 8,
    paddingRight: 12,
  },
  workoutPromptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: `${COLORS.accent}15`,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${COLORS.accent}30`,
    gap: 4,
  },
  workoutPromptText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.accent,
  },
});