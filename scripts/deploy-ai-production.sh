#!/bin/bash
# Deploy production-ready AI service to handle billions of users

set -e

echo "🚀 Deploying Production AI Service..."

# Configuration
SERVER="root@157.180.123.240"
REMOTE_PATH="/opt/vpn-enterprise"
LOCAL_PATH="$(cd "$(dirname "$0")/.." && pwd)"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Step 1: Upload production Flask API
echo -e "${YELLOW}Step 1/6: Uploading production Flask API...${NC}"
scp "$LOCAL_PATH/flask/app_production.py" "$SERVER:$REMOTE_PATH/flask/"
echo -e "${GREEN}✓ Flask API uploaded${NC}"

# Step 2: Upload database migration
echo -e "${YELLOW}Step 2/6: Uploading database schema migration...${NC}"
scp "$LOCAL_PATH/packages/database/migrations/ai-service-schema.sql" "$SERVER:/tmp/"
echo -e "${GREEN}✓ Migration uploaded${NC}"

# Step 3: Run database migration
echo -e "${YELLOW}Step 3/6: Running database migration...${NC}"
ssh "$SERVER" << 'ENDSSH'
docker exec vpn-postgres psql -U platform_admin -d platform_db -f /tmp/ai-service-schema.sql
echo "✓ Migration completed"

# Verify tables created
echo "Verifying AI service tables..."
docker exec vpn-postgres psql -U platform_admin -d platform_db -c "\dt ai_*"
ENDSSH
echo -e "${GREEN}✓ Database migration completed${NC}"

# Step 4: Upload NexusAI configuration
echo -e "${YELLOW}Step 4/6: Uploading NexusAI configuration...${NC}"
scp "$LOCAL_PATH/apps/nexusAi/chat-to-code-38/.env.production.local" "$SERVER:$REMOTE_PATH/apps/nexusAi/chat-to-code-38/"
echo -e "${GREEN}✓ NexusAI config uploaded${NC}"

# Step 5: Rebuild and restart services
echo -e "${YELLOW}Step 5/6: Rebuilding services...${NC}"
ssh "$SERVER" << 'ENDSSH'
cd /opt/vpn-enterprise/infrastructure/docker

# Rebuild python-api with new production code
echo "Building python-api..."
docker compose -f docker-compose.prod.yml build python-api

# Rebuild NexusAI
echo "Building nexusai..."
docker compose -f docker-compose.prod.yml build nexusai

# Restart services
echo "Restarting services..."
docker compose -f docker-compose.prod.yml up -d python-api nexusai

# Wait for services to be healthy
echo "Waiting for services to be healthy..."
sleep 10

# Check health
docker compose -f docker-compose.prod.yml ps python-api nexusai
ENDSSH
echo -e "${GREEN}✓ Services rebuilt and restarted${NC}"

# Step 6: Pull additional AI models
echo -e "${YELLOW}Step 6/6: Pulling AI models for code generation...${NC}"
ssh "$SERVER" << 'ENDSSH'
# Pull codellama for better code generation (used by NexusAI)
echo "Pulling codellama:7b model (this may take a while)..."
docker exec vpn-ollama ollama pull codellama:7b

# List all models
echo "Available models:"
docker exec vpn-ollama ollama list
ENDSSH
echo -e "${GREEN}✓ AI models ready${NC}"

# Verification
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✨ Production Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Services:"
echo "  • Python API: https://python-api.chatbuilds.com"
echo "  • NexusAI: https://nexusai.chatbuilds.com"
echo "  • Ollama: http://157.180.123.240:11434"
echo ""
echo "Test endpoints:"
echo "  curl https://python-api.chatbuilds.com/health"
echo "  curl https://python-api.chatbuilds.com/ai/models"
echo ""
echo "Features enabled:"
echo "  ✓ JWT authentication & API key management"
echo "  ✓ Tiered rate limiting (100/1k/10k/1M req/hour)"
echo "  ✓ Response caching with TTL"
echo "  ✓ Usage tracking & billing analytics"
echo "  ✓ Multi-worker support (4 workers)"
echo "  ✓ NexusAI app generation (Lovable/Cursor-style)"
echo "  ✓ Code completion with codellama"
echo ""
echo "Next steps:"
echo "  1. Generate API keys: POST /auth/create-key"
echo "  2. Test with authentication headers"
echo "  3. Monitor usage in pgAdmin: SELECT * FROM ai_usage_analytics;"
echo "  4. Access NexusAI to build apps via chat"
echo ""
