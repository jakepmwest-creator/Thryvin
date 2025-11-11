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

// Icon mapping for options
const OPTION_ICONS: any = {
  lose_weight: 'trending-down-outline',
  gain_muscle: 'fitness-outline',
  build_endurance: 'bicycle-outline',
  increase_flexibility: 'body-outline',
  improve_balance: 'scale-outline',
  get_toned: 'pulse-outline',
  athletic_performance: 'trophy-outline',
  general_health: 'heart-outline',
  improve_posture: 'person-outline',
  increase_energy: 'flash-outline',
  stress_relief: 'happy-outline',
  better_sleep: 'moon-outline',
  high_protein: 'restaurant-outline',
  low_carb: 'leaf-outline',
  balanced_macros: 'analytics-outline',
  calorie_deficit: 'remove-circle-outline',
  calorie_surplus: 'add-circle-outline',
  meal_prep: 'calendar-outline',
  vegetarian: 'nutrition-outline',
  vegan: 'flower-outline',
  clean_eating: 'sparkles-outline',
  flexible_dieting: 'apps-outline',
  intermittent_fasting: 'timer-outline',
  no_restrictions: 'checkmark-circle-outline',
  full_gym: 'business-outline',
  dumbbells: 'barbell-outline',
  barbell: 'barbell-outline',
  resistance_bands: 'remove-outline',
  kettlebells: 'radio-button-on-outline',
  pull_up_bar: 'reorder-two-outline',
  bench: 'square-outline',
  yoga_mat: 'options-outline',
  jump_rope: 'git-network-outline',
  medicine_ball: 'basketball-outline',
  treadmill: 'walk-outline',
  bodyweight_only: 'person-outline',
  none: 'checkmark-circle-outline',
  knee: 'ellipse-outline',
  back: 'contract-outline',
  shoulder: 'triangle-outline',
  ankle: 'ellipse-outline',
  wrist: 'hand-left-outline',
  elbow: 'swap-horizontal-outline',
  hip: 'shapes-outline',
  neck: 'resize-outline',
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
      { value: 'never_exercised', label: 'Never Exercised', subtitle: 'Complete beginner', emoji: '🆕' },
      { value: 'beginner', label: 'Beginner', subtitle: '0-6 months', emoji: '🌱' },
      { value: 'intermediate', label: 'Intermediate', subtitle: '6 months - 2 years', emoji: '💪' },
      { value: 'advanced', label: 'Advanced', subtitle: '2-5 years', emoji: '🔥' },
      { value: 'athlete', label: 'Athlete', subtitle: '5+ years or competitive', emoji: '🏆' },
    ],
  },
  {
    id: 'fitnessGoals',
    title: 'Fitness Goals',
    subtitle: 'What do you want to achieve? (Select up to 3)',
    emoji: '🎯',
    type: 'multiselect',
    field: 'fitnessGoals',
    maxSelect: 3,
    icon: 'trophy-outline',
    options: [
      { value: 'lose_weight', label: 'Lose Weight', emoji: '📉' },
      { value: 'gain_muscle', label: 'Gain Muscle', emoji: '💪' },
      { value: 'build_endurance', label: 'Build Endurance', emoji: '🏃' },
      { value: 'increase_flexibility', label: 'Increase Flexibility', emoji: '🤸' },
      { value: 'improve_balance', label: 'Improve Balance', emoji: '⚖️' },
      { value: 'get_toned', label: 'Get Toned', emoji: '✨' },
      { value: 'athletic_performance', label: 'Athletic Performance', emoji: '🏆' },
      { value: 'general_health', label: 'General Health', emoji: '❤️' },
      { value: 'improve_posture', label: 'Improve Posture', emoji: '🧘' },
      { value: 'increase_energy', label: 'Increase Energy', emoji: '⚡' },
      { value: 'stress_relief', label: 'Stress Relief', emoji: '😌' },
      { value: 'better_sleep', label: 'Better Sleep', emoji: '😴' },
    ],
  },
  {
    id: 'nutritionGoals',
    title: 'Nutrition Goals',
    subtitle: 'What are your nutrition priorities? (Select up to 3)',
    emoji: '🥗',
    type: 'multiselect',
    field: 'nutritionGoals',
    maxSelect: 3,
    icon: 'nutrition-outline',
    options: [
      { value: 'high_protein', label: 'High Protein', emoji: '🍗' },
      { value: 'low_carb', label: 'Low Carb', emoji: '🥑' },
      { value: 'balanced_macros', label: 'Balanced Macros', emoji: '⚖️' },
      { value: 'calorie_deficit', label: 'Calorie Deficit', emoji: '📉' },
      { value: 'calorie_surplus', label: 'Calorie Surplus', emoji: '📈' },
      { value: 'meal_prep', label: 'Meal Prep Friendly', emoji: '🍱' },
      { value: 'vegetarian', label: 'Vegetarian', emoji: '🥬' },
      { value: 'vegan', label: 'Vegan', emoji: '🌱' },
      { value: 'clean_eating', label: 'Clean Eating', emoji: '✨' },
      { value: 'flexible_dieting', label: 'Flexible Dieting', emoji: '🎯' },
      { value: 'intermittent_fasting', label: 'Intermittent Fasting', emoji: '⏰' },
      { value: 'no_restrictions', label: 'No Restrictions', emoji: '🍽️' },
    ],
  },
  {
    id: 'equipment',
    title: 'Available Equipment',
    subtitle: 'What do you have access to? (Select all that apply)',
    emoji: '🏋️',
    type: 'multiselect',
    field: 'equipment',
    icon: 'fitness-outline',
    options: [
      { value: 'full_gym', label: 'Full Gym Access', emoji: '🏢' },
      { value: 'dumbbells', label: 'Dumbbells', emoji: '🏋️' },
      { value: 'barbell', label: 'Barbell', emoji: '💪' },
      { value: 'resistance_bands', label: 'Resistance Bands', emoji: '🎗️' },
      { value: 'kettlebells', label: 'Kettlebells', emoji: '⚫' },
      { value: 'pull_up_bar', label: 'Pull-up Bar', emoji: '🔴' },
      { value: 'bench', label: 'Bench', emoji: '🪑' },
      { value: 'yoga_mat', label: 'Yoga Mat', emoji: '🧘' },
      { value: 'jump_rope', label: 'Jump Rope', emoji: '➰' },
      { value: 'medicine_ball', label: 'Medicine Ball', emoji: '⚽' },
      { value: 'treadmill', label: 'Treadmill', emoji: '🏃' },
      { value: 'bodyweight_only', label: 'Bodyweight Only', emoji: '🤸' },
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
      { value: '1', label: '1 Day/Week', subtitle: 'Just getting started', emoji: '1️⃣' },
      { value: '2', label: '2 Days/Week', subtitle: 'Building consistency', emoji: '2️⃣' },
      { value: '3', label: '3 Days/Week', subtitle: 'Great for beginners', emoji: '3️⃣' },
      { value: '4', label: '4 Days/Week', subtitle: 'Balanced approach', emoji: '4️⃣' },
      { value: '5', label: '5 Days/Week', subtitle: 'Dedicated training', emoji: '5️⃣' },
      { value: '6', label: '6 Days/Week', subtitle: 'High commitment', emoji: '6️⃣' },
      { value: '7', label: '7 Days/Week', subtitle: 'Maximum dedication', emoji: '7️⃣' },
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
      { value: '15', label: '15 Minutes', subtitle: 'Quick & efficient', emoji: '⚡' },
      { value: '30', label: '30 Minutes', subtitle: 'Perfect for busy schedules', emoji: '⏰' },
      { value: '45', label: '45 Minutes', subtitle: 'Standard length', emoji: '✨' },
      { value: '60', label: '60 Minutes', subtitle: 'Extended training', emoji: '💪' },
      { value: '60+', label: '60+ Minutes', subtitle: 'Maximum dedication', emoji: '🔥' },
    ],
  },
  {
    id: 'injuries',
    title: 'Injuries or Limitations',
    subtitle: 'Help us keep you safe (Select all that apply)',
    emoji: '🩹',
    type: 'multiselect',
    field: 'injuries',
    icon: 'medical-outline',
    options: [
      { value: 'none', label: 'No Injuries', emoji: '✅' },
      { value: 'knee', label: 'Knee Issues', emoji: '🦵' },
      { value: 'back', label: 'Back Issues', emoji: '🫸' },
      { value: 'shoulder', label: 'Shoulder Issues', emoji: '💪' },
      { value: 'ankle', label: 'Ankle Issues', emoji: '🦶' },
      { value: 'wrist', label: 'Wrist Issues', emoji: '🖐️' },
      { value: 'elbow', label: 'Elbow Issues', emoji: '💪' },
      { value: 'hip', label: 'Hip Issues', emoji: '🫁' },
      { value: 'neck', label: 'Neck Issues', emoji: '🦒' },
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
    fitnessGoals: [],
    nutritionGoals: [],
    equipment: [],
    trainingDays: '',
    sessionDuration: '',
    injuries: [],
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
    } else if (currentStepData.type === 'multiselect') {
      if (!formData[currentStepData.field] || formData[currentStepData.field].length === 0) {
        Alert.alert('Required', 'Please select at least one option to continue');
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

    // Navigate to analyzing screen first
    router.push({
      pathname: '/(auth)/analyzing',
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
    const isFeet = field.unit === 'height' && formData.heightUnit === 'ft';
    const unit = field.unit === 'height' ? formData.heightUnit : formData.weightUnit;
    const unitOptions = field.unit === 'height' ? ['cm', 'ft'] : ['kg', 'lbs'];

    if (isFeet) {
      // Special two-field input for feet and inches
      return (
        <View style={styles.measurementContainer}>
          <View style={styles.feetInchesRow}>
            <View style={[styles.measurementInput, { flex: 1, marginRight: 8 }]}>
              <Ionicons name="resize-outline" size={20} color={COLORS.accent} style={{ marginRight: 8 }} />
              <RNTextInput
                style={styles.input}
                placeholder="Feet"
                placeholderTextColor={COLORS.mediumGray}
                value={formData.feet || ''}
                onChangeText={(value) => setFormData({ ...formData, feet: value })}
                keyboardType="numeric"
                maxLength={1}
              />
              <Text style={styles.unitLabel}>ft</Text>
            </View>
            <View style={[styles.measurementInput, { flex: 1 }]}>
              <RNTextInput
                style={styles.input}
                placeholder="Inches"
                placeholderTextColor={COLORS.mediumGray}
                value={formData.inches || ''}
                onChangeText={(value) => setFormData({ ...formData, inches: value })}
                keyboardType="numeric"
                maxLength={2}
              />
              <Text style={styles.unitLabel}>in</Text>
            </View>
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
                  setFormData({ ...formData, heightUnit: u });
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
    }

    return (
      <View style={styles.measurementContainer}>
        <View style={styles.measurementInput}>
          <Ionicons name={field.icon as any} size={20} color={COLORS.accent} style={{ marginRight: 12 }} />
          <RNTextInput
            style={styles.input}
            placeholder={unit === 'cm' ? 'e.g., 175' : unit === 'ft' ? 'e.g., 5\'10"' : unit === 'kg' ? 'e.g., 70' : 'e.g., 154'}
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

  const renderMultiSelectOptions = () => {
    if (currentStepData.type !== 'multiselect' || !currentStepData.options) return null;

    const handleToggle = (value: string) => {
      const currentValues = formData[currentStepData.field] || [];
      const maxSelect = currentStepData.maxSelect || 999;
      
      if (currentValues.includes(value)) {
        setFormData({
          ...formData,
          [currentStepData.field]: currentValues.filter((v: string) => v !== value),
        });
      } else {
        if (currentValues.length < maxSelect) {
          setFormData({
            ...formData,
            [currentStepData.field]: [...currentValues, value],
          });
        } else {
          Alert.alert('Limit Reached', `You can select up to ${maxSelect} options`);
        }
      }
    };

    return (
      <View style={styles.optionsContainer}>
        {currentStepData.options.map((option: any) => {
          const isSelected = (formData[currentStepData.field] || []).includes(option.value);
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionCard,
                isSelected && styles.optionCardSelected,
              ]}
              onPress={() => handleToggle(option.value)}
            >
              <View style={styles.optionContent}>
                <View style={[styles.optionIcon, isSelected && styles.optionIconSelected]}>
                  <Ionicons 
                    name={OPTION_ICONS[option.value] || 'ellipse-outline'} 
                    size={18} 
                    color={isSelected ? COLORS.white : COLORS.accent} 
                  />
                </View>
                <View style={styles.optionText}>
                  <Text style={[
                    styles.optionLabel,
                    isSelected && styles.optionLabelSelected
                  ]}>
                    {option.label}
                  </Text>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.accent} />
                )}
              </View>
            </TouchableOpacity>
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
            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {currentStep + 1} of {ONBOARDING_STEPS.length}
          </Text>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.contentContainer}>
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

              {/* Scrollable Content Area */}
              <ScrollView
                style={styles.scrollableContent}
                contentContainerStyle={styles.scrollableContentInner}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* Content */}
                {renderFields()}
                {renderSelectOptions()}
                {renderMultiSelectOptions()}
              </ScrollView>

              {/* Navigation Buttons - Always Visible */}
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
          </View>
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
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: COLORS.white,
  },
  progressText: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 13,
    color: COLORS.white,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  keyboardView: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 32,
    padding: 28,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 15,
    height: '80%',
    justifyContent: 'space-between',
  },
  heroEmoji: {
    fontSize: 40,
    textAlign: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.mediumGray,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  scrollableContent: {
    flex: 1,
    marginBottom: 16,
  },
  scrollableContentInner: {
    paddingBottom: 10,
  },
  scrollableContent: {
    maxHeight: '70%',
  },
  scrollableContentInner: {
    paddingBottom: 20,
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
    backgroundColor: COLORS.lightGray,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  datePickerText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    paddingVertical: 16,
    fontWeight: '500',
  },
  placeholderText: {
    color: COLORS.mediumGray,
  },
  measurementContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  feetInchesRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  measurementInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  unitLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.mediumGray,
    marginLeft: 8,
  },
  unitToggle: {
    position: 'absolute',
    top: -8,
    right: 0,
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  unitButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  unitButtonActive: {
    backgroundColor: COLORS.accent,
  },
  unitButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.mediumGray,
  },
  unitButtonTextActive: {
    color: COLORS.white,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  optionCard: {
    width: (SCREEN_WIDTH - 80) / 2,
    backgroundColor: COLORS.lightGray,
    borderRadius: 16,
    padding: 8,
    paddingHorizontal: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: 50,
    justifyContent: 'center',
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${COLORS.accent}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  optionIconSelected: {
    backgroundColor: COLORS.accent,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  optionLabelSelected: {
    color: COLORS.accent,
  },
  optionSubtitle: {
    fontSize: 11,
    color: COLORS.mediumGray,
    fontWeight: '500',
    marginTop: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
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
    marginBottom: 2,
  },
  nextButtonFull: {
    flex: 2,
  },
  nextGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
});
