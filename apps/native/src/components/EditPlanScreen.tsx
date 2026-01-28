/**
 * EditPlanScreen - Conversational AI workout editing with voice input
 * FIXED: Proper workout generation, conversational harder/easier flow
 */

import React, { useState, useMemo, useRef } from 'react';
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

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://workout-data-cleanup.preview.emergentagent.com';
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
  
  // Voice recording
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  
  // Conversation state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [conversationPhase, setConversationPhase] = useState<string>('type');
  
  // Collected data
  const [workoutType, setWorkoutType] = useState('');
  const [workoutDuration, setWorkoutDuration] = useState('');
  const [workoutDetails, setWorkoutDetails] = useState('');
  
  // For harder/easier flow
  const [adjustmentType, setAdjustmentType] = useState(''); // 'sets', 'reps', 'weight', 'rest', 'exercises'
  const [adjustmentScope, setAdjustmentScope] = useState(''); // 'all' or specific exercise
  const [adjustmentDetails, setAdjustmentDetails] = useState('');
  
  // Generated workout
  const [generatedWorkout, setGeneratedWorkout] = useState<any>(null);
  const [modifiedWorkout, setModifiedWorkout] = useState<any>(null);
  
  const scrollViewRef = useRef<ScrollView>(null);

  // Organize workouts into weeks
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
    return weeksData.flatMap(w => w.days).find(d => d.dateKey === selectedDays[0]);
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
    setAdjustmentType('');
    setAdjustmentScope('');
    setAdjustmentDetails('');
    setGeneratedWorkout(null);
    setModifiedWorkout(null);
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

  // Voice functions
  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant microphone access.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: newRecording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) {
      console.error('Recording error:', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    setIsRecording(false);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      if (uri) await transcribeAudio(uri);
    } catch (err) {
      console.error('Stop recording error:', err);
    }
  };

  const transcribeAudio = async (audioUri: string) => {
    try {
      const token = await SecureStore.getItemAsync('thryvin_access_token');
      const formData = new FormData();
      formData.append('audio', { uri: audioUri, type: 'audio/m4a', name: 'recording.m4a' } as any);
      
      const response = await fetch(`${API_BASE_URL}/api/transcribe`, {
        method: 'POST',
        headers: { 'Authorization': token ? `Bearer ${token}` : '' },
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.text) setUserInput(data.text);
      }
    } catch (err) {
      console.error('Transcribe error:', err);
    }
  };

  const addAIMessage = (text: string) => {
    setChatMessages(prev => [...prev, { id: `ai-${Date.now()}`, type: 'ai', text }]);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const addUserMessage = (text: string) => {
    setChatMessages(prev => [...prev, { id: `user-${Date.now()}`, type: 'user', text }]);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  };

  // Start conversations
  const startAddWorkoutConversation = (dayInfo: any) => {
    setChatMessages([]);
    setConversationPhase('type');
    setTimeout(() => addAIMessage(`Hey! Let's add a workout to ${dayInfo.dayName} (Day ${dayInfo.dayNum})! 💪\n\nWhat type of workout would you like?\n\nFor example: "chest", "back", "legs", "arms", "shoulders", "full body"...`), 300);
  };

  const startTrackActivityConversation = (dayInfo: any) => {
    setChatMessages([]);
    setConversationPhase('type');
    setTimeout(() => addAIMessage(`Nice! Let's log that workout! 🏆\n\nWhat type of workout was it?`), 300);
  };

  const startAdjustmentConversation = (dayInfo: any, isHarder: boolean) => {
    setChatMessages([]);
    setConversationPhase('adjustment_type');
    const workoutName = dayInfo.workout?.title || 'this workout';
    
    if (isHarder) {
      setTimeout(() => addAIMessage(`I can make "${workoutName}" more challenging! 🔥\n\nWhat would you like to do?\n\n• **Add sets** - More volume\n• **Add reps** - More reps per set\n• **Heavier weight** - Increase load\n• **Less rest** - Shorter breaks\n• **Add exercises** - More movements\n\nJust tell me what you'd like!`), 300);
    } else {
      setTimeout(() => addAIMessage(`Let's make "${workoutName}" more manageable! 🌿\n\nWhat would you like to do?\n\n• **Remove sets** - Less volume\n• **Fewer reps** - Less reps per set\n• **Lighter weight** - Decrease load\n• **More rest** - Longer breaks\n• **Remove exercises** - Fewer movements\n\nJust tell me what you need!`), 300);
    }
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
      Alert.alert('Not a Rest Day', 'You can only add a workout to a rest day.');
      return;
    }
    
    if (selectedAction.id === 'skip' && day?.isRest) {
      Alert.alert('Already Rest', 'This is already a rest day.');
      return;
    }
    
    if ((selectedAction.id === 'harder' || selectedAction.id === 'easier') && day?.isRest) {
      Alert.alert('Rest Day', 'Cannot modify a rest day.');
      return;
    }
    
    setSelectedDays([dateKey]);
    setCurrentStep('conversation');
    
    if (selectedAction.id === 'add') startAddWorkoutConversation(day);
    else if (selectedAction.id === 'log') startTrackActivityConversation(day);
    else if (selectedAction.id === 'harder') startAdjustmentConversation(day, true);
    else if (selectedAction.id === 'easier') startAdjustmentConversation(day, false);
    else if (selectedAction.id === 'skip') handleSkipConfirm(dateKey);
  };

  const handleSwapConfirm = async (days: string[]) => {
    setIsProcessing(true);
    try {
      const fromIdx = findWorkoutIndexByDate(weekWorkouts, days[0]);
      const toIdx = findWorkoutIndexByDate(weekWorkouts, days[1]);
      if (fromIdx >= 0 && toIdx >= 0) {
        await swapWorkoutDays(fromIdx, toIdx);
        await syncFromBackend();
        Alert.alert('Done! ✅', 'Days swapped successfully.');
      }
      resetFlow();
    } catch (err: any) {
      Alert.alert('Error', err.message);
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
        await updateWorkoutInWeek(idx, { ...workout, isRestDay: true, title: 'Rest Day', type: 'Rest', exercises: [], duration: 0 });
        await syncFromBackend();
        Alert.alert('Done! ✅', 'Day converted to rest day.');
      }
      resetFlow();
    } catch (err: any) {
      Alert.alert('Error', err.message);
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
    
    if (selectedAction?.id === 'add') await handleAddWorkoutFlow(input);
    else if (selectedAction?.id === 'log') await handleLogActivityFlow(input);
    else if (selectedAction?.id === 'harder' || selectedAction?.id === 'easier') await handleAdjustmentFlow(input);
  };

  // ADD WORKOUT FLOW - Uses new custom endpoint
  const handleAddWorkoutFlow = async (input: string) => {
    if (conversationPhase === 'type') {
      setWorkoutType(input);
      setConversationPhase('duration');
      setTimeout(() => addAIMessage(`Great! A ${input} workout! 🎯\n\nHow long should it be?\n\nFor example: "30 minutes", "45 min", "1 hour"...`), 400);
      
    } else if (conversationPhase === 'duration') {
      setWorkoutDuration(input);
      setConversationPhase('details');
      setTimeout(() => addAIMessage(`Perfect, ${input}! ⏱️\n\nAnything specific you want included?\n\nFor example: "heavy bench press", "lots of supersets", "focus on upper chest"\n\nOr say "no" for a standard workout.`), 400);
      
    } else if (conversationPhase === 'details') {
      const hasDetails = !['no', 'nope', 'nothing', 'n', 'none', 'nah'].includes(input.toLowerCase());
      const details = hasDetails ? input : '';
      setWorkoutDetails(details);
      
      setTimeout(() => addAIMessage(`Awesome! Creating your ${workoutType} workout... 🏋️`), 300);
      await generateCustomWorkout(workoutType, workoutDuration, details);
    }
  };

  // GENERATE CUSTOM WORKOUT - Uses the new endpoint that respects user request
  const generateCustomWorkout = async (type: string, duration: string, details: string) => {
    setCurrentStep('generating');
    setIsProcessing(true);
    
    try {
      const token = await SecureStore.getItemAsync('thryvin_access_token');
      const dayInfo = getSelectedDayInfo();
      
      const durationMatch = duration.match(/(\d+)/);
      const durationMinutes = durationMatch ? parseInt(durationMatch[1]) : 45;
      
      console.log('🎯 Generating custom workout:', { type, durationMinutes, details });
      
      const response = await fetch(`${API_BASE_URL}/api/workouts/generate-custom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          workoutType: type,
          duration: durationMinutes,
          customRequest: details,
          equipment: user?.equipment || ['full_gym', 'dumbbells', 'barbells'],
        }),
      });
      
      const workout = await response.json();
      console.log('📦 Generated workout:', workout);
      
      if (!response.ok) {
        throw new Error(workout.error || 'Failed to generate');
      }
      
      setGeneratedWorkout({
        ...workout,
        date: dayInfo?.dateKey,
        duration: workout.duration || durationMinutes,
      });
      
      setCurrentStep('confirm');
      setConversationPhase('confirm');
      
      const exerciseList = workout.exercises?.slice(0, 3).map((e: any) => `• ${e.name}`).join('\n') || '';
      const moreExercises = (workout.exercises?.length || 0) > 3 ? `\n...and ${workout.exercises.length - 3} more exercises` : '';
      
      setTimeout(() => addAIMessage(`Here's your ${type} workout! 🎉\n\n**${workout.title}**\n⏱️ ${workout.duration || durationMinutes} min\n🎯 ${workout.targetMuscles || type}\n💪 ${workout.exercises?.length || 0} exercises\n\n${exerciseList}${moreExercises}\n\nReady to add this to your plan?`), 500);
      
    } catch (err: any) {
      console.error('❌ Generate error:', err);
      Alert.alert('Error', err.message || 'Failed to generate workout');
      setCurrentStep('conversation');
      setConversationPhase('type');
    } finally {
      setIsProcessing(false);
    }
  };

  // LOG ACTIVITY FLOW
  const handleLogActivityFlow = async (input: string) => {
    if (conversationPhase === 'type') {
      setWorkoutType(input);
      setConversationPhase('duration');
      setTimeout(() => addAIMessage(`Nice, ${input}! 💪\n\nHow long was it?`), 400);
      
    } else if (conversationPhase === 'duration') {
      setWorkoutDuration(input);
      setConversationPhase('details');
      setTimeout(() => addAIMessage(`Great, ${input}! 🔥\n\nAny notes? Or say "no" to skip.`), 400);
      
    } else if (conversationPhase === 'details') {
      const hasDetails = !['no', 'nope', 'nothing', 'n', 'none', 'skip'].includes(input.toLowerCase());
      setWorkoutDetails(hasDetails ? input : '');
      
      const durationMatch = workoutDuration.match(/(\d+)/);
      const durationMinutes = durationMatch ? parseInt(durationMatch[1]) : 30;
      
      setGeneratedWorkout({
        title: `${workoutType.charAt(0).toUpperCase() + workoutType.slice(1)} Session`,
        type: workoutType,
        duration: durationMinutes,
        notes: hasDetails ? input : '',
        exercises: [],
        isLogged: true,
      });
      
      setCurrentStep('confirm');
      setConversationPhase('confirm');
      
      setTimeout(() => addAIMessage(`Logging:\n\n🏋️ **${workoutType}**\n⏱️ ${durationMinutes} min${hasDetails ? `\n📝 ${input}` : ''}\n\nReady to save?`), 400);
    }
  };

  // ADJUSTMENT FLOW (Make Harder/Easier) - Proper conversation
  const handleAdjustmentFlow = async (input: string) => {
    const dayInfo = getSelectedDayInfo();
    const isHarder = selectedAction?.id === 'harder';
    const inputLower = input.toLowerCase();
    
    if (conversationPhase === 'adjustment_type') {
      // Determine what type of adjustment
      let type = '';
      if (inputLower.includes('set')) type = 'sets';
      else if (inputLower.includes('rep')) type = 'reps';
      else if (inputLower.includes('weight') || inputLower.includes('heav') || inputLower.includes('light')) type = 'weight';
      else if (inputLower.includes('rest') || inputLower.includes('break')) type = 'rest';
      else if (inputLower.includes('exercise') || inputLower.includes('add') || inputLower.includes('remove')) type = 'exercises';
      else type = 'general';
      
      setAdjustmentType(type);
      setConversationPhase('adjustment_scope');
      
      if (type === 'sets') {
        setTimeout(() => addAIMessage(`Got it - ${isHarder ? 'adding' : 'removing'} sets! 💪\n\nShould I ${isHarder ? 'add a set to' : 'remove a set from'} **every exercise**, or just specific ones?\n\nSay "all" or tell me which exercises.`), 400);
      } else if (type === 'reps') {
        setTimeout(() => addAIMessage(`${isHarder ? 'More' : 'Fewer'} reps! 🎯\n\nApply to **all exercises** or specific ones?\n\nSay "all" or name the exercises.`), 400);
      } else if (type === 'weight') {
        setTimeout(() => addAIMessage(`${isHarder ? 'Heavier' : 'Lighter'} weights! 🏋️\n\nFor **all exercises** or specific ones?`), 400);
      } else if (type === 'rest') {
        setTimeout(() => addAIMessage(`${isHarder ? 'Shorter' : 'Longer'} rest periods! ⏱️\n\nApply to the whole workout?`), 400);
      } else if (type === 'exercises') {
        setTimeout(() => addAIMessage(`${isHarder ? 'Adding' : 'Removing'} exercises! 📋\n\nWhich exercises would you like to ${isHarder ? 'add' : 'remove'}?`), 400);
      } else {
        setTimeout(() => addAIMessage(`I'll make it ${isHarder ? 'harder' : 'easier'} based on: "${input}"\n\nApply to the whole workout?`), 400);
      }
      
    } else if (conversationPhase === 'adjustment_scope') {
      const isAll = inputLower.includes('all') || inputLower.includes('yes') || inputLower.includes('whole') || inputLower.includes('every');
      setAdjustmentScope(isAll ? 'all' : input);
      setAdjustmentDetails(input);
      
      // Now generate the modified workout
      setConversationPhase('generating');
      setTimeout(() => addAIMessage(`Perfect! Let me update your workout... 🔄`), 300);
      
      await generateModifiedWorkout(dayInfo, isHarder, adjustmentType, isAll ? 'all' : input);
    }
  };

  // GENERATE MODIFIED WORKOUT
  const generateModifiedWorkout = async (dayInfo: any, isHarder: boolean, adjustType: string, scope: string) => {
    setCurrentStep('generating');
    setIsProcessing(true);
    
    try {
      const workout = dayInfo?.workout;
      if (!workout) throw new Error('No workout found');
      
      // Create modified version based on adjustment type
      let modifiedExercises = [...(workout.exercises || [])];
      let changesSummary = '';
      
      if (adjustType === 'sets') {
        modifiedExercises = modifiedExercises.map(ex => ({
          ...ex,
          sets: isHarder ? (ex.sets || 3) + 1 : Math.max((ex.sets || 3) - 1, 1),
        }));
        changesSummary = `${isHarder ? 'Added' : 'Removed'} 1 set ${scope === 'all' ? 'from each exercise' : `from ${scope}`}`;
      } else if (adjustType === 'reps') {
        modifiedExercises = modifiedExercises.map(ex => {
          const currentReps = parseInt(ex.reps) || 10;
          const newReps = isHarder ? currentReps + 2 : Math.max(currentReps - 2, 5);
          return { ...ex, reps: `${newReps}` };
        });
        changesSummary = `${isHarder ? 'Increased' : 'Decreased'} reps by 2`;
      } else if (adjustType === 'weight') {
        changesSummary = `Suggested ${isHarder ? 'heavier' : 'lighter'} weights`;
        modifiedExercises = modifiedExercises.map(ex => ({
          ...ex,
          notes: isHarder ? 'Increase weight by 5-10%' : 'Decrease weight by 10-15%',
        }));
      } else if (adjustType === 'rest') {
        modifiedExercises = modifiedExercises.map(ex => ({
          ...ex,
          restSeconds: isHarder ? Math.max((ex.restSeconds || 60) - 15, 30) : (ex.restSeconds || 60) + 15,
        }));
        changesSummary = `${isHarder ? 'Reduced' : 'Increased'} rest time by 15 seconds`;
      } else {
        // General adjustment
        changesSummary = `Made workout ${isHarder ? 'more challenging' : 'easier'}`;
      }
      
      const modified = {
        ...workout,
        title: `${workout.title} (${isHarder ? 'Intensified' : 'Modified'})`,
        exercises: modifiedExercises,
        modifiedAt: new Date().toISOString(),
      };
      
      setModifiedWorkout(modified);
      setCurrentStep('confirm');
      setConversationPhase('confirm_adjustment');
      
      // Show changes
      const exerciseChanges = modifiedExercises.slice(0, 3).map((ex: any) => 
        `• ${ex.name}: ${ex.sets} sets × ${ex.reps} reps`
      ).join('\n');
      
      setTimeout(() => addAIMessage(`Here's your updated workout! ✅\n\n**${modified.title}**\n\n📝 Changes:\n${changesSummary}\n\n${exerciseChanges}${modifiedExercises.length > 3 ? '\n...and more' : ''}\n\nSave these changes?`), 500);
      
    } catch (err: any) {
      console.error('❌ Modify error:', err);
      Alert.alert('Error', err.message);
      setCurrentStep('conversation');
    } finally {
      setIsProcessing(false);
    }
  };

  // CONFIRM WORKOUT
  const handleConfirmWorkout = async () => {
    if (!generatedWorkout && !modifiedWorkout) return;
    setIsProcessing(true);
    
    try {
      const dayInfo = getSelectedDayInfo();
      if (!dayInfo) throw new Error('No day selected');
      
      const token = await SecureStore.getItemAsync('thryvin_access_token');
      const idx = findWorkoutIndexByDate(weekWorkouts, dayInfo.dateKey);
      
      if (selectedAction?.id === 'log' || generatedWorkout?.isLogged) {
        // Log extra activity
        await fetch(`${API_BASE_URL}/api/workouts/log-extra`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
          body: JSON.stringify({
            workout: {
              type: generatedWorkout.type,
              duration: generatedWorkout.duration,
              date: dayInfo.date.toISOString(),
              notes: generatedWorkout.notes,
              title: generatedWorkout.title,
            }
          }),
        });
        await syncFromBackend();
        Alert.alert('Logged! 🏆', `${generatedWorkout.title} saved!`);
        
      } else if (modifiedWorkout) {
        // Save modified workout
        if (idx >= 0) {
          await updateWorkoutInWeek(idx, modifiedWorkout);
          await syncFromBackend();
        }
        Alert.alert('Updated! ✅', 'Workout has been modified!');
        
      } else if (generatedWorkout) {
        // Save new workout
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
          isRestDay: false,
          completed: false,
        };
        
        if (idx >= 0) await updateWorkoutInWeek(idx, newWorkout);
        await syncFromBackend();
        Alert.alert('Added! 🎉', `${newWorkout.title} added to ${dayInfo.dayName}!`);
      }
      
      resetFlow();
    } catch (err: any) {
      console.error('Save error:', err);
      Alert.alert('Error', err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================

  const renderActionSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>What would you like to do?</Text>
      <Text style={styles.stepSubtitle}>Choose an action</Text>
      
      <View style={styles.actionsGrid}>
        {EDIT_ACTIONS.map(action => (
          <TouchableOpacity key={action.id} style={styles.actionCard} onPress={() => handleSelectAction(action)} activeOpacity={0.7}>
            <LinearGradient colors={[`${action.color}20`, `${action.color}10`]} style={styles.actionIconBg}>
              <Ionicons name={action.icon as any} size={26} color={action.color} />
            </LinearGradient>
            <Text style={styles.actionLabel}>{action.label}</Text>
            <Text style={styles.actionDesc}>{action.description}</Text>
          </TouchableOpacity>
        ))}
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
        
        <Text style={styles.stepTitle}>{selectedAction?.requiresTwoDays ? 'Select 2 days' : 'Select a day'}</Text>
        <Text style={styles.stepSubtitle}>{selectedAction?.id === 'add' ? 'Choose a rest day' : selectedAction?.id === 'log' ? 'When did you workout?' : 'Tap to select'}</Text>
        
        <View style={styles.weekTabs}>
          {[1, 2, 3].map(weekNum => {
            const weekData = weeksData[weekNum - 1];
            const completed = weekData?.days.filter(d => d.isCompleted).length || 0;
            const total = weekData?.days.filter(d => d.workout && !d.isRest).length || 0;
            return (
              <TouchableOpacity key={weekNum} style={[styles.weekTab, selectedWeek === weekNum && styles.weekTabSelected]} onPress={() => setSelectedWeek(weekNum)}>
                <Text style={[styles.weekTabText, selectedWeek === weekNum && styles.weekTabTextSelected]}>Week {weekNum}</Text>
                <Text style={[styles.weekTabStats, selectedWeek === weekNum && styles.weekTabStatsSelected]}>{completed}/{total}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        
        <ScrollView style={styles.daysScroll} showsVerticalScrollIndicator={false}>
          {currentWeekData?.days.map((day) => {
            const isSelected = selectedDays.includes(day.dateKey);
            const isSelectable = selectedAction?.id === 'add' ? day.isRest : selectedAction?.id === 'log' ? true : (selectedAction?.id === 'harder' || selectedAction?.id === 'easier') ? !day.isRest : !(day.isCompleted && selectedAction?.id !== 'add' && selectedAction?.id !== 'log');
            
            return (
              <TouchableOpacity key={day.dateKey} style={[styles.dayCard, day.isToday && styles.dayCardToday, day.isCompleted && styles.dayCardCompleted, isSelected && styles.dayCardSelected, !isSelectable && styles.dayCardDisabled]} onPress={() => isSelectable && handleDaySelect(day.dateKey)} disabled={!isSelectable} activeOpacity={0.7}>
                <View style={styles.dayHeader}>
                  <View style={styles.dayInfo}>
                    <Text style={[styles.dayName, day.isToday && styles.dayNameToday]}>{day.dayName}</Text>
                    <Text style={styles.dayNum}>Day {day.dayNum}</Text>
                  </View>
                  {day.isToday && <View style={styles.todayBadge}><Text style={styles.todayBadgeText}>TODAY</Text></View>}
                  {day.isCompleted && <View style={styles.completedBadge}><Ionicons name="checkmark-circle" size={24} color={COLORS.success} /></View>}
                  {isSelected && <View style={styles.selectedBadge}><Ionicons name="checkmark" size={16} color={COLORS.white} /></View>}
                </View>
                
                <View style={styles.workoutInfo}>
                  {day.isRest ? (
                    <>
                      <Ionicons name="bed" size={20} color={COLORS.mediumGray} />
                      <Text style={styles.restText}>Rest Day</Text>
                    </>
                  ) : day.workout ? (
                    <>
                      <LinearGradient colors={[COLORS.accent, COLORS.accentSecondary]} style={styles.workoutIcon}>
                        <Ionicons name="barbell" size={16} color={COLORS.white} />
                      </LinearGradient>
                      <View style={styles.workoutDetails}>
                        <Text style={styles.workoutTitle} numberOfLines={1}>{day.workout.title || 'Workout'}</Text>
                        <Text style={styles.workoutMeta}>{day.workout.duration || 45} min • {day.workout.exercises?.length || 0} exercises</Text>
                      </View>
                    </>
                  ) : (
                    <>
                      <Ionicons name="time" size={20} color={COLORS.mediumGray} />
                      <Text style={styles.pendingText}>Generating...</Text>
                    </>
                  )}
                </View>
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
    const getIcon = () => selectedAction?.id === 'add' ? 'add' : selectedAction?.id === 'log' ? 'fitness' : selectedAction?.id === 'harder' ? 'flame' : 'leaf';
    const getTitle = () => selectedAction?.id === 'add' ? 'Add Workout' : selectedAction?.id === 'log' ? 'Track Activity' : selectedAction?.id === 'harder' ? 'Make Harder' : 'Make Easier';
    
    const showConfirmButtons = currentStep === 'confirm' && (generatedWorkout || modifiedWorkout);
    
    return (
      <KeyboardAvoidingView style={styles.conversationContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={100}>
        <View style={styles.conversationHeader}>
          <TouchableOpacity style={styles.backButton} onPress={() => setCurrentStep('select_day')}>
            <Ionicons name="chevron-back" size={20} color={COLORS.accent} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <View style={styles.conversationTitleRow}>
            <LinearGradient colors={[COLORS.accent, COLORS.accentSecondary]} style={styles.conversationIcon}>
              <Ionicons name={getIcon() as any} size={18} color={COLORS.white} />
            </LinearGradient>
            <View>
              <Text style={styles.conversationTitle}>{getTitle()}</Text>
              <Text style={styles.conversationSubtitle}>{dayInfo?.dayName} - Day {dayInfo?.dayNum}</Text>
            </View>
          </View>
        </View>
        
        <ScrollView ref={scrollViewRef} style={styles.chatContainer} contentContainerStyle={styles.chatContent} showsVerticalScrollIndicator={false}>
          {chatMessages.map(msg => (
            <View key={msg.id} style={[styles.messageBubble, msg.type === 'user' ? styles.userBubble : styles.aiBubble]}>
              {msg.type === 'ai' && <LinearGradient colors={[COLORS.accent, COLORS.accentSecondary]} style={styles.aiAvatar}><Ionicons name="fitness" size={14} color={COLORS.white} /></LinearGradient>}
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
          {isProcessing && <View style={styles.loadingContainer}><ActivityIndicator size="small" color={COLORS.accent} /><Text style={styles.loadingText}>Working on it...</Text></View>}
        </ScrollView>
        
        {currentStep === 'conversation' && (
          <View style={styles.inputContainer}>
            <TextInput style={styles.chatInput} placeholder="Type your response..." placeholderTextColor={COLORS.mediumGray} value={userInput} onChangeText={setUserInput} multiline maxLength={500} returnKeyType="send" onSubmitEditing={handleSendMessage} />
            <TouchableOpacity style={[styles.voiceButton, isRecording && styles.voiceButtonRecording]} onPressIn={startRecording} onPressOut={stopRecording}>
              <Ionicons name={isRecording ? "mic" : "mic-outline"} size={22} color={isRecording ? COLORS.white : COLORS.accent} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.sendButton, !userInput.trim() && styles.sendButtonDisabled]} onPress={handleSendMessage} disabled={!userInput.trim()}>
              <LinearGradient colors={userInput.trim() ? [COLORS.accent, COLORS.accentSecondary] : [COLORS.lightGray, COLORS.lightGray]} style={styles.sendButtonGradient}>
                <Ionicons name="send" size={18} color={userInput.trim() ? COLORS.white : COLORS.mediumGray} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
        
        {showConfirmButtons && (
          <View style={styles.confirmButtons}>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => { setCurrentStep('conversation'); setConversationPhase('type'); setChatMessages([]); if (selectedAction?.id === 'log') startTrackActivityConversation(dayInfo); else if (selectedAction?.id === 'add') startAddWorkoutConversation(dayInfo); else if (selectedAction?.id === 'harder') startAdjustmentConversation(dayInfo, true); else if (selectedAction?.id === 'easier') startAdjustmentConversation(dayInfo, false); }}>
              <Text style={styles.secondaryButtonText}>Start Over</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmWorkout} disabled={isProcessing}>
              <LinearGradient colors={[COLORS.accent, COLORS.accentSecondary]} style={styles.confirmButtonGradient}>
                {isProcessing ? <ActivityIndicator color={COLORS.white} size="small" /> : <>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
                  <Text style={styles.confirmButtonText}>{selectedAction?.id === 'log' ? 'Log Activity' : modifiedWorkout ? 'Save Changes' : 'Add to Plan'}</Text>
                </>}
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
      <Text style={styles.generatingSubtitle}>Our AI is working on it...</Text>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}><Ionicons name="close" size={24} color={COLORS.mediumGray} /></TouchableOpacity>
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
  weekTabs: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  weekTab: { flex: 1, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 10, backgroundColor: COLORS.lightGray, alignItems: 'center' },
  weekTabSelected: { backgroundColor: COLORS.accent },
  weekTabText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  weekTabTextSelected: { color: COLORS.white },
  weekTabStats: { fontSize: 11, color: COLORS.mediumGray, marginTop: 2 },
  weekTabStatsSelected: { color: 'rgba(255,255,255,0.8)' },
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
