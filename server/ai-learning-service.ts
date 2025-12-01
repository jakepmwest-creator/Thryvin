import { db } from './db';
import { aiLearningContext, workoutSets, workoutEvents, metricsDaily, users } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ExercisePerformance {
  exerciseName: string;
  weight?: number;
  reps: number;
  effort: string; // "Easy", "Medium", "Hard", "Too Hard"
  notes?: string;
}

interface WorkoutPerformance {
  userId: number;
  workoutId: string;
  exercises: ExercisePerformance[];
  overallFeedback?: string;
  duration: number;
  completedAt: string;
}

// Analyze workout performance and learn from it
export async function analyzeAndLearn(performance: WorkoutPerformance): Promise<void> {
  try {
    console.log(`🧠 [AI-LEARN] Analyzing workout for user ${performance.userId}`);
    
    // Get user's existing learning context
    const existingContext = await db
      .select()
      .from(aiLearningContext)
      .where(eq(aiLearningContext.userId, performance.userId))
      .orderBy(desc(aiLearningContext.lastUpdated));
    
    // Analyze each exercise's performance
    for (const exercise of performance.exercises) {
      await analyzeExercisePerformance(performance.userId, exercise, existingContext);
    }
    
    // Analyze overall workout difficulty pattern
    await analyzeWorkoutDifficulty(performance);
    
    console.log(`✅ [AI-LEARN] Completed analysis for user ${performance.userId}`);
  } catch (error) {
    console.error('❌ [AI-LEARN] Error analyzing workout:', error);
  }
}

async function analyzeExercisePerformance(
  userId: number, 
  exercise: ExercisePerformance,
  existingContext: any[]
): Promise<void> {
  const { exerciseName, weight, reps, effort, notes } = exercise;
  
  // Check if user found this too hard
  if (effort === 'Too Hard' || effort === 'Hard') {
    const existingInsight = existingContext.find(
      ctx => ctx.category === 'difficulty' && ctx.exerciseName === exerciseName
    );
    
    if (existingInsight) {
      // Update existing insight
      await db
        .update(aiLearningContext)
        .set({
          insight: `User consistently finds ${exerciseName} challenging. Consider reducing weight by 10-15% or reducing reps.`,
          dataPoints: (existingInsight.dataPoints || 1) + 1,
          confidence: existingInsight.dataPoints >= 3 ? 'high' : 'medium',
          lastUpdated: new Date(),
        })
        .where(eq(aiLearningContext.id, existingInsight.id));
    } else {
      // Create new insight
      await db.insert(aiLearningContext).values({
        userId,
        category: 'difficulty',
        exerciseName,
        insight: `User found ${exerciseName} ${effort.toLowerCase()}. May need weight/rep adjustment.`,
        dataPoints: 1,
        confidence: 'low',
      });
    }
  }
  
  // Track strength progress (if weight is provided)
  if (weight) {
    const strengthInsight = existingContext.find(
      ctx => ctx.category === 'strength' && ctx.exerciseName === exerciseName
    );
    
    if (strengthInsight) {
      // Update with new weight data
      await db
        .update(aiLearningContext)
        .set({
          insight: `${exerciseName}: Current working weight is ${weight}lbs for ${reps} reps. Effort level: ${effort}`,
          dataPoints: (strengthInsight.dataPoints || 1) + 1,
          lastUpdated: new Date(),
        })
        .where(eq(aiLearningContext.id, strengthInsight.id));
    } else {
      await db.insert(aiLearningContext).values({
        userId,
        category: 'strength',
        exerciseName,
        insight: `${exerciseName}: Started with ${weight}lbs for ${reps} reps. Baseline established.`,
        dataPoints: 1,
        confidence: 'low',
      });
    }
  }
  
  // Learn from notes
  if (notes && notes.trim()) {
    await db.insert(aiLearningContext).values({
      userId,
      category: 'preference',
      exerciseName,
      insight: `User note about ${exerciseName}: "${notes}"`,
      dataPoints: 1,
      confidence: 'medium',
    });
  }
}

async function analyzeWorkoutDifficulty(performance: WorkoutPerformance): Promise<void> {
  const { userId, exercises } = performance;
  
  // Count difficulty ratings
  const difficultyCount = {
    easy: 0,
    medium: 0,
    hard: 0,
    tooHard: 0,
  };
  
  exercises.forEach(ex => {
    const effort = ex.effort.toLowerCase().replace(' ', '');
    if (effort === 'easy') difficultyCount.easy++;
    else if (effort === 'medium') difficultyCount.medium++;
    else if (effort === 'hard') difficultyCount.hard++;
    else if (effort === 'toohard') difficultyCount.tooHard++;
  });
  
  const total = exercises.length;
  const hardPercentage = ((difficultyCount.hard + difficultyCount.tooHard) / total) * 100;
  const easyPercentage = (difficultyCount.easy / total) * 100;
  
  // Learn overall difficulty preference
  if (hardPercentage > 50) {
    await upsertInsight(userId, 'performance', null, 
      `Workouts are generally too challenging for user. Recommend reducing overall intensity by 10-20%.`,
      'high'
    );
  } else if (easyPercentage > 60) {
    await upsertInsight(userId, 'performance', null,
      `Workouts are too easy for user. Ready for progressive overload - increase weights or reps.`,
      'high'
    );
  }
}

async function upsertInsight(
  userId: number, 
  category: string, 
  exerciseName: string | null,
  insight: string,
  confidence: string
): Promise<void> {
  const existing = await db
    .select()
    .from(aiLearningContext)
    .where(
      and(
        eq(aiLearningContext.userId, userId),
        eq(aiLearningContext.category, category),
        exerciseName 
          ? eq(aiLearningContext.exerciseName, exerciseName)
          : undefined
      )
    )
    .limit(1);
  
  if (existing.length > 0) {
    await db
      .update(aiLearningContext)
      .set({
        insight,
        confidence,
        dataPoints: (existing[0].dataPoints || 1) + 1,
        lastUpdated: new Date(),
      })
      .where(eq(aiLearningContext.id, existing[0].id));
  } else {
    await db.insert(aiLearningContext).values({
      userId,
      category,
      exerciseName,
      insight,
      confidence,
      dataPoints: 1,
    });
  }
}

// Get all learning context for a user to include in AI prompts
export async function getUserLearningContext(userId: number): Promise<string> {
  const context = await db
    .select()
    .from(aiLearningContext)
    .where(eq(aiLearningContext.userId, userId))
    .orderBy(desc(aiLearningContext.lastUpdated))
    .limit(50); // Last 50 insights
  
  if (context.length === 0) {
    return "No previous workout data available yet.";
  }
  
  const insights = context.map(ctx => {
    const confidence = ctx.confidence === 'high' ? '⭐' : ctx.confidence === 'medium' ? '○' : '·';
    return `${confidence} [${ctx.category}${ctx.exerciseName ? `: ${ctx.exerciseName}` : ''}] ${ctx.insight}`;
  }).join('\n');
  
  return `USER'S WORKOUT HISTORY & PREFERENCES:\n${insights}`;
}

// Generate personalized workout modifications based on learning
export async function getPersonalizedAdjustments(
  userId: number, 
  exercises: any[]
): Promise<any[]> {
  const learningContext = await db
    .select()
    .from(aiLearningContext)
    .where(eq(aiLearningContext.userId, userId));
  
  return exercises.map(exercise => {
    const adjustedExercise = { ...exercise };
    
    // Find relevant insights for this exercise
    const difficultyInsight = learningContext.find(
      ctx => ctx.category === 'difficulty' && 
             ctx.exerciseName?.toLowerCase() === exercise.name.toLowerCase() &&
             ctx.confidence !== 'low'
    );
    
    const strengthInsight = learningContext.find(
      ctx => ctx.category === 'strength' && 
             ctx.exerciseName?.toLowerCase() === exercise.name.toLowerCase()
    );
    
    // Adjust based on difficulty feedback
    if (difficultyInsight && difficultyInsight.insight.includes('challenging')) {
      // Reduce weight/reps for exercises they struggle with
      if (adjustedExercise.weight) {
        adjustedExercise.weight = Math.round(adjustedExercise.weight * 0.85); // 15% reduction
      }
      adjustedExercise.aiNote = "Adjusted based on your previous feedback";
    }
    
    // Use known working weight if available
    if (strengthInsight) {
      const weightMatch = strengthInsight.insight.match(/(\d+)lbs/);
      if (weightMatch && !adjustedExercise.weight) {
        adjustedExercise.suggestedWeight = parseInt(weightMatch[1]);
      }
    }
    
    return adjustedExercise;
  });
}
