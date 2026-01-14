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
- ✅ **CRITICAL FIX: Workout Data Logging** - Fixed authentication mismatch
  - All `/api/workout/log-set` and `/api/stats/*` endpoints now use JWT auth
  - Workout sets correctly saved to `performance_logs` table
  - Summary endpoint returns accurate exercise data, volumes, and sets
  
- ✅ **WorkoutDetailsModal Green Gradient Header**
  - Completed workouts now show GREEN gradient header (not purple)
  - Modal has rounded top corners (24px radius)
  - Transparent overlay behind modal
  - Clean separation between completed vs in-progress workouts
  
- ✅ **Enhanced ExerciseStatsModal** - Categorized Exercise Browser
  - Category view: Weights, Bodyweight, Cardio, Flexibility
  - Subcategory view: Free Weights, Machines, Cables, etc.
  - Exercise list with done exercises at top, undone with lock icon below
  - Pin up to 3 favorites functionality
  - Coach tips based on performance trend
  - Detailed stats with Epley 1RM calculations
  - Line graph for strength over time

### Jan 12, 2025
- ✅ **Edit Plan Conversational UI**: Complete rewrite of EditPlanScreen.tsx
- ✅ Backend stability fixes (520 errors resolved)
- ✅ Calendar/Program data sync fixed

### Previous Sessions
- ✅ AI Coach simplified to directive-only role
- ✅ Skip Day converts to Rest Day
- ✅ Stay Logged In checkbox added
- ✅ GitHub remote connection restored

## In Progress / Pending Tasks

### P0 - Critical
- [ ] Verify workout summary displays correctly in mobile app (backend verified working)
- [ ] Test complete workout flow end-to-end on device

### P1 - High Priority
- [ ] Homepage Favorites - Add same FavoriteExercisesCard to homepage index.tsx (replace "Coming Soon" section)
- [ ] Full exercise database categorization - Add category/subcategory fields to exercises table

### P2 - Medium Priority
- [ ] Refactor FloatingCoachButton.tsx (2000+ lines needs breakdown)
- [ ] "Add to future workout" option in exercise browser

## Backlog / Future Tasks
- [ ] Fix un-editable completed exercises issue
- [ ] Verify badge system fixes
- [ ] Create foolproof exercise video mapping system

## Key API Endpoints
- `POST /api/workout/log-set` - Log workout set (FIXED - now saves to performance_logs)
- `GET /api/stats/workout-summary/:workoutId` - Get workout summary
- `GET /api/stats/exercises` - Get user's logged exercises
- `GET /api/stats/exercise/:exerciseId` - Get exercise detail with PBs
- `GET /api/exercises` - Get all exercises from database
- `POST /api/workouts/generate` - AI workout generation
- `POST /api/workouts/update-in-place` - Make workout harder/easier

## Architecture Notes
- Backend runs on port 8001 (managed by supervisor via yarn start)
- Frontend is React Native Expo app (runs via Expo Go on device)
- API_BASE_URL: https://fitness-stats-7.preview.emergentagent.com
- All endpoints using `req.isAuthenticated()` have been converted to `authenticateToken` middleware for JWT support
- `performance_logs` table is the source of truth for exercise stats

## Key Files Modified This Session
- `/app/server/routes.ts` - Fixed JWT auth on all stats/performance endpoints
- `/app/apps/native/src/components/WorkoutDetailsModal.tsx` - Green gradient for completed workouts, rounded corners
- `/app/apps/native/src/components/ExerciseStatsModal.tsx` - Complete rewrite with categories

## Data Flow
```
Mobile App → POST /api/workout/log-set → performance_logs table
           → GET /api/stats/workout-summary/:id → Summary with exercises, volumes, PBs
           → GET /api/stats/exercise/:id → Detailed stats, history, trends
```
