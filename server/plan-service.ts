/**
 * Workout Plan Service
 * 
 * PART B: Plan Generation Reliability
 * - Idempotent ensure endpoint
 * - Plan status checking
 * - Reliable plan generation on mobile
 * 
 * HARD RULES ENFORCED:
 * - Training days = workout count (ALWAYS)
 * - No empty or rest-only plans
 * - Fallback splits if AI fails
 * - Validation on all outputs
 */

import { Express, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from './jwt-auth';
import { ApiRequest } from './api-middleware';
import { storage } from './storage';
import { generateWeekWorkouts } from './week-generator';
import { 
  validatePlan, 
  generateFallbackPlan, 
  isRealWorkout,
  logValidation,
  FALLBACK_SPLITS 
} from './workout-validation';

interface PlanStatus {
  exists: boolean;
  workoutsCount: number;
  lastGeneratedAt: string | null;
  planId: string | null;
}

/**
 * Get plan status for a user
 */
async function getPlanStatus(userId: number): Promise<PlanStatus> {
  try {
    // Get workouts from storage
    const workouts = await storage.getWorkoutDays(userId);
    
    if (!workouts || workouts.length === 0) {
      return {
        exists: false,
        workoutsCount: 0,
        lastGeneratedAt: null,
        planId: null,
      };
    }
    
    // Find the most recent generation timestamp
    const sortedWorkouts = [...workouts].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
    
    const lastGenerated = sortedWorkouts[0]?.createdAt;
    
    return {
      exists: true,
      workoutsCount: workouts.length,
      lastGeneratedAt: lastGenerated ? new Date(lastGenerated).toISOString() : null,
      planId: `plan_${userId}_${workouts.length}`,
    };
  } catch (error) {
    console.error('Error getting plan status:', error);
    return {
      exists: false,
      workoutsCount: 0,
      lastGeneratedAt: null,
      planId: null,
    };
  }
}

/**
 * Ensure user has a valid workout plan
 * - If valid plan exists, return it
 * - If no plan or empty, generate new one
 * - VALIDATES: workout count >= frequency (HARD RULE)
 * - RETRIES: up to 2 times if invalid
 * - FALLBACK: uses safe split if AI fails
 */
async function ensurePlan(userId: number, user: any): Promise<{
  ok: boolean;
  generated: boolean;
  planId: string;
  workoutsCount: number;
  lastGeneratedAt: string;
  error?: string;
  usedFallback?: boolean;
  validationWarnings?: string[];
}> {
  const MAX_RETRIES = 2;
  let usedFallback = false;
  let validationWarnings: string[] = [];
  
  try {
    // Get user's requested frequency
    const frequency = user.trainingDaysPerWeek || user.trainingDays || 3;
    
    // Check current plan status
    const status = await getPlanStatus(userId);
    
    if (status.exists && status.workoutsCount > 0) {
      // Plan exists - VALIDATE IT
      const workouts = await storage.getWorkoutDays(userId);
      
      // Convert to validation format
      const workoutDays = workouts.map(w => ({
        date: w.date,
        focus: (w.payloadJson as any)?.focus || (w.payloadJson as any)?.type,
        type: (w.payloadJson as any)?.type || (w.payloadJson as any)?.workoutType,
        workoutType: (w.payloadJson as any)?.workoutType,
        isRestDay: (w.payloadJson as any)?.isRestDay,
        isActivityDay: (w.payloadJson as any)?.isActivityDay,
        isSkipped: (w.payloadJson as any)?.isSkipped,
        exercises: (w.payloadJson as any)?.exercises || [],
        title: (w.payloadJson as any)?.title,
      }));
      
      const validation = validatePlan({ frequency, workouts: workoutDays });
      
      logValidation(
        'EXISTING_PLAN_CHECK',
        frequency,
        validation.workoutCount,
        'existing',
        false
      );
      
      if (validation.valid && validation.workoutCount >= frequency) {
        // Plan is valid!
        return {
          ok: true,
          generated: false,
          planId: status.planId!,
          workoutsCount: validation.workoutCount,
          lastGeneratedAt: status.lastGeneratedAt!,
          validationWarnings: validation.warnings,
        };
      }
      
      // Plan exists but is INVALID - needs regeneration
      console.log(`[PlanService] ⚠️ Existing plan invalid: ${validation.errors.join(', ')}`);
      validationWarnings = validation.warnings;
    }
    
    // Need to generate a new plan
    console.log(`[PlanService] Generating plan for user ${userId} (frequency: ${frequency})`);
    
    // Build user context for generation
    const userContext = {
      userId,
      fitnessLevel: user.fitnessLevel || 'intermediate',
      goals: user.fitnessGoals ? (typeof user.fitnessGoals === 'string' ? JSON.parse(user.fitnessGoals) : user.fitnessGoals) : ['general_fitness'],
      equipment: user.equipmentAccess ? (typeof user.equipmentAccess === 'string' ? JSON.parse(user.equipmentAccess) : user.equipmentAccess) : ['bodyweight'],
      sessionDuration: user.sessionDurationPreference || user.sessionDuration || 45,
      trainingDays: frequency,
      injuries: user.injuries ? (typeof user.injuries === 'string' ? JSON.parse(user.injuries) : user.injuries) : [],
    };
    
    // RETRY LOOP with validation
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      console.log(`[PlanService] Generation attempt ${attempt}/${MAX_RETRIES}`);
      
      try {
        // Generate workouts
        await generateWeekWorkouts(userId, userContext);
        
        // Validate output
        const workouts = await storage.getWorkoutDays(userId);
        
        const workoutDays = workouts.map(w => ({
          date: w.date,
          focus: (w.payloadJson as any)?.focus || (w.payloadJson as any)?.type,
          type: (w.payloadJson as any)?.type || (w.payloadJson as any)?.workoutType,
          workoutType: (w.payloadJson as any)?.workoutType,
          isRestDay: (w.payloadJson as any)?.isRestDay,
          isActivityDay: (w.payloadJson as any)?.isActivityDay,
          isSkipped: (w.payloadJson as any)?.isSkipped,
          exercises: (w.payloadJson as any)?.exercises || [],
          title: (w.payloadJson as any)?.title,
        }));
        
        const validation = validatePlan({ frequency, workouts: workoutDays });
        
        logValidation(
          `GENERATION_ATTEMPT_${attempt}`,
          frequency,
          validation.workoutCount,
          'ai_generated',
          false
        );
        
        if (validation.valid && validation.workoutCount >= frequency) {
          // Success!
          return {
            ok: true,
            generated: true,
            planId: `plan_${userId}_${Date.now()}`,
            workoutsCount: validation.workoutCount,
            lastGeneratedAt: new Date().toISOString(),
            usedFallback: false,
            validationWarnings: validation.warnings,
          };
        }
        
        console.log(`[PlanService] Attempt ${attempt} invalid: ${validation.errors.join(', ')}`);
        validationWarnings = [...validationWarnings, ...validation.warnings];
        
      } catch (genError: any) {
        console.error(`[PlanService] Generation attempt ${attempt} failed:`, genError.message);
      }
    }
    
    // All retries failed - USE FALLBACK
    console.log(`[PlanService] ⚠️ All retries failed, using SAFE FALLBACK SPLIT`);
    usedFallback = true;
    
    // Get week start date
    const today = new Date();
    const currentDay = today.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);
    
    // Generate fallback plan
    const fallbackWorkouts = generateFallbackPlan(frequency, userId, monday);
    
    // Clear existing workouts and insert fallback
    const existingWorkouts = await storage.getWorkoutDays(userId);
    for (const w of existingWorkouts) {
      await storage.deleteWorkoutDay(w.id);
    }
    
    // Insert fallback workouts
    for (const workout of fallbackWorkouts) {
      await storage.createWorkoutDay({
        userId,
        date: workout.date,
        status: 'ready',
        payloadJson: {
          ...workout,
          generatedBy: 'fallback',
        },
      });
    }
    
    const realWorkoutCount = fallbackWorkouts.filter(w => !w.isRestDay).length;
    
    logValidation(
      'FALLBACK_USED',
      frequency,
      realWorkoutCount,
      `fallback_${frequency}day`,
      true
    );
    
    return {
      ok: true,
      generated: true,
      planId: `plan_${userId}_fallback_${Date.now()}`,
      workoutsCount: realWorkoutCount,
      lastGeneratedAt: new Date().toISOString(),
      usedFallback: true,
      validationWarnings: [
        'Used fallback split due to generation issues. Plan is valid but may need regeneration.',
        ...validationWarnings,
      ],
    };
    
  } catch (error: any) {
    console.error(`[PlanService] Error ensuring plan for user ${userId}:`, error);
    return {
      ok: false,
      generated: false,
      planId: '',
      workoutsCount: 0,
      lastGeneratedAt: '',
      error: error.message || 'Failed to ensure plan',
    };
  }
}

/**
 * Setup plan routes
 */
export function setupPlanRoutes(app: Express) {
  // B1: POST /api/workouts/plan/ensure - Idempotent ensure plan exists
  app.post('/api/workouts/plan/ensure', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    const requestId = (req as ApiRequest).requestId || 'unknown';
    
    if (!req.user) {
      return res.status(401).json({
        ok: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
        requestId,
      });
    }
    
    console.log(`[API] ${requestId} | POST /api/workouts/plan/ensure | userId=${req.user.id}`);
    
    const result = await ensurePlan(req.user.id, req.user);
    
    if (!result.ok) {
      return res.status(500).json({
        ok: false,
        error: result.error || 'Failed to ensure plan',
        code: 'PLAN_ERROR',
        requestId,
      });
    }
    
    res.json({
      ok: true,
      planId: result.planId,
      workoutsCount: result.workoutsCount,
      lastGeneratedAt: result.lastGeneratedAt,
      generated: result.generated,
      usedFallback: result.usedFallback || false,
      validationWarnings: result.validationWarnings || [],
      requestId,
    });
  });
  
  // B2: GET /api/workouts/plan/status - Get plan status
  app.get('/api/workouts/plan/status', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    const requestId = (req as ApiRequest).requestId || 'unknown';
    
    if (!req.user) {
      return res.status(401).json({
        ok: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
        requestId,
      });
    }
    
    const status = await getPlanStatus(req.user.id);
    
    res.json({
      ok: true,
      ...status,
      requestId,
    });
  });
}
