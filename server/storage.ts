import { 
  type User, 
  type InsertUser, 
  type Message, 
  type InsertMessage,
  type Workout,
  type InsertWorkout,
  type UserWorkout,
  type InsertUserWorkout,
  type PerformanceLog,
  type InsertPerformanceLog,
  type Achievement,
  type InsertAchievement,
  type UserAchievement,
  type InsertUserAchievement,
  type Quest,
  type InsertQuest,
  type UserQuest,
  type InsertUserQuest,
  type ProgressSnapshot,
  type InsertProgressSnapshot,
  type NutritionProfile,
  type InsertNutritionProfile,
  type MealPlan,
  type InsertMealPlan,
  type LoggedMeal,
  type InsertLoggedMeal,
  type Post,
  type InsertPost,
  type Comment,
  type InsertComment,
  type PostLike,
  type InsertPostLike,
  type UserFollow,
  type InsertUserFollow,
  type Milestone,
  type InsertMilestone,
  type MilestoneLike,
  type InsertMilestoneLike,
  type MilestoneComment,
  type InsertMilestoneComment,
  type WorkoutDay,
  type InsertWorkoutDay
} from "@shared/schema";
import { db } from "./db";
import { eq, gte, and, desc, count, sql, not, isNull, or } from "drizzle-orm";
import { 
  users, messages, workouts, userWorkouts, performanceLogs,
  achievements, userAchievements, quests, userQuests, progressSnapshots,
  nutritionProfiles, mealPlans, loggedMeals,
  posts, comments, postLikes, userFollows,
  milestones, milestoneLikes, milestoneComments,
  workoutDays
} from "@shared/schema";
import { add, startOfWeek, startOfMonth, subWeeks, subMonths } from "date-fns";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByName(name: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  
  // Message methods
  getUserMessages(userId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Workout methods
  getWorkouts(): Promise<Workout[]>;
  getWorkoutsByType(type: string): Promise<Workout[]>;
  getWorkout(id: number): Promise<Workout | undefined>;
  
  // User Workout methods
  getUserWorkouts(userId: number): Promise<UserWorkout[]>;
  createUserWorkout(userWorkout: InsertUserWorkout): Promise<UserWorkout>;
  getUserCompletedWorkoutsThisWeek(userId: number): Promise<number>;
  getUserTrainingMinutesThisWeek(userId: number): Promise<number>;
  
  // Performance Logging methods - Critical for AI PT Learning
  savePerformanceLog(performanceData: InsertPerformanceLog): Promise<PerformanceLog>;
  getPerformanceHistory(userId: number, exerciseId?: string, limit?: number): Promise<PerformanceLog[]>;
  getPerformanceInsights(userId: number): Promise<any>;
  
  // Achievement methods
  getAchievements(): Promise<Achievement[]>;
  getAchievementsByCategory(category: string): Promise<Achievement[]>;
  getAchievement(id: number): Promise<Achievement | undefined>;
  getUserAchievements(userId: number): Promise<(UserAchievement & { achievement: Achievement })[]>;
  getUnlockedAchievements(userId: number): Promise<(UserAchievement & { achievement: Achievement })[]>;
  createUserAchievement(userAchievement: InsertUserAchievement): Promise<UserAchievement>;
  checkAndAwardAchievements(userId: number): Promise<Achievement[]>;
  markAchievementsAsDisplayed(userId: number): Promise<void>;

  // Quest methods
  getQuests(): Promise<Quest[]>;
  getQuestsByType(type: string): Promise<Quest[]>;
  getQuest(id: number): Promise<Quest | undefined>;
  getUserQuests(userId: number): Promise<(UserQuest & { quest: Quest })[]>;
  createUserQuest(userQuest: InsertUserQuest): Promise<UserQuest>;
  updateUserQuestProgress(userId: number, questId: number, progress: number): Promise<UserQuest | undefined>;
  claimQuestReward(userId: number, questId: number): Promise<UserQuest | undefined>;
  calculateWorkoutStreak(userId: number): Promise<number>;
  
  // Workout Day methods (for plan management)
  getWorkoutDays(userId: number): Promise<WorkoutDay[]>;
  createWorkoutDay(workoutDay: InsertWorkoutDay): Promise<WorkoutDay>;
  updateWorkoutDay(id: number, updates: Partial<WorkoutDay>): Promise<WorkoutDay | undefined>;
  deleteWorkoutDay(id: number): Promise<void>;
  
  // Progress methods
  getUserProgressSnapshots(userId: number, period: string): Promise<ProgressSnapshot[]>;
  createProgressSnapshot(snapshot: InsertProgressSnapshot): Promise<ProgressSnapshot>;
  getLatestProgressSnapshot(userId: number, period: string): Promise<ProgressSnapshot | undefined>;
  
  // Nutrition methods
  getNutritionProfile(userId: number): Promise<NutritionProfile | undefined>;
  createNutritionProfile(profile: InsertNutritionProfile): Promise<NutritionProfile>;
  updateNutritionProfile(userId: number, updates: Partial<NutritionProfile>): Promise<NutritionProfile | undefined>;
  
  // Meal Plan methods
  getUserMealPlans(userId: number): Promise<MealPlan[]>;
  getMealPlan(id: number): Promise<MealPlan | undefined>;
  createMealPlan(mealPlan: InsertMealPlan): Promise<MealPlan>;
  
  // Logged Meal methods
  getUserLoggedMeals(userId: number, date?: string): Promise<LoggedMeal[]>;
  createLoggedMeal(loggedMeal: InsertLoggedMeal): Promise<LoggedMeal>;
  getDailyNutritionStats(userId: number, date: string): Promise<{ calories: number, protein: number, carbs: number, fat: number }>;
  
  // Social methods - Posts
  getPosts(): Promise<Post[]>;
  getUserPosts(userId: number): Promise<Post[]>;
  getPost(id: number): Promise<Post | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: number, updates: Partial<Post>): Promise<Post | undefined>;
  deletePost(id: number): Promise<void>;
  
  // Social methods - Comments
  getPostComments(postId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  deleteComment(id: number): Promise<void>;
  
  // Social methods - Likes
  likePost(postId: number, userId: number): Promise<PostLike>;
  unlikePost(postId: number, userId: number): Promise<void>;
  isPostLikedByUser(postId: number, userId: number): Promise<boolean>;
  
  // Social methods - Follows
  followUser(followerId: number, followingId: number): Promise<UserFollow>;
  unfollowUser(followerId: number, followingId: number): Promise<void>;
  getUserFollowers(userId: number): Promise<User[]>;
  getUserFollowing(userId: number): Promise<User[]>;
  isUserFollowing(followerId: number, followingId: number): Promise<boolean>;
  
  // Milestone methods
  getMilestones(): Promise<Milestone[]>;
  getUserMilestones(userId: number): Promise<Milestone[]>;
  createMilestone(milestone: InsertMilestone): Promise<Milestone>;
  likeMilestone(milestoneId: number, userId: number): Promise<MilestoneLike>;
  unlikeMilestone(milestoneId: number, userId: number): Promise<void>;
  getMilestoneComments(milestoneId: number): Promise<MilestoneComment[]>;
  createMilestoneComment(comment: InsertMilestoneComment): Promise<MilestoneComment>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getUserByName(name: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.name, name));
    return result.length > 0 ? result[0] : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result.length > 0 ? result[0] : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const trialEndsAt = insertUser.trialEndsAt || add(new Date(), { days: 14 }); // 14-day trial
    
    // Debug: Log the onboardingResponses being saved
    console.log('💾 Storage.createUser - onboardingResponses:', insertUser.onboardingResponses);
    
    const result = await db.insert(users).values({
      ...insertUser,
      trialEndsAt,
      hasActiveSubscription: false,
      weeklyGoalWorkouts: 5,
      weeklyGoalMinutes: 150,
    }).returning();
    
    console.log('💾 Storage.createUser - Result onboardingResponses:', result[0]?.onboardingResponses);
    
    return result[0];
  }
  
  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
      
    return result.length > 0 ? result[0] : undefined;
  }
  
  // Message methods
  async getUserMessages(userId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.userId, userId))
      .orderBy(messages.createdAt);
  }
  
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const result = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
      
    return result[0];
  }
  
  // Workout methods
  async getWorkouts(): Promise<Workout[]> {
    return await db.select().from(workouts);
  }
  
  async getWorkoutsByType(type: string): Promise<Workout[]> {
    return await db
      .select()
      .from(workouts)
      .where(eq(workouts.type, type));
  }
  
  async getWorkout(id: number): Promise<Workout | undefined> {
    const result = await db
      .select()
      .from(workouts)
      .where(eq(workouts.id, id));
      
    return result.length > 0 ? result[0] : undefined;
  }
  
  // User Workout methods
  async getUserWorkouts(userId: number): Promise<UserWorkout[]> {
    return await db
      .select()
      .from(userWorkouts)
      .where(eq(userWorkouts.userId, userId))
      .orderBy(desc(userWorkouts.completedAt));
  }
  
  async createUserWorkout(insertUserWorkout: InsertUserWorkout): Promise<UserWorkout> {
    const result = await db
      .insert(userWorkouts)
      .values(insertUserWorkout)
      .returning();
      
    return result[0];
  }
  
  async getUserCompletedWorkoutsThisWeek(userId: number): Promise<number> {
    const startOfThisWeek = startOfWeek(new Date());
    
    const result = await db
      .select({ count: count() })
      .from(userWorkouts)
      .where(
        and(
          eq(userWorkouts.userId, userId),
          gte(userWorkouts.completedAt, startOfThisWeek)
        )
      );
    
    return result[0].count;
  }
  
  async getUserTrainingMinutesThisWeek(userId: number): Promise<number> {
    const startOfThisWeek = startOfWeek(new Date());
    
    // Use a join to get the durations
    const result = await db
      .select({
        duration: workouts.duration
      })
      .from(userWorkouts)
      .innerJoin(workouts, eq(userWorkouts.workoutId, workouts.id))
      .where(
        and(
          eq(userWorkouts.userId, userId),
          gte(userWorkouts.completedAt, startOfThisWeek)
        )
      );
    
    // Sum up all the durations
    return result.reduce((total, row) => total + row.duration, 0);
  }
  
  // Performance Logging methods
  async savePerformanceLog(performanceData: InsertPerformanceLog): Promise<PerformanceLog> {
    const result = await db
      .insert(performanceLogs)
      .values(performanceData)
      .returning();
    return result[0];
  }
  
  async getPerformanceHistory(userId: number, exerciseId?: string, limit = 50): Promise<PerformanceLog[]> {
    let query = db
      .select()
      .from(performanceLogs)
      .where(eq(performanceLogs.userId, userId));
    
    if (exerciseId) {
      query = query.where(eq(performanceLogs.exerciseId, exerciseId));
    }
    
    return await query.orderBy(desc(performanceLogs.loggedAt)).limit(limit);
  }
  
  async getPerformanceInsights(userId: number): Promise<any> {
    return {};
  }
  
  // Achievement methods
  async getAchievements(): Promise<Achievement[]> {
    return await db.select().from(achievements);
  }
  
  async getAchievementsByCategory(category: string): Promise<Achievement[]> {
    return await db
      .select()
      .from(achievements)
      .where(eq(achievements.category, category));
  }
  
  async getAchievement(id: number): Promise<Achievement | undefined> {
    const result = await db
      .select()
      .from(achievements)
      .where(eq(achievements.id, id));
      
    return result.length > 0 ? result[0] : undefined;
  }
  
  async getUserAchievements(userId: number): Promise<(UserAchievement & { achievement: Achievement })[]> {
    return await db
      .select({
        id: userAchievements.id,
        userId: userAchievements.userId,
        achievementId: userAchievements.achievementId,
        unlockedAt: userAchievements.unlockedAt,
        displayed: userAchievements.displayed,
        achievement: achievements
      })
      .from(userAchievements)
      .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .where(eq(userAchievements.userId, userId))
      .orderBy(desc(userAchievements.unlockedAt));
  }
  
  async getUnlockedAchievements(userId: number): Promise<(UserAchievement & { achievement: Achievement })[]> {
    return await db
      .select({
        id: userAchievements.id,
        userId: userAchievements.userId,
        achievementId: userAchievements.achievementId,
        unlockedAt: userAchievements.unlockedAt,
        displayed: userAchievements.displayed,
        achievement: achievements
      })
      .from(userAchievements)
      .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
      .where(
        and(
          eq(userAchievements.userId, userId),
          eq(userAchievements.displayed, false)
        )
      )
      .orderBy(desc(userAchievements.unlockedAt));
  }
  
  async createUserAchievement(insertUserAchievement: InsertUserAchievement): Promise<UserAchievement> {
    const result = await db
      .insert(userAchievements)
      .values(insertUserAchievement)
      .returning();
      
    return result[0];
  }
  
  async checkAndAwardAchievements(userId: number): Promise<Achievement[]> {
    // Get all achievements
    const allAchievements = await this.getAchievements();
    
    // Get user's existing achievements
    const userAchievementsResult = await db
      .select({ achievementId: userAchievements.achievementId })
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId));
    
    const userAchievementIds = userAchievementsResult.map(ua => ua.achievementId);
    
    // Get counts and stats for the user
    const workoutCount = await this.getUserCompletedWorkoutsThisWeek(userId);
    const minutesCount = await this.getUserTrainingMinutesThisWeek(userId);
    
    // Filter achievements that user doesn't have yet and has qualified for
    const newlyEarnedAchievements: Achievement[] = [];
    
    for (const achievement of allAchievements) {
      // Skip if user already has this achievement
      if (userAchievementIds.includes(achievement.id)) {
        continue;
      }
      
      let qualified = false;
      
      // Check qualification based on category
      switch (achievement.category) {
        case 'workout':
          qualified = workoutCount >= achievement.threshold;
          break;
        case 'minutes':
          qualified = minutesCount >= achievement.threshold;
          break;
        // Add other category checks as needed
      }
      
      if (qualified) {
        // Award the achievement
        await this.createUserAchievement({
          userId,
          achievementId: achievement.id,
          displayed: false
        });
        
        newlyEarnedAchievements.push(achievement);
      }
    }
    
    return newlyEarnedAchievements;
  }
  
  async markAchievementsAsDisplayed(userId: number): Promise<void> {
    await db
      .update(userAchievements)
      .set({ displayed: true })
      .where(
        and(
          eq(userAchievements.userId, userId),
          eq(userAchievements.displayed, false)
        )
      );
  }

  // Quest methods
  async getQuests(): Promise<Quest[]> {
    return await db.select().from(quests);
  }

  async getQuestsByType(type: string): Promise<Quest[]> {
    return await db.select().from(quests).where(eq(quests.type, type));
  }

  async getQuest(id: number): Promise<Quest | undefined> {
    const result = await db.select().from(quests).where(eq(quests.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getUserQuests(userId: number): Promise<(UserQuest & { quest: Quest })[]> {
    const result = await db
      .select()
      .from(userQuests)
      .innerJoin(quests, eq(userQuests.questId, quests.id))
      .where(eq(userQuests.userId, userId))
      .orderBy(desc(userQuests.assignedAt));
    
    return result.map(row => ({
      ...row.user_quests,
      quest: row.quests
    }));
  }

  async createUserQuest(userQuest: InsertUserQuest): Promise<UserQuest> {
    const result = await db
      .insert(userQuests)
      .values(userQuest)
      .returning();
    return result[0];
  }

  async updateUserQuestProgress(userId: number, questId: number, progress: number): Promise<UserQuest | undefined> {
    const result = await db
      .update(userQuests)
      .set({ 
        progress,
        completed: progress >= (await this.getQuest(questId))?.target!,
        completedAt: progress >= (await this.getQuest(questId))?.target! ? new Date() : undefined
      })
      .where(
        and(
          eq(userQuests.userId, userId),
          eq(userQuests.questId, questId)
        )
      )
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }

  async claimQuestReward(userId: number, questId: number): Promise<UserQuest | undefined> {
    const result = await db
      .update(userQuests)
      .set({ 
        claimed: true,
        claimedAt: new Date()
      })
      .where(
        and(
          eq(userQuests.userId, userId),
          eq(userQuests.questId, questId),
          eq(userQuests.completed, true),
          eq(userQuests.claimed, false)
        )
      )
      .returning();
    
    if (result.length > 0) {
      // Award XP to user
      const quest = await this.getQuest(questId);
      if (quest) {
        const user = await this.getUser(userId);
        if (user) {
          const newXpPoints = (user.xpPoints || 0) + quest.xpReward;
          const level = this.calculateLevelFromXP(newXpPoints);
          
          await this.updateUser(userId, {
            xpPoints: newXpPoints,
            level
          });
        }
      }
    }
    
    return result.length > 0 ? result[0] : undefined;
  }

  calculateLevelFromXP(xpPoints: number): string {
    if (xpPoints < 100) return "Bronze";
    if (xpPoints < 300) return "Silver";
    if (xpPoints < 600) return "Gold";
    if (xpPoints < 1000) return "Platinum";
    return "Diamond";
  }

  async calculateWorkoutStreak(userId: number): Promise<number> {
    const workouts = await db
      .select()
      .from(userWorkouts)
      .where(eq(userWorkouts.userId, userId))
      .orderBy(desc(userWorkouts.completedAt));

    if (workouts.length === 0) return 0;

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const workout of workouts) {
      const workoutDate = new Date(workout.completedAt);
      workoutDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((currentDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === streak) {
        streak++;
        currentDate = new Date(workoutDate);
      } else if (daysDiff > streak) {
        break;
      }
    }

    return streak;
  }
  
  // Workout Day methods (for plan management)
  async getWorkoutDays(userId: number): Promise<WorkoutDay[]> {
    return await db
      .select()
      .from(workoutDays)
      .where(eq(workoutDays.userId, userId))
      .orderBy(workoutDays.dayIndex);
  }
  
  async createWorkoutDay(workoutDay: InsertWorkoutDay): Promise<WorkoutDay> {
    const result = await db
      .insert(workoutDays)
      .values(workoutDay)
      .returning();
    return result[0];
  }
  
  async updateWorkoutDay(id: number, updates: Partial<WorkoutDay>): Promise<WorkoutDay | undefined> {
    const result = await db
      .update(workoutDays)
      .set(updates)
      .where(eq(workoutDays.id, id))
      .returning();
    return result[0];
  }
  
  async deleteWorkoutDay(id: number): Promise<void> {
    await db
      .delete(workoutDays)
      .where(eq(workoutDays.id, id));
  }
  
  // Progress methods
  async getUserProgressSnapshots(userId: number, period: string): Promise<ProgressSnapshot[]> {
    let dateFilter;
    
    if (period === 'week') {
      dateFilter = subWeeks(new Date(), 8); // Last 8 weeks
    } else if (period === 'month') {
      dateFilter = subMonths(new Date(), 6); // Last 6 months
    } else {
      dateFilter = subMonths(new Date(), 12); // Last year by default
    }
    
    return await db
      .select()
      .from(progressSnapshots)
      .where(
        and(
          eq(progressSnapshots.userId, userId),
          eq(progressSnapshots.period, period),
          gte(progressSnapshots.snapshotDate, dateFilter)
        )
      )
      .orderBy(progressSnapshots.snapshotDate);
  }
  
  async createProgressSnapshot(snapshot: InsertProgressSnapshot): Promise<ProgressSnapshot> {
    const result = await db
      .insert(progressSnapshots)
      .values(snapshot)
      .returning();
      
    return result[0];
  }
  
  async getLatestProgressSnapshot(userId: number, period: string): Promise<ProgressSnapshot | undefined> {
    const result = await db
      .select()
      .from(progressSnapshots)
      .where(
        and(
          eq(progressSnapshots.userId, userId),
          eq(progressSnapshots.period, period)
        )
      )
      .orderBy(desc(progressSnapshots.snapshotDate))
      .limit(1);
      
    return result.length > 0 ? result[0] : undefined;
  }
  
  // Nutrition methods
  async getNutritionProfile(userId: number): Promise<NutritionProfile | undefined> {
    const result = await db
      .select()
      .from(nutritionProfiles)
      .where(eq(nutritionProfiles.userId, userId));
      
    return result.length > 0 ? result[0] : undefined;
  }
  
  async createNutritionProfile(profile: InsertNutritionProfile): Promise<NutritionProfile> {
    const result = await db
      .insert(nutritionProfiles)
      .values(profile)
      .returning();
      
    return result[0];
  }
  
  async updateNutritionProfile(userId: number, updates: Partial<NutritionProfile>): Promise<NutritionProfile | undefined> {
    const result = await db
      .update(nutritionProfiles)
      .set(updates)
      .where(eq(nutritionProfiles.userId, userId))
      .returning();
      
    return result.length > 0 ? result[0] : undefined;
  }
  
  // Meal Plan methods
  async getUserMealPlans(userId: number): Promise<MealPlan[]> {
    return await db
      .select()
      .from(mealPlans)
      .where(eq(mealPlans.userId, userId))
      .orderBy(desc(mealPlans.createdAt));
  }
  
  async getMealPlan(id: number): Promise<MealPlan | undefined> {
    const result = await db
      .select()
      .from(mealPlans)
      .where(eq(mealPlans.id, id));
      
    return result.length > 0 ? result[0] : undefined;
  }
  
  async createMealPlan(mealPlan: InsertMealPlan): Promise<MealPlan> {
    const result = await db
      .insert(mealPlans)
      .values(mealPlan)
      .returning();
      
    return result[0];
  }
  
  // Logged Meal methods
  async getUserLoggedMeals(userId: number, date?: string): Promise<LoggedMeal[]> {
    if (date) {
      return await db
        .select()
        .from(loggedMeals)
        .where(and(eq(loggedMeals.userId, userId), eq(loggedMeals.loggedDate, date)))
        .orderBy(loggedMeals.loggedAt);
    } else {
      return await db
        .select()
        .from(loggedMeals)
        .where(eq(loggedMeals.userId, userId))
        .orderBy(loggedMeals.loggedAt);
    }
  }
  
  async createLoggedMeal(loggedMeal: InsertLoggedMeal): Promise<LoggedMeal> {
    const result = await db
      .insert(loggedMeals)
      .values(loggedMeal)
      .returning();
      
    return result[0];
  }
  
  async getDailyNutritionStats(userId: number, date: string): Promise<{ calories: number, protein: number, carbs: number, fat: number }> {
    const meals = await this.getUserLoggedMeals(userId, date);
    
    return meals.reduce((totals, meal) => ({
      calories: totals.calories + meal.calories,
      protein: totals.protein + (meal.protein || 0),
      carbs: totals.carbs + (meal.carbs || 0),
      fat: totals.fat + (meal.fat || 0)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }
  
  // Method to seed initial workout data
  async seedWorkoutsIfNeeded(): Promise<void> {
    // Check if we already have workouts
    const existingWorkouts = await db.select().from(workouts).limit(1);
    
    if (existingWorkouts.length === 0) {
      // No workouts exist, let's seed the database
      await db.insert(workouts).values([
        {
          title: "Upper Body Push Circuit",
          description: "Push-ups, dips, and handstand progressions to build upper body strength.",
          duration: 25,
          difficulty: "Medium",
          type: "calisthenics",
          imageUrl: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=800&q=80",
          tags: ["upper body", "push", "strength"],
        },
        {
          title: "Handstand Basics",
          description: "Learn the fundamentals of handstand technique and balance.",
          duration: 15,
          difficulty: "Beginner",
          type: "calisthenics",
          imageUrl: "https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=500&q=80",
          tags: ["skill", "balance", "core"],
        },
        {
          title: "Core Crusher",
          description: "Intense abdominal and core workout to build strength and definition.",
          duration: 10,
          difficulty: "Medium",
          type: "calisthenics",
          imageUrl: "https://images.unsplash.com/photo-1616803689943-5601631c7fec?auto=format&fit=crop&w=500&q=80",
          tags: ["abs", "core", "bodyweight"],
        },
        {
          title: "Full Body Flow",
          description: "A comprehensive mobility routine to improve flexibility and movement quality.",
          duration: 20,
          difficulty: "Easy",
          type: "wellness",
          imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=500&q=80",
          tags: ["mobility", "recovery", "flexibility"],
        },
        {
          title: "Strength Foundation",
          description: "Build foundational strength with compound barbell movements.",
          duration: 45,
          difficulty: "Medium",
          type: "strength",
          imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=500&q=80",
          tags: ["barbell", "strength", "compound"],
        },
        {
          title: "Morning Energizer",
          description: "Start your day with this invigorating yoga and mobility session.",
          duration: 15,
          difficulty: "Easy",
          type: "wellness",
          imageUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=500&q=80",
          tags: ["yoga", "morning", "energy"],
        }
      ]);
      
      console.log("Database seeded with initial workout data");
    }
  }
  
  // Method to seed initial achievements
  async seedAchievementsIfNeeded(): Promise<void> {
    // Check if we already have achievements
    const existingAchievements = await db.select().from(achievements).limit(1);
    
    if (existingAchievements.length === 0) {
      // No achievements exist, let's seed the database
      await db.insert(achievements).values([
        // Workout count achievements
        {
          name: "First Workout",
          description: "Complete your first workout",
          category: "workout",
          badgeIcon: "fa-dumbbell",
          badgeColor: "bg-blue-500",
          threshold: 1,
        },
        {
          name: "Getting Started",
          description: "Complete 5 workouts",
          category: "workout",
          badgeIcon: "fa-fire",
          badgeColor: "bg-green-500",
          threshold: 5,
        },
        {
          name: "Building Momentum",
          description: "Complete 10 workouts",
          category: "workout",
          badgeIcon: "fa-bolt",
          badgeColor: "bg-yellow-500",
          threshold: 10,
        },
        {
          name: "Consistency Champion",
          description: "Complete 25 workouts",
          category: "workout",
          badgeIcon: "fa-trophy",
          badgeColor: "bg-orange-500",
          threshold: 25,
        },
        {
          name: "Fitness Devotee",
          description: "Complete 50 workouts",
          category: "workout",
          badgeIcon: "fa-medal",
          badgeColor: "bg-red-500",
          threshold: 50,
        },
        
        // Minutes trained achievements
        {
          name: "First Steps",
          description: "Train for a total of 30 minutes",
          category: "minutes",
          badgeIcon: "fa-clock",
          badgeColor: "bg-blue-400",
          threshold: 30,
        },
        {
          name: "Getting in the Zone",
          description: "Train for a total of 120 minutes",
          category: "minutes",
          badgeIcon: "fa-hourglass-half",
          badgeColor: "bg-green-400",
          threshold: 120,
        },
        {
          name: "Putting in the Work",
          description: "Train for a total of 300 minutes",
          category: "minutes",
          badgeIcon: "fa-stopwatch",
          badgeColor: "bg-yellow-400",
          threshold: 300,
        },
        {
          name: "Dedication Personified",
          description: "Train for a total of 600 minutes",
          category: "minutes",
          badgeIcon: "fa-star",
          badgeColor: "bg-purple-500",
          threshold: 600,
        },
      ]);
      
      console.log("Database seeded with initial achievement data");
    }
  }

  // Social methods - Posts
  async getPosts(): Promise<Post[]> {
    const results = await db
      .select({
        id: posts.id,
        userId: posts.userId,
        content: posts.content,
        imageUrl: posts.imageUrl,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        isPublic: posts.isPublic,
        likes: posts.likes,
        commentsCount: posts.commentsCount,
        user: users
      })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .orderBy(desc(posts.createdAt));
    
    // Return posts with user data included
    return results.map(post => ({
      ...post,
      user: {
        id: post.user.id,
        name: post.user.name,
        email: post.user.email
      }
    }));
  }

  async getUserPosts(userId: number): Promise<Post[]> {
    const results = await db
      .select({
        id: posts.id,
        userId: posts.userId,
        content: posts.content,
        imageUrl: posts.imageUrl,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        isPublic: posts.isPublic,
        likes: posts.likes,
        commentsCount: posts.commentsCount,
        user: users
      })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .where(eq(posts.userId, userId))
      .orderBy(desc(posts.createdAt));
    
    // Return posts omitting the user field to match Post type
    return results.map(post => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { user, ...postData } = post;
      return postData;
    });
  }

  async getPost(id: number): Promise<Post | undefined> {
    const result = await db
      .select({
        id: posts.id,
        userId: posts.userId,
        content: posts.content,
        imageUrl: posts.imageUrl,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        isPublic: posts.isPublic,
        likes: posts.likes,
        commentsCount: posts.commentsCount,
        user: users
      })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .where(eq(posts.id, id));
      
    if (result.length === 0) {
      return undefined;
    }
    
    // Remove user field to match Post type
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user, ...postData } = result[0];
    return postData;
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    const result = await db
      .insert(posts)
      .values(insertPost)
      .returning();
      
    // Get the full post with user info
    const post = await this.getPost(result[0].id);
    return post!;
  }

  async updatePost(id: number, updates: Partial<Post>): Promise<Post | undefined> {
    const result = await db
      .update(posts)
      .set(updates)
      .where(eq(posts.id, id))
      .returning();
      
    if (result.length === 0) return undefined;
    
    // Get the full post with user info
    return await this.getPost(id);
  }

  async deletePost(id: number): Promise<void> {
    await db
      .delete(posts)
      .where(eq(posts.id, id));
  }

  // Social methods - Comments
  async getPostComments(postId: number): Promise<Comment[]> {
    const results = await db
      .select({
        id: comments.id,
        postId: comments.postId,
        userId: comments.userId,
        content: comments.content,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        user: users
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.postId, postId))
      .orderBy(comments.createdAt);
      
    // Transform to match Comment type without the user field
    return results.map(comment => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { user, ...commentData } = comment;
      return commentData;
    });
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const result = await db
      .insert(comments)
      .values(insertComment)
      .returning();
      
    // Get the full comment with user info
    const [commentWithUser] = await db
      .select({
        id: comments.id,
        postId: comments.postId,
        userId: comments.userId,
        content: comments.content,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        user: users
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.id, result[0].id));
      
    // Transform to match Comment type without the user field
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user, ...commentData } = commentWithUser;
    return commentData;
  }

  async deleteComment(id: number): Promise<void> {
    await db
      .delete(comments)
      .where(eq(comments.id, id));
  }

  // Social methods - Likes
  async likePost(postId: number, userId: number): Promise<PostLike> {
    // Check if already liked
    const existingLike = await db
      .select()
      .from(postLikes)
      .where(
        and(
          eq(postLikes.postId, postId),
          eq(postLikes.userId, userId)
        )
      );
      
    if (existingLike.length > 0) {
      return existingLike[0];
    }
    
    // Create new like
    const result = await db
      .insert(postLikes)
      .values({
        postId,
        userId
      })
      .returning();
      
    return result[0];
  }

  async unlikePost(postId: number, userId: number): Promise<void> {
    await db
      .delete(postLikes)
      .where(
        and(
          eq(postLikes.postId, postId),
          eq(postLikes.userId, userId)
        )
      );
  }

  async isPostLikedByUser(postId: number, userId: number): Promise<boolean> {
    const result = await db
      .select()
      .from(postLikes)
      .where(
        and(
          eq(postLikes.postId, postId),
          eq(postLikes.userId, userId)
        )
      );
      
    return result.length > 0;
  }

  // Social methods - Follows
  async followUser(followerId: number, followingId: number): Promise<UserFollow> {
    // Check if already following
    const existingFollow = await db
      .select()
      .from(userFollows)
      .where(
        and(
          eq(userFollows.followerId, followerId),
          eq(userFollows.followingId, followingId)
        )
      );
      
    if (existingFollow.length > 0) {
      return existingFollow[0];
    }
    
    // Create new follow
    const result = await db
      .insert(userFollows)
      .values({
        followerId,
        followingId
      })
      .returning();
      
    return result[0];
  }

  async unfollowUser(followerId: number, followingId: number): Promise<void> {
    await db
      .delete(userFollows)
      .where(
        and(
          eq(userFollows.followerId, followerId),
          eq(userFollows.followingId, followingId)
        )
      );
  }

  async getUserFollowers(userId: number): Promise<User[]> {
    const result = await db
      .select({
        follower: users
      })
      .from(userFollows)
      .innerJoin(users, eq(userFollows.followerId, users.id))
      .where(eq(userFollows.followingId, userId));
      
    return result.map(r => r.follower);
  }

  async getUserFollowing(userId: number): Promise<User[]> {
    const result = await db
      .select({
        following: users
      })
      .from(userFollows)
      .innerJoin(users, eq(userFollows.followingId, users.id))
      .where(eq(userFollows.followerId, userId));
      
    return result.map(r => r.following);
  }

  async isUserFollowing(followerId: number, followingId: number): Promise<boolean> {
    const result = await db
      .select()
      .from(userFollows)
      .where(
        and(
          eq(userFollows.followerId, followerId),
          eq(userFollows.followingId, followingId)
        )
      );
      
    return result.length > 0;
  }

  // Milestone methods implementation
  async getMilestones(): Promise<Milestone[]> {
    return await db.select().from(milestones).orderBy(desc(milestones.createdAt));
  }

  async getUserMilestones(userId: number): Promise<Milestone[]> {
    return await db.select().from(milestones)
      .where(eq(milestones.userId, userId))
      .orderBy(desc(milestones.createdAt));
  }

  async createMilestone(insertMilestone: InsertMilestone): Promise<Milestone> {
    const [milestone] = await db.insert(milestones).values(insertMilestone).returning();
    return milestone;
  }

  async likeMilestone(milestoneId: number, userId: number): Promise<MilestoneLike> {
    const [like] = await db.insert(milestoneLikes)
      .values({ milestoneId, userId })
      .returning();
    return like;
  }

  async unlikeMilestone(milestoneId: number, userId: number): Promise<void> {
    await db.delete(milestoneLikes)
      .where(and(eq(milestoneLikes.milestoneId, milestoneId), eq(milestoneLikes.userId, userId)));
  }

  async getMilestoneComments(milestoneId: number): Promise<MilestoneComment[]> {
    return await db.select().from(milestoneComments)
      .where(eq(milestoneComments.milestoneId, milestoneId))
      .orderBy(milestoneComments.createdAt);
  }

  async createMilestoneComment(insertComment: InsertMilestoneComment): Promise<MilestoneComment> {
    const [comment] = await db.insert(milestoneComments).values(insertComment).returning();
    return comment;
  }
}

// Simple in-memory storage implementation for development
export class MemoryStorage implements IStorage {
  private users: User[] = [];
  private messages: Message[] = [];
  private workouts: Workout[] = [];
  private userWorkouts: UserWorkout[] = [];
  private performanceLogs: PerformanceLog[] = []; // Critical for AI PT Learning
  private achievements: Achievement[] = [];
  private userAchievements: UserAchievement[] = [];
  private quests: Quest[] = [];
  private userQuests: UserQuest[] = [];
  private progressSnapshots: ProgressSnapshot[] = [];
  private nutritionProfiles: NutritionProfile[] = [];
  private mealPlans: MealPlan[] = [];
  private loggedMeals: LoggedMeal[] = [];
  private posts: Post[] = [];
  private comments: Comment[] = [];
  private postLikes: PostLike[] = [];
  private userFollows: UserFollow[] = [];
  private milestones: Milestone[] = [];
  private milestoneLikes: MilestoneLike[] = [];
  private milestoneComments: MilestoneComment[] = [];
  
  private nextId = 1;

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }

  async getUserByName(name: string): Promise<User | undefined> {
    return this.users.find(u => u.name === name);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.users.find(u => u.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      id: this.nextId++,
      ...insertUser,
      trialEndsAt: insertUser.trialEndsAt || add(new Date(), { days: 14 }),
      hasActiveSubscription: insertUser.hasActiveSubscription ?? false,
      weeklyGoalWorkouts: insertUser.weeklyGoalWorkouts ?? 5,
      weeklyGoalMinutes: insertUser.weeklyGoalMinutes ?? 150,
      xpPoints: insertUser.xpPoints ?? 0,
      level: insertUser.level ?? "Bronze",
      createdAt: new Date(),
    };
    this.users.push(user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) return undefined;
    
    this.users[index] = { ...this.users[index], ...updates };
    return this.users[index];
  }

  // Message methods
  async getUserMessages(userId: number): Promise<Message[]> {
    return this.messages.filter(m => m.userId === userId).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const message: Message = {
      id: this.nextId++,
      ...insertMessage,
      createdAt: new Date(),
    };
    this.messages.push(message);
    return message;
  }

  // Workout methods
  async getWorkouts(): Promise<Workout[]> {
    return [...this.workouts];
  }

  async getWorkoutsByType(type: string): Promise<Workout[]> {
    return this.workouts.filter(w => w.type === type);
  }

  async getWorkout(id: number): Promise<Workout | undefined> {
    return this.workouts.find(w => w.id === id);
  }

  // User Workout methods
  async getUserWorkouts(userId: number): Promise<UserWorkout[]> {
    return this.userWorkouts.filter(uw => uw.userId === userId).sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
  }

  async createUserWorkout(insertUserWorkout: InsertUserWorkout): Promise<UserWorkout> {
    const userWorkout: UserWorkout = {
      id: this.nextId++,
      ...insertUserWorkout,
    };
    this.userWorkouts.push(userWorkout);
    return userWorkout;
  }

  async getUserCompletedWorkoutsThisWeek(userId: number): Promise<number> {
    const startOfThisWeek = startOfWeek(new Date());
    return this.userWorkouts.filter(uw => 
      uw.userId === userId && uw.completedAt >= startOfThisWeek
    ).length;
  }

  async getUserTrainingMinutesThisWeek(userId: number): Promise<number> {
    const startOfThisWeek = startOfWeek(new Date());
    const workoutsThisWeek = this.userWorkouts.filter(uw => 
      uw.userId === userId && uw.completedAt >= startOfThisWeek
    );
    
    let totalMinutes = 0;
    for (const uw of workoutsThisWeek) {
      const workout = await this.getWorkout(uw.workoutId);
      if (workout) {
        totalMinutes += workout.duration;
      }
    }
    return totalMinutes;
  }

  // 📊 Performance Logging methods - Critical for AI PT Learning
  async savePerformanceLog(performanceData: InsertPerformanceLog): Promise<PerformanceLog> {
    const performanceLog: PerformanceLog = {
      id: this.nextId++,
      ...performanceData,
      loggedAt: new Date(),
      startTime: performanceData.startTime || new Date(),
      endTime: performanceData.endTime || new Date(),
    };
    this.performanceLogs.push(performanceLog);
    
    console.log(`💾 Saved performance log for user ${performanceData.userId}, exercise ${performanceData.exerciseId}`);
    return performanceLog;
  }

  async getPerformanceHistory(userId: number, exerciseId?: string, limit: number = 50): Promise<PerformanceLog[]> {
    let filtered = this.performanceLogs.filter(log => log.userId === userId);
    
    if (exerciseId) {
      filtered = filtered.filter(log => log.exerciseId === exerciseId);
    }
    
    // Sort by most recent first
    filtered.sort((a, b) => b.loggedAt.getTime() - a.loggedAt.getTime());
    
    // Apply limit
    return filtered.slice(0, limit);
  }

  async getPerformanceInsights(userId: number): Promise<any> {
    const recentLogs = await this.getPerformanceHistory(userId, undefined, 20);
    
    if (recentLogs.length === 0) {
      return {
        insights: "Not enough performance data yet. Complete a few workouts to see AI insights!",
        recommendations: [],
        progressTrends: {}
      };
    }

    // Basic insights from performance data
    const completionRate = recentLogs.filter(log => log.completed).length / recentLogs.length;
    const avgRPE = recentLogs
      .filter(log => log.rpe)
      .reduce((sum, log) => sum + (log.rpe || 0), 0) / 
      recentLogs.filter(log => log.rpe).length;

    return {
      insights: `Based on your last ${recentLogs.length} exercises: ${Math.round(completionRate * 100)}% completion rate, average RPE ${avgRPE?.toFixed(1) || 'N/A'}`,
      recommendations: [
        completionRate < 0.8 ? "Consider reducing workout intensity to improve completion rate" : "Great consistency! Keep it up!",
        avgRPE > 8 ? "Workouts seem challenging - consider adding more rest between sets" : "Good challenge level"
      ],
      progressTrends: {
        completionRate: Math.round(completionRate * 100),
        averageRPE: avgRPE || 0,
        totalExercises: recentLogs.length
      }
    };
  }

  // Stub implementations for other methods - add proper implementations as needed
  async getAchievements(): Promise<Achievement[]> { return [...this.achievements]; }
  async getAchievementsByCategory(category: string): Promise<Achievement[]> { return this.achievements.filter(a => a.category === category); }
  async getAchievement(id: number): Promise<Achievement | undefined> { return this.achievements.find(a => a.id === id); }
  async getUserAchievements(userId: number): Promise<(UserAchievement & { achievement: Achievement })[]> { return []; }
  async getUnlockedAchievements(userId: number): Promise<(UserAchievement & { achievement: Achievement })[]> { return []; }
  async createUserAchievement(userAchievement: InsertUserAchievement): Promise<UserAchievement> { 
    const ua: UserAchievement = { id: this.nextId++, ...userAchievement, unlockedAt: new Date() };
    this.userAchievements.push(ua);
    return ua;
  }
  async checkAndAwardAchievements(userId: number): Promise<Achievement[]> { return []; }
  async markAchievementsAsDisplayed(userId: number): Promise<void> { }

  async getQuests(): Promise<Quest[]> { return [...this.quests]; }
  async getQuestsByType(type: string): Promise<Quest[]> { return this.quests.filter(q => q.type === type); }
  async getQuest(id: number): Promise<Quest | undefined> { return this.quests.find(q => q.id === id); }
  async getUserQuests(userId: number): Promise<(UserQuest & { quest: Quest })[]> { return []; }
  async createUserQuest(userQuest: InsertUserQuest): Promise<UserQuest> { 
    const uq: UserQuest = { id: this.nextId++, ...userQuest, assignedAt: new Date() };
    this.userQuests.push(uq);
    return uq;
  }
  async updateUserQuestProgress(userId: number, questId: number, progress: number): Promise<UserQuest | undefined> { return undefined; }
  async claimQuestReward(userId: number, questId: number): Promise<UserQuest | undefined> { return undefined; }
  async calculateWorkoutStreak(userId: number): Promise<number> { return 0; }

  async getUserProgressSnapshots(userId: number, period: string): Promise<ProgressSnapshot[]> { return []; }
  async createProgressSnapshot(snapshot: InsertProgressSnapshot): Promise<ProgressSnapshot> { 
    const ps: ProgressSnapshot = { id: this.nextId++, ...snapshot };
    this.progressSnapshots.push(ps);
    return ps;
  }
  async getLatestProgressSnapshot(userId: number, period: string): Promise<ProgressSnapshot | undefined> { return undefined; }

  async getNutritionProfile(userId: number): Promise<NutritionProfile | undefined> { return this.nutritionProfiles.find(np => np.userId === userId); }
  async createNutritionProfile(profile: InsertNutritionProfile): Promise<NutritionProfile> { 
    const np: NutritionProfile = { id: this.nextId++, ...profile };
    this.nutritionProfiles.push(np);
    return np;
  }
  async updateNutritionProfile(userId: number, updates: Partial<NutritionProfile>): Promise<NutritionProfile | undefined> { return undefined; }

  async getUserMealPlans(userId: number): Promise<MealPlan[]> { return this.mealPlans.filter(mp => mp.userId === userId); }
  async getMealPlan(id: number): Promise<MealPlan | undefined> { return this.mealPlans.find(mp => mp.id === id); }
  async createMealPlan(mealPlan: InsertMealPlan): Promise<MealPlan> { 
    const mp: MealPlan = { id: this.nextId++, ...mealPlan, createdAt: new Date() };
    this.mealPlans.push(mp);
    return mp;
  }

  async getUserLoggedMeals(userId: number, date?: string): Promise<LoggedMeal[]> { return this.loggedMeals.filter(lm => lm.userId === userId); }
  async createLoggedMeal(loggedMeal: InsertLoggedMeal): Promise<LoggedMeal> { 
    const lm: LoggedMeal = { id: this.nextId++, ...loggedMeal, loggedAt: new Date() };
    this.loggedMeals.push(lm);
    return lm;
  }
  async getDailyNutritionStats(userId: number, date: string): Promise<{ calories: number, protein: number, carbs: number, fat: number }> { 
    return { calories: 0, protein: 0, carbs: 0, fat: 0 };
  }

  async getPosts(): Promise<Post[]> { return [...this.posts]; }
  async getUserPosts(userId: number): Promise<Post[]> { return this.posts.filter(p => p.userId === userId); }
  async getPost(id: number): Promise<Post | undefined> { return this.posts.find(p => p.id === id); }
  async createPost(post: InsertPost): Promise<Post> { 
    const p: Post = { id: this.nextId++, ...post, createdAt: new Date() };
    this.posts.push(p);
    return p;
  }
  async updatePost(id: number, updates: Partial<Post>): Promise<Post | undefined> { return undefined; }
  async deletePost(id: number): Promise<void> { }

  async getPostComments(postId: number): Promise<Comment[]> { return this.comments.filter(c => c.postId === postId); }
  async createComment(comment: InsertComment): Promise<Comment> { 
    const c: Comment = { id: this.nextId++, ...comment, createdAt: new Date() };
    this.comments.push(c);
    return c;
  }
  async deleteComment(id: number): Promise<void> { }

  async likePost(postId: number, userId: number): Promise<PostLike> { 
    const pl: PostLike = { id: this.nextId++, postId, userId, createdAt: new Date() };
    this.postLikes.push(pl);
    return pl;
  }
  async unlikePost(postId: number, userId: number): Promise<void> { }
  async isPostLikedByUser(postId: number, userId: number): Promise<boolean> { return false; }

  async followUser(followerId: number, followingId: number): Promise<UserFollow> { 
    const uf: UserFollow = { id: this.nextId++, followerId, followingId, createdAt: new Date() };
    this.userFollows.push(uf);
    return uf;
  }
  async unfollowUser(followerId: number, followingId: number): Promise<void> { }
  async getUserFollowers(userId: number): Promise<User[]> { return []; }
  async getUserFollowing(userId: number): Promise<User[]> { return []; }
  async isUserFollowing(followerId: number, followingId: number): Promise<boolean> { return false; }

  async getMilestones(): Promise<Milestone[]> { return [...this.milestones]; }
  async getUserMilestones(userId: number): Promise<Milestone[]> { return this.milestones.filter(m => m.userId === userId); }
  async createMilestone(milestone: InsertMilestone): Promise<Milestone> { 
    const m: Milestone = { id: this.nextId++, ...milestone, createdAt: new Date() };
    this.milestones.push(m);
    return m;
  }
  async likeMilestone(milestoneId: number, userId: number): Promise<MilestoneLike> { 
    const ml: MilestoneLike = { id: this.nextId++, milestoneId, userId, createdAt: new Date() };
    this.milestoneLikes.push(ml);
    return ml;
  }
  async unlikeMilestone(milestoneId: number, userId: number): Promise<void> { }
  async getMilestoneComments(milestoneId: number): Promise<MilestoneComment[]> { return this.milestoneComments.filter(mc => mc.milestoneId === milestoneId); }
  async createMilestoneComment(comment: InsertMilestoneComment): Promise<MilestoneComment> { 
    const mc: MilestoneComment = { id: this.nextId++, ...comment, createdAt: new Date() };
    this.milestoneComments.push(mc);
    return mc;
  }
}

// Use PostgreSQL database for all storage - single source of truth
export const storage = new DatabaseStorage();

// Create test user if it doesn't exist
(async () => {
  try {
    // Check if test user already exists
    const existingUser = await storage.getUserByEmail('test@example.com');
    if (existingUser) {
      console.log('✅ Test user exists - Login with: test@example.com / password123');
      return;
    }
    
    const { scrypt, randomBytes } = await import('crypto');
    const { promisify } = await import('util');
    const scryptAsync = promisify(scrypt);
    
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync('password123', salt, 64)) as Buffer;
    const hashedPassword = `${buf.toString("hex")}.${salt}`;
    
    await storage.createUser({
      name: 'Test User',
      email: 'test@example.com',
      password: hashedPassword,
      trainingType: 'general-fitness',
      goal: 'improve-health',
      coachingStyle: 'encouraging-positive',
      selectedCoach: 'nate-green',
    });
    
    console.log('✅ Test user created - Login with: test@example.com / password123');
  } catch (error: any) {
    // Ignore duplicate user errors
    if (!error?.message?.includes('duplicate') && !error?.message?.includes('already exists')) {
      console.error('Error with test user:', error?.message || error);
    }
  }
})();

console.log("📦 Using PostgreSQL database for all storage - single source of truth");
