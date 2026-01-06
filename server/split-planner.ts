/**
 * Split Planner - Weekly Workout Structure Planning
 * 
 * CORE RULES (HUMAN PT LOGIC):
 * 1. Training days = ACTUAL gym training sessions, NOT active recovery
 * 2. All major muscle groups (Chest, Back, Legs, Shoulders, Arms) must be trained weekly
 * 3. Active recovery ONLY on rest days or explicit deload requests
 * 4. Weak areas increase volume, NOT dominance
 * 5. Weekly variety - split order should rotate
 * 6. Smart split selection based on frequency/experience/goals
 */

// Types for split planning
export interface WeeklyActivity {
  name: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  timeWindow: 'morning' | 'afternoon' | 'evening';
  intensity: 'low' | 'moderate' | 'hard';
  notes?: string;
}

export interface SplitPlannerInput {
  frequency: number; // days per week (1-7) - THIS IS GYM TRAINING DAYS
  experience: 'beginner' | 'intermediate' | 'advanced';
  goals: string[]; // muscle_gain, fat_loss, strength, etc.
  equipment: string[];
  injuries?: string | null;
  sessionDuration: number; // minutes
  weeklyActivities?: WeeklyActivity[]; // External activities (sports, etc.)
  gymDaysAvailable?: number[]; // 0-6 (Sun-Sat)
  scheduleFlexibility?: boolean;
  preferredSplit?: string;
  preferredSplitOther?: string;
  weekNumber?: number; // For weekly variety rotation
}

export interface DayPlan {
  dayIndex: number; // 0-6
  focus: 'upper' | 'lower' | 'full' | 'push' | 'pull' | 'legs' | 'chest' | 'back' | 'shoulders' | 'arms' | 'rest' | 'external_activity';
  exerciseCount: { min: number; max: number };
  warmupCount: number;
  mainCount: { min: number; max: number };
  cooldownCount: number;
  avoidPatterns?: string[];
  notes?: string;
  isGymTraining: boolean; // TRUE = real gym workout, FALSE = rest/external
  musclesFocused: string[]; // Primary muscles this session targets
}

export interface WeeklyTemplate {
  splitName: string;
  days: DayPlan[];
  constraints: {
    maxConsecutiveHeavyDays: number;
    avoidSamePrimaryPattern: boolean;
    respectActivityConflicts: boolean;
  };
  timeBudget: {
    warmupMinutes: number;
    mainWorkMinutes: number;
    cooldownMinutes: number;
    transitionTimePerExercise: number;
  };
  muscleGroupCoverage: string[]; // Confirms all major groups are hit
}

// =============================================================================
// SPLIT TEMPLATES - VALIDATED BY FREQUENCY + EXPERIENCE
// =============================================================================

// Each split defines: [focus, primary muscles targeted]
interface SplitDay {
  focus: string;
  muscles: string[];
}

// CRITICAL: These are REAL training splits, NO active recovery inside them
const VALIDATED_SPLITS: Record<number, Record<string, SplitDay[]>> = {
  // 2 DAYS/WEEK
  2: {
    beginner: [
      { focus: 'full', muscles: ['chest', 'back', 'legs', 'shoulders', 'arms'] },
      { focus: 'full', muscles: ['chest', 'back', 'legs', 'shoulders', 'arms'] },
    ],
    intermediate: [
      { focus: 'upper', muscles: ['chest', 'back', 'shoulders', 'arms'] },
      { focus: 'lower', muscles: ['legs', 'glutes', 'calves'] },
    ],
    advanced: [
      { focus: 'upper', muscles: ['chest', 'back', 'shoulders', 'arms'] },
      { focus: 'lower', muscles: ['legs', 'glutes', 'calves'] },
    ],
  },
  
  // 3 DAYS/WEEK
  3: {
    beginner: [
      { focus: 'upper', muscles: ['chest', 'back', 'shoulders', 'arms'] },
      { focus: 'lower', muscles: ['legs', 'glutes', 'calves'] },
      { focus: 'full', muscles: ['chest', 'back', 'legs', 'shoulders'] },
    ],
    intermediate: [
      { focus: 'push', muscles: ['chest', 'shoulders', 'triceps'] },
      { focus: 'pull', muscles: ['back', 'biceps', 'rear_delts'] },
      { focus: 'legs', muscles: ['quads', 'hamstrings', 'glutes', 'calves'] },
    ],
    advanced: [
      { focus: 'push', muscles: ['chest', 'shoulders', 'triceps'] },
      { focus: 'pull', muscles: ['back', 'biceps', 'rear_delts'] },
      { focus: 'legs', muscles: ['quads', 'hamstrings', 'glutes', 'calves'] },
    ],
  },
  
  // 4 DAYS/WEEK
  4: {
    beginner: [
      { focus: 'upper', muscles: ['chest', 'back', 'shoulders', 'arms'] },
      { focus: 'lower', muscles: ['legs', 'glutes', 'calves'] },
      { focus: 'upper', muscles: ['chest', 'back', 'shoulders', 'arms'] },
      { focus: 'lower', muscles: ['legs', 'glutes', 'calves'] },
    ],
    intermediate: [
      { focus: 'upper', muscles: ['chest', 'back', 'shoulders', 'arms'] },
      { focus: 'lower', muscles: ['legs', 'glutes', 'calves'] },
      { focus: 'push', muscles: ['chest', 'shoulders', 'triceps'] },
      { focus: 'pull', muscles: ['back', 'biceps', 'rear_delts'] },
    ],
    advanced: [
      { focus: 'push', muscles: ['chest', 'shoulders', 'triceps'] },
      { focus: 'pull', muscles: ['back', 'biceps', 'rear_delts'] },
      { focus: 'legs', muscles: ['quads', 'hamstrings', 'glutes', 'calves'] },
      { focus: 'upper', muscles: ['chest', 'back', 'shoulders', 'arms'] },
    ],
  },
  
  // 5 DAYS/WEEK - NO ACTIVE RECOVERY, ALL REAL TRAINING
  5: {
    beginner: [
      { focus: 'upper', muscles: ['chest', 'back', 'shoulders'] },
      { focus: 'lower', muscles: ['quads', 'hamstrings', 'glutes'] },
      { focus: 'push', muscles: ['chest', 'shoulders', 'triceps'] },
      { focus: 'pull', muscles: ['back', 'biceps'] },
      { focus: 'legs', muscles: ['quads', 'hamstrings', 'calves'] },
    ],
    intermediate: [
      { focus: 'push', muscles: ['chest', 'shoulders', 'triceps'] },
      { focus: 'pull', muscles: ['back', 'biceps', 'rear_delts'] },
      { focus: 'legs', muscles: ['quads', 'hamstrings', 'glutes', 'calves'] },
      { focus: 'upper', muscles: ['chest', 'back', 'shoulders'] },
      { focus: 'lower', muscles: ['legs', 'glutes', 'calves'] },
    ],
    advanced: [
      { focus: 'chest', muscles: ['chest', 'triceps'] },
      { focus: 'back', muscles: ['back', 'biceps'] },
      { focus: 'shoulders', muscles: ['shoulders', 'traps'] },
      { focus: 'legs', muscles: ['quads', 'hamstrings', 'glutes', 'calves'] },
      { focus: 'arms', muscles: ['biceps', 'triceps', 'forearms'] },
    ],
  },
  
  // 6 DAYS/WEEK
  6: {
    beginner: [
      { focus: 'push', muscles: ['chest', 'shoulders', 'triceps'] },
      { focus: 'pull', muscles: ['back', 'biceps'] },
      { focus: 'legs', muscles: ['quads', 'hamstrings', 'glutes'] },
      { focus: 'push', muscles: ['chest', 'shoulders', 'triceps'] },
      { focus: 'pull', muscles: ['back', 'biceps'] },
      { focus: 'legs', muscles: ['quads', 'hamstrings', 'calves'] },
    ],
    intermediate: [
      { focus: 'push', muscles: ['chest', 'shoulders', 'triceps'] },
      { focus: 'pull', muscles: ['back', 'biceps'] },
      { focus: 'legs', muscles: ['quads', 'hamstrings', 'glutes'] },
      { focus: 'push', muscles: ['chest', 'shoulders', 'triceps'] },
      { focus: 'pull', muscles: ['back', 'biceps'] },
      { focus: 'legs', muscles: ['quads', 'hamstrings', 'calves'] },
    ],
    advanced: [
      { focus: 'chest', muscles: ['chest', 'triceps'] },
      { focus: 'back', muscles: ['back', 'biceps'] },
      { focus: 'shoulders', muscles: ['shoulders', 'traps'] },
      { focus: 'legs', muscles: ['quads', 'hamstrings', 'glutes'] },
      { focus: 'arms', muscles: ['biceps', 'triceps', 'forearms'] },
      { focus: 'full', muscles: ['chest', 'back', 'legs', 'shoulders'] },
    ],
  },
};

// Preferred split mapping (user choice)
const PREFERRED_SPLIT_TEMPLATES: Record<string, SplitDay[]> = {
  'upper_lower': [
    { focus: 'upper', muscles: ['chest', 'back', 'shoulders', 'arms'] },
    { focus: 'lower', muscles: ['legs', 'glutes', 'calves'] },
  ],
  'upper_lower_full': [
    { focus: 'upper', muscles: ['chest', 'back', 'shoulders', 'arms'] },
    { focus: 'lower', muscles: ['legs', 'glutes', 'calves'] },
    { focus: 'full', muscles: ['chest', 'back', 'legs', 'shoulders'] },
  ],
  'full_body': [
    { focus: 'full', muscles: ['chest', 'back', 'legs', 'shoulders', 'arms'] },
  ],
  'push_pull_legs': [
    { focus: 'push', muscles: ['chest', 'shoulders', 'triceps'] },
    { focus: 'pull', muscles: ['back', 'biceps', 'rear_delts'] },
    { focus: 'legs', muscles: ['quads', 'hamstrings', 'glutes', 'calves'] },
  ],
  'bro_split': [
    { focus: 'chest', muscles: ['chest', 'triceps'] },
    { focus: 'back', muscles: ['back', 'biceps'] },
    { focus: 'shoulders', muscles: ['shoulders', 'traps'] },
    { focus: 'legs', muscles: ['quads', 'hamstrings', 'glutes', 'calves'] },
    { focus: 'arms', muscles: ['biceps', 'triceps', 'forearms'] },
  ],
};

// =============================================================================
// EXERCISE COUNT RULES
// =============================================================================

function getExerciseCounts(experience: string, duration: number): { min: number; max: number; warmup: number; cooldown: number } {
  const durationKey = duration <= 30 ? 'short' : duration <= 45 ? 'medium' : 'long';
  
  const counts: Record<string, Record<string, { min: number; max: number; warmup: number; cooldown: number }>> = {
    beginner: {
      short: { min: 3, max: 4, warmup: 1, cooldown: 1 },
      medium: { min: 4, max: 6, warmup: 1, cooldown: 1 },
      long: { min: 5, max: 7, warmup: 2, cooldown: 1 },
    },
    intermediate: {
      short: { min: 4, max: 5, warmup: 1, cooldown: 1 },
      medium: { min: 5, max: 7, warmup: 1, cooldown: 1 },
      long: { min: 6, max: 9, warmup: 2, cooldown: 2 },
    },
    advanced: {
      short: { min: 5, max: 6, warmup: 1, cooldown: 1 },
      medium: { min: 6, max: 8, warmup: 2, cooldown: 1 },
      long: { min: 7, max: 10, warmup: 2, cooldown: 2 },
    },
  };
  
  return counts[experience]?.[durationKey] || counts.intermediate.medium;
}

// =============================================================================
// CONFLICT DETECTION
// =============================================================================

function getDayConflicts(dayIndex: number, activities: WeeklyActivity[]): { hasHardActivity: boolean; activityName: string | null; conflicts: string[] } {
  const dayActivities = activities.filter(a => a.dayOfWeek === dayIndex);
  const hardActivity = dayActivities.find(a => a.intensity === 'hard');
  
  if (!hardActivity) {
    return { hasHardActivity: false, activityName: null, conflicts: [] };
  }
  
  const conflicts: string[] = [];
  const actName = hardActivity.name.toLowerCase();
  
  // Lower-body intensive activities
  if (['running', 'cycling', 'football', 'soccer', 'basketball', 'hiit', 'sprinting'].some(s => actName.includes(s))) {
    conflicts.push('avoid_heavy_legs');
  }
  
  // Upper-body intensive activities
  if (['boxing', 'climbing', 'swimming', 'martial arts', 'mma', 'tennis'].some(s => actName.includes(s))) {
    conflicts.push('avoid_heavy_upper');
  }
  
  return { 
    hasHardActivity: true, 
    activityName: hardActivity.name,
    conflicts 
  };
}

// =============================================================================
// WEEKLY VARIETY - Rotate split order based on week number
// =============================================================================

function rotateSplitForVariety(split: SplitDay[], weekNumber: number): SplitDay[] {
  if (split.length <= 2 || weekNumber <= 1) return split;
  
  // Rotate by weekNumber - 1 positions for variety
  const rotation = (weekNumber - 1) % split.length;
  return [...split.slice(rotation), ...split.slice(0, rotation)];
}

// =============================================================================
// MAIN FUNCTION: Generate Weekly Template
// =============================================================================

/**
 * Generate a weekly workout template
 * 
 * CRITICAL RULES:
 * 1. frequency = NUMBER OF GYM TRAINING SESSIONS (not including recovery)
 * 2. External activities (football, etc.) do NOT reduce gym sessions
 * 3. External activity days get NO gym workout OR light recovery only
 * 4. All 5 major muscle groups must be covered weekly
 */
export function generateWeeklyTemplate(input: SplitPlannerInput): WeeklyTemplate {
  const {
    frequency,
    experience,
    goals,
    sessionDuration,
    weeklyActivities = [],
    gymDaysAvailable = [1, 2, 3, 4, 5, 6, 0], // Default: all days
    scheduleFlexibility = true,
    preferredSplit,
    weekNumber = 1,
  } = input;
  
  console.log(`\n📊 [SPLIT PLANNER] Planning ${frequency} gym training days for ${experience} user`);
  
  // ==========================================================================
  // STEP 1: Get the split template
  // ==========================================================================
  
  let splitDays: SplitDay[];
  let splitName: string;
  
  // Check if user has preferred split
  if (preferredSplit && preferredSplit !== 'coach_choice' && PREFERRED_SPLIT_TEMPLATES[preferredSplit]) {
    const template = PREFERRED_SPLIT_TEMPLATES[preferredSplit];
    splitDays = [];
    splitName = preferredSplit;
    
    // Expand template to match frequency
    while (splitDays.length < frequency) {
      splitDays.push(...template);
    }
    splitDays = splitDays.slice(0, frequency);
  } else {
    // Use validated split based on frequency + experience
    const freqSplits = VALIDATED_SPLITS[Math.min(frequency, 6)] || VALIDATED_SPLITS[3];
    splitDays = [...(freqSplits[experience] || freqSplits.intermediate)];
    splitName = `${frequency}day_${experience}`;
    
    // If frequency doesn't match template, expand/trim
    if (frequency > splitDays.length) {
      // Repeat from beginning
      const original = [...splitDays];
      while (splitDays.length < frequency) {
        splitDays.push(original[splitDays.length % original.length]);
      }
    } else {
      splitDays = splitDays.slice(0, frequency);
    }
  }
  
  // Apply weekly variety rotation
  splitDays = rotateSplitForVariety(splitDays, weekNumber);
  
  console.log(`  📋 Split: ${splitName}`);
  console.log(`  📅 Training days: ${splitDays.map(d => d.focus).join(' → ')}`);
  
  // ==========================================================================
  // STEP 2: Identify days with external activities
  // ==========================================================================
  
  const externalActivityDays: Map<number, WeeklyActivity> = new Map();
  weeklyActivities.forEach(activity => {
    if (activity.intensity === 'hard' || activity.intensity === 'moderate') {
      externalActivityDays.set(activity.dayOfWeek, activity);
      console.log(`  ⚽ External activity: ${activity.name} on day ${activity.dayOfWeek}`);
    }
  });
  
  // ==========================================================================
  // STEP 3: Determine available gym days (excluding hard external activity days)
  // ==========================================================================
  
  const allDays = [0, 1, 2, 3, 4, 5, 6];
  
  // CRITICAL FIX: If gymDaysAvailable is empty, default to all days
  const effectiveGymDays = (gymDaysAvailable && gymDaysAvailable.length > 0) 
    ? gymDaysAvailable 
    : allDays;
  
  const availableGymDays = allDays.filter(day => {
    const activity = externalActivityDays.get(day);
    // Skip days with hard external activities
    if (activity && activity.intensity === 'hard') {
      return false;
    }
    return effectiveGymDays.includes(day);
  });
  
  // HARD RULE: If no days available after filtering, use all days except hard activities
  const finalAvailableDays = availableGymDays.length > 0 
    ? availableGymDays 
    : allDays.filter(day => !externalActivityDays.has(day) || externalActivityDays.get(day)?.intensity !== 'hard');
  
  console.log(`  🏋️ Available gym days: ${finalAvailableDays.join(', ')} (${finalAvailableDays.length} days)`);
  
  // ==========================================================================
  // STEP 4: Schedule gym workouts on available days
  // ==========================================================================
  
  const scheduledWorkouts: { dayIndex: number; split: SplitDay }[] = [];
  
  // HARD RULE: We MUST schedule 'frequency' workouts, period.
  // Distribute workouts evenly across available days
  if (finalAvailableDays.length >= frequency) {
    // We have enough days - spread them out
    const step = finalAvailableDays.length / frequency;
    for (let i = 0; i < frequency; i++) {
      const dayIdx = Math.floor(i * step);
      scheduledWorkouts.push({
        dayIndex: finalAvailableDays[dayIdx],
        split: splitDays[i],
      });
    }
  } else if (finalAvailableDays.length > 0) {
    // Not enough days - schedule as many as we can, then double up
    console.log(`  ⚠️ Warning: Only ${finalAvailableDays.length} days available for ${frequency} workouts - will schedule all available`);
    
    // First, fill all available days
    for (let i = 0; i < finalAvailableDays.length; i++) {
      scheduledWorkouts.push({
        dayIndex: finalAvailableDays[i],
        split: splitDays[i % splitDays.length],
      });
    }
    
    // If we still need more workouts, double up on some days (AM/PM split concept)
    // For now, just log that we couldn't fit all workouts
    if (scheduledWorkouts.length < frequency) {
      console.log(`  ⚠️ Could only schedule ${scheduledWorkouts.length}/${frequency} workouts due to availability constraints`);
    }
  } else {
    // NO days available at all - this should NEVER happen after our fix
    // But as a last resort, use Mon/Wed/Fri pattern
    console.error(`  ❌ CRITICAL: No available gym days! Using emergency fallback Mon/Wed/Fri`);
    const emergencyDays = [1, 3, 5]; // Mon, Wed, Fri
    for (let i = 0; i < Math.min(frequency, 3); i++) {
      scheduledWorkouts.push({
        dayIndex: emergencyDays[i],
        split: splitDays[i % splitDays.length],
      });
    }
  }
  
  // Sort by day index for consistent ordering
  scheduledWorkouts.sort((a, b) => a.dayIndex - b.dayIndex);
  
  console.log(`  ✅ Scheduled ${scheduledWorkouts.length} workout(s) on days: ${scheduledWorkouts.map(w => w.dayIndex).join(', ')}`);
  
  // ==========================================================================
  // STEP 5: Build complete day plans for all 7 days
  // ==========================================================================
  
  const counts = getExerciseCounts(experience, sessionDuration);
  const days: DayPlan[] = [];
  const allMusclesCovered: Set<string> = new Set();
  
  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    const scheduledWorkout = scheduledWorkouts.find(w => w.dayIndex === dayIndex);
    const externalActivity = externalActivityDays.get(dayIndex);
    
    if (scheduledWorkout) {
      // This is a GYM TRAINING day
      const split = scheduledWorkout.split;
      split.muscles.forEach(m => allMusclesCovered.add(m));
      
      days.push({
        dayIndex,
        focus: split.focus as any,
        exerciseCount: { min: counts.min, max: counts.max },
        warmupCount: counts.warmup,
        mainCount: { min: counts.min - counts.warmup - counts.cooldown, max: counts.max - counts.warmup - counts.cooldown },
        cooldownCount: counts.cooldown,
        isGymTraining: true,
        musclesFocused: split.muscles,
        notes: `Gym: ${split.focus.toUpperCase()} - Target: ${split.muscles.join(', ')}`,
      });
    } else if (externalActivity) {
      // This is an EXTERNAL ACTIVITY day (no gym workout)
      days.push({
        dayIndex,
        focus: 'external_activity',
        exerciseCount: { min: 0, max: 0 },
        warmupCount: 0,
        mainCount: { min: 0, max: 0 },
        cooldownCount: 0,
        isGymTraining: false,
        musclesFocused: [],
        notes: `⚽ ${externalActivity.name} (${externalActivity.intensity})`,
      });
    } else {
      // This is a REST day
      days.push({
        dayIndex,
        focus: 'rest',
        exerciseCount: { min: 0, max: 0 },
        warmupCount: 0,
        mainCount: { min: 0, max: 0 },
        cooldownCount: 0,
        isGymTraining: false,
        musclesFocused: [],
        notes: 'Rest day - recovery',
      });
    }
  }
  
  // ==========================================================================
  // STEP 6: Verify muscle group coverage
  // ==========================================================================
  
  const majorMuscleGroups = ['chest', 'back', 'legs', 'shoulders', 'arms'];
  const muscleGroupCoverage = majorMuscleGroups.filter(muscle => {
    // Check if this muscle group or related muscles are covered
    const related: Record<string, string[]> = {
      chest: ['chest', 'push'],
      back: ['back', 'pull', 'lats'],
      legs: ['legs', 'quads', 'hamstrings', 'glutes', 'calves', 'lower'],
      shoulders: ['shoulders', 'delts', 'push'],
      arms: ['arms', 'biceps', 'triceps', 'forearms'],
    };
    return related[muscle]?.some(m => allMusclesCovered.has(m));
  });
  
  if (muscleGroupCoverage.length < majorMuscleGroups.length) {
    const missing = majorMuscleGroups.filter(m => !muscleGroupCoverage.includes(m));
    console.log(`  ⚠️ Warning: Missing muscle groups: ${missing.join(', ')}`);
  } else {
    console.log(`  ✅ All major muscle groups covered: ${muscleGroupCoverage.join(', ')}`);
  }
  
  // ==========================================================================
  // STEP 7: Calculate time budget
  // ==========================================================================
  
  const warmupMinutes = experience === 'beginner' ? 8 : 5;
  const cooldownMinutes = 5;
  const transitionTime = experience === 'beginner' ? 2 : 1;
  const mainWorkMinutes = sessionDuration - warmupMinutes - cooldownMinutes;
  
  const gymTrainingDays = days.filter(d => d.isGymTraining).length;
  console.log(`  📊 Result: ${gymTrainingDays} gym training sessions scheduled\n`);
  
  return {
    splitName,
    days,
    constraints: {
      maxConsecutiveHeavyDays: experience === 'beginner' ? 2 : 3,
      avoidSamePrimaryPattern: true,
      respectActivityConflicts: true,
    },
    timeBudget: {
      warmupMinutes,
      mainWorkMinutes,
      cooldownMinutes,
      transitionTimePerExercise: transitionTime,
    },
    muscleGroupCoverage,
  };
}

// =============================================================================
// HELPER EXPORTS
// =============================================================================

/**
 * Get the focus for a specific day from a template
 */
export function getDayFocus(template: WeeklyTemplate, dayOfWeek: number): string {
  const day = template.days.find(d => d.dayIndex === dayOfWeek);
  return day?.focus || 'rest';
}

/**
 * Get prompt constraints for AI workout generation
 */
export function getPromptConstraints(template: WeeklyTemplate, dayOfWeek: number): string {
  const day = template.days.find(d => d.dayIndex === dayOfWeek);
  if (!day || !day.isGymTraining) {
    return 'REST DAY - No workout generation needed';
  }
  
  return `
FOCUS: ${day.focus.toUpperCase()}
TARGET MUSCLES: ${day.musclesFocused.join(', ')}
EXERCISE COUNT: ${day.exerciseCount.min}-${day.exerciseCount.max} exercises total
WARMUP: ${day.warmupCount} exercise(s)
MAIN WORK: ${day.mainCount.min}-${day.mainCount.max} exercises
COOLDOWN: ${day.cooldownCount} exercise(s)
${day.notes || ''}
`.trim();
}

export default generateWeeklyTemplate;
