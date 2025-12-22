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
  'swap', 'switch', 'change', 'modify', 'adjust', 'help', 'tips', 'advice',
  'hi', 'hello', 'hey', 'thanks', 'thank', 'how', 'what', 'should',
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
 * Get coach response with full user context
 * This is the ONLY function that should be called for coach interactions
 */
export async function getUnifiedCoachResponse(request: CoachChatRequest): Promise<CoachChatResponse> {
  const { message, coach = 'default', userId, coachingStyle, conversationHistory = [], workoutContext } = request;
  
  try {
    // Get coach personality
    const personality = COACH_PERSONALITIES[coach.toLowerCase()] || COACH_PERSONALITIES['default'];
    
    // Check if message is fitness-related
    const lowerMessage = message.toLowerCase();
    const isFitnessRelated = FITNESS_KEYWORDS.some(keyword => lowerMessage.includes(keyword));
    
    if (!isFitnessRelated && lowerMessage.length > 15) {
      return {
        response: `I appreciate you reaching out! However, as your fitness coach, I'm specifically trained to help with health, fitness, nutrition, and workout-related questions. 💪\n\nI can help you with:\n• Workout advice and scheduling\n• Exercise form and technique\n• Nutrition and meal planning\n• Recovery and injury prevention\n• Fitness goals and motivation\n\nWhat fitness topic can I help you with?`,
        coach: personality.name,
        contextUsed: false,
      };
    }
    
    // Build comprehensive user context if userId is provided
    let userContext = '';
    let contextUsed = false;
    
    if (userId) {
      try {
        const { formatted } = await buildAiContext(userId);
        userContext = formatted;
        contextUsed = true;
        if (process.env.NODE_ENV !== 'production') {
          console.log(`🧠 [COACH] Loaded full context for user ${userId}`);
        }
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.log(`⚠️ [COACH] Could not load user context: ${error}`);
        }
      }
    }
    
    // Build system prompt with user context
    let systemPrompt = personality.systemPrompt;
    
    if (userContext) {
      systemPrompt += `\n\n${userContext}`;
    }
    
    if (coachingStyle) {
      systemPrompt += `\n\nCoaching style preference: ${coachingStyle}`;
    }
    
    // Add workout context if provided (Phase 8: In-Workout Coach)
    const isInWorkout = workoutContext?.userIntentHint === 'in_workout' || workoutContext?.currentExercise;
    
    if (workoutContext) {
      systemPrompt += buildWorkoutContextPrompt(workoutContext);
    }
    
    // Add strict fitness-only instruction with mode-specific behavior
    if (isInWorkout) {
      // IN-WORKOUT MODE: Shorter, more actionable responses
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
    
    // Call OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: 400,
      temperature: 0.7,
    });
    
    const aiResponse = response.choices[0].message.content || 
      "I'm here to help with your fitness journey! What would you like to know?";
    
    return {
      response: aiResponse,
      coach: personality.name,
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
