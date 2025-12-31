/**
 * InlineSuggestedActions - Quick action buttons shown inline in chat
 * 
 * When AI confidence is low, show relevant quick action buttons directly in the chat
 * so users can easily select what they want instead of typing
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
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
};

export interface SuggestedAction {
  id: string;
  icon: string;
  label: string;
  prompt: string;
}

// Suggested actions based on common intents
export const WORKOUT_TYPE_SUGGESTIONS: SuggestedAction[] = [
  { id: 'arms', icon: 'fitness', label: 'Arms', prompt: 'Add an arms workout today' },
  { id: 'chest', icon: 'fitness', label: 'Chest', prompt: 'Add a chest workout today' },
  { id: 'back', icon: 'fitness', label: 'Back', prompt: 'Add a back workout today' },
  { id: 'legs', icon: 'fitness', label: 'Legs', prompt: 'Add a legs workout today' },
  { id: 'shoulders', icon: 'fitness', label: 'Shoulders', prompt: 'Add a shoulders workout today' },
  { id: 'cardio', icon: 'walk', label: 'Cardio', prompt: 'Add a cardio session today' },
];

export const GENERAL_SUGGESTIONS: SuggestedAction[] = [
  { id: 'swap', icon: 'swap-horizontal', label: 'Swap Days', prompt: 'I need to swap my workout days' },
  { id: 'add', icon: 'add-circle', label: 'Add Workout', prompt: 'Add a workout' },
  { id: 'edit', icon: 'create', label: 'Edit Workout', prompt: 'I want to edit my workout' },
  { id: 'skip', icon: 'close-circle', label: 'Skip Today', prompt: 'I want to skip today\'s workout' },
];

interface Props {
  suggestions: SuggestedAction[];
  onSelect: (action: SuggestedAction) => void;
  title?: string;
}

export function InlineSuggestedActions({ suggestions, onSelect, title }: Props) {
  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      
      <View style={styles.buttonsContainer}>
        {suggestions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.actionButton}
            onPress={() => onSelect(action)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[COLORS.accent + '15', COLORS.accentSecondary + '15']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name={action.icon as any} size={16} color={COLORS.accent} />
              <Text style={styles.buttonText}>{action.label}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    maxWidth: '90%',
    marginTop: 8,
  },
  title: {
    fontSize: 12,
    color: COLORS.mediumGray,
    marginBottom: 8,
    fontWeight: '500',
  },
  buttonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.accent + '30',
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.accent,
  },
});

export default InlineSuggestedActions;
