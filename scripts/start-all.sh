#!/bin/bash
# ==============================================
# VPN ENTERPRISE - START ALL SERVICES
# ==============================================
# Starts the complete VPN Enterprise stack for development
# Usage: ./scripts/start-all.sh
set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting VPN Enterprise - Complete Stack${NC}"
echo "=============================================="
echo ""

# Create network if it doesn't exist
docker network create vpn-dev-network 2>/dev/null || echo "✅ Network already exists"

# Start database platform
echo -e "${GREEN}📊 Starting Database Platform...${NC}"
docker compose -f docker-compose.db-dev.yml up -d
echo ""

# Start main services
echo -e "${GREEN}🔌 Starting Main Services (API, Web, Python API, Redis, N8N, NexusAI)...${NC}"
cd infrastructure/docker
docker compose -f docker-compose.dev.yml up -d
echo ""

# Start monitoring & CI/CD
echo -e "${GREEN}📈 Starting Monitoring & CI/CD (Grafana, Prometheus, Jenkins, AlertManager)...${NC}"
docker compose -f docker-compose.monitoring.yml up -d
cd ../..
echo ""

echo "=============================================="
echo -e "${GREEN}✅ All services started!${NC}"
echo ""
echo "📍 Service URLs:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Web Dashboard:    http://localhost:3001"
echo "🔌 Node API:         http://localhost:5000"
echo "🐍 Python API:       http://localhost:5001"
echo "🔄 N8N Workflows:    http://localhost:5678"
echo "🤖 Ollama AI:        http://localhost:11434"
echo "🦾 NexusAI:          http://localhost:8080"
echo ""
echo "📊 Database & Admin:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🗄️  pgAdmin:          http://localhost:8082"
echo "    Email: admin@vpnenterprise.com"
echo "    Password: admin123"
echo ""
echo "📊 Adminer:          http://localhost:8081"
echo "    Server: vpn-postgres-dev"
echo "    Username: platform_admin"
echo "    Password: platform_admin_password"
echo ""
echo "📈 Monitoring & CI/CD:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Grafana:          http://localhost:3300"
echo "    Username: admin"
echo "    Password: admin123"
echo ""
echo "📈 Prometheus:       http://localhost:9090"
echo "🔔 AlertManager:     http://localhost:9093"
echo "🔨 Jenkins:          http://localhost:8083"
echo ""
echo "=============================================="
echo ""
echo "💡 Quick Commands:"
echo "  Stop all:     ./scripts/stop-dev.sh"
echo "  View logs:    docker compose -f infrastructure/docker/docker-compose.dev.yml logs -f"
echo "  Check status: docker ps"
echo ""
echo "📚 Documentation:"
echo "  Security:     docs/SECURITY_OVERHAUL.md"
echo "  Cloud/Networking: docs/CLOUD_NETWORKING_LEARNING_PATH.md"
echo "  CI/CD:        Jenkinsfile, .github/workflows/ci.yml"
echo ""
