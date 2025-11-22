import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';
import { db } from './db';
import { exercises } from '../shared/schema';
import { eq } from 'drizzle-orm';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Clean and format exercise name
function cleanExerciseName(publicId: string): string {
  const fileName = publicId.split('/').pop() || '';
  
  // Remove gender suffixes and random IDs
  let cleanName = fileName
    .replace(/_(female|male)_[a-z0-9]+$/i, '')
    .replace(/_[a-z0-9]{6,8}$/i, '')
    .replace(/\d{8,}$/i, '');
  
  // Convert underscores to spaces and title case
  return cleanName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim();
}

// Create slug from name
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Categorize exercise based on name keywords
function categorizeExercise(name: string): {
  bodyPart: string;
  category: string;
  muscleGroups: string[];
  difficulty: string;
} {
  const nameLower = name.toLowerCase();
  
  // Body parts
  let bodyPart = 'full';
  let category = 'full-body';
  let muscleGroups: string[] = [];
  let difficulty = 'intermediate';
  
  // Chest
  if (nameLower.includes('chest') || nameLower.includes('bench press') || nameLower.includes('flye')) {
    bodyPart = 'chest';
    category = 'upper-body';
    muscleGroups = ['chest'];
  }
  // Back
  else if (nameLower.includes('back') || nameLower.includes('row') || nameLower.includes('pulldown') || nameLower.includes('pull up') || nameLower.includes('pullup')) {
    bodyPart = 'back';
    category = 'upper-body';
    muscleGroups = ['back'];
  }
  // Shoulders
  else if (nameLower.includes('shoulder') || nameLower.includes('lateral raise') || nameLower.includes('front raise') || nameLower.includes('overhead press')) {
    bodyPart = 'chest'; // shoulders go with chest/upper
    category = 'upper-body';
    muscleGroups = ['shoulders'];
  }
  // Legs
  else if (nameLower.includes('squat') || nameLower.includes('lunge') || nameLower.includes('leg') || nameLower.includes('deadlift') || nameLower.includes('calf')) {
    bodyPart = 'legs';
    category = 'lower-body';
    muscleGroups = ['legs'];
  }
  // Core
  else if (nameLower.includes('crunch') || nameLower.includes('plank') || nameLower.includes('ab') || nameLower.includes('core') || nameLower.includes('waist')) {
    bodyPart = 'core';
    category = 'core';
    muscleGroups = ['abs', 'core'];
  }
  // Arms
  else if (nameLower.includes('curl') || nameLower.includes('tricep') || nameLower.includes('bicep') || nameLower.includes('arm')) {
    bodyPart = 'chest'; // arms go with upper
    category = 'upper-body';
    muscleGroups = ['arms'];
  }
  
  // Difficulty
  if (nameLower.includes('beginner') || nameLower.includes('easy') || nameLower.includes('basic')) {
    difficulty = 'beginner';
  } else if (nameLower.includes('advanced') || nameLower.includes('hard') || nameLower.includes('elite')) {
    difficulty = 'advanced';
  }
  
  return { bodyPart, category, muscleGroups, difficulty };
}

async function importAllVideos() {
  console.log('🚀 Importing ALL Cloudinary Videos as Exercises...\n');
  
  // Fetch all videos
  console.log('🔍 Fetching all videos from Cloudinary...');
  const allVideos: any[] = [];
  let nextCursor: string | undefined;
  
  do {
    const result = await cloudinary.api.resources({
      type: 'upload',
      resource_type: 'video',
      max_results: 500,
      next_cursor: nextCursor,
    });
    allVideos.push(...result.resources);
    nextCursor = result.next_cursor;
    console.log(`  Fetched ${allVideos.length} videos...`);
  } while (nextCursor);
  
  console.log(`✅ Total videos: ${allVideos.length}\n`);
  
  // Get existing exercises to avoid duplicates
  console.log('🔍 Checking existing exercises...');
  const existingExercises = await db
    .select({ slug: exercises.slug, name: exercises.name })
    .from(exercises);
  const existingSlugs = new Set(existingExercises.map(e => e.slug));
  const existingNames = new Set(existingExercises.map(e => e.name.toLowerCase()));
  console.log(`  Found ${existingSlugs.size} existing exercises\n`);
  
  // Process videos
  console.log('📝 Processing videos...\n');
  
  let created = 0;
  let skipped = 0;
  let updated = 0;
  const batch: any[] = [];
  
  for (const video of allVideos) {
    const name = cleanExerciseName(video.public_id);
    const slug = createSlug(name);
    
    // Skip if name is too short or looks like garbage
    if (name.length < 3 || /^\d+$/.test(name)) {
      skipped++;
      continue;
    }
    
    const { bodyPart, category, muscleGroups, difficulty } = categorizeExercise(name);
    
    const exerciseData = {
      name,
      slug,
      body_part: bodyPart,
      category,
      muscleGroups,
      difficulty,
      videoUrl: video.secure_url,
      thumbnailUrl: video.secure_url.replace('/upload/', '/upload/so_0/'),
      description: `${name} exercise demonstration`,
      instructions: `Perform the ${name} with proper form`,
      tips: 'Maintain proper form throughout the movement',
      safetyNotes: 'Warm up properly before attempting this exercise',
    };
    
    if (existingSlugs.has(slug)) {
      // Update existing exercise with video URL if it doesn't have one
      const existing = await db
        .select({ id: exercises.id, videoUrl: exercises.videoUrl })
        .from(exercises)
        .where(eq(exercises.slug, slug))
        .limit(1);
      
      if (existing[0] && !existing[0].videoUrl) {
        await db
          .update(exercises)
          .set({ videoUrl: video.secure_url, thumbnailUrl: exerciseData.thumbnailUrl })
          .where(eq(exercises.id, existing[0].id));
        updated++;
        console.log(`  ✏️  Updated: ${name}`);
      } else {
        skipped++;
      }
    } else {
      batch.push(exerciseData);
      created++;
      console.log(`  ✅ New: ${name}`);
      
      // Insert in batches of 50
      if (batch.length >= 50) {
        await db.insert(exercises).values(batch);
        batch.length = 0;
      }
    }
  }
  
  // Insert remaining
  if (batch.length > 0) {
    await db.insert(exercises).values(batch);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 IMPORT SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total videos processed:     ${allVideos.length}`);
  console.log(`New exercises created:      ${created}`);
  console.log(`Existing exercises updated: ${updated}`);
  console.log(`Skipped:                    ${skipped}`);
  console.log(`Total exercises now:        ${existingSlugs.size + created}`);
  console.log('='.repeat(60));
  console.log('\n✨ Done! Your exercise library is now MASSIVE! 🎉');
}

importAllVideos()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n💥 Error:', error);
    process.exit(1);
  });
