import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../stores/auth-store';
import { useWorkoutStore } from '../stores/workout-store';
import { CustomAlert } from './CustomAlert';

const COLORS = {
  accent: '#A22BF6',
  accentSecondary: '#FF4EC7',
  white: '#ffffff',
  text: '#222222',
  lightGray: '#F8F9FA',
  mediumGray: '#8E8E93',
  success: '#34C759',
  warning: '#FF9500',
};

interface WorkoutPreferencesModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
}

const EXPERIENCE_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
const TRAINING_TYPES = ['Strength', 'Cardio', 'HIIT', 'Flexibility', 'Mixed'];
const EQUIPMENT_OPTIONS = ['Full Gym', 'Dumbbells', 'Bodyweight', 'Resistance Bands', 'Kettlebells', 'Barbell'];
const COMMON_INJURIES = ['Lower Back', 'Knee', 'Shoulder', 'Wrist', 'Ankle', 'Neck', 'Hip'];

const SelectOption = ({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) => (
  <TouchableOpacity 
    style={[styles.optionChip, selected && styles.optionChipSelected]} 
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{label}</Text>
    {selected && <Ionicons name="checkmark" size={16} color={COLORS.white} />}
  </TouchableOpacity>
);

export const WorkoutPreferencesModal = ({ visible, onClose, onSave }: WorkoutPreferencesModalProps) => {
  const { user } = useAuthStore();
  const { resetProgram, forceRegenerateWeek } = useWorkoutStore();
  
  const [experience, setExperience] = useState(user?.experience || 'Intermediate');
  const [trainingType, setTrainingType] = useState(user?.trainingType || 'Mixed');
  const [equipment, setEquipment] = useState<string[]>(user?.equipment || ['Full Gym']);
  const [injuries, setInjuries] = useState<string[]>(user?.injuries || []);
  const [trainingDays, setTrainingDays] = useState(user?.trainingDays?.toString() || '4');
  const [sessionDuration, setSessionDuration] = useState(user?.sessionDuration?.toString() || '45');
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalPrefs, setOriginalPrefs] = useState<any>(null);

  // Training focus switches
  const [focusStrength, setFocusStrength] = useState(true);
  const [focusCardio, setFocusCardio] = useState(false);
  const [focusFlexibility, setFocusFlexibility] = useState(false);
  
  // Alert state
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    buttons?: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const showAlert = (config: Omit<typeof alertConfig, 'visible'>) => {
    setAlertConfig({ ...config, visible: true });
  };

  const hideAlert = () => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  };

  useEffect(() => {
    loadPreferences();
  }, [visible]);

  const loadPreferences = async () => {
    try {
      const savedPrefs = await AsyncStorage.getItem('workout_preferences');
      if (savedPrefs) {
        const prefs = JSON.parse(savedPrefs);
        setExperience(prefs.experience || experience);
        setTrainingType(prefs.trainingType || trainingType);
        setEquipment(prefs.equipment || equipment);
        setInjuries(prefs.injuries || injuries);
        setTrainingDays(prefs.trainingDays || trainingDays);
        setSessionDuration(prefs.sessionDuration || sessionDuration);
        setFocusStrength(prefs.focusStrength ?? true);
        setFocusCardio(prefs.focusCardio ?? false);
        setFocusFlexibility(prefs.focusFlexibility ?? false);
        setOriginalPrefs(prefs);
      } else {
        setOriginalPrefs({
          experience, trainingType, equipment, injuries, 
          trainingDays, sessionDuration, focusStrength, focusCardio, focusFlexibility
        });
      }
      setHasChanges(false);
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  // Track changes
  useEffect(() => {
    if (originalPrefs) {
      const changed = 
        experience !== originalPrefs.experience ||
        trainingType !== originalPrefs.trainingType ||
        JSON.stringify(equipment) !== JSON.stringify(originalPrefs.equipment) ||
        JSON.stringify(injuries) !== JSON.stringify(originalPrefs.injuries) ||
        trainingDays !== originalPrefs.trainingDays ||
        sessionDuration !== originalPrefs.sessionDuration ||
        focusStrength !== originalPrefs.focusStrength ||
        focusCardio !== originalPrefs.focusCardio ||
        focusFlexibility !== originalPrefs.focusFlexibility;
      setHasChanges(changed);
    }
  }, [experience, trainingType, equipment, injuries, trainingDays, sessionDuration, focusStrength, focusCardio, focusFlexibility, originalPrefs]);

  const toggleEquipment = (item: string) => {
    setEquipment(prev => 
      prev.includes(item) 
        ? prev.filter(e => e !== item)
        : [...prev, item]
    );
  };

  const toggleInjury = (item: string) => {
    setInjuries(prev => 
      prev.includes(item) 
        ? prev.filter(e => e !== item)
        : [...prev, item]
    );
  };

  const handleSave = async () => {
    if (!hasChanges) {
      onClose();
      return;
    }
    
    // Show confirmation dialog
    showAlert({
      type: 'info',
      title: 'Update Preferences?',
      message: 'Changing your preferences will regenerate your workout program to match your new settings. Your current progress will be saved.\n\nDo you want to continue?',
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: hideAlert },
        { 
          text: 'Update & Regenerate', 
          style: 'default', 
          onPress: () => {
            hideAlert();
            saveAndRegenerate();
          }
        },
      ]
    });
  };
  
  const saveAndRegenerate = async () => {
    setIsSaving(true);
    setIsRegenerating(true);
    
    try {
      const preferences = {
        experience,
        trainingType,
        equipment,
        injuries,
        trainingDays,
        sessionDuration,
        focusStrength,
        focusCardio,
        focusFlexibility,
        updatedAt: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem('workout_preferences', JSON.stringify(preferences));
      
      // Regenerate workouts with new preferences
      await forceRegenerateWeek();
      
      setOriginalPrefs(preferences);
      setHasChanges(false);
      
      showAlert({
        type: 'success',
        title: 'Preferences Updated! 🎯',
        message: 'Your workout program has been regenerated with your new preferences. Check out your updated workouts!',
        buttons: [{ text: 'Awesome!', onPress: () => { hideAlert(); onSave(); onClose(); } }]
      });
    } catch (error) {
      showAlert({
        type: 'error',
        title: 'Error',
        message: 'Failed to update preferences. Please try again.',
        buttons: [{ text: 'OK', onPress: hideAlert }]
      });
    } finally {
      setIsSaving(false);
      setIsRegenerating(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} disabled={isSaving}>
              <Ionicons name="close" size={24} color={COLORS.mediumGray} />
            </TouchableOpacity>
            <Text style={styles.title}>Workout Preferences</Text>
            <TouchableOpacity onPress={handleSave} disabled={isSaving || !hasChanges}>
              <Text style={[
                styles.saveButton, 
                (isSaving || !hasChanges) && { opacity: 0.5 }
              ]}>
                {isSaving ? 'Saving...' : hasChanges ? 'Save' : 'Done'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Regenerating indicator */}
          {isRegenerating && (
            <View style={styles.regeneratingBanner}>
              <ActivityIndicator size="small" color={COLORS.white} />
              <Text style={styles.regeneratingText}>Regenerating your workouts...</Text>
            </View>
          )}

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Experience Level */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Experience Level</Text>
              <View style={styles.optionsRow}>
                {EXPERIENCE_LEVELS.map(level => (
                  <SelectOption 
                    key={level} 
                    label={level} 
                    selected={experience === level}
                    onPress={() => setExperience(level)}
                  />
                ))}
              </View>
            </View>

            {/* Training Type */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Primary Training Type</Text>
              <View style={styles.optionsRow}>
                {TRAINING_TYPES.map(type => (
                  <SelectOption 
                    key={type} 
                    label={type} 
                    selected={trainingType === type}
                    onPress={() => setTrainingType(type)}
                  />
                ))}
              </View>
            </View>

            {/* Training Focus */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Training Focus</Text>
              <Text style={styles.sectionSubtitle}>What do you want to focus on more?</Text>
              <View style={styles.toggleRow}>
                <View style={styles.toggleItem}>
                  <View style={styles.toggleLabel}>
                    <Ionicons name="barbell" size={20} color={COLORS.accent} />
                    <Text style={styles.toggleText}>Strength Training</Text>
                  </View>
                  <Switch
                    value={focusStrength}
                    onValueChange={setFocusStrength}
                    trackColor={{ false: COLORS.lightGray, true: `${COLORS.accent}40` }}
                    thumbColor={focusStrength ? COLORS.accent : COLORS.mediumGray}
                  />
                </View>
                <View style={styles.toggleItem}>
                  <View style={styles.toggleLabel}>
                    <Ionicons name="heart" size={20} color={COLORS.accent} />
                    <Text style={styles.toggleText}>Cardio</Text>
                  </View>
                  <Switch
                    value={focusCardio}
                    onValueChange={setFocusCardio}
                    trackColor={{ false: COLORS.lightGray, true: `${COLORS.accent}40` }}
                    thumbColor={focusCardio ? COLORS.accent : COLORS.mediumGray}
                  />
                </View>
                <View style={styles.toggleItem}>
                  <View style={styles.toggleLabel}>
                    <Ionicons name="body" size={20} color={COLORS.accent} />
                    <Text style={styles.toggleText}>Flexibility & Mobility</Text>
                  </View>
                  <Switch
                    value={focusFlexibility}
                    onValueChange={setFocusFlexibility}
                    trackColor={{ false: COLORS.lightGray, true: `${COLORS.accent}40` }}
                    thumbColor={focusFlexibility ? COLORS.accent : COLORS.mediumGray}
                  />
                </View>
              </View>
            </View>

            {/* Training Days */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Training Days per Week</Text>
              <View style={styles.optionsRow}>
                {['3', '4', '5', '6', '7'].map(days => (
                  <SelectOption 
                    key={days} 
                    label={days} 
                    selected={trainingDays === days}
                    onPress={() => setTrainingDays(days)}
                  />
                ))}
              </View>
            </View>

            {/* Session Duration */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Preferred Session Duration</Text>
              <View style={styles.optionsRow}>
                {['30', '45', '60', '75', '90'].map(mins => (
                  <SelectOption 
                    key={mins} 
                    label={`${mins} min`} 
                    selected={sessionDuration === mins}
                    onPress={() => setSessionDuration(mins)}
                  />
                ))}
              </View>
            </View>

            {/* Available Equipment */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Available Equipment</Text>
              <Text style={styles.sectionSubtitle}>Select all that apply</Text>
              <View style={styles.optionsRow}>
                {EQUIPMENT_OPTIONS.map(item => (
                  <SelectOption 
                    key={item} 
                    label={item} 
                    selected={equipment.includes(item)}
                    onPress={() => toggleEquipment(item)}
                  />
                ))}
              </View>
            </View>

            {/* Injuries/Limitations */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Current Injuries or Limitations</Text>
              <Text style={styles.sectionSubtitle}>We'll adjust exercises accordingly</Text>
              <View style={styles.optionsRow}>
                {COMMON_INJURIES.map(injury => (
                  <SelectOption 
                    key={injury} 
                    label={injury} 
                    selected={injuries.includes(injury)}
                    onPress={() => toggleInjury(injury)}
                  />
                ))}
              </View>
              {injuries.length > 0 && (
                <View style={styles.warningBox}>
                  <Ionicons name="alert-circle" size={20} color={COLORS.warning} />
                  <Text style={styles.warningText}>
                    AI will avoid exercises that stress your {injuries.join(', ').toLowerCase()}
                  </Text>
                </View>
              )}
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
      
      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons || [{ text: 'OK' }]}
        onClose={hideAlert}
      />
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.accent,
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
    marginBottom: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    gap: 6,
  },
  optionChipSelected: {
    backgroundColor: COLORS.accent,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  optionTextSelected: {
    color: COLORS.white,
  },
  toggleRow: {
    marginTop: 8,
    gap: 12,
  },
  toggleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    padding: 16,
    borderRadius: 12,
  },
  toggleLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.warning}15`,
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
    gap: 10,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.warning,
  },
});
