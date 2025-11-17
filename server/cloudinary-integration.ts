import { v2 as cloudinary } from 'cloudinary';
import { db } from './db';
import { exercises } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

interface CloudinaryVideo {
  public_id: string;
  secure_url: string;
  format: string;
  duration: number;
  width: number;
  height: number;
  created_at: string;
}

/**
 * Normalize a string for matching (lowercase, remove special chars, etc.)
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove all non-alphanumeric
    .trim();
}

/**
 * Extract exercise name from Cloudinary public_id
 * Examples:
 *   "Workout-Vids/bench-press" -> "bench-press"
 *   "Workout-Vids/Bench_Press_Tutorial" -> "bench-press"
 */
function extractExerciseName(publicId: string): string {
  // Remove folder prefix
  const filename = publicId.replace(/^Workout-Vids\//i, '');
  
  // Convert to slug format (lowercase with hyphens)
  return filename
    .toLowerCase()
    .replace(/[_\s]+/g, '-') // Replace underscores/spaces with hyphens
    .replace(/[^a-z0-9-]/g, '') // Remove special chars
    .trim();
}

/**
 * Find matching exercise in database by name matching
 */
async function findMatchingExercise(videoName: string) {
  const normalizedVideoName = normalizeString(videoName);
  
  // Get all exercises
  const allExercises = await db.select().from(exercises);
  
  // Try exact slug match first
  let match = allExercises.find(ex => ex.slug === videoName);
  if (match) return match;
  
  // Try normalized name match
  match = allExercises.find(ex => 
    normalizeString(ex.name) === normalizedVideoName ||
    normalizeString(ex.slug) === normalizedVideoName
  );
  if (match) return match;
  
  // Try aliases match
  match = allExercises.find(ex => {
    if (!ex.aliases || !Array.isArray(ex.aliases)) return false;
    return ex.aliases.some((alias: string) => 
      normalizeString(alias) === normalizedVideoName
    );
  });
  if (match) return match;
  
  // Try partial match (video name contains exercise name or vice versa)
  match = allExercises.find(ex => {
    const normalizedExName = normalizeString(ex.name);
    return normalizedVideoName.includes(normalizedExName) || 
           normalizedExName.includes(normalizedVideoName);
  });
  
  return match;
}

/**
 * Fetch all videos from Cloudinary folder
 */
async function fetchCloudinaryVideos(): Promise<CloudinaryVideo[]> {
  try {
    console.log('🔍 Fetching videos from Cloudinary...');
    
    const folder = process.env.CLOUDINARY_FOLDER || 'Workout-Vids';
    
    // Use Search API to get all videos in folder
    const result = await cloudinary.search
      .expression(`folder:${folder}/*`)
      .with_field('context')
      .with_field('tags')
      .max_results(500) // Adjust if you have more videos
      .execute();
    
    console.log(`✅ Found ${result.resources.length} videos in Cloudinary`);
    
    return result.resources.map((resource: any) => ({
      public_id: resource.public_id,
      secure_url: resource.secure_url,
      format: resource.format,
      duration: resource.duration,
      width: resource.width,
      height: resource.height,
      created_at: resource.created_at,
    }));
  } catch (error: any) {
    console.error('❌ Error fetching Cloudinary videos:', error.message);
    throw error;
  }
}

/**
 * Map videos to exercises in database
 */
export async function mapCloudinaryVideosToExercises() {
  try {
    console.log('\n🎬 Starting Cloudinary Video Integration...\n');
    
    // Fetch all videos from Cloudinary
    const videos = await fetchCloudinaryVideos();
    
    if (videos.length === 0) {
      console.log('⚠️  No videos found in Cloudinary folder');
      return;
    }
    
    let matched = 0;
    let unmatched = 0;
    const unmatchedVideos: string[] = [];
    
    console.log('\n📋 Mapping videos to exercises...\n');
    
    for (const video of videos) {
      const exerciseName = extractExerciseName(video.public_id);
      console.log(`\n  Processing: ${video.public_id}`);
      console.log(`  Extracted name: ${exerciseName}`);
      
      // Find matching exercise
      const exercise = await findMatchingExercise(exerciseName);
      
      if (exercise) {
        // Update exercise with video URL
        await db
          .update(exercises)
          .set({
            videoUrl: video.secure_url,
            // Optionally set thumbnail (Cloudinary auto-generates)
            thumbnailUrl: video.secure_url.replace(/\.(mp4|mov|avi)$/, '.jpg'),
          })
          .where(eq(exercises.id, exercise.id));
        
        matched++;
        console.log(`  ✅ Matched: ${exercise.name} → ${video.secure_url}`);
      } else {
        unmatched++;
        unmatchedVideos.push(video.public_id);
        console.log(`  ⚠️  No match found for: ${video.public_id}`);
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 CLOUDINARY INTEGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total videos found: ${videos.length}`);
    console.log(`✅ Successfully matched: ${matched}`);
    console.log(`⚠️  Unmatched videos: ${unmatched}`);
    
    if (unmatchedVideos.length > 0) {
      console.log('\n⚠️  Unmatched video files:');
      unmatchedVideos.forEach(video => console.log(`   - ${video}`));
      console.log('\n💡 Tip: Rename these files to match exercise slugs in database');
    }
    
    console.log('\n✅ Cloudinary video integration complete!\n');
    
  } catch (error: any) {
    console.error('\n❌ Error during video mapping:', error);
    throw error;
  }
}

/**
 * Get Cloudinary video URL for an exercise
 */
export function getCloudinaryVideoUrl(publicId: string): string {
  return cloudinary.url(publicId, {
    resource_type: 'video',
    secure: true,
    transformation: [
      { quality: 'auto' }, // Auto quality based on device
      { fetch_format: 'auto' }, // Auto format (mp4, webm, etc.)
    ],
  });
}

/**
 * Get optimized video URL for mobile streaming
 */
export function getOptimizedVideoUrl(publicId: string, quality: 'low' | 'medium' | 'high' = 'medium'): string {
  const qualityMap = {
    low: 'auto:low',
    medium: 'auto:good',
    high: 'auto:best',
  };
  
  return cloudinary.url(publicId, {
    resource_type: 'video',
    secure: true,
    transformation: [
      { quality: qualityMap[quality] },
      { fetch_format: 'auto' },
      { streaming_profile: 'hd' }, // Adaptive bitrate streaming
    ],
  });
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  mapCloudinaryVideosToExercises()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed:', error);
      process.exit(1);
    });
}
