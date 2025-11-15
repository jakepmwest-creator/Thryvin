import { relations } from "drizzle-orm";
import { pgTable, text, serial, integer, boolean, timestamp, unique, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  trainingType: text("training_type").notNull(), // calisthenics, strength, wellness
  goal: text("goal").notNull(), // strength, weight, health, skills
  coachingStyle: text("coaching_style").notNull(), // supportive, direct, analytical
  selectedCoach: text("selected_coach").notNull(), // kai, titan, lumi
  hasActiveSubscription: boolean("has_active_subscription").default(false),
  trialEndsAt: timestamp("trial_ends_at").notNull(),
  weeklyGoalWorkouts: integer("weekly_goal_workouts").default(5),
  weeklyGoalMinutes: integer("weekly_goal_minutes").default(150),
  // Gamification fields
  xpPoints: integer("xp_points").default(0).notNull(),
  level: text("level").default("Bronze").notNull(), // Bronze, Silver, Gold, Platinum, Diamond
  // Personal information fields
  age: integer("age"),
  height: text("height"),
  weight: text("weight"),
  fitnessLevel: text("fitness_level"),
  gender: text("gender"), // male, female, non-binary, prefer-not-to-say
  injuries: text("injuries"),
  emergencyContact: text("emergency_contact"),
  
  // AI Personalization fields
  preferredTrainingTime: text("preferred_training_time"), // morning, afternoon, evening
  cardioPreference: text("cardio_preference"), // love, like, neutral, dislike, hate
  focusAreas: text("focus_areas"), // JSON array of areas to focus on
  avoidanceAreas: text("avoidance_areas"), // JSON array of areas to avoid
  sessionDurationPreference: integer("session_duration_preference"), // minutes per session
  equipmentAccess: text("equipment_access"), // JSON array of available equipment
  trainingDaysPerWeek: integer("training_days_per_week").default(3),
  preferredTrainingDays: text("preferred_training_days"), // JSON array of preferred days
  workoutVariationPreference: text("workout_variation_preference"), // high, medium, low
  restDayActivities: text("rest_day_activities"), // JSON array of preferred rest day activities
  motivationalPreferences: text("motivational_preferences"), // JSON object with motivation style
  hasCompletedAIOnboarding: boolean("has_completed_ai_onboarding").default(false),
  lastWorkoutGenerated: timestamp("last_workout_generated"),
  // Free-text AI onboarding responses
  topFitnessGoal: text("top_fitness_goal"), // User's primary fitness goal in their own words
  injuryHistory: text("injury_history"), // Detailed injury information and limitations
  motivationalFactors: text("motivational_factors"), // What motivates the user most
  onboardingResponses: text("onboarding_responses"), // Complete JSON of all onboarding responses
  
  // Workout Profile (Pre-workout questionnaire data)
  workoutProfile: text("workout_profile"), // JSON string of UserWorkoutProfile data
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// NEW: Workout Days table for v1 API - single source of truth for calendar sync
export const workoutDays = pgTable("workout_days", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // YYYY-MM-DD format
  status: text("status").notNull(), // pending | generating | ready | error
  payloadJson: jsonb("payload_json"), // Full workout data when status=ready
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  // Unique constraint to prevent duplicate user+date
  uniqueUserDate: unique().on(table.userId, table.date),
  // Performance index for lookup queries
  userDateIdx: index("workout_days_user_date_idx").on(table.userId, table.date),
}));

// Password reset tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Define user relations
export const usersRelations = relations(users, ({ many, one }) => ({
  messages: many(messages),
  userWorkouts: many(userWorkouts),
  nutritionProfile: one(nutritionProfiles),
  mealPlans: many(mealPlans),
  workoutDays: many(workoutDays),
}));

// Workout Days relations
export const workoutDaysRelations = relations(workoutDays, ({ one }) => ({
  user: one(users, {
    fields: [workoutDays.userId],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertWorkoutDaySchema = createInsertSchema(workoutDays).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Chat messages model
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  isFromCoach: boolean("is_from_coach").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Define message relations
export const messagesRelations = relations(messages, ({ one }) => ({
  user: one(users, {
    fields: [messages.userId],
    references: [users.id],
  }),
}));

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

// Workouts model
export const workouts = pgTable("workouts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  duration: integer("duration").notNull(), // In minutes
  difficulty: text("difficulty").notNull(), // easy, medium, hard
  type: text("type").notNull(), // calisthenics, strength, wellness
  imageUrl: text("image_url"),
  tags: text("tags").array(),
});

// Define workout relations
export const workoutsRelations = relations(workouts, ({ many }) => ({
  userWorkouts: many(userWorkouts),
}));

export const insertWorkoutSchema = createInsertSchema(workouts).omit({
  id: true,
});

// Performance logs for individual exercise sets/reps (NEW - AI PT tracking)
export const performanceLogs = pgTable("performance_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  workoutId: text("workout_id").notNull(), // Links to the specific workout session
  exerciseId: text("exercise_id").notNull(), // The specific exercise being tracked
  exerciseName: text("exercise_name").notNull(), // Name of the exercise
  
  // Planned vs Actual Performance (Critical for AI learning)
  plannedSets: integer("planned_sets"), 
  actualSets: integer("actual_sets"),
  plannedReps: integer("planned_reps"),
  actualReps: integer("actual_reps"),
  plannedWeight: integer("planned_weight"), // in lbs/kg
  actualWeight: integer("actual_weight"),
  plannedDuration: integer("planned_duration"), // seconds
  actualDuration: integer("actual_duration"),
  
  // AI Learning Data
  rpe: integer("rpe"), // Rate of Perceived Exertion (1-10)
  formQuality: integer("form_quality"), // 1-5 scale for form
  completed: boolean("completed").default(true),
  skipped: boolean("skipped").default(false),
  modified: boolean("modified").default(false), // If exercise was swapped/modified
  
  // Detailed Feedback
  userNotes: text("user_notes"), // User's notes about the exercise
  muscleGroups: text("muscle_groups").array(), // Targeted muscle groups
  difficultyFeedback: text("difficulty_feedback"), // "too easy", "just right", "too hard"
  
  // Timestamps for AI analysis
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  loggedAt: timestamp("logged_at").defaultNow().notNull(),
});

// Performance logs relations for AI learning
export const performanceLogsRelations = relations(performanceLogs, ({ one }) => ({
  user: one(users, {
    fields: [performanceLogs.userId],
    references: [users.id],
  }),
}));

export const insertPerformanceLogSchema = createInsertSchema(performanceLogs).omit({
  id: true,
  loggedAt: true,
});

export type PerformanceLog = typeof performanceLogs.$inferSelect;
export type InsertPerformanceLog = z.infer<typeof insertPerformanceLogSchema>;

// User workouts (completed)
export const userWorkouts = pgTable("user_workouts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  workoutId: integer("workout_id").notNull().references(() => workouts.id, { onDelete: "cascade" }),
  duration: integer("duration").notNull(), // Duration in minutes
  completedAt: timestamp("completed_at").notNull().defaultNow(),
}, (table) => ({
  // Performance indexes for hot query paths
  userIdIdx: index("user_workouts_user_id_idx").on(table.userId),
  completedAtIdx: index("user_workouts_completed_at_idx").on(table.completedAt),
}));

// NOTE: userWorkoutsRelations moved to after workout table declarations to avoid forward reference

export const insertUserWorkoutSchema = createInsertSchema(userWorkouts).omit({
  id: true,
});

// =============================================================================
// MILESTONE 2: CORE WORKOUT DATA SCHEMA 
// =============================================================================

// Exercise library with video URLs
export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  slug: text("slug").unique().notNull(), // kebab-case of name
  name: text("name").notNull(),
  aliases: jsonb("aliases").default([]), // JSON array of alternative names
  body_part: text("body_part"), // chest, back, legs, core, full
  equipment: jsonb("equipment").default([]), // JSON array of equipment
  pattern: text("pattern"), // horizontal_push, vertical_pull, hinge, squat, carry
  is_unilateral: boolean("is_unilateral").default(false),
  // Legacy fields maintained for compatibility
  description: text("description"),
  category: text("category"), // upper-body, lower-body, core, cardio, full-body
  muscleGroups: text("muscle_groups").array(), // chest, back, shoulders, etc.
  difficulty: text("difficulty"), // beginner, intermediate, advanced
  videoUrl: text("video_url"), // URL to exercise demonstration video
  thumbnailUrl: text("thumbnail_url"), // Preview image
  instructions: text("instructions"), // Step-by-step instructions
  tips: text("tips"), // Form tips and coaching cues
  safetyNotes: text("safety_notes"), // Important safety considerations
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // Indexes for performance
  slugIdx: index("exercises_slug_idx").on(table.slug),
  nameIdx: index("exercises_name_idx").on(table.name),
}));

// Individual sets within workouts (for detailed tracking)
export const workoutSets = pgTable("workout_sets", {
  id: serial("id").primaryKey(),
  userWorkoutId: integer("user_workout_id").notNull().references(() => userWorkouts.id, { onDelete: "cascade" }),
  exerciseId: integer("exercise_id").notNull().references(() => exercises.id),
  setNumber: integer("set_number").notNull(), // 1, 2, 3, etc.
  targetReps: integer("target_reps"), // Planned reps
  actualReps: integer("actual_reps"), // Actually completed reps
  targetWeight: integer("target_weight"), // Planned weight (in lbs/kg)
  actualWeight: integer("actual_weight"), // Actually used weight
  targetDuration: integer("target_duration"), // For time-based exercises (seconds)
  actualDuration: integer("actual_duration"), // Actually completed duration
  restTime: integer("rest_time"), // Rest time before this set (seconds)
  rpe: integer("rpe"), // Rate of Perceived Exertion (1-10)
  notes: text("notes"), // Set-specific notes
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
}, (table) => ({
  // Performance indexes for hot query paths
  userWorkoutIdIdx: index("workout_sets_user_workout_id_idx").on(table.userWorkoutId),
  exerciseIdIdx: index("workout_sets_exercise_id_idx").on(table.exerciseId),
}));

// Workout notes and coach comments
export const workoutNotes = pgTable("workout_notes", {
  id: serial("id").primaryKey(),
  userWorkoutId: integer("user_workout_id").notNull().references(() => userWorkouts.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // user-note, coach-comment, ai-suggestion, progress-update
  content: text("content").notNull(),
  createdBy: text("created_by").notNull(), // user, coach-{coachName}, ai
  isPrivate: boolean("is_private").default(false), // Private user notes vs shared content
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // Performance indexes for hot query paths
  userWorkoutIdIdx: index("workout_notes_user_workout_id_idx").on(table.userWorkoutId),
}));

// Workout events for stats tracking
export const workoutEvents = pgTable("workout_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  userWorkoutId: integer("user_workout_id").references(() => userWorkouts.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(), // start, set_complete, pr_complete, pb_hit, workout_complete
  exerciseId: integer("exercise_id").references(() => exercises.id),
  setId: integer("set_id").references(() => workoutSets.id),
  eventData: text("event_data"), // JSON metadata (weight lifted, time achieved, etc.)
  achievedAt: timestamp("achieved_at").defaultNow().notNull(),
}, (table) => ({
  // Performance indexes for hot query paths
  userIdIdx: index("workout_events_user_id_idx").on(table.userId),
  userWorkoutIdIdx: index("workout_events_user_workout_id_idx").on(table.userWorkoutId),
  achievedAtIdx: index("workout_events_achieved_at_idx").on(table.achievedAt),
}));

// Daily metrics rollup for stats
export const metricsDaily = pgTable("metrics_daily", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // YYYY-MM-DD format
  workoutsCompleted: integer("workouts_completed").default(0),
  totalVolume: integer("total_volume").default(0), // Total weight lifted (lbs/kg)
  totalDuration: integer("total_duration").default(0), // Total workout time (minutes)
  averageRpe: integer("average_rpe"), // Average RPE for the day
  personalRecords: integer("personal_records").default(0), // Number of PRs achieved
  caloriesBurned: integer("calories_burned").default(0), // Estimated calories
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Composite unique constraint to prevent duplicate entries per user per date
  uniqueUserDate: unique().on(table.userId, table.date),
  // Performance indexes for hot query paths
  userIdIdx: index("metrics_daily_user_id_idx").on(table.userId),
  dateIdx: index("metrics_daily_date_idx").on(table.date),
}));

// Relations for new workout tables
export const exercisesRelations = relations(exercises, ({ many }) => ({
  workoutSets: many(workoutSets),
  workoutEvents: many(workoutEvents),
}));

export const workoutSetsRelations = relations(workoutSets, ({ one }) => ({
  userWorkout: one(userWorkouts, {
    fields: [workoutSets.userWorkoutId],
    references: [userWorkouts.id],
  }),
  exercise: one(exercises, {
    fields: [workoutSets.exerciseId],
    references: [exercises.id],
  }),
}));

export const workoutNotesRelations = relations(workoutNotes, ({ one }) => ({
  userWorkout: one(userWorkouts, {
    fields: [workoutNotes.userWorkoutId],
    references: [userWorkouts.id],
  }),
}));

export const workoutEventsRelations = relations(workoutEvents, ({ one }) => ({
  user: one(users, {
    fields: [workoutEvents.userId],
    references: [users.id],
  }),
  userWorkout: one(userWorkouts, {
    fields: [workoutEvents.userWorkoutId],
    references: [userWorkouts.id],
  }),
  exercise: one(exercises, {
    fields: [workoutEvents.exerciseId],
    references: [exercises.id],
  }),
  workoutSet: one(workoutSets, {
    fields: [workoutEvents.setId],
    references: [workoutSets.id],
  }),
}));

export const metricsDailyRelations = relations(metricsDaily, ({ one }) => ({
  user: one(users, {
    fields: [metricsDaily.userId],
    references: [users.id],
  }),
}));

// Define user workouts relations (moved here to avoid forward reference)
export const userWorkoutsRelations = relations(userWorkouts, ({ one, many }) => ({
  user: one(users, {
    fields: [userWorkouts.userId],
    references: [users.id],
  }),
  workout: one(workouts, {
    fields: [userWorkouts.workoutId],
    references: [workouts.id],
  }),
  workoutSets: many(workoutSets),
  workoutNotes: many(workoutNotes),
  workoutEvents: many(workoutEvents),
}));

// Insert schemas for new tables
export const insertExerciseSchema = createInsertSchema(exercises).omit({
  id: true,
  createdAt: true,
});

// Minimal exercise schema for bulk upsert
export const insertExerciseMinimalSchema = createInsertSchema(exercises)
  .pick({
    slug: true,
    name: true,
    aliases: true,
    body_part: true,
    equipment: true,
    pattern: true,
    is_unilateral: true,
  })
  .extend({
    slug: z.string().optional(), // Allow optional slug (will be generated from name)
    name: z.string().min(1, "Exercise name is required"),
    aliases: z.array(z.string()).default([]),
    body_part: z.string().optional(),
    equipment: z.array(z.string()).default([]),
    pattern: z.string().optional(),
    is_unilateral: z.boolean().default(false),
  });

export const insertWorkoutSetSchema = createInsertSchema(workoutSets).omit({
  id: true,
  completedAt: true,
});

export const insertWorkoutNoteSchema = createInsertSchema(workoutNotes).omit({
  id: true,
  createdAt: true,
});

export const insertWorkoutEventSchema = createInsertSchema(workoutEvents).omit({
  id: true,
  achievedAt: true,
});

export const insertMetricsDailySchema = createInsertSchema(metricsDaily).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type WorkoutDay = typeof workoutDays.$inferSelect;
export type InsertWorkoutDay = z.infer<typeof insertWorkoutDaySchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Workout = typeof workouts.$inferSelect;
export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;

export type UserWorkout = typeof userWorkouts.$inferSelect;
export type InsertUserWorkout = z.infer<typeof insertUserWorkoutSchema>;

// New workout table types
export type Exercise = typeof exercises.$inferSelect;
export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type InsertExerciseMinimal = z.infer<typeof insertExerciseMinimalSchema>;

export type WorkoutSet = typeof workoutSets.$inferSelect;
export type InsertWorkoutSet = z.infer<typeof insertWorkoutSetSchema>;

export type WorkoutNote = typeof workoutNotes.$inferSelect;
export type InsertWorkoutNote = z.infer<typeof insertWorkoutNoteSchema>;

export type WorkoutEvent = typeof workoutEvents.$inferSelect;
export type InsertWorkoutEvent = z.infer<typeof insertWorkoutEventSchema>;

export type MetricsDaily = typeof metricsDaily.$inferSelect;
export type InsertMetricsDaily = z.infer<typeof insertMetricsDailySchema>;

// Achievements schema
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // "fitness", "nutrition", "engagement", "events"
  badgeIcon: text("badge_icon").notNull(),
  badgeColor: text("badge_color").notNull(),
  rarity: text("rarity").default("common").notNull(), // "common", "rare", "epic", "legendary"
  threshold: integer("threshold").notNull(), // Number required to achieve (workouts, days, etc.)
  xpReward: integer("xp_reward").default(50).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Quests schema - daily and weekly challenges
export const quests = pgTable("quests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // "daily", "weekly"
  category: text("category").notNull(), // "fitness", "nutrition", "engagement"
  target: integer("target").notNull(), // Target number to complete
  xpReward: integer("xp_reward").notNull(),
  icon: text("icon").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User Quests schema - tracks user progress on quests
export const userQuests = pgTable("user_quests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  questId: integer("quest_id").references(() => quests.id).notNull(),
  progress: integer("progress").default(0).notNull(),
  completed: boolean("completed").default(false).notNull(),
  claimed: boolean("claimed").default(false).notNull(),
  completedAt: timestamp("completed_at"),
  claimedAt: timestamp("claimed_at"),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
});

export const achievementsRelations = relations(achievements, ({ many }) => ({
  userAchievements: many(userAchievements),
}));

export const questsRelations = relations(quests, ({ many }) => ({
  userQuests: many(userQuests),
}));

export const userQuestsRelations = relations(userQuests, ({ one }) => ({
  user: one(users, {
    fields: [userQuests.userId],
    references: [users.id],
  }),
  quest: one(quests, {
    fields: [userQuests.questId],
    references: [quests.id],
  }),
}));

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  createdAt: true,
});

export const insertQuestSchema = createInsertSchema(quests).omit({
  id: true,
  createdAt: true,
});

export const insertUserQuestSchema = createInsertSchema(userQuests).omit({
  id: true,
  assignedAt: true,
  completedAt: true,
  claimedAt: true,
});

// User Achievements schema - tracks which achievements a user has earned
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  achievementId: integer("achievement_id").references(() => achievements.id).notNull(),
  unlockedAt: timestamp("unlocked_at").defaultNow().notNull(),
  displayed: boolean("displayed").default(false).notNull(), // Whether achievement notification has been shown
});

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, {
    fields: [userAchievements.userId],
    references: [users.id],
  }),
  achievement: one(achievements, {
    fields: [userAchievements.achievementId],
    references: [achievements.id],
  }),
}));

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
  unlockedAt: true,
});

// User Progress Snapshot schema - tracks weekly/monthly progress for animations
export const progressSnapshots = pgTable("progress_snapshots", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  snapshotDate: timestamp("snapshot_date").defaultNow().notNull(),
  period: text("period").notNull(), // "week", "month"
  workoutsCompleted: integer("workouts_completed").default(0).notNull(),
  minutesTraining: integer("minutes_training").default(0).notNull(),
  streakDays: integer("streak_days").default(0).notNull(),
  caloriesBurned: integer("calories_burned").default(0).notNull(),
});

export const progressSnapshotsRelations = relations(progressSnapshots, ({ one }) => ({
  user: one(users, {
    fields: [progressSnapshots.userId],
    references: [users.id],
  }),
}));

export const insertProgressSnapshotSchema = createInsertSchema(progressSnapshots).omit({
  id: true,
  snapshotDate: true,
});

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;

export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;

export type Quest = typeof quests.$inferSelect;
export type InsertQuest = z.infer<typeof insertQuestSchema>;

export type UserQuest = typeof userQuests.$inferSelect;
export type InsertUserQuest = z.infer<typeof insertUserQuestSchema>;

export type ProgressSnapshot = typeof progressSnapshots.$inferSelect;
export type InsertProgressSnapshot = z.infer<typeof insertProgressSnapshotSchema>;

// Nutrition profile schema
export const nutritionProfiles = pgTable("nutrition_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  // Core nutrition setup from questionnaire
  goal: text("goal").notNull(), // lose-fat, build-muscle, recomp, eat-healthier
  dietaryPattern: text("dietary_pattern"), // none, vegetarian, vegan, pescatarian, halal, kosher, other
  dietaryPatternNotes: text("dietary_pattern_notes"), // custom notes if "other" selected
  cookingTimePreference: text("cooking_time_preference"), // 5-10-min, 15-25-min, 30-45-min, batch-cook
  
  // Allergies and restrictions from questionnaire
  allergiesAndRestrictions: text("allergies_restrictions").array().default([]), // Custom list from user input
  foodDislikes: text("food_dislikes").array().default([]), // Custom list from user input
  
  // Legacy fields for backward compatibility (will be calculated from questionnaire data)
  dietType: text("diet_type").notNull().default('omnivore'), // calculated from dietary pattern
  calorieGoal: integer("calorie_goal").notNull().default(2000), // can be calculated/set later
  proteinGoal: integer("protein_goal").notNull().default(150), // can be calculated based on goal
  carbGoal: integer("carb_goal").notNull().default(200), // can be calculated based on goal
  fatGoal: integer("fat_goal").notNull().default(65), // can be calculated based on goal
  
  // Keep existing fields for legacy support
  allergies: text("allergies").array().default([]),
  preferences: text("preferences").array().default([]),
  excludedFoods: text("excluded_foods").array().default([]),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const nutritionProfilesRelations = relations(nutritionProfiles, ({ one }) => ({
  user: one(users, {
    fields: [nutritionProfiles.userId],
    references: [users.id],
  }),
}));

export const insertNutritionProfileSchema = createInsertSchema(nutritionProfiles).omit({
  id: true,
  updatedAt: true,
});

// AI-Generated Meal Plans schema (updated design)
export const mealPlans = pgTable("meal_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  targetDate: timestamp("target_date").notNull(),
  meals: text("meals").notNull(), // JSON array of meal objects with structure {breakfast: {...}, lunch: {...}, dinner: {...}, snack: {...}}
  totalCalories: integer("total_calories").notNull(),
  totalProtein: integer("total_protein").notNull(),
  totalCarbs: integer("total_carbs").notNull(),
  totalFat: integer("total_fat").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const mealPlansRelations = relations(mealPlans, ({ one, many }) => ({
  user: one(users, {
    fields: [mealPlans.userId],
    references: [users.id],
  }),
  loggedMeals: many(loggedMeals),
}));

export const insertMealPlanSchema = createInsertSchema(mealPlans).omit({
  id: true,
  createdAt: true,
});

// Daily Meal Logs schema
export const loggedMeals = pgTable("logged_meals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  mealPlanId: integer("meal_plan_id").references(() => mealPlans.id),
  mealName: text("meal_name").notNull(),
  mealType: text("meal_type").notNull(), // breakfast, lunch, dinner, snack
  calories: integer("calories").notNull(),
  protein: integer("protein").default(0),
  carbs: integer("carbs").default(0),
  fat: integer("fat").default(0),
  notes: text("notes"),
  loggedAt: timestamp("logged_at").defaultNow().notNull(),
  loggedDate: text("logged_date").notNull(), // YYYY-MM-DD format for easy querying
}, (table) => ({
  // Performance indexes for hot query paths
  userIdIdx: index("logged_meals_user_id_idx").on(table.userId),
  loggedDateIdx: index("logged_meals_logged_date_idx").on(table.loggedDate),
  userDateIdx: index("logged_meals_user_date_idx").on(table.userId, table.loggedDate),
}));

export const loggedMealsRelations = relations(loggedMeals, ({ one }) => ({
  user: one(users, {
    fields: [loggedMeals.userId],
    references: [users.id],
  }),
  mealPlan: one(mealPlans, {
    fields: [loggedMeals.mealPlanId],
    references: [mealPlans.id],
  }),
}));

export const insertLoggedMealSchema = createInsertSchema(loggedMeals).omit({
  id: true,
  loggedAt: true,
});

// Export types for nutrition models
export type NutritionProfile = typeof nutritionProfiles.$inferSelect;
export type InsertNutritionProfile = z.infer<typeof insertNutritionProfileSchema>;

export type MealPlan = typeof mealPlans.$inferSelect;
export type InsertMealPlan = z.infer<typeof insertMealPlanSchema>;

export type LoggedMeal = typeof loggedMeals.$inferSelect;
export type InsertLoggedMeal = z.infer<typeof insertLoggedMealSchema>;

// Social Features - Posts
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isPublic: boolean("is_public").default(true).notNull(),
  likes: integer("likes").default(0).notNull(),
  commentsCount: integer("comments_count").default(0).notNull(),
});

export const postsRelations = relations(posts, ({ one, many }) => ({
  user: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
  comments: many(comments),
  likes: many(postLikes),
}));

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  likes: true,
  commentsCount: true,
});

// Comments
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => posts.id),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Post Likes
export const postLikes = pgTable("post_likes", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => posts.id),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const postLikesRelations = relations(postLikes, ({ one }) => ({
  post: one(posts, {
    fields: [postLikes.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [postLikes.userId],
    references: [users.id],
  }),
}));

export const insertPostLikeSchema = createInsertSchema(postLikes).omit({
  id: true,
  createdAt: true,
});

// User Follows
export const userFollows = pgTable("user_follows", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id").notNull().references(() => users.id),
  followingId: integer("following_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userFollowsRelations = relations(userFollows, ({ one }) => ({
  follower: one(users, {
    fields: [userFollows.followerId],
    references: [users.id],
  }),
  following: one(users, {
    fields: [userFollows.followingId],
    references: [users.id],
  }),
}));

export const insertUserFollowSchema = createInsertSchema(userFollows).omit({
  id: true,
  createdAt: true,
});

// Export social feature types
export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type PostLike = typeof postLikes.$inferSelect;
export type InsertPostLike = z.infer<typeof insertPostLikeSchema>;

export type UserFollow = typeof userFollows.$inferSelect;
export type InsertUserFollow = z.infer<typeof insertUserFollowSchema>;

// Milestones for gamification and social sharing
export const milestones = pgTable("milestones", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // workout_streak, weight_goal, endurance_milestone, etc.
  title: text("title").notNull(),
  description: text("description").notNull(),
  value: integer("value").notNull(), // numeric value of milestone
  unit: text("unit").notNull(), // days, kg, minutes, etc.
  iconType: text("icon_type").notNull(), // fire, trophy, medal, etc.
  colorScheme: text("color_scheme").notNull(), // gold, silver, bronze, blue, etc.
  isShared: boolean("is_shared").default(false),
  shareText: text("share_text"), // Custom share message
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const milestonesRelations = relations(milestones, ({ one, many }) => ({
  user: one(users, {
    fields: [milestones.userId],
    references: [users.id],
  }),
  likes: many(milestoneLikes),
  comments: many(milestoneComments),
}));

// Social interactions for milestones
export const milestoneLikes = pgTable("milestone_likes", {
  id: serial("id").primaryKey(),
  milestoneId: integer("milestone_id").notNull().references(() => milestones.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const milestoneLikesRelations = relations(milestoneLikes, ({ one }) => ({
  milestone: one(milestones, {
    fields: [milestoneLikes.milestoneId],
    references: [milestones.id],
  }),
  user: one(users, {
    fields: [milestoneLikes.userId],
    references: [users.id],
  }),
}));

export const milestoneComments = pgTable("milestone_comments", {
  id: serial("id").primaryKey(),
  milestoneId: integer("milestone_id").notNull().references(() => milestones.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const milestoneCommentsRelations = relations(milestoneComments, ({ one }) => ({
  milestone: one(milestones, {
    fields: [milestoneComments.milestoneId],
    references: [milestones.id],
  }),
  user: one(users, {
    fields: [milestoneComments.userId],
    references: [users.id],
  }),
}));

export const insertMilestoneSchema = createInsertSchema(milestones).omit({
  id: true,
  createdAt: true,
});

export const insertMilestoneLikeSchema = createInsertSchema(milestoneLikes).omit({
  id: true,
  createdAt: true,
});

export const insertMilestoneCommentSchema = createInsertSchema(milestoneComments).omit({
  id: true,
  createdAt: true,
});

// Export milestone types
export type Milestone = typeof milestones.$inferSelect;
export type InsertMilestone = z.infer<typeof insertMilestoneSchema>;

export type MilestoneLike = typeof milestoneLikes.$inferSelect;
export type InsertMilestoneLike = z.infer<typeof insertMilestoneLikeSchema>;

export type MilestoneComment = typeof milestoneComments.$inferSelect;
export type InsertMilestoneComment = z.infer<typeof insertMilestoneCommentSchema>;

