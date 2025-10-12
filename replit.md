# Thryvin' AI Coaching Application

## Overview
Thryvin' is a full-stack AI-powered fitness coaching application designed to provide personalized workout generation, real-time chat guidance, progress tracking, and social features. It aims to offer a comprehensive fitness solution with a diverse roster of specialized AI coaches and dynamic content tailored to individual user needs, fostering a motivational and engaging fitness journey.

## User Preferences
Preferred communication style: Simple, everyday language.
Platform preference: Native mobile app (React Native/Expo) - PRIMARY FOCUS
Web app: Maintained for reference but development focused on React Native

## System Architecture

### Frontend - React Native (Primary Focus)
- **Framework**: Expo React Native with TypeScript
- **Navigation**: Expo Router (file-based routing)
- **UI Library**: React Native Paper + custom components
- **Styling**: Custom theme system with brand gradients (#7A3CF3 → #FF4FD8)
- **State Management**: Zustand + React Query (TanStack Query)
- **Authentication**: Native biometric (Face ID, Touch ID, fingerprint) + email/password
- **Structure**: 5-tab app (Home, Workouts, Nutrition, Awards, Profile)
- **Backend Integration**: Shared API client package connects to same Express.js backend

### Web App (Legacy/Reference)
- **Status**: Fully functional but not primary development focus
- **Purpose**: Reference implementation and potential future web client
- **Framework**: React 18 (TypeScript) with Vite

### Backend
- **Runtime**: Node.js with Express.js (TypeScript, ES modules)
- **Database ORM**: Drizzle ORM (PostgreSQL)
- **Authentication**: Passport.js (local strategy, session management)
- **AI Integration**: OpenAI GPT-4o for coaching and workout generation.

### Core Features (React Native Implementation)
- **Authentication**: Native biometric authentication + email/password login
- **AI Coaching System**: GPT-4o integration for personalized coaching (to be implemented)
- **5-Tab Navigation**:
  - **Home**: Dashboard with workout recommendations and progress summary
  - **Workouts**: Exercise type selection, custom AI workout generation
  - **Nutrition**: Calorie tracking, macro monitoring, AI meal recommendations
  - **Awards**: Achievement system with progress tracking and gamification
  - **Profile**: User settings, biometric auth controls, support options
- **Shared Backend**: Same Express.js API serves both web and native clients
- **Theme System**: Brand-consistent design with purple/pink gradients
- **State Management**: Zustand stores for app state, React Query for server state

### Planned Features
- **Coach Roster System**: 14 specialized AI-generated coaches migration
- **Onboarding Flow**: AI-powered personalized setup from web app
- **Workout Tracking**: Exercise logging, performance analytics
- **Social Features**: Achievement sharing, progress posts
- **Push Notifications**: Workout reminders, coach messages

## External Dependencies

### AI Services
- **OpenAI API**: GPT-4o (coaching, workout generation), DALL-E 3 (coach avatars).

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL.
- **@neondatabase/serverless**: Connection pooling.

### UI/Visualization Libraries
- **Radix UI**: Accessible component primitives.
- **Framer Motion**: Animation library.
- **Recharts**: Data visualization.
- **Canvas Confetti**: Celebration animations.

### Development Tools
- **TypeScript**: Type safety.
- **ESBuild**: Bundling.
- **Drizzle Kit**: Database migration and introspection.