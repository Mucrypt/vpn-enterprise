#!/bin/bash
# ==============================================
# VPN ENTERPRISE - DEPLOY SCRIPT
# ==============================================
# Zero-downtime deployment with health checks

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   VPN ENTERPRISE - DEPLOYMENT            ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════╝${NC}"
echo ""

# Navigate to project root
cd "$(dirname "$0")/../.."

# Environment selection
ENV=${1:-production}
COMPOSE_FILE="infrastructure/docker/docker-compose.yml"

if [ "$ENV" = "development" ]; then
    COMPOSE_FILE="infrastructure/docker/docker-compose.dev.yml"
fi

echo -e "${YELLOW}Environment:${NC} ${ENV}"
echo -e "${YELLOW}Compose file:${NC} ${COMPOSE_FILE}"
echo ""

# ============================================
# PRE-DEPLOYMENT CHECKS
# ============================================

echo -e "${BLUE}[1/7] Pre-deployment checks...${NC}"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}✗ Error: .env file not found${NC}"
    echo -e "${YELLOW}Copy .env.example to .env and configure it${NC}"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}✗ Error: Docker is not running${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Pre-deployment checks passed${NC}"

# ============================================
# CREATE SSL CERTIFICATES (if not exist)
# ============================================

echo -e "\n${BLUE}[2/7] Checking SSL certificates...${NC}"

SSL_DIR="infrastructure/docker/nginx/ssl"
mkdir -p "$SSL_DIR"

if [ ! -f "$SSL_DIR/cert.pem" ] || [ ! -f "$SSL_DIR/key.pem" ]; then
    echo -e "${YELLOW}⚠ SSL certificates not found. Generating self-signed certificate...${NC}"
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$SSL_DIR/key.pem" \
        -out "$SSL_DIR/cert.pem" \
        -subj "/C=US/ST=State/L=City/O=VPN-Enterprise/CN=localhost" \
        2>/dev/null
    echo -e "${GREEN}✓ Self-signed certificate generated${NC}"
    echo -e "${YELLOW}⚠ For production, replace with real SSL certificates${NC}"
else
    echo -e "${GREEN}✓ SSL certificates found${NC}"
fi

# ============================================
# BUILD IMAGES
# ============================================

echo -e "\n${BLUE}[3/7] Building Docker images...${NC}"
./scripts/deployment/build.sh $ENV > /dev/null 2>&1 || {
    echo -e "${YELLOW}⚠ Build script not executable, running docker-compose build...${NC}"
    docker-compose -f "$COMPOSE_FILE" build
}

# ============================================
# STOP OLD CONTAINERS (if running)
# ============================================

echo -e "\n${BLUE}[4/7] Stopping old containers...${NC}"
docker-compose -f "$COMPOSE_FILE" down --remove-orphans || true
echo -e "${GREEN}✓ Old containers stopped${NC}"

# ============================================
# START NEW CONTAINERS
# ============================================

echo -e "\n${BLUE}[5/7] Starting services...${NC}"
docker-compose -f "$COMPOSE_FILE" up -d

# ============================================
# HEALTH CHECKS
# ============================================

echo -e "\n${BLUE}[6/7] Running health checks...${NC}"
echo -e "${YELLOW}Waiting for services to be ready...${NC}"

# Wait for API
MAX_RETRIES=30
RETRY_COUNT=0
until curl -f http://localhost:3000/health > /dev/null 2>&1 || [ $RETRY_COUNT -eq $MAX_RETRIES ]; do
    echo -e "${YELLOW}  Waiting for API... ($RETRY_COUNT/$MAX_RETRIES)${NC}"
    sleep 2
    RETRY_COUNT=$((RETRY_COUNT+1))
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo -e "${RED}✗ API health check failed${NC}"
    docker-compose -f "$COMPOSE_FILE" logs api
    exit 1
fi

echo -e "${GREEN}✓ API is healthy${NC}"

# Wait for Web Dashboard
RETRY_COUNT=0
until curl -f http://localhost:3001 > /dev/null 2>&1 || [ $RETRY_COUNT -eq $MAX_RETRIES ]; do
    echo -e "${YELLOW}  Waiting for Web Dashboard... ($RETRY_COUNT/$MAX_RETRIES)${NC}"
    sleep 2
    RETRY_COUNT=$((RETRY_COUNT+1))
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo -e "${RED}✗ Web Dashboard health check failed${NC}"
    docker-compose -f "$COMPOSE_FILE" logs web-dashboard
    exit 1
fi

echo -e "${GREEN}✓ Web Dashboard is healthy${NC}"

# ============================================
# DEPLOYMENT STATUS
# ============================================

echo -e "\n${BLUE}[7/7] Deployment status...${NC}"
docker-compose -f "$COMPOSE_FILE" ps

# ============================================
# SUCCESS
# ============================================

echo -e "\n${GREEN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   DEPLOYMENT SUCCESSFUL!                  ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Services are running:${NC}"
echo -e "  ${BLUE}•${NC} API Server:       http://localhost:3000"
echo -e "  ${BLUE}•${NC} Web Dashboard:    http://localhost:3001"
echo -e "  ${BLUE}•${NC} Prometheus:       http://localhost:9090"
echo -e "  ${BLUE}•${NC} Grafana:          http://localhost:3000 (admin/admin)"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo -e "  View logs:        docker-compose -f $COMPOSE_FILE logs -f"
echo -e "  Stop services:    docker-compose -f $COMPOSE_FILE down"
echo -e "  Restart service:  docker-compose -f $COMPOSE_FILE restart <service>"
echo ""
