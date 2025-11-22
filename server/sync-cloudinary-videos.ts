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

interface CloudinaryResource {
  public_id: string;
  secure_url: string;
  resource_type: string;
  format: string;
  folder?: string;
}

// Normalize exercise names for matching
function normalizeExerciseName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars
    .replace(/\s+/g, '') // Remove all spaces
    .trim();
}

// Extract exercise name from Cloudinary public_id
function extractExerciseName(publicId: string): string {
  // Example: "Wrist_Extensor_Stretch_female_hk2rqb" -> "wristextensorstretch"
  // Remove folder paths
  const parts = publicId.split('/');
  const fileName = parts[parts.length - 1];
  
  // Remove file extension and random IDs at the end
  // Pattern: word_word_randomid or word_word_female/male_randomid
  let cleanName = fileName
    .replace(/_(female|male)_[a-z0-9]+$/i, '') // Remove gender and ID
    .replace(/_[a-z0-9]{6,8}$/i, '') // Remove random ID at end
    .replace(/\d{8,}$/i, ''); // Remove long numbers at end
  
  return normalizeExerciseName(cleanName);
}

async function fetchAllCloudinaryVideos(): Promise<CloudinaryResource[]> {
  console.log('🔍 Fetching videos from Cloudinary...');
  
  const allVideos: CloudinaryResource[] = [];
  let nextCursor: string | undefined = undefined;
  
  try {
    do {
      const result = await cloudinary.api.resources({
        type: 'upload',
        resource_type: 'video',
        // Don't use prefix - get ALL videos
        max_results: 500,
        next_cursor: nextCursor,
      });
      
      allVideos.push(...result.resources);
      nextCursor = result.next_cursor;
      
      console.log(`  Fetched ${allVideos.length} videos so far...`);
    } while (nextCursor);
    
    console.log(`✅ Total videos found: ${allVideos.length}`);
    return allVideos;
  } catch (error) {
    console.error('❌ Error fetching Cloudinary videos:', error);
    throw error;
  }
}

async function syncVideosToDatabase() {
  console.log('🚀 Starting Cloudinary Video Sync...\n');
  
  // Step 1: Fetch all videos from Cloudinary
  const cloudinaryVideos = await fetchAllCloudinaryVideos();
  
  // Step 2: Create a map of normalized names to video URLs
  const videoMap = new Map<string, string>();
  
  cloudinaryVideos.forEach(video => {
    const exerciseName = extractExerciseName(video.public_id);
    
    // Use highest quality URL
    const videoUrl = video.secure_url;
    
    // Store the mapping
    if (!videoMap.has(exerciseName)) {
      videoMap.set(exerciseName, videoUrl);
    }
    
    console.log(`  Mapped: ${exerciseName} -> ${video.public_id}`);
  });
  
  console.log(`\n📦 Created ${videoMap.size} unique exercise video mappings`);
  
  // Step 3: Fetch all exercises from database
  console.log('\n🔍 Fetching exercises from database...');
  const allExercises = await db
    .select({
      id: exercises.id,
      name: exercises.name,
      videoUrl: exercises.videoUrl,
    })
    .from(exercises);
  
  console.log(`  Found ${allExercises.length} exercises in database`);
  
  // Step 4: Match and update
  console.log('\n🔄 Matching and updating...\n');
  
  let matched = 0;
  let updated = 0;
  let alreadyHasVideo = 0;
  let notFound = 0;
  
  for (const exercise of allExercises) {
    const normalizedName = normalizeExerciseName(exercise.name);
    const videoUrl = videoMap.get(normalizedName);
    
    if (videoUrl) {
      matched++;
      
      if (!exercise.videoUrl || exercise.videoUrl === '') {
        // Update exercise with video URL
        await db
          .update(exercises)
          .set({ videoUrl })
          .where(eq(exercises.id, exercise.id));
        
        updated++;
        console.log(`  ✅ Updated: ${exercise.name} -> ${videoUrl}`);
      } else {
        alreadyHasVideo++;
        console.log(`  ⏭️  Skipped (already has video): ${exercise.name}`);
      }
    } else {
      notFound++;
      console.log(`  ❌ No video found for: ${exercise.name} (${normalizedName})`);
    }
  }
  
  // Step 5: Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SYNC SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total exercises in database:    ${allExercises.length}`);
  console.log(`Videos matched:                 ${matched}`);
  console.log(`Exercises updated:              ${updated}`);
  console.log(`Already had videos:             ${alreadyHasVideo}`);
  console.log(`No matching video:              ${notFound}`);
  console.log('='.repeat(60));
  
  // Step 6: List unmatched videos (videos without exercises)
  console.log('\n📹 Videos without matching exercises:');
  const exerciseNames = new Set(allExercises.map(e => normalizeExerciseName(e.name)));
  let unmatchedVideos = 0;
  
  videoMap.forEach((url, name) => {
    if (!exerciseNames.has(name)) {
      unmatchedVideos++;
      console.log(`  - ${name}`);
    }
  });
  
  console.log(`\nTotal unmatched videos: ${unmatchedVideos}`);
  console.log('\n✨ Sync complete!');
}

// Run the sync
syncVideosToDatabase()
  .then(() => {
    console.log('\n🎉 All done! Videos are now synced to database.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
