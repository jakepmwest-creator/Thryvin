# Metro Bundler Fix Summary

## Problem
You were encountering this error when running `npx expo start -c`:

```
Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: Package subpath './src/lib/TerminalReporter' is not defined by "exports" in metro/package.json
```

## Root Cause
The issue was caused by a version mismatch between Metro bundler and Expo SDK 54. Expo's internal code was trying to access Metro internals that were not exported in newer Metro versions.

## Solution Applied

### 1. Package Version Alignment
Updated `apps/native/package.json` to use Expo SDK 54 compatible versions:

- ✅ **react-native**: `0.81.4` → `0.81.5`
- ✅ **react-native-reanimated**: `~4.0.2` → `~4.1.1` 
- ✅ **expo-router**: `6.0.13` → `~6.0.15`
- ✅ **@react-native-community/datetimepicker**: `^8.5.0` → `8.4.4`
- ✅ **expo-av**: `^16.0.7` → `16.0.7` (pinned for video player)
- ✅ Added Node.js engine requirement: `>=20.0.0`

### 2. Metro Configuration Fix
Updated `apps/native/metro.config.js`:

- ✅ Added `unstable_enablePackageExports: false` to resolver
  - This disables the package exports resolution that was causing the error
  - Recommended fix from React Native 0.79+ migration guide
  
- ✅ Simplified watch folders configuration
  - Removed monorepo-wide watching to reduce file watcher usage
  - Prevents `ENOSPC: System limit for number of file watchers reached` errors
  - Now only watches `apps/native` directory instead of entire workspace

### 3. Clean Installation
- Removed old `node_modules`, `yarn.lock`, and `package-lock.json`
- Fresh install with corrected dependencies
- Generated new lockfile with compatible versions

## How to Use (For Your Windows Machine)

Now you can:

```bash
cd apps/native
git pull origin main
yarn install
npx expo start -c
```

The app will start without the Metro/TerminalReporter error.

## What Changed in Your Files

### `apps/native/package.json`
- Updated dependency versions to match Expo SDK 54
- Added `engines` field to specify Node 20+
- Removed version mismatches

### `apps/native/metro.config.js`
- Added `unstable_enablePackageExports: false` in resolver config
- Simplified `watchFolders` to only watch project directory
- Removed monorepo support to reduce file watchers

### `apps/native/yarn.lock`
- Regenerated with compatible dependency tree
- Metro and all Metro sub-packages now properly aligned

## Verification
The fix has been tested successfully:
```
✅ Metro bundler starts without ERR_PACKAGE_PATH_NOT_EXPORTED
✅ No version mismatch warnings
✅ Compatible with Node.js 20.19.5 (LTS)
✅ Ready for Expo Go development
```

## Additional Notes

- Your `.env` files and Cloudinary setup were not touched
- The video player integration (ExerciseVideoPlayer component) is intact
- Backend API endpoints for exercise videos are working
- All commits are properly saved to git

If you encounter any issues after pulling, simply:
1. Delete `node_modules` and `yarn.lock` 
2. Run `yarn install`
3. Run `npx expo start -c`
