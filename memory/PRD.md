# Thryvin AI Fitness Coach - PRD

## Architecture
- Backend: Express.js + TypeScript (Neon PostgreSQL) on Railway
- Frontend: React Native / Expo
- Production URL: https://thryvin-production-fbdd.up.railway.app

## Core Requirements
- AI-powered fitness coaching app for iOS and Android
- 21-day workout generation with AI
- Exercise library with video demos
- Preference tracking (likes, dislikes, stars)
- Subscription management (RevenueCat - currently mocked)
- Coach chat with AI (GPT-4o)

## What's Been Implemented

### Latest Changes (Mar 18, 2026)

#### Bug Fixes
1. **Data Persistence (P0)** - Fixed fire-and-forget `syncToBackend` that silently lost data. Now:
   - All sync calls are `await`ed with retry logic (2 attempts)
   - `loadPreferences` loads from AsyncStorage immediately (fast), then syncs from backend
   - If backend is empty but local has data, pushes local to backend
   - All preference operations (like, dislike, star, unstar, replace) properly await save

2. **Silent Workout Generation (P1)** - Changed condition from `isLoading || weekWorkouts.length < 21` to `isLoading && weekWorkouts.length === 0` on both home and workouts tabs. "Generating" screen only shows when there are truly zero workouts.

3. **Coach Nudges Error (P1)** - Fixed `/api/coach/nudges` endpoint to use `authenticateToken` middleware (Bearer token) instead of `req.isAuthenticated()` (session-based). Updated all 4 nudge endpoints. Updated `useCoachNudges` hook to send Bearer token and suppress errors gracefully.

#### Feature Overhaul
4. **Explore Workouts Redesign** - Complete redesign of the explore section:
   - Removed 4 separate category buttons (Weights, Calisthenics, Cardio, Flexibility)
   - Created `ExploreCarousel` — swipeable horizontal card carousel with exercise thumbnails, quick like/dislike buttons, auto-scroll
   - Created unified `ExploreWorkoutsModal` with light Thriving theme:
     - Category tabs (All, Weights, Calisthenics, Cardio, Flexibility)
     - Full filter system (View: All/Starred/Liked/Disliked/Completed/New, Difficulty, Equipment)
     - Active filter chips with one-tap removal
     - Exercise grid with thumbnails, difficulty badges, quick actions
     - Exercise detail view with video, stats, form tips

5. **Favorite Exercises Card Redesign** - Purple gradient ring around exercise thumbnails, star badge, weight/PB display beneath each exercise, "Not yet completed" for exercises with no history, empty slot indicators.

### Previously Completed
- Star system (max 3 + replace prompt)
- Unified Explore + Stats (video, form tips, stats in one place)
- Like button with "influences AI" note
- Liked/Disliked tile layout with thumbnails
- Tester-ready: Railway URL, Pro for all, test accounts removed
- Pro paywall and billing redesign with dark Thriving theme
- Plan selection screen in onboarding
- App crash fix (todayWorkoutRef)
- Island progression text fix (100% required)

## Known Issues
- RevenueCat MOCKED (needs EAS build for real in-app purchases)
- TypeScript errors in pre-existing files (notifications, diagnostics, workout-store) — not blocking

## Backlog
- [ ] User verification of all 5 fixes from Mar 18 session
- [ ] App Tour Expansion (navigate into active workout to demo logging)
- [ ] AI Special Sets (drop sets in workout generation)
- [ ] Marketing copy finalization (pro.tsx, plan-selection.tsx)
- [ ] Full RevenueCat native integration
- [ ] Enhanced island graphics
- [ ] Database migration cleanup (exercise_preferences table)
- [ ] Dark theme support (user requested for future)
- [ ] App Store / Play Store submission
