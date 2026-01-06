// Phase 9: Coach Insight Bubble Component
// A floating "thought bubble" that shows proactive coach insights

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useCoachStore } from '../stores/coach-store';
import { useAuthStore } from '../stores/auth-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  accent: '#A22BF6',
  accentSecondary: '#FF4EC7',
  white: '#ffffff',
  text: '#222222',
  lightGray: '#F8F9FA',
  mediumGray: '#8E8E93',
  cardBg: '#FFFFFF',
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://login-wizard-3.preview.emergentagent.com';

export type InsightAction = 'start_workout' | 'swap_day' | 'ask_coach' | 'edit_workout' | 'view_stats' | 'rest_day' | 'none';

export interface CoachInsight {
  id: string;
  message: string;
  action: InsightAction;
  actionLabel: string;
  category: 'motivation' | 'progress' | 'schedule' | 'tip' | 'streak' | 'recovery' | 'suggestion';
  priority: number;
  generatedAt: string;
  expiresAt: string;
}

interface CoachInsightBubbleProps {
  onAction?: (action: InsightAction, insight: CoachInsight) => void;
  style?: any;
}

const STORAGE_KEY = 'coach_insights_rotation';
const MAX_INSIGHTS_PER_DAY = 10;

export const CoachInsightBubble: React.FC<CoachInsightBubbleProps> = ({ onAction, style }) => {
  const [insights, setInsights] = useState<CoachInsight[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [shownToday, setShownToday] = useState(0);
  
  const { coachName, openChat } = useCoachStore();
  const { user } = useAuthStore();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Fetch insights from API
  const fetchInsights = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    
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
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, coachName]);
  
  // Load rotation state from storage
  const loadRotationState = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const state = JSON.parse(stored);
        const today = new Date().toDateString();
        
        if (state.date === today) {
          setCurrentIndex(state.index || 0);
          setShownToday(state.shownToday || 0);
          
          // Hide if we've shown max insights today
          if (state.shownToday >= MAX_INSIGHTS_PER_DAY) {
            setIsVisible(false);
          }
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
  
  // Animate in when insights loaded
  useEffect(() => {
    if (!isLoading && insights.length > 0 && isVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Start subtle pulse animation
      const startPulse = () => {
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]).start(() => startPulse());
      };
      startPulse();
    }
  }, [isLoading, insights.length, isVisible]);
  
  // Rotate to next insight
  const rotateInsight = useCallback(() => {
    if (insights.length === 0) return;
    
    const newIndex = (currentIndex + 1) % insights.length;
    const newShownToday = shownToday + 1;
    
    setCurrentIndex(newIndex);
    setShownToday(newShownToday);
    saveRotationState(newIndex, newShownToday);
    
    // Animate transition
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: -20, duration: 150, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
      ]),
    ]).start();
    
    // Hide if we've shown max insights
    if (newShownToday >= MAX_INSIGHTS_PER_DAY) {
      setTimeout(() => {
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
          setIsVisible(false);
        });
      }, 3000);
    }
  }, [currentIndex, insights.length, shownToday, saveRotationState, fadeAnim, slideAnim]);
  
  // Handle action button press
  const handleAction = useCallback((action: InsightAction) => {
    const insight = insights[currentIndex];
    
    if (action === 'ask_coach') {
      openChat();
    }
    
    if (onAction) {
      onAction(action, insight);
    }
    
    // Rotate after action
    rotateInsight();
  }, [currentIndex, insights, openChat, onAction, rotateInsight]);
  
  // Handle dismiss (swipe/tap to rotate)
  const handleDismiss = useCallback(() => {
    rotateInsight();
  }, [rotateInsight]);
  
  // Get icon for action type
  const getActionIcon = (action: InsightAction): string => {
    switch (action) {
      case 'start_workout': return 'play-circle';
      case 'swap_day': return 'swap-horizontal';
      case 'ask_coach': return 'chatbubble-ellipses';
      case 'edit_workout': return 'create';
      case 'view_stats': return 'stats-chart';
      case 'rest_day': return 'moon';
      default: return 'arrow-forward';
    }
  };
  
  // Get category icon
  const getCategoryIcon = (category: string): string => {
    switch (category) {
      case 'streak': return 'flame';
      case 'progress': return 'trending-up';
      case 'schedule': return 'calendar';
      case 'tip': return 'bulb';
      case 'recovery': return 'heart';
      case 'motivation': return 'sparkles';
      case 'suggestion': return 'lightbulb';
      default: return 'sparkles';
    }
  };
  
  // Don't render if not visible or no insights
  if (!isVisible || insights.length === 0) {
    return null;
  }
  
  if (isLoading) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={COLORS.accent} />
        </View>
      </View>
    );
  }
  
  const currentInsight = insights[currentIndex];
  if (!currentInsight) return null;
  
  return (
    <Animated.View 
      style={[
        styles.container, 
        style,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: pulseAnim },
          ],
        },
      ]}
    >
      <TouchableOpacity 
        activeOpacity={0.9}
        onPress={handleDismiss}
        style={styles.touchable}
      >
        <LinearGradient
          colors={['#FFFFFF', '#F8F4FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bubble}
        >
          {/* Coach avatar indicator */}
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={[COLORS.accent, COLORS.accentSecondary]}
              style={styles.avatar}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons 
                name={getCategoryIcon(currentInsight.category) as any} 
                size={16} 
                color={COLORS.white} 
              />
            </LinearGradient>
          </View>
          
          {/* Message */}
          <View style={styles.messageContainer}>
            <Text style={styles.coachLabel}>{coachName}</Text>
            <Text style={styles.message}>{currentInsight.message}</Text>
          </View>
          
          {/* Action button */}
          {currentInsight.action !== 'none' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleAction(currentInsight.action)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={[COLORS.accent, COLORS.accentSecondary]}
                style={styles.actionGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.actionLabel}>{currentInsight.actionLabel}</Text>
                <Ionicons 
                  name={getActionIcon(currentInsight.action) as any} 
                  size={14} 
                  color={COLORS.white} 
                />
              </LinearGradient>
            </TouchableOpacity>
          )}
          
          {/* Dismiss hint */}
          <View style={styles.dismissHint}>
            <Ionicons name="chevron-forward" size={14} color={COLORS.mediumGray} />
          </View>
        </LinearGradient>
      </TouchableOpacity>
      
      {/* Rotation indicator dots */}
      <View style={styles.dotsContainer}>
        {insights.slice(0, 5).map((_, idx) => (
          <View 
            key={idx} 
            style={[
              styles.dot,
              idx === currentIndex % 5 && styles.dotActive,
            ]} 
          />
        ))}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  loadingContainer: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  touchable: {
    borderRadius: 16,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  bubble: {
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${COLORS.accent}15`,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageContainer: {
    flex: 1,
    marginRight: 8,
  },
  coachLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.accent,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  message: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    lineHeight: 20,
  },
  actionButton: {
    marginLeft: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 4,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
  dismissHint: {
    position: 'absolute',
    right: 6,
    top: '50%',
    marginTop: -7,
    opacity: 0.4,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.lightGray,
  },
  dotActive: {
    backgroundColor: COLORS.accent,
    width: 12,
  },
});

export default CoachInsightBubble;
