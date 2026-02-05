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
import { useAwardsStore } from '../stores/awards-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActionConfirmationModal, PendingActionDetails } from './ActionConfirmationModal';
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
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://bugzapper-55.preview.emergentagent.com';

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
    // Friendly greeting without listing capabilities
    const greetings = [
      "Hey! Ready to crush your goals today? 💪",
      "What's up! How can I help you today? 🏋️",
      "Hey there! Let's make today count! 🔥",
      "Hi! I'm your fitness coach. What's on your mind? 💬",
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  };
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', text: getInitialMessage() },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingActionDetails | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
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
    // DIRECTIVE-ONLY: Coach is READ-ONLY - Redirect ALL modifications to the app
    // Coach should NOT perform actions itself - just guide users to the right place
    // ===========================================================================
    
    // Check for plan modification intents and redirect to Edit Plan
    const planModificationKeywords = [
      'swap', 'switch', 'move', 'change day', 'change the day',
      'skip', 'skip day', 'skip workout', 
      'remove', 'delete', 'cancel',
      'add workout', 'add a workout', 'add exercise', 'add an exercise',
      'harder', 'more intense', 'more challenging', 'increase intensity',
      'easier', 'less intense', 'tone down', 'decrease intensity',
      'make it harder', 'make it easier', 'make workout',
      'edit workout', 'edit plan', 'modify workout', 'modify plan',
      'regenerate', 'new workout', 'different workout',
      'reset', 'start over', 'new program',
      'feeling energetic', 'i\'m energetic', 'extra workout', 'extra session',
      'want to do', 'want to add', 'can you add',
      'rest day', 'convert to rest', 'make rest day',
    ];
    
    const isPlanModification = planModificationKeywords.some(keyword => lower.includes(keyword));
    
    if (isPlanModification) {
      // Determine which feature to recommend
      let recommendation = '';
      let additionalTip = '';
      
      if (lower.includes('feeling energetic') || lower.includes('extra') || lower.includes('want to do') || lower.includes('want to add')) {
        recommendation = '**Add Workout** in Edit Plan';
        additionalTip = '\n\n💡 Feeling energetic? That\'s awesome! You can add an extra workout or convert a rest day to a training day right there.';
      } else if (lower.includes('swap') || lower.includes('switch') || lower.includes('move')) {
        recommendation = '**Swap Days** in Edit Plan';
      } else if (lower.includes('skip')) {
        recommendation = '**Skip Day** in Edit Plan';
      } else if (lower.includes('remove') || lower.includes('delete') || lower.includes('cancel')) {
        recommendation = '**Skip Day** in Edit Plan to convert it to a rest day';
      } else if (lower.includes('add workout') || lower.includes('add a workout') || lower.includes('add exercise')) {
        recommendation = '**Add Workout** in Edit Plan';
      } else if (lower.includes('harder') || lower.includes('more intense') || lower.includes('increase')) {
        recommendation = '**Make Harder** in Edit Plan';
      } else if (lower.includes('easier') || lower.includes('less intense') || lower.includes('tone')) {
        recommendation = '**Make Easier** in Edit Plan';
      } else if (lower.includes('regenerate') || lower.includes('new workout') || lower.includes('different workout')) {
        recommendation = '**Add Workout** in Edit Plan to create a new one';
      } else if (lower.includes('reset') || lower.includes('start over')) {
        recommendation = 'the **Edit Plan** section for workout modifications';
      } else if (lower.includes('rest day')) {
        recommendation = '**Skip Day** in Edit Plan to convert a workout day to rest';
      } else {
        recommendation = 'the **Edit Plan** section';
      }
      
      return {
        handled: true,
        response: `I'd love to help with that! 🎯\n\nFor workout modifications, head to ${recommendation}.\n\n📍 **How to get there:**\nGo to your Workout tab → Tap "Edit Plan" button\n\nYou'll find all the tools you need there to customize your program exactly how you want it! 💪${additionalTip}\n\nIs there anything else I can help you with - like exercise tips, form advice, or motivation?`
      };
    }
    
    // ===========================================================================
    // Profile/Settings modifications - redirect to Profile
    // ===========================================================================
    const profileModificationKeywords = [
      'change coach', 'change my coach', 'different coach', 'coach style', 'coaching style',
      'change name', 'update name', 'change email', 'update profile',
      'change settings', 'notification', 'notifications',
    ];
    
    const isProfileModification = profileModificationKeywords.some(keyword => lower.includes(keyword));
    
    if (isProfileModification) {
      let recommendation = 'your **Profile** tab';
      
      if (lower.includes('coach')) {
        recommendation = '**Profile > Coach Style**';
      } else if (lower.includes('notification')) {
        recommendation = '**Profile > Notifications**';
      }
      
      return {
        handled: true,
        response: `You got it! 👍\n\nYou can change that in ${recommendation}.\n\n📍 **How to get there:**\nTap the Profile tab at the bottom of the screen.\n\nAll your personal settings and preferences are there! 💪`
      };
    }
    
    // ===========================================================================
    // Handle user rejection/correction - just clear and redirect
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
      console.log('⚠️ [COACH] User rejection detected, clearing pendingAction');
      setPendingAction(null);
      return {
        handled: true,
        response: "No problem! I understand. 👍\n\nIf you want to make changes to your workout plan, head to **Edit Plan** on your Workouts tab. You have full control there!\n\nWhat else can I help you with - maybe some exercise tips or form advice?"
      };
    }
    
    // ===========================================================================
    // Stats/Progress inquiries - these are READ-ONLY and allowed
    // ===========================================================================
    
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
    
    // Help / capabilities
    if (lower.includes('what can you do') || lower.includes('help') || lower.includes('commands')) {
      return {
        handled: true,
        response: "🏋️ I'm your fitness coach! Here's what I can help with:\n\n💬 **Ask Me Anything:**\n• Exercise form & technique tips\n• Weight recommendations\n• Nutrition & recovery advice\n• Your workout schedule & stats\n\n🔧 **Want to Modify Your Plan?**\nHead to **Edit Plan** on your Workouts tab for:\n• Swap workout days\n• Skip a day\n• Make workouts harder/easier\n• Add new workouts\n\n📱 **Settings & Profile**\nGo to **Profile** tab to:\n• Change coach personality\n• Update your info\n• Adjust notifications\n\nWhat fitness topic can I help you with?"
      };
    }
    
    // Yes/confirm handling - clear pending action (no longer executing actions)
    if (pendingAction && (lower === 'yes' || lower === 'confirm' || lower === 'do it' || lower === 'go ahead' || lower === 'ok')) {
      setPendingAction(null);
      return {
        handled: true,
        response: "Got it! 👍\n\nRemember, to make changes to your workout plan, head to **Edit Plan** on your Workouts tab. I'm here to guide and advise, and you're in full control of your workouts there! 💪\n\nWhat else can I help you with?"
      };
    }
    
    // Cancel pending action
    if (pendingAction && (lower === 'no' || lower === 'cancel' || lower === 'nevermind')) {
      setPendingAction(null);
      return {
        handled: true,
        response: "No problem! 👍\n\nWhat else can I help you with?"
      };
    }
    
    // Not handled - let the AI respond
    return { handled: false };
  };
  
  // Execute pending action - Coach is READ-ONLY now
  const executeAction = async (action: PendingActionDetails) => {
    // Coach is now READ-ONLY, so just clear pending action and redirect
    setPendingAction(null);
    setMessages(prev => [...prev, { 
      role: 'assistant', 
      text: `I can't make that change directly, but you can do it yourself! 💪\n\n📍 **Go to Edit Plan** on your Workouts tab to modify your workout schedule.\n\nWhat else can I help you with?`
    }]);
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
    
    // Track coach message for badges - ALWAYS track when user sends a message
    try {
      await useAwardsStore.getState().trackCoachMessage();
    } catch (trackError) {
      console.log('⚠️ Could not track coach message:', trackError);
    }

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
                      {pendingAction.type === 'skip_day' && `Skip ${pendingAction.params?.targetDay}${pendingAction.params?.date ? ` (${new Date(pendingAction.params.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})` : ''}`}
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
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  chatContainer: {
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