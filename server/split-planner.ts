/**
 * Split Planner - Weekly Workout Structure Planning
 * 
 * Phase 8.5: Stop random full-body every day
 * 
 * Inputs: frequency, experience, goals, equipment, injuries, preferences,
 *         weekly activities, gym availability, preferred split
 * 
 * Output: Weekly template with dayFocus array, constraints, time budget
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
  frequency: number; // days per week (1-7)
  experience: 'beginner' | 'intermediate' | 'advanced';
  goals: string[]; // muscle_gain, fat_loss, strength, etc.
  equipment: string[];
  injuries?: string | null;
  sessionDuration: number; // minutes
  weeklyActivities?: WeeklyActivity[];
  gymDaysAvailable?: number[]; // 0-6 (Sun-Sat)
  scheduleFlexibility?: boolean;
  preferredSplit?: string;
  preferredSplitOther?: string;
}

export interface DayPlan {
  dayIndex: number; // 0-6
  focus: 'upper' | 'lower' | 'full' | 'push' | 'pull' | 'legs' | 'rest' | 'cardio' | 'recovery';
  exerciseCount: { min: number; max: number };
  warmupCount: number;
  mainCount: { min: number; max: number };
  cooldownCount: number;
  avoidPatterns?: string[]; // e.g., ['heavy_hinge'] if hard class same day
  notes?: string;
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
}

// Default split templates based on frequency and experience
const SPLIT_TEMPLATES: Record<string, (input: SplitPlannerInput) => string[]> = {
  // 2 days
  '2_beginner': () => ['full', 'full'],
  '2_intermediate': () => ['upper', 'lower'],
  '2_advanced': () => ['push_pull', 'legs'],
  
  // 3 days
  '3_beginner': () => ['upper', 'lower', 'full'],
  '3_intermediate': () => ['push', 'pull', 'legs'],
  '3_advanced': () => ['push', 'pull', 'legs'],
  
  // 4 days
  '4_beginner': () => ['upper', 'lower', 'upper', 'lower'],
  '4_intermediate': () => ['upper', 'lower', 'push', 'pull'],
  '4_advanced': () => ['push', 'pull', 'legs', 'upper'],
  
  // 5 days
  '5_beginner': () => ['upper', 'lower', 'full', 'upper', 'lower'],
  '5_intermediate': () => ['push', 'pull', 'legs', 'upper', 'lower'],
  '5_advanced': () => ['chest', 'back', 'shoulders', 'legs', 'arms'],
  
  // 6 days
  '6_intermediate': () => ['push', 'pull', 'legs', 'push', 'pull', 'legs'],
  '6_advanced': () => ['chest', 'back', 'shoulders', 'legs', 'arms', 'full'],
};

// Preferred split mapping
const PREFERRED_SPLIT_MAP: Record<string, string[]> = {
  'upper_lower_full': ['upper', 'lower', 'full'],
  'full_body': ['full', 'full', 'full', 'full'],
  'push_pull_legs': ['push', 'pull', 'legs'],
  'bro_split': ['chest', 'back', 'shoulders', 'legs', 'arms'],
  'strength': ['squat', 'bench', 'deadlift', 'overhead'],
  'endurance': ['cardio_strength', 'hiit', 'cardio_strength'],
};

// Exercise count rules by experience and duration
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

// Check if a day has conflicting hard activities
function getDayConflicts(dayIndex: number, activities: WeeklyActivity[]): string[] {
  const conflicts: string[] = [];
  
  const dayActivities = activities.filter(a => a.dayOfWeek === dayIndex && a.intensity === 'hard');
  
  for (const activity of dayActivities) {
    const actName = activity.name.toLowerCase();
    
    // If hard lower-body activity (running, cycling, football, etc.), avoid heavy legs
    if (['running', 'cycling', 'football', 'soccer', 'basketball', 'hiit'].some(s => actName.includes(s))) {
      conflicts.push('heavy_legs', 'heavy_hinge');
    }
    
    // If hard upper-body activity (boxing, climbing, swimming), avoid heavy upper
    if (['boxing', 'climbing', 'swimming', 'martial arts', 'mma'].some(s => actName.includes(s))) {
      conflicts.push('heavy_push', 'heavy_pull', 'heavy_upper');
    }
    
    // If any hard activity in evening, prefer morning gym or skip
    if (activity.timeWindow === 'evening') {
      conflicts.push('evening_session');
    }
  }
  
  return [...new Set(conflicts)];
}

/**
 * Main function: Generate a weekly workout template
 * 
 * KEY LOGIC: If user has fixed activities (boxing, classes, etc.), those COUNT
 * towards their weekly training days. So if they want 4 days/week and have boxing
 * on Monday, we only generate 3 gym workouts.
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
  } = input;
  
  // Count hard/moderate activities as training days
  const activityDays = weeklyActivities
    .filter(a => a.intensity === 'hard' || a.intensity === 'moderate')
    .map(a => a.dayOfWeek);
  
  // Effective gym days needed = total training days - activity days
  const gymDaysNeeded = Math.max(1, frequency - activityDays.length);
  
  console.log(`  📊 Split planner: ${frequency} days/week requested, ${activityDays.length} activity days, ${gymDaysNeeded} gym days needed`);
  
  // Determine split pattern for GYM days only
  let splitPattern: string[];
  
  if (preferredSplit && preferredSplit !== 'coach_choice' && PREFERRED_SPLIT_MAP[preferredSplit]) {
    // User has a preferred split
    splitPattern = PREFERRED_SPLIT_MAP[preferredSplit].slice(0, gymDaysNeeded);
    // Pad if needed
    while (splitPattern.length < gymDaysNeeded) {
      splitPattern.push(splitPattern[splitPattern.length - 1] || 'full');
    }
  } else {
    // Use default template based on gym days needed + experience
    const templateKey = `${gymDaysNeeded}_${experience}`;
    const templateFn = SPLIT_TEMPLATES[templateKey] || SPLIT_TEMPLATES[`${Math.min(gymDaysNeeded, 5)}_intermediate`];
    splitPattern = templateFn ? templateFn({ ...input, frequency: gymDaysNeeded }) : ['full'];
  }
  
  // Get exercise counts
  const counts = getExerciseCounts(experience, sessionDuration);
  
  // Determine which days to schedule workouts
  // First, filter out days with hard activities if schedule is not flexible
  const baseAvailableDays = scheduleFlexibility ? [0, 1, 2, 3, 4, 5, 6] : gymDaysAvailable;
  
  // Filter out days with hard conflicting activities
  const availableDays = baseAvailableDays.filter(day => {
    const conflicts = getDayConflicts(day, weeklyActivities);
    // Skip days with any hard activity (they should rest or do recovery)
    const hasHardConflict = conflicts.some(c => 
      c.includes('heavy_') || c === 'evening_session'
    );
    return !hasHardConflict;
  });
  
  // If all days filtered out, fall back to original
  const finalAvailableDays = availableDays.length > 0 ? availableDays : baseAvailableDays;
  const scheduledDays: number[] = [];
  
  // Distribute workout days evenly across available days
  if (frequency <= finalAvailableDays.length) {
    const step = Math.floor(finalAvailableDays.length / frequency);
    for (let i = 0; i < frequency; i++) {
      const dayIndex = finalAvailableDays[Math.min(i * step, finalAvailableDays.length - 1)];
      scheduledDays.push(dayIndex);
    }
  } else {
    // More workouts than available days - just use all available
    scheduledDays.push(...finalAvailableDays.slice(0, frequency));
  }
  
  // Build day plans
  const days: DayPlan[] = [];
  let patternIndex = 0;
  
  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    const activity = weeklyActivities.find(a => a.dayOfWeek === dayIndex);
    const hasActivity = !!activity && (activity.intensity === 'hard' || activity.intensity === 'moderate');
    
    if (hasActivity) {
      // User has a scheduled activity - this IS their training for this day
      // Don't generate a gym workout, but mark it as their activity
      days.push({
        dayIndex,
        focus: 'cardio', // Treat external activities as cardio/conditioning
        exerciseCount: { min: 0, max: 0 }, // No gym exercises needed
        warmupCount: 0,
        mainCount: { min: 0, max: 0 },
        cooldownCount: 0,
        notes: `📅 ${activity.name} (${activity.intensity} intensity) - counts as training`,
        avoidPatterns: ['gym_workout'], // Signal that this is an external activity day
      });
    } else if (scheduledDays.includes(dayIndex)) {
      const focus = splitPattern[patternIndex % splitPattern.length] as DayPlan['focus'];
      
      days.push({
        dayIndex,
        focus,
        exerciseCount: { min: counts.min, max: counts.max },
        warmupCount: counts.warmup,
        mainCount: { 
          min: counts.min - counts.warmup - counts.cooldown, 
          max: counts.max - counts.warmup - counts.cooldown 
        },
        cooldownCount: counts.cooldown,
      });
      
      patternIndex++;
    } else {
      // Regular rest day
      days.push({
        dayIndex,
        focus: 'rest',
        exerciseCount: { min: 0, max: 0 },
        warmupCount: 0,
        mainCount: { min: 0, max: 0 },
        cooldownCount: 0,
      });
    }
  }
  
  // Time budget
  const transitionTime = experience === 'beginner' ? 2 : 1;
  const warmupMinutes = experience === 'beginner' ? 8 : 6;
  const cooldownMinutes = experience === 'beginner' ? 5 : 4;
  const mainWorkMinutes = sessionDuration - warmupMinutes - cooldownMinutes;
  
  return {
    splitName: preferredSplit && preferredSplit !== 'coach_choice' 
      ? preferredSplit 
      : `auto_${frequency}day_${experience}`,
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
  };
}

/**
 * Get day focus for a specific day of the week
 */
export function getDayFocus(
  dayOfWeek: number, 
  weekNumber: number,
  input: SplitPlannerInput
): { focus: string; constraints: DayPlan } {
  const template = generateWeeklyTemplate(input);
  const dayPlan = template.days[dayOfWeek];
  
  return {
    focus: dayPlan.focus,
    constraints: dayPlan,
  };
}

/**
 * Generate prompt constraints for AI workout generation
 */
export function getPromptConstraints(dayPlan: DayPlan, experience: string): string {
  const focusDescriptions: Record<string, string> = {
    upper: 'UPPER BODY focus: chest, back, shoulders, arms. Minimal or no leg exercises.',
    lower: 'LOWER BODY focus: quads, hamstrings, glutes, calves. Core allowed. Minimal upper body.',
    full: 'FULL BODY: balanced mix of upper and lower. Do NOT repeat same pattern as other days.',
    push: 'PUSH focus: chest, shoulders, triceps. Compound pressing movements.',
    pull: 'PULL focus: back, biceps, rear delts. Rows and pulldowns.',
    legs: 'LEGS focus: squats, hinges, lunges, leg press. Core allowed.',
    chest: 'CHEST focus: bench variations, flyes, dips.',
    back: 'BACK focus: rows, pulldowns, deadlifts.',
    shoulders: 'SHOULDERS focus: overhead press, lateral raises, face pulls.',
    arms: 'ARMS focus: bicep curls, tricep extensions, forearm work.',
    cardio: 'CARDIO/CONDITIONING focus: keep it light, recovery-oriented.',
    recovery: 'RECOVERY day: mobility, stretching, light activity only.',
    rest: 'REST day: no workout scheduled.',
  };
  
  const focusDesc = focusDescriptions[dayPlan.focus] || focusDescriptions.full;
  
  let constraints = `
=== DAY FOCUS: ${dayPlan.focus.toUpperCase()} ===
${focusDesc}

EXERCISE COUNT REQUIREMENTS:
- Total exercises: ${dayPlan.exerciseCount.min}-${dayPlan.exerciseCount.max} (STRICT)
- Warmup: ${dayPlan.warmupCount} exercise(s)
- Main work: ${dayPlan.mainCount.min}-${dayPlan.mainCount.max} exercises
- Cooldown: ${dayPlan.cooldownCount} stretch(es)

VARIATION RULES:
- Do NOT use the exact same exercise count every session
- Keep within the ${dayPlan.exerciseCount.min}-${dayPlan.exerciseCount.max} range
`;
  
  if (dayPlan.avoidPatterns && dayPlan.avoidPatterns.length > 0) {
    constraints += `
⚠️ CONFLICT ADJUSTMENTS:
- Avoid: ${dayPlan.avoidPatterns.join(', ')}
- Reason: User has conflicting activities on this day
`;
  }
  
  return constraints;
}

export default {
  generateWeeklyTemplate,
  getDayFocus,
  getPromptConstraints,
};
