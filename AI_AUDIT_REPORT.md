# Thryvin AI Pipeline Audit Report
## Complete Technical Analysis

---

## 1. INVENTORY OF ALL AI TOUCHPOINTS

| Feature | File Path(s) | Endpoint | Model | Prompt Location | Input Data | Output Schema |
|---------|--------------|----------|-------|-----------------|------------|---------------|
| **Weekly Workout Generation** | `server/ai-workout-generator.ts` | `POST /api/workouts/generate` | gpt-4o | Lines 97-290 | userProfile, dayOfWeek, weekNumber, recentExercises, comprehensiveUserContext | GeneratedWorkout (title, type, difficulty, duration, exercises[], overview, targetMuscles, caloriesBurn) |
| **Daily Workout Generation** | `server/ai-workout-generator.ts` | `POST /api/workouts/generate` | gpt-4o | Same as above | Same as above (called 7x for week) | Same |
| **Exercise Swap/Regeneration** | `server/ai-exercise-swap.ts` | `POST /api/workouts/swap-exercise` | gpt-4o | Lines 40-71 | currentExercise, reason, additionalNotes, userProfile | AlternativesResponse (recommended, alternatives[]) |
| **AI Chat Coach (Backend)** | `server/routes.ts` | `POST /api/coach/chat` | gpt-4o | Lines 7007-7130 `getCoachResponse()` | coach, userMessage, trainingType, coachingStyle, userContext, personalityTone | string (response) |
| **AI Chat Coach (Frontend Direct)** | `apps/native/src/components/FloatingCoachButton.tsx` | Direct OpenAI call | gpt-4o | Lines 148-166 | messages array, userMessage | string (AI response) |
| **AI Chat (Generic)** | `server/routes.ts` | `POST /api/chat` | gpt-4o | Lines 2394-2436 | message, coachName, coachSpecialty, conversationHistory | { response: string } |
| **AI Chat (Structured)** | `server/routes.ts` | `POST /api/ai/chat` | gpt-4o | Lines 796-819 | message, context (coach, userProfile, conversationHistory) | { response, coach, confidence, suggestions } |
| **Voice Transcription** | `server/routes.ts` | `POST /api/transcribe` | whisper-1 | Lines 571-577 | audio file | { text: string, success: boolean } |
| **Coach Tips** | `server/routes.ts` | `POST /api/ai/coach-tip` | gpt-4o | Lines 408-440 `generateCoachTip()` | userProfile, currentWorkout | string (tip) |
| **Schedule Editor** | `server/routes.ts` | `POST /api/ai/edit-schedule` | gpt-4o | Lines 444-486 `generateScheduleEdits()` | request, currentSchedule | array of edits |
| **Workout Adjustment** | `server/routes.ts` | `POST /api/ai/workout/adjust` | gpt-4o | Lines 856-945 | workoutId, feedback, adjustmentType, currentWorkout | adjusted workout |
| **Performance Learning** | `server/ai-learning-service.ts` | `POST /api/workouts/log-performance` | N/A (rule-based) | Lines 28-160 | WorkoutPerformance (userId, workoutId, exercises[], duration) | void (stores insights) |
| **Coach Image Generation** | `server/generate-coach-image.ts` | `POST /api/generate-coach-image` | dall-e-3 | Full file | coachId, style | { imageUrl } |
| **Weight Suggestion** | `server/ai-user-context.ts` | `GET /api/workout/suggested-weight/:exerciseName` | N/A (rule-based) | Lines 190-228 | userId, exerciseName | { suggestedWeight, suggestedReps } |

---

## 2. USER DATA CURRENTLY RECEIVED BY AI

### Per AI Touchpoint Analysis:

#### A. Workout Generation (`ai-workout-generator.ts`)

| Data Category | Field | Included? | Source |
|--------------|-------|-----------|--------|
| **Onboarding** | fitnessGoals | ✅ | userProfile.fitnessGoals |
| | experience/fitnessLevel | ✅ | userProfile.experience |
| | trainingType | ✅ | userProfile.trainingType |
| | sessionDuration | ✅ | userProfile.sessionDuration |
| | trainingDays | ✅ | userProfile.trainingDays |
| | equipment | ✅ | userProfile.equipment |
| | injuries | ✅ | userProfile.injuries |
| **Advanced Questionnaire** | targets (events) | ✅ | advancedQuestionnaire.targets |
| | goalDetails | ✅ | advancedQuestionnaire.goalDetails |
| | enjoyedTraining | ✅ | advancedQuestionnaire.enjoyedTraining |
| | dislikedTraining | ✅ | advancedQuestionnaire.dislikedTraining |
| | weakAreas | ✅ | advancedQuestionnaire.weakAreas |
| | additionalInfo | ✅ | advancedQuestionnaire.additionalInfo |
| **Workout History** | totalWorkouts | ✅ | comprehensiveProfile.workoutHistory |
| | avgDuration | ✅ | comprehensiveProfile.workoutHistory |
| | favoriteExercises | ✅ | comprehensiveProfile.workoutHistory |
| | avoidedExercises | ✅ | comprehensiveProfile.workoutHistory |
| | currentStreak | ✅ | comprehensiveProfile.workoutHistory |
| **Performance Data** | weights/reps per exercise | ⚠️ PARTIAL | getPerformanceHistory returns [] |
| | RPE/effort | ❌ NOT USED | Set data exists but not passed |
| | progression trends | ⚠️ PARTIAL | Only in learning insights |
| **Preferences** | liked exercises | ✅ | learningInsights |
| | disliked exercises | ✅ | learningInsights |
| **Schedule** | trainingSchedule type | ✅ | onboardingData.trainingSchedule |
| | selectedDays | ✅ | onboardingData.selectedDays |
| | specificDates | ✅ | onboardingData.specificDates |
| **Current Context** | dayOfWeek | ✅ | passed directly |
| | weekNumber | ✅ | passed directly |
| | recentExercises (avoid repetition) | ✅ | passed from weekWorkouts |

#### B. AI Coach Chat (Backend `getCoachResponse`)

| Data Category | Included? | Notes |
|--------------|-----------|-------|
| Full userContext | ✅ | Via `formatUserContextForAI(profile)` |
| Coach personality | ✅ | coach parameter |
| Coaching style | ✅ | coachingStyle parameter |
| Conversation history | ❌ | NOT passed to `getCoachResponse` |
| Current workout context | ❌ | NOT included |

#### C. AI Coach Chat (Frontend Direct - FloatingCoachButton.tsx)

| Data Category | Included? | Notes |
|--------------|-----------|-------|
| **CRITICAL ISSUE** | | |
| User profile | ❌ | Only generic system prompt |
| Goals/preferences | ❌ | Not included |
| Workout history | ❌ | Not included |
| Injuries | ❌ | Not included |
| Conversation history | ✅ | messages array |

#### D. Exercise Swap (`ai-exercise-swap.ts`)

| Data Category | Included? | Notes |
|--------------|-----------|-------|
| Current exercise | ✅ | Full exercise object |
| Reason for swap | ✅ | User input |
| userProfile | ⚠️ | Passed but NOT USED in prompt |
| User injuries | ❌ | NOT considered |
| User equipment | ❌ | NOT considered |

---

## 3. CONTRADICTIONS & DUPLICATIONS

### 3.1 Multiple Coach Chat Implementations (CRITICAL)

```
CONTRADICTION: 4 different AI coach implementations with different behaviors

1. FloatingCoachButton.tsx (FRONTEND DIRECT) - Lines 140-181
   - Calls OpenAI directly from frontend
   - Generic "enthusiastic fitness coach" persona
   - NO user context
   - NO injury/equipment consideration
   
2. POST /api/coach/chat - Lines 1873-1909
   - Uses getCoachResponse()
   - HAS full user context
   - Strict fitness-only enforcement
   
3. POST /api/chat - Lines 2384-2450
   - Different system prompt
   - Uses coachName/coachSpecialty
   - Limited user context (only name, goal, fitnessLevel, trainingType)
   - NO conversation history in actual API call
   
4. POST /api/ai/chat - Lines 771-852
   - Returns structured JSON response
   - Generic "professional fitness coach"
   - Basic userProfile context only
```

**IMPACT**: Users get inconsistent coaching experiences. Frontend coach doesn't know user's injuries, goals, or history.

### 3.2 Multiple Workout Schemas

```
DUPLICATION: At least 2 different workout output formats

1. ai-workout-generator.ts - GeneratedWorkout interface (Lines 34-56)
   - Structured with category field per exercise
   - Includes suggestedWeight, aiNote, setType
   
2. generateScheduleEdits output - Lines 456-468
   - Different format: { date, workoutType, duration, notes }
   - No exercises array
```

### 3.3 Conflicting Coach Personas

```
CONTRADICTION: Different personality definitions

1. getCoachResponse() - Lines 7044-7070
   - kai: "calisthenics expert"
   - titan: "strength training coach"
   - lumi: "wellness guide"
   
2. POST /api/chat - Lines 2394-2427
   - coachName + coachSpecialty (freeform)
   - Different persona building
   
3. FloatingCoachButton.tsx - Line 159
   - "enthusiastic and knowledgeable AI fitness coach"
   - No personality options
```

### 3.4 Advanced Questionnaire Ignored in Some Endpoints

```
ISSUE: Advanced questionnaire NOT used in:

1. Exercise swap (ai-exercise-swap.ts) - userProfile passed but never used
2. Coach tips (generateCoachTip) - Only generic userProfile JSON
3. Schedule edits (generateScheduleEdits) - No user context
4. Frontend coach chat - No user context at all
```

### 3.5 Learning Service Not Connected

```
ISSUE: ai-learning-service.ts exists but:

1. analyzeAndLearn() is called from /api/workouts/log-performance
2. BUT getPersonalizedAdjustments() is imported but never called
3. Learning insights stored but workout generation only partially uses them
```

---

## 4. PROPOSED: SINGLE "AI CONTEXT BUILDER" FUNCTION

The file `server/ai-user-context.ts` already has `getComprehensiveUserContext()` but it's NOT used everywhere.

### Current State vs Required State:

| Endpoint | Uses getComprehensiveUserContext? |
|----------|----------------------------------|
| /api/workouts/generate | ✅ YES |
| /api/coach/chat | ✅ YES |
| /api/chat | ❌ NO (basic only) |
| /api/ai/chat | ❌ NO |
| /api/workouts/swap-exercise | ❌ NO |
| /api/ai/coach-tip | ❌ NO |
| /api/ai/edit-schedule | ❌ NO |
| FloatingCoachButton (frontend) | ❌ NO (calls OpenAI directly) |

### Recommended Fix:

Create `buildAiContext(userId, date?)` that returns strict JSON including:
- All onboarding data
- Advanced questionnaire (verbatim)
- Current training schedule
- Current plan week/day
- Last 14 days workout logs with sets/reps/weights
- Liked/disliked exercises
- Injuries/limitations
- Coaching style preference

**ALL AI endpoints must call this function.**

---

## 5. WORKOUT GENERATION CONTRACT (CURRENT STATE)

### Current Schema (ai-workout-generator.ts):

```typescript
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
    setType?: 'normal' | 'drop' | 'super' | 'giant';
    supersetWith?: string;
  }>;
  overview: string;
  targetMuscles: string;
  caloriesBurn: number;
}
```

### Missing Validation:
- NO Zod schema validation
- NO retry on invalid response
- NO fallback workout

### Constraints NOT Enforced:
- Equipment respect: ⚠️ In prompt but not validated
- Injury respect: ⚠️ In prompt but not validated  
- Schedule respect: ❌ Not enforced
- Goal timeline/events: ⚠️ In advanced questionnaire but loosely used
- Enjoy/don't enjoy: ⚠️ In prompt but not validated
- Progressive overload: ❌ Not implemented

---

## 6. COACH "LEARNING" - CURRENT STATE

### What Gets Stored (ai-learning-service.ts):

| Signal | Stored? | Table | Notes |
|--------|---------|-------|-------|
| Completed sets with weight/reps | ✅ | workoutSets | Stored but underutilized |
| Effort/RPE notes | ✅ | aiLearningContext | Parsed from user notes |
| "Too hard" signals | ✅ | aiLearningContext | category='difficulty' |
| "Too easy" signals | ✅ | aiLearningContext | category='difficulty' |
| Missed sessions | ❌ | - | Not tracked |
| Session lateness | ❌ | - | Not tracked |
| Skipped exercises | ❌ | - | Not tracked |
| Liked exercises | ✅ | aiLearningContext | Extracted from notes |
| Disliked exercises | ✅ | aiLearningContext | Extracted from notes |

### What's NOT Working:

1. **Performance history returns empty**: `getPerformanceHistory()` returns `[]` (see line 228)
2. **No ai_user_profile aggregate record**: Insights scattered across `aiLearningContext` rows
3. **Progressive overload not calculated**: No week-over-week strength tracking
4. **Adherence not tracked**: No missed session detection

---

## 7. FILE INVENTORY

### AI-Related Files:

| File | Purpose | Lines of Code |
|------|---------|--------------|
| `server/ai-workout-generator.ts` | Main workout generation | ~350 |
| `server/ai-exercise-swap.ts` | Exercise alternatives | ~180 |
| `server/ai-learning-service.ts` | Learning from workouts | ~250 |
| `server/ai-user-context.ts` | User context aggregation | ~400 |
| `server/generate-coach-image.ts` | DALL-E coach images | ~100 |
| `server/routes.ts` | All API endpoints | ~7200 (AI scattered) |
| `apps/native/src/components/FloatingCoachButton.tsx` | Frontend coach | ~850 |
| `apps/native/src/components/AICoachWidget.tsx` | Another coach UI | ~900 |

### AI Endpoints in routes.ts:

| Line | Endpoint |
|------|----------|
| 771 | POST /api/ai/chat |
| 856 | POST /api/ai/workout/adjust |
| 1514 | POST /api/workouts/generate |
| 1598 | POST /api/workouts/swap-exercise |
| 1873 | POST /api/coach/chat |
| 2384 | POST /api/chat |
| 2983 | POST /api/ai/coach-tip |
| 2995 | POST /api/ai/edit-schedule |
| 3318 | POST /api/ai/generate-workout |
| 3341 | POST /api/ai/workout/generate |
| 3372 | POST /api/ai/generate-schedule |

---

## SUMMARY OF CRITICAL ISSUES

1. **Frontend coach calls OpenAI directly** - No user context, bypasses all personalization
2. **4 different coach chat implementations** - Inconsistent experience
3. **getPerformanceHistory() returns empty** - Weight suggestions broken
4. **No workout validation** - AI can return invalid JSON
5. **Advanced questionnaire ignored** in swap, tips, schedule edits
6. **No progressive overload** - AI doesn't increase weights over time
7. **No adherence tracking** - Missed sessions not detected
8. **Duplicate workout generation endpoints** - /api/workouts/generate AND /api/ai/workout/generate

---

## RECOMMENDED CLEANUP PLAN

See `/app/AI_CLEANUP_PLAN.md` for implementation steps.
