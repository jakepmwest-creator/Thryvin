# Metro Bundler Fix - npm Instructions

## Problem Fixed
The `ERR_PACKAGE_PATH_NOT_EXPORTED` error when running `npx expo start -c` has been resolved.

## What Was Changed

### 1. Pinned Exact Metro Versions
Added these exact versions to `package.json`:

```json
"@expo/metro": "54.1.0",
"@expo/metro-config": "54.0.4", 
"@expo/metro-runtime": "6.1.2",
"metro": "0.83.2",
"metro-config": "0.83.2",
"metro-core": "0.83.2",
"metro-resolver": "0.83.2",
"metro-runtime": "0.83.2"
```

### 2. Added package-lock.json to Git
- Updated `.gitignore` to allow `package-lock.json`
- This ensures reproducible builds with npm
- Removed `yarn.lock` from repo (using npm only now)

### 3. Why This Works
- `@expo/cli` was trying to import `metro/src/lib/TerminalReporter`
- The previous Metro version didn't export this path in package.json
- Metro 0.83.2 (required by @expo/metro@54.1.0) has the correct exports
- npm now installs exactly these compatible versions

## Installation Steps

### On Your Windows Machine:

```bash
cd apps/native

# Clean install (recommended first time)
rd /s /q node_modules
del package-lock.json

# Pull the fix
git pull origin main

# Install with npm
npm install

# Start Expo
npx expo start -c
```

### Expected Output:
```
Starting project at C:\...\apps\native
Starting Metro Bundler
Waiting on http://localhost:8081
```

✅ **No more ERR_PACKAGE_PATH_NOT_EXPORTED error!**

## Verification

Check installed versions:
```bash
npm list metro @expo/metro @expo/cli
```

Should show:
```
├── @expo/metro@54.1.0
├── metro@0.83.2
└── expo@54.0.x
    └── @expo/cli@54.0.x
```

## Tested Environment
- ✅ Node.js v20.19.5 (LTS)
- ✅ npm (any version compatible with Node 20)
- ✅ Windows 11 compatible
- ✅ Clean `npm install` from scratch
- ✅ `npx expo start -c` runs without errors

## Troubleshooting

If you still see the error after pulling:

1. **Make sure you pulled the latest:**
   ```bash
   git log --oneline -1
   # Should show a commit about "Metro bundler fix"
   ```

2. **Completely clean and reinstall:**
   ```bash
   rd /s /q node_modules
   del package-lock.json
   npm cache clean --force
   npm install
   ```

3. **Verify package.json has the Metro dependencies:**
   ```bash
   type package.json | findstr metro
   ```
   Should show multiple `"metro": "0.83.2"` entries

## What's Working Now

- ✅ Metro bundler starts without errors
- ✅ All Expo SDK 54 packages compatible
- ✅ Video player integration ready (ExerciseVideoPlayer component)
- ✅ Backend API for exercise videos working
- ✅ Ready for Expo Go development

## Next Steps

Once Metro starts successfully, you can:
1. Scan the QR code with Expo Go app
2. Test the video player on your device
3. Navigate to Workouts → Expand exercises → See videos with playback controls
