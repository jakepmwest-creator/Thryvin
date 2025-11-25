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

// Extract EXACT exercise name from Cloudinary public_id
function extractExerciseName(publicId: string): string {
  // Example: "Workout-Vids/Cable_Deadlift_xj3k2s" -> "Cable Deadlift"
  // Remove folder path
  const parts = publicId.split('/');
  const fileName = parts[parts.length - 1];
  
  // Remove random ID at the end (usually 6-8 chars)
  let cleanName = fileName
    .replace(/_[a-z0-9]{6,8}$/i, '') // Remove _randomid at end
    .replace(/\d{8,}$/i, ''); // Remove long timestamp numbers
  
  // Convert underscores to spaces for proper name
  cleanName = cleanName.replace(/_/g, ' ');
  
  return cleanName.trim();
}

async function fetchAllCloudinaryVideos(): Promise<CloudinaryResource[]> {
  console.log('🔍 Fetching ALL videos from Cloudinary...');
  
  const allResources: CloudinaryResource[] = [];
  let nextCursor: string | undefined = undefined;
  
  try {
    do {
      const result = await cloudinary.api.resources({
        type: 'upload',
        resource_type: 'video',
        max_results: 500,
        next_cursor: nextCursor,
      });
      
      allResources.push(...result.resources);
      nextCursor = result.next_cursor;
      
      console.log(`  Fetched ${allResources.length} videos so far...`);
    } while (nextCursor);
    
    console.log(`✅ Total videos fetched: ${allResources.length}`);
    return allResources;
  } catch (error) {
    console.error('❌ Error fetching from Cloudinary:', error);
    throw error;
  }
}

async function syncVideosToDatabase() {
  console.log('🎬 Starting EXACT NAME video sync from Cloudinary...\n');
  
  try {
    // Fetch all videos from Cloudinary
    const cloudinaryVideos = await fetchAllCloudinaryVideos();
    
    if (cloudinaryVideos.length === 0) {
      console.log('❌ No videos found in Cloudinary');
      return;
    }
    
    // Create a map of exercise names to video URLs
    const videoMap = new Map<string, string>();
    const duplicates = new Map<string, number>();
    
    console.log('\n📝 Processing video names...');
    
    for (const video of cloudinaryVideos) {
      const exerciseName = extractExerciseName(video.public_id);
      
      if (videoMap.has(exerciseName)) {
        const count = duplicates.get(exerciseName) || 1;
        duplicates.set(exerciseName, count + 1);
        console.log(`  ⚠️  DUPLICATE: "${exerciseName}" found ${count + 1} times`);
      } else {
        videoMap.set(exerciseName, video.secure_url);
      }
    }
    
    console.log(`\n✅ Processed ${videoMap.size} unique exercise names`);
    console.log(`⚠️  Found ${duplicates.size} exercises with duplicates\n`);
    
    if (duplicates.size > 0) {
      console.log('Duplicate exercises:');
      Array.from(duplicates.entries())
        .sort((a, b) => b[1] - a[1])
        .forEach(([name, count]) => {
          console.log(`  - "${name}": ${count} videos`);
        });
      console.log('');
    }
    
    // Get all exercises from database
    console.log('📚 Fetching exercises from database...');
    const dbExercises = await db.select().from(exercises);
    console.log(`  Found ${dbExercises.length} exercises in database\n`);
    
    // Match and update
    let matched = 0;
    let notMatched = 0;
    const notMatchedList: string[] = [];
    
    console.log('🔄 Matching exercises to videos...\n');
    
    for (const exercise of dbExercises) {
      const videoUrl = videoMap.get(exercise.name);
      
      if (videoUrl) {
        // Update exercise with video URL
        await db
          .update(exercises)
          .set({ 
            videoUrl,
            thumbnailUrl: videoUrl.replace('/upload/', '/upload/w_300,h_200,c_fill/')
          })
          .where(eq(exercises.id, exercise.id));
        
        matched++;
        console.log(`  ✅ "${exercise.name}" -> ${videoUrl.substring(0, 60)}...`);
      } else {
        notMatched++;
        notMatchedList.push(exercise.name);
      }
    }
    
    console.log(`\n📊 SYNC RESULTS:`);
    console.log(`  ✅ Matched: ${matched} exercises`);
    console.log(`  ❌ Not matched: ${notMatched} exercises`);
    
    if (notMatchedList.length > 0 && notMatchedList.length < 50) {
      console.log('\n❌ Exercises without videos:');
      notMatchedList.forEach(name => console.log(`  - "${name}"`));
    }
    
    console.log('\n✨ Sync complete!');
    
    // Show sample of what we have
    console.log('\n📋 Sample of matched exercises:');
    const sample = await db.select().from(exercises).limit(10);
    sample.forEach(ex => {
      console.log(`  - ${ex.name}: ${ex.videoUrl ? '✅ Has video' : '❌ No video'}`);
    });
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
    throw error;
  }
}

// Run the sync
syncVideosToDatabase()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
