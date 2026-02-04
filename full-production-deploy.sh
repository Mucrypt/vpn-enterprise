#!/bin/bash
set -e

SERVER="root@157.180.123.240"
PROD_PATH="/opt/vpn-enterprise"

echo "🚀 Full Production Deployment"
echo "================================"
echo ""

# Step 1: Copy environment file
echo "📋 Step 1: Copying .env to production..."
scp .env.production ${SERVER}:${PROD_PATH}/.env
echo "✅ Environment copied"
echo ""

# Step 2: Pull latest code
echo "📥 Step 2: Pulling latest code on server..."
ssh ${SERVER} "cd ${PROD_PATH} && git pull origin main"
echo "✅ Code updated"
echo ""

# Step 3: Rebuild API container
echo "🔨 Step 3: Rebuilding API container..."
ssh ${SERVER} "cd ${PROD_PATH}/infrastructure/docker && docker compose -f docker-compose.prod.yml up -d --build --no-deps api"
echo "✅ API container rebuilt"
echo ""

# Step 4: Rebuild Web container
echo "🔨 Step 4: Rebuilding Web container..."
ssh ${SERVER} "cd ${PROD_PATH}/infrastructure/docker && docker compose -f docker-compose.prod.yml up -d --build --no-deps web"
echo "✅ Web container rebuilt"
echo ""

# Step 5: Check container status
echo "📊 Step 5: Checking container status..."
ssh ${SERVER} "cd ${PROD_PATH}/infrastructure/docker && docker compose -f docker-compose.prod.yml ps"
echo ""

echo "✅ Deployment complete!"
echo ""
echo "🧪 Test the billing page:"
echo "   https://chatbuilds.com/dashboard/billing"
echo ""
echo "📝 Check logs if needed:"
echo "   ssh ${SERVER} 'cd ${PROD_PATH}/infrastructure/docker && docker compose -f docker-compose.prod.yml logs -f api'"
echo "   ssh ${SERVER} 'cd ${PROD_PATH}/infrastructure/docker && docker compose -f docker-compose.prod.yml logs -f web'"
