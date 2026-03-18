# Thryvin AI Fitness Coach - PRD

## Architecture
- Backend: Express.js + TypeScript (Neon PostgreSQL) — Railway
- Frontend: React Native / Expo
- Production URL: https://thryvin-production-fbdd.up.railway.app

## Latest Changes

### Unified Explore + Stats (Latest)
1. **"View All" opens Explore** — Favorites card "View All" now opens ExploreWorkoutsModal instead of a separate stats modal
2. **Exercise detail shows stats** — When you tap an exercise in Explore: video, form tips, AND your personal stats (PB, est. 1RM, sessions, last sets). Shows "Never completed this exercise" if no history.
3. **Like button with AI note** — Detail view has like toggle + "Liked exercises influence your AI-generated workouts"

### Star/Favourite System
- Max 3 starred exercises, replace prompt when full
- Star button on every Explore tile alongside like/dislike

### Liked/Disliked Tile Layout
- Rewritten with 2-column grid, Cloudinary video thumbnails, matching Explore style

### Tester-Ready
- Railway URL everywhere, test accounts removed, all users default to Pro
- Coach compassion, tour improvements, Thriven-style paywall cards, onboarding paywall screen

## Known Issues
- RevenueCat MOCKED (needs EAS build)

## Remaining
- [ ] Tester feedback round
- [ ] Real RevenueCat integration
- [ ] Island visual improvements (deferred)
- [ ] App Store / Play Store submission
