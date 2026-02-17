# Thryvin AI Fitness Coach - PRD

## Architecture
- Backend: Express.js + TypeScript (Neon PostgreSQL)
- Frontend: React Native / Expo
- AI: OpenAI GPT-4o (coach, workout gen), GPT-4o-mini (memory summaries)
- Video: Cloudinary | Subscriptions: RevenueCat (MOCKED) | Tunnel: Cloudflare

## Implemented (Feb 13, 2026)

### Batch 3: Full Feature Round
1. **Video Inconsistency Fix (P0)** — Removed ALL fuzzy matching from `ai-workout-generator.ts` enrichment step. Only exact name match → correct video. AI prompt includes all 1806 exercise names.
2. **App Tour / Onboarding (P1)** — 8-step guided tour covering Home, Workouts (inc. Begin Workout flow), Stats, Awards, Profile. Tour lives in `_layout.tsx` and navigates between tabs. Auto-triggers on first launch, re-triggerable from Profile.
3. **Drop Set UI (P2)** — 3 drop rows with Weight + Reps inputs each. Data saved as "Drop set: 80x10 → 60x8 → 40x12" in notes.
4. **Coach Memory (P2)** — `coach_memory` DB table stores AI-summarized conversation summaries with mood detection. Loaded into system prompt on next chat. Saves asynchronously after each response.
5. **Marketing Copy (P3)** — Pro comparison hero: "Your training, your way". CTA: "Ready to level up?". Features updated, copy polished.

### Batch 2: Coach + Pro Gating + UI
- Coach canned response fix, Pro badge conditional, all edit paths gated, pricing updates, awards 100%, removed coach personality from features

### Batch 1: Exercise Videos + Billing
- Exact-only exercise matching, AI prompt with full DB, billing: 2 plans (monthly £7.99, yearly £74.99)

### Earlier Sessions
- Coach personality overhaul, billing page creation, network fixes, profile cleanup, badge tracking

## Remaining
- [ ] Full RevenueCat Native Integration (P3) — Needs Expo Dev Build
- [ ] Verify badges work end-to-end with user testing

## Known Issues
- RevenueCat MOCKED in Expo Go
- Tunnel URL changes on pod restart (update .env, env.ts fallback, app.config.js)
