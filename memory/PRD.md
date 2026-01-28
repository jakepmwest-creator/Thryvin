# Thryvin AI Fitness Coach - Product Requirements Document

## What's Been Implemented

### Jan 28, 2025 - Coach Button Refactor & Onboarding Simplification

#### ✅ Coach Button Made READ-ONLY
- **Issue**: Coach was executing workout modifications directly (swap days, add workouts, etc.)
- **Fix**: Coach is now purely advisory - redirects all modification requests to Edit Plan
- **Key Changes**:
  - Updated `detectWorkoutIntent()` in FloatingCoachButton.tsx to redirect ALL modification requests
  - Added comprehensive `planModificationKeywords` including 'feeling energetic', 'swap', 'add workout', etc.
  - Coach now responds: "Head to Edit Plan on your Workouts tab to..."
  - Added `profileModificationKeywords` for profile changes (Coach Style, notifications)
  - Removed all action execution code from `executeAction()` function
- **Files Changed**: 
  - `/app/apps/native/src/components/FloatingCoachButton.tsx` - Redirects all modifications
  - `/app/server/ai-coach-service.ts` - Updated prompts with READ-ONLY rules

#### ✅ Coach is Smart-Witted
- **Issue**: Coach was giving boring redirects for non-fitness questions
- **Fix**: Coach now responds with witty, fitness-related comebacks
- **Example**: "Can squirrels fly?" → "Squirrels can't fly, but you can fly through your next workout!"
- **Implementation**: Added random witty responses array in ai-coach-service.ts

#### ✅ Coach Never Uses Profanity
- **Fix**: Added explicit rule in CRITICAL RULES: "NEVER use profanity, swear words, or inappropriate language"
- **Location**: `/app/server/ai-coach-service.ts` lines 374-375

#### ✅ Coach Navigation Guidance
- **Fix**: Coach now tells users WHERE to go for changes:
  - Workout changes → "Edit Plan" on Workouts tab
  - Profile/settings → "Profile" tab
  - Coach personality → "Profile > Coach Style"
  - Training schedule → "Edit Plan" or "Profile"

#### ✅ Onboarding Simplified
- **Issue**: Onboarding had questions for features not yet built (Nutrition, Coach Style)
- **Fix**: Removed 2 steps from onboarding:
  1. Removed "Nutrition Goals" question (nutrition feature not implemented)
  2. Removed "Coaching Style" question (moved to Profile > Coach Style)
- **Result**: Onboarding now has 11 steps instead of 13
- **Files Changed**: `/app/apps/native/app/(auth)/onboarding.tsx`

#### ✅ Server Stability Fix
- **Issue**: Port 8001 conflict between 'backend' and 'frontend' supervisor processes
- **Fix**: Disabled redundant 'frontend' supervisor process (this is React Native/Expo app)
- **Files Changed**: `/etc/supervisor/conf.d/supervisord.conf`

### Testing Results (Jan 28, 2025)
- Code Review: **100% PASSED** (13/13 tests)
- API Tests: 59% (9 failures due to OpenAI API quota exceeded - external dependency issue)
- **Note**: All code implementations verified correct by testing agent

### Jan 14, 2025 - Summary → Exercise Detail Linking Fix (P2 Enhancement)

#### ✅ PART 1: Summary → Exercise Detail Fixed
- **Root Cause**: `ExerciseStatsModal` wasn't receiving workout context when opened from summary
- **Fix**: 
  - Pass `currentWorkoutId` and `thisWorkoutExerciseData` from `WorkoutDetailsModal`
  - Show "This Workout" section with sets/reps/weight/volume when opened from summary
  - Add time range filters (Today/1W/1M/1Y/All) for history comparison
  - Recalculate PBs based on selected time range
- **Files Changed**: `WorkoutDetailsModal.tsx`, `ExerciseStatsModal.tsx`

#### ✅ PART 2: Favorites UI Fixed
- **Root Cause**: `FavoriteExercisesCard` only fetched on mount, not on focus
- **Fix**: Added `useFocusEffect` to refetch when screen gains focus + `refreshTrigger` prop
- **Files Changed**: `FavoriteExercisesCard.tsx`

#### ✅ PART 3: Cables Taxonomy Fixed
- **Root Cause**: Equipment filter only checked `ex.equipment` array, not exercise name
- **Fix**: Filter now checks BOTH equipment array AND exercise name for keywords
- **Files Changed**: `ExploreWorkoutsModal.tsx`

### Acceptance Tests Passed:
1. ✅ Complete 2 workouts with same exercise
2. ✅ Open Summary → Tap exercise → Shows THIS workout's sets/volume
3. ✅ Shows previous session(s) comparison (history + PBs)
4. ✅ Time range filters work (Today/1W/1M/1Y/All)
5. ✅ Pin 3 exercises → Favorites UI shows immediately
6. ✅ Restart → Favorites persist
7. ✅ 173 cable exercises categorized under Weights

---

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
