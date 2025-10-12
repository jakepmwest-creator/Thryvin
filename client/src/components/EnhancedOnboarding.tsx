import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Sparkles, Target, User, Dumbbell, Clock, Calendar, Heart, Trophy, CheckCircle, Mic, Activity, Zap, MessageCircle, Ruler } from 'lucide-react';
import confetti from 'canvas-confetti';

interface OnboardingData {
  displayName: string;
  gender: 'male' | 'female' | 'prefer-not-to-say' | 'other' | null;
  genderOther: string;
  primaryGoal: 'build-muscle' | 'lose-fat' | 'improve-endurance' | 'increase-flexibility' | 'general-health' | 'other' | null;
  primaryGoalOther: string;
  trainingDaysPerWeek: '1-2' | '3-4' | '5-6' | 'every-day' | null;
  sessionDurationMin: '20-30' | '45-60' | '75+' | null;
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced' | null;
  dateOfBirth: string;
  heightFt: string;
  heightIn: string;
  heightCm: string;
  weight: string;
  weightUnit: 'lbs' | 'kg';
  heightUnit: 'ft' | 'cm';
  limitations: string[];
  limitationsNotes: string;
  activityLevel: 'sedentary' | 'lightly-active' | 'active' | 'very-active' | null;
  motivators: string[];
  motivatorsNotes: string;
  coachingStyle: 'encouraging-positive' | 'straightforward-disciplined' | 'casual-friendly' | 'other' | null;
  coachingStyleOther: string;
}

interface EnhancedOnboardingProps {
  onComplete: (data: OnboardingData) => void;
  onSkip: () => void;
  onBackToLogin?: () => void;
}

const steps = [
  {
    id: 'welcome',
    title: 'Welcome to Thryvin\'',
    subtitle: 'Your personalized fitness journey starts here',
    icon: Sparkles,
    color: 'bg-gradient-to-r from-purple-500 to-pink-500'
  },
  {
    id: 'name',
    title: 'What should we call you?',
    subtitle: 'Let\'s personalize your experience',
    icon: User,
    color: 'bg-gradient-to-r from-blue-500 to-cyan-500'
  },
  {
    id: 'gender',
    title: 'What\'s your gender?',
    subtitle: 'This helps us personalize your experience',
    icon: User,
    color: 'bg-gradient-to-r from-blue-500 to-indigo-500'
  },
  {
    id: 'goal',
    title: 'What\'s your main fitness goal?',
    subtitle: 'This helps us create your perfect plan',
    icon: Target,
    color: 'bg-gradient-to-r from-green-500 to-emerald-500'
  },
  {
    id: 'training-days',
    title: 'How many days per week can you realistically train?',
    subtitle: 'Be honest - consistency beats intensity',
    icon: Calendar,
    color: 'bg-gradient-to-r from-indigo-500 to-purple-500'
  },
  {
    id: 'workout-duration',
    title: 'How long do you like your workouts?',
    subtitle: 'Quality over quantity',
    icon: Clock,
    color: 'bg-gradient-to-r from-teal-500 to-green-500'
  },
  {
    id: 'fitness-level',
    title: 'What\'s your current fitness level?',
    subtitle: 'Be honest - we\'ll meet you where you are',
    icon: Dumbbell,
    color: 'bg-gradient-to-r from-orange-500 to-red-500'
  },
  {
    id: 'body-metrics',
    title: 'Let\'s get your body metrics',
    subtitle: 'This helps us personalize your workouts and track progress',
    icon: Ruler,
    color: 'bg-gradient-to-r from-emerald-500 to-teal-500'
  },
  {
    id: 'limitations',
    title: 'Any injuries or limitations we should consider?',
    subtitle: 'Your safety is our priority',
    icon: Heart,
    color: 'bg-gradient-to-r from-red-500 to-pink-500'
  },
  {
    id: 'activity-level',
    title: 'What\'s your typical daily activity level outside the gym?',
    subtitle: 'This helps us adjust your training intensity',
    icon: Activity,
    color: 'bg-gradient-to-r from-cyan-500 to-blue-500'
  },
  {
    id: 'motivators',
    title: 'What motivates you most?',
    subtitle: 'We\'ll use this to keep you engaged',
    icon: Zap,
    color: 'bg-gradient-to-r from-yellow-500 to-orange-500'
  },
  {
    id: 'coaching-style',
    title: 'How would you like your AI coach to interact with you?',
    subtitle: 'Choose your coaching personality',
    icon: MessageCircle,
    color: 'bg-gradient-to-r from-purple-500 to-pink-500'
  },
  {
    id: 'complete',
    title: 'You\'re all set!',
    subtitle: 'Time to meet your AI coach',
    icon: Trophy,
    color: 'bg-gradient-to-r from-yellow-500 to-orange-500'
  }
];

export const EnhancedOnboarding: React.FC<EnhancedOnboardingProps> = ({ onComplete, onSkip, onBackToLogin }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    displayName: '',
    gender: null,
    genderOther: '',
    primaryGoal: null,
    primaryGoalOther: '',
    trainingDaysPerWeek: null,
    sessionDurationMin: null,
    fitnessLevel: null,
    dateOfBirth: '',
    heightFt: '',
    heightIn: '',
    heightCm: '',
    weight: '',
    weightUnit: 'lbs',
    heightUnit: 'ft',
    limitations: [],
    limitationsNotes: '',
    activityLevel: null,
    motivators: [],
    motivatorsNotes: '',
    coachingStyle: null,
    coachingStyleOther: ''
  });

  const progress = ((currentStep + 1) / steps.length) * 100;

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Big drumroll celebration with multiple confetti bursts
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']
      });
      
      // Additional confetti bursts for celebration
      setTimeout(() => {
        confetti({
          particleCount: 100,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.8 }
        });
      }, 200);

      setTimeout(() => {
        confetti({
          particleCount: 100,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.8 }
        });
      }, 400);

      setTimeout(() => {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.4 }
        });
      }, 600);
      
      onComplete(data);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else if (onBackToLogin) {
      // First step - go back to login
      onBackToLogin();
    }
  };

  const canContinue = () => {
    switch (steps[currentStep].id) {
      case 'welcome':
        return true;
      case 'name':
        return data.displayName.trim().length > 0 && data.displayName.length <= 30;
      case 'gender':
        return data.gender !== null && (data.gender !== 'other' || data.genderOther.trim().length > 0);
      case 'goal':
        return data.primaryGoal !== null && (data.primaryGoal !== 'other' || data.primaryGoalOther.trim().length > 0);
      case 'training-days':
        return data.trainingDaysPerWeek !== null;
      case 'workout-duration':
        return data.sessionDurationMin !== null;
      case 'fitness-level':
        return data.fitnessLevel !== null;
      case 'body-metrics':
        const dobDate = new Date(data.dateOfBirth);
        const today = new Date();
        const age = Math.floor((today.getTime() - dobDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
        const weight = parseFloat(data.weight);
        
        let heightValid = false;
        if (data.heightUnit === 'ft') {
          const heightFt = parseInt(data.heightFt);
          const heightIn = parseInt(data.heightIn);
          heightValid = data.heightFt.length > 0 && heightFt >= 3 && heightFt <= 8 &&
                       data.heightIn.length > 0 && heightIn >= 0 && heightIn <= 11;
        } else {
          const heightCm = parseInt(data.heightCm);
          heightValid = data.heightCm.length > 0 && heightCm >= 100 && heightCm <= 250;
        }
        
        let weightValid = false;
        if (data.weightUnit === 'lbs') {
          weightValid = data.weight.length > 0 && weight >= 50 && weight <= 500;
        } else {
          weightValid = data.weight.length > 0 && weight >= 20 && weight <= 250;
        }
        
        return data.dateOfBirth.length > 0 && !isNaN(dobDate.getTime()) && age >= 13 && age <= 100 && 
               heightValid && weightValid;
      case 'limitations':
        return data.limitations.length > 0;
      case 'activity-level':
        return data.activityLevel !== null;
      case 'motivators':
        return data.motivators.length > 0;
      case 'coaching-style':
        return data.coachingStyle !== null && (data.coachingStyle !== 'other' || data.coachingStyleOther.trim().length > 0);
      default:
        return true;
    }
  };

  const stepVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
  };

  const ChipButton: React.FC<{
    selected: boolean;
    onClick: () => void;
    children: React.ReactNode;
    className?: string;
  }> = ({ selected, onClick, children, className = "" }) => (
    <motion.button
      onClick={onClick}
      className={`px-4 py-3 rounded-full border-2 transition-all duration-200 text-sm font-medium ${
        selected
          ? 'bg-purple-500 text-white border-purple-500 shadow-lg'
          : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
      } ${className}`}
      whileHover={{ scale: 1.02 }}
    >
      {children}
    </motion.button>
  );

  const MultiSelectChip: React.FC<{
    selected: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }> = ({ selected, onClick, children }) => (
    <motion.button
      onClick={onClick}
      className={`px-4 py-3 rounded-full border-2 transition-all duration-200 text-sm font-medium ${
        selected
          ? 'bg-purple-500 text-white border-purple-500 shadow-lg'
          : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
      }`}
      whileHover={{ scale: 1.02 }}
    >
      {children}
    </motion.button>
  );

  const VoiceInputField: React.FC<{
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    maxLength?: number;
  }> = ({ value, onChange, placeholder, maxLength }) => (
    <div className="relative">
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        className="w-full p-4 pr-12 text-lg border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
        autoFocus
      />
      <button className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-purple-500 transition-colors">
        <Mic className="w-5 h-5" />
      </button>
      {maxLength && (
        <div className="text-right text-xs text-gray-400 mt-1">
          {value.length}/{maxLength}
        </div>
      )}
    </div>
  );

  function renderStepContent() {
    switch (steps[currentStep].id) {
      case 'welcome':
        return (
          <motion.div 
            className="text-center space-y-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">What you'll get:</h3>
              <div className="space-y-3">
                {[
                  'Personalized AI coach',
                  'Custom workout plans',
                  'Real-time progress tracking',
                  'Nutrition guidance'
                ].map((benefit, index) => (
                  <motion.div 
                    key={benefit}
                    className="flex items-center"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                  >
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case 'name':
        return (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-4"
          >
            <VoiceInputField
              value={data.displayName}
              onChange={(value) => setData({ ...data, displayName: value })}
              placeholder="Enter your name"
              maxLength={30}
            />
            <p className="text-sm text-gray-500 text-center">
              We'll use this to personalize your experience
            </p>
          </motion.div>
        );

      case 'gender':
        return (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'prefer-not-to-say', label: 'Prefer not to say' },
                { value: 'other', label: 'Other' }
              ].map((option) => (
                <ChipButton
                  key={option.value}
                  selected={data.gender === option.value}
                  onClick={() => setData({ ...data, gender: option.value as any })}
                >
                  {option.label}
                </ChipButton>
              ))}
            </div>
            {data.gender === 'other' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4"
              >
                <VoiceInputField
                  value={data.genderOther}
                  onChange={(value) => setData({ ...data, genderOther: value })}
                  placeholder="Please specify"
                />
              </motion.div>
            )}
          </motion.div>
        );

      case 'goal':
        return (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'build-muscle', label: 'Build muscle' },
                { value: 'lose-fat', label: 'Lose fat' },
                { value: 'improve-endurance', label: 'Improve endurance' },
                { value: 'increase-flexibility', label: 'Increase flexibility' },
                { value: 'general-health', label: 'General health' },
                { value: 'other', label: 'Other' }
              ].map((option) => (
                <ChipButton
                  key={option.value}
                  selected={data.primaryGoal === option.value}
                  onClick={() => setData({ ...data, primaryGoal: option.value as any })}
                >
                  {option.label}
                </ChipButton>
              ))}
            </div>
            {data.primaryGoal === 'other' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4"
              >
                <VoiceInputField
                  value={data.primaryGoalOther}
                  onChange={(value) => setData({ ...data, primaryGoalOther: value })}
                  placeholder="Please specify your goal"
                />
              </motion.div>
            )}
          </motion.div>
        );

      case 'training-days':
        return (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: '1-2', label: '1–2 days' },
                { value: '3-4', label: '3–4 days' },
                { value: '5-6', label: '5–6 days' },
                { value: 'every-day', label: 'Every day' }
              ].map((option) => (
                <ChipButton
                  key={option.value}
                  selected={data.trainingDaysPerWeek === option.value}
                  onClick={() => setData({ ...data, trainingDaysPerWeek: option.value as any })}
                >
                  {option.label}
                </ChipButton>
              ))}
            </div>
          </motion.div>
        );

      case 'workout-duration':
        return (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-4"
          >
            <div className="space-y-3">
              {[
                { value: '0-30', label: '0–30 mins' },
                { value: '30-45', label: '30–45 mins' },
                { value: '45-60', label: '45–60 mins' },
                { value: '60+', label: '60+ mins' }
              ].map((option) => (
                <ChipButton
                  key={option.value}
                  selected={data.sessionDurationMin === option.value}
                  onClick={() => setData({ ...data, sessionDurationMin: option.value as any })}
                  className="w-full"
                >
                  {option.label}
                </ChipButton>
              ))}
            </div>
          </motion.div>
        );

      case 'fitness-level':
        return (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-4"
          >
            <div className="space-y-3">
              {[
                { value: 'beginner', label: 'Beginner', desc: 'New to fitness or returning after a break' },
                { value: 'intermediate', label: 'Intermediate', desc: 'Regular exercise for 6+ months' },
                { value: 'advanced', label: 'Advanced', desc: 'Consistent training for 2+ years' }
              ].map((option) => (
                <ChipButton
                  key={option.value}
                  selected={data.fitnessLevel === option.value}
                  onClick={() => setData({ ...data, fitnessLevel: option.value as any })}
                  className="w-full text-left p-4"
                >
                  <div>
                    <div className="font-semibold">{option.label}</div>
                    <div className="text-xs opacity-75 mt-1">{option.desc}</div>
                  </div>
                </ChipButton>
              ))}
            </div>
          </motion.div>
        );

      case 'body-metrics':
        return (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-4"
          >
            <div className="text-center mb-4">
              <p className="text-emerald-700 text-sm">
                📊 Help your AI coach personalize your workouts
              </p>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth 🎂
              </label>
              <input
                type="date"
                value={data.dateOfBirth}
                onChange={(e) => setData({ ...data, dateOfBirth: e.target.value })}
                max={new Date().toISOString().split('T')[0]}
                className="w-full p-3 text-lg border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
              />
            </div>

            {/* Height */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Height 📏
                </label>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setData({ ...data, heightUnit: 'ft', heightCm: '' })}
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${
                      data.heightUnit === 'ft' 
                        ? 'bg-emerald-500 text-white' 
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    ft/in
                  </button>
                  <button
                    type="button"
                    onClick={() => setData({ ...data, heightUnit: 'cm', heightFt: '', heightIn: '' })}
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${
                      data.heightUnit === 'cm' 
                        ? 'bg-emerald-500 text-white' 
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    cm
                  </button>
                </div>
              </div>
              
              {data.heightUnit === 'ft' ? (
                <div className="flex gap-3">
                  <div className="flex-1">
                    <input
                      type="number"
                      placeholder="5"
                      value={data.heightFt}
                      onChange={(e) => setData({ ...data, heightFt: e.target.value })}
                      min="3"
                      max="8"
                      className="w-full p-3 text-lg border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-center"
                    />
                    <p className="text-xs text-gray-500 text-center mt-1">feet</p>
                  </div>
                  <div className="flex-1">
                    <input
                      type="number"
                      placeholder="8"
                      value={data.heightIn}
                      onChange={(e) => setData({ ...data, heightIn: e.target.value })}
                      min="0"
                      max="11"
                      className="w-full p-3 text-lg border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-center"
                    />
                    <p className="text-xs text-gray-500 text-center mt-1">inches</p>
                  </div>
                </div>
              ) : (
                <input
                  type="number"
                  placeholder="170"
                  value={data.heightCm}
                  onChange={(e) => setData({ ...data, heightCm: e.target.value })}
                  min="100"
                  max="250"
                  className="w-full p-3 text-lg border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-center"
                />
              )}
            </div>

            {/* Weight */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Current Weight ⚖️
                </label>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setData({ ...data, weightUnit: 'lbs' })}
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${
                      data.weightUnit === 'lbs' 
                        ? 'bg-emerald-500 text-white' 
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    lbs
                  </button>
                  <button
                    type="button"
                    onClick={() => setData({ ...data, weightUnit: 'kg' })}
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${
                      data.weightUnit === 'kg' 
                        ? 'bg-emerald-500 text-white' 
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    kg
                  </button>
                </div>
              </div>
              <input
                type="number"
                placeholder={data.weightUnit === 'lbs' ? '150' : '70'}
                value={data.weight}
                onChange={(e) => setData({ ...data, weight: e.target.value })}
                min={data.weightUnit === 'lbs' ? '50' : '20'}
                max={data.weightUnit === 'lbs' ? '500' : '250'}
                step="0.5"
                className="w-full p-3 text-lg border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-center"
              />
            </div>
          </motion.div>
        );

      case 'limitations':
        return (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-6"
          >
            {/* Quick selection chips */}
            <div className="grid grid-cols-2 gap-3">
              {[
                'Shoulder',
                'Elbow/Wrist',
                'Lower back',
                'Knee',
                'Ankle',
                'None'
              ].map((option) => (
                <MultiSelectChip
                  key={option}
                  selected={data.limitations.includes(option)}
                  onClick={() => {
                    if (option === 'None') {
                      setData({ ...data, limitations: ['None'], limitationsNotes: '' });
                    } else {
                      const newLimitations = data.limitations.includes(option)
                        ? data.limitations.filter(l => l !== option)
                        : [...data.limitations.filter(l => l !== 'None'), option];
                      setData({ ...data, limitations: newLimitations });
                    }
                  }}
                >
                  {option}
                </MultiSelectChip>
              ))}
            </div>

            {/* Main text area for detailed input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Please describe any injuries, limitations, or health considerations:
              </label>
              <textarea
                value={data.limitationsNotes || ''}
                onChange={(e) => setData({ ...data, limitationsNotes: e.target.value })}
                placeholder="Describe any injuries, pain areas, mobility restrictions, medical conditions, or other limitations that might affect your workout routine. Be as detailed as you'd like - this helps us create a safe and effective program for you."
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none min-h-[120px]"
                rows={4}
              />
              <p className="text-xs text-gray-500">
                This information helps us customize your workouts for your safety and success.
              </p>
            </div>
          </motion.div>
        );

      case 'activity-level':
        return (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-4"
          >
            <div className="space-y-3">
              {[
                { value: 'sedentary', label: 'Sedentary', desc: 'Mostly sitting, little to no exercise' },
                { value: 'lightly-active', label: 'Lightly active', desc: 'Light exercise 1-3 days/week' },
                { value: 'active', label: 'Active', desc: 'Moderate exercise 3-5 days/week' },
                { value: 'very-active', label: 'Very active', desc: 'Hard exercise 6-7 days/week' }
              ].map((option) => (
                <ChipButton
                  key={option.value}
                  selected={data.activityLevel === option.value}
                  onClick={() => setData({ ...data, activityLevel: option.value as any })}
                  className="w-full text-left p-4"
                >
                  <div>
                    <div className="font-semibold">{option.label}</div>
                    <div className="text-xs opacity-75 mt-1">{option.desc}</div>
                  </div>
                </ChipButton>
              ))}
            </div>
          </motion.div>
        );

      case 'motivators':
        return (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              {[
                'Progress tracking',
                'Competition',
                'Accountability',
                'Fun/exploration',
                'Results',
                'Other'
              ].map((option) => (
                <MultiSelectChip
                  key={option}
                  selected={data.motivators.includes(option)}
                  onClick={() => {
                    const newMotivators = data.motivators.includes(option)
                      ? data.motivators.filter(m => m !== option)
                      : [...data.motivators, option];
                    setData({ ...data, motivators: newMotivators });
                  }}
                >
                  {option}
                </MultiSelectChip>
              ))}
            </div>
            {data.motivators.includes('Other') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4"
              >
                <VoiceInputField
                  value={data.motivatorsNotes}
                  onChange={(value) => setData({ ...data, motivatorsNotes: value })}
                  placeholder="What else motivates you?"
                />
              </motion.div>
            )}
          </motion.div>
        );

      case 'coaching-style':
        return (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-4"
          >
            <div className="space-y-3">
              {[
                { value: 'encouraging-positive', label: 'Encouraging & positive', desc: 'Supportive and motivational' },
                { value: 'straightforward-disciplined', label: 'Straightforward & disciplined', desc: 'Direct and focused on results' },
                { value: 'casual-friendly', label: 'Casual & friendly', desc: 'Relaxed and conversational' },
                { value: 'other', label: 'Other', desc: 'Something different' }
              ].map((option) => (
                <ChipButton
                  key={option.value}
                  selected={data.coachingStyle === option.value}
                  onClick={() => setData({ ...data, coachingStyle: option.value as any })}
                  className="w-full text-left p-4"
                >
                  <div>
                    <div className="font-semibold">{option.label}</div>
                    <div className="text-xs opacity-75 mt-1">{option.desc}</div>
                  </div>
                </ChipButton>
              ))}
            </div>
            {data.coachingStyle === 'other' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4"
              >
                <VoiceInputField
                  value={data.coachingStyleOther}
                  onChange={(value) => setData({ ...data, coachingStyleOther: value })}
                  placeholder="Describe your preferred coaching style"
                />
              </motion.div>
            )}
          </motion.div>
        );

      case 'complete':
        return (
          <motion.div
            className="text-center space-y-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Ready to get started!</h3>
              <div className="space-y-3">
                {[
                  'Profile customized',
                  'Goals established',
                  'Training plan ready',
                  'AI coach assigned'
                ].map((achievement, index) => (
                  <motion.div 
                    key={achievement}
                    className="flex items-center"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                  >
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{achievement}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex flex-col">
      {/* Progress Bar - Fixed at top */}
      <div className="p-6 bg-white/80 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* Centered Content Container */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {/* Step Content */}
          <AnimatePresence mode="wait" custom={1}>
            <motion.div
              key={currentStep}
              custom={1}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
              className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
            >
              {/* Header */}
              <div className={`${steps[currentStep].color} p-6 text-white text-center`}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring' }}
                  className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4"
                >
                  {React.createElement(steps[currentStep].icon, { className: "w-8 h-8" })}
                </motion.div>
                <h2 className="text-xl font-bold mb-2">{steps[currentStep].title}</h2>
                <p className="text-white/90 text-sm">{steps[currentStep].subtitle}</p>
              </div>

              {/* Content */}
              <div className="p-6">
                {renderStepContent()}
              </div>

              {/* Navigation */}
              <div className="p-6 bg-gray-50 flex justify-between items-center border-t border-gray-200">
              <button
                onClick={prevStep}
                className="flex items-center px-4 py-2 rounded-xl font-medium text-gray-600 hover:text-gray-800 hover:bg-white transition-all duration-200"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                {currentStep === 0 ? 'Login' : 'Back'}
              </button>

              <button
                onClick={nextStep}
                disabled={!canContinue()}
                className={`flex items-center px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  canContinue()
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {currentStep === steps.length - 1 ? 'Complete' : 'Continue'}
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
        </div>
      </div>
    </div>
  );
};