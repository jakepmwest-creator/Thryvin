# Schedule/Calendar Consistency Bug Diagnosis

## ROOT CAUSES IDENTIFIED

### 1. Date Format Inconsistency (CRITICAL)
**Location**: Multiple files use different date formats for comparison
- `workout-store.ts`: Uses `date.toISOString()` → "2026-01-09T00:00:00.000Z"
- `workouts.tsx`: Uses `date.toDateString()` → "Thu Jan 09 2026"  
- This causes UTC vs local timezone mismatches

### 2. ViewAllWeeksModal Uses Array INDEX, Not Date Matching (CRITICAL)
**Location**: `/app/apps/native/src/components/ViewAllWeeksModal.tsx` line 53
```javascript
const workout = weekWorkouts[dayIndex]; // WRONG - uses array position
```
**Problem**: Assumes array position 0 = Monday Week 1, but the actual workout's date field might be different if workouts were generated on different days or reordered.

### 3. Skip Day REMOVES Entry Instead of Converting to REST (CRITICAL)
**Location**: `/app/apps/native/src/stores/workout-store.ts` line 1384
```javascript
return workoutDate.toDateString() !== dateStr; // FILTERS OUT - removes the day!
```
**Problem**: This deletes the calendar entry entirely instead of marking it as rest.

### 4. Week Start Calculation Drift
**Problem**: Each component calculates "Monday of this week" independently. If the app runs across midnight or different timezones, calculations can drift.

### 5. Backend Returns Day-Keyed Object, Frontend Expects Array
**Location**: `/app/server/routes.ts` line 1708
```javascript
return res.json({ status: "ready", workouts: normalizedWorkouts }); // Object keyed by day name
```
**Problem**: Frontend `syncFromBackend` expects `data.workouts` to be an array of 21 workouts with date fields.

## FILES THAT NEED CHANGES

1. `/app/apps/native/src/stores/workout-store.ts` - Fix date handling, skip day logic
2. `/app/apps/native/src/components/ViewAllWeeksModal.tsx` - Match by date not index
3. `/app/apps/native/src/components/EditPlanScreen.tsx` - Match by date not index  
4. `/app/apps/native/app/(tabs)/workouts.tsx` - Already uses date matching (OK)
5. `/app/server/routes.ts` - Ensure backend returns consistent date format

## SOLUTION APPROACH

A) Create utility function `toLocalDateString(date)` → "YYYY-MM-DD" used everywhere
B) All components lookup workouts by `workout.date.split('T')[0]` === targetDateString
C) Skip day sets `isRestDay: true, title: 'Rest Day'` instead of removing
D) Rolling 21-day ensure function that fills gaps
