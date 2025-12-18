/**
 * CoachSuggestionCard - AI-powered exercise suggestions
 * 
 * Shows personalized recommendations for each exercise with:
 * - Use: Accept the AI suggestion
 * - Adjust: Modify weight/reps/sets
 * - Why: Get explanation for the suggestion
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://thryvin-fitness-1.preview.emergentagent.com';

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
  warning: '#FF9500',
};

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string | number;
  restTime?: number;
  suggestedWeight?: number;
  suggestedReps?: number;
  aiNote?: string;
}

interface CoachSuggestion {
  weight: number;
  reps: number;
  sets: number;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
  basedOn: string; // e.g., "last workout", "progressive overload", "recovery"
}

interface Props {
  exercise: Exercise;
  onUseSuggestion: (suggestion: CoachSuggestion) => void;
  onAdjustSuggestion: (adjusted: { weight: number; reps: number; sets: number }) => void;
  visible?: boolean;
}

export function CoachSuggestionCard({ exercise, onUseSuggestion, onAdjustSuggestion, visible = true }: Props) {
  const [suggestion, setSuggestion] = useState<CoachSuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWhyModal, setShowWhyModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustedWeight, setAdjustedWeight] = useState('');
  const [adjustedReps, setAdjustedReps] = useState('');
  const [adjustedSets, setAdjustedSets] = useState('');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (visible && !suggestion && !dismissed) {
      fetchSuggestion();
    }
  }, [visible, exercise.id]);

  const fetchSuggestion = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/coach/exercise-suggestion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          exerciseName: exercise.name,
          exerciseId: exercise.id,
          currentSets: exercise.sets,
          currentReps: exercise.reps,
          lastWeight: exercise.suggestedWeight,
        }),
      });

      if (!response.ok) {
        // Fallback to local suggestion if API fails
        setSuggestion(generateLocalSuggestion());
        return;
      }

      const data = await response.json();
      setSuggestion(data.suggestion);
    } catch (err) {
      console.log('Coach suggestion API unavailable, using local fallback');
      setSuggestion(generateLocalSuggestion());
    } finally {
      setLoading(false);
    }
  };

  // Generate local suggestion based on exercise data
  const generateLocalSuggestion = (): CoachSuggestion => {
    const baseWeight = exercise.suggestedWeight || 0;
    const baseReps = typeof exercise.reps === 'number' ? exercise.reps : parseInt(exercise.reps) || 10;
    
    return {
      weight: baseWeight > 0 ? Math.round(baseWeight * 1.05) : 0, // 5% increase
      reps: baseReps,
      sets: exercise.sets || 3,
      reason: baseWeight > 0 
        ? `Based on your last workout, try adding 5% more weight for progressive overload.`
        : `Start with a weight you can control for ${baseReps} reps with good form.`,
      confidence: baseWeight > 0 ? 'medium' : 'low',
      basedOn: baseWeight > 0 ? 'progressive overload' : 'general recommendation',
    };
  };

  const handleUseSuggestion = () => {
    if (suggestion) {
      onUseSuggestion(suggestion);
      setDismissed(true);
    }
  };

  const handleAdjust = () => {
    if (suggestion) {
      setAdjustedWeight(String(suggestion.weight || ''));
      setAdjustedReps(String(suggestion.reps || ''));
      setAdjustedSets(String(suggestion.sets || ''));
      setShowAdjustModal(true);
    }
  };

  const handleSaveAdjustment = () => {
    const adjusted = {
      weight: parseInt(adjustedWeight) || 0,
      reps: parseInt(adjustedReps) || 10,
      sets: parseInt(adjustedSets) || 3,
    };
    onAdjustSuggestion(adjusted);
    setShowAdjustModal(false);
    setDismissed(true);
  };

  if (!visible || dismissed) return null;

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingText}>Getting coach suggestion...</Text>
        </View>
      </View>
    );
  }

  if (!suggestion) return null;

  const confidenceColor = {
    high: COLORS.success,
    medium: COLORS.warning,
    low: COLORS.mediumGray,
  }[suggestion.confidence];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.gradientStart + '15', COLORS.gradientEnd + '10']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="sparkles" size={18} color={COLORS.primary} />
            <Text style={styles.headerTitle}>Coach Suggestion</Text>
          </View>
          <TouchableOpacity onPress={() => setDismissed(true)} style={styles.dismissButton}>
            <Ionicons name="close" size={18} color={COLORS.mediumGray} />
          </TouchableOpacity>
        </View>

        {/* Suggestion Content */}
        <View style={styles.suggestionContent}>
          {suggestion.weight > 0 && (
            <View style={styles.suggestionItem}>
              <Ionicons name="barbell-outline" size={16} color={COLORS.text} />
              <Text style={styles.suggestionValue}>{suggestion.weight} lbs</Text>
            </View>
          )}
          <View style={styles.suggestionItem}>
            <Ionicons name="repeat-outline" size={16} color={COLORS.text} />
            <Text style={styles.suggestionValue}>{suggestion.reps} reps</Text>
          </View>
          <View style={styles.suggestionItem}>
            <Ionicons name="layers-outline" size={16} color={COLORS.text} />
            <Text style={styles.suggestionValue}>{suggestion.sets} sets</Text>
          </View>
        </View>

        {/* Confidence Badge */}
        <View style={styles.confidenceRow}>
          <View style={[styles.confidenceBadge, { backgroundColor: confidenceColor + '20' }]}>
            <View style={[styles.confidenceDot, { backgroundColor: confidenceColor }]} />
            <Text style={[styles.confidenceText, { color: confidenceColor }]}>
              {suggestion.confidence} confidence
            </Text>
          </View>
          <Text style={styles.basedOnText}>Based on {suggestion.basedOn}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleUseSuggestion}>
            <LinearGradient
              colors={[COLORS.gradientStart, COLORS.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionGradient}
            >
              <Ionicons name="checkmark" size={18} color="#FFF" />
              <Text style={styles.actionTextPrimary}>Use</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButtonSecondary} onPress={handleAdjust}>
            <Ionicons name="options-outline" size={18} color={COLORS.primary} />
            <Text style={styles.actionTextSecondary}>Adjust</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButtonSecondary} onPress={() => setShowWhyModal(true)}>
            <Ionicons name="help-circle-outline" size={18} color={COLORS.primary} />
            <Text style={styles.actionTextSecondary}>Why?</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Why Modal */}
      <Modal
        visible={showWhyModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWhyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="sparkles" size={24} color={COLORS.primary} />
              <Text style={styles.modalTitle}>Why This Suggestion?</Text>
            </View>
            
            <Text style={styles.modalText}>{suggestion.reason}</Text>
            
            <View style={styles.modalInfo}>
              <Ionicons name="information-circle-outline" size={16} color={COLORS.mediumGray} />
              <Text style={styles.modalInfoText}>
                This suggestion is based on your workout history and aims for safe, progressive improvement.
              </Text>
            </View>

            <TouchableOpacity style={styles.modalButton} onPress={() => setShowWhyModal(false)}>
              <Text style={styles.modalButtonText}>Got It</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Adjust Modal */}
      <Modal
        visible={showAdjustModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAdjustModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Adjust Suggestion</Text>
            
            <View style={styles.adjustInputRow}>
              <Text style={styles.adjustLabel}>Weight (lbs)</Text>
              <TextInput
                style={styles.adjustInput}
                value={adjustedWeight}
                onChangeText={setAdjustedWeight}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>

            <View style={styles.adjustInputRow}>
              <Text style={styles.adjustLabel}>Reps</Text>
              <TextInput
                style={styles.adjustInput}
                value={adjustedReps}
                onChangeText={setAdjustedReps}
                keyboardType="numeric"
                placeholder="10"
              />
            </View>

            <View style={styles.adjustInputRow}>
              <Text style={styles.adjustLabel}>Sets</Text>
              <TextInput
                style={styles.adjustInput}
                value={adjustedSets}
                onChangeText={setAdjustedSets}
                keyboardType="numeric"
                placeholder="3"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalCancelButton} 
                onPress={() => setShowAdjustModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.modalSaveButton} onPress={handleSaveAdjustment}>
                <LinearGradient
                  colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                  style={styles.modalSaveGradient}
                >
                  <Text style={styles.modalSaveText}>Save</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.mediumGray,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  dismissButton: {
    padding: 4,
  },
  suggestionContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  suggestionValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  confidenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  confidenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  basedOnText: {
    fontSize: 11,
    color: COLORS.mediumGray,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1.2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  actionTextPrimary: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionButtonSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
    gap: 4,
  },
  actionTextSecondary: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: SCREEN_WIDTH - 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalText: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.text,
    marginBottom: 16,
  },
  modalInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    marginBottom: 20,
  },
  modalInfoText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.mediumGray,
    lineHeight: 18,
  },
  modalButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  adjustInputRow: {
    marginBottom: 16,
  },
  adjustLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  adjustInput: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.mediumGray,
  },
  modalSaveButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalSaveGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default CoachSuggestionCard;
