import { TourStep } from '../components/OnboardingTour';

export const TOUR_STEPS: TourStep[] = [
  // 1. Welcome
  {
    id: 'welcome',
    title: 'Welcome to Thryvin! 🎉',
    description: 'Let\'s take a quick interactive tour! I\'ll show you how to use the app by actually taking you through it. Ready?',
    placement: 'center',
    action: 'none',
    icon: 'sparkles',
  },
  
  // 2. Home screen - Highlight workout card
  {
    id: 'tap-workout-card',
    title: 'Your AI Workout',
    description: 'This is your personalized workout for today. Tap this card to see your exercises!',
    placement: 'top',
    action: 'tap',
    icon: 'fitness',
  },
  
  // 3. Inside modal - Workout structure
  {
    id: 'workout-structure',
    title: 'Workout Structure',
    description: 'Each workout has: Warmup (prep your muscles), Main (strength training), and Cooldown (recovery). You can swipe to see the whole week!',
    placement: 'center',
    action: 'none',
    icon: 'list',
  },
  
  // 4. Edit Workout button
  {
    id: 'edit-workout-button',
    title: 'Edit Workout',
    description: 'Got an injury or different equipment? Tap "Edit Workout" to swap any exercise. AI finds perfect alternatives for you!',
    placement: 'top',
    action: 'none',
    icon: 'create',
  },
  
  // 5. Start Workout button
  {
    id: 'start-workout-button',
    title: 'Start Your Workout',
    description: 'Ready to train? Tap "Start Workout" to begin. You\'ll see exercise videos, log your sets, and track your progress!',
    placement: 'top',
    action: 'none',
    icon: 'play-circle',
  },
  
  // 6. Stats Tab
  {
    id: 'stats-tab',
    title: 'Track Progress',
    description: 'Tap the Stats tab to see your personal records, workout history, and strength gains over time!',
    placement: 'top',
    action: 'tap',
    icon: 'stats-chart',
  },
  
  // 7. Inside Stats
  {
    id: 'stats-explained',
    title: 'Your Progress',
    description: 'Here you\'ll see all your PRs, workout stats, and how much you\'ve improved. Track your journey!',
    placement: 'center',
    action: 'none',
    icon: 'trending-up',
  },
  
  // 8. Awards Tab
  {
    id: 'awards-tab',
    title: 'Earn Achievements',
    description: 'Tap Awards to see badges you can unlock! Complete workouts, hit PRs, build streaks, and more!',
    placement: 'top',
    action: 'tap',
    icon: 'trophy',
  },
  
  // 9. Inside Awards
  {
    id: 'awards-explained',
    title: 'Unlock Badges',
    description: 'Earn achievements as you progress. Every milestone deserves recognition. Stay motivated!',
    placement: 'center',
    action: 'none',
    icon: 'medal',
  },
  
  // 10. Profile Tab
  {
    id: 'profile-tab',
    title: 'Your Profile',
    description: 'Tap Profile to update your goals, preferences, and settings. Your profile helps AI create better workouts!',
    placement: 'top',
    action: 'tap',
    icon: 'person-circle',
  },
  
  // 11. Inside Profile
  {
    id: 'profile-explained',
    title: 'Customize Everything',
    description: 'Update your fitness goals, workout preferences, and account settings here. Make Thryvin yours!',
    placement: 'center',
    action: 'none',
    icon: 'settings',
  },
  
  // 12. Complete
  {
    id: 'complete',
    title: 'You\'re All Set! 💪',
    description: 'That\'s it! You know how to use Thryvin. Now go crush today\'s workout and start building your fitness journey!',
    placement: 'center',
    action: 'none',
    icon: 'checkmark-circle',
  },
];
