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
  targetCategory?: string; // For category-specific badges (e.g., 'lower', 'upper')
  tier?: number; // For tiered badges
  gradient: string[];
  xp: number;
}

// User's badge progress
export interface UserBadge {
  badgeId: string;
  progress: number;
  completed: boolean;
  unlockedAt?: string;
}

// All badge definitions
export const BADGE_DEFINITIONS: Badge[] = [
  // ============ CONSISTENCY BADGES ============
  {
    id: 'first_workout',
    name: 'First Steps',
    description: 'Complete your first workout',
    category: 'consistency',
    rarity: 'common',
    icon: 'footsteps',
    targetType: 'workouts',
    targetValue: 1,
    gradient: ['#34C759', '#00C7BE'],
    xp: 50,
  },
  {
    id: 'week_starter',
    name: '3 in a Week',
    description: 'Complete 3 workouts in a single week',
    category: 'consistency',
    rarity: 'common',
    icon: 'calendar',
    targetType: 'weeklyConsistency',
    targetValue: 3,
    gradient: ['#5B8DEF', '#34C4E5'],
    xp: 75,
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Train 7 days in a row',
    category: 'consistency',
    rarity: 'rare',
    icon: 'flame',
    targetType: 'streak',
    targetValue: 7,
    tier: 1,
    gradient: ['#FF6B35', '#FFD60A'],
    xp: 150,
  },
  {
    id: 'streak_14',
    name: 'Fortnight Fighter',
    description: 'Train 14 days in a row',
    category: 'consistency',
    rarity: 'epic',
    icon: 'flame',
    targetType: 'streak',
    targetValue: 14,
    tier: 2,
    gradient: ['#FF3B30', '#FF9500'],
    xp: 300,
  },
  {
    id: 'streak_30',
    name: 'Monthly Master',
    description: 'Train 30 days in a row',
    category: 'consistency',
    rarity: 'legendary',
    icon: 'flame',
    targetType: 'streak',
    targetValue: 30,
    tier: 3,
    gradient: ['#A22BF6', '#FF4EC7'],
    xp: 500,
  },
  {
    id: 'consistent_4_weeks',
    name: 'Habit Builder',
    description: 'Train 3x per week for 4 weeks straight',
    category: 'consistency',
    rarity: 'epic',
    icon: 'repeat',
    targetType: 'weeklyConsistency',
    targetValue: 12, // 3 x 4 weeks
    gradient: ['#FF9500', '#FF3B30'],
    xp: 400,
  },

  // ============ VOLUME/EFFORT BADGES ============
  {
    id: 'sets_100',
    name: 'Set Starter',
    description: 'Complete 100 total sets',
    category: 'volume',
    rarity: 'common',
    icon: 'layers',
    targetType: 'totalSets',
    targetValue: 100,
    tier: 1,
    gradient: ['#5B8DEF', '#34C4E5'],
    xp: 100,
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
    tier: 2,
    gradient: ['#34C759', '#00C7BE'],
    xp: 250,
  },
  {
    id: 'sets_1000',
    name: 'Set Legend',
    description: 'Complete 1,000 total sets',
    category: 'volume',
    rarity: 'legendary',
    icon: 'layers',
    targetType: 'totalSets',
    targetValue: 1000,
    tier: 3,
    gradient: ['#FFD700', '#FFA500'],
    xp: 500,
  },
  {
    id: 'reps_1000',
    name: 'Rep Rookie',
    description: 'Complete 1,000 total reps',
    category: 'volume',
    rarity: 'common',
    icon: 'barbell',
    targetType: 'totalReps',
    targetValue: 1000,
    tier: 1,
    gradient: ['#FF6B35', '#FFD60A'],
    xp: 100,
  },
  {
    id: 'reps_5000',
    name: 'Rep Machine',
    description: 'Complete 5,000 total reps',
    category: 'volume',
    rarity: 'epic',
    icon: 'barbell',
    targetType: 'totalReps',
    targetValue: 5000,
    tier: 2,
    gradient: ['#A22BF6', '#FF4EC7'],
    xp: 350,
  },
  {
    id: 'hours_10',
    name: 'Time Investor',
    description: 'Train for 10 total hours',
    category: 'volume',
    rarity: 'rare',
    icon: 'time',
    targetType: 'totalMinutes',
    targetValue: 600,
    tier: 1,
    gradient: ['#5B8DEF', '#34C4E5'],
    xp: 200,
  },
  {
    id: 'hours_50',
    name: 'Time Titan',
    description: 'Train for 50 total hours',
    category: 'volume',
    rarity: 'legendary',
    icon: 'time',
    targetType: 'totalMinutes',
    targetValue: 3000,
    tier: 2,
    gradient: ['#FFD700', '#FFA500'],
    xp: 500,
  },

  // ============ FOCUS/CATEGORY BADGES ============
  {
    id: 'leg_loyalist',
    name: 'Leg Day Loyalist',
    description: 'Complete 10 lower body sessions',
    category: 'focus',
    rarity: 'rare',
    icon: 'body',
    targetType: 'categorySessions',
    targetValue: 10,
    targetCategory: 'lower',
    gradient: ['#34C759', '#00C7BE'],
    xp: 200,
  },
  {
    id: 'upper_master',
    name: 'Upper Body Master',
    description: 'Complete 10 upper body sessions',
    category: 'focus',
    rarity: 'rare',
    icon: 'fitness',
    targetType: 'categorySessions',
    targetValue: 10,
    targetCategory: 'upper',
    gradient: ['#FF3B30', '#FF9500'],
    xp: 200,
  },
  {
    id: 'full_body_freak',
    name: 'Full Body Freak',
    description: 'Complete 10 full body sessions',
    category: 'focus',
    rarity: 'rare',
    icon: 'man',
    targetType: 'categorySessions',
    targetValue: 10,
    targetCategory: 'full',
    gradient: ['#A22BF6', '#FF4EC7'],
    xp: 200,
  },
  {
    id: 'cardio_king',
    name: 'Cardio King',
    description: 'Complete 10 cardio sessions',
    category: 'focus',
    rarity: 'rare',
    icon: 'heart',
    targetType: 'categorySessions',
    targetValue: 10,
    targetCategory: 'cardio',
    gradient: ['#FF6B35', '#FFD60A'],
    xp: 200,
  },

  // ============ PROGRAM PROGRESSION BADGES ============
  {
    id: 'week_1',
    name: 'Week 1 Complete',
    description: 'Finish your first week of training',
    category: 'program',
    rarity: 'common',
    icon: 'flag',
    targetType: 'workouts',
    targetValue: 5, // Assuming ~5 workouts per week
    tier: 1,
    gradient: ['#5B8DEF', '#34C4E5'],
    xp: 100,
  },
  {
    id: 'month_1',
    name: 'Month 1 Complete',
    description: 'Complete 4 weeks of training',
    category: 'program',
    rarity: 'rare',
    icon: 'medal',
    targetType: 'workouts',
    targetValue: 20,
    tier: 2,
    gradient: ['#34C759', '#00C7BE'],
    xp: 300,
  },
  {
    id: 'quarter_1',
    name: '12 Week Warrior',
    description: 'Complete 12 weeks of training',
    category: 'program',
    rarity: 'epic',
    icon: 'trophy',
    targetType: 'workouts',
    targetValue: 60,
    tier: 3,
    gradient: ['#FF9500', '#FF3B30'],
    xp: 600,
  },
  {
    id: 'century_club',
    name: 'Century Club',
    description: 'Complete 100 workouts',
    category: 'program',
    rarity: 'legendary',
    icon: 'star',
    targetType: 'workouts',
    targetValue: 100,
    tier: 4,
    gradient: ['#FFD700', '#FFA500'],
    xp: 1000,
  },

  // ============ CHALLENGE BADGES ============
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Complete 5 workouts before 7am',
    category: 'challenge',
    rarity: 'epic',
    icon: 'sunny',
    targetType: 'workouts',
    targetValue: 5,
    gradient: ['#FFD60A', '#FF9500'],
    xp: 300,
  },
  {
    id: 'weekend_warrior',
    name: 'Weekend Warrior',
    description: 'Complete 10 weekend workouts',
    category: 'challenge',
    rarity: 'rare',
    icon: 'calendar',
    targetType: 'workouts',
    targetValue: 10,
    gradient: ['#34C759', '#00C7BE'],
    xp: 200,
  },
];

// Rarity colors for UI
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
  newlyUnlocked: string[]; // Badge IDs that were just unlocked
  totalXP: number;
  level: number;
  
  // Actions
  loadUserBadges: () => Promise<void>;
  checkBadges: (workoutData: WorkoutDataForBadges) => Promise<string[]>; // Returns newly unlocked badge IDs
  clearNewlyUnlocked: () => void;
  getBadgeProgress: (badgeId: string) => UserBadge | undefined;
  getUnlockedBadges: () => Badge[];
  getLockedBadges: () => Badge[];
  getNextUnlocks: () => Array<{ badge: Badge; progress: UserBadge }>;
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
  level: 1,

  loadUserBadges: async () => {
    try {
      const stored = await getStorageItem('user_badges');
      if (stored) {
        const data = JSON.parse(stored);
        set({ 
          userBadges: data.badges || [],
          totalXP: data.totalXP || 0,
          level: data.level || 1,
        });
      } else {
        // Initialize empty badges
        const initialBadges: UserBadge[] = BADGE_DEFINITIONS.map(badge => ({
          badgeId: badge.id,
          progress: 0,
          completed: false,
        }));
        set({ userBadges: initialBadges, totalXP: 0, level: 1 });
        await setStorageItem('user_badges', JSON.stringify({ badges: initialBadges, totalXP: 0, level: 1 }));
      }
    } catch (error) {
      console.error('Error loading badges:', error);
    }
  },

  checkBadges: async (workoutData: WorkoutDataForBadges) => {
    const { userBadges, totalXP } = get();
    const newlyUnlockedIds: string[] = [];
    let xpGained = 0;
    
    const updatedBadges = userBadges.map(userBadge => {
      const badgeDef = BADGE_DEFINITIONS.find(b => b.id === userBadge.badgeId);
      if (!badgeDef || userBadge.completed) return userBadge;
      
      let newProgress = 0;
      
      // Calculate progress based on target type
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
        newlyUnlockedIds.push(badgeDef.id);
        xpGained += badgeDef.xp;
        console.log(`🏆 Badge unlocked: ${badgeDef.name} (+${badgeDef.xp} XP)`);
      }
      
      return {
        ...userBadge,
        progress: Math.min(newProgress, badgeDef.targetValue),
        completed: isNowCompleted,
        unlockedAt: isNowCompleted && !wasCompleted ? new Date().toISOString() : userBadge.unlockedAt,
      };
    });
    
    const newTotalXP = totalXP + xpGained;
    const newLevel = Math.floor(newTotalXP / 500) + 1; // Level up every 500 XP
    
    set({ 
      userBadges: updatedBadges, 
      newlyUnlocked: newlyUnlockedIds,
      totalXP: newTotalXP,
      level: newLevel,
    });
    
    // Persist
    await setStorageItem('user_badges', JSON.stringify({ 
      badges: updatedBadges, 
      totalXP: newTotalXP,
      level: newLevel,
    }));
    
    return newlyUnlockedIds;
  },

  clearNewlyUnlocked: () => {
    set({ newlyUnlocked: [] });
  },

  getBadgeProgress: (badgeId: string) => {
    return get().userBadges.find(b => b.badgeId === badgeId);
  },

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
    const { userBadges } = get();
    
    // Get badges sorted by progress percentage (closest to completion first)
    const badgesWithProgress = BADGE_DEFINITIONS
      .map(badge => {
        const userBadge = userBadges.find(ub => ub.badgeId === badge.id);
        if (!userBadge || userBadge.completed) return null;
        
        const progressPercent = (userBadge.progress / badge.targetValue) * 100;
        return { badge, progress: userBadge, progressPercent };
      })
      .filter((b): b is { badge: Badge; progress: UserBadge; progressPercent: number } => b !== null)
      .sort((a, b) => b.progressPercent - a.progressPercent)
      .slice(0, 5); // Top 5 closest
    
    return badgesWithProgress;
  },
}));
