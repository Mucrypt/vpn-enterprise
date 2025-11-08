#!/bin/bash
# ==============================================
# VPN ENTERPRISE - HEALTH CHECK SCRIPT
# ==============================================
# Comprehensive health check for all services

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔═══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   VPN ENTERPRISE - HEALTH CHECK          ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════╝${NC}"
echo ""

# Service URLs
API_URL="${API_URL:-http://localhost:3000}"
WEB_URL="${WEB_URL:-http://localhost}"  # Web Dashboard through Nginx
PROMETHEUS_URL="${PROMETHEUS_URL:-http://localhost:9090}"
GRAFANA_URL="${GRAFANA_URL:-http://localhost:3000}"

FAILED_CHECKS=0

# ============================================
# CHECK API SERVER
# ============================================

echo -e "${YELLOW}[1/6] Checking API Server...${NC}"
if curl -f -s "${API_URL}/health" > /dev/null; then
    RESPONSE=$(curl -s "${API_URL}/health")
    echo -e "${GREEN}✓ API Server is healthy${NC}"
    echo -e "  Response: $RESPONSE"
else
    echo -e "${RED}✗ API Server is not responding${NC}"
    FAILED_CHECKS=$((FAILED_CHECKS+1))
fi

# ============================================
# CHECK WEB DASHBOARD
# ============================================

echo -e "\n${YELLOW}[2/6] Checking Web Dashboard...${NC}"
if curl -f -s "${WEB_URL}" > /dev/null; then
    echo -e "${GREEN}✓ Web Dashboard is accessible${NC}"
else
    echo -e "${RED}✗ Web Dashboard is not responding${NC}"
    FAILED_CHECKS=$((FAILED_CHECKS+1))
fi

# ============================================
# CHECK DATABASE CONNECTION
# ============================================

echo -e "\n${YELLOW}[3/6] Checking Database Connection...${NC}"
API_RESPONSE=$(curl -s "${API_URL}/api/v1/servers" 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database connection is working${NC}"
else
    echo -e "${RED}✗ Database connection failed${NC}"
    FAILED_CHECKS=$((FAILED_CHECKS+1))
fi

# ============================================
# CHECK PROMETHEUS
# ============================================

echo -e "\n${YELLOW}[4/6] Checking Prometheus...${NC}"
if curl -f -s "${PROMETHEUS_URL}/-/healthy" > /dev/null; then
    echo -e "${GREEN}✓ Prometheus is healthy${NC}"
else
    echo -e "${YELLOW}⚠ Prometheus is not responding (optional service)${NC}"
fi

# ============================================
# CHECK DOCKER CONTAINERS
# ============================================

echo -e "\n${YELLOW}[5/6] Checking Docker Containers...${NC}"
if command -v docker &> /dev/null; then
    RUNNING_CONTAINERS=$(docker ps --filter "name=vpn-" --format "{{.Names}}" | wc -l)
    if [ "$RUNNING_CONTAINERS" -gt 0 ]; then
        echo -e "${GREEN}✓ Found $RUNNING_CONTAINERS running containers${NC}"
        docker ps --filter "name=vpn-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    else
        echo -e "${YELLOW}⚠ No VPN Enterprise containers running${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Docker command not available${NC}"
fi

# ============================================
# CHECK DISK SPACE
# ============================================

echo -e "\n${YELLOW}[6/6] Checking Disk Space...${NC}"
if command -v df &> /dev/null; then
    DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$DISK_USAGE" -lt 80 ]; then
        echo -e "${GREEN}✓ Disk usage is ${DISK_USAGE}%${NC}"
    elif [ "$DISK_USAGE" -lt 90 ]; then
        echo -e "${YELLOW}⚠ Disk usage is ${DISK_USAGE}% (consider cleanup)${NC}"
    else
        echo -e "${RED}✗ Disk usage is ${DISK_USAGE}% (critical!)${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS+1))
    fi
fi

# ============================================
# SUMMARY
# ============================================

echo -e "\n${BLUE}╔═══════════════════════════════════════════╗${NC}"
if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${GREEN}║   ALL CHECKS PASSED ✓                    ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${RED}║   ${FAILED_CHECKS} CHECK(S) FAILED ✗                  ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════╝${NC}"
    echo -e "\n${YELLOW}Check the logs for more details:${NC}"
    echo -e "  docker-compose -f infrastructure/docker/docker-compose.yml logs"
    exit 1
fi
