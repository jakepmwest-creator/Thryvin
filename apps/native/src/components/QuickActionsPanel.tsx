/**
 * QuickActionsPanel - Two-tier quick actions UI
 * 
 * Phase 8.5: Quick Actions with expand/collapse
 * 
 * Tier 1 (always visible): Swap Day, Edit Workout, Add Workout
 * Tier 2 (expanded): More actions for coaching/modification
 */

import React, { useState, useRef } from 'react';
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

const COLORS = {
  primary: '#A22BF6',
  secondary: '#FF4EC7',
  gradientStart: '#A22BF6',
  gradientEnd: '#FF4EC7',
  background: '#FFFFFF',
  cardBg: '#F5F5F7',
  text: '#1C1C1E',
  lightGray: '#E5E5EA',
  mediumGray: '#8E8E93',
  white: '#FFFFFF',
};

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  onPress: () => void;
}

interface Props {
  onSwapDay: () => void;
  onEditWorkout: () => void;
  onAddWorkout: () => void;
  onShorter?: () => void;
  onHarder?: () => void;
  onEasier?: () => void;
  onOpenCoach: () => void;
  onRecoveryDay?: () => void;
}

export function QuickActionsPanel({
  onSwapDay,
  onEditWorkout,
  onAddWorkout,
  onShorter,
  onHarder,
  onEasier,
  onOpenCoach,
  onRecoveryDay,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const expandAnim = useRef(new Animated.Value(0)).current;

  const toggleExpand = () => {
    Animated.timing(expandAnim, {
      toValue: isExpanded ? 0 : 1,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    setIsExpanded(!isExpanded);
  };

  const expandedHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 110],
  });

  const chevronRotation = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={styles.container}>
      {/* Tier 1: Primary Actions (always visible) */}
      <View style={styles.primaryRow}>
        <TouchableOpacity style={styles.primaryAction} onPress={onSwapDay}>
          <View style={styles.actionIconContainer}>
            <Ionicons name="swap-horizontal" size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.primaryActionText}>Swap Day</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.primaryAction} onPress={onEditWorkout}>
          <View style={styles.actionIconContainer}>
            <Ionicons name="create-outline" size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.primaryActionText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.primaryAction} onPress={onAddWorkout}>
          <View style={styles.actionIconContainer}>
            <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.primaryActionText}>Add</Text>
        </TouchableOpacity>

        {/* Expand chevron */}
        <TouchableOpacity style={styles.expandButton} onPress={toggleExpand}>
          <Animated.View style={{ transform: [{ rotate: chevronRotation }] }}>
            <Ionicons name="chevron-down" size={20} color={COLORS.mediumGray} />
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Tier 2: Expanded Actions */}
      <Animated.View style={[styles.expandedContainer, { height: expandedHeight, opacity: expandAnim }]}>
        <View style={styles.expandedRow}>
          <TouchableOpacity style={styles.expandedAction} onPress={onShorter}>
            <Ionicons name="time-outline" size={18} color={COLORS.text} />
            <Text style={styles.expandedActionText}>Shorter</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.expandedAction} onPress={onHarder}>
            <Ionicons name="flame-outline" size={18} color={COLORS.text} />
            <Text style={styles.expandedActionText}>Harder</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.expandedAction} onPress={onEasier}>
            <Ionicons name="leaf-outline" size={18} color={COLORS.text} />
            <Text style={styles.expandedActionText}>Easier</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.expandedAction} onPress={onRecoveryDay}>
            <Ionicons name="heart-outline" size={18} color={COLORS.text} />
            <Text style={styles.expandedActionText}>Recovery</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.expandedRow}>
          <TouchableOpacity 
            style={[styles.expandedAction, styles.coachAction]} 
            onPress={() => { onOpenCoach(); toggleExpand(); }}
          >
            <LinearGradient
              colors={[COLORS.gradientStart, COLORS.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.coachGradient}
            >
              <Ionicons name="chatbubble-ellipses" size={16} color={COLORS.white} />
              <Text style={styles.coachActionText}>Ask Coach</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  primaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  primaryAction: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text,
  },
  expandButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedContainer: {
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  expandedRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  expandedAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: COLORS.cardBg,
    borderRadius: 10,
    gap: 6,
  },
  expandedActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  coachAction: {
    backgroundColor: 'transparent',
    padding: 0,
    overflow: 'hidden',
  },
  coachGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  coachActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.white,
  },
});

export default QuickActionsPanel;
