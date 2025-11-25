# Fix Reanimated Error - Clear Expo Cache

## The Error
```
Error: Reanimated 2 failed to create a worklet
Maybe you forgot to add Reanimated's babel plugin to your babel.config.js
```

## Why This Happens
The Reanimated babel plugin IS in `babel.config.js`, but the Metro bundler has cached the old version without it.

## Solution: Clear Metro Cache

### Option 1: Start with --clear flag (RECOMMENDED)
```bash
cd /app/apps/native
npx expo start --clear --tunnel
```

The `--clear` flag clears the Metro bundler cache.

### Option 2: Manually clear cache
```bash
cd /app/apps/native

# Clear Expo cache
rm -rf .expo

# Clear Metro cache
rm -rf node_modules/.cache

# Clear watchman (if available)
watchman watch-del-all 2>/dev/null || true

# Restart Expo
npx expo start --tunnel
```

### Option 3: Nuclear option (if above don't work)
```bash
cd /app/apps/native

# Delete all caches and node_modules
rm -rf node_modules .expo node_modules/.cache

# Reinstall
npm install
# or
yarn install

# Start fresh
npx expo start --clear --tunnel
```

## After Clearing Cache
1. Wait for Metro to rebuild (takes 30-60 seconds)
2. Scan QR code again with Expo Go
3. App should load without Reanimated errors

## Verifying the Fix
You should see in the terminal:
```
Metro waiting on exp://...
Android bundled successfully in XXXms
```

And on your phone, the app should load the login screen without errors.

## If You Still See Errors
1. Make sure you pulled the latest code: `git pull`
2. Check that `.env` has the localtunnel URL
3. Make sure localtunnel is running: `cat /tmp/localtunnel.log`
4. Try closing Expo Go completely and reopening
