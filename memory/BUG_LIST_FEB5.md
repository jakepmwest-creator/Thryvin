# 📋 THRYVIN BUG & FEATURE LIST (Feb 5, 2026)
## Updated: Feb 5, 2026 - Session 2

## 🔴 **CRITICAL BUGS (App Broken)**

| # | Issue | Details | Status |
|---|-------|---------|--------|
| 1 | **Awards/Badges DISCONNECTED** | Messaged coach, completed workout, edited workout, did reps - ZERO badges triggered | ✅ FIXED - Updated `updateBadgesAfterWorkout()` to use correct BadgeStats fields |
| 2 | **AI Coach Can't Read Data** | Asked "What's my best for dumbbell press?" → "No data yet" (just did it!) | ⏳ INVESTIGATING - getUserExerciseStats function exists, may need data in DB |
| 3 | **Profile Shows Wrong Level** | Shows "Intermediate" but user selected "Advanced" | ✅ FIXED - Added `getExperienceLevel()` to properly read experience field |
| 4 | **Profile Shows Wrong Date** | Shows "December 2024" but should be "February 2026" | ✅ FIXED - Added `getJoinDate()` to calculate from trialEndsAt |
| 5 | **Profile Picture Crashes** | Changing profile pic logs user out | ✅ FIXED - EditProfileModal now uses user-specific keys |
| 6 | **Max Weight Shows 0 Reps** | Did 12 reps but displays "0 reps" | ✅ FIXED - Added `repsAtMax` to workout summary API and UI |

---

## 🟠 **HIGH PRIORITY (Core Functionality)**

| # | Issue | Details | Status |
|---|-------|---------|--------|
| 7 | **Specific Training Days Ignored** | User selected specific days → App ignores and uses generic Wed/Sat rest | ❌ NOT STARTED |
| 8 | **3 Weeks Starts From Wrong Day** | Started Thursday (5th) → App generated from Monday. Should be 21 days from signup date | ❌ NOT STARTED |
| 9 | **Workout Plan Quality Bad** | Too many legs, chest repeated, back-to-back same muscles, doesn't follow advanced questionnaire | ❌ NOT STARTED |
| 10 | **Video Inconsistency** | Pull-up exercise showed pike push-up video | ❌ NOT STARTED |
| 11 | **Explore Workouts Wrong Data** | "Weights: 0 exercises", "Calisthenics: 787" but includes weighted exercises | ❌ NOT STARTED |
| 12 | **Muscle Distribution Not Working** | Stats page not showing muscle data | ❌ NOT STARTED |

---

## 🟡 **MEDIUM PRIORITY (UX Improvements)**

| # | Issue | Details | Status |
|---|-------|---------|--------|
| 13 | **Exercise Detail Modal Redesign** | Move "Pin to Favorites" next to title, Remove "Stable" label, Top = "Last Session" in GREEN, Compare to "Best Session" not last, Show 1RM/3RM/5RM estimates, Session history = dropdown with dates, More purple-to-pink gradient | ❌ NOT STARTED |
| 14 | **Weight/Reps Number Scroller** | Add iOS-style scroll wheel picker (can still type) | ❌ NOT STARTED |
| 15 | **Coach Chat UI** | Whole box should move up when typing, not squash in middle | ❌ NOT STARTED |
| 16 | **Coach Reveal Buttons** | Should be on white background for visibility | ❌ NOT STARTED |
| 17 | **Progress Circles Direction** | Should start from TOP and go round, not from left | ❌ NOT STARTED |
| 18 | **Onboarding Keyboard UI** | Same fix as coach chat - box moves up when typing | ❌ NOT STARTED |

---

## 🆕 **NEW ITEMS (Just Added)**

| # | Issue | Details | Status |
|---|-------|---------|--------|
| 19 | **Profile: Weight & Height Fields** | Add editable current weight + height for BMI/VO2 max calculations | ❌ NOT STARTED |
| 20 | **Coach Suggestion Box (During Workout)** | Too close to input box, Should say "No suggestion" if none, Make Thryvin style, Allow using OR modifying suggestion | ❌ NOT STARTED |

---

## 🟢 **FUTURE FEATURES**

| # | Feature | Details | Status |
|---|---------|---------|--------|
| 21 | **Rolling Regeneration** | At 2 weeks in (1 week left), mini questionnaire: "What days work next 2 weeks?", "What went well?", "What didn't go well?", "What can I improve?" Then regenerate next period | ❌ NOT STARTED |

---

## **Fixes Applied This Session:**
1. **Badge System Fix** (`workout-store.ts`): Updated `updateBadgesAfterWorkout()` to properly map fields to `BadgeStats` interface (totalCoachMessages, totalWorkoutEdits, etc.)
2. **Profile Level Fix** (`profile.tsx`): Added `getExperienceLevel()` function that properly reads and capitalizes the experience field
3. **Profile Join Date Fix** (`profile.tsx`): Added `getJoinDate()` function that calculates join date from `trialEndsAt - 7 days`
4. **Profile Picture Fix** (`EditProfileModal.tsx`): Now saves/loads profile image using user-specific keys (`profile_image_${userId}`)
5. **Workout Summary Reps Fix** (`routes.ts` & `workout-summary.tsx`): Added `repsAtMax` field to show how many reps were done at max weight
6. **Auth Store Update** (`auth-store.ts`): Added `trialEndsAt` and `fitnessLevel` to User interface and login data mapping

## **Priority Order for Next Session:**
1. AI Coach data access investigation
2. Scheduling logic (specific days, start date)
3. Workout plan quality
4. Explore/Stats data issues
5. UX improvements
