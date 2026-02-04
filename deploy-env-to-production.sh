#!/bin/bash
# Deploy environment variables to production server

SERVER="root@157.180.123.240"
PROD_PATH="/opt/vpn-enterprise"

echo "🚀 Deploying environment configuration to production..."

# Copy .env file to production
echo "📋 Copying .env to server..."
scp .env.production ${SERVER}:${PROD_PATH}/.env

echo "✅ Environment deployed!"
echo ""
echo "Next steps:"
echo "1. Pull latest code: ssh ${SERVER} 'cd ${PROD_PATH} && git pull'"
echo "2. Rebuild web: ssh ${SERVER} 'cd ${PROD_PATH}/infrastructure/docker && docker compose -f docker-compose.prod.yml up -d --build --no-deps web'"
echo "3. Test: Visit https://chatbuilds.com/dashboard/billing"
