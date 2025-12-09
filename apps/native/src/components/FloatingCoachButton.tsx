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
import Constants from 'expo-constants';
import { VoiceInputButton } from './VoiceInputButton';
import { useWorkoutStore } from '../stores/workout-store';
import { useCoachStore } from '../stores/coach-store';
import { setStorageItem } from '../lib/storage';

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

// Get OpenAI API key from expo-constants
const OPENAI_API_KEY = Constants.expoConfig?.extra?.openaiApiKey;

// Log error if key is missing
if (!OPENAI_API_KEY) {
  console.error('Missing OpenAI API key. Please set EXPO_PUBLIC_OPENAI_API_KEY in .env file');
}

// Quick action chips for common requests
const QUICK_ACTIONS = [
  { icon: 'swap-horizontal', label: 'Swap days', prompt: 'I need to swap my workout days' },
  { icon: 'time', label: 'Shorter', prompt: 'Make my workout shorter today' },
  { icon: 'flame', label: 'Harder', prompt: 'I want a more intense workout' },
  { icon: 'refresh', label: 'New workout', prompt: 'Generate a new workout for today' },
];

export function FloatingCoachButton() {
  const { swapWorkoutDays, forceRegenerateWeek, weekWorkouts, resetProgram } = useWorkoutStore();
  const { chatVisible, initialMessage, openChat, closeChat } = useCoachStore();
  
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hey! I'm your AI coach. 💪 I can help with workouts, swap your training days, adjust intensity, or answer fitness questions!" },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: string; params?: any } | null>(null);
  
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

  const callOpenAI = async (userMessage: string) => {
    // Check if API key exists
    if (!OPENAI_API_KEY) {
      console.error('Missing OpenAI API key');
      return "🔑 OpenAI API key not configured. Please add EXPO_PUBLIC_OPENAI_API_KEY to your .env file.";
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are an enthusiastic and knowledgeable AI fitness coach for the Thryvin app. You help users with workout advice, nutrition tips, motivation, and can modify their workout plans. Keep responses concise, encouraging, and actionable. Use emojis occasionally to keep it fun.'
            },
            ...messages.map(m => ({ role: m.role, content: m.text })),
            { role: 'user', content: userMessage }
          ],
          max_tokens: 300,
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        console.error('OpenAI API Error:', data.error);
        throw new Error(data.error.message);
      }

      return data.choices[0].message.content;
    } catch (error: any) {
      console.error('OpenAI Error:', error);
      return `I'm having trouble connecting right now. ${error?.message || 'Please try again in a moment!'} 💪`;
    }
  };

  // Detect workout intents and handle locally
  const detectWorkoutIntent = (message: string): { handled: boolean; response?: string; action?: { type: string; params?: any } } => {
    const lower = message.toLowerCase();
    
    // ADD WORKOUT intent (rest day → active day, or extra workout)
    if ((lower.includes('add') || lower.includes('feeling energetic') || lower.includes('extra') || lower.includes('want to do')) && 
        (lower.includes('workout') || lower.includes('session') || lower.includes('training'))) {
      
      const workoutTypes = ['yoga', 'cardio', 'strength', 'hiit', 'flexibility', 'core'];
      let detectedType = 'cardio'; // default
      let duration = 30; // default
      
      // Detect workout type from message
      for (const type of workoutTypes) {
        if (lower.includes(type)) {
          detectedType = type;
          break;
        }
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
    
    // Stats inquiry
    if (lower.includes('my stats') || lower.includes('my progress') || lower.includes('how many workouts') || lower.includes('streak')) {
      // Compute stats from weekWorkouts
      const completedCount = weekWorkouts.filter(w => w.completed && !w.isRestDay).length;
      const totalWorkouts = weekWorkouts.filter(w => !w.isRestDay).length;
      const thisWeekCompleted = weekWorkouts.slice(0, 7).filter(w => w.completed && !w.isRestDay).length;
      
      return {
        handled: true,
        response: `📊 Here's your progress:\n\n• This week: ${thisWeekCompleted}/5 workouts\n• Total completed: ${completedCount} workouts\n• Upcoming: ${totalWorkouts - completedCount} workouts scheduled\n\nKeep crushing it! 💪`
      };
    }
    
    // Today's workout inquiry
    if (lower.includes("today's workout") || lower.includes('what is today') || lower.includes('my workout today') || lower.includes('what workout')) {
      const today = new Date().toDateString();
      const todayWorkout = weekWorkouts.find(w => new Date(w.date).toDateString() === today);
      
      if (todayWorkout?.isRestDay) {
        return {
          handled: true,
          response: "😴 Today is a rest day!\n\nTake time to recover, stretch, and rehydrate. Your body builds muscle during rest!"
        };
      } else if (todayWorkout) {
        return {
          handled: true,
          response: `🏋️ Today's workout: **${todayWorkout.title}**\n\n• Duration: ${todayWorkout.duration} minutes\n• Exercises: ${todayWorkout.exercises?.length || 0}\n• Focus: ${todayWorkout.targetMuscles || todayWorkout.type}\n\nReady to crush it?`
        };
      }
      return { handled: false };
    }
    
    // Tomorrow's workout inquiry
    if (lower.includes("tomorrow") && (lower.includes('workout') || lower.includes('what'))) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toDateString();
      const tomorrowWorkout = weekWorkouts.find(w => new Date(w.date).toDateString() === tomorrowStr);
      
      if (tomorrowWorkout?.isRestDay) {
        return {
          handled: true,
          response: "😴 Tomorrow is a rest day!\n\nEnjoy the recovery time."
        };
      } else if (tomorrowWorkout) {
        return {
          handled: true,
          response: `📅 Tomorrow's workout: **${tomorrowWorkout.title}**\n\n• Duration: ${tomorrowWorkout.duration} minutes\n• Exercises: ${tomorrowWorkout.exercises?.length || 0}\n• Focus: ${tomorrowWorkout.targetMuscles || tomorrowWorkout.type}`
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
    
    // Regenerate workout intent
    if (lower.includes('new workout') || lower.includes('regenerate') || lower.includes('different workout') || lower.includes('fresh workout')) {
      return {
        handled: true,
        response: "Sure! I'll generate a fresh workout for you. 💪\n\nThis will create new exercises while keeping your preferences.\n\nConfirm to regenerate?",
        action: { type: 'regenerate' }
      };
    }
    
    // Intensity change
    if (lower.includes('harder') || lower.includes('intense') || lower.includes('challenging')) {
      return {
        handled: true,
        response: "Let's crank up the intensity! 🔥\n\nI'll regenerate your workout with:\n• More sets\n• Shorter rest periods\n• Compound movements\n\nReady to make it harder?",
        action: { type: 'regenerate' }
      };
    }
    
    // Shorter workout
    if (lower.includes('shorter') || lower.includes('quick') || lower.includes('less time') || lower.includes('30 min')) {
      return {
        handled: true,
        response: "No problem! ⏱️ I'll create a quick but effective workout.\n\nUsing supersets and compound moves to maximize your time.\n\nShall I regenerate with a shorter duration?",
        action: { type: 'regenerate' }
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
    
    return { handled: false };
  };
  
  // Execute pending action
  const executeAction = async (action: { type: string; params?: any }) => {
    try {
      switch (action.type) {
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
              
              await useWorkoutStore.getState().setWeekWorkouts(updatedWorkouts);
              await setStorageItem('week_workouts', JSON.stringify(updatedWorkouts));
              
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
            await swapWorkoutDays(action.params.from, action.params.to);
            setMessages(prev => [...prev, { 
              role: 'assistant', 
              text: "Done! ✅ I've swapped your workout days. Check your schedule to see the changes!" 
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

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = inputText.trim();
    setInputText('');
    
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    // First check for workout intents
    const intentResult = detectWorkoutIntent(userMessage);
    
    if (intentResult.handled) {
      if (intentResult.response === 'executing_action' && pendingAction) {
        await executeAction(pendingAction);
      } else if (intentResult.response) {
        setMessages(prev => [...prev, { role: 'assistant', text: intentResult.response! }]);
        if (intentResult.action) {
          setPendingAction(intentResult.action);
        }
      }
      setIsLoading(false);
      return;
    }
    
    // Otherwise, call OpenAI
    const aiResponse = await callOpenAI(userMessage);
    
    setMessages(prev => [...prev, { role: 'assistant', text: aiResponse }]);
    setIsLoading(false);
  };

  // Handle quick action
  const handleQuickAction = (action: typeof QUICK_ACTIONS[0]) => {
    setInputText(action.prompt);
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
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
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
                    <Text style={styles.coachName}>AI Coach</Text>
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
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
            >
              {messages.map((msg, i) => (
                <View
                  key={i}
                  style={[
                    styles.messageBubble,
                    msg.role === 'user' ? styles.userBubble : styles.assistantBubble,
                  ]}
                >
                  {msg.role === 'assistant' && (
                    <View style={styles.assistantIcon}>
                      <Ionicons name="sparkles" size={14} color={COLORS.accent} />
                    </View>
                  )}
                  <Text
                    style={[
                      styles.messageText,
                      msg.role === 'user' ? styles.userText : styles.assistantText,
                    ]}
                  >
                    {msg.text}
                  </Text>
                </View>
              ))}
              {isLoading && (
                <View style={styles.loadingBubble}>
                  <ActivityIndicator color={COLORS.accent} />
                  <Text style={styles.loadingText}>Thinking...</Text>
                </View>
              )}
              
              {/* Action confirmation button */}
              {pendingAction && !isLoading && (
                <TouchableOpacity 
                  style={styles.confirmActionButton}
                  onPress={() => executeAction(pendingAction)}
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
                      {pendingAction.type === 'add_workout' && `Add ${pendingAction.params?.workoutType} Session`}
                      {pendingAction.type === 'remove_workout' && 'Remove Workout'}
                      {pendingAction.type === 'regenerate' && 'Confirm & Regenerate'}
                      {pendingAction.type === 'reset' && 'Reset Program'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </ScrollView>
            
            {/* Quick Actions */}
            {messages.length <= 2 && !isLoading && (
              <View style={styles.quickActionsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {QUICK_ACTIONS.map((action, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.quickAction}
                      onPress={() => handleQuickAction(action)}
                    >
                      <Ionicons name={action.icon as any} size={16} color={COLORS.accent} />
                      <Text style={styles.quickActionText}>{action.label}</Text>
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
                onPress={handleSend}
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
    backgroundColor: COLORS.accent,
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
  quickActionsContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    gap: 6,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text,
  },
});