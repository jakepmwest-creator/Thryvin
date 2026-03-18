# Thryvin AI Fitness Coach - PRD

## Architecture
- Backend: Express.js + TypeScript (Neon PostgreSQL) — deployed on Railway
- Frontend: React Native / Expo
- AI: OpenAI GPT-4o (coach, workout gen)
- Video: Cloudinary | Subscriptions: RevenueCat (MOCKED) | Backend: Railway

## Production URL
- Railway: https://thryvin-production-fbdd.up.railway.app

## Implemented

### Tester-Ready Batch (Latest)
1. **Star/Favourite System** — Max 3 starred exercises. Star button on every Explore tile. When full, shows "Replace a Favourite" modal to swap one out. Stored in AsyncStorage.
2. **Liked/Disliked Tile Layout** — Rewritten with 2-column tile grid, Cloudinary video thumbnails, like/dislike badges on each tile, remove button. Matches Explore style.
3. **Explore Star Button** — Alongside heart/thumbs-down on each exercise tile
4. **Badge Islands** — Already requires 100% completion of current island before advancing (confirmed)
5. **Tester Prep** — Railway URL everywhere, test accounts removed from login, all users default to Pro

### Earlier Work
- AI Coach compassion prompt, tour improvements, Pro/Paywall dark UI, onboarding paywall screen
- Explore Workouts tile redesign, filter button, video thumbnails
- todayWorkoutRef crash fix, workout regeneration guard, awards padding
- Video fuzzy matching removal, coach memory, drop set UI, Pro gating, billing redesign

## Known Issues
- RevenueCat MOCKED (needs EAS build for real purchases)

## Remaining
- [ ] User testing feedback round
- [ ] Real RevenueCat integration (EAS Dev Build)
- [ ] App Store / Play Store submission
- [ ] Island visual improvements (user deferred)
