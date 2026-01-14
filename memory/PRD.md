# Thryvin AI Fitness Coach - Product Requirements Document

## What's Been Implemented

### Jan 14, 2025 - P2 Exercise Detail & Stats List (VERIFIED)

#### ✅ P2.1: Exercise Click-Through & Detail View
- **Backend**: Enhanced `GET /api/stats/exercise/:exerciseId` endpoint
  - Returns `lastSession` with individual sets (setNumber, weight, reps, volume, rpe)
  - Returns `pbs` with maxWeight, maxReps, maxVolume, estimatedOneRM (Epley formula)
  - Returns `history` array (last 5 sessions) with date, maxWeight, totalVolume
  - Returns `trend` (up/down/neutral) based on recent performance
- **Frontend**: Updated `ExerciseStatsModal.tsx`
  - New "Last Session" card showing all sets from most recent workout
  - Updated PB section to show Max Weight, Max Volume, Est. 1RM
  - Exercises in summary modal are clickable (already implemented)
- **Acceptance Test**: Exercise detail returns lastSession + pbs + history ✅

#### ✅ P2.2: Stats List Correctness  
- **Backend**: Enhanced `GET /api/stats/exercises` endpoint
  - Returns `hasPerformed: true` for all exercises user has logged
  - Groups by exerciseId (not name) to avoid duplicates
  - Returns exerciseId, exerciseName, maxWeight, totalSets, lastPerformed
- **Acceptance Test**: Stats list shows user's exercises with hasPerformed flag ✅

#### All P2 Acceptance Tests Passed (11/11):
1. ✅ Complete workout with 2 exercises + 3 sets
2. ✅ Summary shows volume > 0 (2280kg)
3. ✅ Exercise Detail returns lastSession + pbs + history
4. ✅ Stats list returns hasPerformed=true for all exercises
5. ✅ Pin from Exercise Detail persists correctly

---

### Jan 14, 2025 - P1 Critical Fixes (HARD AUDIT Results)

#### ✅ CRITICAL FIX 1: WorkoutId Mismatch (P0 - VERIFIED)
- **Issue**: `logSetToBackend` in `workout-hub.tsx` was generating NEW workoutId per set call instead of using `activeSession.workoutId`
- **Root Cause**: Fallback logic `currentWorkout?.id || workout_${Date.now()}` was orphaning set data
- **Fix**: Modified `logSetToBackend` to use `activeSession?.workoutId` as the single source of truth
- **Acceptance Test**: Log 3 sets → All share same workoutId → Summary shows volume=2150, exerciseCount=2, totalSets=3 ✅

#### ✅ CRITICAL FIX 2: Favorites Pinning Broken (P0 - VERIFIED)
- **Issue**: `PUT /api/stats/favorites` was failing with SQL syntax error
- **Root Cause**: `favoriteExercises` column didn't exist in users table + JSON serialization was wrong
- **Fix**: 
  - Added `favoriteExercises: text("favorite_exercises")` to schema
  - Ran DB migration to add column
  - Fixed PUT/GET to properly serialize/deserialize JSON array
- **Acceptance Test**: PUT 3 favorites → GET returns persisted data ✅

### Jan 14, 2025 - Earlier Fixes

#### Auth Token Key Fix
- **Issue**: workout-hub.tsx was using `auth_token` but app uses `thryvin_access_token`
- **Fix**: Changed to `thryvin_access_token` - sets now properly save to `performance_logs`
- **Result**: Summary now correctly shows exercises count, sets, and volume

#### Exercise Categories with Expanded Keywords
- **Weights**: 1077 exercises (cables, dumbbells, barbells, machines, etc.)
- **Calisthenics**: 587 exercises (bodyweight)
- **Flexibility**: 127 exercises (stretch, yoga, recovery, warmup)
- **Cardio**: 28 exercises

#### Summary Card Updated
- Shows "exercises" count (not "sets")
- Volume calculated correctly from logged data
- Click exercise → opens exercise stats modal

#### Category Naming Standardized
- Explore Workouts: "Strength" → "Weights"
- Exercise Stats: "Bodyweight" → "Calisthenics"

#### Pin Favorites
- Limited to 3 exercises max
- Alert shows when trying to add 4th (replaces oldest)
- Same component on homepage and stats page

### Backend Testing Results (Verified)
```
Workout ID: live_test_1768409348
Logged 5 sets of Lat Pulldown
Summary returned:
- Exercises: 1 ✅
- Total Sets: 5 ✅  
- Total Volume: 3200 kg ✅
```

## Key Files Modified
- `/app/apps/native/app/workout-hub.tsx` - Fixed auth token key
- `/app/apps/native/src/components/ExerciseStatsModal.tsx` - Expanded keywords
- `/app/apps/native/src/components/ExploreWorkoutsModal.tsx` - "Strength"→"Weights"
- `/app/apps/native/src/components/WorkoutDetailsModal.tsx` - "exercises" label

## Data Flow
```
User logs set in workout-hub → POST /api/workout/log-set (with thryvin_access_token)
                             → performance_logs table
                             → Summary API reads from performance_logs
                             → Returns correct exercises, sets, volume
```

## Pending
- [ ] PR Celebration Animation
- [ ] Fix exercise IDs showing in Explore Workout display
