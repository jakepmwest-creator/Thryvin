/**
 * Phase 11: Adaptive Learning Engine
 * 
 * This service implements the "soft learning" system that:
 * 1. Captures learning signals (events) from user behavior
 * 2. Interprets events into numeric tendencies (0-1 confidence)
 * 3. Applies decay to older events (recent behavior > old behavior)
 * 4. Never permanently blacklists - only adjusts confidence/pacing
 * 
 * NON-NEGOTIABLE PRINCIPLES:
 * - No permanent blacklists (except injury constraints)
 * - Learning is reversible: recent behavior overrides older
 * - "Decline" means "not ready yet", not "never"
 * - Learning adjusts confidence/pacing/phrasing, NOT available options
 */

import { db } from './db';
import { 
  aiLearningEvents, 
  userTendencies, 
  coachNudges,
  users
} from '@shared/schema';
import { eq, and, gte, desc, sql, lt, isNull, or } from 'drizzle-orm';

// =============================================================================
// LEARNING EVENT TYPES
// =============================================================================

export type LearningEventType =
  | 'suggestion_shown'
  | 'suggestion_accepted'
  | 'suggestion_rejected'
  | 'weight_adjusted'
  | 'exercise_swapped'
  | 'workout_completed'
  | 'workout_skipped'
  | 'user_feedback'
  | 'coach_prompt_used'
  | 'nudge_accepted'
  | 'nudge_rejected'
  | 'nudge_dismissed';

export type ContextMode = 'in_workout' | 'post_workout' | 'home' | 'chat';

export interface LearningEventPayload {
  // For suggestion events
  suggestionType?: string;
  suggestedValue?: number | string;
  actualValue?: number | string;
  
  // For weight adjustments
  delta?: number;
  exercise?: string;
  movementPattern?: string;
  
  // For swaps
  fromExercise?: string;
  toExercise?: string;
  swapReason?: string;
  
  // For feedback
  feedbackType?: 'too_hard' | 'too_easy' | 'pain' | 'tired' | 'great' | 'skipped';
  
  // For coach prompts
  promptType?: string;
  
  // Additional context
  workoutId?: string;
  setNumber?: number;
  exerciseId?: string;
}

// =============================================================================
// TENDENCY INTERFACE
// =============================================================================

export interface UserTendencies {
  // Progression tendencies (derived from behavior)
  progressionPace: 'slow' | 'moderate' | 'fast';
  
  // Confidence scores (0-1)
  prefersConfirmation: number;       // Prefers being asked before increases
  confidenceWithLoad: number;        // Overall load confidence
  
  // Movement pattern confidences
  movementConfidence: {
    squat: number;
    hinge: number;
    push: number;
    pull: number;
    carry: number;
  };
  
  // Behavior patterns
  swapFrequency: number;             // 0-1 how often they swap
  
  // Adherence pattern
  adherencePattern: {
    weekdayBias: number;             // Positive = prefers weekdays
    weekendDrop: number;             // 0-1 how much they drop off on weekends
    consistencyScore: number;        // 0-1 overall consistency
  };
  
  // Preference signals
  preferredRepStyle: {
    strength: number;                // 1-5 rep range preference
    hypertrophy: number;             // 8-12 rep range preference
    endurance: number;               // 15+ rep range preference
  };
  
  // Recovery need
  recoveryNeed: number;              // 0-1 (high = needs more recovery)
  
  // Decline tracking for readiness questions
  recentDeclines: Array<{
    topic: string;
    count: number;
    lastDeclined: string;
  }>;
}

// Default tendencies for new users
const DEFAULT_TENDENCIES: UserTendencies = {
  progressionPace: 'moderate',
  prefersConfirmation: 0.5,
  confidenceWithLoad: 0.5,
  movementConfidence: {
    squat: 0.5,
    hinge: 0.5,
    push: 0.5,
    pull: 0.5,
    carry: 0.5,
  },
  swapFrequency: 0.5,
  adherencePattern: {
    weekdayBias: 0,
    weekendDrop: 0.3,
    consistencyScore: 0.5,
  },
  preferredRepStyle: {
    strength: 0.33,
    hypertrophy: 0.34,
    endurance: 0.33,
  },
  recoveryNeed: 0.5,
  recentDeclines: [],
};

// =============================================================================
// CONFIGURATION
// =============================================================================

const LEARNING_CONFIG = {
  // Rolling window for event analysis
  ROLLING_WINDOW_DAYS: 30,
  
  // Minimum occurrences to form a pattern
  MIN_PATTERN_OCCURRENCES: 3,
  
  // Decay factor for older events (per week)
  WEEKLY_DECAY: 0.85,
  
  // How much a single event shifts confidence
  EVENT_SHIFT_AMOUNT: 0.05,
  
  // Bounds for confidence values
  MIN_CONFIDENCE: 0.1,
  MAX_CONFIDENCE: 0.9,
  
  // Decline tracking
  DECLINE_COOLDOWN_DAYS: 7,
  MAX_DECLINE_COUNT_BEFORE_SOFT_ASK: 3,
};

// =============================================================================
// LOG LEARNING EVENT
// =============================================================================

/**
 * Record a learning event from user behavior
 */
export async function logLearningEvent(
  userId: number,
  eventType: LearningEventType,
  contextMode: ContextMode | null,
  topic: string,
  payload: LearningEventPayload
): Promise<void> {
  try {
    await db.insert(aiLearningEvents).values({
      userId,
      eventType,
      contextMode,
      topic,
      payload,
    });
    
    console.log(`📚 [LEARNING] Logged event: ${eventType} for user ${userId} (topic: ${topic})`);
    
    // Trigger tendency update for significant events
    const significantEvents: LearningEventType[] = [
      'suggestion_accepted',
      'suggestion_rejected',
      'weight_adjusted',
      'user_feedback',
      'nudge_accepted',
      'nudge_rejected',
    ];
    
    if (significantEvents.includes(eventType)) {
      // Non-blocking update
      updateUserTendencies(userId).catch(err => {
        console.error(`[LEARNING] Failed to update tendencies: ${err}`);
      });
    }
  } catch (error) {
    console.error(`[LEARNING] Failed to log event: ${error}`);
  }
}

// =============================================================================
// UPDATE USER TENDENCIES
// =============================================================================

/**
 * Process recent events and update user tendencies
 * This is the core "learning" function
 */
export async function updateUserTendencies(userId: number): Promise<UserTendencies> {
  console.log(`🧠 [LEARNING] Updating tendencies for user ${userId}`);
  
  // Get current tendencies or create default
  let currentTendencies = await getUserTendencies(userId);
  if (!currentTendencies) {
    currentTendencies = { ...DEFAULT_TENDENCIES };
  }
  
  // Get events from rolling window
  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - LEARNING_CONFIG.ROLLING_WINDOW_DAYS);
  
  const events = await db
    .select()
    .from(aiLearningEvents)
    .where(and(
      eq(aiLearningEvents.userId, userId),
      gte(aiLearningEvents.createdAt, windowStart)
    ))
    .orderBy(desc(aiLearningEvents.createdAt));
  
  if (events.length === 0) {
    console.log(`[LEARNING] No recent events for user ${userId}`);
    return currentTendencies;
  }
  
  // Process events with decay
  const now = new Date();
  let newTendencies = { ...currentTendencies };
  
  for (const event of events) {
    const eventAge = (now.getTime() - new Date(event.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 7);
    const decayFactor = Math.pow(LEARNING_CONFIG.WEEKLY_DECAY, eventAge);
    const shiftAmount = LEARNING_CONFIG.EVENT_SHIFT_AMOUNT * decayFactor;
    
    newTendencies = applyEventToTendencies(newTendencies, event, shiftAmount);
  }
  
  // Derive progression pace from confidence
  newTendencies.progressionPace = deriveProgressionPace(newTendencies);
  
  // Update decline tracking
  newTendencies.recentDeclines = updateDeclineTracking(events, currentTendencies.recentDeclines);
  
  // Save updated tendencies
  await saveTendencies(userId, newTendencies);
  
  console.log(`✅ [LEARNING] Updated tendencies for user ${userId}:`, {
    pace: newTendencies.progressionPace,
    confirmation: newTendencies.prefersConfirmation.toFixed(2),
    load: newTendencies.confidenceWithLoad.toFixed(2),
    recovery: newTendencies.recoveryNeed.toFixed(2),
  });
  
  return newTendencies;
}

/**
 * Apply a single event's influence to tendencies
 */
function applyEventToTendencies(
  tendencies: UserTendencies,
  event: { eventType: string; topic: string | null; payload: any },
  shiftAmount: number
): UserTendencies {
  const t = { ...tendencies };
  const payload = event.payload as LearningEventPayload || {};
  
  switch (event.eventType) {
    case 'suggestion_accepted':
      // Accepted suggestion = more confident, less need for confirmation
      t.prefersConfirmation = clampConfidence(t.prefersConfirmation - shiftAmount);
      t.confidenceWithLoad = clampConfidence(t.confidenceWithLoad + shiftAmount);
      
      // Update movement pattern if applicable
      if (payload.movementPattern) {
        const pattern = payload.movementPattern as keyof typeof t.movementConfidence;
        if (t.movementConfidence[pattern] !== undefined) {
          t.movementConfidence[pattern] = clampConfidence(t.movementConfidence[pattern] + shiftAmount);
        }
      }
      break;
      
    case 'suggestion_rejected':
      // Rejected = wants more confirmation, less confident
      t.prefersConfirmation = clampConfidence(t.prefersConfirmation + shiftAmount);
      t.confidenceWithLoad = clampConfidence(t.confidenceWithLoad - shiftAmount * 0.5);
      
      if (payload.movementPattern) {
        const pattern = payload.movementPattern as keyof typeof t.movementConfidence;
        if (t.movementConfidence[pattern] !== undefined) {
          t.movementConfidence[pattern] = clampConfidence(t.movementConfidence[pattern] - shiftAmount * 0.5);
        }
      }
      break;
      
    case 'weight_adjusted':
      // User adjusted weight from suggestion
      const delta = payload.delta || 0;
      if (delta < 0) {
        // Reduced weight = lower confidence, higher recovery need
        t.confidenceWithLoad = clampConfidence(t.confidenceWithLoad - shiftAmount);
        t.recoveryNeed = clampConfidence(t.recoveryNeed + shiftAmount * 0.5);
      } else if (delta > 0) {
        // Increased weight = higher confidence
        t.confidenceWithLoad = clampConfidence(t.confidenceWithLoad + shiftAmount);
      }
      break;
      
    case 'exercise_swapped':
      // Swap = increase swap frequency
      t.swapFrequency = clampConfidence(t.swapFrequency + shiftAmount);
      break;
      
    case 'user_feedback':
      const feedback = payload.feedbackType;
      if (feedback === 'too_hard' || feedback === 'tired') {
        t.recoveryNeed = clampConfidence(t.recoveryNeed + shiftAmount);
        t.confidenceWithLoad = clampConfidence(t.confidenceWithLoad - shiftAmount * 0.5);
      } else if (feedback === 'too_easy' || feedback === 'great') {
        t.recoveryNeed = clampConfidence(t.recoveryNeed - shiftAmount);
        t.confidenceWithLoad = clampConfidence(t.confidenceWithLoad + shiftAmount);
      } else if (feedback === 'pain') {
        t.recoveryNeed = clampConfidence(t.recoveryNeed + shiftAmount * 2);
      }
      break;
      
    case 'workout_completed':
      // Completed workout = better consistency
      t.adherencePattern.consistencyScore = clampConfidence(t.adherencePattern.consistencyScore + shiftAmount * 0.5);
      break;
      
    case 'workout_skipped':
      // Skipped = worse consistency, may need more recovery
      t.adherencePattern.consistencyScore = clampConfidence(t.adherencePattern.consistencyScore - shiftAmount);
      t.recoveryNeed = clampConfidence(t.recoveryNeed + shiftAmount * 0.3);
      break;
      
    case 'nudge_accepted':
      t.prefersConfirmation = clampConfidence(t.prefersConfirmation - shiftAmount * 0.5);
      break;
      
    case 'nudge_rejected':
    case 'nudge_dismissed':
      t.prefersConfirmation = clampConfidence(t.prefersConfirmation + shiftAmount * 0.3);
      break;
  }
  
  return t;
}

function clampConfidence(value: number): number {
  return Math.max(LEARNING_CONFIG.MIN_CONFIDENCE, Math.min(LEARNING_CONFIG.MAX_CONFIDENCE, value));
}

function deriveProgressionPace(t: UserTendencies): 'slow' | 'moderate' | 'fast' {
  // Derive from confidence and recovery need
  const paceScore = t.confidenceWithLoad * 0.6 + (1 - t.recoveryNeed) * 0.4;
  
  if (paceScore < 0.35) return 'slow';
  if (paceScore > 0.65) return 'fast';
  return 'moderate';
}

function updateDeclineTracking(
  events: any[],
  currentDeclines: UserTendencies['recentDeclines']
): UserTendencies['recentDeclines'] {
  const declines = [...currentDeclines];
  const now = new Date();
  
  // Clean up old declines
  const activeDeclines = declines.filter(d => {
    const daysSince = (now.getTime() - new Date(d.lastDeclined).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince < LEARNING_CONFIG.DECLINE_COOLDOWN_DAYS * 2;
  });
  
  // Process new decline events
  const rejectEvents = events.filter(e => 
    e.eventType === 'suggestion_rejected' || 
    e.eventType === 'nudge_rejected'
  );
  
  for (const event of rejectEvents) {
    const topic = event.topic || 'general';
    const existing = activeDeclines.find(d => d.topic === topic);
    
    if (existing) {
      existing.count++;
      existing.lastDeclined = new Date(event.createdAt).toISOString();
    } else {
      activeDeclines.push({
        topic,
        count: 1,
        lastDeclined: new Date(event.createdAt).toISOString(),
      });
    }
  }
  
  // Process accept events (resets decline count)
  const acceptEvents = events.filter(e => 
    e.eventType === 'suggestion_accepted' || 
    e.eventType === 'nudge_accepted'
  );
  
  for (const event of acceptEvents) {
    const topic = event.topic || 'general';
    const existing = activeDeclines.find(d => d.topic === topic);
    
    if (existing) {
      // Reset count on accept (learning is reversible!)
      existing.count = Math.max(0, existing.count - 2);
    }
  }
  
  return activeDeclines;
}

// =============================================================================
// GET USER TENDENCIES
// =============================================================================

export async function getUserTendencies(userId: number): Promise<UserTendencies | null> {
  const [record] = await db
    .select()
    .from(userTendencies)
    .where(eq(userTendencies.userId, userId));
  
  if (!record) {
    return null;
  }
  
  // Reconstruct tendencies from DB record
  return {
    progressionPace: (record.progressionPace as any) || 'moderate',
    prefersConfirmation: parseFloat(record.prefersConfirmation || '0.5'),
    confidenceWithLoad: parseFloat(record.confidenceWithLoad || '0.5'),
    movementConfidence: (record.movementConfidence as any) || DEFAULT_TENDENCIES.movementConfidence,
    swapFrequency: parseFloat(record.swapFrequency || '0.5'),
    adherencePattern: (record.adherencePattern as any) || DEFAULT_TENDENCIES.adherencePattern,
    preferredRepStyle: (record.preferredRepStyle as any) || DEFAULT_TENDENCIES.preferredRepStyle,
    recoveryNeed: parseFloat(record.recoveryNeed || '0.5'),
    recentDeclines: (record.recentDeclines as any) || [],
  };
}

async function saveTendencies(userId: number, tendencies: UserTendencies): Promise<void> {
  const existing = await db
    .select()
    .from(userTendencies)
    .where(eq(userTendencies.userId, userId));
  
  const values = {
    progressionPace: tendencies.progressionPace,
    prefersConfirmation: tendencies.prefersConfirmation.toString(),
    confidenceWithLoad: tendencies.confidenceWithLoad.toString(),
    movementConfidence: tendencies.movementConfidence,
    swapFrequency: tendencies.swapFrequency.toString(),
    adherencePattern: tendencies.adherencePattern,
    preferredRepStyle: tendencies.preferredRepStyle,
    recoveryNeed: tendencies.recoveryNeed.toString(),
    recentDeclines: tendencies.recentDeclines,
    lastUpdated: new Date(),
  };
  
  if (existing.length > 0) {
    await db
      .update(userTendencies)
      .set(values)
      .where(eq(userTendencies.userId, userId));
  } else {
    await db.insert(userTendencies).values({
      userId,
      ...values,
    });
  }
}

// =============================================================================
// COACH NUDGE SYSTEM
// =============================================================================

export type NudgeType = 
  | 'readiness_check'
  | 'progression_offer'
  | 'schedule_adjust'
  | 'recovery_adjust'
  | 'technique_focus';

export interface NudgeAction {
  label: string;
  action: 'accept' | 'decline' | 'ask_coach' | 'adjust' | 'dismiss';
  payload?: Record<string, any>;
}

export interface CoachNudge {
  id: number;
  userId: number;
  nudgeType: NudgeType;
  priority: number;
  message: string;
  actions: NudgeAction[];
  context?: Record<string, any>;
  expiresAt?: Date;
  createdAt: Date;
  seenAt?: Date;
  resolvedAt?: Date;
  resolution?: string;
}

/**
 * Create a coach nudge for the user
 */
export async function createNudge(
  userId: number,
  nudgeType: NudgeType,
  message: string,
  actions: NudgeAction[],
  options?: {
    priority?: number;
    context?: Record<string, any>;
    expiresInHours?: number;
  }
): Promise<number> {
  const expiresAt = options?.expiresInHours 
    ? new Date(Date.now() + options.expiresInHours * 60 * 60 * 1000)
    : null;
  
  const [result] = await db.insert(coachNudges).values({
    userId,
    nudgeType,
    priority: options?.priority || 5,
    message,
    actions,
    context: options?.context || null,
    expiresAt,
  }).returning({ id: coachNudges.id });
  
  console.log(`📣 [NUDGE] Created nudge ${result.id} for user ${userId}: ${nudgeType}`);
  return result.id;
}

/**
 * Get active nudges for a user (max 1 high-priority per session)
 */
export async function getActiveNudges(
  userId: number,
  location: 'workout_hub' | 'exercise_detail' | 'home'
): Promise<CoachNudge[]> {
  const now = new Date();
  
  // Get unresolved, non-expired nudges
  const nudges = await db
    .select()
    .from(coachNudges)
    .where(and(
      eq(coachNudges.userId, userId),
      isNull(coachNudges.resolvedAt),
      or(
        isNull(coachNudges.expiresAt),
        gte(coachNudges.expiresAt, now)
      )
    ))
    .orderBy(desc(coachNudges.priority), desc(coachNudges.createdAt))
    .limit(5);
  
  // Filter by location relevance
  const locationNudgeTypes: Record<string, NudgeType[]> = {
    workout_hub: ['readiness_check', 'progression_offer', 'technique_focus'],
    exercise_detail: ['readiness_check', 'progression_offer', 'technique_focus'],
    home: ['schedule_adjust', 'recovery_adjust', 'progression_offer'],
  };
  
  const relevantTypes = locationNudgeTypes[location] || [];
  const filtered = nudges.filter(n => relevantTypes.includes(n.nudgeType as NudgeType));
  
  // Return max 1 for session (highest priority)
  return filtered.slice(0, 1).map(n => ({
    id: n.id,
    userId: n.userId,
    nudgeType: n.nudgeType as NudgeType,
    priority: n.priority || 5,
    message: n.message,
    actions: (n.actions as NudgeAction[]) || [],
    context: (n.context as Record<string, any>) || undefined,
    expiresAt: n.expiresAt || undefined,
    createdAt: n.createdAt,
    seenAt: n.seenAt || undefined,
    resolvedAt: n.resolvedAt || undefined,
    resolution: n.resolution || undefined,
  }));
}

/**
 * Mark a nudge as seen
 */
export async function markNudgeSeen(nudgeId: number): Promise<void> {
  await db
    .update(coachNudges)
    .set({ seenAt: new Date() })
    .where(eq(coachNudges.id, nudgeId));
}

/**
 * Resolve a nudge (accept, reject, dismiss)
 */
export async function resolveNudge(
  nudgeId: number,
  resolution: 'accepted' | 'rejected' | 'dismissed',
  userId: number
): Promise<void> {
  // Get the nudge first
  const [nudge] = await db
    .select()
    .from(coachNudges)
    .where(eq(coachNudges.id, nudgeId));
  
  if (!nudge) {
    console.warn(`[NUDGE] Nudge ${nudgeId} not found`);
    return;
  }
  
  // Update nudge
  await db
    .update(coachNudges)
    .set({ 
      resolvedAt: new Date(),
      resolution,
    })
    .where(eq(coachNudges.id, nudgeId));
  
  // Log learning event
  const eventType: LearningEventType = 
    resolution === 'accepted' ? 'nudge_accepted' :
    resolution === 'rejected' ? 'nudge_rejected' : 'nudge_dismissed';
  
  await logLearningEvent(
    userId,
    eventType,
    null,
    nudge.nudgeType,
    { nudgeId }
  );
  
  console.log(`📣 [NUDGE] Resolved nudge ${nudgeId}: ${resolution}`);
}

// =============================================================================
// GENERATE NUDGES BASED ON TENDENCIES
// =============================================================================

/**
 * Generate appropriate nudges based on user tendencies
 * Called when user starts a workout or views home screen
 */
export async function generateNudgesForUser(
  userId: number,
  context: 'workout_start' | 'home_view' | 'exercise_start',
  exerciseInfo?: {
    name: string;
    previousWeight?: number;
    suggestedWeight?: number;
    movementPattern?: string;
  }
): Promise<void> {
  const tendencies = await getUserTendencies(userId);
  if (!tendencies) {
    console.log(`[NUDGE] No tendencies for user ${userId}, skipping nudge generation`);
    return;
  }
  
  // Check if user already has active nudges
  const activeNudges = await getActiveNudges(userId, 
    context === 'workout_start' ? 'workout_hub' : 
    context === 'exercise_start' ? 'exercise_detail' : 'home'
  );
  
  if (activeNudges.length > 0) {
    console.log(`[NUDGE] User ${userId} already has active nudges`);
    return;
  }
  
  // Generate context-appropriate nudges
  if (context === 'exercise_start' && exerciseInfo) {
    await generateExerciseNudge(userId, tendencies, exerciseInfo);
  } else if (context === 'workout_start') {
    await generateWorkoutStartNudge(userId, tendencies);
  } else if (context === 'home_view') {
    await generateHomeNudge(userId, tendencies);
  }
}

async function generateExerciseNudge(
  userId: number,
  tendencies: UserTendencies,
  exerciseInfo: NonNullable<Parameters<typeof generateNudgesForUser>[2]>
): Promise<void> {
  const { name, previousWeight, suggestedWeight, movementPattern } = exerciseInfo;
  
  // Check decline tracking for this movement
  const declineRecord = tendencies.recentDeclines.find(d => 
    d.topic === 'weight_increase' || d.topic === movementPattern
  );
  
  const hasRecentDeclines = declineRecord && 
    declineRecord.count >= LEARNING_CONFIG.MAX_DECLINE_COUNT_BEFORE_SOFT_ASK;
  
  // Readiness check for weight progression
  if (suggestedWeight && previousWeight && suggestedWeight > previousWeight) {
    const weightDiff = suggestedWeight - previousWeight;
    
    let message: string;
    let actions: NudgeAction[];
    
    if (hasRecentDeclines) {
      // Soft ask - user has declined before
      message = `Last time we stayed at ${previousWeight}kg for ${name}. Want to try ${suggestedWeight}kg today, or hold again?`;
      actions = [
        { label: 'Try it', action: 'accept', payload: { weight: suggestedWeight } },
        { label: 'Hold', action: 'decline', payload: { weight: previousWeight } },
        { label: 'Ask coach', action: 'ask_coach' },
      ];
    } else if (tendencies.prefersConfirmation > 0.6) {
      // User prefers confirmation
      message = `Ready to try ${suggestedWeight}kg on ${name}? That's +${weightDiff}kg from last time.`;
      actions = [
        { label: 'Yes, let\'s go', action: 'accept', payload: { weight: suggestedWeight } },
        { label: 'Not today', action: 'decline', payload: { weight: previousWeight } },
        { label: 'Adjust', action: 'adjust' },
      ];
    } else {
      // Confident user - more direct suggestion
      message = `${name}: ${suggestedWeight}kg suggested (+${weightDiff}). Good to go?`;
      actions = [
        { label: 'Yes', action: 'accept', payload: { weight: suggestedWeight } },
        { label: 'Adjust', action: 'adjust' },
      ];
    }
    
    await createNudge(userId, 'readiness_check', message, actions, {
      priority: 7,
      context: { exercise: name, suggestedWeight, previousWeight, movementPattern },
      expiresInHours: 2,
    });
  }
}

async function generateWorkoutStartNudge(
  userId: number,
  tendencies: UserTendencies
): Promise<void> {
  // Check if user needs recovery advice
  if (tendencies.recoveryNeed > 0.7) {
    await createNudge(userId, 'recovery_adjust', 
      "You've been pushing hard lately. Want to take it easier today with lighter weights or fewer sets?",
      [
        { label: 'Good idea', action: 'accept' },
        { label: 'I\'m fine', action: 'decline' },
        { label: 'Ask coach', action: 'ask_coach' },
      ],
      { priority: 6, expiresInHours: 4 }
    );
  }
}

async function generateHomeNudge(
  userId: number,
  tendencies: UserTendencies
): Promise<void> {
  // Check adherence patterns
  if (tendencies.adherencePattern.consistencyScore < 0.4) {
    const daysSinceDecline = tendencies.recentDeclines
      .filter(d => d.topic === 'schedule')
      .map(d => (Date.now() - new Date(d.lastDeclined).getTime()) / (1000 * 60 * 60 * 24))
      .sort((a, b) => a - b)[0];
    
    // Don't nag if recently declined
    if (!daysSinceDecline || daysSinceDecline > LEARNING_CONFIG.DECLINE_COOLDOWN_DAYS) {
      await createNudge(userId, 'schedule_adjust',
        "Would it help to adjust your training schedule? Sometimes less is more.",
        [
          { label: 'Yes, let\'s adjust', action: 'accept' },
          { label: 'I\'m good', action: 'decline' },
          { label: 'Talk to coach', action: 'ask_coach' },
        ],
        { priority: 4, expiresInHours: 24 }
      );
    }
  }
}

// =============================================================================
// HELPER: GET LEARNING-ADJUSTED RECOMMENDATION
// =============================================================================

/**
 * Adjust a coach recommendation based on user tendencies
 */
export function adjustRecommendationForTendencies(
  baseRecommendation: {
    weightIncrease?: number;
    repIncrease?: number;
    setCount?: number;
  },
  tendencies: UserTendencies,
  movementPattern?: string
): typeof baseRecommendation {
  const adjusted = { ...baseRecommendation };
  
  // Adjust weight progression based on confidence
  if (adjusted.weightIncrease) {
    const confidenceFactor = tendencies.confidenceWithLoad;
    const patternConfidence = movementPattern 
      ? tendencies.movementConfidence[movementPattern as keyof typeof tendencies.movementConfidence] || 0.5
      : 0.5;
    
    const avgConfidence = (confidenceFactor + patternConfidence) / 2;
    
    // Scale weight increase: low confidence = smaller jumps
    if (avgConfidence < 0.4) {
      adjusted.weightIncrease = Math.max(0.5, adjusted.weightIncrease * 0.5);
    } else if (avgConfidence > 0.7) {
      adjusted.weightIncrease = adjusted.weightIncrease * 1.25;
    }
  }
  
  // Adjust rep style based on preference
  if (adjusted.repIncrease !== undefined && tendencies.preferredRepStyle) {
    // No adjustment needed, just use as-is
  }
  
  return adjusted;
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  DEFAULT_TENDENCIES,
  LEARNING_CONFIG,
};
