import OpenAI from "openai";
import { db } from './db';
import { exercises } from '../shared/schema';
import { like, or } from 'drizzle-orm';
import { z } from 'zod';
import { buildAiContext } from './ai-user-context';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// =============================================================================
// ZOD VALIDATION SCHEMAS
// =============================================================================

const AlternativeExerciseSchema = z.object({
  name: z.string().min(1, 'Exercise name required'),
  reason: z.string().optional(),
  sets: z.number().min(1).max(10).default(3),
  reps: z.union([z.string(), z.number()]).transform(val => String(val)),
});

const AlternativesResponseSchema = z.object({
  alternatives: z.array(AlternativeExerciseSchema).min(1).max(6),
});

interface Exercise {
  id: string;
  name: string;
  description?: string;
  sets: number;
  reps: string | number;
  restTime?: number;
  videoUrl?: string;
  category?: string;
}

interface SwapRequest {
  currentExercise: Exercise;
  reason: string;
  additionalNotes?: string;
  userProfile?: any;
  userId?: number; // For loading full context
}

interface AlternativesResponse {
  recommended: Exercise;
  alternatives: Exercise[];
}

export async function getExerciseAlternatives(request: SwapRequest, retryCount: number = 0): Promise<AlternativesResponse> {
  try {
    const { currentExercise, reason, additionalNotes, userProfile, userId } = request;
    
    console.log('🤖 Generating alternatives for:', currentExercise.name, `(attempt ${retryCount + 1})`);
    console.log('   Reason:', reason, additionalNotes || '');
    
    // Get user context if userId provided (includes injuries, equipment, preferences)
    let userContext = '';
    if (userId) {
      try {
        const { formatted } = await buildAiContext(userId);
        userContext = `\n\nUSER CONTEXT (respect injuries and equipment):\n${formatted}`;
        console.log('   ✅ Loaded user context for personalized swap');
      } catch (e) {
        console.log('   ⚠️ Could not load user context');
      }
    }
    
    // Build AI prompt with user context
    const prompt = `You are a professional fitness coach. A user wants to swap an exercise for a better alternative.

Current Exercise: ${currentExercise.name}
Sets: ${currentExercise.sets}
Reps: ${currentExercise.reps}
Reason for swap: ${reason}
${additionalNotes ? `Additional details: ${additionalNotes}` : ''}
${userContext}

Based on the reason, suggest 4 alternative exercises that:
1. Target similar muscle groups
2. Address the user's specific concern (${reason})
3. Have appropriate difficulty
4. MUST include SPECIFIC equipment type in name (e.g., "Barbell Bench Press", "Dumbbell Chest Press", "Cable Fly")
5. MUST respect user's injuries if mentioned above - DO NOT suggest exercises that could aggravate injuries
6. MUST use equipment the user has access to (if specified above)

IMPORTANT: Use specific names with equipment:
- "Barbell Bench Press" not "Bench Press"
- "Dumbbell Lateral Raise" not "Lateral Raise"
- "Cable Tricep Pushdown" not "Tricep Pushdown"

Rank by best match (first = most recommended).

Respond with JSON ONLY:
{
  "alternatives": [
    {
      "name": "Specific Exercise Name With Equipment",
      "reason": "Why this is a good swap",
      "sets": 3,
      "reps": "8-10"
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional fitness coach. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    if (!result.alternatives || !Array.isArray(result.alternatives)) {
      throw new Error('Invalid AI response format');
    }

    console.log(`   AI suggested ${result.alternatives.length} alternatives`);
    
    // Fetch video URLs from database for each alternative
    const exerciseNames = result.alternatives.map((alt: any) => alt.name);
    
    const exerciseData = await db
      .select({
        name: exercises.name,
        slug: exercises.slug,
        videoUrl: exercises.videoUrl,
        thumbnailUrl: exercises.thumbnailUrl,
      })
      .from(exercises)
      .where(
        or(
          ...exerciseNames.map(name => like(exercises.name, `%${name}%`))
        )
      );
    
    console.log(`   Found ${exerciseData.length} matching videos in DB`);
    
    // Create a mapping of exercise names to video URLs
    const exerciseMap = new Map(exerciseData.map(e => [e.name.toLowerCase(), e]));
    
    // Enrich alternatives with video URLs
    const enrichedAlternatives = result.alternatives.map((alt: any, index: number) => {
      const dbExercise = exerciseMap.get(alt.name.toLowerCase()) || 
                        exerciseData.find(e => 
                          e.name.toLowerCase().includes(alt.name.toLowerCase()) ||
                          alt.name.toLowerCase().includes(e.name.toLowerCase())
                        );
      
      return {
        id: dbExercise?.slug || `alt-${index}`,
        name: alt.name,
        description: alt.reason || 'A great alternative exercise',
        sets: alt.sets || currentExercise.sets,
        reps: alt.reps || currentExercise.reps,
        restTime: currentExercise.restTime || 60,
        videoUrl: dbExercise?.videoUrl,
        category: currentExercise.category || 'main',
      };
    });
    
    // First is recommended, rest are alternatives
    return {
      recommended: enrichedAlternatives[0],
      alternatives: enrichedAlternatives.slice(1),
    };

  } catch (error) {
    console.error('❌ Error generating alternatives:', error);
    
    // Fallback response
    return {
      recommended: {
        id: `alt-${currentExercise.id}`,
        name: `Modified ${currentExercise.name}`,
        description: 'A modified version based on your feedback',
        sets: currentExercise.sets,
        reps: currentExercise.reps,
        restTime: currentExercise.restTime || 60,
        category: currentExercise.category || 'main',
      },
      alternatives: [],
    };
  }
}

// Keep old function for backward compatibility
export async function generateExerciseAlternative(request: SwapRequest): Promise<Exercise> {
  const result = await getExerciseAlternatives(request);
  return result.recommended;
}