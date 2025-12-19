import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../stores/auth-store';
import { Audio } from 'expo-av';

const COLORS = {
  accent: '#A22BF6',
  accentSecondary: '#FF4EC7',
  white: '#ffffff',
  text: '#222222',
  lightGray: '#F8F9FA',
  mediumGray: '#8E8E93',
  success: '#34C759',
  danger: '#FF3B30',
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://thryvin-fitness-1.preview.emergentagent.com';

interface AdvancedQuestionnaireModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (data: AdvancedQuestionnaireData) => void;
}

export interface WeeklyActivity {
  name: string;
  dayOfWeek: number;
  timeWindow: 'morning' | 'afternoon' | 'evening';
  intensity: 'low' | 'moderate' | 'hard';
  notes?: string;
}

export interface AdvancedQuestionnaireData {
  targets: string;
  goalDetails: { [goalKey: string]: string };
  enjoyedTraining: string;
  dislikedTraining: string;
  weakAreas: string;
  additionalInfo: string;
  completedAt: string;
  // Phase 8.5: Weekly schedule fields
  weeklyActivities?: WeeklyActivity[];
  gymDaysAvailable?: number[];
  scheduleFlexibility?: boolean;
  preferredSplit?: string;
  preferredSplitOther?: string;
}

const QUESTIONS = [
  {
    id: 'targets',
    title: 'Training Targets',
    question: 'Do you have any specific targets, deadlines, or events you\'re training for?',
    placeholder: 'e.g., 10K race in 3 months, wedding in June, summer vacation...',
    icon: 'flag',
    hint: 'This helps your AI coach plan your training intensity and timeline',
  },
  {
    id: 'goalDetails',
    title: 'Goal Details',
    question: 'Describe your existing goals in more detail',
    placeholder: 'Tell us more about what you want to achieve...',
    icon: 'trophy',
    isGoalDetails: true,
    hint: 'The more detail you give, the better your workouts will be tailored',
  },
  {
    id: 'enjoyedTraining',
    title: 'What You Enjoy',
    question: 'What types of training do you enjoy?',
    placeholder: 'e.g., Weight lifting, running, yoga, swimming, HIIT...',
    icon: 'heart',
    hint: 'We\'ll include more of what you love to keep you motivated',
  },
  {
    id: 'dislikedTraining',
    title: 'What You Don\'t Enjoy',
    question: 'What types of training do you NOT enjoy?',
    placeholder: 'e.g., Cardio, burpees, stretching...',
    icon: 'thumbs-down',
    hint: 'We\'ll still include these occasionally, but less frequently',
  },
  {
    id: 'weakAreas',
    title: 'Weak Areas',
    question: 'Do you have any weak areas you specifically want to work on?',
    placeholder: 'e.g., My biceps are lacking, need more core strength...',
    icon: 'fitness',
    hint: 'We\'ll add extra focus to strengthen these areas',
  },
  {
    id: 'additionalInfo',
    title: 'Anything Else',
    question: 'Is there anything else you would like your coach to know about you for the best results?',
    placeholder: 'Any other information that could help us create the perfect workout plan...',
    icon: 'chatbubble-ellipses',
    hint: 'Share anything that might help personalize your experience',
  },
  {
    id: 'weeklySchedule',
    title: 'Weekly Schedule & Training Style',
    question: 'Help us plan around your life',
    placeholder: '',
    icon: 'calendar',
    hint: 'We\'ll avoid scheduling conflicts with your other activities',
    isWeeklySchedule: true,
  },
];

// Individual voice recorder component for each input
const VoiceRecorderButton = ({ 
  onTranscription, 
  goalKey 
}: { 
  onTranscription: (text: string) => void;
  goalKey?: string;
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert('Permission Required', 'Please allow microphone access.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      recordingRef.current = recording;
      setIsRecording(true);

      // Auto-stop after 30 seconds
      timeoutRef.current = setTimeout(() => stopRecording(), 30000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    try {
      setIsRecording(false);
      setIsProcessing(true);

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!uri) throw new Error('No recording URI');

      const formData = new FormData();
      formData.append('audio', {
        uri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as any);

      const response = await fetch(`${API_BASE_URL}/api/transcribe`, {
        method: 'POST',
        headers: { 'Bypass-Tunnel-Reminder': 'true' },
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 503) {
          throw new Error('Voice input temporarily unavailable. Please type instead.');
        }
        throw new Error('Transcription failed');
      }

      const result = await response.json();
      if (result.text) {
        onTranscription(result.text);
      }
    } catch (error: any) {
      Alert.alert('Voice Input', error.message || 'Failed to transcribe');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePress = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <TouchableOpacity
      style={[styles.voiceButton, isRecording && styles.voiceButtonRecording]}
      onPress={handlePress}
      disabled={isProcessing}
    >
      {isRecording ? (
        <View style={[styles.voiceButtonGradient, { backgroundColor: COLORS.danger }]}>
          <Ionicons name="stop" size={18} color={COLORS.white} />
        </View>
      ) : isProcessing ? (
        <LinearGradient
          colors={[COLORS.accent, COLORS.accentSecondary]}
          style={styles.voiceButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <ActivityIndicator size="small" color={COLORS.white} />
        </LinearGradient>
      ) : (
        <LinearGradient
          colors={[COLORS.accent, COLORS.accentSecondary]}
          style={styles.voiceButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="mic" size={18} color={COLORS.white} />
        </LinearGradient>
      )}
    </TouchableOpacity>
  );
};

export const AdvancedQuestionnaireModal = ({
  visible,
  onClose,
  onComplete,
}: AdvancedQuestionnaireModalProps) => {
  const { user } = useAuthStore();
  const [showIntro, setShowIntro] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<AdvancedQuestionnaireData>({
    targets: '',
    goalDetails: {},
    enjoyedTraining: '',
    dislikedTraining: '',
    weakAreas: '',
    additionalInfo: '',
    completedAt: '',
    // Phase 8.5: Weekly schedule defaults
    weeklyActivities: [],
    gymDaysAvailable: [],
    scheduleFlexibility: true,
    preferredSplit: 'coach_choice',
  });
  
  // Weekly schedule state
  const [newActivity, setNewActivity] = useState<WeeklyActivity>({
    name: '',
    dayOfWeek: 1,
    timeWindow: 'evening',
    intensity: 'moderate',
  });
  
  // Animation
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  
  // Get user's goals from their profile
  const userGoals = user?.fitnessGoals || ['Build muscle', 'Lose weight', 'Improve fitness'];
  
  // Track which goals have been filled
  const [filledGoals, setFilledGoals] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    // Initialize goal details with user's goals
    const initialGoalDetails: { [key: string]: string } = {};
    userGoals.forEach((goal: string) => {
      initialGoalDetails[goal] = '';
    });
    setFormData(prev => ({ ...prev, goalDetails: initialGoalDetails }));
  }, [user]);
  
  // Update filled goals tracker
  useEffect(() => {
    const filled = new Set<string>();
    Object.entries(formData.goalDetails).forEach(([key, value]) => {
      if (value.trim().length > 0) filled.add(key);
    });
    setFilledGoals(filled);
  }, [formData.goalDetails]);
  
  useEffect(() => {
    if (visible) {
      setShowIntro(true);
      setCurrentStep(0);
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);
  
  const currentQuestion = QUESTIONS[currentStep] || QUESTIONS[0];
  const progress = ((currentStep + 1) / QUESTIONS.length) * 100;
  
  // Check if current question is answered - ALL goals must be filled
  const isCurrentQuestionAnswered = () => {
    if (!currentQuestion) return false;
    
    if (currentQuestion.isGoalDetails) {
      // ALL goals must have details
      const goalValues = Object.values(formData.goalDetails);
      return goalValues.length > 0 && goalValues.every(v => v.trim().length > 0);
    }
    
    // Weekly schedule is optional - always considered answered
    if (currentQuestion.isWeeklySchedule) {
      return true;
    }
    
    const value = (formData as any)[currentQuestion.id] || '';
    return value.trim().length > 0;
  };
  
  // Check how many goals are remaining
  const remainingGoals = userGoals.length - filledGoals.size;
  
  const handleNext = () => {
    if (!isCurrentQuestionAnswered()) {
      if (currentQuestion.isGoalDetails) {
        Alert.alert(
          'Complete All Goals',
          `Please fill in details for all ${userGoals.length} goals. You have ${remainingGoals} remaining - scroll down to see them all.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Please Answer',
          'Please provide an answer before continuing.',
          [{ text: 'OK' }]
        );
      }
      return;
    }
    
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };
  
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      confirmExit();
    }
  };
  
  const confirmExit = () => {
    Alert.alert(
      'Leave Questionnaire?',
      'Are you sure you want to leave? You can complete this later from your Profile settings.',
      [
        { text: 'Stay', style: 'cancel' },
        { 
          text: 'Leave', 
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.setItem('advancedQuestionnaireSkipped', 'true');
            onClose();
          }
        },
      ]
    );
  };
  
  const handleDecline = async () => {
    await AsyncStorage.setItem('advancedQuestionnaireSkipped', 'true');
    onClose();
  };
  
  const handleComplete = async () => {
    const completeData = {
      ...formData,
      completedAt: new Date().toISOString(),
    };
    
    await AsyncStorage.setItem('advancedQuestionnaire', JSON.stringify(completeData));
    await AsyncStorage.removeItem('advancedQuestionnaireSkipped');
    
    try {
      await fetch(`${API_BASE_URL}/api/user/advanced-questionnaire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(completeData),
        credentials: 'include',
      });
    } catch (error) {
      console.log('Could not sync questionnaire to backend');
    }
    
    onComplete(completeData);
  };
  
  const updateFormData = (key: string, value: string, goalKey?: string) => {
    if (key === 'goalDetails' && goalKey) {
      setFormData(prev => ({
        ...prev,
        goalDetails: {
          ...prev.goalDetails,
          [goalKey]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [key]: value,
      }));
    }
  };
  
  const renderTextInput = (key: string, placeholder: string, goalKey?: string) => {
    const value = goalKey ? formData.goalDetails[goalKey] || '' : (formData as any)[key] || '';
    
    const handleVoiceTranscription = (text: string) => {
      updateFormData(key, text, goalKey);
    };
    
    return (
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder={placeholder}
          placeholderTextColor={COLORS.mediumGray}
          value={value}
          onChangeText={(text) => updateFormData(key, text, goalKey)}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        <VoiceRecorderButton 
          onTranscription={handleVoiceTranscription}
          goalKey={goalKey}
        />
      </View>
    );
  };
  
  const renderGoalDetails = () => {
    return (
      <View style={styles.goalsContainer}>
        {/* Scroll hint at top */}
        <View style={styles.scrollHintTop}>
          <Ionicons name="information-circle" size={16} color={COLORS.accent} />
          <Text style={styles.scrollHintText}>
            Complete all {userGoals.length} goals below • {filledGoals.size}/{userGoals.length} done
          </Text>
        </View>
        
        {userGoals.map((goal: string, index: number) => {
          const isFilled = filledGoals.has(goal);
          return (
            <View key={goal} style={[styles.goalItem, isFilled && styles.goalItemFilled]}>
              <View style={styles.goalHeader}>
                <View style={[styles.goalNumber, isFilled && styles.goalNumberFilled]}>
                  {isFilled ? (
                    <View style={styles.goalCheckmark}>
                      <Ionicons name="checkmark" size={14} color={COLORS.white} />
                    </View>
                  ) : (
                    <LinearGradient
                      colors={[COLORS.accent, COLORS.accentSecondary]}
                      style={styles.goalNumberGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.goalNumberText}>{index + 1}</Text>
                    </LinearGradient>
                  )}
                </View>
                <Text style={styles.goalLabel}>{goal}</Text>
                {isFilled && (
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                )}
              </View>
              {renderTextInput('goalDetails', `Tell us more about your "${goal}" goal...`, goal)}
            </View>
          );
        })}
        
        {/* Scroll hint at bottom if not all filled */}
        {remainingGoals > 0 && (
          <View style={styles.scrollHintBottom}>
            <Ionicons name="arrow-up" size={16} color={COLORS.accent} />
            <Text style={styles.scrollHintText}>
              {remainingGoals} goal{remainingGoals > 1 ? 's' : ''} remaining above
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Phase 8.5: Weekly Schedule & Training Style
  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const SPLIT_OPTIONS = [
    { value: 'coach_choice', label: 'Let the coach choose (recommended)' },
    { value: 'upper_lower_full', label: 'Upper / Lower / Full (3 days)' },
    { value: 'full_body', label: 'Full Body (2-4 days)' },
    { value: 'push_pull_legs', label: 'Push / Pull / Legs' },
    { value: 'bro_split', label: 'Bro Split (1 muscle/day)' },
    { value: 'strength', label: 'Strength-focused (low reps)' },
    { value: 'endurance', label: 'Endurance / Conditioning' },
    { value: 'other', label: 'Other' },
  ];

  const addWeeklyActivity = () => {
    if (!newActivity.name.trim()) return;
    setFormData(prev => ({
      ...prev,
      weeklyActivities: [...(prev.weeklyActivities || []), { ...newActivity }],
    }));
    setNewActivity({ name: '', dayOfWeek: 1, timeWindow: 'evening', intensity: 'moderate' });
  };

  const removeWeeklyActivity = (index: number) => {
    setFormData(prev => ({
      ...prev,
      weeklyActivities: (prev.weeklyActivities || []).filter((_, i) => i !== index),
    }));
  };

  const toggleGymDay = (day: number) => {
    setFormData(prev => {
      const current = prev.gymDaysAvailable || [];
      const updated = current.includes(day)
        ? current.filter(d => d !== day)
        : [...current, day].sort();
      return { ...prev, gymDaysAvailable: updated };
    });
  };

  const renderWeeklySchedule = () => (
    <View style={styles.weeklyScheduleContainer}>
      {/* Section 1: Fixed Activities */}
      <View style={styles.scheduleSection}>
        <Text style={styles.scheduleSectionTitle}>Fixed Weekly Activities</Text>
        <Text style={styles.scheduleSectionHint}>
          Any classes, sports, or commitments that affect your training?
        </Text>
        
        {/* Existing activities */}
        {(formData.weeklyActivities || []).map((act, idx) => (
          <View key={idx} style={styles.activityItem}>
            <View style={styles.activityInfo}>
              <Text style={styles.activityName}>{act.name}</Text>
              <Text style={styles.activityDetail}>
                {DAY_NAMES[act.dayOfWeek]} {act.timeWindow} • {act.intensity}
              </Text>
            </View>
            <TouchableOpacity onPress={() => removeWeeklyActivity(idx)}>
              <Ionicons name="close-circle" size={22} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        ))}
        
        {/* Add new activity */}
        <View style={styles.addActivityRow}>
          <TextInput
            style={styles.activityInput}
            placeholder="e.g., Boxing, HIIT class"
            placeholderTextColor={COLORS.mediumGray}
            value={newActivity.name}
            onChangeText={(text) => setNewActivity(prev => ({ ...prev, name: text }))}
          />
          <View style={styles.activityOptions}>
            <TouchableOpacity 
              style={styles.dayPicker}
              onPress={() => setNewActivity(prev => ({ 
                ...prev, 
                dayOfWeek: (prev.dayOfWeek + 1) % 7 
              }))}
            >
              <Text style={styles.dayPickerText}>{DAY_NAMES[newActivity.dayOfWeek]}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.intensityPicker}
              onPress={() => {
                const intensities: ('low' | 'moderate' | 'hard')[] = ['low', 'moderate', 'hard'];
                const idx = intensities.indexOf(newActivity.intensity);
                setNewActivity(prev => ({ ...prev, intensity: intensities[(idx + 1) % 3] }));
              }}
            >
              <Text style={[styles.intensityText, { 
                color: newActivity.intensity === 'hard' ? COLORS.danger : 
                       newActivity.intensity === 'moderate' ? COLORS.accent : COLORS.success 
              }]}>
                {newActivity.intensity}
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.addActivityBtn} onPress={addWeeklyActivity}>
            <Ionicons name="add" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Section 2: Gym Days Available */}
      <View style={styles.scheduleSection}>
        <Text style={styles.scheduleSectionTitle}>Which days can you train?</Text>
        <View style={styles.daysRow}>
          {DAY_NAMES.map((day, idx) => (
            <TouchableOpacity
              key={day}
              style={[
                styles.dayChip,
                (formData.gymDaysAvailable || []).includes(idx) && styles.dayChipSelected
              ]}
              onPress={() => toggleGymDay(idx)}
            >
              <Text style={[
                styles.dayChipText,
                (formData.gymDaysAvailable || []).includes(idx) && styles.dayChipTextSelected
              ]}>
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Flexibility toggle */}
        <TouchableOpacity 
          style={styles.flexibilityRow}
          onPress={() => setFormData(prev => ({ 
            ...prev, 
            scheduleFlexibility: !prev.scheduleFlexibility 
          }))}
        >
          <Ionicons 
            name={formData.scheduleFlexibility ? 'checkbox' : 'square-outline'} 
            size={22} 
            color={COLORS.accent} 
          />
          <Text style={styles.flexibilityText}>My schedule changes week-to-week</Text>
        </TouchableOpacity>
      </View>

      {/* Section 3: Preferred Split */}
      <View style={styles.scheduleSection}>
        <Text style={styles.scheduleSectionTitle}>Preferred Training Split</Text>
        <Text style={styles.scheduleSectionHint}>Optional - let us know if you prefer a specific style</Text>
        
        <View style={styles.splitOptions}>
          {SPLIT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.splitOption,
                formData.preferredSplit === option.value && styles.splitOptionSelected
              ]}
              onPress={() => setFormData(prev => ({ ...prev, preferredSplit: option.value }))}
            >
              <Ionicons 
                name={formData.preferredSplit === option.value ? 'radio-button-on' : 'radio-button-off'} 
                size={18} 
                color={formData.preferredSplit === option.value ? COLORS.accent : COLORS.mediumGray} 
              />
              <Text style={[
                styles.splitOptionText,
                formData.preferredSplit === option.value && styles.splitOptionTextSelected
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {formData.preferredSplit === 'other' && (
          <TextInput
            style={styles.otherSplitInput}
            placeholder="Describe your preferred split..."
            placeholderTextColor={COLORS.mediumGray}
            value={formData.preferredSplitOther || ''}
            onChangeText={(text) => setFormData(prev => ({ ...prev, preferredSplitOther: text }))}
          />
        )}
      </View>
    </View>
  );
  
  // Intro screen
  const renderIntro = () => (
    <View style={styles.introContainer}>
      <View style={styles.introIconContainer}>
        <LinearGradient
          colors={[COLORS.accent, COLORS.accentSecondary]}
          style={styles.introIconGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="sparkles" size={40} color={COLORS.white} />
        </LinearGradient>
      </View>
      
      <Text style={styles.introTitle}>Advanced Questionnaire</Text>
      <Text style={styles.introSubtitle}>
        Take a few minutes to help your AI coach understand you better
      </Text>
      
      <View style={styles.introBenefits}>
        <View style={styles.benefitRow}>
          <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
          <Text style={styles.benefitText}>Workouts tailored to YOUR preferences</Text>
        </View>
        <View style={styles.benefitRow}>
          <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
          <Text style={styles.benefitText}>Focus on your specific weak areas</Text>
        </View>
        <View style={styles.benefitRow}>
          <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
          <Text style={styles.benefitText}>More of what you enjoy, less of what you don't</Text>
        </View>
        <View style={styles.benefitRow}>
          <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
          <Text style={styles.benefitText}>Training aligned with your goals & deadlines</Text>
        </View>
      </View>
      
      <View style={styles.introButtons}>
        <TouchableOpacity
          style={styles.yesButton}
          onPress={() => setShowIntro(false)}
        >
          <LinearGradient
            colors={[COLORS.accent, COLORS.accentSecondary]}
            style={styles.yesGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="sparkles" size={20} color={COLORS.white} />
            <Text style={styles.yesButtonText}>Yes, Let's Do It!</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.noButton}
          onPress={handleDecline}
        >
          <Text style={styles.noButtonText}>Skip for now</Text>
          <Text style={styles.noButtonSubtext}>Your AI coach will have limited personalization</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
  // Main questionnaire content
  const renderQuestionnaire = () => {
    if (!currentQuestion) {
      return (
        <View style={{ padding: 40, alignItems: 'center' }}>
          <Text>Loading question...</Text>
        </View>
      );
    }
    
    return (
    <>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.accent, COLORS.accentSecondary]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity style={styles.closeButton} onPress={confirmExit}>
          <Ionicons name="close" size={24} color={COLORS.white} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Advanced Questionnaire</Text>
          <Text style={styles.headerSubtitle}>
            Help us create your perfect workout plan
          </Text>
        </View>
        
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {currentStep + 1} of {QUESTIONS.length}
          </Text>
        </View>
      </LinearGradient>
      
      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        {/* Question */}
        <View style={styles.questionContainer}>
          <View style={styles.questionIcon}>
            <LinearGradient
              colors={[`${COLORS.accent}20`, `${COLORS.accentSecondary}20`]}
              style={styles.questionIconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons
                name={(currentQuestion.icon || 'help-circle') as any}
                size={32}
                color={COLORS.accent}
              />
            </LinearGradient>
          </View>
          <Text style={styles.questionTitle}>{currentQuestion.title || 'Question'}</Text>
          <Text style={styles.questionText}>{currentQuestion.question || ''}</Text>
          {currentQuestion.hint ? (
            <View style={styles.hintBadge}>
              <Ionicons name="bulb" size={14} color={COLORS.accent} />
              <Text style={styles.questionHint}>{currentQuestion.hint}</Text>
            </View>
          ) : null}
        </View>
        
        {/* Input Area */}
        {currentQuestion.isGoalDetails ? (
          renderGoalDetails()
        ) : currentQuestion.isWeeklySchedule ? (
          renderWeeklySchedule()
        ) : (
          renderTextInput(currentQuestion.id, currentQuestion.placeholder || 'Type your answer...')
        )}
        
        {/* Voice Hint */}
        <View style={styles.hintContainer}>
          <Ionicons name="mic-outline" size={16} color={COLORS.mediumGray} />
          <Text style={styles.hintText}>
            Tap each microphone to speak your answer
          </Text>
        </View>
      </ScrollView>
      
      {/* Footer Buttons */}
      <View style={styles.footer}>
        {/* Progress indicator for goals */}
        {currentQuestion.isGoalDetails && (
          <View style={styles.goalsProgressBar}>
            <Text style={styles.goalsProgressText}>
              {filledGoals.size}/{userGoals.length} goals completed
            </Text>
            <View style={styles.goalsProgressTrack}>
              <View 
                style={[
                  styles.goalsProgressFill, 
                  { width: `${(filledGoals.size / userGoals.length) * 100}%` }
                ]} 
              />
            </View>
          </View>
        )}
        
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={20} color={COLORS.accent} />
            <Text style={styles.backButtonText}>
              {currentStep === 0 ? 'Exit' : 'Back'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.nextButton, !isCurrentQuestionAnswered() && styles.nextButtonDisabled]} 
            onPress={handleNext}
          >
            <LinearGradient
              colors={isCurrentQuestionAnswered() 
                ? [COLORS.accent, COLORS.accentSecondary]
                : [COLORS.mediumGray, COLORS.mediumGray]
              }
              style={styles.nextGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.nextButtonText}>
                {currentStep === QUESTIONS.length - 1 ? 'Complete' : 'Next'}
              </Text>
              <Ionicons
                name={currentStep === QUESTIONS.length - 1 ? 'checkmark' : 'arrow-forward'}
                size={20}
                color={COLORS.white}
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </>
  )};
  
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={confirmExit}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <Animated.View
            style={[
              styles.container,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {showIntro ? renderIntro() : renderQuestionnaire()}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxHeight: '92%',
    backgroundColor: COLORS.white,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  // Intro styles
  introContainer: {
    padding: 32,
    alignItems: 'center',
  },
  introIconContainer: {
    marginBottom: 24,
  },
  introIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  introSubtitle: {
    fontSize: 15,
    color: COLORS.mediumGray,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  introBenefits: {
    width: '100%',
    marginBottom: 32,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  introButtons: {
    width: '100%',
    gap: 12,
  },
  yesButton: {
    width: '100%',
  },
  yesGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
  },
  yesButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.white,
  },
  noButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  noButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.mediumGray,
  },
  noButtonSubtext: {
    fontSize: 12,
    color: COLORS.mediumGray,
    marginTop: 4,
    opacity: 0.7,
  },
  // Header styles
  header: {
    padding: 24,
    paddingTop: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  headerContent: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
  },
  // Content styles
  content: {
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 250,
  },
  contentInner: {
    padding: 24,
    paddingBottom: 32,
  },
  questionContainer: {
    alignItems: 'center',
    marginBottom: 24,
    minHeight: 100,
  },
  questionIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 20,
    overflow: 'hidden',
  },
  questionIconGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  questionText: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  hintBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.accent}10`,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
    gap: 6,
  },
  questionHint: {
    fontSize: 13,
    color: COLORS.accent,
    fontWeight: '500',
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  textInput: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 16,
    padding: 16,
    paddingRight: 56,
    fontSize: 15,
    color: COLORS.text,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  voiceButton: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  voiceButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceButtonRecording: {
    backgroundColor: COLORS.danger,
  },
  goalsContainer: {
    gap: 16,
  },
  scrollHintTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${COLORS.accent}10`,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 8,
  },
  scrollHintBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  scrollHintText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.accent,
  },
  goalItem: {
    marginBottom: 4,
    padding: 12,
    backgroundColor: COLORS.lightGray,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  goalItemFilled: {
    borderColor: COLORS.success,
    backgroundColor: `${COLORS.success}08`,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  goalNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  goalNumberFilled: {
    backgroundColor: COLORS.success,
  },
  goalCheckmark: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.success,
  },
  goalNumberGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalNumberText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
  },
  goalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  hintText: {
    fontSize: 13,
    color: COLORS.mediumGray,
  },
  // Footer styles
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  goalsProgressBar: {
    marginBottom: 16,
  },
  goalsProgressText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.accent,
    marginBottom: 8,
    textAlign: 'center',
  },
  goalsProgressTrack: {
    height: 6,
    backgroundColor: COLORS.lightGray,
    borderRadius: 3,
    overflow: 'hidden',
  },
  goalsProgressFill: {
    height: '100%',
    backgroundColor: COLORS.success,
    borderRadius: 3,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.accent,
    backgroundColor: COLORS.white,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.accent,
  },
  nextButton: {
    flex: 1,
  },
  nextButtonDisabled: {
    opacity: 0.7,
  },
  nextGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  // Phase 8.5: Weekly Schedule styles
  weeklyScheduleContainer: {
    gap: 20,
  },
  scheduleSection: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  scheduleSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  scheduleSectionHint: {
    fontSize: 12,
    color: COLORS.mediumGray,
    marginBottom: 4,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.lightGray,
    padding: 10,
    borderRadius: 8,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  activityDetail: {
    fontSize: 12,
    color: COLORS.mediumGray,
  },
  addActivityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activityInput: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: COLORS.text,
  },
  activityOptions: {
    flexDirection: 'row',
    gap: 6,
  },
  dayPicker: {
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
  },
  dayPickerText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.accent,
  },
  intensityPicker: {
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 6,
  },
  intensityText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  addActivityBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  dayChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.lightGray,
  },
  dayChipSelected: {
    backgroundColor: COLORS.accent,
  },
  dayChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  dayChipTextSelected: {
    color: COLORS.white,
  },
  flexibilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  flexibilityText: {
    fontSize: 13,
    color: COLORS.text,
  },
  splitOptions: {
    gap: 6,
  },
  splitOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
  },
  splitOptionSelected: {
    backgroundColor: `${COLORS.accent}15`,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  splitOptionText: {
    fontSize: 13,
    color: COLORS.text,
  },
  splitOptionTextSelected: {
    color: COLORS.accent,
    fontWeight: '600',
  },
  otherSplitInput: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: COLORS.text,
    marginTop: 8,
  },
});
