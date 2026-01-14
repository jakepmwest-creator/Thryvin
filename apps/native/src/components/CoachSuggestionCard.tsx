/**
 * CoachSuggestionCard - AI-powered exercise weight suggestions
 * 
 * Phase 8.5 Updates:
 * - COLLAPSIBLE: Default collapsed with 1-line preview, tap to expand
 * - FINE INCREMENTS: 0.5kg steps, long-press for fast adjust, tap number to edit
 * - FIXED LAYOUT: No more cut-off buttons, proper safe-area handling
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  ActivityIndicator,
  Dimensions,
  Animated,
  Easing,
  TextInput,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://fitness-stats-8.preview.emergentagent.com';

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
  white: '#FFFFFF',
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
  const [showWhyModal, setShowWhyModal] = useState(false);
  const [showAdjustMode, setShowAdjustMode] = useState(false);
  const [adjustedWeight, setAdjustedWeight] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingWeight, setIsEditingWeight] = useState(false);
  const [weightInputValue, setWeightInputValue] = useState('');
  
  // Long press timer for fast adjust
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const fastAdjustInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Animation for expand/collapse
  const expandAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Subtle pulse animation
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.005,
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
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Expand/collapse animation
  useEffect(() => {
    Animated.timing(expandAnim, {
      toValue: isExpanded ? 1 : 0,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [isExpanded]);

  useEffect(() => {
    if (visible && !suggestion && !dismissed) {
      fetchSuggestion();
    }
  }, [visible, exercise.id]);

  useEffect(() => {
    if (suggestion) {
      setAdjustedWeight(suggestion.weight);
      setWeightInputValue(String(suggestion.weight));
    }
  }, [suggestion]);

  const fetchSuggestion = async () => {
    setLoading(true);
    
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
      weight: baseWeight > 0 ? Math.round((baseWeight + 2.5) * 2) / 2 : 0,
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

  // Fine increment adjustment (0.5kg)
  const handleAdjustWeight = (delta: number) => {
    setAdjustedWeight(prev => {
      const newVal = Math.max(0, Math.round((prev + delta) * 2) / 2); // Round to nearest 0.5
      setWeightInputValue(String(newVal));
      return newVal;
    });
  };

  // Long press handlers for fast adjust
  const startFastAdjust = (delta: number) => {
    longPressTimer.current = setTimeout(() => {
      fastAdjustInterval.current = setInterval(() => {
        handleAdjustWeight(delta * 2); // Faster increment during hold
      }, 100);
    }, 400);
  };

  const stopFastAdjust = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (fastAdjustInterval.current) clearInterval(fastAdjustInterval.current);
  };

  const handleWeightInputSubmit = () => {
    const parsed = parseFloat(weightInputValue);
    if (!isNaN(parsed) && parsed >= 0) {
      setAdjustedWeight(Math.round(parsed * 2) / 2); // Round to nearest 0.5
    } else {
      setWeightInputValue(String(adjustedWeight));
    }
    setIsEditingWeight(false);
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
            setNumber: 0,
            weight: adjustedWeight,
            reps: suggestion.reps,
            note: `User adjusted AI suggestion from ${suggestion.weight}kg to ${adjustedWeight}kg`,
            difficulty: adjustedWeight < suggestion.weight ? 'hard' : 'easy',
          }),
        });
      }
    } catch (e) {
      console.log('Could not log adjustment');
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
          <Text style={styles.loadingText}>Getting suggestion...</Text>
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

  // Collapsed header preview
  const previewText = suggestion.weight > 0 
    ? `Use ${suggestion.weight}kg for ${suggestion.reps} reps`
    : 'Tap for weight suggestion';

  // Animated height for expand
  const expandedHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 280],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.cardWrapper, { transform: [{ scale: pulseAnim }] }]}>
        <LinearGradient
          colors={[COLORS.gradientStart + '15', COLORS.gradientEnd + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          {/* Collapsed Header (always visible) */}
          <TouchableOpacity 
            style={styles.collapsedHeader}
            onPress={() => setIsExpanded(!isExpanded)}
            activeOpacity={0.7}
          >
            <View style={styles.headerLeft}>
              <Ionicons name="sparkles" size={16} color={COLORS.primary} />
              <Text style={styles.headerTitle}>Coach Suggestion</Text>
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.previewText} numberOfLines={1}>{previewText}</Text>
              <Ionicons 
                name={isExpanded ? "chevron-up" : "chevron-down"} 
                size={18} 
                color={COLORS.mediumGray} 
              />
            </View>
          </TouchableOpacity>

          {/* Expanded Content */}
          <Animated.View style={[styles.expandedContent, { height: expandedHeight, opacity: expandAnim }]}>
            {!showAdjustMode ? (
              <View style={styles.suggestionBody}>
                {/* Weight Display */}
                {suggestion.weight > 0 && (
                  <View style={styles.weightDisplay}>
                    <Text style={styles.weightLabel}>Suggested Weight</Text>
                    <Text style={styles.weightValue}>{suggestion.weight} kg</Text>
                    <Text style={styles.repsInfo}>{suggestion.reps} reps × {suggestion.sets} sets</Text>
                  </View>
                )}

                {/* Confidence */}
                <View style={styles.confidenceRow}>
                  <View style={[styles.confidenceBadge, { backgroundColor: confidenceColor + '20' }]}>
                    <View style={[styles.confidenceDot, { backgroundColor: confidenceColor }]} />
                    <Text style={[styles.confidenceText, { color: confidenceColor }]}>
                      {suggestion.confidence} confidence
                    </Text>
                  </View>
                </View>

                {/* Action Buttons - Fixed layout */}
                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.useButton} onPress={handleUseSuggestion}>
                    <LinearGradient
                      colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.useButtonGradient}
                    >
                      <Ionicons name="checkmark" size={16} color={COLORS.white} />
                      <Text style={styles.useButtonText}>Use</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.secondaryButton} 
                    onPress={() => setShowAdjustMode(true)}
                  >
                    <Ionicons name="options-outline" size={16} color={COLORS.primary} />
                    <Text style={styles.secondaryButtonText}>Adjust</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.secondaryButton} 
                    onPress={() => setShowWhyModal(true)}
                  >
                    <Ionicons name="help-circle-outline" size={16} color={COLORS.primary} />
                    <Text style={styles.secondaryButtonText}>Why?</Text>
                  </TouchableOpacity>
                </View>

                {/* Dismiss */}
                <TouchableOpacity 
                  style={styles.dismissRow}
                  onPress={() => setDismissed(true)}
                >
                  <Text style={styles.dismissText}>Not now</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Adjust Mode with fine increments */
              <View style={styles.adjustContainer}>
                <Text style={styles.adjustTitle}>Adjust Weight</Text>
                
                {/* Weight adjuster with 0.5kg increments */}
                <View style={styles.weightAdjuster}>
                  {/* Minus buttons */}
                  <View style={styles.adjustButtonGroup}>
                    <TouchableOpacity 
                      style={styles.adjustBtn}
                      onPress={() => handleAdjustWeight(-5)}
                      onPressIn={() => startFastAdjust(-5)}
                      onPressOut={stopFastAdjust}
                    >
                      <Text style={styles.adjustBtnText}>-5</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.adjustBtn}
                      onPress={() => handleAdjustWeight(-0.5)}
                      onPressIn={() => startFastAdjust(-0.5)}
                      onPressOut={stopFastAdjust}
                    >
                      <Text style={styles.adjustBtnText}>-0.5</Text>
                    </TouchableOpacity>
                  </View>
                  
                  {/* Tappable weight display */}
                  <TouchableOpacity 
                    style={styles.weightEditContainer}
                    onPress={() => setIsEditingWeight(true)}
                  >
                    {isEditingWeight ? (
                      <TextInput
                        style={styles.weightInput}
                        value={weightInputValue}
                        onChangeText={setWeightInputValue}
                        onBlur={handleWeightInputSubmit}
                        onSubmitEditing={handleWeightInputSubmit}
                        keyboardType="decimal-pad"
                        autoFocus
                        selectTextOnFocus
                      />
                    ) : (
                      <Text style={styles.adjustWeightValue}>{adjustedWeight}</Text>
                    )}
                    <Text style={styles.adjustWeightUnit}>kg</Text>
                  </TouchableOpacity>
                  
                  {/* Plus buttons */}
                  <View style={styles.adjustButtonGroup}>
                    <TouchableOpacity 
                      style={styles.adjustBtn}
                      onPress={() => handleAdjustWeight(0.5)}
                      onPressIn={() => startFastAdjust(0.5)}
                      onPressOut={stopFastAdjust}
                    >
                      <Text style={styles.adjustBtnText}>+0.5</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.adjustBtn}
                      onPress={() => handleAdjustWeight(5)}
                      onPressIn={() => startFastAdjust(5)}
                      onPressOut={stopFastAdjust}
                    >
                      <Text style={styles.adjustBtnText}>+5</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.adjustHint}>Tap number to type • Hold buttons for fast adjust</Text>

                {/* Confirm/Cancel */}
                <View style={styles.adjustActions}>
                  <TouchableOpacity 
                    style={styles.cancelBtn}
                    onPress={() => {
                      setShowAdjustMode(false);
                      setAdjustedWeight(suggestion.weight);
                      setWeightInputValue(String(suggestion.weight));
                    }}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmAdjustment}>
                    <LinearGradient
                      colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.confirmBtnGradient}
                    >
                      <Text style={styles.confirmBtnText}>Use {adjustedWeight}kg</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Animated.View>
        </LinearGradient>
      </Animated.View>

      {/* Why Modal */}
      <Modal
        visible={showWhyModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWhyModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowWhyModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Ionicons name="sparkles" size={22} color={COLORS.primary} />
                  <Text style={styles.modalTitle}>Why This Suggestion?</Text>
                </View>
                
                <Text style={styles.modalText}>{suggestion.reason}</Text>
                
                <View style={styles.modalInfo}>
                  <Ionicons name="information-circle-outline" size={16} color={COLORS.mediumGray} />
                  <Text style={styles.modalInfoText}>
                    Based on {suggestion.basedOn}. Train more to improve accuracy!
                  </Text>
                </View>

                <TouchableOpacity style={styles.modalBtn} onPress={() => setShowWhyModal(false)}>
                  <Text style={styles.modalBtnText}>Got It</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  cardWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.mediumGray,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.primary + '25',
    overflow: 'hidden',
  },
  // Collapsed header
  collapsedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-end',
  },
  previewText: {
    fontSize: 12,
    color: COLORS.mediumGray,
    maxWidth: 150,
  },
  // Expanded content
  expandedContent: {
    overflow: 'hidden',
    paddingHorizontal: 14,
  },
  suggestionBody: {
    paddingTop: 4,
  },
  weightDisplay: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    marginBottom: 10,
  },
  weightLabel: {
    fontSize: 10,
    color: COLORS.mediumGray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  weightValue: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
  },
  repsInfo: {
    fontSize: 12,
    color: COLORS.mediumGray,
    marginTop: 2,
  },
  confidenceRow: {
    marginBottom: 12,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 5,
  },
  confidenceDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  // Action buttons - FIXED layout
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  useButton: {
    flex: 1.2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  useButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 5,
  },
  useButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
    gap: 3,
  },
  secondaryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  dismissRow: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  dismissText: {
    fontSize: 12,
    color: COLORS.mediumGray,
  },
  // Adjust mode
  adjustContainer: {
    paddingTop: 4,
  },
  adjustTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  weightAdjuster: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  adjustButtonGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  adjustBtn: {
    width: 42,
    height: 36,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary + '25',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  weightEditContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  weightInput: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    minWidth: 60,
    textAlign: 'center',
    padding: 0,
  },
  adjustWeightValue: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
  },
  adjustWeightUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.mediumGray,
  },
  adjustHint: {
    fontSize: 10,
    color: COLORS.mediumGray,
    textAlign: 'center',
    marginBottom: 12,
  },
  adjustActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.mediumGray,
  },
  confirmBtn: {
    flex: 1.5,
    borderRadius: 8,
    overflow: 'hidden',
  },
  confirmBtnGradient: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: SCREEN_WIDTH - 48,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalText: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text,
    marginBottom: 14,
  },
  modalInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    padding: 10,
    backgroundColor: COLORS.cardBg,
    borderRadius: 10,
    marginBottom: 16,
  },
  modalInfoText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.mediumGray,
    lineHeight: 16,
  },
  modalBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
});

export default CoachSuggestionCard;
