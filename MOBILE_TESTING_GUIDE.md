# Thryvin Mobile App Testing Guide

## Current Problem
The mobile app cannot reach the backend API, resulting in "Failed to generate workout" errors.

## Root Cause
Mobile devices cannot access `localhost` or internal Kubernetes IPs. The backend is running on port 8001 inside the container, but there's no public URL routing to it yet.

## Backend Status
✅ Backend is running correctly on `http://localhost:8001`
✅ AI workout generation works (tested via curl)
✅ Returns proper data with exercises and video URLs

## Testing Options

### Option 1: Test on Emulator/Simulator (RECOMMENDED)
Emulators can reach localhost:

**iOS Simulator:**
```bash
cd /app/apps/native
npx expo start --ios
```

**Android Emulator:**
```bash
cd /app/apps/native
npx expo start --android
```

The app will connect to `http://localhost:8001` which works from emulators.

### Option 2: Use Expo Tunnel (For Physical Device)
Create a public tunnel to your backend:

```bash
cd /app/apps/native
npx expo start --tunnel
```

This creates a public URL like `https://abc123.ngrok.io` that your phone can reach.
Then update `/app/apps/native/.env`:
```
EXPO_PUBLIC_API_URL=<tunnel_url>
```

### Option 3: Same Network Testing (For Physical Device)
If testing on physical device on same WiFi:

1. Find your computer's local IP:
   - Mac/Linux: `ifconfig | grep inet`
   - Windows: `ipconfig`
   
2. Update `/app/apps/native/.env`:
```
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:8001
```

3. Start Expo:
```bash
cd /app/apps/native
npx expo start
```

## Verifying Connection

When the app starts, check the Expo console for these logs:

```
📱 [HOME] App starting...
📱 [HOME] EXPO_PUBLIC_API_URL: http://localhost:8001
🤖 [WORKOUT] Calling AI API...
🤖 [WORKOUT] API URL: http://localhost:8001
```

If you see network errors:
```
❌❌❌ [WORKOUT] FULL ERROR DETAILS:
   🌐 NETWORK ERROR: Cannot reach backend
```

This means the device cannot reach the backend URL.

## Quick Backend Test

Test if backend is accessible from your device:

```bash
# From your device's browser, visit:
http://YOUR_IP:8001/api/health

# Should return:
{"ok":true,"aiReady":true,...}
```

## Files Modified for Better Errors
- `/app/apps/native/src/stores/workout-store.ts` - Added detailed error logging
- `/app/apps/native/app/(tabs)/index.tsx` - Added API URL logging
- `/app/apps/native/.env` - Updated with instructions

## Next Steps After Connection Works
Once the app can reach the backend:
1. Click "Quick Test Login" button
2. App will generate AI workout for today (Monday)
3. You should see proper workout title and exercise count
4. Modal should show Monday's workout, not Wednesday
5. All exercises should have video URLs
