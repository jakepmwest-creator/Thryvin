#!/bin/bash
cd /app
while true; do
  echo "$(date) - Starting backend server..."
  npx tsx server/index.ts
  EXIT_CODE=$?
  echo "$(date) - Backend exited with code $EXIT_CODE, restarting in 3 seconds..."
  sleep 3
done
