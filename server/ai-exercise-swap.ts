import OpenAI from "openai";
import { db } from './db';
import { exercises } from '../shared/schema';
import { like, or } from 'drizzle-orm';
import { z } from 'zod';
import { buildAiContext } from './ai-user-context';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// =============================================================================
// INJURY CONSTRAINT RULES - Explicit safety checks (not just prompt text)
// =============================================================================

interface InjuryConstraint {
  keywords: string[];  // Keywords to detect in injury description
  blockedPatterns: string[];  // Exercise name patterns to block
  preferredPatterns: string[];  // Exercise name patterns to prefer
  description: string;
}

const INJURY_CONSTRAINTS: Record<string, InjuryConstraint> = {
  'lower_back': {
    keywords: ['lower back', 'lumbar', 'l4', 'l5', 'disc', 'sciatica'],
    blockedPatterns: [
      'deadlift', 'good morning', 'stiff leg', 'romanian deadlift', 'rdl',
      'bent over row', 'barbell row', 'pendlay row',  // Unsupported rows
      'back extension', 'hyperextension',
      'clean', 'snatch',  // Olympic lifts
      'sit-up', 'crunch',  // Spinal flexion
    ],
    preferredPatterns: [
      'machine', 'cable', 'seated', 'supported', 'chest supported',
      'lat pulldown', 'seated row', 'chest-supported row',
      'leg press', 'leg curl', 'leg extension',
    ],
    description: 'Avoid spinal loading, hinges, and unsupported bent-over positions',
  },
  'knee': {
    keywords: ['knee', 'acl', 'mcl', 'meniscus', 'patella'],
    blockedPatterns: [
      'jump', 'plyometric', 'box jump', 'burpee',
      'deep squat', 'pistol squat', 'sissy squat',
      'lunge', 'split squat',  // Deep knee flexion
    ],
    preferredPatterns: [
      'leg press', 'leg curl', 'leg extension',
      'partial squat', 'box squat',
      'glute bridge', 'hip thrust',
    ],
    description: 'Avoid deep knee flexion and high-impact movements',
  },
  'shoulder': {
    keywords: ['shoulder', 'rotator cuff', 'impingement', 'labrum', 'deltoid'],
    blockedPatterns: [
      'overhead press', 'military press', 'push press',
      'upright row', 'behind neck',
      'dip',  // Can aggravate shoulder
      'kipping', 'butterfly pull-up',
    ],
    preferredPatterns: [
      'landmine press', 'neutral grip', 'cable',
      'face pull', 'external rotation',
      'low incline', 'floor press',
    ],
    description: 'Avoid overhead movements and internal rotation under load',
  },
  'wrist': {
    keywords: ['wrist', 'carpal', 'forearm'],
    blockedPatterns: [
      'front squat', 'clean grip',
      'wrist curl', 'reverse curl',
      'push-up',  // Standard push-ups stress wrist
    ],
    preferredPatterns: [
      'neutral grip', 'ez bar', 'dumbbell', 'machine',
      'knuckle push-up', 'push-up handles',
    ],
    description: 'Avoid wrist extension under load',
  },
};

/**
 * Filter exercises based on injury constraints
 * Returns only safe exercises for the user's injuries
 */
function filterByInjuryConstraints(
  alternatives: Array<{ name: string; reason?: string; sets: number; reps: string }>,
  userContext: string
): Array<{ name: string; reason?: string; sets: number; reps: string }> {
  if (!userContext) return alternatives;
  
  const contextLower = userContext.toLowerCase();
  
  // Detect which injuries apply
  const activeConstraints: InjuryConstraint[] = [];
  for (const [key, constraint] of Object.entries(INJURY_CONSTRAINTS)) {
    if (constraint.keywords.some(kw => contextLower.includes(kw))) {
      activeConstraints.push(constraint);
      if (process.env.NODE_ENV !== 'production' || process.env.DEBUG) {
        console.log(`   🛡️ [SAFETY] Detected ${key} injury - applying constraints`);
      }
    }
  }
  
  if (activeConstraints.length === 0) return alternatives;
  
  // Filter out blocked exercises
  return alternatives.filter(alt => {
    const nameLower = alt.name.toLowerCase();
    
    for (const constraint of activeConstraints) {
      // Check if exercise matches any blocked pattern
      if (constraint.blockedPatterns.some(pattern => nameLower.includes(pattern))) {
        if (process.env.NODE_ENV !== 'production' || process.env.DEBUG) {
          console.log(`   ❌ [SAFETY] Blocked: ${alt.name} (matches blocked pattern)`);
        }
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Get safe fallback alternatives based on injury
 */
function getSafeFallbackForInjury(
  currentExercise: Exercise,
  userContext: string
): AlternativesResponse {
  const contextLower = (userContext || '').toLowerCase();
  
  // Default safe alternatives based on detected injury
  let safeExercises: Array<{ name: string; description: string }> = [];
  
  if (contextLower.includes('lower back') || contextLower.includes('lumbar')) {
    safeExercises = [
      { name: 'Chest-Supported Dumbbell Row', description: 'Supported position protects lower back' },
      { name: 'Seated Cable Row', description: 'Machine support eliminates spinal loading' },
      { name: 'Lat Pulldown', description: 'Vertical pull with no lower back involvement' },
      { name: 'Machine Row', description: 'Full back support throughout movement' },
    ];
  } else if (contextLower.includes('knee')) {
    safeExercises = [
      { name: 'Leg Press', description: 'Controlled range of motion' },
      { name: 'Leg Curl', description: 'Isolated hamstring work' },
      { name: 'Glute Bridge', description: 'Hip-focused with minimal knee stress' },
    ];
  } else if (contextLower.includes('shoulder')) {
    safeExercises = [
      { name: 'Landmine Press', description: 'Shoulder-friendly angle' },
      { name: 'Cable Lateral Raise', description: 'Controlled resistance' },
      { name: 'Face Pull', description: 'Promotes shoulder health' },
    ];
  } else {
    // Generic safe fallback
    safeExercises = [
      { name: 'Machine Alternative', description: 'Controlled, supported movement' },
      { name: 'Cable Alternative', description: 'Adjustable resistance and angle' },
    ];
  }
  
  const fallbackExercises: Exercise[] = safeExercises.map((ex, i) => ({
    id: `safe-${i}`,
    name: ex.name,
    description: ex.description,
    sets: currentExercise.sets,
    reps: currentExercise.reps,
    restTime: currentExercise.restTime || 60,
    category: currentExercise.category || 'main',
  }));
  
  return {
    recommended: fallbackExercises[0],
    alternatives: fallbackExercises.slice(1),
  };
}

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

    const rawResult = JSON.parse(response.choices[0].message.content || '{}');
    
    // Validate with Zod
    const validation = AlternativesResponseSchema.safeParse(rawResult);
    
    if (!validation.success) {
      console.error('❌ [SWAP] Invalid AI response:', validation.error.errors);
      
      if (retryCount < 1) {
        if (process.env.NODE_ENV !== 'production' || process.env.DEBUG) {
          console.log('🔄 [SWAP] Retrying...');
        }
        return getExerciseAlternatives(request, retryCount + 1);
      }
      
      // Return fallback after retry fails
      return getFallbackAlternatives(currentExercise);
    }
    
    const result = validation.data;
    if (process.env.NODE_ENV !== 'production' || process.env.DEBUG) {
      console.log(`   ✅ AI suggested ${result.alternatives.length} validated alternatives`);
    }
    
    // EXPLICIT INJURY SAFETY CHECKS - filter out unsafe exercises
    const filteredAlternatives = filterByInjuryConstraints(result.alternatives, userContext);
    
    if (process.env.NODE_ENV !== 'production' || process.env.DEBUG) {
      const blocked = result.alternatives.length - filteredAlternatives.length;
      if (blocked > 0) {
        console.log(`   🛡️ [SAFETY] Blocked ${blocked} exercises due to injury constraints`);
      }
    }
    
    // If all alternatives were blocked, return fallback
    if (filteredAlternatives.length === 0) {
      console.log('   ⚠️ [SAFETY] All AI suggestions blocked - using safe fallback');
      return getSafeFallbackForInjury(currentExercise, userContext);
    }
    
    // Fetch video URLs from database for each alternative
    const exerciseNames = filteredAlternatives.map((alt: any) => alt.name);
    
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
    
    // Enrich filtered alternatives with video URLs
    const enrichedAlternatives = filteredAlternatives.map((alt: any, index: number) => {
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
    
    if (retryCount < 1) {
      if (process.env.NODE_ENV !== 'production' || process.env.DEBUG) {
        console.log('🔄 [SWAP] Retrying after error...');
      }
      return getExerciseAlternatives(request, retryCount + 1);
    }
    
    return getFallbackAlternatives(currentExercise);
  }
}

/**
 * Fallback alternatives when AI generation fails
 */
function getFallbackAlternatives(currentExercise: Exercise): AlternativesResponse {
  const fallbackExercises: Exercise[] = [
    {
      id: `alt-0`,
      name: `Modified ${currentExercise.name}`,
      description: 'A modified version with adjusted intensity',
      sets: currentExercise.sets,
      reps: currentExercise.reps,
      restTime: (currentExercise.restTime || 60) + 15, // Extra rest
      category: currentExercise.category || 'main',
    },
    {
      id: `alt-1`,
      name: 'Bodyweight Alternative',
      description: 'A bodyweight variation',
      sets: currentExercise.sets,
      reps: String(parseInt(String(currentExercise.reps)) + 5 || '15'),
      restTime: 45,
      category: currentExercise.category || 'main',
    },
  ];
  
  return {
    recommended: fallbackExercises[0],
    alternatives: fallbackExercises.slice(1),
  };
}

// Keep old function for backward compatibility
export async function generateExerciseAlternative(request: SwapRequest): Promise<Exercise> {
  const result = await getExerciseAlternatives(request);
  return result.recommended;
}