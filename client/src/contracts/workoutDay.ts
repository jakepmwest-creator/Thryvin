// WORKOUT CONTRACT: Ensures UI only receives valid workout data
// From ChatGPT stabilization plan - Step 1

export type ExerciseSet = {
  exercise_id: string;
  name: string;
  sets: number;
  reps: number | string;
  load?: string;
  rest_sec?: number;
};

export type WorkoutDay = {
  date: string; // ISO
  title: string;
  duration_min: number;
  coach_notes?: string;
  blocks: { type: 'warmup' | 'main' | 'recovery'; items: ExerciseSet[]; }[];
};

// Super simple validator (no lib): returns null if invalid
export function validateWorkoutDay(d: any): WorkoutDay | null {
  try {
    if (!d || typeof d !== 'object') return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date)) return null;
    if (typeof d.title !== 'string') return null;
    if (typeof d.duration_min !== 'number') return null;
    if (!Array.isArray(d.blocks)) return null;
    
    const validTypes = new Set(['warmup', 'main', 'recovery']);
    for (const b of d.blocks) {
      if (!validTypes.has(b.type)) return null;
      if (!Array.isArray(b.items) || b.items.length === 0) return null;
      for (const it of b.items) {
        if (!it.exercise_id || !it.name || !it.sets || !it.reps) return null;
      }
    }
    return d as WorkoutDay;
  } catch {
    return null;
  }
}

// Transform API workout data to valid WorkoutDay format
export function transformToWorkoutDay(apiWorkout: any): WorkoutDay | null {
  try {
    // Handle different API response formats
    const exercises = apiWorkout.exercises || [];
    if (exercises.length === 0) return null;

    const mainExercises: ExerciseSet[] = exercises.map((ex: any, index: number) => ({
      exercise_id: ex.id || `ex-${index}`,
      name: ex.name || 'Unknown Exercise',
      sets: ex.sets || 3,
      reps: ex.reps || 10,
      load: ex.weight ? `${ex.weight} lbs` : undefined,
      rest_sec: 60
    }));

    const workoutDay: WorkoutDay = {
      date: new Date().toISOString().split('T')[0],
      title: apiWorkout.title || 'Workout',
      duration_min: apiWorkout.duration || apiWorkout.estimatedDuration || 45,
      coach_notes: apiWorkout.coachComments || apiWorkout.coachNotes || 'Focus on form over speed.',
      blocks: [
        {
          type: 'main',
          items: mainExercises
        }
      ]
    };

    return validateWorkoutDay(workoutDay);
  } catch (error) {
    console.error('❌ Failed to transform workout data:', error);
    return null;
  }
}

// Generate static fallback workout when API fails
export function generateStaticWorkout(): WorkoutDay {
  return {
    date: new Date().toISOString().split('T')[0],
    title: 'Basic Strength Workout',
    duration_min: 30,
    coach_notes: 'Simple bodyweight workout focusing on fundamental movement patterns.',
    blocks: [
      {
        type: 'main',
        items: [
          {
            exercise_id: 'static-1',
            name: 'Push-ups',
            sets: 3,
            reps: '8-12',
            rest_sec: 60
          },
          {
            exercise_id: 'static-2',
            name: 'Bodyweight Squats',
            sets: 3,
            reps: '12-15',
            rest_sec: 60
          },
          {
            exercise_id: 'static-3',
            name: 'Plank Hold',
            sets: 3,
            reps: '30-45 sec',
            rest_sec: 60
          },
          {
            exercise_id: 'static-4',
            name: 'Mountain Climbers',
            sets: 3,
            reps: '20',
            rest_sec: 60
          }
        ]
      }
    ]
  };
}