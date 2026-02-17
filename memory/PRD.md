# Thryvin AI Fitness Coach - PRD

## Architecture
- Backend: Express.js + TypeScript (Neon PostgreSQL)
- Frontend: React Native / Expo
- AI: OpenAI GPT-4o (coach, workout gen), GPT-4o-mini (memory summaries)
- Video: Cloudinary | Subscriptions: RevenueCat (MOCKED) | Tunnel: Cloudflare

## Implemented (Feb 17, 2026)

### Batch 4: Bug Fixes + Explore Redesign
1. **todayWorkoutRef crash fix (P0)** — Added missing `useRef<View>` declaration for `todayWorkoutRef` in index.tsx that was causing "ref doesn't exist" crash after workout generation
2. **Workout regeneration guard (P0)** — Added early-return guard in `fetchWeekWorkouts` that skips regeneration if 21 workouts already exist in state for the current week
3. **Explore Workouts redesign (P1)** — Complete rewrite of ExploreWorkoutsModal with:
   - Dark theme tile layout (2-column grid)
   - Cloudinary video thumbnails on each tile
   - Single "Filter" button replacing difficulty tabs
   - Filter sheet modal for difficulty + equipment
   - Like/dislike buttons directly on tiles
   - Tap-to-expand exercise detail with video player, form tips
   - FlatList with virtualization for performance
4. **Awards bottom padding (P3)** — Increased from 32px to 120px for tab bar clearance
5. **Liked/Disliked button styling** — Heart + thumbs-down icons on workouts explore section

### Batch 3: Full Feature Round (Feb 13, 2026)
1. Video Inconsistency Fix (P0) — Removed ALL fuzzy matching
2. App Tour / Onboarding (P1) — 8-step guided tour
3. Drop Set UI (P2) — 3 drop rows
4. Coach Memory (P2) — conversation summaries
5. Marketing Copy (P3) — Pro comparison hero

### Batch 2: Coach + Pro Gating + UI
- Coach canned response fix, Pro badge conditional, edit paths gated, pricing updates, awards 100%

### Batch 1: Exercise Videos + Billing
- Exact-only exercise matching, AI prompt with full DB, billing: 2 plans

### Earlier Sessions
- Coach personality overhaul, billing page, network fixes, profile cleanup, badge tracking

## Remaining / Backlog
- [ ] **P1 — AI Coach Compassion** — Refine system prompt for empathy using conversation memory
- [ ] **P2 — Tour Expansion** — Steps inside active workout, tour before questionnaire, Pro-gate questionnaire
- [ ] **P2 — Special Set AI Integration** — Backend AI prompt to generate drop sets/supersets
- [ ] **P2 — Pro/Paywall UI** — Nicer plan boxes, matching paywall modal, onboarding paywall screen
- [ ] **P3 — Marketing Copy Review** — User to approve pro.tsx copy
- [ ] **P3 — Full RevenueCat Integration** — Needs Expo Dev Build
- [ ] **P3 — Badge end-to-end verification**

## Known Issues
- RevenueCat MOCKED in Expo Go
- Tunnel URL changes on pod restart (update .env, env.ts fallback, app.config.js)
- Video inconsistency fix awaiting user verification
