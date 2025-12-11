import React, { useState, useEffect } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../stores/auth-store';
import { CustomAlert } from './CustomAlert';

const COLORS = {
  accent: '#A22BF6',
  accentSecondary: '#FF4EC7',
  white: '#ffffff',
  text: '#222222',
  lightGray: '#F8F9FA',
  mediumGray: '#8E8E93',
  success: '#34C759',
};

interface GoalsProgressModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
}

const FITNESS_GOALS = [
  { id: 'lose_weight', icon: 'scale', label: 'Lose Weight', description: 'Burn fat and slim down' },
  { id: 'build_muscle', icon: 'barbell', label: 'Build Muscle', description: 'Gain strength and size' },
  { id: 'increase_endurance', icon: 'heart', label: 'Increase Endurance', description: 'Improve stamina' },
  { id: 'improve_flexibility', icon: 'body', label: 'Improve Flexibility', description: 'Better mobility' },
  { id: 'stay_healthy', icon: 'fitness', label: 'Stay Healthy', description: 'General wellness' },
  { id: 'athletic_performance', icon: 'trophy', label: 'Athletic Performance', description: 'Sports training' },
];

const GoalCard = ({ goal, selected, onPress }: { goal: typeof FITNESS_GOALS[0]; selected: boolean; onPress: () => void }) => (
  <TouchableOpacity 
    style={[styles.goalCard, selected && styles.goalCardSelected]} 
    onPress={onPress}
    activeOpacity={0.7}
  >
    {selected ? (
      <LinearGradient
        colors={[COLORS.accent, COLORS.accentSecondary]}
        style={styles.goalCardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.goalIconSelected}>
          <Ionicons name={goal.icon as any} size={28} color={COLORS.white} />
        </View>
        <Text style={styles.goalLabelSelected}>{goal.label}</Text>
        <View style={styles.checkBadge}>
          <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
        </View>
      </LinearGradient>
    ) : (
      <View style={styles.goalCardInner}>
        <View style={styles.goalIcon}>
          <Ionicons name={goal.icon as any} size={28} color={COLORS.accent} />
        </View>
        <Text style={styles.goalLabel}>{goal.label}</Text>
      </View>
    )}
  </TouchableOpacity>
);

export const GoalsProgressModal = ({ visible, onClose, onSave }: GoalsProgressModalProps) => {
  const { user } = useAuthStore();
  
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [targetWeight, setTargetWeight] = useState('');
  const [weeklyWorkoutGoal, setWeeklyWorkoutGoal] = useState('4');
  const [customGoal, setCustomGoal] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // CustomAlert state
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    buttons?: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>;
  }>({ visible: false, type: 'info', title: '', message: '' });
  
  const showAlert = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, buttons?: any[]) => {
    setAlertConfig({ visible: true, type, title, message, buttons });
  };
  const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  useEffect(() => {
    loadGoals();
  }, [visible]);

  const loadGoals = async () => {
    try {
      const savedGoals = await AsyncStorage.getItem('user_goals');
      if (savedGoals) {
        const goals = JSON.parse(savedGoals);
        setSelectedGoals(goals.selectedGoals || []);
        setTargetWeight(goals.targetWeight || '');
        setWeeklyWorkoutGoal(goals.weeklyWorkoutGoal || '4');
        setCustomGoal(goals.customGoal || '');
      }
    } catch (error) {
      console.error('Error loading goals:', error);
    }
  };

  const toggleGoal = (goalId: string) => {
    setSelectedGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(g => g !== goalId)
        : [...prev, goalId]
    );
  };

  const handleSave = async () => {
    if (selectedGoals.length === 0) {
      showAlert('warning', 'Please select at least one goal', 'Choose what you want to achieve with your fitness journey.');
      return;
    }

    // Show confirmation before saving and regenerating
    showAlert('info', 'Update Goals?', 
      'Changing your goals will help the AI customize your workouts to match your new targets.\n\nYour workouts may be adjusted based on these changes.',
      [
        { text: 'Cancel', style: 'cancel', onPress: hideAlert },
        { 
          text: 'Update Goals', 
          onPress: async () => {
            hideAlert();
            await saveGoals();
          }
        },
      ]
    );
  };

  const saveGoals = async () => {
    setIsSaving(true);
    try {
      const goals = {
        selectedGoals,
        targetWeight,
        weeklyWorkoutGoal,
        customGoal,
        updatedAt: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem('user_goals', JSON.stringify(goals));
      
      // Notify AI about goal changes by saving to learning context
      try {
        const goalsText = selectedGoals.join(', ');
        await AsyncStorage.setItem('ai_goals_context', JSON.stringify({
          goals: goalsText,
          targetWeight,
          weeklyWorkoutGoal,
          customGoal,
          updatedAt: new Date().toISOString(),
        }));
      } catch (e) {
        console.log('Could not save AI context');
      }
      
      showAlert('success', 'Goals Updated! 🎯', 'Your fitness goals have been saved. The AI will personalize your workouts to help you achieve them!', [
        { text: "Let's Go!", onPress: onClose }
      ]);
      onSave();
    } catch (error) {
      showAlert('error', 'Error', 'Failed to save goals. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Custom Alert */}
          <CustomAlert
            visible={alertConfig.visible}
            type={alertConfig.type}
            title={alertConfig.title}
            message={alertConfig.message}
            buttons={alertConfig.buttons}
            onClose={hideAlert}
          />
          
          {/* Header with Gradient */}
          <LinearGradient
            colors={[COLORS.accent, COLORS.accentSecondary]}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={COLORS.white} />
              </TouchableOpacity>
              <View style={styles.headerTitleContainer}>
                <Ionicons name="trophy" size={24} color={COLORS.white} />
                <Text style={styles.headerTitle}>Goals & Progress</Text>
              </View>
              <TouchableOpacity onPress={handleSave} disabled={isSaving} style={styles.saveButtonContainer}>
                <Text style={[styles.saveButton, isSaving && { opacity: 0.5 }]}>
                  {isSaving ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.headerSubtitle}>Define your fitness journey</Text>
          </LinearGradient>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Main Goals */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What are your fitness goals?</Text>
              <Text style={styles.sectionSubtitle}>Select all that apply - we'll personalize your workouts</Text>
              <View style={styles.goalsContainer}>
                {FITNESS_GOALS.map(goal => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    selected={selectedGoals.includes(goal.id)}
                    onPress={() => toggleGoal(goal.id)}
                  />
                ))}
              </View>
            </View>

            {/* Target Weight (if losing/gaining weight) */}
            {(selectedGoals.includes('lose_weight') || selectedGoals.includes('build_muscle')) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Target Weight</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.numberInput}
                    value={targetWeight}
                    onChangeText={setTargetWeight}
                    placeholder="0"
                    placeholderTextColor={COLORS.mediumGray}
                    keyboardType="numeric"
                    maxLength={3}
                  />
                  <Text style={styles.unitText}>kg</Text>
                </View>
              </View>
            )}

            {/* Weekly Workout Goal */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Weekly Workout Goal</Text>
              <Text style={styles.sectionSubtitle}>How many workouts do you aim for each week?</Text>
              <View style={styles.weeklyGoalRow}>
                {['3', '4', '5', '6', '7'].map(num => (
                  <TouchableOpacity
                    key={num}
                    style={[styles.weeklyGoalOption, weeklyWorkoutGoal === num && styles.weeklyGoalSelected]}
                    onPress={() => setWeeklyWorkoutGoal(num)}
                  >
                    <Text style={[styles.weeklyGoalText, weeklyWorkoutGoal === num && styles.weeklyGoalTextSelected]}>
                      {num}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Custom Goal */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Personal Goal (Optional)</Text>
              <Text style={styles.sectionSubtitle}>Anything specific you want to achieve?</Text>
              <TextInput
                style={styles.customGoalInput}
                value={customGoal}
                onChangeText={setCustomGoal}
                placeholder="e.g., Run a marathon, Do 50 pushups, Touch my toes..."
                placeholderTextColor={COLORS.mediumGray}
                multiline
                numberOfLines={3}
                maxLength={200}
              />
            </View>

            {/* Motivation */}
            <View style={styles.motivationBox}>
              <LinearGradient
                colors={[COLORS.accent, COLORS.accentSecondary]}
                style={styles.motivationGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="sparkles" size={24} color={COLORS.white} />
                <Text style={styles.motivationText}>
                  Setting clear goals increases your chances of success by 42%! You've got this! 💪
                </Text>
              </LinearGradient>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  headerGradient: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
  },
  closeButton: {
    padding: 4,
    width: 50,
  },
  saveButtonContainer: {
    width: 50,
    alignItems: 'flex-end',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.mediumGray,
    marginBottom: 16,
  },
  goalsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  goalCard: {
    width: '48%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.lightGray,
  },
  goalCardSelected: {
    backgroundColor: 'transparent',
  },
  goalCardInner: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 110,
  },
  goalCardGradient: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 110,
    position: 'relative',
  },
  goalIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: `${COLORS.accent}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  goalIconSelected: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  goalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  goalLabelSelected: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    textAlign: 'center',
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
    color: COLORS.text,
  },
  goalLabelSelected: {
    color: COLORS.accent,
  },
  goalDescription: {
    fontSize: 13,
    color: COLORS.mediumGray,
    marginTop: 2,
  },
  goalDescriptionSelected: {
    color: COLORS.text,
  },
  checkBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  numberInput: {
    width: 100,
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  unitText: {
    fontSize: 18,
    fontWeight: '500',
    color: COLORS.mediumGray,
  },
  weeklyGoalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  weeklyGoalOption: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    alignItems: 'center',
  },
  weeklyGoalSelected: {
    backgroundColor: COLORS.accent,
  },
  weeklyGoalText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  weeklyGoalTextSelected: {
    color: COLORS.white,
  },
  customGoalInput: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: COLORS.text,
    height: 80,
    textAlignVertical: 'top',
  },
  motivationBox: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  motivationGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  motivationText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.white,
    fontWeight: '500',
    lineHeight: 20,
  },
});
