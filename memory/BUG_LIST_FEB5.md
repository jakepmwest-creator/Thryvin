# 📋 THRYVIN BUG & FEATURE LIST (Feb 5, 2026)
## Updated: Feb 5, 2026 - Session 2 - Final

## 🔴 **CRITICAL BUGS (App Broken)**

| # | Issue | Details | Status |
|---|-------|---------|--------|
| 1 | **Awards/Badges DISCONNECTED** | Messaged coach, completed workout, edited workout, did reps - ZERO badges triggered | ✅ FIXED - Updated `updateBadgesAfterWorkout()` to use correct BadgeStats fields |
| 2 | **AI Coach Can't Read Data** | Asked "What's my best for dumbbell press?" → "No data yet" (just did it!) | ✅ FIXED & TESTED - Coach now reads from performance_logs and reports actual max weight |
| 3 | **Profile Shows Wrong Level** | Shows "Intermediate" but user selected "Advanced" | ✅ FIXED - Added `getExperienceLevel()` to properly read experience field |
| 4 | **Profile Shows Wrong Date** | Shows "December 2024" but should be "February 2026" | ✅ FIXED - Added `getJoinDate()` to calculate from trialEndsAt |
| 5 | **Profile Picture Crashes** | Changing profile pic logs user out | ✅ FIXED - EditProfileModal now uses user-specific keys |
| 6 | **Max Weight Shows 0 Reps** | Did 12 reps but displays "0 reps" | ✅ FIXED - Added `repsAtMax` to workout summary API and UI |

---

## 🟠 **HIGH PRIORITY (Core Functionality)**

| # | Issue | Details | Status |
|---|-------|---------|--------|
| 7 | **Specific Training Days Ignored** | User selected specific days → App ignores and uses generic Wed/Sat rest | ✅ FIXED - Added `convertDayNamesToIndices()` to properly map day names to indices |
| 8 | **3 Weeks Starts From Wrong Day** | Started Thursday (5th) → App generated from Monday. Should be 21 days from signup date | ⏳ PARTIAL - Day conversion fixed, but weekly schedule still starts from Monday |
| 9 | **Workout Plan Quality Bad** | Too many legs, chest repeated, back-to-back same muscles, doesn't follow advanced questionnaire | ❌ NOT STARTED |
| 10 | **Video Inconsistency** | Pull-up exercise showed pike push-up video | ❌ NOT STARTED |
| 11 | **Explore Workouts Wrong Data** | "Weights: 0 exercises", "Calisthenics: 787" but includes weighted exercises | ❌ NOT STARTED |
| 12 | **Muscle Distribution Not Working** | Stats page not showing muscle data | ❌ NOT STARTED |

---

## ✅ **ENHANCEMENTS COMPLETED THIS SESSION**

| # | Enhancement | Details | Status |
|---|------------|---------|--------|
| A | **AI Coach Made ACTUALLY Helpful** | Coach now gives specific sets/reps/weights, explains 'why', provides 15+ form cues | ✅ TESTED - 19/19 tests passed |
| B | **Coach Reads User Stats** | Coach answers "What's my max bench?" with ACTUAL data from performance_logs | ✅ TESTED |
| C | **Coach Personalities Enhanced** | Titan (strength), Kai (calisthenics), Lumi (wellness) all give specialty advice | ✅ TESTED |
| D | **Preview URL Updated** | All frontend files updated to use new stable preview URL | ✅ DONE |

## 🟢 **FUTURE FEATURES**

| # | Feature | Details | Status |
|---|---------|---------|--------|
| 21 | **Rolling Regeneration** | At 2 weeks in (1 week left), mini questionnaire: "What days work next 2 weeks?", "What went well?", "What didn't go well?", "What can I improve?" Then regenerate next period | ❌ NOT STARTED |

---

## **Fixes Applied This Session (Feb 5, 2026):**

### Backend Fixes:
1. **Badge System Fix** (`workout-store.ts`): Updated `updateBadgesAfterWorkout()` to properly map fields to `BadgeStats` interface
2. **Workout Summary Reps Fix** (`routes.ts` & `workout-summary.tsx`): Added `repsAtMax` field to show reps at max weight
3. **Training Days Mapping** (`ai-workout-generator.ts`): Added `convertDayNamesToIndices()` function to convert day names ('mon', 'tue') to day indices (1, 2)

### Frontend Fixes:
4. **Profile Level Fix** (`profile.tsx`): Added `getExperienceLevel()` function that properly reads and capitalizes the experience field
5. **Profile Join Date Fix** (`profile.tsx`): Added `getJoinDate()` function that calculates join date from `trialEndsAt - 7 days`
6. **Profile Picture Fix** (`EditProfileModal.tsx`): Now saves/loads profile image using user-specific keys
7. **Auth Store Update** (`auth-store.ts`): Added `trialEndsAt` and `fitnessLevel` to User interface

### Testing:
- All 16 backend API tests PASSED (see `/app/test_reports/iteration_6.json`)
- Badge tracking API verified for all 8 actions
- Workout summary API verified with repsAtMax field
- User registration verified with experience level storage

---

## **Priority Order for Next Session:**
1. ~~Awards/Badges~~ ✅
2. AI Coach data access testing
3. ~~Profile data~~ ✅
4. ~~Scheduling (day conversion)~~ ✅
5. Workout plan quality
6. Explore/Stats data issues
7. UX improvements
