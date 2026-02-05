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
  availableDays: string[];
  wentWell: string;
  didntGoWell: string;
  improvements: string;
  intensityPreference: 'same' | 'harder' | 'easier';
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
  const [feedback, setFeedback] = useState<RegenerationFeedback>({
    availableDays: [],
    wentWell: '',
    didntGoWell: '',
    improvements: '',
    intensityPreference: 'same',
  });

  const handleDayToggle = (day: string) => {
    setFeedback(prev => ({
      ...prev,
      availableDays: prev.availableDays.includes(day)
        ? prev.availableDays.filter(d => d !== day)
        : [...prev.availableDays, day],
    }));
  };

  const handleSubmit = () => {
    onSubmit(feedback);
    onClose();
    // Reset state
    setStep(0);
    setFeedback({
      availableDays: [],
      wentWell: '',
      didntGoWell: '',
      improvements: '',
      intensityPreference: 'same',
    });
  };

  const canProceed = () => {
    switch (step) {
      case 0: return feedback.availableDays.length > 0;
      case 1: return feedback.wentWell.length > 0;
      case 2: return true; // Optional
      case 3: return true; // Optional
      default: return true;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>What days work for you next 2 weeks?</Text>
            <Text style={styles.stepSubtitle}>Select your available training days</Text>
            
            <View style={styles.daysGrid}>
              {DAYS.map(day => (
                <TouchableOpacity
                  key={day.key}
                  style={[
                    styles.dayButton,
                    feedback.availableDays.includes(day.key) && styles.dayButtonSelected,
                  ]}
                  onPress={() => handleDayToggle(day.key)}
                  data-testid={`rolling-regeneration-day-${day.key}`}
                >
                  <Text style={[
                    styles.dayButtonText,
                    feedback.availableDays.includes(day.key) && styles.dayButtonTextSelected,
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
            <Text style={styles.stepTitle}>What went well? 💪</Text>
            <Text style={styles.stepSubtitle}>Tell us about your wins this week</Text>
            
            <TextInput
              style={styles.textarea}
              placeholder="e.g., Hit a new bench PR, felt stronger on squats..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              value={feedback.wentWell}
              onChangeText={(text) => setFeedback(prev => ({ ...prev, wentWell: text }))}
              data-testid="rolling-regeneration-went-well-input"
            />
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>What didn't go well? 🤔</Text>
            <Text style={styles.stepSubtitle}>Any struggles or challenges?</Text>
            
            <TextInput
              style={styles.textarea}
              placeholder="e.g., Shoulder felt tight, skipped leg day..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              value={feedback.didntGoWell}
              onChangeText={(text) => setFeedback(prev => ({ ...prev, didntGoWell: text }))}
              data-testid="rolling-regeneration-didnt-go-well-input"
            />
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>How should we adjust? 🎯</Text>
            <Text style={styles.stepSubtitle}>Pick your intensity for the next block</Text>
            
            {['easier', 'same', 'harder'].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.intensityOption,
                  feedback.intensityPreference === option && styles.intensityOptionSelected,
                ]}
                onPress={() => setFeedback(prev => ({ 
                  ...prev, 
                  intensityPreference: option as 'easier' | 'same' | 'harder' 
                }))}
                data-testid={`rolling-regeneration-intensity-${option}`}
              >
                <Ionicons 
                  name={
                    option === 'easier' ? 'remove-circle-outline' :
                    option === 'same' ? 'checkmark-circle-outline' :
                    'add-circle-outline'
                  }
                  size={24}
                  color={feedback.intensityPreference === option ? COLORS.white : COLORS.textSecondary}
                />
                <View style={styles.intensityTextContainer}>
                  <Text style={[
                    styles.intensityTitle,
                    feedback.intensityPreference === option && styles.intensityTitleSelected,
                  ]}>
                    {option === 'easier' ? 'Take it easier' :
                     option === 'same' ? 'Keep it the same' :
                     'Push me harder'}
                  </Text>
                  <Text style={styles.intensityDesc}>
                    {option === 'easier' ? 'More recovery, less volume' :
                     option === 'same' ? 'Continue current intensity' :
                     'Increase weight/volume'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            
            <TextInput
              style={[styles.textarea, { marginTop: 16 }]}
              placeholder="Any specific improvements you want? (optional)"
              placeholderTextColor={COLORS.textMuted}
              multiline
              value={feedback.improvements}
              onChangeText={(text) => setFeedback(prev => ({ ...prev, improvements: text }))}
              data-testid="rolling-regeneration-improvements-input"
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
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
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
          {[0, 1, 2, 3].map(i => (
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
            >
              <Ionicons name="arrow-back" size={20} color={COLORS.textSecondary} />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.nextButton, !canProceed() && styles.nextButtonDisabled]}
            onPress={() => {
              if (step < 3) {
                setStep(step + 1);
              } else {
                handleSubmit();
              }
            }}
            disabled={!canProceed()}
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
                {step < 3 ? 'Continue' : 'Generate New Plan'}
              </Text>
              <Ionicons 
                name={step < 3 ? 'arrow-forward' : 'sparkles'} 
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
