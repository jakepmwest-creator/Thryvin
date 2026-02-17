import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl } from '../services/env';

// API Base URL
const API_BASE_URL = getApiBaseUrl();

// ============ ISLAND TIER SYSTEM ============
export interface Island {
  id: number;
  name: string;
  subtitle: string;
  emoji: string;
  gradient: string[];
  requiredBadges: number; // Badges needed to unlock this island
  xpMultiplier: number;
  landscapeColors: { sky: string; ground: string; accent: string };
}

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
    requiredBadges: 20, // 100% of Island 1's 20 badges
    xpMultiplier: 1.25,
    landscapeColors: { sky: '#98D8C8', ground: '#7CB342', accent: '#8BC34A' },
  },
  { 
    id: 3, 
    name: 'The Grind Zone', 
    subtitle: 'Dedication is forged here', 
    emoji: '🔥', 
    gradient: ['#A22BF6', '#FF4EC7'],
    requiredBadges: 32, 
    xpMultiplier: 1.5,
    landscapeColors: { sky: '#FF9800', ground: '#BF360C', accent: '#FF5722' },
  },
];

// Badge rarity types
export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

// Badge categories
export type BadgeCategory = 'consistency' | 'engagement' | 'volume' | 'achievement' | 'social';

// Badge target types - what triggers the badge
export type BadgeTargetType = 
  | 'workouts' 
  | 'coachMessages' 
  | 'totalReps' 
  | 'totalMinutes' 
  | 'prsBroken' 
  | 'extraActivities' 
  | 'workoutEdits' 
  | 'profileEdit'
  | 'badgesShared'
  | 'earlyWorkout'
  | 'lateWorkout'
  | 'videosWatched'
  | 'weekendWorkouts'
  | 'streak'
  | 'categoriesExplored'
  | 'rateApp';

// Badge definition
export interface Badge {
  id: string;
  name: string;
  description: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  icon: string; // Ionicons name
  targetType: BadgeTargetType;
  targetValue: number;
  tier: number;
  gradient: string[];
  xp: number;
  island: number;
}

// User's badge progress
export interface UserBadgeProgress {
  badgeId: string;
  progress: number;
  completed: boolean;
  unlockedAt?: string;
}

// ============ BADGE DEFINITIONS ============
export const BADGE_DEFINITIONS: Badge[] = [
  // ==================== ISLAND 1: THE STARTING LINE (20 badges) ====================
  
  // CONSISTENCY - Workout count (3 tiers)
  { 
    id: 'i1_first_step', 
    name: 'First Step', 
    description: 'Complete your first workout', 
    category: 'consistency', 
    rarity: 'common', 
    icon: 'footsteps', 
    targetType: 'workouts', 
    targetValue: 1, 
    tier: 1, 
    gradient: ['#34C759', '#00C7BE'], 
    xp: 50, 
    island: 1 
  },
  { 
    id: 'i1_week_warrior', 
    name: 'Week Warrior', 
    description: 'Complete 7 workouts', 
    category: 'consistency', 
    rarity: 'common', 
    icon: 'calendar', 
    targetType: 'workouts', 
    targetValue: 7, 
    tier: 2, 
    gradient: ['#5B8DEF', '#34C4E5'], 
    xp: 100, 
    island: 1 
  },
  { 
    id: 'i1_fortnight_fighter', 
    name: 'Fortnight Fighter', 
    description: 'Complete 14 workouts', 
    category: 'consistency', 
    rarity: 'rare', 
    icon: 'trophy', 
    targetType: 'workouts', 
    targetValue: 14, 
    tier: 3, 
    gradient: ['#A22BF6', '#FF4EC7'], 
    xp: 200, 
    island: 1 
  },

  // COACH CHAT - Messages sent (3 tiers)
  { 
    id: 'i1_ice_breaker', 
    name: 'Ice Breaker', 
    description: 'Send your first message to the coach', 
    category: 'engagement', 
    rarity: 'common', 
    icon: 'chatbubble', 
    targetType: 'coachMessages', 
    targetValue: 1, 
    tier: 1, 
    gradient: ['#5B8DEF', '#34C4E5'], 
    xp: 50, 
    island: 1 
  },
  { 
    id: 'i1_getting_chatty', 
    name: 'Getting Chatty', 
    description: 'Send 10 messages to the coach', 
    category: 'engagement', 
    rarity: 'common', 
    icon: 'chatbubbles', 
    targetType: 'coachMessages', 
    targetValue: 10, 
    tier: 2, 
    gradient: ['#34C759', '#00C7BE'], 
    xp: 100, 
    island: 1 
  },
  { 
    id: 'i1_best_mates', 
    name: 'Best Mates', 
    description: 'Send 50 messages to the coach', 
    category: 'engagement', 
    rarity: 'rare', 
    icon: 'people', 
    targetType: 'coachMessages', 
    targetValue: 50, 
    tier: 3, 
    gradient: ['#FF6B35', '#FFD60A'], 
    xp: 200, 
    island: 1 
  },

  // REPS - Total reps/cardio minutes (3 tiers)
  { 
    id: 'i1_rep_starter', 
    name: 'Rep Starter', 
    description: 'Complete 50 reps (or cardio minutes)', 
    category: 'volume', 
    rarity: 'common', 
    icon: 'barbell', 
    targetType: 'totalReps', 
    targetValue: 50, 
    tier: 1, 
    gradient: ['#FF6B35', '#FFD60A'], 
    xp: 50, 
    island: 1 
  },
  { 
    id: 'i1_rep_builder', 
    name: 'Rep Builder', 
    description: 'Complete 350 reps (or cardio minutes)', 
    category: 'volume', 
    rarity: 'common', 
    icon: 'barbell', 
    targetType: 'totalReps', 
    targetValue: 350, 
    tier: 2, 
    gradient: ['#A22BF6', '#FF4EC7'], 
    xp: 100, 
    island: 1 
  },
  { 
    id: 'i1_rep_machine', 
    name: 'Rep Machine', 
    description: 'Complete 700 reps (or cardio minutes)', 
    category: 'volume', 
    rarity: 'rare', 
    icon: 'fitness', 
    targetType: 'totalReps', 
    targetValue: 700, 
    tier: 3, 
    gradient: ['#34C759', '#00C7BE'], 
    xp: 200, 
    island: 1 
  },

  // TIME - Total training minutes (3 tiers)
  { 
    id: 'i1_hour_one', 
    name: 'Hour One', 
    description: 'Train for 60 minutes total', 
    category: 'volume', 
    rarity: 'common', 
    icon: 'time', 
    targetType: 'totalMinutes', 
    targetValue: 60, 
    tier: 1, 
    gradient: ['#5B8DEF', '#34C4E5'], 
    xp: 50, 
    island: 1 
  },
  { 
    id: 'i1_four_hours', 
    name: 'Four Hour Club', 
    description: 'Train for 240 minutes (4 hours) total', 
    category: 'volume', 
    rarity: 'common', 
    icon: 'time', 
    targetType: 'totalMinutes', 
    targetValue: 240, 
    tier: 2, 
    gradient: ['#FF6B35', '#FFD60A'], 
    xp: 100, 
    island: 1 
  },
  { 
    id: 'i1_eight_hours', 
    name: 'Eight Hour Hero', 
    description: 'Train for 480 minutes (8 hours) total', 
    category: 'volume', 
    rarity: 'rare', 
    icon: 'timer', 
    targetType: 'totalMinutes', 
    targetValue: 480, 
    tier: 3, 
    gradient: ['#A22BF6', '#FF4EC7'], 
    xp: 200, 
    island: 1 
  },

  // SINGLE ACHIEVEMENT BADGES
  { 
    id: 'i1_record_smasher', 
    name: 'Record Smasher', 
    description: 'Break your first personal record', 
    category: 'achievement', 
    rarity: 'rare', 
    icon: 'medal', 
    targetType: 'prsBroken', 
    targetValue: 1, 
    tier: 1, 
    gradient: ['#FFD700', '#FFA500'], 
    xp: 150, 
    island: 1 
  },
  { 
    id: 'i1_self_starter', 
    name: 'Self Starter', 
    description: 'Track an extra activity on your own', 
    category: 'achievement', 
    rarity: 'common', 
    icon: 'add-circle', 
    targetType: 'extraActivities', 
    targetValue: 1, 
    tier: 1, 
    gradient: ['#34C759', '#00C7BE'], 
    xp: 75, 
    island: 1 
  },
  { 
    id: 'i1_customizer', 
    name: 'Customizer', 
    description: 'Edit a workout for the first time', 
    category: 'engagement', 
    rarity: 'common', 
    icon: 'create', 
    targetType: 'workoutEdits', 
    targetValue: 1, 
    tier: 1, 
    gradient: ['#5B8DEF', '#34C4E5'], 
    xp: 50, 
    island: 1 
  },
  { 
    id: 'i1_profile_pro', 
    name: 'Profile Pro', 
    description: 'Edit your profile', 
    category: 'engagement', 
    rarity: 'common', 
    icon: 'person-circle', 
    targetType: 'profileEdit', 
    targetValue: 1, 
    tier: 1, 
    gradient: ['#A22BF6', '#FF4EC7'], 
    xp: 50, 
    island: 1 
  },
  { 
    id: 'i1_show_off', 
    name: 'Show Off', 
    description: 'Share a badge with friends', 
    category: 'social', 
    rarity: 'common', 
    icon: 'share-social', 
    targetType: 'badgesShared', 
    targetValue: 1, 
    tier: 1, 
    gradient: ['#FF6B35', '#FFD60A'], 
    xp: 75, 
    island: 1 
  },
  { 
    id: 'i1_early_bird', 
    name: 'Early Bird', 
    description: 'Complete a workout before 8am', 
    category: 'achievement', 
    rarity: 'rare', 
    icon: 'sunny', 
    targetType: 'earlyWorkout', 
    targetValue: 1, 
    tier: 1, 
    gradient: ['#FFD60A', '#FF9500'], 
    xp: 100, 
    island: 1 
  },
  { 
    id: 'i1_night_owl', 
    name: 'Night Owl', 
    description: 'Complete a workout after 8pm', 
    category: 'achievement', 
    rarity: 'rare', 
    icon: 'moon', 
    targetType: 'lateWorkout', 
    targetValue: 1, 
    tier: 1, 
    gradient: ['#5B8DEF', '#1A237E'], 
    xp: 100, 
    island: 1 
  },
  { 
    id: 'i1_form_check', 
    name: 'Form Check', 
    description: 'Watch 10 exercise videos', 
    category: 'engagement', 
    rarity: 'common', 
    icon: 'play-circle', 
    targetType: 'videosWatched', 
    targetValue: 10, 
    tier: 1, 
    gradient: ['#34C759', '#00C7BE'], 
    xp: 100, 
    island: 1 
  },

  // ==================== ISLAND 2: NEWBIE GAINS (20 badges) ====================
  
  // CONSISTENCY - Workout count (3 tiers)
  { 
    id: 'i2_three_weeks', 
    name: 'Three Week Titan', 
    description: 'Complete 21 workouts', 
    category: 'consistency', 
    rarity: 'rare', 
    icon: 'trophy', 
    targetType: 'workouts', 
    targetValue: 21, 
    tier: 4, 
    gradient: ['#34C759', '#00C7BE'], 
    xp: 250, 
    island: 2 
  },
  { 
    id: 'i2_four_weeks', 
    name: 'Month Master', 
    description: 'Complete 28 workouts', 
    category: 'consistency', 
    rarity: 'epic', 
    icon: 'ribbon', 
    targetType: 'workouts', 
    targetValue: 28, 
    tier: 5, 
    gradient: ['#A22BF6', '#FF4EC7'], 
    xp: 350, 
    island: 2 
  },
  { 
    id: 'i2_five_weeks', 
    name: 'Five Week Warrior', 
    description: 'Complete 35 workouts', 
    category: 'consistency', 
    rarity: 'epic', 
    icon: 'star', 
    targetType: 'workouts', 
    targetValue: 35, 
    tier: 6, 
    gradient: ['#FFD700', '#FFA500'], 
    xp: 500, 
    island: 2 
  },

  // COACH CHAT - Messages sent (3 tiers)
  { 
    id: 'i2_coach_regular', 
    name: 'Coach Regular', 
    description: 'Send 75 messages to the coach', 
    category: 'engagement', 
    rarity: 'rare', 
    icon: 'chatbubbles', 
    targetType: 'coachMessages', 
    targetValue: 75, 
    tier: 4, 
    gradient: ['#5B8DEF', '#34C4E5'], 
    xp: 250, 
    island: 2 
  },
  { 
    id: 'i2_coach_buddy', 
    name: 'Coach Buddy', 
    description: 'Send 100 messages to the coach', 
    category: 'engagement', 
    rarity: 'epic', 
    icon: 'people', 
    targetType: 'coachMessages', 
    targetValue: 100, 
    tier: 5, 
    gradient: ['#34C759', '#00C7BE'], 
    xp: 350, 
    island: 2 
  },
  { 
    id: 'i2_coach_bestie', 
    name: 'Coach Bestie', 
    description: 'Send 150 messages to the coach', 
    category: 'engagement', 
    rarity: 'epic', 
    icon: 'heart', 
    targetType: 'coachMessages', 
    targetValue: 150, 
    tier: 6, 
    gradient: ['#FF6B35', '#FFD60A'], 
    xp: 500, 
    island: 2 
  },

  // REPS - Total reps/cardio minutes (3 tiers)
  { 
    id: 'i2_rep_crusher', 
    name: 'Rep Crusher', 
    description: 'Complete 750 reps (or cardio minutes)', 
    category: 'volume', 
    rarity: 'rare', 
    icon: 'barbell', 
    targetType: 'totalReps', 
    targetValue: 750, 
    tier: 4, 
    gradient: ['#A22BF6', '#FF4EC7'], 
    xp: 250, 
    island: 2 
  },
  { 
    id: 'i2_thousand_reps', 
    name: '1K Club', 
    description: 'Complete 1,000 reps (or cardio minutes)', 
    category: 'volume', 
    rarity: 'epic', 
    icon: 'fitness', 
    targetType: 'totalReps', 
    targetValue: 1000, 
    tier: 5, 
    gradient: ['#FFD700', '#FFA500'], 
    xp: 350, 
    island: 2 
  },
  { 
    id: 'i2_rep_legend', 
    name: 'Rep Legend', 
    description: 'Complete 1,250 reps (or cardio minutes)', 
    category: 'volume', 
    rarity: 'epic', 
    icon: 'flash', 
    targetType: 'totalReps', 
    targetValue: 1250, 
    tier: 6, 
    gradient: ['#34C759', '#00C7BE'], 
    xp: 500, 
    island: 2 
  },

  // TIME - Total training minutes (3 tiers)
  { 
    id: 'i2_time_investor', 
    name: 'Time Investor', 
    description: 'Train for 1,050 minutes (~17.5 hours)', 
    category: 'volume', 
    rarity: 'rare', 
    icon: 'time', 
    targetType: 'totalMinutes', 
    targetValue: 1050, 
    tier: 4, 
    gradient: ['#5B8DEF', '#34C4E5'], 
    xp: 250, 
    island: 2 
  },
  { 
    id: 'i2_dedicated', 
    name: 'Dedicated', 
    description: 'Train for 1,400 minutes (~23 hours)', 
    category: 'volume', 
    rarity: 'epic', 
    icon: 'timer', 
    targetType: 'totalMinutes', 
    targetValue: 1400, 
    tier: 5, 
    gradient: ['#FF6B35', '#FFD60A'], 
    xp: 350, 
    island: 2 
  },
  { 
    id: 'i2_time_lord', 
    name: 'Time Lord', 
    description: 'Train for 1,750 minutes (~29 hours)', 
    category: 'volume', 
    rarity: 'epic', 
    icon: 'hourglass', 
    targetType: 'totalMinutes', 
    targetValue: 1750, 
    tier: 6, 
    gradient: ['#A22BF6', '#FF4EC7'], 
    xp: 500, 
    island: 2 
  },

  // TIER 2 ACHIEVEMENT BADGES (require 5)
  { 
    id: 'i2_record_breaker', 
    name: 'Record Breaker', 
    description: 'Break 5 personal records', 
    category: 'achievement', 
    rarity: 'epic', 
    icon: 'medal', 
    targetType: 'prsBroken', 
    targetValue: 5, 
    tier: 2, 
    gradient: ['#FFD700', '#FFA500'], 
    xp: 300, 
    island: 2 
  },
  { 
    id: 'i2_extra_mile', 
    name: 'Going the Extra Mile', 
    description: 'Track 5 extra activities', 
    category: 'achievement', 
    rarity: 'rare', 
    icon: 'add-circle', 
    targetType: 'extraActivities', 
    targetValue: 5, 
    tier: 2, 
    gradient: ['#34C759', '#00C7BE'], 
    xp: 200, 
    island: 2 
  },
  { 
    id: 'i2_workout_wizard', 
    name: 'Workout Wizard', 
    description: 'Edit 5 workouts', 
    category: 'engagement', 
    rarity: 'rare', 
    icon: 'create', 
    targetType: 'workoutEdits', 
    targetValue: 5, 
    tier: 2, 
    gradient: ['#5B8DEF', '#34C4E5'], 
    xp: 200, 
    island: 2 
  },
  { 
    id: 'i2_influencer', 
    name: 'Influencer', 
    description: 'Share 5 badges with friends', 
    category: 'social', 
    rarity: 'rare', 
    icon: 'share-social', 
    targetType: 'badgesShared', 
    targetValue: 5, 
    tier: 2, 
    gradient: ['#FF6B35', '#FFD60A'], 
    xp: 200, 
    island: 2 
  },
  { 
    id: 'i2_supporter', 
    name: 'Supporter', 
    description: 'Rate Thryvin on the app store', 
    category: 'engagement', 
    rarity: 'rare', 
    icon: 'star', 
    targetType: 'rateApp', 
    targetValue: 1, 
    tier: 1, 
    gradient: ['#FFD700', '#FFA500'], 
    xp: 150, 
    island: 2 
  },
  { 
    id: 'i2_weekend_warrior', 
    name: 'Weekend Warrior', 
    description: 'Complete 5 weekend workouts', 
    category: 'consistency', 
    rarity: 'rare', 
    icon: 'calendar', 
    targetType: 'weekendWorkouts', 
    targetValue: 5, 
    tier: 1, 
    gradient: ['#34C759', '#00C7BE'], 
    xp: 200, 
    island: 2 
  },
  { 
    id: 'i2_streak_keeper', 
    name: 'Streak Keeper', 
    description: 'Maintain a 7-day workout streak', 
    category: 'consistency', 
    rarity: 'epic', 
    icon: 'flame', 
    targetType: 'streak', 
    targetValue: 7, 
    tier: 1, 
    gradient: ['#FF6B35', '#FF4500'], 
    xp: 300, 
    island: 2 
  },
  { 
    id: 'i2_variety_pack', 
    name: 'Variety Pack', 
    description: 'Try 5 different exercise categories', 
    category: 'achievement', 
    rarity: 'rare', 
    icon: 'grid', 
    targetType: 'categoriesExplored', 
    targetValue: 5, 
    tier: 1, 
    gradient: ['#A22BF6', '#FF4EC7'], 
    xp: 200, 
    island: 2 
  },
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

// Helper to get auth token
const getAuthToken = async (): Promise<string | null> => {
  try {
    const SecureStore = require('expo-secure-store');
    return await SecureStore.getItemAsync('thryvin_access_token');
  } catch {
    return null;
  }
};

// API call helper
const apiCall = async (endpoint: string, method: string = 'GET', body?: any) => {
  const token = await getAuthToken();
  if (!token) return null;
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    return null;
  }
};

interface AwardsState {
  userBadges: UserBadgeProgress[];
  newlyUnlocked: string[];
  totalXP: number;
  currentIsland: number;
  isLoading: boolean;
  
  // Core functions
  loadUserBadges: () => Promise<void>;
  saveBadgesToServer: () => Promise<void>;
  updateBadgeProgress: (stats: BadgeStats) => Promise<Badge[]>;
  clearNewlyUnlocked: () => void;
  
  // Badge helpers
  getBadgeProgress: (badgeId: string) => UserBadgeProgress | undefined;
  getCompletedCount: () => number;
  getCurrentIsland: () => Island;
  getIslandProgress: () => { current: number; required: number; percentage: number };
  getBadgesForIsland: (islandId: number) => Badge[];
  
  // Tracking functions for specific actions
  trackCoachMessage: () => Promise<void>;
  trackBadgeShared: () => Promise<void>;
  trackVideoWatched: () => Promise<void>;
  trackProfileEdit: () => Promise<void>;
  trackAppRated: () => Promise<void>;
  
  // Reset
  resetAllAwards: () => Promise<void>;
}

export interface BadgeStats {
  totalWorkouts: number;
  totalReps: number;
  totalMinutes: number;
  totalCoachMessages: number;
  totalPRsBroken: number;
  totalExtraActivities: number;
  totalWorkoutEdits: number;
  totalBadgesShared: number;
  totalVideosWatched: number;
  totalWeekendWorkouts: number;
  totalEarlyWorkouts: number;
  totalLateWorkouts: number;
  categoriesExplored: number;
  hasEditedProfile: boolean;
  hasRatedApp: boolean;
  currentStreak: number;
}

export const useAwardsStore = create<AwardsState>((set, get) => ({
  userBadges: [],
  newlyUnlocked: [],
  totalXP: 0,
  currentIsland: 1,
  isLoading: false,

  loadUserBadges: async () => {
    set({ isLoading: true });
    
    try {
      // Try to load from server first
      const serverData = await apiCall('/api/badges/progress');
      
      if (serverData?.badges && serverData.badges.length > 0) {
        set({
          userBadges: serverData.badges,
          totalXP: serverData.totalXP || 0,
          currentIsland: serverData.currentIsland || 1,
          isLoading: false,
        });
        
        // Cache locally
        await AsyncStorage.setItem('user_badges_v4', JSON.stringify({
          badges: serverData.badges,
          totalXP: serverData.totalXP,
          currentIsland: serverData.currentIsland,
        }));
        return;
      }
      
      // Fall back to local storage
      const stored = await AsyncStorage.getItem('user_badges_v4');
      if (stored) {
        const data = JSON.parse(stored);
        if (data.badges && data.badges.length > 0) {
          set({
            userBadges: data.badges,
            totalXP: data.totalXP || 0,
            currentIsland: data.currentIsland || 1,
            isLoading: false,
          });
          return;
        }
      }
      
      // CRITICAL: Initialize fresh badges for ALL badge definitions
      // This ensures new users always have badge progress tracking ready
      console.log('🏆 [AWARDS] Initializing badges for new user - creating', BADGE_DEFINITIONS.length, 'badge entries');
      const initialBadges: UserBadgeProgress[] = BADGE_DEFINITIONS.map(badge => ({
        badgeId: badge.id,
        progress: 0,
        completed: false,
      }));
      
      set({ userBadges: initialBadges, totalXP: 0, currentIsland: 1, isLoading: false });
      await AsyncStorage.setItem('user_badges_v4', JSON.stringify({ 
        badges: initialBadges, 
        totalXP: 0, 
        currentIsland: 1 
      }));
      
      // Also save to server so future logins work
      await apiCall('/api/badges/progress', 'PUT', {
        badges: initialBadges,
        totalXP: 0,
        currentIsland: 1,
      });
      console.log('🏆 [AWARDS] Badges initialized and saved to server');
      
    } catch (error) {
      console.error('Error loading badges:', error);
      
      // FALLBACK: Even on error, initialize badges locally so tracking works
      const initialBadges: UserBadgeProgress[] = BADGE_DEFINITIONS.map(badge => ({
        badgeId: badge.id,
        progress: 0,
        completed: false,
      }));
      set({ userBadges: initialBadges, totalXP: 0, currentIsland: 1, isLoading: false });
    }
  },

  saveBadgesToServer: async () => {
    const { userBadges, totalXP, currentIsland } = get();
    
    try {
      await apiCall('/api/badges/progress', 'PUT', {
        badges: userBadges,
        totalXP,
        currentIsland,
      });
    } catch (error) {
      console.error('Failed to save badges to server:', error);
    }
  },

  updateBadgeProgress: async (stats: BadgeStats) => {
    const { userBadges, totalXP, currentIsland } = get();
    const newlyUnlockedBadges: Badge[] = [];
    let xpGained = 0;
    
    console.log('🏆 [AWARDS] Updating badge progress with stats:', stats);
    
    const updatedBadges = userBadges.map(userBadge => {
      const badgeDef = BADGE_DEFINITIONS.find(b => b.id === userBadge.badgeId);
      if (!badgeDef || userBadge.completed) return userBadge;
      
      // Only process badges for current or previous islands
      if (badgeDef.island > currentIsland) return userBadge;
      
      let newProgress = 0;
      
      // Calculate progress based on target type
      switch (badgeDef.targetType) {
        case 'workouts':
          newProgress = stats.totalWorkouts;
          break;
        case 'coachMessages':
          newProgress = stats.totalCoachMessages;
          break;
        case 'totalReps':
          newProgress = stats.totalReps;
          break;
        case 'totalMinutes':
          newProgress = stats.totalMinutes;
          break;
        case 'prsBroken':
          newProgress = stats.totalPRsBroken;
          break;
        case 'extraActivities':
          newProgress = stats.totalExtraActivities;
          break;
        case 'workoutEdits':
          newProgress = stats.totalWorkoutEdits;
          break;
        case 'profileEdit':
          newProgress = stats.hasEditedProfile ? 1 : 0;
          break;
        case 'badgesShared':
          newProgress = stats.totalBadgesShared;
          break;
        case 'earlyWorkout':
          newProgress = stats.totalEarlyWorkouts;
          break;
        case 'lateWorkout':
          newProgress = stats.totalLateWorkouts;
          break;
        case 'videosWatched':
          newProgress = stats.totalVideosWatched;
          break;
        case 'weekendWorkouts':
          newProgress = stats.totalWeekendWorkouts;
          break;
        case 'streak':
          newProgress = stats.currentStreak;
          break;
        case 'categoriesExplored':
          newProgress = stats.categoriesExplored;
          break;
        case 'rateApp':
          newProgress = stats.hasRatedApp ? 1 : 0;
          break;
      }
      
      const wasCompleted = userBadge.completed;
      const isNowCompleted = newProgress >= badgeDef.targetValue;
      
      if (isNowCompleted && !wasCompleted) {
        const island = ISLANDS.find(i => i.id === currentIsland);
        const multiplier = island?.xpMultiplier || 1;
        const earnedXP = Math.round(badgeDef.xp * multiplier);
        newlyUnlockedBadges.push(badgeDef);
        xpGained += earnedXP;
        console.log(`🎉 [AWARDS] Badge unlocked: ${badgeDef.name} (+${earnedXP} XP)`);
      }
      
      return {
        ...userBadge,
        progress: Math.min(newProgress, badgeDef.targetValue),
        completed: isNowCompleted,
        unlockedAt: isNowCompleted && !wasCompleted ? new Date().toISOString() : userBadge.unlockedAt,
      };
    });
    
    // Calculate new island progression
    const newTotalXP = totalXP + xpGained;
    let newIsland = currentIsland;
    
    // Check if user can advance to next island (100% completion of current island)
    const currentIslandBadges = BADGE_DEFINITIONS.filter(b => b.island === currentIsland);
    const completedOnCurrentIsland = updatedBadges.filter(ub => {
      const badge = BADGE_DEFINITIONS.find(b => b.id === ub.badgeId && b.island === currentIsland);
      return badge && ub.completed;
    }).length;
    
    const requiredForNextIsland = currentIslandBadges.length;
    
    if (completedOnCurrentIsland >= requiredForNextIsland && currentIsland < ISLANDS.length) {
      newIsland = currentIsland + 1;
      console.log(`🏝️ [AWARDS] Advanced to Island ${newIsland}: ${ISLANDS[newIsland - 1]?.name}`);
    }
    
    // Update state
    set({
      userBadges: updatedBadges,
      newlyUnlocked: newlyUnlockedBadges.map(b => b.id),
      totalXP: newTotalXP,
      currentIsland: newIsland,
    });
    
    // Save locally
    await AsyncStorage.setItem('user_badges_v4', JSON.stringify({
      badges: updatedBadges,
      totalXP: newTotalXP,
      currentIsland: newIsland,
    }));
    
    // Save to server
    get().saveBadgesToServer();
    
    return newlyUnlockedBadges;
  },

  clearNewlyUnlocked: () => set({ newlyUnlocked: [] }),
  
  getBadgeProgress: (badgeId: string) => get().userBadges.find(b => b.badgeId === badgeId),
  
  getCompletedCount: () => get().userBadges.filter(b => b.completed).length,
  
  getCurrentIsland: () => ISLANDS.find(i => i.id === get().currentIsland) || ISLANDS[0],
  
  getIslandProgress: () => {
    const { currentIsland, userBadges } = get();
    const currentIslandBadges = BADGE_DEFINITIONS.filter(b => b.island === currentIsland);
    const completedCount = userBadges.filter(ub => {
      const badge = BADGE_DEFINITIONS.find(b => b.id === ub.badgeId && b.island === currentIsland);
      return badge && ub.completed;
    }).length;
    
    const required = currentIslandBadges.length;
    const percentage = Math.min(Math.round((completedCount / required) * 100), 100);
    
    return { current: completedCount, required, percentage };
  },

  getBadgesForIsland: (islandId: number) => BADGE_DEFINITIONS.filter(b => b.island === islandId),

  // Tracking functions for specific actions
  trackCoachMessage: async () => {
    try {
      // Update local storage first (for offline support)
      const stored = await AsyncStorage.getItem('badge_stats');
      const stats = stored ? JSON.parse(stored) : {};
      stats.totalCoachMessages = (stats.totalCoachMessages || 0) + 1;
      await AsyncStorage.setItem('badge_stats', JSON.stringify(stats));
      console.log('💬 [AWARDS] Coach message tracked locally:', stats.totalCoachMessages);
      
      // SYNC TO SERVER for persistence - use correct action name
      await apiCall('/api/badges/track', 'POST', {
        action: 'coachMessage',
        count: stats.totalCoachMessages,
      });
      console.log('💬 [AWARDS] Coach message synced to server');
      
      // Also trigger badge progress update
      get().updateBadgeProgress({
        totalWorkouts: 0,
        totalReps: 0,
        totalMinutes: 0,
        totalCoachMessages: stats.totalCoachMessages,
        totalPRsBroken: 0,
        totalExtraActivities: 0,
        totalWorkoutEdits: 0,
        totalBadgesShared: stats.totalBadgesShared || 0,
        totalVideosWatched: stats.totalVideosWatched || 0,
        totalWeekendWorkouts: 0,
        totalEarlyWorkouts: 0,
        totalLateWorkouts: 0,
        categoriesExplored: 0,
        hasEditedProfile: stats.hasEditedProfile || false,
        hasRatedApp: stats.hasRatedApp || false,
        currentStreak: 0,
      });
    } catch (error) {
      console.error('Error tracking coach message:', error);
    }
  },

  trackBadgeShared: async () => {
    try {
      const stored = await AsyncStorage.getItem('badge_stats');
      const stats = stored ? JSON.parse(stored) : {};
      stats.totalBadgesShared = (stats.totalBadgesShared || 0) + 1;
      await AsyncStorage.setItem('badge_stats', JSON.stringify(stats));
      console.log('📤 [AWARDS] Badge shared tracked:', stats.totalBadgesShared);
      
      // SYNC TO SERVER for persistence
      await apiCall('/api/badges/track', 'POST', {
        action: 'badgeShared',
        count: stats.totalBadgesShared,
      });
    } catch (error) {
      console.error('Error tracking badge shared:', error);
    }
  },

  trackVideoWatched: async () => {
    try {
      const stored = await AsyncStorage.getItem('badge_stats');
      const stats = stored ? JSON.parse(stored) : {};
      stats.totalVideosWatched = (stats.totalVideosWatched || 0) + 1;
      await AsyncStorage.setItem('badge_stats', JSON.stringify(stats));
      console.log('🎬 [AWARDS] Video watched tracked:', stats.totalVideosWatched);
      
      // SYNC TO SERVER for persistence
      await apiCall('/api/badges/track', 'POST', {
        action: 'videoWatched',
        count: stats.totalVideosWatched,
      });
    } catch (error) {
      console.error('Error tracking video watched:', error);
    }
  },

  trackProfileEdit: async () => {
    try {
      const stored = await AsyncStorage.getItem('badge_stats');
      const stats = stored ? JSON.parse(stored) : {};
      stats.hasEditedProfile = true;
      await AsyncStorage.setItem('badge_stats', JSON.stringify(stats));
      console.log('👤 [AWARDS] Profile edit tracked');
      
      // SYNC TO SERVER for persistence
      await apiCall('/api/badges/track', 'POST', {
        action: 'profileEdit',
        value: true,
      });
    } catch (error) {
      console.error('Error tracking profile edit:', error);
    }
  },

  trackAppRated: async () => {
    try {
      const stored = await AsyncStorage.getItem('badge_stats');
      const stats = stored ? JSON.parse(stored) : {};
      stats.hasRatedApp = true;
      await AsyncStorage.setItem('badge_stats', JSON.stringify(stats));
      console.log('⭐ [AWARDS] App rated tracked');
      
      // SYNC TO SERVER for persistence
      await apiCall('/api/badges/track', 'POST', {
        action: 'appRated',
        value: true,
      });
    } catch (error) {
      console.error('Error tracking app rated:', error);
    }
  },

  resetAllAwards: async () => {
    const initialBadges: UserBadgeProgress[] = BADGE_DEFINITIONS.map(badge => ({
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
    
    await AsyncStorage.setItem('user_badges_v4', JSON.stringify({
      badges: initialBadges,
      totalXP: 0,
      currentIsland: 1,
    }));
    
    await AsyncStorage.removeItem('badge_stats');
    
    // Reset on server too
    await apiCall('/api/badges/reset', 'POST');
    
    console.log('🔄 [AWARDS] All awards reset!');
  },
}));
