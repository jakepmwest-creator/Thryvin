import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, Trophy, Target, Brain, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth-v2';
import WorkoutScheduleView from '@/components/workout/WorkoutScheduleView';
import { AIPersonalizationOnboardingNew } from '@/components/workout/AIPersonalizationOnboardingNew';
import { SmartWorkoutScheduler, WeeklySchedule } from '@/components/workout/SmartWorkoutScheduler';
import { WorkoutPageNew } from '@/components/workout/WorkoutPageNew';

export default function WorkoutsTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [showAIOnboarding, setShowAIOnboarding] = useState(false);
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule | null>(null);

  useEffect(() => {
    if (!user) return;
    
    // Check if user has completed AI onboarding and has userProfile saved
    const userProfile = localStorage.getItem('thryvin-user-profile');
    const hasCompletedOnboarding = user.hasCompletedAIOnboarding || userProfile;
    
    if (hasCompletedOnboarding) {
      setIsFirstTime(false);
      setShowAIOnboarding(false);
    } else {
      setShowAIOnboarding(true);
    }
  }, [user]);

  const handleWorkoutSelect = (workoutId: string, date: Date) => {
    localStorage.setItem('thryvin-workouts-used', 'true');
    setIsFirstTime(false);
    
    toast({
      title: "Workout Selected",
      description: `Starting workout for ${date.toLocaleDateString()}`,
    });
    
    console.log('Selected workout:', workoutId, 'for date:', date);
  };

  const handleAIOnboardingComplete = async (responses: any) => {
    try {
      // Send responses to backend
      const response = await fetch('/api/user/ai-onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ responses }),
      });

      if (!response.ok) {
        throw new Error('Failed to save AI onboarding responses');
      }

      // Save user profile to localStorage to prevent re-showing onboarding
      const userProfile = {
        hasCompletedOnboarding: true,
        responses,
        completedAt: new Date().toISOString(),
        userId: user?.id
      };
      localStorage.setItem('thryvin-user-profile', JSON.stringify(userProfile));

      // Generate personalized weekly schedule
      const scheduleResponse = await fetch('/api/user/generate-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (scheduleResponse.ok) {
        const schedule = await scheduleResponse.json();
        setWeeklySchedule(schedule);
      }

      setShowAIOnboarding(false);
      setIsFirstTime(false);
      localStorage.setItem('thryvin-workouts-used', 'true');
      
      toast({
        title: "AI Profile Complete!",
        description: "Your personalized fitness plan is ready. Let's start training!",
      });
    } catch (error) {
      console.error('Error completing AI onboarding:', error);
      toast({
        title: "Error",
        description: "Failed to save your preferences. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAIOnboardingSkip = () => {
    setShowAIOnboarding(false);
    setIsFirstTime(false);
    localStorage.setItem('thryvin-workouts-used', 'true');
  };

  const handleScheduleGenerated = (schedule: WeeklySchedule) => {
    setWeeklySchedule(schedule);
  };

  const handleAddPersonalEvent = (date: Date) => {
    toast({
      title: "Add Personal Event",
      description: `Adding event for ${date.toLocaleDateString()}`,
    });
    
    // Here you would open a modal or form to add personal events
    console.log('Add personal event for:', date);
  };

  if (isFirstTime) {
    // Skip the "View Your Schedule" page and go straight to AI onboarding
    setShowAIOnboarding(true);
    setIsFirstTime(false);
  }

  // Show AI Personalization Onboarding for first-time users or users who haven't completed AI setup
  if (showAIOnboarding) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="h-full"
      >
        <AIPersonalizationOnboardingNew 
          onComplete={handleAIOnboardingComplete}
          onSkip={handleAIOnboardingSkip}
        />
      </motion.div>
    );
  }

  // Show enhanced workout dashboard for users who have completed onboarding
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="h-full relative bg-white min-h-screen"
    >
      <WorkoutPageNew 
        onWorkoutSelect={handleWorkoutSelect}
        weeklySchedule={weeklySchedule}
        userProfile={user}
      />
    </motion.div>
  );
}