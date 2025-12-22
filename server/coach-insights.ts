// Phase 9: Proactive Coach Insight Generator
// Phase 9.5: Enhanced with anti-spam, repetition control, and personality awareness
// Generates contextual, personalized insights that rotate throughout the day

import { db } from './db';
import { users, userWorkouts } from '@shared/schema';
import { eq, desc, and, gte } from 'drizzle-orm';
import { getComprehensiveUserContext } from './ai-user-context';
import { 
  shouldShowInsight, 
  PERSONALITY_STYLES, 
  type CoachPersonality,
  type InsightHistory 
} from './coach-memory';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Insight types with their associated actions
export type InsightAction = 'start_workout' | 'swap_day' | 'ask_coach' | 'edit_workout' | 'view_stats' | 'rest_day' | 'none';

// Phase 9.5: Extended categories including mental health
export type InsightCategory = 'motivation' | 'progress' | 'schedule' | 'tip' | 'streak' | 'recovery' | 'suggestion' | 'mental_health' | 'wellness';

export interface CoachInsight {
  id: string;
  message: string;
  action: InsightAction;
  actionLabel: string;
  category: InsightCategory;
  priority: number; // 1-10, higher = more important
  generatedAt: string;
  expiresAt: string; // Insights are valid for a limited time
}

// Context data for generating insights
interface InsightContext {
  userId: number;
  currentStreak: number;
  totalWorkouts: number;
  lastWorkoutDate: string | null;
  daysSinceLastWorkout: number;
  todayWorkoutScheduled: boolean;
  weeklyProgress: number; // 0-1 (workouts done / workouts planned)
  dayOfWeek: number; // 0-6
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  fitnessLevel: string;
  coachingStyle: string;
  coachPersonality: CoachPersonality; // Phase 9.5
  recentPRs: string[];
  strugglingDays: number[]; // Days of week where user often skips
  userName: string;
  recentInsightHistory: InsightHistory[]; // Phase 9.5: For anti-spam
}

// Get day of week patterns (days user often skips)
async function getStrugglingDays(userId: number): Promise<number[]> {
  try {
    // Get last 8 weeks of workouts
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
    
    const workouts = await db
      .select()
      .from(userWorkouts)
      .where(and(
        eq(userWorkouts.userId, userId),
        gte(userWorkouts.completedAt, eightWeeksAgo)
      ));
    
    // Count workouts per day of week
    const dayCount: number[] = [0, 0, 0, 0, 0, 0, 0];
    workouts.forEach(w => {
      const day = new Date(w.completedAt).getDay();
      dayCount[day]++;
    });
    
    // Find days with low workout counts (below average)
    const avg = dayCount.reduce((a, b) => a + b, 0) / 7;
    return dayCount.map((count, day) => count < avg * 0.5 ? day : -1).filter(d => d >= 0);
  } catch {
    return [];
  }
}

// Get recent personal records
async function getRecentPRs(userId: number): Promise<string[]> {
  // This would query workout sets for recent PRs
  // For now, return empty - can be enhanced later
  return [];
}

// Build context for insight generation
async function buildInsightContext(userId: number): Promise<InsightContext> {
  const [userData] = await db.select().from(users).where(eq(users.id, userId));
  
  if (!userData) {
    throw new Error(`User ${userId} not found`);
  }
  
  // Get workout history
  const recentWorkouts = await db
    .select()
    .from(userWorkouts)
    .where(eq(userWorkouts.userId, userId))
    .orderBy(desc(userWorkouts.completedAt))
    .limit(30);
  
  // Calculate streak
  let streak = 0;
  if (recentWorkouts.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (const workout of recentWorkouts) {
      const workoutDate = new Date(workout.completedAt);
      workoutDate.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor((today.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === streak) {
        streak++;
      } else if (daysDiff > streak) {
        break;
      }
    }
  }
  
  // Days since last workout
  const lastWorkoutDate = recentWorkouts[0]?.completedAt;
  const daysSinceLast = lastWorkoutDate 
    ? Math.floor((Date.now() - new Date(lastWorkoutDate).getTime()) / (1000 * 60 * 60 * 24))
    : 999;
  
  // Time of day
  const hour = new Date().getHours();
  let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' = 'morning';
  if (hour >= 5 && hour < 12) timeOfDay = 'morning';
  else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
  else if (hour >= 17 && hour < 21) timeOfDay = 'evening';
  else timeOfDay = 'night';
  
  // Weekly progress (workouts this week / target)
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  
  const thisWeekWorkouts = recentWorkouts.filter(w => 
    new Date(w.completedAt) >= weekStart
  ).length;
  const targetPerWeek = userData.trainingDaysPerWeek || 3;
  const weeklyProgress = Math.min(thisWeekWorkouts / targetPerWeek, 1);
  
  // Phase 9.5: Map coaching style to personality
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
  
  return {
    userId,
    currentStreak: streak,
    totalWorkouts: recentWorkouts.length,
    lastWorkoutDate: lastWorkoutDate?.toISOString() || null,
    daysSinceLastWorkout: daysSinceLast,
    todayWorkoutScheduled: true, // Would check against schedule
    weeklyProgress,
    dayOfWeek: new Date().getDay(),
    timeOfDay,
    fitnessLevel: userData.fitnessLevel || 'beginner',
    coachingStyle: userData.coachingStyle || 'balanced',
    coachPersonality, // Phase 9.5
    recentPRs: await getRecentPRs(userId),
    strugglingDays: await getStrugglingDays(userId),
    userName: userData.name || 'there',
    recentInsightHistory: [], // Would be loaded from storage in production
  };
}

// Phase 9.5: Get personality-adapted message variant
function getPersonalityMessage(
  baseMessage: string,
  personality: CoachPersonality,
  category: InsightCategory
): string {
  const style = PERSONALITY_STYLES[personality];
  
  // Simple personality adaptations
  switch (personality) {
    case 'aggressive':
      // Make messages more direct and challenging
      return baseMessage
        .replace('You could', 'Time to')
        .replace('might be', 'is')
        .replace('Want to', "Let's")
        .replace('?', '!');
    
    case 'disciplined':
      // Make messages more structured
      return baseMessage.replace('💪', '').replace('🔥', '').trim();
    
    case 'calm':
      // Make messages more reassuring
      return baseMessage
        .replace('!', '.')
        .replace("don't break it", 'keep the flow');
    
    case 'friendly':
    default:
      return baseMessage;
  }
}

// Generate rule-based insights (fast, no AI)
// Phase 9.5: Now includes personality-aware messages and anti-spam filtering
function generateRuleBasedInsights(ctx: InsightContext): CoachInsight[] {
  const allInsights: CoachInsight[] = [];
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(); // 4 hours
  
  // Streak insights
  if (ctx.currentStreak >= 7) {
    allInsights.push({
      id: `streak-${ctx.currentStreak}`,
      message: getPersonalityMessage(`🔥 ${ctx.currentStreak} day streak! You're on fire — don't break it now.`, ctx.coachPersonality, 'streak'),
      action: 'start_workout',
      actionLabel: 'Keep it going',
      category: 'streak',
      priority: 8,
      generatedAt: now.toISOString(),
      expiresAt,
    });
  } else if (ctx.currentStreak >= 3) {
    allInsights.push({
      id: `streak-${ctx.currentStreak}`,
      message: getPersonalityMessage(`${ctx.currentStreak} days strong! One more session keeps the momentum.`, ctx.coachPersonality, 'streak'),
      action: 'start_workout',
      actionLabel: 'Start workout',
      category: 'streak',
      priority: 7,
      generatedAt: now.toISOString(),
      expiresAt,
    });
  }
  
  // Recovery insights
  if (ctx.daysSinceLastWorkout >= 3 && ctx.totalWorkouts > 0) {
    allInsights.push({
      id: 'recovery-return',
      message: getPersonalityMessage(`Been a few days — ready to get back at it? A light session might feel good.`, ctx.coachPersonality, 'recovery'),
      action: 'start_workout',
      actionLabel: 'Easy session',
      category: 'recovery',
      priority: 9,
      generatedAt: now.toISOString(),
      expiresAt,
    });
  }
  
  // Weekly progress insights
  if (ctx.weeklyProgress >= 0.8) {
    allInsights.push({
      id: 'weekly-almost-done',
      message: getPersonalityMessage(`Almost done for the week! One more session and you've hit your target. 💪`, ctx.coachPersonality, 'progress'),
      action: 'start_workout',
      actionLabel: 'Finish strong',
      category: 'progress',
      priority: 8,
      generatedAt: now.toISOString(),
      expiresAt,
    });
  } else if (ctx.weeklyProgress < 0.3 && ctx.dayOfWeek >= 3) {
    allInsights.push({
      id: 'weekly-catch-up',
      message: getPersonalityMessage(`Week's halfway done — let's get a session in to stay on track.`, ctx.coachPersonality, 'schedule'),
      action: 'start_workout',
      actionLabel: 'Start now',
      category: 'schedule',
      priority: 7,
      generatedAt: now.toISOString(),
      expiresAt,
    });
  }
  
  // Struggling day insights
  if (ctx.strugglingDays.includes(ctx.dayOfWeek)) {
    const dayNames = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];
    allInsights.push({
      id: `struggling-${ctx.dayOfWeek}`,
      message: getPersonalityMessage(`${dayNames[ctx.dayOfWeek]} are usually tough for you. Want to swap today's workout?`, ctx.coachPersonality, 'schedule'),
      action: 'swap_day',
      actionLabel: 'Swap day',
      category: 'schedule',
      priority: 6,
      generatedAt: now.toISOString(),
      expiresAt,
    });
  }
  
  // Time-of-day insights
  if (ctx.timeOfDay === 'morning') {
    allInsights.push({
      id: 'morning-energy',
      message: getPersonalityMessage(`Morning workouts boost energy all day. Ready to start strong?`, ctx.coachPersonality, 'tip'),
      action: 'start_workout',
      actionLabel: 'Let\'s go',
      category: 'tip',
      priority: 5,
      generatedAt: now.toISOString(),
      expiresAt,
    });
  } else if (ctx.timeOfDay === 'evening' && ctx.daysSinceLastWorkout >= 1) {
    allInsights.push({
      id: 'evening-unwind',
      message: getPersonalityMessage(`End the day strong with a workout. It's a great way to de-stress.`, ctx.coachPersonality, 'tip'),
      action: 'start_workout',
      actionLabel: 'Start workout',
      category: 'tip',
      priority: 5,
      generatedAt: now.toISOString(),
      expiresAt,
    });
  }
  
  // New user motivation
  if (ctx.totalWorkouts < 5) {
    allInsights.push({
      id: 'new-user-motivation',
      message: getPersonalityMessage(`Every expert was once a beginner. Let's build that habit together!`, ctx.coachPersonality, 'motivation'),
      action: 'start_workout',
      actionLabel: 'Start workout',
      category: 'motivation',
      priority: 6,
      generatedAt: now.toISOString(),
      expiresAt,
    });
  }
  
  // Consistency celebration
  if (ctx.totalWorkouts >= 10 && ctx.totalWorkouts % 10 === 0) {
    allInsights.push({
      id: `milestone-${ctx.totalWorkouts}`,
      message: getPersonalityMessage(`🎉 ${ctx.totalWorkouts} workouts logged! Your consistency is inspiring.`, ctx.coachPersonality, 'progress'),
      action: 'view_stats',
      actionLabel: 'View progress',
      category: 'progress',
      priority: 8,
      generatedAt: now.toISOString(),
      expiresAt,
    });
  }
  
  // Rest day suggestion (if they've been pushing hard)
  if (ctx.currentStreak >= 5 && ctx.dayOfWeek === 0) { // Sunday
    allInsights.push({
      id: 'rest-day-sunday',
      message: getPersonalityMessage(`5+ days straight — your muscles grow during rest. Today might be a good recovery day.`, ctx.coachPersonality, 'recovery'),
      action: 'rest_day',
      actionLabel: 'Rest today',
      category: 'recovery',
      priority: 7,
      generatedAt: now.toISOString(),
      expiresAt,
    });
  }
  
  // Phase 9.5: Add mental health / wellness insight (max once per week)
  // Only add if not recently shown
  const canShowWellness = !ctx.recentInsightHistory.find(h => 
    (h.category === 'mental_health' || h.category === 'wellness') &&
    new Date(h.shownAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );
  
  if (canShowWellness && ctx.currentStreak >= 3) {
    allInsights.push({
      id: 'wellness-check',
      message: getPersonalityMessage(`Remember, rest is part of the process. How are you feeling today?`, ctx.coachPersonality, 'wellness'),
      action: 'ask_coach',
      actionLabel: 'Chat',
      category: 'wellness',
      priority: 5,
      generatedAt: now.toISOString(),
      expiresAt,
    });
  }
  
  // Default motivational insights
  const motivationalInsights: Omit<CoachInsight, 'id' | 'generatedAt' | 'expiresAt'>[] = [
    {
      message: getPersonalityMessage(`Ready to make today count? Your future self will thank you.`, ctx.coachPersonality, 'motivation'),
      action: 'start_workout',
      actionLabel: 'Start workout',
      category: 'motivation',
      priority: 4,
    },
    {
      message: `Consistency beats perfection. Even a short workout is a win.`,
      action: 'start_workout',
      actionLabel: 'Quick session',
      category: 'motivation',
      priority: 4,
    },
    {
      message: `Got questions about your program? I'm here to help.`,
      action: 'ask_coach',
      actionLabel: 'Ask me',
      category: 'tip',
      priority: 3,
    },
    {
      message: `Want to tweak today's workout? We can adjust intensity or exercises.`,
      action: 'edit_workout',
      actionLabel: 'Customize',
      category: 'suggestion',
      priority: 4,
    },
  ];
  
  // Add some motivational insights with unique IDs
  motivationalInsights.forEach((insight, idx) => {
    insights.push({
      ...insight,
      id: `motivation-${idx}`,
      generatedAt: now.toISOString(),
      expiresAt,
    });
  });
  
  return insights;
}

// Generate AI-powered personalized insight (for special occasions)
async function generateAIInsight(ctx: InsightContext, coachName: string): Promise<CoachInsight | null> {
  try {
    const prompt = `You are ${coachName}, a fitness coach. Generate ONE short, personalized insight for your client.

Context:
- Name: ${ctx.userName}
- Streak: ${ctx.currentStreak} days
- Total workouts: ${ctx.totalWorkouts}
- Days since last workout: ${ctx.daysSinceLastWorkout}
- Weekly progress: ${Math.round(ctx.weeklyProgress * 100)}%
- Time of day: ${ctx.timeOfDay}
- Coaching style: ${ctx.coachingStyle}

Rules:
- Keep it under 15 words
- Be specific and actionable
- Match the coaching style (${ctx.coachingStyle})
- Don't use emojis excessively (max 1)
- Include context from their data

Respond with ONLY the insight message, nothing else.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 50,
      temperature: 0.8,
    });
    
    const message = response.choices[0]?.message?.content?.trim();
    if (!message) return null;
    
    const now = new Date();
    return {
      id: `ai-${Date.now()}`,
      message,
      action: 'ask_coach',
      actionLabel: 'Chat',
      category: 'motivation',
      priority: 6,
      generatedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(),
    };
  } catch (error) {
    console.error('Error generating AI insight:', error);
    return null;
  }
}

// Main function: Get insights for a user
export async function getCoachInsights(
  userId: number, 
  options: { 
    count?: number; 
    includeAI?: boolean;
    coachName?: string;
  } = {}
): Promise<CoachInsight[]> {
  const { count = 10, includeAI = false, coachName = 'Coach' } = options;
  
  console.log(`🧠 [INSIGHTS] Generating insights for user ${userId}`);
  
  try {
    const ctx = await buildInsightContext(userId);
    
    // Generate rule-based insights
    let insights = generateRuleBasedInsights(ctx);
    
    // Optionally add AI insight
    if (includeAI && insights.length < count) {
      const aiInsight = await generateAIInsight(ctx, coachName);
      if (aiInsight) {
        insights.push(aiInsight);
      }
    }
    
    // Sort by priority (highest first)
    insights.sort((a, b) => b.priority - a.priority);
    
    // Return requested count
    const result = insights.slice(0, count);
    
    console.log(`✅ [INSIGHTS] Generated ${result.length} insights`);
    return result;
  } catch (error) {
    console.error('Error getting coach insights:', error);
    
    // Return a default insight on error
    const now = new Date();
    return [{
      id: 'default-error',
      message: `Ready when you are. Let's make today count!`,
      action: 'start_workout',
      actionLabel: 'Start workout',
      category: 'motivation',
      priority: 5,
      generatedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(),
    }];
  }
}

// Get a single insight (rotated based on index)
export async function getSingleInsight(
  userId: number,
  rotationIndex: number = 0,
  coachName?: string
): Promise<CoachInsight> {
  const insights = await getCoachInsights(userId, { 
    count: 10, 
    includeAI: rotationIndex === 0, // Only use AI for first insight
    coachName 
  });
  
  // Rotate through insights based on index
  const insight = insights[rotationIndex % insights.length];
  return insight;
}
