#!/usr/bin/env python3
"""
Exercise Name Cleanup Script
----------------------------
This script cleans up exercise names that have:
- Number prefixes (like "12345-exercise-name")
- Code suffixes (like "exercise-name-1" or "exercise_3F")
- Hash codes (like "c00c7ab433332...")
- Version suffixes (like "version-2")
- Body part suffixes that should be removed (like "-chest", "-waist")

It converts them to proper readable names like "Exercise Name"
"""

import os
import re
import asyncio
import asyncpg

DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://neondb_owner:npg_FK7JHnlcfrb5@ep-proud-rice-abv16qb2-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require')

# Body parts to remove from end of names
BODY_PARTS = [
    'chest', 'back', 'shoulders', 'waist', 'hips', 'thighs', 'calves',
    'upper arms', 'upper-arms', 'forearms', 'neck', 'cardio', 'abs',
    'legs', 'arms', 'core', 'glutes', 'biceps', 'triceps', 'quadriceps',
    'hamstrings', 'deltoids', 'lats', 'traps'
]

# Gender markers to remove
GENDER_MARKERS = ['male', 'female', 'm', 'f']


def clean_exercise_name(name: str) -> str:
    """Clean up an exercise name to be human-readable"""
    original = name
    
    # Skip if it's already a clean name (no numbers at start, proper capitalization)
    if re.match(r'^[A-Z][a-z]+(\s[A-Z]?[a-z]+)*$', name) and not re.search(r'\d{4,}', name):
        return name
    
    # Step 1: Remove leading number codes (like "12345678-" or "06361201-")
    name = re.sub(r'^\d{6,}-?', '', name)
    
    # Step 2: Remove hash codes (32 char hex strings)
    name = re.sub(r'^[a-f0-9]{32}[-_]?\d*$', '', name, flags=re.IGNORECASE)
    if not name.strip():
        return original  # Can't clean hash-only names
    
    # Step 3: Remove "Youcut YYYYMMDD" patterns
    if re.match(r'^Youcut\s*\d{8}$', name, re.IGNORECASE):
        return original  # Skip these, they're not real exercise names
    
    # Step 4: Remove trailing codes like "-1", "_2", "_3F", "Green 53951201-1"
    name = re.sub(r'\s*Green\s*\d+-\d+$', '', name)  # Remove "Green 12345-1"
    name = re.sub(r'\s*\d{6,}m?$', '', name)  # Remove trailing long numbers
    name = re.sub(r'[-_]\d+[-_]?[A-Za-z]?$', '', name)  # Remove "-1" or "_2F"
    name = re.sub(r'\s+\d+$', '', name)  # Remove trailing " 1" or " 2"
    
    # Step 5: Remove version indicators
    name = re.sub(r'[-_]?version[-_]?\d+', '', name, flags=re.IGNORECASE)
    name = re.sub(r'[-_]?ver[-_]?\d+', '', name, flags=re.IGNORECASE)
    name = re.sub(r'[-_]?v\d+', '', name, flags=re.IGNORECASE)
    
    # Step 6: Remove body part suffixes
    for bp in BODY_PARTS:
        name = re.sub(rf'[-_]?{bp}[-_]?\d*$', '', name, flags=re.IGNORECASE)
    
    # Step 7: Remove gender markers at end
    for gm in GENDER_MARKERS:
        name = re.sub(rf'[-_]{gm}[-_]?$', '', name, flags=re.IGNORECASE)
    
    # Step 8: Replace dashes and underscores with spaces
    name = re.sub(r'[-_]+', ' ', name)
    
    # Step 9: Remove extra whitespace
    name = re.sub(r'\s+', ' ', name).strip()
    
    # Step 10: Proper title case
    # But preserve certain acronyms/abbreviations
    words = name.split()
    cleaned_words = []
    
    preserve_upper = {'EZ', 'JM', 'GHD', 'TRX', 'BOSU', 'PNF', 'ROM', 'RPE'}
    
    for word in words:
        upper_word = word.upper()
        if upper_word in preserve_upper:
            cleaned_words.append(upper_word)
        elif word.isupper() and len(word) > 1:
            # Convert all caps to title case
            cleaned_words.append(word.title())
        else:
            # Title case but preserve existing internal caps like "McGill"
            cleaned_words.append(word[0].upper() + word[1:] if word else '')
    
    name = ' '.join(cleaned_words)
    
    # Step 11: Fix common issues
    name = re.sub(r'\bWith\b', 'with', name)  # lowercase "with"
    name = re.sub(r'\bOn\b', 'on', name)  # lowercase "on"
    name = re.sub(r'\bTo\b', 'to', name)  # lowercase "to"
    name = re.sub(r'\bAnd\b', 'and', name)  # lowercase "and"
    name = re.sub(r'\bOf\b', 'of', name)  # lowercase "of"
    name = re.sub(r'\bThe\b', 'the', name)  # lowercase "the"
    name = re.sub(r'\bFrom\b', 'from', name)  # lowercase "from"
    name = re.sub(r'\bFor\b', 'for', name)  # lowercase "for"
    
    # Make sure first letter is capitalized
    if name:
        name = name[0].upper() + name[1:]
    
    return name if name else original


def check_for_duplicates(exercises: list, new_name: str, current_id: int) -> bool:
    """Check if the new name would create a duplicate"""
    for ex in exercises:
        if ex['id'] != current_id and ex['name'].lower() == new_name.lower():
            return True
    return False


async def main():
    print("=" * 60)
    print("EXERCISE NAME CLEANUP SCRIPT")
    print("=" * 60)
    print()
    
    conn = await asyncpg.connect(DATABASE_URL)
    
    # Fetch all exercises
    print("Fetching all exercises...")
    exercises = await conn.fetch("SELECT id, name, slug FROM exercises ORDER BY id")
    exercises = [dict(ex) for ex in exercises]
    print(f"Found {len(exercises)} exercises")
    
    # Find exercises that need cleaning
    to_clean = []
    skip_patterns = [
        r'^Youcut\s*\d{8}$',  # Skip Youcut files
        r'^[a-f0-9]{32}$',  # Skip pure hash names
    ]
    
    for ex in exercises:
        name = ex['name']
        
        # Skip if matches skip patterns
        skip = False
        for pattern in skip_patterns:
            if re.match(pattern, name, re.IGNORECASE):
                skip = True
                break
        if skip:
            continue
        
        cleaned = clean_exercise_name(name)
        
        if cleaned != name and cleaned:
            # Check for duplicates
            if not check_for_duplicates(exercises, cleaned, ex['id']):
                to_clean.append({
                    'id': ex['id'],
                    'old_name': name,
                    'new_name': cleaned
                })
    
    print(f"\nFound {len(to_clean)} exercises to clean")
    print()
    
    # Show preview
    print("=== PREVIEW OF CHANGES ===")
    for item in to_clean[:50]:
        print(f"  [{item['id']}]")
        print(f"    OLD: {item['old_name']}")
        print(f"    NEW: {item['new_name']}")
        print()
    
    if len(to_clean) > 50:
        print(f"  ... and {len(to_clean) - 50} more")
    
    # Apply changes
    print("\n=== APPLYING CHANGES ===")
    updated = 0
    errors = 0
    
    for item in to_clean:
        try:
            # Also update slug to match new name
            new_slug = item['new_name'].lower().replace(' ', '-')
            new_slug = re.sub(r'[^a-z0-9-]', '', new_slug)
            new_slug = re.sub(r'-+', '-', new_slug)
            
            await conn.execute("""
                UPDATE exercises 
                SET name = $1, slug = $2
                WHERE id = $3
            """, item['new_name'], new_slug, item['id'])
            updated += 1
        except Exception as e:
            print(f"  ❌ Error updating {item['old_name']}: {e}")
            errors += 1
    
    print(f"\n✅ Updated {updated} exercise names")
    if errors:
        print(f"❌ {errors} errors")
    
    # Delete exercises that are clearly invalid (hash-only, Youcut files)
    print("\n=== REMOVING INVALID EXERCISES ===")
    invalid = await conn.fetch("""
        SELECT id, name FROM exercises 
        WHERE name ~ '^[a-f0-9]{32}' 
        OR name ~ '^Youcut'
    """)
    
    if invalid:
        print(f"Found {len(invalid)} invalid exercises to remove:")
        for ex in invalid[:20]:
            print(f"  - {ex['name']}")
        
        await conn.execute("""
            DELETE FROM exercises 
            WHERE name ~ '^[a-f0-9]{32}' 
            OR name ~ '^Youcut'
        """)
        print(f"✅ Removed {len(invalid)} invalid exercises")
    
    await conn.close()
    print("\nDone!")


if __name__ == "__main__":
    asyncio.run(main())
