// Comprehensive AI User Context Service
// This service aggregates ALL user data to create a fully personalized AI experience

import { db } from './db';
import { users, aiLearningContext, workoutSets, workoutEvents, userWorkouts, workoutNotes, exercises } from '@shared/schema';
import { eq, desc, and, gte } from 'drizzle-orm';

export interface ComprehensiveUserProfile {
  // Basic info
  userId: number;
  name: string;
  age?: number;
  gender?: string;
  height?: string;
  weight?: string;
  
  // Fitness profile
  fitnessLevel?: string;
  trainingType?: string;
  goal?: string;
  fitnessGoals?: string[];
  coachingStyle?: string;
  
  // Training preferences
  trainingDaysPerWeek?: number;
  preferredTrainingDays?: string[];
  sessionDurationPreference?: number;
  preferredTrainingTime?: string;
  equipmentAccess?: string[];
  injuries?: string[];
  
  // Advanced questionnaire data (from AsyncStorage, passed in)
  advancedQuestionnaire?: {
    targets?: string;  // Events/deadlines they're training for
    goalDetails?: { [goalKey: string]: string };  // Detailed goal descriptions
    enjoyedTraining?: string;  // What they enjoy
    dislikedTraining?: string;  // What they don't enjoy
    weakAreas?: string;  // Areas to focus on
    additionalInfo?: string;  // Any other info
  };
  
  // Training schedule preferences
  trainingSchedule?: 'flexible' | 'specific' | 'depends';
  selectedDays?: string[];
  specificDates?: string[];
  
  // Performance history
  performanceHistory?: {
    exerciseName: string;
    lastWeight: number;
    lastReps: number;
    progression: 'increasing' | 'stable' | 'decreasing';
    personalBest?: { weight: number; reps: number; date: string };
  }[];
  
  // AI learning insights
  learningInsights?: {
    category: string;
    exerciseName?: string;
    insight: string;
    confidence: string;
  }[];
  
  // Workout history summary
  workoutHistory?: {
    totalWorkouts: number;
    avgDuration: number;
    favoriteExercises: string[];
    avoidedExercises: string[];
    lastWorkoutDate?: string;
    currentStreak: number;
  };
  
  // Chat/feedback history
  recentFeedback?: {
    date: string;
    content: string;
    type: string;
  }[];
}

// Get comprehensive user context for AI
export async function getComprehensiveUserContext(
  userId: number,
  advancedQuestionnaire?: ComprehensiveUserProfile['advancedQuestionnaire']
): Promise<ComprehensiveUserProfile> {
  console.log(`🧠 [AI-CONTEXT] Building comprehensive context for user ${userId}`);
  
  // 1. Get base user data
  const [userData] = await db.select().from(users).where(eq(users.id, userId));
  
  if (!userData) {
    throw new Error(`User ${userId} not found`);
  }
  
  // 2. Parse stored JSON fields
  let equipmentAccess: string[] = [];
  let preferredDays: string[] = [];
  let onboardingData: any = {};
  let workoutProfile: any = {};
  
  try {
    if (userData.equipmentAccess) equipmentAccess = JSON.parse(userData.equipmentAccess);
    if (userData.preferredTrainingDays) preferredDays = JSON.parse(userData.preferredTrainingDays);
    if (userData.onboardingResponses) onboardingData = JSON.parse(userData.onboardingResponses);
    if (userData.workoutProfile) workoutProfile = JSON.parse(userData.workoutProfile);
  } catch (e) {
    console.log('  ⚠️ Error parsing user JSON fields');
  }
  
  // 3. Get AI learning insights
  const learningContext = await db
    .select()
    .from(aiLearningContext)
    .where(eq(aiLearningContext.userId, userId))
    .orderBy(desc(aiLearningContext.lastUpdated))
    .limit(100);
  
  // 4. Get workout history summary
  const recentWorkouts = await db
    .select()
    .from(userWorkouts)
    .where(eq(userWorkouts.userId, userId))
    .orderBy(desc(userWorkouts.completedAt))
    .limit(30);
  
  // 5. Get performance data (weights/reps used)
  const performanceData = await getPerformanceHistory(userId);
  
  // 6. Get recent feedback/notes
  const recentFeedback = await getRecentFeedback(userId);
  
  // Build comprehensive profile
  const profile: ComprehensiveUserProfile = {
    userId,
    name: userData.name,
    age: userData.age || undefined,
    gender: userData.gender || undefined,
    height: userData.height || undefined,
    weight: userData.weight || undefined,
    
    fitnessLevel: userData.fitnessLevel || workoutProfile.experience,
    trainingType: userData.trainingType,
    goal: userData.goal,
    fitnessGoals: onboardingData.fitnessGoals || [],
    coachingStyle: userData.coachingStyle,
    
    trainingDaysPerWeek: userData.trainingDaysPerWeek || 3,
    preferredTrainingDays: preferredDays,
    sessionDurationPreference: userData.sessionDurationPreference || 45,
    preferredTrainingTime: userData.preferredTrainingTime || undefined,
    equipmentAccess,
    injuries: userData.injuries ? [userData.injuries] : onboardingData.injuries || [],
    
    advancedQuestionnaire,
    
    trainingSchedule: onboardingData.trainingSchedule || 'flexible',
    selectedDays: onboardingData.selectedDays || [],
    specificDates: onboardingData.specificDates || [],
    
    performanceHistory: performanceData,
    
    learningInsights: learningContext.map(ctx => ({
      category: ctx.category,
      exerciseName: ctx.exerciseName || undefined,
      insight: ctx.insight,
      confidence: ctx.confidence,
    })),
    
    workoutHistory: {
      totalWorkouts: recentWorkouts.length,
      avgDuration: recentWorkouts.length > 0 
        ? Math.round(recentWorkouts.reduce((sum, w) => sum + w.duration, 0) / recentWorkouts.length)
        : 45,
      favoriteExercises: extractFavoriteExercises(learningContext),
      avoidedExercises: extractAvoidedExercises(learningContext),
      lastWorkoutDate: recentWorkouts[0]?.completedAt?.toISOString(),
      currentStreak: calculateStreak(recentWorkouts),
    },
    
    recentFeedback,
  };
  
  console.log(`✅ [AI-CONTEXT] Built comprehensive context with ${learningContext.length} insights`);
  
  return profile;
}

// Get performance history for weight suggestions - FIXED to return real data
async function getPerformanceHistory(userId: number): Promise<ComprehensiveUserProfile['performanceHistory']> {
  // Get recent workout sets with actual weights/reps, joined with exercises for names
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  
  try {
    const recentSets = await db
      .select({
        exerciseId: workoutSets.exerciseId,
        exerciseName: exercises.name,
        actualWeight: workoutSets.actualWeight,
        actualReps: workoutSets.actualReps,
        completedAt: workoutSets.completedAt,
      })
      .from(workoutSets)
      .innerJoin(userWorkouts, eq(workoutSets.userWorkoutId, userWorkouts.id))
      .innerJoin(exercises, eq(workoutSets.exerciseId, exercises.id))
      .where(and(
        eq(userWorkouts.userId, userId),
        gte(workoutSets.completedAt, fourteenDaysAgo)
      ))
      .orderBy(desc(workoutSets.completedAt))
      .limit(500);
    
    if (process.env.NODE_ENV !== 'production' || process.env.DEBUG) {
      console.log(`📊 [PERFORMANCE] Found ${recentSets.length} sets for user ${userId} in last 14 days`);
    }
    
    // Group by exercise name and calculate progression
    const exerciseMap = new Map<string, { weights: number[]; reps: number[]; dates: Date[] }>();
    
    recentSets.forEach(set => {
      if (set.actualWeight && set.actualReps && set.exerciseName) {
        const name = set.exerciseName;
        if (!exerciseMap.has(name)) {
          exerciseMap.set(name, { weights: [], reps: [], dates: [] });
        }
        const data = exerciseMap.get(name)!;
        data.weights.push(set.actualWeight);
        data.reps.push(set.actualReps);
        if (set.completedAt) data.dates.push(set.completedAt);
      }
    });
    
    // Calculate progression for each exercise
    const performanceHistory: ComprehensiveUserProfile['performanceHistory'] = [];
    
    exerciseMap.forEach((data, exerciseName) => {
      if (data.weights.length === 0) return;
      
      // Sort by date (oldest first for progression calculation)
      const sortedIndices = data.dates
        .map((_, i) => i)
        .sort((a, b) => data.dates[a].getTime() - data.dates[b].getTime());
      
      const sortedWeights = sortedIndices.map(i => data.weights[i]);
      const sortedReps = sortedIndices.map(i => data.reps[i]);
      
      // Calculate progression trend
      let progression: 'increasing' | 'stable' | 'decreasing' = 'stable';
      if (sortedWeights.length >= 2) {
        const firstHalfAvg = sortedWeights.slice(0, Math.floor(sortedWeights.length / 2))
          .reduce((a, b) => a + b, 0) / Math.floor(sortedWeights.length / 2);
        const secondHalfAvg = sortedWeights.slice(Math.floor(sortedWeights.length / 2))
          .reduce((a, b) => a + b, 0) / Math.ceil(sortedWeights.length / 2);
        
        if (secondHalfAvg > firstHalfAvg * 1.05) progression = 'increasing';
        else if (secondHalfAvg < firstHalfAvg * 0.95) progression = 'decreasing';
      }
      
      // Get personal best
      const maxWeight = Math.max(...data.weights);
      const maxWeightIdx = data.weights.indexOf(maxWeight);
      
      performanceHistory.push({
        exerciseName,
        lastWeight: data.weights[0], // Most recent (already sorted desc from query)
        lastReps: data.reps[0],
        progression,
        personalBest: {
          weight: maxWeight,
          reps: data.reps[maxWeightIdx],
          date: data.dates[maxWeightIdx]?.toISOString().split('T')[0] || 'unknown',
        },
      });
    });
    
    console.log(`📊 [PERFORMANCE] Processed ${performanceHistory.length} exercises with history`);
    return performanceHistory;
    
  } catch (error) {
    console.error('❌ [PERFORMANCE] Error fetching performance history:', error);
    return [];
  }
}

// Get recent feedback from workout notes
async function getRecentFeedback(userId: number): Promise<ComprehensiveUserProfile['recentFeedback']> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const notes = await db
    .select({
      content: workoutNotes.content,
      type: workoutNotes.type,
      createdAt: workoutNotes.createdAt,
    })
    .from(workoutNotes)
    .innerJoin(userWorkouts, eq(workoutNotes.userWorkoutId, userWorkouts.id))
    .where(and(
      eq(userWorkouts.userId, userId),
      gte(workoutNotes.createdAt, sevenDaysAgo)
    ))
    .orderBy(desc(workoutNotes.createdAt))
    .limit(20);
  
  return notes.map(n => ({
    date: n.createdAt.toISOString(),
    content: n.content,
    type: n.type,
  }));
}

// Extract favorite exercises from learning context
function extractFavoriteExercises(context: any[]): string[] {
  return context
    .filter(ctx => 
      ctx.category === 'preference' && 
      ctx.insight?.toLowerCase().includes('enjoy') ||
      ctx.insight?.toLowerCase().includes('like') ||
      ctx.insight?.toLowerCase().includes('love')
    )
    .map(ctx => ctx.exerciseName)
    .filter(Boolean)
    .slice(0, 10);
}

// Extract avoided exercises from learning context
function extractAvoidedExercises(context: any[]): string[] {
  return context
    .filter(ctx => 
      ctx.category === 'preference' && 
      (ctx.insight?.toLowerCase().includes('avoid') ||
       ctx.insight?.toLowerCase().includes('dislike') ||
       ctx.insight?.toLowerCase().includes('hate') ||
       ctx.insight?.toLowerCase().includes('skip'))
    )
    .map(ctx => ctx.exerciseName)
    .filter(Boolean)
    .slice(0, 10);
}

// Calculate workout streak
function calculateStreak(workouts: any[]): number {
  if (workouts.length === 0) return 0;
  
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < 30; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    const dateStr = checkDate.toISOString().split('T')[0];
    
    const hasWorkout = workouts.some(w => {
      const workoutDate = new Date(w.completedAt);
      return workoutDate.toISOString().split('T')[0] === dateStr;
    });
    
    if (hasWorkout) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  
  return streak;
}

// Format comprehensive profile for AI prompt
export function formatUserContextForAI(profile: ComprehensiveUserProfile): string {
  const sections: string[] = [];
  
  // Basic profile
  sections.push(`=== USER PROFILE ===
Name: ${profile.name}
${profile.age ? `Age: ${profile.age}` : ''}
${profile.gender ? `Gender: ${profile.gender}` : ''}
${profile.height ? `Height: ${profile.height}` : ''}
${profile.weight ? `Weight: ${profile.weight}` : ''}
Fitness Level: ${profile.fitnessLevel || 'Intermediate'}
Training Style: ${profile.trainingType || 'General'}
Primary Goal: ${profile.goal || 'General fitness'}
${profile.fitnessGoals?.length ? `All Goals: ${profile.fitnessGoals.join(', ')}` : ''}`);
  
  // Advanced questionnaire (detailed goals)
  if (profile.advancedQuestionnaire) {
    const aq = profile.advancedQuestionnaire;
    let advSection = '\n=== ADVANCED PREFERENCES (User shared these to help you personalize) ===';
    
    if (aq.targets) {
      advSection += `\n🎯 Training Targets/Events: ${aq.targets}`;
    }
    
    if (aq.goalDetails && Object.keys(aq.goalDetails).length > 0) {
      advSection += '\n📝 Detailed Goals:';
      Object.entries(aq.goalDetails).forEach(([goal, detail]) => {
        if (detail) advSection += `\n  - ${goal}: ${detail}`;
      });
    }
    
    if (aq.enjoyedTraining) {
      advSection += `\n💚 Training They ENJOY (include MORE of these): ${aq.enjoyedTraining}`;
    }
    
    if (aq.dislikedTraining) {
      advSection += `\n⚠️ Training They DISLIKE (include less, but don't eliminate): ${aq.dislikedTraining}`;
    }
    
    if (aq.weakAreas) {
      advSection += `\n💪 Weak Areas to Focus On: ${aq.weakAreas}`;
    }
    
    if (aq.additionalInfo) {
      advSection += `\nℹ️ Additional Info: ${aq.additionalInfo}`;
    }
    
    sections.push(advSection);
  }
  
  // Training schedule
  sections.push(`\n=== TRAINING SCHEDULE ===
Days per week: ${profile.trainingDaysPerWeek || 3}
Session duration: ${profile.sessionDurationPreference || 45} minutes
${profile.preferredTrainingTime ? `Preferred time: ${profile.preferredTrainingTime}` : ''}
${profile.equipmentAccess?.length ? `Equipment available: ${profile.equipmentAccess.join(', ')}` : ''}
${profile.injuries?.length ? `⚠️ Injuries/Limitations: ${profile.injuries.join(', ')}` : ''}`);
  
  // Performance history & insights
  if (profile.learningInsights && profile.learningInsights.length > 0) {
    let insightsSection = '\n=== LEARNED FROM PREVIOUS WORKOUTS ===';
    
    // Group by category
    const strengthInsights = profile.learningInsights.filter(i => i.category === 'strength');
    const difficultyInsights = profile.learningInsights.filter(i => i.category === 'difficulty');
    const preferenceInsights = profile.learningInsights.filter(i => i.category === 'preference');
    
    if (strengthInsights.length > 0) {
      insightsSection += '\n\n📊 Known Weights/Capabilities:';
      strengthInsights.slice(0, 10).forEach(i => {
        insightsSection += `\n  ${i.insight}`;
      });
    }
    
    if (difficultyInsights.length > 0) {
      insightsSection += '\n\n📈 Difficulty Feedback:';
      difficultyInsights.slice(0, 5).forEach(i => {
        insightsSection += `\n  ${i.insight}`;
      });
    }
    
    if (preferenceInsights.length > 0) {
      insightsSection += '\n\n🎯 User Preferences:';
      preferenceInsights.slice(0, 5).forEach(i => {
        insightsSection += `\n  ${i.insight}`;
      });
    }
    
    sections.push(insightsSection);
  }
  
  // Workout history summary
  if (profile.workoutHistory) {
    sections.push(`\n=== WORKOUT HISTORY ===
Total workouts completed: ${profile.workoutHistory.totalWorkouts}
Average duration: ${profile.workoutHistory.avgDuration} min
Current streak: ${profile.workoutHistory.currentStreak} days
${profile.workoutHistory.favoriteExercises.length ? `Favorite exercises: ${profile.workoutHistory.favoriteExercises.join(', ')}` : ''}
${profile.workoutHistory.avoidedExercises.length ? `Tends to skip: ${profile.workoutHistory.avoidedExercises.join(', ')}` : ''}`);
  }
  
  // Recent feedback
  if (profile.recentFeedback && profile.recentFeedback.length > 0) {
    let feedbackSection = '\n=== RECENT FEEDBACK ===';
    profile.recentFeedback.slice(0, 5).forEach(f => {
      feedbackSection += `\n"${f.content}" (${f.type})`;
    });
    sections.push(feedbackSection);
  }
  
  return sections.join('\n');
}

// Save chat message for learning
export async function saveChatForLearning(
  userId: number,
  userMessage: string,
  coachResponse: string
): Promise<void> {
  try {
    // Analyze user message for preferences/feedback
    const messageLower = userMessage.toLowerCase();
    
    // Detect exercise preferences
    if (messageLower.includes('love') || messageLower.includes('enjoy') || messageLower.includes('like')) {
      await db.insert(aiLearningContext).values({
        userId,
        category: 'preference',
        insight: `User expressed positive sentiment: "${userMessage}"`,
        confidence: 'medium',
        dataPoints: 1,
      });
    }
    
    if (messageLower.includes('hate') || messageLower.includes('dislike') || messageLower.includes("don't like")) {
      await db.insert(aiLearningContext).values({
        userId,
        category: 'preference',
        insight: `User expressed negative sentiment: "${userMessage}"`,
        confidence: 'medium',
        dataPoints: 1,
      });
    }
    
    // Detect difficulty feedback
    if (messageLower.includes('too hard') || messageLower.includes('too difficult') || messageLower.includes('struggling')) {
      await db.insert(aiLearningContext).values({
        userId,
        category: 'difficulty',
        insight: `User finding workouts too challenging: "${userMessage}"`,
        confidence: 'high',
        dataPoints: 1,
      });
    }
    
    if (messageLower.includes('too easy') || messageLower.includes('not challenging') || messageLower.includes('need harder')) {
      await db.insert(aiLearningContext).values({
        userId,
        category: 'difficulty',
        insight: `User ready for more challenge: "${userMessage}"`,
        confidence: 'high',
        dataPoints: 1,
      });
    }
    
    console.log(`💬 [AI-LEARN] Analyzed chat message for user ${userId}`);
  } catch (error) {
    console.error('Error saving chat for learning:', error);
  }
}

// Get suggested weight for an exercise based on user history
export async function getSuggestedWeight(
  userId: number,
  exerciseName: string
): Promise<{ weight: number; reps: number; confidence: string } | null> {
  // Look for strength insights for this exercise
  const insights = await db
    .select()
    .from(aiLearningContext)
    .where(and(
      eq(aiLearningContext.userId, userId),
      eq(aiLearningContext.category, 'strength')
    ))
    .orderBy(desc(aiLearningContext.lastUpdated));
  
  // Find matching exercise (fuzzy match)
  const exerciseNameLower = exerciseName.toLowerCase();
  const matchingInsight = insights.find(i => 
    i.exerciseName?.toLowerCase().includes(exerciseNameLower) ||
    exerciseNameLower.includes(i.exerciseName?.toLowerCase() || '')
  );
  
  if (matchingInsight) {
    // Parse weight and reps from insight
    const weightMatch = matchingInsight.insight.match(/(\d+)\s*(lbs?|kg)/i);
    const repsMatch = matchingInsight.insight.match(/for\s*(\d+)/);
    
    if (weightMatch) {
      return {
        weight: parseInt(weightMatch[1]),
        reps: repsMatch ? parseInt(repsMatch[1]) : 10,
        confidence: matchingInsight.confidence,
      };
    }
  }
  
  return null;
}


/**
 * Build AI Context - UNIFIED CONTEXT BUILDER
 * Single source of truth for all AI context needs
 * 
 * @param userId - User ID to build context for
 * @param options - Optional configuration
 * @returns Context object with profile, formatted string, and JSON
 */
export async function buildAiContext(
  userId: number,
  options?: {
    includeWorkoutHistory?: boolean;
    includeLearning?: boolean;
  }
): Promise<{
  profile: ComprehensiveUserProfile;
  formatted: string;
  json: object;
}> {
  const profile = await getComprehensiveUserContext(userId);
  const formatted = formatUserContextForAI(profile);
  
  return {
    profile,
    formatted,
    json: {
      onboarding: {
        fitnessLevel: profile.fitnessLevel,
        goal: profile.goal,
        fitnessGoals: profile.fitnessGoals,
        trainingType: profile.trainingType,
        sessionDuration: profile.sessionDurationPreference,
        trainingDays: profile.trainingDaysPerWeek,
      },
      advancedQuestionnaire: profile.advancedQuestionnaire,
      schedule: {
        type: profile.trainingSchedule,
        selectedDays: profile.selectedDays,
        specificDates: profile.specificDates,
      },
      preferences: {
        liked: profile.workoutHistory?.favoriteExercises || [],
        disliked: profile.workoutHistory?.avoidedExercises || [],
        coachingStyle: profile.coachingStyle,
      },
      equipment: profile.equipmentAccess,
      injuries: profile.injuries,
      workoutHistory: profile.workoutHistory,
      learningInsights: profile.learningInsights?.slice(0, 20),
    },
  };
}
