# Thryvin AI Fitness Coach - Product Requirements Document

## Original Problem Statement
Build an AI-powered fitness coaching app with personalized workout generation, progress tracking, and an intelligent coach assistant.

## Tech Stack
- **Frontend**: React Native / Expo
- **Backend**: Node.js / TypeScript / Express
- **Database**: PostgreSQL (Neon) + local MongoDB
- **AI**: OpenAI GPT-4o

## What's Been Implemented

### Jan 14, 2025 (Current Session)
- ✅ **Data Logging Fix** - All stats/performance endpoints use JWT auth, workout sets save correctly
- ✅ **Summary Page Beautified** 
  - Green gradient header for completed workouts
  - "Great Job! 💪" header with completion date
  - Stats cards: minutes, sets, volume (kg)
  - Exercise list with set breakdown (Set 1: 60kg × 10, etc.)
  - Click exercise to view full history/stats
- ✅ **Today's Workout Card** - Clean white card matching homepage style
- ✅ **Exercise Browser Categories Updated**
  - Now: Weights (→ Upper/Lower/Full Body), Bodyweight, Cardio, Flexibility
  - Search bar at EVERY level (categories, subcategories, list)
  - Done exercises at top, undone with lock icon
  - Pin favorites functionality
- ✅ **Exercise Count** - Now returns 1819 exercises (was limited to 500)
- ✅ **Homepage Favorites** - Replaced "Coming Soon" with FavoriteExercisesCard
- ✅ **Stats Page** - Removed "All Exercise Stats" button
- ✅ **Duration Fix** - Summary shows actual duration from completed workouts

### Previous Sessions
- ✅ Edit Plan Conversational UI
- ✅ AI Coach directive-only role
- ✅ Voice-to-text in chat
- ✅ Calendar/Program data sync

## Pending / In Progress

### P1 - High Priority
- [ ] **PR Celebration Animation** - Detect when user beats personal best during workout
- [ ] Test complete workout flow end-to-end on device
- [ ] Verify exercises show correctly in browser

### P2 - Medium Priority
- [ ] Refactor FloatingCoachButton.tsx (2000+ lines)
- [ ] "Add to future workout" option in exercise browser

## Key API Endpoints
- `POST /api/workout/log-set` - Log workout set (JWT auth)
- `GET /api/stats/workout-summary/:workoutId` - Get workout summary with exercises
- `GET /api/exercises?limit=2000` - Get ALL exercises from database
- `GET /api/stats/exercises` - Get user's logged exercises
- `GET /api/stats/exercise/:exerciseId` - Get exercise detail

## Architecture Notes
- Backend: port 8001, supervisor-managed
- Exercises API limit increased from 500 to 2000
- `performance_logs` table stores all workout data
- Summary fetches from performance_logs, calculates volume

## Key Files Modified This Session
- `/app/server/routes.ts` - JWT auth, exercise limit to 2000
- `/app/apps/native/src/components/WorkoutDetailsModal.tsx` - Summary UI, click exercise to view stats
- `/app/apps/native/src/components/ExerciseStatsModal.tsx` - New categories, search at all levels
- `/app/apps/native/app/(tabs)/workouts.tsx` - Clean completed card
- `/app/apps/native/app/(tabs)/index.tsx` - FavoriteExercisesCard

## Data Flow
```
Mobile App → POST /api/workout/log-set → performance_logs table
           → GET /api/stats/workout-summary/:id → Summary with per-exercise sets breakdown
           → Click exercise → ExerciseStatsModal with full history
```
