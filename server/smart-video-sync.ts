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

// Normalize for fuzzy matching
function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ''); // Remove everything except letters and numbers
}

// Calculate similarity score
function similarity(a: string, b: string): number {
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  
  if (longer.length === 0) return 1.0;
  
  // Check if shorter is contained in longer
  if (longer.includes(shorter)) return 0.9;
  
  // Levenshtein distance
  const costs = [];
  for (let i = 0; i <= longer.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= shorter.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (longer.charAt(i - 1) !== shorter.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[shorter.length] = lastValue;
  }
  
  return 1 - costs[shorter.length] / longer.length;
}

// Find best match for an exercise
function findBestMatch(exerciseName: string, videoNames: Map<string, string>): { name: string; url: string; score: number } | null {
  const normalized = normalize(exerciseName);
  let bestMatch: { name: string; url: string; score: number } | null = null;
  
  videoNames.forEach((url, videoName) => {
    const score = similarity(normalized, videoName);
    
    if (score > 0.6 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { name: videoName, url, score };
    }
  });
  
  return bestMatch;
}

async function smartSync() {
  console.log('🚀 Starting Smart Video Sync...\n');
  
  // Fetch all videos
  console.log('🔍 Fetching videos from Cloudinary...');
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
  
  // Create video map
  const videoMap = new Map<string, string>();
  allVideos.forEach(video => {
    const fileName = video.public_id.split('/').pop() || '';
    const cleanName = fileName
      .replace(/_(female|male)_[a-z0-9]+$/i, '')
      .replace(/_[a-z0-9]{6,8}$/i, '')
      .replace(/\d{8,}$/i, '');
    const normalized = normalize(cleanName);
    
    if (!videoMap.has(normalized)) {
      videoMap.set(normalized, video.secure_url);
    }
  });
  
  // Fetch all exercises
  console.log('🔍 Fetching exercises from database...');
  const allExercises = await db
    .select({
      id: exercises.id,
      name: exercises.name,
      videoUrl: exercises.videoUrl,
    })
    .from(exercises);
  
  console.log(`  Found ${allExercises.length} exercises\n`);
  
  // Match and update
  console.log('🔄 Matching exercises to videos...\n');
  
  let updated = 0;
  let alreadyHad = 0;
  let notFound = 0;
  
  for (const exercise of allExercises) {
    if (exercise.videoUrl) {
      alreadyHad++;
      console.log(`  ⏭️  ${exercise.name} (already has video)`);
      continue;
    }
    
    const match = findBestMatch(exercise.name, videoMap);
    
    if (match && match.score > 0.7) {
      await db
        .update(exercises)
        .set({ videoUrl: match.url })
        .where(eq(exercises.id, exercise.id));
      
      updated++;
      console.log(`  ✅ ${exercise.name} -> ${match.name} (${Math.round(match.score * 100)}%)`);
    } else {
      notFound++;
      console.log(`  ❌ ${exercise.name} (no good match${match ? `, best: ${Math.round(match.score * 100)}%` : ''})`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total exercises:        ${allExercises.length}`);
  console.log(`Updated with videos:    ${updated}`);
  console.log(`Already had videos:     ${alreadyHad}`);
  console.log(`No match found:         ${notFound}`);
  console.log(`Coverage:               ${Math.round(((updated + alreadyHad) / allExercises.length) * 100)}%`);
  console.log('='.repeat(60));
}

smartSync()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Error:', error);
    process.exit(1);
  });
