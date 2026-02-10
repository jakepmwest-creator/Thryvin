# Thryvin Changelog

## Feb 10, 2026 - Critical Server URL Fix + RevenueCat Crash Protection
- **CRITICAL FIX**: Dynamic API URL resolution — no longer captured as static const at module load
- **NEW**: Manual URL override via Diagnostics panel on login screen (persists in AsyncStorage)
- **FIX**: RevenueCat imports wrapped in try-catch for Expo Go compatibility  
- **FIX**: Port 3000 proxy for Emergent preview URL routing
- Files changed: `env.ts`, `api-client.ts`, `auth-store.ts`, `_layout.tsx`, `login.tsx`, `subscription-store.ts`, `ProPaywallModal.tsx`, `revenuecat.ts`

## Feb 7, 2026 - RevenueCat + AI Rules + Rolling Regeneration
- RevenueCat SDK setup with test key
- Subscription store, paywall modal, customer center
- AI generator rules (compound-first, cardio warmups, set variety)
- Split planner improvements
- Rolling regeneration modal revamp

## Feb 5, 2026 - Profile Crash + Onboarding Keyboard + Scroll Picker
- Profile crash fix (TextInput import)
- Onboarding keyboard "Done" UX
- NumberScrollPicker integration
- Rolling regeneration backend endpoint
