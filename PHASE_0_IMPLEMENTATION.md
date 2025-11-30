# Phase 0 - Stabilization Implementation Plan

## Current State Analysis

### What Works
- ✅ Database schema exists (`workoutDays` table)
- ✅ AI workout generator exists (`generateAIWorkout`)
- ✅ Frontend has workout store
- ✅ Calendar UI exists

### What's Broken
- ❌ Backend uses in-memory storage (not DB)
- ❌ Generation is stubbed (doesn't actually call AI)
- ❌ No error handling or logging
- ❌ Frontend doesn't show generation errors
- ❌ Calendar doesn't read from DB

---

## Ticket 1: Fix AI Week Generation + Logging

### Backend Changes
1. **Remove in-memory storage** - Use actual DB
2. **Implement real AI generation** - Call `generateAIWorkout` for each day
3. **Add comprehensive logging** with:
   - User ID
   - User profile/goals
   - Request payload
   - Error details (if any)
4. **Add error states** in `workoutDays` table

### Frontend Changes
1. **Show loading state** during generation
2. **Show error UI** if generation fails
3. **Add retry button** on error
4. **Show toast** on success

---

## Ticket 2: Persist Generated Program in DB

### Data Model
```
Program (week)
  ├─ Week metadata (start date, user_id)
  └─ Days (7)
      └─ WorkoutSession
          ├─ Overview
          ├─ Target muscles
          └─ Exercises[]
              ├─ Name
              ├─ Sets
              ├─ Reps
              ├─ Rest time
              ├─ Video URL
              └─ Category
```

### Implementation
- Store full workout JSON in `workoutDays.payloadJson`
- Status flow: `pending → generating → ready | error`
- Never re-generate unless user explicitly requests

---

## Ticket 3: Wire Calendar to Stored Data

### Changes
1. Calendar fetches from `workoutDays` table
2. Shows status indicators (completed, pending, rest)
3. Tapping a day opens the correct workout from DB
4. No mock data

---

## Success Criteria
✅ New user: Onboarding → Login → Home → Week generates → Workout opens → Mark done
✅ No manual fixes needed
✅ Clear error messages if something fails
✅ Data persists across app restarts
