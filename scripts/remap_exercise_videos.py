#!/usr/bin/env python3
"""
Smart Exercise-Video Re-mapping Script
--------------------------------------
This script analyzes all Cloudinary video filenames and matches them
to the correct exercises using fuzzy string matching.

It will:
1. Extract video names from all Cloudinary URLs in the database
2. Find the best matching exercise for each video using similarity scoring
3. Update the database with corrected video URLs
4. Report on exercises that still need videos (placeholders)
"""

import os
import re
import json
import asyncio
from collections import defaultdict
from rapidfuzz import fuzz, process

# Database connection
DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://neondb_owner:npg_FK7JHnlcfrb5@ep-proud-rice-abv16qb2-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require')

try:
    import asyncpg
except ImportError:
    print("Installing asyncpg...")
    os.system("pip install asyncpg -q")
    import asyncpg


def normalize_name(name: str) -> str:
    """Normalize a name for comparison"""
    if not name:
        return ""
    # Remove common prefixes/suffixes and normalize
    name = name.lower()
    name = re.sub(r'_[a-z0-9]{6}$', '', name)  # Remove hash suffix
    name = re.sub(r'^\d+-', '', name)  # Remove leading numbers like "06621201-"
    name = re.sub(r'[-_]', ' ', name)  # Replace - and _ with spaces
    name = re.sub(r'\s+', ' ', name).strip()  # Normalize whitespace
    
    # Remove common suffixes that don't help matching
    for suffix in ['female', 'male', 'm chest', 'f chest', 'hips', 'shoulders', 'back', 'arms']:
        if name.endswith(suffix):
            name = name[:-len(suffix)].strip()
    
    return name


def extract_video_name_from_url(url: str) -> str:
    """Extract clean video name from Cloudinary URL"""
    if not url or 'cloudinary' not in url.lower():
        return None
    
    parts = url.split('/')
    if not parts:
        return None
    
    filename = parts[-1].replace('.mp4', '').replace('.webm', '')
    return filename


def calculate_match_score(exercise_name: str, video_name: str) -> float:
    """Calculate how well a video matches an exercise"""
    ex_norm = normalize_name(exercise_name)
    vid_norm = normalize_name(video_name)
    
    if not ex_norm or not vid_norm:
        return 0
    
    # Multiple matching strategies
    scores = []
    
    # 1. Full string similarity
    scores.append(fuzz.ratio(ex_norm, vid_norm))
    
    # 2. Token set ratio (order-independent word matching)
    scores.append(fuzz.token_set_ratio(ex_norm, vid_norm))
    
    # 3. Partial ratio (substring matching)
    scores.append(fuzz.partial_ratio(ex_norm, vid_norm))
    
    # 4. Token sort ratio
    scores.append(fuzz.token_sort_ratio(ex_norm, vid_norm))
    
    # Weight towards token_set_ratio which handles word variations well
    weighted_score = (scores[0] * 0.2 + scores[1] * 0.4 + scores[2] * 0.2 + scores[3] * 0.2)
    
    return weighted_score


async def main():
    print("=" * 60)
    print("EXERCISE-VIDEO RE-MAPPING SCRIPT")
    print("=" * 60)
    print()
    
    # Connect to database
    print("Connecting to database...")
    conn = await asyncpg.connect(DATABASE_URL)
    
    # Fetch all exercises
    print("Fetching all exercises...")
    exercises = await conn.fetch("""
        SELECT id, name, slug, video_url 
        FROM exercises 
        ORDER BY id
    """)
    print(f"Found {len(exercises)} exercises")
    
    # Separate exercises by video status
    cloudinary_exercises = []
    placeholder_exercises = []
    no_video_exercises = []
    
    # Build a map of video_name -> full_url (collect ALL cloudinary URLs)
    all_cloudinary_videos = {}  # video_name -> {url, original_exercise_id, original_exercise_name}
    
    for ex in exercises:
        url = ex['video_url'] or ''
        if 'cloudinary' in url.lower():
            cloudinary_exercises.append(ex)
            video_name = extract_video_name_from_url(url)
            if video_name:
                all_cloudinary_videos[video_name] = {
                    'url': url,
                    'original_id': ex['id'],
                    'original_name': ex['name']
                }
        elif 'thryvin.com' in url.lower():
            placeholder_exercises.append(ex)
        else:
            no_video_exercises.append(ex)
    
    print(f"\nVideo Status:")
    print(f"  ✅ Cloudinary videos: {len(cloudinary_exercises)}")
    print(f"  ⚠️  Placeholder URLs: {len(placeholder_exercises)}")
    print(f"  ❌ No video: {len(no_video_exercises)}")
    print(f"\nUnique Cloudinary videos available: {len(all_cloudinary_videos)}")
    
    # STEP 1: Re-map Cloudinary videos to their BEST matching exercise
    print("\n" + "=" * 60)
    print("STEP 1: Re-mapping Cloudinary videos to best matching exercises")
    print("=" * 60)
    
    # For each video, find the BEST matching exercise
    video_to_best_exercise = {}  # video_name -> (best_exercise_id, score, exercise_name)
    
    all_exercise_names = [(ex['id'], ex['name'], ex['slug']) for ex in exercises]
    
    for video_name, video_info in all_cloudinary_videos.items():
        best_match = None
        best_score = 0
        
        for ex_id, ex_name, ex_slug in all_exercise_names:
            score = calculate_match_score(ex_name, video_name)
            if score > best_score:
                best_score = score
                best_match = (ex_id, ex_name)
        
        if best_match:
            video_to_best_exercise[video_name] = {
                'exercise_id': best_match[0],
                'exercise_name': best_match[1],
                'score': best_score,
                'video_url': video_info['url'],
                'original_exercise_id': video_info['original_id'],
                'original_exercise_name': video_info['original_name']
            }
    
    # Find corrections needed (where best match differs from current assignment)
    corrections = []
    for video_name, match_info in video_to_best_exercise.items():
        if match_info['exercise_id'] != match_info['original_exercise_id']:
            # Check if this is a meaningful improvement
            original_score = calculate_match_score(match_info['original_exercise_name'], video_name)
            if match_info['score'] > original_score + 10:  # Significant improvement
                corrections.append({
                    'video_name': video_name,
                    'video_url': match_info['video_url'],
                    'current_exercise': match_info['original_exercise_name'],
                    'current_exercise_id': match_info['original_exercise_id'],
                    'better_exercise': match_info['exercise_name'],
                    'better_exercise_id': match_info['exercise_id'],
                    'old_score': original_score,
                    'new_score': match_info['score']
                })
    
    print(f"\nFound {len(corrections)} videos that should be reassigned:")
    for c in corrections[:30]:
        print(f"\n  Video: {c['video_name']}")
        print(f"  Current: {c['current_exercise']} (score: {c['old_score']:.0f})")
        print(f"  Better:  {c['better_exercise']} (score: {c['new_score']:.0f})")
    
    # STEP 2: Find videos for placeholder exercises
    print("\n" + "=" * 60)
    print("STEP 2: Finding videos for exercises with placeholders")
    print("=" * 60)
    
    # Build reverse map: exercise_id -> best video
    exercise_to_video = {}  # exercise_id -> video_url
    
    # First, assign videos to their BEST matching exercises
    for video_name, match_info in video_to_best_exercise.items():
        ex_id = match_info['exercise_id']
        score = match_info['score']
        
        # Only assign if score is decent (>60) and better than existing
        if score >= 60:
            if ex_id not in exercise_to_video or score > exercise_to_video[ex_id]['score']:
                exercise_to_video[ex_id] = {
                    'url': match_info['video_url'],
                    'score': score,
                    'video_name': video_name
                }
    
    # Find matches for placeholder exercises
    placeholder_matches = []
    still_missing = []
    
    for ex in placeholder_exercises:
        if ex['id'] in exercise_to_video:
            match = exercise_to_video[ex['id']]
            placeholder_matches.append({
                'exercise_id': ex['id'],
                'exercise_name': ex['name'],
                'new_video_url': match['url'],
                'video_name': match['video_name'],
                'score': match['score']
            })
        else:
            # Try to find a matching video
            best_video = None
            best_score = 0
            for video_name, video_info in all_cloudinary_videos.items():
                score = calculate_match_score(ex['name'], video_name)
                if score > best_score:
                    best_score = score
                    best_video = (video_name, video_info['url'])
            
            if best_video and best_score >= 50:
                placeholder_matches.append({
                    'exercise_id': ex['id'],
                    'exercise_name': ex['name'],
                    'new_video_url': best_video[1],
                    'video_name': best_video[0],
                    'score': best_score
                })
            else:
                still_missing.append({
                    'id': ex['id'],
                    'name': ex['name'],
                    'best_score': best_score,
                    'best_video': best_video[0] if best_video else None
                })
    
    print(f"\nPlaceholder exercises that can get videos: {len(placeholder_matches)}")
    for m in placeholder_matches[:20]:
        print(f"  {m['exercise_name']} → {m['video_name']} (score: {m['score']:.0f})")
    
    print(f"\nExercises that will remain without videos: {len(still_missing)}")
    for m in still_missing[:20]:
        print(f"  {m['name']} (best match: {m['best_video']} at {m['best_score']:.0f})")
    
    # STEP 3: Apply updates to database
    print("\n" + "=" * 60)
    print("STEP 3: Applying updates to database")
    print("=" * 60)
    
    updates_applied = 0
    
    # Apply corrections (reassign videos to better matching exercises)
    for c in corrections:
        try:
            await conn.execute("""
                UPDATE exercises 
                SET video_url = $1 
                WHERE id = $2
            """, c['video_url'], c['better_exercise_id'])
            updates_applied += 1
            print(f"  ✅ Reassigned video to: {c['better_exercise']}")
        except Exception as e:
            print(f"  ❌ Error updating {c['better_exercise']}: {e}")
    
    # Apply placeholder fixes
    for m in placeholder_matches:
        try:
            await conn.execute("""
                UPDATE exercises 
                SET video_url = $1 
                WHERE id = $2
            """, m['new_video_url'], m['exercise_id'])
            updates_applied += 1
            print(f"  ✅ Added video to: {m['exercise_name']}")
        except Exception as e:
            print(f"  ❌ Error updating {m['exercise_name']}: {e}")
    
    # Close connection
    await conn.close()
    
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Total updates applied: {updates_applied}")
    print(f"Video reassignments: {len(corrections)}")
    print(f"Placeholder fixes: {len(placeholder_matches)}")
    print(f"Still missing videos: {len(still_missing)}")
    print("\nDone!")


if __name__ == "__main__":
    asyncio.run(main())
