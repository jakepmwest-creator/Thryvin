export interface CoachInfo {
  name: string;
  role: string;
  icon: string;
  colorClass: string;
}

export type CoachType = 
  // Strength Training Specialists
  | "max-stone" | "alexis-steel" 
  // Cardio and Endurance Specialists
  | "ethan-dash" | "zoey-blaze" 
  // Yoga and Flexibility Specialists
  | "kai-rivers" | "lila-sage" 
  // Calisthenics and Bodyweight Specialists
  | "leo-cruz" | "maya-flex" 
  // Nutrition and Wellness Specialists
  | "nate-green" | "sophie-gold" 
  // General Fitness and Motivation Specialists
  | "dylan-power" | "ava-blaze" 
  // Running & Triathlon Specialists
  | "ryder-swift" | "chloe-fleet";