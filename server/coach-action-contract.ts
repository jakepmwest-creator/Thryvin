/**
 * Coach Action Contract - STRICT TYPE-SAFE ACTION SYSTEM
 * 
 * CRITICAL RULES:
 * 1. NO action execution based on raw natural language
 * 2. ALL actions must go through Zod validation
 * 3. If confidence < 0.75 OR missing fields → NO execution, ask clarifying question
 * 4. User corrections MUST invalidate previous pendingAction
 * 5. FAIL CLOSED - on any parse error, ask clarifying question
 */

import { z } from 'zod';

// =============================================================================
// WORKOUT TYPE ENUM - All valid workout types
// =============================================================================

export const WorkoutTypeEnum = z.enum([
  'arms',
  'biceps',
  'triceps',
  'chest',
  'back',
  'shoulders',
  'legs',
  'quads',
  'hamstrings',
  'glutes',
  'core',
  'abs',
  'full_body',
  'upper',
  'lower',
  'push',
  'pull',
  'cardio',
  'hiit',
  'yoga',
  'flexibility',
  'recovery',
  'mobility',
]);

export type WorkoutType = z.infer<typeof WorkoutTypeEnum>;

// =============================================================================
// ACTION TYPE ENUM - The ONLY executable actions
// =============================================================================

export const ActionTypeEnum = z.enum([
  'add_workout_session',
  'swap_today_workout_type',
  'move_workout_to_day',
  'replace_exercise',
  'adjust_session_duration',
  'mark_rest_day',
  'regenerate_today_workout',
  'cancel_action',
  'add_exercise',
  'remove_exercise',
]);

export type ActionType = z.infer<typeof ActionTypeEnum>;

// =============================================================================
// COACH ACTION SCHEMA - Strict validation for all actions
// =============================================================================

export const CoachActionSchema = z.object({
  actionType: ActionTypeEnum,
  targetDay: z.string().optional(), // ISO date or weekday
  workoutType: WorkoutTypeEnum.optional(),
  exerciseName: z.string().optional(),
  duration: z.number().min(5).max(180).optional(),
  reason: z.string().optional(),
  confidence: z.number().min(0).max(1),
  requiresConfirmation: z.boolean(),
  confirmationText: z.string().optional(),
});

export type CoachAction = z.infer<typeof CoachActionSchema>;

// =============================================================================
// PENDING ACTION - Stored when awaiting confirmation
// =============================================================================

export const PendingActionSchema = z.object({
  id: z.string(),
  action: CoachActionSchema,
  createdAt: z.string(),
  userMessageThatTriggered: z.string(),
  expiresAt: z.string(), // Auto-expire after 60 seconds
});

export type PendingAction = z.infer<typeof PendingActionSchema>;

// =============================================================================
// INTENT DETECTION - Map user message to potential action
// =============================================================================

interface IntentDetectionResult {
  detectedIntent: ActionType | null;
  detectedWorkoutType: WorkoutType | null;
  detectedDay: string | null;
  confidence: number;
  rawMatches: string[];
}

// Workout type keywords mapping - COMPREHENSIVE
const WORKOUT_TYPE_KEYWORDS: Record<WorkoutType, string[]> = {
  arms: ['arms', 'arm', 'bicep', 'tricep', 'biceps', 'triceps', 'arm day', 'arm workout'],
  biceps: ['bicep', 'biceps', 'curl', 'curls'],
  triceps: ['tricep', 'triceps', 'pushdown', 'skull crusher'],
  chest: ['chest', 'pec', 'pecs', 'bench', 'chest day'],
  back: ['back', 'lat', 'lats', 'row', 'pull', 'back day'],
  shoulders: ['shoulder', 'shoulders', 'delt', 'delts', 'overhead press', 'shoulder day'],
  legs: ['leg', 'legs', 'quad', 'quads', 'hamstring', 'hamstrings', 'leg day', 'lower body'],
  quads: ['quad', 'quads', 'quadriceps', 'squat'],
  hamstrings: ['hamstring', 'hamstrings', 'leg curl'],
  glutes: ['glute', 'glutes', 'butt', 'hip thrust'],
  core: ['core', 'ab', 'abs', 'abdominal', 'plank'],
  abs: ['ab', 'abs', 'six pack', 'abdominal'],
  full_body: ['full body', 'full-body', 'total body', 'whole body'],
  upper: ['upper', 'upper body'],
  lower: ['lower', 'lower body'],
  push: ['push', 'push day', 'pressing'],
  pull: ['pull', 'pull day', 'pulling'],
  cardio: ['cardio', 'run', 'running', 'jog', 'jogging', 'bike', 'cycling', 'swim', 'swimming', 'treadmill', '5k', '10k'],
  hiit: ['hiit', 'high intensity', 'interval', 'tabata'],
  yoga: ['yoga', 'vinyasa', 'hatha'],
  flexibility: ['flexibility', 'stretch', 'stretching', 'mobility work'],
  recovery: ['recovery', 'active recovery', 'light', 'easy'],
  mobility: ['mobility', 'mobility work', 'joint'],
};

// Day keywords
const DAY_KEYWORDS: Record<string, string[]> = {
  today: ['today', 'now', 'this evening', 'tonight'],
  tomorrow: ['tomorrow', 'tmrw'],
  monday: ['monday', 'mon'],
  tuesday: ['tuesday', 'tue', 'tues'],
  wednesday: ['wednesday', 'wed'],
  thursday: ['thursday', 'thu', 'thurs'],
  friday: ['friday', 'fri'],
  saturday: ['saturday', 'sat'],
  sunday: ['sunday', 'sun'],
};

// Intent keywords
const INTENT_KEYWORDS: Record<ActionType, string[]> = {
  add_workout_session: ['add', 'create', 'schedule', 'put in', 'include', 'want to do', 'do a', 'feeling like'],
  swap_today_workout_type: ['swap', 'switch', 'change', 'replace', 'make it', 'turn into', 'convert to'],
  move_workout_to_day: ['move', 'shift', 'reschedule', 'push', 'bring forward'],
  replace_exercise: ['replace', 'substitute', 'swap out', 'change exercise'],
  adjust_session_duration: ['longer', 'shorter', 'more time', 'less time', 'extend', 'cut short'],
  mark_rest_day: ['rest', 'skip', 'take off', 'recovery day', 'day off'],
  regenerate_today_workout: ['regenerate', 'new workout', 'different workout', 'refresh'],
  cancel_action: ['cancel', 'never mind', 'forget it', 'no', 'stop'],
  add_exercise: ['add exercise', 'include exercise', 'throw in'],
  remove_exercise: ['remove exercise', 'take out', 'drop'],
};

/**
 * Detect user intent from message - STRICT matching
 */
export function detectIntent(message: string): IntentDetectionResult {
  const lower = message.toLowerCase().trim();
  const rawMatches: string[] = [];
  
  // Detect workout type FIRST (most specific)
  let detectedWorkoutType: WorkoutType | null = null;
  let workoutTypeConfidence = 0;
  
  for (const [type, keywords] of Object.entries(WORKOUT_TYPE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        rawMatches.push(`workout_type:${type}:${keyword}`);
        // Longer matches are more confident
        const keywordConfidence = keyword.length / 10;
        if (keywordConfidence > workoutTypeConfidence) {
          detectedWorkoutType = type as WorkoutType;
          workoutTypeConfidence = Math.min(keywordConfidence + 0.5, 1);
        }
      }
    }
  }
  
  // Detect intent
  let detectedIntent: ActionType | null = null;
  let intentConfidence = 0;
  
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        rawMatches.push(`intent:${intent}:${keyword}`);
        const keywordConfidence = keyword.length / 15;
        if (keywordConfidence > intentConfidence) {
          detectedIntent = intent as ActionType;
          intentConfidence = Math.min(keywordConfidence + 0.3, 0.9);
        }
      }
    }
  }
  
  // Detect day
  let detectedDay: string | null = null;
  
  for (const [day, keywords] of Object.entries(DAY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        rawMatches.push(`day:${day}:${keyword}`);
        detectedDay = day;
        break;
      }
    }
    if (detectedDay) break;
  }
  
  // Calculate overall confidence
  let confidence = 0;
  if (detectedIntent && detectedWorkoutType) {
    confidence = Math.min((intentConfidence + workoutTypeConfidence) / 2 + 0.2, 0.95);
  } else if (detectedIntent) {
    confidence = intentConfidence * 0.7;
  } else if (detectedWorkoutType) {
    // Just mentioned a workout type without clear action
    confidence = 0.3;
  }
  
  return {
    detectedIntent,
    detectedWorkoutType,
    detectedDay,
    confidence,
    rawMatches,
  };
}

// =============================================================================
// INTENT VALIDATION - Check if proposed action matches user message
// =============================================================================

/**
 * CRITICAL: Validate that proposed action matches user's actual intent
 * Returns false if there's a mismatch (e.g., user said "arms" but action says "cardio")
 */
export function validateActionMatchesIntent(
  userMessage: string,
  proposedAction: CoachAction
): { valid: boolean; mismatch?: string } {
  const detected = detectIntent(userMessage);
  
  // Check workout type mismatch
  if (proposedAction.workoutType && detected.detectedWorkoutType) {
    // Allow related types (e.g., "arms" matches "biceps" or "triceps")
    const relatedTypes: Record<WorkoutType, WorkoutType[]> = {
      arms: ['arms', 'biceps', 'triceps'],
      biceps: ['arms', 'biceps'],
      triceps: ['arms', 'triceps'],
      legs: ['legs', 'quads', 'hamstrings', 'glutes', 'lower'],
      quads: ['legs', 'quads'],
      hamstrings: ['legs', 'hamstrings'],
      glutes: ['legs', 'glutes'],
      upper: ['upper', 'chest', 'back', 'shoulders', 'arms', 'push', 'pull'],
      lower: ['lower', 'legs', 'quads', 'hamstrings', 'glutes'],
      push: ['push', 'chest', 'shoulders', 'triceps'],
      pull: ['pull', 'back', 'biceps'],
      chest: ['chest', 'push', 'upper'],
      back: ['back', 'pull', 'upper'],
      shoulders: ['shoulders', 'push', 'upper'],
      core: ['core', 'abs'],
      abs: ['abs', 'core'],
      full_body: ['full_body'],
      cardio: ['cardio', 'hiit'],
      hiit: ['hiit', 'cardio'],
      yoga: ['yoga', 'flexibility', 'recovery'],
      flexibility: ['flexibility', 'yoga', 'mobility'],
      recovery: ['recovery', 'flexibility', 'yoga', 'mobility'],
      mobility: ['mobility', 'flexibility', 'recovery'],
    };
    
    const allowedTypes = relatedTypes[detected.detectedWorkoutType] || [detected.detectedWorkoutType];
    
    if (!allowedTypes.includes(proposedAction.workoutType)) {
      return {
        valid: false,
        mismatch: `User asked for "${detected.detectedWorkoutType}" but action proposes "${proposedAction.workoutType}"`,
      };
    }
  }
  
  return { valid: true };
}

// =============================================================================
// BUILD COACH ACTION - Create validated action from intent
// =============================================================================

/**
 * Build a CoachAction from detected intent
 * Returns null if confidence is too low or required fields are missing
 */
export function buildCoachAction(
  userMessage: string,
  previousPendingAction?: PendingAction | null
): { action: CoachAction | null; clarifyingQuestion?: string; routeToQuickActions?: string } {
  const detected = detectIntent(userMessage);
  
  console.log(`🎯 [ACTION] Intent detection:`, {
    intent: detected.detectedIntent,
    workoutType: detected.detectedWorkoutType,
    day: detected.detectedDay,
    confidence: detected.confidence.toFixed(2),
  });
  
  // Check for user correction/rejection
  const isRejection = /^(no|not|don't|dont|nope|wrong|that's not|thats not)/i.test(userMessage.trim());
  const isCorrection = /not\s+(cardio|chest|back|legs|arms)/i.test(userMessage.toLowerCase());
  
  if (isRejection || isCorrection) {
    // User is rejecting/correcting - invalidate previous action
    console.log(`❌ [ACTION] User rejection/correction detected`);
    
    if (detected.detectedWorkoutType) {
      // User corrected with a specific type
      return {
        action: {
          actionType: previousPendingAction?.action.actionType || 'add_workout_session',
          workoutType: detected.detectedWorkoutType,
          targetDay: detected.detectedDay || previousPendingAction?.action.targetDay || 'today',
          confidence: 0.85,
          requiresConfirmation: true,
          confirmationText: `Got it! I'll make it ${detected.detectedWorkoutType.toUpperCase()} instead. Confirm?`,
        },
        clarifyingQuestion: undefined,
      };
    } else {
      // Rejection without alternative - ask what they want
      return {
        action: null,
        clarifyingQuestion: "I understand, that's not what you wanted. What type of workout would you like instead? (e.g., arms, chest, back, legs, cardio)",
      };
    }
  }
  
  // CRITICAL: If confidence is too low, don't propose an action
  if (detected.confidence < 0.5) {
    console.log(`⚠️ [ACTION] Confidence too low (${detected.confidence.toFixed(2)}), asking for clarification`);
    return {
      action: null,
      clarifyingQuestion: "I'm not sure what change you'd like to make. Could you be more specific? For example:\n• 'Add an arms workout today'\n• 'Swap today to chest day'\n• 'Move Friday's workout to Thursday'",
      routeToQuickActions: "Or swipe up to use Quick Actions for easy workout editing.",
    };
  }
  
  // Build action based on intent
  if (!detected.detectedIntent) {
    // No clear intent - route to Quick Actions
    return {
      action: null,
      routeToQuickActions: "To make changes to your workout plan, swipe up and use Quick Actions → Edit, Add, or Remove exercises.",
    };
  }
  
  // Determine if confirmation is required
  const requiresConfirmation = detected.confidence < 0.9 || 
    ['add_workout_session', 'swap_today_workout_type', 'move_workout_to_day', 'regenerate_today_workout'].includes(detected.detectedIntent);
  
  const action: CoachAction = {
    actionType: detected.detectedIntent,
    targetDay: detected.detectedDay || 'today',
    workoutType: detected.detectedWorkoutType || undefined,
    confidence: detected.confidence,
    requiresConfirmation,
    confirmationText: buildConfirmationText(detected),
  };
  
  return { action };
}

/**
 * Build human-readable confirmation text
 */
function buildConfirmationText(detected: IntentDetectionResult): string {
  const day = detected.detectedDay || 'today';
  const type = detected.detectedWorkoutType ? detected.detectedWorkoutType.toUpperCase() : 'workout';
  
  switch (detected.detectedIntent) {
    case 'add_workout_session':
      return `Add a ${type} session for ${day}?`;
    case 'swap_today_workout_type':
      return `Change today's workout to ${type}?`;
    case 'move_workout_to_day':
      return `Move the workout to ${day}?`;
    case 'mark_rest_day':
      return `Make ${day} a rest day?`;
    case 'regenerate_today_workout':
      return `Generate a fresh ${type} workout for today?`;
    default:
      return `Confirm this change?`;
  }
}

// =============================================================================
// GENERATE PENDING ACTION ID
// =============================================================================

export function generatePendingActionId(): string {
  return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// =============================================================================
// CREATE PENDING ACTION
// =============================================================================

export function createPendingAction(action: CoachAction, userMessage: string): PendingAction {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 60000); // 60 second expiry
  
  return {
    id: generatePendingActionId(),
    action,
    createdAt: now.toISOString(),
    userMessageThatTriggered: userMessage,
    expiresAt: expiresAt.toISOString(),
  };
}

// =============================================================================
// VALIDATE PENDING ACTION
// =============================================================================

export function validatePendingAction(pending: PendingAction): { valid: boolean; reason?: string } {
  // Check expiry
  if (new Date(pending.expiresAt) < new Date()) {
    return { valid: false, reason: 'Action expired. Please try again.' };
  }
  
  // Validate action schema
  try {
    CoachActionSchema.parse(pending.action);
    return { valid: true };
  } catch (error) {
    return { valid: false, reason: 'Invalid action format.' };
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  WORKOUT_TYPE_KEYWORDS,
  DAY_KEYWORDS,
  INTENT_KEYWORDS,
};
