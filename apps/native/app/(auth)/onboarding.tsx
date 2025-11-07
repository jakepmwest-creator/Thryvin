import React, { useState, useRef, useEffect } from 'react';
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
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth-store';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  accent: '#a259ff',
  accentSecondary: '#3a86ff',
  white: '#ffffff',
  text: '#222222',
  lightGray: '#F8F9FA',
  mediumGray: '#8E8E93',
  shadow: 'rgba(162, 89, 255, 0.1)',
};

// AI Coach names database - matched by gender and style
const COACH_NAMES = {
  male: {
    motivational: ['Max Stone', 'Jake Powers', 'Ryan Steel', 'Marcus Blaze', 'Tyler Surge'],
    technical: ['Dr. Alex Form', 'Coach Bennett', 'Prof. Carter', 'Brandon Analytics', 'Kevin Precision'],
    disciplined: ['Commander Kane', 'Sgt. Marcus', 'Captain Ridge', 'Major Steel', 'Lt. Brooks'],
    balanced: ['Coach Jordan', 'Mike Balance', 'Sam Wilson', 'Chris Morgan', 'Dean Foster'],
  },
  female: {
    motivational: ['Luna Spark', 'Aria Power', 'Maya Blaze', 'Nova Strong', 'Stella Rise'],
    technical: ['Dr. Sarah Form', 'Coach Emma', 'Prof. Lisa', 'Dana Analytics', 'Kelly Precision'],
    disciplined: ['Captain Nova', 'Sgt. Riley', 'Major Storm', 'Lt. Phoenix', 'Commander Vale'],
    balanced: ['Coach Alex', 'Jamie Brooks', 'Casey Morgan', 'Taylor Wilson', 'Morgan Reed'],
  },
  other: {
    motivational: ['Sky Powers', 'Phoenix Rise', 'River Stone', 'Storm Surge', 'Ash Blaze'],
    technical: ['Dr. Jordan', 'Coach Taylor', 'Prof. Morgan', 'Casey Analytics', 'Riley Form'],
    disciplined: ['Captain Reed', 'Commander Sky', 'Major Phoenix', 'Lt. River', 'Sgt. Storm'],
    balanced: ['Coach Casey', 'Jamie Phoenix', 'Alex River', 'Taylor Brooks', 'Morgan Sky'],
  },
};

// Onboarding steps configuration - SPLIT FOR NO SCROLLING
const ONBOARDING_STEPS = [
  {
    id: 'name',
    title: 'Welcome to Thryvin! 👋',
    subtitle: 'First things first...',
    emoji: '✨',
    fields: [
      { key: 'name', label: 'What should we call you?', icon: 'person-outline', type: 'text', placeholder: 'Your name' },
    ],
  },
  {
    id: 'gender',
    title: 'A Little About You',
    subtitle: 'Help us personalize your experience',
    emoji: '👤',
    fields: [
      { key: 'gender', label: 'Gender', icon: 'people-outline', type: 'gender', placeholder: 'Select' },
    ],
  },
  {
    id: 'birthdate',
    title: 'Your Age',
    subtitle: 'When were you born?',
    emoji: '🎂',
    fields: [
      { key: 'dateOfBirth', label: 'Date of Birth', icon: 'calendar-outline', type: 'date', placeholder: 'Select your birth date' },
    ],
  },
  {
    id: 'measurements',
    title: 'Body Measurements',
    subtitle: 'This helps us tailor your workouts',
    emoji: '📏',
    fields: [
      { key: 'height', label: 'Height', icon: 'resize-outline', type: 'measurement', unit: 'height', placeholder: 'e.g., 175' },
      { key: 'weight', label: 'Weight', icon: 'scale-outline', type: 'measurement', unit: 'weight', placeholder: 'e.g., 70' },
    ],
  },
  {
    id: 'experience',
    title: 'Fitness Experience',
    subtitle: 'Tell us about your fitness background',
    emoji: '🏋️',
    type: 'select',
    field: 'experience',
    icon: 'barbell-outline',
    options: [
      { value: 'beginner', label: 'Beginner', subtitle: 'New to working out', emoji: '🌱' },
      { value: 'intermediate', label: 'Intermediate', subtitle: '6+ months experience', emoji: '💪' },
      { value: 'advanced', label: 'Advanced', subtitle: '2+ years experience', emoji: '🔥' },
    ],
  },
  {
    id: 'goal',
    title: 'Primary Goal',
    subtitle: 'What do you want to achieve?',
    emoji: '🎯',
    type: 'select',
    field: 'goal',
    icon: 'trophy-outline',
    options: [
      { value: 'weight_loss', label: 'Lose Weight', subtitle: 'Burn fat and get lean', emoji: '📉' },
      { value: 'muscle_gain', label: 'Gain Muscle', subtitle: 'Build strength and size', emoji: '💪' },
      { value: 'endurance', label: 'Build Endurance', subtitle: 'Improve stamina', emoji: '🏃' },
      { value: 'general_fitness', label: 'Stay Fit', subtitle: 'Health and wellness', emoji: '❤️' },
    ],
  },
  {
    id: 'equipment',
    title: 'Available Equipment',
    subtitle: 'What do you have access to?',
    emoji: '🏋️',
    type: 'select',
    field: 'equipment',
    icon: 'fitness-outline',
    options: [
      { value: 'gym', label: 'Full Gym Access', subtitle: 'All equipment available', emoji: '🏢' },
      { value: 'home', label: 'Home Equipment', subtitle: 'Dumbbells, bands, etc.', emoji: '🏠' },
      { value: 'bodyweight', label: 'Bodyweight Only', subtitle: 'No equipment needed', emoji: '🤸' },
    ],
  },
  {
    id: 'frequency',
    title: 'Training Frequency',
    subtitle: 'How many days per week?',
    emoji: '📅',
    type: 'select',
    field: 'trainingDays',
    icon: 'calendar-outline',
    options: [
      { value: '3', label: '3 Days/Week', subtitle: 'Great for beginners', emoji: '3️⃣' },
      { value: '4', label: '4 Days/Week', subtitle: 'Balanced approach', emoji: '4️⃣' },
      { value: '5', label: '5 Days/Week', subtitle: 'Dedicated training', emoji: '5️⃣' },
      { value: '6', label: '6 Days/Week', subtitle: 'High commitment', emoji: '6️⃣' },
    ],
  },
  {
    id: 'duration',
    title: 'Session Duration',
    subtitle: 'How long per workout?',
    emoji: '⏱️',
    type: 'select',
    field: 'sessionDuration',
    icon: 'time-outline',
    options: [
      { value: '30', label: '30 Minutes', subtitle: 'Quick sessions', emoji: '⚡' },
      { value: '45', label: '45 Minutes', subtitle: 'Standard length', emoji: '✨' },
      { value: '60', label: '60 Minutes', subtitle: 'Extended training', emoji: '💪' },
      { value: '60+', label: '60+ Minutes', subtitle: 'Marathon sessions', emoji: '🔥' },
    ],
  },
  {
    id: 'injuries',
    title: 'Injuries or Limitations',
    subtitle: 'Help us keep you safe',
    emoji: '🩹',
    fields: [
      { key: 'injuries', label: 'Any injuries or concerns?', icon: 'medical-outline', type: 'text', placeholder: 'e.g., Tennis elbow, or "None"' },
    ],
  },
  {
    id: 'coaching',
    title: 'Coaching Style',
    subtitle: 'How would you like to be coached?',
    emoji: '🎤',
    type: 'select',
    field: 'coachingStyle',
    icon: 'megaphone-outline',
    options: [
      { value: 'motivational', label: 'Motivational', subtitle: 'Energetic & encouraging', emoji: '🔥' },
      { value: 'technical', label: 'Technical', subtitle: 'Detailed & precise', emoji: '🎯' },
      { value: 'disciplined', label: 'Disciplined', subtitle: 'Strict & structured', emoji: '⚔️' },
      { value: 'balanced', label: 'Balanced', subtitle: 'Mix of everything', emoji: '⚖️' },
    ],
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formData, setFormData] = useState<any>({
    name: '',
    gender: '',
    dateOfBirth: null,
    height: '',
    weight: '',
    heightUnit: 'cm',
    weightUnit: 'kg',
    experience: '',
    goal: '',
    equipment: '',
    trainingDays: '',
    sessionDuration: '',
    injuries: '',
    coachingStyle: '',
  });

  // Animation values
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate in on step change
    slideAnim.setValue(50);
    fadeAnim.setValue(0);
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentStep]);

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
      const requiredFields = currentStepData.fields.filter(f => f.key !== 'injuries');
      const allFilled = requiredFields.every(field => formData[field.key]);
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
    } else {
      router.back();
    }
  };

  const handleComplete = () => {
    // Generate AI coach
    const gender = formData.gender || 'other';
    const style = formData.coachingStyle || 'balanced';
    const coachPool = COACH_NAMES[gender]?.[style] || COACH_NAMES.other.balanced;
    const coachName = coachPool[Math.floor(Math.random() * coachPool.length)];

    // Navigate to coach reveal screen
    router.push({
      pathname: '/(auth)/coach-reveal',
      params: {
        coachName,
        onboardingData: JSON.stringify(formData),
      },
    });
  };

  const renderGenderSelect = () => (
    <View style={styles.genderContainer}>
      {['Male', 'Female', 'Other'].map((option) => (
        <TouchableOpacity
          key={option}
          style={[
            styles.genderOption,
            formData.gender === option.toLowerCase() && styles.genderOptionSelected,
          ]}
          onPress={() => setFormData({ ...formData, gender: option.toLowerCase() })}
        >
          <Ionicons 
            name={
              option === 'Male' ? 'male' : 
              option === 'Female' ? 'female' : 
              'transgender'
            }
            size={24}
            color={formData.gender === option.toLowerCase() ? COLORS.white : COLORS.accent}
          />
          <Text style={[
            styles.genderText,
            formData.gender === option.toLowerCase() && styles.genderTextSelected
          ]}>
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderDatePicker = () => {
    const formatDate = (date: Date | null) => {
      if (!date) return null;
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    };

    return (
      <>
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => setShowDatePicker(true)}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="calendar-outline" size={20} color={COLORS.accent} />
          </View>
          <Text style={[
            styles.datePickerText,
            !formData.dateOfBirth && styles.placeholderText
          ]}>
            {formData.dateOfBirth ? formatDate(formData.dateOfBirth) : 'Select your birth date'}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={formData.dateOfBirth || new Date(2000, 0, 1)}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selectedDate) {
                setFormData({ ...formData, dateOfBirth: selectedDate });
              }
            }}
            maximumDate={new Date()}
            minimumDate={new Date(1940, 0, 1)}
          />
        )}
      </>
    );
  };

  const renderMeasurementField = (field: any) => {
    const unit = field.unit === 'height' ? formData.heightUnit : formData.weightUnit;
    const unitOptions = field.unit === 'height' ? ['cm', 'ft'] : ['kg', 'lbs'];

    return (
      <View style={styles.measurementContainer}>
        <View style={styles.measurementInput}>
          <Ionicons name={field.icon} size={20} color={COLORS.accent} style={{ marginRight: 12 }} />
          <RNTextInput
            style={styles.input}
            placeholder={field.placeholder}
            placeholderTextColor={COLORS.mediumGray}
            value={formData[field.key]}
            onChangeText={(value) => setFormData({ ...formData, [field.key]: value })}
            keyboardType="numeric"
          />
          <Text style={styles.unitLabel}>{unit}</Text>
        </View>
        <View style={styles.unitToggle}>
          {unitOptions.map((u) => (
            <TouchableOpacity
              key={u}
              style={[
                styles.unitButton,
                unit === u && styles.unitButtonActive,
              ]}
              onPress={() => {
                const unitKey = field.unit === 'height' ? 'heightUnit' : 'weightUnit';
                setFormData({ ...formData, [unitKey]: u });
              }}
            >
              <Text style={[
                styles.unitButtonText,
                unit === u && styles.unitButtonTextActive,
              ]}>
                {u}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderFields = () => {
    if (!currentStepData.fields) return null;

    return (
      <View style={styles.fieldsContainer}>
        {currentStepData.fields.map((field) => {
          if (field.type === 'gender') {
            return <View key={field.key}>{renderGenderSelect()}</View>;
          }
          if (field.type === 'date') {
            return (
              <View key={field.key} style={styles.fieldWrapper}>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                {renderDatePicker()}
              </View>
            );
          }
          if (field.type === 'measurement') {
            return (
              <View key={field.key} style={styles.fieldWrapper}>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                {renderMeasurementField(field)}
              </View>
            );
          }

          return (
            <View key={field.key} style={styles.inputWrapper}>
              <View style={styles.iconContainer}>
                <Ionicons name={field.icon as any} size={20} color={COLORS.accent} />
              </View>
              <RNTextInput
                style={styles.input}
                placeholder={field.placeholder}
                placeholderTextColor={COLORS.mediumGray}
                value={formData[field.key]}
                onChangeText={(value) => setFormData({ ...formData, [field.key]: value })}
                keyboardType={field.type === 'number' ? 'numeric' : 'default'}
                autoCapitalize={field.type === 'text' ? 'words' : 'none'}
              />
            </View>
          );
        })}
      </View>
    );
  };

  const renderSelectOptions = () => {
    if (currentStepData.type !== 'select' || !currentStepData.options) return null;

    return (
      <View style={styles.optionsContainer}>
        {currentStepData.options.map((option: any) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionCard,
              formData[currentStepData.field] === option.value && styles.optionCardSelected,
            ]}
            onPress={() => setFormData({ ...formData, [currentStepData.field]: option.value })}
          >
            <View style={styles.optionContent}>
              <View style={styles.optionIcon}>
                <Text style={styles.optionEmoji}>{option.emoji}</Text>
              </View>
              <View style={styles.optionText}>
                <Text style={[
                  styles.optionLabel,
                  formData[currentStepData.field] === option.value && styles.optionLabelSelected
                ]}>
                  {option.label}
                </Text>
                <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
              </View>
              {formData[currentStepData.field] === option.value && (
                <Ionicons name="checkmark-circle" size={28} color={COLORS.accent} />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Gradient Background */}
      <LinearGradient
        colors={[COLORS.accent, COLORS.accentSecondary, COLORS.white]}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <LinearGradient
              colors={[COLORS.accent, COLORS.accentSecondary]}
              style={[styles.progressBarFill, { width: `${progress}%` }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>
          <Text style={styles.progressText}>
            {currentStep + 1} of {ONBOARDING_STEPS.length}
          </Text>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Main Card */}
            <Animated.View
              style={[
                styles.card,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {/* Emoji Hero */}
              <Text style={styles.heroEmoji}>{currentStepData.emoji}</Text>

              {/* Title */}
              <Text style={styles.title}>{currentStepData.title}</Text>
              <Text style={styles.subtitle}>{currentStepData.subtitle}</Text>

              {/* Content */}
              {renderFields()}
              {renderSelectOptions()}

              {/* Navigation Buttons */}
              <View style={styles.buttonContainer}>
                {currentStep > 0 && (
                  <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                    <Ionicons name="arrow-back" size={20} color={COLORS.accent} />
                    <Text style={styles.backButtonText}>Back</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.nextButton, currentStep === 0 && styles.nextButtonFull]}
                  onPress={handleNext}
                >
                  <LinearGradient
                    colors={[COLORS.accent, COLORS.accentSecondary]}
                    style={styles.nextGradient}
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
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  progressBarContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '600',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 32,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 15,
  },
  heroEmoji: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.mediumGray,
    textAlign: 'center',
    marginBottom: 32,
    fontWeight: '500',
  },
  fieldsContainer: {
    marginBottom: 24,
  },
  fieldWrapper: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: `${COLORS.accent}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    paddingVertical: 16,
    fontWeight: '500',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  genderOption: {
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
  genderOptionSelected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  genderText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.accent,
  },
  genderTextSelected: {
    color: COLORS.white,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.lightGray,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  datePickerText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  measurementContainer: {
    marginBottom: 12,
  },
  measurementInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  unitLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.mediumGray,
    marginLeft: 8,
  },
  unitToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  unitButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    alignItems: 'center',
  },
  unitButtonActive: {
    borderColor: COLORS.accent,
    backgroundColor: `${COLORS.accent}10`,
  },
  unitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.mediumGray,
  },
  unitButtonTextActive: {
    color: COLORS.accent,
  },
  optionsContainer: {
    marginBottom: 24,
  },
  optionCard: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: COLORS.accent,
    backgroundColor: `${COLORS.accent}08`,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionEmoji: {
    fontSize: 28,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  optionLabelSelected: {
    color: COLORS.accent,
  },
  optionSubtitle: {
    fontSize: 13,
    color: COLORS.mediumGray,
    fontWeight: '500',
  },
  buttonContainer: {
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
    borderRadius: 16,
    overflow: 'hidden',
  },
  nextButtonFull: {
    flex: 2,
  },
  nextGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
});
