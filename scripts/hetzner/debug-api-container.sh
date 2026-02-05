#!/bin/bash

# Debug API Container Issues
# Quick diagnostic script for API container failures

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${YELLOW}=== API Container Diagnostics ===${NC}\n"

# Check container status
echo -e "${BLUE}1. Container Status:${NC}"
docker ps -a --filter "name=vpn-api" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# Check last 100 lines of logs
echo -e "${BLUE}2. Recent Container Logs:${NC}"
echo -e "${YELLOW}Last 100 lines:${NC}"
docker logs vpn-api --tail 100
echo ""

# Check if the container is running
if docker ps | grep -q vpn-api; then
    echo -e "${BLUE}3. Container is running. Testing health endpoint:${NC}"
    docker exec vpn-api curl -f http://localhost:5000/health || echo -e "${RED}Health check failed${NC}"
    echo ""
    
    echo -e "${BLUE}4. Process list inside container:${NC}"
    docker exec vpn-api ps aux
    echo ""
else
    echo -e "${RED}3. Container is not running!${NC}"
    echo ""
    
    echo -e "${BLUE}4. Attempting to inspect container config:${NC}"
    docker inspect vpn-api | jq '.[0].Config.Env, .[0].State' 2>/dev/null || echo "Could not inspect container"
    echo ""
fi

# Check Docker socket
echo -e "${BLUE}5. Docker Socket Check (for terminal system):${NC}"
if docker exec vpn-api test -e /var/run/docker.sock 2>/dev/null; then
    echo -e "${GREEN}✓ Docker socket is mounted${NC}"
    docker exec vpn-api ls -la /var/run/docker.sock
else
    echo -e "${RED}✗ Docker socket NOT mounted - terminal system won't work${NC}"
    echo -e "${YELLOW}The terminal system requires Docker socket to be mounted${NC}"
fi
echo ""

# Check disk space
echo -e "${BLUE}6. Disk Space:${NC}"
df -h | grep -E "Filesystem|/$"
echo ""

# Check memory
echo -e "${BLUE}7. Memory Usage:${NC}"
free -h
echo ""

# Suggestions
echo -e "${YELLOW}=== Troubleshooting Tips ===${NC}"
echo "1. If 'node packages/api/dist/index.js' is not running, check the logs above for errors"
echo "2. If health check fails, the API might not be listening on port 5000"
echo "3. If Docker socket is missing, add it to docker-compose.prod.yml volumes"
echo "4. Common issues:"
echo "   - Missing environment variables"
echo "   - Database connection failures"
echo "   - Docker socket not mounted (terminal system)"
echo "   - Build errors in TypeScript compilation"
echo ""

echo -e "${GREEN}To restart the API container:${NC}"
echo "docker compose -f infrastructure/docker/docker-compose.prod.yml restart api"
echo ""
echo -e "${GREEN}To rebuild and restart:${NC}"
echo "docker compose -f infrastructure/docker/docker-compose.prod.yml up -d --build api"
