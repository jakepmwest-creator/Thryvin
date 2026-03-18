# Thryvin APK launch crash diagnosis

## Executive summary

I audited the native Expo app at `apps/native` and found **two high-probability startup issues** in the launch path:

1. **Risky native-module imports were happening at app startup from the root layout**
   - `app/_layout.tsx` imported `FloatingCoachButton` immediately.
   - `FloatingCoachButton` pulls in `VoiceInputButton` → `useVoiceInput` → `expo-av`, plus other heavy app state/UI modules.
   - Even if the coach button is not shown yet, that import chain is still evaluated during boot.
   - In release APKs, this is exactly the kind of pattern that causes **instant native crashes right after splash** when one linked module is off.

2. **`OnboardingTour.tsx` imported `expo-blur`, but `expo-blur` is not declared in `apps/native/package.json`**
   - File: `apps/native/src/components/OnboardingTour.tsx`
   - This screen is pulled from `app/(tabs)/_layout.tsx`, so once the authenticated tab tree loads, it can explode on module resolution / native load.
   - The import was unused, so it was dead weight with real crash potential.

I also found a **strong reliability bug**:

3. **Custom splash had no fail-safe exit**
   - File: `apps/native/src/components/SplashScreen.tsx`
   - If the animation callback failed to fire for any reason, the overlay could stay on top forever.
   - That would look like “shows splash, flashes, then dies / never gets past splash”.

And a **startup-state bug**:

4. **Auth state was not hydrated on boot**
   - `checkAuth()` existed but was not called from `app/_layout.tsx`.
   - That can produce incorrect initial routing / render timing and makes startup behaviour inconsistent.

---

## What I checked

### Critical render path
- `apps/native/app/_layout.tsx`
- `apps/native/app/index.tsx`
- `apps/native/app/(auth)/login.tsx`
- `apps/native/app/(tabs)/index.tsx`
- `apps/native/app/(tabs)/_layout.tsx`

### Startup stores/services
- `apps/native/src/stores/auth-store.ts`
- `apps/native/src/stores/subscription-store.ts`
- `apps/native/src/stores/workout-store.ts`
- `apps/native/src/services/env.ts`
- `apps/native/src/services/notificationService.ts`
- `apps/native/src/services/revenuecat.ts`

### Config/build
- `apps/native/package.json`
- `apps/native/app.config.js`
- `apps/native/app.json`
- `apps/native/metro.config.js`
- **No `eas.json` found** at repo root or app level

### Assets
- Confirmed present:
  - `apps/native/assets/images/thryvin-logo-final.png`

---

## Root causes ranked by likelihood

### 1) Most likely: startup import chain loads native modules too early

**Why this is likely**
- Root layout imported `FloatingCoachButton` eagerly.
- That component drags in voice/audio code and a lot of state/UI code before the app is even ready.
- Release APK crashes often come from exactly this: a native dependency is present in JS but not healthy at runtime, and importing it too early kills launch.

**Files involved**
- `apps/native/app/_layout.tsx`
- `apps/native/src/components/FloatingCoachButton.tsx`
- `apps/native/src/components/VoiceInputButton.tsx`
- `apps/native/src/hooks/useVoiceInput.ts`

**Fix applied**
- I changed the root layout so the coach button is **required lazily only when it actually needs to render**.

### 2) Very likely: unused `expo-blur` import in tabs onboarding flow

**Why this is likely**
- `OnboardingTour.tsx` imported `expo-blur`.
- `expo-blur` is **not listed** in `apps/native/package.json`.
- The import was unused.
- Once the app enters the tab tree, this can break the JS/native module load path.

**Files involved**
- `apps/native/src/components/OnboardingTour.tsx:13`
- `apps/native/package.json`

**Fix applied**
- Removed the unused `expo-blur` import.

### 3) Medium likelihood: splash overlay could get stuck forever

**Why this is likely**
- The custom splash uses a long chained animation with `Animated.loop(..., { iterations: 3 })` inside a sequence.
- If that sequence completion callback ever fails in release, `onAnimationComplete` never runs.
- There was no fallback timeout or cleanup.

**Files involved**
- `apps/native/src/components/SplashScreen.tsx`

**Fix applied**
- Added:
  - a guarded `finish()` callback
  - a **5 second fail-safe timeout**
  - cleanup for the loop and sequence on unmount

### 4) Medium likelihood: auth not restored on app boot

**Why this matters**
- `checkAuth()` existed but wasn’t called in root layout.
- That can cause inconsistent route selection and weird startup flashes.
- Not the most likely native crash root cause, but definitely a startup bug.

**Files involved**
- `apps/native/app/_layout.tsx`
- `apps/native/src/stores/auth-store.ts`

**Fix applied**
- Root layout now calls `checkAuth()` on mount.
- Auth store now tracks `isLoggedIn` explicitly so dependent hooks/components don’t rely on an undefined field.

### 5) Lower likelihood: eager notification initialisation

**Why this matters**
- `auth-store.ts` imported `notificationService` at top level.
- `notificationService.ts` imports `expo-notifications` and immediately calls `Notifications.setNotificationHandler(...)` at module eval time.
- That’s another startup-time native touchpoint you do not want unless needed.

**Files involved**
- `apps/native/src/stores/auth-store.ts`
- `apps/native/src/services/notificationService.ts`

**Fix applied**
- Removed the unused `notificationService` import from `auth-store.ts` so notifications are not dragged into boot for no reason.

---

## Exact files changed

### 1) `apps/native/app/_layout.tsx`

**Current important lines**
- Boot init: lines 18–21
- Lazy coach import: lines 37–45

**What changed**
- Added `checkAuth()` on mount
- Stopped eager static import of `FloatingCoachButton`
- Lazy-required coach button only when `showCoachButton === true`

**Current code**
```tsx
useEffect(() => {
  initializeApiUrl();
  checkAuth();
}, [checkAuth]);

const CoachButton = showCoachButton
  ? require('../src/components/FloatingCoachButton').FloatingCoachButton
  : null;
```

---

### 2) `apps/native/src/stores/auth-store.ts`

**Current important lines**
- Interface/state shape: around lines 145–163
- Login success state set: line 264
- Logout clear: line 450
- `checkAuth()`: lines 458–473

**What changed**
- Removed unused notification import
- Added `isLoggedIn` to store state
- Ensured login/register/checkAuth/logout/updateUser keep `isLoggedIn` in sync

**Current code shape**
```ts
interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  error: string | null;
  ...
}
```

---

### 3) `apps/native/src/components/OnboardingTour.tsx`

**What changed**
- Removed unused:
```ts
import { BlurView } from 'expo-blur';
```

This was a pure risk import with no value.

---

### 4) `apps/native/src/components/SplashScreen.tsx`

**What changed**
- Added a guarded completion function
- Added a 5 second timeout fallback
- Added loop/sequence cleanup on unmount

**Current key logic**
```tsx
const finish = () => {
  if (completedRef.current) return;
  completedRef.current = true;
  onAnimationComplete?.();
};

const fallbackTimeout = setTimeout(() => {
  finish();
}, 5000);
```

---

## Things I checked that are **not** the root cause

### Asset missing?
**No.**
- `apps/native/assets/images/thryvin-logo-final.png` exists.

### `expo-linear-gradient` itself?
**Possible but less likely.**
- It’s used all over the app, including login and splash.
- If that native module were fundamentally broken, you’d usually see broader failure patterns.
- The bigger issue was **loading too many native-touching components too early**.

### `initializeApiUrl()`?
**Not likely as the crash root cause.**
- It only clears an AsyncStorage key.
- Still, I made startup more robust by pairing it with `checkAuth()`.

### `newArchEnabled: false`, `bridgeless: false`, `turboModules: false`?
**Low likelihood for this exact symptom.**
- Not ideal to thrash these blindly.
- I would not change architecture flags until after testing the startup-import fixes.

### `unstable_enablePackageExports: false` in Metro?
**Low likelihood for release launch crash.**
- More likely to affect bundling/resolution than “splash then close” on-device.

### `EXPO_USE_BRIDGE=1` in `start` script?
**Not relevant to the APK itself.**
- That affects dev/start behaviour, not the already-built release APK.

---

## Recommended next test steps

### Test 1 — highest value
Build a fresh APK/AAB from the updated code and test on the same device.

Expected outcome:
- App should get past splash reliably.
- If user is logged out, it should land on auth screens.
- If user is logged in, it should enter tabs without exploding.

### Test 2 — if it still crashes
Grab native Android logs during launch:
- filter for `FATAL EXCEPTION`
- filter for `AndroidRuntime`
- filter for `expo-av`, `expo-notifications`, `react-native-purchases`, `expo-router`

If there is still a crash, the logs will tell us which native module is actually failing.

### Test 3 — auth flow
- Fresh install
- Launch app
- Confirm splash exits
- Confirm login screen appears
- Log in
- Confirm tabs load
- Open profile/workouts/home

### Test 4 — coach button path
After successful login:
- wait for home to load
- confirm app remains stable before opening coach
- then open coach
- then test voice button separately

That isolates whether any remaining issue lives specifically in the voice/audio path.

---

## Follow-up hardening I’d do next if needed

If the app still crashes after these fixes, I’d do this next:

1. **Lazy-load voice input even deeper**
   - Move `VoiceInputButton` behind conditional render inside the chat modal
   - Or dynamically import it only after user taps coach

2. **Move notification setup out of module top-level**
   - Don’t call `Notifications.setNotificationHandler(...)` on import
   - Initialise notifications inside an explicit app setup path

3. **Add a release-safe error boundary / boot logger**
   - Capture JS boot errors before the app disappears

4. **Add `expo-blur` only if actually needed**
   - Right now it was just dead import noise

---

## Bottom line

The highest-confidence fix is:
- **stop loading coach/voice/native-heavy code during root boot**, and
- **remove the stray `expo-blur` import from the tab onboarding path**.

I’ve already applied those fixes, plus:
- splash fail-safe exit
- boot auth hydration
- auth store consistency cleanup

Those changes directly target the most plausible reasons an APK would show splash, flash, then die on launch.
