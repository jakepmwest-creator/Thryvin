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

### Jan 12, 2025
- ✅ **Edit Plan Conversational UI**: Complete rewrite of EditPlanScreen.tsx
  - Chat-based "Add Workout" flow with multi-step AI conversation
  - Chat-based "Make Harder/Easier" flow with user feedback
  - Beautiful purple-to-pink gradient styling
  - Week tabs for 3-week day selection
  - Swap Days, Skip Day functionality maintained

### Previous Sessions (from handoff)
- ✅ Backend stability fixes (520 errors resolved)
- ✅ Calendar/Program data sync fixed (syncFromBackend function)
- ✅ QA login enabled for testing
- ✅ AI Coach simplified to directive-only role
- ✅ Skip Day converts to Rest Day (not delete)
- ✅ Stay Logged In checkbox added
- ✅ Improved AI workout naming prompts
- ✅ GitHub remote connection restored

## Pending Testing (P0-P2)
1. **P0**: New Edit Plan conversational flows need full testing
2. **P1**: Track Extra Activity (/api/workouts/log-extra) e2e verification
3. **P2**: Stay Logged In persistence flow

## Backlog / Future Tasks
- [ ] Refactor FloatingCoachButton.tsx (2000+ lines, needs breakdown)
- [ ] Fix un-editable completed exercises issue
- [ ] Verify badge system fixes
- [ ] Create foolproof exercise video mapping system

## Key API Endpoints
- `POST /api/workouts/generate` - AI workout generation
- `POST /api/workouts/update-in-place` - Make workout harder/easier
- `GET /api/workouts/week` - Fetch weekly workout plan
- `POST /api/coach/actions/execute` - Execute coach actions
- `POST /api/workouts/log-extra` - Log unexpected workouts

## Architecture Notes
- Backend runs on port 8001 (managed by supervisor via yarn start)
- Frontend is React Native Expo app (runs via Expo Go on device)
- API_BASE_URL: https://ai-trainer-upgrade.preview.emergentagent.com
- Date-based mapping using YYYY-MM-DD format for consistency
- syncFromBackend() must be called after any workout mutations

## Key Files
- `/app/apps/native/src/components/EditPlanScreen.tsx` - Edit plan UI (NEW)
- `/app/apps/native/src/stores/workout-store.ts` - State management
- `/app/apps/native/src/components/FloatingCoachButton.tsx` - AI Coach
- `/app/server/routes.ts` - Backend API routes
- `/app/server/ai-workout-generator.ts` - AI workout generation
