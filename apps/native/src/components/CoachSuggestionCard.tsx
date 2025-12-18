/**
 * CoachSuggestionCard - AI-powered exercise weight suggestions
 * 
 * Displays personalized weight progression recommendations based on user history.
 * Features:
 * - Use: Accept the AI suggestion directly
 * - Adjust: Inline weight adjustment with ±2.5kg/±5kg buttons
 * - Why: Explanation modal for the suggestion
 * 
 * Design: Soft rounded card with purple→pink gradient, subtle "alive" animation
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

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
  basedOn: string;
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
  const [showAdjustMode, setShowAdjustMode] = useState(false);
  const [adjustedWeight, setAdjustedWeight] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  
  // Animation values for subtle "alive" effect
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  // Subtle pulse animation
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.008,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    
    const shimmer = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    
    pulse.start();
    shimmer.start();
    
    return () => {
      pulse.stop();
      shimmer.stop();
    };
  }, []);

  useEffect(() => {
    if (visible && !suggestion && !dismissed) {
      fetchSuggestion();
    }
  }, [visible, exercise.id]);

  useEffect(() => {
    if (suggestion) {
      setAdjustedWeight(suggestion.weight);
    }
  }, [suggestion]);

  const fetchSuggestion = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const authToken = await SecureStore.getItemAsync('auth_token');
      
      const response = await fetch(`${API_BASE_URL}/api/coach/exercise-suggestion`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
        },
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

  const generateLocalSuggestion = (): CoachSuggestion => {
    const baseWeight = exercise.suggestedWeight || 0;
    const baseReps = typeof exercise.reps === 'number' ? exercise.reps : parseInt(exercise.reps) || 10;
    
    return {
      weight: baseWeight > 0 ? Math.round((baseWeight + 2.5) * 2) / 2 : 0, // Round to nearest 2.5
      reps: baseReps,
      sets: exercise.sets || 3,
      reason: baseWeight > 0 
        ? `Based on your previous performance, try adding 2.5kg for progressive overload.`
        : `Start with a weight you can control for ${baseReps} reps with good form.`,
      confidence: baseWeight > 0 ? 'medium' : 'low',
      basedOn: baseWeight > 0 ? 'last workout' : 'general recommendation',
    };
  };

  const handleUseSuggestion = () => {
    if (suggestion) {
      onUseSuggestion(suggestion);
      setDismissed(true);
    }
  };

  const handleAdjustWeight = (delta: number) => {
    setAdjustedWeight(prev => Math.max(0, prev + delta));
  };

  const handleConfirmAdjustment = async () => {
    if (!suggestion) return;
    
    const adjusted = {
      weight: adjustedWeight,
      reps: suggestion.reps,
      sets: suggestion.sets,
    };
    
    // Log the user override as a learning signal
    try {
      const authToken = await SecureStore.getItemAsync('auth_token');
      if (authToken) {
        await fetch(`${API_BASE_URL}/api/workout/log-set`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            exerciseName: exercise.name,
            setNumber: 0, // Pre-workout adjustment
            weight: adjustedWeight,
            reps: suggestion.reps,
            note: `User adjusted AI suggestion from ${suggestion.weight}kg to ${adjustedWeight}kg (override)`,
            difficulty: adjustedWeight < suggestion.weight ? 'hard' : 'easy',
          }),
        });
        console.log(`📝 Logged user override: ${exercise.name} - ${suggestion.weight}kg → ${adjustedWeight}kg`);
      }
    } catch (e) {
      console.log('Could not log adjustment, continuing anyway');
    }
    
    onAdjustSuggestion(adjusted);
    setShowAdjustMode(false);
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

  // Calculate shimmer position
  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.cardWrapper, { transform: [{ scale: pulseAnim }] }]}>
        <LinearGradient
          colors={[COLORS.gradientStart + '18', COLORS.gradientEnd + '12']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          {/* Shimmer overlay */}
          <Animated.View 
            style={[
              styles.shimmerOverlay, 
              { transform: [{ translateX: shimmerTranslate }] }
            ]} 
            pointerEvents="none"
          >
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.15)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.shimmerGradient}
            />
          </Animated.View>

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

          {/* Main Message */}
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>
              {suggestion.weight > 0 
                ? `Based on last week, try +${Math.round((suggestion.weight - (exercise.suggestedWeight || 0)) * 10) / 10}kg today`
                : 'Focus on form with a comfortable weight'}
            </Text>
          </View>

          {/* Suggestion Display or Adjust Mode */}
          {!showAdjustMode ? (
            <>
              {/* Weight/Reps Display */}
              <View style={styles.suggestionContent}>
                {suggestion.weight > 0 && (
                  <View style={styles.mainSuggestion}>
                    <Text style={styles.suggestionLabel}>Suggested Weight</Text>
                    <Text style={styles.suggestionWeight}>{suggestion.weight} kg</Text>
                  </View>
                )}
                <View style={styles.secondarySuggestions}>
                  <View style={styles.suggestionItem}>
                    <Ionicons name="repeat-outline" size={14} color={COLORS.mediumGray} />
                    <Text style={styles.suggestionValue}>{suggestion.reps} reps</Text>
                  </View>
                  <View style={styles.suggestionItem}>
                    <Ionicons name="layers-outline" size={14} color={COLORS.mediumGray} />
                    <Text style={styles.suggestionValue}>{suggestion.sets} sets</Text>
                  </View>
                </View>
              </View>

              {/* Confidence Indicator */}
              <View style={styles.confidenceRow}>
                <View style={[styles.confidenceBadge, { backgroundColor: confidenceColor + '20' }]}>
                  <View style={[styles.confidenceDot, { backgroundColor: confidenceColor }]} />
                  <Text style={[styles.confidenceText, { color: confidenceColor }]}>
                    {suggestion.confidence} confidence
                  </Text>
                </View>
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

                <TouchableOpacity 
                  style={styles.actionButtonSecondary} 
                  onPress={() => setShowAdjustMode(true)}
                >
                  <Ionicons name="options-outline" size={18} color={COLORS.primary} />
                  <Text style={styles.actionTextSecondary}>Adjust</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.actionButtonSecondary} 
                  onPress={() => setShowWhyModal(true)}
                >
                  <Ionicons name="help-circle-outline" size={18} color={COLORS.primary} />
                  <Text style={styles.actionTextSecondary}>Why?</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            /* Inline Adjust Mode */
            <View style={styles.adjustContainer}>
              <Text style={styles.adjustTitle}>Adjust Weight</Text>
              
              {/* Weight Display with +/- Buttons */}
              <View style={styles.weightAdjuster}>
                <View style={styles.adjustButtonGroup}>
                  <TouchableOpacity 
                    style={styles.adjustButton}
                    onPress={() => handleAdjustWeight(-5)}
                  >
                    <Text style={styles.adjustButtonText}>-5</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.adjustButton}
                    onPress={() => handleAdjustWeight(-2.5)}
                  >
                    <Text style={styles.adjustButtonText}>-2.5</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.weightDisplay}>
                  <Text style={styles.weightValue}>{adjustedWeight}</Text>
                  <Text style={styles.weightUnit}>kg</Text>
                </View>
                
                <View style={styles.adjustButtonGroup}>
                  <TouchableOpacity 
                    style={styles.adjustButton}
                    onPress={() => handleAdjustWeight(2.5)}
                  >
                    <Text style={styles.adjustButtonText}>+2.5</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.adjustButton}
                    onPress={() => handleAdjustWeight(5)}
                  >
                    <Text style={styles.adjustButtonText}>+5</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Feedback Note */}
              {adjustedWeight !== suggestion.weight && (
                <Text style={styles.adjustNote}>
                  {adjustedWeight < suggestion.weight 
                    ? "Taking it easier today? That's smart recovery!" 
                    : "Feeling strong? Let's push it! 💪"}
                </Text>
              )}

              {/* Confirm/Cancel */}
              <View style={styles.adjustActions}>
                <TouchableOpacity 
                  style={styles.adjustCancelButton}
                  onPress={() => {
                    setShowAdjustMode(false);
                    setAdjustedWeight(suggestion.weight);
                  }}
                >
                  <Text style={styles.adjustCancelText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.adjustConfirmButton}
                  onPress={handleConfirmAdjustment}
                >
                  <LinearGradient
                    colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.adjustConfirmGradient}
                  >
                    <Text style={styles.adjustConfirmText}>Use {adjustedWeight}kg</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </LinearGradient>
      </Animated.View>

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
                This suggestion is based on {suggestion.basedOn}. The more you train, the smarter these recommendations become.
              </Text>
            </View>

            <TouchableOpacity style={styles.modalButton} onPress={() => setShowWhyModal(false)}>
              <Text style={styles.modalButtonText}>Got It</Text>
            </TouchableOpacity>
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
  cardWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
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
    overflow: 'hidden',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  shimmerGradient: {
    width: 100,
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    zIndex: 2,
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
  messageContainer: {
    marginBottom: 14,
    zIndex: 2,
  },
  messageText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: 22,
  },
  suggestionContent: {
    marginBottom: 12,
    zIndex: 2,
  },
  mainSuggestion: {
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
  },
  suggestionLabel: {
    fontSize: 11,
    color: COLORS.mediumGray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  suggestionWeight: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
  },
  secondarySuggestions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  suggestionValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.mediumGray,
  },
  confidenceRow: {
    marginBottom: 14,
    zIndex: 2,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
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
  actions: {
    flexDirection: 'row',
    gap: 8,
    zIndex: 2,
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
  // Inline Adjust Mode Styles
  adjustContainer: {
    zIndex: 2,
  },
  adjustTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  weightAdjuster: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  adjustButtonGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  adjustButton: {
    width: 48,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  weightDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  weightValue: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.text,
  },
  weightUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.mediumGray,
  },
  adjustNote: {
    fontSize: 12,
    color: COLORS.mediumGray,
    textAlign: 'center',
    marginBottom: 14,
    fontStyle: 'italic',
  },
  adjustActions: {
    flexDirection: 'row',
    gap: 10,
  },
  adjustCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    alignItems: 'center',
  },
  adjustCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.mediumGray,
  },
  adjustConfirmButton: {
    flex: 1.5,
    borderRadius: 10,
    overflow: 'hidden',
  },
  adjustConfirmGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  adjustConfirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
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
});

export default CoachSuggestionCard;
