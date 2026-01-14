# Thryvin AI Fitness Coach - Product Requirements Document

## Original Problem Statement
Build an AI-powered fitness coaching app with personalized workout generation, progress tracking, and an intelligent coach assistant.

## What's Been Implemented

### Jan 14, 2025 (Current Session)

#### Data Flow & Backend
- ✅ **Data Logging** - JWT auth on all stats endpoints, workout sets save correctly
- ✅ **Exercise Count** - Returns 1819 exercises (limit increased from 500)

#### Exercise Stats Modal - Complete Rewrite
- ✅ **Smart Category Detection** - Matches Explore Workouts logic
  - Weights: 897 exercises (anything with equipment)
  - Calisthenics: 767 exercises (bodyweight)
  - Cardio: 28 exercises
  - Flexibility: 127 exercises (warmup, recovery, stretch, yoga)
- ✅ **Search Bar at Every Level** - Categories, subcategories, exercise list
- ✅ **Done vs Undone** - Done exercises at top with stats, undone below with lock
- ✅ **Unperformed Exercise View**
  - Click unlocked exercises to see grayed-out detail view
  - "Add to Future Workout" button
  - Pin to favorites button
- ✅ **Performed Exercise View**
  - Full stats with PBs, history, graphs
  - Inline pin button
  - Coach tips

#### Category Naming Standardized
- ✅ Explore Workouts: Changed "Strength" → "Weights"
- ✅ Exercise Stats: Changed "Bodyweight" → "Calisthenics"
- ✅ Both now use: Weights, Calisthenics, Cardio, Flexibility

#### Summary Page
- ✅ Green gradient header for completed workouts
- ✅ Shows actual duration from completed workout
- ✅ Per-exercise set breakdown (Set 1: 60kg × 10)
- ✅ Click exercise → opens detailed stats view

### Previous Sessions
- ✅ Edit Plan Conversational UI
- ✅ AI Coach directive-only
- ✅ Voice-to-text in chat

## Pending / Still To Fix

### P0 - Critical
- [ ] **Summary sets count wrong** - Shows 6 sets but user did more
- [ ] **Summary volume showing zero** - Need to debug why volume calc returns 0
- [ ] **Exercise click in summary not working** - Need to verify the click handler triggers

### P1 - High Priority
- [ ] **PR Celebration Animation** - Detect and celebrate when user beats PB
- [ ] **Explore Workout IDs showing** - Fix display of exercise IDs with names

### P2 - Medium Priority
- [ ] Refactor FloatingCoachButton.tsx

## Key API Endpoints
- `POST /api/workout/log-set` - Log workout set
- `GET /api/stats/workout-summary/:workoutId` - Get workout summary
- `GET /api/exercises?limit=2000` - Get ALL exercises
- `GET /api/stats/exercises` - User's logged exercises
- `POST /api/user/exercise-requests` - Request exercise for future workout

## Architecture Notes
- Backend: port 8001, supervisor-managed
- Smart category detection using keyword matching
- `performance_logs` table stores all workout data

## Key Files Modified This Session
- `/app/server/routes.ts` - JWT auth, exercise limit
- `/app/apps/native/src/components/ExerciseStatsModal.tsx` - Complete rewrite
- `/app/apps/native/src/components/ExploreWorkoutsModal.tsx` - Strength→Weights
- `/app/apps/native/app/(tabs)/workouts.tsx` - Category naming
- `/app/apps/native/src/components/WorkoutDetailsModal.tsx` - Summary UI
