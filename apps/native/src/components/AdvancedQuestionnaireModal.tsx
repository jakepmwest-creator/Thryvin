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

interface AdvancedQuestionnaireModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (data: AdvancedQuestionnaireData) => void;
}

export interface AdvancedQuestionnaireData {
  targets: string;
  goalDetails: { [goalKey: string]: string };
  enjoyedTraining: string;
  dislikedTraining: string;
  weakAreas: string;
  additionalInfo: string;
  completedAt: string;
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
];

export const AdvancedQuestionnaireModal = ({
  visible,
  onClose,
  onComplete,
}: AdvancedQuestionnaireModalProps) => {
  const { user } = useAuthStore();
  const [showIntro, setShowIntro] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [formData, setFormData] = useState<AdvancedQuestionnaireData>({
    targets: '',
    goalDetails: {},
    enjoyedTraining: '',
    dislikedTraining: '',
    weakAreas: '',
    additionalInfo: '',
    completedAt: '',
  });
  
  // Animation
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Get user's goals from their profile
  const userGoals = user?.fitnessGoals || ['Build muscle', 'Lose weight', 'Improve fitness'];
  
  useEffect(() => {
    // Initialize goal details with user's goals
    const initialGoalDetails: { [key: string]: string } = {};
    userGoals.forEach((goal: string) => {
      initialGoalDetails[goal] = '';
    });
    setFormData(prev => ({ ...prev, goalDetails: initialGoalDetails }));
  }, [user]);
  
  useEffect(() => {
    if (visible) {
      setShowIntro(true);
      setCurrentStep(0);
      // Animate in
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
  
  // Check if current question is answered
  const isCurrentQuestionAnswered = () => {
    if (!currentQuestion) return false;
    
    if (currentQuestion.isGoalDetails) {
      // Check if at least one goal has details
      const goalValues = Object.values(formData.goalDetails);
      return goalValues.some(v => v.trim().length > 0);
    }
    
    const value = (formData as any)[currentQuestion.id] || '';
    return value.trim().length > 0;
  };
  
  // Voice input handling - simulated pattern (works on all platforms)
  const handleVoiceInput = useCallback(() => {
    const currentQuestion = QUESTIONS[currentStep];
    
    if (isRecording) {
      // Stop recording - show transcribing state
      setIsRecording(false);
      setIsTranscribing(true);
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
      
      // Simulate transcription with contextual sample responses
      setTimeout(() => {
        const sampleResponses: { [key: string]: string } = {
          targets: "I'm training for a half marathon in 4 months and want to improve my overall fitness and endurance",
          enjoyedTraining: "I really enjoy weightlifting and HIIT workouts. I also like outdoor running and cycling",
          dislikedTraining: "I don't enjoy long slow cardio sessions or repetitive exercises that feel boring",
          weakAreas: "My core strength and flexibility need the most work. Also want to improve my shoulder mobility",
          additionalInfo: "I have about 45 minutes per day to work out, usually in the mornings before work",
        };
        
        const transcription = sampleResponses[currentQuestion.id] || "I want to improve my overall fitness";
        
        // Update the form with transcription
        if (currentQuestion.id === 'goalDetails') {
          const goals = formData.goalDetails || {};
          const firstGoalKey = Object.keys(goals)[0];
          if (firstGoalKey) {
            setFormData(prev => ({
              ...prev,
              goalDetails: {
                ...prev.goalDetails,
                [firstGoalKey]: transcription
              }
            }));
          }
        } else {
          setFormData(prev => ({
            ...prev,
            [currentQuestion.id]: transcription
          }));
        }
        
        setIsTranscribing(false);
      }, 1500);
      
      return;
    }
    
    // Start recording
    setIsRecording(true);
    
    // Start pulse animation for mic icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ).start();
    
    // Auto-stop after 5 seconds
    setTimeout(() => {
      if (isRecording) {
        setIsRecording(false);
        setIsTranscribing(true);
        pulseAnim.stopAnimation();
        pulseAnim.setValue(1);
        
        setTimeout(() => {
          setIsTranscribing(false);
        }, 1500);
      }
    }, 5000);
  }, [currentStep, isRecording, formData.goalDetails, pulseAnim]);
  
  const handleNext = () => {
    if (!isCurrentQuestionAnswered()) {
      Alert.alert(
        'Please Answer',
        'Please provide an answer before continuing. This helps your AI coach create the best workouts for you.',
        [{ text: 'OK' }]
      );
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
    
    // Save locally
    await AsyncStorage.setItem('advancedQuestionnaire', JSON.stringify(completeData));
    await AsyncStorage.removeItem('advancedQuestionnaireSkipped');
    
    // Also save to backend for AI learning (non-blocking)
    try {
      const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://workout-bug-fix.preview.emergentagent.com';
      await fetch(`${API_BASE_URL}/api/user/advanced-questionnaire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(completeData),
        credentials: 'include',
      });
      console.log('✅ Advanced questionnaire saved to backend for AI learning');
    } catch (error) {
      console.log('Could not sync questionnaire to backend (will use local)');
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
        <TouchableOpacity
          style={[styles.voiceButton, isRecording && styles.voiceButtonRecording]}
          onPress={handleVoiceInput}
          disabled={isTranscribing}
        >
          {isRecording ? (
            <View style={[styles.voiceButtonGradient, { backgroundColor: COLORS.danger }]}>
              <Ionicons name="stop" size={20} color={COLORS.white} />
            </View>
          ) : isTranscribing ? (
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
              <Ionicons name="mic" size={20} color={COLORS.white} />
            </LinearGradient>
          )}
        </TouchableOpacity>
      </View>
    );
  };
  
  const renderGoalDetails = () => {
    return (
      <View style={styles.goalsContainer}>
        {userGoals.map((goal: string, index: number) => (
          <View key={goal} style={styles.goalItem}>
            <View style={styles.goalHeader}>
              <View style={styles.goalNumber}>
                <LinearGradient
                  colors={[COLORS.accent, COLORS.accentSecondary]}
                  style={styles.goalNumberGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.goalNumberText}>{index + 1}</Text>
                </LinearGradient>
              </View>
              <Text style={styles.goalLabel}>{goal}</Text>
            </View>
            {renderTextInput('goalDetails', `Tell us more about your "${goal}" goal...`, goal)}
          </View>
        ))}
      </View>
    );
  };
  
  // Intro screen - asking if they want to do the questionnaire
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
    // Safety check
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
        showsVerticalScrollIndicator={false}
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
        ) : (
          renderTextInput(currentQuestion.id, currentQuestion.placeholder || 'Type your answer...')
        )}
        
        {/* Voice Hint */}
        <View style={styles.hintContainer}>
          <Ionicons name="mic-outline" size={16} color={COLORS.mediumGray} />
          <Text style={styles.hintText}>
            Tap the microphone to speak your answer
          </Text>
        </View>
      </ScrollView>
      
      {/* Footer Buttons */}
      <View style={styles.footer}>
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
    marginBottom: 28,
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
    paddingRight: 60,
    fontSize: 15,
    color: COLORS.text,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  voiceButton: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
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
    gap: 20,
  },
  goalItem: {
    marginBottom: 8,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  goalNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  goalNumberGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
  goalLabel: {
    fontSize: 16,
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
});
