# Thryvin AI Fitness Coach - Product Requirements Document

## Original Problem Statement
Build an AI-powered fitness coaching app with personalized workout generation, progress tracking, and an intelligent coach assistant.

## Core Features
1. **AI Workout Generation** - Personalized workouts using OpenAI GPT-4o
2. **Workout Calendar** - 3-week rolling view with daily workouts
3. **AI Coach** - Conversational assistant (directive-only - guides to Edit Plan)
4. **Edit Plan Screen** - Full workout plan modification capabilities
5. **Progress Tracking** - Stats, streaks, badges, personal bests
6. **Social Features** - Community, posts, follows

## Tech Stack
- **Frontend**: React Native / Expo
- **Backend**: Node.js / TypeScript / Express
- **Database**: PostgreSQL (Neon) + local MongoDB
- **AI**: OpenAI GPT-4o

## What's Been Implemented

### Jan 14, 2025 (Current Session)
- ✅ **CRITICAL FIX: Workout Data Logging** - Fixed JWT authentication mismatch
  - All `/api/workout/log-set` and `/api/stats/*` endpoints now use JWT auth middleware
  - Workout sets correctly saved to `performance_logs` table
  - Summary endpoint returns accurate exercise data, volumes, and sets
  
- ✅ **WorkoutDetailsModal Summary UI Overhaul**
  - Completed workouts now show GREEN gradient header
  - Modal has rounded top corners (24px radius)
  - Beautiful new summary view with:
    - "Great Job!" header with completion date
    - Stats cards (minutes, sets, volume)
    - Exercise list with per-exercise stats and volume
    - PR badges for new personal records
  - Exercises sections hidden for completed workouts (shows summary instead)
  
- ✅ **Today's Workout Card (workouts.tsx)** - Fixed ugly green box
  - Now matches homepage style: clean white card
  - Shows "COMPLETED ✓" badge with green checkmark
  - "Tap to view summary" hint at bottom
  
- ✅ **Enhanced ExerciseStatsModal** - Categorized Exercise Browser
  - Categories match database: Upper Body, Lower Body, Core, Cardio, Full Body
  - Subcategories by equipment: Barbell, Dumbbell, Cable, Machine, Bodyweight
  - "View All" option within each category
  - Search bar refined by current selection
  - Done exercises at top, undone with lock icon below
  - Pin up to 3 favorites functionality
  - Coach tips based on performance trend
  - Detailed stats with Epley 1RM calculations
  - Line graph for strength over time
  
- ✅ **Homepage Favorites** - Replaced "Coming Soon" section
  - Added FavoriteExercisesCard to homepage
  - Same component as stats page for consistency
  - Full exercise stats modal accessible from homepage
  
- ✅ **Stats Page Cleanup** - Removed ugly "All Exercise Stats" button

### Previous Sessions
- ✅ Edit Plan Conversational UI
- ✅ Backend stability fixes
- ✅ Calendar/Program data sync
- ✅ AI Coach directive-only role
- ✅ Voice-to-text in chat

## In Progress / Pending Tasks

### P1 - High Priority
- [ ] Test complete workout flow end-to-end on device
- [ ] Verify exercises from database show correctly in ExerciseStatsModal
- [ ] Ensure workout completion triggers proper data save

### P2 - Medium Priority
- [ ] Refactor FloatingCoachButton.tsx (2000+ lines needs breakdown)
- [ ] "Add to future workout" option in exercise browser
- [ ] Fix un-editable completed exercises issue

## Backlog / Future Tasks
- [ ] Verify badge system fixes
- [ ] Create foolproof exercise video mapping system
- [ ] Add more exercise categories/subcategories to database

## Key API Endpoints
- `POST /api/workout/log-set` - Log workout set (USES JWT AUTH)
- `GET /api/stats/workout-summary/:workoutId` - Get workout summary
- `GET /api/stats/exercises` - Get user's logged exercises with stats
- `GET /api/stats/exercise/:exerciseId` - Get detailed exercise stats
- `GET /api/stats/favorites` - Get user's pinned favorite exercises
- `PUT /api/stats/favorites` - Update pinned favorites
- `GET /api/exercises` - Get all exercises from database
- `POST /api/workouts/generate` - AI workout generation

## Architecture Notes
- Backend runs on port 8001 (managed by supervisor)
- Frontend is React Native Expo app (runs via Expo Go on device)
- API_BASE_URL: https://fitness-stats-7.preview.emergentagent.com
- All stats/performance endpoints use `authenticateToken` middleware for JWT support
- `performance_logs` table is source of truth for exercise stats

## Key Files Modified This Session
- `/app/server/routes.ts` - Fixed JWT auth on all stats/performance endpoints
- `/app/apps/native/src/components/WorkoutDetailsModal.tsx` - Beautiful summary UI, green gradient
- `/app/apps/native/src/components/ExerciseStatsModal.tsx` - Complete rewrite with categories
- `/app/apps/native/app/(tabs)/workouts.tsx` - Clean completed workout card
- `/app/apps/native/app/(tabs)/stats.tsx` - Removed ugly button
- `/app/apps/native/app/(tabs)/index.tsx` - Added FavoriteExercisesCard

## Data Flow
```
Mobile App → POST /api/workout/log-set → performance_logs table
           → GET /api/stats/workout-summary/:id → Summary with exercises, volumes
           → GET /api/stats/exercise/:id → Detailed stats, history, trends
           → GET /api/exercises → All exercises from database
```
