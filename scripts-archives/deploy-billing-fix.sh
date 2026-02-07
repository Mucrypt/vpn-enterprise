#!/bin/bash

# VPN Enterprise - Quick Billing Fix Deployment Script
# This script deploys the billing fixes to production

set -e  # Exit on error

echo "🚀 VPN Enterprise - Billing Service Deployment"
echo "=============================================="
echo ""

# Get the script's directory and navigate to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"

echo "📂 Project directory: $PROJECT_ROOT"
echo ""

# Check if we're in a valid VPN Enterprise directory
if [ ! -f "$PROJECT_ROOT/package.json" ] || [ ! -d "$PROJECT_ROOT/packages/api" ]; then
    echo "❌ ERROR: This doesn't appear to be a VPN Enterprise project directory"
    echo "Expected to find package.json and packages/api directory"
    exit 1
fi

# Navigate to project root
cd "$PROJECT_ROOT"

echo "📋 Step 1: Checking environment variables..."
if [ -f ".env.production" ]; then
    if ! grep -q "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" .env.production; then
        echo "⚠️  Warning: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY not found in .env.production"
        echo "Continuing anyway, but Stripe integration may not work"
    else
        echo "✅ Environment variables configured"
    fi
else
    echo "⚠️  Warning: .env.production not found"
    echo "Continuing anyway, but environment may need configuration"
fi
echo ""

echo "📋 Step 2: Building API..."
cd "$PROJECT_ROOT/packages/api"
npm run build
if [ $? -ne 0 ]; then
    echo "❌ ERROR: API build failed"
    exit 1
fi
echo "✅ API built successfully"
echo ""

cd "$PROJECT_ROOT"

echo "📋 Step 3: Stopping containers..."
cd "$PROJECT_ROOT/infrastructure/docker"

# Detect which compose file to use
if [ -f "docker-compose.prod.yml" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
    echo "Using production compose file: $COMPOSE_FILE"
elif [ -f "docker-compose.yml" ]; then
    COMPOSE_FILE="docker-compose.yml"
    echo "Using compose file: $COMPOSE_FILE"
else
    echo "❌ ERROR: No docker-compose file found"
    exit 1
fi

docker compose -f "$COMPOSE_FILE" down
echo "✅ Containers stopped"
echo ""

echo "📋 Step 4: Rebuilding containers..."
docker compose -f "$COMPOSE_FILE" build --no-cache api web
echo "✅ Containers rebuilt"
echo ""

echo "📋 Step 5: Starting services..."
docker compose -f "$COMPOSE_FILE" up -d
echo "✅ Services started"
echo ""

echo "📋 Step 6: Waiting for services to be healthy..."
sleep 10

# Check if containers are running
if docker compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
    echo "✅ Services are running"
else
    echo "❌ ERROR: Some services failed to start"
    docker compose -f "$COMPOSE_FILE" ps
    echo ""
    echo "Check logs with: docker compose -f $COMPOSE_FILE logs -f"
    exit 1
fi
echo ""

echo "📋 Step 7: Verifying endpoints..."
sleep 5

# Test API health (try both internal and external)
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ API is healthy (localhost:3000)"
elif curl -f http://localhost:5000/health > /dev/null 2>&1; then
    echo "✅ API is healthy (localhost:5000)"
else
    echo "⚠️  Warning: API health check failed (this may be normal if using nginx proxy)"
fi

# Test billing endpoints
if curl -f http://localhost:3000/api/v1/billing/services > /dev/null 2>&1; then
    echo "✅ Billing services endpoint is responding"
elif curl -f http://localhost:5000/api/v1/billing/services > /dev/null 2>&1; then
    echo "✅ Billing services endpoint is responding"
else
    echo "⚠️  Warning: Billing services endpoint not responding (check via nginx)"
fi

echo ""
echo "=============================================="
echo "✨ Deployment Complete!"
echo "=============================================="
echo ""
echo "📊 Service Status:"
docker compose -f "$COMPOSE_FILE" ps
echo ""
echo "📝 Next Steps:"
echo "1. Visit https://chatbuilds.com/dashboard/billing"
echo "2. Check browser console for any errors"
echo "3. Test the complete payment flow"
echo ""
echo "📖 Full deployment guide: $PROJECT_ROOT/BILLING_DEPLOYMENT_GUIDE.md"
echo ""
echo "🔍 To view logs:"
echo "   cd $PROJECT_ROOT/infrastructure/docker"
echo "   docker compose -f $COMPOSE_FILE logs -f api"
echo "   docker compose -f $COMPOSE_FILE logs -f web"
echo ""
