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
    systemPrompt: `You are Kai, a calisthenics expert coach. You specialize in bodyweight training, mobility, and functional fitness. You're enthusiastic about progressive calisthenics and believe anyone can master advanced movements with proper training.`,
  },
  'titan': {
    name: 'Titan',
    specialty: 'strength',
    systemPrompt: `You are Titan, a strength training coach. You specialize in weight training, muscle building, and power development. You emphasize proper form, progressive overload, and compound movements.`,
  },
  'lumi': {
    name: 'Lumi',
    specialty: 'wellness',
    systemPrompt: `You are Lumi, a wellness guide. You specialize in flexibility, mindfulness, recovery, and holistic fitness approaches. You balance physical training with mental wellness.`,
  },
  'default': {
    name: 'Coach',
    specialty: 'fitness',
    systemPrompt: `You are an expert fitness coach for the Thryvin app. You're knowledgeable, motivating, and focused on helping users achieve their fitness goals.`,
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
    
    if (!isFitnessRelated && !isBurnoutRelated && lowerMessage.length > 15) {
      return {
        response: `I appreciate you reaching out! However, as your fitness coach, I'm specifically trained to help with health, fitness, nutrition, and workout-related questions. 💪\n\nI can help you with:\n• Workout advice and scheduling\n• Exercise form and technique\n• Nutrition and meal planning\n• Recovery and injury prevention\n• Fitness goals and motivation\n\nWhat fitness topic can I help you with?`,
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
    
    // Add strict fitness-only instruction
    if (effectiveMode === 'in_workout') {
      // IN-WORKOUT MODE: Additional safety rules
      systemPrompt += `\n\n=== CRITICAL RULES (IN-WORKOUT MODE) ===
1. You are STRICTLY a fitness coach helping during an active workout
2. Keep responses SHORT and ACTIONABLE (1-3 bullet points max)
3. Focus on immediate, practical guidance
4. For weight questions: reference their logged data and suggest specific numbers
5. For form questions: give 2-3 quick cues
6. For swap requests: suggest ONE alternative that respects their equipment/injuries
7. Don't ask clarifying questions unless absolutely necessary
8. Be encouraging but efficient - they're mid-workout!
9. Never give medical advice - redirect to professionals if needed
10. Never mention you're an AI model`;
    } else {
      systemPrompt += `\n\n=== CRITICAL RULES ===
1. You are STRICTLY a fitness, health, and nutrition coach
2. If asked about non-fitness topics, politely redirect to fitness
3. Be concise (1-3 paragraphs max)
4. Be personal and encouraging
5. Never mention you're an AI model`;
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
