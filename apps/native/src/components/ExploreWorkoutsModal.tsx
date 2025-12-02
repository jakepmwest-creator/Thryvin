import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  Image,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { useWorkoutStore } from '../stores/workout-store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  accent: '#A22BF6',
  accentSecondary: '#FF4EC7',
  white: '#ffffff',
  text: '#222222',
  lightGray: '#F8F9FA',
  mediumGray: '#8E8E93',
  success: '#34C759',
};

// Sample exercises by category
const EXERCISES_DATA: Record<string, Array<{
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  tips: string[];
  videoUrl?: string;
  sets?: number;
  reps?: string | number;
  restTime?: number;
}>> = {
  Strength: [
    { id: 's1', name: 'Barbell Bench Press', muscleGroup: 'Chest', equipment: 'Barbell, Bench', difficulty: 'Intermediate', description: 'Classic compound movement for building chest strength and size.', tips: ['Keep feet flat on floor', 'Arch your back slightly', 'Lower bar to mid-chest'] },
    { id: 's2', name: 'Deadlift', muscleGroup: 'Back, Legs', equipment: 'Barbell', difficulty: 'Advanced', description: 'The king of all lifts. Works your entire posterior chain.', tips: ['Keep back straight', 'Push through heels', 'Lock out at top'] },
    { id: 's3', name: 'Back Squat', muscleGroup: 'Legs, Core', equipment: 'Barbell, Squat Rack', difficulty: 'Intermediate', description: 'Fundamental lower body exercise for overall leg development.', tips: ['Knees track over toes', 'Break at hips first', 'Keep core tight'] },
    { id: 's4', name: 'Overhead Press', muscleGroup: 'Shoulders', equipment: 'Barbell/Dumbbells', difficulty: 'Intermediate', description: 'Build strong, powerful shoulders with this press.', tips: ['Brace core tight', 'Push head through at top', 'Control the descent'] },
    { id: 's5', name: 'Barbell Row', muscleGroup: 'Back', equipment: 'Barbell', difficulty: 'Intermediate', description: 'Build a thick, strong back with rows.', tips: ['Keep back flat', 'Pull to lower chest', 'Squeeze shoulder blades'] },
    { id: 's6', name: 'Pull-ups', muscleGroup: 'Back, Biceps', equipment: 'Pull-up Bar', difficulty: 'Intermediate', description: 'Master bodyweight back exercise.', tips: ['Full range of motion', 'No kipping', 'Chin over bar'] },
    { id: 's7', name: 'Dips', muscleGroup: 'Chest, Triceps', equipment: 'Dip Bars', difficulty: 'Intermediate', description: 'Upper body pushing strength builder.', tips: ['Lean forward for chest', 'Stay upright for triceps', 'Full depth'] },
    { id: 's8', name: 'Romanian Deadlift', muscleGroup: 'Hamstrings, Glutes', equipment: 'Barbell/Dumbbells', difficulty: 'Intermediate', description: 'Target your hamstrings and build hip hinge strength.', tips: ['Keep bar close', 'Soft knee bend', 'Feel hamstring stretch'] },
  ],
  HIIT: [
    { id: 'h1', name: 'Burpees', muscleGroup: 'Full Body', equipment: 'None', difficulty: 'Intermediate', description: 'The ultimate full-body cardio exercise.', tips: ['Land softly', 'Keep core engaged', 'Pace yourself'] },
    { id: 'h2', name: 'Mountain Climbers', muscleGroup: 'Core, Cardio', equipment: 'None', difficulty: 'Beginner', description: 'Get your heart rate up while working your core.', tips: ['Keep hips low', 'Drive knees fast', 'Breathe rhythmically'] },
    { id: 'h3', name: 'Jump Squats', muscleGroup: 'Legs', equipment: 'None', difficulty: 'Intermediate', description: 'Explosive lower body power exercise.', tips: ['Land softly', 'Full squat depth', 'Drive through heels'] },
    { id: 'h4', name: 'Box Jumps', muscleGroup: 'Legs, Power', equipment: 'Box', difficulty: 'Intermediate', description: 'Build explosive leg power.', tips: ['Swing arms for momentum', 'Land with soft knees', 'Step down, don\'t jump'] },
    { id: 'h5', name: 'Battle Ropes', muscleGroup: 'Arms, Core', equipment: 'Battle Ropes', difficulty: 'Beginner', description: 'High-intensity conditioning for upper body.', tips: ['Keep core tight', 'Move from shoulders', 'Stay in rhythm'] },
    { id: 'h6', name: 'Kettlebell Swings', muscleGroup: 'Full Body', equipment: 'Kettlebell', difficulty: 'Intermediate', description: 'Explosive hip hinge for power and conditioning.', tips: ['Hinge at hips', 'Snap hips forward', 'Arms are just guides'] },
  ],
  Cardio: [
    { id: 'c1', name: 'Running', muscleGroup: 'Legs, Cardio', equipment: 'None', difficulty: 'Beginner', description: 'Classic cardiovascular exercise.', tips: ['Start slow', 'Proper footwear', 'Stay hydrated'] },
    { id: 'c2', name: 'Cycling', muscleGroup: 'Legs, Cardio', equipment: 'Bike', difficulty: 'Beginner', description: 'Low-impact cardio that\'s easy on joints.', tips: ['Adjust seat height', 'Keep cadence steady', 'Vary intensity'] },
    { id: 'c3', name: 'Rowing Machine', muscleGroup: 'Full Body', equipment: 'Rower', difficulty: 'Beginner', description: 'Full body cardio with strength benefits.', tips: ['Push with legs first', 'Keep back straight', 'Smooth strokes'] },
    { id: 'c4', name: 'Jump Rope', muscleGroup: 'Full Body', equipment: 'Jump Rope', difficulty: 'Intermediate', description: 'Great for coordination and conditioning.', tips: ['Light bounces', 'Turn with wrists', 'Stay on balls of feet'] },
    { id: 'c5', name: 'Stair Climbing', muscleGroup: 'Legs, Cardio', equipment: 'Stairs/Machine', difficulty: 'Intermediate', description: 'Build leg strength while burning calories.', tips: ['Use handrails lightly', 'Full steps', 'Maintain posture'] },
  ],
  Flexibility: [
    { id: 'f1', name: 'Yoga Flow', muscleGroup: 'Full Body', equipment: 'Yoga Mat', difficulty: 'Beginner', description: 'Flowing sequence to improve flexibility and mindfulness.', tips: ['Focus on breath', 'Don\'t force stretches', 'Listen to your body'] },
    { id: 'f2', name: 'Pigeon Pose', muscleGroup: 'Hips', equipment: 'Yoga Mat', difficulty: 'Intermediate', description: 'Deep hip opener stretch.', tips: ['Square your hips', 'Use props if needed', 'Hold for 1-2 minutes'] },
    { id: 'f3', name: 'Hamstring Stretch', muscleGroup: 'Hamstrings', equipment: 'None', difficulty: 'Beginner', description: 'Essential for lower back health.', tips: ['Keep back straight', 'Bend from hips', 'Hold 30+ seconds'] },
    { id: 'f4', name: 'Cat-Cow Stretch', muscleGroup: 'Spine', equipment: 'Yoga Mat', difficulty: 'Beginner', description: 'Gentle spinal mobility exercise.', tips: ['Sync with breath', 'Full range of motion', 'Move slowly'] },
  ],
  Mobility: [
    { id: 'm1', name: '90/90 Hip Stretch', muscleGroup: 'Hips', equipment: 'None', difficulty: 'Beginner', description: 'Improve hip internal and external rotation.', tips: ['Keep torso upright', 'Breathe into tight spots', 'Hold each side 1-2 min'] },
    { id: 'm2', name: 'Thoracic Rotations', muscleGroup: 'Spine', equipment: 'None', difficulty: 'Beginner', description: 'Open up your upper back.', tips: ['Keep hips stable', 'Rotate from mid-back', 'Follow hand with eyes'] },
    { id: 'm3', name: 'Ankle Circles', muscleGroup: 'Ankles', equipment: 'None', difficulty: 'Beginner', description: 'Improve ankle mobility for squats and running.', tips: ['Full circles both directions', 'Control the movement', '10 each way'] },
    { id: 'm4', name: 'World\'s Greatest Stretch', muscleGroup: 'Full Body', equipment: 'None', difficulty: 'Intermediate', description: 'Dynamic stretch hitting multiple areas.', tips: ['Lunge deep', 'Rotate through thoracic', 'Hold briefly at each position'] },
  ],
  Conditioning: [
    { id: 'co1', name: 'Farmer\'s Walk', muscleGroup: 'Full Body', equipment: 'Dumbbells/Kettlebells', difficulty: 'Beginner', description: 'Build grip strength and core stability.', tips: ['Stand tall', 'Take steady steps', 'Brace your core'] },
    { id: 'co2', name: 'Sled Push', muscleGroup: 'Legs, Core', equipment: 'Sled', difficulty: 'Intermediate', description: 'Build leg drive and conditioning.', tips: ['Drive through legs', 'Keep arms straight', 'Stay low'] },
    { id: 'co3', name: 'Med Ball Slams', muscleGroup: 'Core, Power', equipment: 'Medicine Ball', difficulty: 'Beginner', description: 'Release stress while building power.', tips: ['Use whole body', 'Slam hard', 'Catch on bounce'] },
    { id: 'co4', name: 'Prowler Push', muscleGroup: 'Full Body', equipment: 'Prowler', difficulty: 'Advanced', description: 'Ultimate conditioning tool.', tips: ['Start light', 'Stay low', 'Drive through balls of feet'] },
  ],
};

interface ExploreWorkoutsModalProps {
  visible: boolean;
  onClose: () => void;
  category: string;
  categoryGradient: string[];
}

const ExerciseCard = ({ exercise, onPress }: { exercise: typeof EXERCISES_DATA['Strength'][0]; onPress: () => void }) => (
  <TouchableOpacity style={styles.exerciseCard} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.exerciseIcon}>
      <Ionicons name="barbell" size={24} color={COLORS.accent} />
    </View>
    <View style={styles.exerciseInfo}>
      <Text style={styles.exerciseName}>{exercise.name}</Text>
      <Text style={styles.exerciseMeta}>
        {exercise.muscleGroup} • {exercise.difficulty}
      </Text>
    </View>
    <View style={[
      styles.difficultyBadge, 
      exercise.difficulty === 'Beginner' && styles.difficultyBeginner,
      exercise.difficulty === 'Advanced' && styles.difficultyAdvanced,
    ]}>
      <Text style={[
        styles.difficultyText,
        exercise.difficulty === 'Beginner' && styles.difficultyTextBeginner,
        exercise.difficulty === 'Advanced' && styles.difficultyTextAdvanced,
      ]}>
        {exercise.difficulty}
      </Text>
    </View>
  </TouchableOpacity>
);

export const ExploreWorkoutsModal = ({ visible, onClose, category, categoryGradient }: ExploreWorkoutsModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<(typeof EXERCISES_DATA)['Strength'][0] | null>(null);
  const [filterDifficulty, setFilterDifficulty] = useState<'All' | 'Beginner' | 'Intermediate' | 'Advanced'>('All');
  
  // Get real exercises from the workout store
  const { weekWorkouts } = useWorkoutStore();
  
  // Extract unique exercises from weekWorkouts that match the category
  const realExercises = useMemo(() => {
    const exerciseMap = new Map<string, any>();
    
    // Map category to workout types
    const categoryTypeMap: Record<string, string[]> = {
      'Strength': ['upper', 'lower', 'strength', 'full body', 'push', 'pull', 'legs'],
      'HIIT': ['hiit', 'circuit', 'conditioning', 'interval'],
      'Cardio': ['cardio', 'endurance', 'running', 'cycling'],
      'Flexibility': ['stretch', 'flexibility', 'yoga', 'cooldown', 'recovery'],
      'Mobility': ['mobility', 'warmup', 'warm-up', 'activation'],
      'Conditioning': ['conditioning', 'metabolic', 'circuit', 'finisher'],
    };
    
    const matchTypes = categoryTypeMap[category] || [];
    
    weekWorkouts.forEach(workout => {
      // Check if workout type matches category
      const workoutType = workout.type?.toLowerCase() || '';
      const workoutTitle = workout.title?.toLowerCase() || '';
      const isMatchingCategory = matchTypes.some(t => 
        workoutType.includes(t) || workoutTitle.includes(t)
      ) || category === 'Strength'; // Default to showing in Strength
      
      if (isMatchingCategory && workout.exercises) {
        workout.exercises.forEach((ex: any) => {
          if (!exerciseMap.has(ex.name)) {
            exerciseMap.set(ex.name, {
              id: ex.id || ex.name.replace(/\s+/g, '_'),
              name: ex.name,
              muscleGroup: ex.targetMuscles || 'Full Body',
              equipment: ex.equipment || 'Various',
              difficulty: ex.difficulty || 'Intermediate',
              description: ex.instructions || `Perform ${ex.name} with proper form.`,
              tips: ex.tips || ['Focus on form', 'Control the movement', 'Breathe steadily'],
              videoUrl: ex.videoUrl,
              sets: ex.sets,
              reps: ex.reps,
              restTime: ex.restTime,
            });
          }
        });
      }
    });
    
    return Array.from(exerciseMap.values());
  }, [weekWorkouts, category]);
  
  // Combine real exercises with static data, prioritizing real ones
  const exercises = useMemo(() => {
    const staticExercises = EXERCISES_DATA[category] || [];
    if (realExercises.length > 0) {
      // Merge: real exercises first, then static ones not already present
      const existingNames = new Set(realExercises.map(e => e.name.toLowerCase()));
      const uniqueStatic = staticExercises.filter(e => !existingNames.has(e.name.toLowerCase()));
      return [...realExercises, ...uniqueStatic];
    }
    return staticExercises;
  }, [realExercises, category]);
  
  const filteredExercises = useMemo(() => {
    return exercises.filter(ex => {
      const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           ex.muscleGroup.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDifficulty = filterDifficulty === 'All' || ex.difficulty === filterDifficulty;
      return matchesSearch && matchesDifficulty;
    });
  }, [exercises, searchQuery, filterDifficulty]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <LinearGradient
            colors={categoryGradient as any}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>{category}</Text>
              <Text style={styles.headerSubtitle}>{exercises.length} exercises</Text>
            </View>
          </LinearGradient>
          
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={COLORS.mediumGray} />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search ${category.toLowerCase()} exercises...`}
              placeholderTextColor={COLORS.mediumGray}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={COLORS.mediumGray} />
              </TouchableOpacity>
            )}
          </View>
          
          {/* Difficulty Filter */}
          <View style={styles.filterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {(['All', 'Beginner', 'Intermediate', 'Advanced'] as const).map(level => (
                <TouchableOpacity
                  key={level}
                  style={[styles.filterChip, filterDifficulty === level && styles.filterChipActive]}
                  onPress={() => setFilterDifficulty(level)}
                >
                  <Text style={[styles.filterChipText, filterDifficulty === level && styles.filterChipTextActive]}>
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          {/* Exercise List */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {filteredExercises.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="search" size={48} color={COLORS.lightGray} />
                <Text style={styles.emptyStateText}>No exercises found</Text>
              </View>
            ) : (
              filteredExercises.map(exercise => (
                <ExerciseCard 
                  key={exercise.id} 
                  exercise={exercise} 
                  onPress={() => setSelectedExercise(exercise)}
                />
              ))
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
          
          {/* Exercise Detail Modal */}
          {selectedExercise && (
            <Modal visible={!!selectedExercise} animationType="slide" transparent>
              <View style={styles.detailOverlay}>
                <View style={styles.detailContainer}>
                  <TouchableOpacity 
                    style={styles.detailClose} 
                    onPress={() => setSelectedExercise(null)}
                  >
                    <Ionicons name="close" size={24} color={COLORS.mediumGray} />
                  </TouchableOpacity>
                  
                  {/* Exercise header */}
                  <LinearGradient
                    colors={categoryGradient as any}
                    style={styles.detailHeader}
                  >
                    <View style={styles.detailIconLarge}>
                      <Ionicons name="barbell" size={40} color={COLORS.white} />
                    </View>
                  </LinearGradient>
                  
                  <ScrollView style={styles.detailContent}>
                    <Text style={styles.detailTitle}>{selectedExercise.name}</Text>
                    
                    <View style={styles.detailMeta}>
                      <View style={styles.detailMetaItem}>
                        <Ionicons name="body" size={16} color={COLORS.accent} />
                        <Text style={styles.detailMetaText}>{selectedExercise.muscleGroup}</Text>
                      </View>
                      <View style={styles.detailMetaItem}>
                        <Ionicons name="fitness" size={16} color={COLORS.accent} />
                        <Text style={styles.detailMetaText}>{selectedExercise.equipment}</Text>
                      </View>
                      <View style={styles.detailMetaItem}>
                        <Ionicons name="speedometer" size={16} color={COLORS.accent} />
                        <Text style={styles.detailMetaText}>{selectedExercise.difficulty}</Text>
                      </View>
                    </View>
                    
                    <Text style={styles.detailDescription}>{selectedExercise.description}</Text>
                    
                    {/* Video player or placeholder */}
                    {selectedExercise.videoUrl ? (
                      <View style={styles.videoContainer}>
                        <Video
                          source={{ uri: selectedExercise.videoUrl }}
                          style={styles.videoPlayer}
                          useNativeControls
                          resizeMode={ResizeMode.CONTAIN}
                          isLooping
                          shouldPlay={false}
                        />
                      </View>
                    ) : (
                      <View style={styles.videoPlaceholder}>
                        <LinearGradient
                          colors={['#1a1a1a', '#333']}
                          style={styles.videoGradient}
                        >
                          <Ionicons name="play-circle" size={64} color="rgba(255,255,255,0.8)" />
                          <Text style={styles.videoText}>Video coming soon</Text>
                        </LinearGradient>
                      </View>
                    )}
                    
                    {/* Exercise details */}
                    {(selectedExercise.sets || selectedExercise.reps) && (
                      <View style={styles.exerciseDetails}>
                        {selectedExercise.sets && (
                          <View style={styles.detailChip}>
                            <Ionicons name="repeat" size={16} color={COLORS.accent} />
                            <Text style={styles.detailChipText}>{selectedExercise.sets} sets</Text>
                          </View>
                        )}
                        {selectedExercise.reps && (
                          <View style={styles.detailChip}>
                            <Ionicons name="fitness" size={16} color={COLORS.accent} />
                            <Text style={styles.detailChipText}>{selectedExercise.reps} reps</Text>
                          </View>
                        )}
                        {selectedExercise.restTime && (
                          <View style={styles.detailChip}>
                            <Ionicons name="timer" size={16} color={COLORS.accent} />
                            <Text style={styles.detailChipText}>{selectedExercise.restTime}s rest</Text>
                          </View>
                        )}
                      </View>
                    )}
                    
                    <Text style={styles.tipsTitle}>Pro Tips</Text>
                    {selectedExercise.tips.map((tip, index) => (
                      <View key={index} style={styles.tipItem}>
                        <View style={styles.tipBullet}>
                          <Text style={styles.tipBulletText}>{index + 1}</Text>
                        </View>
                        <Text style={styles.tipText}>{tip}</Text>
                      </View>
                    ))}
                    
                    <TouchableOpacity style={styles.addToWorkoutButton}>
                      <LinearGradient
                        colors={[COLORS.accent, COLORS.accentSecondary]}
                        style={styles.addButtonGradient}
                      >
                        <Ionicons name="add-circle" size={20} color={COLORS.white} />
                        <Text style={styles.addButtonText}>Add to Today's Workout</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    
                    <View style={{ height: 40 }} />
                  </ScrollView>
                </View>
              </View>
            </Modal>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  container: { flex: 1, backgroundColor: COLORS.white, marginTop: 50, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
  
  header: { padding: 20, paddingTop: 16 },
  closeButton: { position: 'absolute', top: 16, right: 16, zIndex: 10, padding: 4 },
  headerContent: { marginTop: 8 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: COLORS.white, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, margin: 16, marginBottom: 8, borderRadius: 12, paddingHorizontal: 14, gap: 10 },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: 16, color: COLORS.text },
  
  filterContainer: { paddingHorizontal: 16, paddingBottom: 12 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: COLORS.lightGray, borderRadius: 20, marginRight: 10 },
  filterChipActive: { backgroundColor: COLORS.accent },
  filterChipText: { fontSize: 14, fontWeight: '500', color: COLORS.text },
  filterChipTextActive: { color: COLORS.white },
  
  content: { flex: 1, paddingHorizontal: 16 },
  
  exerciseCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, borderRadius: 16, padding: 16, marginBottom: 12 },
  exerciseIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: `${COLORS.accent}15`, justifyContent: 'center', alignItems: 'center' },
  exerciseInfo: { flex: 1, marginLeft: 14 },
  exerciseName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  exerciseMeta: { fontSize: 13, color: COLORS.mediumGray, marginTop: 2 },
  difficultyBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: '#FFF3E0' },
  difficultyBeginner: { backgroundColor: '#E8F5E9' },
  difficultyAdvanced: { backgroundColor: '#FFEBEE' },
  difficultyText: { fontSize: 11, fontWeight: '600', color: '#E65100' },
  difficultyTextBeginner: { color: '#2E7D32' },
  difficultyTextAdvanced: { color: '#C62828' },
  
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyStateText: { fontSize: 16, color: COLORS.mediumGray, marginTop: 12 },
  
  // Detail modal
  detailOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  detailContainer: { backgroundColor: COLORS.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '90%' },
  detailClose: { position: 'absolute', top: 16, right: 16, zIndex: 10, padding: 4 },
  detailHeader: { height: 120, justifyContent: 'center', alignItems: 'center' },
  detailIconLarge: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  detailContent: { padding: 20 },
  detailTitle: { fontSize: 24, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  detailMeta: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 16, marginTop: 16, marginBottom: 20 },
  detailMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailMetaText: { fontSize: 14, color: COLORS.mediumGray },
  detailDescription: { fontSize: 15, color: COLORS.text, lineHeight: 22, textAlign: 'center', marginBottom: 20 },
  
  videoPlaceholder: { borderRadius: 16, overflow: 'hidden', marginBottom: 24 },
  videoGradient: { height: 180, justifyContent: 'center', alignItems: 'center' },
  videoText: { color: 'rgba(255,255,255,0.6)', marginTop: 12, fontSize: 14 },
  videoContainer: { borderRadius: 16, overflow: 'hidden', marginBottom: 24, backgroundColor: '#000' },
  videoPlayer: { width: '100%', height: 200 },
  
  exerciseDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20, justifyContent: 'center' },
  detailChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: `${COLORS.accent}10`, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 6 },
  detailChipText: { fontSize: 14, fontWeight: '600', color: COLORS.accent },
  
  tipsTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  tipItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 12 },
  tipBullet: { width: 24, height: 24, borderRadius: 12, backgroundColor: `${COLORS.accent}15`, justifyContent: 'center', alignItems: 'center' },
  tipBulletText: { fontSize: 12, fontWeight: '700', color: COLORS.accent },
  tipText: { flex: 1, fontSize: 15, color: COLORS.text, lineHeight: 22 },
  
  addToWorkoutButton: { marginTop: 20, borderRadius: 16, overflow: 'hidden' },
  addButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  addButtonText: { fontSize: 16, fontWeight: '600', color: COLORS.white },
});
