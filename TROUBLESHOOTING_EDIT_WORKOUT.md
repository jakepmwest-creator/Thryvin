# Troubleshooting: "Failed to find alternatives" Error

## Backend Status: ✅ WORKING

The backend API is fully functional and tested:

```bash
Test Results:
✅ POST /api/workouts/swap-exercise responds in 3-5 seconds
✅ Returns proper JSON with recommended + 3 alternatives
✅ Exercise names include specific equipment types
✅ OpenAI API key is configured correctly
✅ Response format is valid
```

## Issue: Mobile App Cannot Reach Backend

The error "Failed to find alternatives" means the mobile app's HTTP request is failing. This is typically caused by:

### 1. **Tunnel URL is incorrect or expired**
- Check `/app/apps/native/.env`
- Current value: `https://witty-shrimps-smile.loca.lt`
- Verify this URL is still active and pointing to port 8001

### 2. **Network connectivity issue**
- Mobile device might not be able to reach the tunnel URL
- Try accessing the tunnel URL directly in a browser on your device
- Should see the Thryvin web interface

### 3. **Tunnel is down**
- The localtunnel service might have crashed
- Check if tunnel process is running: `ps aux | grep localtunnel`
- Restart if needed: `npx localtunnel --port 8001`

## Quick Fix Steps

### Step 1: Check if tunnel is accessible
From your mobile device, open browser and go to:
```
https://witty-shrimps-smile.loca.lt
```

You should see the Thryvin app. If not, tunnel is down.

### Step 2: Check current tunnel URL
If tunnel is down, get the new URL:
```bash
# Kill old tunnel
pkill -f localtunnel

# Start new tunnel
npx localtunnel --port 8001
```

The command will output a new URL like:
```
your url is: https://xxxxx-yyyyy-zzzzz.loca.lt
```

### Step 3: Update mobile app .env
Edit `/app/apps/native/.env` and update:
```
EXPO_PUBLIC_API_BASE_URL=https://xxxxx-yyyyy-zzzzz.loca.lt
```

### Step 4: Rebuild and restart Expo
```bash
# Clear Expo cache
cd /app/apps/native
npx expo start --clear

# Or restart the app on your device
```

## Enhanced Error Messages

I've added better error logging to the mobile app. When you try to swap an exercise, check the console/logs for:

```
🔄 Calling AI to find alternatives...
   API URL: https://...
   Exercise: <exercise name>
   Reason: <reason>
   Response status: <HTTP status code>
```

This will help identify exactly what's failing.

## Alternative: Use Preview URL

If the tunnel keeps failing, you can try using the preview URL directly:
```
EXPO_PUBLIC_API_BASE_URL=https://ai-trainer-upgrade.preview.emergentagent.com
```

However, this might not work for mobile apps as it's designed for web preview.

## Backend Test Command

To verify backend is working:
```bash
curl -X POST "http://localhost:8001/api/workouts/swap-exercise" \
  -H "Content-Type: application/json" \
  -d '{
    "currentExercise": {
      "id": "test",
      "name": "Push Up",
      "sets": 3,
      "reps": "10",
      "category": "main"
    },
    "reason": "too-hard",
    "additionalNotes": "Too difficult",
    "userProfile": {"experience": "beginner"}
  }'
```

Expected: JSON response with `recommended` and `alternatives` arrays.
