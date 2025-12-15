import type { Express, Request } from "express";
import { type User as SchemaUser } from "@shared/schema";

// Add Express session augmentation
declare global {
  namespace Express {
    interface User extends SchemaUser {}
    interface Request {
      user?: SchemaUser;
      isAuthenticated(): boolean;
      logout(callback: (err: any) => void): void;
      login(user: SchemaUser, callback: (err: any) => void): void;
    }
  }
}
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import {
  insertUserSchema,
  insertMessageSchema,
  insertUserWorkoutSchema,
  insertExerciseMinimalSchema,
  type InsertExerciseMinimal,
} from "@shared/schema";
import OpenAI from "openai";
import { z } from "zod";
import { generateCoachImage } from "./generate-coach-image";
import { saveChatForLearning, getComprehensiveUserContext, formatUserContextForAI } from "./ai-user-context";
import {
  insertLoggedMealSchema,
  insertMealPlanSchema,
  insertNutritionProfileSchema,
  type NutritionProfile,
  type LoggedMeal,
} from "@shared/schema";
// AI Workout Generator - imported dynamically in endpoint
import { generateExerciseAlternative } from "./ai-exercise-swap";
import { generateWeekWorkouts } from "./week-generator";
import { db } from "./db";
import { eq, count, sql, inArray, ilike, and } from "drizzle-orm";
import {
  posts,
  postLikes,
  comments,
  userFollows,
  passwordResetTokens,
  users,
  workoutDays,
  exercises,
  aiLearningContext,
} from "@shared/schema";
import { sendPasswordResetEmail } from "./email-service-resend";
import { generateSecureToken, hashPassword } from "./crypto-utils";
import multer from "multer";
import fs from "fs";
import path from "path";

// Configure multer for audio file uploads
const audioUpload = multer({
  storage: multer.diskStorage({
    destination: '/tmp/audio-uploads',
    filename: (req, file, cb) => {
      cb(null, `audio-${Date.now()}${path.extname(file.originalname)}`);
    }
  }),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit (Whisper max)
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/m4a', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg'];
    if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith('.m4a')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid audio file type'));
    }
  }
});

// Ensure upload directory exists
const uploadDir = '/tmp/audio-uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Initialize OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

// STABILIZATION: AI Feature Flag for backend
const AI_ENABLED = true;

// Utility function to generate slug from exercise name
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters except spaces and hyphens
    .replace(/[\s_]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

// 🎯 SHARED STATIC WORKOUTS: Single source of truth with exercises for validation
const STATIC_WEEKLY_WORKOUTS = {
  monday: {
    name: "Push Day",
    type: "strength",
    duration: 30,
    muscleGroups: ["Chest", "Shoulders"],
    difficulty: "medium",
    exercises: [
      { id: "push1", name: "Push-ups", sets: 3, reps: 12, rest: 60 },
      { id: "push2", name: "Shoulder Press", sets: 3, reps: 10, rest: 60 },
      { id: "push3", name: "Chest Dips", sets: 3, reps: 8, rest: 60 },
      { id: "push4", name: "Pike Push-ups", sets: 2, reps: 8, rest: 45 },
    ],
  },
  tuesday: {
    name: "Pull Day",
    type: "strength",
    duration: 30,
    muscleGroups: ["Back", "Biceps"],
    difficulty: "medium",
    exercises: [
      { id: "pull1", name: "Pull-ups", sets: 3, reps: 8, rest: 60 },
      { id: "pull2", name: "Bicep Curls", sets: 3, reps: 12, rest: 60 },
      { id: "pull3", name: "Bent-over Rows", sets: 3, reps: 10, rest: 60 },
      { id: "pull4", name: "Face Pulls", sets: 2, reps: 15, rest: 45 },
    ],
  },
  wednesday: {
    name: "Yoga Flow",
    type: "mobility",
    duration: 30,
    muscleGroups: ["Full Body"],
    difficulty: "easy",
    exercises: [
      { id: "yoga1", name: "Sun Salutations", sets: 3, reps: 5, rest: 30 },
      {
        id: "yoga2",
        name: "Warrior Pose",
        sets: 2,
        reps: 1,
        rest: 30,
        duration: 45,
      },
      {
        id: "yoga3",
        name: "Downward Dog",
        sets: 2,
        reps: 1,
        rest: 30,
        duration: 60,
      },
      {
        id: "yoga4",
        name: "Seated Forward Fold",
        sets: 1,
        reps: 1,
        rest: 0,
        duration: 90,
      },
    ],
  },
  thursday: {
    name: "Leg Day",
    type: "strength",
    duration: 35,
    muscleGroups: ["Legs", "Glutes"],
    difficulty: "medium",
    exercises: [
      { id: "leg1", name: "Squats", sets: 3, reps: 15, rest: 60 },
      { id: "leg2", name: "Lunges", sets: 3, reps: 12, rest: 60 },
      { id: "leg3", name: "Glute Bridges", sets: 3, reps: 15, rest: 45 },
      { id: "leg4", name: "Calf Raises", sets: 2, reps: 20, rest: 45 },
    ],
  },
  friday: {
    name: "HIIT Cardio",
    type: "cardio",
    duration: 25,
    muscleGroups: ["Full Body"],
    difficulty: "hard",
    exercises: [
      { id: "hiit1", name: "Burpees", sets: 4, reps: 8, rest: 90 },
      { id: "hiit2", name: "Mountain Climbers", sets: 4, reps: 20, rest: 90 },
      { id: "hiit3", name: "Jump Squats", sets: 4, reps: 15, rest: 90 },
      { id: "hiit4", name: "High Knees", sets: 3, reps: 30, rest: 60 },
    ],
  },
  saturday: {
    name: "Full Body Circuit",
    type: "circuit",
    duration: 40,
    muscleGroups: ["Full Body"],
    difficulty: "medium",
    exercises: [
      { id: "circuit1", name: "Push-ups", sets: 3, reps: 10, rest: 45 },
      { id: "circuit2", name: "Squats", sets: 3, reps: 15, rest: 45 },
      {
        id: "circuit3",
        name: "Plank",
        sets: 3,
        reps: 1,
        rest: 45,
        duration: 45,
      },
      { id: "circuit4", name: "Jumping Jacks", sets: 3, reps: 20, rest: 45 },
    ],
  },
  sunday: {
    name: "Active Recovery",
    type: "mobility",
    duration: 20,
    muscleGroups: ["Full Body"],
    difficulty: "easy",
    exercises: [
      { id: "recovery1", name: "Cat-Cow Stretch", sets: 2, reps: 10, rest: 30 },
      {
        id: "recovery2",
        name: "Child's Pose",
        sets: 1,
        reps: 1,
        rest: 0,
        duration: 60,
      },
      {
        id: "recovery3",
        name: "Gentle Spinal Twists",
        sets: 2,
        reps: 8,
        rest: 30,
      },
      { id: "recovery4", name: "Deep Breathing", sets: 1, reps: 10, rest: 0 },
    ],
  },
};

// 🎯 NORMALIZER: Convert static workout to frontend WorkoutDay format
function normalizeToWorkoutDay(
  dayName: string,
  staticWorkout: typeof STATIC_WEEKLY_WORKOUTS.monday,
  date?: string,
): any {
  const today = date || new Date().toISOString().split("T")[0];

  // Convert exercises to ExerciseSet format for blocks
  const mainExercises = staticWorkout.exercises.map((ex, index) => ({
    exercise_id: ex.id,
    name: ex.name,
    sets: ex.sets,
    reps: ex.reps.toString(),
    rest_sec: ex.rest,
  }));

  return {
    date: today,
    title: staticWorkout.name, // name -> title
    duration_min: staticWorkout.duration, // duration -> duration_min
    coach_notes: `${staticWorkout.name} - ${staticWorkout.type} focused session targeting ${staticWorkout.muscleGroups.join(", ")}.`,
    blocks: [
      {
        type: "main",
        items: mainExercises,
      },
    ],
    // Keep original format for backwards compatibility
    id: `${dayName}-${today}`,
    type: staticWorkout.type,
    muscleGroups: staticWorkout.muscleGroups,
    difficulty: staticWorkout.difficulty,
    status: "ready",
  };
}

// Auth middleware
function requireAuth(req: Request, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

// Helper function to generate a meal plan using OpenAI
async function generateAIMealPlan(nutritionProfile: NutritionProfile): Promise<{
  name: string;
  description: string;
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
  meals: any[];
}> {
  try {
    // Format dietary preferences and restrictions for the prompt
    const allergiesText =
      nutritionProfile.allergies && nutritionProfile.allergies.length > 0
        ? `Allergies: ${nutritionProfile.allergies.join(", ")}. `
        : "";

    const preferencesText =
      nutritionProfile.preferences && nutritionProfile.preferences.length > 0
        ? `Food preferences: ${nutritionProfile.preferences.join(", ")}. `
        : "";

    const excludedText =
      nutritionProfile.excludedFoods &&
      nutritionProfile.excludedFoods.length > 0
        ? `Excluded foods: ${nutritionProfile.excludedFoods.join(", ")}. `
        : "";

    const systemPrompt = `You are a professional nutrition coach and meal planner. 
Create a personalized meal plan based on the following nutrition profile:
- Diet type: ${nutritionProfile.dietType}
- Daily calorie goal: ${nutritionProfile.calorieGoal} calories
- Daily protein goal: ${nutritionProfile.proteinGoal}g
- Daily carbs goal: ${nutritionProfile.carbGoal}g
- Daily fat goal: ${nutritionProfile.fatGoal}g
${allergiesText}${preferencesText}${excludedText}

Create a meal plan with exactly 4 meals: breakfast, lunch, dinner, and a snack.
For each meal, provide name, calories, macros (protein, carbs, fat), ingredients, and simple instructions.
Make the plan realistic, tasty, and easy to prepare. Focus on whole foods where possible.

Respond with a JSON object in this exact format:
{
  "name": "Plan name based on diet type",
  "description": "Brief description of the meal plan",
  "dailyCalories": total calories (number),
  "dailyProtein": total protein in grams (number),
  "dailyCarbs": total carbs in grams (number),
  "dailyFat": total fat in grams (number),
  "meals": [
    {
      "name": "Meal name",
      "type": "breakfast/lunch/dinner/snack",
      "calories": calories (number),
      "protein": protein in grams (number),
      "carbs": carbs in grams (number),
      "fat": fat in grams (number),
      "ingredients": ["ingredient 1", "ingredient 2", ...],
      "instructions": "Step-by-step preparation instructions",
      "prepTime": preparation time in minutes (number)
    },
    ... (repeat for all 4 meals)
  ]
}

The totals for dailyCalories, dailyProtein, dailyCarbs, and dailyFat should be the sum of all meals.
Make sure all numerical values are numbers, not strings.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Generate a personalized meal plan for me." },
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
    });

    // Handle the response content safely
    const content = response.choices[0].message.content || "{}";
    const mealPlanData =
      typeof content === "string" ? JSON.parse(content) : content;

    // Validate the generated data
    // Make sure all required fields are present
    if (
      !mealPlanData.name ||
      !mealPlanData.description ||
      !mealPlanData.dailyCalories ||
      !mealPlanData.dailyProtein ||
      !mealPlanData.dailyCarbs ||
      !mealPlanData.dailyFat ||
      !Array.isArray(mealPlanData.meals) ||
      mealPlanData.meals.length < 4
    ) {
      throw new Error("Generated meal plan data is incomplete");
    }

    // Validate each meal
    for (const meal of mealPlanData.meals) {
      if (
        !meal.name ||
        !meal.type ||
        !meal.calories ||
        !meal.protein ||
        !meal.carbs ||
        !meal.fat ||
        !Array.isArray(meal.ingredients) ||
        !meal.instructions ||
        !meal.prepTime
      ) {
        throw new Error("Generated meal data is incomplete");
      }
    }

    return mealPlanData;
  } catch (error) {
    console.error("Error generating meal plan with AI:", error);
    throw new Error("Failed to generate meal plan with AI");
  }
}

// In-memory storage for video projects (replace with database in production)
const videoProjects: Map<string, any> = new Map();

// AI Coach Tips Generation
async function generateCoachTip(
  userProfile: any,
  currentWorkout?: string,
): Promise<string> {
  try {
    const prompt = `You are a professional fitness coach providing personalized tips. 
    User profile: ${userProfile ? JSON.stringify(userProfile) : "General fitness enthusiast"}
    Current workout: ${currentWorkout || "General fitness"}
    
    Provide a single, actionable fitness tip that is:
    - Specific and practical
    - Relevant to their current workout or general fitness
    - Motivational but not overly enthusiastic
    - Under 100 words
    - Starts with an emoji related to fitness
    
    Focus on form, nutrition, recovery, or motivation.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
      temperature: 0.7,
    });

    return (
      response.choices[0].message.content ||
      "Stay consistent with your workouts - progress comes from showing up every day!"
    );
  } catch (error) {
    console.error("Error generating coach tip:", error);
    return "Remember: form beats speed every time. Focus on perfect technique to prevent injuries and maximize results! 💪";
  }
}

// AI Schedule Editor
async function generateScheduleEdits(
  request: string,
  currentSchedule: any,
): Promise<any[]> {
  try {
    const prompt = `You are an AI fitness scheduler. The user wants to modify their workout schedule.
    
    User request: "${request}"
    Current schedule: ${currentSchedule ? JSON.stringify(currentSchedule) : "Default weekly schedule"}
    
    Generate specific workout schedule modifications based on the request. Respond with a JSON array of edits:
    [
      {
        "date": "YYYY-MM-DD",
        "workoutType": "HIIT Cardio|Upper Body Strength|Lower Body Power|Full Body Circuit|Yoga & Flexibility|Core Training|Cardio Burn|Strength Training|Active Recovery|Rest Day",
        "duration": number_in_minutes,
        "notes": "explanation of the change"
      }
    ]
    
    Guidelines:
    - Make realistic, safe modifications
    - Consider rest days and recovery
    - Provide dates within the next 2 weeks
    - Keep durations between 15-90 minutes
    - Include helpful notes explaining the reasoning`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 800,
      temperature: 0.7,
    });

    const result = JSON.parse(
      response.choices[0].message.content || '{"edits": []}',
    );
    return result.edits || [];
  } catch (error) {
    console.error("Error generating schedule edits:", error);
    return [];
  }
}

// Feature flags configuration
const FEATURE_FLAGS = {
  AI_ENABLED: AI_ENABLED, // Use stabilization flag
  COACH_ENABLED: process.env.COACH_ENABLED !== "false", // Default to true
  SOCIAL_ENABLED: process.env.SOCIAL_ENABLED !== "false", // Default to true
  AWARDS_ENABLED: process.env.AWARDS_ENABLED !== "false", // Default to true
  STATS_ENABLED: process.env.STATS_ENABLED !== "false", // Default to true
  NUTRITION_PRO: process.env.NUTRITION_PRO === "true", // Default to false
} as const;

// Health check function
function validateSecrets() {
  const requiredSecrets = ["DATABASE_URL", "AUTH_SECRET", "COOKIE_SECRET"];

  // If AI is enabled, OpenAI API key becomes required
  if (FEATURE_FLAGS.AI_ENABLED) {
    requiredSecrets.push("OPENAI_API_KEY");
  }

  const missing = requiredSecrets.filter((secret) => !process.env[secret]);

  return {
    required: missing.length === 0,
    missing: missing.length > 0 ? ["Some required secrets missing"] : [], // Don't expose which secrets
    aiReady: FEATURE_FLAGS.AI_ENABLED ? !!process.env.OPENAI_API_KEY : true,
  };
}

export async function registerRoutes(app: Express): Promise<Server> { 
  // Setup authentication first
  setupAuth(app);

  // =============================================================================
  // MILESTONE 1: FOUNDATIONS - Health & Config Endpoints
  // =============================================================================

  // Health endpoint - returns app status and feature flags (no sensitive data)
  app.get("/api/health", async (req, res) => {
    try {
      const secrets = validateSecrets();
      const health = {
        ok: secrets.required && secrets.aiReady,
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || "1.0.0",
        environment: process.env.NODE_ENV || "development",
        features: FEATURE_FLAGS,
        aiReady: secrets.aiReady,
      };

      const statusCode = health.ok ? 200 : 503;
      res.status(statusCode).json(health);
    } catch (error) {
      console.error("Health check failed:", error);
      res.status(500).json({
        ok: false,
        error: "Health check failed",
        timestamp: new Date().toISOString(),
      });
    }
  });

  // =============================================================================
  // VOICE INPUT: Audio Transcription using OpenAI Whisper
  // =============================================================================
  
  app.post("/api/transcribe", audioUpload.single('audio'), async (req, res) => {
    try {
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ error: "No audio file provided" });
      }
      
      console.log('🎤 [TRANSCRIBE] Received audio file:', file.originalname, file.size, 'bytes');
      
      // Check if OpenAI is available
      if (!process.env.OPENAI_API_KEY) {
        fs.unlinkSync(file.path);
        return res.status(503).json({ error: "Transcription service unavailable" });
      }
      
      try {
        // Send to OpenAI Whisper for transcription
        const transcription = await openai.audio.transcriptions.create({
          file: fs.createReadStream(file.path),
          model: "whisper-1",
          language: "en",
          response_format: "text",
        });
        
        console.log('✅ [TRANSCRIBE] Result:', transcription);
        
        // Clean up the uploaded file
        fs.unlinkSync(file.path);
        
        res.json({ 
          text: transcription,
          success: true 
        });
        
      } catch (whisperError: any) {
        console.error('❌ [TRANSCRIBE] Whisper error:', whisperError);
        
        // Clean up file on error
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        
        res.status(500).json({ 
          error: "Transcription failed", 
          message: whisperError.message 
        });
      }
      
    } catch (error: any) {
      console.error('❌ [TRANSCRIBE] Error:', error);
      res.status(500).json({ 
        error: "Failed to process audio",
        message: error.message 
      });
    }
  });

  // =============================================================================
  // WORKOUT PERFORMANCE LOGGING & AI LEARNING
  // =============================================================================
  
  // Log workout performance for AI learning
  app.post("/api/workouts/log-performance", async (req, res) => {
    try {
      const { userId, workoutId, exercises, overallFeedback, duration } = req.body;
      
      if (!userId || !workoutId || !exercises) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      console.log(`📊 [PERFORMANCE] Logging workout for user ${userId}`);
      
      // Import AI learning service dynamically to avoid circular deps
      const { analyzeAndLearn } = await import('./ai-learning-service');
      
      // Analyze the workout and learn from it
      await analyzeAndLearn({
        userId,
        workoutId,
        exercises,
        overallFeedback,
        duration,
        completedAt: new Date().toISOString(),
      });
      
      res.json({ 
        success: true, 
        message: "Workout performance logged and analyzed" 
      });
      
    } catch (error: any) {
      console.error('❌ [PERFORMANCE] Error:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get user's AI learning context (for debugging/display)
  app.get("/api/users/:userId/learning-context", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      const { getUserLearningContext } = await import('./ai-learning-service');
      const context = await getUserLearningContext(userId);
      
      res.json({ context });
      
    } catch (error: any) {
      console.error('Error fetching learning context:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Config endpoint - returns live feature flags (admin-only in production)
  app.get("/api/config", requireAuth, async (req, res) => {
    try {
      // Only allow in development or for authenticated users
      if (process.env.NODE_ENV === "production" && !req.isAuthenticated()) {
        return res.status(403).json({ error: "Admin access required" });
      }

      res.json({
        features: FEATURE_FLAGS,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
      });
    } catch (error) {
      console.error("Config fetch failed:", error);
      res.status(500).json({ error: "Config fetch failed" });
    }
  });

  // Using in-memory storage - no seeding required for development

  // =============================================================================
  // MILESTONE 3: AI BACKBONE ENDPOINTS - Core AI API with Zod Validation
  // =============================================================================

  // Zod schemas for AI request/response validation
  const aiChatRequestSchema = z.object({
    message: z.string().min(1).max(2000),
    context: z
      .object({
        coach: z.string().optional(),
        currentWorkout: z.any().optional(),
        userProfile: z.any().optional(),
        conversationHistory: z
          .array(
            z.object({
              role: z.enum(["user", "coach"]),
              content: z.string(),
              timestamp: z.string().optional(),
            }),
          )
          .optional(),
      })
      .optional(),
  });

  const aiChatResponseSchema = z.object({
    response: z.string(),
    coach: z.string().optional(),
    confidence: z.number().min(0).max(1).optional(),
    suggestions: z.array(z.string()).optional(),
  });

  const workoutAdjustRequestSchema = z.object({
    workoutId: z.number().optional(),
    adjustmentType: z.enum([
      "time",
      "equipment",
      "injury",
      "intensity",
      "focus",
    ]),
    parameters: z.object({
      targetDuration: z.number().min(5).max(180).optional(), // minutes
      availableEquipment: z.array(z.string()).optional(),
      injuryLimitations: z.array(z.string()).optional(),
      intensityLevel: z.enum(["low", "medium", "high"]).optional(),
      focusAreas: z.array(z.string()).optional(),
    }),
    currentSets: z.array(
      z.object({
        exerciseId: z.number().optional(),
        exerciseName: z.string(),
        targetReps: z.number().optional(),
        targetWeight: z.number().optional(),
        targetDuration: z.number().optional(),
        restTime: z.number().optional(),
      }),
    ),
  });

  const workoutAdjustResponseSchema = z.object({
    adjustedSets: z.array(
      z.object({
        exerciseId: z.number().optional(),
        exerciseName: z.string(),
        targetReps: z.number().optional(),
        targetWeight: z.number().optional(),
        targetDuration: z.number().optional(),
        restTime: z.number().optional(),
        modifications: z.array(z.string()),
        reasoning: z.string(),
      }),
    ),
    totalDuration: z.number(),
    adjustmentSummary: z.string(),
    warnings: z.array(z.string()).optional(),
  });

  // Core AI Chat endpoint - general coach conversations
  app.post("/api/ai/chat", async (req, res) => {
    try {
      // Validate request with Zod
      const validatedRequest = aiChatRequestSchema.parse(req.body);

      if (!FEATURE_FLAGS.AI_ENABLED) {
        return res.status(503).json({
          error: "AI features are currently disabled",
          code: "AI_DISABLED",
        });
      }

      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({
          error: "AI service unavailable",
          code: "AI_SERVICE_UNAVAILABLE",
        });
      }

      const { message, context } = validatedRequest;
      const coach = context?.coach || "dylan-power";
      const userProfile = context?.userProfile;
      const conversationHistory = context?.conversationHistory || [];

      // Build conversation context for AI
      let systemPrompt = `You are a professional fitness coach providing helpful, motivating guidance. 
      Keep responses concise but encouraging. Focus on actionable advice.
      
      Please respond in JSON format with your coaching advice.
      
      Coach personality: ${coach}
      User context: ${userProfile ? JSON.stringify(userProfile) : "No specific profile available"}`;

      // Add conversation history for context
      const messages = [
        { role: "system", content: systemPrompt },
        ...conversationHistory.map((msg) => ({
          role: msg.role === "coach" ? "assistant" : "user",
          content: msg.content,
        })),
        { role: "user", content: message },
      ];

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: messages as any,
        max_tokens: 300,
        response_format: { type: "json_object" },
      });

      const aiResponse = JSON.parse(
        response.choices[0].message.content || "{}",
      );

      // Validate AI response with Zod
      const validatedResponse = aiChatResponseSchema.parse({
        response:
          aiResponse.response ||
          aiResponse.content ||
          response.choices[0].message.content,
        coach: coach,
        confidence: aiResponse.confidence || 0.8,
        suggestions: aiResponse.suggestions || [],
      });

      res.json(validatedResponse);
    } catch (error) {
      console.error("AI chat error:", error);

      if (error instanceof z.ZodError) {
        return res.status(422).json({
          error: "Invalid request format",
          details: error.errors,
          code: "VALIDATION_ERROR",
        });
      }

      res.status(500).json({
        error: "AI chat service temporarily unavailable",
        code: "AI_CHAT_ERROR",
      });
    }
  });

  // Workout adjustment endpoint - AI-powered workout modifications
  app.post("/api/ai/workout/adjust", async (req, res) => {
    try {
      // Validate request with Zod
      const validatedRequest = workoutAdjustRequestSchema.parse(req.body);

      if (!FEATURE_FLAGS.AI_ENABLED) {
        return res.status(503).json({
          error: "AI features are currently disabled",
          code: "AI_DISABLED",
        });
      }

      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({
          error: "AI service unavailable",
          code: "AI_SERVICE_UNAVAILABLE",
        });
      }

      const { adjustmentType, parameters, currentSets } = validatedRequest;

      // Build AI prompt for workout adjustments
      const adjustmentPrompt = `You are a professional fitness trainer. Adjust the following workout based on the user's needs.
      
      Adjustment type: ${adjustmentType}
      Parameters: ${JSON.stringify(parameters)}
      Current workout sets: ${JSON.stringify(currentSets)}
      
      Please provide adjusted sets that:
      1. Maintain workout effectiveness
      2. Address the specific adjustment request
      3. Ensure safety and proper progression
      4. Keep exercises appropriate for available equipment/limitations
      
      Respond with JSON in this exact format:
      {
        "adjustedSets": [
          {
            "exerciseName": "Exercise Name",
            "targetReps": number,
            "targetWeight": number,
            "targetDuration": number,
            "restTime": number,
            "modifications": ["list of changes made"],
            "reasoning": "why this adjustment was made"
          }
        ],
        "totalDuration": estimated_duration_in_minutes,
        "adjustmentSummary": "brief summary of changes",
        "warnings": ["any safety considerations"]
      }`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are a professional fitness trainer. Always respond with valid JSON only.",
          },
          { role: "user", content: adjustmentPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3, // Lower temperature for more consistent adjustments
        max_tokens: 1000,
      });

      const aiResponse = JSON.parse(
        response.choices[0].message.content || "{}",
      );

      // Validate AI response with Zod
      const validatedResponse = workoutAdjustResponseSchema.parse(aiResponse);

      res.json(validatedResponse);
    } catch (error) {
      console.error("Workout adjustment error:", error);

      if (error instanceof z.ZodError) {
        return res.status(422).json({
          error: "Invalid request format",
          details: error.errors,
          code: "VALIDATION_ERROR",
        });
      }

      res.status(500).json({
        error: "Workout adjustment service temporarily unavailable",
        code: "WORKOUT_ADJUST_ERROR",
      });
    }
  });

  // Forgot password endpoint
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Check if user exists (using storage instead of db)
      const user = await storage.getUserByEmail(email);

      if (!user) {
        // Tell user if email is not registered
        return res.status(404).json({
          error: "We don't recognize this email address. Please check your email or sign up for an account.",
        });
      }

      // Generate 6-digit code
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store code in memory (using a simple Map for now)
      if (!global.passwordResetTokens) {
        global.passwordResetTokens = new Map();
      }
      
      global.passwordResetTokens.set(email, {
        token: resetCode,
        expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes from now
      });
      
      console.log(`🔑 6-digit reset code generated for ${email}: ${resetCode}`);

      // Send email via Resend
      try {
        await sendPasswordResetEmail(email, resetCode, user.name || 'User');
        console.log(`✅ Password reset email sent to ${email} via Resend`);
      } catch (emailError) {
        console.error("❌ Email error:", emailError);
        return res.status(500).json({
          error:
            "Failed to send reset email. Please try again later.",
        });
      }

      res.json({
        message: "Password reset code sent! Check your email for a 6-digit code.",
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res
        .status(500)
        .json({ error: "An error occurred. Please try again later." });
    }
  });

  // Verify 6-digit code endpoint
  app.post("/api/auth/verify-reset-code", async (req, res) => {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        return res.status(400).json({ error: "Email and code are required" });
      }

      // Check if code exists in memory
      if (!global.passwordResetTokens) {
        return res.status(400).json({ error: "Invalid or expired reset code" });
      }

      const tokenData = global.passwordResetTokens.get(email);

      if (!tokenData) {
        return res.status(400).json({ error: "Invalid or expired reset code" });
      }

      // Check if code matches
      if (tokenData.token !== code) {
        return res.status(400).json({ error: "Incorrect code. Please try again." });
      }

      // Check if code is expired
      if (Date.now() > tokenData.expiresAt) {
        global.passwordResetTokens.delete(email);
        return res.status(400).json({
          error: "Reset code has expired. Please request a new one.",
        });
      }

      console.log(`✅ Code verified successfully for ${email}`);

      res.json({
        message: "Code verified successfully. You can now reset your password.",
        verified: true,
      });
    } catch (error) {
      console.error("Verify code error:", error);
      res.status(500).json({ error: "An error occurred. Please try again later." });
    }
  });

  // Reset password endpoint (for when user enters new password)
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { email, code, newPassword } = req.body;

      if (!email || !code || !newPassword) {
        return res
          .status(400)
          .json({ error: "Email, code, and new password are required" });
      }

      if (newPassword.length < 6) {
        return res
          .status(400)
          .json({ error: "Password must be at least 6 characters long" });
      }

      // Check if code exists and is valid
      if (!global.passwordResetTokens) {
        return res.status(400).json({ error: "Invalid or expired reset code" });
      }

      const tokenData = global.passwordResetTokens.get(email);

      if (!tokenData) {
        return res.status(400).json({ error: "Invalid or expired reset code" });
      }

      // Verify code matches
      if (tokenData.token !== code) {
        return res.status(400).json({ error: "Incorrect code" });
      }

      // Check if code is expired
      if (Date.now() > tokenData.expiresAt) {
        global.passwordResetTokens.delete(email);
        return res.status(400).json({
          error: "Reset code has expired. Please request a new one.",
        });
      }

      // Update user password using storage
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(400).json({ error: "User not found" });
      }

      const hashedPassword = hashPassword(newPassword);
      await storage.updateUser(user.id, { password: hashedPassword });

      // Delete used code
      global.passwordResetTokens.delete(email);
      
      console.log(`✅ Password reset successfully for ${email}`);

      res.json({
        message:
          "Password has been reset successfully. You can now log in with your new password.",
      });
    } catch (error) {
      console.error("Reset password error:", error);
      res
        .status(500)
        .json({ error: "An error occurred. Please try again later." });
    }
  });

  // Test endpoint to get reset tokens (for testing only)
  app.get("/api/auth/test-tokens", async (req, res) => {
    try {
      if (process.env.NODE_ENV === "production") {
        return res.status(404).json({ error: "Not found" });
      }
      
      const tokens = {};
      if (global.passwordResetTokens) {
        for (const [email, data] of global.passwordResetTokens.entries()) {
          tokens[email] = {
            token: data.token,
            expiresAt: data.expiresAt,
            isExpired: Date.now() > data.expiresAt
          };
        }
      }
      
      res.json({ tokens });
    } catch (error) {
      console.error("Test tokens error:", error);
      res.status(500).json({ error: "Failed to get test tokens" });
    }
  });

  // Workout API endpoints
  app.get("/api/workouts", async (req, res) => {
    try {
      const type = req.query.type as string;
      if (type) {
        const workouts = await storage.getWorkoutsByType(type);
        res.json(workouts);
      } else {
        const workouts = await storage.getWorkouts();
        res.json(workouts);
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get today's AI-generated workout (MUST come before :id route to avoid conflicts)
  app.get("/api/workouts/today", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    // 🚨 STEP 3: Synchronized static templates - today matches weekly schedule
    if (!AI_ENABLED) {
      console.log("🔧 AI disabled: Returning synchronized today workout");
      const user = req.user!;

      // 🎯 FIXED: Today's workout matches the weekly schedule for today
      const today = new Date();

      // Use EXACT same day calculation as weekly route
      const dayOfWeek = today.getDay(); // Sunday = 0, Monday = 1, etc.
      const dayNames = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ];
      const currentDay = dayNames[dayOfWeek];

      // 🎯 Use shared constant + normalizer for exact WorkoutDay format
      const staticWorkout =
        STATIC_WEEKLY_WORKOUTS[
          currentDay as keyof typeof STATIC_WEEKLY_WORKOUTS
        ];
      const normalizedWorkout = normalizeToWorkoutDay(
        currentDay,
        staticWorkout,
        today.toISOString().split("T")[0],
      );

      return res.json(normalizedWorkout);
    }

    try {
      const user = req.user!;

      // Check cache first (simple in-memory caching by user ID)
      const cacheKey = `workout-today-${user.id}`;
      const cached = (global as any).workoutCache?.[cacheKey];
      const now = Date.now();

      // Return cached if less than 1 hour old
      if (cached && now - cached.timestamp < 60 * 60 * 1000) {
        console.log("🎯 Returning cached workout for user:", user.id);
        return res.json({ status: "ready", ...cached.workout });
      }

      console.log("🤖 Generating new AI workout for user:", user.id);

      // Initialize cache if needed
      if (!(global as any).workoutCache) {
        (global as any).workoutCache = {};
      }

      // Get user's workout profile for personalization
      let workoutProfile = null;
      try {
        const profileResponse = await fetch(
          `http://localhost:5000/api/user/workout-profile`,
          {
            headers: { Cookie: req.headers.cookie || "" },
          },
        );
        if (profileResponse.ok) {
          workoutProfile = await profileResponse.json();
        }
      } catch (error) {
        console.log("Could not fetch workout profile, using defaults");
      }

      // Generate today's workout using AI
      const workoutRequest = {
        user,
        workoutType: user.trainingType || "HIIT",
        duration: workoutProfile?.sessionDuration || 30,
        equipment: workoutProfile?.equipmentAccess || ["bodyweight"],
        focus: "cardio",
      };

      const generatedWorkout = await generatePersonalizedWorkout(
        workoutRequest,
        workoutProfile,
      );

      // Transform to TodaysWorkout format
      const todaysWorkout = {
        id: `today-${user.id}-${new Date().toISOString().split("T")[0]}`,
        name: generatedWorkout.title,
        type: user.trainingType || "HIIT",
        duration: generatedWorkout.estimatedDuration,
        muscleGroups: Array.from(
          new Set(generatedWorkout.exercises.flatMap((ex) => ex.targetMuscles)),
        ),
        difficulty: generatedWorkout.difficulty.toLowerCase() as
          | "easy"
          | "medium"
          | "hard",
        description: generatedWorkout.description,
      };

      // Cache the result
      (global as any).workoutCache[cacheKey] = {
        workout: todaysWorkout,
        timestamp: now,
      };

      console.log(
        "✅ Generated and cached new workout:",
        generatedWorkout.title,
      );
      res.json({ status: "ready", ...todaysWorkout });
    } catch (error: any) {
      console.error("Error generating today's workout:", error);
      res.status(500).json({
        status: "error",
        error: "Failed to generate today's workout",
        message:
          "🤖 Having trouble generating your workout. Please try again in a moment!",
      });
    }
  });

  // Get weekly AI-generated workout schedule
  app.get("/api/workouts/week", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    // 🚨 STABILIZATION: Block AI generation during stabilization
    if (!AI_ENABLED) {
      console.log("🔧 AI disabled: Returning static weekly schedule");
      const user = req.user!;
      // 🎯 Use shared constant + normalizer for exact WorkoutDay format with proper dates
      const normalizedWorkouts: Record<string, any> = {};

      // Calculate dates for each day of the current week (Monday = 0)
      const today = new Date();
      const dayOfWeek = today.getDay(); // Sunday = 0, Monday = 1, etc.
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to make Monday the start

      const dayNames = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ];
      dayNames.forEach((dayName, index) => {
        const dayDate = new Date(today);
        dayDate.setDate(today.getDate() + mondayOffset + index);
        const isoDate = dayDate.toISOString().split("T")[0];

        const staticWorkout =
          STATIC_WEEKLY_WORKOUTS[
            dayName as keyof typeof STATIC_WEEKLY_WORKOUTS
          ];
        normalizedWorkouts[dayName] = normalizeToWorkoutDay(
          dayName,
          staticWorkout,
          isoDate,
        );
      });

      return res.json({ status: "ready", workouts: normalizedWorkouts });
    }

    try {
      const user = req.user!;
      const { start } = req.query;

      // Default to current week if no start date provided
      const startDate = start ? new Date(start as string) : new Date();
      const weekKey = `workout-week-${user.id}-${startDate.toISOString().split("T")[0]}`;

      // Check cache first
      const cached = (global as any).workoutCache?.[weekKey];
      const now = Date.now();

      // Return cached if less than 6 hours old
      if (cached && now - cached.timestamp < 6 * 60 * 60 * 1000) {
        console.log("🎯 Returning cached weekly workouts for user:", user.id);
        return res.json({ status: "ready", workouts: cached.workouts });
      }

      console.log("🗓️ Generating weekly workout schedule for user:", user.id);

      // Initialize cache if needed
      if (!(global as any).workoutCache) {
        (global as any).workoutCache = {};
      }

      // Get user's workout profile
      let workoutProfile = null;
      try {
        const profileResponse = await fetch(
          `http://localhost:5000/api/user/workout-profile`,
          {
            headers: { Cookie: req.headers.cookie || "" },
          },
        );
        if (profileResponse.ok) {
          workoutProfile = await profileResponse.json();
        }
      } catch (error) {
        console.log(
          "Could not fetch workout profile for weekly schedule, using defaults",
        );
      }

      // Generate workouts for each day of the week
      const daysOfWeek = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ];
      const weeklyWorkouts: any = {};

      for (const day of daysOfWeek) {
        // Vary workout types throughout the week
        const workoutTypes = [
          "HIIT",
          "Strength",
          "Cardio",
          "Mobility",
          "Circuit",
        ];
        const workoutType =
          workoutTypes[daysOfWeek.indexOf(day) % workoutTypes.length];

        const workoutRequest = {
          user,
          workoutType,
          duration: workoutProfile?.sessionDuration || 30,
          equipment: workoutProfile?.equipmentAccess || ["bodyweight"],
          focus: day === "sunday" ? "recovery" : "strength",
        };

        try {
          const generatedWorkout = await generatePersonalizedWorkout(
            workoutRequest,
            workoutProfile,
          );

          weeklyWorkouts[day] = {
            id: `${day}-${user.id}-${startDate.toISOString().split("T")[0]}`,
            name: generatedWorkout.title,
            type: workoutType,
            duration: generatedWorkout.estimatedDuration,
            muscleGroups: Array.from(
              new Set(
                generatedWorkout.exercises.flatMap((ex) => ex.targetMuscles),
              ),
            ),
            difficulty: generatedWorkout.difficulty.toLowerCase() as
              | "easy"
              | "medium"
              | "hard",
            description: generatedWorkout.description,
            exercises: generatedWorkout.exercises,
            isCompleted: false,
          };
        } catch (error) {
          console.error(`Error generating workout for ${day}:`, error);
          // Fallback workout
          weeklyWorkouts[day] = {
            id: `${day}-fallback-${user.id}`,
            name: `${day.charAt(0).toUpperCase() + day.slice(1)} Workout`,
            type: workoutType,
            duration: 30,
            muscleGroups: ["Full Body"],
            difficulty: "medium" as const,
            description: "A balanced workout to keep you moving.",
            exercises: [],
            isCompleted: false,
          };
        }
      }

      // Cache the result
      (global as any).workoutCache[weekKey] = {
        workouts: weeklyWorkouts,
        timestamp: now,
      };

      console.log("✅ Generated and cached weekly workout schedule");
      res.json({ status: "ready", workouts: weeklyWorkouts });
    } catch (error: any) {
      console.error("Error generating weekly workout schedule:", error);
      res.status(500).json({
        status: "error",
        error: "Failed to generate weekly workout schedule",
        message:
          "🤖 Having trouble generating your weekly workouts. Please try again in a moment!",
      });
    }
  });

  app.get("/api/workouts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const workout = await storage.getWorkout(id);
      if (!workout) {
        return res.status(404).json({ error: "Workout not found" });
      }
      res.json(workout);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/user-workouts", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const userWorkout = await storage.createUserWorkout({
        userId: req.user!.id,
        workoutId: req.body.workoutId,
        duration: req.body.duration,
      });
      res.json(userWorkout);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/user-workouts", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const userWorkouts = await storage.getUserWorkouts(req.user!.id);
      res.json(userWorkouts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // AI Workout Generation (with fallback)
  app.post("/api/workouts/generate", async (req, res) => {
    try {
      const { userProfile, dayOfWeek } = req.body;
      
      if (!userProfile) {
        return res.status(400).json({ error: 'User profile is required' });
      }
      
      console.log('🤖 Generating AI workout for:', userProfile);
      
      // Use AI workout generator
      const { generateAIWorkout } = await import('./ai-workout-generator');
      const workout = await generateAIWorkout(userProfile, dayOfWeek || 0);
      
      console.log('✅ AI Workout generated:', workout.title, `(${workout.exercises.length} exercises)`);
      
      res.json(workout);
    } catch (error: any) {
      console.error('❌ Workout generation error:', error);
      res.status(500).json({ 
        error: 'Failed to generate workout',
        details: error.message 
      });
    }
  });


  // Exercise swap endpoint for Edit Workout feature
  app.post("/api/workouts/swap-exercise", async (req, res) => {
    try {
      const { currentExercise, reason, additionalNotes, userProfile } = req.body;
      
      console.log('🔄 [API] Swap exercise request:', currentExercise.name);
      
      const { getExerciseAlternatives } = await import('./ai-exercise-swap');
      const alternatives = await getExerciseAlternatives({
        currentExercise,
        reason,
        additionalNotes,
        userProfile,
      });
      
      console.log('✅ [API] Alternatives generated');
      res.json(alternatives);
    } catch (error: any) {
      console.error('❌ [API] Swap error:', error);
      res.status(500).json({ 
        error: 'Failed to find alternatives',
        details: error.message 
      });
    }
  });


  app.get("/api/user-stats/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const [totalWorkouts, thisWeekWorkouts, totalMinutes, thisWeekMinutes] =
        await Promise.all([
          storage.getUserWorkouts(userId).then((workouts) => workouts.length),
          storage.getUserCompletedWorkoutsThisWeek(userId),
          storage.getUserTrainingMinutesThisWeek(userId),
          storage.getUserTrainingMinutesThisWeek(userId),
        ]);

      res.json({
        totalWorkouts,
        thisWeekWorkouts,
        totalMinutes,
        thisWeekMinutes,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 📊 PERFORMANCE LOGGING API - Critical for AI PT Learning
  app.post("/api/performance/log", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      console.log(`📊 [${req.method}] ${req.url}`, req.body);

      const performanceData = {
        ...req.body,
        userId: req.user!.id, // Ensure we use authenticated user ID
      };

      // Validate required fields for AI learning
      if (
        !performanceData.workoutId ||
        !performanceData.exerciseId ||
        !performanceData.exerciseName
      ) {
        return res.status(400).json({
          error: "Missing required fields: workoutId, exerciseId, exerciseName",
        });
      }

      // For now, save to localStorage-style storage (upgrade to DB when available)
      const savedPerformance =
        await storage.savePerformanceLog(performanceData);

      console.log(
        `✅ Performance logged for user ${performanceData.userId}, exercise ${performanceData.exerciseId}`,
      );
      res.json({
        success: true,
        performanceLogId: savedPerformance?.id || Date.now(),
        message: "Performance data saved for AI learning",
      });
    } catch (error: any) {
      console.log(`❌ [${req.method}] ${req.url}`, error);
      res.status(500).json({ error: "Failed to save performance data" });
    }
  });

  // Get performance history for AI learning and user progress
  app.get("/api/performance/history", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      console.log(`📈 [${req.method}] ${req.url}`);

      const { exerciseId, limit = 50 } = req.query;
      const userId = req.user!.id;

      const performanceHistory = await storage.getPerformanceHistory(
        userId,
        exerciseId as string,
        parseInt(limit as string),
      );

      console.log(
        `✅ Retrieved ${performanceHistory?.length || 0} performance records for user ${userId}`,
      );
      res.json(performanceHistory || []);
    } catch (error: any) {
      console.log(`❌ [${req.method}] ${req.url}`, error);
      res.status(500).json({ error: "Failed to retrieve performance history" });
    }
  });

  // 🧠 INTELLIGENT REST DAY ANALYSIS - AI-Powered Recovery Planning
  app.get("/api/rest-analysis", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      console.log(`🧠 [${req.method}] ${req.url} - Analyzing rest day needs`);

      const userId = req.user!.id;
      const { currentPlan } = req.query;

      // Import RestDayIntelligenceService
      const { RestDayIntelligenceService } = await import(
        "./rest-day-intelligence"
      );
      const restService = new RestDayIntelligenceService(storage);

      const recommendation = await restService.analyzeRestDayNeeds(
        userId,
        currentPlan ? JSON.parse(currentPlan as string) : {},
      );

      console.log(
        `✅ Rest analysis complete for user ${userId}: ${recommendation.recommendRestDay ? "REST" : "TRAIN"} (${recommendation.confidenceScore}% confidence)`,
      );
      res.json(recommendation);
    } catch (error: any) {
      console.log(`❌ [${req.method}] ${req.url}`, error);
      res.status(500).json({ error: "Failed to analyze rest day needs" });
    }
  });

  app.put("/api/user/profile", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const updatedUser = await storage.updateUser(req.user!.id, req.body);
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(updatedUser);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/user/personal-info", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const {
        name,
        email,
        age,
        height,
        weight,
        fitnessLevel,
        injuries,
        emergencyContact,
      } = req.body;

      const updatedUser = await storage.updateUser(req.user!.id, {
        name,
        email,
        age: age ? parseInt(age) : undefined,
        height,
        weight,
        fitnessLevel,
        injuries,
        emergencyContact,
      });

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(updatedUser);
    } catch (error: any) {
      console.error("Personal info update error:", error);
      res.status(500).json({ error: "Failed to update personal information" });
    }
  });

  // AI Personalization Onboarding
  app.post("/api/user/ai-onboarding", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const { responses } = req.body;

      if (!responses || !Array.isArray(responses)) {
        return res.status(400).json({ error: "Invalid responses format" });
      }

      // Extract key information from responses
      const responseMap = responses.reduce(
        (acc, response) => {
          acc[response.stepId] = response.response;
          return acc;
        },
        {} as Record<string, string>,
      );

      const updatedUser = await storage.updateUser(req.user!.id, {
        topFitnessGoal: responseMap["fitness-goal"],
        injuryHistory: responseMap["injury-history"],
        motivationalFactors: responseMap["motivation"],
        onboardingResponses: JSON.stringify(responses),
        hasCompletedAIOnboarding: true,
        // Parse additional preferences from responses
        preferredTrainingTime: extractTrainingTime(
          responseMap["training-time"],
        ),
        cardioPreference: extractCardioPreference(
          responseMap["cardio-preference"],
        ),
        focusAreas: JSON.stringify(
          extractFocusAreas(responseMap["focus-areas"]),
        ),
      });

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ success: true, user: updatedUser });
    } catch (error: any) {
      console.error("AI onboarding error:", error);
      res.status(500).json({ error: "Failed to save AI onboarding responses" });
    }
  });

  // Generate AI Weekly Schedule
  app.post("/api/user/generate-schedule", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const user = req.user!;
      const weeklySchedule = await generateWeeklySchedule(user);
      res.json(weeklySchedule);
    } catch (error: any) {
      console.error("Schedule generation error:", error);
      res.status(500).json({ error: "Failed to generate weekly schedule" });
    }
  });

  // AI Coach Chat endpoint
  app.post("/api/coach/chat", async (req, res) => {
    try {
      const { message, coach, trainingType, coachingStyle, userId, coachPersonality, personalityTone } = req.body;
      
      // Get user context for personalized response if userId provided
      let userContext = '';
      if (userId) {
        try {
          const profile = await getComprehensiveUserContext(userId);
          userContext = formatUserContextForAI(profile);
        } catch (e) {
          console.log('Could not load user context for chat');
        }
      }
      
      const response = await getCoachResponse(
        coach,
        message,
        trainingType,
        coachingStyle || coachPersonality,
        userContext,
        personalityTone,
      );
      
      // Save chat for AI learning (non-blocking)
      if (userId) {
        saveChatForLearning(userId, message, response).catch(e => 
          console.log('Non-critical: Could not save chat for learning')
        );
      }
      
      res.json({ response });
    } catch (error: any) {
      console.error("AI Coach error:", error);
      res.status(500).json({ error: "Failed to get coach response" });
    }
  });

  // Workout Progression endpoint
  app.post("/api/workouts/progress", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const { currentWorkout, userFeedback } = req.body;
      const user = req.user!;

      const progressedWorkout = await generateWorkoutProgression(
        currentWorkout,
        userFeedback,
        user,
      );
      res.json(progressedWorkout);
    } catch (error: any) {
      console.error("Workout progression error:", error);
      res.status(500).json({ error: "Failed to generate workout progression" });
    }
  });

  // Save workout profile endpoint
  app.post("/api/user/workout-profile", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const profileData = req.body;
      const updatedUser = await storage.updateUser(req.user!.id, {
        workoutProfile: JSON.stringify(profileData),
      });

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ success: true, profile: profileData });
    } catch (error: any) {
      console.error("Error saving workout profile:", error);
      res.status(500).json({ error: "Failed to save workout profile" });
    }
  });

  // Get workout profile endpoint
  app.get("/api/user/workout-profile", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const user = await storage.getUser(req.user!.id);
      if (user && user.workoutProfile) {
        try {
          const profile = JSON.parse(user.workoutProfile as string);
          res.json(profile);
        } catch (parseError) {
          console.error("Error parsing workout profile:", parseError);
          res.json(null);
        }
      } else {
        res.json(null);
      }
    } catch (error: any) {
      console.error("Error getting workout profile:", error);
      res.status(500).json({ error: "Failed to get workout profile" });
    }
  });
  
  // Save advanced questionnaire for AI learning
  app.post("/api/user/advanced-questionnaire", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    
    try {
      const questionnaire = req.body;
      const userId = req.user!.id;
      
      // Store in user's onboarding responses
      const existingResponses = req.user!.onboardingResponses 
        ? JSON.parse(req.user!.onboardingResponses as string) 
        : {};
      
      const updatedResponses = {
        ...existingResponses,
        advancedQuestionnaire: questionnaire,
      };
      
      await storage.updateUser(userId, {
        onboardingResponses: JSON.stringify(updatedResponses),
      });
      
      // Also save key insights to AI learning context
      if (questionnaire.enjoyedTraining) {
        await db.insert(aiLearningContext).values({
          userId,
          category: 'preference',
          insight: `User ENJOYS: ${questionnaire.enjoyedTraining}`,
          confidence: 'high',
          dataPoints: 1,
        });
      }
      
      if (questionnaire.dislikedTraining) {
        await db.insert(aiLearningContext).values({
          userId,
          category: 'preference',
          insight: `User DISLIKES: ${questionnaire.dislikedTraining}`,
          confidence: 'high',
          dataPoints: 1,
        });
      }
      
      if (questionnaire.weakAreas) {
        await db.insert(aiLearningContext).values({
          userId,
          category: 'preference',
          insight: `User wants to focus on WEAK AREAS: ${questionnaire.weakAreas}`,
          confidence: 'high',
          dataPoints: 1,
        });
      }
      
      if (questionnaire.targets) {
        await db.insert(aiLearningContext).values({
          userId,
          category: 'preference',
          insight: `User has TARGET/EVENT: ${questionnaire.targets}`,
          confidence: 'high',
          dataPoints: 1,
        });
      }
      
      console.log(`✅ Saved advanced questionnaire for user ${userId}`);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error saving advanced questionnaire:", error);
      res.status(500).json({ error: "Failed to save questionnaire" });
    }
  });
  
  // Log workout set for AI learning (tracks weights, reps, and notes)
  app.post("/api/workout/log-set", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    
    try {
      const { exerciseName, setNumber, weight, reps, note, difficulty } = req.body;
      const userId = req.user!.id;
      
      console.log(`📝 Logging set for user ${userId}: ${exerciseName} - Set ${setNumber}: ${weight}kg x ${reps}`);
      
      // Save strength data to AI learning context
      if (weight && reps) {
        // Check if we already have an insight for this exercise
        const existingInsight = await db
          .select()
          .from(aiLearningContext)
          .where(and(
            eq(aiLearningContext.userId, userId),
            eq(aiLearningContext.category, 'strength'),
            eq(aiLearningContext.exerciseName, exerciseName)
          ))
          .limit(1);
        
        if (existingInsight.length > 0) {
          // Update existing insight with new weight
          const currentInsight = existingInsight[0];
          const newDataPoints = (currentInsight.dataPoints || 1) + 1;
          
          await db.update(aiLearningContext)
            .set({
              insight: `Typically lifts ${weight}kg for ${reps} reps on ${exerciseName}`,
              confidence: newDataPoints >= 5 ? 'high' : newDataPoints >= 3 ? 'medium' : 'low',
              dataPoints: newDataPoints,
              lastUpdated: new Date(),
            })
            .where(eq(aiLearningContext.id, currentInsight.id));
        } else {
          // Create new insight
          await db.insert(aiLearningContext).values({
            userId,
            category: 'strength',
            exerciseName,
            insight: `Typically lifts ${weight}kg for ${reps} reps on ${exerciseName}`,
            confidence: 'low',
            dataPoints: 1,
          });
        }
      }
      
      // Save difficulty feedback
      if (difficulty) {
        const difficultyMap: { [key: string]: string } = {
          'easy': `User found ${exerciseName} EASY - can increase weight/intensity`,
          'moderate': `User found ${exerciseName} at appropriate difficulty`,
          'hard': `User found ${exerciseName} CHALLENGING - consider reducing or maintaining weight`,
          'too_hard': `User is STRUGGLING with ${exerciseName} - reduce weight or modify exercise`,
        };
        
        if (difficultyMap[difficulty]) {
          await db.insert(aiLearningContext).values({
            userId,
            category: 'difficulty',
            exerciseName,
            insight: difficultyMap[difficulty],
            confidence: 'high',
            dataPoints: 1,
          });
        }
      }
      
      // Save any notes as feedback
      if (note && note.trim()) {
        await db.insert(aiLearningContext).values({
          userId,
          category: 'feedback',
          exerciseName,
          insight: `User note during ${exerciseName}: "${note}"`,
          confidence: 'medium',
          dataPoints: 1,
        });
      }
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error logging workout set:", error);
      res.status(500).json({ error: "Failed to log set" });
    }
  });
  
  // Get AI weight suggestion for an exercise
  app.get("/api/workout/suggested-weight/:exerciseName", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    
    try {
      const { exerciseName } = req.params;
      const userId = req.user!.id;
      
      // Find the most recent strength insight for this exercise
      const insights = await db
        .select()
        .from(aiLearningContext)
        .where(and(
          eq(aiLearningContext.userId, userId),
          eq(aiLearningContext.category, 'strength')
        ))
        .orderBy(sql`${aiLearningContext.lastUpdated} DESC`)
        .limit(50);
      
      // Fuzzy match exercise name
      const exerciseNameLower = exerciseName.toLowerCase();
      const matchingInsight = insights.find(i => 
        i.exerciseName?.toLowerCase().includes(exerciseNameLower) ||
        exerciseNameLower.includes(i.exerciseName?.toLowerCase() || '')
      );
      
      if (matchingInsight) {
        // Parse weight from insight
        const weightMatch = matchingInsight.insight.match(/(\d+)\s*kg/i);
        const repsMatch = matchingInsight.insight.match(/for\s*(\d+)/);
        
        if (weightMatch) {
          res.json({
            suggestedWeight: parseInt(weightMatch[1]),
            suggestedReps: repsMatch ? parseInt(repsMatch[1]) : 10,
            confidence: matchingInsight.confidence,
            source: 'history',
          });
          return;
        }
      }
      
      res.json({ suggestedWeight: null, suggestedReps: null, source: 'no_data' });
    } catch (error: any) {
      console.error("Error getting weight suggestion:", error);
      res.status(500).json({ error: "Failed to get suggestion" });
    }
  });

  // Social API routes
  app.get("/api/social/feed", async (req, res) => {
    try {
      // Disable caching to prevent 304 responses
      res.set({
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      });

      let posts = await storage.getPosts();

      // If no posts exist, provide demo fitness posts
      if (!posts || posts.length === 0) {
        const demoPosts = [
          {
            id: 1,
            userId: 2,
            user: {
              id: 2,
              name: "Emma Johnson",
              email: "emma@example.com",
              level: "Advanced",
            },
            content:
              "Just smashed my new PR! 💪 Hit 225lbs on deadlift today after months of progressive training. The consistency is paying off!",
            imageUrl:
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80",
            type: "achievement",
            achievementData: {
              title: "New Deadlift PR",
              category: "Strength Training",
              personalBest: "225lbs",
              previousBest: "205lbs",
            },
            createdAt: new Date("2024-01-15T14:48:00.000Z").toISOString(),
            likes: 42,
            commentsCount: 8,
            isLiked: false,
          },
          {
            id: 2,
            userId: 3,
            user: {
              id: 3,
              name: "Mike Runner",
              email: "mike@example.com",
              level: "Intermediate",
            },
            content:
              "Morning HIIT session complete! ⚡ 20 minutes of pure intensity - burpees, mountain climbers, and jump squats. Heart rate peaked at 178 BPM!",
            type: "workout",
            workoutData: {
              type: "HIIT",
              duration: 20,
              caloriesBurned: 315,
              exercises: [
                "Burpees",
                "Mountain Climbers",
                "Jump Squats",
                "High Knees",
              ],
            },
            createdAt: new Date("2024-01-15T09:30:00.000Z").toISOString(),
            likes: 28,
            commentsCount: 5,
            isLiked: true,
          },
          {
            id: 3,
            userId: 4,
            user: {
              id: 4,
              name: "Sarah Fitness",
              email: "sarah@example.com",
              level: "Expert",
            },
            content:
              "Week 12 transformation update! 📸 Lost 15lbs and gained serious muscle definition. The program is working magic! Who else is seeing amazing results?",
            type: "progress",
            progressData: {
              timeframe: "12 weeks",
              weightChange: "-15lbs",
              bodyFatChange: "-8%",
              muscleGain: "+3lbs",
            },
            createdAt: new Date("2024-01-14T16:22:00.000Z").toISOString(),
            likes: 67,
            commentsCount: 12,
            isLiked: false,
          },
        ];

        res.json(demoPosts);
        return;
      }

      // For each post, get like count, comment count, and if user liked it
      const postsWithCounts = await Promise.all(
        posts.map(async (post) => {
          const comments = await storage.getPostComments(post.id);
          const likesResult = await db
            .select({ count: count() })
            .from(postLikes)
            .where(eq(postLikes.postId, post.id));
          const isLiked = req.user
            ? await storage.isPostLikedByUser(post.id, req.user.id)
            : false;

          return {
            ...post,
            commentsCount: comments.length,
            likes: likesResult[0].count,
            isLiked,
          };
        }),
      );

      res.json(postsWithCounts);
    } catch (error) {
      console.error("Error getting social feed:", error);
      res.status(500).json({ error: "Failed to get social feed" });
    }
  });

  app.get("/api/social/posts/:postId/comments", async (req, res) => {
    try {
      const postId = parseInt(req.params.postId);
      const comments = await storage.getPostComments(postId);
      res.json(comments);
    } catch (error) {
      console.error("Error getting post comments:", error);
      res.status(500).json({ error: "Failed to get post comments" });
    }
  });

  app.post("/api/social/posts", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const { content } = req.body;

      if (!content) {
        return res.status(400).json({ error: "Content is required" });
      }

      const post = await storage.createPost({
        userId: req.user.id,
        content,
        imageUrl: req.body.imageUrl,
      });

      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ error: "Failed to create post" });
    }
  });

  app.post("/api/social/posts/:postId/comments", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const postId = parseInt(req.params.postId);
      const { content } = req.body;

      if (!content) {
        return res.status(400).json({ error: "Content is required" });
      }

      const comment = await storage.createComment({
        postId,
        userId: req.user.id,
        content,
      });

      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ error: "Failed to create comment" });
    }
  });

  // Conversational AI Chat endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, coachName, coachSpecialty, conversationHistory } =
        req.body;

      // Get user data for personalization
      const user = req.isAuthenticated() ? req.user : null;
      const userName = user?.name || "there";

      // Build conversation context from history
      let context = `You are ${coachName}, a professional ${coachSpecialty} coach and fitness expert. You are knowledgeable, motivating, supportive, and can discuss anything - not just fitness. Be conversational, friendly, and helpful. You can talk about fitness, nutrition, motivation, daily life, hobbies, work, relationships, or any topic the user brings up. Always maintain your coach persona but be flexible and engaging.

Key traits:
- Professional but approachable
- Motivating and positive
- Knowledgeable about fitness and nutrition
- Able to discuss any topic naturally
- Address the user as ${userName} when appropriate
- Give practical, actionable advice
- Be encouraging and supportive

User Information:
- Name: ${userName}
${user?.goal ? `- Fitness Goal: ${user.goal}` : ""}
${user?.fitnessLevel ? `- Fitness Level: ${user.fitnessLevel}` : ""}
${user?.trainingType ? `- Preferred Training: ${user.trainingType}` : ""}

Previous conversation:`;

      // Add conversation history for context
      if (conversationHistory && conversationHistory.length > 0) {
        conversationHistory.slice(-6).forEach((msg: any) => {
          context += `\n${msg.type === "user" ? "User" : coachName}: ${msg.content}`;
        });
      }

      context += `\n\nUser: ${message}\n${coachName}:`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are ${coachName}, a professional ${coachSpecialty} coach. You're knowledgeable, motivating, and can discuss any topic naturally. Be conversational and helpful while maintaining your coach persona.`,
          },
          {
            role: "user",
            content: message,
          },
        ],
        max_tokens: 200,
        temperature: 0.8,
      });

      const aiResponse =
        response.choices[0].message.content ||
        "I'm here to help! What would you like to talk about?";

      res.json({ response: aiResponse });
    } catch (error) {
      console.error("Chat API error:", error);
      res.status(500).json({
        error: "Failed to process chat message",
        response:
          "I'm having trouble connecting right now, but I'm here when you need me! Try again in a moment.",
      });
    }
  });

  // Video generation endpoints for Veo 3
  app.post("/api/generate-exercise-video", async (req, res) => {
    try {
      const { exerciseName, prompt, duration = 30 } = req.body;

      if (!exerciseName || !prompt) {
        return res
          .status(400)
          .json({ error: "Exercise name and prompt are required" });
      }

      // Integrate with Google's Veo 3 API
      const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
      const apiKey = process.env.GOOGLE_CLOUD_API_KEY;

      if (!projectId || !apiKey) {
        return res.status(500).json({
          error: "Google Cloud credentials not configured",
          message: "Please contact support to enable video generation",
        });
      }

      // Try available Google Cloud video generation models
      let response;
      let data;

      // Try Imagen Video first (currently available)
      try {
        const imagenRequest = {
          instances: [
            {
              prompt: prompt,
              parameters: {
                aspectRatio: "16:9",
                duration: duration,
                style: "realistic",
              },
            },
          ],
        };

        response = await fetch(
          `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/imagen-video:predict`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(imagenRequest),
          },
        );

        if (response.ok) {
          data = await response.json();
        } else {
          const errorText = await response.text();
          console.log(
            "Imagen Video not available:",
            response.status,
            errorText,
          );
        }
      } catch (error) {
        console.log("Imagen Video API error:", error);
      }

      // If Imagen Video fails, try the generative AI endpoint
      if (!response || !response.ok) {
        try {
          const genAIRequest = {
            contents: [
              {
                parts: [
                  {
                    text: `Generate a fitness video: ${prompt}`,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 1024,
            },
          };

          response = await fetch(
            `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/gemini-pro:generateContent`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(genAIRequest),
            },
          );

          if (response.ok) {
            const geminiData = await response.json();
            // Convert Gemini response to video format
            data = {
              operation: {
                name: `projects/${projectId}/locations/us-central1/operations/video_${Date.now()}`,
              },
              description:
                geminiData.candidates?.[0]?.content?.parts?.[0]?.text || prompt,
            };
          }
        } catch (error) {
          console.log("Gemini API error:", error);
        }
      }

      // Final fallback with proper operation format
      if (!response || !response.ok) {
        console.log("Creating simulated video operation for development");
        data = {
          operation: {
            name: `projects/${projectId}/locations/us-central1/operations/video_${Date.now()}`,
          },
        };
      }

      const videoId =
        data.operation?.name ||
        `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      res.json({
        videoId,
        status: "processing",
        estimatedTime: duration * 3,
        message: "Video generation started with Veo 3",
      });
    } catch (error) {
      console.error("Video generation error:", error);
      res.status(500).json({
        error: "Failed to start video generation",
        message:
          error instanceof Error
            ? error.message
            : "Video generation service error",
      });
    }
  });

  app.get("/api/video-status/:videoId", async (req, res) => {
    try {
      const { videoId } = req.params;
      const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
      const apiKey = process.env.GOOGLE_CLOUD_API_KEY;

      if (!projectId || !apiKey) {
        return res.status(500).json({
          error: "Google Cloud credentials not configured",
          status: "failed",
        });
      }

      // Check operation status with Vertex AI
      const response = await fetch(
        `https://us-central1-aiplatform.googleapis.com/v1/${videoId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          `Status check failed: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();

      if (data.done && data.response) {
        res.json({
          status: "completed",
          videoUrl: data.response.videoUrl || data.response.uri,
          thumbnailUrl: data.response.thumbnailUrl,
          duration: 30,
          resolution: "1920x1080",
        });
      } else if (data.error) {
        res.json({
          status: "failed",
          error: data.error.message || "Video generation failed",
        });
      } else {
        res.json({
          status: "processing",
          progress: data.metadata?.progressPercent || 50,
          message: "Video is being generated with Veo 3...",
        });
      }
    } catch (error) {
      console.error("Video status error:", error);
      res.status(500).json({
        error: "Failed to check video status",
        status: "failed",
        message: error instanceof Error ? error.message : "Status check error",
      });
    }
  });

  app.post("/api/social/posts/:postId/like", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const postId = parseInt(req.params.postId);

      // Toggle like status
      const isLiked = await storage.isPostLikedByUser(postId, req.user.id);

      if (isLiked) {
        await storage.unlikePost(postId, req.user.id);
        res.json({ liked: false });
      } else {
        await storage.likePost(postId, req.user.id);
        res.json({ liked: true });
      }
    } catch (error) {
      console.error("Error toggling post like:", error);
      res.status(500).json({ error: "Failed to toggle post like" });
    }
  });

  app.post("/api/social/users/:userId/follow", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const followingId = parseInt(req.params.userId);

      if (followingId === req.user.id) {
        return res.status(400).json({ error: "Cannot follow yourself" });
      }

      // Toggle follow status
      const isFollowing = await storage.isUserFollowing(
        req.user.id,
        followingId,
      );

      if (isFollowing) {
        await storage.unfollowUser(req.user.id, followingId);
        res.json({ following: false });
      } else {
        await storage.followUser(req.user.id, followingId);
        res.json({ following: true });
      }
    } catch (error) {
      console.error("Error toggling user follow:", error);
      res.status(500).json({ error: "Failed to toggle user follow" });
    }
  });

  app.get("/api/social/users/:userId/followers", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const followers = await storage.getUserFollowers(userId);
      res.json(followers);
    } catch (error) {
      console.error("Error getting user followers:", error);
      res.status(500).json({ error: "Failed to get user followers" });
    }
  });

  app.get("/api/social/users/:userId/following", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const following = await storage.getUserFollowing(userId);
      res.json(following);
    } catch (error) {
      console.error("Error getting user following:", error);
      res.status(500).json({ error: "Failed to get user following" });
    }
  });
  // AI Exercise Swap endpoint
  app.post("/api/ai/swap-exercise", async (req, res) => {
    try {
      const { currentExercise, reason, userProfile } = req.body;

      if (!currentExercise || !reason) {
        return res
          .status(400)
          .json({ error: "Current exercise and reason are required" });
      }

      const alternative = await generateExerciseAlternative({
        currentExercise,
        reason,
        userProfile,
      });

      res.json(alternative);
    } catch (error) {
      console.error("Error generating exercise alternative:", error);
      res
        .status(500)
        .json({ error: "Failed to generate exercise alternative" });
    }
  });

  const httpServer = createServer(app);

  // Nutrition profile routes
  app.get("/api/users/:userId/nutrition-profile", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const nutritionProfile = await storage.getNutritionProfile(userId);
      res.json(nutritionProfile || null);
    } catch (error) {
      console.error("Error getting nutrition profile:", error);
      res.status(500).json({ error: "Failed to get nutrition profile" });
    }
  });

  app.post("/api/users/:userId/nutrition-profile", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const profileData = insertNutritionProfileSchema.parse(req.body);

      // Check if a profile already exists
      const existingProfile = await storage.getNutritionProfile(userId);

      let nutritionProfile;
      if (existingProfile) {
        nutritionProfile = await storage.updateNutritionProfile(
          userId,
          profileData,
        );
      } else {
        nutritionProfile = await storage.createNutritionProfile({
          ...profileData,
          userId,
        });
      }

      res.status(201).json(nutritionProfile);
    } catch (error) {
      console.error("Error creating/updating nutrition profile:", error);
      res
        .status(500)
        .json({ error: "Failed to create/update nutrition profile" });
    }
  });

  // Meal plan routes
  app.get("/api/users/:userId/meal-plans", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const mealPlans = await storage.getUserMealPlans(userId);
      res.json(mealPlans);
    } catch (error) {
      console.error("Error getting meal plans:", error);
      res.status(500).json({ error: "Failed to get meal plans" });
    }
  });

  app.get("/api/meal-plans/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const mealPlan = await storage.getMealPlan(id);

      if (!mealPlan) {
        return res.status(404).json({ error: "Meal plan not found" });
      }

      res.json(mealPlan);
    } catch (error) {
      console.error("Error getting meal plan:", error);
      res.status(500).json({ error: "Failed to get meal plan" });
    }
  });

  app.post("/api/users/:userId/meal-plans", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const mealPlanData = insertMealPlanSchema.parse(req.body);

      const mealPlan = await storage.createMealPlan({
        ...mealPlanData,
        userId,
      });

      res.status(201).json(mealPlan);
    } catch (error) {
      console.error("Error creating meal plan:", error);
      res.status(500).json({ error: "Failed to create meal plan" });
    }
  });

  // Logged meals routes
  app.get("/api/users/:userId/logged-meals", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const date = req.query.date as string;
      const loggedMeals = await storage.getUserLoggedMeals(userId, date);
      res.json(loggedMeals);
    } catch (error) {
      console.error("Error getting logged meals:", error);
      res.status(500).json({ error: "Failed to get logged meals" });
    }
  });

  app.post("/api/users/:userId/logged-meals", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const mealData = insertLoggedMealSchema.parse(req.body);

      const loggedMeal = await storage.createLoggedMeal({
        ...mealData,
        userId,
      });

      res.status(201).json(loggedMeal);
    } catch (error) {
      console.error("Error creating logged meal:", error);
      res.status(500).json({ error: "Failed to create logged meal" });
    }
  });

  app.get("/api/users/:userId/nutrition-stats/:date", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const date = req.params.date;
      const stats = await storage.getDailyNutritionStats(userId, date);
      res.json(stats);
    } catch (error) {
      console.error("Error getting nutrition stats:", error);
      res.status(500).json({ error: "Failed to get nutrition stats" });
    }
  });

  // Generate meal plan with AI route
  app.post("/api/users/:userId/generate-meal-plan", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);

      // Get user's nutrition profile
      const nutritionProfile = await storage.getNutritionProfile(userId);

      if (!nutritionProfile) {
        return res.status(400).json({
          error: "Nutrition profile is required to generate a meal plan",
        });
      }

      // Use OpenAI to generate meal plan
      const generatedMealPlan = await generateAIMealPlan(nutritionProfile);

      // Save the generated meal plan
      const savedMealPlan = await storage.createMealPlan({
        userId,
        title: generatedMealPlan.name,
        description: generatedMealPlan.description,
        targetDate: new Date(),
        meals: JSON.stringify(generatedMealPlan.meals),
        totalCalories: generatedMealPlan.dailyCalories,
        totalProtein: generatedMealPlan.dailyProtein,
        totalCarbs: generatedMealPlan.dailyCarbs,
        totalFat: generatedMealPlan.dailyFat,
        isActive: true,
      });

      // Get the complete meal plan with meals
      const completeMealPlan = await storage.getMealPlan(savedMealPlan.id);

      res.status(201).json(completeMealPlan);
    } catch (error) {
      console.error("Error generating meal plan:", error);
      res.status(500).json({ error: "Failed to generate meal plan" });
    }
  });

  // Generate 3D coach image route
  app.post("/api/generate-coach-image", generateCoachImage);

  // Coach images route
  app.post("/api/save-coach-image", async (req, res) => {
    try {
      const { coachId, imageUrl } = req.body;

      if (!coachId || !imageUrl) {
        return res
          .status(400)
          .json({ error: "Coach ID and image URL are required" });
      }

      // Download image from URL
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(
          `Failed to download image from URL: ${imageResponse.statusText}`,
        );
      }

      // Convert to buffer
      const arrayBuffer = await imageResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Ensure directory exists
      const fs = require("fs");
      const path = require("path");
      const dir = "./public/images/coaches";

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Save file
      const filePath = path.join(dir, `${coachId}.jpg`);
      fs.writeFileSync(filePath, buffer);

      res.json({ success: true, path: `/images/coaches/${coachId}.jpg` });
    } catch (error) {
      console.error("Error saving coach image:", error);
      res.status(500).json({ error: "Failed to save coach image" });
    }
  });

  // AI Coach Tips endpoint
  app.post("/api/ai/coach-tip", async (req, res) => {
    try {
      const { userProfile, currentWorkout, context } = req.body;
      const tip = await generateCoachTip(userProfile, currentWorkout);
      res.json({ tip });
    } catch (error: any) {
      console.error("Coach tip generation error:", error);
      res.status(500).json({ error: "Failed to generate coach tip" });
    }
  });

  // AI Schedule Editor endpoint
  app.post("/api/ai/edit-schedule", async (req, res) => {
    try {
      const { request, currentSchedule, context } = req.body;
      const edits = await generateScheduleEdits(request, currentSchedule);
      res.json({ edits });
    } catch (error: any) {
      console.error("Schedule edit generation error:", error);
      res.status(500).json({ error: "Failed to generate schedule edits" });
    }
  });

  // Rick and Morty style coach image generation endpoint
  app.post("/api/generate-rick-morty-coach/:coachId", async (req, res) => {
    try {
      const { coachId } = req.params;

      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ error: "OpenAI API key not configured" });
      }

      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      // Coach descriptions for Rick and Morty style generation
      const coachDescriptions: Record<
        string,
        { name: string; type: string; description: string }
      > = {
        "max-stone": {
          name: "Max Stone",
          type: "Strength Training Specialist",
          description:
            "Male character with comically oversized, bulging muscles and massive biceps that are almost as big as his head. Short spiky dark hair, square jaw, intense determined expression with slightly angry eyebrows. Wearing a tight black tank top that's stretched by his enormous muscles. Background should be gym-themed with weights",
        },
        "alexis-steel": {
          name: "Alexis Steel",
          type: "Strength Training Specialist",
          description:
            "Strong FEMALE character with pronounced feminine features, very muscular and defined arms and shoulders, athletic build with visible muscle definition. Long dark hair in a high ponytail, fierce determined expression with feminine facial features, wearing a fitted grey sports bra. Strong confident feminine posture with flexed arms showing off muscle definition, clearly identifiable as a woman",
        },
        "ethan-dash": {
          name: "Ethan Dash",
          type: "Cardio and Endurance Specialist",
          description:
            "Athletic MALE character with clearly masculine facial features, lean runner's build, always appears to be in motion with speed lines around him. Short messy light brown hair blown by wind, masculine jawline, bright energetic smile with sweat droplets, wearing a bright red running shirt. Strong masculine posture, background suggests movement and speed",
        },
        "zoey-blaze": {
          name: "Zoey Blaze",
          type: "Cardio and Endurance Specialist",
          description:
            "Energetic FEMALE character with lean athletic build, fiery bright orange-red hair that literally looks like flames shooting upward, extremely energetic expression with wide excited eyes and feminine facial features. Wearing bright orange workout gear, appears to be literally on fire with energy flames around her body. Background has intense flame-like patterns and fire effects",
        },
        "kai-rivers": {
          name: "Kai Rivers",
          type: "Yoga and Flexibility Specialist",
          description:
            "Male character with extremely flexible appearance, long flowing dark hair, serene zen-like expression with closed eyes and peaceful smile. Wearing earth-tone yoga clothing, appears to be floating or in a meditative pose. Background should be nature-themed with flowing water",
        },
        "lila-sage": {
          name: "Lila Sage",
          type: "Yoga and Flexibility Specialist",
          description:
            "Female character with graceful, flowing appearance, long purple-tinted hair that seems to move like water, extremely calm and centered expression. Wearing flowing purple yoga attire, appears to be in perfect balance. Background with lotus flowers and peaceful elements",
        },
        "leo-cruz": {
          name: "Leo Cruz",
          type: "Calisthenics and Bodyweight Specialist",
          description:
            "Male character with perfectly sculpted lean muscle definition, appears to be defying gravity in a handstand or athletic pose. Short dark hair, focused intense expression, wearing minimal workout gear. Background suggests acrobatic movement with geometric patterns",
        },
        "maya-flex": {
          name: "Maya Flex",
          type: "Calisthenics and Bodyweight Specialist",
          description:
            "Extremely flexible BLACK FEMALE character with dark skin tone and clearly feminine features, performing an impressive calisthenics move like a perfect handstand or human flag pose. Very lean and graceful athletic build, dark hair in braids or natural style, confident determined expression. Wearing purple athletic wear, demonstrating incredible flexibility and strength in a gravity-defying bodyweight exercise, background has geometric patterns suggesting movement and agility",
        },
        "nate-green": {
          name: "Nate Green",
          type: "Nutrition and Wellness Specialist",
          description:
            "Male character surrounded by floating healthy foods and vegetables, lean healthy appearance with glowing aura. Short neat hair, wise and knowledgeable expression wearing green wellness-themed clothing. Background filled with colorful fruits and vegetables",
        },
        "sophie-gold": {
          name: "Sophie Gold",
          type: "Nutrition and Wellness Specialist",
          description:
            "Female character with radiant healthy glow, appears to be surrounded by golden light and healthy foods. Blonde hair with natural look, warm nurturing expression. Wearing earth-tone wellness clothing, background has golden healthy aura with superfoods",
        },
        "dylan-power": {
          name: "Dylan Power",
          type: "General Fitness and Motivation Specialist",
          description:
            "Energetic male fitness coach character with perfectly balanced athletic build, appears to be mid-workout doing jumping jacks or burpees with sweat droplets flying off him. Medium brown hair slightly messy from exercise, extremely enthusiastic and motivating expression with a big encouraging smile. Wearing simple blue workout clothes like a tank top and shorts, background suggests a gym environment with dumbbells and exercise equipment, motivational energy shown through motion lines and sweat rather than supernatural powers",
        },
        "ava-blaze": {
          name: "Ava Blaze",
          type: "General Fitness and Motivation Specialist",
          description:
            "High-energy FEMALE character with clearly feminine features rendered in realistic 3D style with detailed shading and lighting effects, seems to be literally blazing with motivational fire, athletic build with dynamic jumping pose. Bright red-orange hair that appears to have actual fire sparks and flames, intense motivating expression with feminine facial features. Wearing bright red energetic workout clothes, background has intense lightning and fire energy effects. Render with photorealistic 3D textures and advanced lighting",
        },
        "ryder-swift": {
          name: "Ryder Swift",
          type: "Running and Triathlon Specialist",
          description:
            "Male character who appears to be always running even while standing still with motion blur effects, lean endurance athlete build. Wind-swept hair, focused determined runner's expression. Wearing aerodynamic running gear, background suggests speed and endurance with track elements",
        },
        "chloe-fleet": {
          name: "Chloe Fleet",
          type: "Running and Triathlon Specialist",
          description:
            "Female character with ultra-lean endurance build, appears to be floating or mid-stride, hair flowing behind her. Determined focused expression of a long-distance runner. Wearing streamlined athletic wear, background suggests marathon running with distance markers",
        },
      };

      const coach = coachDescriptions[coachId];
      if (!coach) {
        return res.status(400).json({ error: "Invalid coach ID" });
      }

      console.log(`Generating Rick and Morty style image for ${coach.name}...`);

      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: `Create a character portrait of ${coach.name}, a ${coach.type} fitness instructor in the EXACT Rick and Morty animation style. ${coach.description}. CRITICAL STYLE REQUIREMENTS: Use the precise Rick and Morty art style with thick black outlines, flat cel-shaded colors, simple geometric shapes, exaggerated cartoon features, and the exact same visual aesthetic as Rick Sanchez and Morty Smith characters. The character must have the signature Rick and Morty look with bold black outlines around everything, flat cartoon coloring with no gradients or realistic shading, simple oval head shape, and exaggerated facial features. Focus on head and upper shoulders with a simple solid color background. Match the exact animation style of the Rick and Morty TV show.`,
        n: 1,
        size: "1024x1024",
        quality: "hd",
      });

      const imageUrl = response.data?.[0]?.url;

      console.log(`Generated image for ${coach.name}: ${imageUrl}`);

      res.json({
        success: true,
        imageUrl,
        coachId,
        coachName: coach.name,
        coachType: coach.type,
      });
    } catch (error) {
      console.error("Error generating Rick and Morty coach image:", error);
      res.status(500).json({ error: "Failed to generate coach image" });
    }
  });

  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const userInput = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userInput);

      // Send welcome message from the coach
      const coachMessageContent = getWelcomeMessage(
        user.selectedCoach,
        user.trainingType,
      );
      await storage.createMessage({
        userId: user.id,
        isFromCoach: true,
        content: coachMessageContent,
      });

      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id, 10);
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id, 10);
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const updatedUser = await storage.updateUser(userId, req.body);
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // AI Profile routes
  app.patch("/api/user/ai-profile", requireAuth, async (req, res) => {
    const {
      preferredTrainingTime,
      cardioPreference,
      focusAreas,
      avoidanceAreas,
      sessionDurationPreference,
      trainingDaysPerWeek,
      preferredTrainingDays,
      workoutVariationPreference,
      motivationalPreferences,
      hasCompletedAIOnboarding,
      // New free-text fields
      topFitnessGoal,
      trainingFrequency,
      injuryHistory,
      motivationalFactors,
      onboardingResponses,
    } = req.body;

    try {
      const updatedUser = await storage.updateUser(req.user!.id, {
        preferredTrainingTime,
        cardioPreference,
        focusAreas,
        avoidanceAreas,
        sessionDurationPreference,
        trainingDaysPerWeek,
        preferredTrainingDays,
        workoutVariationPreference,
        motivationalPreferences,
        hasCompletedAIOnboarding,
        // Store new free-text responses for AI context
        topFitnessGoal: topFitnessGoal || preferredTrainingTime,
        injuryHistory: injuryHistory,
        motivationalFactors: motivationalFactors,
        onboardingResponses: onboardingResponses,
        lastWorkoutGenerated: new Date(),
      });

      if (updatedUser) {
        res.json(updatedUser);
      } else {
        res.status(404).json({ error: "User not found" });
      }
    } catch (error) {
      console.error("Error updating AI profile:", error);
      res.status(500).json({ error: "Failed to update AI profile" });
    }
  });

  // Enhanced AI workout generation
  app.post("/api/ai/generate-workout", requireAuth, async (req, res) => {
    try {
      const { workoutType, duration, equipment, focus } = req.body;
      const user = req.user!;

      // Generate personalized workout using AI
      const workout = await generatePersonalizedWorkout({
        user,
        workoutType,
        duration: duration || user.sessionDurationPreference || 45,
        equipment: equipment || [],
        focus: focus || "",
        previousWorkouts: [], // TODO: Get from user history
      });

      res.json(workout);
    } catch (error) {
      console.error("Error generating AI workout:", error);
      res.status(500).json({ error: "Failed to generate AI workout" });
    }
  });

  // Mobile-compatible AI workout generation endpoint
  app.post("/api/ai/workout/generate", requireAuth, async (req, res) => {
    try {
      const { type, duration, equipment, focus } = req.body;
      const user = req.user!;

      // Log the incoming request for debugging
      console.log("Mobile AI workout request:", {
        type,
        duration,
        equipment,
        focus,
      });

      // Generate personalized workout using AI
      const workout = await generatePersonalizedWorkout({
        user,
        workoutType: type, // Mobile sends 'type' instead of 'workoutType'
        duration: duration || user.sessionDurationPreference || 45,
        equipment: equipment || [],
        focus: focus || "", // Mobile sends focus as comma-joined string, which is fine
        previousWorkouts: [], // TODO: Get from user history
      });

      res.json(workout);
    } catch (error) {
      console.error("Mobile AI workout generation error:", error);
      res.status(500).json({ error: "Failed to generate workout" });
    }
  });

  // Smart schedule generation
  app.post("/api/ai/generate-schedule", requireAuth, async (req, res) => {
    try {
      const user = req.user!;

      if (!user.hasCompletedAIOnboarding) {
        return res.status(400).json({
          error: "AI onboarding required to generate personalized schedule",
        });
      }

      // Generate week's worth of workouts based on user preferences
      const schedule = await generateWeeklySchedule(user);

      res.json(schedule);
    } catch (error) {
      console.error("Error generating schedule:", error);
      res.status(500).json({ error: "Failed to generate schedule" });
    }
  });

  // Message routes
  app.get("/api/users/:userId/messages", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId, 10);
      const messages = await storage.getUserMessages(userId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to get messages" });
    }
  });

  app.post("/api/users/:userId/messages", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId, 10);
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const messageInput = insertMessageSchema.parse({
        ...req.body,
        userId,
      });

      const message = await storage.createMessage(messageInput);

      // If message is from user, generate AI coach response
      if (!messageInput.isFromCoach) {
        const coachResponse = await getCoachResponse(
          user.selectedCoach,
          messageInput.content,
          user.trainingType,
          user.coachingStyle,
        );

        await storage.createMessage({
          userId,
          isFromCoach: true,
          content: coachResponse,
        });
      }

      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create message" });
    }
  });

  // Workout routes
  app.get("/api/workouts", async (req, res) => {
    try {
      const { type } = req.query;
      let workouts;

      if (type) {
        workouts = await storage.getWorkoutsByType(type as string);
      } else {
        workouts = await storage.getWorkouts();
      }

      res.json(workouts);
    } catch (error) {
      res.status(500).json({ error: "Failed to get workouts" });
    }
  });

  app.get("/api/workouts/:id", async (req, res) => {
    try {
      const workoutId = parseInt(req.params.id, 10);
      const workout = await storage.getWorkout(workoutId);

      if (!workout) {
        return res.status(404).json({ error: "Workout not found" });
      }

      res.json(workout);
    } catch (error) {
      res.status(500).json({ error: "Failed to get workout" });
    }
  });

  // User Workout routes
  app.get("/api/users/:userId/workouts", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId, 10);
      const userWorkouts = await storage.getUserWorkouts(userId);

      // Get full workout details for each user workout
      const workouts = [];
      for (const userWorkout of userWorkouts) {
        const workout = await storage.getWorkout(userWorkout.workoutId);
        if (workout) {
          workouts.push({
            ...workout,
            completedAt: userWorkout.completedAt,
          });
        }
      }

      res.json(workouts);
    } catch (error) {
      res.status(500).json({ error: "Failed to get user workouts" });
    }
  });

  app.post("/api/users/:userId/workouts", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId, 10);
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const userWorkoutInput = insertUserWorkoutSchema.parse({
        ...req.body,
        userId,
      });

      const userWorkout = await storage.createUserWorkout(userWorkoutInput);

      // Check for new achievements after completing a workout
      const newAchievements = await storage.checkAndAwardAchievements(userId);

      // Return the workout along with any new achievements
      res.status(201).json({
        userWorkout,
        newAchievements: newAchievements.length > 0 ? newAchievements : null,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create user workout" });
    }
  });

  app.get("/api/users/:userId/progress", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId, 10);
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const completedWorkouts =
        await storage.getUserCompletedWorkoutsThisWeek(userId);
      const trainingMinutes =
        await storage.getUserTrainingMinutesThisWeek(userId);

      res.json({
        completedWorkouts,
        trainingMinutes,
        goalWorkouts: user.weeklyGoalWorkouts,
        goalMinutes: user.weeklyGoalMinutes,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get progress" });
    }
  });

  // Get user achievements
  app.get("/api/users/:userId/achievements", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId, 10);

      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const achievements = await storage.getUserAchievements(userId);
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching user achievements:", error);
      res.status(500).json({ error: "Error fetching user achievements" });
    }
  });

  // Get user quests
  app.get("/api/users/:userId/quests", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId, 10);

      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const quests = await storage.getUserQuests(userId);
      res.json(quests);
    } catch (error) {
      console.error("Error fetching user quests:", error);
      res.status(500).json({ error: "Error fetching user quests" });
    }
  });

  // Get user stats/streaks
  app.get("/api/users/:userId/stats", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId, 10);

      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Calculate streaks and stats
      const [userWorkouts, thisWeekWorkouts] = await Promise.all([
        storage.getUserWorkouts(userId),
        storage.getUserCompletedWorkoutsThisWeek(userId),
      ]);

      // Calculate workout streak (simplified)
      const workoutStreak = await storage.calculateWorkoutStreak(userId);

      const stats = {
        workoutStreak,
        nutritionStreak: 0, // TODO: implement nutrition streak calculation
        recoveryStreak: 0, // TODO: implement recovery streak calculation
        lastWorkoutDate:
          userWorkouts.length > 0 ? userWorkouts[0].completedAt : null,
        totalWorkouts: userWorkouts.length,
        thisWeekWorkouts,
        level: user.level || 1,
        xpPoints: user.xpPoints || 0,
        nextLevelXP: (parseInt(user.level as string) || 1 + 1) * 100, // Simple XP calculation
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ error: "Error fetching user stats" });
    }
  });

  // ========== STATS 2.0 ENDPOINTS ==========

  // GET /api/stats/summary - Top-line numbers & streaks
  app.get("/api/stats/summary", async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Get all user workouts
      const userWorkoutsData = await storage.getUserWorkouts(userId);
      
      // Calculate this week's stats
      const now = new Date();
      const startOfThisWeek = new Date(now);
      startOfThisWeek.setDate(now.getDate() - now.getDay()); // Sunday
      startOfThisWeek.setHours(0, 0, 0, 0);
      
      const startOfLastWeek = new Date(startOfThisWeek);
      startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
      
      const thisWeekWorkouts = userWorkoutsData.filter(w => 
        w.completedAt && new Date(w.completedAt) >= startOfThisWeek
      );
      
      const lastWeekWorkouts = userWorkoutsData.filter(w => 
        w.completedAt && 
        new Date(w.completedAt) >= startOfLastWeek && 
        new Date(w.completedAt) < startOfThisWeek
      );
      
      // Calculate minutes (estimate 45 min per workout if not stored)
      const thisWeekMinutes = thisWeekWorkouts.reduce((sum, w) => sum + (w.duration || 45), 0);
      const lastWeekMinutes = lastWeekWorkouts.reduce((sum, w) => sum + (w.duration || 45), 0);
      
      // Calculate calories (estimate based on duration - 8 cal/min average)
      const thisWeekCalories = thisWeekMinutes * 8;
      const lastWeekCalories = lastWeekMinutes * 8;
      
      // Calculate streak
      const workoutStreak = await storage.calculateWorkoutStreak(userId);
      
      // Get user for weekly goal
      const user = await storage.getUser(userId);
      const weeklyGoal = parseInt(String(user?.trainingDays)) || 5;
      
      // Calculate best streak (simplified - would need historical data)
      const bestStreak = Math.max(workoutStreak, userWorkoutsData.length > 0 ? Math.min(userWorkoutsData.length, 30) : 0);
      
      const summary = {
        thisWeek: {
          workoutsCompleted: thisWeekWorkouts.length,
          workoutsChange: thisWeekWorkouts.length - lastWeekWorkouts.length,
          activeMinutes: thisWeekMinutes,
          minutesChange: thisWeekMinutes - lastWeekMinutes,
          caloriesBurned: thisWeekCalories,
          caloriesChange: thisWeekCalories - lastWeekCalories,
          weeklyGoal,
          goalProgress: Math.round((thisWeekWorkouts.length / weeklyGoal) * 100),
        },
        streaks: {
          current: workoutStreak,
          best: bestStreak,
        },
        allTime: {
          totalWorkouts: userWorkoutsData.length,
          totalMinutes: userWorkoutsData.reduce((sum, w) => sum + (w.duration || 45), 0),
          totalCalories: userWorkoutsData.reduce((sum, w) => sum + ((w.duration || 45) * 8), 0),
        },
      };
      
      res.json(summary);
    } catch (error) {
      console.error("Error fetching stats summary:", error);
      res.status(500).json({ error: "Failed to fetch stats summary" });
    }
  });

  // GET /api/stats/weekly-trend - Weekly data for charts (last 12 weeks)
  app.get("/api/stats/weekly-trend", async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const userWorkoutsData = await storage.getUserWorkouts(userId);
      
      // Generate last 12 weeks data
      const weeks: Array<{
        weekStart: string;
        weekLabel: string;
        workouts: number;
        minutes: number;
        volume: number;
      }> = [];
      
      const now = new Date();
      
      for (let i = 11; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay() - (i * 7)); // Go back i weeks
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        
        const weekWorkouts = userWorkoutsData.filter(w => {
          if (!w.completedAt) return false;
          const completedDate = new Date(w.completedAt);
          return completedDate >= weekStart && completedDate < weekEnd;
        });
        
        const weekMinutes = weekWorkouts.reduce((sum, w) => sum + (w.duration || 45), 0);
        // Volume estimation: sets * reps * weight (use placeholder if not available)
        const weekVolume = weekWorkouts.length * 15 * 10 * 50; // Estimate: 15 sets, 10 reps, 50lbs avg
        
        weeks.push({
          weekStart: weekStart.toISOString().split('T')[0],
          weekLabel: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
          workouts: weekWorkouts.length,
          minutes: weekMinutes,
          volume: weekVolume,
        });
      }
      
      res.json({ weeks });
    } catch (error) {
      console.error("Error fetching weekly trend:", error);
      res.status(500).json({ error: "Failed to fetch weekly trend" });
    }
  });

  // GET /api/stats/focus-breakdown - Category/muscle group distribution
  app.get("/api/stats/focus-breakdown", async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const userWorkoutsData = await storage.getUserWorkouts(userId);
      
      // Analyze workout types from the workout data
      const focusCount: Record<string, number> = {
        'Upper Body': 0,
        'Lower Body': 0,
        'Full Body': 0,
        'Core': 0,
        'Cardio': 0,
        'Flexibility': 0,
      };
      
      // Parse workout types from stored data
      for (const workout of userWorkoutsData) {
        // Try to get workout type from the workout data
        const workoutType = (workout as any).workoutType || 'Full Body';
        
        // Categorize based on type
        if (workoutType.toLowerCase().includes('upper') || 
            workoutType.toLowerCase().includes('push') || 
            workoutType.toLowerCase().includes('pull') ||
            workoutType.toLowerCase().includes('chest') ||
            workoutType.toLowerCase().includes('back') ||
            workoutType.toLowerCase().includes('shoulder') ||
            workoutType.toLowerCase().includes('arm')) {
          focusCount['Upper Body']++;
        } else if (workoutType.toLowerCase().includes('lower') || 
                   workoutType.toLowerCase().includes('leg') ||
                   workoutType.toLowerCase().includes('glute')) {
          focusCount['Lower Body']++;
        } else if (workoutType.toLowerCase().includes('cardio') || 
                   workoutType.toLowerCase().includes('hiit') ||
                   workoutType.toLowerCase().includes('run')) {
          focusCount['Cardio']++;
        } else if (workoutType.toLowerCase().includes('core') || 
                   workoutType.toLowerCase().includes('ab')) {
          focusCount['Core']++;
        } else if (workoutType.toLowerCase().includes('yoga') || 
                   workoutType.toLowerCase().includes('stretch') ||
                   workoutType.toLowerCase().includes('mobility')) {
          focusCount['Flexibility']++;
        } else {
          focusCount['Full Body']++;
        }
      }
      
      const totalWorkouts = userWorkoutsData.length || 1; // Avoid division by zero
      
      const breakdown = Object.entries(focusCount)
        .filter(([_, count]) => count > 0)
        .map(([category, count]) => ({
          category,
          sessions: count,
          percentage: Math.round((count / totalWorkouts) * 100),
        }))
        .sort((a, b) => b.sessions - a.sessions);
      
      // If no data, return balanced default
      if (breakdown.length === 0) {
        res.json({
          breakdown: [
            { category: 'Upper Body', sessions: 0, percentage: 25 },
            { category: 'Lower Body', sessions: 0, percentage: 25 },
            { category: 'Full Body', sessions: 0, percentage: 25 },
            { category: 'Cardio', sessions: 0, percentage: 25 },
          ],
          insights: [],
        });
        return;
      }
      
      // Generate insights
      const insights: string[] = [];
      
      // Most common workout day
      const dayCount: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
      for (const workout of userWorkoutsData) {
        if (workout.completedAt) {
          const day = new Date(workout.completedAt).getDay();
          dayCount[day]++;
        }
      }
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const mostConsistentDay = Object.entries(dayCount)
        .sort((a, b) => b[1] - a[1])[0];
      if (parseInt(mostConsistentDay[1] as any) > 0) {
        insights.push(`Your most consistent day is: ${days[parseInt(mostConsistentDay[0])]}`);
      }
      
      // Balance analysis
      const upperCount = focusCount['Upper Body'];
      const lowerCount = focusCount['Lower Body'];
      if (upperCount > lowerCount * 1.5 && lowerCount > 0) {
        const diff = Math.round(((upperCount - lowerCount) / upperCount) * 100);
        insights.push(`You train legs ${diff}% less than upper body`);
      } else if (lowerCount > upperCount * 1.5 && upperCount > 0) {
        const diff = Math.round(((lowerCount - upperCount) / lowerCount) * 100);
        insights.push(`You train upper body ${diff}% less than legs`);
      }
      
      // Cardio check
      if (focusCount['Cardio'] === 0 && userWorkoutsData.length > 3) {
        insights.push(`Consider adding some cardio for heart health!`);
      }
      
      res.json({ breakdown, insights });
    } catch (error) {
      console.error("Error fetching focus breakdown:", error);
      res.status(500).json({ error: "Failed to fetch focus breakdown" });
    }
  });

  // ========== END STATS 2.0 ENDPOINTS ==========

  // Sync completed workout from frontend to backend
  app.post("/api/workouts/complete", async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { workoutId, title, type, duration, completedAt, exercises } = req.body;
      
      if (!workoutId) {
        return res.status(400).json({ error: "Workout ID required" });
      }
      
      // Create a user workout entry
      const userWorkout = await storage.createUserWorkout({
        userId: userId,
        workoutId: 1, // Default workout reference
        completed: true,
        completedAt: completedAt ? new Date(completedAt) : new Date(),
        duration: duration || 45,
        workoutType: type || 'General',
        rating: 5, // Default rating
        notes: `${title} - ${exercises?.length || 0} exercises`,
      });
      
      console.log(`✅ [SYNC] Workout completed synced for user ${userId}: ${title}`);
      
      res.json({ 
        success: true, 
        message: 'Workout synced successfully',
        workoutId: userWorkout?.id || workoutId,
      });
    } catch (error) {
      console.error("Error syncing completed workout:", error);
      res.status(500).json({ error: "Failed to sync workout" });
    }
  });

  // Claim quest reward
  app.post("/api/users/:userId/quests/:questId/claim", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId, 10);
      const questId = parseInt(req.params.questId, 10);

      if (isNaN(userId) || isNaN(questId)) {
        return res.status(400).json({ error: "Invalid user ID or quest ID" });
      }

      const result = await storage.claimQuestReward(userId, questId);
      res.json(result);
    } catch (error) {
      console.error("Error claiming quest reward:", error);
      res.status(500).json({ error: "Error claiming quest reward" });
    }
  });

  // Track quest (pin to home)
  app.post("/api/users/:userId/quests/:questId/track", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId, 10);
      const questId = parseInt(req.params.questId, 10);

      if (isNaN(userId) || isNaN(questId)) {
        return res.status(400).json({ error: "Invalid user ID or quest ID" });
      }

      // TODO: Implement quest tracking logic
      res.json({ success: true, message: "Quest tracked successfully" });
    } catch (error) {
      console.error("Error tracking quest:", error);
      res.status(500).json({ error: "Error tracking quest" });
    }
  });

  // Get new/unviewed achievements
  app.get("/api/users/:userId/achievements/new", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId, 10);

      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const newAchievements = await storage.getUnlockedAchievements(userId);
      res.json(newAchievements);
    } catch (error) {
      console.error("Error fetching new achievements:", error);
      res.status(500).json({ error: "Error fetching new achievements" });
    }
  });

  // Mark achievements as viewed
  app.post("/api/users/:userId/achievements/viewed", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId, 10);

      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      await storage.markAchievementsAsDisplayed(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking achievements as viewed:", error);
      res.status(500).json({ error: "Error marking achievements as viewed" });
    }
  });

  // Get user progress snapshots
  app.get("/api/users/:userId/progress/:period", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId, 10);
      const period = req.params.period; // "week" or "month"

      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      if (period !== "week" && period !== "month") {
        return res
          .status(400)
          .json({ error: "Invalid period. Must be 'week' or 'month'" });
      }

      const progressSnapshots = await storage.getUserProgressSnapshots(
        userId,
        period,
      );
      res.json(progressSnapshots);
    } catch (error) {
      console.error("Error fetching progress snapshots:", error);
      res.status(500).json({ error: "Error fetching progress snapshots" });
    }
  });

  // Create a progress snapshot
  app.post("/api/users/:userId/progress/snapshot", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId, 10);
      const {
        period,
        workoutsCompleted,
        minutesTraining,
        streakDays,
        caloriesBurned,
      } = req.body;

      if (isNaN(userId) || !period) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const snapshot = await storage.createProgressSnapshot({
        userId,
        period,
        workoutsCompleted: workoutsCompleted || 0,
        minutesTraining: minutesTraining || 0,
        streakDays: streakDays || 0,
        caloriesBurned: caloriesBurned || 0,
      });

      res.json(snapshot);
    } catch (error) {
      console.error("Error creating progress snapshot:", error);
      res.status(500).json({ error: "Error creating progress snapshot" });
    }
  });

  // Admin-only video generation endpoints
  app.post("/api/admin/generate-exercise-video", async (req, res) => {
    try {
      const {
        exerciseName,
        description,
        duration = 30,
        style = "professional",
      } = req.body;

      if (!exerciseName || !description) {
        return res.status(400).json({
          error: "Exercise name and description are required",
        });
      }

      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (!openaiApiKey) {
        return res.status(500).json({
          error: "OpenAI API key not configured",
        });
      }

      const videoId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create detailed fitness video prompt based on style
      const styleSettings = {
        professional:
          "Professional gym environment with high-quality equipment, perfect lighting, and clean background",
        home: "Home workout setting with minimal equipment, natural lighting, and comfortable space",
        outdoor:
          "Outdoor fitness setting with natural background, good lighting, and open space",
        studio:
          "Clean white studio background with professional lighting and minimal distractions",
      };

      const prompt = `Professional fitness trainer demonstrating ${exerciseName}. ${description}. ${styleSettings[style as keyof typeof styleSettings] || styleSettings.professional}. Perfect form, clear instruction pose, realistic style, high quality.`;

      // Try to generate preview image, but continue without it if it fails
      let previewImage = null;
      try {
        const imageResponse = await openai.images.generate({
          model: "dall-e-3",
          prompt: prompt,
          n: 1,
          size: "1792x1024",
          quality: "hd",
        });
        previewImage = imageResponse.data?.[0]?.url;
      } catch (imageError) {
        console.log(
          "Image generation failed, continuing without preview:",
          (imageError as Error)?.message || "Unknown error",
        );
        // Use a placeholder or continue without image
        previewImage = null;
      }

      // Store video project
      const project = {
        id: videoId,
        exerciseName,
        description,
        prompt,
        duration,
        style,
        status: "processing",
        previewImage,
        createdAt: new Date().toISOString(),
        estimatedCompletion: new Date(Date.now() + 180000).toISOString(),
      };

      videoProjects.set(videoId, project);

      // Simulate video processing completion
      setTimeout(() => {
        const updatedProject = videoProjects.get(videoId);
        if (updatedProject) {
          updatedProject.status = "completed";
          updatedProject.videoUrl = `https://sample-videos.com/zip/10/mp4/480/${exerciseName.toLowerCase().replace(/\s+/g, "-")}.mp4`;
          videoProjects.set(videoId, updatedProject);
        }
      }, 5000);

      res.json({
        videoId,
        status: "processing",
        message: "Video generation started",
        previewImage,
        estimatedTime: "3 minutes",
      });
    } catch (error) {
      console.error("Admin video generation error:", error);
      res.status(500).json({
        error: "Failed to start video generation",
      });
    }
  });

  // AI Workout Generation endpoint - supports multiple request formats
  app.post("/api/generate-workout", async (req, res) => {
    // 🚨 STABILIZATION: Block AI generation during stabilization
    if (!AI_ENABLED) {
      console.log("🔧 AI disabled: Returning static workout template");
      return res.status(200).json({
        title: "Static Strength Workout",
        description:
          "Basic bodyweight workout focusing on fundamental movements",
        estimatedDuration: 30,
        difficulty: "intermediate",
        exercises: [
          {
            id: "static-1",
            name: "Push-ups",
            instructions:
              "Standard push-ups targeting chest, shoulders, and triceps",
            sets: 3,
            reps: 12,
            targetMuscles: ["Chest", "Shoulders", "Triceps"],
          },
          {
            id: "static-2",
            name: "Bodyweight Squats",
            instructions: "Bodyweight squats for leg strength and mobility",
            sets: 3,
            reps: 15,
            targetMuscles: ["Quadriceps", "Glutes", "Hamstrings"],
          },
          {
            id: "static-3",
            name: "Plank Hold",
            instructions: "Hold plank position to build core strength",
            sets: 3,
            reps: "30-45 sec",
            targetMuscles: ["Core", "Shoulders"],
          },
        ],
        coachNotes:
          "Focus on proper form over speed. Take 60 seconds rest between sets.",
      });
    }

    try {
      // Support both request formats:
      // Format 1: { request, preferences, equipment } (legacy)
      // Format 2: { workoutType, workoutProfile } (new)
      const { request, preferences, equipment, workoutType, workoutProfile } =
        req.body;

      // Normalize to unified format
      let workoutRequest: string;
      let workoutPreferences: any = {};
      let workoutEquipment: string = "bodyweight";

      if (request && typeof request === "string") {
        // Legacy format
        workoutRequest = request;
        workoutPreferences = preferences || {};
        workoutEquipment = equipment || "bodyweight";
      } else if (workoutType && typeof workoutType === "string") {
        // New format
        workoutRequest = `Generate a ${workoutType} workout`;
        workoutPreferences = {
          experience: workoutProfile?.experienceLevel || "intermediate",
          daysPerWeek: 3,
          goal: "general",
        };
        workoutEquipment = "bodyweight";
      } else {
        return res
          .status(400)
          .json({ error: "Either request or workoutType is required" });
      }

      // Build comprehensive context from user preferences
      const goalMappings: Record<string, string> = {
        muscle: "building muscle mass and strength",
        "fat-loss": "losing fat and improving body composition",
        general: "general fitness and health",
        strength: "maximizing strength and power",
        endurance: "improving cardiovascular endurance",
      };
      const goalContext =
        goalMappings[workoutPreferences?.goal] || "general fitness";

      const equipmentMappings: Record<string, string> = {
        gym: "full gym access with weights, machines, and equipment",
        home: "home gym setup with basic equipment",
        minimal: "minimal equipment like resistance bands or dumbbells",
        bodyweight: "no equipment, bodyweight exercises only",
      };
      const equipmentContext =
        equipmentMappings[workoutEquipment] || "bodyweight exercises";

      const experienceMappings: Record<string, string> = {
        beginner:
          "new to fitness with focus on proper form and basic movements",
        intermediate: "some fitness experience, ready for moderate intensity",
        advanced: "experienced with complex movements and high intensity",
      };
      const experienceContext =
        experienceMappings[workoutPreferences?.experience] || "intermediate";

      const restrictionsText = workoutPreferences?.restrictions
        ? `Important restrictions to consider: ${workoutPreferences.restrictions}`
        : "";

      const prompt = `Generate a safe, effective workout for this request: "${workoutRequest}"

User Profile:
- Primary goal: ${goalContext}
- Experience level: ${experienceContext}  
- Available equipment: ${equipmentContext}
- Workout frequency: ${workoutPreferences?.daysPerWeek || 3} days per week
${restrictionsText}

Create 4-6 exercises that directly address their request while matching their capabilities. Focus on proper progression and safety.

Respond with a complete workout in JSON format:
{
  "title": "Workout Title",
  "description": "Brief workout description",
  "estimatedDuration": duration_in_minutes,
  "difficulty": "beginner/intermediate/advanced",
  "exercises": [
    {
      "name": "Exercise Name",
      "sets": number,
      "reps": "8-12 or time duration",
      "rest": "60s or 90s",
      "targetMuscles": ["primary", "secondary"],
      "instructions": "Clear, safe technique description",
      "difficulty": "beginner/intermediate/advanced"
    }
  ],
  "coachNotes": "Additional coaching tips"
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are a professional fitness trainer and exercise specialist. Generate safe, effective workouts based on user requests and capabilities. Always prioritize proper form and safety. Always respond with valid JSON.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 1000,
      });

      if (
        !response.choices ||
        !response.choices[0] ||
        !response.choices[0].message ||
        !response.choices[0].message.content
      ) {
        throw new Error("Empty response from OpenAI");
      }

      let workoutData;
      try {
        workoutData = JSON.parse(response.choices[0].message.content);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        throw new Error("Invalid JSON response from AI");
      }

      // Validate the response structure
      if (
        !workoutData.exercises ||
        !Array.isArray(workoutData.exercises) ||
        workoutData.exercises.length === 0
      ) {
        throw new Error("Invalid workout data structure - no exercises found");
      }

      // Ensure each exercise has required fields
      const validatedExercises = workoutData.exercises.map(
        (exercise: any, index: number) => ({
          id: `ai-${Date.now()}-${index}`,
          name: exercise.name || `Exercise ${index + 1}`,
          sets:
            typeof exercise.sets === "number" && exercise.sets > 0
              ? exercise.sets
              : 3,
          reps: exercise.reps || "8-12",
          rest: exercise.rest || "60s",
          muscles:
            Array.isArray(exercise.muscles) && exercise.muscles.length > 0
              ? exercise.muscles
              : ["general"],
          instructions:
            exercise.instructions ||
            `Perform ${exercise.name || "this exercise"} with proper form.`,
          difficulty: ["beginner", "intermediate", "advanced"].includes(
            exercise.difficulty,
          )
            ? exercise.difficulty
            : preferences?.experience || "beginner",
        }),
      );

      res.json({ exercises: validatedExercises });
    } catch (error) {
      console.error("AI workout generation error:", error);
      res.status(500).json({
        error: "Failed to generate workout",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Get admin video projects
  app.get("/api/admin/video-projects", async (req, res) => {
    try {
      const projects = Array.from(videoProjects.values()).sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      res.json(projects);
    } catch (error) {
      console.error("Error fetching video projects:", error);
      res.status(500).json({
        error: "Failed to fetch video projects",
      });
    }
  });

  // Get specific video project status
  app.get("/api/admin/video-projects/:videoId", async (req, res) => {
    try {
      const { videoId } = req.params;
      const project = videoProjects.get(videoId);

      if (!project) {
        return res.status(404).json({
          error: "Video project not found",
        });
      }

      res.json(project);
    } catch (error) {
      console.error("Error fetching video project:", error);
      res.status(500).json({
        error: "Failed to fetch video project",
      });
    }
  });

  // =============================================================================
  // NEW V1 WORKOUT API - Single source of truth for calendar sync
  // =============================================================================

  // GET /api/v1/workouts/week - Returns workout_days for current week (today → Saturday)
  app.get("/api/v1/workouts/week", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const user = req.user!;

      // Calculate today → Saturday range
      const today = new Date();
      const daysUntilSaturday = (6 - today.getDay() + 7) % 7; // Saturday is day 6
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + daysUntilSaturday);

      // Try to query workout_days table (will handle gracefully if table doesn't exist)
      // 🎯 Use in-memory storage for backend plumbing test
      const workoutDaysRecords = [];
      const todayStr = today.toISOString().split("T")[0];
      const endDateStr = endDate.toISOString().split("T")[0];

      for (const [key, day] of Array.from(inMemoryWorkoutDays.entries())) {
        if (
          day.userId === user.id &&
          day.date >= todayStr &&
          day.date <= endDateStr
        ) {
          workoutDaysRecords.push(day);
        }
      }

      // Sort by date
      workoutDaysRecords.sort((a, b) => a.date.localeCompare(b.date));

      return res.json({
        status: "ready",
        workouts: workoutDaysRecords,
      });
    } catch (error) {
      console.error("Error getting weekly workouts:", error);
      res.status(500).json({ error: "Failed to get weekly workouts" });
    }
  });

  // GET /api/v1/workouts/day?date=YYYY-MM-DD - Returns single workout_day record
  app.get("/api/v1/workouts/day", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const user = req.user!;
      const { date } = req.query;

      if (!date || typeof date !== "string") {
        return res
          .status(400)
          .json({ error: "Date parameter is required (YYYY-MM-DD format)" });
      }

      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res
          .status(400)
          .json({ error: "Invalid date format. Use YYYY-MM-DD" });
      }

      // Try to query workout_days table (will handle gracefully if table doesn't exist)
      try {
        const { workoutDays } = await import("@shared/schema");
        const { eq, and } = await import("drizzle-orm");

        const workoutDayRecord = await db
          .select()
          .from(workoutDays)
          .where(
            and(eq(workoutDays.userId, user.id), eq(workoutDays.date, date)),
          )
          .limit(1);

        if (workoutDayRecord.length === 0) {
          return res.json({
            status: "not_found",
            message: `No workout found for ${date}`,
          });
        }

        return res.json({
          status: "ready",
          workout: workoutDayRecord[0],
        });
      } catch (dbError) {
        // Table might not exist yet - check in-memory storage as fallback
        console.log(
          "📊 workout_days table not ready, checking in-memory storage",
        );
        const userDateKey = `${user.id}-${date}`;
        const inMemoryDay = inMemoryWorkoutDays.get(userDateKey);

        if (inMemoryDay) {
          return res.json(inMemoryDay);
        }

        return res.json({
          status: "not_found",
          message: `No workout found for ${date} (table not ready)`,
        });
      }
    } catch (error) {
      console.error("Error getting daily workout:", error);
      res.status(500).json({ error: "Failed to get daily workout" });
    }
  });

  // 🎯 In-memory workoutDays storage for backend plumbing test
  const inMemoryWorkoutDays = new Map<
    string,
    {
      id: number;
      userId: number;
      date: string;
      status: "pending" | "generating" | "ready" | "error";
      payloadJson: any;
      completedAt?: Date;
      createdAt: Date;
      updatedAt: Date;
    }
  >();

  let workoutDayIdCounter = 1;

  // POST /api/v1/workouts/generate-day - Generate workout for specific date
  app.post("/api/v1/workouts/generate-day", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const user = req.user!;
      const { date } = req.body;

      if (!date || typeof date !== "string") {
        return res.status(400).json({
          error: "Date parameter is required in body (YYYY-MM-DD format)",
        });
      }

      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res
          .status(400)
          .json({ error: "Invalid date format. Use YYYY-MM-DD" });
      }

      // Upsert the day row and set status='generating'
      const now = new Date();
      const today = now.toISOString().split("T")[0]; // YYYY-MM-DD format

      // Check if day already exists
      let existingDay;
      try {
        const [existing] = await db
          .select()
          .from(workoutDays)
          .where(and(eq(workoutDays.userId, user.id), eq(workoutDays.date, date)))
          .limit(1);
        existingDay = existing;
      } catch (dbError) {
        console.error(
          "DB check failed, using fallback:",
          dbError instanceof Error ? dbError.message : String(dbError),
        );
        const userDateKey = `${user.id}-${date}`;
        existingDay = inMemoryWorkoutDays.get(userDateKey);
      }

      if (
        existingDay &&
        (existingDay.status === "ready" || existingDay.status === "generating")
      ) {
        return res.json({
          status: "no_action",
          message: `Day ${date} is already ${existingDay.status}`,
        });
      }

      // Prepare variables for workout day tracking
      const userDateKey = `${user.id}-${date}`;
      let workoutDay: {
        id: number;
        userId: number;
        date: string;
        status: "pending" | "generating" | "ready" | "error";
        payloadJson: any;
        completedAt?: Date;
        createdAt: Date;
        updatedAt: Date;
      } = {
        id: existingDay?.id || workoutDayIdCounter++,
        userId: user.id,
        date,
        status: "generating",
        payloadJson: {},
        createdAt: existingDay?.createdAt || now,
        updatedAt: now,
      };

      // Upsert day record with generating status
      try {
        await db
          .insert(workoutDays)
          .values({
            userId: user.id,
            date,
            status: "generating",
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: [workoutDays.userId, workoutDays.date],
            set: {
              status: "generating",
              updatedAt: now,
            },
          });
        console.log(`📝 Upserted workout day ${date} with status=generating`);
      } catch (dbError) {
        console.error("DB upsert failed, using fallback:", dbError instanceof Error ? dbError.message : String(dbError));
        inMemoryWorkoutDays.set(userDateKey, workoutDay);
      }

      // Only call model if date equals today, otherwise leave as pending
      if (date !== today) {
        console.log(
          `📅 Day ${date} is not today (${today}), leaving as pending`,
        );
        workoutDay.status = "pending";
        workoutDay.updatedAt = new Date();
        inMemoryWorkoutDays.set(userDateKey, workoutDay);

        return res.json({
          status: "pending",
          message: `Workout for ${date} set to pending (not today)`,
        });
      }

      // Generate workout for today using OpenAI
      const generateWorkout = async () => {
        try {
          console.log(`🤖 Generating workout for ${date} using AI`);

          // Load exercises dynamically from database
          const allExercises = await db.select({
            id: exercises.id,
            name: exercises.name,
            bodyPart: exercises.body_part,
            equipment: exercises.equipment,
            pattern: exercises.pattern,
            category: exercises.category,
            difficulty: exercises.difficulty
          }).from(exercises);

          console.log(`📚 Loaded ${allExercises.length} exercises from database`);

          // Prepare user profile data
          const goal = user.goal || "improve-health";
          const equipmentAccess = user.equipmentAccess
            ? JSON.parse(user.equipmentAccess)
            : ["bodyweight"];
          const duration = user.sessionDurationPreference || 45;
          const injuries = user.injuries || "none";
          const cardioPreference = user.cardioPreference || "neutral";
          const coachingStyle = user.coachingStyle || "encouraging-positive";
          const focusAreas = user.focusAreas ? JSON.parse(user.focusAreas) : ["strength"];

          // Filter exercises by user's available equipment
          const availableExercises = allExercises.filter(ex => {
            if (!ex.equipment) return equipmentAccess.includes("bodyweight");
            const exerciseEquipment = Array.isArray(ex.equipment) ? ex.equipment : [ex.equipment];
            return exerciseEquipment.some(eq => equipmentAccess.includes(eq)) || 
                   (exerciseEquipment.includes("bodyweight") && equipmentAccess.includes("bodyweight"));
          });

          console.log(`🎯 Filtered to ${availableExercises.length} exercises for user's equipment: ${equipmentAccess.join(", ")}`);

          // Create exercise list by category for the AI prompt
          const exercisesByCategory = {
            warmup: availableExercises.filter(ex => ex.category === "warmup" || ex.bodyPart === "warmup").map(ex => ex.name),
            upperBody: availableExercises.filter(ex => ex.category === "upper-body" || ex.bodyPart === "chest" || ex.bodyPart === "back" || ex.bodyPart === "shoulders").map(ex => ex.name),
            lowerBody: availableExercises.filter(ex => ex.category === "lower-body" || ex.bodyPart === "legs").map(ex => ex.name),
            core: availableExercises.filter(ex => ex.category === "core" || ex.bodyPart === "core").map(ex => ex.name),
            fullBody: availableExercises.filter(ex => ex.category === "full-body" || ex.bodyPart === "full").map(ex => ex.name),
            cardio: availableExercises.filter(ex => ex.category === "cardio").map(ex => ex.name)
          };

          // Build system prompt for workout generation
          const systemPrompt = `You are an expert fitness coach generating a structured workout.
          
          CRITICAL: Choose ONLY exercises that exist in the exercises library below. Use the EXACT names provided.
          
          Available Exercises Library:
          Warm-up: ${exercisesByCategory.warmup.join(", ") || "Jumping Jacks, Arm Circles"}
          Upper Body: ${exercisesByCategory.upperBody.join(", ") || "Push-Ups, Pull-Ups"}
          Lower Body: ${exercisesByCategory.lowerBody.join(", ") || "Bodyweight Squats, Lunges"}
          Core: ${exercisesByCategory.core.join(", ") || "Plank, Bicycle Crunches"}
          Full Body: ${exercisesByCategory.fullBody.join(", ") || "Burpees, Mountain Climbers"}
          Cardio: ${exercisesByCategory.cardio.join(", ") || "High Knees, Jumping Jacks"}
          
          User Profile:
          - Goal: ${goal}
          - Focus Areas: ${focusAreas.join(", ")}
          - Available Equipment: ${equipmentAccess.join(", ")}
          - Target Duration: ${duration} minutes
          - Coaching Style: ${coachingStyle}
          - Injuries/Exclusions: ${injuries}
          - Cardio Preference: ${cardioPreference} (only include cardio if 'love' or 'like')
          
          Generate a workout with EXACTLY this structure:
          {
            "date": "${date}",
            "title": "Descriptive workout title",
            "duration_min": ${duration},
            "coach_notes": "Brief motivational note",
            "blocks": [
              {
                "type": "warmup",
                "items": [
                  {
                    "exercise_id": 1,
                    "name": "Exercise name",
                    "sets": 1,
                    "reps": 10,
                    "rest_sec": 30
                  }
                ]
              },
              {
                "type": "main",
                "items": [
                  {
                    "exercise_id": 2,
                    "name": "Exercise name",
                    "sets": 3,
                    "reps": 12,
                    "load": 0,
                    "rest_sec": 60
                  }
                  // Include 3-6 exercises total
                ]
              },
              {
                "type": "recovery",
                "items": [
                  {
                    "exercise_id": 5,
                    "name": "Stretching exercise",
                    "sets": 1,
                    "reps": "30s hold",
                    "rest_sec": 0
                  }
                ]
              }
            ]
          }
          
          Requirements:
          - EXACTLY 1 warmup block with at least 1 item
          - EXACTLY 1 main block with 3-6 items  
          - EXACTLY 1 recovery block with at least 1 item
          - CRITICAL: Use ONLY exercise names from the exercises library above with EXACT canonical names
          - Use exercise_id starting from 1 and incrementing
          - Match exercises to available equipment: ${equipmentAccess.join(", ")}
          - Filter exercises by body_part, equipment, and pattern for optimal programming
          - Avoid movements that aggravate mentioned injuries
          - Return ONLY valid JSON, no explanation text`;

          const userPrompt = `Generate a personalized ${goal}-focused workout for ${duration} minutes. Focus on: ${focusAreas.join(", ")}. Use ${coachingStyle} coaching tone in coach_notes. Equipment available: ${equipmentAccess.join(", ")}. ${injuries !== "none" ? `Avoid exercises that might aggravate: ${injuries}.` : "No injury limitations."}`;

          // Call OpenAI with 20s timeout
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("OpenAI timeout after 20s")),
              20000,
            ),
          );

          const aiResponse: any = await Promise.race([
            openai.chat.completions.create({
              model: "gpt-4o",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
              ],
              temperature: 0.7,
              max_tokens: 2000,
            }),
            timeoutPromise,
          ]);

          // Clean up the response content (remove markdown code blocks if present)
          let responseContent = aiResponse.choices[0].message.content || "{}";
          responseContent = responseContent
            .replace(/```json\n?/g, "")
            .replace(/```\n?/g, "")
            .trim();

          const workoutJson = JSON.parse(responseContent);

          // Map exercise names to IDs and validate
          console.log(`🔄 Mapping exercise names to IDs for validation`);
          const mappingErrors: string[] = [];
          const failedExerciseNames: string[] = [];
          let mappedCount = 0;

          for (const block of workoutJson.blocks || []) {
            for (const item of block.items || []) {
              const mapping = await mapExerciseNameToId(item.name);
              if (mapping.id) {
                item.exercise_id = mapping.id;
                mappedCount++;
              } else if (mapping.error) {
                mappingErrors.push(mapping.error);
                failedExerciseNames.push(item.name);
              }
            }
          }

          if (mappingErrors.length > 0) {
            throw new Error(
              `Exercise mapping failed for: ${failedExerciseNames.join(", ")}`,
            );
          }

          console.log(`✅ Mapped ${mappedCount} exercises successfully`);

          // Validate the generated workout
          const validation = await validateWorkoutPayload(workoutJson);

          if (!validation.ok) {
            throw new Error(
              `Validation failed: ${validation.errors.join(", ")}`,
            );
          }

          // Success - save payload and set status to ready
          try {
            await db
              .update(workoutDays)
              .set({
                status: "ready",
                payloadJson: workoutJson,
                completedAt: now,
                updatedAt: now,
              })
              .where(and(eq(workoutDays.userId, user.id), eq(workoutDays.date, date)));
          } catch (dbError) {
            const userDateKey = `${user.id}-${date}`;
            const updatedDay = inMemoryWorkoutDays.get(userDateKey);
            if (updatedDay) {
              updatedDay.status = "ready";
              updatedDay.payloadJson = workoutJson;
              updatedDay.completedAt = new Date();
              updatedDay.updatedAt = new Date();
              inMemoryWorkoutDays.set(userDateKey, updatedDay);
            }
          }

          console.log(`✅ Workout generated successfully for ${date}`);
        } catch (error: any) {
          let errorReason = "Generation failed";

          // Handle specific error types with detailed information
          if (error.message?.includes("Invalid URL")) {
            errorReason = "Database connection error";
          } else if (error.message?.includes("timeout")) {
            errorReason = "OpenAI timeout";
          } else if (error.message?.includes("Exercise mapping failed for:")) {
            // Extract exercise names from the error message for detailed error reporting
            const failedExercises = error.message.replace(
              "Exercise mapping failed for: ",
              "",
            );
            errorReason = `Exercise not found: ${failedExercises}`;
          } else if (error.message?.includes("Validation failed")) {
            errorReason = "Workout validation failed";
          } else if (error.message) {
            errorReason = error.message.substring(0, 200);
          }

          console.error(
            `❌ Workout generation failed for ${date}: ${errorReason}`,
          );

          // Set status to error with detailed reason
          try {
            await db
              .update(workoutDays)
              .set({
                status: "error",
                payloadJson: { error_reason: errorReason },
                updatedAt: now,
              })
              .where(and(eq(workoutDays.userId, user.id), eq(workoutDays.date, date)));
          } catch (dbError) {
            const userDateKey = `${user.id}-${date}`;
            const updatedDay = inMemoryWorkoutDays.get(userDateKey);
            if (updatedDay) {
              updatedDay.status = "error";
              updatedDay.payloadJson = { error_reason: errorReason };
              updatedDay.updatedAt = new Date();
              inMemoryWorkoutDays.set(userDateKey, updatedDay);
            }
          }
        }
      };

      // Start generation process (non-blocking)
      generateWorkout();

      return res.json({
        status: "generating",
        message: `Workout generation initiated for ${date}`,
      });
    } catch (error) {
      console.error("Error generating daily workout:", error);
      res.status(500).json({ error: "Failed to generate daily workout" });
    }
  });

  // Legacy alias: /api/generate-workout -> same handler as v1
  app.post("/api/generate-workout", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const user = req.user!;
      const { date } = req.body;

      if (!date || typeof date !== "string") {
        return res.status(400).json({
          error: "Date parameter is required in body (YYYY-MM-DD format)",
        });
      }

      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res
          .status(400)
          .json({ error: "Invalid date format. Use YYYY-MM-DD" });
      }

      const now = new Date();
      let existingDay;
      try {
        const [existing] = await db
          .select()
          .from(workoutDays)
          .where(and(eq(workoutDays.userId, user.id), eq(workoutDays.date, date)))
          .limit(1);
        existingDay = existing;
      } catch (dbError) {
        console.error(
          "DB check failed, using fallback:",
          dbError instanceof Error ? dbError.message : String(dbError),
        );
        const userDateKey = `${user.id}-${date}`;
        existingDay = inMemoryWorkoutDays.get(userDateKey);
      }

      if (
        existingDay &&
        (existingDay.status === "ready" || existingDay.status === "generating")
      ) {
        return res.json({
          status: "no_action",
          message: `Day ${date} is already ${existingDay.status}`,
        });
      }

      const userDateKey = `${user.id}-${date}`;
      let workoutDay = {
        id: existingDay?.id || workoutDayIdCounter++,
        userId: user.id,
        date,
        status: "generating" as const,
        payloadJson: {},
        createdAt: existingDay?.createdAt || now,
        updatedAt: now,
      };

      try {
        await db
          .insert(workoutDays)
          .values({
            userId: user.id,
            date,
            status: "generating",
            payloadJson: {},
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: [workoutDays.userId, workoutDays.date],
            set: { status: "generating", updatedAt: now },
          });
      } catch (dbError) {
        inMemoryWorkoutDays.set(userDateKey, workoutDay);
      }

      const generateWorkout = async () => {
        try {
          // Using default values for workout generation
          const goal = "general fitness";
          const duration = 30;
          const equipmentAccess = ["bodyweight"];
          const injuries = "none";

          const exerciseLibrary = await db.select().from(exercises);
          const libraryString = exerciseLibrary
            .map(
              (ex) => `${ex.id}. ${ex.name} (${ex.body_part}, ${ex.equipment})`,
            )
            .join("\n");

          const systemPrompt = `You are a fitness coach AI. Generate a complete workout in strict JSON format.`;
          const userPrompt = `Generate a personalized ${goal}-focused workout for ${duration} minutes. Focus on: ${focusAreas.join(", ")}. Use ${coachingStyle} coaching tone in coach_notes. Equipment available: ${equipmentAccess.join(", ")}. ${injuries !== "none" ? `Avoid exercises that might aggravate: ${injuries}.` : "No injury limitations."}`;

          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("OpenAI timeout after 20s")),
              20000,
            ),
          );

          const aiResponse: any = await Promise.race([
            openai.chat.completions.create({
              model: "gpt-4o",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
              ],
              temperature: 0.7,
              max_tokens: 2000,
            }),
            timeoutPromise,
          ]);

          let responseContent = aiResponse.choices[0].message.content || "{}";
          responseContent = responseContent
            .replace(/```json\n?/g, "")
            .replace(/```\n?/g, "")
            .trim();

          const workoutJson = JSON.parse(responseContent);

          try {
            await db
              .update(workoutDays)
              .set({
                status: "ready",
                payloadJson: workoutJson,
                updatedAt: now,
              })
              .where(and(eq(workoutDays.userId, user.id), eq(workoutDays.date, date)));
          } catch (dbError) {
            const userDateKey = `${user.id}-${date}`;
            const updatedDay = inMemoryWorkoutDays.get(userDateKey);
            if (updatedDay) {
              updatedDay.status = "ready";
              updatedDay.payloadJson = workoutJson;
              updatedDay.updatedAt = new Date();
              inMemoryWorkoutDays.set(userDateKey, updatedDay);
            }
          }
        } catch (error: any) {
          let errorReason = "Generation failed";
          if (error.message?.includes("timeout")) {
            errorReason = "OpenAI timeout";
          }

          try {
            await db
              .update(workoutDays)
              .set({
                status: "error",
                payloadJson: { error_reason: errorReason },
                updatedAt: now,
              })
              .where(and(eq(workoutDays.userId, user.id), eq(workoutDays.date, date)));
          } catch (dbError) {
            const userDateKey = `${user.id}-${date}`;
            const updatedDay = inMemoryWorkoutDays.get(userDateKey);
            if (updatedDay) {
              updatedDay.status = "error";
              updatedDay.payloadJson = { error_reason: errorReason };
              updatedDay.updatedAt = new Date();
              inMemoryWorkoutDays.set(userDateKey, updatedDay);
            }
          }
        }
      };

      generateWorkout();

      return res.json({
        status: "generating",
        message: `Workout generation initiated for ${date}`,
      });
    } catch (error) {
      console.error("Error generating daily workout:", error);
      res.status(500).json({ error: "Failed to generate daily workout" });
    }
  });

  // POST /api/v1/workouts/generate-week - Generate workouts for current week (Mon-Sun)
  app.post("/api/v1/workouts/generate-week", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const user = req.user!;
      const userProfile = req.body.userProfile || {};
      
      console.log('📥 [API] Week generation request for user:', user.id);
      
      // Generate the week using the proper function
      const result = await generateWeekWorkouts(user.id, userProfile);
      
      return res.status(200).json({
        success: true,
        message: 'Week generated successfully',
        weekDates: result.weekDates,
        workouts: result.workouts.map(day => ({
          date: day.date,
          status: day.status,
          workout: day.payloadJson,
        })),
      });
      
    } catch (error: any) {
      console.error('❌ [API] Week generation error:', error);
      
      return res.status(500).json({
        error: 'Failed to generate week',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  });

  // ====================
  // V1 API ENDPOINTS
  // ====================

  // POST /api/v1/workouts - Generate one day (stub, no AI)
  app.post("/api/v1/workouts", async (req: Request, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { date } = req.body;

    if (!date) {
      return res.status(400).json({ error: "Date is required" });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res
        .status(400)
        .json({ error: "Date must be in YYYY-MM-DD format" });
    }

    try {
      // Ensure workout_days table exists
      await db.execute(`
        CREATE TABLE IF NOT EXISTS workout_days (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          date TEXT NOT NULL,
          status TEXT NOT NULL,
          payload_json JSONB,
          completed_at TIMESTAMP,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
          UNIQUE(user_id, date)
        )
      `);

      // Create index if not exists
      await db.execute(`
        CREATE INDEX IF NOT EXISTS workout_days_user_date_idx ON workout_days(user_id, date)
      `);

      console.log("📊 workout_days table ensured to exist");

      // Check if workout day already exists for this user and date
      const [existingWorkout] = await db
        .select()
        .from(workoutDays)
        .where(and(eq(workoutDays.userId, req.user.id), eq(workoutDays.date, date)))
        .limit(1);

      // If exists and is ready or generating, do nothing
      if (
        existingWorkout &&
        (existingWorkout.status === "ready" ||
          existingWorkout.status === "generating")
      ) {
        return res.json(existingWorkout);
      }

      // Otherwise, create or update the row with status='pending'
      if (existingWorkout) {
        // Update existing row
        const [updatedWorkout] = await db
          .update(workoutDays)
          .set({
            status: "pending",
            updatedAt: new Date(),
          })
          .where(eq(workoutDays.id, existingWorkout.id))
          .returning();

        return res.json(updatedWorkout);
      } else {
        // Create new row
        const [newWorkout] = await db
          .insert(workoutDays)
          .values({
            userId: req.user.id,
            date: date,
            status: "pending",
          })
          .returning();

        return res.json(newWorkout);
      }
    } catch (error) {
      console.error("Error generating workout day:", error);
      return res.status(500).json({ error: "Failed to generate workout day" });
    }
  });

  // GET /api/v1/workouts/day?date=<date> - Get workout day by date
  app.get("/api/v1/workouts/day", async (req: Request, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { date } = req.query;

    if (!date || typeof date !== "string") {
      return res
        .status(400)
        .json({ error: "Date query parameter is required" });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res
        .status(400)
        .json({ error: "Date must be in YYYY-MM-DD format" });
    }

    try {
      const [workoutDay] = await db
        .select()
        .from(workoutDays)
        .where(and(eq(workoutDays.userId, req.user.id), eq(workoutDays.date, date)))
        .limit(1);

      if (!workoutDay) {
        return res.status(404).json({ error: "Workout day not found" });
      }

      return res.json(workoutDay);
    } catch (error) {
      console.error("Error fetching workout day:", error);
      return res.status(500).json({ error: "Failed to fetch workout day" });
    }
  });


  // GET /api/v1/workouts/week - Get all workout days for current week
  app.get("/api/v1/workouts/week", async (req: Request, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      // Get current week dates (Monday to Sunday)
      const today = new Date();
      const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay; // Adjust to get Monday

      const weekDates: string[] = [];

      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + mondayOffset + i);
        const isoDate = date.toISOString().split("T")[0];
        weekDates.push(isoDate);
      }

      // Get all workout days for the current week
      const weekWorkouts = await db
        .select()
        .from(workoutDays)
        .where(and(eq(workoutDays.userId, req.user.id), inArray(workoutDays.date, weekDates)));

      return res.json(weekWorkouts);
    } catch (error) {
      console.error("Error fetching week workouts:", error);
      return res.status(500).json({ error: "Failed to fetch week workouts" });
    }
  });

  // =============================================================================
  // EXERCISES BULK UPSERT API
  // =============================================================================

  // POST /api/v1/exercises/bulk-upsert - Bulk upsert exercises
  app.post("/api/v1/exercises/bulk-upsert", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const body = req.body;

      // Validate that body is an array
      if (!Array.isArray(body)) {
        return res
          .status(400)
          .json({ error: "Request body must be an array of exercises" });
      }

      // Limit to 300 items per call
      const exercisesToProcess = body.slice(0, 300);

      // Initialize counters and error collection
      let inserted = 0;
      let updated = 0;
      let skipped = 0;
      const validationErrors: Array<{
        index: number;
        error: string;
        item: any;
      }> = [];

      // Process each exercise
      for (let i = 0; i < exercisesToProcess.length; i++) {
        const item = exercisesToProcess[i];

        try {
          // Validate the exercise data
          const validatedExercise = insertExerciseMinimalSchema.parse(item);

          // Generate slug if not provided
          if (!validatedExercise.slug && validatedExercise.name) {
            validatedExercise.slug = toSlug(validatedExercise.name);
          }

          // Ensure slug exists
          if (!validatedExercise.slug) {
            validationErrors.push({
              index: i,
              error: "Cannot generate slug from name",
              item,
            });
            skipped++;
            continue;
          }

          // Normalize aliases to lowercase and trim
          if (validatedExercise.aliases) {
            validatedExercise.aliases = validatedExercise.aliases.map((alias) =>
              alias.toLowerCase().trim(),
            );
          }

          try {
            // Try to upsert by slug
            const existingExercise = await db
              .select({ id: exercises.id })
              .from(exercises)
              .where(eq(exercises.slug, validatedExercise.slug))
              .limit(1);

            if (existingExercise.length > 0) {
              // Update existing exercise
              await db
                .update(exercises)
                .set({
                  name: validatedExercise.name,
                  aliases: validatedExercise.aliases,
                  body_part: validatedExercise.body_part,
                  equipment: validatedExercise.equipment,
                  pattern: validatedExercise.pattern,
                  is_unilateral: validatedExercise.is_unilateral,
                })
                .where(eq(exercises.slug, validatedExercise.slug));
              updated++;
            } else {
              // Insert new exercise
              await db.insert(exercises).values({
                slug: validatedExercise.slug,
                name: validatedExercise.name,
                aliases: validatedExercise.aliases,
                body_part: validatedExercise.body_part,
                equipment: validatedExercise.equipment,
                pattern: validatedExercise.pattern,
                is_unilateral: validatedExercise.is_unilateral,
              });
              inserted++;
            }
          } catch (dbError) {
            // Database error - likely duplicate slug or constraint violation
            console.error(`DB error for exercise ${i}:`, dbError);
            validationErrors.push({
              index: i,
              error: `Database error: ${dbError instanceof Error ? dbError.message : "Unknown error"}`,
              item,
            });
            skipped++;
          }
        } catch (validationError) {
          // Validation error
          const errorMessage =
            validationError instanceof Error
              ? validationError.message
              : "Validation failed";
          validationErrors.push({
            index: i,
            error: errorMessage,
            item,
          });
          skipped++;
        }
      }

      // Return summary
      res.json({
        inserted,
        updated,
        skipped,
        total: exercisesToProcess.length,
        validationErrors:
          validationErrors.length > 0 ? validationErrors : undefined,
      });
    } catch (error) {
      console.error("Error in bulk upsert:", error);
      res.status(500).json({ error: "Failed to process bulk upsert" });
    }
  });

  // GET /api/v1/exercises/dev-seed - Development-only exercise seeding endpoint
  app.get("/api/v1/exercises/dev-seed", async (req, res) => {
    // Safety: Only allow in development
    if (process.env.NODE_ENV === "production") {
      return res.status(404).json({ error: "Not found" });
    }

    console.log("🔧 DEV SEED START");

    // Check for DEV_SEED_KEY authentication
    const providedKey = req.query.key;
    const expectedKey = process.env.DEV_SEED_KEY;

    if (!expectedKey || !providedKey || providedKey !== expectedKey) {
      console.log("❌ DEV SEED: Invalid or missing key");
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      let exerciseData: any[] = [];

      // Try to read from scripts/more_exercises.json first
      try {
        const fs = await import("fs");
        const path = await import("path");
        const filePath = path.resolve(
          process.cwd(),
          "scripts/more_exercises.json",
        );
        const fileContent = fs.readFileSync(filePath, "utf8");
        exerciseData = JSON.parse(fileContent);
        console.log(
          `📂 Loaded ${exerciseData.length} exercises from scripts/more_exercises.json`,
        );
      } catch (fileError) {
        console.log(
          "📂 scripts/more_exercises.json not found, using in-memory starter list",
        );
        // Fall back to the STARTER_EXERCISES from seed_exercises.ts
        const { seedExercises } = await import("../scripts/seed_exercises.js");

        // Import the STARTER_EXERCISES directly
        exerciseData = [
          // Warm-up/Mobility (15 exercises)
          {
            name: "Jumping Jacks",
            aliases: ["star jumps"],
            body_part: "full",
            equipment: ["bodyweight"],
            pattern: "warm_up",
            is_unilateral: false,
          },
          {
            name: "Arm Circles",
            aliases: ["arm swings"],
            body_part: "upper",
            equipment: ["bodyweight"],
            pattern: "warm_up",
            is_unilateral: false,
          },
          {
            name: "Hip Hinge Drills",
            aliases: ["hip hinges"],
            body_part: "core",
            equipment: ["bodyweight"],
            pattern: "hinge",
            is_unilateral: false,
          },
          {
            name: "World's Greatest Stretch",
            aliases: ["worlds greatest stretch"],
            body_part: "full",
            equipment: ["bodyweight"],
            pattern: "mobility",
            is_unilateral: true,
          },
          {
            name: "Cat-Cow",
            aliases: ["cat cow stretch"],
            body_part: "core",
            equipment: ["bodyweight"],
            pattern: "mobility",
            is_unilateral: false,
          },
          {
            name: "T-Spine Rotation",
            aliases: ["thoracic spine rotation"],
            body_part: "upper",
            equipment: ["bodyweight"],
            pattern: "mobility",
            is_unilateral: true,
          },
          {
            name: "Leg Swings",
            aliases: ["dynamic leg swings"],
            body_part: "legs",
            equipment: ["bodyweight"],
            pattern: "warm_up",
            is_unilateral: true,
          },
          {
            name: "High Knees",
            aliases: ["knee ups"],
            body_part: "legs",
            equipment: ["bodyweight"],
            pattern: "warm_up",
            is_unilateral: false,
          },
          {
            name: "Butt Kicks",
            aliases: ["heel kicks"],
            body_part: "legs",
            equipment: ["bodyweight"],
            pattern: "warm_up",
            is_unilateral: false,
          },
          {
            name: "Ankle Circles",
            aliases: ["ankle rotations"],
            body_part: "legs",
            equipment: ["bodyweight"],
            pattern: "mobility",
            is_unilateral: true,
          },
          {
            name: "Shoulder Rolls",
            aliases: ["shoulder circles"],
            body_part: "upper",
            equipment: ["bodyweight"],
            pattern: "warm_up",
            is_unilateral: false,
          },
          {
            name: "Neck Rolls",
            aliases: ["neck circles"],
            body_part: "upper",
            equipment: ["bodyweight"],
            pattern: "mobility",
            is_unilateral: false,
          },
          {
            name: "Wrist Circles",
            aliases: ["wrist rotations"],
            body_part: "upper",
            equipment: ["bodyweight"],
            pattern: "mobility",
            is_unilateral: true,
          },
          {
            name: "Walking Knee Hugs",
            aliases: ["knee to chest walk"],
            body_part: "legs",
            equipment: ["bodyweight"],
            pattern: "mobility",
            is_unilateral: true,
          },
          {
            name: "Walking Quad Stretch",
            aliases: ["standing quad stretch"],
            body_part: "legs",
            equipment: ["bodyweight"],
            pattern: "mobility",
            is_unilateral: true,
          },

          // Push Exercises (25 exercises)
          {
            name: "Push-Ups",
            aliases: ["pushups", "press-ups"],
            body_part: "chest",
            equipment: ["bodyweight"],
            pattern: "horizontal_push",
            is_unilateral: false,
          },
          {
            name: "Incline Push-Up",
            aliases: ["elevated push up"],
            body_part: "chest",
            equipment: ["bodyweight"],
            pattern: "horizontal_push",
            is_unilateral: false,
          },
          {
            name: "Decline Push-Up",
            aliases: ["feet elevated push up"],
            body_part: "chest",
            equipment: ["bodyweight"],
            pattern: "horizontal_push",
            is_unilateral: false,
          },
          {
            name: "Diamond Push-Ups",
            aliases: ["triangle push ups"],
            body_part: "chest",
            equipment: ["bodyweight"],
            pattern: "horizontal_push",
            is_unilateral: false,
          },
          {
            name: "Wide Grip Push-Ups",
            aliases: ["wide push ups"],
            body_part: "chest",
            equipment: ["bodyweight"],
            pattern: "horizontal_push",
            is_unilateral: false,
          },
          {
            name: "Pike Push-Ups",
            aliases: ["pike press"],
            body_part: "shoulders",
            equipment: ["bodyweight"],
            pattern: "vertical_push",
            is_unilateral: false,
          },
          {
            name: "Handstand Push-Ups",
            aliases: ["hspu"],
            body_part: "shoulders",
            equipment: ["bodyweight"],
            pattern: "vertical_push",
            is_unilateral: false,
          },
          {
            name: "Bench Press",
            aliases: ["barbell bench"],
            body_part: "chest",
            equipment: ["barbell"],
            pattern: "horizontal_push",
            is_unilateral: false,
          },
          {
            name: "Dumbbell Bench Press",
            aliases: ["db bench"],
            body_part: "chest",
            equipment: ["dumbbell"],
            pattern: "horizontal_push",
            is_unilateral: false,
          },
          {
            name: "Incline Bench Press",
            aliases: ["incline barbell press"],
            body_part: "chest",
            equipment: ["barbell"],
            pattern: "horizontal_push",
            is_unilateral: false,
          },
          {
            name: "Dumbbell Incline Press",
            aliases: ["db incline"],
            body_part: "chest",
            equipment: ["dumbbell"],
            pattern: "horizontal_push",
            is_unilateral: false,
          },
          {
            name: "Overhead Press",
            aliases: ["military press", "shoulder press"],
            body_part: "shoulders",
            equipment: ["barbell"],
            pattern: "vertical_push",
            is_unilateral: false,
          },
          {
            name: "Dumbbell Shoulder Press",
            aliases: ["db press", "db shoulder press"],
            body_part: "shoulders",
            equipment: ["dumbbell"],
            pattern: "vertical_push",
            is_unilateral: false,
          },
          {
            name: "Dips",
            aliases: ["tricep dips"],
            body_part: "chest",
            equipment: ["bodyweight"],
            pattern: "vertical_push",
            is_unilateral: false,
          },
          {
            name: "Tricep Dips",
            aliases: ["chair dips"],
            body_part: "upper",
            equipment: ["bodyweight"],
            pattern: "vertical_push",
            is_unilateral: false,
          },
          {
            name: "Cable Fly",
            aliases: ["cable flyes"],
            body_part: "chest",
            equipment: ["cable"],
            pattern: "horizontal_push",
            is_unilateral: false,
          },
          {
            name: "Dumbbell Flyes",
            aliases: ["db flyes"],
            body_part: "chest",
            equipment: ["dumbbell"],
            pattern: "horizontal_push",
            is_unilateral: false,
          },
          {
            name: "Lateral Raises",
            aliases: ["side raises"],
            body_part: "shoulders",
            equipment: ["dumbbell"],
            pattern: "lateral_raise",
            is_unilateral: false,
          },
          {
            name: "Front Raises",
            aliases: ["anterior raises"],
            body_part: "shoulders",
            equipment: ["dumbbell"],
            pattern: "vertical_push",
            is_unilateral: false,
          },
          {
            name: "Arnold Press",
            aliases: ["arnold dumbbell press"],
            body_part: "shoulders",
            equipment: ["dumbbell"],
            pattern: "vertical_push",
            is_unilateral: false,
          },
          {
            name: "Close Grip Bench Press",
            aliases: ["narrow grip bench"],
            body_part: "upper",
            equipment: ["barbell"],
            pattern: "horizontal_push",
            is_unilateral: false,
          },
          {
            name: "Overhead Tricep Extension",
            aliases: ["skull crushers"],
            body_part: "upper",
            equipment: ["dumbbell"],
            pattern: "vertical_push",
            is_unilateral: false,
          },
          {
            name: "Cable Tricep Pushdown",
            aliases: ["tricep pushdowns"],
            body_part: "upper",
            equipment: ["cable"],
            pattern: "vertical_push",
            is_unilateral: false,
          },
          {
            name: "One Arm Push-Up",
            aliases: ["single arm pushup"],
            body_part: "chest",
            equipment: ["bodyweight"],
            pattern: "horizontal_push",
            is_unilateral: true,
          },
          {
            name: "Single Arm Dumbbell Press",
            aliases: ["one arm db press"],
            body_part: "shoulders",
            equipment: ["dumbbell"],
            pattern: "vertical_push",
            is_unilateral: true,
          },

          // Pull Exercises (25 exercises) - partial list for brevity
          {
            name: "Pull-Ups",
            aliases: ["chin-up", "neutral grip pull-up"],
            body_part: "back",
            equipment: ["pull-up bar"],
            pattern: "vertical_pull",
            is_unilateral: false,
          },
          {
            name: "Chin-Ups",
            aliases: ["underhand pull ups"],
            body_part: "back",
            equipment: ["pull-up bar"],
            pattern: "vertical_pull",
            is_unilateral: false,
          },
          {
            name: "Wide Grip Pull-Ups",
            aliases: ["wide pull ups"],
            body_part: "back",
            equipment: ["pull-up bar"],
            pattern: "vertical_pull",
            is_unilateral: false,
          },
          {
            name: "Lat Pulldown",
            aliases: ["lat pull down"],
            body_part: "back",
            equipment: ["cable"],
            pattern: "vertical_pull",
            is_unilateral: false,
          },
          {
            name: "Barbell Row",
            aliases: ["bent over row"],
            body_part: "back",
            equipment: ["barbell"],
            pattern: "horizontal_pull",
            is_unilateral: false,
          },
          {
            name: "Dumbbell Row",
            aliases: ["one arm db row"],
            body_part: "back",
            equipment: ["dumbbell"],
            pattern: "horizontal_pull",
            is_unilateral: true,
          },
          {
            name: "Bicep Curls",
            aliases: ["barbell curls"],
            body_part: "upper",
            equipment: ["barbell"],
            pattern: "curl",
            is_unilateral: false,
          },
          {
            name: "Dumbbell Bicep Curls",
            aliases: ["db curls"],
            body_part: "upper",
            equipment: ["dumbbell"],
            pattern: "curl",
            is_unilateral: false,
          },

          // Legs Exercises (partial list)
          {
            name: "Back Squat",
            aliases: ["barbell squat"],
            body_part: "legs",
            equipment: ["barbell"],
            pattern: "squat",
            is_unilateral: false,
          },
          {
            name: "Front Squat",
            aliases: ["front loaded squat"],
            body_part: "legs",
            equipment: ["barbell"],
            pattern: "squat",
            is_unilateral: false,
          },
          {
            name: "Bodyweight Squats",
            aliases: ["air squats"],
            body_part: "legs",
            equipment: ["bodyweight"],
            pattern: "squat",
            is_unilateral: false,
          },
          {
            name: "Walking Lunge",
            aliases: ["forward lunge"],
            body_part: "legs",
            equipment: ["bodyweight"],
            pattern: "lunge",
            is_unilateral: true,
          },
          {
            name: "Romanian Deadlift",
            aliases: ["rdl"],
            body_part: "legs",
            equipment: ["barbell"],
            pattern: "hinge",
            is_unilateral: false,
          },

          // Core Exercises (partial list)
          {
            name: "Plank",
            aliases: ["front plank"],
            body_part: "core",
            equipment: ["bodyweight"],
            pattern: "stabilization",
            is_unilateral: false,
          },
          {
            name: "Side Plank",
            aliases: ["lateral plank"],
            body_part: "core",
            equipment: ["bodyweight"],
            pattern: "stabilization",
            is_unilateral: true,
          },
          {
            name: "Dead Bug",
            aliases: ["dying bug"],
            body_part: "core",
            equipment: ["bodyweight"],
            pattern: "stabilization",
            is_unilateral: true,
          },

          // Recovery Exercises
          {
            name: "Child's Pose",
            aliases: ["childs pose"],
            body_part: "recovery",
            equipment: ["bodyweight"],
            pattern: "recovery",
            is_unilateral: false,
          },
          {
            name: "Hamstring Stretch",
            aliases: ["hamstring flossing"],
            body_part: "legs",
            equipment: ["bodyweight"],
            pattern: "mobility",
            is_unilateral: true,
          },
          {
            name: "Quad Stretch",
            aliases: ["quadricep stretch"],
            body_part: "legs",
            equipment: ["bodyweight"],
            pattern: "mobility",
            is_unilateral: true,
          },
        ];
      }

      // Initialize counters
      let inserted = 0;
      let updated = 0;
      let skipped = 0;
      const categoryStats: Record<string, number> = {};

      // Track categories
      exerciseData.forEach((exercise) => {
        const category = exercise.pattern || "unknown";
        categoryStats[category] = (categoryStats[category] || 0) + 1;
      });

      console.log("📊 Counts per category:", categoryStats);

      // Use the existing bulk-upsert logic
      const validationErrors: Array<{
        index: number;
        error: string;
        item: any;
      }> = [];

      for (let i = 0; i < exerciseData.length; i++) {
        const item = exerciseData[i];

        try {
          // Validate the exercise data
          const validatedExercise = insertExerciseMinimalSchema.parse(item);

          // Generate slug if not provided
          if (!validatedExercise.slug && validatedExercise.name) {
            validatedExercise.slug = toSlug(validatedExercise.name);
          }

          // Ensure slug exists
          if (!validatedExercise.slug) {
            validationErrors.push({
              index: i,
              error: "Cannot generate slug from name",
              item,
            });
            skipped++;
            continue;
          }

          // Normalize aliases to lowercase and trim
          if (validatedExercise.aliases) {
            validatedExercise.aliases = validatedExercise.aliases.map((alias) =>
              alias.toLowerCase().trim(),
            );
          }

          try {
            // Try to upsert by slug (same logic as bulk-upsert)
            const existingExercise = await db
              .select({ id: exercises.id })
              .from(exercises)
              .where(eq(exercises.slug, validatedExercise.slug))
              .limit(1);

            if (existingExercise.length > 0) {
              // Update existing exercise
              await db
                .update(exercises)
                .set({
                  name: validatedExercise.name,
                  aliases: validatedExercise.aliases,
                  body_part: validatedExercise.body_part,
                  equipment: validatedExercise.equipment,
                  pattern: validatedExercise.pattern,
                  is_unilateral: validatedExercise.is_unilateral,
                })
                .where(eq(exercises.slug, validatedExercise.slug));
              updated++;
            } else {
              // Insert new exercise
              await db.insert(exercises).values({
                slug: validatedExercise.slug,
                name: validatedExercise.name,
                aliases: validatedExercise.aliases,
                body_part: validatedExercise.body_part,
                equipment: validatedExercise.equipment,
                pattern: validatedExercise.pattern,
                is_unilateral: validatedExercise.is_unilateral,
              });
              inserted++;
            }
          } catch (dbError) {
            // Database error - fall back to in-memory if needed
            console.error(`DB error for exercise ${i}:`, dbError);
            validationErrors.push({
              index: i,
              error: `Database error: ${dbError instanceof Error ? dbError.message : "Unknown error"}`,
              item,
            });
            skipped++;
          }
        } catch (validationError) {
          // Validation error
          const errorMessage =
            validationError instanceof Error
              ? validationError.message
              : "Validation failed";
          validationErrors.push({
            index: i,
            error: errorMessage,
            item,
          });
          skipped++;
        }
      }

      const total = exerciseData.length;

      console.log(
        `✅ DEV SEED COMPLETE - Inserted: ${inserted}, Updated: ${updated}, Skipped: ${skipped}, Total: ${total}`,
      );

      // Return summary with same format as bulk-upsert
      res.json({
        inserted,
        updated,
        skipped,
        total,
        categoryStats,
        validationErrors:
          validationErrors.length > 0
            ? validationErrors.slice(0, 10)
            : undefined, // Limit errors shown
      });
    } catch (error) {
      console.error("❌ DEV SEED ERROR:", error);
      res.status(500).json({ error: "Failed to seed exercises" });
    }
  });

  // =============================================================================
  // WORKOUT PAYLOAD VALIDATOR + MAPPER
  // =============================================================================

  // Zod schema for strict workout day payload validation
  const workoutItemSchema = z.object({
    exercise_id: z.number().int().positive(),
    name: z.string().min(1),
    sets: z.number().int().positive(),
    reps: z.union([z.number().int().positive(), z.string().min(1)]), // Allow number or string for reps
    load: z.number().optional(),
    rest_sec: z.number().int().min(0).optional(),
  });

  const workoutBlockSchema = z.object({
    type: z.enum(["warmup", "main", "recovery"]),
    items: z.array(workoutItemSchema).min(1),
  });

  const workoutPayloadSchema = z.object({
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    title: z.string().min(1),
    duration_min: z.number().int().positive(),
    coach_notes: z.string().optional(),
    blocks: z.array(workoutBlockSchema).min(1),
  });

  // Enhanced exercise name normalization for consistent matching
  const normalizeExerciseName = (name: string): string => {
    return name
      .toLowerCase()
      .trim() // Remove leading/trailing whitespace
      .replace(/[^\w\s]/g, "") // Remove punctuation and special characters
      .replace(/\s+/g, " ") // Collapse multiple spaces into single space
      .trim(); // Final trim
  };

  // Common exercise name aliases
  const exerciseAliases: Record<string, string[]> = {
    "push up": ["pushup", "push ups", "pushups", "press ups", "press up"],
    "pull up": ["pullup", "pull ups", "pullups", "chin up", "chin ups"],
    "sit up": ["situp", "sit ups", "situps"],
    squat: [
      "squats",
      "bodyweight squat",
      "bodyweight squats",
      "air squat",
      "air squats",
    ],
    plank: [
      "planks",
      "front plank",
      "plank hold",
      "plank to push up",
      "plank to pushup",
    ],
    "jumping jack": ["jumping jacks", "star jump", "star jumps"],
    burpee: ["burpees"],
    "mountain climber": ["mountain climbers", "mountain climb"],
    lunge: ["lunges", "forward lunge", "reverse lunge", "walking lunge"],
    deadlift: ["deadlifts"],
    "tricep dip": [
      "tricep dips",
      "dips",
      "chair dips",
      "tricep dips chair",
      "tricep dips (chair)",
    ],
    "glute bridge": ["bridge", "bridges", "hip bridge"],
    "forward bend": ["standing forward bend", "forward fold", "toe touch"],
  };

  // In-memory exercise storage for fallback (basic starter exercises)
  const inMemoryExercises = new Map<string, any>();

  // Populate basic exercises for fallback
  const initBasicExercises = () => {
    if (inMemoryExercises.size === 0) {
      const basicExercises = [
        {
          id: 1,
          slug: "jumping-jacks",
          name: "Jumping Jacks",
          aliases: ["star jumps"],
        },
        {
          id: 2,
          slug: "push-ups",
          name: "Push-Ups",
          aliases: ["pushups", "press-ups"],
        },
        {
          id: 3,
          slug: "pull-ups",
          name: "Pull-Ups",
          aliases: ["chin-up", "pullup"],
        },
        {
          id: 4,
          slug: "bodyweight-squats",
          name: "Bodyweight Squats",
          aliases: ["air squats", "squats"],
        },
        { id: 5, slug: "lunges", name: "Lunges", aliases: ["forward lunge"] },
        { id: 6, slug: "plank", name: "Plank", aliases: ["front plank"] },
        { id: 7, slug: "burpees", name: "Burpees", aliases: ["burpee"] },
        {
          id: 8,
          slug: "mountain-climbers",
          name: "Mountain Climbers",
          aliases: ["mountain climber"],
        },
        {
          id: 9,
          slug: "tricep-dips",
          name: "Tricep Dips",
          aliases: ["dips", "chair dips"],
        },
        {
          id: 10,
          slug: "glute-bridge",
          name: "Glute Bridge",
          aliases: ["bridge"],
        },
        {
          id: 11,
          slug: "childs-pose",
          name: "Child's Pose",
          aliases: ["childs pose", "balasana"],
        },
        {
          id: 12,
          slug: "standing-forward-bend",
          name: "Standing Forward Bend",
          aliases: ["forward fold", "toe touch", "uttanasana"],
        },
        {
          id: 13,
          slug: "arm-circles",
          name: "Arm Circles",
          aliases: ["arm swings"],
        },
        {
          id: 14,
          slug: "high-knees",
          name: "High Knees",
          aliases: ["knee ups"],
        },
        {
          id: 15,
          slug: "butt-kicks",
          name: "Butt Kicks",
          aliases: ["heel kicks"],
        },
        {
          id: 16,
          slug: "cat-cow-stretch",
          name: "Cat-Cow Stretch",
          aliases: ["cat cow", "marjaryasana bitilasana"],
        },
        {
          id: 17,
          slug: "pigeon-pose",
          name: "Pigeon Pose",
          aliases: ["eka pada rajakapotasana", "hip opener"],
        },
        {
          id: 18,
          slug: "seated-forward-fold",
          name: "Seated Forward Fold",
          aliases: ["paschimottanasana"],
        },
        {
          id: 19,
          slug: "supine-spinal-twist",
          name: "Supine Spinal Twist",
          aliases: ["reclined twist", "supta matsyendrasana"],
        },
        {
          id: 20,
          slug: "butterfly-stretch",
          name: "Butterfly Stretch",
          aliases: ["bound angle pose", "baddha konasana"],
        },
        {
          id: 21,
          slug: "cobra-stretch",
          name: "Cobra Stretch",
          aliases: ["bhujangasana", "cobra pose"],
        },
        {
          id: 22,
          slug: "thread-the-needle",
          name: "Thread the Needle",
          aliases: ["supine figure four stretch"],
        },
        {
          id: 23,
          slug: "happy-baby-pose",
          name: "Happy Baby Pose",
          aliases: ["ananda balasana"],
        },
        {
          id: 24,
          slug: "wide-grip-pull-ups",
          name: "Wide Grip Pull-Ups",
          aliases: ["wide pull ups"],
        },
        {
          id: 25,
          slug: "downward-dog",
          name: "Downward Dog",
          aliases: ["downward facing dog", "adho mukha svanasana"],
        },
        {
          id: 26,
          slug: "inverted-row",
          name: "Inverted Row",
          aliases: ["bodyweight row", "australian pull up", "horizontal pull up"],
        },
      ];

      basicExercises.forEach((ex) => {
        inMemoryExercises.set(ex.slug, ex);
        // Also add by name for lookup
        inMemoryExercises.set(normalizeExerciseName(ex.name), ex);
        // Add aliases
        ex.aliases.forEach((alias) => {
          inMemoryExercises.set(normalizeExerciseName(alias), ex);
        });
      });
    }
  };

  const mapExerciseNameToId = async (
    name: string,
  ): Promise<{ id: number | null; error?: string }> => {
    const normalizedName = normalizeExerciseName(name);
    console.log(
      `🔄 Mapping exercise: "${name}" → normalized: "${normalizedName}"`,
    );

    try {
      // Step 1: Try exact name match in database (case-insensitive)
      const exactMatch = await db
        .select({ id: exercises.id, name: exercises.name })
        .from(exercises)
        .where(ilike(exercises.name, normalizedName))
        .limit(1);

      if (exactMatch.length > 0) {
        console.log(
          `✅ Exact match found: "${name}" → id ${exactMatch[0].id} (${exactMatch[0].name})`,
        );
        return { id: exactMatch[0].id };
      }

      // Step 2: Try alias matching from database aliases column
      const aliasMatches = await db
        .select({
          id: exercises.id,
          name: exercises.name,
          aliases: exercises.aliases,
        })
        .from(exercises)
        .where(
          sql`${exercises.aliases}::text ILIKE '%' || ${normalizedName} || '%'`,
        )
        .limit(1);

      if (aliasMatches.length > 0) {
        console.log(
          `✅ Alias match found: "${name}" → id ${aliasMatches[0].id} (${aliasMatches[0].name})`,
        );
        return { id: aliasMatches[0].id };
      }

      // Step 3: Try fuzzy search (ILIKE %term%) on exercise name
      const fuzzyMatch = await db
        .select({ id: exercises.id, name: exercises.name })
        .from(exercises)
        .where(ilike(exercises.name, `%${normalizedName}%`))
        .limit(1);

      if (fuzzyMatch.length > 0) {
        console.log(
          `✅ Fuzzy match found: "${name}" → id ${fuzzyMatch[0].id} (${fuzzyMatch[0].name})`,
        );
        return { id: fuzzyMatch[0].id };
      }

      console.log(`❌ Failed to map: "${name}" - not found in database`);
      return { id: null, error: `exercise not found: "${name}"` };
    } catch (error) {
      console.log(`🔄 DB error for "${name}", checking in-memory storage`);

      // Initialize basic exercises if not done yet
      initBasicExercises();

      // Step 1: Try exact match in memory
      const memoryMatch = inMemoryExercises.get(normalizedName);
      if (memoryMatch) {
        console.log(
          `✅ In-memory exact match: "${name}" → id ${memoryMatch.id} (${memoryMatch.name})`,
        );
        return { id: memoryMatch.id };
      }

      // Step 2: Try alias matching in memory using exerciseAliases dictionary
      for (const [canonical, aliases] of Object.entries(exerciseAliases)) {
        if (
          aliases.includes(normalizedName) ||
          normalizedName.includes(normalizeExerciseName(canonical))
        ) {
          const memoryAliasMatch = inMemoryExercises.get(
            normalizeExerciseName(canonical),
          );
          if (memoryAliasMatch) {
            console.log(
              `✅ In-memory alias match: "${name}" → id ${memoryAliasMatch.id} (${memoryAliasMatch.name})`,
            );
            return { id: memoryAliasMatch.id };
          }
        }
      }

      console.log(
        `❌ Failed to map: "${name}" - not found in database or in-memory storage`,
      );
      return { id: null, error: `exercise not found: "${name}"` };
    }
  };

  // Workout payload validator function
  const validateWorkoutPayload = async (
    payload: any,
  ): Promise<{ ok: boolean; errors: string[] }> => {
    const errors: string[] = [];

    try {
      // 1. Schema validation
      const result = workoutPayloadSchema.safeParse(payload);
      if (!result.success) {
        errors.push(
          ...result.error.errors.map(
            (err) => `${err.path.join(".")}: ${err.message}`,
          ),
        );
        return { ok: false, errors };
      }

      const validatedPayload = result.data;

      // 2. Block type validation (exactly 1 warmup, 1 main with 3-6 items, 1 recovery)
      const blockCounts = {
        warmup: validatedPayload.blocks.filter((b) => b.type === "warmup")
          .length,
        main: validatedPayload.blocks.filter((b) => b.type === "main").length,
        recovery: validatedPayload.blocks.filter((b) => b.type === "recovery")
          .length,
      };

      if (blockCounts.warmup !== 1) {
        errors.push("Must contain exactly 1 warmup block");
      }
      if (blockCounts.main !== 1) {
        errors.push("Must contain exactly 1 main block");
      }
      if (blockCounts.recovery !== 1) {
        errors.push("Must contain exactly 1 recovery block");
      }

      // Check main block has 3-6 items
      const mainBlocks = validatedPayload.blocks.filter(
        (b) => b.type === "main",
      );
      if (mainBlocks.length === 1) {
        const mainItemCount = mainBlocks[0].items.length;
        if (mainItemCount < 3 || mainItemCount > 6) {
          errors.push("Main block must have 3-6 items");
        }
      }

      // 3. Exercise ID validation - check all exercise_ids exist
      const allExerciseIds = validatedPayload.blocks.flatMap((block) =>
        block.items.map((item) => item.exercise_id),
      );

      const uniqueExerciseIds = Array.from(new Set(allExerciseIds));

      // Short-circuit if no IDs to check
      if (uniqueExerciseIds.length === 0) {
        return { ok: errors.length === 0, errors };
      }

      try {
        const existingExercises = await db
          .select({ id: exercises.id })
          .from(exercises)
          .where(inArray(exercises.id, uniqueExerciseIds));

        const existingIds = new Set(existingExercises.map((e) => e.id));
        const missingIds = uniqueExerciseIds.filter((id) => !existingIds.has(id));

        if (missingIds.length > 0) {
          errors.push(`Exercise IDs not found: ${missingIds.join(", ")}`);
        }
      } catch (dbError) {
        console.log("📊 DB validation failed, checking in-memory exercises");
        
        initBasicExercises();
        const inMemoryIds = Array.from(inMemoryExercises.values()).map(e => e.id);
        const inMemoryIdSet = new Set(inMemoryIds);
        const missingIds = uniqueExerciseIds.filter((id) => !inMemoryIdSet.has(id));

        if (missingIds.length > 0) {
          errors.push(`Exercise IDs not found in memory: ${missingIds.join(", ")}`);
        }
      }

      // 4. Name→ID mapping validation (optional check for consistency)
      for (const block of validatedPayload.blocks) {
        for (const item of block.items) {
          const mapping = await mapExerciseNameToId(item.name);
          if (mapping.error) {
            errors.push(mapping.error);
          } else if (mapping.id && mapping.id !== item.exercise_id) {
            errors.push(
              `Exercise "${item.name}" maps to ID ${mapping.id} but payload has ID ${item.exercise_id}`,
            );
          }
        }
      }

      return { ok: errors.length === 0, errors };
    } catch (error) {
      console.error("Validation error:", error);
      errors.push("Internal validation error");
      return { ok: false, errors };
    }
  };

  // Internal test route for payload validation
  app.post("/api/v1/workouts/test-validate", async (req: Request, res) => {
    try {
      console.log("🧪 Testing workout payload validation");

      const result = await validateWorkoutPayload(req.body);

      if (result.ok) {
        return res.json({ ok: true });
      } else {
        return res.json({ ok: false, errors: result.errors });
      }
    } catch (error) {
      console.error("Error in test-validate:", error);
      return res
        .status(500)
        .json({ ok: false, errors: ["Internal server error"] });
    }
  });

  // Route for client-side debug logs (shows up in the server console)
  app.post("/api/_client-log", (req, res) => {
    const { tag, data } = req.body ?? {};
    console.log(`[CLIENT] ${tag}`, JSON.stringify(data ?? {}, null, 2));
    res.status(204).end();
  });

  // GET /api/exercises - Fetch exercises with video URLs
  app.get("/api/exercises", async (req, res) => {
    try {
      const { category, difficulty, equipment, search, limit = 500 } = req.query;
      
      console.log('📚 Fetching exercises from database...');
      
      // Query all exercises from database
      const allExercises = await db
        .select({
          id: exercises.id,
          name: exercises.name,
          slug: exercises.slug,
          bodyPart: exercises.body_part,
          category: exercises.category,
          muscleGroups: exercises.muscleGroups,
          difficulty: exercises.difficulty,
          equipment: exercises.equipment,
          videoUrl: exercises.videoUrl,
          thumbnailUrl: exercises.thumbnailUrl,
          description: exercises.description,
          instructions: exercises.instructions,
          tips: exercises.tips,
        })
        .from(exercises)
        .limit(Number(limit) || 500);
      
      let filteredExercises = allExercises;
      
      // Apply filters if provided
      if (category && category !== 'All') {
        filteredExercises = filteredExercises.filter(ex => 
          ex.category?.toLowerCase() === String(category).toLowerCase() ||
          ex.bodyPart?.toLowerCase() === String(category).toLowerCase()
        );
      }
      
      if (difficulty && difficulty !== 'All') {
        filteredExercises = filteredExercises.filter(ex => 
          ex.difficulty?.toLowerCase() === String(difficulty).toLowerCase()
        );
      }
      
      if (equipment) {
        const equipmentList = String(equipment).split(',').map(e => e.trim().toLowerCase());
        filteredExercises = filteredExercises.filter(ex => {
          const exEquipment = Array.isArray(ex.equipment) ? ex.equipment : [];
          return exEquipment.some((eq: string) => equipmentList.includes(eq?.toLowerCase()));
        });
      }
      
      if (search) {
        const searchLower = String(search).toLowerCase();
        filteredExercises = filteredExercises.filter(ex => 
          ex.name?.toLowerCase().includes(searchLower) ||
          ex.bodyPart?.toLowerCase().includes(searchLower) ||
          ex.category?.toLowerCase().includes(searchLower)
        );
      }
      
      // Transform to frontend-expected format with proper tips array
      const transformedExercises = filteredExercises.map(ex => ({
        ...ex,
        // Ensure tips is an array for the frontend
        tips: ex.tips ? (typeof ex.tips === 'string' ? [ex.tips] : ex.tips) : ['Maintain proper form throughout the movement'],
        // Capitalize difficulty for display
        difficulty: ex.difficulty ? ex.difficulty.charAt(0).toUpperCase() + ex.difficulty.slice(1) : 'Intermediate',
      }));
      
      console.log(`✅ Found ${transformedExercises.length} exercises (filtered from ${allExercises.length} total)`);
      
      res.json({
        exercises: transformedExercises,
        total: transformedExercises.length,
        totalInDatabase: allExercises.length,
      });
    } catch (error) {
      console.error("Error fetching exercises:", error);
      res.status(500).json({ error: "Failed to fetch exercises", details: String(error) });
    }
  });

  // GET /api/exercises/counts - Get exercise counts by category
  app.get("/api/exercises/counts", async (req, res) => {
    try {
      console.log('📊 Fetching exercise counts by category...');
      
      // Query all exercises to count by category
      const allExercises = await db
        .select({
          category: exercises.category,
          bodyPart: exercises.body_part,
          equipment: exercises.equipment,
          name: exercises.name,
        })
        .from(exercises);
      
      // Updated category mappings for new structure: Strength, Calisthenics, Cardio, Flexibility
      const categoryMappings: { [key: string]: string[] } = {
        'Strength': ['weightlifting', 'strength', 'powerlifting', 'barbell', 'dumbbell', 'chest', 'back', 'shoulders', 'arms', 'legs', 'upper-body', 'lower-body', 'biceps', 'triceps', 'quads', 'hamstrings', 'glutes'],
        'Calisthenics': ['bodyweight', 'calisthenics', 'gymnastics'],
        'Cardio': ['cardio', 'running', 'cycling', 'rowing', 'swimming', 'jump rope', 'treadmill', 'elliptical', 'stair'],
        'Flexibility': ['flexibility', 'stretching', 'yoga', 'mobility', 'warmup', 'recovery', 'foam roll', 'stretch'],
      };
      
      // Count exercises per category
      const counts: { [key: string]: number } = {};
      
      for (const [displayName, matchCategories] of Object.entries(categoryMappings)) {
        counts[displayName] = allExercises.filter(ex => {
          const exCategory = ex.category?.toLowerCase() || '';
          const exBodyPart = ex.bodyPart?.toLowerCase() || '';
          const exName = ex.name?.toLowerCase() || '';
          
          // Handle equipment as array
          const equipmentArr = Array.isArray(ex.equipment) ? ex.equipment : [];
          const equipmentStr = equipmentArr.map((e: any) => String(e).toLowerCase()).join(' ');
          
          // For Calisthenics, check if equipment is bodyweight/none
          if (displayName === 'Calisthenics') {
            const isBodyweight = equipmentStr.includes('bodyweight') || 
                                 equipmentStr.includes('body weight') || 
                                 equipmentStr === '' ||
                                 equipmentArr.length === 0;
            if (isBodyweight && !exCategory.includes('cardio')) return true;
          }
          
          // For Strength, exclude bodyweight exercises and cardio
          if (displayName === 'Strength') {
            const isBodyweight = equipmentStr.includes('bodyweight') || 
                                 equipmentStr.includes('body weight') || 
                                 equipmentArr.length === 0;
            if (isBodyweight || exCategory.includes('cardio')) return false;
          }
          
          return matchCategories.some(cat => 
            exCategory.includes(cat) || exBodyPart.includes(cat) || exName.includes(cat)
          );
        }).length;
      }
      
      console.log('✅ Exercise counts:', counts);
      
      res.json({
        counts,
        total: allExercises.length,
      });
    } catch (error) {
      console.error("Error fetching exercise counts:", error);
      res.status(500).json({ error: "Failed to fetch exercise counts", details: String(error) });
    }
  });

  // GET /api/exercises/:slug - Fetch a single exercise by slug
  app.get("/api/exercises/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      
      const exercise = await db
        .select({
          id: exercises.id,
          name: exercises.name,
          slug: exercises.slug,
          videoUrl: exercises.videoUrl,
          thumbnailUrl: exercises.thumbnailUrl,
          description: exercises.description,
          category: exercises.category,
          muscleGroups: exercises.muscleGroups,
          difficulty: exercises.difficulty,
          instructions: exercises.instructions,
          tips: exercises.tips,
          bodyPart: exercises.body_part,
          equipment: exercises.equipment,
        })
        .from(exercises)
        .where(eq(exercises.slug, slug))
        .limit(1);

      if (exercise.length === 0) {
        return res.status(404).json({ error: "Exercise not found" });
      }

      res.json({ exercise: exercise[0] });
    } catch (error) {
      console.error("Error fetching exercise:", error);
      res.status(500).json({ error: "Failed to fetch exercise" });
    }
  });

  return httpServer;
}

// Helper function to get welcome message based on coach
// Helper functions for parsing AI onboarding responses
function extractTrainingTime(response: string): string {
  const timeMap = {
    morning: ["morning", "early", "am", "dawn", "sunrise"],
    afternoon: ["afternoon", "noon", "lunch", "midday", "pm"],
    evening: ["evening", "night", "after work", "sunset", "dinner"],
  };

  const lowercaseResponse = response.toLowerCase();
  for (const [time, keywords] of Object.entries(timeMap)) {
    if (keywords.some((keyword) => lowercaseResponse.includes(keyword))) {
      return time;
    }
  }
  return "flexible";
}

function extractCardioPreference(response: string): string {
  const lowercaseResponse = response.toLowerCase();
  if (
    lowercaseResponse.includes("love") ||
    lowercaseResponse.includes("enjoy") ||
    lowercaseResponse.includes("great")
  ) {
    return "love";
  } else if (
    lowercaseResponse.includes("like") ||
    lowercaseResponse.includes("good")
  ) {
    return "like";
  } else if (
    lowercaseResponse.includes("hate") ||
    lowercaseResponse.includes("dislike") ||
    lowercaseResponse.includes("avoid")
  ) {
    return "hate";
  } else if (
    lowercaseResponse.includes("neutral") ||
    lowercaseResponse.includes("okay") ||
    lowercaseResponse.includes("fine")
  ) {
    return "neutral";
  }
  return "neutral";
}

function extractFocusAreas(response: string): string[] {
  const areas = [
    "chest",
    "back",
    "shoulders",
    "arms",
    "legs",
    "glutes",
    "core",
    "cardio",
    "flexibility",
    "balance",
  ];
  const lowercaseResponse = response.toLowerCase();
  const foundAreas = areas.filter((area) => lowercaseResponse.includes(area));
  return foundAreas.length > 0 ? foundAreas : ["full-body"];
}

function getWelcomeMessage(coach: string, trainingType: string): string {
  switch (coach) {
    case "kai":
      return "Hey there! I'm Kai, your calisthenics coach. I'm here to help you build strength using just your bodyweight. What would you like to work on today?";
    case "titan":
      return "Welcome! I'm Titan, your strength coach. I'm ready to guide you through structured weight training for optimal gains and power. How can I help you today?";
    case "lumi":
      return "Hi there! I'm Lumi, your wellness guide. I'm here to help you improve flexibility, mindfulness, and overall wellness through holistic practices. What brings you here today?";
    default:
      return "Welcome to Thryvin' AI coaching! I'm your personal coach. How can I help you today?";
  }
}

// Helper function to get AI coach response
async function getCoachResponse(
  coach: string,
  userMessage: string,
  trainingType: string,
  coachingStyle: string,
  userContext: string = '',
): Promise<string> {
  try {
    // STRICT fitness-only enforcement
    const fitnessKeywords = [
      'workout', 'exercise', 'fitness', 'gym', 'training', 'muscle', 'cardio', 'strength',
      'weight', 'rep', 'set', 'routine', 'schedule', 'body', 'chest', 'legs', 'arms',
      'back', 'core', 'abs', 'run', 'jog', 'walk', 'swim', 'bike', 'yoga', 'pilates', 'squat',
      'bench', 'deadlift', 'press', 'curl', 'pull', 'push', 'lunge', 'plank', 'burpee', 'hiit',
      'nutrition', 'diet', 'protein', 'calories', 'carbs', 'food', 'meal', 'supplement', 'hydration',
      'water', 'eat', 'eating', 'macros', 'fasting', 'bulk', 'cut', 'lean',
      'health', 'injury', 'pain', 'stretch', 'rest', 'recovery', 'sleep', 'stress', 'energy',
      'intense', 'light', 'heavy', 'form', 'technique', 'tired', 'motivation', 'goal',
      'progress', 'beginner', 'advanced', 'intermediate', 'tone', 'fat', 'gain',
      'today', 'tomorrow', 'week', 'day', 'swap', 'switch', 'change', 'modify', 'adjust',
      'help', 'tips', 'advice', 'recommend', 'suggest', 'how', 'what', 'should',
      // Greetings
      'hi', 'hello', 'hey', 'thanks', 'thank'
    ];
    
    const lowerMessage = userMessage.toLowerCase();
    const hasFitnessKeyword = fitnessKeywords.some(keyword => lowerMessage.includes(keyword));
    
    // If not fitness-related and message is substantial, decline
    if (!hasFitnessKeyword && lowerMessage.length > 15) {
      return "I appreciate you reaching out! However, as your fitness coach, I'm specifically trained to help with health, fitness, nutrition, and workout-related questions. 💪\n\nI can help you with:\n• Workout advice and scheduling\n• Exercise form and technique\n• Nutrition and meal planning\n• Recovery and injury prevention\n• Fitness goals and motivation\n\nWhat fitness topic can I help you with?";
    }
    
    let systemPrompt = "";

    // Configure coach personality based on coach type and coaching style
    switch (coach) {
      case "kai":
        systemPrompt = `You are Kai, a calisthenics expert coach. You specialize in bodyweight training, mobility, and functional fitness.`;
        break;
      case "titan":
        systemPrompt = `You are Titan, a strength training coach. You specialize in weight training, muscle building, and power development.`;
        break;
      case "lumi":
        systemPrompt = `You are Lumi, a wellness and mobility coach. You specialize in yoga, flexibility, recovery, and mindfulness practices.`;
        break;
      default:
        systemPrompt = `You are a fitness coach specializing in ${trainingType || 'general fitness'}.`;
    }

    // Add coaching style to system prompt
    switch (coachingStyle) {
      case "supportive":
        systemPrompt += ` Your coaching style is supportive and encouraging. You use positive reinforcement and motivational language.`;
        break;
      case "direct":
        systemPrompt += ` Your coaching style is direct and challenging. You push your clients to their limits and use straightforward language.`;
        break;
      case "analytical":
        systemPrompt += ` Your coaching style is analytical and detailed. You focus on technique, form, and data-driven insights.`;
        break;
    }
    
    // Add user context for personalization
    if (userContext) {
      systemPrompt += `\n\n=== IMPORTANT: YOU KNOW THIS USER PERSONALLY ===\n${userContext}\n\nUse this information to give PERSONALIZED advice. Reference their specific goals, history, and preferences. Be their personal trainer who truly knows them.`;
    }

    // CRITICAL: Add strict fitness-only instruction
    systemPrompt += `\n\n=== CRITICAL RULE: FITNESS ONLY ===
You are STRICTLY a fitness, health, and nutrition coach. You MUST ONLY answer questions about:
- Workouts, exercises, and training
- Nutrition, diet, and meal planning  
- Health, recovery, and injury prevention
- Fitness goals and motivation
- Sleep and stress as they relate to fitness

If the user asks about ANYTHING unrelated to health/fitness (like animals, random topics, jokes, etc.), you MUST politely redirect them back to fitness topics. Say something like: "That's an interesting question! But as your fitness coach, I'm here to help with your workouts, nutrition, and health goals. What can I help you with in those areas?"

NEVER answer non-fitness questions, even if the user insists. Stay focused on being their fitness coach.

Respond in 1-3 paragraphs. Be concise but helpful. Never mention that you're an AI model. Be personal - use their name if you know it.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      max_tokens: 400,
    });

    return (
      response.choices[0].message.content ||
      "I'm thinking about how to respond. Let me get back to you."
    );
  } catch (error) {
    console.error("Error getting coach response:", error);
    return "I'm having trouble connecting right now. Let's try again in a moment.";
  }
}
