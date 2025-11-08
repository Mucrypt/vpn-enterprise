#!/bin/bash
# ==============================================
# VPN ENTERPRISE - ROLLBACK SCRIPT
# ==============================================
# Rollback to previous deployment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${RED}╔═══════════════════════════════════════════╗${NC}"
echo -e "${RED}║   VPN ENTERPRISE - ROLLBACK               ║${NC}"
echo -e "${RED}╚═══════════════════════════════════════════╝${NC}"
echo ""

# Navigate to project root
cd "$(dirname "$0")/../.."

COMPOSE_FILE="infrastructure/docker/docker-compose.yml"

# ============================================
# CONFIRMATION
# ============================================

echo -e "${YELLOW}⚠ WARNING: This will rollback to the previous deployment${NC}"
echo -e "${YELLOW}⚠ Current services will be stopped${NC}"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${BLUE}Rollback cancelled${NC}"
    exit 0
fi

# ============================================
# GET PREVIOUS IMAGE TAGS
# ============================================

echo -e "\n${BLUE}[1/4] Fetching previous image tags...${NC}"

# Get second most recent tag (previous deployment)
PREV_API_TAG=$(docker images vpn-enterprise/api --format "{{.Tag}}" | grep -v "latest" | head -n 2 | tail -n 1)
PREV_WEB_TAG=$(docker images vpn-enterprise/web-dashboard --format "{{.Tag}}" | grep -v "latest" | head -n 2 | tail -n 1)

if [ -z "$PREV_API_TAG" ] || [ -z "$PREV_WEB_TAG" ]; then
    echo -e "${RED}✗ No previous image tags found${NC}"
    echo -e "${YELLOW}Cannot rollback without previous images${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Found previous images:${NC}"
echo -e "  API: vpn-enterprise/api:${PREV_API_TAG}"
echo -e "  Web: vpn-enterprise/web-dashboard:${PREV_WEB_TAG}"

# ============================================
# BACKUP CURRENT STATE
# ============================================

echo -e "\n${BLUE}[2/4] Backing up current state...${NC}"
mkdir -p backups
BACKUP_FILE="backups/backup-$(date +%Y%m%d-%H%M%S).tar.gz"
docker-compose -f "$COMPOSE_FILE" config > "${BACKUP_FILE%.tar.gz}.yml"
echo -e "${GREEN}✓ Configuration backed up to ${BACKUP_FILE%.tar.gz}.yml${NC}"

# ============================================
# STOP CURRENT SERVICES
# ============================================

echo -e "\n${BLUE}[3/4] Stopping current services...${NC}"
docker-compose -f "$COMPOSE_FILE" down
echo -e "${GREEN}✓ Services stopped${NC}"

# ============================================
# START WITH PREVIOUS IMAGES
# ============================================

echo -e "\n${BLUE}[4/4] Starting services with previous images...${NC}"

# Tag previous images as latest
docker tag "vpn-enterprise/api:${PREV_API_TAG}" vpn-enterprise/api:latest
docker tag "vpn-enterprise/web-dashboard:${PREV_WEB_TAG}" vpn-enterprise/web-dashboard:latest

# Start services
docker-compose -f "$COMPOSE_FILE" up -d

# Wait for services
echo -e "${YELLOW}Waiting for services to start...${NC}"
sleep 10

# Health check
if ./scripts/deployment/health-check.sh > /dev/null 2>&1; then
    echo -e "\n${GREEN}╔═══════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   ROLLBACK SUCCESSFUL!                    ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}✓ Services rolled back to:${NC}"
    echo -e "  API: ${PREV_API_TAG}"
    echo -e "  Web: ${PREV_WEB_TAG}"
else
    echo -e "\n${RED}╔═══════════════════════════════════════════╗${NC}"
    echo -e "${RED}║   ROLLBACK FAILED!                        ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}Check logs: docker-compose -f $COMPOSE_FILE logs${NC}"
    exit 1
fi
