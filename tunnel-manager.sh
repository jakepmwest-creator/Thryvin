#!/bin/bash
LOG_FILE="/tmp/tunnel.log"
URL_FILE="/tmp/tunnel_url.txt"
SUBDOMAIN="thryvin-api"
HEALTH_CHECK_INTERVAL=30

start_tunnel() {
    echo "$(date): Starting localtunnel on port 8001 with subdomain $SUBDOMAIN..." >> $LOG_FILE
    npx localtunnel --port 8001 --subdomain $SUBDOMAIN 2>&1 | tee -a $LOG_FILE | while read line; do
        if [[ "$line" == *"your url is:"* ]]; then
            URL=$(echo "$line" | grep -oP 'https://[^ ]+')
            echo "$URL" > $URL_FILE
            echo "$(date): Tunnel URL: $URL" >> $LOG_FILE
        fi
    done
}

while true; do
    start_tunnel &
    TUNNEL_PID=$!
    
    # Health check loop - restart if tunnel dies or stops responding
    sleep 10  # Give tunnel time to start
    while kill -0 $TUNNEL_PID 2>/dev/null; do
        TUNNEL_URL=$(cat $URL_FILE 2>/dev/null)
        if [ -n "$TUNNEL_URL" ]; then
            HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 -H "Bypass-Tunnel-Reminder: true" "$TUNNEL_URL/api/health" 2>/dev/null)
            if [ "$HTTP_CODE" = "000" ] || [ "$HTTP_CODE" = "408" ]; then
                echo "$(date): Health check FAILED (HTTP $HTTP_CODE) - killing tunnel" >> $LOG_FILE
                kill $TUNNEL_PID 2>/dev/null
                wait $TUNNEL_PID 2>/dev/null
                break
            fi
        fi
        sleep $HEALTH_CHECK_INTERVAL
    done
    
    echo "$(date): Tunnel died, restarting in 2 seconds..." >> $LOG_FILE
    sleep 2
done
