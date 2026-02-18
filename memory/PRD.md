# Thryvin AI Fitness Coach - PRD

## Architecture
- Backend: Express.js + TypeScript (Neon PostgreSQL)
- Frontend: React Native / Expo
- AI: OpenAI GPT-4o (coach, workout gen), GPT-4o-mini (memory summaries)
- Video: Cloudinary | Subscriptions: RevenueCat (MOCKED) | Tunnel: Cloudflare

## Implemented (Feb 17-18, 2026)

### Batch 5: Coach Compassion + Tour + Paywall + Special Sets (Feb 18)
1. **P1 — AI Coach Compassion** — Added detailed empathy directives to system prompt: validates feelings first, shares relatable perspective, offers gentle options. Never dismissive or pushy. Increased max tokens to 1000 for richer responses. Uses conversation memory naturally.
2. **P2 — Tour Improvements** — Compact tooltip (smaller padding, font, icon), 9 steps including in-workout guidance. Tour card doesn't block screen as much.
3. **P2 — Pro/Paywall UI Thriven Style** — Dark plan cards on billing page (£ white on black). Pro comparison: Standard looks boring (gray, remove-circle icons), Pro looks premium (dark card, gradient header, checkmark icons, "3 WEEKS FREE" badge). Paywall modal: matching dark pricing card with trial tag. Features list consistent across all 3 surfaces.
4. **P2 — Advanced Questionnaire Pro-Gated** — Only shows for Pro users on home screen.
5. **P2 — Special Set AI Integration** — Already present in ai-workout-generator.ts prompt (drop/super/giant set types). Confirmed working in tests.
6. **Code cleanup**: Removed duplicate `db` import in ai-coach-service.ts.

### Batch 4: Bug Fixes + Explore Redesign (Feb 17)
1. todayWorkoutRef crash fix (P0)
2. Workout regeneration guard (P0)
3. Explore Workouts tile layout redesign (P1)
4. Awards bottom padding (P3)
5. Liked/Disliked button styling

### Earlier Batches
- Video fuzzy matching removal, coach memory, app tour, drop set UI, Pro gating, billing/marketing redesign, PRO badge fix, awards 100%, network stability

## Remaining / Backlog
- [ ] **P2 — Onboarding Paywall Screen** — After coach selection in signup flow, show Pro vs Standard choice screen with 3-week free trial for Pro
- [ ] **P3 — Marketing Copy Review** — User to approve pro.tsx copy
- [ ] **P3 — Full RevenueCat Integration** — Needs Expo Dev Build
- [ ] **P3 — Badge end-to-end verification**

## Known Issues
- RevenueCat MOCKED in Expo Go
- Tunnel URL changes on pod restart (update .env, env.ts fallback, app.config.js)
- Video inconsistency fix awaiting user verification
