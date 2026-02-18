# Thryvin AI Fitness Coach - PRD

## Architecture
- Backend: Express.js + TypeScript (Neon PostgreSQL)
- Frontend: React Native / Expo
- AI: OpenAI GPT-4o (coach, workout gen), GPT-4o-mini (memory summaries)
- Video: Cloudinary | Subscriptions: RevenueCat (MOCKED in Expo Go) | Tunnel: Cloudflare

## Implemented

### Batch 6: Final Four — Onboarding Paywall + Marketing + RevenueCat + Badges (Feb 18, 2026)
1. **Onboarding Paywall Screen** — New `plan-selection.tsx` between coach-reveal and quick-signup. Shows Pro vs Standard cards. Pro has gradient header, "3 WEEKS FREE" badge, £6.25/mo pricing, 6 feature perks. Standard intentionally boring (gray). CTA button changes text based on selection.
2. **Marketing Copy Polish** — Updated pro.tsx hero: "Train smarter. Progress faster." CTA: "Unlock rolling plans, workout editing, advanced stats, and more. Try 3 weeks free."
3. **RevenueCat Production-Ready** — Added `restorePurchases()` and `purchasePackage()` methods to subscription-store.ts. Proper error handling for user cancellation. Interface updated with types.
4. **Badge E2E Verified** — API returns 40 badges across 3 islands. Awards store loads from server first, falls back to AsyncStorage. Awards screen bottom padding fixed at 120px. All badge fields (badgeId, progress, completed) verified.

### Batch 5: Coach Compassion + Tour + Paywall UI + Special Sets (Feb 18)
1. AI Coach Compassion — Empathy directives in system prompt
2. Tour compact tooltips — 9 steps including in-workout
3. Pro/Paywall dark Thriven-style cards
4. Advanced questionnaire Pro-gated
5. Special set AI integration confirmed

### Batch 4: Bug Fixes + Explore Redesign (Feb 17)
1. todayWorkoutRef crash fix
2. Workout regeneration guard
3. Explore Workouts tile layout redesign
4. Awards bottom padding
5. Liked/Disliked button styling

### Earlier Batches
- Video fuzzy matching removal, coach memory, app tour, drop set UI, Pro gating, billing/marketing redesign, PRO badge fix, awards 100%, network stability

## Known Issues
- RevenueCat MOCKED in Expo Go (production-ready code is in place, needs EAS build to test real purchases)
- Tunnel URL changes on pod restart (update .env, env.ts, app.config.js)
- Video inconsistency fix awaiting user verification

## Remaining / Backlog
- [ ] User testing feedback round
- [ ] Real RevenueCat purchase testing (requires EAS Development Build)
- [ ] App Store / Play Store submission prep
