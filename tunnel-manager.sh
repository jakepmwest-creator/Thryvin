#!/bin/bash
LOG_FILE="/tmp/tunnel.log"
URL_FILE="/tmp/tunnel_url.txt"

while true; do
    echo "$(date): Starting localtunnel on port 8001..." >> $LOG_FILE
    
    # Start tunnel and capture output - USE PORT 8001 WHERE THE BACKEND RUNS
    npx localtunnel --port 8001 2>&1 | tee -a $LOG_FILE | while read line; do
        if [[ "$line" == *"your url is:"* ]]; then
            URL=$(echo "$line" | grep -oP 'https://[^ ]+')
            echo "$URL" > $URL_FILE
            echo "$(date): Tunnel URL: $URL" >> $LOG_FILE
        fi
    done
    
    echo "$(date): Tunnel died, restarting in 5 seconds..." >> $LOG_FILE
    sleep 5
done
