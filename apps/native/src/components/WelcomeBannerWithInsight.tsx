// Phase 9: Welcome Banner with Coach Chat Preview
// NO NAVIGATION - conversational only
// Tap rotates to next coach message

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

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

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
const MAX_INSIGHTS_PER_DAY = 15;

// Conversational coach messages - NO actions, just chat preview
const COACH_MESSAGES: string[] = [
  "Ready when you are. Let's make today count!",
  "Every rep brings you closer to your goals.",
  "Consistency beats perfection. Small steps add up.",
  "Your body is capable of more than you think.",
  "Rest is part of the process. Don't skip it.",
  "Progress isn't always visible, but it's happening.",
  "Show up for yourself today.",
  "The best workout is the one you actually do.",
  "Trust the process. Results will follow.",
  "You're stronger than yesterday.",
  "Focus on form, the gains will follow.",
  "One workout at a time. That's all it takes.",
];

export const WelcomeBannerWithInsight: React.FC<WelcomeBannerWithInsightProps> = ({
  userName,
  currentStreak,
  totalWorkouts,
  onInsightTap,
}) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [shownToday, setShownToday] = useState(0);
  
  const { coachName, openChat } = useCoachStore();
  const { user } = useAuthStore();
  const completedWorkouts = useWorkoutStore(state => state.completedWorkouts);
  
  // Animation for message text
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
  
  // Generate contextual message based on current state
  const getContextualMessage = useCallback((): string | null => {
    // If just completed a workout today
    if (justCompletedToday()) {
      return "You smashed it today! Rest up and recover well. 💪";
    }
    
    // If on a great streak
    if (currentStreak >= 7) {
      return `${currentStreak} day streak! You're unstoppable right now.`;
    }
    
    // If building momentum
    if (currentStreak >= 3) {
      return `${currentStreak} days strong. Keep the momentum going!`;
    }
    
    return null;
  }, [justCompletedToday, currentStreak]);
  
  // Load rotation state
  const loadRotationState = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const state = JSON.parse(stored);
        const today = new Date().toDateString();
        
        if (state.date === today) {
          setCurrentMessageIndex(state.index || 0);
          setShownToday(state.shownToday || 0);
        } else {
          // New day, reset
          const randomStart = Math.floor(Math.random() * COACH_MESSAGES.length);
          setCurrentMessageIndex(randomStart);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
            date: today,
            index: randomStart,
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
  }, [loadRotationState]);
  
  // Rotate to next message on tap - NO NAVIGATION
  const handleBannerTap = useCallback(() => {
    if (shownToday >= MAX_INSIGHTS_PER_DAY) return;
    
    const newIndex = (currentMessageIndex + 1) % COACH_MESSAGES.length;
    const newShownToday = shownToday + 1;
    
    // Animate fade out then in
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
    
    setCurrentMessageIndex(newIndex);
    setShownToday(newShownToday);
    saveRotationState(newIndex, newShownToday);
  }, [currentMessageIndex, shownToday, saveRotationState, fadeAnim]);
  
  // Get current message to display
  const currentMessage = getContextualMessage() || COACH_MESSAGES[currentMessageIndex] || COACH_MESSAGES[0];
  
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
      
      {/* Coach message section - TAP TO ROTATE, NO NAVIGATION */}
      <TouchableOpacity 
        style={styles.messageSection} 
        onPress={handleBannerTap}
        activeOpacity={0.7}
      >
        <Animated.View style={[styles.messageContent, { opacity: fadeAnim }]}>
          <Ionicons name="sparkles" size={14} color="rgba(255,255,255,0.8)" style={styles.messageIcon} />
          <Text style={styles.messageText} numberOfLines={2}>
            {currentMessage}
          </Text>
          {/* Small tap indicator instead of arrow */}
          <Text style={styles.tapHint}>tap</Text>
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
  messageSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageIcon: {
    marginRight: 8,
  },
  messageText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    lineHeight: 18,
  },
  tapHint: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default WelcomeBannerWithInsight;
