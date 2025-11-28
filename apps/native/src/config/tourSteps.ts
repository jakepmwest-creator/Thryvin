import { TourStep } from '../components/OnboardingTour';

export const TOUR_STEPS: TourStep[] = [
  // Welcome step
  {
    id: 'welcome',
    title: 'Welcome to Thryvin! 🎉',
    description: 'Let\'s take a quick tour to help you get the most out of your fitness journey. This will only take a minute!',
    placement: 'center',
    action: 'none',
    icon: 'sparkles',
  },
  
  // Home screen - Today's Workout
  {
    id: 'home-workout',
    title: 'Your Daily Workout',
    description: 'Every day, AI generates a personalized workout based on your goals and fitness level. Tap here to see today\'s workout!',
    placement: 'bottom',
    action: 'tap',
    icon: 'fitness',
  },
  
  // Workout modal
  {
    id: 'workout-details',
    title: 'Workout Overview',
    description: 'View all exercises, sets, and reps. Swipe left or right to see the full week of workouts. Each day has a unique AI-generated routine!',
    placement: 'center',
    action: 'none',
    icon: 'calendar',
  },
  
  // Edit workout feature
  {
    id: 'edit-workout',
    title: 'Customize Your Workout',
    description: 'Tap "Edit Workout" to swap exercises. Our AI suggests alternatives based on injuries, equipment, or difficulty. Make it perfect for you!',
    placement: 'top',
    action: 'none',
    icon: 'create',
  },
  
  // Start workout
  {
    id: 'start-workout',
    title: 'Begin Your Session',
    description: 'Tap "Start Workout" to enter the Workout Hub. Track your sets, reps, and weight in real-time with video guidance for each exercise!',
    placement: 'top',
    action: 'none',
    icon: 'play-circle',
  },
  
  // Workouts tab
  {
    id: 'workouts-tab',
    title: 'Your Weekly Schedule',
    description: 'The Workouts tab shows your full week at a glance. See which days you\'ve completed and plan ahead!',
    placement: 'top',
    action: 'tap',
    icon: 'barbell',
  },
  
  // Stats tab
  {
    id: 'stats-tab',
    title: 'Track Your Progress',
    description: 'View your workout stats, personal records, and strength gains over time. Watch yourself improve week after week!',
    placement: 'top',
    action: 'tap',
    icon: 'stats-chart',
  },
  
  // Awards tab
  {
    id: 'awards-tab',
    title: 'Earn Achievements',
    description: 'Unlock badges and achievements as you hit milestones. Stay motivated and celebrate your wins!',
    placement: 'top',
    action: 'tap',
    icon: 'trophy',
  },
  
  // Profile tab
  {
    id: 'profile-tab',
    title: 'Your Profile & Settings',
    description: 'Update your goals, preferences, and account settings here. Your profile helps AI create better workouts for you!',
    placement: 'top',
    action: 'tap',
    icon: 'person-circle',
  },
  
  // Final step
  {
    id: 'complete',
    title: 'You\'re All Set! 🚀',
    description: 'That\'s it! You\'re ready to start your fitness journey. Remember, consistency is key. Let\'s get started!',
    placement: 'center',
    action: 'none',
    icon: 'checkmark-circle',
  },
];
