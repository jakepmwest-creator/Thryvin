/**
 * Rolling Regeneration Modal
 * 
 * Shows at 2 weeks into a 3-week plan to gather feedback
 * and regenerate the next workout block.
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const COLORS = {
  gradientStart: '#8B5CF6',
  gradientMid: '#A855F7',
  gradientEnd: '#EC4899',
  background: '#0F0F1A',
  cardBg: '#1A1A2E',
  white: '#FFFFFF',
  text: '#FFFFFF',
  textSecondary: '#A0A0B0',
  textMuted: '#6B6B80',
  success: '#10B981',
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
    overallFeeling: '',
    favoriteThing: '',
    leastFavoriteThing: '',
    changeRequest: '',
    keepSame: '',
  });

  const handleDayToggle = (weekKey: 'week1' | 'week2', day: string) => {
    setFeedback(prev => {
      const key = weekKey === 'week1' ? 'availableDaysWeek1' : 'availableDaysWeek2';
      const nextDays = prev[key].includes(day)
        ? prev[key].filter(d => d !== day)
        : [...prev[key], day];
      const updated = {
        ...prev,
        [key]: nextDays,
      } as RegenerationFeedback;
      if (sameSchedule && weekKey === 'week1') {
        updated.availableDaysWeek2 = [...nextDays];
      }
      return updated;
    });
  };

  const handleSubmit = () => {
    const submission: RegenerationFeedback = {
      ...feedback,
      availableDaysWeek2: sameSchedule ? feedback.availableDaysWeek1 : feedback.availableDaysWeek2,
    };
    onSubmit(submission);
    onClose();
    // Reset state
    setStep(0);
    setSameSchedule(true);
    setFeedback({
      availableDaysWeek1: [],
      availableDaysWeek2: [],
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
      case 1: return sameSchedule ? true : feedback.availableDaysWeek2.length > 0;
      case 2: return feedback.overallFeeling.length > 0;
      default: return true;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Week 1 availability</Text>
            <Text style={styles.stepSubtitle}>Pick the days you can train next week</Text>
            
            <View style={styles.daysGrid}>
              {DAYS.map(day => (
                <TouchableOpacity
                  key={day.key}
                  style={[
                    styles.dayButton,
                    feedback.availableDaysWeek1.includes(day.key) && styles.dayButtonSelected,
                  ]}
                  onPress={() => handleDayToggle('week1', day.key)}
                  data-testid={`rolling-regeneration-day-${day.key}`}
                >
                  <Text style={[
                    styles.dayButtonText,
                    feedback.availableDaysWeek1.includes(day.key) && styles.dayButtonTextSelected,
                  ]}>
                    {day.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Week 2 availability</Text>
            <Text style={styles.stepSubtitle}>Set your days for the following week</Text>

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Same as week 1</Text>
              <TouchableOpacity
                style={[styles.toggleButton, sameSchedule && styles.toggleButtonActive]}
                onPress={() => {
                  const nextSame = !sameSchedule;
                  setSameSchedule(nextSame);
                  if (nextSame) {
                    setFeedback(prev => ({
                      ...prev,
                      availableDaysWeek2: [...prev.availableDaysWeek1],
                    }));
                  }
                }}
                data-testid="rolling-regeneration-same-schedule-toggle"
              >
                <Text style={[styles.toggleText, sameSchedule && styles.toggleTextActive]}>
                  {sameSchedule ? 'Yes' : 'No'}
                </Text>
              </TouchableOpacity>
            </View>

            {!sameSchedule && (
              <View style={styles.daysGrid}>
                {DAYS.map(day => (
                  <TouchableOpacity
                    key={day.key}
                    style={[
                      styles.dayButton,
                      feedback.availableDaysWeek2.includes(day.key) && styles.dayButtonSelected,
                    ]}
                    onPress={() => handleDayToggle('week2', day.key)}
                    data-testid={`rolling-regeneration-week2-day-${day.key}`}
                  >
                    <Text style={[
                      styles.dayButtonText,
                      feedback.availableDaysWeek2.includes(day.key) && styles.dayButtonTextSelected,
                    ]}>
                      {day.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Program check‑in</Text>
            <Text style={styles.stepSubtitle}>Short feedback so we can perfect your plan</Text>

            <Text style={styles.fieldLabel}>How are you finding your program so far?</Text>
            <View style={styles.quickRow}>
              {['Loving it', 'Good', 'Okay', 'Too hard', 'Too easy'].map(option => (
                <TouchableOpacity
                  key={option}
                  style={styles.quickChip}
                  onPress={() => setFeedback(prev => ({ ...prev, overallFeeling: option }))}
                  data-testid={`rolling-regeneration-feeling-${option.replace(/\s+/g, '-').toLowerCase()}`}
                >
                  <Text style={styles.quickChipText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.textarea}
              placeholder="Add any extra detail (optional)"
              placeholderTextColor={COLORS.textMuted}
              multiline
              value={feedback.overallFeeling}
              onChangeText={(text) => setFeedback(prev => ({ ...prev, overallFeeling: text }))}
              data-testid="rolling-regeneration-overall-feeling-input"
            />

            <Text style={styles.fieldLabel}>Favorite thing so far?</Text>
            <TextInput
              style={styles.textarea}
              placeholder="e.g., The split, exercise variety, strength progress"
              placeholderTextColor={COLORS.textMuted}
              multiline
              value={feedback.favoriteThing}
              onChangeText={(text) => setFeedback(prev => ({ ...prev, favoriteThing: text }))}
              data-testid="rolling-regeneration-favorite-input"
            />

            <Text style={styles.fieldLabel}>Least favorite thing?</Text>
            <TextInput
              style={styles.textarea}
              placeholder="e.g., Too many leg days, not enough cardio"
              placeholderTextColor={COLORS.textMuted}
              multiline
              value={feedback.leastFavoriteThing}
              onChangeText={(text) => setFeedback(prev => ({ ...prev, leastFavoriteThing: text }))}
              data-testid="rolling-regeneration-least-favorite-input"
            />

            <Text style={styles.fieldLabel}>What would you like to change?</Text>
            <View style={styles.quickRow}>
              {['More cardio', 'More strength', 'More variety', 'Shorter sessions', 'More recovery'].map(option => (
                <TouchableOpacity
                  key={option}
                  style={styles.quickChip}
                  onPress={() => setFeedback(prev => ({
                    ...prev,
                    changeRequest: prev.changeRequest ? `${prev.changeRequest}, ${option}` : option,
                  }))}
                  data-testid={`rolling-regeneration-change-${option.replace(/\s+/g, '-').toLowerCase()}`}
                >
                  <Text style={styles.quickChipText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.textarea}
              placeholder="Tell us what to adjust"
              placeholderTextColor={COLORS.textMuted}
              multiline
              value={feedback.changeRequest}
              onChangeText={(text) => setFeedback(prev => ({ ...prev, changeRequest: text }))}
              data-testid="rolling-regeneration-change-input"
            />

            <Text style={styles.fieldLabel}>What should stay the same?</Text>
            <TextInput
              style={styles.textarea}
              placeholder="What’s working well that you want to keep"
              placeholderTextColor={COLORS.textMuted}
              multiline
              value={feedback.keepSame}
              onChangeText={(text) => setFeedback(prev => ({ ...prev, keepSame: text }))}
              data-testid="rolling-regeneration-keep-same-input"
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
        {/* Gradient Header */}
        <LinearGradient
          colors={[COLORS.gradientStart, COLORS.gradientMid, COLORS.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity onPress={onClose} style={styles.closeButton} data-testid="rolling-regeneration-close-button">
            <Ionicons name="close" size={24} color={COLORS.white} />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.headerBadge}>Week {currentWeek} Check-in</Text>
            <Text style={styles.headerTitle}>Time for a Refresh! 🔄</Text>
            <Text style={styles.headerSubtitle}>
              Let's optimize your next 2 weeks based on your progress
            </Text>
          </View>
        </LinearGradient>

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
        >
          {renderStep()}
        </ScrollView>

        {/* Navigation */}
        <View style={styles.navigation}>
          {step > 0 && (
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setStep(step - 1)}
              data-testid="rolling-regeneration-back-button"
            >
              <Ionicons name="arrow-back" size={20} color={COLORS.textSecondary} />
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
            data-testid="rolling-regeneration-continue-button"
          >
            <LinearGradient
              colors={canProceed() 
                ? [COLORS.gradientStart, COLORS.gradientEnd]
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
                size={20} 
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
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  headerContent: {
    marginTop: 8,
  },
  headerBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 22,
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.cardBg,
  },
  dotActive: {
    backgroundColor: COLORS.gradientStart,
  },
  dotCurrent: {
    width: 24,
    backgroundColor: COLORS.gradientEnd,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  stepContent: {},
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  toggleLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: COLORS.cardBg,
  },
  toggleButtonActive: {
    backgroundColor: COLORS.gradientStart,
  },
  toggleText: {
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  toggleTextActive: {
    color: COLORS.white,
  },
  dayButton: {
    width: (width - 80) / 4,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
  },
  dayButtonSelected: {
    backgroundColor: COLORS.gradientStart,
  },
  dayButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  dayButtonTextSelected: {
    color: COLORS.white,
  },
  textarea: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: COLORS.white,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  fieldLabel: {
    marginTop: 12,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  quickChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#232338',
  },
  quickChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  intensityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 16,
  },
  intensityOptionSelected: {
    backgroundColor: COLORS.gradientStart,
  },
  intensityTextContainer: {
    flex: 1,
  },
  intensityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 4,
  },
  intensityTitleSelected: {
    color: COLORS.white,
  },
  intensityDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 40,
    gap: 12,
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
  },
  nextButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default RollingRegenerationModal;
