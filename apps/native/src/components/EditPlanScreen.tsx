/**
 * EditPlanScreen - Conversational AI workout editing with voice input
 * Features: Voice transcription, matching ViewAllWeeksModal styling, real AI workout generation
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
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { Audio } from 'expo-av';
import { useWorkoutStore, toLocalDateKey, getMondayOfWeek, findWorkoutByDate, findWorkoutIndexByDate } from '../stores/workout-store';
import { useAuthStore } from '../stores/auth-store';
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
}

const getTodayKey = (): string => toLocalDateKey(new Date());

export const EditPlanScreen = ({ visible, onClose }: EditPlanScreenProps) => {
  const { weekWorkouts, completedWorkouts, updateWorkoutInWeek, swapWorkoutDays, syncFromBackend } = useWorkoutStore();
  const { user } = useAuthStore();
  
  // Flow state
  const [currentStep, setCurrentStep] = useState<FlowStep>('select_action');
  const [selectedAction, setSelectedAction] = useState<EditAction | null>(null);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  
  // Conversation state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [conversationPhase, setConversationPhase] = useState<'type' | 'duration' | 'details' | 'confirm'>('type');
  
  // Collected data from conversation
  const [workoutType, setWorkoutType] = useState('');
  const [workoutDuration, setWorkoutDuration] = useState('');
  const [workoutDetails, setWorkoutDetails] = useState('');
  
  // Generated workout
  const [generatedWorkout, setGeneratedWorkout] = useState<any>(null);
  
  // Refs
  const scrollViewRef = useRef<ScrollView>(null);

  // Organize workouts into weeks - MATCHING ViewAllWeeksModal style
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
        const workoutId = workout?.id || `workout-${dateKey}`;
        const isCompleted = workout && (
          workout.completed || 
          completedWorkouts.some(cw => typeof cw === 'string' ? cw === workoutId : cw?.id === workoutId)
        );
        
        weekDays.push({
          dayName: DAYS[dayOffset],
          dayNum: dayIndex + 1,
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

  // Voice recording functions
  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant microphone access to use voice input.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    
    setIsRecording(false);
    
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      
      if (uri) {
        await transcribeAudio(uri);
      }
    } catch (err) {
      console.error('Failed to stop recording:', err);
    }
  };

  const transcribeAudio = async (audioUri: string) => {
    setIsProcessing(true);
    
    try {
      const token = await SecureStore.getItemAsync('thryvin_access_token');
      
      // Create form data with audio file
      const formData = new FormData();
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as any);
      
      const response = await fetch(`${API_BASE_URL}/api/ai/transcribe`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.text) {
          setUserInput(data.text);
        }
      } else {
        // Fallback: just use empty or show error
        console.log('Transcription failed, response:', response.status);
        Alert.alert('Transcription Failed', 'Could not transcribe audio. Please type your response.');
      }
    } catch (err) {
      console.error('Transcription error:', err);
      Alert.alert('Error', 'Failed to transcribe. Please type your response instead.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Add AI message
  const addAIMessage = (text: string) => {
    const newMsg: ChatMessage = { id: `ai-${Date.now()}`, type: 'ai', text };
    setChatMessages(prev => [...prev, newMsg]);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  };

  // Add user message
  const addUserMessage = (text: string) => {
    const newMsg: ChatMessage = { id: `user-${Date.now()}`, type: 'user', text };
    setChatMessages(prev => [...prev, newMsg]);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  };

  // Start conversations
  const startAddWorkoutConversation = (dayInfo: any) => {
    setChatMessages([]);
    setConversationPhase('type');
    setTimeout(() => addAIMessage(`Hey! I'm excited to help you add a workout to ${dayInfo.dayName} (Day ${dayInfo.dayNum})! 💪\n\nWhat type of workout would you like?\n\nFor example: "chest workout", "leg day", "back and biceps", "full body", etc.`), 300);
  };

  const startTrackActivityConversation = (dayInfo: any) => {
    setChatMessages([]);
    setConversationPhase('type');
    setTimeout(() => addAIMessage(`Nice! Let's log that workout you did! 🏆\n\nWhat type of workout was it?\n\nFor example: "chest and triceps", "5k run", "yoga class", "swimming", etc.`), 300);
  };

  const startAdjustmentConversation = (dayInfo: any, isHarder: boolean) => {
    setChatMessages([]);
    setConversationPhase('type');
    const workoutName = dayInfo.workout?.title || 'this workout';
    const greeting = isHarder 
      ? `I can make "${workoutName}" more challenging! 🔥\n\nTell me what you're looking for - more sets? Heavier weights? Less rest? Extra exercises?\n\nJust tell me what you need!`
      : `No worries, let's dial back "${workoutName}"! 🌿\n\nWhat's making it too tough? Too many reps? Weights too heavy? Need more rest?\n\nLet me know how I can help!`;
    setTimeout(() => addAIMessage(greeting), 300);
  };

  const handleDaySelect = (dateKey: string) => {
    if (!selectedAction) return;
    
    const day = weeksData.flatMap(w => w.days).find(d => d.dateKey === dateKey);
    
    if (day?.isCompleted && selectedAction.id !== 'add' && selectedAction.id !== 'log') {
      Alert.alert('Completed', 'Cannot edit completed workouts.');
      return;
    }
    
    if (selectedAction.requiresTwoDays) {
      if (selectedDays.includes(dateKey)) {
        setSelectedDays(selectedDays.filter(d => d !== dateKey));
      } else if (selectedDays.length < 2) {
        const newSelection = [...selectedDays, dateKey];
        setSelectedDays(newSelection);
        if (newSelection.length === 2) handleSwapConfirm(newSelection);
      }
      return;
    }
    
    if (selectedAction.id === 'add' && !day?.isRest) {
      Alert.alert('Not a Rest Day', 'You can only add a workout to a rest day. Try "Make Harder" to modify an existing workout.');
      return;
    }
    
    if (selectedAction.id === 'skip' && day?.isRest) {
      Alert.alert('Already Rest', 'This is already a rest day.');
      return;
    }
    
    if ((selectedAction.id === 'harder' || selectedAction.id === 'easier') && day?.isRest) {
      Alert.alert('Rest Day', 'Cannot modify a rest day. Try "Add Workout" instead.');
      return;
    }
    
    setSelectedDays([dateKey]);
    
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
        await syncFromBackend();
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
        await syncFromBackend();
        Alert.alert('Done! ✅', 'Day converted to rest day.');
      }
      resetFlow();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to skip day.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    
    const input = userInput.trim();
    addUserMessage(input);
    setUserInput('');
    Keyboard.dismiss();
    
    if (selectedAction?.id === 'add') {
      await handleAddWorkoutConversation(input);
    } else if (selectedAction?.id === 'log') {
      await handleLogActivityConversation(input);
    } else if (selectedAction?.id === 'harder' || selectedAction?.id === 'easier') {
      await handleAdjustmentConversation(input);
    }
  };

  // Add Workout conversation - FIXED to actually generate workouts
  const handleAddWorkoutConversation = async (input: string) => {
    if (conversationPhase === 'type') {
      setWorkoutType(input);
      setConversationPhase('duration');
      setTimeout(() => addAIMessage(`Perfect! A ${input} sounds great! 🎯\n\nHow long do you want this workout to be?\n\nFor example: "30 minutes", "45 min", "1 hour", etc.`), 500);
      
    } else if (conversationPhase === 'duration') {
      setWorkoutDuration(input);
      setConversationPhase('details');
      setTimeout(() => addAIMessage(`Got it - ${input}! ⏱️\n\nAnything specific you want included?\n\nFor example: "heavy bench press", "lots of core work", "focus on glutes", or just say "no" for a standard workout!`), 500);
      
    } else if (conversationPhase === 'details') {
      const hasDetails = !['no', 'nope', 'nothing', 'n', 'none', 'nah'].includes(input.toLowerCase());
      const details = hasDetails ? input : '';
      setWorkoutDetails(details);
      
      setTimeout(() => addAIMessage(`Awesome! Let me create this workout for you... 🏋️`), 300);
      
      // NOW generate the actual workout with AI
      await generateWorkoutWithAI(workoutType, workoutDuration, details);
    }
  };

  // Track Activity conversation
  const handleLogActivityConversation = async (input: string) => {
    if (conversationPhase === 'type') {
      setWorkoutType(input);
      setConversationPhase('duration');
      setTimeout(() => addAIMessage(`Awesome, ${input}! 💪\n\nHow long was your workout?\n\nFor example: "30 minutes", "45 min", "about an hour", etc.`), 500);
      
    } else if (conversationPhase === 'duration') {
      setWorkoutDuration(input);
      setConversationPhase('details');
      setTimeout(() => addAIMessage(`Nice, ${input} of work! 🔥\n\nAnything specific to note?\n\nFor example: "felt great", "did 3x10 bench at 135lbs", or just "no" to skip.`), 500);
      
    } else if (conversationPhase === 'details') {
      const hasDetails = !['no', 'nope', 'nothing', 'n', 'none', 'skip'].includes(input.toLowerCase());
      const details = hasDetails ? input : '';
      setWorkoutDetails(details);
      
      const durationMatch = workoutDuration.match(/(\d+)/);
      const durationMinutes = durationMatch ? parseInt(durationMatch[1]) : 30;
      
      setGeneratedWorkout({
        title: `${workoutType.charAt(0).toUpperCase() + workoutType.slice(1)} Session`,
        type: workoutType,
        duration: durationMinutes,
        notes: details,
        exercises: [],
        isLogged: true,
      });
      
      setConversationPhase('confirm');
      setCurrentStep('confirm');
      
      setTimeout(() => addAIMessage(`Perfect! Here's what I'll log:\n\n🏋️ **${workoutType.charAt(0).toUpperCase() + workoutType.slice(1)} Session**\n⏱️ ${durationMinutes} minutes${details ? `\n📝 ${details}` : ''}\n\nReady to save?`), 500);
    }
  };

  // Adjustment conversation - FIXED to actually modify workouts
  const handleAdjustmentConversation = async (input: string) => {
    const dayInfo = getSelectedDayInfo();
    const isHarder = selectedAction?.id === 'harder';
    
    setTimeout(() => addAIMessage(`Got it! Let me ${isHarder ? 'amp up' : 'adjust'} your workout... 💪`), 300);
    
    await applyWorkoutAdjustment(input, dayInfo, isHarder || false);
  };

  // FIXED: Actually generate a workout with AI
  const generateWorkoutWithAI = async (type: string, duration: string, details: string) => {
    setCurrentStep('generating');
    setIsProcessing(true);
    
    try {
      const token = await SecureStore.getItemAsync('thryvin_access_token');
      const dayInfo = getSelectedDayInfo();
      
      const durationMatch = duration.match(/(\d+)/);
      const durationMinutes = durationMatch ? parseInt(durationMatch[1]) : 45;
      
      // Build a rich user profile for better AI generation
      const userProfile = {
        trainingType: type,
        sessionDuration: durationMinutes,
        goal: user?.goal || 'general_fitness',
        experience: user?.experience || 'intermediate',
        equipment: user?.equipment || ['full_gym', 'dumbbells', 'barbells'],
        fitnessGoals: [type.toLowerCase()],
        trainingDays: user?.trainingDays || 4,
        // Include the user's specific request
        customRequest: details ? `User specifically requested: ${details}. Make sure to include exercises related to this request.` : `Generate a focused ${type} workout.`,
      };
      
      console.log('🎯 Generating workout with profile:', userProfile);
      
      const response = await fetch(`${API_BASE_URL}/api/workouts/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          userProfile,
          dayOfWeek: dayInfo?.date.getDay() || 0,
          weekNumber: Math.ceil(dayInfo?.dayNum / 7) || 1,
        }),
      });
      
      const responseText = await response.text();
      console.log('📦 Generate response:', responseText.substring(0, 500));
      
      let workout;
      try {
        workout = JSON.parse(responseText);
      } catch (e) {
        throw new Error('Invalid response from server');
      }
      
      if (!response.ok) {
        throw new Error(workout.error || 'Failed to generate workout');
      }
      
      // Check if we got a real workout with exercises
      if (!workout.exercises || workout.exercises.length === 0) {
        console.warn('⚠️ Generated workout has no exercises, falling back to simple creation');
        // Create a basic workout structure
        workout = {
          title: `${type.charAt(0).toUpperCase() + type.slice(1)} Workout`,
          type: type,
          duration: durationMinutes,
          exercises: [],
          targetMuscles: type,
          overview: `A ${durationMinutes} minute ${type} workout${details ? ` with focus on: ${details}` : ''}`,
        };
      }
      
      setGeneratedWorkout({
        ...workout,
        date: dayInfo?.dateKey,
        duration: durationMinutes,
        requestedType: type,
        requestedDetails: details,
      });
      
      setCurrentStep('confirm');
      setConversationPhase('confirm');
      
      const exerciseCount = workout.exercises?.length || 0;
      setTimeout(() => addAIMessage(`Here's what I've created for you:\n\n**${workout.title}**\n⏱️ ${durationMinutes} minutes\n🎯 ${workout.targetMuscles || type}\n💪 ${exerciseCount} exercises\n\n${exerciseCount > 0 ? 'Ready to add this to your plan?' : 'Note: This is a basic workout template. Ready to add it?'}`), 500);
      
    } catch (err: any) {
      console.error('❌ Generate workout error:', err);
      Alert.alert('Error', err.message || 'Failed to generate workout. Please try again.');
      setCurrentStep('conversation');
      setConversationPhase('type');
    } finally {
      setIsProcessing(false);
    }
  };

  // FIXED: Actually modify the workout
  const applyWorkoutAdjustment = async (reason: string, dayInfo: any, isHarder: boolean) => {
    setCurrentStep('generating');
    setIsProcessing(true);
    
    try {
      const token = await SecureStore.getItemAsync('thryvin_access_token');
      
      if (!dayInfo?.workout) {
        throw new Error('No workout found for this day');
      }
      
      // Call the AI to generate a modified version of the workout
      const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          message: `I want to make my "${dayInfo.workout.title}" workout ${isHarder ? 'HARDER' : 'EASIER'}. ${reason}. 

Current workout:
- Title: ${dayInfo.workout.title}
- Duration: ${dayInfo.workout.duration} minutes
- Exercises: ${dayInfo.workout.exercises?.map((e: any) => `${e.name}: ${e.sets}x${e.reps || e.duration}`).join(', ') || 'N/A'}

Please respond with ONLY a JSON object (no markdown, no explanation) with these fields:
{
  "title": "new workout title",
  "exercises": [{"name": "exercise", "sets": 3, "reps": 10, "restSeconds": 60}],
  "overview": "brief description of changes"
}`,
          context: {
            actionType: isHarder ? 'make_harder' : 'make_easier',
            currentWorkout: dayInfo.workout,
          },
        }),
      });
      
      const data = await response.json();
      console.log('📦 Adjustment response:', data);
      
      let updatedWorkout = dayInfo.workout;
      
      // Try to parse AI response for workout modifications
      if (data.response) {
        try {
          // Try to extract JSON from the response
          const jsonMatch = data.response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const modifications = JSON.parse(jsonMatch[0]);
            updatedWorkout = {
              ...dayInfo.workout,
              title: modifications.title || `${dayInfo.workout.title} (${isHarder ? 'Harder' : 'Easier'})`,
              exercises: modifications.exercises || dayInfo.workout.exercises,
              overview: modifications.overview || dayInfo.workout.overview,
              modified: true,
              modifiedAt: new Date().toISOString(),
            };
          }
        } catch (parseErr) {
          console.log('Could not parse AI modifications, applying basic change');
          // Apply basic modification
          updatedWorkout = {
            ...dayInfo.workout,
            title: `${dayInfo.workout.title} (${isHarder ? 'Intensified' : 'Modified'})`,
            modified: true,
            modifiedAt: new Date().toISOString(),
          };
        }
      }
      
      // Update the workout in store
      const idx = findWorkoutIndexByDate(weekWorkouts, dayInfo.dateKey);
      if (idx >= 0) {
        await updateWorkoutInWeek(idx, updatedWorkout);
        await syncFromBackend();
      }
      
      Alert.alert(
        'Done! ✅',
        isHarder 
          ? 'Your workout has been made more challenging!' 
          : 'Your workout has been adjusted to be easier.'
      );
      
      resetFlow();
      
    } catch (err: any) {
      console.error('❌ Adjustment error:', err);
      Alert.alert('Error', err.message || 'Failed to update workout.');
      setCurrentStep('conversation');
    } finally {
      setIsProcessing(false);
    }
  };

  // Confirm and save workout
  const handleConfirmWorkout = async () => {
    if (!generatedWorkout) return;
    
    setIsProcessing(true);
    
    try {
      const dayInfo = getSelectedDayInfo();
      if (!dayInfo) throw new Error('No day selected');
      
      const token = await SecureStore.getItemAsync('thryvin_access_token');
      
      // Handle logging extra activity
      if (selectedAction?.id === 'log' || generatedWorkout.isLogged) {
        await fetch(`${API_BASE_URL}/api/workouts/log-extra`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          },
          body: JSON.stringify({
            workout: {
              type: generatedWorkout.type,
              duration: generatedWorkout.duration,
              date: dayInfo.date.toISOString(),
              notes: generatedWorkout.notes || workoutDetails,
              title: generatedWorkout.title,
              id: `logged_${Date.now()}`,
              completedAt: new Date().toISOString(),
            }
          }),
        });
        
        await syncFromBackend();
        Alert.alert('Logged! 🏆', `${generatedWorkout.title} has been logged!`);
        resetFlow();
        return;
      }
      
      // Add new workout to plan
      const idx = findWorkoutIndexByDate(weekWorkouts, dayInfo.dateKey);
      
      const newWorkout = {
        id: `added_${Date.now()}`,
        title: generatedWorkout.title,
        type: generatedWorkout.type || generatedWorkout.requestedType || workoutType,
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
      Alert.alert('Added! 🎉', `${newWorkout.title} has been added to ${dayInfo.dayName}!`);
      resetFlow();
      
    } catch (err: any) {
      console.error('Save error:', err);
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
    </View>
  );

  // Day selection - MATCHING ViewAllWeeksModal styling
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
            ? `Select 2 days to swap`
            : `Select a day`}
        </Text>
        <Text style={styles.stepSubtitle}>
          {selectedAction?.id === 'add' ? 'Choose a rest day' : 
           selectedAction?.id === 'log' ? 'When did you workout?' : 
           'Tap to select'}
        </Text>
        
        {/* Week Tabs - ViewAllWeeksModal style */}
        <View style={styles.weekTabs}>
          {[1, 2, 3].map(weekNum => {
            const weekData = weeksData[weekNum - 1];
            const completed = weekData?.days.filter(d => d.isCompleted).length || 0;
            const total = weekData?.days.filter(d => d.workout && !d.isRest).length || 0;
            const isSelected = selectedWeek === weekNum;
            
            return (
              <TouchableOpacity
                key={weekNum}
                style={[styles.weekTab, isSelected && styles.weekTabSelected]}
                onPress={() => setSelectedWeek(weekNum)}
              >
                <Text style={[styles.weekTabText, isSelected && styles.weekTabTextSelected]}>
                  Week {weekNum}
                </Text>
                <Text style={[styles.weekTabStats, isSelected && styles.weekTabStatsSelected]}>
                  {completed}/{total}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        
        {/* Days List - ViewAllWeeksModal card style */}
        <ScrollView style={styles.daysScroll} showsVerticalScrollIndicator={false}>
          {currentWeekData?.days.map((day, index) => {
            const isSelected = selectedDays.includes(day.dateKey);
            const isDisabled = day.isCompleted && selectedAction?.id !== 'add' && selectedAction?.id !== 'log';
            
            // For "add", only show rest days as selectable
            const isSelectable = selectedAction?.id === 'add' ? day.isRest : 
                                selectedAction?.id === 'log' ? true :
                                (selectedAction?.id === 'harder' || selectedAction?.id === 'easier') ? !day.isRest :
                                !isDisabled;
            
            return (
              <TouchableOpacity
                key={day.dateKey}
                style={[
                  styles.dayCard,
                  day.isToday && styles.dayCardToday,
                  day.isCompleted && styles.dayCardCompleted,
                  isSelected && styles.dayCardSelected,
                  !isSelectable && styles.dayCardDisabled,
                ]}
                onPress={() => isSelectable && handleDaySelect(day.dateKey)}
                disabled={!isSelectable}
                activeOpacity={0.7}
              >
                <View style={styles.dayHeader}>
                  <View style={styles.dayInfo}>
                    <Text style={[styles.dayName, day.isToday && styles.dayNameToday]}>
                      {day.dayName}
                    </Text>
                    <Text style={styles.dayNum}>Day {day.dayNum}</Text>
                  </View>
                  
                  {day.isToday && (
                    <View style={styles.todayBadge}>
                      <Text style={styles.todayBadgeText}>TODAY</Text>
                    </View>
                  )}
                  
                  {day.isCompleted && (
                    <View style={styles.completedBadge}>
                      <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                    </View>
                  )}
                  
                  {isSelected && (
                    <View style={styles.selectedBadge}>
                      <Ionicons name="checkmark" size={16} color={COLORS.white} />
                    </View>
                  )}
                </View>
                
                {day.workout ? (
                  <View style={styles.workoutInfo}>
                    {day.isRest ? (
                      <>
                        <Ionicons name="bed" size={20} color={COLORS.mediumGray} />
                        <Text style={styles.restText}>Rest Day</Text>
                      </>
                    ) : (
                      <>
                        <LinearGradient
                          colors={[COLORS.accent, COLORS.accentSecondary]}
                          style={styles.workoutIcon}
                        >
                          <Ionicons name="barbell" size={16} color={COLORS.white} />
                        </LinearGradient>
                        <View style={styles.workoutDetails}>
                          <Text style={styles.workoutTitle} numberOfLines={1}>
                            {day.workout.title || 'Workout'}
                          </Text>
                          <Text style={styles.workoutMeta}>
                            {day.workout.duration || 45} min • {day.workout.exercises?.length || 0} exercises
                          </Text>
                        </View>
                      </>
                    )}
                  </View>
                ) : (
                  <View style={styles.workoutInfo}>
                    <Ionicons name="time" size={20} color={COLORS.mediumGray} />
                    <Text style={styles.pendingText}>Generating...</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
          <View style={{ height: 20 }} />
        </ScrollView>
      </View>
    );
  };

  const renderConversation = () => {
    const dayInfo = getSelectedDayInfo();
    
    const getActionIcon = () => {
      if (selectedAction?.id === 'add') return 'add';
      if (selectedAction?.id === 'log') return 'fitness';
      if (selectedAction?.id === 'harder') return 'flame';
      if (selectedAction?.id === 'easier') return 'leaf';
      return 'create';
    };
    
    const getActionTitle = () => {
      if (selectedAction?.id === 'add') return 'Add Workout';
      if (selectedAction?.id === 'log') return 'Track Activity';
      if (selectedAction?.id === 'harder') return 'Make Harder';
      if (selectedAction?.id === 'easier') return 'Make Easier';
      return 'Edit';
    };
    
    return (
      <KeyboardAvoidingView 
        style={styles.conversationContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <View style={styles.conversationHeader}>
          <TouchableOpacity style={styles.backButton} onPress={() => setCurrentStep('select_day')}>
            <Ionicons name="chevron-back" size={20} color={COLORS.accent} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          
          <View style={styles.conversationTitleRow}>
            <LinearGradient colors={[COLORS.accent, COLORS.accentSecondary]} style={styles.conversationIcon}>
              <Ionicons name={getActionIcon() as any} size={18} color={COLORS.white} />
            </LinearGradient>
            <View>
              <Text style={styles.conversationTitle}>{getActionTitle()}</Text>
              <Text style={styles.conversationSubtitle}>{dayInfo?.dayName} - Day {dayInfo?.dayNum}</Text>
            </View>
          </View>
        </View>
        
        <ScrollView 
          ref={scrollViewRef}
          style={styles.chatContainer}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
        >
          {chatMessages.map(msg => (
            <View key={msg.id} style={[styles.messageBubble, msg.type === 'user' ? styles.userBubble : styles.aiBubble]}>
              {msg.type === 'ai' && (
                <LinearGradient colors={[COLORS.accent, COLORS.accentSecondary]} style={styles.aiAvatar}>
                  <Ionicons name="fitness" size={14} color={COLORS.white} />
                </LinearGradient>
              )}
              <View style={[styles.messageContent, msg.type === 'user' ? styles.userMessageContent : styles.aiMessageContent]}>
                {msg.type === 'user' ? (
                  <LinearGradient colors={[COLORS.accent, COLORS.accentSecondary]} style={styles.userMessageGradient}>
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
        
        {/* Input Area with Voice Button */}
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
              returnKeyType="send"
              onSubmitEditing={handleSendMessage}
            />
            
            {/* Voice Button */}
            <TouchableOpacity 
              style={[styles.voiceButton, isRecording && styles.voiceButtonRecording]}
              onPressIn={startRecording}
              onPressOut={stopRecording}
              disabled={isProcessing}
            >
              <Ionicons 
                name={isRecording ? "mic" : "mic-outline"} 
                size={22} 
                color={isRecording ? COLORS.white : COLORS.accent} 
              />
            </TouchableOpacity>
            
            {/* Send Button */}
            <TouchableOpacity 
              style={[styles.sendButton, !userInput.trim() && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={!userInput.trim() || isProcessing}
            >
              <LinearGradient
                colors={userInput.trim() ? [COLORS.accent, COLORS.accentSecondary] : [COLORS.lightGray, COLORS.lightGray]}
                style={styles.sendButtonGradient}
              >
                <Ionicons name="send" size={18} color={userInput.trim() ? COLORS.white : COLORS.mediumGray} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Confirm Buttons */}
        {currentStep === 'confirm' && (selectedAction?.id === 'add' || selectedAction?.id === 'log') && generatedWorkout && (
          <View style={styles.confirmButtons}>
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => {
                setCurrentStep('conversation');
                setConversationPhase('type');
                setChatMessages([]);
                if (selectedAction?.id === 'log') startTrackActivityConversation(dayInfo);
                else startAddWorkoutConversation(dayInfo);
              }}
            >
              <Text style={styles.secondaryButtonText}>Start Over</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmWorkout} disabled={isProcessing}>
              <LinearGradient colors={[COLORS.accent, COLORS.accentSecondary]} style={styles.confirmButtonGradient}>
                {isProcessing ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <>
                    <Ionicons name={selectedAction?.id === 'log' ? 'checkmark-done' : 'checkmark-circle'} size={20} color={COLORS.white} />
                    <Text style={styles.confirmButtonText}>
                      {selectedAction?.id === 'log' ? 'Log Activity' : 'Add to Plan'}
                    </Text>
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
      <LinearGradient colors={[COLORS.accent, COLORS.accentSecondary]} style={styles.generatingIcon}>
        <ActivityIndicator size="large" color={COLORS.white} />
      </LinearGradient>
      <Text style={styles.generatingTitle}>Creating Your Workout</Text>
      <Text style={styles.generatingSubtitle}>Our AI is designing the perfect workout for you...</Text>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.mediumGray} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Plan</Text>
            <View style={{ width: 32 }} />
          </View>

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
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  container: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%', minHeight: '75%', flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  closeButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  content: { flex: 1 },
  
  stepContainer: { flex: 1, padding: 20 },
  stepTitle: { fontSize: 24, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  stepSubtitle: { fontSize: 16, color: COLORS.mediumGray, marginBottom: 24 },
  
  backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 4 },
  backText: { fontSize: 16, color: COLORS.accent, fontWeight: '600' },
  
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionCard: { width: '47%', backgroundColor: COLORS.lightGray, borderRadius: 16, padding: 16, alignItems: 'center' },
  actionIconBg: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  actionLabel: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  actionDesc: { fontSize: 12, color: COLORS.mediumGray, textAlign: 'center' },
  
  // Week Tabs - ViewAllWeeksModal style
  weekTabs: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  weekTab: { flex: 1, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 10, backgroundColor: COLORS.lightGray, alignItems: 'center' },
  weekTabSelected: { backgroundColor: COLORS.accent },
  weekTabText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  weekTabTextSelected: { color: COLORS.white },
  weekTabStats: { fontSize: 11, color: COLORS.mediumGray, marginTop: 2 },
  weekTabStatsSelected: { color: 'rgba(255,255,255,0.8)' },
  
  // Days - ViewAllWeeksModal card style
  daysScroll: { flex: 1 },
  dayCard: { backgroundColor: COLORS.lightGray, borderRadius: 12, padding: 14, marginBottom: 10 },
  dayCardToday: { borderWidth: 2, borderColor: COLORS.accent },
  dayCardCompleted: { backgroundColor: `${COLORS.success}10` },
  dayCardSelected: { backgroundColor: `${COLORS.accent}15`, borderWidth: 2, borderColor: COLORS.accent },
  dayCardDisabled: { opacity: 0.4 },
  dayHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  dayInfo: { flex: 1 },
  dayName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  dayNameToday: { color: COLORS.accent },
  dayNum: { fontSize: 12, color: COLORS.mediumGray, marginTop: 2 },
  todayBadge: { backgroundColor: COLORS.accent, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginRight: 8 },
  todayBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.white },
  completedBadge: { marginRight: 8 },
  selectedBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' },
  workoutInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  restText: { fontSize: 14, color: COLORS.mediumGray, fontStyle: 'italic' },
  workoutIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  workoutDetails: { flex: 1 },
  workoutTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  workoutMeta: { fontSize: 12, color: COLORS.mediumGray, marginTop: 2 },
  pendingText: { fontSize: 14, color: COLORS.mediumGray },
  
  // Conversation
  conversationContainer: { flex: 1 },
  conversationHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  conversationTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  conversationIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  conversationTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  conversationSubtitle: { fontSize: 14, color: COLORS.mediumGray },
  
  chatContainer: { flex: 1 },
  chatContent: { padding: 16, paddingBottom: 24 },
  messageBubble: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-end' },
  userBubble: { justifyContent: 'flex-end' },
  aiBubble: { justifyContent: 'flex-start' },
  aiAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  messageContent: { maxWidth: '80%' },
  userMessageContent: { marginLeft: 'auto' },
  aiMessageContent: { backgroundColor: COLORS.lightGray, borderRadius: 18, borderBottomLeftRadius: 4, padding: 14 },
  userMessageGradient: { borderRadius: 18, borderBottomRightRadius: 4, padding: 14 },
  aiMessageText: { fontSize: 15, color: COLORS.text, lineHeight: 22 },
  userMessageText: { fontSize: 15, color: COLORS.white, lineHeight: 22 },
  
  loadingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, gap: 10 },
  loadingText: { fontSize: 14, color: COLORS.mediumGray },
  
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, paddingBottom: Platform.OS === 'ios' ? 28 : 12, borderTopWidth: 1, borderTopColor: COLORS.lightGray, backgroundColor: COLORS.white, gap: 8 },
  chatInput: { flex: 1, backgroundColor: COLORS.lightGray, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: COLORS.text, maxHeight: 100 },
  
  voiceButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.lightGray, alignItems: 'center', justifyContent: 'center' },
  voiceButtonRecording: { backgroundColor: COLORS.accent },
  
  sendButton: { width: 44, height: 44 },
  sendButtonDisabled: { opacity: 0.6 },
  sendButtonGradient: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  
  confirmButtons: { flexDirection: 'row', padding: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 16, gap: 12, borderTopWidth: 1, borderTopColor: COLORS.lightGray },
  secondaryButton: { flex: 1, backgroundColor: COLORS.lightGray, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  secondaryButtonText: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  confirmButton: { flex: 2, borderRadius: 14, overflow: 'hidden' },
  confirmButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 8 },
  confirmButtonText: { fontSize: 15, fontWeight: '600', color: COLORS.white },
  
  generatingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  generatingIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  generatingTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  generatingSubtitle: { fontSize: 15, color: COLORS.mediumGray, textAlign: 'center' },
});
