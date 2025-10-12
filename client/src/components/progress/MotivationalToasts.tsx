import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { progressTracker } from '@/utils/ProgressTracker';
import { streakManager } from '@/utils/StreakManager';
import { notificationManager } from '@/utils/NotificationManager';
import confetti from 'canvas-confetti';

// Hook to handle motivational toasts and celebrations
export const useMotivationalToasts = () => {
  const { toast } = useToast();

  useEffect(() => {
    // Listen for workout completion events
    const handleWorkoutComplete = (event: CustomEvent) => {
      const { workoutId, difficulty } = event.detail;
      
      // Record the workout
      const feedback = {
        workoutId,
        difficulty: difficulty || 'perfect',
        timestamp: new Date().toISOString()
      };
      
      progressTracker.logWorkoutFeedback(feedback);
      const streakData = streakManager.recordWorkout();
      
      // Show streak celebration
      if (streakData.currentStreak > 1) {
        showStreakCelebration(streakData.currentStreak);
      }
      
      // Check for achievements
      const achievements = progressTracker.checkAchievements();
      achievements.forEach(achievement => {
        showAchievementToast(achievement);
      });
      
      // Check weekly progress
      const weeklyProgress = progressTracker.getWeeklyProgress();
      if (weeklyProgress.percentage >= 100) {
        showWeeklyTargetCelebration();
      }
    };

    const handleStreakMilestone = (event: CustomEvent) => {
      const { streakDays } = event.detail;
      showStreakCelebration(streakDays);
    };

    const handleProgressMilestone = (event: CustomEvent) => {
      const { milestone } = event.detail;
      showAchievementToast(milestone);
    };

    // Add event listeners
    window.addEventListener('workout-completed', handleWorkoutComplete as EventListener);
    window.addEventListener('streak-milestone', handleStreakMilestone as EventListener);
    window.addEventListener('progress-milestone', handleProgressMilestone as EventListener);

    return () => {
      window.removeEventListener('workout-completed', handleWorkoutComplete as EventListener);
      window.removeEventListener('streak-milestone', handleStreakMilestone as EventListener);
      window.removeEventListener('progress-milestone', handleProgressMilestone as EventListener);
    };
  }, [toast]);

  const showStreakCelebration = (streakDays: number) => {
    let message = '';
    let confettiConfig = {};

    if (streakDays === 3) {
      message = '🔥 3-day streak! You\'re building momentum!';
      confettiConfig = {
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#FFA500', '#FF6347']
      };
    } else if (streakDays === 5) {
      message = '🔥 5-day streak! Almost at your weekly badge!';
      confettiConfig = {
        particleCount: 75,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF4500', '#DC143C']
      };
    } else if (streakDays === 7) {
      message = '🔥🔥 7-day streak! Weekly champion!';
      confettiConfig = {
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#8b5cf6', '#ec4899', '#06b6d4']
      };
    } else if (streakDays >= 14) {
      message = `🔥🔥🔥 ${streakDays}-day streak! You're unstoppable!`;
      confettiConfig = {
        particleCount: 150,
        spread: 90,
        origin: { y: 0.5 },
        colors: ['#FFD700', '#FF69B4', '#8B5CF6'],
        shapes: ['star']
      };
    } else if (streakDays > 7) {
      message = `🔥🔥 ${streakDays}-day streak! Keep it going!`;
      confettiConfig = {
        particleCount: 80,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#FF6B35', '#F7931E']
      };
    }

    if (message) {
      toast({
        title: "Streak Alert! 🔥",
        description: message,
        duration: 5000,
      });

      // Trigger confetti
      confetti(confettiConfig);
    }
  };

  const showAchievementToast = (achievement: string) => {
    toast({
      title: "Achievement Unlocked! 🏆",
      description: achievement,
      duration: 6000,
    });

    // Achievement confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FFD700', '#FFA500', '#FF6347'],
      shapes: ['star', 'circle']
    });
  };

  const showWeeklyTargetCelebration = () => {
    toast({
      title: "Weekly Target Achieved! 🎯",
      description: "You've hit your weekly target — amazing work!",
      duration: 6000,
    });

    // Target achieved confetti
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#00C851', '#007E33', '#39CCCC']
    });
  };

  // Manual trigger functions that can be called from other components
  const triggerWorkoutComplete = (workoutId: string, difficulty?: string) => {
    window.dispatchEvent(new CustomEvent('workout-completed', {
      detail: { workoutId, difficulty }
    }));
  };

  const triggerStreakMilestone = (streakDays: number) => {
    window.dispatchEvent(new CustomEvent('streak-milestone', {
      detail: { streakDays }
    }));
  };

  const triggerProgressMilestone = (milestone: string) => {
    window.dispatchEvent(new CustomEvent('progress-milestone', {
      detail: { milestone }
    }));
  };

  return {
    triggerWorkoutComplete,
    triggerStreakMilestone,
    triggerProgressMilestone
  };
};

// Component wrapper for easy use in app
export const MotivationalToasts: React.FC = () => {
  useMotivationalToasts();
  return null;
};