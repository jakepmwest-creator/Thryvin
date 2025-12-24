/**
 * Phase 9.5: Coach Memory & Personality System
 * 
 * This service manages:
 * 1. User Coach Summary - Lightweight memory for AI context
 * 2. Coach Personality System - Consistent style enforcement
 * 3. Anti-Spam & Repetition Control - Smart insight rotation
 * 4. Context Modes - Adaptive response styles
 * 
 * The user_coach_summary is the PRIMARY AI context, not raw logs.
 */

import { db } from './db';
import { users, userWorkouts, aiLearningContext } from '@shared/schema';
import { eq, desc, and, gte } from 'drizzle-orm';

// =============================================================================
// COACH PERSONALITY DEFINITIONS
// =============================================================================

export type CoachPersonality = 'aggressive' | 'disciplined' | 'friendly' | 'calm';

export const PERSONALITY_STYLES: Record<CoachPersonality, {
  description: string;
  tone: string;
  wording: string;
  assertiveness: string;
  emotionalTone: string;
  promptDirective: string;
}> = {
  aggressive: {
    description: 'Firm, competitive, blunt',
    tone: 'direct and no-nonsense',
    wording: 'Short, blunt sentences. No fluff. Get to the point.',
    assertiveness: 'High - challenge them, expect results',
    emotionalTone: 'Competitive, focused, driven',
    promptDirective: `PERSONALITY: FIRM & COMPETITIVE
- Be direct and blunt. No fluff, no hand-holding.
- Challenge them when appropriate. "You've done harder. Get after it."
- Keep it short. Say what needs to be said, nothing more.
- If they're making excuses, call it out respectfully but firmly.
- Acknowledge effort, but always push for more. "Good. Now do better."
- Be competitive: "You beat last week. Keep that momentum."
- Never condescending or hype-y. Just straightforward and honest.
- Respect their intelligence. Speak to them like an equal who needs a push.`,
  },
  disciplined: {
    description: 'Strict, form-focused, accountable',
    tone: 'professional and precise',
    wording: 'Use clear, structured language. Emphasize technique and consistency.',
    assertiveness: 'High - hold them accountable, expect follow-through',
    emotionalTone: 'Composed, serious, methodical',
    promptDirective: `PERSONALITY: DISCIPLINED
- Be strict and structured. Focus on form, technique, and consistency.
- Hold them accountable. Track their adherence, call out missed sessions.
- Use precise language: "Execute 3 sets of 8 reps at 70% 1RM"
- Emphasize progressive overload and proper periodization.
- Correct bad habits immediately. "Your form needs work on X."
- Celebrate consistency, not just intensity.
- Be like a drill sergeant with a PhD in exercise science.`,
  },
  friendly: {
    description: 'Supportive, playful, encouraging',
    tone: 'warm and enthusiastic',
    wording: 'Use encouraging language, celebrate small wins, add light humor.',
    assertiveness: 'Moderate - suggest rather than demand, but stay motivating',
    emotionalTone: 'Upbeat, supportive, optimistic',
    promptDirective: `PERSONALITY: FRIENDLY
- Be SUPPORTIVE and ENCOURAGING. Celebrate every win, big or small.
- Use positive language: "Great job!", "You're doing amazing!", "Love the effort!"
- Add light humor when appropriate. Keep it fun.
- Focus on progress, not perfection. "You're getting stronger every day!"
- Make suggestions, not demands. "How about trying X?"
- Be their cheerleader. They should feel good after talking to you.
- Use emojis sparingly to add warmth: 💪 🎉 ⭐`,
  },
  calm: {
    description: 'Reassuring, steady, low pressure',
    tone: 'gentle and measured',
    wording: 'Use soothing language. Focus on wellbeing and sustainable progress.',
    assertiveness: 'Low - guide gently, never pressure',
    emotionalTone: 'Peaceful, patient, understanding',
    promptDirective: `PERSONALITY: CALM
- Be REASSURING and STEADY. No pressure, no rush.
- Use gentle language: "When you're ready", "Take your time", "Listen to your body"
- Focus on sustainable progress over intensity.
- Acknowledge struggles without judgment. "It's okay to have off days."
- Emphasize rest, recovery, and mental wellness alongside physical.
- Never make them feel guilty for missing a workout.
- Be like a yoga instructor who also lifts - balanced and grounded.`,
  },
};

// =============================================================================
// CONTEXT MODES
// =============================================================================

export type ContextMode = 'in_workout' | 'post_workout' | 'home' | 'chat';

export const CONTEXT_MODE_RULES: Record<ContextMode, {
  responseLength: string;
  style: string;
  promptDirective: string;
}> = {
  in_workout: {
    responseLength: '1-3 bullet points or 1-2 sentences max',
    style: 'Short, directive, actionable',
    promptDirective: `CONTEXT: IN-WORKOUT (Active Session)
CRITICAL: User is MID-WORKOUT. Maximum response: 50 words or 3 bullet points.
- Keep response under 50 words. User needs quick guidance, not essays.
- Be directive: "Do X" not "You could try X"
- Format as bullet points when giving multiple tips.
- No introductions, no sign-offs, just the answer.
- Example good response: "• Keep chest up • Drive through heels • Aim for 3-4 RIR"`,
  },
  post_workout: {
    responseLength: '2-4 sentences',
    style: 'Brief reflection + next step',
    promptDirective: `CONTEXT: POST-WORKOUT (Just Finished)
CRITICAL: User just finished. Maximum response: 3-4 sentences (under 80 words).
- Acknowledge effort briefly (1 sentence).
- Give ONE forward-looking tip (recovery/nutrition/next session).
- Keep it concise. They're tired.`,
  },
  home: {
    responseLength: '1 sentence (one-liner)',
    style: 'Proactive insight',
    promptDirective: `CONTEXT: HOME SCREEN (Browsing)
CRITICAL: Maximum response: 1 sentence (under 20 words).
- Single one-liner insight or tip.
- No explanations, no follow-ups.
- Example: "Your consistency this week has been solid. Keep it up."`,
  },
  chat: {
    responseLength: '1-3 paragraphs',
    style: 'Normal conversation',
    promptDirective: `CONTEXT: CHAT (Conversation)
- User is having a conversation with you.
- Normal response length (1-3 paragraphs, under 200 words).
- Be personable and helpful.
- Answer questions fully but don't ramble.
- Ask clarifying questions if needed.`,
  },
};

// =============================================================================
// USER COACH SUMMARY INTERFACE
// =============================================================================

export interface UserCoachSummary {
  userId: number;
  
  // Core profile
  goalSummary: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  coachPersonality: CoachPersonality;
  
  // Training preferences
  preferredSplit: string;
  trainingFrequency: number;
  sessionDuration: number;
  scheduleConstraints: string[];
  
  // Health considerations
  injuries: string[];
  exerciseLikes: string[];
  exerciseDislikes: string[];
  
  // Performance baselines
  keyLiftBaselines: {
    exercise: string;
    weight: number;
    reps: number;
    date: string;
  }[];
  
  // Adherence patterns
  adherencePatterns: {
    averageCompletionRate: number;
    strongDays: number[];
    weakDays: number[];
    lastWorkoutDate: string | null;
    currentStreak: number;
    longestStreak: number;
  };
  
  // Anti-spam tracking
  recentInsightIds: string[];
  lastMentalHealthInsight: string | null;
  
  // Phase 10: Mental Health Check-in Preferences
  mentalCheckInPreferences: {
    enabled: boolean;                    // User can disable entirely
    snoozedUntil: string | null;         // Snooze until this date
    dismissCount: number;                // How many times dismissed
    reducedFrequency: boolean;           // Auto-reduced if dismissed twice
    lastCheckInDate: string | null;      // For weekly limit enforcement
    lastCheckInDismissed: boolean;       // Was last one dismissed?
  };
  
  // Timestamps
  lastUpdated: string;
  lastFullRefresh: string;
}

// =============================================================================
// BUILD USER COACH SUMMARY
// =============================================================================

export async function buildUserCoachSummary(userId: number): Promise<UserCoachSummary> {
  console.log(`🧠 [COACH-MEMORY] Building summary for user ${userId}`);
  
  // Fetch user data
  const [userData] = await db.select().from(users).where(eq(users.id, userId));
  
  if (!userData) {
    throw new Error(`User ${userId} not found`);
  }
  
  // Fetch recent workouts (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentWorkouts = await db
    .select()
    .from(userWorkouts)
    .where(and(
      eq(userWorkouts.userId, userId),
      gte(userWorkouts.completedAt, thirtyDaysAgo)
    ))
    .orderBy(desc(userWorkouts.completedAt));
  
  // Calculate adherence patterns
  const adherencePatterns = calculateAdherencePatterns(recentWorkouts);
  
  // Map coaching style to personality
  const personalityMap: Record<string, CoachPersonality> = {
    'direct-challenging': 'aggressive',
    'strict-structured': 'disciplined',
    'encouraging-positive': 'friendly',
    'calm-patient': 'calm',
    'supportive': 'friendly',
    'direct': 'aggressive',
    'analytical': 'disciplined',
  };
  
  const coachPersonality = personalityMap[userData.coachingStyle || ''] || 'friendly';
  
  // Build summary
  const summary: UserCoachSummary = {
    userId,
    
    // Core profile
    goalSummary: userData.goal || 'General fitness',
    experienceLevel: (userData.fitnessLevel as any) || 'beginner',
    coachPersonality,
    
    // Training preferences
    preferredSplit: 'auto', // Will be enhanced from advanced questionnaire
    trainingFrequency: userData.trainingDaysPerWeek || 3,
    sessionDuration: 45, // Default, can be enhanced
    scheduleConstraints: [],
    
    // Health considerations
    injuries: userData.injuries ? (Array.isArray(userData.injuries) ? userData.injuries : []) : [],
    exerciseLikes: [],
    exerciseDislikes: [],
    
    // Performance baselines (to be calculated from workout history)
    keyLiftBaselines: [],
    
    // Adherence patterns
    adherencePatterns,
    
    // Anti-spam tracking
    recentInsightIds: [],
    lastMentalHealthInsight: null,
    
    // Phase 10: Mental Health Check-in Preferences (defaults)
    mentalCheckInPreferences: {
      enabled: true,
      snoozedUntil: null,
      dismissCount: 0,
      reducedFrequency: false,
      lastCheckInDate: null,
      lastCheckInDismissed: false,
    },
    
    // Timestamps
    lastUpdated: new Date().toISOString(),
    lastFullRefresh: new Date().toISOString(),
  };
  
  console.log(`✅ [COACH-MEMORY] Summary built for user ${userId}`);
  return summary;
}

function calculateAdherencePatterns(workouts: any[]): UserCoachSummary['adherencePatterns'] {
  if (!workouts || workouts.length === 0) {
    return {
      averageCompletionRate: 0,
      strongDays: [],
      weakDays: [],
      lastWorkoutDate: null,
      currentStreak: 0,
      longestStreak: 0,
    };
  }
  
  // Calculate completion rate (completed vs planned - estimate based on frequency)
  const completedCount = workouts.filter(w => w.completed).length;
  const averageCompletionRate = completedCount / workouts.length;
  
  // Find strong/weak days
  const dayCount: number[] = [0, 0, 0, 0, 0, 0, 0];
  workouts.forEach(w => {
    if (w.completedAt) {
      const day = new Date(w.completedAt).getDay();
      dayCount[day]++;
    }
  });
  
  const avg = dayCount.reduce((a, b) => a + b, 0) / 7;
  const strongDays = dayCount.map((count, day) => count > avg * 1.2 ? day : -1).filter(d => d >= 0);
  const weakDays = dayCount.map((count, day) => count < avg * 0.5 && count > 0 ? day : -1).filter(d => d >= 0);
  
  // Calculate streak
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const sortedWorkouts = [...workouts].sort((a, b) => 
    new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );
  
  for (const workout of sortedWorkouts) {
    if (!workout.completedAt) continue;
    const workoutDate = new Date(workout.completedAt);
    workoutDate.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((today.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === currentStreak) {
      currentStreak++;
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);
  
  return {
    averageCompletionRate,
    strongDays,
    weakDays,
    lastWorkoutDate: sortedWorkouts[0]?.completedAt?.toISOString() || null,
    currentStreak,
    longestStreak,
  };
}

// =============================================================================
// FORMAT SUMMARY FOR AI PROMPT
// =============================================================================

export function formatSummaryForPrompt(summary: UserCoachSummary): string {
  const parts: string[] = [];
  
  parts.push('=== USER COACH SUMMARY ===');
  parts.push(`Goal: ${summary.goalSummary}`);
  parts.push(`Experience: ${summary.experienceLevel}`);
  parts.push(`Training: ${summary.trainingFrequency}x per week, ${summary.sessionDuration} min sessions`);
  
  if (summary.injuries.length > 0) {
    parts.push(`⚠️ Injuries/Limitations: ${summary.injuries.join(', ')}`);
  }
  
  if (summary.exerciseLikes.length > 0) {
    parts.push(`✅ Enjoys: ${summary.exerciseLikes.join(', ')}`);
  }
  
  if (summary.exerciseDislikes.length > 0) {
    parts.push(`❌ Dislikes: ${summary.exerciseDislikes.join(', ')}`);
  }
  
  // Adherence
  const { adherencePatterns: ap } = summary;
  if (ap.currentStreak > 0) {
    parts.push(`🔥 Current streak: ${ap.currentStreak} days`);
  }
  parts.push(`📊 Completion rate: ${Math.round(ap.averageCompletionRate * 100)}%`);
  
  if (ap.weakDays.length > 0) {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    parts.push(`📉 Tends to skip: ${ap.weakDays.map(d => dayNames[d]).join(', ')}`);
  }
  
  // Key lifts
  if (summary.keyLiftBaselines.length > 0) {
    parts.push('\nKey Lifts:');
    summary.keyLiftBaselines.slice(0, 5).forEach(lift => {
      parts.push(`- ${lift.exercise}: ${lift.weight}kg x ${lift.reps}`);
    });
  }
  
  return parts.join('\n');
}

// =============================================================================
// BUILD FULL COACH PROMPT
// =============================================================================

export function buildCoachPrompt(
  summary: UserCoachSummary,
  mode: ContextMode,
  baseSystemPrompt: string
): string {
  const personality = PERSONALITY_STYLES[summary.coachPersonality];
  const modeRules = CONTEXT_MODE_RULES[mode];
  
  // Combine everything
  let prompt = baseSystemPrompt;
  
  // Add personality directive
  prompt += `\n\n${personality.promptDirective}`;
  
  // Add context mode rules
  prompt += `\n\n${modeRules.promptDirective}`;
  
  // Add user summary
  prompt += `\n\n${formatSummaryForPrompt(summary)}`;
  
  // Add experience-personality safety rules
  if (summary.experienceLevel === 'beginner') {
    if (summary.coachPersonality === 'aggressive') {
      prompt += `\n\n⚠️ SAFETY: User is a BEGINNER. Even with aggressive style:
- Focus on form before intensity
- Don't push to failure on compound lifts
- Challenge their effort, not their max weights
- Strict about fundamentals`;
    } else if (summary.coachPersonality === 'disciplined') {
      prompt += `\n\n⚠️ SAFETY: User is a BEGINNER with disciplined style:
- Extra emphasis on technique mastery
- Structured progression is essential
- Correct form issues immediately
- Build the foundation right`;
    }
  }
  
  return prompt;
}

// =============================================================================
// ANTI-SPAM & REPETITION CONTROL
// =============================================================================

export interface InsightHistory {
  insightId: string;
  category: string;
  shownAt: string;
}

export function shouldShowInsight(
  insightId: string,
  category: string,
  recentHistory: InsightHistory[]
): boolean {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  // Rule 1: Don't repeat same insight within 7 days
  const recentSameInsight = recentHistory.find(h => 
    h.insightId === insightId && new Date(h.shownAt) > sevenDaysAgo
  );
  if (recentSameInsight) {
    return false;
  }
  
  // Rule 2: Mental health insights max once per week
  if (category === 'mental_health' || category === 'recovery' || category === 'wellness') {
    const recentMentalHealth = recentHistory.find(h => 
      (h.category === 'mental_health' || h.category === 'recovery' || h.category === 'wellness') &&
      new Date(h.shownAt) > oneWeekAgo
    );
    if (recentMentalHealth) {
      return false;
    }
  }
  
  // Rule 3: Don't repeat same category more than twice in 3 days
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const sameCategoryCount = recentHistory.filter(h => 
    h.category === category && new Date(h.shownAt) > threeDaysAgo
  ).length;
  if (sameCategoryCount >= 2) {
    return false;
  }
  
  return true;
}

export function getRotatedCategory(
  ignoredCategories: string[],
  availableCategories: string[]
): string {
  // If user keeps ignoring certain categories, rotate to others
  const freshCategories = availableCategories.filter(c => !ignoredCategories.includes(c));
  
  if (freshCategories.length > 0) {
    return freshCategories[Math.floor(Math.random() * freshCategories.length)];
  }
  
  // If all categories ignored, reset and try again
  return availableCategories[Math.floor(Math.random() * availableCategories.length)];
}

// =============================================================================
// UPDATE SUMMARY FUNCTIONS
// =============================================================================

export async function updateSummaryAfterWorkout(
  userId: number,
  workoutData: {
    duration: number;
    exercisesCompleted: number;
    totalSets: number;
    keyLifts?: { exercise: string; weight: number; reps: number }[];
  }
): Promise<void> {
  console.log(`📝 [COACH-MEMORY] Light update after workout for user ${userId}`);
  
  // In a real implementation, this would update the stored summary
  // For now, we log and the next buildUserCoachSummary will pick up the changes
}

export async function updateSummaryFromQuestionnaire(
  userId: number,
  questionnaireData: {
    goals?: string[];
    injuries?: string[];
    exerciseLikes?: string[];
    exerciseDislikes?: string[];
    preferredSplit?: string;
    scheduleConstraints?: string[];
    weeklyActivities?: any[];
  }
): Promise<void> {
  console.log(`📝 [COACH-MEMORY] Full update from questionnaire for user ${userId}`);
  
  // In a real implementation, this would merge questionnaire data into the summary
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  PERSONALITY_STYLES,
  CONTEXT_MODE_RULES,
  buildUserCoachSummary,
  formatSummaryForPrompt,
  buildCoachPrompt,
  shouldShowInsight,
  getRotatedCategory,
  updateSummaryAfterWorkout,
  updateSummaryFromQuestionnaire,
};
