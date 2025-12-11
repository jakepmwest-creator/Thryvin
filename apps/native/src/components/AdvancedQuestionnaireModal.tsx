import React, { useState, useEffect } from 'react';
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

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://thryvin-explore.preview.emergentagent.com';

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
  },
  {
    id: 'goalDetails',
    title: 'Goal Details',
    question: 'Describe your existing goals in more detail',
    placeholder: 'Tell us more about what you want to achieve...',
    icon: 'trophy',
    isGoalDetails: true,
  },
  {
    id: 'enjoyedTraining',
    title: 'What You Enjoy',
    question: 'What types of training do you enjoy?',
    placeholder: 'e.g., Weight lifting, running, yoga, swimming, HIIT...',
    icon: 'heart',
  },
  {
    id: 'dislikedTraining',
    title: 'What You Don\'t Enjoy',
    question: 'What types of training do you NOT enjoy?',
    placeholder: 'e.g., Cardio, burpees, stretching...',
    icon: 'thumbs-down',
  },
  {
    id: 'weakAreas',
    title: 'Weak Areas',
    question: 'Do you have any weak areas you specifically want to work on?',
    placeholder: 'e.g., My biceps are lacking, need more core strength...',
    icon: 'fitness',
  },
  {
    id: 'additionalInfo',
    title: 'Anything Else',
    question: 'Is there anything else you would like your coach to know about you for the best results?',
    placeholder: 'Any other information that could help us create the perfect workout plan...',
    icon: 'chatbubble-ellipses',
  },
];

export const AdvancedQuestionnaireModal = ({
  visible,
  onClose,
  onComplete,
}: AdvancedQuestionnaireModalProps) => {
  const { user } = useAuthStore();
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
  }, [visible, currentStep]);
  
  const currentQuestion = QUESTIONS[currentStep];
  const progress = ((currentStep + 1) / QUESTIONS.length) * 100;
  
  const handleVoiceInput = async () => {
    // TODO: Implement voice input using the transcription API
    setIsRecording(!isRecording);
    
    if (isRecording) {
      setIsTranscribing(true);
      // Simulate transcription
      setTimeout(() => {
        setIsTranscribing(false);
      }, 1500);
    }
  };
  
  const handleNext = () => {
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };
  
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleSkip = async () => {
    // Save that user skipped - can complete later
    await AsyncStorage.setItem('advancedQuestionnaireSkipped', 'true');
    onClose();
  };
  
  const handleComplete = async () => {
    const completeData = {
      ...formData,
      completedAt: new Date().toISOString(),
    };
    
    // Save to AsyncStorage
    await AsyncStorage.setItem('advancedQuestionnaire', JSON.stringify(completeData));
    await AsyncStorage.removeItem('advancedQuestionnaireSkipped');
    
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
          {isTranscribing ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Ionicons
              name={isRecording ? 'stop' : 'mic'}
              size={20}
              color={COLORS.white}
            />
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
                <Text style={styles.goalNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.goalLabel}>{goal}</Text>
            </View>
            {renderTextInput('goalDetails', `Tell us more about your "${goal}" goal...`, goal)}
          </View>
        ))}
      </View>
    );
  };
  
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
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
            {/* Header */}
            <LinearGradient
              colors={[COLORS.accent, COLORS.accentSecondary]}
              style={styles.header}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.headerContent}>
                <View style={styles.headerIconContainer}>
                  <Ionicons name="sparkles" size={24} color={COLORS.white} />
                </View>
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
                  <Ionicons
                    name={currentQuestion.icon as any}
                    size={28}
                    color={COLORS.accent}
                  />
                </View>
                <Text style={styles.questionTitle}>{currentQuestion.title}</Text>
                <Text style={styles.questionText}>{currentQuestion.question}</Text>
              </View>
              
              {/* Input Area */}
              {currentQuestion.isGoalDetails ? (
                renderGoalDetails()
              ) : (
                renderTextInput(currentQuestion.id, currentQuestion.placeholder)
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
                {currentStep > 0 ? (
                  <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                    <Ionicons name="arrow-back" size={20} color={COLORS.accent} />
                    <Text style={styles.backButtonText}>Back</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                    <Text style={styles.skipButtonText}>Skip for now</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                  <LinearGradient
                    colors={[COLORS.accent, COLORS.accentSecondary]}
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
    maxHeight: '90%',
    backgroundColor: COLORS.white,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    padding: 24,
    paddingTop: 28,
  },
  headerContent: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
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
  content: {
    flex: 1,
    maxHeight: 400,
  },
  contentInner: {
    padding: 24,
  },
  questionContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  questionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: `${COLORS.accent}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  questionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  questionText: {
    fontSize: 15,
    color: COLORS.mediumGray,
    textAlign: 'center',
    lineHeight: 22,
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
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.accent,
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
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.mediumGray,
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
