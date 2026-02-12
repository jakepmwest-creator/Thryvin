#!/bin/bash
LOG_FILE="/tmp/cloudflared.log"
URL_FILE="/tmp/tunnel_url.txt"

while true; do
    echo "$(date): Starting Cloudflare tunnel on port 8001..." >> $LOG_FILE
    
    /app/cloudflared tunnel --url http://localhost:8001 --no-tls-verify 2>&1 | tee -a $LOG_FILE | while read line; do
        URL=$(echo "$line" | grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com')
        if [ -n "$URL" ]; then
            echo "$URL" > $URL_FILE
            echo "$(date): Tunnel URL: $URL" >> $LOG_FILE
        fi
    done
    
    echo "$(date): Cloudflare tunnel died, restarting in 3 seconds..." >> $LOG_FILE
    sleep 3
done
