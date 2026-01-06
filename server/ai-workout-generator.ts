import 'dotenv/config';
import { db } from './db';
import { exercises } from '../shared/schema';
import { inArray } from 'drizzle-orm';
import OpenAI from 'openai';
import { z } from 'zod';
import { getUserLearningContext, getPersonalizedAdjustments } from './ai-learning-service';
import { getComprehensiveUserContext, formatUserContextForAI, getSuggestedWeight } from './ai-user-context';
import { generateWeeklyTemplate, getPromptConstraints, type SplitPlannerInput } from './split-planner';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// =============================================================================
// ZOD VALIDATION SCHEMAS
// =============================================================================

// Helper to generate unique exercise ID from name
function generateExerciseId(name: string, index: number): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 30);
  return `${slug}-${index}-${Date.now().toString(36)}`;
}

const ExerciseSchema = z.object({
  id: z.string().optional(), // Will be generated server-side if missing
  name: z.string().min(1, 'Exercise name is required'),
  sets: z.number().min(1).max(10).default(3),
  reps: z.union([z.string(), z.number()]).transform(val => String(val)),
  restTime: z.number().min(15).max(300).default(60),
  category: z.enum(['warmup', 'main', 'cooldown']).default('main'),
  videoUrl: z.string().optional(),
  suggestedWeight: z.number().optional(),
  suggestedReps: z.number().optional(),
  aiNote: z.string().optional(),
  setType: z.enum(['normal', 'drop', 'super', 'giant']).optional(),
  supersetWith: z.string().optional(),
});

// Dynamic max exercises based on duration and experience
function getMaxExercises(duration: number, experience: string): number {
  if (experience === 'beginner') {
    return duration <= 30 ? 4 : duration <= 45 ? 6 : 7;
  } else if (experience === 'advanced') {
    return duration <= 30 ? 6 : duration <= 45 ? 8 : 10;
  } else { // intermediate
    return duration <= 30 ? 5 : duration <= 45 ? 7 : 9;
  }
}

const WorkoutSchema = z.object({
  title: z.string().min(1, 'Workout title is required'),
  type: z.string().default('mixed'),
  difficulty: z.string().default('intermediate'),
  duration: z.number().min(15).max(120).default(45),
  exercises: z.array(ExerciseSchema).min(3, 'At least 3 exercises required').max(12), // Reduced max from 20 to 12
  overview: z.string().default('A personalized workout'),
  targetMuscles: z.string().default('Full Body'),
  caloriesBurn: z.number().min(50).max(1500).default(300),
});

export type ValidatedWorkout = z.infer<typeof WorkoutSchema>;

interface WeeklyActivityInput {
  name: string;
  dayOfWeek: number;
  timeWindow: 'morning' | 'afternoon' | 'evening';
  intensity: 'low' | 'moderate' | 'hard';
  notes?: string;
}

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
  preferredTrainingDays?: number[]; // 0-6 (Sun-Sat)
  // Advanced questionnaire data
  advancedQuestionnaire?: {
    targets?: string;
    goalDetails?: { [goalKey: string]: string };
    enjoyedTraining?: string;
    dislikedTraining?: string;
    weakAreas?: string;
    additionalInfo?: string;
    // Phase 8.5: New weekly schedule fields
    weeklyActivities?: WeeklyActivityInput[];
    gymDaysAvailable?: number[];
    scheduleFlexibility?: boolean;
    preferredSplit?: string;
    preferredSplitOther?: string;
  };
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
    suggestedReps?: number;
    aiNote?: string;
    setType?: 'normal' | 'drop' | 'super' | 'giant'; // Different set types
    supersetWith?: string; // For supersets
  }>;
  overview: string;
  targetMuscles: string;
  caloriesBurn: number;
}

export async function generateAIWorkout(
  userProfile: UserProfile,
  dayOfWeek: number = 0,
  weekNumber: number = 1, // Week number for variation
  recentExercises: string[] = [] // Exercises from previous days to avoid repetition
): Promise<GeneratedWorkout> {
  console.log('🤖 Generating AI workout for user profile:', userProfile, 'Week:', weekNumber);
  
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
  
  // Step 1.5: Get COMPREHENSIVE user context for full personalization
  let fullUserContext = "No previous workout history available.";
  if (userProfile.userId) {
    try {
      const comprehensiveProfile = await getComprehensiveUserContext(
        userProfile.userId,
        userProfile.advancedQuestionnaire
      );
      fullUserContext = formatUserContextForAI(comprehensiveProfile);
      console.log('  📚 Loaded comprehensive user context');
    } catch (error) {
      console.log('  ⚠️ Could not load comprehensive context, using basic:', error);
      // Fallback to basic learning context
      fullUserContext = await getUserLearningContext(userProfile.userId);
    }
  }
  
  // Step 1.6: Generate weekly split plan (Phase 8.5 - IMPROVED)
  const frequency = Number(userProfile.trainingDays || 3);
  const experience = (userProfile.experience || 'intermediate') as 'beginner' | 'intermediate' | 'advanced';
  const sessionDuration = Number(userProfile.sessionDuration || 45);
  
  const splitPlannerInput: SplitPlannerInput = {
    frequency,
    experience,
    goals: userProfile.fitnessGoals || [userProfile.goal || 'general'],
    equipment: userProfile.equipment || [],
    injuries: userProfile.injuries?.join(', ') || null,
    sessionDuration,
    weeklyActivities: userProfile.advancedQuestionnaire?.weeklyActivities || [],
    // CRITICAL FIX: Default to all days if no specific days selected
    // Empty array [] means NO days available which causes REST-ONLY plans
    gymDaysAvailable: (userProfile.advancedQuestionnaire?.gymDaysAvailable?.length > 0) 
      ? userProfile.advancedQuestionnaire.gymDaysAvailable 
      : (userProfile.preferredTrainingDays?.length > 0)
        ? userProfile.preferredTrainingDays
        : [0, 1, 2, 3, 4, 5, 6], // ALL DAYS AVAILABLE by default
    scheduleFlexibility: userProfile.advancedQuestionnaire?.scheduleFlexibility ?? true,
    preferredSplit: userProfile.advancedQuestionnaire?.preferredSplit,
    preferredSplitOther: userProfile.advancedQuestionnaire?.preferredSplitOther,
    weekNumber, // For weekly variety rotation
  };
  
  console.log(`  🗓️ Gym days available: ${splitPlannerInput.gymDaysAvailable.join(', ')} (${splitPlannerInput.gymDaysAvailable.length} days)`);
  
  // Generate full weekly template
  const weeklyTemplate = generateWeeklyTemplate(splitPlannerInput);
  const dayPlan = weeklyTemplate.days.find(d => d.dayIndex === dayOfWeek);
  
  if (!dayPlan) {
    throw new Error(`No plan found for day ${dayOfWeek}`);
  }
  
  // Check if this is NOT a gym training day
  if (!dayPlan.isGymTraining) {
    if (dayPlan.focus === 'external_activity') {
      // Return special response for external activity day
      console.log(`  ⚽ Day ${dayOfWeek} is an external activity day: ${dayPlan.notes}`);
      return {
        title: dayPlan.notes?.replace('⚽ ', '').split(' (')[0] || 'Scheduled Activity',
        type: 'external_activity',
        difficulty: 'moderate',
        duration: 60,
        exercises: [],
        overview: dayPlan.notes || 'You have a scheduled activity today',
        targetMuscles: 'Various',
        caloriesBurn: 400,
        isActivityDay: true,
        activityName: dayPlan.notes?.replace('⚽ ', '').split(' (')[0],
      } as any;
    } else {
      // REST day - return null or minimal workout
      console.log(`  💤 Day ${dayOfWeek} is a rest day`);
      return {
        title: 'Rest Day',
        type: 'rest',
        difficulty: 'easy',
        duration: 0,
        exercises: [],
        overview: 'Rest and recovery - no workout today',
        targetMuscles: 'None',
        caloriesBurn: 0,
        isRestDay: true,
      } as any;
    }
  }
  
  // This IS a gym training day - generate full workout
  const focus = dayPlan.focus;
  const splitConstraints = getPromptConstraints(weeklyTemplate, dayOfWeek);
  
  console.log(`  🏋️ Day ${dayOfWeek} - GYM TRAINING: ${focus.toUpperCase()}`);
  console.log(`  📋 Targets: ${dayPlan.musclesFocused.join(', ')}`);
  console.log(`  📊 Exercises: ${dayPlan.exerciseCount.min}-${dayPlan.exerciseCount.max}`);
  
  // Step 2: Build ENHANCED AI prompt with varied sets, weight suggestions, and full personalization
  const systemMessage = `You are an EXPERT PERSONAL TRAINER (AI PT) who creates HIGHLY PERSONALIZED workout plans.
Your goal is to be like a real personal trainer who KNOWS their client intimately.

${fullUserContext}

Exercise database includes 1,800+ exercises with videos.
Sample exercises: ${sampleExercises.slice(0, 20).map(e => e.name).join(', ')}...

=== PERSONALIZATION RULES (CRITICAL - READ ALL USER DATA ABOVE) ===

1. **USE ALL USER INFO**: Read EVERY section above. Their advanced questionnaire tells you what they LOVE, HATE, and need to focus on.

2. **RESPECT PREFERENCES**: 
   - If they said they enjoy something → Include MORE of it
   - If they said they dislike something → Include LESS (but don't eliminate completely - they still need variety)
   - If they have weak areas → Add extra focus exercises for those

3. **TARGET THEIR EVENTS**: If they have a target event (race, wedding, etc.), design workouts to prepare for it.

4. **LEARN FROM HISTORY**: Use their workout history to:
   - Avoid exercises they always skip
   - Include exercises they complete consistently
   - Adjust difficulty based on their feedback

=== SET VARIETY (CRITICAL) ===

DON'T always do 3 sets! Mix it up based on exercise type and goals:
- Compound lifts (Squat, Deadlift, Bench): 4-5 sets
- Isolation exercises: 3-4 sets  
- Warmup/Activation: 2 sets
- Finishers: 2-3 sets high-rep

Include DIFFERENT SET TYPES for variety:
- "normal": Standard sets with rest
- "drop": Drop set - reduce weight each set, minimal rest
- "super": Superset - pair with another exercise, no rest between
- "giant": Giant set - 3+ exercises back-to-back

=== WEIGHT SUGGESTIONS ===

For EVERY main exercise, suggest a starting weight based on:
- User's known working weights (from history above)
- Their experience level and goals
- The rep range you're prescribing

Format: "suggestedWeight": 60, "suggestedReps": 10

If you don't know their weight for an exercise, suggest based on:
- Beginner: Conservative weight
- Intermediate: Moderate weight
- Advanced: Challenging weight

=== EXERCISE NAMING ===

✅ ALWAYS include equipment: "Barbell Bench Press", "Dumbbell Curl", "Cable Row"
❌ NEVER: "Bench Press", "Curl", "Row" (too generic)

=== OUTPUT FORMAT ===

Respond ONLY with valid JSON:
{
  "title": "Descriptive Workout Name",
  "type": "Upper Body",
  "difficulty": "intermediate",
  "duration": 45,
  "targetMuscles": "Chest, Triceps, Shoulders",
  "overview": "Personalized note explaining why this workout was designed this way for the user",
  "exercises": [
    {
      "name": "Bodyweight Arm Circles",
      "sets": 2,
      "reps": "30 sec",
      "restTime": 15,
      "category": "warmup",
      "setType": "normal"
    },
    {
      "name": "Barbell Bench Press",
      "sets": 4,
      "reps": "8-10",
      "restTime": 90,
      "category": "main",
      "setType": "normal",
      "suggestedWeight": 60,
      "suggestedReps": 10,
      "aiNote": "Based on your previous 55kg, trying slight increase"
    },
    {
      "name": "Dumbbell Flyes",
      "sets": 3,
      "reps": "12-15",
      "restTime": 60,
      "category": "main",
      "setType": "super",
      "supersetWith": "Push-Ups",
      "suggestedWeight": 12,
      "aiNote": "Superset to maximize chest pump"
    }
  ]
}`;

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const userGoals = userProfile.fitnessGoals?.join(', ') || userProfile.goal || 'general fitness';
  
  // Build context from advanced questionnaire - AI uses ALL of this
  let advancedContext = '';
  let weakAreasContext = '';
  if (userProfile.advancedQuestionnaire) {
    const aq = userProfile.advancedQuestionnaire;
    
    // Handle weak areas specially - they should NOT dominate every session
    if (aq.weakAreas) {
      weakAreasContext = `
=== WEAK AREAS HANDLING (IMPORTANT - READ CAREFULLY) ===
User's weak areas: ${aq.weakAreas}

⚠️ CRITICAL: Weak areas should INCREASE WEEKLY VOLUME, NOT dominate every session!

CORRECT approach for weak areas:
- For a 3-day/week program: At MOST 1 session should have weak area as PRIMARY focus
- Other sessions: Add 1-2 ACCESSORY exercises for weak areas (not main lifts)
- NEVER make weak area the primary focus on consecutive training days
- Balance overall split: chest/back/legs/shoulders/arms must all get adequate work

WRONG approach (DO NOT DO THIS):
❌ Making every workout "Back & Biceps" just because user said back is weak
❌ Ignoring chest/legs/shoulders to focus only on weak areas
❌ Adding 5+ exercises for weak areas in every session

For today (Day ${dayOfWeek + 1}):
- If this is the DESIGNATED weak-area focus day → include 2-3 extra weak area exercises
- If this is NOT the focus day → add at most 1-2 accessory exercises for weak areas
- ALWAYS maintain proper split balance for the PRIMARY focus of today
`;
    }
    
    advancedContext = `
=== USER'S DETAILED PREFERENCES (READ ALL OF THIS) ===
${aq.targets ? `🎯 TARGETS/EVENTS: ${aq.targets}` : ''}
${aq.goalDetails ? `📋 GOAL DETAILS: ${JSON.stringify(aq.goalDetails)}` : ''}
${aq.enjoyedTraining ? `💚 ENJOYS (include MORE): ${aq.enjoyedTraining}` : ''}
${aq.dislikedTraining ? `⚠️ DISLIKES (include less but don't eliminate): ${aq.dislikedTraining}` : ''}
${aq.additionalInfo ? `📝 ADDITIONAL REQUESTS: ${aq.additionalInfo}` : ''}
${weakAreasContext}
`;
    console.log('  📚 Loaded advanced questionnaire for AI context');
  }
  
  const userMessage = `Create a ${userProfile.sessionDuration || 45}-minute workout for ${dayNames[dayOfWeek]} (Day ${dayOfWeek + 1} of 7).

USER PROFILE:
- Goals: ${userGoals}
- Experience: ${userProfile.experience || 'intermediate'}
- Training Type: ${userProfile.trainingType || 'General Fitness'}
- Session Duration: ${userProfile.sessionDuration || 45} min
${userProfile.injuries?.length ? `- Injuries/Limitations: ${userProfile.injuries.join(', ')}` : ''}
${advancedContext}

=== CRITICAL RULES FOR WORKOUT PROGRAMMING ===

1. **READ THE ADDITIONAL REQUESTS ABOVE** - If user asked for a specific focus today (like "back day"), HONOR IT!

2. **SMART MUSCLE GROUP ROTATION** - You are an expert PT. You KNOW:
   - NEVER work the same major muscle group on consecutive days
   - If yesterday was chest, today should NOT be chest
   - Allow 48-72 hours recovery for each muscle group
   - You decide the best split based on user's goals and preferences
   - Could be PPL, Bro split, Upper/Lower, Full Body - YOU choose what's best for THIS user

3. **LONG-TERM PLANNING** - If user mentioned events/shows:
   - Competition in 1-2 years? → Focus on building mass now
   - Wedding in 3 months? → Include more conditioning
   - Plan phases accordingly

4. **PERSONALIZATION** - Use their enjoyed/disliked training to customize

=== CRITICAL: REALISTIC TIME-BASED EXERCISE LIMITS ===

Session duration: ${userProfile.sessionDuration || 45} minutes
Experience level: ${userProfile.experience || 'intermediate'}

TIME BUDGET CALCULATION:
- Warmup: 5-8 minutes (1-2 exercises)
- Main exercises: (session - warmup - cooldown) / avg_time_per_exercise
- Cooldown: 3-5 minutes (1-2 stretches)
- Transition time between exercises: ${userProfile.experience === 'beginner' ? '2 min' : '1 min'} (equipment changes, rest)

REALISTIC EXERCISE COUNTS BY EXPERIENCE + DURATION:

**BEGINNER (needs more rest, simpler movements, fewer equipment changes):**
- 30 min: 3-4 total (1 warmup + 2-3 main + 1 cooldown)
- 45 min: 4-6 total (1-2 warmup + 3-4 main + 1 cooldown)
- 60 min: 5-7 total (2 warmup + 4-5 main + 1-2 cooldown)

**INTERMEDIATE:**
- 30 min: 4-5 total (1 warmup + 3-4 main + 1 cooldown)
- 45 min: 5-7 total (1-2 warmup + 4-5 main + 1-2 cooldown)
- 60 min: 7-9 total (2 warmup + 5-7 main + 2 cooldown)

**ADVANCED (efficient transitions, supersets):**
- 30 min: 5-6 total
- 45 min: 6-8 total
- 60 min: 8-10 total

FOR THIS ${userProfile.sessionDuration || 45}-MIN ${(userProfile.experience || 'intermediate').toUpperCase()} WORKOUT:
Maximum exercises: ${(() => {
  const duration = Number(userProfile.sessionDuration || 45);
  const exp = userProfile.experience || 'intermediate';
  if (exp === 'beginner') {
    return duration <= 30 ? '4' : duration <= 45 ? '6' : '7';
  } else if (exp === 'advanced') {
    return duration <= 30 ? '6' : duration <= 45 ? '8' : '10';
  } else {
    return duration <= 30 ? '5' : duration <= 45 ? '7' : '9';
  }
})()}

BEGINNER CONSTRAINTS (if applicable):
- Use SIMPLE movements they can master
- Minimize equipment changes (stick to 2-3 pieces max)
- Longer rest times (90-120s for compounds)
- NO complex supersets or giant sets
- Focus on QUALITY over quantity

COOLDOWN MUST ONLY BE STRETCHES - no strength exercises!
Examples: Standing Quad Stretch, Child's Pose, Hip Flexor Stretch

${splitConstraints}

${recentExercises.length > 0 ? `
=== VARIETY REQUIREMENT (CRITICAL) ===
DO NOT use these exercises - they were used in recent workouts:
${recentExercises.slice(0, 15).join(', ')}

Pick DIFFERENT exercises to maintain variety!
` : ''}

Create a balanced workout respecting these limits and the DAY FOCUS above.`;

  // Step 3: Call AI
  console.log('  🤖 Calling GPT-4o...');
  console.log('  📝 User profile:', JSON.stringify({
    goals: userProfile.fitnessGoals || userProfile.goal,
    experience: userProfile.experience,
    duration: userProfile.sessionDuration,
    injuries: userProfile.injuries,
  }));
  
  let completion;
  try {
    completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
    });
    console.log('  ✅ OpenAI responded successfully');
  } catch (openaiError: any) {
    console.error('  ❌ OpenAI API error:', openaiError.message);
    throw new Error(`OpenAI API error: ${openaiError.message}`);
  }
  
  const aiResponse = completion.choices[0].message.content || '';
  console.log('  📄 AI response length:', aiResponse.length, 'chars');
  
  if (!aiResponse || aiResponse.length < 50) {
    console.error('  ❌ AI returned empty or very short response');
    throw new Error('AI returned empty response');
  }
  
  // Step 4: Parse JSON
  let workoutPlan: any;
  try {
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('  ❌ No JSON found in AI response. Raw response:', aiResponse.substring(0, 500));
      throw new Error('No JSON in response');
    }
    workoutPlan = JSON.parse(jsonMatch[0]);
    
    // Validate required fields
    if (!workoutPlan.exercises || !Array.isArray(workoutPlan.exercises)) {
      console.error('  ❌ AI response missing exercises array:', JSON.stringify(workoutPlan).substring(0, 500));
      throw new Error('AI response missing exercises');
    }
    
    if (workoutPlan.exercises.length === 0) {
      console.error('  ❌ AI returned empty exercises array');
      throw new Error('AI returned no exercises');
    }
    
    console.log(`  ✅ Parsed AI response: ${workoutPlan.exercises.length} exercises`);
  } catch (error: any) {
    console.error('  ❌ Parse error:', error.message);
    console.error('  Raw AI response (first 800 chars):', aiResponse.substring(0, 800));
    throw new Error(`Invalid AI response: ${error.message}`);
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

// =============================================================================
// VALIDATED WORKOUT GENERATION (with retry and fallback)
// =============================================================================

/**
 * Generate a workout with Zod validation, retry logic, and fallback
 * This is the recommended function to use for production
 */
export async function generateValidatedWorkout(
  userProfile: UserProfile,
  dayOfWeek: number = 0,
  weekNumber: number = 1,
  recentExercises: string[] = [],
  retryCount: number = 0
): Promise<ValidatedWorkout> {
  try {
    if (process.env.NODE_ENV !== 'production' || process.env.DEBUG) {
      console.log(`🔄 [VALIDATION] Generating workout (attempt ${retryCount + 1})`);
    }
    
    const rawWorkout = await generateAIWorkout(userProfile, dayOfWeek, weekNumber, recentExercises);
    
    // Validate with Zod
    const validation = WorkoutSchema.safeParse(rawWorkout);
    
    if (!validation.success) {
      console.error('❌ [VALIDATION] Invalid workout structure:', validation.error.errors);
      
      if (retryCount < 1) {
        if (process.env.NODE_ENV !== 'production' || process.env.DEBUG) {
          console.log('🔄 [VALIDATION] Retrying workout generation...');
        }
        return generateValidatedWorkout(userProfile, dayOfWeek, weekNumber, recentExercises, retryCount + 1);
      }
      
      // Return fallback workout after retry fails
      if (process.env.NODE_ENV !== 'production' || process.env.DEBUG) {
        console.log('⚠️ [VALIDATION] Using fallback workout');
      }
      return getFallbackWorkout(userProfile);
    }
    
    // Ensure all exercises have unique IDs (never empty string)
    const workout = validation.data;
    
    // CRITICAL: Enforce realistic exercise count limits based on experience and duration
    const maxExercises = getMaxExercises(
      Number(userProfile.sessionDuration || 45), 
      userProfile.experience || 'intermediate'
    );
    
    if (workout.exercises.length > maxExercises) {
      console.log(`⚠️ [VALIDATION] Trimming workout from ${workout.exercises.length} to ${maxExercises} exercises for ${userProfile.experience} ${userProfile.sessionDuration}min`);
      
      // Preserve warmup and cooldown, trim main exercises
      const warmupExercises = workout.exercises.filter(ex => ex.category === 'warmup');
      const cooldownExercises = workout.exercises.filter(ex => ex.category === 'cooldown');
      const mainExercises = workout.exercises.filter(ex => ex.category === 'main');
      
      // Calculate how many main exercises we can keep
      const reservedSlots = warmupExercises.length + cooldownExercises.length;
      const maxMainExercises = Math.max(1, maxExercises - reservedSlots);
      
      // Trim main exercises if needed
      const trimmedMainExercises = mainExercises.slice(0, maxMainExercises);
      
      // Rebuild exercises array
      workout.exercises = [
        ...warmupExercises,
        ...trimmedMainExercises,
        ...cooldownExercises
      ];
      
      console.log(`✅ [VALIDATION] Trimmed to ${workout.exercises.length} exercises (${warmupExercises.length} warmup + ${trimmedMainExercises.length} main + ${cooldownExercises.length} cooldown)`);
    }
    
    const usedIds = new Set<string>();
    
    workout.exercises = workout.exercises.map((exercise, index) => {
      let id = exercise.id;
      
      // Generate ID if missing or empty
      if (!id || id.trim() === '') {
        id = generateExerciseId(exercise.name, index);
      }
      
      // Ensure uniqueness - append index if duplicate
      while (usedIds.has(id)) {
        id = `${id}-${index}`;
      }
      usedIds.add(id);
      
      return { ...exercise, id };
    });
    
    if (process.env.NODE_ENV !== 'production' || process.env.DEBUG) {
      console.log('✅ [VALIDATION] Workout validated with unique IDs');
    }
    return workout;
    
  } catch (error) {
    console.error('❌ [VALIDATION] Error generating workout:', error);
    
    if (retryCount < 1) {
      if (process.env.NODE_ENV !== 'production' || process.env.DEBUG) {
        console.log('🔄 [VALIDATION] Retrying after error...');
      }
      return generateValidatedWorkout(userProfile, dayOfWeek, weekNumber, recentExercises, retryCount + 1);
    }
    
    return getFallbackWorkout(userProfile);
  }
}

/**
 * Fallback workout when AI generation fails
 * Respects realistic time budgeting based on experience level
 */
function getFallbackWorkout(userProfile: UserProfile): ValidatedWorkout {
  const duration = Number(userProfile.sessionDuration || 45);
  const isStrength = userProfile.trainingType?.toLowerCase().includes('strength');
  const experience = userProfile.experience || 'intermediate';
  
  // Calculate max exercises based on experience and duration
  const maxExercises = getMaxExercises(duration, experience);
  
  // Base exercises for strength vs general
  const strengthExercises = [
    { name: 'Arm Circles', sets: 2, reps: '30 sec', restTime: 30, category: 'warmup' as const },
    { name: 'Barbell Squat', sets: 4, reps: '8', restTime: 120, category: 'main' as const },
    { name: 'Dumbbell Bench Press', sets: 3, reps: '10', restTime: 90, category: 'main' as const },
    { name: 'Bent Over Row', sets: 3, reps: '10', restTime: 90, category: 'main' as const },
    { name: 'Dumbbell Shoulder Press', sets: 3, reps: '10', restTime: 90, category: 'main' as const },
    { name: 'Standing Quad Stretch', sets: 1, reps: '30 sec', restTime: 30, category: 'cooldown' as const },
  ];
  
  const generalExercises = [
    { name: 'Jumping Jacks', sets: 2, reps: '30', restTime: 30, category: 'warmup' as const },
    { name: 'Bodyweight Squat', sets: 3, reps: '15', restTime: 45, category: 'main' as const },
    { name: 'Push-ups', sets: 3, reps: '10', restTime: 45, category: 'main' as const },
    { name: 'Lunges', sets: 3, reps: '12 each', restTime: 45, category: 'main' as const },
    { name: 'Standing Forward Bend', sets: 1, reps: '60 sec', restTime: 30, category: 'cooldown' as const },
  ];
  
  // Select exercises and trim to max based on experience
  const baseExercises = isStrength ? strengthExercises : generalExercises;
  const fallbackExercises = baseExercises.slice(0, Math.min(maxExercises, baseExercises.length));
  
  return {
    title: isStrength ? 'Fallback Strength Workout' : 'Fallback Full Body Workout',
    type: isStrength ? 'strength' : 'full-body',
    difficulty: experience,
    duration,
    exercises: fallbackExercises.map((ex, i) => ({
      id: `fallback-${i}`,
      ...ex,
    })),
    overview: 'A balanced fallback workout. AI generation encountered an issue.',
    targetMuscles: 'Full Body',
    caloriesBurn: Math.round(duration * 8),
  };
}

// Test function - call directly if needed
// Note: Removed CommonJS require.main check for ESM compatibility
