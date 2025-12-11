# Backend Public URL Fix for Mobile App

## Problem
The mobile app was getting **404 errors** when trying to reach the backend at:
```
https://thryvin-explore.preview.emergentagent.com/api/*
```

This preview URL routes to the Emergent marketing page, NOT the backend API.

## Solution: Localtunnel
Installed **localtunnel** to create a public tunnel to the backend on port 8001.

### Setup (Already Done)
```bash
# Install localtunnel
npm install -g localtunnel

# Start tunnel (running in background)
nohup lt --port 8001 > /tmp/localtunnel.log 2>&1 &

# Get the public URL
cat /tmp/localtunnel.log
# Output: your url is: https://bitter-kings-guess.loca.lt
```

### Mobile App Configuration
Updated `/app/apps/native/.env`:
```
EXPO_PUBLIC_API_BASE_URL=https://bitter-kings-guess.loca.lt
```

### Verification
```bash
# Test health endpoint
curl https://bitter-kings-guess.loca.lt/api/health

# Test workout generation
curl -X POST https://bitter-kings-guess.loca.lt/api/workouts/generate \
  -H "Content-Type: application/json" \
  -d '{"userProfile":{"experience":"intermediate","fitnessGoals":["muscle-gain"],"sessionDuration":45},"dayOfWeek":0}'
```

## Important Notes

### Localtunnel URL Changes
⚠️ **The localtunnel URL changes each time the tunnel restarts!**

If you restart the container or the tunnel process, you'll get a NEW URL. You need to:
1. Check the new URL: `cat /tmp/localtunnel.log`
2. Update `/app/apps/native/.env` with the new URL
3. Restart Expo: `npx expo start --tunnel`

### Keeping Tunnel Running
The tunnel is running as a background process. To check if it's still running:
```bash
ps aux | grep "lt --port 8001"
```

To restart it if it stops:
```bash
nohup lt --port 8001 > /tmp/localtunnel.log 2>&1 &
sleep 2
cat /tmp/localtunnel.log
```

### Alternative: Permanent Backend URL
For production, you would:
1. Deploy backend to a cloud service (Heroku, Railway, Render, etc.)
2. Get a permanent URL
3. Update `EXPO_PUBLIC_API_BASE_URL` with that URL
4. No need for tunnels

## Current Status
✅ Localtunnel running on port 8001
✅ Public URL: `https://bitter-kings-guess.loca.lt`
✅ Mobile app configured to use this URL
✅ All API endpoints working (tested)

## Testing on Your Phone
1. Make sure Expo is running: `cd /app/apps/native && npx expo start --tunnel`
2. Scan QR code with Expo Go
3. App will now successfully reach backend
4. No more 404 errors!

## Troubleshooting

### If you get "ERR_CONNECTION_REFUSED":
- Check if localtunnel is running: `ps aux | grep lt`
- Check backend is running: `curl http://localhost:8001/api/health`
- Restart localtunnel if needed

### If you get 404 errors:
- Check the tunnel URL hasn't changed: `cat /tmp/localtunnel.log`
- Update `.env` if URL changed
- Restart Expo
