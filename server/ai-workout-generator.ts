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
  preferredTrainingDays?: number[] | string[]; // 0-6 (Sun-Sat) or ['mon', 'tue', etc.]
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

// Convert day names (mon, tue, etc.) to day indices (0-6)
function convertDayNamesToIndices(days: (string | number)[]): number[] {
  const dayNameToIndex: Record<string, number> = {
    'sun': 0, 'sunday': 0,
    'mon': 1, 'monday': 1,
    'tue': 2, 'tuesday': 2,
    'wed': 3, 'wednesday': 3,
    'thu': 4, 'thursday': 4,
    'fri': 5, 'friday': 5,
    'sat': 6, 'saturday': 6,
  };
  
  return days.map(day => {
    if (typeof day === 'number') return day;
    const normalized = String(day).toLowerCase().trim();
    return dayNameToIndex[normalized] ?? parseInt(day, 10);
  }).filter(d => !isNaN(d) && d >= 0 && d <= 6);
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
  
  // Step 1: Fetch ALL exercises from DB so AI can ONLY use exact names
  const sampleExercises = await db
    .select({
      name: exercises.name,
      category: exercises.category,
      muscleGroups: exercises.muscleGroups,
      difficulty: exercises.difficulty,
    })
    .from(exercises)
    .limit(2000);
  
  console.log(`  Loaded ${sampleExercises.length} exercises from DB for AI constraint`);
  
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
  const requestedFrequency = Number(userProfile.trainingDays || 3);
  const experience = (userProfile.experience || 'intermediate') as 'beginner' | 'intermediate' | 'advanced';
  const sessionDuration = Number(userProfile.sessionDuration || 45);
  const resolvedGymDaysAvailable = (userProfile.advancedQuestionnaire?.gymDaysAvailable?.length > 0)
    ? userProfile.advancedQuestionnaire.gymDaysAvailable
    : (userProfile.preferredTrainingDays && userProfile.preferredTrainingDays.length > 0)
      ? convertDayNamesToIndices(userProfile.preferredTrainingDays)
      : [0, 1, 2, 3, 4, 5, 6];
  const effectiveFrequency = resolvedGymDaysAvailable.length > 0
    ? Math.min(requestedFrequency, resolvedGymDaysAvailable.length)
    : requestedFrequency;
  
  const splitPlannerInput: SplitPlannerInput = {
    frequency: effectiveFrequency,
    experience,
    goals: userProfile.fitnessGoals || [userProfile.goal || 'general'],
    equipment: userProfile.equipment || [],
    injuries: userProfile.injuries?.join(', ') || null,
    sessionDuration,
    weeklyActivities: userProfile.advancedQuestionnaire?.weeklyActivities || [],
    // CRITICAL FIX: Convert day names to indices and default to all days if empty
    // preferredTrainingDays from onboarding could be ['mon', 'tue', 'wed'] or [1, 2, 3]
    gymDaysAvailable: resolvedGymDaysAvailable,
    scheduleFlexibility: userProfile.advancedQuestionnaire?.scheduleFlexibility ?? true,
    preferredSplit: userProfile.advancedQuestionnaire?.preferredSplit,
    preferredSplitOther: userProfile.advancedQuestionnaire?.preferredSplitOther,
    weekNumber, // For weekly variety rotation
  };
  
  console.log(`  🗓️ Gym days available: ${splitPlannerInput.gymDaysAvailable.join(', ')} (${splitPlannerInput.gymDaysAvailable.length} days)`);
  console.log(`  📊 Effective training days: ${splitPlannerInput.frequency} (requested ${requestedFrequency})`);
  
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

=== EXERCISE DATABASE (MANDATORY — USE ONLY THESE EXACT NAMES) ===
You MUST choose exercises ONLY from this list. Do NOT invent or rephrase names.
Copy-paste the name exactly as it appears below. Any exercise not in this list will fail to load a video.

${sampleExercises.map(e => e.name).join('\n')}

=== END OF EXERCISE DATABASE ===

=== PERSONALIZATION RULES (CRITICAL - READ ALL USER DATA ABOVE) ===

1. **USE ALL USER INFO**: Read EVERY section above. Their advanced questionnaire tells you what they LOVE, HATE, and need to focus on.

2. **RESPECT PREFERENCES**: 
   - If they said they enjoy something → Include MORE of it
   - If they said they dislike something → Include LESS (never remove entirely unless injured)
   - If they have weak areas → Add extra focus exercises for those (but do NOT dominate every session)
   - If they prefer bodyweight/calisthenics → Include MORE bodyweight movements

3. **TARGET THEIR EVENTS**: If they have a target event (race, wedding, etc.), design workouts to prepare for it.

4. **LEARN FROM HISTORY**: Use their workout history to:
   - Include exercises they complete consistently
   - Adjust difficulty based on their feedback
   - Do NOT automatically remove exercises just because they were skipped once

5. **COMPOUND FIRST**: Start each workout with 1-2 compound lifts before isolation work
   - Example (Chest day): Bench Press → Incline Press → Flyes

6. **CARDIO WARMUPS (SOMETIMES)**:
   - Warmup can include 5-10 minutes of light cardio (treadmill, rower, bike, stairmaster)
   - Do this occasionally (not every session) and keep it under 10 minutes

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

For INTERMEDIATE/ADVANCED users, include at least ONE non-normal set type per workout.
For BEGINNERS, keep most sets normal and avoid complex supersets.

=== VOLUME vs SETS (GUIDANCE) ===
- Higher volume goals (muscle gain, conditioning): moderate sets (3-4) + higher reps
- Strength goals: lower reps + slightly higher sets (4-5) on compounds
- Keep total set count realistic for the time limit

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

=== EXERCISE NAMING (CRITICAL) ===

You MUST use EXACT exercise names from the EXERCISE DATABASE above.
Do NOT create your own exercise names. Do NOT rephrase, reorder words, or abbreviate.
If the database has "Dumbbell Incline Bench Press", you must write exactly that — NOT "Incline Dumbbell Press".
If you cannot find a suitable exercise in the database, skip it and pick another one that IS in the database.

=== WORKOUT TITLE ===

Title format should be: "[Muscle Groups] • [Goal]" or "[Muscle Groups] Workout".
Examples:
- "Back, Biceps & Rear Delts • Strength" (GOOD - includes goal)
- "Legs & Glutes • Muscle Gain" (GOOD - includes goal)
- "Push Day - Chest & Triceps" (GOOD - clear focus)
- "Upper Body Strength" (GOOD - general category)
- "Core & Abs" (GOOD - simple)
- "Full Body Circuit" (GOOD - describes format)
- "Lower Body Power" (GOOD - clear)
- "Arms & Shoulders" (GOOD - specific)

❌ AVOID cringy/corny names like:
- "Power-Up", "Fat Blaster", "Mega Pump", "Extreme Burn"
- "Shred Session", "Muscle Mayhem", "Beast Mode"
- "Push Power-Up", "Pull Power", "Leg Destroyer"
- Anything with exclamation marks or hype words

❌ AVOID including day names in titles (the app handles day display separately)

⚠️ IMPORTANT: Keep titles simple, descriptive, and professional. The user is an adult who wants clear information, not marketing hype.

=== OUTPUT FORMAT ===

Respond ONLY with valid JSON:
{
  "title": "Back, Biceps & Rear Delts",
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

  // Day names aligned with JavaScript's getDay() where 0=Sunday, 1=Monday, etc.
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
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

4. **PERSONALIZATION** - Use their enjoyed/disliked training to customize (do NOT remove disliked entirely)

5. **COMPOUND-FIRST ORDERING** - Start with 1-2 compound lifts, finish with isolation/accessory work

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
  
  const exercisesByName = new Map(exerciseData.map(e => [e.name.toLowerCase(), e]));
  
  // Step 6: Enrich exercises with videos — EXACT match only
  // The AI prompt forces exact DB names, so fuzzy matching is not needed
  // Better to show no video than the wrong exercise's video
  const enrichedExercises = workoutPlan.exercises.map((ex: any, index: number) => {
    const aiName = ex.name.toLowerCase();
    const dbExercise = exercisesByName.get(aiName);
    
    if (dbExercise) {
      console.log(`  ✓ Exact match: "${ex.name}" → "${dbExercise.name}"`);
    } else {
      console.log(`  ⚠ No exact match for: "${ex.name}" — skipping video`);
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
      setType: ex.setType || 'normal',
      supersetWith: ex.supersetWith,
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
