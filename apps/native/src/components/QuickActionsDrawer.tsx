/**
 * QuickActionsDrawer - Swipe-up quick actions panel for coach chat
 * 
 * Features:
 * - 3-4 visible quick action circles above text input
 * - Swipe up arrow to reveal full list
 * - Animated expand/collapse
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS as THEME_COLORS } from '../constants/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const COLORS = {
  accent: THEME_COLORS.gradientStart,
  accentSecondary: THEME_COLORS.gradientEnd,
  white: THEME_COLORS.white,
  text: THEME_COLORS.text,
  lightGray: THEME_COLORS.lightGray,
  mediumGray: THEME_COLORS.mediumGray,
};

const COLLAPSED_HEIGHT = 80;
const EXPANDED_HEIGHT = 320;

export interface QuickActionItem {
  id: string;
  icon: string;
  label: string;
  prompt: string;
  category?: 'primary' | 'secondary';
}

// Complete list of quick actions
export const ALL_QUICK_ACTIONS: QuickActionItem[] = [
  // Primary (visible in collapsed state) - 4 buttons
  { id: 'swap', icon: 'swap-horizontal', label: 'Swap Days', prompt: 'I need to swap my workout days', category: 'primary' },
  { id: 'add', icon: 'add-circle', label: 'Add Workout', prompt: 'Add a workout', category: 'primary' },
  { id: 'edit', icon: 'create', label: 'Edit', prompt: 'I want to edit my workout', category: 'primary' },
  { id: 'harder', icon: 'flame', label: 'Harder', prompt: 'Make my workout harder', category: 'primary' },
  
  // Secondary (shown when expanded)
  { id: 'easier', icon: 'leaf', label: 'Easier', prompt: 'Make my workout easier', category: 'secondary' },
  { id: 'shorter', icon: 'time-outline', label: 'Shorter', prompt: 'Make my workout shorter', category: 'secondary' },
  { id: 'longer', icon: 'timer-outline', label: 'Longer', prompt: 'Make my workout longer', category: 'secondary' },
  { id: 'new', icon: 'refresh', label: 'New Workout', prompt: 'Generate a new workout for a specific day', category: 'secondary' },
  { id: 'skip', icon: 'close-circle', label: 'Skip Day', prompt: 'I want to skip a workout day', category: 'secondary' },
  { id: 'rest', icon: 'bed', label: 'Rest Day', prompt: 'Make a day a rest day', category: 'secondary' },
  { id: 'stats', icon: 'stats-chart', label: 'My Stats', prompt: 'Show me my progress stats', category: 'secondary' },
  { id: 'tomorrow', icon: 'calendar', label: 'Tomorrow', prompt: 'What\'s my workout tomorrow?', category: 'secondary' },
  { id: 'log', icon: 'clipboard', label: 'Log Workout', prompt: 'I want to log an unexpected workout', category: 'secondary' },
];

interface Props {
  onSelectAction: (action: QuickActionItem) => void;
  visible?: boolean;
}

export function QuickActionsDrawer({ onSelectAction, visible = true }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const heightAnim = useRef(new Animated.Value(COLLAPSED_HEIGHT)).current;
  const arrowRotation = useRef(new Animated.Value(0)).current;
  
  const primaryActions = ALL_QUICK_ACTIONS.filter(a => a.category === 'primary');
  const secondaryActions = ALL_QUICK_ACTIONS.filter(a => a.category === 'secondary');
  
  // Pan responder for swipe detection
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to significant vertical swipes on the handle
        return Math.abs(gestureState.dy) > 10 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -30) {
          // Swipe up - expand
          expand();
        } else if (gestureState.dy > 30) {
          // Swipe down - collapse
          collapse();
        }
      },
    })
  ).current;
  
  const expand = () => {
    setIsExpanded(true);
    Animated.parallel([
      Animated.spring(heightAnim, {
        toValue: EXPANDED_HEIGHT,
        useNativeDriver: false,
        friction: 8,
        tension: 65,
      }),
      Animated.timing(arrowRotation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  const collapse = () => {
    setIsExpanded(false);
    Animated.parallel([
      Animated.spring(heightAnim, {
        toValue: COLLAPSED_HEIGHT,
        useNativeDriver: false,
        friction: 8,
        tension: 65,
      }),
      Animated.timing(arrowRotation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  const toggleExpand = () => {
    if (isExpanded) {
      collapse();
    } else {
      expand();
    }
  };
  
  const handleActionPress = (action: QuickActionItem) => {
    onSelectAction(action);
    collapse();
  };
  
  const arrowRotationInterpolate = arrowRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  
  if (!visible) return null;
  
  return (
    <Animated.View style={[styles.container, { height: heightAnim }]}>
      {/* Swipe Handle with Arrow */}
      <View {...panResponder.panHandlers}>
        <TouchableOpacity style={styles.handleContainer} onPress={toggleExpand} activeOpacity={0.7}>
          <View style={styles.handleBar} />
          <Animated.View style={{ transform: [{ rotate: arrowRotationInterpolate }] }}>
            <Ionicons name="chevron-up" size={20} color={COLORS.mediumGray} />
          </Animated.View>
          <Text style={styles.handleText}>{isExpanded ? 'Tap to close' : 'Swipe up for more'}</Text>
        </TouchableOpacity>
      </View>
      
      {/* Primary Actions (always visible) */}
      <View style={styles.primaryRow}>
        {primaryActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.primaryAction}
            onPress={() => handleActionPress(action)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[COLORS.accent + '15', COLORS.accentSecondary + '15']}
              style={styles.primaryIconContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name={action.icon as any} size={22} color={COLORS.accent} />
            </LinearGradient>
            <Text style={styles.primaryLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
        
        {/* More button (part of primary row) */}
        <TouchableOpacity
          style={styles.primaryAction}
          onPress={toggleExpand}
          activeOpacity={0.7}
        >
          <View style={[styles.primaryIconContainer, styles.moreButton]}>
            <Ionicons name={isExpanded ? 'close' : 'ellipsis-horizontal'} size={22} color={COLORS.mediumGray} />
          </View>
          <Text style={styles.primaryLabel}>{isExpanded ? 'Less' : 'More'}</Text>
        </TouchableOpacity>
      </View>
      
      {/* Expanded Secondary Actions */}
      {isExpanded && (
        <ScrollView 
          style={styles.expandedContainer}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.secondaryGrid}>
            {secondaryActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.secondaryAction}
                onPress={() => handleActionPress(action)}
                activeOpacity={0.7}
              >
                <View style={styles.secondaryIconContainer}>
                  <Ionicons name={action.icon as any} size={18} color={COLORS.text} />
                </View>
                <Text style={styles.secondaryLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    overflow: 'hidden',
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.lightGray,
    marginBottom: 4,
  },
  handleText: {
    fontSize: 11,
    color: COLORS.mediumGray,
    marginTop: 2,
  },
  primaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  primaryAction: {
    alignItems: 'center',
    gap: 4,
  },
  primaryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreButton: {
    backgroundColor: COLORS.lightGray,
  },
  primaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text,
  },
  expandedContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  secondaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 8,
    paddingBottom: 16,
  },
  secondaryAction: {
    width: '31%',
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 6,
  },
  secondaryIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.text,
    textAlign: 'center',
  },
});

export default QuickActionsDrawer;
