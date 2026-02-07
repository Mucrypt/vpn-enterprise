#!/bin/bash

# ============================================
# NexusAI Production Deployment Script
# ============================================
# Deploys the new production-ready NexusAI with:
# - Dual AI providers (OpenAI + Anthropic)
# - N8N automation workflows
# - Enterprise monitoring

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════╗
║   NexusAI Production Deployment              ║
╚═══════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check if running on Hetzner server
if [[ ! -f "/opt/vpn-enterprise/package.json" ]]; then
    echo -e "${RED}❌ Not on Hetzner server. Run this on 157.180.123.240${NC}"
    exit 1
fi

cd /opt/vpn-enterprise

# ============================================
# Step 1: Pull Latest Code
# ============================================
echo -e "${BLUE}📥 Step 1/7: Pulling latest code from GitHub${NC}"
git fetch origin
git pull origin main
echo -e "${GREEN}✅ Code updated${NC}\n"

# ============================================
# Step 2: Verify New Files
# ============================================
echo -e "${BLUE}🔍 Step 2/7: Verifying new files${NC}"

FILES=(
    "flask/app_nexusai_production.py"
    "flask/requirements.txt"
    "n8n-workflows/01-app-generated-notification.json"
    "n8n-workflows/02-auto-deploy-app.json"
    "n8n-workflows/03-hourly-credit-tracking.json"
    "n8n-workflows/04-error-handler.json"
)

MISSING=0
for file in "${FILES[@]}"; do
    if [[ -f "$file" ]]; then
        echo -e "${GREEN}  ✅ $file${NC}"
    else
        echo -e "${RED}  ❌ Missing: $file${NC}"
        MISSING=1
    fi
done

if [[ $MISSING -eq 1 ]]; then
    echo -e "${RED}❌ Missing required files. Please commit and push them first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All files present${NC}\n"

# ============================================
# Step 3: Check Environment Variables
# ============================================
echo -e "${BLUE}🔑 Step 3/7: Checking environment variables${NC}"

cd infrastructure/docker

if [[ ! -f ".env.production" ]] && [[ ! -f "../../.env.production" ]]; then
    echo -e "${YELLOW}⚠️  .env.production not found${NC}"
    echo "Creating from template..."
    
    cat > .env.production << 'ENVEOF'
# AI Providers
OPENAI_API_KEY=sk-proj-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key

# N8N Configuration
N8N_WEBHOOK_URL=https://chatbuilds.com/webhook
N8N_USER=admin
N8N_PASSWORD=change-this-secure-password

# Monitoring
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project

# Rate Limiting
RATE_LIMIT_FREE=10
RATE_LIMIT_PRO=100
RATE_LIMIT_ENTERPRISE=1000
ENVEOF
    
    echo -e "${YELLOW}⚠️  Created .env.production template${NC}"
    echo -e "${YELLOW}⚠️  PLEASE UPDATE API KEYS before continuing!${NC}"
    echo ""
    read -p "Press Enter after updating .env.production with real API keys..."
fi

# Check if API keys are set
source .env.production 2>/dev/null || source ../../.env.production 2>/dev/null || true

if [[ -z "$OPENAI_API_KEY" ]] || [[ "$OPENAI_API_KEY" == "sk-proj-your-openai-key" ]]; then
    echo -e "${RED}❌ OPENAI_API_KEY not set properly${NC}"
    exit 1
fi

if [[ -z "$ANTHROPIC_API_KEY" ]] || [[ "$ANTHROPIC_API_KEY" == "sk-ant-your-anthropic-key" ]]; then
    echo -e "${RED}❌ ANTHROPIC_API_KEY not set properly${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Environment variables configured${NC}\n"

# ============================================
# Step 4: Stop Existing Services
# ============================================
echo -e "${BLUE}🛑 Step 4/7: Stopping existing Python API${NC}"
docker compose -f docker-compose.prod.yml stop python-api || true
docker compose -f docker-compose.prod.yml rm -f python-api || true
echo -e "${GREEN}✅ Old service stopped${NC}\n"

# ============================================
# Step 5: Rebuild and Start Python API
# ============================================
echo -e "${BLUE}🔨 Step 5/7: Building new Python API${NC}"
echo "This may take 2-3 minutes..."

docker compose -f docker-compose.prod.yml build --no-cache python-api

echo -e "${GREEN}✅ Build complete${NC}\n"

echo -e "${BLUE}🚀 Starting Python API...${NC}"
docker compose -f docker-compose.prod.yml up -d python-api

# Wait for container to be healthy
echo -e "${YELLOW}⏳ Waiting for container to be ready...${NC}"
sleep 10

# Check if container is running
if docker ps | grep -q "vpn-python-api"; then
    echo -e "${GREEN}✅ Python API container running${NC}"
else
    echo -e "${RED}❌ Container failed to start${NC}"
    echo "Logs:"
    docker logs vpn-python-api --tail 50
    exit 1
fi

# Test health endpoint
echo -e "${YELLOW}🏥 Testing health endpoint...${NC}"
sleep 5

if curl -sf http://localhost:5001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API is healthy${NC}\n"
else
    echo -e "${YELLOW}⚠️  Health check failed (but container is running)${NC}"
    echo "Check logs: docker logs vpn-python-api"
    echo ""
fi

# ============================================
# Step 6: Start N8N Service
# ============================================
echo -e "${BLUE}⚙️  Step 6/7: Starting N8N automation service${NC}"

# Check if n8n is already in docker-compose.prod.yml
if grep -q "n8n:" docker-compose.prod.yml; then
    echo "N8N already configured in docker-compose.prod.yml"
else
    echo -e "${YELLOW}⚠️  N8N not found in docker-compose.prod.yml${NC}"
    echo "Starting from monitoring compose file..."
    docker compose -f docker-compose.monitoring.yml up -d n8n || true
fi

# Check if n8n is running
if docker ps | grep -q "n8n"; then
    N8N_CONTAINER=$(docker ps | grep n8n | awk '{print $1}')
    echo -e "${GREEN}✅ N8N is running (container: $N8N_CONTAINER)${NC}\n"
else
    echo -e "${YELLOW}⚠️  N8N not running${NC}"
    echo "You can start it manually later with:"
    echo "  docker compose -f docker-compose.monitoring.yml up -d n8n"
    echo ""
fi

# ============================================
# Step 7: Display Status and Next Steps
# ============================================
echo -e "${BLUE}📊 Step 7/7: Deployment Status${NC}\n"

echo -e "${GREEN}╔═══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     🎉 NexusAI Deployment Complete!          ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════╝${NC}"
echo ""

echo -e "📊 ${BLUE}Service Status:${NC}"
echo ""

# Check each service
services=("vpn-python-api" "n8n" "postgres" "redis")
for service in "${services[@]}"; do
    if docker ps --format '{{.Names}}' | grep -q "$service"; then
        echo -e "  ✅ ${GREEN}$service${NC} - Running"
    else
        echo -e "  ❌ ${RED}$service${NC} - Not running"
    fi
done

echo ""
echo -e "🔗 ${BLUE}Access URLs:${NC}"
echo ""
echo "  • API:       https://chatbuilds.com/api/ai/generate/app"
echo "  • N8N:       https://chatbuilds.com:5678 (or http://157.180.123.240:5678)"
echo "  • Metrics:   http://157.180.123.240:5001/metrics"
echo "  • Health:    http://157.180.123.240:5001/health"
echo ""

echo -e "📝 ${BLUE}Next Steps:${NC}"
echo ""
echo "1. Import N8N Workflows:"
echo "   • Open N8N UI: http://157.180.123.240:5678"
echo "   • Import 4 JSON files from: /opt/vpn-enterprise/n8n-workflows/"
echo ""
echo "2. Test API:"
echo "   curl -X POST http://localhost:5001/ai/generate/app \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"description\": \"Todo app with React\", \"framework\": \"react\"}'"
echo ""
echo "3. Configure Nginx (if needed):"
echo "   • Update nginx config to proxy /api/ai/* to Python API"
echo "   • Restart nginx: nginx -s reload"
echo ""
echo "4. Monitor Logs:"
echo "   • Python API: docker logs -f vpn-python-api"
echo "   • N8N: docker logs -f <n8n-container-name>"
echo ""

echo -e "${YELLOW}🔧 Troubleshooting:${NC}"
echo ""
echo "  • View logs: docker logs vpn-python-api"
echo "  • Restart API: docker compose -f docker-compose.prod.yml restart python-api"
echo "  • Check health: curl http://localhost:5001/health"
echo "  • Test generation: See test commands in NEXUSAI_DEPLOYMENT_COMPLETE.md"
echo ""

echo -e "${GREEN}✨ Deployment Complete!${NC}"
echo ""
