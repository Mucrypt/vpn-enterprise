#!/bin/bash
# ==============================================
# Fix NexusAI 422 Error - Add API Keys & Deploy
# ==============================================
set -e

SERVER="root@157.180.123.240"
DEPLOY_PATH="/opt/vpn-enterprise"

echo "🔧 Fixing NexusAI 422 Error..."
echo ""

# Check if OpenAI API key is provided
if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ Error: OPENAI_API_KEY environment variable not set"
    echo ""
    echo "Usage:"
    echo "  export OPENAI_API_KEY='sk-...'"
    echo "  ./fix-nexusai-422-error.sh"
    echo ""
    exit 1
fi

echo "✅ OpenAI API key found (${#OPENAI_API_KEY} characters)"
echo ""

# Step 1: Upload updated Python API code
echo "📤 Step 1: Uploading fixed Python API code..."
rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '__pycache__' \
    --exclude '*.pyc' \
    flask/ $SERVER:$DEPLOY_PATH/flask/

echo ""
echo "✅ Code uploaded"
echo ""

# Step 2: Set environment variable on server
echo "🔐 Step 2: Setting OPENAI_API_KEY on production..."

# Create temporary env file with the API key
TMP_ENV=$(mktemp)
echo "OPENAI_API_KEY=${OPENAI_API_KEY}" > "$TMP_ENV"

# Upload and merge with existing .env.production
ssh $SERVER "cd /opt/vpn-enterprise && \
    # Backup existing .env.production
    if [ -f .env.production ]; then
        cp .env.production .env.production.backup.\$(date +%Y%m%d_%H%M%S)
    fi
    
    # Remove old OPENAI_API_KEY lines
    grep -v '^OPENAI_API_KEY=' .env.production 2>/dev/null > .env.production.tmp || touch .env.production.tmp
    mv .env.production.tmp .env.production
"

# Upload the new key
scp "$TMP_ENV" $SERVER:/tmp/openai_key.env
ssh $SERVER "cat /tmp/openai_key.env >> /opt/vpn-enterprise/.env.production && \
    cat /tmp/openai_key.env >> /opt/vpn-enterprise/infrastructure/docker/config/app.prod.env && \
    rm /tmp/openai_key.env"

# Clean up
rm "$TMP_ENV"

echo "✅ OPENAI_API_KEY configured"

echo ""

# Step 3: Restart Python API container
echo "🔄 Step 3: Restarting Python API container..."
ssh $SERVER "cd $DEPLOY_PATH/infrastructure/docker && \
    docker compose -f docker-compose.prod.yml restart vpn-python-api
"

echo ""
echo "⏳ Waiting for service to start..."
sleep 5

# Step 4: Verify service is running
echo ""
echo "🧪 Step 4: Verifying service health..."
ssh $SERVER "docker exec vpn-python-api curl -s http://localhost:5001/health | python3 -m json.tool"

echo ""
echo "✅ Service is healthy!"
echo ""

# Step 5: Check for API key warning
echo "🔍 Step 5: Checking for API key warnings..."
API_KEY_WARNING=$(ssh $SERVER "docker logs vpn-python-api --tail 20 2>&1 | grep 'NO AI API KEYS' || echo 'not found'")

if [ "$API_KEY_WARNING" == "not found" ]; then
    echo "✅ No API key warnings - configuration successful!"
else
    echo "⚠️ Still seeing API key warning:"
    echo "$API_KEY_WARNING"
    echo ""
    echo "This might be from a previous start. Check current logs:"
    echo "  ssh $SERVER 'docker logs vpn-python-api --tail 50'"
fi

echo ""
echo "=================================================="
echo " ✅ NexusAI Fix Deployment Complete!"
echo "=================================================="
echo ""
echo "Changes made:"
echo "  1. Reduced description validation: 10 chars → 3 chars"
echo "  2. Increased max length: 2000 → 5000 chars"
echo "  3. Added detailed validation error logging"
echo "  4. Configured OPENAI_API_KEY environment variable"
echo ""
echo "Test the fix:"
echo "  1. Visit https://chatbuilds.com/nexusai"
echo "  2. Enter any app description (min 3 characters)"
echo "  3. Click 'Generate App'"
echo ""
echo "Troubleshooting commands:"
echo "  # View recent logs"
echo "  ssh $SERVER 'docker logs vpn-python-api --tail 100'"
echo ""
echo "  # View live logs"
echo "  ssh $SERVER 'docker logs -f vpn-python-api'"
echo ""
echo "  # Check environment variables"
echo "  ssh $SERVER 'docker exec vpn-python-api env | grep API_KEY'"
echo ""
