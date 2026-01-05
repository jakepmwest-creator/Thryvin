/**
 * QA Service - Fast Tester Login System
 * 
 * Creates seeded test accounts for rapid QA testing.
 * ONLY available in development/QA mode.
 */

import { Express, Response } from 'express';
import { storage } from './storage';
import { generateAccessToken, AuthenticatedRequest } from './jwt-auth';
import { ApiRequest } from './api-middleware';

// QA Mode check
const isQAEnabled = () => {
  return process.env.NODE_ENV !== 'production' || process.env.QA_MODE === 'true';
};

// Seeded user profiles
export const SEEDED_PROFILES = {
  beginner: {
    email: 'qa_beginner@thryvin.test',
    name: 'QA Beginner',
    password: 'QATest123!',
    profile: {
      trainingType: 'general_fitness',
      goal: 'fat_loss',
      coachingStyle: 'friendly',
      selectedCoach: 'kai',
      fitnessLevel: 'beginner',
      equipmentAccess: JSON.stringify(['dumbbells', 'bodyweight']),
      injuries: JSON.stringify([]),
      trainingDaysPerWeek: 3,
      sessionDurationPreference: 45,
      hasCompletedAIOnboarding: true,
      focusAreas: JSON.stringify(['fat_loss', 'toning', 'general_fitness']),
    },
    hasAdvancedQuestionnaire: false,
    advancedQuestionnaire: null,
  },
  
  intermediate: {
    email: 'qa_intermediate@thryvin.test',
    name: 'QA Intermediate',
    password: 'QATest123!',
    profile: {
      trainingType: 'strength',
      goal: 'muscle_gain',
      coachingStyle: 'disciplined',
      selectedCoach: 'titan',
      fitnessLevel: 'intermediate',
      equipmentAccess: JSON.stringify(['full_gym', 'dumbbells', 'barbells', 'cables', 'machines']),
      injuries: JSON.stringify([]),
      trainingDaysPerWeek: 4,
      sessionDurationPreference: 60,
      hasCompletedAIOnboarding: true,
      focusAreas: JSON.stringify(['hypertrophy', 'strength', 'back', 'biceps']),
    },
    hasAdvancedQuestionnaire: true,
    advancedQuestionnaire: {
      preferredSplit: 'upper_lower',
      scheduleConstraints: [
        { day: 'friday', activity: 'Football', type: 'external_activity' }
      ],
      likesText: 'I enjoy compound lifts and progressive overload. Love deadlifts and bench press.',
      dislikesText: 'Not a fan of excessive cardio or burpees.',
      weakAreas: ['back', 'biceps'],
      focusAreas: ['back', 'biceps'],
      preferConfirmation: true,
      scheduleFlexibility: true,
    },
  },
  
  injury: {
    email: 'qa_injury@thryvin.test',
    name: 'QA Injury Case',
    password: 'QATest123!',
    profile: {
      trainingType: 'rehabilitation',
      goal: 'maintain_fitness',
      coachingStyle: 'calm',
      selectedCoach: 'lumi',
      fitnessLevel: 'intermediate',
      equipmentAccess: JSON.stringify(['machines', 'cables', 'dumbbells']),
      injuries: JSON.stringify(['lower_back', 'knee']),
      trainingDaysPerWeek: 4,
      sessionDurationPreference: 45,
      hasCompletedAIOnboarding: true,
      focusAreas: JSON.stringify(['core', 'glutes', 'mobility']),
      injuryHistory: 'Lower back sensitivity - avoid heavy loading. Knee sensitivity - avoid deep squats and lunges.',
    },
    hasAdvancedQuestionnaire: true,
    advancedQuestionnaire: {
      preferredSplit: 'push_pull_legs',
      scheduleConstraints: [],
      likesText: 'Prefer controlled movements, machines for safety. Focus on form over weight.',
      dislikesText: 'Avoid heavy deadlifts, deep squats, explosive movements.',
      weakAreas: ['core', 'glutes'],
      focusAreas: ['core', 'glutes'],
      injuryDetails: {
        lowerBack: {
          severity: 'moderate',
          avoidMovements: ['deadlift', 'good_morning', 'barbell_row', 'heavy_squat'],
          preferMovements: ['machine_row', 'lat_pulldown', 'leg_press'],
        },
        knee: {
          severity: 'mild',
          avoidMovements: ['deep_squat', 'lunge', 'box_jump', 'running'],
          preferMovements: ['leg_extension', 'leg_curl', 'wall_sit'],
        },
      },
      preferConfirmation: true,
      preferMachines: true,
      controlledTempo: true,
    },
  },
};

type ProfileType = keyof typeof SEEDED_PROFILES;

/**
 * Ensure seeded user exists with correct data
 */
async function ensureSeededUser(profileType: ProfileType) {
  const profile = SEEDED_PROFILES[profileType];
  
  // Check if user exists
  let user = await storage.getUserByEmail(profile.email);
  
  if (!user) {
    // Create user
    console.log(`[QA] Creating seeded user: ${profile.email}`);
    user = await storage.createUser({
      email: profile.email,
      name: profile.name,
      password: profile.password, // Will be hashed by storage
      ...profile.profile,
    });
  } else {
    // Update user profile to ensure it matches
    console.log(`[QA] Updating seeded user: ${profile.email}`);
    user = await storage.updateUser(user.id, profile.profile) || user;
  }
  
  // Store advanced questionnaire if applicable
  if (profile.hasAdvancedQuestionnaire && profile.advancedQuestionnaire) {
    // Store in user's advancedQuestionnaire field
    await storage.updateUser(user.id, {
      advancedQuestionnaire: JSON.stringify(profile.advancedQuestionnaire),
    });
    console.log(`[QA] Saved advanced questionnaire for ${profile.email}`);
  }
  
  return user;
}

/**
 * Seed workout history for a user
 */
async function seedWorkoutHistory(userId: number, profileType: ProfileType) {
  console.log(`[QA] Seeding workout history for user ${userId} (${profileType})`);
  
  // Create some realistic workout history entries
  const now = new Date();
  const history = [];
  
  // Generate 3-5 past workouts
  const workoutCount = profileType === 'beginner' ? 3 : 5;
  
  for (let i = 0; i < workoutCount; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - (i * 2 + 1)); // Every other day going back
    const dateStr = date.toISOString().split('T')[0];
    
    // Create workout day entry
    const exercises = getExercisesForProfile(profileType, i);
    
    try {
      await storage.createWorkoutDay({
        userId,
        date: dateStr,
        status: 'ready',
        payloadJson: {
          dayName: date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(),
          dayIndex: date.getDay(),
          workoutType: exercises.type,
          duration: profileType === 'intermediate' ? 60 : 45,
          intensity: 'medium',
          exercises: exercises.list,
          isCompleted: true,
          completedAt: date.toISOString(),
        },
        completedAt: date,
      });
      history.push(dateStr);
    } catch (error) {
      // May already exist, ignore
    }
  }
  
  console.log(`[QA] Created ${history.length} workout history entries`);
  return history;
}

/**
 * Get exercises based on profile type
 */
function getExercisesForProfile(profileType: ProfileType, dayIndex: number) {
  const exerciseSets = {
    beginner: [
      { type: 'full_body', list: [
        { name: 'Goblet Squat', sets: 3, reps: 12, weight: 20 },
        { name: 'Dumbbell Row', sets: 3, reps: 10, weight: 15 },
        { name: 'Push-ups', sets: 3, reps: 10, weight: 0 },
        { name: 'Plank', sets: 3, reps: 30, weight: 0 },
      ]},
      { type: 'upper', list: [
        { name: 'Dumbbell Press', sets: 3, reps: 10, weight: 20 },
        { name: 'Dumbbell Curl', sets: 3, reps: 12, weight: 10 },
        { name: 'Tricep Dips', sets: 3, reps: 10, weight: 0 },
      ]},
      { type: 'lower', list: [
        { name: 'Lunges', sets: 3, reps: 10, weight: 15 },
        { name: 'Glute Bridge', sets: 3, reps: 15, weight: 0 },
        { name: 'Calf Raises', sets: 3, reps: 15, weight: 0 },
      ]},
    ],
    intermediate: [
      { type: 'upper', list: [
        { name: 'Bench Press', sets: 4, reps: 8, weight: 135 },
        { name: 'Barbell Row', sets: 4, reps: 8, weight: 115 },
        { name: 'Overhead Press', sets: 3, reps: 10, weight: 85 },
        { name: 'Pull-ups', sets: 3, reps: 8, weight: 0 },
        { name: 'Dumbbell Curl', sets: 3, reps: 12, weight: 25 },
        { name: 'Tricep Pushdown', sets: 3, reps: 12, weight: 40 },
      ]},
      { type: 'lower', list: [
        { name: 'Squat', sets: 4, reps: 8, weight: 185 },
        { name: 'Romanian Deadlift', sets: 4, reps: 10, weight: 135 },
        { name: 'Leg Press', sets: 3, reps: 12, weight: 270 },
        { name: 'Leg Curl', sets: 3, reps: 12, weight: 80 },
        { name: 'Calf Raises', sets: 4, reps: 15, weight: 90 },
      ]},
      { type: 'push', list: [
        { name: 'Incline Dumbbell Press', sets: 4, reps: 10, weight: 60 },
        { name: 'Cable Fly', sets: 3, reps: 12, weight: 25 },
        { name: 'Lateral Raise', sets: 3, reps: 15, weight: 15 },
        { name: 'Tricep Overhead Extension', sets: 3, reps: 12, weight: 30 },
      ]},
      { type: 'pull', list: [
        { name: 'Lat Pulldown', sets: 4, reps: 10, weight: 120 },
        { name: 'Seated Row', sets: 4, reps: 10, weight: 100 },
        { name: 'Face Pull', sets: 3, reps: 15, weight: 30 },
        { name: 'Hammer Curl', sets: 3, reps: 12, weight: 25 },
      ]},
      { type: 'back_focus', list: [
        { name: 'Deadlift', sets: 4, reps: 6, weight: 225 },
        { name: 'Barbell Row', sets: 4, reps: 8, weight: 135 },
        { name: 'Lat Pulldown', sets: 3, reps: 10, weight: 130 },
        { name: 'Barbell Curl', sets: 3, reps: 10, weight: 55 },
      ]},
    ],
    injury: [
      { type: 'upper_safe', list: [
        { name: 'Machine Chest Press', sets: 3, reps: 12, weight: 80 },
        { name: 'Lat Pulldown', sets: 3, reps: 12, weight: 90 },
        { name: 'Cable Lateral Raise', sets: 3, reps: 15, weight: 10 },
        { name: 'Cable Curl', sets: 3, reps: 12, weight: 25 },
      ]},
      { type: 'lower_safe', list: [
        { name: 'Leg Press (Partial Range)', sets: 3, reps: 12, weight: 180 },
        { name: 'Leg Extension', sets: 3, reps: 15, weight: 60 },
        { name: 'Leg Curl', sets: 3, reps: 15, weight: 50 },
        { name: 'Hip Abduction', sets: 3, reps: 15, weight: 70 },
      ]},
      { type: 'core_mobility', list: [
        { name: 'Dead Bug', sets: 3, reps: 10, weight: 0 },
        { name: 'Bird Dog', sets: 3, reps: 10, weight: 0 },
        { name: 'Glute Bridge', sets: 3, reps: 15, weight: 0 },
        { name: 'Cat-Cow Stretch', sets: 2, reps: 10, weight: 0 },
      ]},
      { type: 'machine_circuit', list: [
        { name: 'Seated Row Machine', sets: 3, reps: 12, weight: 70 },
        { name: 'Chest Fly Machine', sets: 3, reps: 12, weight: 50 },
        { name: 'Shoulder Press Machine', sets: 3, reps: 12, weight: 40 },
      ]},
      { type: 'recovery', list: [
        { name: 'Foam Rolling', sets: 1, reps: 10, weight: 0 },
        { name: 'Hip Flexor Stretch', sets: 2, reps: 30, weight: 0 },
        { name: 'Hamstring Stretch', sets: 2, reps: 30, weight: 0 },
      ]},
    ],
  };
  
  const sets = exerciseSets[profileType];
  return sets[dayIndex % sets.length];
}

/**
 * Setup QA routes
 */
export function setupQARoutes(app: Express) {
  // Gate all QA routes
  const qaGate = (req: any, res: Response, next: any) => {
    if (!isQAEnabled()) {
      return res.status(403).json({
        ok: false,
        error: 'QA endpoints are disabled in production',
        code: 'QA_DISABLED',
      });
    }
    next();
  };
  
  /**
   * POST /api/qa/login-as
   * Login as a seeded test user
   */
  app.post('/api/qa/login-as', qaGate, async (req, res) => {
    const requestId = (req as ApiRequest).requestId || 'unknown';
    const { profile } = req.body;
    
    console.log(`[QA] Login request for profile: ${profile}`);
    
    if (!profile || !['beginner', 'intermediate', 'injury'].includes(profile)) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid profile. Must be: beginner, intermediate, or injury',
        code: 'INVALID_PROFILE',
        requestId,
      });
    }
    
    try {
      // Ensure user exists
      const user = await ensureSeededUser(profile as ProfileType);
      
      // Seed workout history
      await seedWorkoutHistory(user.id, profile as ProfileType);
      
      // Generate access token (same as normal login)
      const accessToken = generateAccessToken(user);
      
      // Remove password from response
      const { password, ...safeUser } = user;
      
      console.log(`[QA] ✅ Successfully logged in as ${profile}: ${user.email}`);
      
      res.json({
        ok: true,
        user: safeUser,
        accessToken,
        profile,
        message: `Logged in as ${profile} test user`,
        requestId,
      });
    } catch (error: any) {
      console.error(`[QA] Login failed:`, error);
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to login as test user',
        code: 'QA_LOGIN_FAILED',
        requestId,
      });
    }
  });
  
  /**
   * POST /api/qa/reset-user
   * Reset a test user's data (clears plan + history, keeps account)
   */
  app.post('/api/qa/reset-user', qaGate, async (req: AuthenticatedRequest, res) => {
    const requestId = (req as ApiRequest).requestId || 'unknown';
    const { email } = req.body;
    
    if (!email || !email.includes('@thryvin.test')) {
      return res.status(400).json({
        ok: false,
        error: 'Can only reset @thryvin.test accounts',
        code: 'INVALID_EMAIL',
        requestId,
      });
    }
    
    try {
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({
          ok: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND',
          requestId,
        });
      }
      
      // Delete all workout days for this user
      const workouts = await storage.getWorkoutDays(user.id);
      for (const workout of workouts) {
        await storage.deleteWorkoutDay(workout.id);
      }
      
      console.log(`[QA] Reset user data for ${email}`);
      
      res.json({
        ok: true,
        message: `Reset data for ${email}`,
        deletedWorkouts: workouts.length,
        requestId,
      });
    } catch (error: any) {
      console.error(`[QA] Reset failed:`, error);
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to reset user',
        code: 'QA_RESET_FAILED',
        requestId,
      });
    }
  });
  
  /**
   * POST /api/qa/regenerate-plan
   * Force regenerate plan for a test user
   */
  app.post('/api/qa/regenerate-plan', qaGate, async (req: AuthenticatedRequest, res) => {
    const requestId = (req as ApiRequest).requestId || 'unknown';
    const { email } = req.body;
    
    if (!email || !email.includes('@thryvin.test')) {
      return res.status(400).json({
        ok: false,
        error: 'Can only regenerate for @thryvin.test accounts',
        code: 'INVALID_EMAIL',
        requestId,
      });
    }
    
    try {
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({
          ok: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND',
          requestId,
        });
      }
      
      // Delete existing workouts
      const existingWorkouts = await storage.getWorkoutDays(user.id);
      for (const workout of existingWorkouts) {
        await storage.deleteWorkoutDay(workout.id);
      }
      
      // Determine profile type from email
      let profileType: ProfileType = 'beginner';
      if (email.includes('intermediate')) profileType = 'intermediate';
      else if (email.includes('injury')) profileType = 'injury';
      
      // Seed new workout history
      const history = await seedWorkoutHistory(user.id, profileType);
      
      console.log(`[QA] Regenerated plan for ${email}`);
      
      res.json({
        ok: true,
        message: `Regenerated plan for ${email}`,
        workoutsCreated: history.length,
        requestId,
      });
    } catch (error: any) {
      console.error(`[QA] Regenerate failed:`, error);
      res.status(500).json({
        ok: false,
        error: error.message || 'Failed to regenerate plan',
        code: 'QA_REGENERATE_FAILED',
        requestId,
      });
    }
  });
  
  /**
   * GET /api/qa/profiles
   * Get available test profiles (for debugging)
   */
  app.get('/api/qa/profiles', qaGate, (req, res) => {
    const requestId = (req as ApiRequest).requestId || 'unknown';
    
    res.json({
      ok: true,
      profiles: Object.keys(SEEDED_PROFILES).map(key => ({
        id: key,
        email: SEEDED_PROFILES[key as ProfileType].email,
        name: SEEDED_PROFILES[key as ProfileType].name,
        hasAdvancedQuestionnaire: SEEDED_PROFILES[key as ProfileType].hasAdvancedQuestionnaire,
        trainingDays: SEEDED_PROFILES[key as ProfileType].profile.trainingDays,
        sessionDuration: SEEDED_PROFILES[key as ProfileType].profile.sessionDuration,
      })),
      requestId,
    });
  });
  
  console.log('[QA] QA routes registered (dev/test only)');
}
