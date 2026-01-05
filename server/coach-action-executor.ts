/**
 * Coach Action Executor
 * 
 * PART C4: Execute validated coach actions
 * - Validates action schema
 * - Applies changes to plan in DB
 * - Calls workout generator for ADD/REPLACE actions
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
import { generateAIWorkout } from './ai-workout-generator';

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
    const category = WORKOUT_TYPE_CATEGORIES[action.workoutType] || action.workoutType;
    
    console.log(`[CoachAction] ADD_SESSION: ${action.workoutType} (${action.durationMinutes}min) for user ${userId} on ${dayName}`);
    
    // Create a workout day entry directly
    const workoutDay = await storage.createWorkoutDay({
      userId,
      dayName: dayName.toLowerCase(),
      dayIndex: targetDate.getDay(),
      workoutType: action.workoutType,
      duration: action.durationMinutes,
      isCompleted: false,
      status: 'scheduled',
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
    const category = WORKOUT_TYPE_CATEGORIES[action.newWorkoutType] || action.newWorkoutType;
    
    console.log(`[CoachAction] REPLACE_SESSION: ${action.newWorkoutType} (${action.durationMinutes}min) for user ${userId}`);
    
    // Delete existing workout for that day
    const existingWorkouts = await storage.getWorkoutDays(userId);
    const dayName = targetDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    for (const workout of existingWorkouts) {
      if (workout.dayName?.toLowerCase() === dayName) {
        await storage.deleteWorkoutDay(workout.id);
      }
    }
    
    // Generate new workout
    const userContext = {
      fitnessLevel: user.fitnessLevel || 'intermediate',
      equipment: user.equipmentAccess ? (typeof user.equipmentAccess === 'string' ? JSON.parse(user.equipmentAccess) : user.equipmentAccess) : ['bodyweight'],
      injuries: user.injuries ? (typeof user.injuries === 'string' ? JSON.parse(user.injuries) : user.injuries) : [],
    };
    
    await generateAIWorkout(
      userId,
      {
        type: category,
        duration: action.durationMinutes,
        focus: action.newWorkoutType,
        intensity: action.intensity || 'medium',
        dayIndex: targetDate.getDay(),
      },
      userContext
    );
    
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
    
    console.log(`[CoachAction] SWAP_DAY: ${fromDate.toDateString()} <-> ${toDate.toDateString()} for user ${userId}`);
    
    const workouts = await storage.getWorkoutDays(userId);
    const fromDayName = fromDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const toDayName = toDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    const fromWorkout = workouts.find(w => w.dayName?.toLowerCase() === fromDayName);
    const toWorkout = workouts.find(w => w.dayName?.toLowerCase() === toDayName);
    
    if (!fromWorkout && !toWorkout) {
      return { ok: false, message: 'No workouts found on either day to swap' };
    }
    
    // Swap day names
    if (fromWorkout) {
      await storage.updateWorkoutDay(fromWorkout.id, { dayName: toDayName });
    }
    if (toWorkout) {
      await storage.updateWorkoutDay(toWorkout.id, { dayName: fromDayName });
    }
    
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
    
    console.log(`[CoachAction] MOVE_SESSION: ${fromDate.toDateString()} -> ${toDate.toDateString()} for user ${userId}`);
    
    const workouts = await storage.getWorkoutDays(userId);
    const fromDayName = fromDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const toDayName = toDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    const fromWorkout = workouts.find(w => w.dayName?.toLowerCase() === fromDayName);
    
    if (!fromWorkout) {
      return { ok: false, message: `No workout found on ${fromDayName}` };
    }
    
    // Move to new day
    await storage.updateWorkoutDay(fromWorkout.id, { dayName: toDayName });
    
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
    const dayName = targetDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    console.log(`[CoachAction] SKIP_DAY: ${dayName} for user ${userId}`);
    
    const workouts = await storage.getWorkoutDays(userId);
    const workout = workouts.find(w => w.dayName?.toLowerCase() === dayName);
    
    if (workout) {
      await storage.updateWorkoutDay(workout.id, { isSkipped: true, skipReason: action.reason });
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
    
    console.log(`[CoachAction] REGENERATE_SESSION: ${dayName} for user ${userId}`);
    
    const workouts = await storage.getWorkoutDays(userId);
    const existingWorkout = workouts.find(w => w.dayName?.toLowerCase() === dayName);
    
    // Delete existing
    if (existingWorkout) {
      await storage.deleteWorkoutDay(existingWorkout.id);
    }
    
    // Determine workout type
    const workoutType = action.workoutType || (existingWorkout as any)?.workoutType || 'full_body';
    const category = WORKOUT_TYPE_CATEGORIES[workoutType] || workoutType;
    
    // Regenerate
    const userContext = {
      fitnessLevel: user.fitnessLevel || 'intermediate',
      equipment: user.equipmentAccess ? (typeof user.equipmentAccess === 'string' ? JSON.parse(user.equipmentAccess) : user.equipmentAccess) : ['bodyweight'],
      injuries: user.injuries ? (typeof user.injuries === 'string' ? JSON.parse(user.injuries) : user.injuries) : [],
    };
    
    await generateAIWorkout(
      userId,
      {
        type: category,
        duration: user.sessionDuration || 45,
        focus: workoutType,
        intensity: 'medium',
        dayIndex: targetDate.getDay(),
      },
      userContext
    );
    
    return {
      ok: true,
      message: `Regenerated ${dayName}'s workout`,
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
      const requestedType = validation.action.userRequestedType.toLowerCase();
      let actionType: string | undefined;
      
      if ('workoutType' in validation.action) {
        actionType = validation.action.workoutType;
      } else if ('newWorkoutType' in validation.action) {
        actionType = validation.action.newWorkoutType;
      }
      
      if (actionType) {
        // Check for mismatch
        const isMismatch = 
          (requestedType.includes('chest') && actionType === 'cardio') ||
          (requestedType.includes('arms') && actionType === 'cardio') ||
          (requestedType.includes('back') && actionType === 'cardio') ||
          (requestedType.includes('legs') && actionType === 'cardio') ||
          (requestedType.includes('shoulders') && actionType === 'cardio');
        
        if (isMismatch) {
          console.error(`[API] ${requestId} | ACTION MISMATCH BLOCKED: User requested "${requestedType}" but action is "${actionType}"`);
          return res.status(400).json({
            ok: false,
            error: `Action mismatch: You requested "${requestedType}" but the action would create "${actionType}". Please regenerate.`,
            code: 'ACTION_MISMATCH',
            requestId,
          });
        }
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
