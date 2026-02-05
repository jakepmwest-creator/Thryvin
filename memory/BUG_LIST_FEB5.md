# 📋 THRYVIN BUG & FEATURE LIST (Feb 5, 2026)

## 🔴 **CRITICAL BUGS (App Broken)**

| # | Issue | Details |
|---|-------|---------|
| 1 | **Awards/Badges DISCONNECTED** | Messaged coach, completed workout, edited workout, did reps - ZERO badges triggered |
| 2 | **AI Coach Can't Read Data** | Asked "What's my best for dumbbell press?" → "No data yet" (just did it!) |
| 3 | **Profile Shows Wrong Level** | Shows "Intermediate" but user selected "Advanced" |
| 4 | **Profile Shows Wrong Date** | Shows "December 2024" but should be "February 2026" |
| 5 | **Profile Picture Crashes** | Changing profile pic logs user out |
| 6 | **Max Weight Shows 0 Reps** | Did 12 reps but displays "0 reps" |

---

## 🟠 **HIGH PRIORITY (Core Functionality)**

| # | Issue | Details |
|---|-------|---------|
| 7 | **Specific Training Days Ignored** | User selected specific days → App ignores and uses generic Wed/Sat rest |
| 8 | **3 Weeks Starts From Wrong Day** | Started Thursday (5th) → App generated from Monday. Should be 21 days from signup date |
| 9 | **Workout Plan Quality Bad** | Too many legs, chest repeated, back-to-back same muscles, doesn't follow advanced questionnaire |
| 10 | **Video Inconsistency** | Pull-up exercise showed pike push-up video |
| 11 | **Explore Workouts Wrong Data** | "Weights: 0 exercises", "Calisthenics: 787" but includes weighted exercises |
| 12 | **Muscle Distribution Not Working** | Stats page not showing muscle data |

---

## 🟡 **MEDIUM PRIORITY (UX Improvements)**

| # | Issue | Details |
|---|-------|---------|
| 13 | **Exercise Detail Modal Redesign** | Move "Pin to Favorites" next to title, Remove "Stable" label, Top = "Last Session" in GREEN, Compare to "Best Session" not last, Show 1RM/3RM/5RM estimates, Session history = dropdown with dates, More purple-to-pink gradient |
| 14 | **Weight/Reps Number Scroller** | Add iOS-style scroll wheel picker (can still type) |
| 15 | **Coach Chat UI** | Whole box should move up when typing, not squash in middle |
| 16 | **Coach Reveal Buttons** | Should be on white background for visibility |
| 17 | **Progress Circles Direction** | Should start from TOP and go round, not from left |
| 18 | **Onboarding Keyboard UI** | Same fix as coach chat - box moves up when typing |

---

## 🆕 **NEW ITEMS (Just Added)**

| # | Issue | Details |
|---|-------|---------|
| 19 | **Profile: Weight & Height Fields** | Add editable current weight + height for BMI/VO2 max calculations |
| 20 | **Coach Suggestion Box (During Workout)** | Too close to input box, Should say "No suggestion" if none, Make Thryvin style, Allow using OR modifying suggestion |

---

## 🟢 **FUTURE FEATURES**

| # | Feature | Details |
|---|---------|---------|
| 21 | **Rolling Regeneration** | At 2 weeks in (1 week left), mini questionnaire: "What days work next 2 weeks?", "What went well?", "What didn't go well?", "What can I improve?" Then regenerate next period |

---

## **Priority Order for Fixing:**
1. Awards/Badges (completely broken)
2. AI Coach data access (core feature)
3. Profile data (level, date, picture)
4. Scheduling (specific days, start date)
5. Workout plan quality
6. Exercise detail modal redesign
7. UX improvements
