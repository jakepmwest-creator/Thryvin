import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput as RNTextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth-store';

const COLORS = {
  accent: '#a259ff',
  accentSecondary: '#3a86ff',
  white: '#ffffff',
  text: '#222222',
  lightGray: '#F8F9FA',
  mediumGray: '#8E8E93',
  shadow: 'rgba(162, 89, 255, 0.1)',
};

// Onboarding questions configuration
const ONBOARDING_STEPS = [
  {
    id: 'name',
    title: 'Welcome to Thryvin! 👋',
    subtitle: 'First things first...',
    fields: [
      { key: 'name', label: 'What should we call you?', icon: 'person-outline', type: 'text', placeholder: 'Your name' },
    ],
  },
  {
    id: 'personal',
    title: 'Personal Details',
    subtitle: 'Help us personalize your journey',
    fields: [
      { key: 'age', label: 'Age', icon: 'calendar-outline', type: 'number', placeholder: 'e.g., 25' },
      { key: 'height', label: 'Height (cm)', icon: 'resize-outline', type: 'number', placeholder: 'e.g., 175' },
      { key: 'weight', label: 'Weight (kg)', icon: 'scale-outline', type: 'number', placeholder: 'e.g., 70' },
    ],
  },
  {
    id: 'experience',
    title: 'Fitness Experience',
    subtitle: 'Tell us about your fitness background',
    type: 'select',
    field: 'experience',
    icon: 'barbell-outline',
    options: [
      { value: 'beginner', label: 'Beginner', subtitle: 'New to working out' },
      { value: 'intermediate', label: 'Intermediate', subtitle: '6+ months experience' },
      { value: 'advanced', label: 'Advanced', subtitle: '2+ years experience' },
    ],
  },
  {
    id: 'goal',
    title: 'Primary Goal',
    subtitle: 'What do you want to achieve?',
    type: 'select',
    field: 'goal',
    icon: 'trophy-outline',
    options: [
      { value: 'weight_loss', label: 'Weight Loss', subtitle: 'Burn fat and get lean' },
      { value: 'muscle_gain', label: 'Muscle Gain', subtitle: 'Build strength and size' },
      { value: 'endurance', label: 'Endurance', subtitle: 'Improve stamina' },
      { value: 'general_fitness', label: 'General Fitness', subtitle: 'Stay healthy and active' },
    ],
  },
  {
    id: 'equipment',
    title: 'Available Equipment',
    subtitle: 'What do you have access to?',
    type: 'select',
    field: 'equipment',
    icon: 'fitness-outline',
    options: [
      { value: 'gym', label: 'Full Gym', subtitle: 'Access to gym equipment' },
      { value: 'home', label: 'Home Equipment', subtitle: 'Dumbbells, bands, etc.' },
      { value: 'bodyweight', label: 'Bodyweight Only', subtitle: 'No equipment needed' },
    ],
  },
  {
    id: 'frequency',
    title: 'Training Frequency',
    subtitle: 'How many days per week?',
    type: 'select',
    field: 'trainingDays',
    icon: 'calendar-outline',
    options: [
      { value: '3', label: '3 Days/Week', subtitle: 'Good for beginners' },
      { value: '4', label: '4 Days/Week', subtitle: 'Balanced approach' },
      { value: '5', label: '5 Days/Week', subtitle: 'Dedicated training' },
      { value: '6', label: '6 Days/Week', subtitle: 'High commitment' },
    ],
  },
  {
    id: 'duration',
    title: 'Session Duration',
    subtitle: 'How long per workout?',
    type: 'select',
    field: 'sessionDuration',
    icon: 'time-outline',
    options: [
      { value: '30', label: '30 Minutes', subtitle: 'Quick sessions' },
      { value: '45', label: '45 Minutes', subtitle: 'Standard length' },
      { value: '60', label: '60 Minutes', subtitle: 'Extended training' },
    ],
  },
  {
    id: 'injuries',
    title: 'Injuries or Limitations',
    subtitle: 'Any physical concerns?',
    fields: [
      { key: 'injuries', label: 'Injuries or Limitations', icon: 'medical-outline', type: 'text', placeholder: 'e.g., Lower back pain, knee injury (or "None")' },
    ],
  },
  {
    id: 'coaching',
    title: 'Coaching Style',
    subtitle: 'How would you like to be coached?',
    type: 'select',
    field: 'coachingStyle',
    icon: 'megaphone-outline',
    options: [
      { value: 'motivational', label: 'Motivational', subtitle: 'Energetic and encouraging' },
      { value: 'technical', label: 'Technical', subtitle: 'Detailed and precise' },
      { value: 'balanced', label: 'Balanced', subtitle: 'Mix of both styles' },
    ],
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<any>({
    name: '',
    age: '',
    height: '',
    weight: '',
    experience: '',
    goal: '',
    equipment: '',
    trainingDays: '',
    sessionDuration: '',
    injuries: '',
    coachingStyle: '',
  });

  const currentStepData = ONBOARDING_STEPS[currentStep];
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  const handleNext = () => {
    // Validate current step
    if (currentStepData.type === 'select') {
      if (!formData[currentStepData.field]) {
        Alert.alert('Required', 'Please select an option to continue');
        return;
      }
    } else if (currentStepData.fields) {
      const allFilled = currentStepData.fields.every(field => formData[field.key]);
      if (!allFilled) {
        Alert.alert('Required', 'Please fill in all fields to continue');
        return;
      }
    }

    if (currentStep < ONBOARDING_STEPS.length - 1) {
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

  const handleComplete = async () => {
    try {
      // Get registration data from navigation params or state
      const userData = {
        ...formData,
        // These should come from the register screen
        name: 'User', // This will be passed from register screen
        email: 'user@example.com', // This will be passed from register screen
        password: 'password', // This will be passed from register screen
      };

      await register(userData);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Error', 'Failed to complete onboarding');
    }
  };

  const renderSelectOptions = () => {
    if (currentStepData.type !== 'select' || !currentStepData.options) return null;

    return (
      <View style={styles.optionsContainer}>
        {currentStepData.options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionCard,
              formData[currentStepData.field] === option.value && styles.optionCardSelected,
            ]}
            onPress={() => setFormData({ ...formData, [currentStepData.field]: option.value })}
          >
            <View style={styles.optionContent}>
              <Text style={[
                styles.optionLabel,
                formData[currentStepData.field] === option.value && styles.optionLabelSelected,
              ]}>
                {option.label}
              </Text>
              <Text style={[
                styles.optionSubtitle,
                formData[currentStepData.field] === option.value && styles.optionSubtitleSelected,
              ]}>
                {option.subtitle}
              </Text>
            </View>
            {formData[currentStepData.field] === option.value && (
              <Ionicons name="checkmark-circle" size={24} color={COLORS.accent} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderInputFields = () => {
    if (!currentStepData.fields) return null;

    return (
      <View style={styles.fieldsContainer}>
        {currentStepData.fields.map((field) => (
          <View key={field.key} style={styles.inputWrapper}>
            <Ionicons name={field.icon as any} size={20} color={COLORS.accent} style={styles.inputIcon} />
            <RNTextInput
              style={styles.input}
              placeholder={field.placeholder}
              placeholderTextColor={COLORS.mediumGray}
              value={formData[field.key]}
              onChangeText={(text) => setFormData({ ...formData, [field.key]: text })}
              keyboardType={field.type === 'number' ? 'numeric' : 'default'}
              multiline={field.type === 'text'}
            />
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <LinearGradient
              colors={[COLORS.accent, COLORS.accentSecondary]}
              style={[styles.progressFill, { width: `${progress}%` }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
          <Text style={styles.progressText}>
            Step {currentStep + 1} of {ONBOARDING_STEPS.length}
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name={currentStepData.icon as any} size={32} color={COLORS.accent} />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>{currentStepData.title}</Text>
          <Text style={styles.subtitle}>{currentStepData.subtitle}</Text>

          {/* Content */}
          {currentStepData.type === 'select' ? renderSelectOptions() : renderInputFields()}
        </ScrollView>

        {/* Navigation Buttons */}
        <View style={styles.navigationContainer}>
          {currentStep > 0 && (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={20} color={COLORS.accent} />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.nextButton, currentStep === 0 && styles.nextButtonFull]}
            onPress={handleNext}
            disabled={isLoading}
          >
            <LinearGradient
              colors={[COLORS.accent, COLORS.accentSecondary]}
              style={styles.gradientButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.nextButtonText}>
                {currentStep === ONBOARDING_STEPS.length - 1 ? 'Complete' : 'Next'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  keyboardView: {
    flex: 1,
  },
  progressContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.lightGray,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.mediumGray,
    textAlign: 'center',
    fontWeight: '500',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${COLORS.accent}10`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.mediumGray,
    textAlign: 'center',
    marginBottom: 32,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.lightGray,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
  },
  optionCardSelected: {
    borderColor: COLORS.accent,
    backgroundColor: `${COLORS.accent}05`,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  optionLabelSelected: {
    color: COLORS.accent,
  },
  optionSubtitle: {
    fontSize: 14,
    color: COLORS.mediumGray,
  },
  optionSubtitleSelected: {
    color: COLORS.accent,
  },
  fieldsContainer: {
    gap: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    paddingVertical: 18,
  },
  navigationContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.accent,
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.accent,
  },
  nextButton: {
    flex: 1,
    borderRadius: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  nextButtonFull: {
    flex: 1,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});
