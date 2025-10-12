import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  Clock, 
  Heart, 
  Target, 
  Calendar, 
  Timer, 
  Users, 
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Dumbbell
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth-v2';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import confetti from 'canvas-confetti';

interface AIOnboardingData {
  topFitnessGoal: string;
  preferredTrainingTime: string;
  cardioPreference: string;
  focusAreas: string[];
  avoidanceAreas: string[];
  sessionDurationPreference: number;
  trainingDaysPerWeek: number;
  preferredTrainingDays: string[];
  workoutVariationPreference: string;
  motivationalPreferences: {
    style: string;
    encouragementLevel: string;
    feedbackType: string;
  };
}

interface AIPersonalizationOnboardingProps {
  onComplete: (data: AIOnboardingData) => void;
  onSkip: () => void;
}

export function AIPersonalizationOnboarding({ onComplete, onSkip }: AIPersonalizationOnboardingProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<AIOnboardingData>({
    topFitnessGoal: '',
    preferredTrainingTime: '',
    cardioPreference: '',
    focusAreas: [],
    avoidanceAreas: [],
    sessionDurationPreference: 45,
    trainingDaysPerWeek: 3,
    preferredTrainingDays: [],
    workoutVariationPreference: 'medium',
    motivationalPreferences: {
      style: '',
      encouragementLevel: '',
      feedbackType: ''
    }
  });

  const updateUserProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      return apiRequest('/api/user/ai-profile', {
        method: 'PATCH',
        body: JSON.stringify(profileData)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      toast({
        title: "AI Profile Created! 🤖",
        description: "Your personalized fitness plan is ready to go.",
      });
      onComplete(data);
    },
    onError: (error) => {
      console.error('Error updating AI profile:', error);
      toast({
        title: "Profile Update Failed",
        description: "Please try again or skip for now.",
        variant: "destructive"
      });
    }
  });

  const handleComplete = () => {
    if (!user) return;
    
    updateUserProfileMutation.mutate({
      preferredTrainingTime: data.preferredTrainingTime,
      cardioPreference: data.cardioPreference,
      focusAreas: JSON.stringify(data.focusAreas),
      avoidanceAreas: JSON.stringify(data.avoidanceAreas),
      sessionDurationPreference: data.sessionDurationPreference,
      trainingDaysPerWeek: data.trainingDaysPerWeek,
      preferredTrainingDays: JSON.stringify(data.preferredTrainingDays),
      workoutVariationPreference: data.workoutVariationPreference,
      motivationalPreferences: JSON.stringify(data.motivationalPreferences),
      hasCompletedAIOnboarding: true
    });
  };

  const steps = [
    {
      title: "What's your top fitness goal right now?",
      icon: Target,
      content: (
        <div className="space-y-3">
          {[
            'Build muscle and strength',
            'Lose weight and get lean',
            'Improve athletic performance',
            'Increase flexibility and mobility',
            'Boost energy and overall health',
            'Train for a specific sport',
            'Recover from injury safely',
            'Maintain current fitness level'
          ].map((goal) => (
            <Button
              key={goal}
              variant={data.topFitnessGoal === goal ? "default" : "outline"}
              className="w-full justify-start h-auto p-4 text-left"
              onClick={() => setData({...data, topFitnessGoal: goal})}
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${data.topFitnessGoal === goal ? 'bg-white' : 'bg-purple-500'}`} />
                <span>{goal}</span>
              </div>
            </Button>
          ))}
        </div>
      )
    },
    {
      title: "What time of day do you normally train?",
      icon: Clock,
      content: (
        <div className="space-y-3">
          {[
            { value: 'morning', label: 'Morning (6AM - 10AM)', desc: 'Start your day with energy' },
            { value: 'afternoon', label: 'Afternoon (11AM - 3PM)', desc: 'Midday workout break' },
            { value: 'evening', label: 'Evening (4PM - 8PM)', desc: 'After work fitness' },
            { value: 'night', label: 'Night (8PM+)', desc: 'Late night training' },
            { value: 'flexible', label: 'Flexible/Varies', desc: 'Different times work for me' }
          ].map((time) => (
            <Button
              key={time.value}
              variant={data.preferredTrainingTime === time.value ? "default" : "outline"}
              className="w-full justify-start h-auto p-4 text-left"
              onClick={() => setData({...data, preferredTrainingTime: time.value})}
            >
              <div className="flex flex-col items-start gap-1">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${data.preferredTrainingTime === time.value ? 'bg-white' : 'bg-purple-500'}`} />
                  <span className="font-medium">{time.label}</span>
                </div>
                <span className="text-sm text-gray-500 ml-5">{time.desc}</span>
              </div>
            </Button>
          ))}
        </div>
      )
    },
    {
      title: "How do you feel about cardio?",
      icon: Heart,
      content: (
        <div className="space-y-3">
          {[
            { value: 'love', label: 'Love it! 💪', desc: 'Give me all the cardio' },
            { value: 'like', label: 'I like it', desc: 'Good for mixing things up' },
            { value: 'neutral', label: 'It\'s okay', desc: 'I can take it or leave it' },
            { value: 'dislike', label: 'Not a fan', desc: 'Keep it minimal please' },
            { value: 'hate', label: 'Really dislike it', desc: 'Avoid whenever possible' }
          ].map((pref) => (
            <Button
              key={pref.value}
              variant={data.cardioPreference === pref.value ? "default" : "outline"}
              className="w-full justify-start h-auto p-4 text-left"
              onClick={() => setData({...data, cardioPreference: pref.value})}
            >
              <div className="flex flex-col items-start gap-1">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${data.cardioPreference === pref.value ? 'bg-white' : 'bg-purple-500'}`} />
                  <span className="font-medium">{pref.label}</span>
                </div>
                <span className="text-sm text-gray-500 ml-5">{pref.desc}</span>
              </div>
            </Button>
          ))}
        </div>
      )
    },
    {
      title: "Any areas you want to focus on or avoid?",
      icon: Target,
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="font-medium mb-3 text-green-700">Areas to Focus On:</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                'Upper body', 'Lower body', 'Core/Abs', 'Back strength',
                'Cardio fitness', 'Flexibility', 'Balance', 'Posture'
              ].map((area) => (
                <Button
                  key={area}
                  variant={data.focusAreas.includes(area) ? "default" : "outline"}
                  size="sm"
                  className="h-auto p-2 text-xs"
                  onClick={() => {
                    const newFocusAreas = data.focusAreas.includes(area)
                      ? data.focusAreas.filter(a => a !== area)
                      : [...data.focusAreas, area];
                    setData({...data, focusAreas: newFocusAreas});
                  }}
                >
                  {area}
                </Button>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-3 text-red-700">Areas to Avoid/Limit:</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                'High impact', 'Heavy lifting', 'Jumping', 'Twisting',
                'Overhead moves', 'Floor exercises', 'Long duration', 'High intensity'
              ].map((area) => (
                <Button
                  key={area}
                  variant={data.avoidanceAreas.includes(area) ? "default" : "outline"}
                  size="sm"
                  className="h-auto p-2 text-xs"
                  onClick={() => {
                    const newAvoidanceAreas = data.avoidanceAreas.includes(area)
                      ? data.avoidanceAreas.filter(a => a !== area)
                      : [...data.avoidanceAreas, area];
                    setData({...data, avoidanceAreas: newAvoidanceAreas});
                  }}
                >
                  {area}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      title: "How many minutes per session do you want to spend training?",
      icon: Timer,
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-600 mb-2">
              {data.sessionDurationPreference} minutes
            </div>
            <p className="text-gray-600">Perfect for your schedule</p>
          </div>
          
          <div className="space-y-3">
            {[
              { value: 15, label: '15 minutes', desc: 'Quick and efficient' },
              { value: 30, label: '30 minutes', desc: 'Balanced approach' },
              { value: 45, label: '45 minutes', desc: 'Comprehensive workout' },
              { value: 60, label: '60 minutes', desc: 'Full training session' },
              { value: 90, label: '90+ minutes', desc: 'Extended training' }
            ].map((duration) => (
              <Button
                key={duration.value}
                variant={data.sessionDurationPreference === duration.value ? "default" : "outline"}
                className="w-full justify-start h-auto p-4 text-left"
                onClick={() => setData({...data, sessionDurationPreference: duration.value})}
              >
                <div className="flex flex-col items-start gap-1">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${data.sessionDurationPreference === duration.value ? 'bg-white' : 'bg-purple-500'}`} />
                    <span className="font-medium">{duration.label}</span>
                  </div>
                  <span className="text-sm text-gray-500 ml-5">{duration.desc}</span>
                </div>
              </Button>
            ))}
          </div>
        </div>
      )
    },
    {
      title: "How many days per week do you want to train?",
      icon: Calendar,
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-600 mb-2">
              {data.trainingDaysPerWeek} days
            </div>
            <p className="text-gray-600">Per week</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6, 7].map((days) => (
              <Button
                key={days}
                variant={data.trainingDaysPerWeek === days ? "default" : "outline"}
                className="h-16 text-lg font-semibold"
                onClick={() => setData({...data, trainingDaysPerWeek: days})}
              >
                {days} {days === 1 ? 'day' : 'days'}
              </Button>
            ))}
          </div>
          
          <div className="mt-6">
            <h4 className="font-medium mb-3">Preferred training days:</h4>
            <div className="grid grid-cols-2 gap-2">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                <Button
                  key={day}
                  variant={data.preferredTrainingDays.includes(day) ? "default" : "outline"}
                  size="sm"
                  className="h-10"
                  onClick={() => {
                    const newDays = data.preferredTrainingDays.includes(day)
                      ? data.preferredTrainingDays.filter(d => d !== day)
                      : [...data.preferredTrainingDays, day];
                    
                    // Limit to selected training days per week
                    if (newDays.length <= data.trainingDaysPerWeek) {
                      setData({...data, preferredTrainingDays: newDays});
                    }
                  }}
                  disabled={!data.preferredTrainingDays.includes(day) && data.preferredTrainingDays.length >= data.trainingDaysPerWeek}
                >
                  {day.slice(0, 3)}
                </Button>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Select up to {data.trainingDaysPerWeek} days
            </p>
          </div>
        </div>
      )
    }
  ];

  const totalSteps = steps.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const canProceed = () => {
    switch (currentStep) {
      case 0: return data.topFitnessGoal !== '';
      case 1: return data.preferredTrainingTime !== '';
      case 2: return data.cardioPreference !== '';
      case 3: return true; // Optional step
      case 4: return data.sessionDurationPreference > 0;
      case 5: return data.trainingDaysPerWeek > 0;
      default: return true;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Brain className="w-8 h-8 text-purple-600" />
            <Sparkles className="w-6 h-6 text-pink-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Let's Build Your Personalized Fitness Plan
          </h1>
          <p className="text-gray-600">
            Tell us about your preferences so our AI can create the perfect workouts for you
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep + 1} of {totalSteps}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(progress)}% complete
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center">
                <div className="flex items-center justify-center mb-4">
                  {React.createElement(steps[currentStep].icon, {
                    className: "w-12 h-12 text-purple-600"
                  })}
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900">
                  {steps[currentStep].title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {steps[currentStep].content}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>

          <div className="flex gap-3">

            {currentStep < totalSteps - 1 ? (
              <Button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canProceed()}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={!canProceed() || updateUserProfileMutation.isPending}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {updateUserProfileMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating Profile...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Complete Setup
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}