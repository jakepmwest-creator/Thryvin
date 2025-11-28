# Thryvin Onboarding Tour - Testing Guide

## 🎯 How to Test the Tour

### Method 1: Profile Button (Easiest!)
1. Open the app
2. Navigate to **Profile** tab
3. Scroll to **Support** section
4. Tap **"Take App Tour"**
5. Alert appears: "The tour will start when you return to the Home tab"
6. Tap "Got it!"
7. Navigate to **Home** tab
8. Tour starts automatically! 🎉

### Method 2: Fresh Install
1. Uninstall app completely
2. Reinstall app
3. Login/signup
4. Tour starts automatically on Home screen

### Method 3: Clear AsyncStorage (Dev)
1. Shake device
2. Tap "Debug" → "Clear AsyncStorage"
3. Reload app
4. Tour starts automatically

---

## 🎨 Tour Features

### Visual Design
- **Spotlight Effect**: Dark overlay with highlighted area
- **Pulsing Ring**: Animated ring around interactive elements
- **Beautiful Tooltips**: Purple gradient cards with icons
- **Progress Dots**: Shows which step you're on
- **Skip/Continue Buttons**: User controls the pace

### Tour Steps
1. **Welcome** - Friendly introduction
2. **Today's Workout** - Highlights workout card (with spotlight)
3. **Workout Details** - Explains modal and swiping
4. **Edit Workout** - Shows AI customization feature
5. **Start Workout** - Explains Workout Hub
6. **Workouts Tab** - Weekly schedule overview
7. **Stats Tab** - Progress tracking
8. **Awards Tab** - Achievement system
9. **Profile Tab** - Settings and goals
10. **Complete** - Motivational finish

---

## 🛠️ Configuration Files

### Tour Content
**File**: `/app/apps/native/src/config/tourSteps.ts`
- Edit tour text here
- Change icons
- Adjust placement (top/bottom/center)
- Add/remove steps

### Tour Component
**File**: `/app/apps/native/src/components/OnboardingTour.tsx`
- Customize design/colors
- Adjust animations
- Modify spotlight behavior

### Tour Logic
**File**: `/app/apps/native/src/hooks/useTour.ts`
- Tour state management
- AsyncStorage integration
- Element positioning logic

---

## 📱 User Experience Flow

### First Time Users
1. Signs up → Completes onboarding
2. Opens app for first time
3. **Tour starts automatically** after 1 second
4. Can skip or complete the tour
5. Tour completion saved in AsyncStorage
6. Won't see tour again unless they tap "Take App Tour"

### Returning Users
- Tour doesn't appear (stored in AsyncStorage)
- Can restart tour anytime from Profile

### Skipped Tour
- User taps "Skip Tour"
- Stored as completed (won't auto-show again)
- Can restart manually from Profile

---

## 🎯 Testing Checklist

- [ ] Tour appears automatically on first launch
- [ ] Spotlight highlights correct elements
- [ ] Tooltip positioning is correct (top/bottom/center)
- [ ] Progress dots update correctly
- [ ] "Skip Tour" button works
- [ ] "Next" button advances steps
- [ ] "Get Started" button completes tour
- [ ] Tour doesn't appear on second launch
- [ ] "Take App Tour" button in Profile works
- [ ] Tour restarts correctly after manual trigger
- [ ] Animations are smooth
- [ ] Text is readable and clear

---

## 🚀 Customization Ideas

### Add More Spotlights
Currently only "Today's Workout" has a spotlight. Can add for:
- Tab bar icons
- Edit Workout button
- Start Workout button
- Any other UI element

### Add Navigation
Make tour automatically navigate between tabs:
- Step 6: Auto-navigate to Workouts tab
- Step 7: Auto-navigate to Stats tab
- Step 8: Auto-navigate to Awards tab
- Step 9: Auto-navigate to Profile tab

### Add Interactions
Force user to interact:
- "Tap here to continue" style steps
- Block other interactions until step completed
- Add swipe gestures for modal step

---

## 📝 Notes

- Tour state stored in: `AsyncStorage` → `onboarding_tour_completed`
- Clear this key to reset tour
- Tour waits 1 second before showing (allows UI to render)
- Element positions are measured dynamically
- Works in both light/dark modes
- Fully responsive to screen sizes

---

## 🐛 Troubleshooting

### Tour doesn't appear?
- Check AsyncStorage: `await AsyncStorage.getItem('onboarding_tour_completed')`
- Should be `null` for tour to show
- Clear with: `await AsyncStorage.removeItem('onboarding_tour_completed')`

### Spotlight not highlighting correctly?
- Element refs must be set up
- `measureInWindow` needs time to work
- Increase timeout in `updateStepPosition` function

### Tour appears every time?
- AsyncStorage not saving properly
- Check for errors in console
- Verify `AsyncStorage.setItem` is being called

---

**Ready to test! Navigate to Profile → Support → "Take App Tour"** 🎉
