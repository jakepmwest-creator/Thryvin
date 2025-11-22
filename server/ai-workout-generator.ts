import 'dotenv/config';
import { db } from './db';
import { exercises } from '../shared/schema';
import { inArray } from 'drizzle-orm';

// @ts-ignore
import { LlmChat, UserMessage } from 'emergentintegrations/llm/chat';

const EMERGENT_LLM_KEY = process.env.EMERGENT_LLM_KEY || 'sk-emergent-d5e1f232821660fBdD';

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

Workout structure:
1. 2-3 warmup exercises (dynamic stretches)
2. 4-6 main exercises (strength/cardio)
3. 2 cooldown exercises (static stretches)

Respond ONLY with valid JSON:
{
  "title": "Workout name",
  "type": "Upper Body",
  "difficulty": "intermediate",
  "duration": 45,
  "targetMuscles": "Chest, Back",
  "exercises": [
    {"name": "Arm Circles", "sets": 2, "reps": "30 sec", "restTime": 15, "category": "warmup"},
    {"name": "Bench Press", "sets": 4, "reps": "8-10", "restTime": 90, "category": "main"},
    {"name": "Hamstring Stretch", "sets": 1, "reps": "60 sec", "restTime": 0, "category": "cooldown"}
  ]
}`;

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const userGoals = userProfile.fitnessGoals?.join(', ') || userProfile.goal || 'general fitness';
  
  const userMessage = `Create a ${userProfile.sessionDuration || 45}-minute workout for ${dayNames[dayOfWeek]}.

User:
- Goals: ${userGoals}
- Experience: ${userProfile.experience || 'intermediate'}
- Type: ${userProfile.trainingType || 'General Fitness'}
- Time: ${userProfile.sessionDuration || 45} min
${userProfile.injuries?.length ? `- Injuries: ${userProfile.injuries.join(', ')}` : ''}

Day ${dayOfWeek + 1}/7. Design a balanced workout with warmup, main exercises, and cooldown.`;

  // Step 3: Call AI
  console.log('  Calling GPT-5...');
  
  const chat = new LlmChat({
    api_key: EMERGENT_LLM_KEY,
    session_id: `workout-${Date.now()}`,
    system_message: systemMessage,
  }).with_model('openai', 'gpt-5');
  
  const aiResponse = await chat.send_message(
    new UserMessage({ text: userMessage })
  );
  
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
  
  // Step 5: Fetch exercise data from database
  console.log('  Fetching exercise details...');
  const exerciseNames = workoutPlan.exercises.map((e: any) => e.name);
  
  const exerciseData = await db
    .select({
      name: exercises.name,
      slug: exercises.slug,
      videoUrl: exercises.videoUrl,
      thumbnailUrl: exercises.thumbnailUrl,
    })
    .from(exercises)
    .where(inArray(exercises.name, exerciseNames));
  
  const exerciseMap = new Map(exerciseData.map(e => [e.name, e]));
  
  // Step 6: Enrich with videos
  const enrichedExercises = workoutPlan.exercises.map((ex: any, index: number) => {
    const dbExercise = exerciseMap.get(ex.name);
    
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
