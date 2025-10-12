# Thryvin Native App

React Native app built with Expo for iOS and Android.

## Current Development Status

This directory contains a complete React Native app structure that's currently mocked for development in the Replit environment. The app includes:

### ✅ Completed Features
- **Complete App Structure**: All screens and navigation implemented
- **Authentication Flow**: Login/register screens with biometric auth scaffolding  
- **5-Tab Navigation**: Home, Workouts, Nutrition, Awards, Profile
- **Theme System**: Brand gradients and consistent design language
- **State Management**: Zustand stores (mocked for development)
- **API Integration**: Shared package with backend connection

### 🔧 Mocked for Development
Due to package conflicts in the current environment:
- React Native Paper components → Mock implementations
- Expo modules (biometric auth, secure store) → Mock implementations  
- Zustand store → Simple mock state management
- Linear Gradient → Mock gradient components

## Running in Expo

To run this as a real React Native app:

1. **Copy to separate directory:**
   ```bash
   cp -r apps/native ~/thryvin-expo-app
   cd ~/thryvin-expo-app
   ```

2. **Initialize Expo:**
   ```bash
   npx create-expo-app@latest . --template blank-typescript
   ```

3. **Install dependencies:**
   ```bash
   expo install expo-router react-native-paper zustand @tanstack/react-query
   expo install expo-local-authentication expo-secure-store expo-linear-gradient
   ```

4. **Replace mock components:**
   - Update imports in all files to use real packages
   - Remove mock implementations
   - Connect to real backend API

5. **Start development:**
   ```bash
   expo start
   ```

## File Structure

```
apps/native/
├── app/                    # Expo Router pages
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main app tabs
│   └── _layout.tsx        # Root layout
├── src/
│   ├── components/        # Reusable components
│   ├── hooks/            # Custom hooks
│   ├── stores/           # Zustand stores
│   └── theme/            # Theme configuration
├── app.json              # Expo configuration
└── tsconfig.json         # TypeScript config
```

## Next Steps

1. Set up real Expo environment
2. Connect authentication to backend API
3. Implement onboarding flow
4. Add AI coach integration
5. Build workout generation features
6. Add push notifications
7. Implement real biometric authentication

## Backend Integration

The app is designed to connect to the same Express.js backend as the web app:
- All API endpoints are shared
- Authentication uses session-based system
- Real-time features through WebSocket support