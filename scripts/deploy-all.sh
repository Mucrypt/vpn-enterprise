#!/bin/bash

# ==============================================
# VPN Enterprise - Deploy All to Vercel
# ==============================================
# This script deploys both the API and Dashboard to Vercel production

set -e

echo "🚀 VPN Enterprise - Production Deployment"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Deploy API
echo -e "${BLUE}📡 Deploying API...${NC}"
cd packages/api
vercel --prod --yes
echo -e "${GREEN}✅ API deployed successfully${NC}"
echo ""

# Deploy Dashboard
echo -e "${BLUE}🎨 Deploying Dashboard...${NC}"
cd ../../apps/web-dashboard
vercel --prod --yes
echo -e "${GREEN}✅ Dashboard deployed successfully${NC}"
echo ""

# Return to root
cd ../..

echo "=========================================="
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo ""
echo "Production URLs:"
echo "  📡 API: https://vpn-enterprise-api.vercel.app"
echo "  🎨 Dashboard: https://vpn-enterprise-dashboard.vercel.app"
echo ""
echo "💡 Remember to:"
echo "  1. Clear browser cache (Ctrl+Shift+R)"
echo "  2. Wait ~30 seconds for global propagation"
echo ""
