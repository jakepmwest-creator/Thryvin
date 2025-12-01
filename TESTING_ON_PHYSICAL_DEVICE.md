# Testing Thryvin on Physical Android Device

## Changes Made ✅

### 1. Environment Variable
- Created `EXPO_PUBLIC_API_BASE_URL` in `/app/apps/native/.env`
- Set to: `https://fit-tracker-231.preview.emergentagent.com`

### 2. Files Updated (8 files)
All localhost references replaced with `process.env.EXPO_PUBLIC_API_BASE_URL`:

- ✅ `/app/apps/native/src/stores/workout-store.ts`
- ✅ `/app/apps/native/src/stores/auth-store.ts`
- ✅ `/app/apps/native/src/components/WorkoutDetailsModal.tsx`
- ✅ `/app/apps/native/app/(tabs)/social.tsx`
- ✅ `/app/apps/native/app/(tabs)/index.tsx`
- ✅ `/app/apps/native/app/(auth)/forgot-password.tsx`
- ✅ `/app/apps/native/app/active-workout-new.tsx`
- ✅ `/app/apps/native/lib/api.ts`

### 3. Enhanced Logging
Added detailed console logs to track:
- API base URL being used
- Full request URLs
- Network errors with context
- Response status codes

## How to Test on Your Physical Device

### Step 1: Pull Latest Changes
```bash
git pull origin main
```

### Step 2: Install Dependencies (if needed)
```bash
cd /app/apps/native
npm install
# or
yarn install
```

### Step 3: Start Expo with Tunnel
```bash
cd /app/apps/native
npx expo start --tunnel
```

This will:
- Create a tunnel URL for your app
- Generate a QR code
- Make the app accessible from anywhere

### Step 4: Open on Your Phone
1. Open Expo Go app on your Android device
2. Scan the QR code
3. App will load and connect to backend via the preview URL

### Step 5: Test the Workout Generation
1. Click "Quick Test Login" button
2. App should navigate to home screen
3. Check console logs for these messages:
   ```
   📱 [HOME] EXPO_PUBLIC_API_BASE_URL: https://fit-tracker-231.preview.emergentagent.com
   🤖 [WORKOUT] Calling AI API...
   🤖 [WORKOUT] Full URL: https://fit-tracker-231.preview.emergentagent.com/api/workouts/generate
   ✅ [WORKOUT] AI workout generated: Monday Muscle Gain Workout
   ```

4. Today's Workout card should show:
   - Correct workout title (Monday if today is Monday)
   - Number of exercises (should be 9)
   - NOT "Loading..." or "0 exercises"

5. Click the workout card to open modal
   - Should show correct day name
   - Should show exercise list with details
   - NOT showing Wednesday

## Troubleshooting

### If you see "Failed to generate workout":

**Check Console Logs:**
Look for error details like:
```
❌❌❌ [WORKOUT] FULL ERROR DETAILS:
   Type: Error
   Message: [error message]
```

**Common Issues:**

1. **Network Error / Cannot fetch**
   - Backend preview URL might not be accessible
   - Check if backend is running: `curl https://fit-tracker-231.preview.emergentagent.com/api/health`

2. **404 Error**
   - Backend routing issue
   - Kubernetes ingress not configured for `/api` routes

3. **CORS Error**
   - Backend needs to allow requests from Expo tunnel URL
   - Should be fixed already (CORS is set to `origin: true`)

### If backend preview URL doesn't work:

**Temporary Solution - Use Your Computer's IP:**

1. Find your computer's local IP:
   - Mac: `ifconfig | grep inet`
   - Windows: `ipconfig`
   - Linux: `hostname -I`

2. Update `.env`:
   ```
   EXPO_PUBLIC_API_BASE_URL=http://YOUR_IP:8001
   ```

3. Make sure your phone and computer are on the same WiFi network

4. Restart Expo: `npx expo start --tunnel`

## Expected Behavior

✅ App connects to backend via public URL
✅ AI generates workout based on user profile
✅ Today's workout shows correct day (Monday, Tuesday, etc.)
✅ Workout has 9+ exercises with video URLs
✅ Modal shows generated workout, not static data
✅ No Wednesday bug anymore

## Verification Commands

Test backend is accessible:
```bash
# Health check
curl https://fit-tracker-231.preview.emergentagent.com/api/health

# Generate workout
curl -X POST https://fit-tracker-231.preview.emergentagent.com/api/workouts/generate \
  -H "Content-Type: application/json" \
  -d '{"userProfile":{"experience":"intermediate","fitnessGoals":["muscle-gain"],"sessionDuration":45},"dayOfWeek":0}'
```

Both should return JSON responses, not 404.
