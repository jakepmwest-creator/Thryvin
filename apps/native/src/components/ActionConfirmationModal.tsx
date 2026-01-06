/**
 * ActionConfirmationModal - Detailed confirmation for coach actions
 * 
 * Shows exact action details (e.g., "Add ARMS workout on Thursday")
 * Ensures user sees exactly what will happen before confirming
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS as THEME_COLORS } from '../constants/colors';

const COLORS = {
  accent: THEME_COLORS.gradientStart,
  accentSecondary: THEME_COLORS.gradientEnd,
  white: THEME_COLORS.white,
  text: THEME_COLORS.text,
  lightGray: THEME_COLORS.lightGray,
  mediumGray: THEME_COLORS.mediumGray,
  danger: '#FF3B30',
  success: '#34C759',
};

export interface PendingActionDetails {
  type: string;
  params?: {
    workoutType?: string;
    type?: string; // For log_workout action
    date?: Date | string;
    duration?: number;
    dayIndex?: number;
    from?: number;
    to?: number;
    description?: string;
    modification?: 'harder' | 'easier' | 'shorter' | 'longer';
    reason?: string;
    targetDay?: string;
  };
}

interface Props {
  visible: boolean;
  action: PendingActionDetails | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function getActionDetails(action: PendingActionDetails): {
  icon: string;
  title: string;
  description: string;
  color: string;
} {
  const { type, params } = action;
  
  // Format date to day name
  const getDayName = (date: Date | string | undefined): string => {
    if (!date) return 'today';
    const d = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return d.toLocaleDateString('en-US', { weekday: 'long' });
  };
  
  switch (type) {
    case 'add_workout':
      return {
        icon: 'add-circle',
        title: 'Add Workout Session',
        description: `Add a ${params?.duration || 30}-minute ${(params?.workoutType || 'workout').toUpperCase()} workout to ${getDayName(params?.date)}`,
        color: COLORS.success,
      };
    
    case 'log_workout':
      return {
        icon: 'clipboard',
        title: 'Log Completed Workout',
        description: `Log ${params?.duration || 0} minutes of ${(params?.workoutType || params?.type || 'workout').toUpperCase()}${params?.description ? `: ${params.description}` : ''}`,
        color: COLORS.success,
      };
    
    case 'update_workout':
      const modMap: Record<string, { icon: string; title: string; desc: string }> = {
        harder: { icon: 'flame', title: 'Make Workout Harder', desc: 'Increase intensity with more sets, shorter rest, and heavier weights' },
        easier: { icon: 'leaf', title: 'Make Workout Easier', desc: 'Reduce intensity with fewer sets, longer rest periods' },
        shorter: { icon: 'time-outline', title: 'Make Workout Shorter', desc: 'Reduce duration by removing exercises while keeping it effective' },
        longer: { icon: 'timer-outline', title: 'Make Workout Longer', desc: 'Add more exercises and sets for a longer session' },
      };
      const mod = modMap[params?.modification || 'harder'];
      return {
        icon: mod.icon,
        title: mod.title,
        description: `${mod.desc} for ${getDayName(params?.date)}${params?.description ? `\n\nYour notes: "${params.description}"` : ''}`,
        color: COLORS.accent,
      };
    
    case 'regenerate_day':
      return {
        icon: 'refresh',
        title: 'Regenerate Day\'s Workout',
        description: `Generate a fresh workout for ${params?.targetDay || getDayName(params?.date)}${params?.reason ? `\n\nReason: "${params.reason}"` : ''}`,
        color: COLORS.accent,
      };
    
    case 'skip_day':
      return {
        icon: 'close-circle',
        title: 'Skip Workout Day',
        description: `Skip the workout scheduled for ${params?.targetDay || getDayName(params?.date)}${params?.reason ? `\n\nReason: "${params.reason}"` : ''}`,
        color: COLORS.warning,
      };
    
    case 'rest_day':
      return {
        icon: 'bed',
        title: 'Convert to Rest Day',
        description: `Make ${params?.targetDay || getDayName(params?.date)} a rest day for recovery`,
        color: COLORS.mediumGray,
      };
    
    case 'remove_workout':
      const dayName = params?.dayIndex !== undefined ? DAYS_OF_WEEK[params.dayIndex] : 'this day';
      return {
        icon: 'trash',
        title: 'Remove Workout',
        description: `Remove the workout scheduled for ${dayName}`,
        color: COLORS.danger,
      };
    
    case 'swap':
      const fromDay = params?.from !== undefined ? DAYS_OF_WEEK[params.from] : '';
      const toDay = params?.to !== undefined ? DAYS_OF_WEEK[params.to] : '';
      return {
        icon: 'swap-horizontal',
        title: 'Swap Workout Days',
        description: `Swap ${fromDay}'s workout with ${toDay}'s workout`,
        color: COLORS.accent,
      };
    
    case 'regenerate':
      return {
        icon: 'refresh',
        title: 'Regenerate Workout',
        description: 'Generate a fresh workout with new exercises while keeping your preferences',
        color: COLORS.accent,
      };
    
    case 'reset':
      return {
        icon: 'warning',
        title: 'Reset Program',
        description: 'This will clear all current workouts and generate a fresh 3-week plan. This cannot be undone.',
        color: COLORS.danger,
      };
    
    case 'unlock_workout':
      return {
        icon: 'lock-open',
        title: 'Unlock Workout',
        description: `Reopen your completed workout for ${getDayName(params?.date)} to add more exercises`,
        color: COLORS.accent,
      };
    
    default:
      return {
        icon: 'checkmark-circle',
        title: 'Confirm Action',
        description: 'Are you sure you want to proceed with this action?',
        color: COLORS.accent,
      };
  }
}

export function ActionConfirmationModal({ visible, action, onConfirm, onCancel }: Props) {
  if (!action) return null;
  
  const details = getActionDetails(action);
  
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Icon Header */}
          <View style={[styles.iconContainer, { backgroundColor: details.color + '20' }]}>
            <Ionicons name={details.icon as any} size={32} color={details.color} />
          </View>
          
          {/* Title */}
          <Text style={styles.title}>{details.title}</Text>
          
          {/* Description - The exact action details */}
          <View style={styles.detailsBox}>
            <Text style={styles.description}>{details.description}</Text>
          </View>
          
          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
              <LinearGradient
                colors={[COLORS.accent, COLORS.accentSecondary]}
                style={styles.confirmGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="checkmark" size={20} color={COLORS.white} />
                <Text style={styles.confirmText}>Confirm</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  detailsBox: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 24,
  },
  description: {
    fontSize: 15,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.mediumGray,
  },
  confirmButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  confirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default ActionConfirmationModal;
