# Thryvin AI Fitness Coach - Product Requirements Document

## Original Problem Statement
AI fitness coaching app with workout generation, exercise videos, coach chat, badge/awards system, billing/subscriptions, and social features.

## Architecture
- Backend: Express.js + TypeScript on port 8001 (Neon PostgreSQL)
- Frontend: React Native / Expo  
- AI: OpenAI GPT-4o for coach and workout generation
- Video hosting: Cloudinary
- Subscriptions: RevenueCat (MOCKED in Expo Go)
- Dev tunnel: Cloudflare Tunnel

## What's Been Implemented

### Feb 13, 2026 - Exercise Video Fix + Billing Pricing Update

#### Exercise Video Matching (P0 - FIXED & TESTED)
- **Root Cause**: AI generated exercise names not matching DB exactly (e.g. "Incline Dumbbell Press" vs "Dumbbell Incline Bench Press"). Previous fuzzy matching made it WORSE by mapping to wrong exercises.
- **Fix**:
  1. Updated `ai-workout-generator.ts` to load ALL 1806 exercise names from DB and include them in the AI prompt with strict instructions: "You MUST use EXACT exercise names from the EXERCISE DATABASE. Do NOT rephrase or reorder words."
  2. Removed fuzzy matching from `GET /api/exercises` endpoint in `routes.ts` - now exact match only
  3. Removed fuzzy matching from frontend `workout-hub.tsx` - now exact match only
- **Files Changed**: `ai-workout-generator.ts`, `routes.ts`, `workout-hub.tsx`
- **Testing**: 16/16 tests passed. Critical test verified: "Incline Dumbbell Press" does NOT match "Dumbbell Incline Bench Press"

#### Billing Page Pricing Update (P0 - FIXED & TESTED)
- Removed 3-month plan entirely
- Updated yearly plan: £74.99/year (22% discount, £6.25/mo equiv)
- Yearly plan now marked as "Best Value" (popular: true)
- Default selection changed to yearly
- **Files Changed**: `billing.tsx`
- **Testing**: 6/6 code review tests passed

### Previous Sessions (Summary)
- AI Coach personality overhaul (removed keyword filter, more conversational)
- Billing page creation with legal links
- Network error fixes (stale tunnel URLs)
- Profile cleanup (removed PIN code, Coach Style)
- Badge/award tracking wired up
- Rolling regeneration system
- Workout persistence fixes
- Coach stats query capability
- Training days scheduling
- And more (see CHANGELOG for full history)

## Pending / In Progress
- [ ] Awards/Badges system verification by user (P1)
- [ ] App Tour / Onboarding re-implementation (P1)
- [ ] Special Set Type UI (Drop Sets, Super Sets) display (P2)

## Backlog / Future
- [ ] Coach Memory Enhancement (P2) - persistence for past conversations
- [ ] Finalize Marketing Copy on Pro page (P3)
- [ ] Full RevenueCat Native Integration (P3) - Expo Development Build required
- [ ] Expo Development Build for real purchases (P3)

## Known Issues
- RevenueCat in-app purchases are MOCKED in Expo Go
- OpenAI API key may be rate-limited
