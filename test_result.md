# Thryvin - Coach Action System Fixes

## Test Summary
**Date**: 2026-01-07
**Focus**: Fix 401 auth errors, day detection, and UI button count
**Status**: ✅ FIXES APPLIED - Ready for User Testing

---

## Fixes Applied

### 1. QuickActionsDrawer.tsx - 3 Primary Buttons Only
- Changed from 4 primary buttons to 3 (Swap Days, Add Workout, Edit)
- "Harder" moved to secondary/expanded view
- All 13 total buttons available in expanded view

### 2. FloatingCoachButton.tsx - Auth Token & Day Detection
- **Added auth token support**: Uses `SecureStore.getItemAsync('auth_token')` for all action API calls
- **Fixed day detection**: When user types just "Thursday" after being asked "Which day?", it now correctly detects and sets up the action
- **Fixed action API calls**: Using correct `REGENERATE_SESSION` and `SKIP_DAY` action types with proper payload format

### 3. Date/Day Name Mismatch Fix
- **index.tsx**: Fixed date comparison using YYYY-MM-DD format to avoid timezone issues
- **ViewAllWeeksModal.tsx**: Fixed "isToday" calculation to correctly handle all days including Sunday

---

## API Tests (All Passing ✅)

```bash
# Skip Thursday
curl -X POST /api/coach/actions/execute -d '{"action":{"type":"SKIP_DAY","dayOfWeek":"thursday"}}'
# Result: ✅ OK

# Regenerate Wednesday
curl -X POST /api/coach/actions/execute -d '{"action":{"type":"REGENERATE_SESSION","dayOfWeek":"wednesday"}}'
# Result: ✅ OK

# All actions now use Bearer token authentication
```

---

## User Testing Needed

1. **Quick Actions Drawer**: Verify only 3 buttons visible (Swap Days, Add Workout, Edit)
2. **Skip Day Flow**: Type "skip day" → "Thursday" → Should work without 401 error
3. **Harder/Easier/Shorter/Longer**: Should regenerate workout without auth errors
4. **Day Names**: Verify today's workout shows correct day name

---

## Files Changed
- `/app/apps/native/src/components/QuickActionsDrawer.tsx`
- `/app/apps/native/src/components/FloatingCoachButton.tsx`
- `/app/apps/native/src/components/ViewAllWeeksModal.tsx`
- `/app/apps/native/app/(tabs)/index.tsx`
