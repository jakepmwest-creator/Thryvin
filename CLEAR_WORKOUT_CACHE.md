# Clear Workout Cache - Regenerate with Specific Exercise Names

## Why Clear the Cache?

Your cached workouts were generated BEFORE I updated the AI to use specific exercise names. The new AI now generates:
- ✅ "Barbell Bent Over Row" (not "Bent Over Row")
- ✅ "Cable Chest Fly" (not "Chest Fly")  
- ✅ "Dumbbell Hammer Curl" (not "Hammer Curl")

To get workouts with the new specific names, you need to clear the cache.

## How to Clear (2 Options)

### Option 1: Via App (Easiest)
1. Open the app
2. Go to Settings (if available) or Profile
3. Look for "Regenerate Workouts" or "Clear Workout Cache"
4. Tap it

### Option 2: Manual Cache Clear
Since the workouts are stored in Expo SecureStore on your device:

**On your device:**
1. Force close the Thryvin app completely
2. Clear app data (or uninstall/reinstall the app)
3. Reopen the app and login
4. Workouts will regenerate with new specific names

### Option 3: Via Expo Dev Menu (Best for Testing)
1. Shake your device to open Expo dev menu
2. Tap "Reload"
3. When app reloads, the workout store has a `forceRegenerateWeek()` function

I can add a button to the UI to do this automatically if you'd like!

## What You'll See After Clearing

New workouts will have specific names like:
- "Barbell Deadlift"
- "Dumbbell Bench Press"
- "Cable Tricep Pushdown"
- "Bodyweight Push-Up"
- etc.

This matches the video names better, so you won't see "Bent Over Row" with a cable video anymore!
