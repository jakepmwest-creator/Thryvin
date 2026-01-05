/**
 * Workout Validation Module
 * 
 * CRITICAL RULES ENFORCEMENT:
 * 1. Training days = workout count (ALWAYS)
 * 2. Active recovery is NOT a workout
 * 3. No empty or rest-only plans
 * 4. Safe fallback splits
 * 5. Full body part coverage
 */

// =============================================================================
// HARD RULE: SAFE FALLBACK SPLITS BY FREQUENCY
// =============================================================================

export const FALLBACK_SPLITS: Record<number, Array<{ focus: string; muscles: string[] }>> = {
  1: [
    { focus: 'full', muscles: ['chest', 'back', 'legs', 'shoulders', 'arms'] },
  ],
  2: [
    { focus: 'upper', muscles: ['chest', 'back', 'shoulders', 'arms'] },
    { focus: 'lower', muscles: ['legs', 'glutes', 'calves'] },
  ],
  3: [
    { focus: 'upper', muscles: ['chest', 'back', 'shoulders', 'arms'] },
    { focus: 'lower', muscles: ['legs', 'glutes', 'calves'] },
    { focus: 'full', muscles: ['chest', 'back', 'legs', 'shoulders'] },
  ],
  4: [
    { focus: 'upper', muscles: ['chest', 'back', 'shoulders', 'arms'] },
    { focus: 'lower', muscles: ['legs', 'glutes', 'calves'] },
    { focus: 'upper', muscles: ['chest', 'back', 'shoulders', 'arms'] },
    { focus: 'lower', muscles: ['legs', 'glutes', 'calves'] },
  ],
  5: [
    { focus: 'push', muscles: ['chest', 'shoulders', 'triceps'] },
    { focus: 'pull', muscles: ['back', 'biceps'] },
    { focus: 'legs', muscles: ['quads', 'hamstrings', 'glutes', 'calves'] },
    { focus: 'upper', muscles: ['chest', 'back', 'shoulders'] },
    { focus: 'lower', muscles: ['legs', 'glutes', 'calves'] },
  ],
  6: [
    { focus: 'push', muscles: ['chest', 'shoulders', 'triceps'] },
    { focus: 'pull', muscles: ['back', 'biceps'] },
    { focus: 'legs', muscles: ['quads', 'hamstrings', 'glutes', 'calves'] },
    { focus: 'push', muscles: ['chest', 'shoulders', 'triceps'] },
    { focus: 'pull', muscles: ['back', 'biceps'] },
    { focus: 'legs', muscles: ['quads', 'hamstrings', 'glutes', 'calves'] },
  ],
  7: [
    { focus: 'push', muscles: ['chest', 'shoulders', 'triceps'] },
    { focus: 'pull', muscles: ['back', 'biceps'] },
    { focus: 'legs', muscles: ['quads', 'hamstrings', 'glutes', 'calves'] },
    { focus: 'upper', muscles: ['chest', 'back', 'shoulders'] },
    { focus: 'lower', muscles: ['legs', 'glutes', 'calves'] },
    { focus: 'full', muscles: ['chest', 'back', 'legs', 'shoulders'] },
    { focus: 'conditioning', muscles: ['core', 'cardio'] },
  ],
};

// =============================================================================
// TYPES
// =============================================================================

export interface WorkoutDay {
  date: string;
  focus?: string;
  type?: string;
  workoutType?: string;
  isRestDay?: boolean;
  isActivityDay?: boolean;
  isSkipped?: boolean;
  exercises?: any[];
  title?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  workoutCount: number;
  restCount: number;
  activityCount: number;
  usedFallback: boolean;
}

export interface PlanValidationInput {
  frequency: number; // User's selected training days per week
  workouts: WorkoutDay[];
  strictMode?: boolean; // If true, fail on any issue
}

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Check if a workout is a REAL training session (not rest/recovery/activity)
 */
export function isRealWorkout(workout: WorkoutDay): boolean {
  // Check explicit flags
  if (workout.isRestDay) return false;
  if (workout.isActivityDay) return false;
  if (workout.isSkipped) return false;
  
  // Check type/focus for rest indicators
  const type = (workout.type || workout.workoutType || workout.focus || '').toLowerCase();
  
  const restTypes = [
    'rest', 'recovery', 'active_recovery', 'external_activity',
    'off', 'none', 'skip', 'skipped'
  ];
  
  if (restTypes.some(rt => type.includes(rt))) {
    return false;
  }
  
  // Check if exercises exist (a real workout should have exercises)
  if (workout.exercises && workout.exercises.length === 0 && type !== 'pending' && type !== 'generating') {
    // No exercises AND not a pending workout = not a real workout
    return false;
  }
  
  // Check title for rest indicators
  const title = (workout.title || '').toLowerCase();
  if (restTypes.some(rt => title.includes(rt))) {
    return false;
  }
  
  return true;
}

/**
 * CRITICAL: Validate a workout plan against hard rules
 */
export function validatePlan(input: PlanValidationInput): ValidationResult {
  const { frequency, workouts, strictMode = false } = input;
  
  const errors: string[] = [];
  const warnings: string[] = [];
  let usedFallback = false;
  
  // Count workout types
  let workoutCount = 0;
  let restCount = 0;
  let activityCount = 0;
  
  for (const workout of workouts) {
    if (isRealWorkout(workout)) {
      workoutCount++;
    } else if (workout.isActivityDay) {
      activityCount++;
    } else {
      restCount++;
    }
  }
  
  console.log(`[VALIDATION] Frequency: ${frequency}, Workouts: ${workoutCount}, Rest: ${restCount}, Activities: ${activityCount}`);
  
  // ==========================================================================
  // HARD RULE 1: Training days = workout count
  // ==========================================================================
  if (workoutCount < frequency) {
    errors.push(`INVALID: Expected ${frequency} workouts but found ${workoutCount}. Training days MUST equal workout count.`);
  }
  
  // ==========================================================================
  // HARD RULE 3: No empty or rest-only plans
  // ==========================================================================
  if (workoutCount === 0) {
    errors.push(`CRITICAL: Plan has 0 workouts. This is a HARD FAILURE.`);
  }
  
  if (restCount === workouts.length && workouts.length > 0) {
    errors.push(`INVALID: Plan contains only rest days. At least one workout is required.`);
  }
  
  // ==========================================================================
  // HARD RULE 2: Active recovery check
  // ==========================================================================
  for (const workout of workouts) {
    if (isRealWorkout(workout)) {
      const type = (workout.type || workout.workoutType || workout.focus || '').toLowerCase();
      if (type === 'active_recovery' || type === 'recovery') {
        warnings.push(`Warning: Active recovery marked as a workout day. This should only be on rest days.`);
      }
    }
  }
  
  // ==========================================================================
  // HARD RULE 5: Body part coverage (warning only for now)
  // ==========================================================================
  const musclesCovered = new Set<string>();
  for (const workout of workouts) {
    if (isRealWorkout(workout)) {
      const type = (workout.type || workout.workoutType || workout.focus || '').toLowerCase();
      
      // Map focus types to muscle groups
      const focusMuscleMap: Record<string, string[]> = {
        'chest': ['chest'],
        'back': ['back'],
        'legs': ['legs'],
        'lower': ['legs'],
        'shoulders': ['shoulders'],
        'arms': ['arms'],
        'upper': ['chest', 'back', 'shoulders', 'arms'],
        'full': ['chest', 'back', 'legs', 'shoulders', 'arms'],
        'push': ['chest', 'shoulders'],
        'pull': ['back'],
      };
      
      for (const [focus, muscles] of Object.entries(focusMuscleMap)) {
        if (type.includes(focus)) {
          muscles.forEach(m => musclesCovered.add(m));
        }
      }
    }
  }
  
  const majorMuscles = ['chest', 'back', 'legs', 'shoulders'];
  const missingMuscles = majorMuscles.filter(m => !musclesCovered.has(m));
  
  if (missingMuscles.length > 0 && workoutCount >= 3) {
    warnings.push(`Missing muscle coverage: ${missingMuscles.join(', ')}. Consider adjusting split.`);
  }
  
  const valid = errors.length === 0 || !strictMode;
  
  return {
    valid,
    errors,
    warnings,
    workoutCount,
    restCount,
    activityCount,
    usedFallback,
  };
}

/**
 * Generate a SAFE fallback plan when AI output is invalid
 */
export function generateFallbackPlan(
  frequency: number,
  userId: number,
  weekStartDate: Date
): WorkoutDay[] {
  console.log(`[FALLBACK] Generating safe ${frequency}-day fallback plan`);
  
  const clampedFrequency = Math.max(1, Math.min(7, frequency));
  const splitTemplate = FALLBACK_SPLITS[clampedFrequency] || FALLBACK_SPLITS[3];
  
  const workouts: WorkoutDay[] = [];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Distribute workouts across the week
  // For frequencies < 7, spread them out evenly
  const availableDays = [1, 2, 3, 4, 5, 6, 0]; // Mon-Sat, then Sun
  const selectedDays: number[] = [];
  
  if (clampedFrequency >= 7) {
    selectedDays.push(...availableDays);
  } else {
    // Distribute evenly
    const step = availableDays.length / clampedFrequency;
    for (let i = 0; i < clampedFrequency; i++) {
      const idx = Math.floor(i * step);
      selectedDays.push(availableDays[idx]);
    }
  }
  
  // Create workout entries
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStartDate);
    date.setDate(weekStartDate.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay();
    
    const workoutIndex = selectedDays.indexOf(dayOfWeek);
    
    if (workoutIndex !== -1 && workoutIndex < splitTemplate.length) {
      // This is a workout day
      const split = splitTemplate[workoutIndex];
      workouts.push({
        date: dateStr,
        focus: split.focus,
        type: split.focus,
        workoutType: split.focus,
        isRestDay: false,
        title: `${split.focus.charAt(0).toUpperCase() + split.focus.slice(1)} Day`,
        exercises: [], // Will be populated by AI generator
      });
    } else {
      // Rest day
      workouts.push({
        date: dateStr,
        focus: 'rest',
        type: 'rest',
        workoutType: 'rest',
        isRestDay: true,
        title: 'Rest Day',
        exercises: [],
      });
    }
  }
  
  console.log(`[FALLBACK] Generated ${workouts.filter(w => !w.isRestDay).length} workout days`);
  
  return workouts;
}

/**
 * COACH ACTION VALIDATION: Check if action type matches user intent
 */
export function validateCoachActionIntent(
  userRequest: string,
  actionWorkoutType: string
): { valid: boolean; error?: string } {
  const request = userRequest.toLowerCase();
  const actionType = actionWorkoutType.toLowerCase();
  
  // Define body part keywords
  const bodyPartKeywords: Record<string, string[]> = {
    chest: ['chest', 'pec', 'bench', 'push'],
    back: ['back', 'lat', 'row', 'pull'],
    shoulders: ['shoulder', 'delt', 'press'],
    arms: ['arm', 'bicep', 'tricep', 'curl'],
    legs: ['leg', 'quad', 'hamstring', 'squat', 'glute'],
    core: ['core', 'ab', 'abs', 'plank'],
  };
  
  // Check what the user requested
  let requestedBodyPart: string | null = null;
  for (const [part, keywords] of Object.entries(bodyPartKeywords)) {
    if (keywords.some(kw => request.includes(kw))) {
      requestedBodyPart = part;
      break;
    }
  }
  
  // If user requested a specific body part but action is cardio = MISMATCH
  if (requestedBodyPart && actionType === 'cardio') {
    return {
      valid: false,
      error: `ACTION_MISMATCH: User requested "${requestedBodyPart}" workout but action would create cardio. Please regenerate.`,
    };
  }
  
  // If user requested cardio-related terms but action is not cardio = warning but allow
  const cardioKeywords = ['cardio', 'run', 'hiit', 'conditioning', 'endurance'];
  const userRequestedCardio = cardioKeywords.some(kw => request.includes(kw));
  const actionIsCardio = ['cardio', 'hiit', 'liss', 'running', 'cycling', 'conditioning'].includes(actionType);
  
  // If user explicitly requested non-cardio but got cardio = block
  if (!userRequestedCardio && actionIsCardio && requestedBodyPart) {
    return {
      valid: false,
      error: `ACTION_MISMATCH: User requested "${requestedBodyPart}" workout but action would create "${actionType}". Please regenerate.`,
    };
  }
  
  return { valid: true };
}

/**
 * Log validation results (DEV only)
 */
export function logValidation(
  context: string,
  frequency: number,
  workoutCount: number,
  split: string,
  usedFallback: boolean
): void {
  if (process.env.NODE_ENV === 'production') return;
  
  console.log(`\n========== WORKOUT VALIDATION: ${context} ==========`);
  console.log(`  📊 Requested frequency: ${frequency} days/week`);
  console.log(`  🏋️ Generated workouts: ${workoutCount}`);
  console.log(`  📋 Split: ${split}`);
  console.log(`  🔄 Fallback used: ${usedFallback ? 'YES' : 'NO'}`);
  console.log(`  ✅ Valid: ${workoutCount >= frequency ? 'YES' : 'NO - RETRY NEEDED'}`);
  console.log(`================================================\n`);
}

export default {
  FALLBACK_SPLITS,
  isRealWorkout,
  validatePlan,
  generateFallbackPlan,
  validateCoachActionIntent,
  logValidation,
};
