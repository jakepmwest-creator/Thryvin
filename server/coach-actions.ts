/**
 * Coach Actions Contract
 * 
 * PART C: Strict action system for coach plan-editing
 * - Zod validation for all action types
 * - Required fields enforced
 * - No silent defaults (like cardio)
 */

import { z } from 'zod';

// Workout types - comprehensive list
export const WorkoutTypeSchema = z.enum([
  // Upper body splits
  'chest',
  'back',
  'shoulders',
  'arms',
  'biceps',
  'triceps',
  'upper_push',
  'upper_pull',
  'upper_body',
  
  // Lower body splits
  'legs',
  'quads',
  'hamstrings',
  'glutes',
  'lower_body',
  
  // Full body / compound
  'full_body',
  'push',
  'pull',
  
  // Cardio types
  'cardio',
  'hiit',
  'liss',
  'running',
  'cycling',
  
  // Recovery / mobility
  'mobility',
  'yoga',
  'stretching',
  'active_recovery',
  'rest',
  
  // Sports specific
  'core',
  'abs',
  'strength',
  'conditioning',
]);

export type WorkoutType = z.infer<typeof WorkoutTypeSchema>;

// Day of week schema
export const DayOfWeekSchema = z.enum([
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
]);

// Base action fields
const BaseActionFields = {
  confidence: z.number().min(0).max(1).optional(),
  userRequestedType: z.string().optional(), // Original user request for validation
};

// ADD_SESSION action - add a new workout session
export const AddSessionActionSchema = z.object({
  type: z.literal('ADD_SESSION'),
  targetDate: z.string().optional(), // ISO date string
  dayOfWeek: DayOfWeekSchema.optional(),
  workoutType: WorkoutTypeSchema,
  durationMinutes: z.number().min(10).max(180),
  intensity: z.enum(['low', 'medium', 'high']).optional(),
  ...BaseActionFields,
}).refine(
  data => data.targetDate || data.dayOfWeek,
  { message: 'Either targetDate or dayOfWeek must be provided' }
);

// REPLACE_SESSION action - replace existing session with different type
export const ReplaceSessionActionSchema = z.object({
  type: z.literal('REPLACE_SESSION'),
  targetDate: z.string().optional(),
  dayOfWeek: DayOfWeekSchema.optional(),
  newWorkoutType: WorkoutTypeSchema,
  durationMinutes: z.number().min(10).max(180),
  intensity: z.enum(['low', 'medium', 'high']).optional(),
  ...BaseActionFields,
}).refine(
  data => data.targetDate || data.dayOfWeek,
  { message: 'Either targetDate or dayOfWeek must be provided' }
);

// SWAP_DAY action - swap workouts between two days
export const SwapDayActionSchema = z.object({
  type: z.literal('SWAP_DAY'),
  fromDate: z.string().optional(),
  fromDay: DayOfWeekSchema.optional(),
  toDate: z.string().optional(),
  toDay: DayOfWeekSchema.optional(),
  ...BaseActionFields,
}).refine(
  data => (data.fromDate || data.fromDay) && (data.toDate || data.toDay),
  { message: 'Both from and to days/dates must be provided' }
);

// MOVE_SESSION action - move a session to a different day
export const MoveSessionActionSchema = z.object({
  type: z.literal('MOVE_SESSION'),
  fromDate: z.string().optional(),
  fromDay: DayOfWeekSchema.optional(),
  toDate: z.string().optional(),
  toDay: DayOfWeekSchema.optional(),
  ...BaseActionFields,
}).refine(
  data => (data.fromDate || data.fromDay) && (data.toDate || data.toDay),
  { message: 'Both from and to days/dates must be provided' }
);

// SKIP_DAY action - mark a day as skipped/rest
export const SkipDayActionSchema = z.object({
  type: z.literal('SKIP_DAY'),
  targetDate: z.string().optional(),
  dayOfWeek: DayOfWeekSchema.optional(),
  reason: z.string().optional(),
  ...BaseActionFields,
}).refine(
  data => data.targetDate || data.dayOfWeek,
  { message: 'Either targetDate or dayOfWeek must be provided' }
);

// REGENERATE_SESSION action - regenerate a specific day's workout
export const RegenerateSessionActionSchema = z.object({
  type: z.literal('REGENERATE_SESSION'),
  targetDate: z.string().optional(),
  dayOfWeek: DayOfWeekSchema.optional(),
  workoutType: WorkoutTypeSchema.optional(), // If provided, generate this type
  ...BaseActionFields,
}).refine(
  data => data.targetDate || data.dayOfWeek,
  { message: 'Either targetDate or dayOfWeek must be provided' }
);

// Union of all action types
export const CoachActionSchema = z.discriminatedUnion('type', [
  AddSessionActionSchema,
  ReplaceSessionActionSchema,
  SwapDayActionSchema,
  MoveSessionActionSchema,
  SkipDayActionSchema,
  RegenerateSessionActionSchema,
]);

export type CoachAction = z.infer<typeof CoachActionSchema>;
export type AddSessionAction = z.infer<typeof AddSessionActionSchema>;
export type ReplaceSessionAction = z.infer<typeof ReplaceSessionActionSchema>;
export type SwapDayAction = z.infer<typeof SwapDayActionSchema>;
export type MoveSessionAction = z.infer<typeof MoveSessionActionSchema>;
export type SkipDayAction = z.infer<typeof SkipDayActionSchema>;
export type RegenerateSessionAction = z.infer<typeof RegenerateSessionActionSchema>;

// Follow-up question types
export const FollowUpTypeSchema = z.enum([
  'DURATION_NEEDED',
  'WORKOUT_TYPE_NEEDED',
  'DAY_NEEDED',
  'CONFIRMATION_NEEDED',
  'CLARIFICATION_NEEDED',
]);

export type FollowUpType = z.infer<typeof FollowUpTypeSchema>;

// Follow-up question schema
export const FollowUpSchema = z.object({
  type: FollowUpTypeSchema,
  question: z.string(),
  options: z.array(z.object({
    label: z.string(),
    value: z.string(),
  })).optional(),
  context: z.record(z.any()).optional(), // Partial action data collected so far
});

export type FollowUp = z.infer<typeof FollowUpSchema>;

// Coach response schema - includes both message and potential action
export const CoachResponseSchema = z.object({
  message: z.string(),
  action: CoachActionSchema.nullable().optional(),
  followUp: FollowUpSchema.nullable().optional(),
  needsConfirmation: z.boolean().optional(),
});

export type CoachResponse = z.infer<typeof CoachResponseSchema>;

/**
 * Validate an action against its schema
 */
export function validateAction(action: unknown): { valid: boolean; action?: CoachAction; errors?: string[] } {
  const result = CoachActionSchema.safeParse(action);
  
  if (result.success) {
    return { valid: true, action: result.data };
  }
  
  return {
    valid: false,
    errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
  };
}

/**
 * Detect workout type from user message
 * Returns null if ambiguous (requires follow-up)
 */
export function detectWorkoutType(message: string): WorkoutType | null {
  const lower = message.toLowerCase();
  
  // Direct matches
  const typeMap: Record<string, WorkoutType> = {
    'chest': 'chest',
    'back': 'back',
    'shoulders': 'shoulders',
    'arms': 'arms',
    'biceps': 'biceps',
    'triceps': 'triceps',
    'legs': 'legs',
    'leg': 'legs',
    'quads': 'quads',
    'hamstrings': 'hamstrings',
    'glutes': 'glutes',
    'booty': 'glutes',
    'butt': 'glutes',
    'upper body': 'upper_body',
    'upper push': 'upper_push',
    'upper pull': 'upper_pull',
    'lower body': 'lower_body',
    'full body': 'full_body',
    'push': 'push',
    'pull': 'pull',
    'cardio': 'cardio',
    'hiit': 'hiit',
    'running': 'running',
    'run': 'running',
    'cycling': 'cycling',
    'bike': 'cycling',
    'yoga': 'yoga',
    'stretching': 'stretching',
    'stretch': 'stretching',
    'mobility': 'mobility',
    'core': 'core',
    'abs': 'abs',
    'strength': 'strength',
    'conditioning': 'conditioning',
  };
  
  for (const [keyword, type] of Object.entries(typeMap)) {
    if (lower.includes(keyword)) {
      return type;
    }
  }
  
  return null;
}

/**
 * Detect day from user message
 */
export function detectDay(message: string): { dayOfWeek?: string; targetDate?: string } | null {
  const lower = message.toLowerCase();
  
  // Today/tomorrow
  if (lower.includes('today')) {
    return { targetDate: new Date().toISOString().split('T')[0] };
  }
  if (lower.includes('tomorrow')) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return { targetDate: tomorrow.toISOString().split('T')[0] };
  }
  
  // Day of week
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  for (const day of days) {
    if (lower.includes(day)) {
      return { dayOfWeek: day };
    }
  }
  
  return null;
}

/**
 * Detect duration from user message
 */
export function detectDuration(message: string): number | null {
  const lower = message.toLowerCase();
  
  // Common patterns
  const patterns = [
    /(\d+)\s*(?:min|minute)/i,
    /(\d+)\s*(?:hr|hour)/i,
  ];
  
  for (const pattern of patterns) {
    const match = lower.match(pattern);
    if (match) {
      let duration = parseInt(match[1]);
      if (lower.includes('hour') || lower.includes('hr')) {
        duration *= 60;
      }
      return Math.min(Math.max(duration, 10), 180); // Clamp to valid range
    }
  }
  
  // Keywords
  if (lower.includes('quick') || lower.includes('short')) return 20;
  if (lower.includes('long') || lower.includes('extended')) return 60;
  if (lower.includes('usual') || lower.includes('normal')) return null; // Use user's default
  
  return null;
}

/**
 * Build a follow-up question when required fields are missing
 */
export function buildFollowUp(
  partialAction: Partial<CoachAction>,
  userDefaultDuration?: number
): FollowUp | null {
  // Missing workout type
  if (!('workoutType' in partialAction) && !('newWorkoutType' in partialAction)) {
    return {
      type: 'WORKOUT_TYPE_NEEDED',
      question: 'What type of workout would you like?',
      options: [
        { label: 'Chest', value: 'chest' },
        { label: 'Back', value: 'back' },
        { label: 'Arms', value: 'arms' },
        { label: 'Legs', value: 'legs' },
        { label: 'Shoulders', value: 'shoulders' },
        { label: 'Full Body', value: 'full_body' },
        { label: 'Cardio', value: 'cardio' },
        { label: 'Core', value: 'core' },
      ],
      context: partialAction,
    };
  }
  
  // Missing duration (for actions that require it)
  if ('workoutType' in partialAction && !('durationMinutes' in partialAction)) {
    const usual = userDefaultDuration || 45;
    return {
      type: 'DURATION_NEEDED',
      question: `How long do you want? Your usual is ${usual} min.`,
      options: [
        { label: `Usual (${usual} min)`, value: usual.toString() },
        { label: '30 min', value: '30' },
        { label: '45 min', value: '45' },
        { label: '60 min', value: '60' },
        { label: 'Custom', value: 'custom' },
      ],
      context: partialAction,
    };
  }
  
  // Missing day
  if (!('targetDate' in partialAction) && !('dayOfWeek' in partialAction)) {
    return {
      type: 'DAY_NEEDED',
      question: 'Which day?',
      options: [
        { label: 'Today', value: 'today' },
        { label: 'Tomorrow', value: 'tomorrow' },
        { label: 'Monday', value: 'monday' },
        { label: 'Tuesday', value: 'tuesday' },
        { label: 'Wednesday', value: 'wednesday' },
        { label: 'Thursday', value: 'thursday' },
        { label: 'Friday', value: 'friday' },
        { label: 'Saturday', value: 'saturday' },
        { label: 'Sunday', value: 'sunday' },
      ],
      context: partialAction,
    };
  }
  
  return null;
}
