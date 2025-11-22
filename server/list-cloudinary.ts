import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function listFolders() {
  console.log('🔍 Exploring Cloudinary structure...\n');
  
  try {
    // List root folders
    console.log('📁 ROOT FOLDERS:');
    const rootFolders = await cloudinary.api.root_folders();
    rootFolders.folders.forEach((folder: any) => {
      console.log(`  - ${folder.name} (${folder.path})`);
    });
    
    // Try to list folders in Workout-Vids
    console.log('\n📁 WORKOUT-VIDS SUBFOLDERS:');
    try {
      const subFolders = await cloudinary.api.sub_folders('Workout-Vids');
      subFolders.folders.forEach((folder: any) => {
        console.log(`  - ${folder.name} (${folder.path})`);
      });
    } catch (e: any) {
      console.log(`  Error: ${e.message}`);
    }
    
    // List some videos (first 10)
    console.log('\n🎥 SAMPLE VIDEOS (first 10):');
    const videos = await cloudinary.api.resources({
      type: 'upload',
      resource_type: 'video',
      max_results: 10,
    });
    
    videos.resources.forEach((video: any) => {
      console.log(`  - ${video.public_id}`);
      console.log(`    URL: ${video.secure_url}`);
      console.log(`    Format: ${video.format}`);
      console.log('');
    });
    
    console.log(`\nTotal videos in account: ${videos.total_count || 'Unknown'}`);
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

listFolders();
