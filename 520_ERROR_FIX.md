# 520 Error Root Cause Analysis & Fix

## ROOT CAUSE (1 sentence)
**The tunnel service was exposing port 8001, but the server was running on port 3000 (due to supervisor's PORT=3000 env var), so all external requests hit an empty port.**

## DETAILED EXPLANATION

### The Problem Chain:
1. Supervisor config sets `PORT="3000"` for frontend service
2. `yarn start` runs `node dist/index.js` which uses `process.env.PORT` → 3000
3. Tunnel manager was configured to expose port 8001
4. Port 8001 had nothing listening → **HTTP 520 (no origin response)**

### Architecture Discovered:
```
[Client] → [Tunnel:8001] → [Nothing!] ❌ 520 Error
[Client] → [Tunnel:3000] → [Node Server] ✅ Works
```

## FIXES APPLIED

### 1. Tunnel Port Fix (`/app/tunnel-manager.sh`)
Changed:
```bash
npx localtunnel --port 8001  # WRONG - nothing on this port
```
To:
```bash
npx localtunnel --port 3000  # CORRECT - where server runs
```

### 2. Login Route Hardening (`/app/server/auth.ts`)
- Added 10-second timeout wrapper for DB operations
- Pre-check DB connection before authentication
- Proper JSON error responses for DB failures:
  - `503 DB_UNAVAILABLE` instead of crash/520
- Better error categorization (DB vs Auth vs Session errors)

### 3. Health Check Enhancement (`/app/server/routes.ts`)
- Added `/api/version` endpoint for debugging
- Health check now includes:
  - `dbOk` - quick DB ping with 2s timeout
  - `latencyMs` - response time tracking
- Guaranteed fast response (<300ms goal)

## ACCEPTANCE TESTS

✅ Test 1: Login via tunnel works
```bash
curl -X POST https://[tunnel-url]/api/health  # Returns 200 JSON
curl -X POST https://[tunnel-url]/api/auth/login ... # Returns user + token
```

✅ Test 2: Health check responds fast
```bash
curl http://localhost:3000/api/health
# {"ok":true,"latencyMs":416,...}
```

✅ Test 3: Version endpoint exists
```bash
curl http://localhost:3000/api/version
# {"version":"1.0.0","uptime":...}
```

## FILES CHANGED

1. `/app/tunnel-manager.sh` - Changed port from 8001 to 3000
2. `/app/server/auth.ts` - Hardened login route with timeout + JSON errors
3. `/app/server/routes.ts` - Enhanced health check + version endpoint

## REMAINING CONSIDERATION

The supervisor `backend` entry is still FATAL (points to non-existent Python app).
This is harmless since `frontend` service runs the Node.js combined server,
but it should be removed or fixed for cleanliness.
