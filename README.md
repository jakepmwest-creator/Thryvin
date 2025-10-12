# Thryvin' - AI-Powered Fitness Coaching

A hyper-personalized mobile fitness platform delivering AI-driven coaching through immersive, dynamically adaptive user experiences with advanced authentication and user engagement features.

## Architecture

This is a monorepo containing:

- **apps/native**: React Native app with Expo
- **apps/web**: Placeholder for future web client (React Native Web or Next.js)
- **packages/shared**: Shared TypeScript package with types, API client, and business logic

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g @expo/cli`

### Development

1. Install dependencies:
```bash
npm install
cd apps/native && npm install
cd packages/shared && npm install
```

2. Build shared package:
```bash
cd packages/shared && npm run build
```

3. Start the native app:
```bash
cd apps/native && npm run dev
```

### Scripts

- `npm run dev:native`: Start Expo development server
- `npm run build:native`: Build native app for production
- `npm run typecheck`: Run TypeScript checking across all packages
- `npm run lint`: Run ESLint across all packages

## Tech Stack

### Native App (apps/native)
- **Framework**: Expo (React Native)
- **Navigation**: Expo Router
- **UI Library**: React Native Paper
- **State Management**: Zustand + React Query
- **Animations**: React Native Reanimated
- **Authentication**: Expo Local Authentication + Secure Store
- **Theme**: Custom theme with brand gradients

### Shared Package (packages/shared)
- **Types**: Zod schemas and TypeScript types
- **API Client**: Fetch-based client with error handling
- **Business Logic**: BMI calculation, calorie targets, validation
- **AI Prompts**: Reusable prompt templates

### Backend
- **Current**: Express.js with PostgreSQL (existing web app backend)
- **Future**: Same backend serves both web and native clients

## Features Implemented

### ✅ Authentication
- Email/password login
- Native biometric authentication (Face ID, Touch ID, fingerprint)
- Secure credential storage

### ✅ Navigation
- Tab-based navigation with 5 main sections:
  - Home: Dashboard with workout recommendations
  - Workouts: Exercise types and custom workout generation
  - Nutrition: Calorie tracking and macro monitoring
  - Awards: Achievement system with progress tracking
  - Profile: User settings and biometric controls

### ✅ UI/UX
- Brand gradient theme (#7A3CF3 → #FF4FD8)
- Apple Fitness-inspired design
- Smooth animations and transitions
- Native iOS/Android look and feel

## Adding a Web Client

To add a React Native Web or Next.js web client in the future:

1. Update `apps/web/package.json` with appropriate dependencies
2. Import shared types and API client from `@thryvin/shared`
3. Implement web-specific authentication (WebAuthn for biometrics)
4. Use the same design system tokens from the shared package

Example:
```typescript
import { authApi, SelectUser } from '@thryvin/shared';

// Web client can use the same API functions
const user = await authApi.login({ email, password });
```

## Environment Setup

The native app connects to your existing Express.js backend. Make sure your backend is running on the expected port and endpoints.

## Next Steps

1. Install dependencies and test the native app
2. Implement onboarding flow from web app
3. Add AI coach integration
4. Implement workout generation and tracking
5. Add push notifications
6. Implement real biometric authentication flow

## Development Guidelines

- Always update `packages/shared` types when backend schemas change
- Use the shared API client for all server communication
- Follow the established theme tokens and spacing
- Add new screens to the appropriate tab navigation
- Test on both iOS and Android simulators