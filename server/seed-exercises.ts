import { db } from "./db";
import { exercises } from "@shared/schema";
import { eq } from "drizzle-orm";

// Comprehensive list of common exercises organized by category
const EXERCISE_SEED_DATA = [
  // UPPER BODY - CHEST
  {
    slug: "bench-press",
    name: "Bench Press",
    aliases: ["Barbell Bench Press", "Flat Bench"],
    body_part: "chest",
    equipment: ["barbell", "bench"],
    pattern: "horizontal_push",
    category: "upper-body",
    muscleGroups: ["chest", "triceps", "shoulders"],
    difficulty: "intermediate",
    description: "Classic compound chest exercise performed lying on a flat bench",
    instructions: "Lie on bench, grip barbell slightly wider than shoulders, lower to chest, press up explosively",
    tips: "Keep shoulder blades retracted, maintain arch in lower back, touch chest lightly",
  },
  {
    slug: "incline-bench-press",
    name: "Incline Bench Press",
    body_part: "chest",
    equipment: ["barbell", "bench"],
    pattern: "horizontal_push",
    category: "upper-body",
    muscleGroups: ["upper-chest", "shoulders", "triceps"],
    difficulty: "intermediate",
  },
  {
    slug: "dumbbell-chest-press",
    name: "Dumbbell Chest Press",
    aliases: ["DB Bench Press"],
    body_part: "chest",
    equipment: ["dumbbells", "bench"],
    pattern: "horizontal_push",
    category: "upper-body",
    muscleGroups: ["chest", "triceps", "shoulders"],
    difficulty: "beginner",
  },
  {
    slug: "push-ups",
    name: "Push-Ups",
    aliases: ["Pushups", "Press Ups"],
    body_part: "chest",
    equipment: [],
    pattern: "horizontal_push",
    category: "upper-body",
    muscleGroups: ["chest", "triceps", "shoulders", "core"],
    difficulty: "beginner",
  },
  {
    slug: "chest-fly",
    name: "Chest Fly",
    aliases: ["Pec Fly", "Dumbbell Fly"],
    body_part: "chest",
    equipment: ["dumbbells", "bench"],
    pattern: "horizontal_push",
    category: "upper-body",
    muscleGroups: ["chest"],
    difficulty: "intermediate",
  },

  // UPPER BODY - BACK
  {
    slug: "deadlift",
    name: "Deadlift",
    aliases: ["Barbell Deadlift", "Conventional Deadlift"],
    body_part: "back",
    equipment: ["barbell"],
    pattern: "hinge",
    category: "upper-body",
    muscleGroups: ["back", "glutes", "hamstrings", "core"],
    difficulty: "advanced",
  },
  {
    slug: "bent-over-row",
    name: "Bent Over Row",
    aliases: ["Barbell Row", "BB Row"],
    body_part: "back",
    equipment: ["barbell"],
    pattern: "horizontal_pull",
    category: "upper-body",
    muscleGroups: ["back", "lats", "rhomboids", "biceps"],
    difficulty: "intermediate",
  },
  {
    slug: "pull-ups",
    name: "Pull-Ups",
    aliases: ["Pullups"],
    body_part: "back",
    equipment: ["pull-up-bar"],
    pattern: "vertical_pull",
    category: "upper-body",
    muscleGroups: ["lats", "back", "biceps"],
    difficulty: "intermediate",
  },
  {
    slug: "lat-pulldown",
    name: "Lat Pulldown",
    body_part: "back",
    equipment: ["machine", "cable"],
    pattern: "vertical_pull",
    category: "upper-body",
    muscleGroups: ["lats", "back", "biceps"],
    difficulty: "beginner",
  },
  {
    slug: "dumbbell-row",
    name: "Dumbbell Row",
    aliases: ["Single-Arm Row", "One-Arm Row"],
    body_part: "back",
    equipment: ["dumbbell", "bench"],
    pattern: "horizontal_pull",
    is_unilateral: true,
    category: "upper-body",
    muscleGroups: ["back", "lats", "biceps"],
    difficulty: "beginner",
  },

  // UPPER BODY - SHOULDERS
  {
    slug: "overhead-press",
    name: "Overhead Press",
    aliases: ["Shoulder Press", "Military Press", "OHP"],
    body_part: "shoulders",
    equipment: ["barbell"],
    pattern: "vertical_push",
    category: "upper-body",
    muscleGroups: ["shoulders", "triceps", "core"],
    difficulty: "intermediate",
  },
  {
    slug: "dumbbell-shoulder-press",
    name: "Dumbbell Shoulder Press",
    aliases: ["DB Shoulder Press"],
    body_part: "shoulders",
    equipment: ["dumbbells"],
    pattern: "vertical_push",
    category: "upper-body",
    muscleGroups: ["shoulders", "triceps"],
    difficulty: "beginner",
  },
  {
    slug: "lateral-raise",
    name: "Lateral Raise",
    aliases: ["Side Raise", "Dumbbell Lateral Raise"],
    body_part: "shoulders",
    equipment: ["dumbbells"],
    pattern: "vertical_push",
    category: "upper-body",
    muscleGroups: ["shoulders", "delts"],
    difficulty: "beginner",
  },
  {
    slug: "front-raise",
    name: "Front Raise",
    body_part: "shoulders",
    equipment: ["dumbbells"],
    pattern: "vertical_push",
    category: "upper-body",
    muscleGroups: ["front-delts", "shoulders"],
    difficulty: "beginner",
  },

  // UPPER BODY - ARMS
  {
    slug: "bicep-curl",
    name: "Bicep Curl",
    aliases: ["Dumbbell Curl", "DB Curl"],
    body_part: "arms",
    equipment: ["dumbbells"],
    category: "upper-body",
    muscleGroups: ["biceps"],
    difficulty: "beginner",
  },
  {
    slug: "hammer-curl",
    name: "Hammer Curl",
    body_part: "arms",
    equipment: ["dumbbells"],
    category: "upper-body",
    muscleGroups: ["biceps", "forearms"],
    difficulty: "beginner",
  },
  {
    slug: "tricep-dips",
    name: "Tricep Dips",
    aliases: ["Dips", "Bench Dips"],
    body_part: "arms",
    equipment: ["bench", "dip-bar"],
    pattern: "vertical_push",
    category: "upper-body",
    muscleGroups: ["triceps", "chest", "shoulders"],
    difficulty: "intermediate",
  },
  {
    slug: "tricep-extension",
    name: "Tricep Extension",
    aliases: ["Overhead Tricep Extension", "Skullcrusher"],
    body_part: "arms",
    equipment: ["dumbbells"],
    category: "upper-body",
    muscleGroups: ["triceps"],
    difficulty: "beginner",
  },

  // LOWER BODY - QUADS
  {
    slug: "squat",
    name: "Squat",
    aliases: ["Barbell Squat", "Back Squat"],
    body_part: "legs",
    equipment: ["barbell"],
    pattern: "squat",
    category: "lower-body",
    muscleGroups: ["quads", "glutes", "hamstrings", "core"],
    difficulty: "intermediate",
  },
  {
    slug: "front-squat",
    name: "Front Squat",
    body_part: "legs",
    equipment: ["barbell"],
    pattern: "squat",
    category: "lower-body",
    muscleGroups: ["quads", "core", "upper-back"],
    difficulty: "advanced",
  },
  {
    slug: "leg-press",
    name: "Leg Press",
    body_part: "legs",
    equipment: ["machine"],
    pattern: "squat",
    category: "lower-body",
    muscleGroups: ["quads", "glutes", "hamstrings"],
    difficulty: "beginner",
  },
  {
    slug: "leg-extension",
    name: "Leg Extension",
    body_part: "legs",
    equipment: ["machine"],
    category: "lower-body",
    muscleGroups: ["quads"],
    difficulty: "beginner",
  },
  {
    slug: "lunges",
    name: "Lunges",
    aliases: ["Walking Lunges", "Dumbbell Lunges"],
    body_part: "legs",
    equipment: ["dumbbells"],
    pattern: "squat",
    is_unilateral: true,
    category: "lower-body",
    muscleGroups: ["quads", "glutes", "hamstrings"],
    difficulty: "beginner",
  },

  // LOWER BODY - POSTERIOR CHAIN
  {
    slug: "romanian-deadlift",
    name: "Romanian Deadlift",
    aliases: ["RDL"],
    body_part: "back",
    equipment: ["barbell"],
    pattern: "hinge",
    category: "lower-body",
    muscleGroups: ["hamstrings", "glutes", "lower-back"],
    difficulty: "intermediate",
  },
  {
    slug: "leg-curl",
    name: "Leg Curl",
    aliases: ["Hamstring Curl"],
    body_part: "legs",
    equipment: ["machine"],
    category: "lower-body",
    muscleGroups: ["hamstrings"],
    difficulty: "beginner",
  },
  {
    slug: "glute-bridge",
    name: "Glute Bridge",
    aliases: ["Hip Thrust", "Barbell Hip Thrust"],
    body_part: "legs",
    equipment: ["barbell", "bench"],
    pattern: "hinge",
    category: "lower-body",
    muscleGroups: ["glutes", "hamstrings"],
    difficulty: "beginner",
  },
  {
    slug: "calf-raise",
    name: "Calf Raise",
    aliases: ["Standing Calf Raise"],
    body_part: "legs",
    equipment: ["machine"],
    category: "lower-body",
    muscleGroups: ["calves"],
    difficulty: "beginner",
  },

  // CORE
  {
    slug: "plank",
    name: "Plank",
    aliases: ["Front Plank"],
    body_part: "core",
    equipment: [],
    category: "core",
    muscleGroups: ["abs", "core"],
    difficulty: "beginner",
  },
  {
    slug: "crunches",
    name: "Crunches",
    aliases: ["Ab Crunches"],
    body_part: "core",
    equipment: [],
    category: "core",
    muscleGroups: ["abs"],
    difficulty: "beginner",
  },
  {
    slug: "russian-twist",
    name: "Russian Twist",
    body_part: "core",
    equipment: [],
    category: "core",
    muscleGroups: ["abs", "obliques"],
    difficulty: "beginner",
  },
  {
    slug: "leg-raises",
    name: "Leg Raises",
    aliases: ["Lying Leg Raises"],
    body_part: "core",
    equipment: [],
    category: "core",
    muscleGroups: ["lower-abs", "core"],
    difficulty: "intermediate",
  },

  // CARDIO
  {
    slug: "running",
    name: "Running",
    aliases: ["Jogging", "Treadmill"],
    body_part: "full",
    equipment: ["treadmill"],
    category: "cardio",
    muscleGroups: ["legs", "cardio"],
    difficulty: "beginner",
  },
  {
    slug: "jump-rope",
    name: "Jump Rope",
    aliases: ["Skipping", "Rope Skipping"],
    body_part: "full",
    equipment: ["jump-rope"],
    category: "cardio",
    muscleGroups: ["calves", "cardio"],
    difficulty: "beginner",
  },
  {
    slug: "burpees",
    name: "Burpees",
    body_part: "full",
    equipment: [],
    category: "full-body",
    muscleGroups: ["full-body", "cardio"],
    difficulty: "intermediate",
  },
  {
    slug: "mountain-climbers",
    name: "Mountain Climbers",
    body_part: "core",
    equipment: [],
    category: "cardio",
    muscleGroups: ["core", "shoulders", "cardio"],
    difficulty: "beginner",
  },
];

export async function seedExercises() {
  try {
    console.log("🏋️ Seeding exercise database...");

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const exercise of EXERCISE_SEED_DATA) {
      try {
        // Check if exercise already exists
        const existing = await db
          .select()
          .from(exercises)
          .where(eq(exercises.slug, exercise.slug))
          .limit(1);

        if (existing.length > 0) {
          // Update existing exercise (but don't overwrite videoUrl if it exists)
          const existingExercise = existing[0];
          const updateData: any = { ...exercise };
          
          // Preserve video URL if it exists
          if (existingExercise.videoUrl) {
            delete updateData.videoUrl;
          }
          
          await db
            .update(exercises)
            .set(updateData)
            .where(eq(exercises.id, existingExercise.id));
          
          updated++;
          console.log(`  ✓ Updated: ${exercise.name}`);
        } else {
          // Insert new exercise
          await db.insert(exercises).values(exercise);
          created++;
          console.log(`  ✓ Created: ${exercise.name}`);
        }
      } catch (error: any) {
        console.error(`  ✗ Error with ${exercise.name}:`, error.message);
        skipped++;
      }
    }

    console.log(`\n✅ Exercise seeding complete!`);
    console.log(`   Created: ${created}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${EXERCISE_SEED_DATA.length}`);
  } catch (error) {
    console.error("❌ Error seeding exercises:", error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedExercises()
    .then(() => {
      console.log("Done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed:", error);
      process.exit(1);
    });
}
