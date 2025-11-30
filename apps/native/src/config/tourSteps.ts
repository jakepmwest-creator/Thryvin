import { TourStep } from '../components/OnboardingTour';

// SIMPLIFIED - Just workout flow for now
export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Thryvin! 🎉',
    description: 'Let me show you how workouts work in 30 seconds. This is quick!',
    placement: 'center',
    action: 'none',
    icon: 'sparkles',
  },
  
  {
    id: 'workout-card-intro',
    title: 'Your Daily Workout',
    description: 'AI creates a personalized workout for you every day. Let me show you inside - tap this card!',
    placement: 'center',
    action: 'none',
    icon: 'fitness',
  },
  
  {
    id: 'workout-explained',
    title: 'Inside Your Workout',
    description: 'You have Warmup, Main exercises, and Cooldown. Swipe left/right to see the full week. Each day is different!',
    placement: 'center',
    action: 'none',
    icon: 'list',
  },
  
  {
    id: 'edit-explained',
    title: 'Customize It',
    description: 'Use "Edit Workout" to swap exercises. Got an injury? Need different equipment? AI suggests alternatives!',
    placement: 'center',
    action: 'none',
    icon: 'create',
  },
  
  {
    id: 'complete',
    title: 'That\'s It! 💪',
    description: 'Start your workout when ready. Track your sets, watch videos, and build consistency. Let\'s go!',
    placement: 'center',
    action: 'none',
    icon: 'checkmark-circle',
  },
];
