#!/bin/bash
# ==============================================
# VPN ENTERPRISE - BUILD SCRIPT
# ==============================================
# Builds Docker images for all services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   VPN ENTERPRISE - BUILD SCRIPT          ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════╝${NC}"
echo ""

# Navigate to project root
cd "$(dirname "$0")/../.."

# Environment selection
ENV=${1:-production}
echo -e "${YELLOW}Building for environment: ${ENV}${NC}"

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# ============================================
# BUILD DOCKER IMAGES
# ============================================

echo -e "\n${GREEN}[1/5] Building API Server...${NC}"
docker build \
    -f infrastructure/docker/Dockerfile.api \
    -t vpn-enterprise/api:latest \
    -t vpn-enterprise/api:$(git rev-parse --short HEAD) \
    .

echo -e "\n${GREEN}[2/5] Building Web Dashboard...${NC}"
docker build \
    -f infrastructure/docker/Dockerfile.web \
    -t vpn-enterprise/web-dashboard:latest \
    -t vpn-enterprise/web-dashboard:$(git rev-parse --short HEAD) \
    .

echo -e "\n${GREEN}[3/5] Pulling Nginx...${NC}"
docker pull nginx:alpine

echo -e "\n${GREEN}[4/5] Pulling Redis...${NC}"
docker pull redis:7-alpine

echo -e "\n${GREEN}[5/5] Pulling monitoring stack...${NC}"
docker pull prom/prometheus:latest
docker pull grafana/grafana:latest
docker pull grafana/loki:latest
docker pull grafana/promtail:latest

# ============================================
# SUMMARY
# ============================================

echo -e "\n${GREEN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   BUILD COMPLETED SUCCESSFULLY!           ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✓${NC} API Server: vpn-enterprise/api:latest"
echo -e "${GREEN}✓${NC} Web Dashboard: vpn-enterprise/web-dashboard:latest"
echo -e "${GREEN}✓${NC} Monitoring Stack: Ready"
echo ""
echo -e "${YELLOW}Next step:${NC} Run './scripts/deployment/deploy.sh' to start services"
echo ""
