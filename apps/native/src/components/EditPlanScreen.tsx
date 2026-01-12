/**
 * EditPlanScreen - Beautiful conversational AI flow for editing workout plan
 * Features stunning purple-to-pink gradient UI with chat-like interactions
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useWorkoutStore, toLocalDateKey, getMondayOfWeek, findWorkoutByDate, findWorkoutIndexByDate } from '../stores/workout-store';
import { COLORS as THEME_COLORS } from '../constants/colors';

const COLORS = {
  accent: THEME_COLORS.gradientStart,
  accentSecondary: THEME_COLORS.gradientEnd,
  white: THEME_COLORS.white,
  text: THEME_COLORS.text,
  lightGray: THEME_COLORS.lightGray,
  mediumGray: THEME_COLORS.mediumGray,
  success: THEME_COLORS.success,
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://ai-trainer-upgrade.preview.emergentagent.com';
const DAYS_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface EditAction {
  id: string;
  icon: string;
  label: string;
  description: string;
  color: string;
  requiresTwoDays?: boolean;
}

const EDIT_ACTIONS: EditAction[] = [
  { id: 'swap', icon: 'swap-horizontal', label: 'Swap Days', description: 'Exchange two workout days', color: '#5B8DEF', requiresTwoDays: true },
  { id: 'skip', icon: 'close-circle', label: 'Skip Day', description: 'Convert to rest day', color: '#FF9500' },
  { id: 'add', icon: 'add-circle', label: 'Add Workout', description: 'Add a new workout', color: '#34C759' },
  { id: 'log', icon: 'fitness', label: 'Track Activity', description: 'Log a workout you did', color: '#A22BF6' },
  { id: 'harder', icon: 'flame', label: 'Make Harder', description: 'Increase intensity', color: '#FF3B30' },
  { id: 'easier', icon: 'leaf', label: 'Make Easier', description: 'Reduce intensity', color: '#00C7BE' },
];

interface EditPlanScreenProps {
  visible: boolean;
  onClose: () => void;
}

type FlowStep = 'select_action' | 'select_day' | 'conversation' | 'generating' | 'confirm';

interface ChatMessage {
  id: string;
  type: 'ai' | 'user';
  text: string;
  isTyping?: boolean;
}

const getTodayKey = (): string => toLocalDateKey(new Date());

export const EditPlanScreen = ({ visible, onClose }: EditPlanScreenProps) => {
  const { weekWorkouts, completedWorkouts, updateWorkoutInWeek, swapWorkoutDays, syncFromBackend } = useWorkoutStore();
  
  // Flow state
  const [currentStep, setCurrentStep] = useState<FlowStep>('select_action');
  const [selectedAction, setSelectedAction] = useState<EditAction | null>(null);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Conversation state for Add Workout
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [conversationPhase, setConversationPhase] = useState<'type' | 'duration' | 'details' | 'confirm'>('type');
  
  // Collected data from conversation
  const [workoutType, setWorkoutType] = useState('');
  const [workoutDuration, setWorkoutDuration] = useState('');
  const [workoutDetails, setWorkoutDetails] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  
  // Generated workout
  const [generatedWorkout, setGeneratedWorkout] = useState<any>(null);
  
  // Refs
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Organize workouts into weeks using DATE MATCHING
  const weeksData = useMemo(() => {
    const weeks: { weekNum: number; days: any[] }[] = [];
    const today = new Date();
    const monday = getMondayOfWeek(today);
    const todayKey = getTodayKey();
    
    for (let week = 1; week <= 3; week++) {
      const weekDays = [];
      
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const dayIndex = (week - 1) * 7 + dayOffset;
        const dayDate = new Date(monday);
        dayDate.setDate(monday.getDate() + dayIndex);
        const dateKey = toLocalDateKey(dayDate);
        
        const workout = findWorkoutByDate(weekWorkouts, dayDate);
        const isCompleted = workout?.completed || completedWorkouts.some(cw => cw?.id === workout?.id);
        
        weekDays.push({
          dayName: DAYS[dayOffset],
          dayNameFull: DAYS_FULL[dayOffset],
          dayIndex,
          date: dayDate,
          dateKey,
          workout: workout || null,
          isCompleted,
          isToday: dateKey === todayKey,
          isRest: workout?.isRestDay || workout?.title?.toLowerCase().includes('rest'),
        });
      }
      
      weeks.push({ weekNum: week, days: weekDays });
    }
    
    return weeks;
  }, [weekWorkouts, completedWorkouts]);

  const getSelectedDayInfo = () => {
    if (selectedDays.length === 0) return null;
    const allDays = weeksData.flatMap(w => w.days);
    return allDays.find(d => d.dateKey === selectedDays[0]);
  };

  const resetFlow = () => {
    setCurrentStep('select_action');
    setSelectedAction(null);
    setSelectedDays([]);
    setChatMessages([]);
    setUserInput('');
    setConversationPhase('type');
    setWorkoutType('');
    setWorkoutDuration('');
    setWorkoutDetails('');
    setAdjustmentReason('');
    setGeneratedWorkout(null);
  };

  const handleClose = () => {
    resetFlow();
    onClose();
  };

  const handleSelectAction = (action: EditAction) => {
    setSelectedAction(action);
    setSelectedDays([]);
    setCurrentStep('select_day');
  };

  // Add AI message with typing effect
  const addAIMessage = (text: string) => {
    const newMsg: ChatMessage = {
      id: `ai-${Date.now()}`,
      type: 'ai',
      text,
    };
    setChatMessages(prev => [...prev, newMsg]);
    
    // Auto scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // Add user message
  const addUserMessage = (text: string) => {
    const newMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      text,
    };
    setChatMessages(prev => [...prev, newMsg]);
    
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // Start Add Workout conversation
  const startAddWorkoutConversation = (dayInfo: any) => {
    setChatMessages([]);
    setConversationPhase('type');
    
    const greeting = `Hey! I'm excited to help you add a workout to ${dayInfo.dayNameFull}! 💪\n\nWhat type of workout would you like to add?\n\nFor example: "chest workout", "leg day", "30 min cardio", "yoga session", etc.`;
    
    setTimeout(() => addAIMessage(greeting), 300);
  };

  // Start Track Activity conversation (log unexpected workout)
  const startTrackActivityConversation = (dayInfo: any) => {
    setChatMessages([]);
    setConversationPhase('type');
    
    const greeting = `Nice! Let's log that workout you did! 🏆\n\nWhat type of workout was it?\n\nFor example: "chest and triceps", "5k run", "yoga class", "swimming", "basketball game", etc.`;
    
    setTimeout(() => addAIMessage(greeting), 300);
  };

  // Start Make Harder/Easier conversation
  const startAdjustmentConversation = (dayInfo: any, isHarder: boolean) => {
    setChatMessages([]);
    setConversationPhase('type');
    
    const workoutName = dayInfo.workout?.title || 'this workout';
    const greeting = isHarder 
      ? `I can make ${workoutName} more challenging for you! 🔥\n\nTell me what you're looking for - more sets? Heavier weights? Less rest time? Extra exercises?\n\nJust tell me what you need!`
      : `No worries, let's dial back ${workoutName} a bit! 🌿\n\nWhat's making it too tough? Too many reps? Weights too heavy? Need more rest time?\n\nLet me know how I can help!`;
    
    setTimeout(() => addAIMessage(greeting), 300);
  };

  const handleDaySelect = (dateKey: string) => {
    if (!selectedAction) return;
    
    const day = weeksData.flatMap(w => w.days).find(d => d.dateKey === dateKey);
    
    // For logging, allow any day (including completed ones)
    if (day?.isCompleted && selectedAction.id !== 'add' && selectedAction.id !== 'log') {
      Alert.alert('Completed', 'Cannot edit completed workouts.');
      return;
    }
    
    // Swap needs exactly 2 days
    if (selectedAction.requiresTwoDays) {
      if (selectedDays.includes(dateKey)) {
        setSelectedDays(selectedDays.filter(d => d !== dateKey));
      } else if (selectedDays.length < 2) {
        const newSelection = [...selectedDays, dateKey];
        setSelectedDays(newSelection);
        if (newSelection.length === 2) {
          handleSwapConfirm(newSelection);
        }
      }
      return;
    }
    
    // Add only works on rest days
    if (selectedAction.id === 'add' && !day?.isRest) {
      Alert.alert('Not a Rest Day', 'You can only add a workout to a rest day.');
      return;
    }
    
    // Skip doesn't work on rest days
    if (selectedAction.id === 'skip' && day?.isRest) {
      Alert.alert('Already Rest', 'This is already a rest day.');
      return;
    }
    
    setSelectedDays([dateKey]);
    
    // Move to next step based on action
    if (selectedAction.id === 'add') {
      setCurrentStep('conversation');
      startAddWorkoutConversation(day);
    } else if (selectedAction.id === 'log') {
      setCurrentStep('conversation');
      startTrackActivityConversation(day);
    } else if (selectedAction.id === 'harder' || selectedAction.id === 'easier') {
      setCurrentStep('conversation');
      startAdjustmentConversation(day, selectedAction.id === 'harder');
    } else if (selectedAction.id === 'skip') {
      handleSkipConfirm(dateKey);
    }
  };

  const handleSwapConfirm = async (days: string[]) => {
    setIsProcessing(true);
    try {
      const fromIdx = findWorkoutIndexByDate(weekWorkouts, days[0]);
      const toIdx = findWorkoutIndexByDate(weekWorkouts, days[1]);
      if (fromIdx >= 0 && toIdx >= 0) {
        await swapWorkoutDays(fromIdx, toIdx);
        Alert.alert('Done! ✅', 'Workout days have been swapped.');
      }
      resetFlow();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to swap days.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkipConfirm = async (dateKey: string) => {
    setIsProcessing(true);
    try {
      const idx = findWorkoutIndexByDate(weekWorkouts, dateKey);
      const workout = weekWorkouts[idx];
      if (workout && idx >= 0) {
        await updateWorkoutInWeek(idx, {
          ...workout,
          isRestDay: true,
          title: 'Rest Day',
          type: 'Rest',
          exercises: [],
          duration: 0,
        });
        Alert.alert('Done! ✅', 'Day converted to rest day.');
      }
      resetFlow();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to skip day.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle user sending a message in conversation
  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    
    const input = userInput.trim();
    addUserMessage(input);
    setUserInput('');
    Keyboard.dismiss();
    
    if (selectedAction?.id === 'add') {
      await handleAddWorkoutConversation(input);
    } else if (selectedAction?.id === 'harder' || selectedAction?.id === 'easier') {
      await handleAdjustmentConversation(input);
    }
  };

  // Handle Add Workout conversation flow
  const handleAddWorkoutConversation = async (input: string) => {
    if (conversationPhase === 'type') {
      setWorkoutType(input);
      setConversationPhase('duration');
      
      setTimeout(() => {
        addAIMessage(`Perfect! A ${input} sounds great! 🎯\n\nHow long do you want this workout to be?\n\nJust tell me something like "30 minutes", "45 min", "1 hour", etc.`);
      }, 500);
      
    } else if (conversationPhase === 'duration') {
      setWorkoutDuration(input);
      setConversationPhase('details');
      
      setTimeout(() => {
        addAIMessage(`Got it - ${input}! ⏱️\n\nIs there anything specific you want in this workout?\n\nFor example: "heavy bench press", "lots of core work", "focus on glutes", or just say "no" if you want me to design it for you!`);
      }, 500);
      
    } else if (conversationPhase === 'details') {
      const hasDetails = !['no', 'nope', 'nothing', 'n', 'none'].includes(input.toLowerCase());
      if (hasDetails) {
        setWorkoutDetails(input);
      }
      setConversationPhase('confirm');
      
      setTimeout(() => {
        addAIMessage(`Awesome! Let me create this workout for you... 🏋️`);
      }, 300);
      
      // Generate the workout
      await generateWorkout(workoutType, workoutDuration, hasDetails ? input : '');
    }
  };

  // Handle Make Harder/Easier conversation flow
  const handleAdjustmentConversation = async (input: string) => {
    setAdjustmentReason(input);
    
    setTimeout(() => {
      addAIMessage(`Got it! Let me ${selectedAction?.id === 'harder' ? 'amp up' : 'adjust'} your workout... 💪`);
    }, 300);
    
    // Apply the adjustment
    await applyWorkoutAdjustment(input);
  };

  // Generate workout via API
  const generateWorkout = async (type: string, duration: string, details: string) => {
    setCurrentStep('generating');
    setIsProcessing(true);
    
    try {
      const token = await SecureStore.getItemAsync('thryvin_access_token');
      const dayInfo = getSelectedDayInfo();
      
      // Parse duration to minutes
      const durationMatch = duration.match(/(\d+)/);
      const durationMinutes = durationMatch ? parseInt(durationMatch[1]) : 45;
      
      // Call the AI generate endpoint
      const response = await fetch(`${API_BASE_URL}/api/workouts/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          userProfile: {
            trainingType: type,
            sessionDuration: durationMinutes,
            customRequest: details,
          },
          dayOfWeek: dayInfo?.date.getDay() || 0,
          customWorkoutRequest: {
            type,
            duration: durationMinutes,
            details,
          },
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate workout');
      }
      
      const workout = await response.json();
      setGeneratedWorkout({
        ...workout,
        date: dayInfo?.dateKey,
        duration: durationMinutes,
      });
      
      setCurrentStep('confirm');
      
      setTimeout(() => {
        addAIMessage(`Here's what I've created for you:\n\n**${workout.title}**\n⏱️ ${durationMinutes} minutes\n🎯 ${workout.targetMuscles || type}\n💪 ${workout.exercises?.length || 0} exercises\n\nReady to add this to your plan?`);
      }, 500);
      
    } catch (err: any) {
      console.error('Generate workout error:', err);
      Alert.alert('Error', 'Failed to generate workout. Please try again.');
      setCurrentStep('conversation');
    } finally {
      setIsProcessing(false);
    }
  };

  // Apply workout adjustment (harder/easier)
  const applyWorkoutAdjustment = async (reason: string) => {
    setCurrentStep('generating');
    setIsProcessing(true);
    
    try {
      const token = await SecureStore.getItemAsync('thryvin_access_token');
      const dayInfo = getSelectedDayInfo();
      const isHarder = selectedAction?.id === 'harder';
      
      // Get the day name for the target day
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const targetDay = dayNames[dayInfo?.date.getDay() || 0];
      
      const response = await fetch(`${API_BASE_URL}/api/workouts/update-in-place`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          modification: isHarder ? 'harder' : 'easier',
          userFeedback: reason,
          targetDay: targetDay,
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update workout');
      }
      
      // Apply the changes to the workout
      if (dayInfo) {
        const idx = findWorkoutIndexByDate(weekWorkouts, dayInfo.dateKey);
        if (idx >= 0 && dayInfo.workout) {
          const updatedWorkout = {
            ...dayInfo.workout,
            ...result.updatedWorkout,
            title: result.updatedWorkout?.title || dayInfo.workout.title,
          };
          await updateWorkoutInWeek(idx, updatedWorkout);
        }
      }
      
      await syncFromBackend();
      
      Alert.alert(
        'Done! ✅',
        result.message || (isHarder 
          ? 'Your workout has been made more challenging!' 
          : 'Your workout has been adjusted to be easier.')
      );
      
      resetFlow();
      
    } catch (err: any) {
      console.error('Adjustment error:', err);
      Alert.alert('Error', err.message || 'Failed to update workout. Please try again.');
      setCurrentStep('conversation');
    } finally {
      setIsProcessing(false);
    }
  };

  // Confirm and save the generated workout
  const handleConfirmWorkout = async () => {
    if (!generatedWorkout) return;
    
    setIsProcessing(true);
    
    try {
      const dayInfo = getSelectedDayInfo();
      if (!dayInfo) throw new Error('No day selected');
      
      const idx = findWorkoutIndexByDate(weekWorkouts, dayInfo.dateKey);
      
      const newWorkout = {
        id: `added_${Date.now()}`,
        title: generatedWorkout.title,
        type: generatedWorkout.type || workoutType,
        difficulty: generatedWorkout.difficulty || 'moderate',
        duration: generatedWorkout.duration,
        date: dayInfo.date.toISOString(),
        exercises: generatedWorkout.exercises || [],
        overview: generatedWorkout.overview,
        targetMuscles: generatedWorkout.targetMuscles,
        caloriesBurn: generatedWorkout.caloriesBurn,
        isRestDay: false,
        completed: false,
      };
      
      if (idx >= 0) {
        await updateWorkoutInWeek(idx, newWorkout);
      }
      
      await syncFromBackend();
      
      Alert.alert('Added! 🎉', `${newWorkout.title} has been added to ${dayInfo.dayNameFull}!`);
      resetFlow();
      
    } catch (err: any) {
      console.error('Save workout error:', err);
      Alert.alert('Error', err.message || 'Failed to save workout.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ============================================
  // RENDER FUNCTIONS
  // ============================================

  const renderActionSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>What would you like to do?</Text>
      <Text style={styles.stepSubtitle}>Choose an action to modify your plan</Text>
      
      <View style={styles.actionsGrid}>
        {EDIT_ACTIONS.map(action => (
          <TouchableOpacity
            key={action.id}
            style={styles.actionCard}
            onPress={() => handleSelectAction(action)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[`${action.color}20`, `${action.color}10`]}
              style={styles.actionIconBg}
            >
              <Ionicons name={action.icon as any} size={26} color={action.color} />
            </LinearGradient>
            <Text style={styles.actionLabel}>{action.label}</Text>
            <Text style={styles.actionDesc}>{action.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Scroll indicator */}
      <View style={styles.scrollIndicator}>
        <Ionicons name="chevron-down" size={20} color={COLORS.mediumGray} />
        <Text style={styles.scrollText}>Scroll for more options</Text>
      </View>
    </View>
  );

  const renderDaySelection = () => {
    const currentWeekData = weeksData.find(w => w.weekNum === selectedWeek);
    
    return (
      <View style={styles.stepContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => setCurrentStep('select_action')}>
          <Ionicons name="chevron-back" size={20} color={COLORS.accent} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        
        <Text style={styles.stepTitle}>
          {selectedAction?.requiresTwoDays 
            ? `Select 2 days to ${selectedAction.label.toLowerCase()}`
            : `Select a day to ${selectedAction?.label.toLowerCase()}`}
        </Text>
        <Text style={styles.stepSubtitle}>
          {selectedAction?.id === 'add' ? 'Choose a rest day' : 'Tap to select'}
        </Text>
        
        {/* Week Tabs */}
        <View style={styles.weekTabs}>
          {[1, 2, 3].map(weekNum => (
            <TouchableOpacity
              key={weekNum}
              style={[styles.weekTab, selectedWeek === weekNum && styles.weekTabSelected]}
              onPress={() => setSelectedWeek(weekNum)}
            >
              <Text style={[styles.weekTabText, selectedWeek === weekNum && styles.weekTabTextSelected]}>
                Week {weekNum}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Days List */}
        <ScrollView style={styles.daysScroll} showsVerticalScrollIndicator={false}>
          {currentWeekData?.days.map(day => {
            const isSelected = selectedDays.includes(day.dateKey);
            const isDisabled = day.isCompleted && selectedAction?.id !== 'add';
            const showAsRest = day.isRest;
            
            // For "add", only show rest days as selectable
            if (selectedAction?.id === 'add' && !showAsRest) {
              return (
                <View key={day.dateKey} style={[styles.dayRow, styles.dayRowDisabled]}>
                  <View style={styles.dayInfo}>
                    <Text style={styles.dayName}>{day.dayNameFull}</Text>
                    <Text style={styles.dayDate}>{day.date.toLocaleDateString()}</Text>
                  </View>
                  <View style={styles.dayWorkout}>
                    <Text style={styles.workoutLabel} numberOfLines={1}>
                      {day.workout?.title || 'Workout'}
                    </Text>
                  </View>
                </View>
              );
            }
            
            return (
              <TouchableOpacity
                key={day.dateKey}
                style={[
                  styles.dayRow,
                  day.isToday && styles.dayRowToday,
                  isSelected && styles.dayRowSelected,
                  isDisabled && styles.dayRowDisabled,
                ]}
                onPress={() => !isDisabled && handleDaySelect(day.dateKey)}
                disabled={isDisabled}
              >
                <View style={styles.dayInfo}>
                  <Text style={[styles.dayName, isSelected && styles.dayNameSelected]}>
                    {day.dayNameFull}
                    {day.isToday && ' (Today)'}
                  </Text>
                  <Text style={styles.dayDate}>{day.date.toLocaleDateString()}</Text>
                </View>
                <View style={styles.dayWorkout}>
                  {showAsRest ? (
                    <Text style={styles.restLabel}>Rest Day</Text>
                  ) : (
                    <Text style={styles.workoutLabel} numberOfLines={1}>
                      {day.workout?.title || 'Workout'}
                    </Text>
                  )}
                </View>
                {isSelected && (
                  <View style={styles.checkCircle}>
                    <Ionicons name="checkmark" size={16} color={COLORS.white} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderConversation = () => {
    const dayInfo = getSelectedDayInfo();
    const isAddWorkout = selectedAction?.id === 'add';
    const isHarder = selectedAction?.id === 'harder';
    
    return (
      <KeyboardAvoidingView 
        style={styles.conversationContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        {/* Header */}
        <View style={styles.conversationHeader}>
          <TouchableOpacity style={styles.backButton} onPress={() => setCurrentStep('select_day')}>
            <Ionicons name="chevron-back" size={20} color={COLORS.accent} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          
          <View style={styles.conversationTitleRow}>
            <LinearGradient
              colors={[COLORS.accent, COLORS.accentSecondary]}
              style={styles.conversationIcon}
            >
              <Ionicons 
                name={isAddWorkout ? 'add' : (isHarder ? 'flame' : 'leaf')} 
                size={18} 
                color={COLORS.white} 
              />
            </LinearGradient>
            <View>
              <Text style={styles.conversationTitle}>
                {isAddWorkout ? 'Add Workout' : (isHarder ? 'Make Harder' : 'Make Easier')}
              </Text>
              <Text style={styles.conversationSubtitle}>{dayInfo?.dayNameFull}</Text>
            </View>
          </View>
        </View>
        
        {/* Chat Messages */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.chatContainer}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
        >
          {chatMessages.map(msg => (
            <View 
              key={msg.id} 
              style={[
                styles.messageBubble,
                msg.type === 'user' ? styles.userBubble : styles.aiBubble,
              ]}
            >
              {msg.type === 'ai' && (
                <LinearGradient
                  colors={[COLORS.accent, COLORS.accentSecondary]}
                  style={styles.aiAvatar}
                >
                  <Ionicons name="fitness" size={14} color={COLORS.white} />
                </LinearGradient>
              )}
              <View style={[
                styles.messageContent,
                msg.type === 'user' ? styles.userMessageContent : styles.aiMessageContent,
              ]}>
                {msg.type === 'user' ? (
                  <LinearGradient
                    colors={[COLORS.accent, COLORS.accentSecondary]}
                    style={styles.userMessageGradient}
                  >
                    <Text style={styles.userMessageText}>{msg.text}</Text>
                  </LinearGradient>
                ) : (
                  <Text style={styles.aiMessageText}>{msg.text}</Text>
                )}
              </View>
            </View>
          ))}
          
          {isProcessing && currentStep === 'generating' && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={COLORS.accent} />
              <Text style={styles.loadingText}>Creating your workout...</Text>
            </View>
          )}
        </ScrollView>
        
        {/* Input Area */}
        {currentStep === 'conversation' && (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.chatInput}
              placeholder="Type your response..."
              placeholderTextColor={COLORS.mediumGray}
              value={userInput}
              onChangeText={setUserInput}
              multiline
              maxLength={500}
              onSubmitEditing={handleSendMessage}
              returnKeyType="send"
            />
            <TouchableOpacity 
              style={[styles.sendButton, !userInput.trim() && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={!userInput.trim() || isProcessing}
            >
              <LinearGradient
                colors={userInput.trim() ? [COLORS.accent, COLORS.accentSecondary] : [COLORS.lightGray, COLORS.lightGray]}
                style={styles.sendButtonGradient}
              >
                <Ionicons 
                  name="send" 
                  size={18} 
                  color={userInput.trim() ? COLORS.white : COLORS.mediumGray} 
                />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Confirm Buttons for Add Workout */}
        {currentStep === 'confirm' && selectedAction?.id === 'add' && generatedWorkout && (
          <View style={styles.confirmButtons}>
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => {
                setCurrentStep('conversation');
                setConversationPhase('type');
                setChatMessages([]);
                startAddWorkoutConversation(dayInfo);
              }}
            >
              <Text style={styles.secondaryButtonText}>Start Over</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.confirmButton}
              onPress={handleConfirmWorkout}
              disabled={isProcessing}
            >
              <LinearGradient
                colors={[COLORS.accent, COLORS.accentSecondary]}
                style={styles.confirmButtonGradient}
              >
                {isProcessing ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
                    <Text style={styles.confirmButtonText}>Add to Plan</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    );
  };

  const renderGenerating = () => (
    <View style={styles.generatingContainer}>
      <LinearGradient
        colors={[COLORS.accent, COLORS.accentSecondary]}
        style={styles.generatingIcon}
      >
        <ActivityIndicator size="large" color={COLORS.white} />
      </LinearGradient>
      <Text style={styles.generatingTitle}>Creating Your Workout</Text>
      <Text style={styles.generatingSubtitle}>
        Our AI is designing the perfect workout for you...
      </Text>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.mediumGray} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Plan</Text>
            <View style={{ width: 32 }} />
          </View>

          {/* Content based on step */}
          <View style={styles.content}>
            {currentStep === 'select_action' && renderActionSelection()}
            {currentStep === 'select_day' && renderDaySelection()}
            {(currentStep === 'conversation' || currentStep === 'confirm') && renderConversation()}
            {currentStep === 'generating' && renderGenerating()}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    minHeight: '75%',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  closeButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  content: { flex: 1 },
  
  // Step Container
  stepContainer: { flex: 1, padding: 20 },
  stepTitle: { fontSize: 24, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  stepSubtitle: { fontSize: 16, color: COLORS.mediumGray, marginBottom: 24 },
  
  // Back Button
  backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 4 },
  backText: { fontSize: 16, color: COLORS.accent, fontWeight: '600' },
  
  // Actions Grid
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionCard: {
    width: '47%',
    backgroundColor: COLORS.lightGray,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  actionIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionLabel: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  actionDesc: { fontSize: 12, color: COLORS.mediumGray, textAlign: 'center' },
  
  // Scroll Indicator
  scrollIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 6,
  },
  scrollText: { fontSize: 13, color: COLORS.mediumGray },
  
  // Week Tabs
  weekTabs: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  weekTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
  },
  weekTabSelected: { backgroundColor: COLORS.accent },
  weekTabText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  weekTabTextSelected: { color: COLORS.white },
  
  // Days
  daysScroll: { flex: 1 },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    marginBottom: 10,
  },
  dayRowToday: { borderWidth: 2, borderColor: COLORS.accent },
  dayRowSelected: { backgroundColor: `${COLORS.accent}20`, borderWidth: 2, borderColor: COLORS.accent },
  dayRowDisabled: { opacity: 0.4 },
  dayInfo: { flex: 1 },
  dayName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  dayNameSelected: { color: COLORS.accent },
  dayDate: { fontSize: 12, color: COLORS.mediumGray, marginTop: 2 },
  dayWorkout: { flex: 1, alignItems: 'flex-end' },
  restLabel: { fontSize: 14, color: COLORS.mediumGray, fontStyle: 'italic' },
  workoutLabel: { fontSize: 14, color: COLORS.text },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  
  // Conversation Container
  conversationContainer: { flex: 1 },
  conversationHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  conversationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  conversationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conversationTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  conversationSubtitle: { fontSize: 14, color: COLORS.mediumGray },
  
  // Chat Container
  chatContainer: { flex: 1 },
  chatContent: { padding: 16, paddingBottom: 24 },
  
  // Message Bubbles
  messageBubble: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  userBubble: {
    justifyContent: 'flex-end',
  },
  aiBubble: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  messageContent: {
    maxWidth: '80%',
  },
  userMessageContent: {
    marginLeft: 'auto',
  },
  aiMessageContent: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    padding: 14,
  },
  userMessageGradient: {
    borderRadius: 18,
    borderBottomRightRadius: 4,
    padding: 14,
  },
  aiMessageText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  userMessageText: {
    fontSize: 15,
    color: COLORS.white,
    lineHeight: 22,
  },
  
  // Loading
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.mediumGray,
  },
  
  // Input Container
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
    gap: 10,
  },
  chatInput: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Confirm Buttons
  confirmButtons: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  confirmButton: {
    flex: 2,
    borderRadius: 14,
    overflow: 'hidden',
  },
  confirmButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  confirmButtonText: { fontSize: 15, fontWeight: '600', color: COLORS.white },
  
  // Generating
  generatingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  generatingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  generatingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  generatingSubtitle: {
    fontSize: 15,
    color: COLORS.mediumGray,
    textAlign: 'center',
  },
});
