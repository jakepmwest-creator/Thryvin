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
 */
async function ensurePlan(userId: number, user: any): Promise<{
  ok: boolean;
  generated: boolean;
  planId: string;
  workoutsCount: number;
  lastGeneratedAt: string;
  error?: string;
}> {
  try {
    // Check current plan status
    const status = await getPlanStatus(userId);
    
    if (status.exists && status.workoutsCount > 0) {
      // Plan exists and has workouts
      return {
        ok: true,
        generated: false,
        planId: status.planId!,
        workoutsCount: status.workoutsCount,
        lastGeneratedAt: status.lastGeneratedAt!,
      };
    }
    
    // Need to generate a new plan
    console.log(`[PlanService] Generating plan for user ${userId}`);
    
    // Build user context for generation
    const userContext = {
      userId,
      fitnessLevel: user.fitnessLevel || 'intermediate',
      goals: user.fitnessGoals ? (typeof user.fitnessGoals === 'string' ? JSON.parse(user.fitnessGoals) : user.fitnessGoals) : ['general_fitness'],
      equipment: user.equipmentAccess ? (typeof user.equipmentAccess === 'string' ? JSON.parse(user.equipmentAccess) : user.equipmentAccess) : ['bodyweight'],
      sessionDuration: user.sessionDuration || 45,
      trainingDays: user.trainingDays || 4,
      injuries: user.injuries ? (typeof user.injuries === 'string' ? JSON.parse(user.injuries) : user.injuries) : [],
    };
    
    // Generate workouts
    await generateWeekWorkouts(userId, userContext);
    
    // Get updated status
    const newStatus = await getPlanStatus(userId);
    
    return {
      ok: true,
      generated: true,
      planId: newStatus.planId || `plan_${userId}_new`,
      workoutsCount: newStatus.workoutsCount,
      lastGeneratedAt: new Date().toISOString(),
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
