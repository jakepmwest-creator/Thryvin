# Thryvin Data Flow Audit

## Summary

This document tracks all user data inputs in the Thryvin app and where they are stored.

**Database**: Neon PostgreSQL (Cloud)
**Local Storage**: AsyncStorage (Device)

---

## 📊 Data Flow Table

| Data Input | Source | Database Table | AI Can See? | Notes |
|------------|--------|----------------|-------------|-------|
| **ONBOARDING** |
| Name | Onboarding | `users.name` | ✅ Yes | Used in AI coach personalization |
| Email | Onboarding/Login | `users.email` | ✅ Yes | Authentication |
| Gender | Onboarding | `users.gender` | ✅ Yes | Workout customization |
| Date of Birth | Onboarding | `users.date_of_birth` | ✅ Yes | Age-appropriate workouts |
| Height | Onboarding | `users.height` | ✅ Yes | Exercise recommendations |
| Weight | Onboarding | `users.weight` | ✅ Yes | Weight-based suggestions |
| Experience Level | Onboarding | `users.experience` | ✅ Yes | Workout difficulty |
| Fitness Goals | Onboarding | `users.fitness_goals` | ✅ Yes | Program customization |
| Available Equipment | Onboarding | `users.equipment` | ✅ Yes | Exercise filtering |
| Training Days/Week | Onboarding | `users.training_days` | ✅ Yes | Schedule planning |
| Session Duration | Onboarding | `users.session_duration` | ✅ Yes | Workout length |
| Training Schedule | Onboarding | `users.training_schedule` | ✅ Yes | Day preferences |
| Selected Days | Onboarding | `users.selected_days` | ✅ Yes | Specific workout days |
| Injuries | Onboarding | `users.injuries_description` | ✅ Yes | Exercise safety |
| **WORKOUT DATA** |
| Sets Completed | Workout Hub | `performance_logs.sets` | ✅ Yes | Performance tracking |
| Reps Completed | Workout Hub | `performance_logs.reps` | ✅ Yes | Performance tracking |
| Weight Used | Workout Hub | `performance_logs.weight` | ✅ Yes | PR tracking |
| Workout Duration | Workout Summary | `workouts.duration` | ✅ Yes | Time tracking |
| Workout Completed | Workout Hub | `workouts.completed` | ✅ Yes | Completion tracking |
| Completion Time | Workout Hub | `workouts.completed_at` | ✅ Yes | Streak calculation |
| Exercise Notes | Workout Hub | `performance_logs.notes` | ✅ Yes | Personal notes |
| **EXTRA ACTIVITIES** |
| Extra Workout Type | Log Activity | `workouts.type` | ✅ Yes | Extra activities |
| Extra Workout Duration | Log Activity | `workouts.duration` | ✅ Yes | Time tracking |
| Extra Workout Date | Log Activity | `workouts.date` | ✅ Yes | Calendar tracking |
| **COACH INTERACTION** |
| Coach Messages | AI Coach Chat | `coach_conversations.message` | ✅ Yes | Context for AI |
| Coach Preference | Profile | `users.coach_personality` | ✅ Yes | Response style |
| **AWARDS/BADGES** |
| Badge Progress | Auto-calculated | `user_badges.progress` | ✅ Yes | Achievement tracking |
| Badge Completion | Auto-calculated | `user_badges.completed` | ✅ Yes | Gamification |
| Badge Unlock Time | Auto-calculated | `user_badges.unlocked_at` | ✅ Yes | Achievement history |
| Total XP | Auto-calculated | `user_badge_stats.total_xp` | ✅ Yes | Level progression |
| Current Island | Auto-calculated | `user_badge_stats.current_island` | ✅ Yes | Journey progress |
| **TRACKING STATS** |
| Total Workouts | Auto-calculated | `user_badge_stats.total_workouts` | ✅ Yes | Badge progress |
| Total Reps | Auto-calculated | `user_badge_stats.total_reps` | ✅ Yes | Badge progress |
| Total Minutes | Auto-calculated | `user_badge_stats.total_minutes` | ✅ Yes | Badge progress |
| Coach Messages Count | Auto-tracked | `user_badge_stats.total_coach_messages` | ✅ Yes | Badge progress |
| PRs Broken | Auto-tracked | `user_badge_stats.total_prs_broken` | ✅ Yes | Badge progress |
| Extra Activities Count | Auto-tracked | `user_badge_stats.total_extra_activities` | ✅ Yes | Badge progress |
| Workout Edits | Auto-tracked | `user_badge_stats.total_workout_edits` | ✅ Yes | Badge progress |
| Badges Shared | Auto-tracked | `user_badge_stats.total_badges_shared` | ✅ Yes | Badge progress |
| Videos Watched | Auto-tracked | `user_badge_stats.total_videos_watched` | ✅ Yes | Badge progress |
| Weekend Workouts | Auto-calculated | `user_badge_stats.total_weekend_workouts` | ✅ Yes | Badge progress |
| Early Workouts (<8am) | Auto-calculated | `user_badge_stats.total_early_workouts` | ✅ Yes | Badge progress |
| Late Workouts (>8pm) | Auto-calculated | `user_badge_stats.total_late_workouts` | ✅ Yes | Badge progress |
| Categories Explored | Auto-calculated | `user_badge_stats.categories_explored` | ✅ Yes | Badge progress |
| Profile Edited | Auto-tracked | `user_badge_stats.has_edited_profile` | ✅ Yes | Badge progress |
| App Rated | Auto-tracked | `user_badge_stats.has_rated_app` | ✅ Yes | Badge progress |
| Current Streak | Auto-calculated | `user_badge_stats.current_streak` | ✅ Yes | Badge & display |
| Best Streak | Auto-calculated | `user_badge_stats.best_streak` | ✅ Yes | Achievement record |
| **PERSONAL RECORDS** |
| Exercise PR Weight | Auto-detected | `personal_records.weight` | ✅ Yes | PR tracking |
| PR Date | Auto-detected | `personal_records.achieved_at` | ✅ Yes | PR history |

---

## 🔄 Data Sync Architecture

### Primary Storage: Neon PostgreSQL
All workout data, user profiles, and badge progress is stored in the cloud database for:
- Data persistence across devices
- AI coach context
- Progress tracking
- Backup/recovery

### Local Cache: AsyncStorage
Used for:
- Offline access (read-only)
- Faster app loading
- Reduced API calls

### Sync Flow:
1. User completes action (e.g., finishes workout)
2. Data saved to **PostgreSQL** immediately
3. Local **AsyncStorage** cache updated
4. AI coach receives updated context on next message

---

## 🤖 AI Coach Data Access

The AI coach has access to:
- User profile (name, goals, experience, injuries)
- Workout history (exercises, weights, reps, sets)
- Performance trends (PRs, improvements)
- Badge progress and achievements
- Coach conversation history
- Training schedule and preferences

This allows the coach to provide:
- Personalized workout advice
- Weight recommendations based on history
- Progress-aware motivation
- Injury-conscious modifications

---

## ✅ Data That IS Persisted (Survives Server Restart)

| Data | Storage |
|------|---------|
| User Profile | PostgreSQL |
| Workout History | PostgreSQL |
| Performance Logs | PostgreSQL |
| Personal Records | PostgreSQL |
| Badge Progress | PostgreSQL (NEW!) |
| Badge Stats | PostgreSQL (NEW!) |
| Coach Conversations | PostgreSQL |

## ⚠️ Data That WAS Lost (Now Fixed)

| Data | Old Storage | New Storage |
|------|-------------|-------------|
| Badge Progress | AsyncStorage | PostgreSQL |
| Badge Stats | AsyncStorage | PostgreSQL |
| XP & Island | AsyncStorage | PostgreSQL |

---

## 📝 API Endpoints for Data

### User Data
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile
- `GET /api/users/:id/stats` - Get user statistics

### Workout Data
- `GET /api/workouts` - Get user workouts
- `POST /api/workouts` - Create workout
- `PUT /api/workouts/:id` - Update workout
- `POST /api/workouts/:id/complete` - Mark complete

### Performance Logs
- `POST /api/performance-logs` - Log exercise performance
- `GET /api/performance-logs` - Get performance history
- `GET /api/stats/personal-bests` - Get PRs

### Badge Data (NEW)
- `GET /api/badges/progress` - Get user badge progress
- `PUT /api/badges/progress` - Save badge progress
- `POST /api/badges/reset` - Reset all badges
- `GET /api/badges/stats` - Get computed badge stats
- `POST /api/badges/track` - Track specific actions

---

Last Updated: January 28, 2025
