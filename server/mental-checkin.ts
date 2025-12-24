/**
 * Phase 10: Mental Health Check-in Service
 * 
 * Light, non-intrusive check-ins from a coach perspective.
 * NOT therapy. NOT clinical. Just a supportive nudge.
 * 
 * TRIGGERS (rule-based):
 * - User skipped workouts for 7+ days
 * - Sudden drop in adherence (3 missed sessions in a row)
 * - Sudden performance drop across multiple sessions
 * - Explicit user message indicating burnout/frustration
 * 
 * FREQUENCY LIMITS:
 * - Max ONE per WEEK
 * - Never on consecutive days
 * - Never during active workout
 * - Never stacked with another proactive insight same day
 */

import { db } from './db';
import { users, userWorkouts } from '@shared/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import { 
  UserCoachSummary, 
  CoachPersonality, 
  PERSONALITY_STYLES 
} from './coach-memory';

// =============================================================================
// MENTAL CHECK-IN TYPES
// =============================================================================

export type CheckInTrigger = 
  | 'inactivity_7_days'      // 7+ days without workout
  | 'adherence_drop'          // 3 missed sessions in a row
  | 'performance_drop'        // Significant drop across sessions
  | 'user_expressed_burnout'; // User explicitly mentioned burnout

export interface MentalCheckIn {
  id: string;
  trigger: CheckInTrigger;
  message: string;
  action: 'ease_back' | 'reset_plan' | 'lighter_sessions' | 'chat' | 'dismiss';
  actionLabel: string;
  generatedAt: string;
  expiresAt: string;
}

export interface CheckInEligibility {
  eligible: boolean;
  reason?: string;
  trigger?: CheckInTrigger;
  daysSinceLastWorkout?: number;
  missedInRow?: number;
}

// =============================================================================
// TRIGGER DETECTION
// =============================================================================

/**
 * Check if a mental health check-in should be triggered
 * Returns eligibility info with trigger reason
 */
export async function checkMentalCheckInTriggers(
  userId: number,
  summary: UserCoachSummary
): Promise<CheckInEligibility> {
  
  // HARD BLOCK: If user disabled check-ins
  if (!summary.mentalCheckInPreferences.enabled) {
    return { eligible: false, reason: 'User disabled check-ins' };
  }
  
  // HARD BLOCK: If snoozed
  if (summary.mentalCheckInPreferences.snoozedUntil) {
    const snoozedUntil = new Date(summary.mentalCheckInPreferences.snoozedUntil);
    if (snoozedUntil > new Date()) {
      return { eligible: false, reason: `Snoozed until ${snoozedUntil.toDateString()}` };
    }
  }
  
  // FREQUENCY LIMIT: Max once per week
  if (summary.mentalCheckInPreferences.lastCheckInDate) {
    const lastCheckIn = new Date(summary.mentalCheckInPreferences.lastCheckInDate);
    const daysSinceLastCheckIn = Math.floor(
      (Date.now() - lastCheckIn.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Reduced frequency if dismissed twice: once every 2 weeks
    const minDays = summary.mentalCheckInPreferences.reducedFrequency ? 14 : 7;
    
    if (daysSinceLastCheckIn < minDays) {
      return { 
        eligible: false, 
        reason: `Only ${daysSinceLastCheckIn} days since last check-in (min: ${minDays})` 
      };
    }
  }
  
  // TRIGGER 1: Inactivity for 7+ days
  const daysSinceLastWorkout = summary.adherencePatterns.lastWorkoutDate
    ? Math.floor(
        (Date.now() - new Date(summary.adherencePatterns.lastWorkoutDate).getTime()) / 
        (1000 * 60 * 60 * 24)
      )
    : 999;
  
  if (daysSinceLastWorkout >= 7) {
    return {
      eligible: true,
      trigger: 'inactivity_7_days',
      daysSinceLastWorkout,
    };
  }
  
  // TRIGGER 2: Adherence drop (check recent sessions)
  const missedInRow = await checkConsecutiveMisses(userId);
  if (missedInRow >= 3) {
    return {
      eligible: true,
      trigger: 'adherence_drop',
      missedInRow,
    };
  }
  
  // TRIGGER 3: Performance drop (check for significant decline)
  const performanceDrop = await checkPerformanceDrop(userId);
  if (performanceDrop) {
    return {
      eligible: true,
      trigger: 'performance_drop',
    };
  }
  
  return { eligible: false, reason: 'No triggers met' };
}

/**
 * Check for consecutive missed scheduled workouts
 */
async function checkConsecutiveMisses(userId: number): Promise<number> {
  try {
    // Get the last 10 scheduled workout days
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    
    const recentWorkouts = await db
      .select()
      .from(userWorkouts)
      .where(and(
        eq(userWorkouts.userId, userId),
        gte(userWorkouts.createdAt, tenDaysAgo)
      ))
      .orderBy(desc(userWorkouts.createdAt))
      .limit(10);
    
    // Count consecutive non-completed workouts from most recent
    let missedCount = 0;
    for (const workout of recentWorkouts) {
      if (!workout.completed) {
        missedCount++;
      } else {
        break; // Stop counting when we hit a completed workout
      }
    }
    
    return missedCount;
  } catch (error) {
    console.error('Error checking consecutive misses:', error);
    return 0;
  }
}

/**
 * Check for significant performance drop
 * (e.g., weights dropped significantly across multiple sessions)
 */
async function checkPerformanceDrop(userId: number): Promise<boolean> {
  // For now, return false - this would need workout set data analysis
  // Could be enhanced later to check:
  // - Average weight dropped by >20% across key lifts
  // - Workout duration dropped significantly
  // - Session ratings dropped
  return false;
}

/**
 * Check for burnout keywords in user message
 */
export function checkBurnoutKeywords(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  
  const burnoutKeywords = [
    'burned out', 'burnout', 'burnt out',
    'exhausted', 'drained', 'overwhelmed',
    'can\'t keep up', 'too much', 'need a break',
    'losing motivation', 'lost motivation', 'unmotivated',
    'giving up', 'want to quit', 'thinking of quitting',
    'not feeling it', 'struggling', 'can\'t do this',
    'tired of', 'sick of', 'over it',
  ];
  
  return burnoutKeywords.some(keyword => lowerMessage.includes(keyword));
}

// =============================================================================
// CHECK-IN MESSAGE GENERATION
// =============================================================================

/**
 * Generate personality-appropriate check-in messages
 * These are SHORT, NON-CLINICAL, and OPTIONAL
 */
const CHECK_IN_MESSAGES: Record<CheckInTrigger, Record<CoachPersonality, {
  message: string;
  action: MentalCheckIn['action'];
  actionLabel: string;
}>> = {
  inactivity_7_days: {
    aggressive: {
      message: "Been quiet for a while. Ready to get back after it, or need to adjust the plan?",
      action: 'ease_back',
      actionLabel: 'Ease back in',
    },
    disciplined: {
      message: "Training's been on hold. When you're ready, we can reset the schedule.",
      action: 'reset_plan',
      actionLabel: 'Reset plan',
    },
    friendly: {
      message: "Hey, it's been a bit! No pressure—want to start fresh when you're ready? 💪",
      action: 'ease_back',
      actionLabel: 'Start fresh',
    },
    calm: {
      message: "It's been a few days. Whenever you're ready, we can ease back in at your pace.",
      action: 'ease_back',
      actionLabel: 'When ready',
    },
  },
  
  adherence_drop: {
    aggressive: {
      message: "Missed a few in a row. What's the move—adjust the plan or push through?",
      action: 'reset_plan',
      actionLabel: 'Adjust plan',
    },
    disciplined: {
      message: "Schedule's slipped recently. Let's recalibrate if needed.",
      action: 'reset_plan',
      actionLabel: 'Recalibrate',
    },
    friendly: {
      message: "Looks like things got busy! Want to lighten the load for a bit?",
      action: 'lighter_sessions',
      actionLabel: 'Lighter sessions',
    },
    calm: {
      message: "No judgement on the missed sessions. Want to dial things back temporarily?",
      action: 'lighter_sessions',
      actionLabel: 'Dial back',
    },
  },
  
  performance_drop: {
    aggressive: {
      message: "Numbers have dipped. Recovery issue, or time to deload?",
      action: 'lighter_sessions',
      actionLabel: 'Deload week',
    },
    disciplined: {
      message: "Performance metrics are down. Might be time for a programmed recovery week.",
      action: 'lighter_sessions',
      actionLabel: 'Recovery week',
    },
    friendly: {
      message: "Looks like recovery's been rough this week. Want lighter sessions for a bit?",
      action: 'lighter_sessions',
      actionLabel: 'Go lighter',
    },
    calm: {
      message: "Your body might be asking for more rest. No rush—let's adjust if needed.",
      action: 'lighter_sessions',
      actionLabel: 'Take it easy',
    },
  },
  
  user_expressed_burnout: {
    aggressive: {
      message: "Heard you. Sometimes stepping back is the smart play. What do you need?",
      action: 'chat',
      actionLabel: 'Let\'s talk',
    },
    disciplined: {
      message: "Understood. Rest is part of the program. Let's adjust accordingly.",
      action: 'reset_plan',
      actionLabel: 'Adjust',
    },
    friendly: {
      message: "I hear you. It's okay to take a breather. What would help right now?",
      action: 'chat',
      actionLabel: 'Chat',
    },
    calm: {
      message: "That's okay. Listen to what you need. We can pick up whenever you're ready.",
      action: 'chat',
      actionLabel: 'Talk about it',
    },
  },
};

/**
 * Generate a mental health check-in based on trigger and personality
 */
export function generateMentalCheckIn(
  trigger: CheckInTrigger,
  personality: CoachPersonality
): MentalCheckIn {
  const now = new Date();
  const template = CHECK_IN_MESSAGES[trigger][personality];
  
  return {
    id: `mental-${trigger}-${now.getTime()}`,
    trigger,
    message: template.message,
    action: template.action,
    actionLabel: template.actionLabel,
    generatedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
  };
}

// =============================================================================
// USER CONTROLS
// =============================================================================

export interface CheckInUserAction {
  action: 'dismiss' | 'snooze_3_days' | 'snooze_1_week' | 'disable' | 'acted';
}

/**
 * Process user's response to a check-in
 * Updates preferences and returns updated summary
 */
export function processCheckInResponse(
  summary: UserCoachSummary,
  userAction: CheckInUserAction
): UserCoachSummary {
  const now = new Date();
  const updated = { ...summary };
  
  switch (userAction.action) {
    case 'dismiss':
      updated.mentalCheckInPreferences.dismissCount++;
      updated.mentalCheckInPreferences.lastCheckInDismissed = true;
      
      // Auto-reduce frequency after 2 dismisses
      if (updated.mentalCheckInPreferences.dismissCount >= 2) {
        updated.mentalCheckInPreferences.reducedFrequency = true;
      }
      break;
      
    case 'snooze_3_days':
      const snooze3 = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      updated.mentalCheckInPreferences.snoozedUntil = snooze3.toISOString();
      break;
      
    case 'snooze_1_week':
      const snooze7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      updated.mentalCheckInPreferences.snoozedUntil = snooze7.toISOString();
      break;
      
    case 'disable':
      updated.mentalCheckInPreferences.enabled = false;
      break;
      
    case 'acted':
      // User took action on the check-in (positive engagement)
      updated.mentalCheckInPreferences.lastCheckInDismissed = false;
      // Reset dismiss count on positive engagement
      if (updated.mentalCheckInPreferences.dismissCount > 0) {
        updated.mentalCheckInPreferences.dismissCount = Math.max(0, updated.mentalCheckInPreferences.dismissCount - 1);
      }
      break;
  }
  
  // Always update last check-in date
  updated.mentalCheckInPreferences.lastCheckInDate = now.toISOString();
  updated.lastUpdated = now.toISOString();
  
  return updated;
}

/**
 * Re-enable check-ins for a user
 */
export function reEnableCheckIns(summary: UserCoachSummary): UserCoachSummary {
  return {
    ...summary,
    mentalCheckInPreferences: {
      ...summary.mentalCheckInPreferences,
      enabled: true,
      snoozedUntil: null,
      dismissCount: 0,
      reducedFrequency: false,
    },
    lastUpdated: new Date().toISOString(),
  };
}

// =============================================================================
// MAIN CHECK-IN FUNCTION
// =============================================================================

/**
 * Get a mental check-in if eligible
 * Returns null if no check-in should be shown
 */
export async function getMentalCheckIn(
  userId: number,
  summary: UserCoachSummary,
  contextMode: string
): Promise<MentalCheckIn | null> {
  
  // HARD BLOCK: Never during active workout
  if (contextMode === 'in_workout') {
    return null;
  }
  
  // Check eligibility
  const eligibility = await checkMentalCheckInTriggers(userId, summary);
  
  if (!eligibility.eligible || !eligibility.trigger) {
    return null;
  }
  
  console.log(`💚 [MENTAL-CHECKIN] Triggered for user ${userId}: ${eligibility.trigger}`);
  
  // Generate the check-in with appropriate personality
  const checkIn = generateMentalCheckIn(eligibility.trigger, summary.coachPersonality);
  
  return checkIn;
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  checkMentalCheckInTriggers,
  checkBurnoutKeywords,
  generateMentalCheckIn,
  getMentalCheckIn,
  processCheckInResponse,
  reEnableCheckIns,
};
