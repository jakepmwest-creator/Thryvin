# Thryvin AI Fitness Coach - PRD

## Architecture
- Backend: Express.js + TypeScript (Neon PostgreSQL) on Railway
- Frontend: React Native / Expo
- Production URL: https://thryvin-production-fbdd.up.railway.app

## What's Been Implemented (Mar 18, 2026)

### Bug Fixes
1. **Data Persistence (P0)** — All syncToBackend calls awaited with retry. Local-first + backend sync strategy.
2. **Silent Workout Generation (P1)** — Only show "Generating" when zero workouts exist. Shimmer placeholder for loading state.
3. **Coach Nudges Error (P1)** — All 4 nudge endpoints use Bearer auth. Hook sends token, suppresses errors.
4. **Thumbnail Fix** — Validates thumbnailUrl is actually an image (not .mp4). Falls back to Cloudinary transform.
5. **Star Button Fix** — Works from exercise detail sheets. Replace modal shows when 3 stars already set.
6. **Loading State** — Shimmer skeleton placeholder instead of "Loading..." or "Your Workout" text.

### Feature Overhaul
7. **Explore Workouts Redesign** — Swipeable ExploreCarousel + full ExploreWorkoutsModal:
   - Hub row: All / Starred / Liked / Disliked quick filters
   - Category tabs with Thryvin purple-to-pink gradient
   - Search + difficulty/equipment filters
   - Exercise tiles with thumbnails, like/dislike/star actions
   - Full exercise detail with video, stats, form tips
8. **Favourite Exercises Card** — Rounded rectangle thumbnails (not circles), purple-to-pink gradient border, clickable → opens exercise detail with stats, weight/PB display.

### Previously Completed (Previous Sessions)
- Star system, unified explore + stats, tile layouts, pro paywall redesign
- Tester-ready: Railway, Pro for all, test accounts removed
- App crash fix, island progression fix, video matching fix
- AI coach empathy update

## Known Issues
- RevenueCat MOCKED (Pro for all testers)
- Pre-existing TypeScript errors in notifications, diagnostics, workout-store (not blocking)

## Backlog
- [ ] App Tour Expansion (navigate into active workout)
- [ ] AI Special Sets (drop sets in generation)
- [ ] Marketing copy finalization
- [ ] Full RevenueCat native integration
- [ ] Enhanced island graphics
- [ ] Dark theme support
- [ ] Database migration cleanup (exercise_preferences)
- [ ] App Store / Play Store submission
