import 'dotenv/config';
import { db } from './db';
import { exercises } from '../shared/schema';

async function checkKeyExercises() {
  const keyExercises = ['Deadlift', 'Squat', 'Squats', 'Bench Press', 'Pull-ups', 'Push-ups', 'Barbell Deadlift', 'Cable Deadlift', 'Band Deadlift'];

  const results = await db.select().from(exercises);

  console.log('\n🔍 Checking key exercises:');
  for (const name of keyExercises) {
    const ex = results.find(e => e.name === name);
    if (ex) {
      console.log(`  ${ex.videoUrl ? '✅' : '❌'} ${name}: ${ex.videoUrl ? ex.videoUrl.substring(0, 60) + '...' : 'NO VIDEO'}`);
    } else {
      console.log(`  ⚠️  ${name}: NOT IN DATABASE`);
    }
  }

  console.log('\n❌ Exercises without videos (first 50):');
  const noVideo = results.filter(e => !e.videoUrl).slice(0, 50);
  noVideo.forEach(e => console.log(`  - ${e.name}`));
  
  console.log(`\n📊 Summary:`);
  console.log(`  Total exercises: ${results.length}`);
  console.log(`  With videos: ${results.filter(e => e.videoUrl).length}`);
  console.log(`  Without videos: ${results.filter(e => !e.videoUrl).length}`);
}

checkKeyExercises()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
