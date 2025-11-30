import { TourStep } from '../components/OnboardingTour';

export const TOUR_STEPS: TourStep[] = [
  // Step 0: Welcome
  {
    id: 'welcome',
    title: 'Welcome to Thryvin! 🎉',
    description: 'Let\'s take a quick tour! I\'ll show you the home screen, workouts, stats, and awards. Ready?',
    placement: 'center',
    action: 'none',
    icon: 'sparkles',
  },
  
  // Step 1: Home screen intro
  {
    id: 'home-screen',
    title: 'Your Home Screen',
    description: 'This is your fitness dashboard! See your workout for today, activity rings, and quick stats. Let me show you the workout!',
    placement: 'center',
    action: 'none',
    icon: 'home',
  },
  
  // Step 2: Modal opens automatically
  {
    id: 'workout-modal-opened',
    title: 'Your Workout Details',
    description: 'Here are all your exercises! Warmup prepares you, Main builds strength, and Cooldown helps recovery. Swipe to see the full week!',
    placement: 'center',
    action: 'none',
    icon: 'list',
  },
  
  // Step 3: Edit workout
  {
    id: 'edit-workout',
    title: 'Edit Workout',
    description: 'Tap "Edit Workout" to swap exercises. Got an injury or different equipment? AI suggests perfect alternatives!',
    placement: 'center',
    action: 'none',
    icon: 'create',
  },
  
  // Step 4: Start workout
  {
    id: 'start-workout',
    title: 'Start Your Session',
    description: 'Tap "Start Workout" to begin! You\'ll see exercise videos, log sets and reps, and use the AI Coach button for form tips.',
    placement: 'center',
    action: 'none',
    icon: 'play-circle',
  },
  
  // Step 5: Close modal, show stats tab
  {
    id: 'show-stats',
    title: 'Track Your Progress',
    description: 'Let me show you the Stats tab where you track PRs and progress!',
    placement: 'center',
    action: 'none',
    icon: 'stats-chart',
  },
  
  // Step 6: Stats explained
  {
    id: 'stats-explained',
    title: 'Your Stats',
    description: 'View workout history, personal records, and strength gains. Watch yourself improve over time!',
    placement: 'center',
    action: 'none',
    icon: 'trending-up',
  },
  
  // Step 7: Awards tab
  {
    id: 'show-awards',
    title: 'Earn Achievements',
    description: 'Let me show you the Awards tab where you unlock badges!',
    placement: 'center',
    action: 'none',
    icon: 'trophy',
  },
  
  // Step 8: Awards explained
  {
    id: 'awards-explained',
    title: 'Unlock Badges',
    description: 'Complete workouts, hit PRs, and build streaks to earn achievements. Stay motivated!',
    placement: 'center',
    action: 'none',
    icon: 'medal',
  },
  
  // Step 9: Complete
  {
    id: 'complete',
    title: 'You\'re All Set! 💪',
    description: 'You know the basics! Start your workout, track progress, and earn achievements. Let\'s get it!',
    placement: 'center',
    action: 'none',
    icon: 'checkmark-circle',
  },
];
