import { db } from './db';
import { sql } from 'drizzle-orm';

async function createTables() {
  try {
    // Create ai_learning_events table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS ai_learning_events (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        event_type TEXT NOT NULL,
        context_mode TEXT,
        topic TEXT,
        payload JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    console.log('✅ Created ai_learning_events');
    
    // Create indexes
    await db.execute(sql`CREATE INDEX IF NOT EXISTS ai_learning_events_user_id_idx ON ai_learning_events(user_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS ai_learning_events_event_type_idx ON ai_learning_events(event_type)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS ai_learning_events_created_at_idx ON ai_learning_events(created_at)`);
    console.log('✅ Created ai_learning_events indexes');
    
    // Create user_tendencies table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_tendencies (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        progression_pace TEXT DEFAULT 'moderate',
        prefers_confirmation TEXT DEFAULT '0.5',
        confidence_with_load TEXT DEFAULT '0.5',
        movement_confidence JSONB,
        swap_frequency TEXT DEFAULT '0.5',
        adherence_pattern JSONB,
        preferred_rep_style JSONB,
        recovery_need TEXT DEFAULT '0.5',
        recent_declines JSONB,
        last_updated TIMESTAMP DEFAULT NOW() NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    console.log('✅ Created user_tendencies');
    
    await db.execute(sql`CREATE INDEX IF NOT EXISTS user_tendencies_user_id_idx ON user_tendencies(user_id)`);
    console.log('✅ Created user_tendencies indexes');
    
    // Create coach_nudges table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS coach_nudges (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        nudge_type TEXT NOT NULL,
        priority INTEGER DEFAULT 5,
        message TEXT NOT NULL,
        actions JSONB,
        context JSONB,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        seen_at TIMESTAMP,
        resolved_at TIMESTAMP,
        resolution TEXT
      )
    `);
    console.log('✅ Created coach_nudges');
    
    await db.execute(sql`CREATE INDEX IF NOT EXISTS coach_nudges_user_id_idx ON coach_nudges(user_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS coach_nudges_nudge_type_idx ON coach_nudges(nudge_type)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS coach_nudges_expires_at_idx ON coach_nudges(expires_at)`);
    console.log('✅ Created coach_nudges indexes');
    
    console.log('🎉 All Phase 11 tables created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    process.exit(1);
  }
}

createTables();
