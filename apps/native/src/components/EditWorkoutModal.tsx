import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#A22BF6',
  secondary: '#E94560',
  gradientStart: '#A22BF6',
  gradientEnd: '#E94560',
  background: '#FFFFFF',
  cardBg: '#F5F5F7',
  text: '#1C1C1E',
  lightGray: '#E5E5EA',
  mediumGray: '#8E8E93',
  success: '#34C759',
  warning: '#FF9500',
  danger: '#FF3B30',
};

const SWAP_REASONS = [
  { id: 'injury', label: 'Injury/Pain', icon: 'medical-outline', color: COLORS.danger },
  { id: 'equipment', label: 'No Equipment', icon: 'barbell-outline', color: COLORS.warning },
  { id: 'too-hard', label: 'Too Difficult', icon: 'trending-up-outline', color: COLORS.secondary },
  { id: 'too-easy', label: 'Too Easy', icon: 'trending-down-outline', color: COLORS.success },
  { id: 'prefer', label: 'Different Exercise', icon: 'swap-horizontal-outline', color: COLORS.primary },
];

interface EditWorkoutModalProps {
  visible: boolean;
  onClose: () => void;
  workout: any;
  onSaveWorkout: (updatedWorkout: any) => void;
}

interface AlternativeCardProps {
  exercise: any;
  isRecommended?: boolean;
  isSelected: boolean;
  onSelect: () => void;
}

const AlternativeCard: React.FC<AlternativeCardProps> = ({
  exercise,
  isRecommended = false,
  isSelected,
  onSelect,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.alternativeCard,
        isSelected && styles.alternativeCardSelected,
        isRecommended && styles.alternativeCardRecommended,
      ]}
      onPress={onSelect}
    >
      {isRecommended && (
        <View style={styles.recommendedBadge}>
          <Ionicons name="star" size={14} color="#FFFFFF" />
          <Text style={styles.recommendedBadgeText}>Recommended</Text>
        </View>
      )}
      
      <View style={styles.alternativeHeader}>
        <View style={styles.alternativeLeft}>
          <View style={[
            styles.alternativeIcon,
            isRecommended && { backgroundColor: '#34C75920' },
            isSelected && { backgroundColor: COLORS.primary },
          ]}>
            <Ionicons 
              name={isSelected ? "checkmark" : "fitness-outline"} 
              size={20} 
              color={isSelected ? "#FFFFFF" : isRecommended ? '#34C759' : COLORS.primary} 
            />
          </View>
          <View style={styles.alternativeInfo}>
            <Text style={styles.alternativeName}>{exercise.name}</Text>
            <Text style={styles.alternativeMeta}>
              {exercise.sets} sets • {exercise.reps} reps
            </Text>
          </View>
        </View>
        {isSelected && (
          <View style={styles.selectedCheckmark}>
            <Ionicons name="checkmark-circle" size={28} color={COLORS.primary} />
          </View>
        )}
      </View>
      
      {exercise.description && (
        <Text style={styles.alternativeDescription}>{exercise.description}</Text>
      )}
      
      {exercise.videoUrl ? (
        <View style={styles.videoStatus}>
          <Ionicons name="videocam" size={16} color={COLORS.success} />
          <Text style={styles.videoStatusText}>Video available</Text>
        </View>
      ) : (
        <View style={styles.videoStatus}>
          <Ionicons name="videocam-off-outline" size={16} color={COLORS.mediumGray} />
          <Text style={[styles.videoStatusText, { color: COLORS.mediumGray }]}>No video</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://witty-shrimps-smile.loca.lt';

export function EditWorkoutModal({
  visible,
  onClose,
  workout,
  onSaveWorkout,
}: EditWorkoutModalProps) {
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [alternatives, setAlternatives] = useState<any>(null);
  const [selectedAlternative, setSelectedAlternative] = useState<any>(null);
  
  const handleSelectExercise = (exercise: any) => {
    setSelectedExercise(exercise);
    setSelectedReason('');
    setAdditionalNotes('');
  };
  
  const handleSwapExercise = async () => {
    if (!selectedExercise || !selectedReason) return;
    
    setIsGenerating(true);
    
    try {
      console.log('🔄 Calling AI to find alternatives...');
      const response = await fetch(`${API_BASE_URL}/api/workouts/swap-exercise`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentExercise: selectedExercise,
          reason: selectedReason,
          additionalNotes,
          userProfile: { experience: 'intermediate' },
        }),
      });
      
      if (!response.ok) throw new Error('Failed to get alternatives');
      
      const data = await response.json();
      console.log('✅ Got alternatives:', data);
      setAlternatives(data);
    } catch (error) {
      console.error('❌ Error:', error);
      alert('Failed to find alternatives');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleConfirmSwap = () => {
    if (!selectedAlternative) return;
    
    console.log('✅ Swapping exercise:', selectedExercise.name, '→', selectedAlternative.name);
    
    // Update workout with new exercise
    const updatedExercises = workout.exercises.map((ex: any) => 
      ex.name === selectedExercise.name ? {
        ...ex,
        name: selectedAlternative.name,
        description: selectedAlternative.description,
        sets: selectedAlternative.sets,
        reps: selectedAlternative.reps,
        restTime: selectedAlternative.restTime,
        videoUrl: selectedAlternative.videoUrl,
      } : ex
    );
    
    onSaveWorkout({ ...workout, exercises: updatedExercises });
    
    // Reset state
    setSelectedExercise(null);
    setSelectedReason('');
    setAdditionalNotes('');
    setAlternatives(null);
    setSelectedAlternative(null);
    onClose();
  };
  
  const handleBackFromAlternatives = () => {
    setAlternatives(null);
    setSelectedAlternative(null);
  };
  
  const renderExerciseList = () => {
    const allExercises = [
      ...(workout?.exercises?.filter((e: any) => e.category === 'warmup') || []),
      ...(workout?.exercises?.filter((e: any) => e.category === 'main') || []),
      ...(workout?.exercises?.filter((e: any) => e.category === 'cooldown') || []),
    ];
    
    return allExercises.map((exercise: any, index: number) => (
      <TouchableOpacity
        key={index}
        style={[
          styles.exerciseItem,
          selectedExercise?.name === exercise.name && styles.exerciseItemSelected,
        ]}
        onPress={() => handleSelectExercise(exercise)}
      >
        <View style={styles.exerciseItemLeft}>
          <View style={[
            styles.exerciseNumber,
            selectedExercise?.name === exercise.name && styles.exerciseNumberSelected,
          ]}>
            <Text style={[
              styles.exerciseNumberText,
              selectedExercise?.name === exercise.name && styles.exerciseNumberTextSelected,
            ]}>
              {index + 1}
            </Text>
          </View>
          <View style={styles.exerciseItemInfo}>
            <Text style={styles.exerciseItemName}>{exercise.name}</Text>
            <Text style={styles.exerciseItemMeta}>
              {exercise.sets} sets • {exercise.reps} reps • {exercise.restTime}s rest
            </Text>
          </View>
        </View>
        {selectedExercise?.name === exercise.name && (
          <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
        )}
      </TouchableOpacity>
    ));
  };
  
  const renderSwapReasons = () => {
    return SWAP_REASONS.map((reason) => (
      <TouchableOpacity
        key={reason.id}
        style={[
          styles.reasonCard,
          selectedReason === reason.id && styles.reasonCardSelected,
        ]}
        onPress={() => setSelectedReason(reason.id)}
      >
        <View style={[
          styles.reasonIcon,
          { backgroundColor: `${reason.color}20` },
        ]}>
          <Ionicons name={reason.icon as any} size={24} color={reason.color} />
        </View>
        <Text style={styles.reasonLabel}>{reason.label}</Text>
        {selectedReason === reason.id && (
          <View style={styles.reasonCheckmark}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
          </View>
        )}
      </TouchableOpacity>
    ));
  };
  
  if (!visible) return null;
  
  // Determine header text
  const getHeaderText = () => {
    if (alternatives) return 'Choose Alternative';
    if (selectedExercise) return 'Why swap this exercise?';
    return 'Select exercise to modify';
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
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
            <Text style={styles.headerTitle}>Edit Workout</Text>
            <View style={styles.placeholder} />
          </View>
          <Text style={styles.headerSubtitle}>{getHeaderText()}</Text>
        </LinearGradient>
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {alternatives ? (
            /* Alternatives Selection Screen */
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>✨ Recommended</Text>
                <AlternativeCard
                  exercise={alternatives.recommended}
                  isRecommended
                  isSelected={selectedAlternative?.name === alternatives.recommended.name}
                  onSelect={() => setSelectedAlternative(alternatives.recommended)}
                />
              </View>
              
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Other Options</Text>
                {alternatives.alternatives.map((alt: any, idx: number) => (
                  <AlternativeCard
                    key={idx}
                    exercise={alt}
                    isSelected={selectedAlternative?.name === alt.name}
                    onSelect={() => setSelectedAlternative(alt)}
                  />
                ))}
              </View>
            </>
          ) : !selectedExercise ? (
            /* Exercise Selection */
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Exercises in Your Workout</Text>
              <Text style={styles.sectionSubtitle}>
                Tap an exercise you want to change
              </Text>
              {renderExerciseList()}
            </View>
          ) : (
            /* Swap Reason Selection */
            <>
              <View style={styles.section}>
                <View style={styles.selectedExerciseBanner}>
                  <Ionicons name="fitness-outline" size={24} color={COLORS.primary} />
                  <View style={styles.selectedExerciseInfo}>
                    <Text style={styles.selectedExerciseLabel}>Editing</Text>
                    <Text style={styles.selectedExerciseName}>{selectedExercise.name}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelectedExercise(null)}
                    style={styles.changeButton}
                  >
                    <Text style={styles.changeButtonText}>Change</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Why swap this exercise?</Text>
                <View style={styles.reasonGrid}>
                  {renderSwapReasons()}
                </View>
              </View>
              
              {selectedReason && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Additional Details (Optional)</Text>
                  <TextInput
                    style={styles.notesInput}
                    placeholder="e.g., Knee injury, prefer free weights..."
                    placeholderTextColor={COLORS.mediumGray}
                    multiline
                    numberOfLines={4}
                    value={additionalNotes}
                    onChangeText={setAdditionalNotes}
                  />
                </View>
              )}
            </>
          )}
          
          <View style={{ height: 100 }} />
        </ScrollView>
        
        {/* Action Button */}
        {selectedExercise && selectedReason && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.swapButton}
              onPress={handleSwapExercise}
              disabled={isGenerating}
            >
              <LinearGradient
                colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.swapButtonGradient}
              >
                {isGenerating ? (
                  <>
                    <Ionicons name="sync-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.swapButtonText}>Finding Alternative...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="swap-horizontal" size={20} color="#FFFFFF" />
                    <Text style={styles.swapButtonText}>Swap Exercise with AI</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.mediumGray,
    marginBottom: 16,
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  exerciseItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}10`,
  },
  exerciseItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  exerciseNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  exerciseNumberSelected: {
    backgroundColor: COLORS.primary,
  },
  exerciseNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.mediumGray,
  },
  exerciseNumberTextSelected: {
    color: '#FFFFFF',
  },
  exerciseItemInfo: {
    flex: 1,
  },
  exerciseItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  exerciseItemMeta: {
    fontSize: 13,
    color: COLORS.mediumGray,
  },
  selectedExerciseBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  selectedExerciseInfo: {
    flex: 1,
    marginLeft: 12,
  },
  selectedExerciseLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 2,
  },
  selectedExerciseName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  changeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  changeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  reasonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  reasonCard: {
    width: '48%',
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
    margin: '1%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  reasonCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}10`,
  },
  reasonIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  reasonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  reasonCheckmark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  notesInput: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: COLORS.text,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  swapButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  swapButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  swapButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
