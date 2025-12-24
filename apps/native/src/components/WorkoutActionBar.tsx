/**
 * WorkoutActionBar - Simplified fixed action bar
 * 
 * Contains exactly 3 actions:
 * 1) Edit - edit all exercises in workout
 * 2) Add - open exercise picker with search
 * 3) Remove - enable tap-to-remove mode
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

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
  white: '#FFFFFF',
  danger: '#FF3B30',
};

interface Props {
  onEditWorkout: () => void;
  onAddExercise: (exercise: any) => void;
  removeMode: boolean;
  onToggleRemoveMode: () => void;
  exerciseDatabase?: any[];
}

// Sample exercises for search (will be replaced with real database)
const SAMPLE_EXERCISES = [
  { id: 'bench', name: 'Bench Press', muscle: 'Chest', equipment: 'Barbell' },
  { id: 'squat', name: 'Back Squat', muscle: 'Legs', equipment: 'Barbell' },
  { id: 'deadlift', name: 'Deadlift', muscle: 'Back', equipment: 'Barbell' },
  { id: 'row', name: 'Bent Over Row', muscle: 'Back', equipment: 'Barbell' },
  { id: 'ohp', name: 'Overhead Press', muscle: 'Shoulders', equipment: 'Barbell' },
  { id: 'pullup', name: 'Pull Ups', muscle: 'Back', equipment: 'Bodyweight' },
  { id: 'dips', name: 'Dips', muscle: 'Chest', equipment: 'Bodyweight' },
  { id: 'lunge', name: 'Lunges', muscle: 'Legs', equipment: 'Bodyweight' },
  { id: 'curl', name: 'Bicep Curls', muscle: 'Arms', equipment: 'Dumbbells' },
  { id: 'tricep', name: 'Tricep Pushdown', muscle: 'Arms', equipment: 'Cable' },
  { id: 'latpull', name: 'Lat Pulldown', muscle: 'Back', equipment: 'Cable' },
  { id: 'legpress', name: 'Leg Press', muscle: 'Legs', equipment: 'Machine' },
  { id: 'legcurl', name: 'Leg Curl', muscle: 'Legs', equipment: 'Machine' },
  { id: 'legext', name: 'Leg Extension', muscle: 'Legs', equipment: 'Machine' },
  { id: 'calf', name: 'Calf Raises', muscle: 'Legs', equipment: 'Machine' },
  { id: 'chest-fly', name: 'Cable Chest Fly', muscle: 'Chest', equipment: 'Cable' },
  { id: 'face-pull', name: 'Face Pulls', muscle: 'Shoulders', equipment: 'Cable' },
  { id: 'plank', name: 'Plank', muscle: 'Core', equipment: 'Bodyweight' },
  { id: 'crunch', name: 'Crunches', muscle: 'Core', equipment: 'Bodyweight' },
  { id: 'russian', name: 'Russian Twists', muscle: 'Core', equipment: 'Bodyweight' },
];

export function WorkoutActionBar({
  onEditWorkout,
  onAddExercise,
  removeMode,
  onToggleRemoveMode,
  exerciseDatabase = SAMPLE_EXERCISES,
}: Props) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fuzzy search function
  const searchExercises = (query: string) => {
    if (!query.trim()) return exerciseDatabase.slice(0, 20);
    
    const normalizedQuery = query.toLowerCase().trim();
    const words = normalizedQuery.split(/\s+/);
    
    return exerciseDatabase
      .filter((exercise: any) => {
        const name = (exercise.name || '').toLowerCase();
        const muscle = (exercise.muscle || exercise.targetMuscle || '').toLowerCase();
        const equipment = (exercise.equipment || '').toLowerCase();
        const searchText = `${name} ${muscle} ${equipment}`;
        
        // Check if all words are found in the search text
        return words.every(word => searchText.includes(word));
      })
      .slice(0, 30);
  };

  const filteredExercises = searchExercises(searchQuery);

  const handleSelectExercise = (exercise: any) => {
    onAddExercise(exercise);
    setShowAddModal(false);
    setSearchQuery('');
  };

  return (
    <>
      <View style={styles.container}>
        {/* Edit Button */}
        <TouchableOpacity style={styles.actionButton} onPress={onEditWorkout}>
          <View style={[styles.iconContainer, styles.editIcon]}>
            <Ionicons name="create-outline" size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>

        {/* Add Button */}
        <TouchableOpacity style={styles.actionButton} onPress={() => setShowAddModal(true)}>
          <View style={[styles.iconContainer, styles.addIcon]}>
            <Ionicons name="add" size={22} color={COLORS.primary} />
          </View>
          <Text style={styles.actionText}>Add</Text>
        </TouchableOpacity>

        {/* Remove Button */}
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={onToggleRemoveMode}
        >
          <View style={[
            styles.iconContainer, 
            styles.removeIcon,
            removeMode && styles.removeIconActive
          ]}>
            <Ionicons 
              name={removeMode ? "close" : "trash-outline"} 
              size={20} 
              color={removeMode ? COLORS.white : COLORS.danger} 
            />
          </View>
          <Text style={[styles.actionText, removeMode && styles.removeTextActive]}>
            {removeMode ? 'Done' : 'Remove'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Add Exercise Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Exercise</Text>
            <View style={{ width: 60 }} />
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={COLORS.mediumGray} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search exercises..."
              placeholderTextColor={COLORS.mediumGray}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={COLORS.mediumGray} />
              </TouchableOpacity>
            )}
          </View>

          {/* Exercise List */}
          <FlatList
            data={filteredExercises}
            keyExtractor={(item) => item.id || item.name}
            keyboardShouldPersistTaps="handled"
            onScrollBeginDrag={Keyboard.dismiss}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.exerciseItem}
                onPress={() => handleSelectExercise(item)}
              >
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{item.name}</Text>
                  <Text style={styles.exerciseMeta}>
                    {item.muscle || item.targetMuscle} • {item.equipment}
                  </Text>
                </View>
                <Ionicons name="add-circle" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={48} color={COLORS.mediumGray} />
                <Text style={styles.emptyText}>No exercises found</Text>
                <Text style={styles.emptySubtext}>Try a different search term</Text>
              </View>
            }
            contentContainerStyle={styles.listContent}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    gap: 6,
    minWidth: 70,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editIcon: {
    backgroundColor: COLORS.primary + '15',
  },
  addIcon: {
    backgroundColor: COLORS.primary + '15',
  },
  removeIcon: {
    backgroundColor: COLORS.danger + '15',
  },
  removeIconActive: {
    backgroundColor: COLORS.danger,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  removeTextActive: {
    color: COLORS.danger,
    fontWeight: '700',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  cancelText: {
    fontSize: 16,
    color: COLORS.primary,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  exerciseMeta: {
    fontSize: 13,
    color: COLORS.mediumGray,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.mediumGray,
    marginTop: 4,
  },
});

export default WorkoutActionBar;
