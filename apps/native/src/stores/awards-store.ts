import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

// Storage helpers
const getStorageItem = async (key: string): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
};

const setStorageItem = async (key: string, value: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.error('Error storing item:', error);
  }
};

// ============ ISLAND TIER SYSTEM ============
export interface Island {
  id: number;
  name: string;
  subtitle: string;
  emoji: string;
  gradient: string[];
  requiredBadges: number; // Badges needed to unlock this island
  xpMultiplier: number; // XP bonus for this tier
}

export const ISLANDS: Island[] = [
  { id: 1, name: 'Starter Beach', subtitle: 'Where legends begin', emoji: '🏖️', gradient: ['#87CEEB', '#48D1CC'], requiredBadges: 0, xpMultiplier: 1.0 },
  { id: 2, name: 'Grind Grove', subtitle: 'The hustle starts here', emoji: '🌴', gradient: ['#98FB98', '#32CD32'], requiredBadges: 5, xpMultiplier: 1.1 },
  { id: 3, name: 'Sweat Summit', subtitle: 'Pushing through limits', emoji: '🏔️', gradient: ['#DDA0DD', '#BA55D3'], requiredBadges: 12, xpMultiplier: 1.2 },
  { id: 4, name: 'Iron Island', subtitle: 'Forged in strength', emoji: '🏝️', gradient: ['#C0C0C0', '#708090'], requiredBadges: 20, xpMultiplier: 1.3 },
  { id: 5, name: 'Power Peninsula', subtitle: 'Raw power unleashed', emoji: '⚡', gradient: ['#FFD700', '#FFA500'], requiredBadges: 30, xpMultiplier: 1.4 },
  { id: 6, name: 'Champion Cove', subtitle: 'Champion mindset', emoji: '🏆', gradient: ['#FF6B35', '#FF4500'], requiredBadges: 42, xpMultiplier: 1.5 },
  { id: 7, name: 'Elite Empire', subtitle: 'Top 1% territory', emoji: '👑', gradient: ['#9400D3', '#4B0082'], requiredBadges: 55, xpMultiplier: 1.75 },
  { id: 8, name: 'Legend Lagoon', subtitle: 'Legendary status', emoji: '🌟', gradient: ['#FF1493', '#FF69B4'], requiredBadges: 70, xpMultiplier: 2.0 },
  { id: 9, name: 'Titan Territory', subtitle: 'Unstoppable force', emoji: '⚔️', gradient: ['#B22222', '#8B0000'], requiredBadges: 85, xpMultiplier: 2.5 },
  { id: 10, name: 'Olympus Peak', subtitle: 'Among the gods', emoji: '🏛️', gradient: ['#FFD700', '#FFF8DC'], requiredBadges: 100, xpMultiplier: 3.0 },
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
  tier?: number; // Which tier/level of this badge type
  gradient: string[];
  xp: number;
  islandRequired?: number; // Minimum island to see this badge
}

// User's badge progress
export interface UserBadge {
  badgeId: string;
  progress: number;
  completed: boolean;
  unlockedAt?: string;
}

// ============ COMPREHENSIVE BADGE DEFINITIONS ============
export const BADGE_DEFINITIONS: Badge[] = [
  // ============ CONSISTENCY BADGES (Tiered: 5, 10, 20, 50, 100 days) ============
  {
    id: 'streak_5',
    name: 'Getting Started',
    description: 'Train 5 days in a row',
    category: 'consistency',
    rarity: 'common',
    icon: 'flame',
    targetType: 'streak',
    targetValue: 5,
    tier: 1,
    gradient: ['#87CEEB', '#48D1CC'],
    xp: 50,
    islandRequired: 1,
  },
  {
    id: 'streak_10',
    name: 'Warming Up',
    description: 'Train 10 days in a row',
    category: 'consistency',
    rarity: 'common',
    icon: 'flame',
    targetType: 'streak',
    targetValue: 10,
    tier: 2,
    gradient: ['#98FB98', '#32CD32'],
    xp: 100,
    islandRequired: 1,
  },
  {
    id: 'streak_20',
    name: 'On Fire',
    description: 'Train 20 days in a row',
    category: 'consistency',
    rarity: 'rare',
    icon: 'flame',
    targetType: 'streak',
    targetValue: 20,
    tier: 3,
    gradient: ['#FF6B35', '#FFD60A'],
    xp: 200,
    islandRequired: 2,
  },
  {
    id: 'streak_50',
    name: 'Blazing Trail',
    description: 'Train 50 days in a row',
    category: 'consistency',
    rarity: 'epic',
    icon: 'flame',
    targetType: 'streak',
    targetValue: 50,
    tier: 4,
    gradient: ['#FF3B30', '#FF9500'],
    xp: 500,
    islandRequired: 4,
  },
  {
    id: 'streak_100',
    name: 'Inferno',
    description: 'Train 100 days in a row',
    category: 'consistency',
    rarity: 'legendary',
    icon: 'flame',
    targetType: 'streak',
    targetValue: 100,
    tier: 5,
    gradient: ['#A22BF6', '#FF4EC7'],
    xp: 1000,
    islandRequired: 7,
  },

  // ============ WORKOUT COUNT BADGES (1, 5, 10, 25, 50, 100, 250, 500) ============
  {
    id: 'first_workout',
    name: 'First Steps',
    description: 'Complete your first workout',
    category: 'program',
    rarity: 'common',
    icon: 'footsteps',
    targetType: 'workouts',
    targetValue: 1,
    tier: 1,
    gradient: ['#34C759', '#00C7BE'],
    xp: 25,
    islandRequired: 1,
  },
  {
    id: 'workouts_5',
    name: 'Week Warrior',
    description: 'Complete 5 workouts',
    category: 'program',
    rarity: 'common',
    icon: 'fitness',
    targetType: 'workouts',
    targetValue: 5,
    tier: 2,
    gradient: ['#5B8DEF', '#34C4E5'],
    xp: 50,
    islandRequired: 1,
  },
  {
    id: 'workouts_10',
    name: 'Dedicated',
    description: 'Complete 10 workouts',
    category: 'program',
    rarity: 'common',
    icon: 'barbell',
    targetType: 'workouts',
    targetValue: 10,
    tier: 3,
    gradient: ['#87CEEB', '#48D1CC'],
    xp: 100,
    islandRequired: 1,
  },
  {
    id: 'workouts_25',
    name: 'Committed',
    description: 'Complete 25 workouts',
    category: 'program',
    rarity: 'rare',
    icon: 'medal',
    targetType: 'workouts',
    targetValue: 25,
    tier: 4,
    gradient: ['#98FB98', '#32CD32'],
    xp: 200,
    islandRequired: 2,
  },
  {
    id: 'workouts_50',
    name: 'Half Century',
    description: 'Complete 50 workouts',
    category: 'program',
    rarity: 'rare',
    icon: 'ribbon',
    targetType: 'workouts',
    targetValue: 50,
    tier: 5,
    gradient: ['#FFD700', '#FFA500'],
    xp: 350,
    islandRequired: 3,
  },
  {
    id: 'workouts_100',
    name: 'Century Club',
    description: 'Complete 100 workouts',
    category: 'program',
    rarity: 'epic',
    icon: 'trophy',
    targetType: 'workouts',
    targetValue: 100,
    tier: 6,
    gradient: ['#FF6B35', '#FF4500'],
    xp: 500,
    islandRequired: 5,
  },
  {
    id: 'workouts_250',
    name: 'Elite Status',
    description: 'Complete 250 workouts',
    category: 'program',
    rarity: 'epic',
    icon: 'star',
    targetType: 'workouts',
    targetValue: 250,
    tier: 7,
    gradient: ['#9400D3', '#4B0082'],
    xp: 750,
    islandRequired: 7,
  },
  {
    id: 'workouts_500',
    name: 'Legend',
    description: 'Complete 500 workouts',
    category: 'program',
    rarity: 'legendary',
    icon: 'diamond',
    targetType: 'workouts',
    targetValue: 500,
    tier: 8,
    gradient: ['#FFD700', '#FFF8DC'],
    xp: 1500,
    islandRequired: 9,
  },

  // ============ VOLUME BADGES - SETS ============
  {
    id: 'sets_50',
    name: 'Set Starter',
    description: 'Complete 50 total sets',
    category: 'volume',
    rarity: 'common',
    icon: 'layers',
    targetType: 'totalSets',
    targetValue: 50,
    tier: 1,
    gradient: ['#5B8DEF', '#34C4E5'],
    xp: 50,
    islandRequired: 1,
  },
  {
    id: 'sets_200',
    name: 'Set Builder',
    description: 'Complete 200 total sets',
    category: 'volume',
    rarity: 'common',
    icon: 'layers',
    targetType: 'totalSets',
    targetValue: 200,
    tier: 2,
    gradient: ['#34C759', '#00C7BE'],
    xp: 100,
    islandRequired: 1,
  },
  {
    id: 'sets_500',
    name: 'Set Crusher',
    description: 'Complete 500 total sets',
    category: 'volume',
    rarity: 'rare',
    icon: 'layers',
    targetType: 'totalSets',
    targetValue: 500,
    tier: 3,
    gradient: ['#FF6B35', '#FFD60A'],
    xp: 250,
    islandRequired: 2,
  },
  {
    id: 'sets_1000',
    name: 'Set Master',
    description: 'Complete 1,000 total sets',
    category: 'volume',
    rarity: 'epic',
    icon: 'layers',
    targetType: 'totalSets',
    targetValue: 1000,
    tier: 4,
    gradient: ['#A22BF6', '#FF4EC7'],
    xp: 500,
    islandRequired: 4,
  },
  {
    id: 'sets_5000',
    name: 'Set Legend',
    description: 'Complete 5,000 total sets',
    category: 'volume',
    rarity: 'legendary',
    icon: 'layers',
    targetType: 'totalSets',
    targetValue: 5000,
    tier: 5,
    gradient: ['#FFD700', '#FFA500'],
    xp: 1000,
    islandRequired: 8,
  },

  // ============ VOLUME BADGES - REPS ============
  {
    id: 'reps_500',
    name: 'Rep Rookie',
    description: 'Complete 500 total reps',
    category: 'volume',
    rarity: 'common',
    icon: 'barbell',
    targetType: 'totalReps',
    targetValue: 500,
    tier: 1,
    gradient: ['#87CEEB', '#48D1CC'],
    xp: 50,
    islandRequired: 1,
  },
  {
    id: 'reps_2000',
    name: 'Rep Builder',
    description: 'Complete 2,000 total reps',
    category: 'volume',
    rarity: 'common',
    icon: 'barbell',
    targetType: 'totalReps',
    targetValue: 2000,
    tier: 2,
    gradient: ['#98FB98', '#32CD32'],
    xp: 100,
    islandRequired: 1,
  },
  {
    id: 'reps_5000',
    name: 'Rep Machine',
    description: 'Complete 5,000 total reps',
    category: 'volume',
    rarity: 'rare',
    icon: 'barbell',
    targetType: 'totalReps',
    targetValue: 5000,
    tier: 3,
    gradient: ['#DDA0DD', '#BA55D3'],
    xp: 250,
    islandRequired: 3,
  },
  {
    id: 'reps_10000',
    name: 'Rep Monster',
    description: 'Complete 10,000 total reps',
    category: 'volume',
    rarity: 'epic',
    icon: 'barbell',
    targetType: 'totalReps',
    targetValue: 10000,
    tier: 4,
    gradient: ['#FF3B30', '#FF9500'],
    xp: 500,
    islandRequired: 5,
  },
  {
    id: 'reps_50000',
    name: 'Rep God',
    description: 'Complete 50,000 total reps',
    category: 'volume',
    rarity: 'legendary',
    icon: 'barbell',
    targetType: 'totalReps',
    targetValue: 50000,
    tier: 5,
    gradient: ['#FFD700', '#FFF8DC'],
    xp: 1500,
    islandRequired: 9,
  },

  // ============ TRAINING HOURS ============
  {
    id: 'hours_5',
    name: 'Time Starter',
    description: 'Train for 5 hours total',
    category: 'volume',
    rarity: 'common',
    icon: 'time',
    targetType: 'totalMinutes',
    targetValue: 300,
    tier: 1,
    gradient: ['#5B8DEF', '#34C4E5'],
    xp: 75,
    islandRequired: 1,
  },
  {
    id: 'hours_25',
    name: 'Time Investor',
    description: 'Train for 25 hours total',
    category: 'volume',
    rarity: 'rare',
    icon: 'time',
    targetType: 'totalMinutes',
    targetValue: 1500,
    tier: 2,
    gradient: ['#34C759', '#00C7BE'],
    xp: 200,
    islandRequired: 2,
  },
  {
    id: 'hours_100',
    name: 'Time Warrior',
    description: 'Train for 100 hours total',
    category: 'volume',
    rarity: 'epic',
    icon: 'time',
    targetType: 'totalMinutes',
    targetValue: 6000,
    tier: 3,
    gradient: ['#FF6B35', '#FF4500'],
    xp: 500,
    islandRequired: 5,
  },
  {
    id: 'hours_500',
    name: 'Time Titan',
    description: 'Train for 500 hours total',
    category: 'volume',
    rarity: 'legendary',
    icon: 'time',
    targetType: 'totalMinutes',
    targetValue: 30000,
    tier: 4,
    gradient: ['#FFD700', '#FFA500'],
    xp: 1500,
    islandRequired: 9,
  },

  // ============ FOCUS BADGES ============
  {
    id: 'leg_5',
    name: 'Leg Day Starter',
    description: 'Complete 5 leg sessions',
    category: 'focus',
    rarity: 'common',
    icon: 'body',
    targetType: 'categorySessions',
    targetValue: 5,
    targetCategory: 'lower',
    tier: 1,
    gradient: ['#34C759', '#00C7BE'],
    xp: 75,
    islandRequired: 1,
  },
  {
    id: 'leg_20',
    name: 'Leg Day Loyalist',
    description: 'Complete 20 leg sessions',
    category: 'focus',
    rarity: 'rare',
    icon: 'body',
    targetType: 'categorySessions',
    targetValue: 20,
    targetCategory: 'lower',
    tier: 2,
    gradient: ['#98FB98', '#32CD32'],
    xp: 200,
    islandRequired: 3,
  },
  {
    id: 'leg_50',
    name: 'Leg Day Legend',
    description: 'Complete 50 leg sessions',
    category: 'focus',
    rarity: 'epic',
    icon: 'body',
    targetType: 'categorySessions',
    targetValue: 50,
    targetCategory: 'lower',
    tier: 3,
    gradient: ['#FF6B35', '#FFD60A'],
    xp: 500,
    islandRequired: 6,
  },
  {
    id: 'upper_5',
    name: 'Upper Beginner',
    description: 'Complete 5 upper body sessions',
    category: 'focus',
    rarity: 'common',
    icon: 'fitness',
    targetType: 'categorySessions',
    targetValue: 5,
    targetCategory: 'upper',
    tier: 1,
    gradient: ['#FF3B30', '#FF9500'],
    xp: 75,
    islandRequired: 1,
  },
  {
    id: 'upper_20',
    name: 'Upper Master',
    description: 'Complete 20 upper body sessions',
    category: 'focus',
    rarity: 'rare',
    icon: 'fitness',
    targetType: 'categorySessions',
    targetValue: 20,
    targetCategory: 'upper',
    tier: 2,
    gradient: ['#DDA0DD', '#BA55D3'],
    xp: 200,
    islandRequired: 3,
  },
  {
    id: 'upper_50',
    name: 'Upper Legend',
    description: 'Complete 50 upper body sessions',
    category: 'focus',
    rarity: 'epic',
    icon: 'fitness',
    targetType: 'categorySessions',
    targetValue: 50,
    targetCategory: 'upper',
    tier: 3,
    gradient: ['#A22BF6', '#FF4EC7'],
    xp: 500,
    islandRequired: 6,
  },
  {
    id: 'full_body_10',
    name: 'Full Body Fan',
    description: 'Complete 10 full body sessions',
    category: 'focus',
    rarity: 'common',
    icon: 'man',
    targetType: 'categorySessions',
    targetValue: 10,
    targetCategory: 'full',
    tier: 1,
    gradient: ['#5B8DEF', '#34C4E5'],
    xp: 100,
    islandRequired: 1,
  },
  {
    id: 'full_body_30',
    name: 'Full Body Freak',
    description: 'Complete 30 full body sessions',
    category: 'focus',
    rarity: 'rare',
    icon: 'man',
    targetType: 'categorySessions',
    targetValue: 30,
    targetCategory: 'full',
    tier: 2,
    gradient: ['#87CEEB', '#48D1CC'],
    xp: 300,
    islandRequired: 4,
  },
  {
    id: 'cardio_10',
    name: 'Cardio Starter',
    description: 'Complete 10 cardio sessions',
    category: 'focus',
    rarity: 'common',
    icon: 'heart',
    targetType: 'categorySessions',
    targetValue: 10,
    targetCategory: 'cardio',
    tier: 1,
    gradient: ['#FF6B35', '#FFD60A'],
    xp: 100,
    islandRequired: 1,
  },
  {
    id: 'cardio_30',
    name: 'Cardio King',
    description: 'Complete 30 cardio sessions',
    category: 'focus',
    rarity: 'rare',
    icon: 'heart',
    targetType: 'categorySessions',
    targetValue: 30,
    targetCategory: 'cardio',
    tier: 2,
    gradient: ['#FF3B30', '#FF9500'],
    xp: 300,
    islandRequired: 4,
  },

  // ============ CHALLENGE BADGES ============
  {
    id: 'early_bird_3',
    name: 'Early Riser',
    description: 'Complete 3 workouts before 7am',
    category: 'challenge',
    rarity: 'rare',
    icon: 'sunny',
    targetType: 'workouts',
    targetValue: 3,
    tier: 1,
    gradient: ['#FFD60A', '#FF9500'],
    xp: 150,
    islandRequired: 2,
  },
  {
    id: 'early_bird_10',
    name: 'Dawn Warrior',
    description: 'Complete 10 workouts before 7am',
    category: 'challenge',
    rarity: 'epic',
    icon: 'sunny',
    targetType: 'workouts',
    targetValue: 10,
    tier: 2,
    gradient: ['#FF6B35', '#FF4500'],
    xp: 400,
    islandRequired: 5,
  },
  {
    id: 'weekend_5',
    name: 'Weekend Starter',
    description: 'Complete 5 weekend workouts',
    category: 'challenge',
    rarity: 'common',
    icon: 'calendar',
    targetType: 'workouts',
    targetValue: 5,
    tier: 1,
    gradient: ['#34C759', '#00C7BE'],
    xp: 100,
    islandRequired: 1,
  },
  {
    id: 'weekend_20',
    name: 'Weekend Warrior',
    description: 'Complete 20 weekend workouts',
    category: 'challenge',
    rarity: 'rare',
    icon: 'calendar',
    targetType: 'workouts',
    targetValue: 20,
    tier: 2,
    gradient: ['#98FB98', '#32CD32'],
    xp: 250,
    islandRequired: 3,
  },
  {
    id: 'perfect_week',
    name: 'Perfect Week',
    description: 'Hit your weekly goal',
    category: 'challenge',
    rarity: 'rare',
    icon: 'checkmark-done',
    targetType: 'weeklyConsistency',
    targetValue: 5,
    tier: 1,
    gradient: ['#5B8DEF', '#34C4E5'],
    xp: 200,
    islandRequired: 1,
  },
];

// Rarity colors for UI
export const RARITY_COLORS: Record<BadgeRarity, { bg: string; text: string; border: string; glow: string }> = {
  common: { bg: '#E8E8E8', text: '#666666', border: '#CCCCCC', glow: 'rgba(150,150,150,0.3)' },
  rare: { bg: '#E3F2FD', text: '#1976D2', border: '#42A5F5', glow: 'rgba(66,165,245,0.3)' },
  epic: { bg: '#F3E5F5', text: '#7B1FA2', border: '#AB47BC', glow: 'rgba(171,71,188,0.3)' },
  legendary: { bg: '#FFF8E1', text: '#F57F17', border: '#FFD700', glow: 'rgba(255,215,0,0.4)' },
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
  getUnlockedBadges: () => Badge[];
  getLockedBadges: () => Badge[];
  getNextUnlocks: () => Array<{ badge: Badge; progress: UserBadge }>;
  getCompletedCount: () => number;
  getCurrentIsland: () => Island;
  getIslandProgress: () => { current: number; required: number; percentage: number };
  canUnlockNextIsland: () => boolean;
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
      const stored = await getStorageItem('user_badges_v2');
      if (stored) {
        const data = JSON.parse(stored);
        set({ 
          userBadges: data.badges || [],
          totalXP: data.totalXP || 0,
          currentIsland: data.currentIsland || 1,
        });
      } else {
        const initialBadges: UserBadge[] = BADGE_DEFINITIONS.map(badge => ({
          badgeId: badge.id,
          progress: 0,
          completed: false,
        }));
        set({ userBadges: initialBadges, totalXP: 0, currentIsland: 1 });
        await setStorageItem('user_badges_v2', JSON.stringify({ badges: initialBadges, totalXP: 0, currentIsland: 1 }));
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
      
      // Check if badge is available for current island
      if (badgeDef.islandRequired && badgeDef.islandRequired > currentIsland) {
        return userBadge;
      }
      
      let newProgress = 0;
      
      switch (badgeDef.targetType) {
        case 'workouts':
          newProgress = workoutData.totalWorkouts;
          break;
        case 'streak':
          newProgress = workoutData.currentStreak;
          break;
        case 'totalSets':
          newProgress = workoutData.totalSets;
          break;
        case 'totalReps':
          newProgress = workoutData.totalReps;
          break;
        case 'totalMinutes':
          newProgress = workoutData.totalMinutes;
          break;
        case 'weeklyConsistency':
          newProgress = workoutData.weeklyWorkouts;
          break;
        case 'categorySessions':
          if (badgeDef.targetCategory) {
            newProgress = workoutData.categoryCounts[badgeDef.targetCategory] || 0;
          }
          break;
      }
      
      const wasCompleted = userBadge.completed;
      const isNowCompleted = newProgress >= badgeDef.targetValue;
      
      if (isNowCompleted && !wasCompleted) {
        // Apply island XP multiplier
        const island = ISLANDS.find(i => i.id === currentIsland);
        const multiplier = island?.xpMultiplier || 1;
        const earnedXP = Math.round(badgeDef.xp * multiplier);
        
        newlyUnlockedIds.push(badgeDef.id);
        xpGained += earnedXP;
        console.log(`🏆 Badge unlocked: ${badgeDef.name} (+${earnedXP} XP)`);
      }
      
      return {
        ...userBadge,
        progress: Math.min(newProgress, badgeDef.targetValue),
        completed: isNowCompleted,
        unlockedAt: isNowCompleted && !wasCompleted ? new Date().toISOString() : userBadge.unlockedAt,
      };
    });
    
    const newTotalXP = totalXP + xpGained;
    
    // Check if we can advance to next island
    const completedCount = updatedBadges.filter(b => b.completed).length;
    let newIsland = currentIsland;
    
    for (let i = ISLANDS.length - 1; i >= 0; i--) {
      if (completedCount >= ISLANDS[i].requiredBadges) {
        newIsland = ISLANDS[i].id;
        break;
      }
    }
    
    if (newIsland > currentIsland) {
      console.log(`🏝️ Advanced to ${ISLANDS[newIsland - 1].name}!`);
    }
    
    set({ 
      userBadges: updatedBadges, 
      newlyUnlocked: newlyUnlockedIds,
      totalXP: newTotalXP,
      currentIsland: newIsland,
    });
    
    await setStorageItem('user_badges_v2', JSON.stringify({ 
      badges: updatedBadges, 
      totalXP: newTotalXP,
      currentIsland: newIsland,
    }));
    
    return newlyUnlockedIds;
  },

  clearNewlyUnlocked: () => set({ newlyUnlocked: [] }),

  getBadgeProgress: (badgeId: string) => get().userBadges.find(b => b.badgeId === badgeId),

  getUnlockedBadges: () => {
    const { userBadges } = get();
    return BADGE_DEFINITIONS.filter(badge => 
      userBadges.find(ub => ub.badgeId === badge.id)?.completed
    );
  },

  getLockedBadges: () => {
    const { userBadges } = get();
    return BADGE_DEFINITIONS.filter(badge => 
      !userBadges.find(ub => ub.badgeId === badge.id)?.completed
    );
  },

  getNextUnlocks: () => {
    const { userBadges, currentIsland } = get();
    
    return BADGE_DEFINITIONS
      .filter(badge => !badge.islandRequired || badge.islandRequired <= currentIsland)
      .map(badge => {
        const userBadge = userBadges.find(ub => ub.badgeId === badge.id);
        if (!userBadge || userBadge.completed) return null;
        
        const progressPercent = (userBadge.progress / badge.targetValue) * 100;
        return { badge, progress: userBadge, progressPercent };
      })
      .filter((b): b is { badge: Badge; progress: UserBadge; progressPercent: number } => b !== null)
      .sort((a, b) => b.progressPercent - a.progressPercent)
      .slice(0, 5);
  },

  getCompletedCount: () => get().userBadges.filter(b => b.completed).length,

  getCurrentIsland: () => ISLANDS.find(i => i.id === get().currentIsland) || ISLANDS[0],

  getIslandProgress: () => {
    const { currentIsland } = get();
    const completedCount = get().getCompletedCount();
    const nextIsland = ISLANDS.find(i => i.id === currentIsland + 1);
    
    if (!nextIsland) {
      return { current: completedCount, required: completedCount, percentage: 100 };
    }
    
    const currentIslandData = ISLANDS.find(i => i.id === currentIsland);
    const currentRequired = currentIslandData?.requiredBadges || 0;
    const progressInIsland = completedCount - currentRequired;
    const neededForNext = nextIsland.requiredBadges - currentRequired;
    
    return {
      current: progressInIsland,
      required: neededForNext,
      percentage: Math.min(Math.round((progressInIsland / neededForNext) * 100), 100),
    };
  },

  canUnlockNextIsland: () => {
    const { currentIsland } = get();
    const completedCount = get().getCompletedCount();
    const nextIsland = ISLANDS.find(i => i.id === currentIsland + 1);
    
    return nextIsland ? completedCount >= nextIsland.requiredBadges : false;
  },
}));
