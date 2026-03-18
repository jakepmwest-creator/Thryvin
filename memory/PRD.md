# Thryvin AI Fitness Coach - PRD

## Architecture
- Backend: Express.js + TypeScript (Neon PostgreSQL) — Railway
- Frontend: React Native / Expo
- Production URL: https://thryvin-production-fbdd.up.railway.app

## Latest Changes (Feb 18, 2026)

### Bug Fixes
1. **Silent background generation** — When user already has 14+ workouts, existing workouts show immediately. Missing days generate silently in the background — no "Generating workouts" screen unless starting from scratch.
2. **Island progression text** — Fixed hardcoded "80% required" to "complete all to unlock next island" (store logic was already 100%, only the display text was wrong)
3. **Starred favorites on home page** — FavoriteExercisesCard now reads from starred exercises (preferences store) instead of old API endpoint. Shows video thumbnails, PB stats, trend arrows, and empty "+" slots for unfilled stars.

### Recent Features
- Star system (max 3 + replace prompt)
- Unified Explore + Stats (video, form tips, stats in one place)
- Like button with "influences AI" note
- Liked/Disliked tile layout with thumbnails
- Tester-ready: Railway URL, Pro for all, test accounts removed

## Known Issues
- RevenueCat MOCKED (needs EAS build)

## Remaining
- [ ] Tester feedback round
- [ ] Real RevenueCat integration
- [ ] Island visual improvements (deferred)
- [ ] App Store / Play Store submission
