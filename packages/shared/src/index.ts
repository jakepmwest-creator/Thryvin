// Export all shared functionality
export * from './types';
export * from './api-client';
export * from './ai-prompts';

// Business logic utilities
export const calculateBMI = (weight: number, height: number): number => {
  // height in cm, weight in kg
  const heightInMeters = height / 100;
  return weight / (heightInMeters * heightInMeters);
};

export const calculateCalorieTarget = (
  weight: number,
  height: number,
  age: number,
  gender: 'male' | 'female',
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active',
  goal: 'lose-weight' | 'maintain' | 'gain-muscle'
): number => {
  // Harris-Benedict equation
  let bmr: number;
  if (gender === 'male') {
    bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
  } else {
    bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
  }

  // Activity multipliers
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    'very-active': 1.9
  };

  const tdee = bmr * activityMultipliers[activityLevel];

  // Goal adjustments
  const goalAdjustments = {
    'lose-weight': -500, // 500 calorie deficit
    maintain: 0,
    'gain-muscle': 300 // 300 calorie surplus
  };

  return Math.round(tdee + goalAdjustments[goal]);
};

export const validateWorkoutPlan = (plan: any): boolean => {
  // Add validation logic for workout plans
  return !!(plan && plan.exercises && plan.exercises.length > 0);
};