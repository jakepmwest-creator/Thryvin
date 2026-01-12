#!/bin/bash
# Backend server starter script for port 8001
# This provides a stable entry point that supervisor can manage

cd /app

# Log startup
echo "$(date): Starting backend server on port 8001..."

# Check if dist/index.js exists (production build)
if [ -f "dist/index.js" ]; then
    echo "$(date): Running production build..."
    PORT=8001 NODE_ENV=production exec node dist/index.js
else
    echo "$(date): No production build found, running dev server..."
    PORT=8001 NODE_ENV=development exec npx tsx server/index.ts
fi
