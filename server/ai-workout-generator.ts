import 'dotenv/config';
import { db } from './db';
import { exercises } from '../shared/schema';
import { inArray } from 'drizzle-orm';
import OpenAI from 'openai';

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
  
  // Step 5: Fetch exercise data from database with fuzzy matching
  console.log('  Fetching exercise details...');
  const exerciseNames = workoutPlan.exercises.map((e: any) => e.name);
  
  // First try exact match
  let exerciseData = await db
    .select({
      name: exercises.name,
      slug: exercises.slug,
      videoUrl: exercises.videoUrl,
      thumbnailUrl: exercises.thumbnailUrl,
    })
    .from(exercises)
    .where(inArray(exercises.name, exerciseNames));
  
  // If no exact matches, get all exercises for fuzzy matching
  if (exerciseData.length === 0) {
    exerciseData = await db
      .select({
        name: exercises.name,
        slug: exercises.slug,
        videoUrl: exercises.videoUrl,
        thumbnailUrl: exercises.thumbnailUrl,
      })
      .from(exercises)
      .limit(2000);
  }
  
  const exerciseMap = new Map(exerciseData.map(e => [e.name.toLowerCase(), e]));
  
  // Create normalized lookup for better matching
  const normalizeExerciseName = (name: string): string => {
    return name.toLowerCase()
      // Remove equipment prefixes
      .replace(/^(barbell|dumbbell|cable|machine|bodyweight|kettlebell|resistance\s*band|ez\s*bar|smith)\s+/i, '')
      // Remove common modifiers
      .replace(/\s+(stretch|hold|static|dynamic|standing|seated|lying|incline|decline|overhead)\s*/gi, ' ')
      // Normalize common variations
      .replace(/push-?ups?/gi, 'push-ups')
      .replace(/pull-?ups?/gi, 'pull-ups')
      .replace(/sit-?ups?/gi, 'sit-ups')
      .replace(/crunches/gi, 'crunches')
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
      // Clean up
      .replace(/\s+/g, ' ')
      .trim();
  };
  
  // Build normalized index
  const normalizedIndex = new Map<string, typeof exerciseData[0]>();
  for (const ex of exerciseData) {
    const normalized = normalizeExerciseName(ex.name);
    if (!normalizedIndex.has(normalized)) {
      normalizedIndex.set(normalized, ex);
    }
  }
  
  // Step 6: Enrich with videos using smart matching
  const enrichedExercises = workoutPlan.exercises.map((ex: any, index: number) => {
    const aiName = ex.name.toLowerCase();
    let dbExercise = exerciseMap.get(aiName);
    
    // Try normalized matching if no exact match
    if (!dbExercise) {
      const normalizedAI = normalizeExerciseName(ex.name);
      dbExercise = normalizedIndex.get(normalizedAI);
      if (dbExercise) {
        console.log(`  ✓ Normalized match: "${ex.name}" → "${dbExercise.name}"`);
      }
    }
    
    // Try partial matching - look for key exercise words
    if (!dbExercise) {
      const keyWords = aiName
        .replace(/^(barbell|dumbbell|cable|machine|bodyweight|kettlebell)\s+/i, '')
        .split(/\s+/)
        .filter(w => w.length > 3);
      
      for (const [dbName, dbEx] of exerciseMap.entries()) {
        const matchCount = keyWords.filter(kw => dbName.includes(kw)).length;
        if (matchCount >= Math.ceil(keyWords.length * 0.6)) {
          dbExercise = dbEx;
          console.log(`  ✓ Keyword match: "${ex.name}" → "${dbEx.name}" (${matchCount}/${keyWords.length} keywords)`);
          break;
        }
      }
    }
    
    // Last resort - try finding any exercise with similar core name
    if (!dbExercise) {
      const coreExercises = [
        { patterns: ['overhead', 'press'], match: 'overhead press', exclude: ['bench'] },
        { patterns: ['bench', 'press'], match: 'bench press', exclude: ['overhead'] },
        { patterns: ['shoulder', 'press'], match: 'dumbbell shoulder press', exclude: ['bench'] },
        { patterns: ['lat', 'pulldown'], match: 'lat pulldown' },
        { patterns: ['bicep', 'curl'], match: 'bicep curl' },
        { patterns: ['hammer', 'curl'], match: 'hammer curl' },
        { patterns: ['tricep', 'extension'], match: 'tricep extension' },
        { patterns: ['tricep', 'pushdown'], match: 'tricep extension' },
        { patterns: ['squat'], match: 'squat', exclude: ['split', 'pistol'] },
        { patterns: ['deadlift'], match: 'deadlift', exclude: ['romanian', 'rdl'] },
        { patterns: ['romanian'], match: 'romanian deadlift' },
        { patterns: ['lunge'], match: 'lunge' },
        { patterns: ['bent', 'row'], match: 'bent over row' },
        { patterns: ['row'], match: 'dumbbell rows', exclude: ['bent', 'cable', 'upright'] },
        { patterns: ['cable', 'row'], match: 'cable rows' },
        { patterns: ['fly', 'flye'], match: 'chest fly' },
        { patterns: ['chest', 'fly'], match: 'chest fly' },
        { patterns: ['calf', 'raise'], match: 'calf raise' },
        { patterns: ['leg', 'press'], match: 'leg press' },
        { patterns: ['leg', 'curl'], match: 'leg curl' },
        { patterns: ['leg', 'extension'], match: 'leg extension' },
        { patterns: ['glute', 'bridge'], match: 'glute bridge' },
        { patterns: ['hip', 'thrust'], match: 'glute bridge' },
        { patterns: ['plank'], match: 'plank', exclude: ['side'] },
        { patterns: ['side', 'plank'], match: 'side plank' },
        { patterns: ['crunch'], match: 'crunches' },
        { patterns: ['russian', 'twist'], match: 'russian twist' },
        { patterns: ['pull-up', 'pullup'], match: 'pull-ups' },
        { patterns: ['chin-up', 'chinup'], match: 'chin-ups' },
        { patterns: ['push-up', 'pushup'], match: 'push-ups' },
        { patterns: ['dip'], match: 'dips', exclude: ['tricep'] },
        { patterns: ['tricep', 'dip'], match: 'tricep dips' },
        { patterns: ['front', 'raise'], match: 'front raise' },
        { patterns: ['lateral', 'raise'], match: 'lateral raise' },
        { patterns: ['side', 'raise'], match: 'lateral raise' },
        { patterns: ['face', 'pull'], match: 'face pulls' },
        { patterns: ['shrug'], match: 'shrugs' },
        { patterns: ['arnold', 'press'], match: 'arnold press' },
        { patterns: ['high', 'knee'], match: 'high knees' },
        { patterns: ['jump', 'rope'], match: 'jump rope' },
        { patterns: ['box', 'jump'], match: 'box jumps' },
        { patterns: ['step-up', 'step', 'up'], match: 'step-ups' },
      ];
      
      for (const core of coreExercises) {
        // Check if ALL patterns match
        const matchesAllPatterns = core.patterns.every(p => aiName.includes(p));
        // Check exclusions
        const hasExclusion = (core as any).exclude?.some((ex: string) => aiName.includes(ex));
        
        if (matchesAllPatterns && !hasExclusion && core.match) {
          // Find the matching exercise in DB
          const matchLower = core.match.toLowerCase();
          for (const [dbName, dbEx] of exerciseMap.entries()) {
            if (dbName === matchLower || dbName.includes(matchLower) || matchLower.split(' ').every(w => dbName.includes(w))) {
              dbExercise = dbEx;
              console.log(`  ✓ Core match: "${ex.name}" → "${dbEx.name}"`);
              break;
            }
          }
          if (dbExercise) break;
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
