import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  Clock, 
  Calendar, 
  Timer, 
  Dumbbell, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface UserWorkoutProfile {
  fitnessGoal: 'fat_loss' | 'muscle_building' | 'endurance' | 'strength' | 'general_fitness' | 'flexibility';
  preferredTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'flexible';
  availableDays: string[];
  sessionDuration: number; // in minutes
  equipmentAccess: string[];
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  injuries: string;
  additionalNotes: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PreWorkoutQuestionnaireProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (profile: UserWorkoutProfile) => void;
  existingProfile?: UserWorkoutProfile | null;
}

export const PreWorkoutQuestionnaire: React.FC<PreWorkoutQuestionnaireProps> = ({
  isOpen,
  onClose,
  onComplete,
  existingProfile
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [profile, setProfile] = useState<Partial<UserWorkoutProfile>>({
    fitnessGoal: 'general_fitness',
    preferredTimeOfDay: 'flexible',
    availableDays: [],
    sessionDuration: 45,
    equipmentAccess: [],
    experienceLevel: 'intermediate',
    injuries: '',
    additionalNotes: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    if (existingProfile) {
      setProfile(existingProfile);
    }
  }, [existingProfile]);

  const questions = [
    {
      id: 'fitnessGoal',
      title: 'What\'s your primary fitness goal?',
      icon: Target,
      type: 'radio',
      options: [
        { value: 'fat_loss', label: 'Fat Loss & Weight Management', desc: 'Burn calories and lose weight' },
        { value: 'muscle_building', label: 'Muscle Building', desc: 'Build lean muscle mass' },
        { value: 'strength', label: 'Strength Training', desc: 'Increase overall strength' },
        { value: 'endurance', label: 'Endurance & Cardio', desc: 'Improve cardiovascular fitness' },
        { value: 'flexibility', label: 'Flexibility & Mobility', desc: 'Improve range of motion' },
        { value: 'general_fitness', label: 'General Fitness', desc: 'Overall health and wellness' }
      ]
    },
    {
      id: 'preferredTimeOfDay',
      title: 'When do you prefer to work out?',
      icon: Clock,
      type: 'radio',
      options: [
        { value: 'morning', label: 'Morning (6AM - 10AM)', desc: 'Start your day with energy' },
        { value: 'afternoon', label: 'Afternoon (12PM - 4PM)', desc: 'Mid-day energy boost' },
        { value: 'evening', label: 'Evening (5PM - 9PM)', desc: 'Unwind after work' },
        { value: 'flexible', label: 'Flexible', desc: 'Any time works for me' }
      ]
    },
    {
      id: 'availableDays',
      title: 'Which days are you available to train?',
      icon: Calendar,
      type: 'checkbox',
      options: [
        { value: 'monday', label: 'Monday' },
        { value: 'tuesday', label: 'Tuesday' },
        { value: 'wednesday', label: 'Wednesday' },
        { value: 'thursday', label: 'Thursday' },
        { value: 'friday', label: 'Friday' },
        { value: 'saturday', label: 'Saturday' },
        { value: 'sunday', label: 'Sunday' }
      ]
    },
    {
      id: 'sessionDuration',
      title: 'How long should each workout session be?',
      icon: Timer,
      type: 'radio',
      options: [
        { value: '15', label: '15 minutes', desc: 'Quick and efficient' },
        { value: '30', label: '30 minutes', desc: 'Perfect for busy schedules' },
        { value: '45', label: '45 minutes', desc: 'Standard workout length' },
        { value: '60', label: '60 minutes', desc: 'Full comprehensive session' },
        { value: '90', label: '90+ minutes', desc: 'Extended training session' }
      ]
    },
    {
      id: 'equipmentAccess',
      title: 'What equipment do you have access to?',
      icon: Dumbbell,
      type: 'checkbox',
      options: [
        { value: 'bodyweight_only', label: 'Bodyweight Only' },
        { value: 'dumbbells', label: 'Dumbbells' },
        { value: 'resistance_bands', label: 'Resistance Bands' },
        { value: 'kettlebells', label: 'Kettlebells' },
        { value: 'barbell', label: 'Barbell & Plates' },
        { value: 'pull_up_bar', label: 'Pull-up Bar' },
        { value: 'gym_access', label: 'Full Gym Access' },
        { value: 'cardio_equipment', label: 'Cardio Equipment (Treadmill, Bike, etc.)' }
      ]
    },
    {
      id: 'experienceLevel',
      title: 'What\'s your fitness experience level?',
      icon: TrendingUp,
      type: 'radio',
      options: [
        { value: 'beginner', label: 'Beginner', desc: 'New to fitness or getting back into it' },
        { value: 'intermediate', label: 'Intermediate', desc: 'Regular exercise for 6+ months' },
        { value: 'advanced', label: 'Advanced', desc: 'Consistent training for years' }
      ]
    },
    {
      id: 'injuries',
      title: 'Do you have any injuries or physical limitations?',
      icon: AlertTriangle,
      type: 'textarea',
      placeholder: 'Please describe any injuries, pain, or areas we should be careful with (e.g., "Lower back issues", "Previous shoulder injury", "Knee problems")...'
    }
  ];

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
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
    const completeProfile: UserWorkoutProfile = {
      fitnessGoal: profile.fitnessGoal || 'general_fitness',
      preferredTimeOfDay: profile.preferredTimeOfDay || 'flexible',
      availableDays: profile.availableDays || [],
      sessionDuration: profile.sessionDuration || 45,
      equipmentAccess: profile.equipmentAccess || [],
      experienceLevel: profile.experienceLevel || 'intermediate',
      injuries: profile.injuries || '',
      additionalNotes: profile.additionalNotes || '',
      createdAt: existingProfile?.createdAt || new Date(),
      updatedAt: new Date()
    };

    try {
      // Save to both localStorage and database
      localStorage.setItem('thryvin-workout-profile', JSON.stringify(completeProfile));
      
      const response = await fetch('/api/user/workout-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completeProfile),
      });

      if (!response.ok) {
        throw new Error('Failed to save to database');
      }

      onComplete(completeProfile);
      onClose();
      
      toast({
        title: "Profile Updated!",
        description: "Your workout preferences have been saved. AI will now generate personalized workouts for you.",
      });
    } catch (error) {
      console.error('Error saving workout profile:', error);
      // Still complete locally if database save fails
      onComplete(completeProfile);
      onClose();
      
      toast({
        title: "Profile Saved Locally",
        description: "Your preferences were saved locally. Database sync will happen next time you're online.",
        variant: "default"
      });
    }
  };

  const handleValueChange = (field: string, value: any) => {
    setProfile(prev => ({
      ...prev,
      [field]: field === 'sessionDuration' ? parseInt(value) : value
    }));
  };

  const handleCheckboxChange = (field: string, value: string, checked: boolean) => {
    setProfile(prev => {
      const currentArray = prev[field as keyof typeof prev] as string[] || [];
      if (checked) {
        return {
          ...prev,
          [field]: [...currentArray, value]
        };
      } else {
        return {
          ...prev,
          [field]: currentArray.filter(item => item !== value)
        };
      }
    });
  };

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  const canProceed = () => {
    const currentValue = profile[currentQuestion.id as keyof typeof profile];
    if (currentQuestion.type === 'checkbox') {
      return Array.isArray(currentValue) && currentValue.length > 0;
    }
    return currentValue !== undefined && currentValue !== '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <currentQuestion.icon className="w-4 h-4 text-white" />
            </div>
            Workout Preferences
          </DialogTitle>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Step {currentStep + 1} of {questions.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </DialogHeader>

        <div className="py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                {currentQuestion.title}
              </h3>

              {currentQuestion.type === 'radio' && (
                <RadioGroup
                  value={profile[currentQuestion.id as keyof typeof profile] as string}
                  onValueChange={(value) => handleValueChange(currentQuestion.id, value)}
                  className="space-y-3"
                >
                  {currentQuestion.options?.map((option) => (
                    <div key={option.value} className="flex items-start space-x-3 p-4 rounded-lg border border-gray-200 hover:border-purple-300 cursor-pointer transition-colors">
                      <RadioGroupItem value={String(option.value)} id={String(option.value)} className="mt-1" />
                      <Label htmlFor={String(option.value)} className="flex-1 cursor-pointer">
                        <div className="font-medium text-gray-900">{option.label}</div>
                        {'desc' in option && option.desc && (
                          <div className="text-sm text-gray-600 mt-1">{option.desc}</div>
                        )}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {currentQuestion.type === 'checkbox' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentQuestion.options?.map((option) => (
                    <div key={option.value} className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:border-purple-300 cursor-pointer transition-colors">
                      <Checkbox
                        id={String(option.value)}
                        checked={(profile[currentQuestion.id as keyof typeof profile] as string[] || []).includes(String(option.value))}
                        onCheckedChange={(checked) => handleCheckboxChange(currentQuestion.id, String(option.value), checked as boolean)}
                      />
                      <Label htmlFor={String(option.value)} className="flex-1 cursor-pointer font-medium text-gray-900">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              )}

              {currentQuestion.type === 'textarea' && (
                <Textarea
                  placeholder={currentQuestion.placeholder}
                  value={profile[currentQuestion.id as keyof typeof profile] as string || ''}
                  onChange={(e) => handleValueChange(currentQuestion.id, e.target.value)}
                  className="min-h-[120px] resize-none"
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex justify-between pt-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white"
          >
            {currentStep === questions.length - 1 ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Complete Setup
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};