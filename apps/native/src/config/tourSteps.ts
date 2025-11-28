import { TourStep } from '../components/OnboardingTour';

export const TOUR_STEPS: TourStep[] = [
  // 1. Welcome
  {
    id: 'welcome',
    title: 'Welcome to Thryvin! 🎉',
    description: 'Let\'s take a quick 60-second tour to show you around. You\'ll learn how to get personalized workouts, track progress, and stay motivated!',
    placement: 'center',
    action: 'none',
    icon: 'sparkles',
  },
  
  // 2. Home screen - Workout Card
  {
    id: 'home-workout',
    title: 'Your Personalized Workout',
    description: 'AI generates a unique workout for you every day based on your goals and fitness level. Tap the workout card to view today\'s exercises!',
    placement: 'top',
    action: 'none',
    icon: 'fitness',
  },
  
  // 3. Inside workout modal - Overview
  {
    id: 'workout-modal',
    title: 'Workout Structure',
    description: 'Each workout has 3 phases: Warmup to prep your body, Main exercises for strength, and Cooldown to recover. Swipe left/right to see your full week!',
    placement: 'center',
    action: 'none',
    icon: 'calendar',
  },
  
  // 4. Edit & Customize
  {
    id: 'workout-customize',
    title: 'Edit & Customize',
    description: 'Use "Edit Workout" to swap exercises if you have an injury or different equipment. AI suggests perfect alternatives!',
    placement: 'center',
    action: 'none',
    icon: 'create',
  },
  
  // 5. Start workout button
  {
    id: 'start-workout',
    title: 'Ready to Train?',
    description: 'Tap "Start Workout" to enter the Workout Hub where you\'ll log sets, reps, and weight. Exercise videos guide you through each movement!',
    placement: 'center',
    action: 'none',
    icon: 'play-circle',
  },
  
  // 6. Workout Hub explanation
  {
    id: 'workout-hub',
    title: 'Workout Hub',
    description: 'During your workout: Watch exercise videos, log your sets and weights, and tap the purple AI button for form tips. Hit "Finish Workout" when done!',
    placement: 'center',
    action: 'none',
    icon: 'barbell',
  },
  
  // 7. Workouts Tab
  {
    id: 'workouts-tab',
    title: 'Weekly Calendar',
    description: 'The Workouts tab shows your full week. See which days you\'ve completed and what\'s coming up. Stay consistent!',
    placement: 'center',
    action: 'none',
    icon: 'calendar-outline',
  },
  
  // 8. Stats Tab
  {
    id: 'stats-tab',
    title: 'Track Your Progress',
    description: 'View your workout stats, personal records, and strength gains over time. Watch yourself get stronger every week!',
    placement: 'center',
    action: 'none',
    icon: 'stats-chart',
  },
  
  // 9. Awards Tab
  {
    id: 'awards-tab',
    title: 'Earn Achievements',
    description: 'Unlock badges as you hit milestones. Complete workouts, set PRs, and build streaks to earn rewards!',
    placement: 'center',
    action: 'none',
    icon: 'trophy',
  },
  
  // 10. Profile Tab
  {
    id: 'profile-tab',
    title: 'Your Profile',
    description: 'Update your fitness goals, preferences, and settings here. The better AI knows you, the better your workouts!',
    placement: 'center',
    action: 'none',
    icon: 'person-circle',
  },
  
  // 11. Complete
  {
    id: 'complete',
    title: 'You\'re All Set! 💪',
    description: 'That\'s everything! Remember: consistency beats perfection. Start with today\'s workout and build your streak. Let\'s get it!',
    placement: 'center',
    action: 'none',
    icon: 'checkmark-circle',
  },
];
