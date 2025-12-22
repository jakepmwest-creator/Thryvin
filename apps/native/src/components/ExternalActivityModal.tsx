// Phase 9: External Activity Logging Modal
// For logging activities like Boxing, Classes, Sports, etc.

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useCoachStore } from '../stores/coach-store';

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
  success: '#34C759',
};

interface ExternalActivityModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (data: ExternalActivityLog) => void;
  activityName: string;
  activityIntensity?: 'low' | 'moderate' | 'hard';
}

export interface ExternalActivityLog {
  activityName: string;
  duration: number;
  intensity: 'low' | 'moderate' | 'hard';
  enjoyment: number; // 1-5
  overview?: string;
  hardestPart?: string;
  easiestPart?: string;
  completedAt: string;
}

const INTENSITY_OPTIONS = [
  { value: 'low', label: 'Light', icon: 'leaf', color: '#34C759' },
  { value: 'moderate', label: 'Moderate', icon: 'fitness', color: '#FF9500' },
  { value: 'hard', label: 'Hard', icon: 'flame', color: '#FF3B30' },
];

const ENJOYMENT_OPTIONS = [
  { value: 1, emoji: '😫', label: 'Tough' },
  { value: 2, emoji: '😐', label: 'Okay' },
  { value: 3, emoji: '🙂', label: 'Good' },
  { value: 4, emoji: '😊', label: 'Great' },
  { value: 5, emoji: '🔥', label: 'Loved it!' },
];

const DURATION_PRESETS = [15, 30, 45, 60, 90];

export const ExternalActivityModal: React.FC<ExternalActivityModalProps> = ({
  visible,
  onClose,
  onComplete,
  activityName,
  activityIntensity = 'moderate',
}) => {
  const { coachName, openChat } = useCoachStore();
  
  const [duration, setDuration] = useState(60);
  const [intensity, setIntensity] = useState<'low' | 'moderate' | 'hard'>(activityIntensity);
  const [enjoyment, setEnjoyment] = useState(3);
  const [overview, setOverview] = useState('');
  const [hardestPart, setHardestPart] = useState('');
  const [easiestPart, setEasiestPart] = useState('');
  const [showOptional, setShowOptional] = useState(false);
  
  const handleComplete = useCallback(() => {
    const log: ExternalActivityLog = {
      activityName,
      duration,
      intensity,
      enjoyment,
      overview: overview.trim() || undefined,
      hardestPart: hardestPart.trim() || undefined,
      easiestPart: easiestPart.trim() || undefined,
      completedAt: new Date().toISOString(),
    };
    
    onComplete(log);
  }, [activityName, duration, intensity, enjoyment, overview, hardestPart, easiestPart, onComplete]);
  
  const handleAskCoach = useCallback(() => {
    onClose();
    openChat(`I just finished ${activityName}. It was ${intensity} intensity and lasted about ${duration} minutes. ${overview ? `Overview: ${overview}` : ''}`);
  }, [activityName, intensity, duration, overview, onClose, openChat]);
  
  if (!visible) return null;
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        {/* Header */}
        <LinearGradient
          colors={[COLORS.gradientStart, COLORS.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Log Activity</Text>
            <View style={{ width: 40 }} />
          </View>
          
          <View style={styles.activityInfo}>
            <Ionicons name="fitness-outline" size={32} color="#FFFFFF" />
            <Text style={styles.activityName}>{activityName}</Text>
            <Text style={styles.activitySubtitle}>How did it go?</Text>
          </View>
        </LinearGradient>
        
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Duration */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How long was it?</Text>
            <View style={styles.durationRow}>
              {DURATION_PRESETS.map((mins) => (
                <TouchableOpacity
                  key={mins}
                  style={[
                    styles.durationChip,
                    duration === mins && styles.durationChipActive,
                  ]}
                  onPress={() => setDuration(mins)}
                >
                  <Text style={[
                    styles.durationChipText,
                    duration === mins && styles.durationChipTextActive,
                  ]}>
                    {mins}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.customDurationRow}>
              <Text style={styles.customDurationLabel}>Or enter minutes:</Text>
              <TextInput
                style={styles.customDurationInput}
                value={String(duration)}
                onChangeText={(text) => setDuration(parseInt(text) || 0)}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>
          </View>
          
          {/* Intensity */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How hard did you train?</Text>
            <View style={styles.intensityRow}>
              {INTENSITY_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.intensityOption,
                    intensity === opt.value && { 
                      backgroundColor: `${opt.color}15`,
                      borderColor: opt.color,
                    },
                  ]}
                  onPress={() => setIntensity(opt.value as typeof intensity)}
                >
                  <Ionicons 
                    name={opt.icon as any} 
                    size={24} 
                    color={intensity === opt.value ? opt.color : COLORS.mediumGray} 
                  />
                  <Text style={[
                    styles.intensityText,
                    intensity === opt.value && { color: opt.color },
                  ]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* Enjoyment */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Did you enjoy it?</Text>
            <View style={styles.enjoymentRow}>
              {ENJOYMENT_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.enjoymentOption,
                    enjoyment === opt.value && styles.enjoymentOptionActive,
                  ]}
                  onPress={() => setEnjoyment(opt.value)}
                >
                  <Text style={styles.enjoymentEmoji}>{opt.emoji}</Text>
                  <Text style={[
                    styles.enjoymentLabel,
                    enjoyment === opt.value && styles.enjoymentLabelActive,
                  ]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* Optional fields toggle */}
          <TouchableOpacity 
            style={styles.optionalToggle}
            onPress={() => setShowOptional(!showOptional)}
          >
            <Text style={styles.optionalToggleText}>
              {showOptional ? 'Hide optional details' : 'Add more details (optional)'}
            </Text>
            <Ionicons 
              name={showOptional ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color={COLORS.primary} 
            />
          </TouchableOpacity>
          
          {showOptional && (
            <View style={styles.optionalSection}>
              {/* Overview */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Quick overview (optional)</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="What did you work on? Any highlights?"
                  placeholderTextColor={COLORS.mediumGray}
                  value={overview}
                  onChangeText={setOverview}
                  multiline
                  numberOfLines={3}
                />
              </View>
              
              {/* Hardest part */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>What was hardest? (optional)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., Sparring rounds, cardio drills..."
                  placeholderTextColor={COLORS.mediumGray}
                  value={hardestPart}
                  onChangeText={setHardestPart}
                />
              </View>
              
              {/* Easiest part */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>What felt easy? (optional)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., Technique work, stretching..."
                  placeholderTextColor={COLORS.mediumGray}
                  value={easiestPart}
                  onChangeText={setEasiestPart}
                />
              </View>
            </View>
          )}
          
          {/* Talk to coach option */}
          <TouchableOpacity style={styles.coachButton} onPress={handleAskCoach}>
            <Ionicons name="chatbubble-ellipses" size={20} color={COLORS.primary} />
            <Text style={styles.coachButtonText}>Tell {coachName} about it</Text>
          </TouchableOpacity>
          
          <View style={{ height: 100 }} />
        </ScrollView>
        
        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.skipButton} onPress={onClose}>
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
            <LinearGradient
              colors={[COLORS.gradientStart, COLORS.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.completeButtonGradient}
            >
              <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
              <Text style={styles.completeButtonText}>Mark Complete</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  activityInfo: {
    alignItems: 'center',
  },
  activityName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
  },
  activitySubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 10,
  },
  durationChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.cardBg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  durationChipActive: {
    backgroundColor: `${COLORS.primary}15`,
    borderColor: COLORS.primary,
  },
  durationChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.mediumGray,
  },
  durationChipTextActive: {
    color: COLORS.primary,
  },
  customDurationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 10,
  },
  customDurationLabel: {
    fontSize: 14,
    color: COLORS.mediumGray,
  },
  customDurationInput: {
    width: 60,
    height: 40,
    backgroundColor: COLORS.cardBg,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  intensityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  intensityOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: COLORS.cardBg,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 6,
  },
  intensityText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.mediumGray,
  },
  enjoymentRow: {
    flexDirection: 'row',
    gap: 8,
  },
  enjoymentOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.cardBg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  enjoymentOptionActive: {
    backgroundColor: `${COLORS.primary}15`,
    borderColor: COLORS.primary,
  },
  enjoymentEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  enjoymentLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.mediumGray,
  },
  enjoymentLabelActive: {
    color: COLORS.primary,
  },
  optionalToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  optionalToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  optionalSection: {
    marginTop: 8,
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  textInput: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.text,
  },
  textArea: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  coachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 16,
    gap: 8,
  },
  coachButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    flexDirection: 'row',
    gap: 12,
  },
  skipButton: {
    flex: 0.4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: COLORS.cardBg,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.mediumGray,
  },
  completeButton: {
    flex: 0.6,
    borderRadius: 16,
    overflow: 'hidden',
  },
  completeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default ExternalActivityModal;
