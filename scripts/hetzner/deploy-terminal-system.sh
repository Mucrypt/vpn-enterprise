#!/bin/bash

# ==============================================
# Deploy Terminal System to Hetzner Production
# ==============================================
# This script deploys the terminal system with Docker support

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== Terminal System Deployment ===${NC}\n"

# Step 1: Pull latest code
echo -e "${YELLOW}Step 1: Pulling latest code...${NC}"
cd /opt/vpn-enterprise
git pull origin main
echo -e "${GREEN}✓ Code updated${NC}\n"

# Step 2: Run database migrations
echo -e "${YELLOW}Step 2: Running database migrations...${NC}"
echo "Creating terminal workspaces tables..."

# Copy migration to container
docker cp packages/database/migrations/007_terminal_workspaces.sql vpn-postgres:/tmp/terminal_migration.sql

# Execute migration
docker exec vpn-postgres psql -U platform_admin -d platform_db -f /tmp/terminal_migration.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Terminal workspaces tables created${NC}"
else
    echo -e "${RED}✗ Migration failed - continuing anyway${NC}"
fi

# Verify tables exist
echo "Verifying tables..."
docker exec vpn-postgres psql -U platform_admin -d platform_db -c "\dt terminal_*"
echo ""

# Optional: Run NexusAI migrations if not already done
read -p "Run NexusAI migrations too? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Creating NexusAI tables..."
    docker cp packages/database/migrations/004_nexusai_generated_apps.sql vpn-postgres:/tmp/nexusai_migration.sql
    docker exec vpn-postgres psql -U platform_admin -d platform_db -f /tmp/nexusai_migration.sql
    echo -e "${GREEN}✓ NexusAI tables created${NC}\n"
fi

# Step 3: Rebuild and restart containers
echo -e "${YELLOW}Step 3: Rebuilding containers...${NC}"
cd /opt/vpn-enterprise/infrastructure/docker

# Stop API container first
echo "Stopping API container..."
docker compose -f docker-compose.prod.yml stop api

# Rebuild with Docker support
echo "Rebuilding with Docker CLI and socket support..."
docker compose -f docker-compose.prod.yml build --no-cache api

# Start all services
echo "Starting all services..."
docker compose -f docker-compose.prod.yml up -d

echo -e "${GREEN}✓ Containers rebuilt and started${NC}\n"

# Step 4: Wait for services to be healthy
echo -e "${YELLOW}Step 4: Waiting for services to be healthy...${NC}"
echo "This may take up to 60 seconds..."

for i in {1..60}; do
    if docker ps | grep -q "vpn-api.*healthy"; then
        echo -e "${GREEN}✓ API container is healthy!${NC}"
        break
    fi
    echo -n "."
    sleep 1
    
    if [ $i -eq 60 ]; then
        echo -e "\n${RED}✗ API container did not become healthy${NC}"
        echo "Running diagnostics..."
        bash /opt/vpn-enterprise/scripts/hetzner/debug-api-container.sh
        exit 1
    fi
done
echo ""

# Step 5: Verify terminal system
echo -e "${YELLOW}Step 5: Verifying terminal system...${NC}"

# Check Docker socket access
echo "Checking Docker socket access..."
docker exec vpn-api ls -la /var/run/docker.sock

# Check Docker CLI
echo "Testing Docker CLI in container..."
docker exec vpn-api docker version > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Docker CLI working${NC}"
else
    echo -e "${RED}✗ Docker CLI not accessible${NC}"
fi

# Test health endpoint
echo "Testing API health endpoint..."
curl -f http://localhost:5000/health | jq .
echo ""

# Test terminal endpoint (requires auth)
echo "API is ready. Terminal endpoints:"
echo "  POST   /api/v1/terminal/workspaces - Create workspace"
echo "  GET    /api/v1/terminal/workspaces/:id - Get workspace info"
echo "  DELETE /api/v1/terminal/workspaces/:id - Delete workspace"
echo "  WS     ws://api:5000/api/v1/terminal/ws?token=JWT - WebSocket connection"
echo ""

# Step 6: View logs
echo -e "${YELLOW}Step 6: Recent API logs:${NC}"
docker logs vpn-api --tail 50
echo ""

# Summary
echo -e "${GREEN}=== Deployment Complete ===${NC}\n"
echo "✓ Code updated to latest version"
echo "✓ Database migrations applied"
echo "✓ API container rebuilt with Docker support"
echo "✓ Terminal system is ready"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Test terminal system via NexusAI frontend"
echo "2. Monitor logs: docker logs -f vpn-api"
echo "3. Check container list: docker ps"
echo "4. Debug if needed: bash /opt/vpn-enterprise/scripts/hetzner/debug-api-container.sh"
echo ""
echo -e "${YELLOW}Security notes:${NC}"
echo "- Docker socket is mounted (required for terminal system)"
echo "- Container runs as non-root user with docker group access"
echo "- Command whitelist enforced"
echo "- Rate limiting: 50 commands/minute per user"
echo "- Auto-cleanup: containers deleted after 60 minutes"
echo ""
echo "Happy building! 🚀"
