/**
 * Rolling Regeneration Modal
 * 
 * Shows just before a 3-week plan ends to gather feedback
 * and regenerate the next workout block.
 * 
 * Steps:
 * 1. Week 1 availability
 * 2. Week 2 & 3 availability (toggle: same as week 1)
 * 3. How the first 3 weeks felt + feedback
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  Switch,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const COLORS = {
  accent: '#A22BF6',
  accentSecondary: '#FF4EC7',
  background: '#FFFFFF',
  cardBg: '#F8F9FA',
  white: '#FFFFFF',
  text: '#222222',
  textSecondary: '#8E8E93',
  textMuted: '#C7C7CC',
  border: '#E5E5EA',
  success: '#34C759',
};

interface RollingRegenerationModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (feedback: RegenerationFeedback) => void;
  currentWeek: number;
}

interface RegenerationFeedback {
  availableDaysWeek1: string[];
  availableDaysWeek2: string[];
  availableDaysWeek3: string[];
  overallFeeling: string;
  favoriteThing: string;
  leastFavoriteThing: string;
  changeRequest: string;
  keepSame: string;
}

const DAYS = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
];

const FEELING_OPTIONS = [
  { label: 'Loving it', icon: 'heart' as const },
  { label: 'Good', icon: 'thumbs-up' as const },
  { label: 'Okay', icon: 'hand-right' as const },
  { label: 'Too hard', icon: 'barbell' as const },
  { label: 'Too easy', icon: 'happy' as const },
];

export const RollingRegenerationModal = ({ 
  visible, 
  onClose, 
  onSubmit,
  currentWeek 
}: RollingRegenerationModalProps) => {
  const [step, setStep] = useState(0);
  const [sameSchedule, setSameSchedule] = useState(true);
  const [feedback, setFeedback] = useState<RegenerationFeedback>({
    availableDaysWeek1: [],
    availableDaysWeek2: [],
    availableDaysWeek3: [],
    overallFeeling: '',
    favoriteThing: '',
    leastFavoriteThing: '',
    changeRequest: '',
    keepSame: '',
  });

  const handleDayToggle = (weekKey: 'week1' | 'week2' | 'week3', day: string) => {
    setFeedback(prev => {
      const keyMap = { week1: 'availableDaysWeek1', week2: 'availableDaysWeek2', week3: 'availableDaysWeek3' } as const;
      const key = keyMap[weekKey];
      const nextDays = prev[key].includes(day)
        ? prev[key].filter(d => d !== day)
        : [...prev[key], day];
      const updated = { ...prev, [key]: nextDays } as RegenerationFeedback;
      if (sameSchedule && weekKey === 'week1') {
        updated.availableDaysWeek2 = [...nextDays];
        updated.availableDaysWeek3 = [...nextDays];
      }
      return updated;
    });
  };

  const handleSubmit = () => {
    const submission: RegenerationFeedback = {
      ...feedback,
      availableDaysWeek2: sameSchedule ? feedback.availableDaysWeek1 : feedback.availableDaysWeek2,
      availableDaysWeek3: sameSchedule ? feedback.availableDaysWeek1 : feedback.availableDaysWeek3,
    };
    onSubmit(submission);
    onClose();
    setStep(0);
    setSameSchedule(true);
    setFeedback({
      availableDaysWeek1: [],
      availableDaysWeek2: [],
      availableDaysWeek3: [],
      overallFeeling: '',
      favoriteThing: '',
      leastFavoriteThing: '',
      changeRequest: '',
      keepSame: '',
    });
  };

  const canProceed = () => {
    switch (step) {
      case 0: return feedback.availableDaysWeek1.length > 0;
      case 1: return sameSchedule ? true : (feedback.availableDaysWeek2.length > 0 && feedback.availableDaysWeek3.length > 0);
      case 2: return feedback.overallFeeling.length > 0;
      default: return true;
    }
  };

  const renderDayGrid = (weekKey: 'week1' | 'week2' | 'week3', days: string[]) => (
    <View style={styles.daysGrid}>
      {DAYS.map(day => {
        const selected = days.includes(day.key);
        return (
          <TouchableOpacity
            key={day.key}
            style={[styles.dayButton, selected && styles.dayButtonSelected]}
            onPress={() => handleDayToggle(weekKey, day.key)}
            data-testid={`rolling-regen-${weekKey}-${day.key}`}
          >
            {selected ? (
              <LinearGradient
                colors={[COLORS.accent, COLORS.accentSecondary]}
                style={styles.dayGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.dayButtonTextSelected}>{day.label}</Text>
              </LinearGradient>
            ) : (
              <Text style={styles.dayButtonText}>{day.label}</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Week 1 availability</Text>
            <Text style={styles.stepSubtitle}>Pick the days you can train in your first week</Text>
            {renderDayGrid('week1', feedback.availableDaysWeek1)}
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Weeks 2 & 3 availability</Text>
            <Text style={styles.stepSubtitle}>Set your training days for the following weeks</Text>

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Same as week 1</Text>
              <Switch
                value={sameSchedule}
                onValueChange={(val) => {
                  setSameSchedule(val);
                  if (val) {
                    setFeedback(prev => ({
                      ...prev,
                      availableDaysWeek2: [...prev.availableDaysWeek1],
                      availableDaysWeek3: [...prev.availableDaysWeek1],
                    }));
                  }
                }}
                trackColor={{ false: COLORS.border, true: COLORS.accent }}
                thumbColor={COLORS.white}
                ios_backgroundColor={COLORS.border}
                data-testid="rolling-regen-same-schedule-toggle"
              />
            </View>

            {sameSchedule ? (
              <View style={styles.sameScheduleCard}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                <Text style={styles.sameScheduleText}>
                  Using your Week 1 schedule for all 3 weeks
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.weekLabel}>Week 2</Text>
                {renderDayGrid('week2', feedback.availableDaysWeek2)}
                <Text style={[styles.weekLabel, { marginTop: 20 }]}>Week 3</Text>
                {renderDayGrid('week3', feedback.availableDaysWeek3)}
              </>
            )}
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>How were the last 3 weeks?</Text>
            <Text style={styles.stepSubtitle}>Quick check-in so we can perfect your next plan</Text>

            <Text style={styles.fieldLabel}>How are you finding your program?</Text>
            <View style={styles.feelingRow}>
              {FEELING_OPTIONS.map(option => {
                const selected = feedback.overallFeeling === option.label;
                return (
                  <TouchableOpacity
                    key={option.label}
                    style={[styles.feelingChip, selected && styles.feelingChipSelected]}
                    onPress={() => setFeedback(prev => ({ ...prev, overallFeeling: option.label }))}
                    data-testid={`rolling-regen-feeling-${option.label.replace(/\s+/g, '-').toLowerCase()}`}
                  >
                    <Ionicons 
                      name={option.icon} 
                      size={16} 
                      color={selected ? COLORS.white : COLORS.textSecondary} 
                    />
                    <Text style={[styles.feelingChipText, selected && styles.feelingChipTextSelected]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>Favourite thing so far?</Text>
            <TextInput
              style={styles.textarea}
              placeholder="e.g., The split, exercise variety, strength progress"
              placeholderTextColor={COLORS.textMuted}
              multiline
              value={feedback.favoriteThing}
              onChangeText={(text) => setFeedback(prev => ({ ...prev, favoriteThing: text }))}
              returnKeyType="done"
              data-testid="rolling-regen-favorite-input"
            />

            <Text style={styles.fieldLabel}>Least favourite thing?</Text>
            <TextInput
              style={styles.textarea}
              placeholder="e.g., Too many leg days, not enough cardio"
              placeholderTextColor={COLORS.textMuted}
              multiline
              value={feedback.leastFavoriteThing}
              onChangeText={(text) => setFeedback(prev => ({ ...prev, leastFavoriteThing: text }))}
              returnKeyType="done"
              data-testid="rolling-regen-least-favorite-input"
            />

            <Text style={styles.fieldLabel}>What would you change?</Text>
            <View style={styles.quickRow}>
              {['More cardio', 'More strength', 'More variety', 'Shorter sessions', 'More recovery'].map(option => {
                const selected = feedback.changeRequest.includes(option);
                return (
                  <TouchableOpacity
                    key={option}
                    style={[styles.quickChip, selected && styles.quickChipSelected]}
                    onPress={() => setFeedback(prev => ({
                      ...prev,
                      changeRequest: prev.changeRequest.includes(option)
                        ? prev.changeRequest.replace(option, '').replace(/, ,/g, ',').replace(/^,\s*|,\s*$/g, '')
                        : prev.changeRequest ? `${prev.changeRequest}, ${option}` : option,
                    }))}
                    data-testid={`rolling-regen-change-${option.replace(/\s+/g, '-').toLowerCase()}`}
                  >
                    <Text style={[styles.quickChipText, selected && styles.quickChipTextSelected]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>What should stay the same?</Text>
            <TextInput
              style={styles.textarea}
              placeholder="What's working well that you want to keep"
              placeholderTextColor={COLORS.textMuted}
              multiline
              value={feedback.keepSame}
              onChangeText={(text) => setFeedback(prev => ({ ...prev, keepSame: text }))}
              returnKeyType="done"
              data-testid="rolling-regen-keep-same-input"
            />
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} data-testid="rolling-regen-close">
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.headerContent}>
            <LinearGradient
              colors={[COLORS.accent, COLORS.accentSecondary]}
              style={styles.headerBadge}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="sparkles" size={12} color={COLORS.white} />
              <Text style={styles.headerBadgeText}>3-Week Check-in</Text>
            </LinearGradient>
            <Text style={styles.headerTitle}>Time for a Refresh</Text>
            <Text style={styles.headerSubtitle}>
              Let's optimise your next 3 weeks based on your progress
            </Text>
          </View>
        </View>

        {/* Progress dots */}
        <View style={styles.progressDots}>
          {[0, 1, 2].map(i => (
            <View
              key={i}
              style={[
                styles.dot,
                step >= i && styles.dotActive,
                step === i && styles.dotCurrent,
              ]}
            />
          ))}
        </View>

        {/* Content */}
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderStep()}
        </ScrollView>

        {/* Navigation */}
        <View style={styles.navigation}>
          {step > 0 && (
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setStep(step - 1)}
              data-testid="rolling-regen-back"
            >
              <Ionicons name="arrow-back" size={18} color={COLORS.textSecondary} />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.nextButton, !canProceed() && styles.nextButtonDisabled]}
            onPress={() => {
              if (step < 2) {
                setStep(step + 1);
              } else {
                handleSubmit();
              }
            }}
            disabled={!canProceed()}
            data-testid="rolling-regen-continue"
          >
            <LinearGradient
              colors={canProceed() 
                ? [COLORS.accent, COLORS.accentSecondary]
                : [COLORS.textMuted, COLORS.textMuted]
              }
              style={styles.nextGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.nextButtonText}>
                {step < 2 ? 'Continue' : 'Generate New Plan'}
              </Text>
              <Ionicons 
                name={step < 2 ? 'arrow-forward' : 'sparkles'} 
                size={18} 
                color={COLORS.white} 
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 16 : 24,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTop: {
    alignItems: 'flex-end',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    marginTop: 12,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 21,
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  dotActive: {
    backgroundColor: COLORS.accent,
  },
  dotCurrent: {
    width: 24,
    backgroundColor: COLORS.accentSecondary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 20,
  },
  stepContent: {},
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  stepSubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  weekLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  dayButton: {
    width: (width - 100) / 4,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dayButtonSelected: {
    borderColor: 'transparent',
  },
  dayGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  dayButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingVertical: 14,
  },
  dayButtonTextSelected: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: COLORS.cardBg,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  toggleLabel: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
  },
  sameScheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F0FFF4',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C6F6D5',
  },
  sameScheduleText: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  fieldLabel: {
    marginTop: 16,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  feelingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  feelingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  feelingChipSelected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  feelingChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  feelingChipTextSelected: {
    color: COLORS.white,
  },
  textarea: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: COLORS.text,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  quickChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickChipSelected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  quickChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  quickChipTextSelected: {
    color: COLORS.white,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backButtonText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  nextButton: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
});

export default RollingRegenerationModal;
