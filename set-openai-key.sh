#!/bin/bash
# Quick script to add OpenAI API key to production

set -e

if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ Error: OPENAI_API_KEY not set"
    echo ""
    echo "Usage:"
    echo "  export OPENAI_API_KEY='sk-proj-...'"
    echo "  ./set-openai-key.sh"
    exit 1
fi

echo "🔐 Setting OPENAI_API_KEY on production..."

# Create temp file with the key
TMP_ENV=$(mktemp)
echo "OPENAI_API_KEY=${OPENAI_API_KEY}" > "$TMP_ENV"

# Upload to server
scp "$TMP_ENV" root@157.180.123.240:/tmp/openai_key.env

# Add to environment files
ssh root@157.180.123.240 "
    cd /opt/vpn-enterprise
    
    # Backup and update .env.production
    [ -f .env.production ] && cp .env.production .env.production.backup.\$(date +%Y%m%d_%H%M%S)
    grep -v '^OPENAI_API_KEY=' .env.production 2>/dev/null > .env.production.tmp || touch .env.production.tmp
    cat /tmp/openai_key.env >> .env.production.tmp
    mv .env.production.tmp .env.production
    
    # Update docker config
    cd infrastructure/docker/config
    [ -f app.prod.env ] || touch app.prod.env
    grep -v '^OPENAI_API_KEY=' app.prod.env 2>/dev/null > app.prod.env.tmp || touch app.prod.env.tmp
    cat /tmp/openai_key.env >> app.prod.env.tmp
    mv app.prod.env.tmp app.prod.env
    
    # Clean up
    rm /tmp/openai_key.env
    
    echo '✅ OPENAI_API_KEY configured'
"

# Clean up local temp file
rm "$TMP_ENV"

echo ""
echo "🔄 Restarting Python API to apply changes..."
ssh root@157.180.123.240 "cd /opt/vpn-enterprise/infrastructure/docker && docker compose -f docker-compose.prod.yml restart vpn-python-api"

echo ""
echo "⏳ Waiting for service..."
sleep 5

echo ""
echo "🧪 Checking status..."
ssh root@157.180.123.240 "docker logs vpn-python-api --tail 10 2>&1 | grep -E 'Application startup|OpenAI|API KEYS|ERROR' || echo 'Service started'"

echo ""
echo "✅ Done! Test at: https://chatbuilds.com/nexusai"
