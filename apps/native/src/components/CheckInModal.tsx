/**
 * CheckInModal — Standard & Pro check-in form
 * Standard: monthly (28 days), basic sliders
 * Pro: weekly (7 days), detailed sliders + optional weight + notes + photo + AI PT feedback
 */

import React, { useState } from 'react';
import { Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { getApiBaseUrl } from '../services/env';

const COLORS = {
  accent: '#A22BF6',
  accentSecondary: '#FF4EC7',
  white: '#FFFFFF',
  background: '#FFFFFF',
  cardBg: '#F8F9FA',
  text: '#222222',
  textSecondary: '#8E8E93',
  textMuted: '#C7C7CC',
  border: '#E5E5EA',
};

const API_BASE = getApiBaseUrl();

interface SliderRowProps {
  label: string;
  emoji: string;
  value: number;
  onChange: (v: number) => void;
  isPro?: boolean;
}

function SliderRow({ label, emoji, value, onChange }: SliderRowProps) {
  return (
    <View style={sliderStyles.container}>
      <View style={sliderStyles.header}>
        <Text style={sliderStyles.label}>{emoji} {label}</Text>
        <Text style={sliderStyles.value}>{value}/10</Text>
      </View>
      <View style={sliderStyles.track}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
          <TouchableOpacity
            key={n}
            style={[
              sliderStyles.pip,
              n <= value && sliderStyles.pipActive,
            ]}
            onPress={() => onChange(n)}
          />
        ))}
      </View>
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  container: { marginBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  value: { fontSize: 14, fontWeight: '700', color: COLORS.accent },
  track: { flexDirection: 'row', gap: 4 },
  pip: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  pipActive: { backgroundColor: COLORS.accent },
});

interface CheckInModalProps {
  visible: boolean;
  isPro: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function CheckInModal({ visible, isPro, onClose, onComplete }: CheckInModalProps) {
  const [step, setStep] = useState(0); // 0 = form, 1 = AI feedback
  const [submitting, setSubmitting] = useState(false);
  const [aiFeedback, setAiFeedback] = useState('');
  const [aiOverview, setAiOverview] = useState('');
  const [aiOverviewLoading, setAiOverviewLoading] = useState(false);

  // Form values
  const [energy, setEnergy] = useState(5);
  const [sleep, setSleep] = useState(5);
  const [mood, setMood] = useState(5);
  const [soreness, setSoreness] = useState(5);
  const [motivation, setMotivation] = useState(7);
  const [weightKg, setWeightKg] = useState('');
  const [notes, setNotes] = useState('');
  const [goalsStillSame, setGoalsStillSame] = useState(true);
  const [injuries, setInjuries] = useState('');
  const [progressPhoto, setProgressPhoto] = useState<string | null>(null);
  // New note fields
  const [wentRight, setWentRight] = useState('');
  const [didntGoRight, setDidntGoRight] = useState('');
  const [sleep, setSleep] = useState(5);
  const [mood, setMood] = useState(5);
  const [soreness, setSoreness] = useState(5);
  const [motivation, setMotivation] = useState(7);
  const [weightKg, setWeightKg] = useState('');
  const [notes, setNotes] = useState('');
  const [goalsStillSame, setGoalsStillSame] = useState(true);
  const [injuries, setInjuries] = useState('');
  const [progressPhoto, setProgressPhoto] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const token = await SecureStore.getItemAsync('thryvin_access_token');
      const checkinPayload = {
        energyLevel: energy,
        sleepQuality: sleep,
        mood,
        soreness,
        motivation,
        weightKg: weightKg ? parseFloat(weightKg) : undefined,
        notes: notes || undefined,
        goalsStillSame,
        injuries: injuries || undefined,
        wentRight: wentRight || undefined,
        didntGoRight: didntGoRight || undefined,
      };
      const response = await fetch(`${API_BASE}/api/checkins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(checkinPayload),
      });
      const data = await response.json();
      if (data.ok) {
        setAiFeedback(data.aiFeedback || '');
        setStep(1);
        // Fetch AI overview after submission
        setAiOverviewLoading(true);
        try {
          const overviewRes = await fetch(`${API_BASE}/api/checkin/ai-overview`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(checkinPayload),
          });
          if (overviewRes.ok) {
            const overviewData = await overviewRes.json();
            setAiOverview(overviewData.overview || overviewData.message || overviewData.text || '');
          } else {
            setAiOverview('');
          }
        } catch {
          setAiOverview('');
        } finally {
          setAiOverviewLoading(false);
        }
      } else {
        Alert.alert('Error', data.error || 'Failed to save check-in');
      }
    } catch (err) {
      Alert.alert('Error', 'Network error — please try again');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to add a progress photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setProgressPhoto(result.assets[0].uri);
    }
  };

  const handleDone = () => {
    // Reset
    setStep(0);
    setEnergy(5); setSleep(5); setMood(5); setSoreness(5); setMotivation(7);
    setWeightKg(''); setNotes(''); setGoalsStillSame(true); setInjuries(''); setProgressPhoto(null);
    setAiFeedback(''); setAiOverview(''); setWentRight(''); setDidntGoRight('');
    onComplete();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <LinearGradient
            colors={[COLORS.accent, COLORS.accentSecondary]}
            style={styles.accentBar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <LinearGradient
              colors={[COLORS.accent, COLORS.accentSecondary]}
              style={styles.headerIcon}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <Ionicons name="checkmark-circle" size={24} color={COLORS.white} />
            </LinearGradient>
            <Text style={styles.title}>
              {isPro ? '📊 Weekly Check-In' : '📋 Monthly Check-In'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 0
                ? (isPro ? 'Your AI coach will give you detailed PT feedback' : 'Quick monthly progress snapshot')
                : '✨ Here\'s your AI coach feedback'}
            </Text>
          </View>

          {step === 0 ? (
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
              <SliderRow label="Energy Level" emoji="⚡" value={energy} onChange={setEnergy} />
              <SliderRow label="Sleep Quality" emoji="😴" value={sleep} onChange={setSleep} />
              <SliderRow label="Mood" emoji="😊" value={mood} onChange={setMood} />
              <SliderRow label="Muscle Soreness" emoji="💪" value={soreness} onChange={setSoreness} />
              <SliderRow label="Motivation" emoji="🔥" value={motivation} onChange={setMotivation} />

              {isPro && (
                <>
                  {/* Weight tracking */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>⚖️ Weight (kg) — optional</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 78.5"
                      keyboardType="decimal-pad"
                      value={weightKg}
                      onChangeText={setWeightKg}
                      placeholderTextColor={COLORS.textMuted}
                    />
                  </View>

                  {/* Injuries */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>🩹 Any pain or injuries?</Text>
                    <TextInput
                      style={[styles.textInput, styles.textArea]}
                      placeholder="e.g. Left knee aching, shoulder tension..."
                      value={injuries}
                      onChangeText={setInjuries}
                      multiline
                      placeholderTextColor={COLORS.textMuted}
                    />
                  </View>
                  {/* Progress Photo */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>📸 Progress Photo — optional</Text>
                    <TouchableOpacity onPress={handlePickPhoto} style={styles.photoPickerBtn}>
                      {progressPhoto ? (
                        <Image source={{ uri: progressPhoto }} style={styles.progressPhoto} />
                      ) : (
                        <View style={styles.photoPlaceholder}>
                          <Ionicons name="camera-outline" size={28} color={COLORS.textSecondary} />
                          <Text style={styles.photoPlaceholderText}>Tap to add progress photo</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                    {progressPhoto && (
                      <TouchableOpacity onPress={() => setProgressPhoto(null)} style={styles.removePhotoBtn}>
                        <Text style={styles.removePhotoText}>Remove photo</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              )}

              {/* Goals toggle */}
              <View style={styles.toggleRow}>
                <Text style={styles.fieldLabel}>🎯 Goals still the same?</Text>
                <Switch
                  value={goalsStillSame}
                  onValueChange={setGoalsStillSame}
                  trackColor={{ false: COLORS.border, true: COLORS.accent }}
                  thumbColor={COLORS.white}
                />
              </View>

              {/* Notes */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>📝 Anything else on your mind?</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder={isPro
                    ? "Progress, what's working, what isn't, how you're feeling about your program..."
                    : "Optional notes for your coach..."}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>

              {/* What went right */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>✅ What went right this week?</Text>
                <TextInput
                  style={[styles.textInput, styles.textAreaLarge]}
                  placeholder="e.g. Hit all my sessions, slept well, felt strong on squats..."
                  value={wentRight}
                  onChangeText={setWentRight}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>

              {/* What didn't go right */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>⚠️ What didn't go right?</Text>
                <TextInput
                  style={[styles.textInput, styles.textAreaLarge]}
                  placeholder="e.g. Missed Wednesday, energy low, shoulder felt tight..."
                  value={didntGoRight}
                  onChangeText={setDidntGoRight}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[COLORS.accent, COLORS.accentSecondary]}
                  style={styles.submitGradient}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  {submitting
                    ? <ActivityIndicator color={COLORS.white} />
                    : <>
                        <Ionicons name="send" size={18} color={COLORS.white} />
                        <Text style={styles.submitText}>Submit Check-In</Text>
                      </>
                  }
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
              {/* Score summary */}
              <View style={styles.scoreGrid}>
                {[
                  { label: 'Energy', value: energy, icon: '⚡' },
                  { label: 'Sleep', value: sleep, icon: '😴' },
                  { label: 'Mood', value: mood, icon: '😊' },
                  { label: 'Soreness', value: soreness, icon: '💪' },
                  { label: 'Motivation', value: motivation, icon: '🔥' },
                ].map(({ label, value, icon }) => (
                  <View key={label} style={styles.scoreChip}>
                    <Text style={styles.scoreIcon}>{icon}</Text>
                    <Text style={styles.scoreValue}>{value}/10</Text>
                    <Text style={styles.scoreLabel}>{label}</Text>
                  </View>
                ))}
              </View>

              {/* AI Feedback */}
              <View style={styles.feedbackCard}>
                <View style={styles.feedbackHeader}>
                  <LinearGradient
                    colors={[COLORS.accent, COLORS.accentSecondary]}
                    style={styles.coachAvatar}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="sparkles" size={16} color={COLORS.white} />
                  </LinearGradient>
                  <Text style={styles.feedbackFrom}>
                    {isPro ? 'Your AI Personal Trainer' : 'Your AI Coach'}
                  </Text>
                </View>
                <Text style={styles.feedbackText}>{aiFeedback}</Text>
              </View>

              {/* AI Weekly Overview Card */}
              <View style={styles.aiOverviewCard}>
                <LinearGradient
                  colors={[COLORS.accent, COLORS.accentSecondary]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.aiOverviewHeader}
                >
                  <Ionicons name="analytics" size={18} color={COLORS.white} />
                  <Text style={styles.aiOverviewTitle}>AI Weekly Overview</Text>
                </LinearGradient>
                <View style={styles.aiOverviewBody}>
                  {aiOverviewLoading ? (
                    <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                      <ActivityIndicator color={COLORS.accent} />
                      <Text style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 8 }}>Generating your overview...</Text>
                    </View>
                  ) : aiOverview ? (
                    <Text style={styles.aiOverviewText}>{aiOverview}</Text>
                  ) : (
                    <Text style={styles.aiOverviewPlaceholder}>
                      Great job completing your check-in! Keep tracking your progress consistently for deeper AI insights. 💪
                    </Text>
                  )}
                </View>
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleDone} activeOpacity={0.85}>
                <LinearGradient
                  colors={[COLORS.accent, COLORS.accentSecondary]}
                  style={styles.submitGradient}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="checkmark" size={18} color={COLORS.white} />
                  <Text style={styles.submitText}>Done</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    maxHeight: '95%',
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  accentBar: { height: 4 },
  header: {
    padding: 20,
    alignItems: 'center',
    paddingBottom: 12,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    width: 32, height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    width: 52, height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    marginTop: 6,
  },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
  content: { padding: 20, paddingBottom: 40, gap: 4 },
  fieldGroup: { marginBottom: 16 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  textInput: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  textAreaLarge: { minHeight: 100, textAlignVertical: 'top' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  submitBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  submitText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  scoreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
    justifyContent: 'center',
  },
  scoreChip: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    minWidth: 72,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  scoreIcon: { fontSize: 18, marginBottom: 4 },
  scoreValue: { fontSize: 16, fontWeight: '800', color: COLORS.accent },
  scoreLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  feedbackCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  coachAvatar: {
    width: 32, height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackFrom: { fontSize: 13, fontWeight: '700', color: COLORS.accent },
  feedbackText: { fontSize: 14, color: COLORS.text, lineHeight: 22 },
  // AI Weekly Overview card
  aiOverviewCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  aiOverviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
  },
  aiOverviewTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  aiOverviewBody: {
    backgroundColor: COLORS.cardBg,
    padding: 16,
  },
  aiOverviewText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 22,
  },
  aiOverviewPlaceholder: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  photoPickerBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  progressPhoto: { width: '100%', height: 200, resizeMode: 'cover' },
  photoPlaceholder: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.cardBg,
  },
  photoPlaceholderText: { fontSize: 14, color: COLORS.textSecondary },
  removePhotoBtn: { alignSelf: 'flex-end', marginTop: 6, padding: 4 },
  removePhotoText: { fontSize: 12, color: COLORS.accent, fontWeight: '600' },
});
