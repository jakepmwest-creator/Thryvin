# Thryvin AI Cleanup Implementation Plan

## Phase 1: Unified AI Context Builder (PRIORITY)

### Step 1.1: Fix getPerformanceHistory() 

**File**: `server/ai-user-context.ts`
**Problem**: Returns empty array `[]`
**Fix**: Join with exercises table to get names

```typescript
// Current (broken):
return [];

// Fixed:
const exerciseNames = await db.select().from(exercises);
const nameMap = new Map(exerciseNames.map(e => [e.id, e.name]));

return Array.from(exerciseMap.entries()).map(([exerciseId, data]) => ({
  exerciseName: nameMap.get(exerciseId) || `Exercise ${exerciseId}`,
  lastWeight: data.weights[0],
  lastReps: data.reps[0],
  progression: calculateProgression(data.weights),
  personalBest: { weight: Math.max(...data.weights), reps: Math.max(...data.reps) }
}));
```

### Step 1.2: Create buildAiContext() wrapper

**New function in** `server/ai-user-context.ts`:

```typescript
export async function buildAiContext(
  userId: number, 
  options?: {
    includeWorkoutHistory?: boolean;  // default: true
    includeLearning?: boolean;         // default: true
    date?: Date;                       // for day-specific context
  }
): Promise<{
  profile: ComprehensiveUserProfile;
  formatted: string;  // For direct prompt injection
  json: object;       // For structured use
}> {
  const profile = await getComprehensiveUserContext(userId);
  const formatted = formatUserContextForAI(profile);
  
  return {
    profile,
    formatted,
    json: {
      onboarding: { /* structured */ },
      advancedQuestionnaire: profile.advancedQuestionnaire,
      schedule: { /* current week/day */ },
      workoutLogs: { /* last 14 days */ },
      preferences: { liked: [], disliked: [] },
      injuries: profile.injuries,
      coachingStyle: profile.coachingStyle
    }
  };
}
```

### Step 1.3: Update all endpoints to use buildAiContext()

| Endpoint | Current | Action |
|----------|---------|--------|
| /api/workouts/generate | Uses getComprehensiveUserContext | ✅ OK |
| /api/coach/chat | Uses getComprehensiveUserContext | ✅ OK |
| /api/chat | Basic context only | ⚠️ UPDATE |
| /api/ai/chat | Basic context only | ⚠️ UPDATE |
| /api/workouts/swap-exercise | userProfile unused | ⚠️ UPDATE |
| /api/ai/coach-tip | Basic userProfile | ⚠️ UPDATE |
| /api/ai/edit-schedule | No user context | ⚠️ UPDATE |

---

## Phase 2: Consolidate Coach Chat (CRITICAL)

### Step 2.1: Remove frontend direct OpenAI call

**File**: `apps/native/src/components/FloatingCoachButton.tsx`
**Action**: Replace direct OpenAI call with backend API call

```typescript
// REMOVE this (lines 140-181):
const callOpenAI = async (userMessage: string) => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', ...);
}

// REPLACE with:
const callCoachAPI = async (userMessage: string) => {
  const response = await fetch(`${API_BASE_URL}/api/coach/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: userMessage,
      coach: selectedCoach,
      userId: user?.id,
      conversationHistory: messages.map(m => ({ 
        role: m.role, 
        content: m.text 
      }))
    })
  });
  return (await response.json()).response;
};
```

### Step 2.2: Consolidate to single coach endpoint

**Keep**: `POST /api/coach/chat` (uses getComprehensiveUserContext)
**Deprecate**: 
- `POST /api/chat` 
- `POST /api/ai/chat`

### Step 2.3: Add conversation history to getCoachResponse()

**File**: `server/routes.ts` line 7007
**Add**: conversationHistory parameter

---

## Phase 3: Workout Validation (Schema + Retry)

### Step 3.1: Add Zod schema

**File**: `server/ai-workout-generator.ts`

```typescript
import { z } from 'zod';

const ExerciseSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  sets: z.number().min(1).max(10),
  reps: z.string(),
  restTime: z.number().min(15).max(300),
  category: z.enum(['warmup', 'main', 'cooldown']),
  videoUrl: z.string().optional(),
  suggestedWeight: z.number().optional(),
  aiNote: z.string().optional(),
});

const WorkoutSchema = z.object({
  title: z.string().min(1),
  type: z.string(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  duration: z.number().min(15).max(120),
  exercises: z.array(ExerciseSchema).min(3).max(20),
  overview: z.string(),
  targetMuscles: z.string(),
  caloriesBurn: z.number().min(50).max(1500),
});
```

### Step 3.2: Add validation + retry logic

```typescript
async function generateAndValidateWorkout(
  userProfile: UserProfile,
  dayOfWeek: number,
  weekNumber: number,
  recentExercises: string[],
  retryCount: number = 0
): Promise<GeneratedWorkout> {
  const rawWorkout = await generateAIWorkout(userProfile, dayOfWeek, weekNumber, recentExercises);
  
  const validation = WorkoutSchema.safeParse(rawWorkout);
  
  if (!validation.success) {
    console.error('❌ Invalid workout structure:', validation.error);
    
    if (retryCount < 1) {
      console.log('🔄 Retrying workout generation...');
      return generateAndValidateWorkout(userProfile, dayOfWeek, weekNumber, recentExercises, retryCount + 1);
    }
    
    // Return fallback workout
    return getFallbackWorkout(userProfile);
  }
  
  return validation.data;
}
```

### Step 3.3: Create fallback workout function

```typescript
function getFallbackWorkout(userProfile: UserProfile): GeneratedWorkout {
  const duration = Number(userProfile.sessionDuration || 45);
  const isStrength = userProfile.trainingType?.toLowerCase().includes('strength');
  
  return {
    title: isStrength ? 'Full Body Strength' : 'General Fitness',
    type: isStrength ? 'strength' : 'mixed',
    difficulty: userProfile.experience || 'intermediate',
    duration,
    exercises: getDefaultExercises(userProfile),
    overview: 'A balanced workout designed for your fitness level.',
    targetMuscles: 'Full Body',
    caloriesBurn: Math.round(duration * 8),
  };
}
```

---

## Phase 4: Make Learning Real

### Step 4.1: Create ai_user_profile aggregate table

**New schema addition**:

```typescript
export const aiUserProfile = pgTable('ai_user_profile', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().unique(),
  
  // Performance signals
  avgWorkoutCompletion: numeric('avg_workout_completion'), // 0-100%
  preferredIntensity: text('preferred_intensity'), // 'low', 'medium', 'high'
  strengthTrend: text('strength_trend'), // 'increasing', 'stable', 'decreasing'
  
  // Adherence signals  
  weeklyAdherence: numeric('weekly_adherence'), // % of scheduled workouts completed
  avgSessionsPerWeek: numeric('avg_sessions_per_week'),
  commonSkipDays: text('common_skip_days'), // JSON array of day names
  
  // Preference signals
  favoriteExercises: text('favorite_exercises'), // JSON array
  avoidedExercises: text('avoided_exercises'), // JSON array
  preferredWorkoutTypes: text('preferred_workout_types'), // JSON array
  
  // Computed recommendations
  recommendedWeightIncrease: numeric('recommended_weight_increase'), // % to increase
  recommendedRestDays: integer('recommended_rest_days'),
  
  lastUpdated: timestamp('last_updated').defaultNow(),
  updatedFromWorkout: integer('updated_from_workout'), // last workout ID that triggered update
});
```

### Step 4.2: Update profile after each workout

**Add to** `server/ai-learning-service.ts`:

```typescript
export async function updateAiUserProfile(userId: number): Promise<void> {
  // Get last 30 days of workout data
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  // Calculate signals
  const completedWorkouts = await db.select().from(userWorkouts)
    .where(and(eq(userWorkouts.userId, userId), gte(userWorkouts.completedAt, thirtyDaysAgo)));
  
  const scheduledWorkouts = await getScheduledWorkouts(userId, thirtyDaysAgo);
  
  const adherence = scheduledWorkouts > 0 
    ? (completedWorkouts.length / scheduledWorkouts) * 100 
    : 0;
  
  // Upsert profile
  await db.insert(aiUserProfile)
    .values({
      userId,
      avgWorkoutCompletion: calculateAvgCompletion(completedWorkouts),
      weeklyAdherence: adherence,
      avgSessionsPerWeek: completedWorkouts.length / 4.3, // ~30 days
      lastUpdated: new Date(),
    })
    .onConflictDoUpdate({
      target: aiUserProfile.userId,
      set: { /* same fields */ }
    });
}
```

### Step 4.3: Track skipped exercises

**Add to workout completion flow**:

```typescript
// When workout is marked complete, compare planned vs actual
const plannedExercises = workout.exercises.map(e => e.name);
const completedExercises = workout.exercises
  .filter(e => e.completedSets?.length > 0)
  .map(e => e.name);
  
const skippedExercises = plannedExercises.filter(e => !completedExercises.includes(e));

if (skippedExercises.length > 0) {
  await db.insert(aiLearningContext).values({
    userId,
    category: 'skip',
    insight: `User skipped: ${skippedExercises.join(', ')}`,
    dataPoints: 1,
    confidence: 'medium',
  });
}
```

---

## Phase 5: Remove Duplicate Endpoints

### Endpoints to consolidate:

| Keep | Remove | Reason |
|------|--------|--------|
| `/api/workouts/generate` | `/api/ai/workout/generate` | Duplicate |
| `/api/workouts/generate` | `/api/ai/generate-workout` | Duplicate |
| `/api/coach/chat` | `/api/chat` | Less context |
| `/api/coach/chat` | `/api/ai/chat` | Less context |

---

## Implementation Order

1. **Day 1**: Fix getPerformanceHistory() - immediate impact on weight suggestions
2. **Day 1**: Remove frontend direct OpenAI call - critical consistency fix
3. **Day 2**: Add Zod validation + retry - prevents invalid workouts
4. **Day 3**: Update swap, tips, schedule endpoints to use buildAiContext()
5. **Day 4**: Create ai_user_profile table and update logic
6. **Day 5**: Remove duplicate endpoints, update frontend to use consolidated endpoints
7. **Day 6**: Test all 5 scenarios (see below)

---

## Test Scenarios

After implementation, test these 5 user profiles:

### 1. Beginner Fat Loss
- Experience: beginner
- Goal: weight loss
- Duration: 30 min
- Equipment: bodyweight only
- Expected: Low intensity, cardio-focused, 6-8 exercises

### 2. Intermediate Hypertrophy
- Experience: intermediate  
- Goal: muscle gain
- Duration: 60 min
- Equipment: full gym
- Expected: Split focus, progressive weights, 10-12 exercises

### 3. 10K Prep Runner
- Experience: intermediate
- Goal: endurance
- Duration: 45 min
- Advanced: "Training for 10K in 8 weeks"
- Expected: Running-focused, lower body strength, mobility

### 4. Injury Rehab
- Experience: intermediate
- Goal: general fitness
- Injuries: "lower back pain"
- Expected: NO deadlifts, squats modified, core focus

### 5. Inconsistent Schedule ("Depends")
- Schedule: "depends"
- Days: varies weekly
- Expected: Flexible full-body workouts that work any day

---

## Monitoring

After cleanup, track:
- AI response validation rate (should be >95%)
- Retry rate (should be <5%)
- Fallback rate (should be <1%)
- User satisfaction with generated workouts
- Weight progression accuracy
