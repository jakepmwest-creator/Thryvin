/**
 * AI Coach Service - SINGLE SOURCE OF TRUTH for all coach interactions
 * 
 * This is the unified coach service that ALL coach-related endpoints should use.
 * It ensures consistent behavior, context building, and response formatting.
 * 
 * Version: 1.0.0
 * Last Updated: 2024-12-16
 */

import OpenAI from 'openai';
import { buildAiContext } from './ai-user-context';
import { 
  buildUserCoachSummary, 
  buildCoachPrompt, 
  PERSONALITY_STYLES, 
  CONTEXT_MODE_RULES,
  type CoachPersonality,
  type ContextMode as CoachContextMode 
} from './coach-memory';
import { db } from './db';
import { sql } from 'drizzle-orm';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Coach personality definitions - SINGLE SOURCE OF TRUTH
export const COACH_PERSONALITIES: Record<string, {
  name: string;
  specialty: string;
  systemPrompt: string;
}> = {
  'kai': {
    name: 'Kai',
    specialty: 'calisthenics',
    systemPrompt: `You are Kai, an elite calisthenics expert and movement specialist. You have 15+ years of experience coaching athletes from beginners to advanced. You specialize in:
• Progressive calisthenics (progressions from basic to advanced moves like muscle-ups, planche, front lever)
• Mobility and flexibility training
• Functional fitness and bodyweight mastery
• Injury prevention through proper movement patterns

Your coaching philosophy: "Master your bodyweight before adding external load." You're enthusiastic, knowledgeable, and believe ANYONE can achieve incredible things with consistent practice.

When users ask questions, provide REAL VALUE:
• Give specific exercise recommendations with sets/reps
• Explain WHY certain progressions work
• Share form cues and common mistakes to avoid
• Recommend complementary exercises
• Provide alternative exercises for different skill levels`,
  },
  'titan': {
    name: 'Titan',
    specialty: 'strength',
    systemPrompt: `You are Titan, a seasoned strength and hypertrophy coach with deep knowledge of exercise science. You've trained competitive powerlifters, bodybuilders, and everyday people looking to get stronger. You specialize in:
• Compound movements (squat, bench, deadlift, overhead press)
• Progressive overload strategies
• Muscle building and body recomposition
• Periodization and program design
• Technique optimization for maximum gains

Your coaching philosophy: "Strength is earned, one rep at a time." You're direct, knowledgeable, and passionate about helping people unlock their potential.

When users ask questions, provide REAL VALUE:
• Give specific weight progression advice (e.g., "Add 2.5kg per week", "Try 3x5 at 80% of your max")
• Explain muscle activation and which muscles are working
• Share technique cues for better lifts
• Recommend rep ranges for different goals (strength: 1-5, hypertrophy: 8-12, endurance: 15+)
• Discuss training frequency and recovery`,
  },
  'lumi': {
    name: 'Lumi',
    specialty: 'wellness',
    systemPrompt: `You are Lumi, a holistic wellness and recovery specialist. You combine modern exercise science with mindfulness practices. You specialize in:
• Flexibility and mobility work
• Recovery protocols (sleep, nutrition, stress management)
• Mind-body connection
• Yoga, stretching, and active recovery
• Sustainable fitness habits

Your coaching philosophy: "True fitness is balance - strong body, calm mind, resilient spirit." You're warm, supportive, and focused on long-term wellbeing.

When users ask questions, provide REAL VALUE:
• Give specific stretching routines with hold times
• Explain recovery science (why sleep matters, how muscles repair)
• Recommend breathing techniques for stress
• Share active recovery strategies
• Discuss nutrition basics for recovery (protein timing, hydration)`,
  },
  'default': {
    name: 'Coach',
    specialty: 'fitness',
    systemPrompt: `You are an expert AI fitness coach for Thryvin - think of yourself as a personal trainer in their pocket. You have comprehensive knowledge of:
• Exercise science and biomechanics
• Strength training, cardio, and flexibility
• Nutrition fundamentals
• Recovery and injury prevention
• Program design and periodization

Your job is to be GENUINELY HELPFUL - not just redirect users. When someone asks a question:
• Give them real, actionable advice
• Explain the "why" behind your recommendations
• Use their data (stats, history, goals) to personalize responses
• Be specific with numbers when relevant (sets, reps, weights, rest times)
• Share form tips and common mistakes to avoid`,
  },
};

// Strict fitness topics - coach should stay focused
const FITNESS_KEYWORDS = [
  'workout', 'exercise', 'fitness', 'gym', 'training', 'muscle', 'cardio', 'strength',
  'weight', 'rep', 'set', 'routine', 'schedule', 'body', 'chest', 'legs', 'arms',
  'back', 'core', 'abs', 'run', 'jog', 'walk', 'swim', 'bike', 'yoga', 'pilates',
  'nutrition', 'diet', 'protein', 'calories', 'carbs', 'food', 'meal', 'supplement',
  'health', 'injury', 'pain', 'stretch', 'rest', 'recovery', 'sleep', 'stress',
  'goal', 'progress', 'beginner', 'advanced', 'intermediate', 'tone', 'fat', 'gain',
  'swap', 'switch', 'change', 'modify', 'adjust', 'help', 'tips', 'advice', 'tip',
  'hi', 'hello', 'hey', 'thanks', 'thank', 'how', 'what', 'should', 'quick',
  'squat', 'deadlift', 'bench', 'press', 'curl', 'row', 'pull', 'push', 'lunge',
  'form', 'technique', 'posture', 'breathing', 'warm', 'cool', 'finish', 'done',
];

export interface WorkoutContext {
  workoutId?: string;
  workoutTitle?: string;
  workoutType?: string;
  currentDay?: number;
  currentWeek?: number;
  currentExercise?: {
    id?: string;
    name: string;
    sets?: number;
    reps?: number | string;
    restTime?: number;
    userLoggedSets?: number;
    lastEnteredWeight?: number;
    lastEnteredReps?: number;
  };
  remainingExercisesCount?: number;
  progressPercent?: number;
  userIntentHint?: 'in_workout' | 'planning' | 'review';
}

// Phase 9.5: Context modes for adaptive responses
export type ContextMode = 'in_workout' | 'post_workout' | 'home' | 'chat';

export interface CoachChatRequest {
  message: string;
  coach?: string;
  userId?: number;
  coachingStyle?: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  workoutContext?: WorkoutContext;
  contextMode?: ContextMode; // Phase 9.5: Explicit context mode
}

export interface CoachChatResponse {
  response: string;
  coach: string;
  contextUsed: boolean;
}

/**
 * Build workout context string for injection into coach prompt
 */
function buildWorkoutContextPrompt(workoutContext: WorkoutContext): string {
  const parts: string[] = [];
  
  parts.push('\n=== CURRENT WORKOUT SESSION ===');
  
  if (workoutContext.workoutTitle) {
    parts.push(`Workout: ${workoutContext.workoutTitle}`);
  }
  if (workoutContext.workoutType) {
    parts.push(`Type: ${workoutContext.workoutType}`);
  }
  if (workoutContext.progressPercent !== undefined) {
    parts.push(`Progress: ${workoutContext.progressPercent}% complete`);
  }
  if (workoutContext.remainingExercisesCount !== undefined) {
    parts.push(`Remaining: ${workoutContext.remainingExercisesCount} exercises left`);
  }
  
  if (workoutContext.currentExercise) {
    const ex = workoutContext.currentExercise;
    parts.push('\n--- Current Exercise ---');
    parts.push(`Exercise: ${ex.name}`);
    if (ex.sets) parts.push(`Target sets: ${ex.sets}`);
    if (ex.reps) parts.push(`Target reps: ${ex.reps}`);
    if (ex.restTime) parts.push(`Rest time: ${ex.restTime}s`);
    if (ex.userLoggedSets !== undefined) {
      parts.push(`Sets completed: ${ex.userLoggedSets}/${ex.sets || '?'}`);
    }
    if (ex.lastEnteredWeight !== undefined) {
      parts.push(`Last logged weight: ${ex.lastEnteredWeight}kg`);
    }
    if (ex.lastEnteredReps !== undefined) {
      parts.push(`Last logged reps: ${ex.lastEnteredReps}`);
    }
  }
  
  return parts.join('\n');
}

/**
 * Phase 11: Build tendencies-aware prompt additions
 * This adjusts the coach's phrasing, pacing, and suggestion style based on learned behavior
 */
function buildTendenciesPrompt(tendencies: any): string {
  const parts: string[] = [];
  
  parts.push('\n=== USER BEHAVIOR PATTERNS (ADAPT YOUR APPROACH) ===');
  
  // Progression pace adaptation
  if (tendencies.progressionPace === 'slow') {
    parts.push('• This user progresses cautiously. Use smaller increments and always ask before suggesting increases.');
    parts.push('• Phrase weight suggestions as questions: "Want to try X?" not "Let\'s increase to X"');
  } else if (tendencies.progressionPace === 'fast') {
    parts.push('• This user is confident with progression. You can be more direct with weight suggestions.');
  }
  
  // Confirmation preference
  if (tendencies.prefersConfirmation > 0.6) {
    parts.push('• This user prefers being asked before changes. Always phrase progressions as questions.');
    parts.push('• Example: "Ready to try 45kg today, or stick with 42.5kg?" NOT "Let\'s go to 45kg"');
  } else if (tendencies.prefersConfirmation < 0.4) {
    parts.push('• This user is confident with your suggestions. Be more direct.');
  }
  
  // Recovery need
  if (tendencies.recoveryNeed > 0.7) {
    parts.push('• User may need more recovery. Be mindful of fatigue signals.');
    parts.push('• Phrase: "How are you feeling today?" before pushing intensity.');
  }
  
  // Handle recent declines (CRITICAL for readiness handling)
  if (tendencies.recentDeclines && tendencies.recentDeclines.length > 0) {
    const recentDeclines = tendencies.recentDeclines.filter((d: any) => d.count >= 2);
    if (recentDeclines.length > 0) {
      parts.push('\n--- READINESS CONTEXT (IMPORTANT) ---');
      parts.push('This user has recently declined some suggestions. Handle gently:');
      
      for (const decline of recentDeclines) {
        if (decline.topic === 'weight_increase') {
          parts.push(`• Weight increases declined ${decline.count}x. Ask gently: "Last time we held at X. Want to try a small increase today, or hold again? No rush.""`);
          parts.push('• NEVER say "You always reject this" - instead say "We\'ll try when you\'re ready"');
        }
      }
    }
  }
  
  // Movement pattern confidence
  if (tendencies.movementConfidence) {
    const lowConfidence = Object.entries(tendencies.movementConfidence)
      .filter(([_, v]) => (v as number) < 0.4)
      .map(([k]) => k);
    
    if (lowConfidence.length > 0) {
      parts.push(`• Lower confidence with: ${lowConfidence.join(', ')} movements. Suggest smaller progressions for these.`);
    }
  }
  
  // Critical reminder
  parts.push('\n--- CRITICAL COACHING RULES ---');
  parts.push('• NEVER permanently reject exercises - "not ready yet" is different from "never"');
  parts.push('• Learning is reversible - if user accepts later, become more confident again');
  parts.push('• User agency first - suggest and ask, never force or guilt');
  
  return parts.join('\n');
}

// Exercise name patterns for common exercises
const EXERCISE_NAME_PATTERNS: Record<string, string[]> = {
  'bench press': ['bench', 'bench press', 'flat bench', 'barbell bench'],
  'squat': ['squat', 'squats', 'back squat', 'barbell squat'],
  'deadlift': ['deadlift', 'deadlifts', 'conventional deadlift'],
  'overhead press': ['ohp', 'overhead press', 'shoulder press', 'military press'],
  'barbell row': ['row', 'barbell row', 'bent over row', 'pendlay row'],
  'pull-up': ['pull-up', 'pullup', 'pull ups', 'chin-up', 'chinup'],
  'dumbbell press': ['dumbbell press', 'db press', 'incline press'],
  'lat pulldown': ['lat pulldown', 'pulldown', 'lat pull'],
  'leg press': ['leg press'],
  'curl': ['curl', 'bicep curl', 'barbell curl', 'dumbbell curl'],
};

/**
 * Detect if user is asking about their stats/performance and extract exercise name
 */
function detectStatsQuestion(message: string): { isStatsQuestion: boolean; exerciseName?: string; questionType?: string } {
  const lowerMessage = message.toLowerCase();
  
  // Keywords that indicate a stats question
  const statsKeywords = [
    'heaviest', 'max', 'maximum', 'personal best', 'pb', 'pr', 'record',
    'strongest', 'best', 'most', 'highest weight', 'how much', 'what weight',
    'lift', 'lifted', 'done', 'hit', 'achieved', 'what\'s my'
  ];
  
  const hasStatsKeyword = statsKeywords.some(keyword => lowerMessage.includes(keyword));
  
  if (!hasStatsKeyword) {
    return { isStatsQuestion: false };
  }
  
  // Try to find the exercise name
  for (const [canonical, patterns] of Object.entries(EXERCISE_NAME_PATTERNS)) {
    if (patterns.some(pattern => lowerMessage.includes(pattern))) {
      return { 
        isStatsQuestion: true, 
        exerciseName: canonical,
        questionType: lowerMessage.includes('heaviest') || lowerMessage.includes('max') ? 'max_weight' : 'general'
      };
    }
  }
  
  // If we have stats keywords but couldn't find a specific exercise, return partial match
  return { isStatsQuestion: true, questionType: 'general' };
}

/**
 * Fetch user's exercise stats from the database
 */
async function getUserExerciseStats(userId: number, exerciseName?: string): Promise<string> {
  try {
    // Query performance_logs using drizzle's raw SQL
    let query = sql`
      SELECT exercise_name, actual_weight, actual_reps, logged_at 
      FROM performance_logs 
      WHERE user_id = ${userId} AND actual_weight > 0
    `;
    
    if (exerciseName) {
      query = sql`
        SELECT exercise_name, actual_weight, actual_reps, logged_at 
        FROM performance_logs 
        WHERE user_id = ${userId} AND actual_weight > 0 
        AND LOWER(exercise_name) LIKE ${`%${exerciseName}%`}
        ORDER BY logged_at DESC LIMIT 500
      `;
    } else {
      query = sql`
        SELECT exercise_name, actual_weight, actual_reps, logged_at 
        FROM performance_logs 
        WHERE user_id = ${userId} AND actual_weight > 0
        ORDER BY logged_at DESC LIMIT 500
      `;
    }
    
    const result = await db.execute(query);
    const logs = result.rows as any[];
    
    if (logs.length === 0) {
      return exerciseName 
        ? `No performance data found for ${exerciseName}. The user may not have logged any sets for this exercise yet.`
        : 'No exercise performance data found for this user yet.';
    }
    
    // Group by exercise and calculate stats
    const exerciseStats: Record<string, { maxWeight: number; totalSets: number; recentWeight?: number; recentReps?: number; maxDate?: string }> = {};
    
    for (const log of logs) {
      const name = log.exercise_name;
      if (!name) continue;
      
      if (!exerciseStats[name]) {
        exerciseStats[name] = { maxWeight: 0, totalSets: 0 };
      }
      
      exerciseStats[name].totalSets++;
      if ((log.actual_weight || 0) > exerciseStats[name].maxWeight) {
        exerciseStats[name].maxWeight = log.actual_weight || 0;
        exerciseStats[name].maxDate = log.logged_at ? new Date(log.logged_at).toLocaleDateString() : undefined;
      }
      
      // Track most recent entry
      if (!exerciseStats[name].recentWeight) {
        exerciseStats[name].recentWeight = log.actual_weight || 0;
        exerciseStats[name].recentReps = log.actual_reps || 0;
      }
    }
    
    // Format stats for the AI
    const statsList: string[] = [];
    statsList.push('\n=== USER EXERCISE STATS (FROM DATABASE) ===');
    
    for (const [name, stats] of Object.entries(exerciseStats)) {
      statsList.push(`• ${name}: MAX WEIGHT = ${stats.maxWeight}kg${stats.maxDate ? ` (on ${stats.maxDate})` : ''}, Total sets logged = ${stats.totalSets}, Most recent = ${stats.recentWeight}kg x ${stats.recentReps} reps`);
    }
    
    return statsList.join('\n');
  } catch (error) {
    console.error('Error fetching exercise stats:', error);
    return 'Could not fetch exercise stats at this time.';
  }
}

/**
 * Get coach response with full user context
 * This is the ONLY function that should be called for coach interactions
 * 
 * Phase 9.5: Now includes personality system and context modes
 */
export async function getUnifiedCoachResponse(request: CoachChatRequest): Promise<CoachChatResponse> {
  const { message, coach = 'default', userId, coachingStyle, conversationHistory = [], workoutContext, contextMode } = request;
  
  try {
    // Get coach character personality (Kai, Titan, Lumi, etc.)
    const coachCharacter = COACH_PERSONALITIES[coach.toLowerCase()] || COACH_PERSONALITIES['default'];
    
    // Check if message is fitness-related
    const lowerMessage = message.toLowerCase();
    const matchedKeywords = FITNESS_KEYWORDS.filter(keyword => lowerMessage.includes(keyword));
    const isFitnessRelated = matchedKeywords.length > 0;
    
    console.log(`🔍 [COACH] Keyword check: "${message.substring(0,50)}..." matched: [${matchedKeywords.join(', ')}], isFitness: ${isFitnessRelated}`);
    
    // Phase 10: Check for burnout keywords (always allow these through)
    const { checkBurnoutKeywords } = await import('./mental-checkin');
    const isBurnoutRelated = checkBurnoutKeywords(message);
    
    if (isBurnoutRelated) {
      console.log(`💚 [COACH] Burnout keywords detected - allowing message through`);
    }
    
    // NEW: Check if user is asking about their stats (heaviest bench, max squat, etc.)
    const statsQuestion = detectStatsQuestion(message);
    let exerciseStatsContext = '';
    
    if (statsQuestion.isStatsQuestion && userId) {
      console.log(`📊 [COACH] Stats question detected! Exercise: ${statsQuestion.exerciseName || 'general'}`);
      exerciseStatsContext = await getUserExerciseStats(userId, statsQuestion.exerciseName);
      console.log(`📊 [COACH] Fetched exercise stats for context`);
    }
    
    if (!isFitnessRelated && !isBurnoutRelated && !statsQuestion.isStatsQuestion && lowerMessage.length > 15) {
      // Smart-witty response that brings it back to fitness
      const wittyResponses = [
        `Ha! That's an interesting question, but I'm more of a "biceps curls" expert than a "${message.split(' ').slice(0, 3).join(' ')}..." expert! 😄\n\nI'm your fitness coach, so let me stick to what I know best:\n• Workout tips & motivation\n• Exercise form & technique\n• Your stats & progress\n• Recovery advice\n\nWhat fitness question can I help you with?`,
        `I appreciate the creative question! But as your fitness coach, my superpowers are limited to helping you get stronger, faster, and healthier! 💪\n\nLet's talk about:\n• Your workout plan\n• Exercise tips\n• Your fitness goals\n\nWhat's on your mind fitness-wise?`,
        `Now that's thinking outside the box! But I'll leave that one to the experts - I'm here to help you crush your fitness goals! 🎯\n\nI can help with:\n• Workout advice\n• Form tips\n• Your progress & stats\n\nWhat fitness topic shall we dive into?`,
      ];
      return {
        response: wittyResponses[Math.floor(Math.random() * wittyResponses.length)],
        coach: coachCharacter.name,
        contextUsed: false,
      };
    }
    
    // Phase 9.5: Determine context mode
    const isInWorkout = workoutContext?.userIntentHint === 'in_workout' || workoutContext?.currentExercise;
    const effectiveMode: CoachContextMode = contextMode || (isInWorkout ? 'in_workout' : 'chat');
    
    // Build comprehensive user context if userId is provided
    let userContext = '';
    let contextUsed = false;
    let userCoachSummary = null;
    let userTendencies = null;
    
    if (userId) {
      try {
        // Phase 9.5: Build user coach summary for personality-aware prompts
        userCoachSummary = await buildUserCoachSummary(userId);
        
        // Phase 11: Get user tendencies for adaptive responses
        try {
          const { getUserTendencies } = await import('./learning-engine');
          userTendencies = await getUserTendencies(userId);
        } catch (e) {
          // Non-critical - tendencies are optional
        }
        
        // Also get the full context for detailed information
        const { formatted } = await buildAiContext(userId);
        userContext = formatted;
        contextUsed = true;
        
        if (process.env.NODE_ENV !== 'production') {
          console.log(`🧠 [COACH] Loaded context for user ${userId} (${userCoachSummary.coachPersonality} personality, ${effectiveMode} mode, tendencies: ${userTendencies ? 'loaded' : 'none'})`);
        }
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.log(`⚠️ [COACH] Could not load user context: ${error}`);
        }
      }
    }
    
    // Phase 9.5: Build system prompt with personality and context mode
    let systemPrompt = coachCharacter.systemPrompt;
    
    if (userCoachSummary) {
      // Use the new personality-aware prompt builder
      systemPrompt = buildCoachPrompt(userCoachSummary, effectiveMode, coachCharacter.systemPrompt);
    } else {
      // Fallback: Add basic user context and mode rules
      if (userContext) {
        systemPrompt += `\n\n${userContext}`;
      }
      
      if (coachingStyle) {
        // Map old coachingStyle to new personality
        const personalityMap: Record<string, string> = {
          'direct-challenging': 'aggressive',
          'strict-structured': 'disciplined',
          'encouraging-positive': 'friendly',
          'calm-patient': 'calm',
          'supportive': 'friendly',
          'direct': 'aggressive',
          'analytical': 'disciplined',
        };
        const mappedPersonality = personalityMap[coachingStyle] || 'friendly';
        const personalityStyle = PERSONALITY_STYLES[mappedPersonality as CoachPersonality];
        if (personalityStyle) {
          systemPrompt += `\n\n${personalityStyle.promptDirective}`;
        }
      }
      
      // Add context mode rules
      const modeRules = CONTEXT_MODE_RULES[effectiveMode];
      if (modeRules) {
        systemPrompt += `\n\n${modeRules.promptDirective}`;
      }
    }
    
    // Add workout context if provided (Phase 8: In-Workout Coach)
    if (workoutContext) {
      systemPrompt += buildWorkoutContextPrompt(workoutContext);
    }
    
    // Phase 11: Add tendencies-aware coaching directives
    if (userTendencies) {
      systemPrompt += buildTendenciesPrompt(userTendencies);
    }
    
    // NEW: Add exercise stats context if user is asking about their performance
    if (exerciseStatsContext) {
      systemPrompt += `\n\n${exerciseStatsContext}\n\nIMPORTANT: The user is asking about their exercise stats. Use the EXACT numbers from the stats above in your response. Be specific and cite the actual weights/reps from the data.`;
    }
    
    // Add strict fitness-only instruction
    if (effectiveMode === 'in_workout') {
      // IN-WORKOUT MODE: Additional safety rules
      systemPrompt += `\n\n=== CRITICAL RULES (IN-WORKOUT MODE) ===
1. You are STRICTLY a fitness coach helping during an active workout
2. Keep responses SHORT and ACTIONABLE (1-3 bullet points max)
3. Focus on immediate, practical guidance
4. For weight questions: reference their logged data and suggest specific numbers
5. For form questions: give 2-3 quick cues
6. If user asks to SWAP or CHANGE exercises: Tell them "Head to Edit Plan to swap exercises!"
7. Don't ask clarifying questions unless absolutely necessary
8. Be encouraging but efficient - they're mid-workout!
9. Never give medical advice - redirect to professionals if needed
10. Never mention you're an AI model
11. NEVER use profanity or inappropriate language
12. You CANNOT modify workouts, schedules, or settings - only GUIDE users to the right place`;
    } else {
      systemPrompt += `\n\n=== YOUR ROLE: HELPFUL AI FITNESS COACH ===

CORE PRINCIPLES:
1. BE GENUINELY HELPFUL: Give real advice, not just redirects. When someone asks "how heavy should I go?", give them a specific answer based on their data and goals.

2. USE THEIR DATA: You have access to their workout history, stats, and preferences. Reference specific numbers:
   - "Your max bench was 80kg last week - try 82.5kg today"
   - "You've completed 12 workouts this month - great consistency!"
   - "Your squat has improved 15% since you started"

3. EDUCATE: Explain the WHY behind your advice:
   - "Rest 2-3 minutes between heavy sets to replenish ATP stores"
   - "Compound movements first because they require the most neural activation"
   - "Progressive overload means adding small amounts over time, not jumping 10kg"

4. BE SPECIFIC: Give concrete recommendations, not vague platitudes:
   - Instead of "do some cardio" → "Try 20 mins of incline walking at 3.5 speed, 12% incline"
   - Instead of "eat more protein" → "Aim for 1.6-2g per kg bodyweight, so around 130g daily for you"
   - Instead of "rest more" → "7-9 hours sleep, avoid caffeine after 2pm, and take one full rest day"

5. SHARE KNOWLEDGE: You're a fitness encyclopedia. Don't hold back:
   - Form cues and common mistakes
   - Exercise alternatives and progressions
   - Training science (rep ranges, periodization, deload weeks)
   - Nutrition basics (macros, meal timing, hydration)
   - Recovery tips (sleep, stretching, foam rolling)

THINGS YOU CAN HELP WITH (provide detailed answers):
• Form and technique advice
• Weight/rep recommendations
• Exercise alternatives
• Training splits and programming
• Nutrition and diet guidance
• Recovery and injury prevention
• Motivation and mindset
• Goal setting and tracking
• Explaining exercise science

FOR MODIFICATIONS TO THE APP (these require user action):
• Workout changes → "You can adjust this in Edit Plan on your Workouts tab"
• Profile/settings → "Head to your Profile tab to change that"
• Schedule changes → "Edit Plan lets you customize your schedule"
But ALWAYS pair the redirect with useful information first!

RESPONSE STYLE:
• Be concise but substantive (2-4 paragraphs max)
• Use bullet points for lists and tips
• Be warm and encouraging but not fake
• Reference their actual data when relevant
• Never mention you're an AI or that you can't do something

=== CRITICAL SAFETY RULES ===
1. Never give medical advice - redirect to healthcare professionals
2. Never use profanity or inappropriate language
3. Keep responses family-friendly
4. For injury-related questions, always recommend professional consultation`;
    }
    
    // Build messages array with conversation history
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
    ];
    
    // Add conversation history (last 6 messages for context)
    conversationHistory.slice(-6).forEach(msg => {
      messages.push({
        role: msg.role === 'coach' || msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      });
    });
    
    // Add current message
    messages.push({ role: 'user', content: message });
    
    // Phase 9.5: Adjust max_tokens based on context mode to enforce length limits
    let maxTokens = 400; // default for chat
    if (effectiveMode === 'in_workout') {
      maxTokens = 100; // Very short - 1-3 bullets
    } else if (effectiveMode === 'home') {
      maxTokens = 60; // One-liner
    } else if (effectiveMode === 'post_workout') {
      maxTokens = 150; // 2-4 sentences
    }
    
    // Call OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
    });
    
    const aiResponse = response.choices[0].message.content || 
      "I'm here to help with your fitness journey! What would you like to know?";
    
    return {
      response: aiResponse,
      coach: coachCharacter.name,
      contextUsed,
    };
    
  } catch (error) {
    console.error('❌ [COACH] Error getting coach response:', error);
    return {
      response: "I'm having trouble connecting right now. Let's try again in a moment. 💪",
      coach: COACH_PERSONALITIES[coach.toLowerCase()]?.name || 'Coach',
      contextUsed: false,
    };
  }
}
