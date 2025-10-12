#!/usr/bin/env tsx

import { db } from "../server/db";
import { exercises } from "@shared/schema";
import { eq } from "drizzle-orm";

// Utility function to generate slug from exercise name
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

// Starter Pack: ~120 exercises with comprehensive coverage
const STARTER_EXERCISES = [
  // Warm-up/Mobility (15 exercises)
  { name: "Jumping Jacks", aliases: ["star jumps"], body_part: "full", equipment: ["bodyweight"], pattern: "warm_up", is_unilateral: false },
  { name: "Arm Circles", aliases: ["arm swings"], body_part: "upper", equipment: ["bodyweight"], pattern: "warm_up", is_unilateral: false },
  { name: "Hip Hinge Drills", aliases: ["hip hinges"], body_part: "core", equipment: ["bodyweight"], pattern: "hinge", is_unilateral: false },
  { name: "World's Greatest Stretch", aliases: ["worlds greatest stretch"], body_part: "full", equipment: ["bodyweight"], pattern: "mobility", is_unilateral: true },
  { name: "Cat-Cow", aliases: ["cat cow stretch"], body_part: "core", equipment: ["bodyweight"], pattern: "mobility", is_unilateral: false },
  { name: "T-Spine Rotation", aliases: ["thoracic spine rotation"], body_part: "upper", equipment: ["bodyweight"], pattern: "mobility", is_unilateral: true },
  { name: "Leg Swings", aliases: ["dynamic leg swings"], body_part: "legs", equipment: ["bodyweight"], pattern: "warm_up", is_unilateral: true },
  { name: "High Knees", aliases: ["knee ups"], body_part: "legs", equipment: ["bodyweight"], pattern: "warm_up", is_unilateral: false },
  { name: "Butt Kicks", aliases: ["heel kicks"], body_part: "legs", equipment: ["bodyweight"], pattern: "warm_up", is_unilateral: false },
  { name: "Ankle Circles", aliases: ["ankle rotations"], body_part: "legs", equipment: ["bodyweight"], pattern: "mobility", is_unilateral: true },
  { name: "Shoulder Rolls", aliases: ["shoulder circles"], body_part: "upper", equipment: ["bodyweight"], pattern: "warm_up", is_unilateral: false },
  { name: "Neck Rolls", aliases: ["neck circles"], body_part: "upper", equipment: ["bodyweight"], pattern: "mobility", is_unilateral: false },
  { name: "Wrist Circles", aliases: ["wrist rotations"], body_part: "upper", equipment: ["bodyweight"], pattern: "mobility", is_unilateral: true },
  { name: "Walking Knee Hugs", aliases: ["knee to chest walk"], body_part: "legs", equipment: ["bodyweight"], pattern: "mobility", is_unilateral: true },
  { name: "Walking Quad Stretch", aliases: ["standing quad stretch"], body_part: "legs", equipment: ["bodyweight"], pattern: "mobility", is_unilateral: true },

  // Push Exercises (25 exercises)
  { name: "Push-Ups", aliases: ["pushups", "press-ups"], body_part: "chest", equipment: ["bodyweight"], pattern: "horizontal_push", is_unilateral: false },
  { name: "Incline Push-Up", aliases: ["elevated push up"], body_part: "chest", equipment: ["bodyweight"], pattern: "horizontal_push", is_unilateral: false },
  { name: "Decline Push-Up", aliases: ["feet elevated push up"], body_part: "chest", equipment: ["bodyweight"], pattern: "horizontal_push", is_unilateral: false },
  { name: "Diamond Push-Ups", aliases: ["triangle push ups"], body_part: "chest", equipment: ["bodyweight"], pattern: "horizontal_push", is_unilateral: false },
  { name: "Wide Grip Push-Ups", aliases: ["wide push ups"], body_part: "chest", equipment: ["bodyweight"], pattern: "horizontal_push", is_unilateral: false },
  { name: "Pike Push-Ups", aliases: ["pike press"], body_part: "shoulders", equipment: ["bodyweight"], pattern: "vertical_push", is_unilateral: false },
  { name: "Handstand Push-Ups", aliases: ["hspu"], body_part: "shoulders", equipment: ["bodyweight"], pattern: "vertical_push", is_unilateral: false },
  { name: "Bench Press", aliases: ["barbell bench"], body_part: "chest", equipment: ["barbell"], pattern: "horizontal_push", is_unilateral: false },
  { name: "Dumbbell Bench Press", aliases: ["db bench"], body_part: "chest", equipment: ["dumbbell"], pattern: "horizontal_push", is_unilateral: false },
  { name: "Incline Bench Press", aliases: ["incline barbell press"], body_part: "chest", equipment: ["barbell"], pattern: "horizontal_push", is_unilateral: false },
  { name: "Dumbbell Incline Press", aliases: ["db incline"], body_part: "chest", equipment: ["dumbbell"], pattern: "horizontal_push", is_unilateral: false },
  { name: "Overhead Press", aliases: ["military press", "shoulder press"], body_part: "shoulders", equipment: ["barbell"], pattern: "vertical_push", is_unilateral: false },
  { name: "Dumbbell Shoulder Press", aliases: ["db press", "db shoulder press"], body_part: "shoulders", equipment: ["dumbbell"], pattern: "vertical_push", is_unilateral: false },
  { name: "Dips", aliases: ["tricep dips"], body_part: "chest", equipment: ["bodyweight"], pattern: "vertical_push", is_unilateral: false },
  { name: "Tricep Dips", aliases: ["chair dips"], body_part: "upper", equipment: ["bodyweight"], pattern: "vertical_push", is_unilateral: false },
  { name: "Cable Fly", aliases: ["cable flyes"], body_part: "chest", equipment: ["cable"], pattern: "horizontal_push", is_unilateral: false },
  { name: "Dumbbell Flyes", aliases: ["db flyes"], body_part: "chest", equipment: ["dumbbell"], pattern: "horizontal_push", is_unilateral: false },
  { name: "Lateral Raises", aliases: ["side raises"], body_part: "shoulders", equipment: ["dumbbell"], pattern: "lateral_raise", is_unilateral: false },
  { name: "Front Raises", aliases: ["anterior raises"], body_part: "shoulders", equipment: ["dumbbell"], pattern: "vertical_push", is_unilateral: false },
  { name: "Arnold Press", aliases: ["arnold dumbbell press"], body_part: "shoulders", equipment: ["dumbbell"], pattern: "vertical_push", is_unilateral: false },
  { name: "Close Grip Bench Press", aliases: ["narrow grip bench"], body_part: "upper", equipment: ["barbell"], pattern: "horizontal_push", is_unilateral: false },
  { name: "Overhead Tricep Extension", aliases: ["skull crushers"], body_part: "upper", equipment: ["dumbbell"], pattern: "vertical_push", is_unilateral: false },
  { name: "Cable Tricep Pushdown", aliases: ["tricep pushdowns"], body_part: "upper", equipment: ["cable"], pattern: "vertical_push", is_unilateral: false },
  { name: "One Arm Push-Up", aliases: ["single arm pushup"], body_part: "chest", equipment: ["bodyweight"], pattern: "horizontal_push", is_unilateral: true },
  { name: "Single Arm Dumbbell Press", aliases: ["one arm db press"], body_part: "shoulders", equipment: ["dumbbell"], pattern: "vertical_push", is_unilateral: true },

  // Pull Exercises (25 exercises)
  { name: "Pull-Ups", aliases: ["chin-up", "neutral grip pull-up"], body_part: "back", equipment: ["pull-up bar"], pattern: "vertical_pull", is_unilateral: false },
  { name: "Chin-Ups", aliases: ["underhand pull ups"], body_part: "back", equipment: ["pull-up bar"], pattern: "vertical_pull", is_unilateral: false },
  { name: "Wide Grip Pull-Ups", aliases: ["wide pull ups"], body_part: "back", equipment: ["pull-up bar"], pattern: "vertical_pull", is_unilateral: false },
  { name: "Neutral Grip Pull-Ups", aliases: ["hammer grip pull ups"], body_part: "back", equipment: ["pull-up bar"], pattern: "vertical_pull", is_unilateral: false },
  { name: "Lat Pulldown", aliases: ["lat pull down"], body_part: "back", equipment: ["cable"], pattern: "vertical_pull", is_unilateral: false },
  { name: "Wide Grip Lat Pulldown", aliases: ["wide lat pulldown"], body_part: "back", equipment: ["cable"], pattern: "vertical_pull", is_unilateral: false },
  { name: "Barbell Row", aliases: ["bent over row"], body_part: "back", equipment: ["barbell"], pattern: "horizontal_pull", is_unilateral: false },
  { name: "Dumbbell Row", aliases: ["one arm db row"], body_part: "back", equipment: ["dumbbell"], pattern: "horizontal_pull", is_unilateral: true },
  { name: "T-Bar Row", aliases: ["landmine row"], body_part: "back", equipment: ["barbell"], pattern: "horizontal_pull", is_unilateral: false },
  { name: "Seated Cable Row", aliases: ["cable row"], body_part: "back", equipment: ["cable"], pattern: "horizontal_pull", is_unilateral: false },
  { name: "Face Pull", aliases: ["face pulls"], body_part: "back", equipment: ["cable"], pattern: "horizontal_pull", is_unilateral: false },
  { name: "Inverted Rows", aliases: ["bodyweight rows"], body_part: "back", equipment: ["bodyweight"], pattern: "horizontal_pull", is_unilateral: false },
  { name: "Reverse Fly", aliases: ["rear delt fly"], body_part: "back", equipment: ["dumbbell"], pattern: "horizontal_pull", is_unilateral: false },
  { name: "Cable Reverse Fly", aliases: ["cable rear delt"], body_part: "back", equipment: ["cable"], pattern: "horizontal_pull", is_unilateral: false },
  { name: "Bicep Curls", aliases: ["barbell curls"], body_part: "upper", equipment: ["barbell"], pattern: "curl", is_unilateral: false },
  { name: "Dumbbell Bicep Curls", aliases: ["db curls"], body_part: "upper", equipment: ["dumbbell"], pattern: "curl", is_unilateral: false },
  { name: "Hammer Curls", aliases: ["neutral grip curls"], body_part: "upper", equipment: ["dumbbell"], pattern: "curl", is_unilateral: false },
  { name: "Cable Bicep Curls", aliases: ["cable curls"], body_part: "upper", equipment: ["cable"], pattern: "curl", is_unilateral: false },
  { name: "Preacher Curls", aliases: ["preacher bench curls"], body_part: "upper", equipment: ["barbell"], pattern: "curl", is_unilateral: false },
  { name: "21s", aliases: ["21 curls"], body_part: "upper", equipment: ["barbell"], pattern: "curl", is_unilateral: false },
  { name: "Concentration Curls", aliases: ["seated db curls"], body_part: "upper", equipment: ["dumbbell"], pattern: "curl", is_unilateral: true },
  { name: "Cable Hammer Curls", aliases: ["rope hammer curls"], body_part: "upper", equipment: ["cable"], pattern: "curl", is_unilateral: false },
  { name: "Single Arm Cable Row", aliases: ["one arm cable row"], body_part: "back", equipment: ["cable"], pattern: "horizontal_pull", is_unilateral: true },
  { name: "Chest Supported Row", aliases: ["machine row"], body_part: "back", equipment: ["machine"], pattern: "horizontal_pull", is_unilateral: false },
  { name: "Shrugs", aliases: ["shoulder shrugs"], body_part: "back", equipment: ["dumbbell"], pattern: "vertical_pull", is_unilateral: false },

  // Legs Exercises (30 exercises)
  { name: "Back Squat", aliases: ["barbell squat"], body_part: "legs", equipment: ["barbell"], pattern: "squat", is_unilateral: false },
  { name: "Front Squat", aliases: ["front loaded squat"], body_part: "legs", equipment: ["barbell"], pattern: "squat", is_unilateral: false },
  { name: "Goblet Squat", aliases: ["dumbbell goblet squat"], body_part: "legs", equipment: ["dumbbell"], pattern: "squat", is_unilateral: false },
  { name: "Bodyweight Squats", aliases: ["air squats"], body_part: "legs", equipment: ["bodyweight"], pattern: "squat", is_unilateral: false },
  { name: "Jump Squats", aliases: ["squat jumps"], body_part: "legs", equipment: ["bodyweight"], pattern: "squat", is_unilateral: false },
  { name: "Sumo Squats", aliases: ["wide stance squat"], body_part: "legs", equipment: ["bodyweight"], pattern: "squat", is_unilateral: false },
  { name: "Single Leg Squat", aliases: ["pistol squat"], body_part: "legs", equipment: ["bodyweight"], pattern: "squat", is_unilateral: true },
  { name: "Split Squat", aliases: ["rear foot elevated squat"], body_part: "legs", equipment: ["bodyweight"], pattern: "squat", is_unilateral: true },
  { name: "Bulgarian Split Squat", aliases: ["rear foot elevated split squat"], body_part: "legs", equipment: ["bodyweight"], pattern: "squat", is_unilateral: true },
  { name: "Walking Lunge", aliases: ["forward lunge"], body_part: "legs", equipment: ["bodyweight"], pattern: "lunge", is_unilateral: true },
  { name: "Reverse Lunge", aliases: ["backward lunge"], body_part: "legs", equipment: ["bodyweight"], pattern: "lunge", is_unilateral: true },
  { name: "Side Lunge", aliases: ["lateral lunge"], body_part: "legs", equipment: ["bodyweight"], pattern: "lunge", is_unilateral: true },
  { name: "Dumbbell Lunges", aliases: ["db lunges"], body_part: "legs", equipment: ["dumbbell"], pattern: "lunge", is_unilateral: true },
  { name: "Romanian Deadlift", aliases: ["rdl"], body_part: "legs", equipment: ["barbell"], pattern: "hinge", is_unilateral: false },
  { name: "Conventional Deadlift", aliases: ["deadlift"], body_part: "legs", equipment: ["barbell"], pattern: "hinge", is_unilateral: false },
  { name: "Sumo Deadlift", aliases: ["wide stance deadlift"], body_part: "legs", equipment: ["barbell"], pattern: "hinge", is_unilateral: false },
  { name: "Single Leg Romanian Deadlift", aliases: ["single leg rdl"], body_part: "legs", equipment: ["bodyweight"], pattern: "hinge", is_unilateral: true },
  { name: "Dumbbell Romanian Deadlift", aliases: ["db rdl"], body_part: "legs", equipment: ["dumbbell"], pattern: "hinge", is_unilateral: false },
  { name: "Hip Thrust", aliases: ["barbell hip thrust"], body_part: "legs", equipment: ["barbell"], pattern: "hinge", is_unilateral: false },
  { name: "Glute Bridge", aliases: ["bridge"], body_part: "legs", equipment: ["bodyweight"], pattern: "hinge", is_unilateral: false },
  { name: "Single Leg Glute Bridge", aliases: ["one leg bridge"], body_part: "legs", equipment: ["bodyweight"], pattern: "hinge", is_unilateral: true },
  { name: "Calf Raises", aliases: ["heel raises"], body_part: "legs", equipment: ["bodyweight"], pattern: "calf", is_unilateral: false },
  { name: "Single Leg Calf Raises", aliases: ["one leg calf raise"], body_part: "legs", equipment: ["bodyweight"], pattern: "calf", is_unilateral: true },
  { name: "Seated Calf Raises", aliases: ["seated heel raises"], body_part: "legs", equipment: ["machine"], pattern: "calf", is_unilateral: false },
  { name: "Wall Sit", aliases: ["wall squat hold"], body_part: "legs", equipment: ["bodyweight"], pattern: "squat", is_unilateral: false },
  { name: "Step-Ups", aliases: ["box step ups"], body_part: "legs", equipment: ["bodyweight"], pattern: "step", is_unilateral: true },
  { name: "Leg Press", aliases: ["machine leg press"], body_part: "legs", equipment: ["machine"], pattern: "squat", is_unilateral: false },
  { name: "Leg Curls", aliases: ["hamstring curls"], body_part: "legs", equipment: ["machine"], pattern: "curl", is_unilateral: false },
  { name: "Leg Extensions", aliases: ["quad extensions"], body_part: "legs", equipment: ["machine"], pattern: "extension", is_unilateral: false },
  { name: "Good Mornings", aliases: ["barbell good mornings"], body_part: "legs", equipment: ["barbell"], pattern: "hinge", is_unilateral: false },

  // Core Exercises (15 exercises)
  { name: "Plank", aliases: ["front plank"], body_part: "core", equipment: ["bodyweight"], pattern: "stabilization", is_unilateral: false },
  { name: "Side Plank", aliases: ["lateral plank"], body_part: "core", equipment: ["bodyweight"], pattern: "stabilization", is_unilateral: true },
  { name: "Dead Bug", aliases: ["dying bug"], body_part: "core", equipment: ["bodyweight"], pattern: "stabilization", is_unilateral: true },
  { name: "Hollow Hold", aliases: ["hollow body hold"], body_part: "core", equipment: ["bodyweight"], pattern: "stabilization", is_unilateral: false },
  { name: "Bird-Dog", aliases: ["bird dog"], body_part: "core", equipment: ["bodyweight"], pattern: "stabilization", is_unilateral: true },
  { name: "Cable Woodchop", aliases: ["cable wood chop"], body_part: "core", equipment: ["cable"], pattern: "rotation", is_unilateral: true },
  { name: "Pallof Press", aliases: ["anti rotation hold"], body_part: "core", equipment: ["cable"], pattern: "stabilization", is_unilateral: false },
  { name: "Hanging Knee Raise", aliases: ["hanging leg raise"], body_part: "core", equipment: ["pull-up bar"], pattern: "flexion", is_unilateral: false },
  { name: "Crunches", aliases: ["sit ups"], body_part: "core", equipment: ["bodyweight"], pattern: "flexion", is_unilateral: false },
  { name: "Bicycle Crunches", aliases: ["bicycle abs"], body_part: "core", equipment: ["bodyweight"], pattern: "rotation", is_unilateral: false },
  { name: "Russian Twists", aliases: ["seated twists"], body_part: "core", equipment: ["bodyweight"], pattern: "rotation", is_unilateral: false },
  { name: "Mountain Climbers", aliases: ["mountain climber"], body_part: "core", equipment: ["bodyweight"], pattern: "stabilization", is_unilateral: false },
  { name: "Leg Raises", aliases: ["lying leg raises"], body_part: "core", equipment: ["bodyweight"], pattern: "flexion", is_unilateral: false },
  { name: "V-Ups", aliases: ["v sits"], body_part: "core", equipment: ["bodyweight"], pattern: "flexion", is_unilateral: false },
  { name: "Bear Crawl", aliases: ["bear walk"], body_part: "core", equipment: ["bodyweight"], pattern: "carry", is_unilateral: false },

  // Conditioning/Recovery (10 exercises)
  { name: "Burpees", aliases: ["burpee"], body_part: "full", equipment: ["bodyweight"], pattern: "conditioning", is_unilateral: false },
  { name: "Jump Rope", aliases: ["skipping"], body_part: "full", equipment: ["jump rope"], pattern: "conditioning", is_unilateral: false },
  { name: "Assault Bike", aliases: ["air bike"], body_part: "full", equipment: ["machine"], pattern: "conditioning", is_unilateral: false },
  { name: "Incline Walk", aliases: ["treadmill walk"], body_part: "legs", equipment: ["machine"], pattern: "conditioning", is_unilateral: false },
  { name: "Rowing", aliases: ["rower"], body_part: "full", equipment: ["machine"], pattern: "conditioning", is_unilateral: false },
  { name: "Cooldown Walk", aliases: ["recovery walk"], body_part: "legs", equipment: ["bodyweight"], pattern: "recovery", is_unilateral: false },
  { name: "Hamstring Stretch", aliases: ["hamstring flossing"], body_part: "legs", equipment: ["bodyweight"], pattern: "mobility", is_unilateral: true },
  { name: "Quad Stretch", aliases: ["quadricep stretch"], body_part: "legs", equipment: ["bodyweight"], pattern: "mobility", is_unilateral: true },
  { name: "Pec Doorway Stretch", aliases: ["chest stretch"], body_part: "chest", equipment: ["bodyweight"], pattern: "mobility", is_unilateral: false },
  { name: "Child's Pose", aliases: ["childs pose"], body_part: "full", equipment: ["bodyweight"], pattern: "recovery", is_unilateral: false },
];

// In-memory exercise storage for fallback
const inMemoryExercises = new Map<string, any>();
let exerciseIdCounter = 1;

async function seedExercises() {
  try {
    console.log("🌱 Starting exercise seeding...");
    
    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    let useDatabase = true;
    
    // Test database connection
    try {
      const existingCount = await db.select().from(exercises);
      console.log(`📊 Found ${existingCount.length} existing exercises in database`);
    } catch (dbError) {
      console.log("📊 Database not available, using in-memory storage");
      useDatabase = false;
    }
    
    for (const exercise of STARTER_EXERCISES) {
      try {
        const slug = toSlug(exercise.name);
        
        const exerciseData = {
          id: exerciseIdCounter++,
          slug,
          name: exercise.name,
          aliases: exercise.aliases,
          body_part: exercise.body_part,
          equipment: exercise.equipment,
          pattern: exercise.pattern,
          is_unilateral: exercise.is_unilateral,
          createdAt: new Date(),
        };
        
        if (useDatabase) {
          try {
            // Check if exercise already exists
            const existing = await db
              .select({ id: exercises.id })
              .from(exercises)
              .where(eq(exercises.slug, slug))
              .limit(1);
            
            if (existing.length > 0) {
              // Update existing
              await db
                .update(exercises)
                .set({
                  name: exerciseData.name,
                  aliases: exerciseData.aliases,
                  body_part: exerciseData.body_part,
                  equipment: exerciseData.equipment,
                  pattern: exerciseData.pattern,
                  is_unilateral: exerciseData.is_unilateral,
                })
                .where(eq(exercises.slug, slug));
              updated++;
            } else {
              // Insert new
              await db.insert(exercises).values({
                slug: exerciseData.slug,
                name: exerciseData.name,
                aliases: exerciseData.aliases,
                body_part: exerciseData.body_part,
                equipment: exerciseData.equipment,
                pattern: exerciseData.pattern,
                is_unilateral: exerciseData.is_unilateral,
              });
              inserted++;
            }
          } catch (dbError) {
            console.log(`📊 DB error for ${exercise.name}, falling back to memory`);
            useDatabase = false;
            // Add to in-memory storage
            inMemoryExercises.set(slug, exerciseData);
            inserted++;
          }
        } else {
          // Use in-memory storage
          if (inMemoryExercises.has(slug)) {
            inMemoryExercises.set(slug, exerciseData);
            updated++;
          } else {
            inMemoryExercises.set(slug, exerciseData);
            inserted++;
          }
        }
      } catch (error) {
        console.error(`❌ Error processing ${exercise.name}:`, error);
        skipped++;
      }
    }
    
    // Final count and samples
    let finalCount = 0;
    let samples: any[] = [];
    
    if (useDatabase) {
      try {
        const finalCountResult = await db.select().from(exercises);
        finalCount = finalCountResult.length;
        samples = await db.select().from(exercises).limit(5);
      } catch (dbError) {
        console.log("📊 Database became unavailable, showing in-memory data");
        finalCount = inMemoryExercises.size;
        samples = Array.from(inMemoryExercises.values()).slice(0, 5);
      }
    } else {
      finalCount = inMemoryExercises.size;
      samples = Array.from(inMemoryExercises.values()).slice(0, 5);
    }
    
    console.log(`✅ Seeding complete!`);
    console.log(`📈 Inserted: ${inserted}, Updated: ${updated}, Skipped: ${skipped}`);
    console.log(`📊 Total exercises: ${finalCount}`);
    console.log(`💾 Storage: ${useDatabase ? 'Database' : 'In-Memory'}`);
    
    // Show sample rows
    console.log(`\n🔍 Sample exercises:`);
    samples.forEach(ex => {
      console.log(`  ${ex.slug} | ${ex.name} | ${JSON.stringify(ex.aliases)} | ${ex.body_part} | ${JSON.stringify(ex.equipment)}`);
    });
    
    return { inserted, updated, skipped, total: finalCount, useDatabase };
    
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedExercises()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Script failed:", error);
      process.exit(1);
    });
}

export { seedExercises };