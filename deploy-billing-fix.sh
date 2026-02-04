#!/bin/bash

# VPN Enterprise - Quick Billing Fix Deployment Script
# This script deploys the billing fixes to production

set -e  # Exit on error

echo "🚀 VPN Enterprise - Billing Service Deployment"
echo "=============================================="
echo ""

# Check if running on Hetzner server
if [ ! -d "/home/mukulah/vpn-enterprise" ]; then
    echo "⚠️  Warning: Not running from expected directory"
    echo "Current directory: $(pwd)"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Navigate to project root
cd /home/mukulah/vpn-enterprise

echo "📋 Step 1: Checking environment variables..."
if ! grep -q "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" .env.production; then
    echo "❌ ERROR: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY not found in .env.production"
    echo "Please add your Stripe keys to .env.production before deploying"
    exit 1
fi
echo "✅ Environment variables configured"
echo ""

echo "📋 Step 2: Building API..."
cd packages/api
npm run build
if [ $? -ne 0 ]; then
    echo "❌ ERROR: API build failed"
    exit 1
fi
echo "✅ API built successfully"
echo ""

cd ../..

echo "📋 Step 3: Stopping containers..."
cd infrastructure/docker
docker-compose down
echo "✅ Containers stopped"
echo ""

echo "📋 Step 4: Rebuilding containers..."
docker-compose build --no-cache api web-dashboard
echo "✅ Containers rebuilt"
echo ""

echo "📋 Step 5: Starting services..."
docker-compose up -d
echo "✅ Services started"
echo ""

echo "📋 Step 6: Waiting for services to be healthy..."
sleep 10

# Check if containers are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ Services are running"
else
    echo "❌ ERROR: Some services failed to start"
    docker-compose ps
    echo ""
    echo "Check logs with: docker-compose logs -f"
    exit 1
fi
echo ""

echo "📋 Step 7: Verifying endpoints..."
sleep 5

# Test API health
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ API is healthy"
else
    echo "⚠️  Warning: API health check failed"
fi

# Test billing endpoints
if curl -f http://localhost:3000/api/v1/billing/services > /dev/null 2>&1; then
    echo "✅ Billing services endpoint is responding"
else
    echo "⚠️  Warning: Billing services endpoint not responding"
fi

echo ""
echo "=============================================="
echo "✨ Deployment Complete!"
echo "=============================================="
echo ""
echo "📊 Service Status:"
docker-compose ps
echo ""
echo "📝 Next Steps:"
echo "1. Visit https://chatbuilds.com/dashboard/billing"
echo "2. Check browser console for any errors"
echo "3. Test the complete payment flow"
echo ""
echo "📖 Full deployment guide: BILLING_DEPLOYMENT_GUIDE.md"
echo ""
echo "🔍 To view logs:"
echo "   docker-compose logs -f api"
echo "   docker-compose logs -f web-dashboard"
echo ""
