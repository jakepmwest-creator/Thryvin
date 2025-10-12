import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface Exercise {
  id: string;
  name: string;
  description: string;
  sets: number;
  reps: number;
  weight?: number;
}

interface SwapRequest {
  currentExercise: Exercise;
  reason: string;
  userProfile?: any;
}

export async function generateExerciseAlternative(request: SwapRequest): Promise<Exercise> {
  try {
    const { currentExercise, reason, userProfile } = request;
    
    const prompt = `You are a professional fitness coach. A user wants to swap out an exercise for a different one.

Current Exercise: ${currentExercise.name}
Description: ${currentExercise.description}
Sets: ${currentExercise.sets}
Reps: ${currentExercise.reps}
Weight: ${currentExercise.weight || 'No weight'}

User's reason for wanting to swap: "${reason}"

Please suggest an appropriate alternative exercise that:
1. Targets similar muscle groups
2. Addresses the user's concern/reason for swapping
3. Has similar difficulty level
4. Can be performed with similar equipment requirements

Respond with JSON in this exact format:
{
  "id": "alternative-exercise-id",
  "name": "Alternative Exercise Name",
  "description": "Detailed description of how to perform the exercise",
  "sets": number,
  "reps": number,
  "weight": number or null
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
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    // Ensure the response has required fields
    if (!result.id || !result.name || !result.description) {
      throw new Error('Invalid AI response format');
    }

    return {
      id: result.id,
      name: result.name,
      description: result.description,
      sets: result.sets || currentExercise.sets,
      reps: result.reps || currentExercise.reps,
      weight: result.weight || currentExercise.weight
    };

  } catch (error) {
    console.error('Error generating exercise alternative:', error);
    
    // Fallback response
    return {
      id: `alt-${currentExercise.id}`,
      name: `Modified ${currentExercise.name}`,
      description: `A modified version of ${currentExercise.name} based on your feedback.`,
      sets: currentExercise.sets,
      reps: Math.max(currentExercise.reps - 2, 5),
      weight: currentExercise.weight ? Math.max(currentExercise.weight - 5, 5) : undefined
    };
  }
}