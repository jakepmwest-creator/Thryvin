import OpenAI from "openai";
import { User } from "@shared/schema";
import { exerciseLibrary, filterExercises, Exercise } from "./exercise-library";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface WorkoutRequest {
  user: User;
  workoutType: string;
  duration?: number;
  equipment?: string[];
  focus?: string;
  previousWorkouts?: any[];
}

export interface GeneratedExercise {
  name: string;
  sets: number;
  reps: number;
  restTime: number;
  instructions: string;
  modifications?: string;
  targetMuscles: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface GeneratedWorkout {
  title: string;
  description: string;
  estimatedDuration: number;
  difficulty: string;
  exercises: GeneratedExercise[];
  warmup: GeneratedExercise[];
  cooldown: GeneratedExercise[];
  coachNotes: string;
  progressionTips: string;
}

export async function generatePersonalizedWorkout(request: WorkoutRequest, workoutProfile?: any): Promise<GeneratedWorkout> {
  const { user, workoutType, duration, equipment = [], focus } = request;
  
  // Determine workout duration based on workout profile preference first, then user preference, then default
  const workoutDuration = workoutProfile?.sessionDuration || duration || user.sessionDurationPreference || 45;
  
  // Get user's equipment access from workout profile first
  const profileEquipment = workoutProfile?.equipmentAccess || [];
  const userEquipment = getUserEquipment(user, [...equipment, ...profileEquipment]);
  
  // Determine difficulty based on workout profile experience level first
  const experienceLevel = workoutProfile?.experienceLevel || user.fitnessLevel || 'intermediate';
  const userDifficulty = getUserDifficulty(user, experienceLevel);
  
  // Get relevant exercises from library, considering injuries and limitations
  const relevantExercises = getRelevantExercises(workoutType, userEquipment, userDifficulty, workoutProfile?.injuries);
  
  // Analyze user profile for personalization including workout profile
  const userContext = buildUserContext(user, workoutProfile);
  
  // Create AI prompt for workout generation with exercise library and profile considerations
  const prompt = createWorkoutPrompt(userContext, workoutType, workoutDuration, userEquipment, focus, relevantExercises, workoutProfile);
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `🤖 AI PERSONAL TRAINER - You are an elite fitness trainer and exercise physiologist with deep expertise in personalized training. Your mission: Create workout plans that feel like they were designed by someone who truly knows this individual.

🎯 PERSONALIZATION PRIORITIES (IN ORDER):
1. SAFETY FIRST: Always respect injuries/limitations and modify exercises accordingly
2. GOAL ALIGNMENT: Every exercise must contribute to their specific fitness goal
3. FITNESS LEVEL: Match intensity and complexity to their experience level  
4. MOTIVATION: Design workouts that align with their motivational drivers
5. EQUIPMENT: Only use equipment they actually have access to
6. TIME: Respect their available session duration

📋 WORKOUT TYPE REQUIREMENTS - Generate exercises that EXACTLY match:
- HIIT: High-intensity interval training with cardio bursts, work/rest intervals, bodyweight exercises like jumping jacks, mountain climbers, burpees
- Lower Body: Focus ONLY on legs, glutes, calves, hamstrings, quadriceps - squats, lunges, glute bridges, calf raises
- Upper Body: Focus ONLY on chest, back, shoulders, arms, triceps, biceps, core - push-ups, dips, planks, pike push-ups
- Full Body: Balanced mix of upper and lower body exercises in single session
- Cardio: Cardiovascular exercises like running, cycling, jumping, dance, rowing, high knees
- Strength: Focus on strength gains with progressive resistance exercises
- Yoga: Yoga poses, stretches, flows, breathing exercises, flexibility work - downward dog, warrior poses, child's pose
- Calisthenics: Bodyweight-only movements like push-ups, pull-ups, squats, planks

🧠 AI PERSONALIZATION INTELLIGENCE:
- Analyze their complete profile (age, weight, injuries, motivators, preferences)
- Adapt exercise difficulty, volume, and intensity to their exact fitness level
- Include modifications for any injuries or limitations mentioned
- Match coaching style to their preferences (encouraging vs disciplined vs casual)
- Consider their weekly goals and training frequency
- Respect their equipment constraints completely

💡 TRUE AI PT EXPERIENCE: This workout should feel personally crafted for this individual, not generic. Use their name, reference their goals, and show you understand their unique situation.

Return workout data that matches the exact muscle groups and exercise types for the requested category while being perfectly personalized.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const workoutData = JSON.parse(response.choices[0].message.content || "{}");
    
    // Validate and structure the response
    return validateAndStructureWorkout(workoutData, user);
    
  } catch (error) {
    console.error("Primary AI workout generation failed:", error);
    console.log("🔄 Attempting enhanced AI generation with retries...");
    // Enhanced AI generation with intelligent retries instead of static fallback
    try {
      return await generateEnhancedAIWorkout(request);
    } catch (enhancedError) {
      console.error("🚫 All AI generation methods failed:", enhancedError);
      throw enhancedError; // Let the caller handle the final error
    }
  }
}

function buildUserContext(user: User, workoutProfile?: any): string {
  const context = [];
  
  context.push(`🎯 COMPREHENSIVE AI PERSONAL TRAINER PROFILE:`);
  context.push(`- Name: ${user.name}`);
  context.push(`- Fitness Level: ${user.fitnessLevel || workoutProfile?.experienceLevel || 'intermediate'}`);
  context.push(`- Primary Goal: ${user.goal || workoutProfile?.fitnessGoal || 'general_fitness'}`);
  context.push(`- Training Type Preference: ${user.trainingType}`);
  context.push(`- Coaching Style: ${user.coachingStyle}`);
  
  // Physical Profile (Critical for personalization)
  if (user.age) context.push(`- Age: ${user.age} years`);
  if (user.height) context.push(`- Height: ${user.height}`);
  if (user.weight) context.push(`- Weight: ${user.weight}`);
  if (user.gender) context.push(`- Gender: ${user.gender}`);
  
  // Training Goals & Capacity
  context.push(`- Weekly Goal: ${user.weeklyGoalWorkouts} workouts, ${user.weeklyGoalMinutes} minutes`);
  if (user.trainingDaysPerWeek) {
    context.push(`- Training Days Per Week: ${user.trainingDaysPerWeek}`);
  }
  
  // Critical Safety Information 
  if (user.injuries || workoutProfile?.injuries) {
    context.push(`- ⚠️ INJURIES/LIMITATIONS: ${user.injuries || workoutProfile.injuries}`);
    context.push(`- PRIORITY: Modify exercises to avoid aggravating these conditions`);
  }
  
  // Workout Profile Preferences
  if (workoutProfile) {
    context.push(`\nWorkout Preferences:`);
    if (workoutProfile.fitnessGoal) {
      context.push(`- Primary Goal: ${workoutProfile.fitnessGoal}`);
    }
    if (workoutProfile.preferredTimeOfDay) {
      context.push(`- Preferred Time: ${workoutProfile.preferredTimeOfDay}`);
    }
    if (workoutProfile.availableDays && Array.isArray(workoutProfile.availableDays)) {
      context.push(`- Available Days: ${workoutProfile.availableDays.join(', ')}`);
    }
    if (workoutProfile.sessionDuration) {
      context.push(`- Session Duration: ${workoutProfile.sessionDuration} minutes`);
    }
    if (workoutProfile.equipmentAccess && Array.isArray(workoutProfile.equipmentAccess)) {
      context.push(`- Equipment Access: ${workoutProfile.equipmentAccess.join(', ')}`);
    }
    if (workoutProfile.experienceLevel) {
      context.push(`- Experience Level: ${workoutProfile.experienceLevel}`);
    }
    if (workoutProfile.injuries) {
      context.push(`- Physical Limitations: ${workoutProfile.injuries}`);
    }
    if (workoutProfile.additionalNotes) {
      context.push(`- Additional Notes: ${workoutProfile.additionalNotes}`);
    }
  }
  
  // AI Personalization data
  if (user.preferredTrainingTime) {
    context.push(`- Preferred Training Time: ${user.preferredTrainingTime}`);
  }
  
  if (user.cardioPreference) {
    context.push(`- Cardio Preference: ${user.cardioPreference}`);
  }
  
  if (user.focusAreas) {
    try {
      const focusAreas = JSON.parse(user.focusAreas);
      if (focusAreas.length > 0) {
        context.push(`- Focus Areas: ${focusAreas.join(', ')}`);
      }
    } catch (e) {
      // Skip if parsing fails
    }
  }
  
  if (user.avoidanceAreas) {
    try {
      const avoidanceAreas = JSON.parse(user.avoidanceAreas);
      if (avoidanceAreas.length > 0) {
        context.push(`- Areas to Avoid: ${avoidanceAreas.join(', ')}`);
      }
    } catch (e) {
      // Skip if parsing fails
    }
  }
  
  if (user.sessionDurationPreference) {
    context.push(`- Session Duration Preference: ${user.sessionDurationPreference} minutes`);
  }
  
  if (user.trainingDaysPerWeek) {
    context.push(`- Training Days Per Week: ${user.trainingDaysPerWeek}`);
  }
  
  if (user.preferredTrainingDays) {
    try {
      const trainingDays = JSON.parse(user.preferredTrainingDays);
      if (trainingDays.length > 0) {
        context.push(`- Preferred Training Days: ${trainingDays.join(', ')}`);
      }
    } catch (e) {
      // Skip if parsing fails
    }
  }
  
  if (user.workoutVariationPreference) {
    context.push(`- Workout Variation Preference: ${user.workoutVariationPreference}`);
  }
  
  if (user.equipmentAccess) {
    try {
      const equipment = JSON.parse(user.equipmentAccess);
      if (equipment.length > 0) {
        context.push(`- Available Equipment: ${equipment.join(', ')}`);
      } else {
        context.push(`- Available Equipment: Bodyweight only`);
      }
    } catch (e) {
      context.push(`- Available Equipment: Bodyweight only`);
    }
  }

  // 🧠 AI PERSONALIZATION INSIGHTS - Critical for adaptive training
  context.push(`\n💡 AI PERSONALIZATION FACTORS:`);
  
  // Motivational drivers (from onboarding) - Enhanced normalization
  if (user.motivationalPreferences) {
    try {
      const motivators = JSON.parse(user.motivationalPreferences);
      if (motivators && Object.keys(motivators).length > 0) {
        // Normalize motivational preferences to string array for better AI interpretation
        const motivatorStrings = Array.isArray(motivators) ? motivators : Object.keys(motivators).filter(key => motivators[key]);
        if (motivatorStrings.length > 0) {
          context.push(`- Motivational Drivers: ${motivatorStrings.join(', ')}`);
          context.push(`- ADAPT: Use exercise variety and progression tracking to match these drivers`);
        }
      }
    } catch (e) {
      // Skip if parsing fails
    }
  }

  // Rest day activity preferences 
  if (user.restDayActivities) {
    try {
      const restActivities = JSON.parse(user.restDayActivities);
      if (restActivities.length > 0) {
        context.push(`- Rest Day Preferences: ${restActivities.join(', ')}`);
      }
    } catch (e) {
      // Skip if parsing fails
    }
  }

  // Workout variation preference for engagement
  if (user.workoutVariationPreference) {
    const variation = user.workoutVariationPreference;
    context.push(`- Workout Variation: ${variation}`);
    if (variation === 'high') {
      context.push(`- ADAPT: Prioritize exercise variety and creative movements`);
    } else if (variation === 'low') {
      context.push(`- ADAPT: Focus on consistent, mastery-based exercise selection`);
    }
  }

  // Add completion reminder for true AI PT experience
  context.push(`\n🎯 AI PT DIRECTIVE: Create a workout that feels personally designed for ${user.name} based on their unique profile, limitations, and goals. Prioritize safety, progressive overload, and engagement.`);
  
  return context.join('\n');
}

function getUserEquipment(user: User, requestEquipment: string[]): string[] {
  // Start with bodyweight as always available
  let equipment = ['bodyweight'];
  
  // Add user's equipment access if available
  if (user.equipmentAccess) {
    try {
      const userEquipment = JSON.parse(user.equipmentAccess);
      equipment = [...equipment, ...userEquipment];
    } catch (e) {
      // Use default if parsing fails
    }
  }
  
  // Add any equipment specified in request
  if (requestEquipment.length > 0) {
    equipment = [...equipment, ...requestEquipment];
  }
  
  // Remove duplicates
  return Array.from(new Set(equipment));
}

function getUserDifficulty(user: User, experienceLevel?: string): 'beginner' | 'intermediate' | 'advanced' {
  if (experienceLevel) {
    return experienceLevel as 'beginner' | 'intermediate' | 'advanced';
  }
  const fitnessLevel = user.fitnessLevel?.toLowerCase();
  
  if (fitnessLevel === 'beginner' || fitnessLevel === 'new to fitness') {
    return 'beginner';
  } else if (fitnessLevel === 'advanced' || fitnessLevel === 'expert') {
    return 'advanced';
  }
  
  return 'intermediate'; // Default
}

function getRelevantExercises(workoutType: string, equipment: string[], difficulty: 'beginner' | 'intermediate' | 'advanced', injuries?: string): Exercise[] {
  const typeMapping: { [key: string]: string[] } = {
    'HIIT': ['hiit', 'cardio'],
    'Upper Body': ['upper-body', 'strength'],
    'Lower Body': ['lower-body', 'strength'],
    'Full Body': ['strength', 'functional'],
    'Cardio': ['cardio', 'hiit'],
    'Strength': ['strength'],
    'Yoga': ['yoga', 'flexibility'],
    'Calisthenics': ['calisthenics', 'strength']
  };
  
  const styles = typeMapping[workoutType] || ['strength'];
  
  // Get exercises that match the workout style and user's equipment/difficulty
  let exercises: Exercise[] = [];
  
  for (const style of styles) {
    const styleExercises = filterExercises(style, undefined, equipment, undefined);
    exercises = [...exercises, ...styleExercises];
  }
  
  // Filter by difficulty level (include current level and below)
  const allowedDifficulties: ('beginner' | 'intermediate' | 'advanced')[] = 
    difficulty === 'beginner' ? ['beginner'] :
    difficulty === 'intermediate' ? ['beginner', 'intermediate'] :
    ['beginner', 'intermediate', 'advanced'];
  
  exercises = exercises.filter(ex => allowedDifficulties.includes(ex.difficulty));
  
  // Filter out exercises that may aggravate injuries
  if (injuries) {
    const injuryTerms = injuries.toLowerCase();
    exercises = exercises.filter(exercise => {
      const exerciseName = exercise.name.toLowerCase();
      const instructions = exercise.instructions.toLowerCase();
      
      // Basic injury filtering logic
      if (injuryTerms.includes('shoulder')) {
        return !exerciseName.includes('overhead') && 
               !exerciseName.includes('press') && 
               !instructions.includes('arms overhead');
      }
      if (injuryTerms.includes('knee')) {
        return !exerciseName.includes('jump') && 
               !exerciseName.includes('lunge') && 
               !instructions.includes('deep squat');
      }
      if (injuryTerms.includes('back') || injuryTerms.includes('spine')) {
        return !exerciseName.includes('deadlift') && 
               !instructions.includes('bend forward') &&
               !instructions.includes('twist');
      }
      
      return true;
    });
  }

  // Remove duplicates
  const uniqueExercises = exercises.filter((exercise, index, array) => 
    array.findIndex(ex => ex.id === exercise.id) === index
  );
  
  return uniqueExercises;
}

function createWorkoutPrompt(userContext: string, workoutType: string, duration: number, equipment: string[], focus?: string, exercises?: Exercise[], workoutProfile?: any): string {
  let exerciseLibrarySection = '';
  
  if (exercises && exercises.length > 0) {
    exerciseLibrarySection = `
RECOMMENDED EXERCISES FOR THIS WORKOUT TYPE:
${exercises.map(ex => `
- ${ex.name} (${ex.difficulty}): ${ex.instructions}
  Target: ${ex.muscleGroups.join(', ')}
  Equipment: ${ex.equipment.join(', ')}
  ${ex.targetReps ? `Reps: ${ex.targetReps.min}-${ex.targetReps.max}` : ''}
  ${ex.targetSets ? `Sets: ${ex.targetSets.min}-${ex.targetSets.max}` : ''}
  ${ex.duration ? `Duration: ${ex.duration}s` : ''}
`).join('')}

Use these exercises as a foundation but adapt them to match the user's specific profile and needs.
`;
  }

  return `
${userContext}

Generate a personalized ${workoutType} workout with the following specifications:
- Duration: ${duration} minutes
- Available Equipment: ${equipment.length > 0 ? equipment.join(', ') : 'bodyweight only'}
${focus ? `- Specific Focus: ${focus}` : ''}

🚨 CRITICAL AI GUARDRAILS - MANDATORY COMPLIANCE:

📚 HARD CONSTRAINT: Choose ONLY exercises that exist in the library below. Use the EXACT canonical names. If an intended move isn't present, select the closest canonical alternative.

📋 CATEGORY STRUCTURE (ALL workouts must fit these categories):
- Warm-up: Dynamic movements to prepare the body
- Push: Upper body pushing movements (chest, shoulders, triceps)
- Pull: Upper body pulling movements (back, biceps) 
- Legs: Lower body movements (quads, glutes, hamstrings, calves)
- Core: Abdominal and trunk stability exercises
- Conditioning/Recovery: Includes Mobility & Stretching movements

🎯 DIVERSITY RULE: For general-purpose sessions, include 0–2 Recovery/Mobility moves per workout unless the template explicitly calls for recovery focus.

⚖️ SIDE-SPECIFIC RULE: If is_unilateral = true, specify left/right sets or timed holds per side (e.g., "3 sets of 12 reps each side" or "Hold 30 seconds each side").

${exerciseLibrarySection}

Requirements:
1. Tailor exercises to the user's fitness level and goals
2. Consider any injuries or limitations mentioned - AVOID exercises that could aggravate injuries
3. Include appropriate warm-up and cool-down
4. Provide clear exercise instructions and modifications
5. Include rest times and progression tips
6. Add motivational coach notes addressing the user by name in their preferred coaching style
7. For beginners: simpler movements, fewer sets, longer rest periods
8. For advanced: more complex movements, higher volume, shorter rest periods
9. Ensure workout matches the exact muscle groups for the requested type
10. Respect user's equipment limitations and session duration preferences
11. Adapt based on user's specific fitness goals (fat loss vs muscle building vs strength)

Return the workout in this JSON format:
{
  "title": "Workout title",
  "description": "Brief workout description",
  "estimatedDuration": number,
  "difficulty": "beginner|intermediate|advanced",
  "warmup": [
    {
      "name": "Exercise name",
      "sets": 1,
      "reps": 10,
      "restTime": 30,
      "instructions": "Detailed instructions",
      "targetMuscles": ["muscle1", "muscle2"],
      "difficulty": "beginner"
    }
  ],
  "exercises": [
    {
      "name": "Exercise name",
      "sets": 3,
      "reps": 12,
      "restTime": 60,
      "instructions": "Detailed instructions with form cues",
      "modifications": "Easier/harder variations",
      "targetMuscles": ["muscle1", "muscle2"],
      "difficulty": "intermediate"
    }
  ],
  "cooldown": [
    {
      "name": "Stretch name",
      "sets": 1,
      "reps": 1,
      "restTime": 0,
      "instructions": "Hold for 30 seconds",
      "targetMuscles": ["muscle1"],
      "difficulty": "beginner"
    }
  ],
  "coachNotes": "Motivational message in the user's preferred coaching style",
  "progressionTips": "How to progress this workout over time"
}
`;
}

function validateAndStructureWorkout(workoutData: any, user: User): GeneratedWorkout {
  // Ensure all required fields are present and valid
  const workout: GeneratedWorkout = {
    title: workoutData.title || `Personalized ${user.trainingType} Workout`,
    description: workoutData.description || `A workout tailored for ${user.goal}`,
    estimatedDuration: workoutData.estimatedDuration || 45,
    difficulty: workoutData.difficulty || user.fitnessLevel || 'intermediate',
    exercises: validateExercises(workoutData.exercises || []),
    warmup: validateExercises(workoutData.warmup || []),
    cooldown: validateExercises(workoutData.cooldown || []),
    coachNotes: workoutData.coachNotes || getDefaultCoachNotes(user),
    progressionTips: workoutData.progressionTips || "Gradually increase weight, reps, or sets each week."
  };
  
  return workout;
}

function validateExercises(exercises: any[]): GeneratedExercise[] {
  return exercises.map(ex => ({
    name: ex.name || "Exercise",
    sets: Math.max(1, ex.sets || 3),
    reps: Math.max(1, ex.reps || 10),
    restTime: Math.max(0, ex.restTime || 60),
    instructions: ex.instructions || "Perform the exercise with proper form",
    modifications: ex.modifications,
    targetMuscles: Array.isArray(ex.targetMuscles) ? ex.targetMuscles : [],
    difficulty: ex.difficulty || 'intermediate'
  }));
}

function getDefaultCoachNotes(user: User): string {
  const style = user.coachingStyle;
  
  if (style === 'supportive') {
    return "You've got this! Focus on form over speed, and listen to your body. Every rep brings you closer to your goals!";
  } else if (style === 'direct') {
    return "Time to work. Execute each movement with precision. No shortcuts, no excuses. Your future self will thank you.";
  } else if (style === 'analytical') {
    return "This workout targets key movement patterns for your goals. Focus on mind-muscle connection and track your performance metrics.";
  }
  
  return "Stay focused, maintain good form, and push yourself within your limits. Consistency is key to achieving your fitness goals.";
}

async function generateEnhancedAIWorkout(request: WorkoutRequest, maxRetries: number = 4): Promise<GeneratedWorkout> {
  const { user, workoutType, duration, equipment = [] } = request;
  
  console.log(`🤖 Enhanced AI Workout Generation - Starting attempt for ${workoutType} workout`);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Enhanced AI Generation - Attempt ${attempt}/${maxRetries}`);
      
      // Create progressively simpler and more focused prompts for retries
      let prompt = '';
      let model = 'gpt-4o';
      
      if (attempt === 1) {
        // Most detailed prompt with full personalization
        prompt = `Create a highly personalized ${workoutType} workout for ${user.name}:
        
PERSONAL PROFILE:
- Fitness Level: ${user.fitnessLevel || 'intermediate'}
- Goal: ${user.goal || 'general fitness'}
- Available Equipment: ${equipment.join(', ') || 'bodyweight only'}
- Duration: ${duration || 45} minutes
- Age: ${user.age || 'not specified'}
- Experience: ${user.trainingType || 'general training'}

WORKOUT REQUIREMENTS:
- Generate 4-6 exercises specifically for ${workoutType}
- Include proper sets, reps, rest times for ${user.fitnessLevel} level
- Add detailed instructions and modifications
- Include appropriate warmup (2-3 exercises) and cooldown (2-3 exercises)
- Provide coaching notes matching their goals

Return as JSON with: title, description, estimatedDuration, difficulty, exercises, warmup, cooldown, coachNotes, progressionTips`;
        
      } else if (attempt === 2) {
        // Simplified prompt focusing on exercise selection
        model = 'gpt-4o';
        prompt = `Generate a ${workoutType} workout with 4-5 exercises for ${user.fitnessLevel || 'intermediate'} level.
        Equipment: ${equipment.join(', ') || 'bodyweight'}
        Duration: ${duration || 45} minutes
        Include sets, reps, instructions, warmup, cooldown.
        Return as JSON format.`;
        
      } else if (attempt === 3) {
        // Very basic prompt for essential workout structure
        model = 'gpt-4o';
        prompt = `Create a simple ${workoutType} workout with 4 exercises. Include sets, reps, and instructions. JSON format only.`;
        
      } else {
        // Final attempt with most basic request
        model = 'gpt-4o';
        prompt = `${workoutType} workout: 3 exercises with sets and reps. JSON format.`;
      }

      const response = await openai.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content: `You are an expert fitness trainer. Create personalized workouts in valid JSON format. Always include: title, description, estimatedDuration, difficulty, exercises (with name, sets, reps, restTime, instructions, targetMuscles, difficulty), warmup, cooldown, coachNotes, progressionTips.`
          },
          {
            role: "user", 
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: attempt <= 2 ? 0.7 : 0.3 // Lower creativity for later attempts
      });

      const workoutData = JSON.parse(response.choices[0].message.content || "{}");
      
      // Validate that we got a proper workout structure
      if (!workoutData.exercises || !Array.isArray(workoutData.exercises) || workoutData.exercises.length === 0) {
        console.warn(`❌ Enhanced AI attempt ${attempt} returned invalid structure:`, workoutData);
        continue;
      }
      
      // Validate and structure the response
      const validatedWorkout = validateAndStructureWorkout(workoutData, user);
      console.log(`✅ Enhanced AI generation succeeded on attempt ${attempt}`);
      return validatedWorkout;
      
    } catch (error) {
      console.warn(`❌ Enhanced AI attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        console.error('🚫 All enhanced AI generation attempts failed, creating minimal functional workout');
        
        // Only as absolute last resort - minimal functional workout that encourages regeneration
        const equipment_type = equipment.includes('gym') ? 'gym' : 'bodyweight';
        const userDifficulty = getUserDifficulty(user);
        const basic_exercises = workoutType === 'cardio' ? 
          [
            { name: 'Gentle Movement', sets: 3, reps: 30, restTime: 30, instructions: 'Light cardio movement to get started. AI personalization will be restored shortly.', targetMuscles: ['cardiovascular'], difficulty: userDifficulty },
            { name: 'Basic Stepping', sets: 3, reps: 20, restTime: 30, instructions: 'Simple stepping motion. Your personalized workout is being prepared.', targetMuscles: ['legs'], difficulty: userDifficulty }
          ] : 
          [
            { name: 'Movement Preparation', sets: 3, reps: 10, restTime: 60, instructions: 'Basic movement to get started. AI generation will be restored shortly.', targetMuscles: ['full body'], difficulty: userDifficulty },
            { name: 'Gentle Activity', sets: 3, reps: 12, restTime: 60, instructions: 'Light activity while your personalized workout loads.', targetMuscles: ['core'], difficulty: userDifficulty }
          ];
        
        return {
          title: `${workoutType.charAt(0).toUpperCase() + workoutType.slice(1)} Session - Preparing...`,
          description: `Preparing your personalized ${workoutType} workout. AI generation will be restored shortly.`,
          estimatedDuration: duration || 45,
          difficulty: user.fitnessLevel || 'intermediate',
          exercises: basic_exercises,
          warmup: [
            { name: 'Dynamic Warmup', sets: 1, reps: 1, restTime: 0, instructions: 'Gentle movements to prepare. Personalized warmup loading...', targetMuscles: ['full body'], difficulty: 'beginner' as const }
          ],
          cooldown: [
            { name: 'Recovery Sequence', sets: 1, reps: 1, restTime: 0, instructions: 'Basic cool down. Personalized recovery loading...', targetMuscles: ['full body'], difficulty: 'beginner' as const }
          ],
          coachNotes: 'Your AI coach is preparing a personalized experience. Please refresh to try again.',
          progressionTips: 'Enhanced AI personalization will be available shortly. Please try generating again.'
        };
      }
      
      // Brief delay before retry to prevent overwhelming the API
      await new Promise(resolve => setTimeout(resolve, Math.min(1000 * attempt, 3000)));
    }
  }
  
  // This should never be reached due to the error handling above, but TypeScript requires it
  throw new Error('All enhanced AI generation attempts failed');
}

export async function generateWorkoutProgression(
  currentWorkout: GeneratedWorkout,
  userFeedback: { difficulty: number; enjoyment: number; completionRate: number },
  user: User
): Promise<GeneratedWorkout> {
  const progressionPrompt = `
Based on this workout and user feedback, generate a progressive version:

Current Workout: ${currentWorkout.title}
User Feedback:
- Difficulty (1-10): ${userFeedback.difficulty}
- Enjoyment (1-10): ${userFeedback.enjoyment}
- Completion Rate: ${userFeedback.completionRate}%

User Profile: ${buildUserContext(user)}

Create a workout that progresses appropriately based on the feedback. If difficulty was too low, increase intensity. If too high, scale back. Maintain elements the user enjoyed.

Return in the same JSON format as before.
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert fitness trainer creating progressive workout plans based on user feedback and performance."
        },
        {
          role: "user",
          content: progressionPrompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const workoutData = JSON.parse(response.choices[0].message.content || "{}");
    return validateAndStructureWorkout(workoutData, user);
    
  } catch (error) {
    console.error("Workout progression error:", error);
    return currentWorkout; // Return original if generation fails
  }
}

export async function generateWeeklySchedule(user: User): Promise<any> {
  try {
    // Parse user preferences
    let preferredDays: string[] = [];
    let focusAreas: string[] = [];
    let avoidanceAreas: string[] = [];
    
    try {
      if (user.preferredTrainingDays) {
        preferredDays = JSON.parse(user.preferredTrainingDays);
      }
      if (user.focusAreas) {
        focusAreas = JSON.parse(user.focusAreas);
      }
      if (user.avoidanceAreas) {
        avoidanceAreas = JSON.parse(user.avoidanceAreas);
      }
    } catch (e) {
      console.error('Error parsing user preferences:', e);
    }

    const schedulePrompt = `
Generate a weekly workout schedule based on this user profile:

${buildUserContext(user)}

Additional Constraints:
- Training Days: ${user.trainingDaysPerWeek} days per week
- Preferred Days: ${preferredDays.join(', ')}
- Session Duration: ${user.sessionDurationPreference} minutes
- Focus Areas: ${focusAreas.join(', ')}
- Areas to Avoid: ${avoidanceAreas.join(', ')}
- Cardio Preference: ${user.cardioPreference}
- Workout Variation: ${user.workoutVariationPreference}
- AI Onboarding Responses: ${user.onboardingResponses || 'None'}
- Top Fitness Goal: ${user.topFitnessGoal || 'General fitness'}
- Injury History: ${user.injuryHistory || 'None'}
- Motivational Factors: ${user.motivationalFactors || 'General motivation'}

CRITICAL: Create a VARIED and PERSONALIZED schedule that:
1. Uses DIFFERENT workout types each day based on user's SPECIFIC goals and responses
2. Adapts workout intensity and style to user's experience level and preferences
3. Incorporates user's injury limitations (avoid exercises that could aggravate injuries)
4. Reflects user's motivational factors and training preferences
5. Creates progression throughout the week
6. Ensures NO duplicate workout types unless specifically requested
7. Matches user's equipment access and time constraints
8. Uses workout types like: Yoga Flow, HIIT Cardio, Upper Body – Push, Upper Body – Pull, Lower Body Power, Full Body, Active Recovery

Return a JSON object with this structure:
{
  "weekName": "Week of [Date]",
  "description": "Brief description of this week's focus",
  "days": {
    "Monday": {
      "workoutType": "Rest" or workout name,
      "muscleGroups": ["muscle1", "muscle2"],
      "duration": minutes,
      "intensity": "low|medium|high",
      "isRestDay": boolean,
      "description": "Brief workout description"
    },
    // ... repeat for all 7 days
  }
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert fitness trainer creating personalized weekly workout schedules. Consider user preferences, limitations, and goals to create balanced, progressive programs."
        },
        {
          role: "user",
          content: schedulePrompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const scheduleData = JSON.parse(response.choices[0].message.content || "{}");
    return scheduleData;
    
  } catch (error) {
    console.error("Weekly schedule generation error:", error);
    
    // Enhanced fallback schedule based on user data
    const userGoal = user.topFitnessGoal || user.goal || 'general_fitness';
    const sessionDuration = user.sessionDurationPreference || 45;
    
    // Create varied workout types based on user goals
    const workoutTypes = userGoal.toLowerCase().includes('yoga') || userGoal.toLowerCase().includes('flexibility') ?
      ['Yoga Flow', 'Upper Body – Push', 'Active Recovery', 'Lower Body Power', 'Yoga Flow'] :
      userGoal.toLowerCase().includes('cardio') || userGoal.toLowerCase().includes('endurance') ?
      ['HIIT Cardio', 'Upper Body – Push', 'Lower Body Power', 'HIIT Cardio', 'Full Body'] :
      userGoal.toLowerCase().includes('strength') || userGoal.toLowerCase().includes('muscle') ?
      ['Upper Body – Push', 'Lower Body Power', 'Upper Body – Pull', 'Full Body', 'HIIT Cardio'] :
      ['Upper Body – Push', 'HIIT Cardio', 'Lower Body Power', 'Yoga Flow', 'Full Body']; // default mix
    
    return {
      weekName: `Personalized ${userGoal.replace('_', ' ')} Week`,
      description: `Tailored schedule based on your ${userGoal.replace('_', ' ')} goals`,
      days: {
        Monday: { workoutType: workoutTypes[0], muscleGroups: ["chest", "shoulders", "arms"], duration: sessionDuration, intensity: "medium", isRestDay: false, description: `${workoutTypes[0]} focused on your goals` },
        Tuesday: { workoutType: "Active Recovery", muscleGroups: [], duration: 20, intensity: "low", isRestDay: true, description: "Gentle recovery and mobility" },
        Wednesday: { workoutType: workoutTypes[1], muscleGroups: ["legs", "glutes"], duration: sessionDuration, intensity: "high", isRestDay: false, description: `${workoutTypes[1]} session` },
        Thursday: { workoutType: "Rest", muscleGroups: [], duration: 0, intensity: "low", isRestDay: true, description: "Complete rest day" },
        Friday: { workoutType: workoutTypes[2], muscleGroups: ["back", "biceps"], duration: sessionDuration, intensity: "medium", isRestDay: false, description: `${workoutTypes[2]} workout` },
        Saturday: { workoutType: workoutTypes[3], muscleGroups: ["full body"], duration: sessionDuration, intensity: "high", isRestDay: false, description: `${workoutTypes[3]} challenge` },
        Sunday: { workoutType: workoutTypes[4], muscleGroups: ["full body"], duration: sessionDuration - 15, intensity: "medium", isRestDay: false, description: `${workoutTypes[4]} finisher` }
      }
    };
  }
}