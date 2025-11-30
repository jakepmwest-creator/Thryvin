import { TourStep } from '../components/OnboardingTour';

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Thryvin! 🎉',
    description: 'Let me show you around in 60 seconds! I\'ll guide you through workouts, stats, and awards.',
    placement: 'center',
    action: 'none',
    icon: 'sparkles',
  },
  
  {
    id: 'home-intro',
    title: 'Your Home Screen',
    description: 'This is your fitness dashboard. See today\'s workout, activity rings, and quick stats!',
    placement: 'center',
    action: 'none',
    icon: 'home',
  },
  
  {
    id: 'tap-workouts-tab',
    title: 'Weekly Workouts',
    description: 'Tap the Workouts tab to see your full week!',
    placement: 'top',
    action: 'tap',
    icon: 'barbell',
  },
  
  {
    id: 'workouts-screen',
    title: 'Your Weekly Schedule',
    description: 'Here\'s your full week! Each day has a unique AI-generated workout. Tap any day to see the details!',
    placement: 'center',
    action: 'none',
    icon: 'calendar',
  },
  
  {
    id: 'workout-modal',
    title: 'Workout Details',
    description: 'See all exercises: Warmup, Main, and Cooldown. Swipe to see other days! Now let me show you the controls.',
    placement: 'center',
    action: 'none',
    icon: 'list',
  },
  
  {
    id: 'edit-button',
    title: 'Edit Your Workout',
    description: 'Use "Edit Workout" to swap exercises. Injured? Wrong equipment? AI suggests alternatives!',
    placement: 'center',
    action: 'none',
    icon: 'create',
  },
  
  {
    id: 'start-button',
    title: 'Start Training',
    description: 'Tap "Start Workout" to begin! You\'ll track sets, reps, weight, and watch exercise videos. The purple AI Coach button gives you form tips!',
    placement: 'center',
    action: 'none',
    icon: 'play-circle',
  },
  
  {
    id: 'stats-tab',
    title: 'Track Progress',
    description: 'Now let me show you Stats! Here you\'ll track your PRs, strength gains, and workout history.',
    placement: 'center',
    action: 'none',
    icon: 'stats-chart',
  },
  
  {
    id: 'awards-tab',
    title: 'Earn Achievements',
    description: 'Finally, Awards! Unlock badges by completing workouts, hitting PRs, and building streaks. Stay motivated!',
    placement: 'center',
    action: 'none',
    icon: 'trophy',
  },
  
  {
    id: 'complete',
    title: 'You\'re Ready! 💪',
    description: 'That\'s it! You know how to use Thryvin. Start today\'s workout and build your fitness journey!',
    placement: 'center',
    action: 'none',
    icon: 'checkmark-circle',
  },
];
