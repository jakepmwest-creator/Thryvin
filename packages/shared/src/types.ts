import { z } from 'zod';

// User types
export const insertUserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string().min(6),
  trialEndsAt: z.date().optional(),
  fitnessLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  weeklyGoalWorkouts: z.number().optional(),
  weeklyGoalMinutes: z.number().optional(),
  equipment: z.string().optional(),
  healthConcerns: z.string().optional(),
  nutritionGoal: z.string().optional(),
  gender: z.enum(['male', 'female', 'non-binary', 'prefer-not-to-say']).optional(),
});

export const selectUserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  createdAt: z.string(),
  trialEndsAt: z.string().optional(),
  fitnessLevel: z.string().optional(),
  weeklyGoalWorkouts: z.number().optional(),
  weeklyGoalMinutes: z.number().optional(),
  equipment: z.string().optional(),
  healthConcerns: z.string().optional(),
  nutritionGoal: z.string().optional(),
  gender: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type SelectUser = z.infer<typeof selectUserSchema>;

// Fitness types
export type FitnessGoal = "lose-weight" | "gain-muscle" | "improve-endurance" | "improve-flexibility" | "general-fitness";
export type UserGender = "male" | "female" | "non-binary" | "prefer-not-to-say";
export type FitnessLevel = "beginner" | "intermediate" | "advanced";
export type WorkoutType = "strength" | "cardio" | "calisthenics" | "yoga" | "mixed";

// Coach types
export type CoachType = 
  | "max-stone" | "alexis-steel" 
  | "ethan-dash" | "zoey-blaze" 
  | "kai-rivers" | "lila-sage" 
  | "leo-cruz" | "maya-flex" 
  | "nate-green" | "sophie-gold" 
  | "dylan-power" | "ava-blaze" 
  | "ryder-swift" | "chloe-fleet";

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}