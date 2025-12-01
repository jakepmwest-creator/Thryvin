import 'dotenv/config';
import { db } from './db';
import { exercises } from '../shared/schema';
import { inArray } from 'drizzle-orm';
import OpenAI from 'openai';
import { getUserLearningContext, getPersonalizedAdjustments } from './ai-learning-service';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface UserProfile {
  fitnessGoals?: string[];
  goal?: string;
  experience?: string;
  trainingType?: string;
  sessionDuration?: string | number;
  trainingDays?: string | number;
  equipment?: string[];
  injuries?: string[];
  userId?: number; // For personalized learning
}

interface GeneratedWorkout {
  title: string;
  type: string;
  difficulty: string;
  duration: number;
  exercises: Array<{
    id: string;
    name: string;
    sets: number;
    reps: string;
    restTime: number;
    videoUrl?: string;
    category: 'warmup' | 'main' | 'cooldown';
    suggestedWeight?: number;
    aiNote?: string;
  }>;
  overview: string;
  targetMuscles: string;
  caloriesBurn: number;
}

export async function generateAIWorkout(
  userProfile: UserProfile,
  dayOfWeek: number = 0
): Promise<GeneratedWorkout> {
  console.log('🤖 Generating AI workout for user profile:', userProfile);
  
  // Step 1: Fetch sample exercises for AI context
  const sampleExercises = await db
    .select({
      name: exercises.name,
      category: exercises.category,
      muscleGroups: exercises.muscleGroups,
      difficulty: exercises.difficulty,
    })
    .from(exercises)
    .limit(100);
  
  console.log(`  Found ${sampleExercises.length} sample exercises`);
  
  // Step 2: Build AI prompt
  const systemMessage = `You are an expert personal trainer. You create personalized workout plans.

Exercise database includes:
${sampleExercises.slice(0, 30).map(e => `- ${e.name}`).join('\n')}
... and 1,500+ more exercises.

CRITICAL RULE: ALWAYS include the SPECIFIC EQUIPMENT TYPE in the exercise name.

✅ CORRECT exercise names (with equipment):
- "Barbell Deadlift" (NOT "Deadlift")
- "Dumbbell Bench Press" (NOT "Bench Press")
- "Barbell Back Squat" (NOT "Squat")
- "Dumbbell Hammer Curl" (NOT "Hammer Curl")
- "Cable Tricep Pushdown" (NOT "Tricep Pushdown")
- "Bodyweight Push-Up" (NOT "Push-Up")
- "Machine Leg Press" (NOT "Leg Press")
- "Cable Lateral Raise" (NOT "Lateral Raise")
- "Dumbbell Romanian Deadlift" (NOT "Romanian Deadlift")

❌ NEVER use generic names without equipment type.

When in doubt, specify: Barbell, Dumbbell, Cable, Machine, Bodyweight, Resistance Band, or Kettlebell.

Workout structure:
1. 2-3 warmup exercises (dynamic stretches, can use "Bodyweight" prefix)
2. 4-6 main exercises (strength/cardio with specific equipment)
3. 2 cooldown exercises (static stretches, can use "Bodyweight" prefix)

Respond ONLY with valid JSON:
{
  "title": "Workout name",
  "type": "Upper Body",
  "difficulty": "intermediate",
  "duration": 45,
  "targetMuscles": "Chest, Back",
  "exercises": [
    {"name": "Bodyweight Arm Circles", "sets": 2, "reps": "30 sec", "restTime": 15, "category": "warmup"},
    {"name": "Barbell Bench Press", "sets": 4, "reps": "8-10", "restTime": 90, "category": "main"},
    {"name": "Bodyweight Hamstring Stretch", "sets": 1, "reps": "60 sec", "restTime": 0, "category": "cooldown"}
  ]
}`;

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const workoutFocus = ['Upper Body', 'Lower Body', 'Full Body', 'Push', 'Pull', 'Legs', 'Core & Cardio'];
  const userGoals = userProfile.fitnessGoals?.join(', ') || userProfile.goal || 'general fitness';
  
  const userMessage = `Create a ${userProfile.sessionDuration || 45}-minute workout for ${dayNames[dayOfWeek]}.

User:
- Goals: ${userGoals}
- Experience: ${userProfile.experience || 'intermediate'}
- Type: ${userProfile.trainingType || 'General Fitness'}
- Time: ${userProfile.sessionDuration || 45} min
${userProfile.injuries?.length ? `- Injuries: ${userProfile.injuries.join(', ')}` : ''}

Day ${dayOfWeek + 1}/7 - Focus: ${workoutFocus[dayOfWeek]}. 
Create a UNIQUE workout different from other days. Design a balanced workout with warmup, main exercises, and cooldown.
Vary the exercises and focus areas each day.`;

  // Step 3: Call AI
  console.log('  Calling GPT-5...');
  
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemMessage },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.7,
  });
  
  const aiResponse = completion.choices[0].message.content || '';
  
  // Step 4: Parse JSON
  let workoutPlan: any;
  try {
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    workoutPlan = JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('  Parse error:', error);
    throw new Error('Invalid AI response');
  }
  
  // Step 5: Fetch ALL exercise data from database for matching
  console.log('  Fetching exercise details...');
  
  // Always fetch all exercises for proper fuzzy matching
  const exerciseData = await db
    .select({
      name: exercises.name,
      slug: exercises.slug,
      videoUrl: exercises.videoUrl,
      thumbnailUrl: exercises.thumbnailUrl,
    })
    .from(exercises)
    .limit(2000);
  
  console.log(`  Loaded ${exerciseData.length} exercises for matching`);
  
  const exerciseMap = new Map(exerciseData.map(e => [e.name.toLowerCase(), e]));
  
  // Create normalized lookup for better matching
  const normalizeExerciseName = (name: string): string => {
    return name.toLowerCase()
      // Remove equipment prefixes AND suffixes
      .replace(/^(barbell|dumbbell|cable|machine|bodyweight|kettlebell|resistance\s*band|ez\s*bar|smith)\s+/i, '')
      .replace(/\s+(machine|cable|barbell|dumbbell|bodyweight)$/i, '')
      // Remove common position modifiers
      .replace(/\s+(standing|seated|lying|incline|decline|wide\s*grip|close\s*grip|narrow\s*grip)\s*/gi, ' ')
      // Normalize plurals
      .replace(/push-?ups?/gi, 'push-ups')
      .replace(/pull-?ups?/gi, 'pull-ups')
      .replace(/sit-?ups?/gi, 'sit-ups')
      .replace(/chin-?ups?/gi, 'chin-ups')
      .replace(/squats?/gi, 'squat')
      .replace(/lunges?/gi, 'lunge')
      .replace(/rows?/gi, 'row')
      .replace(/curls?/gi, 'curl')
      .replace(/presses?/gi, 'press')
      .replace(/raises?/gi, 'raise')
      .replace(/extensions?/gi, 'extension')
      .replace(/flies|flyes|fly/gi, 'fly')
      .replace(/deadlifts?/gi, 'deadlift')
      .replace(/bridges?/gi, 'bridge')
      .replace(/dips?/gi, 'dip')
      .replace(/planks?/gi, 'plank')
      .replace(/pulldowns?/gi, 'pulldown')
      .replace(/shrugs?/gi, 'shrug')
      .replace(/crunches/gi, 'crunch')
      // Clean up
      .replace(/\s+/g, ' ')
      .trim();
  };
  
  // Build multiple lookup indexes for better matching
  const exercisesByName = new Map(exerciseData.map(e => [e.name.toLowerCase(), e]));
  const exercisesByNormalized = new Map<string, typeof exerciseData[0]>();
  const exercisesByKeywords = new Map<string, typeof exerciseData[0]>();
  
  for (const ex of exerciseData) {
    const normalized = normalizeExerciseName(ex.name);
    if (!exercisesByNormalized.has(normalized)) {
      exercisesByNormalized.set(normalized, ex);
    }
    // Also index by key exercise words
    const keywords = normalized.split(' ').filter(w => w.length > 2);
    for (const kw of keywords) {
      if (!exercisesByKeywords.has(kw)) {
        exercisesByKeywords.set(kw, ex);
      }
    }
  }
  
  // Step 6: Enrich with videos using smart matching
  const enrichedExercises = workoutPlan.exercises.map((ex: any, index: number) => {
    const aiName = ex.name.toLowerCase();
    const aiNormalized = normalizeExerciseName(ex.name);
    let dbExercise: typeof exerciseData[0] | undefined;
    
    // 1. Try exact match first
    dbExercise = exercisesByName.get(aiName);
    if (dbExercise) {
      console.log(`  ✓ Exact match: "${ex.name}" → "${dbExercise.name}"`);
    }
    
    // 2. Try normalized match
    if (!dbExercise) {
      dbExercise = exercisesByNormalized.get(aiNormalized);
      if (dbExercise) {
        console.log(`  ✓ Normalized match: "${ex.name}" → "${dbExercise.name}"`);
      }
    }
    
    // 3. Try partial normalized match (AI name contains DB name or vice versa)
    if (!dbExercise) {
      for (const [dbNorm, dbEx] of exercisesByNormalized.entries()) {
        if (aiNormalized.includes(dbNorm) || dbNorm.includes(aiNormalized)) {
          dbExercise = dbEx;
          console.log(`  ✓ Partial match: "${ex.name}" → "${dbEx.name}"`);
          break;
        }
      }
    }
    
    // 4. Try keyword matching - find exercise with most matching keywords
    if (!dbExercise) {
      const aiKeywords = aiNormalized.split(' ').filter(w => w.length > 2);
      let bestMatch: { exercise: typeof exerciseData[0], score: number } | null = null;
      
      for (const dbEx of exerciseData) {
        const dbNorm = normalizeExerciseName(dbEx.name);
        const dbKeywords = dbNorm.split(' ').filter(w => w.length > 2);
        
        // Count matching keywords
        const matchingKeywords = aiKeywords.filter(kw => 
          dbKeywords.some(dbkw => dbkw.includes(kw) || kw.includes(dbkw))
        );
        
        const score = matchingKeywords.length / Math.max(aiKeywords.length, dbKeywords.length);
        
        if (score > 0.5 && (!bestMatch || score > bestMatch.score)) {
          bestMatch = { exercise: dbEx, score };
        }
      }
      
      if (bestMatch) {
        dbExercise = bestMatch.exercise;
        console.log(`  ✓ Keyword match: "${ex.name}" → "${dbExercise.name}" (${Math.round(bestMatch.score * 100)}%)`);
      }
    }
    
    // 5. Try core exercise type matching as last resort
    if (!dbExercise) {
      const coreMatches: { [key: string]: string } = {
        'press': 'Bench Press',
        'pulldown': 'Lat Pulldown',
        'row': 'Bent Over Row',
        'curl': 'Bicep Curl',
        'extension': 'Tricep Extension',
        'raise': 'Front Raise',
        'fly': 'Chest Fly',
        'squat': 'Squat',
        'deadlift': 'Deadlift',
        'lunge': 'Lunges',
        'bridge': 'Glute Bridge',
        'plank': 'Plank',
        'crunch': 'Crunches',
        'dip': 'Dips',
        'pull-up': 'Pull-Ups',
        'push-up': 'Push-Ups',
        'face pull': 'Face Pulls',
        'shrug': 'Shrugs',
      };
      
      for (const [keyword, dbName] of Object.entries(coreMatches)) {
        if (aiNormalized.includes(keyword)) {
          dbExercise = exercisesByName.get(dbName.toLowerCase());
          if (dbExercise) {
            console.log(`  ✓ Core match: "${ex.name}" → "${dbExercise.name}"`);
            break;
          }
        }
      }
    }
    
    if (!dbExercise) {
      console.log(`  ⚠ No match found for: "${ex.name}"`);
    }
    
    return {
      id: dbExercise?.slug || `exercise-${index}`,
      name: ex.name,
      sets: ex.sets || 3,
      reps: ex.reps || '10-12',
      restTime: ex.restTime || 60,
      videoUrl: dbExercise?.videoUrl,
      thumbnailUrl: dbExercise?.thumbnailUrl,
      category: ex.category || 'main',
    };
  });
  
  console.log(`  ✅ Generated ${enrichedExercises.length} exercises`);
  console.log(`  Videos: ${enrichedExercises.filter(e => e.videoUrl).length}/${enrichedExercises.length}`);
  
  // Step 7: Return workout
  return {
    title: workoutPlan.title || 'AI Workout',
    type: workoutPlan.type || 'Full Body',
    difficulty: workoutPlan.difficulty || userProfile.experience || 'intermediate',
    duration: workoutPlan.duration || parseInt(String(userProfile.sessionDuration)) || 45,
    exercises: enrichedExercises,
    overview: `${enrichedExercises.length} exercises targeting ${workoutPlan.targetMuscles || 'full body'}. ${workoutPlan.duration}-minute session for ${userProfile.experience || 'intermediate'} level.`,
    targetMuscles: workoutPlan.targetMuscles || 'Full Body',
    caloriesBurn: Math.round((workoutPlan.duration || 45) * 8),
  };
}

// Test function - call directly if needed
// Note: Removed CommonJS require.main check for ESM compatibility
