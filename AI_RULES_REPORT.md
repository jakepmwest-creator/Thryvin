# AI Rules Report - Thryvin Fitness App

## Source of Truth Document
Generated: 2024-12-31

---

## 1. AI-Related Files Inventory

| File | Purpose |
|------|---------|
| `server/ai-coach-service.ts` | Main coach chat API - handles user messages |
| `server/ai-workout-generator.ts` | Generates daily workouts from split plan |
| `server/split-planner.ts` | Weekly workout structure planning |
| `server/ai-user-context.ts` | Builds user context for AI prompts |
| `server/coach-memory.ts` | Coach personality styles & context modes |
| `server/coach-action-contract.ts` | Zod schema for deterministic coach actions |
| `server/learning-engine.ts` | Adaptive learning from user behavior |
| `server/ai-learning-service.ts` | AI suggestion refinement |
| `server/ai-exercise-swap.ts` | Exercise substitution logic |
| `server/coach-insights.ts` | Daily insight generation |

---

## 2. Enforced Rules (HARDCODED)

### A. Split Planning Rules (`split-planner.ts`)
- ✅ Training days = ACTUAL gym sessions, NOT active recovery
- ✅ All major muscle groups (Chest, Back, Legs, Shoulders, Arms) must be trained weekly
- ✅ Active recovery ONLY on rest days
- ✅ Max 2 consecutive heavy training days
- ✅ 48+ hours between same muscle group

### B. Workout Generation Rules (`ai-workout-generator.ts`)
- ✅ Warmup (3-5 exercises) → Main (6-8 exercises) → Cooldown (2-3 exercises)
- ✅ Exercises must match user's equipment access
- ✅ Respect injury avoidances (no shoulder press for shoulder injuries)
- ✅ Progressive overload tracking

### C. Coach Chat Rules (`ai-coach-service.ts`)
- ✅ Must stay fitness-focused (keyword filter enforced)
- ✅ Non-fitness topics get polite redirect
- ✅ Response lengths vary by context mode:
  - `in_workout`: 100 tokens (short, actionable)
  - `home`: 60 tokens (one-liner)
  - `post_workout`: 150 tokens
  - `chat`: 400 tokens

### D. Action Contract Rules (`coach-action-contract.ts`)
- ✅ Only these actions allowed: `add_workout_session`, `swap_today_workout_type`, `move_workout_to_day`, `replace_exercise`, `adjust_session_duration`, `mark_rest_day`, `regenerate_today_workout`, `cancel_action`, `add_exercise`, `remove_exercise`
- ✅ Confidence threshold < 0.75 → ask clarification
- ✅ Pending actions expire after 60 seconds
- ✅ User rejection invalidates pending action

---

## 3. Soft Preferences (LEARNED)

### A. Learning Engine (`learning-engine.ts`)
- `progressionPace`: slow/medium/fast - affects weight suggestion phrasing
- `prefersConfirmation`: 0-1 scale - ask before changes if high
- `recoveryNeed`: 0-1 scale - factor in rest recommendations
- `movementConfidence`: per-movement confidence scores
- `recentDeclines`: track rejected suggestions to avoid repetition

### B. Coach Personality (`coach-memory.ts`)
- `aggressive`: Direct, challenging tone
- `disciplined`: Structured, no-nonsense
- `friendly`: Warm, encouraging (DEFAULT)
- `calm`: Patient, gentle

---

## 4. Priority Order

1. **User Safety** - Injury avoidances always respected
2. **User Explicit Request** - Direct commands override AI suggestions
3. **Enforced Rules** - Hardcoded split/workout rules
4. **Learned Preferences** - Soft adjustments based on behavior
5. **AI Suggestions** - Lowest priority, always overridable

---

## 5. Known Limitations

1. **No Nutrition AI** - Meal planning is template-based, not AI-generated
2. **Video Mapping** - Exercise-to-video matching uses name similarity, not perfect
3. **Session Dependency** - Coach chat requires session cookies for personalization
4. **Offline Mode** - AI features require network connection

---

## 6. Confirmation: AI Does NOT Touch Auth

✅ **VERIFIED**: The following routes have NO AI middleware:
- `/api/auth/register` - Pure database write
- `/api/auth/login` - Passport.js authentication
- `/api/auth/logout` - Session cleanup
- `/api/auth/me` - User fetch

AI services are only invoked by:
- `/api/coach/*` routes
- `/api/workouts/generate` route
- `/api/learning/*` routes

---

## 7. Response Schema Standards

### Registration Response
```json
{
  "ok": true,
  "user": { "id": number, "name": string, "email": string, ... }
}
// OR on error:
{
  "error": "Error message string"
}
```

### Coach Chat Response
```json
{
  "response": "AI message string",
  "coach": "Coach Name",
  "contextUsed": boolean
}
```

### Health Check Response
```json
{
  "ok": true,
  "timestamp": "ISO date",
  "features": { ... }
}
```

---

## 8. No Contradictions Found

All AI files follow consistent patterns:
- Split planner outputs → Workout generator consumes
- User context builds → Coach service uses
- Learning events log → Tendencies update → Coach adapts

No circular dependencies or conflicting logic identified.
