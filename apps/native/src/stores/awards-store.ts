import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage helpers - Use AsyncStorage for badges (can be large)
const getStorageItem = async (key: string): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    return null;
  }
};

const setStorageItem = async (key: string, value: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.error('Storage error:', error);
  }
};

const deleteStorageItem = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.warn('Delete storage error:', error);
  }
};

// ============ ISLAND TIER SYSTEM ============
export interface Island {
  id: number;
  name: string;
  subtitle: string;
  emoji: string;
  gradient: string[]; // For the island visual
  requiredBadges: number;
  xpMultiplier: number;
  landscapeColors: { sky: string; ground: string; accent: string };
}

// Fitness-themed islands that make sense!
export const ISLANDS: Island[] = [
  { 
    id: 1, 
    name: 'The Starting Line', 
    subtitle: 'Every legend begins here', 
    emoji: '🏁', 
    gradient: ['#A22BF6', '#FF4EC7'],
    requiredBadges: 0, 
    xpMultiplier: 1.0,
    landscapeColors: { sky: '#87CEEB', ground: '#90EE90', accent: '#FFD700' },
  },
  { 
    id: 2, 
    name: 'Newbie Gains', 
    subtitle: 'First gains unlocked', 
    emoji: '💪', 
    gradient: ['#A22BF6', '#FF4EC7'],
    requiredBadges: 8, 
    xpMultiplier: 1.15,
    landscapeColors: { sky: '#98D8C8', ground: '#7CB342', accent: '#8BC34A' },
  },
  { 
    id: 3, 
    name: 'The Grind Zone', 
    subtitle: 'Dedication is forged here', 
    emoji: '🔥', 
    gradient: ['#A22BF6', '#FF4EC7'],
    requiredBadges: 18, 
    xpMultiplier: 1.3,
    landscapeColors: { sky: '#FF9800', ground: '#BF360C', accent: '#FF5722' },
  },
  { 
    id: 4, 
    name: 'Iron Paradise', 
    subtitle: 'Where strength is built', 
    emoji: '🏋️', 
    gradient: ['#A22BF6', '#FF4EC7'],
    requiredBadges: 30, 
    xpMultiplier: 1.5,
    landscapeColors: { sky: '#78909C', ground: '#455A64', accent: '#B0BEC5' },
  },
  { 
    id: 5, 
    name: 'Beast Mode Bay', 
    subtitle: 'Unleash the beast within', 
    emoji: '🦁', 
    gradient: ['#A22BF6', '#FF4EC7'],
    requiredBadges: 45, 
    xpMultiplier: 1.75,
    landscapeColors: { sky: '#E91E63', ground: '#880E4F', accent: '#F06292' },
  },
  { 
    id: 6, 
    name: "Warrior's Haven", 
    subtitle: 'Warriors train here', 
    emoji: '⚔️', 
    gradient: ['#A22BF6', '#FF4EC7'],
    requiredBadges: 62, 
    xpMultiplier: 2.0,
    landscapeColors: { sky: '#9C27B0', ground: '#4A148C', accent: '#CE93D8' },
  },
  { 
    id: 7, 
    name: "Champion's Peak", 
    subtitle: 'Champions are made', 
    emoji: '🏆', 
    gradient: ['#A22BF6', '#FF4EC7'],
    requiredBadges: 80, 
    xpMultiplier: 2.5,
    landscapeColors: { sky: '#FFD700', ground: '#FF8F00', accent: '#FFEB3B' },
  },
  { 
    id: 8, 
    name: 'Elite Sanctuary', 
    subtitle: 'Only the elite reach here', 
    emoji: '👑', 
    gradient: ['#A22BF6', '#FF4EC7'],
    requiredBadges: 100, 
    xpMultiplier: 3.0,
    landscapeColors: { sky: '#1A237E', ground: '#0D47A1', accent: '#64B5F6' },
  },
  { 
    id: 9, 
    name: "Legend's Summit", 
    subtitle: 'Legendary status achieved', 
    emoji: '🌟', 
    gradient: ['#A22BF6', '#FF4EC7'],
    requiredBadges: 125, 
    xpMultiplier: 4.0,
    landscapeColors: { sky: '#311B92', ground: '#4527A0', accent: '#B388FF' },
  },
  { 
    id: 10, 
    name: 'Mount Olympus', 
    subtitle: 'Among the fitness gods', 
    emoji: '🏛️', 
    gradient: ['#A22BF6', '#FF4EC7'],
    requiredBadges: 150, 
    xpMultiplier: 5.0,
    landscapeColors: { sky: '#FFFFFF', ground: '#E0E0E0', accent: '#FFD700' },
  },
];

// Badge rarity types
export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

// Badge categories
export type BadgeCategory = 'consistency' | 'volume' | 'focus' | 'program' | 'challenge';

// Badge definition
export interface Badge {
  id: string;
  name: string;
  description: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  icon: string;
  targetType: 'workouts' | 'streak' | 'totalSets' | 'totalReps' | 'totalMinutes' | 'categorySessions' | 'weeklyConsistency';
  targetValue: number;
  targetCategory?: string;
  tier?: number;
  gradient: string[];
  xp: number;
  island: number; // Which island this badge belongs to
}

// User's badge progress
export interface UserBadge {
  badgeId: string;
  progress: number;
  completed: boolean;
  unlockedAt?: string;
}

// ============ MASSIVE BADGE LIST BY ISLAND ============
export const BADGE_DEFINITIONS: Badge[] = [
  // ==================== ISLAND 1: THE STARTING LINE ====================
  // Milestone badges - First achievements
  { id: 'i1_first_workout', name: 'First Steps', description: 'Complete your first workout', category: 'program', rarity: 'common', icon: 'footsteps', targetType: 'workouts', targetValue: 1, tier: 0, gradient: ['#34C759', '#00C7BE'], xp: 100, island: 1 },
  { id: 'i1_first_coach_chat', name: 'Making Friends', description: 'Have your first conversation with your AI coach', category: 'program', rarity: 'common', icon: 'chatbubbles', targetType: 'coachConversations', targetValue: 1, tier: 0, gradient: ['#5B8DEF', '#34C4E5'], xp: 75, island: 1 },
  // Consistency
  { id: 'i1_streak_3', name: 'Getting Moving', description: '3 day streak', category: 'consistency', rarity: 'common', icon: 'flame', targetType: 'streak', targetValue: 3, tier: 1, gradient: ['#A22BF6', '#FF4EC7'], xp: 50, island: 1 },
  { id: 'i1_streak_5', name: 'Warming Up', description: '5 day streak', category: 'consistency', rarity: 'common', icon: 'flame', targetType: 'streak', targetValue: 5, tier: 2, gradient: ['#A22BF6', '#FF4EC7'], xp: 100, island: 1 },
  { id: 'i1_streak_7', name: 'Week Warrior', description: '7 day streak', category: 'consistency', rarity: 'rare', icon: 'flame', targetType: 'streak', targetValue: 7, tier: 3, gradient: ['#FF6B35', '#FFD60A'], xp: 150, island: 1 },
  // Program
  { id: 'i1_workout_7', name: 'First Week', description: 'Complete 7 workouts', category: 'program', rarity: 'common', icon: 'footsteps', targetType: 'workouts', targetValue: 7, tier: 1, gradient: ['#34C759', '#00C7BE'], xp: 75, island: 1 },
  { id: 'i1_workout_14', name: 'Two Weeks Strong', description: 'Complete 14 workouts', category: 'program', rarity: 'common', icon: 'fitness', targetType: 'workouts', targetValue: 14, tier: 2, gradient: ['#5B8DEF', '#34C4E5'], xp: 150, island: 1 },
  { id: 'i1_workout_21', name: 'Three Week Champion', description: 'Complete 21 workouts', category: 'program', rarity: 'rare', icon: 'checkmark-done', targetType: 'workouts', targetValue: 21, tier: 3, gradient: ['#34C759', '#00C7BE'], xp: 250, island: 1 },
  // Volume
  { id: 'i1_sets_50', name: 'Set Starter', description: 'Complete 50 sets', category: 'volume', rarity: 'common', icon: 'layers', targetType: 'totalSets', targetValue: 50, tier: 1, gradient: ['#5B8DEF', '#34C4E5'], xp: 75, island: 1 },
  { id: 'i1_reps_500', name: 'Rep Rookie', description: 'Complete 500 reps', category: 'volume', rarity: 'common', icon: 'barbell', targetType: 'totalReps', targetValue: 500, tier: 1, gradient: ['#FF6B35', '#FFD60A'], xp: 75, island: 1 },
  // Cardio (for cardio-focused users)
  { id: 'i1_cardio_30min', name: 'Cardio Starter', description: '30 minutes of cardio', category: 'focus', rarity: 'common', icon: 'heart', targetType: 'totalMinutes', targetValue: 30, targetCategory: 'cardio', tier: 1, gradient: ['#FF3B30', '#FF9500'], xp: 75, island: 1 },
  { id: 'i1_cardio_60min', name: 'Cardio Hour', description: '60 minutes of cardio', category: 'focus', rarity: 'common', icon: 'heart', targetType: 'totalMinutes', targetValue: 60, targetCategory: 'cardio', tier: 2, gradient: ['#FF6B35', '#FFD60A'], xp: 150, island: 1 },
  { id: 'i1_cardio_180min', name: 'Cardio Crusher', description: '180 minutes of cardio', category: 'focus', rarity: 'rare', icon: 'heart-circle', targetType: 'totalMinutes', targetValue: 180, targetCategory: 'cardio', tier: 3, gradient: ['#34C759', '#00C7BE'], xp: 250, island: 1 },

  // ==================== ISLAND 2: NEWBIE GAINS ====================
  // Consistency
  { id: 'i2_streak_14', name: 'Two Week Fire', description: '14 day streak', category: 'consistency', rarity: 'common', icon: 'flame', targetType: 'streak', targetValue: 14, tier: 4, gradient: ['#FF6B35', '#FFD60A'], xp: 200, island: 2 },
  { id: 'i2_streak_21', name: 'Three Week Titan', description: '21 day streak', category: 'consistency', rarity: 'rare', icon: 'flame', targetType: 'streak', targetValue: 21, tier: 5, gradient: ['#FF3B30', '#FF9500'], xp: 300, island: 2 },
  // Program  
  { id: 'i2_workout_30', name: 'Month Master', description: 'Complete 30 workouts', category: 'program', rarity: 'common', icon: 'medal', targetType: 'workouts', targetValue: 30, tier: 4, gradient: ['#5B8DEF', '#34C4E5'], xp: 300, island: 2 },
  { id: 'i2_workout_45', name: 'Committed', description: 'Complete 45 workouts', category: 'program', rarity: 'common', icon: 'ribbon', targetType: 'workouts', targetValue: 45, tier: 5, gradient: ['#34C759', '#00C7BE'], xp: 400, island: 2 },
  { id: 'i2_workout_60', name: 'Habit Locked', description: 'Complete 60 workouts', category: 'program', rarity: 'rare', icon: 'trophy', targetType: 'workouts', targetValue: 60, tier: 6, gradient: ['#FFD700', '#FFA500'], xp: 500, island: 2 },
  // Volume
  { id: 'i2_sets_150', name: 'Set Builder', description: 'Complete 150 sets', category: 'volume', rarity: 'common', icon: 'layers', targetType: 'totalSets', targetValue: 150, tier: 2, gradient: ['#34C759', '#00C7BE'], xp: 125, island: 2 },
  { id: 'i2_sets_300', name: 'Set Stacker', description: 'Complete 300 sets', category: 'volume', rarity: 'rare', icon: 'layers', targetType: 'totalSets', targetValue: 300, tier: 3, gradient: ['#FF6B35', '#FFD60A'], xp: 200, island: 2 },
  { id: 'i2_reps_1500', name: 'Rep Builder', description: 'Complete 1,500 reps', category: 'volume', rarity: 'common', icon: 'barbell', targetType: 'totalReps', targetValue: 1500, tier: 2, gradient: ['#5B8DEF', '#34C4E5'], xp: 125, island: 2 },
  { id: 'i2_reps_3000', name: 'Rep Machine', description: 'Complete 3,000 reps', category: 'volume', rarity: 'rare', icon: 'barbell', targetType: 'totalReps', targetValue: 3000, tier: 3, gradient: ['#A22BF6', '#FF4EC7'], xp: 200, island: 2 },
  { id: 'i2_hours_10', name: '10 Hour Mark', description: 'Train for 10 hours', category: 'volume', rarity: 'common', icon: 'time', targetType: 'totalMinutes', targetValue: 600, tier: 1, gradient: ['#5B8DEF', '#34C4E5'], xp: 150, island: 2 },
  // Focus
  { id: 'i2_legs_6', name: 'Leg Day Starter', description: '6 leg sessions', category: 'focus', rarity: 'common', icon: 'body', targetType: 'categorySessions', targetValue: 6, targetCategory: 'lower', tier: 1, gradient: ['#34C759', '#00C7BE'], xp: 100, island: 2 },
  { id: 'i2_upper_6', name: 'Upper Beginner', description: '6 upper body sessions', category: 'focus', rarity: 'common', icon: 'fitness', targetType: 'categorySessions', targetValue: 6, targetCategory: 'upper', tier: 1, gradient: ['#FF3B30', '#FF9500'], xp: 100, island: 2 },

  // ==================== ISLAND 3: THE GRIND ZONE ====================
  // Consistency
  { id: 'i3_streak_21', name: 'Three Week Fire', description: '21 day streak', category: 'consistency', rarity: 'rare', icon: 'flame', targetType: 'streak', targetValue: 21, tier: 6, gradient: ['#FF3B30', '#FF9500'], xp: 200, island: 3 },
  { id: 'i3_streak_30', name: 'Month Master', description: '30 day streak', category: 'consistency', rarity: 'epic', icon: 'flame', targetType: 'streak', targetValue: 30, tier: 7, gradient: ['#A22BF6', '#FF4EC7'], xp: 300, island: 3 },
  // Program
  { id: 'i3_workout_30', name: 'Thirty Strong', description: 'Complete 30 workouts', category: 'program', rarity: 'rare', icon: 'medal', targetType: 'workouts', targetValue: 30, tier: 7, gradient: ['#FFD700', '#FFA500'], xp: 225, island: 3 },
  { id: 'i3_workout_40', name: 'Forty Finisher', description: 'Complete 40 workouts', category: 'program', rarity: 'rare', icon: 'ribbon', targetType: 'workouts', targetValue: 40, tier: 8, gradient: ['#FF6B35', '#FF4500'], xp: 275, island: 3 },
  { id: 'i3_workout_50', name: 'Half Century', description: 'Complete 50 workouts', category: 'program', rarity: 'epic', icon: 'trophy', targetType: 'workouts', targetValue: 50, tier: 9, gradient: ['#A22BF6', '#FF4EC7'], xp: 350, island: 3 },
  // Volume
  { id: 'i3_sets_300', name: 'Set Crusher', description: 'Complete 300 sets', category: 'volume', rarity: 'rare', icon: 'layers', targetType: 'totalSets', targetValue: 300, tier: 4, gradient: ['#FF6B35', '#FFD60A'], xp: 200, island: 3 },
  { id: 'i3_sets_500', name: 'Set Destroyer', description: 'Complete 500 sets', category: 'volume', rarity: 'epic', icon: 'layers', targetType: 'totalSets', targetValue: 500, tier: 5, gradient: ['#A22BF6', '#FF4EC7'], xp: 300, island: 3 },
  { id: 'i3_reps_3000', name: 'Rep Crusher', description: 'Complete 3,000 reps', category: 'volume', rarity: 'rare', icon: 'barbell', targetType: 'totalReps', targetValue: 3000, tier: 4, gradient: ['#FF3B30', '#FF9500'], xp: 200, island: 3 },
  { id: 'i3_reps_5000', name: '5K Reps', description: 'Complete 5,000 reps', category: 'volume', rarity: 'epic', icon: 'barbell', targetType: 'totalReps', targetValue: 5000, tier: 5, gradient: ['#FFD700', '#FFA500'], xp: 300, island: 3 },
  { id: 'i3_hours_15', name: '15 Hour Club', description: 'Train for 15 hours', category: 'volume', rarity: 'rare', icon: 'time', targetType: 'totalMinutes', targetValue: 900, tier: 2, gradient: ['#34C759', '#00C7BE'], xp: 200, island: 3 },
  { id: 'i3_hours_25', name: '25 Hour Warrior', description: 'Train for 25 hours', category: 'volume', rarity: 'epic', icon: 'time', targetType: 'totalMinutes', targetValue: 1500, tier: 3, gradient: ['#FF6B35', '#FF4500'], xp: 300, island: 3 },
  // Focus
  { id: 'i3_legs_7', name: 'Leg Day Regular', description: '7 leg sessions', category: 'focus', rarity: 'common', icon: 'body', targetType: 'categorySessions', targetValue: 7, targetCategory: 'lower', tier: 2, gradient: ['#98FB98', '#32CD32'], xp: 100, island: 3 },
  { id: 'i3_legs_12', name: 'Leg Day Loyalist', description: '12 leg sessions', category: 'focus', rarity: 'rare', icon: 'body', targetType: 'categorySessions', targetValue: 12, targetCategory: 'lower', tier: 3, gradient: ['#34C759', '#00C7BE'], xp: 175, island: 3 },
  { id: 'i3_upper_7', name: 'Upper Regular', description: '7 upper sessions', category: 'focus', rarity: 'common', icon: 'fitness', targetType: 'categorySessions', targetValue: 7, targetCategory: 'upper', tier: 2, gradient: ['#DDA0DD', '#BA55D3'], xp: 100, island: 3 },
  { id: 'i3_upper_12', name: 'Upper Master', description: '12 upper sessions', category: 'focus', rarity: 'rare', icon: 'fitness', targetType: 'categorySessions', targetValue: 12, targetCategory: 'upper', tier: 3, gradient: ['#A22BF6', '#FF4EC7'], xp: 175, island: 3 },
  { id: 'i3_full_5', name: 'Full Body Fan', description: '5 full body sessions', category: 'focus', rarity: 'common', icon: 'man', targetType: 'categorySessions', targetValue: 5, targetCategory: 'full', tier: 1, gradient: ['#5B8DEF', '#34C4E5'], xp: 75, island: 3 },
  { id: 'i3_cardio_5', name: 'Cardio Starter', description: '5 cardio sessions', category: 'focus', rarity: 'common', icon: 'heart', targetType: 'categorySessions', targetValue: 5, targetCategory: 'cardio', tier: 1, gradient: ['#FF6B35', '#FFD60A'], xp: 75, island: 3 },
  // Challenge
  { id: 'i3_weekend_5', name: 'Weekend Starter', description: '5 weekend workouts', category: 'challenge', rarity: 'common', icon: 'calendar', targetType: 'workouts', targetValue: 5, tier: 1, gradient: ['#34C759', '#00C7BE'], xp: 100, island: 3 },

  // ==================== ISLAND 4: IRON PARADISE ====================
  // Consistency  
  { id: 'i4_streak_45', name: '45 Day Blaze', description: '45 day streak', category: 'consistency', rarity: 'epic', icon: 'flame', targetType: 'streak', targetValue: 45, tier: 8, gradient: ['#FF3B30', '#FF9500'], xp: 400, island: 4 },
  { id: 'i4_streak_60', name: 'Two Month Fire', description: '60 day streak', category: 'consistency', rarity: 'epic', icon: 'flame', targetType: 'streak', targetValue: 60, tier: 9, gradient: ['#A22BF6', '#FF4EC7'], xp: 500, island: 4 },
  // Program
  { id: 'i4_workout_75', name: 'Seventy Five', description: 'Complete 75 workouts', category: 'program', rarity: 'epic', icon: 'medal', targetType: 'workouts', targetValue: 75, tier: 10, gradient: ['#9400D3', '#4B0082'], xp: 450, island: 4 },
  { id: 'i4_workout_100', name: 'Century Club', description: 'Complete 100 workouts', category: 'program', rarity: 'epic', icon: 'trophy', targetType: 'workouts', targetValue: 100, tier: 11, gradient: ['#FFD700', '#FFA500'], xp: 600, island: 4 },
  // Volume
  { id: 'i4_sets_750', name: 'Set Master', description: 'Complete 750 sets', category: 'volume', rarity: 'epic', icon: 'layers', targetType: 'totalSets', targetValue: 750, tier: 6, gradient: ['#FF3B30', '#FF9500'], xp: 400, island: 4 },
  { id: 'i4_sets_1000', name: '1K Sets', description: 'Complete 1,000 sets', category: 'volume', rarity: 'legendary', icon: 'layers', targetType: 'totalSets', targetValue: 1000, tier: 7, gradient: ['#FFD700', '#FFA500'], xp: 550, island: 4 },
  { id: 'i4_reps_7500', name: '7.5K Reps', description: 'Complete 7,500 reps', category: 'volume', rarity: 'epic', icon: 'barbell', targetType: 'totalReps', targetValue: 7500, tier: 6, gradient: ['#A22BF6', '#FF4EC7'], xp: 400, island: 4 },
  { id: 'i4_reps_10000', name: '10K Reps', description: 'Complete 10,000 reps', category: 'volume', rarity: 'legendary', icon: 'barbell', targetType: 'totalReps', targetValue: 10000, tier: 7, gradient: ['#FFD700', '#FFA500'], xp: 550, island: 4 },
  { id: 'i4_hours_50', name: '50 Hour Mark', description: 'Train for 50 hours', category: 'volume', rarity: 'epic', icon: 'time', targetType: 'totalMinutes', targetValue: 3000, tier: 4, gradient: ['#FF6B35', '#FF4500'], xp: 450, island: 4 },
  // Focus
  { id: 'i4_legs_20', name: 'Leg Day Pro', description: '20 leg sessions', category: 'focus', rarity: 'epic', icon: 'body', targetType: 'categorySessions', targetValue: 20, targetCategory: 'lower', tier: 4, gradient: ['#FF6B35', '#FFD60A'], xp: 275, island: 4 },
  { id: 'i4_upper_20', name: 'Upper Pro', description: '20 upper sessions', category: 'focus', rarity: 'epic', icon: 'fitness', targetType: 'categorySessions', targetValue: 20, targetCategory: 'upper', tier: 4, gradient: ['#FF3B30', '#FF9500'], xp: 275, island: 4 },
  { id: 'i4_full_12', name: 'Full Body Freak', description: '12 full body sessions', category: 'focus', rarity: 'rare', icon: 'man', targetType: 'categorySessions', targetValue: 12, targetCategory: 'full', tier: 2, gradient: ['#5B8DEF', '#34C4E5'], xp: 200, island: 4 },
  { id: 'i4_cardio_12', name: 'Cardio Regular', description: '12 cardio sessions', category: 'focus', rarity: 'rare', icon: 'heart', targetType: 'categorySessions', targetValue: 12, targetCategory: 'cardio', tier: 2, gradient: ['#FF6B35', '#FFD60A'], xp: 200, island: 4 },
  // Challenge
  { id: 'i4_weekend_12', name: 'Weekend Warrior', description: '12 weekend workouts', category: 'challenge', rarity: 'rare', icon: 'calendar', targetType: 'workouts', targetValue: 12, tier: 2, gradient: ['#98FB98', '#32CD32'], xp: 200, island: 4 },
  { id: 'i4_early_3', name: 'Early Riser', description: '3 early morning workouts', category: 'challenge', rarity: 'rare', icon: 'sunny', targetType: 'workouts', targetValue: 3, tier: 1, gradient: ['#FFD60A', '#FF9500'], xp: 175, island: 4 },

  // ==================== ISLAND 5: BEAST MODE BAY ====================
  // Consistency
  { id: 'i5_streak_90', name: 'Three Month Blaze', description: '90 day streak', category: 'consistency', rarity: 'legendary', icon: 'flame', targetType: 'streak', targetValue: 90, tier: 10, gradient: ['#FFD700', '#FFA500'], xp: 750, island: 5 },
  // Program
  { id: 'i5_workout_150', name: '150 Strong', description: 'Complete 150 workouts', category: 'program', rarity: 'legendary', icon: 'medal', targetType: 'workouts', targetValue: 150, tier: 12, gradient: ['#FFD700', '#FFA500'], xp: 800, island: 5 },
  { id: 'i5_workout_200', name: 'Two Hundred', description: 'Complete 200 workouts', category: 'program', rarity: 'legendary', icon: 'trophy', targetType: 'workouts', targetValue: 200, tier: 13, gradient: ['#A22BF6', '#FF4EC7'], xp: 1000, island: 5 },
  // Volume
  { id: 'i5_sets_1500', name: '1.5K Sets', description: 'Complete 1,500 sets', category: 'volume', rarity: 'legendary', icon: 'layers', targetType: 'totalSets', targetValue: 1500, tier: 8, gradient: ['#A22BF6', '#FF4EC7'], xp: 700, island: 5 },
  { id: 'i5_reps_15000', name: '15K Reps', description: 'Complete 15,000 reps', category: 'volume', rarity: 'legendary', icon: 'barbell', targetType: 'totalReps', targetValue: 15000, tier: 8, gradient: ['#FF3B30', '#FF9500'], xp: 700, island: 5 },
  { id: 'i5_hours_75', name: '75 Hour Legend', description: 'Train for 75 hours', category: 'volume', rarity: 'legendary', icon: 'time', targetType: 'totalMinutes', targetValue: 4500, tier: 5, gradient: ['#FFD700', '#FFA500'], xp: 600, island: 5 },
  { id: 'i5_hours_100', name: '100 Hour Club', description: 'Train for 100 hours', category: 'volume', rarity: 'legendary', icon: 'time', targetType: 'totalMinutes', targetValue: 6000, tier: 6, gradient: ['#A22BF6', '#FF4EC7'], xp: 800, island: 5 },
  // Focus
  { id: 'i5_legs_30', name: 'Leg Day Legend', description: '30 leg sessions', category: 'focus', rarity: 'epic', icon: 'body', targetType: 'categorySessions', targetValue: 30, targetCategory: 'lower', tier: 5, gradient: ['#34C759', '#00C7BE'], xp: 400, island: 5 },
  { id: 'i5_upper_30', name: 'Upper Legend', description: '30 upper sessions', category: 'focus', rarity: 'epic', icon: 'fitness', targetType: 'categorySessions', targetValue: 30, targetCategory: 'upper', tier: 5, gradient: ['#A22BF6', '#FF4EC7'], xp: 400, island: 5 },
  { id: 'i5_full_20', name: 'Full Body Master', description: '20 full body sessions', category: 'focus', rarity: 'epic', icon: 'man', targetType: 'categorySessions', targetValue: 20, targetCategory: 'full', tier: 3, gradient: ['#87CEEB', '#48D1CC'], xp: 325, island: 5 },
  { id: 'i5_cardio_20', name: 'Cardio King', description: '20 cardio sessions', category: 'focus', rarity: 'epic', icon: 'heart', targetType: 'categorySessions', targetValue: 20, targetCategory: 'cardio', tier: 3, gradient: ['#FF3B30', '#FF9500'], xp: 325, island: 5 },
  // Challenge
  { id: 'i5_weekend_25', name: 'Weekend Champion', description: '25 weekend workouts', category: 'challenge', rarity: 'epic', icon: 'calendar', targetType: 'workouts', targetValue: 25, tier: 3, gradient: ['#34C759', '#00C7BE'], xp: 350, island: 5 },
  { id: 'i5_early_10', name: 'Dawn Warrior', description: '10 early morning workouts', category: 'challenge', rarity: 'epic', icon: 'sunny', targetType: 'workouts', targetValue: 10, tier: 2, gradient: ['#FF6B35', '#FF4500'], xp: 350, island: 5 },

  // ==================== ISLAND 6-10: LEGENDARY TIER (More badges) ====================
  // Island 6: Warrior's Haven
  { id: 'i6_streak_120', name: 'Four Month Fire', description: '120 day streak', category: 'consistency', rarity: 'legendary', icon: 'flame', targetType: 'streak', targetValue: 120, tier: 11, gradient: ['#FFD700', '#FFA500'], xp: 1000, island: 6 },
  { id: 'i6_workout_250', name: 'Quarter Thousand', description: '250 workouts', category: 'program', rarity: 'legendary', icon: 'trophy', targetType: 'workouts', targetValue: 250, tier: 14, gradient: ['#9400D3', '#4B0082'], xp: 1200, island: 6 },
  { id: 'i6_sets_2000', name: '2K Sets', description: 'Complete 2,000 sets', category: 'volume', rarity: 'legendary', icon: 'layers', targetType: 'totalSets', targetValue: 2000, tier: 9, gradient: ['#FFD700', '#FFA500'], xp: 900, island: 6 },
  { id: 'i6_reps_25000', name: '25K Reps', description: 'Complete 25,000 reps', category: 'volume', rarity: 'legendary', icon: 'barbell', targetType: 'totalReps', targetValue: 25000, tier: 9, gradient: ['#A22BF6', '#FF4EC7'], xp: 900, island: 6 },
  { id: 'i6_hours_150', name: '150 Hour Beast', description: 'Train for 150 hours', category: 'volume', rarity: 'legendary', icon: 'time', targetType: 'totalMinutes', targetValue: 9000, tier: 7, gradient: ['#FF6B35', '#FF4500'], xp: 1000, island: 6 },
  { id: 'i6_legs_50', name: 'Leg Day God', description: '50 leg sessions', category: 'focus', rarity: 'legendary', icon: 'body', targetType: 'categorySessions', targetValue: 50, targetCategory: 'lower', tier: 6, gradient: ['#FFD700', '#FFA500'], xp: 600, island: 6 },
  { id: 'i6_upper_50', name: 'Upper God', description: '50 upper sessions', category: 'focus', rarity: 'legendary', icon: 'fitness', targetType: 'categorySessions', targetValue: 50, targetCategory: 'upper', tier: 6, gradient: ['#FFD700', '#FFA500'], xp: 600, island: 6 },

  // Island 7: Champion's Peak
  { id: 'i7_streak_180', name: 'Six Month Inferno', description: '180 day streak', category: 'consistency', rarity: 'legendary', icon: 'flame', targetType: 'streak', targetValue: 180, tier: 12, gradient: ['#FFD700', '#FFA500'], xp: 1500, island: 7 },
  { id: 'i7_workout_365', name: 'Year of Iron', description: '365 workouts', category: 'program', rarity: 'legendary', icon: 'trophy', targetType: 'workouts', targetValue: 365, tier: 15, gradient: ['#FFD700', '#FFA500'], xp: 2000, island: 7 },
  { id: 'i7_sets_3000', name: '3K Sets', description: 'Complete 3,000 sets', category: 'volume', rarity: 'legendary', icon: 'layers', targetType: 'totalSets', targetValue: 3000, tier: 10, gradient: ['#A22BF6', '#FF4EC7'], xp: 1200, island: 7 },
  { id: 'i7_reps_40000', name: '40K Reps', description: 'Complete 40,000 reps', category: 'volume', rarity: 'legendary', icon: 'barbell', targetType: 'totalReps', targetValue: 40000, tier: 10, gradient: ['#FFD700', '#FFA500'], xp: 1200, island: 7 },
  { id: 'i7_hours_250', name: '250 Hour Titan', description: 'Train for 250 hours', category: 'volume', rarity: 'legendary', icon: 'time', targetType: 'totalMinutes', targetValue: 15000, tier: 8, gradient: ['#A22BF6', '#FF4EC7'], xp: 1400, island: 7 },

  // Island 8: Elite Sanctuary
  { id: 'i8_streak_270', name: 'Nine Month Fire', description: '270 day streak', category: 'consistency', rarity: 'legendary', icon: 'flame', targetType: 'streak', targetValue: 270, tier: 13, gradient: ['#FFD700', '#FFA500'], xp: 2000, island: 8 },
  { id: 'i8_workout_500', name: 'Half Thousand', description: '500 workouts', category: 'program', rarity: 'legendary', icon: 'diamond', targetType: 'workouts', targetValue: 500, tier: 16, gradient: ['#FFD700', '#FFA500'], xp: 2500, island: 8 },
  { id: 'i8_sets_5000', name: '5K Sets', description: 'Complete 5,000 sets', category: 'volume', rarity: 'legendary', icon: 'layers', targetType: 'totalSets', targetValue: 5000, tier: 11, gradient: ['#FFD700', '#FFA500'], xp: 1800, island: 8 },
  { id: 'i8_hours_400', name: '400 Hour Elite', description: 'Train for 400 hours', category: 'volume', rarity: 'legendary', icon: 'time', targetType: 'totalMinutes', targetValue: 24000, tier: 9, gradient: ['#FFD700', '#FFA500'], xp: 2000, island: 8 },

  // Island 9: Legend's Summit
  { id: 'i9_streak_365', name: 'Year of Fire', description: '365 day streak', category: 'consistency', rarity: 'legendary', icon: 'flame', targetType: 'streak', targetValue: 365, tier: 14, gradient: ['#FFD700', '#FFA500'], xp: 3000, island: 9 },
  { id: 'i9_workout_750', name: 'Seven Fifty', description: '750 workouts', category: 'program', rarity: 'legendary', icon: 'star', targetType: 'workouts', targetValue: 750, tier: 17, gradient: ['#FFD700', '#FFA500'], xp: 3500, island: 9 },
  { id: 'i9_hours_600', name: '600 Hour Legend', description: 'Train for 600 hours', category: 'volume', rarity: 'legendary', icon: 'time', targetType: 'totalMinutes', targetValue: 36000, tier: 10, gradient: ['#FFD700', '#FFA500'], xp: 3000, island: 9 },

  // Island 10: Mount Olympus
  { id: 'i10_streak_500', name: 'Eternal Flame', description: '500 day streak', category: 'consistency', rarity: 'legendary', icon: 'flame', targetType: 'streak', targetValue: 500, tier: 15, gradient: ['#FFD700', '#FFA500'], xp: 5000, island: 10 },
  { id: 'i10_workout_1000', name: 'The Thousand', description: '1,000 workouts', category: 'program', rarity: 'legendary', icon: 'diamond', targetType: 'workouts', targetValue: 1000, tier: 18, gradient: ['#FFD700', '#FFA500'], xp: 5000, island: 10 },
  { id: 'i10_hours_1000', name: '1000 Hour God', description: 'Train for 1,000 hours', category: 'volume', rarity: 'legendary', icon: 'time', targetType: 'totalMinutes', targetValue: 60000, tier: 11, gradient: ['#FFD700', '#FFA500'], xp: 5000, island: 10 },
  { id: 'i10_olympian', name: 'Olympian', description: 'Reach Mount Olympus', category: 'program', rarity: 'legendary', icon: 'star', targetType: 'workouts', targetValue: 1, tier: 99, gradient: ['#FFD700', '#FFA500'], xp: 10000, island: 10 },
];

// Rarity colors
export const RARITY_COLORS: Record<BadgeRarity, { bg: string; text: string; border: string }> = {
  common: { bg: '#E8E8E8', text: '#666666', border: '#CCCCCC' },
  rare: { bg: '#E3F2FD', text: '#1976D2', border: '#42A5F5' },
  epic: { bg: '#F3E5F5', text: '#7B1FA2', border: '#AB47BC' },
  legendary: { bg: '#FFF8E1', text: '#F57F17', border: '#FFD700' },
};

export const RARITY_LABELS: Record<BadgeRarity, string> = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

interface AwardsState {
  userBadges: UserBadge[];
  newlyUnlocked: string[];
  totalXP: number;
  currentIsland: number;
  
  loadUserBadges: () => Promise<void>;
  checkBadges: (workoutData: WorkoutDataForBadges) => Promise<string[]>;
  clearNewlyUnlocked: () => void;
  getBadgeProgress: (badgeId: string) => UserBadge | undefined;
  getCompletedCount: () => number;
  getCurrentIsland: () => Island;
  getIslandProgress: () => { current: number; required: number; percentage: number };
  getBadgesForIsland: (islandId: number) => Badge[];
  resetToStartingLine: () => Promise<void>;
  resetAllAwards: () => Promise<void>;
  updateBadgeProgress: (workoutStats: {
    totalWorkouts: number;
    currentStreak: number;
    totalSets: number;
    totalReps: number;
    totalMinutes: number;
    cardioMinutes: number;
    strengthSessions: number;
    cardioSessions: number;
    upperBodySessions: number;
    lowerBodySessions: number;
    fullBodySessions: number;
  }) => Promise<Badge[]>;
}

interface WorkoutDataForBadges {
  totalWorkouts: number;
  currentStreak: number;
  totalSets: number;
  totalReps: number;
  totalMinutes: number;
  weeklyWorkouts: number;
  categoryCounts: Record<string, number>;
}

export const useAwardsStore = create<AwardsState>((set, get) => ({
  userBadges: [],
  newlyUnlocked: [],
  totalXP: 0,
  currentIsland: 1,

  loadUserBadges: async () => {
    try {
      const stored = await getStorageItem('user_badges_v3');
      if (stored) {
        const data = JSON.parse(stored);
        const userBadges = data.badges || [];
        let currentIsland = data.currentIsland || 1;
        
        // AUTO-CORRECT: Verify user is on correct island based on 80% rule
        let correctIsland = 1; // Start from island 1
        
        for (let islandNum = 1; islandNum <= 10; islandNum++) {
          const islandBadges = BADGE_DEFINITIONS.filter(b => b.island === islandNum);
          const completedCount = userBadges.filter((ub: UserBadge) => {
            const badge = BADGE_DEFINITIONS.find(b => b.id === ub.badgeId && b.island === islandNum);
            return badge && ub.completed;
          }).length;
          
          const requiredCompletion = Math.max(1, Math.ceil(islandBadges.length * 0.8));
          
          // If user has completed 80%+ of this island, they qualify for next island
          if (completedCount >= requiredCompletion && islandNum < 10) {
            correctIsland = islandNum + 1;
          } else {
            // Stop at first island where they haven't met the 80% requirement
            break;
          }
        }
        
        // If stored island doesn't match calculated correct island, fix it
        if (currentIsland !== correctIsland) {
          console.log(`🔧 [AWARDS] Auto-correcting island: ${currentIsland} → ${correctIsland}`);
          currentIsland = correctIsland;
          await setStorageItem('user_badges_v3', JSON.stringify({ 
            badges: userBadges, 
            totalXP: data.totalXP || 0, 
            currentIsland: correctIsland 
          }));
        }
        
        set({ 
          userBadges,
          totalXP: data.totalXP || 0,
          currentIsland,
        });
      } else {
        const initialBadges: UserBadge[] = BADGE_DEFINITIONS.map(badge => ({
          badgeId: badge.id,
          progress: 0,
          completed: false,
        }));
        set({ userBadges: initialBadges, totalXP: 0, currentIsland: 1 });
        await setStorageItem('user_badges_v3', JSON.stringify({ badges: initialBadges, totalXP: 0, currentIsland: 1 }));
      }
    } catch (error) {
      console.error('Error loading badges:', error);
    }
  },

  checkBadges: async (workoutData: WorkoutDataForBadges) => {
    const { userBadges, totalXP, currentIsland } = get();
    const newlyUnlockedIds: string[] = [];
    let xpGained = 0;
    
    const updatedBadges = userBadges.map(userBadge => {
      const badgeDef = BADGE_DEFINITIONS.find(b => b.id === userBadge.badgeId);
      if (!badgeDef || userBadge.completed) return userBadge;
      if (badgeDef.island > currentIsland) return userBadge;
      
      let newProgress = 0;
      
      switch (badgeDef.targetType) {
        case 'workouts': newProgress = workoutData.totalWorkouts; break;
        case 'streak': newProgress = workoutData.currentStreak; break;
        case 'totalSets': newProgress = workoutData.totalSets; break;
        case 'totalReps': newProgress = workoutData.totalReps; break;
        case 'totalMinutes': newProgress = workoutData.totalMinutes; break;
        case 'weeklyConsistency': newProgress = workoutData.weeklyWorkouts; break;
        case 'categorySessions':
          if (badgeDef.targetCategory) {
            newProgress = workoutData.categoryCounts[badgeDef.targetCategory] || 0;
          }
          break;
      }
      
      const wasCompleted = userBadge.completed;
      const isNowCompleted = newProgress >= badgeDef.targetValue;
      
      if (isNowCompleted && !wasCompleted) {
        const island = ISLANDS.find(i => i.id === currentIsland);
        const multiplier = island?.xpMultiplier || 1;
        const earnedXP = Math.round(badgeDef.xp * multiplier);
        newlyUnlockedIds.push(badgeDef.id);
        xpGained += earnedXP;
      }
      
      return {
        ...userBadge,
        progress: Math.min(newProgress, badgeDef.targetValue),
        completed: isNowCompleted,
        unlockedAt: isNowCompleted && !wasCompleted ? new Date().toISOString() : userBadge.unlockedAt,
      };
    });
    
    const newTotalXP = totalXP + xpGained;
    const completedCount = updatedBadges.filter(b => b.completed).length;
    let newIsland = currentIsland;
    
    // Check if user has completed ~80% of badges on current island to unlock next
    // This allows users to skip badges that don't fit their workout style (e.g., cardio-only or strength-only)
    const currentIslandBadges = BADGE_DEFINITIONS.filter(b => b.island === currentIsland);
    const currentIslandCompletedCount = updatedBadges.filter(ub => {
      const badge = BADGE_DEFINITIONS.find(b => b.id === ub.badgeId && b.island === currentIsland);
      return badge && ub.completed;
    }).length;
    
    // Calculate required completion (80% of badges, minimum 1 badge)
    const requiredCompletion = Math.max(1, Math.ceil(currentIslandBadges.length * 0.8));
    
    // If 80%+ of current island badges are complete, check if we can move to next island
    if (currentIslandCompletedCount >= requiredCompletion && currentIsland < ISLANDS.length) {
      // Check total badges to see which island we qualify for
      for (let i = ISLANDS.length - 1; i >= 0; i--) {
        if (completedCount >= ISLANDS[i].requiredBadges && ISLANDS[i].id > currentIsland) {
          newIsland = ISLANDS[i].id;
          break;
        }
      }
    }
    
    set({ userBadges: updatedBadges, newlyUnlocked: newlyUnlockedIds, totalXP: newTotalXP, currentIsland: newIsland });
    await setStorageItem('user_badges_v3', JSON.stringify({ badges: updatedBadges, totalXP: newTotalXP, currentIsland: newIsland }));
    return newlyUnlockedIds;
  },

  clearNewlyUnlocked: () => set({ newlyUnlocked: [] }),
  getBadgeProgress: (badgeId: string) => get().userBadges.find(b => b.badgeId === badgeId),
  getCompletedCount: () => get().userBadges.filter(b => b.completed).length,
  getCurrentIsland: () => ISLANDS.find(i => i.id === get().currentIsland) || ISLANDS[0],
  
  getIslandProgress: () => {
    const { currentIsland, userBadges } = get();
    const completedCount = get().getCompletedCount();
    const nextIsland = ISLANDS.find(i => i.id === currentIsland + 1);
    if (!nextIsland) return { current: completedCount, required: completedCount, percentage: 100 };
    
    // Calculate progress based on current island completion (80% required)
    const currentIslandBadges = BADGE_DEFINITIONS.filter(b => b.island === currentIsland);
    const currentIslandCompletedCount = userBadges.filter(ub => {
      const badge = BADGE_DEFINITIONS.find(b => b.id === ub.badgeId && b.island === currentIsland);
      return badge && ub.completed;
    }).length;
    
    const requiredCompletion = Math.max(1, Math.ceil(currentIslandBadges.length * 0.8));
    const percentage = Math.min(Math.round((currentIslandCompletedCount / requiredCompletion) * 100), 100);
    
    return { 
      current: currentIslandCompletedCount, 
      required: requiredCompletion, 
      percentage 
    };
  },

  getBadgesForIsland: (islandId: number) => BADGE_DEFINITIONS.filter(b => b.island === islandId),
  
  // Calculate and update badge progress from workout data
  // Reset badges to Starting Line (useful for testing or fixing progression issues)
  resetToStartingLine: async () => {
    const initialBadges: UserBadge[] = BADGE_DEFINITIONS.map(badge => ({
      badgeId: badge.id,
      progress: 0,
      completed: false,
    }));
    set({ 
      userBadges: initialBadges, 
      totalXP: 0, 
      currentIsland: 1,
      newlyUnlocked: [],
    });
    await setStorageItem('user_badges_v3', JSON.stringify({ 
      badges: initialBadges, 
      totalXP: 0, 
      currentIsland: 1 
    }));
    console.log('🔄 [AWARDS] Reset to Starting Line complete!');
  },
  
  // Reset all awards (alias for resetToStartingLine, used by logout)
  resetAllAwards: async () => {
    const initialBadges: UserBadge[] = BADGE_DEFINITIONS.map(badge => ({
      badgeId: badge.id,
      progress: 0,
      completed: false,
    }));
    set({ 
      userBadges: initialBadges, 
      totalXP: 0, 
      currentIsland: 1,
      newlyUnlocked: [],
    });
    try {
      await setStorageItem('user_badges_v3', JSON.stringify({ 
        badges: initialBadges, 
        totalXP: 0, 
        currentIsland: 1 
      }));
      // Also clear the old key
      await deleteStorageItem('user_badges');
    } catch (e) {
      console.error('Error resetting awards:', e);
    }
    console.log('🔄 [AWARDS] All awards reset for new user!');
  },
  
  updateBadgeProgress: async (workoutStats: {
    totalWorkouts: number;
    currentStreak: number;
    totalSets: number;
    totalReps: number;
    totalMinutes: number;
    cardioMinutes: number;
    strengthSessions: number;
    cardioSessions: number;
    upperBodySessions: number;
    lowerBodySessions: number;
    fullBodySessions: number;
  }) => {
    const { userBadges } = get();
    const updatedBadges: UserBadge[] = [];
    let newlyUnlocked: Badge[] = [];
    
    console.log('🏆 [AWARDS] Updating badge progress with stats:', workoutStats);
    
    BADGE_DEFINITIONS.forEach((badge) => {
      const existing = userBadges.find(ub => ub.badgeId === badge.id);
      
      let currentProgress = 0;
      
      // Calculate progress based on target type
      switch (badge.targetType) {
        case 'workouts':
          currentProgress = workoutStats.totalWorkouts;
          break;
        case 'streak':
          currentProgress = workoutStats.currentStreak;
          break;
        case 'totalSets':
          currentProgress = workoutStats.totalSets;
          break;
        case 'totalReps':
          currentProgress = workoutStats.totalReps;
          break;
        case 'totalMinutes':
          if (badge.targetCategory === 'cardio') {
            currentProgress = workoutStats.cardioMinutes;
          } else {
            currentProgress = workoutStats.totalMinutes;
          }
          break;
        case 'categorySessions':
          if (badge.targetCategory === 'upper') {
            currentProgress = workoutStats.upperBodySessions;
          } else if (badge.targetCategory === 'lower') {
            currentProgress = workoutStats.lowerBodySessions;
          } else if (badge.targetCategory === 'full') {
            currentProgress = workoutStats.fullBodySessions;
          } else if (badge.targetCategory === 'cardio') {
            currentProgress = workoutStats.cardioSessions;
          }
          break;
      }
      
      const completed = currentProgress >= badge.targetValue;
      const wasCompleted = existing?.completed || false;
      
      // Newly unlocked!
      if (completed && !wasCompleted) {
        newlyUnlocked.push(badge);
        console.log('🎉 [AWARDS] Badge unlocked:', badge.name);
      }
      
      updatedBadges.push({
        badgeId: badge.id,
        progress: currentProgress,
        completed: completed,
        unlockedAt: completed && !wasCompleted ? new Date().toISOString() : existing?.unlockedAt,
      });
    });
    
    set({ userBadges: updatedBadges });
    await setStorageItem('user_badges', JSON.stringify(updatedBadges));
    
    console.log('✅ [AWARDS] Badge progress updated. Newly unlocked:', newlyUnlocked.length);
    
    return newlyUnlocked;
  },
}));
