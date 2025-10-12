// Enhanced Exercise Library for Dynamic Workout Generation
export interface Exercise {
  id: string;
  name: string;
  muscleGroups: string[];
  equipment: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  style: string[];
  duration?: number; // for time-based exercises
  instructions: string;
  modifications?: string;
  targetReps?: { min: number; max: number };
  targetSets?: { min: number; max: number };
  restTime?: number; // seconds
}

export const exerciseLibrary: Exercise[] = [
  // HIIT/Cardio Exercises
  {
    id: 'jumping_jacks',
    name: 'Jumping Jacks',
    muscleGroups: ['full-body', 'cardio'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    style: ['hiit', 'cardio', 'warmup'],
    duration: 30,
    instructions: 'Jump feet apart while raising arms overhead, then jump back to starting position',
    modifications: 'Step side to side instead of jumping',
    targetReps: { min: 20, max: 40 },
    targetSets: { min: 3, max: 5 },
    restTime: 15
  },
  {
    id: 'mountain_climbers',
    name: 'Mountain Climbers',
    muscleGroups: ['core', 'shoulders', 'cardio'],
    equipment: ['bodyweight'],
    difficulty: 'intermediate',
    style: ['hiit', 'cardio', 'core'],
    duration: 30,
    instructions: 'Start in plank position, alternate bringing knees to chest rapidly',
    modifications: 'Slow the pace or step feet instead of running',
    targetReps: { min: 20, max: 60 },
    targetSets: { min: 3, max: 4 },
    restTime: 20
  },
  {
    id: 'burpees',
    name: 'Burpees',
    muscleGroups: ['full-body', 'cardio'],
    equipment: ['bodyweight'],
    difficulty: 'advanced',
    style: ['hiit', 'cardio', 'strength'],
    instructions: 'Squat down, jump back to plank, do push-up, jump feet forward, jump up with arms overhead',
    modifications: 'Step back instead of jumping, skip the push-up',
    targetReps: { min: 5, max: 15 },
    targetSets: { min: 3, max: 5 },
    restTime: 30
  },
  {
    id: 'high_knees',
    name: 'High Knees',
    muscleGroups: ['legs', 'cardio'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    style: ['hiit', 'cardio', 'warmup'],
    duration: 30,
    instructions: 'Run in place bringing knees up to hip level',
    modifications: 'March in place with lower knee lift',
    targetReps: { min: 30, max: 60 },
    targetSets: { min: 3, max: 4 },
    restTime: 15
  },

  // Upper Body Exercises
  {
    id: 'push_ups',
    name: 'Push-ups',
    muscleGroups: ['chest', 'shoulders', 'triceps', 'core'],
    equipment: ['bodyweight'],
    difficulty: 'intermediate',
    style: ['strength', 'calisthenics', 'upper-body'],
    instructions: 'Start in plank position, lower chest to floor, push back up',
    modifications: 'Knee push-ups or wall push-ups',
    targetReps: { min: 8, max: 20 },
    targetSets: { min: 3, max: 4 },
    restTime: 60
  },
  {
    id: 'pike_push_ups',
    name: 'Pike Push-ups',
    muscleGroups: ['shoulders', 'triceps', 'core'],
    equipment: ['bodyweight'],
    difficulty: 'intermediate',
    style: ['strength', 'calisthenics', 'upper-body'],
    instructions: 'Start in downward dog position, lower head toward floor, push back up',
    modifications: 'Elevate feet or do against wall',
    targetReps: { min: 5, max: 15 },
    targetSets: { min: 3, max: 4 },
    restTime: 60
  },
  {
    id: 'tricep_dips',
    name: 'Tricep Dips',
    muscleGroups: ['triceps', 'shoulders'],
    equipment: ['bodyweight', 'chair'],
    difficulty: 'intermediate',
    style: ['strength', 'calisthenics', 'upper-body'],
    instructions: 'Sit on edge of chair, lower body by bending elbows, push back up',
    modifications: 'Keep feet on ground or use higher surface',
    targetReps: { min: 8, max: 15 },
    targetSets: { min: 3, max: 4 },
    restTime: 60
  },
  {
    id: 'plank',
    name: 'Plank',
    muscleGroups: ['core', 'shoulders'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    style: ['strength', 'core', 'isometric'],
    duration: 60,
    instructions: 'Hold straight line from head to heels, engage core',
    modifications: 'Knee plank or wall plank',
    targetSets: { min: 3, max: 4 },
    restTime: 30
  },

  // Lower Body Exercises
  {
    id: 'squats',
    name: 'Squats',
    muscleGroups: ['quads', 'glutes', 'hamstrings'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    style: ['strength', 'lower-body', 'functional'],
    instructions: 'Stand with feet shoulder-width apart, lower hips back and down, return to standing',
    modifications: 'Chair squats or partial range of motion',
    targetReps: { min: 10, max: 25 },
    targetSets: { min: 3, max: 4 },
    restTime: 45
  },
  {
    id: 'lunges',
    name: 'Lunges',
    muscleGroups: ['quads', 'glutes', 'hamstrings', 'calves'],
    equipment: ['bodyweight'],
    difficulty: 'intermediate',
    style: ['strength', 'lower-body', 'functional'],
    instructions: 'Step forward, lower back knee toward ground, return to standing',
    modifications: 'Static lunges or holding onto wall for balance',
    targetReps: { min: 8, max: 15 },
    targetSets: { min: 3, max: 4 },
    restTime: 45
  },
  {
    id: 'single_leg_glute_bridge',
    name: 'Single Leg Glute Bridge',
    muscleGroups: ['glutes', 'hamstrings', 'core'],
    equipment: ['bodyweight'],
    difficulty: 'intermediate',
    style: ['strength', 'lower-body', 'glutes'],
    instructions: 'Lie on back, lift one leg, bridge up with other leg',
    modifications: 'Two-leg glute bridge',
    targetReps: { min: 8, max: 15 },
    targetSets: { min: 3, max: 4 },
    restTime: 30
  },
  {
    id: 'calf_raises',
    name: 'Calf Raises',
    muscleGroups: ['calves'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    style: ['strength', 'lower-body'],
    instructions: 'Rise up onto toes, lower back down slowly',
    modifications: 'Hold onto wall for balance',
    targetReps: { min: 15, max: 25 },
    targetSets: { min: 3, max: 4 },
    restTime: 30
  },

  // Yoga/Flexibility
  {
    id: 'downward_dog',
    name: 'Downward Facing Dog',
    muscleGroups: ['shoulders', 'hamstrings', 'calves'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    style: ['yoga', 'flexibility', 'cooldown'],
    duration: 60,
    instructions: 'Start on hands and knees, lift hips up and back forming inverted V',
    modifications: 'Bend knees or use forearms',
    targetSets: { min: 1, max: 3 },
    restTime: 15
  },
  {
    id: 'warrior_pose',
    name: 'Warrior I Pose',
    muscleGroups: ['legs', 'core', 'shoulders'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    style: ['yoga', 'flexibility', 'balance'],
    duration: 45,
    instructions: 'Step one foot back, front knee bent, arms reach overhead',
    modifications: 'Use wall for balance',
    targetSets: { min: 1, max: 2 },
    restTime: 15
  },
  {
    id: 'child_pose',
    name: 'Child\'s Pose',
    muscleGroups: ['back', 'hips'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    style: ['yoga', 'flexibility', 'cooldown'],
    duration: 60,
    instructions: 'Kneel and sit back on heels, reach arms forward on ground',
    modifications: 'Place pillow under forehead',
    targetSets: { min: 1, max: 1 },
    restTime: 0
  }
];

export function getExercisesByStyle(style: string): Exercise[] {
  return exerciseLibrary.filter(exercise => exercise.style.includes(style));
}

export function getExercisesByMuscleGroup(muscleGroup: string): Exercise[] {
  return exerciseLibrary.filter(exercise => exercise.muscleGroups.includes(muscleGroup));
}

export function getExercisesByEquipment(equipment: string[]): Exercise[] {
  return exerciseLibrary.filter(exercise => 
    exercise.equipment.some(eq => equipment.includes(eq))
  );
}

export function getExercisesByDifficulty(difficulty: 'beginner' | 'intermediate' | 'advanced'): Exercise[] {
  return exerciseLibrary.filter(exercise => exercise.difficulty === difficulty);
}

export function filterExercises(
  style?: string,
  muscleGroups?: string[],
  equipment?: string[],
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
): Exercise[] {
  let filtered = exerciseLibrary;

  if (style) {
    filtered = filtered.filter(exercise => exercise.style.includes(style));
  }

  if (muscleGroups && muscleGroups.length > 0) {
    filtered = filtered.filter(exercise => 
      exercise.muscleGroups.some(mg => muscleGroups.includes(mg))
    );
  }

  if (equipment && equipment.length > 0) {
    filtered = filtered.filter(exercise => 
      exercise.equipment.some(eq => equipment.includes(eq))
    );
  }

  if (difficulty) {
    filtered = filtered.filter(exercise => exercise.difficulty === difficulty);
  }

  return filtered;
}