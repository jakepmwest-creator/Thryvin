/**
 * Coach Action Executor
 * 
 * PART C4: Execute validated coach actions
 * - Validates action schema
 * - Applies changes to plan in DB
 * - Calls workout generator for ADD/REPLACE actions
 * 
 * HARD RULES:
 * - NEVER default to cardio when user requests strength workout
 * - Validate action matches user intent BEFORE execution
 * - Block mismatched actions with clear error
 */

import { Express, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from './jwt-auth';
import { ApiRequest } from './api-middleware';
import { storage } from './storage';
import {
  CoachAction,
  validateAction,
  AddSessionAction,
  ReplaceSessionAction,
  SwapDayAction,
  MoveSessionAction,
  SkipDayAction,
  RegenerateSessionAction,
  WorkoutType,
} from './coach-actions';
import { validateCoachActionIntent } from './workout-validation';

// Map workout types to categories for the generator
const WORKOUT_TYPE_CATEGORIES: Record<WorkoutType, string> = {
  chest: 'chest',
  back: 'back',
  shoulders: 'shoulders',
  arms: 'arms',
  biceps: 'arms',
  triceps: 'arms',
  upper_push: 'push',
  upper_pull: 'pull',
  upper_body: 'upper',
  legs: 'legs',
  quads: 'legs',
  hamstrings: 'legs',
  glutes: 'legs',
  lower_body: 'lower',
  full_body: 'full',
  push: 'push',
  pull: 'pull',
  cardio: 'cardio',
  hiit: 'hiit',
  liss: 'cardio',
  running: 'cardio',
  cycling: 'cardio',
  mobility: 'mobility',
  yoga: 'mobility',
  stretching: 'mobility',
  active_recovery: 'recovery',
  rest: 'rest',
  core: 'core',
  abs: 'core',
  strength: 'strength',
  conditioning: 'conditioning',
};

/**
 * Get the target date from an action
 */
function getTargetDate(action: { targetDate?: string; dayOfWeek?: string }): Date {
  if (action.targetDate) {
    return new Date(action.targetDate);
  }
  
  if (action.dayOfWeek) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetDayIndex = days.indexOf(action.dayOfWeek.toLowerCase());
    const today = new Date();
    const currentDayIndex = today.getDay();
    
    let daysUntilTarget = targetDayIndex - currentDayIndex;
    if (daysUntilTarget <= 0) {
      daysUntilTarget += 7; // Next week
    }
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysUntilTarget);
    return targetDate;
  }
  
  return new Date(); // Default to today
}

/**
 * Execute ADD_SESSION action
 */
async function executeAddSession(
  action: AddSessionAction,
  userId: number,
  user: any
): Promise<{ ok: boolean; message: string; workoutId?: number }> {
  try {
    const targetDate = getTargetDate(action);
    const dayName = targetDate.toLocaleDateString('en-US', { weekday: 'long' });
    const dateStr = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    console.log(`[CoachAction] ADD_SESSION: ${action.workoutType} (${action.durationMinutes}min) for user ${userId} on ${dayName} (${dateStr})`);
    
    // Build workout payload
    const payloadJson = {
      dayName: dayName.toLowerCase(),
      dayIndex: targetDate.getDay(),
      workoutType: action.workoutType,
      duration: action.durationMinutes,
      intensity: action.intensity || 'medium',
      exercises: [], // Exercises can be generated separately
      createdBy: 'coach_action',
    };
    
    // Create a workout day entry
    const workoutDay = await storage.createWorkoutDay({
      userId,
      date: dateStr,
      status: 'ready',
      payloadJson,
    });
    
    return {
      ok: true,
      message: `Added ${action.durationMinutes}-minute ${action.workoutType.replace('_', ' ')} workout for ${dayName}`,
      workoutId: workoutDay.id,
    };
  } catch (error: any) {
    console.error('[CoachAction] ADD_SESSION failed:', error);
    return {
      ok: false,
      message: `Failed to add session: ${error.message}`,
    };
  }
}

/**
 * Execute REPLACE_SESSION action
 */
async function executeReplaceSession(
  action: ReplaceSessionAction,
  userId: number,
  user: any
): Promise<{ ok: boolean; message: string }> {
  try {
    const targetDate = getTargetDate(action);
    const dayName = targetDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const dateStr = targetDate.toISOString().split('T')[0];
    
    console.log(`[CoachAction] REPLACE_SESSION: ${action.newWorkoutType} (${action.durationMinutes}min) for user ${userId} on ${dayName}`);
    
    // Delete existing workout for that day
    const existingWorkouts = await storage.getWorkoutDays(userId);
    
    for (const workout of existingWorkouts) {
      if (workout.date === dateStr) {
        await storage.deleteWorkoutDay(workout.id);
      }
    }
    
    // Build workout payload
    const payloadJson = {
      dayName,
      dayIndex: targetDate.getDay(),
      workoutType: action.newWorkoutType,
      duration: action.durationMinutes,
      intensity: action.intensity || 'medium',
      exercises: [],
      createdBy: 'coach_action',
    };
    
    // Create new workout day
    await storage.createWorkoutDay({
      userId,
      date: dateStr,
      status: 'ready',
      payloadJson,
    });
    
    return {
      ok: true,
      message: `Replaced workout with ${action.durationMinutes}-minute ${action.newWorkoutType.replace('_', ' ')} session`,
    };
  } catch (error: any) {
    console.error('[CoachAction] REPLACE_SESSION failed:', error);
    return {
      ok: false,
      message: `Failed to replace session: ${error.message}`,
    };
  }
}

/**
 * Execute SWAP_DAY action
 */
async function executeSwapDay(
  action: SwapDayAction,
  userId: number
): Promise<{ ok: boolean; message: string }> {
  try {
    const fromDate = getTargetDate({ targetDate: action.fromDate, dayOfWeek: action.fromDay });
    const toDate = getTargetDate({ targetDate: action.toDate, dayOfWeek: action.toDay });
    const fromDateStr = fromDate.toISOString().split('T')[0];
    const toDateStr = toDate.toISOString().split('T')[0];
    
    console.log(`[CoachAction] SWAP_DAY: ${fromDateStr} <-> ${toDateStr} for user ${userId}`);
    
    const workouts = await storage.getWorkoutDays(userId);
    
    const fromWorkout = workouts.find(w => w.date === fromDateStr);
    const toWorkout = workouts.find(w => w.date === toDateStr);
    
    if (!fromWorkout && !toWorkout) {
      return { ok: false, message: 'No workouts found on either day to swap' };
    }
    
    // Swap dates by updating payloads
    if (fromWorkout) {
      await storage.updateWorkoutDay(fromWorkout.id, { date: toDateStr });
    }
    if (toWorkout) {
      await storage.updateWorkoutDay(toWorkout.id, { date: fromDateStr });
    }
    
    const fromDayName = fromDate.toLocaleDateString('en-US', { weekday: 'long' });
    const toDayName = toDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    return {
      ok: true,
      message: `Swapped ${fromDayName} and ${toDayName} workouts`,
    };
  } catch (error: any) {
    console.error('[CoachAction] SWAP_DAY failed:', error);
    return {
      ok: false,
      message: `Failed to swap days: ${error.message}`,
    };
  }
}

/**
 * Execute MOVE_SESSION action
 */
async function executeMoveSession(
  action: MoveSessionAction,
  userId: number
): Promise<{ ok: boolean; message: string }> {
  try {
    const fromDate = getTargetDate({ targetDate: action.fromDate, dayOfWeek: action.fromDay });
    const toDate = getTargetDate({ targetDate: action.toDate, dayOfWeek: action.toDay });
    const fromDateStr = fromDate.toISOString().split('T')[0];
    const toDateStr = toDate.toISOString().split('T')[0];
    
    console.log(`[CoachAction] MOVE_SESSION: ${fromDateStr} -> ${toDateStr} for user ${userId}`);
    
    const workouts = await storage.getWorkoutDays(userId);
    
    const fromWorkout = workouts.find(w => w.date === fromDateStr);
    
    if (!fromWorkout) {
      const fromDayName = fromDate.toLocaleDateString('en-US', { weekday: 'long' });
      return { ok: false, message: `No workout found on ${fromDayName}` };
    }
    
    // Move to new date
    await storage.updateWorkoutDay(fromWorkout.id, { date: toDateStr });
    
    const fromDayName = fromDate.toLocaleDateString('en-US', { weekday: 'long' });
    const toDayName = toDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    return {
      ok: true,
      message: `Moved workout from ${fromDayName} to ${toDayName}`,
    };
  } catch (error: any) {
    console.error('[CoachAction] MOVE_SESSION failed:', error);
    return {
      ok: false,
      message: `Failed to move session: ${error.message}`,
    };
  }
}

/**
 * Execute SKIP_DAY action
 */
async function executeSkipDay(
  action: SkipDayAction,
  userId: number
): Promise<{ ok: boolean; message: string }> {
  try {
    const targetDate = getTargetDate(action);
    const dateStr = targetDate.toISOString().split('T')[0];
    const dayName = targetDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    console.log(`[CoachAction] SKIP_DAY: ${dayName} for user ${userId}`);
    
    const workouts = await storage.getWorkoutDays(userId);
    const workout = workouts.find(w => w.date === dateStr);
    
    if (workout) {
      // Update payload to mark as skipped
      const payload = (workout.payloadJson as any) || {};
      payload.isSkipped = true;
      payload.skipReason = action.reason;
      await storage.updateWorkoutDay(workout.id, { 
        status: 'ready',
        payloadJson: payload,
      });
    } else {
      // Create a skipped day entry
      await storage.createWorkoutDay({
        userId,
        date: dateStr,
        status: 'ready',
        payloadJson: {
          dayName: dayName.toLowerCase(),
          dayIndex: targetDate.getDay(),
          workoutType: 'rest',
          isSkipped: true,
          skipReason: action.reason,
        },
      });
    }
    
    return {
      ok: true,
      message: `Marked ${dayName} as skipped${action.reason ? `: ${action.reason}` : ''}`,
    };
  } catch (error: any) {
    console.error('[CoachAction] SKIP_DAY failed:', error);
    return {
      ok: false,
      message: `Failed to skip day: ${error.message}`,
    };
  }
}

/**
 * Execute REGENERATE_SESSION action
 */
async function executeRegenerateSession(
  action: RegenerateSessionAction,
  userId: number,
  user: any
): Promise<{ ok: boolean; message: string }> {
  try {
    const targetDate = getTargetDate(action);
    const dayName = targetDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const dateStr = targetDate.toISOString().split('T')[0];
    
    console.log(`[CoachAction] REGENERATE_SESSION: ${dayName} for user ${userId}`);
    
    const workouts = await storage.getWorkoutDays(userId);
    const existingWorkout = workouts.find(w => w.date === dateStr);
    
    // Get workout type from existing or action
    let workoutType = action.workoutType || 'full_body';
    let duration = user.sessionDuration || 45;
    
    if (existingWorkout?.payloadJson) {
      const payload = existingWorkout.payloadJson as any;
      workoutType = payload.workoutType || workoutType;
      duration = payload.duration || duration;
    }
    
    // Delete existing
    if (existingWorkout) {
      await storage.deleteWorkoutDay(existingWorkout.id);
    }
    
    // Build workout payload
    const payloadJson = {
      dayName,
      dayIndex: targetDate.getDay(),
      workoutType,
      duration,
      intensity: 'medium',
      exercises: [],
      createdBy: 'coach_action',
      regenerated: true,
    };
    
    // Create new workout day
    await storage.createWorkoutDay({
      userId,
      date: dateStr,
      status: 'ready',
      payloadJson,
    });
    
    return {
      ok: true,
      message: `Regenerated ${dayName}'s ${workoutType} workout`,
    };
  } catch (error: any) {
    console.error('[CoachAction] REGENERATE_SESSION failed:', error);
    return {
      ok: false,
      message: `Failed to regenerate session: ${error.message}`,
    };
  }
}

/**
 * Main action executor
 */
async function executeAction(
  action: CoachAction,
  userId: number,
  user: any
): Promise<{ ok: boolean; message: string; updatedPlanSummary?: any }> {
  switch (action.type) {
    case 'ADD_SESSION':
      return executeAddSession(action, userId, user);
    case 'REPLACE_SESSION':
      return executeReplaceSession(action, userId, user);
    case 'SWAP_DAY':
      return executeSwapDay(action, userId);
    case 'MOVE_SESSION':
      return executeMoveSession(action, userId);
    case 'SKIP_DAY':
      return executeSkipDay(action, userId);
    case 'REGENERATE_SESSION':
      return executeRegenerateSession(action, userId, user);
    default:
      return { ok: false, message: 'Unknown action type' };
  }
}

/**
 * Setup coach action routes
 */
export function setupCoachActionRoutes(app: Express) {
  // C4: POST /api/coach/actions/execute - Execute a validated action
  app.post('/api/coach/actions/execute', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    const requestId = (req as ApiRequest).requestId || 'unknown';
    
    if (!req.user) {
      return res.status(401).json({
        ok: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
        requestId,
      });
    }
    
    const { action } = req.body;
    
    if (!action) {
      return res.status(400).json({
        ok: false,
        error: 'Action is required',
        code: 'MISSING_ACTION',
        requestId,
      });
    }
    
    // Validate action schema
    const validation = validateAction(action);
    
    if (!validation.valid) {
      console.log(`[API] ${requestId} | Action validation failed:`, validation.errors);
      return res.status(400).json({
        ok: false,
        error: 'Invalid action schema',
        code: 'INVALID_ACTION',
        details: validation.errors,
        requestId,
      });
    }
    
    // C6: CRITICAL CHECK - Verify action matches user intent
    // If user requested "chest" but action is "cardio", block it
    if (validation.action?.userRequestedType) {
      const intentValidation = validateCoachActionIntent(
        validation.action.userRequestedType,
        ('workoutType' in validation.action ? validation.action.workoutType : 
         'newWorkoutType' in validation.action ? validation.action.newWorkoutType : '') as string
      );
      
      if (!intentValidation.valid) {
        console.error(`[API] ${requestId} | ${intentValidation.error}`);
        return res.status(400).json({
          ok: false,
          error: intentValidation.error,
          code: 'ACTION_MISMATCH',
          suggestion: 'Please clarify what type of workout you want, or try again.',
          requestId,
        });
      }
    }
    
    // ADDITIONAL: Check workout type against common mismatch patterns
    let actionType: string | undefined;
    if ('workoutType' in validation.action!) {
      actionType = validation.action!.workoutType;
    } else if ('newWorkoutType' in validation.action!) {
      actionType = (validation.action as any).newWorkoutType;
    }
    
    // Block cardio when there's evidence user wanted strength training
    if (actionType === 'cardio' || actionType === 'hiit' || actionType === 'running') {
      const userRequest = validation.action!.userRequestedType || '';
      const strengthKeywords = ['chest', 'back', 'arms', 'legs', 'shoulders', 'bicep', 'tricep', 'quad', 'hamstring', 'glute', 'strength', 'muscle', 'hypertrophy'];
      
      const requestedStrength = strengthKeywords.some(kw => userRequest.toLowerCase().includes(kw));
      
      if (requestedStrength) {
        console.error(`[API] ${requestId} | CARDIO_DEFAULT_BLOCKED: User requested strength workout "${userRequest}" but action is "${actionType}"`);
        return res.status(400).json({
          ok: false,
          error: `You asked for a "${userRequest}" workout but the action would create "${actionType}". Please regenerate or specify "cardio" explicitly.`,
          code: 'CARDIO_DEFAULT_BLOCKED',
          requestId,
        });
      }
    }
    
    console.log(`[API] ${requestId} | Executing action: ${validation.action!.type} for user ${req.user.id}`);
    
    // Execute the action
    const result = await executeAction(validation.action!, req.user.id, req.user);
    
    if (!result.ok) {
      return res.status(500).json({
        ok: false,
        error: result.message,
        code: 'ACTION_FAILED',
        requestId,
      });
    }
    
    // Get updated plan summary
    const workouts = await storage.getWorkoutDays(req.user.id);
    
    res.json({
      ok: true,
      message: result.message,
      updatedPlanSummary: {
        workoutsCount: workouts.length,
        workouts: workouts.map(w => ({
          id: w.id,
          dayName: w.dayName,
          workoutType: (w as any).workoutType,
          duration: (w as any).duration,
        })),
      },
      requestId,
    });
  });
  
  // GET /api/coach/actions/types - Get available action types and schemas
  app.get('/api/coach/actions/types', (req, res) => {
    const requestId = (req as ApiRequest).requestId || 'unknown';
    
    res.json({
      ok: true,
      actionTypes: [
        {
          type: 'ADD_SESSION',
          description: 'Add a new workout session',
          requiredFields: ['workoutType', 'durationMinutes', 'targetDate OR dayOfWeek'],
        },
        {
          type: 'REPLACE_SESSION',
          description: 'Replace existing session with different type',
          requiredFields: ['newWorkoutType', 'durationMinutes', 'targetDate OR dayOfWeek'],
        },
        {
          type: 'SWAP_DAY',
          description: 'Swap workouts between two days',
          requiredFields: ['fromDate/fromDay', 'toDate/toDay'],
        },
        {
          type: 'MOVE_SESSION',
          description: 'Move a session to a different day',
          requiredFields: ['fromDate/fromDay', 'toDate/toDay'],
        },
        {
          type: 'SKIP_DAY',
          description: 'Mark a day as skipped/rest',
          requiredFields: ['targetDate OR dayOfWeek'],
        },
        {
          type: 'REGENERATE_SESSION',
          description: 'Regenerate a specific day\'s workout',
          requiredFields: ['targetDate OR dayOfWeek'],
        },
      ],
      workoutTypes: [
        'chest', 'back', 'shoulders', 'arms', 'legs',
        'upper_body', 'lower_body', 'full_body',
        'push', 'pull', 'cardio', 'hiit',
        'yoga', 'mobility', 'core',
      ],
      requestId,
    });
  });
}
