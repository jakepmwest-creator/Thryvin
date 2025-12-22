// Phase 9: Welcome Banner with Integrated Coach Insight
// Combines the welcome banner with a subtle coach insight at the bottom

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useCoachStore } from '../stores/coach-store';
import { useAuthStore } from '../stores/auth-store';
import { useWorkoutStore } from '../stores/workout-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COLORS = {
  accent: '#A22BF6',
  accentSecondary: '#FF4EC7',
  gradientStart: '#A22BF6',
  gradientEnd: '#FF4EC7',
  white: '#ffffff',
  text: '#222222',
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://ui-voice-fix.preview.emergentagent.com';

export type InsightAction = 'start_workout' | 'swap_day' | 'ask_coach' | 'edit_workout' | 'view_stats' | 'rest_day' | 'none';

export interface CoachInsight {
  id: string;
  message: string;
  action: InsightAction;
  actionLabel: string;
  category: string;
  priority: number;
}

interface WelcomeBannerWithInsightProps {
  userName: string;
  currentStreak: number;
  totalWorkouts: number;
  onInsightTap?: (action: InsightAction, insight: CoachInsight) => void;
}

const STORAGE_KEY = 'coach_insights_rotation';
const MAX_INSIGHTS_PER_DAY = 10;

// Default insights if API fails or loading
const DEFAULT_INSIGHTS: CoachInsight[] = [
  { id: 'default-1', message: "Ready when you are. Let's make today count!", action: 'start_workout', actionLabel: 'Start', category: 'motivation', priority: 5 },
  { id: 'default-2', message: "Every expert was once a beginner. Keep going!", action: 'none', actionLabel: '', category: 'motivation', priority: 4 },
  { id: 'default-3', message: "Consistency beats perfection. Small steps add up.", action: 'none', actionLabel: '', category: 'tip', priority: 4 },
];

export const WelcomeBannerWithInsight: React.FC<WelcomeBannerWithInsightProps> = ({
  userName,
  currentStreak,
  totalWorkouts,
  onInsightTap,
}) => {
  const [insights, setInsights] = useState<CoachInsight[]>(DEFAULT_INSIGHTS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shownToday, setShownToday] = useState(0);
  
  const { coachName, openChat } = useCoachStore();
  const { user } = useAuthStore();
  const completedWorkouts = useWorkoutStore(state => state.completedWorkouts);
  
  // Animation for insight text
  const fadeAnim = useRef(new Animated.Value(1)).current;
  
  // Check if user just completed a workout today
  const justCompletedToday = useCallback(() => {
    if (!completedWorkouts || completedWorkouts.length === 0) return false;
    const today = new Date().toDateString();
    const recentWorkout = completedWorkouts[0];
    if (!recentWorkout?.completedAt) return false;
    const workoutDate = new Date(recentWorkout.completedAt).toDateString();
    return workoutDate === today;
  }, [completedWorkouts]);
  
  // Generate contextual insight based on current state
  const getContextualInsight = useCallback((): CoachInsight | null => {
    // If just completed a workout today
    if (justCompletedToday()) {
      return {
        id: 'completed-today',
        message: "You smashed it today! Rest up and recover well. 💪",
        action: 'view_stats',
        actionLabel: 'View',
        category: 'progress',
        priority: 10,
      };
    }
    
    // If on a great streak
    if (currentStreak >= 7) {
      return {
        id: 'streak-high',
        message: `${currentStreak} day streak! You're unstoppable right now.`,
        action: 'none',
        actionLabel: '',
        category: 'streak',
        priority: 9,
      };
    }
    
    // If building momentum
    if (currentStreak >= 3) {
      return {
        id: 'streak-building',
        message: `${currentStreak} days strong. Keep the momentum going!`,
        action: 'none',
        actionLabel: '',
        category: 'streak',
        priority: 8,
      };
    }
    
    return null;
  }, [justCompletedToday, currentStreak]);
  
  // Fetch insights from API
  const fetchInsights = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/coach/insights?count=10&coachName=${encodeURIComponent(coachName)}`,
        {
          headers: { 'Bypass-Tunnel-Reminder': 'true' },
          credentials: 'include',
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.insights && data.insights.length > 0) {
          setInsights(data.insights);
        }
      }
    } catch (error) {
      console.log('Could not fetch insights, using defaults');
    }
  }, [user?.id, coachName]);
  
  // Load rotation state
  const loadRotationState = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const state = JSON.parse(stored);
        const today = new Date().toDateString();
        
        if (state.date === today) {
          setCurrentIndex(state.index || 0);
          setShownToday(state.shownToday || 0);
        } else {
          // New day, reset
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
            date: today,
            index: 0,
            shownToday: 0,
          }));
        }
      }
    } catch (error) {
      console.log('Could not load rotation state');
    }
  }, []);
  
  // Save rotation state
  const saveRotationState = useCallback(async (newIndex: number, newShownToday: number) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        date: new Date().toDateString(),
        index: newIndex,
        shownToday: newShownToday,
      }));
    } catch (error) {
      console.log('Could not save rotation state');
    }
  }, []);
  
  // Initial load
  useEffect(() => {
    loadRotationState();
    fetchInsights();
  }, [loadRotationState, fetchInsights]);
  
  // Rotate to next insight
  const rotateInsight = useCallback(() => {
    if (insights.length === 0 || shownToday >= MAX_INSIGHTS_PER_DAY) return;
    
    const newIndex = (currentIndex + 1) % insights.length;
    const newShownToday = shownToday + 1;
    
    // Animate fade out then in
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
    
    setCurrentIndex(newIndex);
    setShownToday(newShownToday);
    saveRotationState(newIndex, newShownToday);
  }, [currentIndex, insights.length, shownToday, saveRotationState, fadeAnim]);
  
  // Handle tap on insight
  const handleInsightTap = useCallback(() => {
    const insight = getContextualInsight() || insights[currentIndex];
    if (!insight) return;
    
    // If there's an action and handler
    if (insight.action !== 'none' && onInsightTap) {
      onInsightTap(insight.action, insight);
    }
    
    // Always rotate on tap
    rotateInsight();
  }, [currentIndex, insights, getContextualInsight, onInsightTap, rotateInsight]);
  
  // Get current insight to display
  const currentInsight = getContextualInsight() || insights[currentIndex] || DEFAULT_INSIGHTS[0];
  
  return (
    <LinearGradient
      colors={[COLORS.gradientStart, COLORS.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.banner}
    >
      {/* Main welcome content */}
      <View style={styles.mainContent}>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.userName}>{userName}! 💪</Text>
        </View>
        <View style={styles.statsChips}>
          <View style={styles.chip}>
            <Ionicons name="flame" size={14} color={COLORS.white} />
            <Text style={styles.chipText}>{currentStreak} day streak</Text>
          </View>
          <View style={styles.chip}>
            <Ionicons name="checkmark-circle" size={14} color={COLORS.white} />
            <Text style={styles.chipText}>{totalWorkouts} workouts</Text>
          </View>
        </View>
      </View>
      
      {/* Divider line */}
      <View style={styles.divider} />
      
      {/* Coach insight section - subtle and tappable */}
      <TouchableOpacity 
        style={styles.insightSection} 
        onPress={handleInsightTap}
        activeOpacity={0.7}
      >
        <Animated.View style={[styles.insightContent, { opacity: fadeAnim }]}>
          <Ionicons name="sparkles" size={14} color="rgba(255,255,255,0.8)" style={styles.insightIcon} />
          <Text style={styles.insightText} numberOfLines={2}>
            {currentInsight.message}
          </Text>
          <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.5)" />
        </Animated.View>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  mainContent: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  welcomeText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
    marginTop: 2,
  },
  statsChips: {
    alignItems: 'flex-end',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  chipText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 16,
  },
  insightSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  insightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightIcon: {
    marginRight: 8,
  },
  insightText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    lineHeight: 18,
  },
});

export default WelcomeBannerWithInsight;
