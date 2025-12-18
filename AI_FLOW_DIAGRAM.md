# Thryvin AI Flow Diagram

## Current Architecture (BEFORE Cleanup)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────┐    ┌──────────────────────┐                       │
│  │ FloatingCoachButton  │    │   AICoachWidget      │                       │
│  │                      │    │                      │                       │
│  │  ⚠️ DIRECT OpenAI    │    │  Uses /api/coach/chat │                       │
│  │  (NO user context)   │    │  (HAS user context)  │                       │
│  └──────────┬───────────┘    └──────────┬───────────┘                       │
│             │                           │                                    │
│             │ api.openai.com            │ /api/coach/chat                    │
│             ▼                           ▼                                    │
└─────────────┼───────────────────────────┼────────────────────────────────────┘
              │                           │
              │ ❌ BYPASSES BACKEND       │
              ▼                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        routes.ts                                     │    │
│  │                                                                      │    │
│  │  CHAT ENDPOINTS (4 DIFFERENT IMPLEMENTATIONS!)                       │    │
│  │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐        │    │
│  │  │ /api/coach/chat │ │ /api/chat       │ │ /api/ai/chat    │        │    │
│  │  │ ✅ Full context │ │ ⚠️ Basic ctx    │ │ ⚠️ Basic ctx    │        │    │
│  │  │ ✅ Strict mode  │ │ ❌ No history   │ │ ⚠️ JSON output  │        │    │
│  │  └────────┬────────┘ └────────┬────────┘ └────────┬────────┘        │    │
│  │           │                   │                   │                  │    │
│  │           └───────────────────┴───────────────────┘                  │    │
│  │                               │                                      │    │
│  │                               ▼                                      │    │
│  │                    ┌─────────────────────┐                           │    │
│  │                    │  getCoachResponse() │                           │    │
│  │                    │  (gpt-4o)           │                           │    │
│  │                    └─────────────────────┘                           │    │
│  │                                                                      │    │
│  │  WORKOUT ENDPOINTS (3 DUPLICATES!)                                   │    │
│  │  ┌──────────────────────┐ ┌────────────────────┐ ┌────────────────┐ │    │
│  │  │/api/workouts/generate│ │/api/ai/workout/    │ │/api/ai/generate│ │    │
│  │  │ ✅ Main endpoint     │ │generate            │ │-workout        │ │    │
│  │  │ ✅ Full context      │ │ ⚠️ Duplicate       │ │ ⚠️ Duplicate   │ │    │
│  │  └──────────┬───────────┘ └────────────────────┘ └────────────────┘ │    │
│  │             │                                                        │    │
│  └─────────────┼────────────────────────────────────────────────────────┘    │
│                │                                                              │
│                ▼                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    ai-workout-generator.ts                           │    │
│  │                                                                      │    │
│  │  ┌───────────────────────────────────────────────────────────────┐  │    │
│  │  │ getComprehensiveUserContext()                                  │  │    │
│  │  │ ✅ Onboarding data                                             │  │    │
│  │  │ ✅ Advanced questionnaire                                      │  │    │
│  │  │ ✅ Learning insights                                           │  │    │
│  │  │ ⚠️ Performance history (BROKEN - returns [])                   │  │    │
│  │  └───────────────────────────────────────────────────────────────┘  │    │
│  │                               │                                      │    │
│  │                               ▼                                      │    │
│  │                    ┌─────────────────────┐                           │    │
│  │                    │   OpenAI gpt-4o     │                           │    │
│  │                    │   (NO validation!)  │                           │    │
│  │                    └─────────────────────┘                           │    │
│  │                                                                      │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    ai-learning-service.ts                            │    │
│  │                                                                      │    │
│  │  analyzeAndLearn() ──────┐                                          │    │
│  │  ✅ Stores to aiLearningContext                                     │    │
│  │  ✅ Tracks weights/reps                                             │    │
│  │  ✅ Detects difficulty signals                                      │    │
│  │  ❌ No adherence tracking                                           │    │
│  │  ❌ No progressive overload                                         │    │
│  │                          │                                           │    │
│  │                          ▼                                           │    │
│  │              ┌─────────────────────┐                                 │    │
│  │              │  aiLearningContext  │ (Database)                      │    │
│  │              │  - Scattered rows   │                                 │    │
│  │              │  - No aggregation   │                                 │    │
│  │              └─────────────────────┘                                 │    │
│  │                                                                      │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘


## Target Architecture (AFTER Cleanup)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────┐    ┌──────────────────────┐                       │
│  │ FloatingCoachButton  │    │   AICoachWidget      │                       │
│  │                      │    │                      │                       │
│  │  ✅ Uses backend API │    │  ✅ Uses backend API │                       │
│  │  (/api/coach/chat)   │    │  (/api/coach/chat)  │                       │
│  └──────────┬───────────┘    └──────────┬───────────┘                       │
│             │                           │                                    │
│             └───────────┬───────────────┘                                    │
│                         │                                                    │
│                         ▼                                                    │
└─────────────────────────┼────────────────────────────────────────────────────┘
                          │
                          │ /api/coach/chat (SINGLE ENDPOINT)
                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     buildAiContext(userId)                           │    │
│  │                     SINGLE SOURCE OF TRUTH                           │    │
│  │                                                                      │    │
│  │  Returns:                                                            │    │
│  │  ├── profile: ComprehensiveUserProfile                               │    │
│  │  ├── formatted: string (for prompts)                                 │    │
│  │  └── json: {                                                         │    │
│  │        onboarding,                                                   │    │
│  │        advancedQuestionnaire,                                        │    │
│  │        schedule,                                                     │    │
│  │        workoutLogs (14 days),                                        │    │
│  │        preferences,                                                  │    │
│  │        injuries,                                                     │    │
│  │        coachingStyle                                                 │    │
│  │      }                                                               │    │
│  │                                                                      │    │
│  └──────────────────────────────┬───────────────────────────────────────┘    │
│                                 │                                            │
│           ┌─────────────────────┼─────────────────────┐                      │
│           │                     │                     │                      │
│           ▼                     ▼                     ▼                      │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐                │
│  │ /api/coach/chat │ │ /api/workouts/  │ │ /api/workouts/  │                │
│  │                 │ │ generate        │ │ swap-exercise   │                │
│  │ CONSOLIDATED    │ │                 │ │                 │                │
│  │ CHAT ENDPOINT   │ │ WITH VALIDATION │ │ WITH CONTEXT    │                │
│  └────────┬────────┘ └────────┬────────┘ └────────┬────────┘                │
│           │                   │                   │                          │
│           └───────────────────┴───────────────────┘                          │
│                               │                                              │
│                               ▼                                              │
│                    ┌─────────────────────┐                                   │
│                    │   OpenAI gpt-4o     │                                   │
│                    │   ✅ Zod validated  │                                   │
│                    │   ✅ Retry logic    │                                   │
│                    │   ✅ Fallback       │                                   │
│                    └─────────────────────┘                                   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                       AI Learning Pipeline                           │    │
│  │                                                                      │    │
│  │   Workout Complete ──► analyzeAndLearn() ──► updateAiUserProfile()  │    │
│  │                                                                      │    │
│  │   ┌─────────────────┐           ┌─────────────────┐                 │    │
│  │   │aiLearningContext│ ◄───────► │  aiUserProfile  │                 │    │
│  │   │ (raw signals)   │           │  (aggregated)   │                 │    │
│  │   │                 │           │                 │                 │    │
│  │   │ - difficulty    │           │ - avgCompletion │                 │    │
│  │   │ - preferences   │           │ - adherence %   │                 │    │
│  │   │ - skips         │           │ - favorites[]   │                 │    │
│  │   │ - performance   │           │ - avoids[]      │                 │    │
│  │   └─────────────────┘           │ - weightIncrease│                 │    │
│  │                                 └─────────────────┘                 │    │
│  │                                         │                           │    │
│  │                                         │ Read by                   │    │
│  │                                         ▼                           │    │
│  │                              ┌─────────────────────┐                │    │
│  │                              │ buildAiContext()    │                │    │
│  │                              │ (feeds back to AI)  │                │    │
│  │                              └─────────────────────┘                │    │
│  │                                                                      │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow: Workout Generation

```
User Requests Workout
        │
        ▼
┌───────────────────┐
│ buildAiContext()  │
└────────┬──────────┘
         │
         ▼
┌───────────────────────────────────────────────────────────────┐
│ Comprehensive Context                                          │
│                                                                │
│ ✅ Name, age, gender, weight, height                          │
│ ✅ Fitness level, goals, training type                        │
│ ✅ Session duration, training days                            │
│ ✅ Equipment access                                           │
│ ✅ Injuries/limitations                                       │
│ ✅ Advanced questionnaire (targets, enjoys, dislikes, weak)   │
│ ✅ Schedule preferences (flexible/specific/depends)           │
│ ✅ Performance history (weights, reps, progression)           │
│ ✅ Learning insights (difficulty signals, preferences)        │
│ ✅ Workout history (total, avg duration, streak)              │
│ ✅ Favorite/avoided exercises                                 │
│ ✅ Recent feedback/notes                                      │
│                                                                │
└────────────────────────────┬──────────────────────────────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │ AI Prompt Template  │
                  │                     │
                  │ "You are an expert  │
                  │  PT who KNOWS this  │
                  │  client intimately" │
                  └──────────┬──────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │   OpenAI gpt-4o     │
                  │   response_format:  │
                  │   json_object       │
                  └──────────┬──────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │ Zod Validation      │
                  │                     │
                  │ WorkoutSchema.parse │
                  └──────────┬──────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
         Valid│                        Invalid│
              ▼                             ▼
    ┌─────────────────┐          ┌─────────────────┐
    │ Return Workout  │          │ Retry Once      │
    │                 │          │                 │
    │ - Enriched with │          │ If still fail:  │
    │   video URLs    │          │ getFallback()   │
    │ - Ready to use  │          │                 │
    └─────────────────┘          └─────────────────┘
```

## Data Flow: Learning Loop

```
User Completes Workout
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│ Captured Data                                                  │
│                                                                │
│ ✅ Exercise-level: name, weight, reps, sets, effort, notes    │
│ ✅ Workout-level: duration, completed exercises, skipped      │
│ ✅ Feedback: user notes, difficulty signals                   │
│                                                                │
└────────────────────────────┬──────────────────────────────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │ analyzeAndLearn()   │
                  │                     │
                  │ Parse notes for:    │
                  │ - "too hard"        │
                  │ - "too easy"        │
                  │ - preferences       │
                  └──────────┬──────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │ Store to DB:        │
                  │                     │
                  │ aiLearningContext   │
                  │ - category          │
                  │ - exerciseName      │
                  │ - insight           │
                  │ - confidence        │
                  └──────────┬──────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │updateAiUserProfile()│
                  │                     │
                  │ Aggregate signals:  │
                  │ - Completion rate   │
                  │ - Adherence         │
                  │ - Strength trend    │
                  │ - Preferences       │
                  └──────────┬──────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │  aiUserProfile      │
                  │  (single record     │
                  │   per user)         │
                  └──────────┬──────────┘
                             │
                             │ Next workout request
                             │ reads from here
                             ▼
                  ┌─────────────────────┐
                  │ buildAiContext()    │
                  │ includes profile    │
                  │ data in prompt      │
                  └─────────────────────┘
```
