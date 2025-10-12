# Expo Native App Setup

This directory contains the React Native app built with Expo. Due to package conflicts with the existing web app, follow these steps to run the native app:

## Setup Instructions

1. **Create separate directory for Expo development:**
   ```bash
   # Copy the native app to a separate location
   cp -r apps/native ~/thryvin-native-app
   cd ~/thryvin-native-app
   ```

2. **Install Expo CLI:**
   ```bash
   npm install -g @expo/cli
   ```

3. **Initialize Expo project:**
   ```bash
   expo install
   ```

4. **Install dependencies:**
   ```bash
   npm install
   ```

5. **Start the development server:**
   ```bash
   expo start
   ```

## Current Development Status

The native app structure includes:

- **Authentication**: Email/password + biometric auth (mocked for web compatibility)
- **Navigation**: 5-tab structure (Home, Workouts, Nutrition, Awards, Profile)
- **Theme**: Brand colors and spacing system
- **State Management**: Zustand stores (mocked during development)
- **API Integration**: Shared package with type-safe API client

## Converting Mock Components

When running in actual Expo environment, replace:

1. **Auth Store** (`src/stores/auth-store.ts`):
   - Replace mock implementation with real Zustand store
   - Connect to shared API client

2. **Biometric Hook** (`src/hooks/use-biometric-auth.ts`):
   - Replace mock implementations with actual Expo modules
   - Import real `expo-local-authentication` and `expo-secure-store`

3. **UI Components**:
   - Components are already React Native compatible
   - May need minor adjustments for Expo environment

## Backend Connection

The native app connects to the same Express.js backend as the web app:
- Base URL: `/api` (configure for your development environment)
- All endpoints are shared between web and native
- Authentication uses the same session-based system

## Next Steps

1. Set up Expo development environment
2. Test authentication flow with real backend
3. Implement onboarding screens
4. Add AI coach integration
5. Implement workout generation and tracking