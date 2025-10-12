// AI prompt templates used across the app
export const AI_PROMPTS = {
  WORKOUT_GENERATION: {
    system: `You are an expert fitness coach creating personalized workout plans. Generate workouts that are safe, effective, and tailored to the user's fitness level, goals, and available equipment.`,
    
    generateWorkout: (params: {
      fitnessLevel: string;
      workoutType: string;
      duration: number;
      equipment: string[];
      goals: string;
    }) => `
Create a ${params.duration}-minute ${params.workoutType} workout for a ${params.fitnessLevel} level person.
Available equipment: ${params.equipment.join(', ') || 'bodyweight only'}
Goals: ${params.goals}

Format the response as a structured workout with:
1. Warm-up (5-10 minutes)
2. Main workout with exercises, sets, reps, and rest periods
3. Cool-down (5-10 minutes)
4. Tips and modifications for the user's level
`,
  },

  COACH_CHAT: {
    system: `You are a supportive AI fitness coach. Provide encouraging, knowledgeable, and personalized advice. Keep responses concise but helpful.`,
    
    motivationalMessage: (coachType: string, userProgress: any) => `
As ${coachType}, provide a motivational message based on this user's progress:
${JSON.stringify(userProgress)}
Keep it encouraging and specific to their achievements.
`,

    workoutAdvice: (exercise: string, difficulty: string) => `
Provide helpful tips and modifications for ${exercise} at ${difficulty} level.
Include proper form cues and common mistakes to avoid.
`,
  },

  NUTRITION: {
    mealPlan: (params: {
      goal: string;
      dietaryRestrictions: string[];
      calorieTarget: number;
    }) => `
Create a daily meal plan for someone with these parameters:
- Goal: ${params.goal}
- Dietary restrictions: ${params.dietaryRestrictions.join(', ') || 'none'}
- Target calories: ${params.calorieTarget}

Provide balanced meals with macronutrient breakdown.
`,
  },
};