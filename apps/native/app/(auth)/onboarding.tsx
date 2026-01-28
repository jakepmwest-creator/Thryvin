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
  Animated,
  Dimensions,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth-store';
import { CustomAlert } from '../../src/components/CustomAlert';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

import { COLORS as THEME_COLORS } from '../../src/constants/colors';

const COLORS = {
  accent: THEME_COLORS.gradientStart, // #A22BF6
  accentSecondary: THEME_COLORS.gradientEnd, // #FF4EC7
  white: THEME_COLORS.white,
  text: THEME_COLORS.text,
  lightGray: THEME_COLORS.lightGray,
  mediumGray: THEME_COLORS.mediumGray,
  shadow: THEME_COLORS.cardShadow,
};

// AI Coach names database - cool, realistic names with subtle hints
const COACH_NAMES = {
  male: {
    motivational: ['Zo Blaze', 'Max Ryder', 'Chase Summit', 'Kai Storm'],
    technical: ['Nathan Pierce', 'Ethan Cross', 'Lucas Kane', 'Owen Sharp'],
    disciplined: ['Marcus Stone', 'Roman Steel', 'Miles Forge', 'Dex Iron'],
    balanced: ['Jordan Rivers', 'Blake Harper', 'Cole Mason', 'Finn Carter'],
  },
  female: {
    motivational: ['Luna Blaze', 'Aria Rush', 'Nova Flame', 'Maya Surge'],
    technical: ['Sage Pierce', 'Quinn Atlas', 'Eva Cross', 'Iris Vale'],
    disciplined: ['Reyna Stone', 'Phoenix Steel', 'Jade Archer', 'Raven Storm'],
    balanced: ['Harper Lane', 'Riley Brooks', 'Skye Morgan', 'Eden Rivers'],
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
  other: 'create-outline',
  // Training frequency
  '1': 'calendar-outline',
  '2': 'calendar-outline',
  '3': 'calendar-outline',
  '4': 'calendar-outline',
  '5': 'calendar-outline',
  '6': 'calendar-outline',
  '7': 'calendar-outline',
  // Session duration
  '15': 'time-outline',
  '30': 'time-outline',
  '45': 'time-outline',
  '60': 'time-outline',
  '60+': 'timer-outline',
  // Experience
  never_exercised: 'help-circle-outline',
  beginner: 'leaf-outline',
  intermediate: 'fitness-outline',
  advanced: 'flame-outline',
  athlete: 'trophy-outline',
  // Coaching styles
  motivational: 'megaphone-outline',
  technical: 'construct-outline',
  balanced: 'scale-outline',
  disciplined: 'shield-outline',
  data_driven: 'analytics-outline',
  supportive: 'heart-outline',
  aggressive: 'flash-outline',
  fun: 'happy-outline',
};

// Country options for timezone handling
const COUNTRY_OPTIONS = [
  { value: 'UK', label: '🇬🇧 United Kingdom', timezone: 'Europe/London' },
  { value: 'US', label: '🇺🇸 United States', timezone: 'America/New_York' },
  { value: 'US_WEST', label: '🇺🇸 United States (West)', timezone: 'America/Los_Angeles' },
  { value: 'AU', label: '🇦🇺 Australia', timezone: 'Australia/Sydney' },
  { value: 'CA', label: '🇨🇦 Canada', timezone: 'America/Toronto' },
  { value: 'DE', label: '🇩🇪 Germany', timezone: 'Europe/Berlin' },
  { value: 'FR', label: '🇫🇷 France', timezone: 'Europe/Paris' },
  { value: 'ES', label: '🇪🇸 Spain', timezone: 'Europe/Madrid' },
  { value: 'IT', label: '🇮🇹 Italy', timezone: 'Europe/Rome' },
  { value: 'NL', label: '🇳🇱 Netherlands', timezone: 'Europe/Amsterdam' },
  { value: 'JP', label: '🇯🇵 Japan', timezone: 'Asia/Tokyo' },
  { value: 'IN', label: '🇮🇳 India', timezone: 'Asia/Kolkata' },
  { value: 'BR', label: '🇧🇷 Brazil', timezone: 'America/Sao_Paulo' },
  { value: 'MX', label: '🇲🇽 Mexico', timezone: 'America/Mexico_City' },
  { value: 'OTHER', label: '🌍 Other', timezone: 'UTC' },
];

// Onboarding steps configuration - SPLIT FOR NO SCROLLING
const ONBOARDING_STEPS = [
  {
    id: 'name',
    title: 'Welcome to Thryvin! 👋',
    subtitle: 'First things first...',
    emoji: '✨',
    fields: [
      { key: 'name', label: 'What should we call you?', icon: 'person-outline', type: 'text', placeholder: 'Your name' },
      { key: 'country', label: 'Where are you from?', icon: 'globe-outline', type: 'country', placeholder: 'Select your country' },
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
      { value: '1', label: '1 Day', subtitle: 'Just getting started' },
      { value: '2', label: '2 Days', subtitle: 'Building consistency' },
      { value: '3', label: '3 Days', subtitle: 'Great for beginners' },
      { value: '4', label: '4 Days', subtitle: 'Balanced approach' },
      { value: '5', label: '5 Days', subtitle: 'Dedicated training' },
      { value: '6', label: '6 Days', subtitle: 'High commitment' },
      { value: '7', label: '7 Days', subtitle: 'Maximum dedication' },
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
      { value: '15', label: '15 min', subtitle: 'Quick & efficient' },
      { value: '30', label: '30 min', subtitle: 'Busy schedules' },
      { value: '45', label: '45 min', subtitle: 'Standard length' },
      { value: '60', label: '60 min', subtitle: 'Extended training' },
      { value: '60+', label: '60+ min', subtitle: 'Maximum effort' },
    ],
  },
  {
    id: 'trainingSchedule',
    title: 'When Can You Train?',
    subtitle: 'Select your preferred training days',
    emoji: '📆',
    type: 'trainingSchedule',
    field: 'trainingSchedule',
    icon: 'calendar-outline',
  },
  {
    id: 'injuries',
    title: 'Injuries or Limitations',
    subtitle: 'Help us keep you safe',
    emoji: '🩹',
    type: 'textarea',
    field: 'injuriesDescription',
    icon: 'medical-outline',
    placeholder: 'Describe any injuries, limitations, or health concerns...\n\nExamples:\n• Bad knee from running\n• Lower back pain\n• Shoulder injury healing\n• None',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [formData, setFormData] = useState<any>({
    name: '',
    country: '', // User's country for timezone
    timezone: '', // Timezone string
    gender: '',
    dateOfBirth: null,
    height: '',
    weight: '',
    heightUnit: 'cm',
    weightUnit: 'kg',
    feet: '',
    inches: '',
    experience: '',
    fitnessGoals: [],
    nutritionGoals: [],
    equipment: [],
    trainingDays: '',
    sessionDuration: '',
    // Training schedule fields
    trainingSchedule: 'flexible', // 'flexible', 'specific', 'depends'
    selectedDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], // Default all selected for flexible
    specificDates: [], // For 'depends' - array of date strings
    injuriesDescription: '', // Text description of injuries
    coachingStyle: '',
  });
  
  // CustomAlert state
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
  }>({ visible: false, type: 'info', title: '', message: '' });
  
  const showAlert = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    setAlertConfig({ visible: true, type, title, message });
  };
  const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

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
        showAlert('warning', 'Required', 'Please select an option to continue');
        return;
      }
    } else if (currentStepData.type === 'multiselect') {
      if (!formData[currentStepData.field] || formData[currentStepData.field].length === 0) {
        showAlert('warning', 'Required', 'Please select at least one option to continue');
        return;
      }
    } else if (currentStepData.type === 'textarea') {
      // Textarea is optional (injuries can be "None" or empty)
      // No validation needed, user can skip
    } else if (currentStepData.type === 'trainingSchedule') {
      // Validate training schedule
      const scheduleType = formData.trainingSchedule;
      if (scheduleType === 'specific' && (!formData.selectedDays || formData.selectedDays.length === 0)) {
        showAlert('warning', 'Required', 'Please select at least one training day');
        return;
      }
      if (scheduleType === 'depends' && (!formData.specificDates || formData.specificDates.length === 0)) {
        showAlert('warning', 'Required', 'Please select at least one day in the calendar');
        return;
      }
    } else if (currentStepData.fields) {
      const requiredFields = currentStepData.fields.filter(f => f.key !== 'injuries');
      
      // Check if all fields are filled
      const allFilled = requiredFields.every(field => {
        if (field.unit === 'height' && formData.heightUnit === 'ft') {
          // For feet, check both feet and inches
          return formData.feet && formData.inches;
        }
        return formData[field.key];
      });
      
      if (!allFilled) {
        showAlert('warning', 'Required', 'Please fill in all fields to continue');
        return;
      }
      
      // Age validation for birthdate step (must be 16+)
      if (currentStepData.id === 'birthdate' && formData.dateOfBirth) {
        const today = new Date();
        const birthDate = new Date(formData.dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        
        if (age < 16) {
          showAlert('error', 'Age Restriction', 'You must be at least 16 years old to use Thryvin. This is to ensure we provide safe and appropriate fitness guidance.');
          return;
        }
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
    // Generate AI coach based on gender and style
    const gender = formData.gender || 'other';
    const style = formData.coachingStyle || 'balanced';
    
    let coachPool;
    if (gender === 'male') {
      // Male users get male coaches only
      coachPool = COACH_NAMES.male[style] || COACH_NAMES.male.balanced;
    } else if (gender === 'female') {
      // Female users get female coaches only
      coachPool = COACH_NAMES.female[style] || COACH_NAMES.female.balanced;
    } else {
      // Other gender gets random from both pools
      const allMaleCoaches = Object.values(COACH_NAMES.male).flat();
      const allFemaleCoaches = Object.values(COACH_NAMES.female).flat();
      coachPool = [...allMaleCoaches, ...allFemaleCoaches];
    }
    
    const coachName = coachPool[Math.floor(Math.random() * coachPool.length)];

    // Navigate to analyzing screen first
    router.push({
      pathname: '/(auth)/analyzing',
      params: {
        coachName,
        coachStyle: style,
        onboardingData: JSON.stringify(formData),
      },
    });
  };

  const renderGenderSelect = () => (
    <View>
      {/* First row: Male and Female */}
      <View style={styles.genderContainer}>
        {['Male', 'Female'].map((option) => {
          const isSelected = formData.gender === option.toLowerCase();
          return (
            <TouchableOpacity
              key={option}
              style={[
                styles.genderOption,
                isSelected && styles.genderOptionSelected
              ]}
              onPress={() => setFormData({ ...formData, gender: option.toLowerCase() })}
              activeOpacity={0.7}
            >
              <View style={[
                styles.genderIconContainer,
                isSelected && styles.genderIconContainerSelected
              ]}>
                <Ionicons 
                  name={option === 'Male' ? 'male' : 'female'}
                  size={20}
                  color={isSelected ? COLORS.white : COLORS.accent}
                />
              </View>
              <Text style={[
                styles.genderText,
                isSelected && styles.genderTextSelected
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Second row: Other (centered) */}
      <View style={styles.genderOtherContainer}>
        <TouchableOpacity
          style={[
            styles.genderOptionOther,
            formData.gender === 'other' && styles.genderOptionSelected
          ]}
          onPress={() => setFormData({ ...formData, gender: 'other' })}
          activeOpacity={0.7}
        >
          <View style={[
            styles.genderIconContainer,
            formData.gender === 'other' && styles.genderIconContainerSelected
          ]}>
            <Ionicons 
              name="transgender"
              size={20}
              color={formData.gender === 'other' ? COLORS.white : COLORS.accent}
            />
          </View>
          <Text style={[
            styles.genderText,
            formData.gender === 'other' && styles.genderTextSelected
          ]}>
            Other
          </Text>
        </TouchableOpacity>
      </View>
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
            maximumDate={(() => {
              // Maximum date is 16 years ago (user must be at least 16)
              const maxDate = new Date();
              maxDate.setFullYear(maxDate.getFullYear() - 16);
              return maxDate;
            })()}
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
          
          if (field.type === 'country') {
            const selectedCountry = COUNTRY_OPTIONS.find(c => c.value === formData.country);
            return (
              <View key={field.key} style={styles.fieldWrapper}>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                <TouchableOpacity 
                  style={styles.countryPickerButton}
                  onPress={() => setShowCountryPicker(true)}
                >
                  <Ionicons name="globe-outline" size={20} color={COLORS.accent} />
                  <Text style={[
                    styles.countryPickerText,
                    !selectedCountry && styles.countryPickerPlaceholder
                  ]}>
                    {selectedCountry ? selectedCountry.label : 'Select your country'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={COLORS.mediumGray} />
                </TouchableOpacity>
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
          showAlert('info', 'Limit Reached', `You can select up to ${maxSelect} options`);
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
                    size={14} 
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
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.accent} />
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
        {currentStepData.options.map((option: any) => {
          const isSelected = formData[currentStepData.field] === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionCard,
                isSelected && styles.optionCardSelected,
              ]}
              onPress={() => setFormData({ ...formData, [currentStepData.field]: option.value })}
            >
              <View style={styles.optionContent}>
                <View style={[styles.optionIcon, isSelected && styles.optionIconSelected]}>
                  <Ionicons 
                    name={OPTION_ICONS[option.value] || 'ellipse-outline'} 
                    size={14} 
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
                  {option.subtitle && (
                    <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                  )}
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.accent} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  // Textarea renderer for injuries description
  const renderTextarea = () => {
    if (currentStepData.type !== 'textarea') return null;

    return (
      <View style={styles.textareaContainer}>
        <View style={styles.textareaWrapper}>
          <RNTextInput
            style={styles.textareaInput}
            value={formData[currentStepData.field] || ''}
            onChangeText={(text) => setFormData({ ...formData, [currentStepData.field]: text })}
            placeholder={currentStepData.placeholder || 'Enter your response...'}
            placeholderTextColor={COLORS.mediumGray}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            autoCapitalize="sentences"
            autoCorrect={true}
          />
        </View>
        <Text style={styles.textareaHint}>
          Leave blank or type "None" if you have no injuries
        </Text>
      </View>
    );
  };

  // Training Schedule renderer - "When can you train?"
  const renderTrainingSchedule = () => {
    if (currentStepData.type !== 'trainingSchedule') return null;

    const DAYS_OF_WEEK = [
      { key: 'mon', label: 'Mon' },
      { key: 'tue', label: 'Tue' },
      { key: 'wed', label: 'Wed' },
      { key: 'thu', label: 'Thu' },
      { key: 'fri', label: 'Fri' },
      { key: 'sat', label: 'Sat' },
      { key: 'sun', label: 'Sun' },
    ];

    const scheduleType = formData.trainingSchedule || 'flexible';
    const selectedDays = formData.selectedDays || [];

    const handleScheduleTypeChange = (type: string) => {
      if (type === 'flexible') {
        setFormData({
          ...formData,
          trainingSchedule: 'flexible',
          selectedDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
        });
      } else if (type === 'specific') {
        setFormData({
          ...formData,
          trainingSchedule: 'specific',
          selectedDays: [],
        });
      } else if (type === 'depends') {
        setFormData({
          ...formData,
          trainingSchedule: 'depends',
          selectedDays: [],
        });
      }
    };

    const toggleDay = (dayKey: string) => {
      const current = formData.selectedDays || [];
      if (current.includes(dayKey)) {
        setFormData({
          ...formData,
          selectedDays: current.filter((d: string) => d !== dayKey),
        });
      } else {
        setFormData({
          ...formData,
          selectedDays: [...current, dayKey],
        });
      }
    };

    // Generate next 21 days for "It depends" option
    const getNext21Days = () => {
      const days = [];
      const today = new Date();
      for (let i = 0; i < 21; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        days.push({
          date: date.toISOString().split('T')[0],
          dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
          dayNum: date.getDate(),
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          week: Math.floor(i / 7) + 1,
        });
      }
      return days;
    };

    const toggleSpecificDate = (dateStr: string) => {
      const current = formData.specificDates || [];
      if (current.includes(dateStr)) {
        setFormData({
          ...formData,
          specificDates: current.filter((d: string) => d !== dateStr),
        });
      } else {
        setFormData({
          ...formData,
          specificDates: [...current, dateStr],
        });
      }
    };

    return (
      <View style={styles.scheduleContainer}>
        {/* Schedule Type Options */}
        <View style={styles.scheduleTypeContainer}>
          {/* Flexible - Any Time */}
          <TouchableOpacity
            style={[
              styles.scheduleTypeButton,
              scheduleType === 'flexible' && styles.scheduleTypeButtonSelected,
            ]}
            onPress={() => handleScheduleTypeChange('flexible')}
          >
            <View style={[styles.scheduleTypeIcon, scheduleType === 'flexible' && styles.scheduleTypeIconSelected]}>
              <Ionicons name="infinite" size={20} color={scheduleType === 'flexible' ? COLORS.white : COLORS.accent} />
            </View>
            <Text style={[styles.scheduleTypeText, scheduleType === 'flexible' && styles.scheduleTypeTextSelected]}>
              Flexible - Any Time
            </Text>
            {scheduleType === 'flexible' && (
              <Ionicons name="checkmark-circle" size={20} color={COLORS.accent} style={{ marginLeft: 'auto' }} />
            )}
          </TouchableOpacity>

          {/* Specific Days */}
          <TouchableOpacity
            style={[
              styles.scheduleTypeButton,
              scheduleType === 'specific' && styles.scheduleTypeButtonSelected,
            ]}
            onPress={() => handleScheduleTypeChange('specific')}
          >
            <View style={[styles.scheduleTypeIcon, scheduleType === 'specific' && styles.scheduleTypeIconSelected]}>
              <Ionicons name="calendar" size={20} color={scheduleType === 'specific' ? COLORS.white : COLORS.accent} />
            </View>
            <Text style={[styles.scheduleTypeText, scheduleType === 'specific' && styles.scheduleTypeTextSelected]}>
              Specific Days
            </Text>
            {scheduleType === 'specific' && (
              <Ionicons name="checkmark-circle" size={20} color={COLORS.accent} style={{ marginLeft: 'auto' }} />
            )}
          </TouchableOpacity>

          {/* It Depends */}
          <TouchableOpacity
            style={[
              styles.scheduleTypeButton,
              scheduleType === 'depends' && styles.scheduleTypeButtonSelected,
            ]}
            onPress={() => handleScheduleTypeChange('depends')}
          >
            <View style={[styles.scheduleTypeIcon, scheduleType === 'depends' && styles.scheduleTypeIconSelected]}>
              <Ionicons name="help-circle" size={20} color={scheduleType === 'depends' ? COLORS.white : COLORS.accent} />
            </View>
            <Text style={[styles.scheduleTypeText, scheduleType === 'depends' && styles.scheduleTypeTextSelected]}>
              It Depends Each Week
            </Text>
            {scheduleType === 'depends' && (
              <Ionicons name="checkmark-circle" size={20} color={COLORS.accent} style={{ marginLeft: 'auto' }} />
            )}
          </TouchableOpacity>
        </View>

        {/* Day Selector for "Specific Days" */}
        {scheduleType === 'specific' && (
          <View style={styles.daysSelectorContainer}>
            <Text style={styles.daysSelectorLabel}>Select your training days:</Text>
            <View style={styles.daysGrid}>
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = selectedDays.includes(day.key);
                return (
                  <TouchableOpacity
                    key={day.key}
                    style={[styles.dayButton, isSelected && styles.dayButtonSelected]}
                    onPress={() => toggleDay(day.key)}
                  >
                    <Text style={[styles.dayButtonText, isSelected && styles.dayButtonTextSelected]}>
                      {day.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.selectedDaysCount}>
              {selectedDays.length} day{selectedDays.length !== 1 ? 's' : ''} selected
            </Text>
          </View>
        )}

        {/* 21-Day Calendar for "It Depends" */}
        {scheduleType === 'depends' && (
          <View style={styles.calendarContainer}>
            <Text style={styles.calendarLabel}>Select available days for the next 3 weeks:</Text>
            {[1, 2, 3].map((week) => (
              <View key={week} style={styles.weekContainer}>
                <Text style={styles.weekLabel}>Week {week}</Text>
                <View style={styles.weekDaysRow}>
                  {getNext21Days()
                    .filter((d) => d.week === week)
                    .map((day) => {
                      const isSelected = (formData.specificDates || []).includes(day.date);
                      return (
                        <TouchableOpacity
                          key={day.date}
                          style={[styles.calendarDay, isSelected && styles.calendarDaySelected]}
                          onPress={() => toggleSpecificDate(day.date)}
                        >
                          <Text style={[styles.calendarDayName, isSelected && styles.calendarDayTextSelected]}>
                            {day.dayName}
                          </Text>
                          <Text style={[styles.calendarDayNum, isSelected && styles.calendarDayTextSelected]}>
                            {day.dayNum}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                </View>
              </View>
            ))}
            <Text style={styles.selectedDaysCount}>
              {(formData.specificDates || []).length} day{(formData.specificDates || []).length !== 1 ? 's' : ''} selected
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Country picker modal renderer
  const renderCountryPickerModal = () => (
    <Modal
      visible={showCountryPicker}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCountryPicker(false)}
    >
      <View style={styles.countryModalOverlay}>
        <View style={styles.countryModalContent}>
          {/* Header */}
          <View style={styles.countryModalHeader}>
            <Text style={styles.countryModalTitle}>Select Your Country</Text>
            <TouchableOpacity 
              style={styles.countryModalClose}
              onPress={() => setShowCountryPicker(false)}
            >
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          
          {/* Country List */}
          <FlatList
            data={COUNTRY_OPTIONS}
            keyExtractor={(item) => item.value}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.countryList}
            renderItem={({ item: country }) => {
              const isSelected = formData.country === country.value;
              return (
                <TouchableOpacity
                  style={[
                    styles.countryListItem,
                    isSelected && styles.countryListItemSelected,
                  ]}
                  onPress={() => {
                    setFormData({ 
                      ...formData, 
                      country: country.value,
                      timezone: country.timezone,
                    });
                    setShowCountryPicker(false);
                  }}
                >
                  <Text style={[
                    styles.countryListItemText,
                    isSelected && styles.countryListItemTextSelected,
                  ]}>
                    {country.label}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={22} color={COLORS.accent} />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Country Picker Modal */}
      {renderCountryPickerModal()}
      
      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={hideAlert}
      />
      
      {/* Gradient Background - Match Login */}
      <LinearGradient
        colors={[COLORS.accent, COLORS.accentSecondary]}
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
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
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
                keyboardDismissMode="on-drag"
                automaticallyAdjustKeyboardInsets={true}
              >
                {/* Content */}
                {renderFields()}
                {renderSelectOptions()}
                {renderMultiSelectOptions()}
                {renderTextarea()}
                {renderTrainingSchedule()}
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
  scrollableContent: {
    maxHeight: '70%',
  },
  scrollableContentInner: {
    paddingBottom: 20,
  },
  fieldsContainer: {
    marginBottom: 16,
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
    marginBottom: 12,
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
    marginBottom: 12,
  },
  genderOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: COLORS.lightGray,
  },
  genderOtherContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  genderOptionOther: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: COLORS.lightGray,
    minWidth: '60%',
  },
  genderOptionSelected: {
    borderColor: COLORS.accent,
    backgroundColor: `${COLORS.accent}08`,
  },
  genderIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${COLORS.accent}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderIconContainerSelected: {
    backgroundColor: COLORS.accent,
  },
  genderText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  genderTextSelected: {
    color: COLORS.accent,
  },
  // Textarea styles
  textareaContainer: {
    paddingHorizontal: 24,
    marginTop: 8,
  },
  textareaWrapper: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 16,
    overflow: 'hidden',
  },
  textareaInput: {
    fontSize: 16,
    color: COLORS.text,
    padding: 16,
    minHeight: 160,
    textAlignVertical: 'top',
  },
  textareaHint: {
    fontSize: 13,
    color: COLORS.mediumGray,
    textAlign: 'center',
    marginTop: 12,
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
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  optionCard: {
    width: '48%',
    backgroundColor: COLORS.lightGray,
    borderRadius: 16,
    padding: 8,
    paddingHorizontal: 8,
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
    gap: 6,
  },
  optionIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: `${COLORS.accent}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconSelected: {
    backgroundColor: COLORS.accent,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 11,
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
    borderRadius: 16,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  // Training Schedule Styles
  scheduleContainer: {
    marginBottom: 16,
  },
  scheduleTypeContainer: {
    gap: 10,
    marginBottom: 16,
  },
  scheduleTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 16,
    padding: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  scheduleTypeButtonSelected: {
    borderColor: COLORS.accent,
    backgroundColor: `${COLORS.accent}08`,
  },
  scheduleTypeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${COLORS.accent}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  scheduleTypeIconSelected: {
    backgroundColor: COLORS.accent,
  },
  scheduleTypeText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  scheduleTypeTextSelected: {
    color: COLORS.accent,
  },
  daysSelectorContainer: {
    marginTop: 8,
  },
  daysSelectorLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  dayButton: {
    width: 44,
    height: 44,
    backgroundColor: COLORS.lightGray,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dayButtonSelected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  dayButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  dayButtonTextSelected: {
    color: COLORS.white,
  },
  selectedDaysCount: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.mediumGray,
    textAlign: 'center',
    marginTop: 16,
  },
  calendarContainer: {
    marginTop: 8,
  },
  calendarLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  weekContainer: {
    marginBottom: 20,
  },
  weekLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.accent,
    marginBottom: 10,
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  calendarDay: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  calendarDaySelected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  calendarDayName: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.mediumGray,
  },
  calendarDayNum: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 4,
  },
  calendarDayTextSelected: {
    color: COLORS.white,
  },
  // Country picker button styles
  countryPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  countryPickerText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  countryPickerPlaceholder: {
    color: COLORS.mediumGray,
  },
  // Country picker modal styles
  countryModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  countryModalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: 40,
  },
  countryModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  countryModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  countryModalClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryList: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  countryListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginVertical: 4,
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  countryListItemSelected: {
    backgroundColor: `${COLORS.accent}10`,
    borderColor: COLORS.accent,
  },
  countryListItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  countryListItemTextSelected: {
    fontWeight: '600',
    color: COLORS.accent,
  },
});
