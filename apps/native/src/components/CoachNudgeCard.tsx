// Phase 11.5: Coach Nudge Card Component
// Non-blocking inline card for readiness checks and coach suggestions
// CORE PRINCIPLE: The coach never interrupts. The coach nudges, waits, and adapts.

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useCoachStore } from '../stores/coach-store';
import { useAuthStore } from '../stores/auth-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COLORS = {
  accent: '#A22BF6',
  accentSecondary: '#FF4EC7',
  white: '#ffffff',
  text: '#222222',
  lightGray: '#F8F9FA',
  mediumGray: '#8E8E93',
  success: '#34C759',
  warmOrange: '#FF9500',
  cardBg: '#FFFFFF',
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://login-wizard-3.preview.emergentagent.com';

// Session storage key for nudge tracking
const NUDGE_SESSION_KEY = '@coach_nudge_session';
const NUDGE_DISMISS_KEY = '@coach_nudge_dismissed_date';

// Nudge types and their icons/colors
const NUDGE_CONFIG: Record<string, { icon: string; color: string; gradient: [string, string] }> = {
  readiness_check: {
    icon: 'barbell-outline',
    color: '#A22BF6',
    gradient: ['#A22BF6', '#FF4EC7'],
  },
  progression_offer: {
    icon: 'trending-up',
    color: '#34C759',
    gradient: ['#34C759', '#30D158'],
  },
  schedule_adjust: {
    icon: 'calendar-outline',
    color: '#007AFF',
    gradient: ['#007AFF', '#5AC8FA'],
  },
  recovery_adjust: {
    icon: 'bed-outline',
    color: '#FF9500',
    gradient: ['#FF9500', '#FFCC00'],
  },
  technique_focus: {
    icon: 'eye-outline',
    color: '#5856D6',
    gradient: ['#5856D6', '#AF52DE'],
  },
};

// Personality-aware message transformations
const PERSONALITY_TRANSFORMS: Record<string, (msg: string) => string> = {
  aggressive: (msg) => msg.replace(/Want to/g, 'Time to').replace(/\?/g, '.').replace(/Ready to/g, 'Let\'s'),
  disciplined: (msg) => msg, // Keep structured
  friendly: (msg) => msg.replace(/\./g, '! ').replace(/Ready/g, 'Hey, ready'),
  calm: (msg) => msg.replace(/Want to/g, 'When you\'re ready,').replace(/\?/g, ' — no rush.'),
};

export interface NudgeAction {
  label: string;
  action: 'accept' | 'decline' | 'ask_coach' | 'adjust' | 'dismiss';
  payload?: Record<string, any>;
}

export interface CoachNudge {
  id: number;
  userId: number;
  nudgeType: string;
  priority: number;
  message: string;
  actions: NudgeAction[];
  context?: Record<string, any>;
  expiresAt?: string;
  createdAt: string;
  seenAt?: string;
  resolvedAt?: string;
  resolution?: string;
}

type NudgeContext = 'home' | 'workout_hub' | 'exercise_detail';

interface CoachNudgeCardProps {
  nudge: CoachNudge;
  context: NudgeContext;
  personality?: 'aggressive' | 'disciplined' | 'friendly' | 'calm';
  onResolve: (nudgeId: number, resolution: 'accepted' | 'rejected' | 'dismissed', payload?: any) => void;
  onAskCoach?: (message: string) => void;
  onAdjust?: (context: any) => void;
  compact?: boolean;
}

// Auto-hide timeout (10 seconds)
const AUTO_HIDE_TIMEOUT = 10000;

export const CoachNudgeCard: React.FC<CoachNudgeCardProps> = ({
  nudge,
  context,
  personality = 'friendly',
  onResolve,
  onAskCoach,
  onAdjust,
  compact = false,
}) => {
  const [isResolving, setIsResolving] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const autoHideTimer = useRef<NodeJS.Timeout | null>(null);
  
  const { openChat } = useCoachStore();
  
  // Apply personality transformation to message
  const displayMessage = useCallback(() => {
    const transform = PERSONALITY_TRANSFORMS[personality];
    return transform ? transform(nudge.message) : nudge.message;
  }, [nudge.message, personality]);
  
  // Entry animation + shimmer
  useEffect(() => {
    // Entry animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Subtle shimmer animation (only on first render)
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    // Mark as seen
    markNudgeSeen(nudge.id);
    
    // Auto-hide after 10 seconds if ignored
    autoHideTimer.current = setTimeout(() => {
      handleAutoHide();
    }, AUTO_HIDE_TIMEOUT);
    
    return () => {
      if (autoHideTimer.current) {
        clearTimeout(autoHideTimer.current);
      }
    };
  }, [nudge.id]);
  
  const markNudgeSeen = async (nudgeId: number) => {
    try {
      await fetch(`${API_BASE_URL}/api/coach/nudges/${nudgeId}/seen`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.log('Failed to mark nudge seen:', error);
    }
  };
  
  const handleAutoHide = useCallback(() => {
    if (isResolving) return;
    
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
      // Don't resolve - just hide (will show again next session)
    });
  }, [isResolving, fadeAnim]);
  
  const handleAction = useCallback(async (action: NudgeAction) => {
    if (autoHideTimer.current) {
      clearTimeout(autoHideTimer.current);
    }
    
    setIsResolving(true);
    
    // Exit animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -10,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Map action to resolution
    let resolution: 'accepted' | 'rejected' | 'dismissed' = 'dismissed';
    if (action.action === 'accept') {
      resolution = 'accepted';
    } else if (action.action === 'decline') {
      resolution = 'rejected';
    }
    
    // Handle special actions
    if (action.action === 'ask_coach') {
      const contextMessage = nudge.context?.exercise 
        ? `I have a question about ${nudge.context.exercise}: ${nudge.message}`
        : nudge.message;
      
      if (onAskCoach) {
        onAskCoach(contextMessage);
      } else {
        openChat(contextMessage);
      }
      resolution = 'dismissed';
    }
    
    if (action.action === 'adjust' && onAdjust) {
      onAdjust(nudge.context);
      resolution = 'dismissed';
    }
    
    // Resolve via parent handler
    setTimeout(() => {
      onResolve(nudge.id, resolution, action.payload);
    }, 200);
  }, [nudge, onResolve, onAskCoach, onAdjust, openChat, fadeAnim, slideAnim]);
  
  const handleDismiss = useCallback(async () => {
    if (autoHideTimer.current) {
      clearTimeout(autoHideTimer.current);
    }
    
    setIsResolving(true);
    
    // Store dismiss date to prevent showing more nudges today
    const today = new Date().toISOString().split('T')[0];
    await AsyncStorage.setItem(NUDGE_DISMISS_KEY, today);
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onResolve(nudge.id, 'dismissed');
    });
  }, [nudge.id, onResolve, fadeAnim]);
  
  if (!isVisible) {
    return null;
  }
  
  const config = NUDGE_CONFIG[nudge.nudgeType] || NUDGE_CONFIG.readiness_check;
  
  // Shimmer opacity interpolation
  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.15],
  });
  
  return (
    <Animated.View
      style={[
        styles.container,
        compact && styles.containerCompact,
        context === 'exercise_detail' && styles.containerExerciseDetail,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={[styles.card, compact && styles.cardCompact]}>
        {/* Shimmer overlay */}
        <Animated.View 
          style={[
            styles.shimmerOverlay,
            { opacity: shimmerOpacity }
          ]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.8)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        
        {/* Accent bar */}
        <LinearGradient
          colors={config.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.accentBar}
        />
        
        {/* Dismiss button */}
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={handleDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={18} color={COLORS.mediumGray} />
        </TouchableOpacity>
        
        {/* Content */}
        <View style={styles.content}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: config.color + '15' }]}>
            <Ionicons name={config.icon as any} size={compact ? 18 : 22} color={config.color} />
          </View>
          
          {/* Message */}
          <Text style={[styles.message, compact && styles.messageCompact]} numberOfLines={compact ? 2 : 4}>
            {displayMessage()}
          </Text>
        </View>
        
        {/* Actions */}
        <View style={[styles.actions, compact && styles.actionsCompact]}>
          {nudge.actions.map((action, index) => {
            const isPrimary = action.action === 'accept';
            const isSecondary = action.action === 'decline';
            
            // Personality-aware button labels
            let label = action.label;
            if (personality === 'friendly' && action.action === 'accept') {
              label = label.replace('Yes', 'Yes! ');
            }
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.actionButton,
                  compact && styles.actionButtonCompact,
                  isPrimary && styles.actionButtonPrimary,
                  isSecondary && styles.actionButtonSecondary,
                ]}
                onPress={() => handleAction(action)}
                disabled={isResolving}
              >
                {isPrimary ? (
                  <LinearGradient
                    colors={config.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.actionButtonGradient}
                  >
                    <Text style={[styles.actionText, styles.actionTextPrimary]}>
                      {label}
                    </Text>
                  </LinearGradient>
                ) : (
                  <Text style={[
                    styles.actionText,
                    isSecondary && styles.actionTextSecondary,
                    !isPrimary && !isSecondary && styles.actionTextTertiary,
                  ]}>
                    {label}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </Animated.View>
  );
};

// =============================================================================
// HELPER HOOK: Check if nudge should be shown this session
// =============================================================================

export async function checkNudgeEligibility(): Promise<boolean> {
  try {
    // Check if already dismissed today
    const dismissDate = await AsyncStorage.getItem(NUDGE_DISMISS_KEY);
    const today = new Date().toISOString().split('T')[0];
    
    if (dismissDate === today) {
      return false; // Dismissed today, don't show
    }
    
    // Check if already shown this session
    const sessionShown = await AsyncStorage.getItem(NUDGE_SESSION_KEY);
    const sessionId = Date.now().toString().slice(0, -5); // Rough session ID (changes every ~30 seconds)
    
    if (sessionShown === sessionId) {
      return false; // Already shown this session
    }
    
    return true;
  } catch {
    return true; // Default to showing
  }
}

export async function markNudgeShownThisSession(): Promise<void> {
  const sessionId = Date.now().toString().slice(0, -5);
  await AsyncStorage.setItem(NUDGE_SESSION_KEY, sessionId);
}

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    marginHorizontal: 16,
  },
  containerCompact: {
    marginVertical: 4,
    marginHorizontal: 12,
  },
  containerExerciseDetail: {
    marginHorizontal: 0,
    marginTop: 12,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardCompact: {
    borderRadius: 12,
  },
  shimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  accentBar: {
    height: 3,
    width: '100%',
  },
  dismissButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    padding: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    paddingRight: 36, // Space for dismiss button
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
    color: COLORS.text,
    fontWeight: '500',
  },
  messageCompact: {
    fontSize: 14,
    lineHeight: 19,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingBottom: 14,
    gap: 8,
  },
  actionsCompact: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    gap: 6,
  },
  actionButton: {
    borderRadius: 10,
    overflow: 'hidden',
    minWidth: 80,
  },
  actionButtonCompact: {
    borderRadius: 8,
    minWidth: 70,
  },
  actionButtonPrimary: {
    // Gradient applied via child
  },
  actionButtonSecondary: {
    backgroundColor: COLORS.lightGray,
  },
  actionButtonGradient: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  actionTextPrimary: {
    color: COLORS.white,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  actionTextSecondary: {
    color: COLORS.text,
  },
  actionTextTertiary: {
    color: COLORS.accent,
    backgroundColor: 'transparent',
  },
});

export default CoachNudgeCard;
