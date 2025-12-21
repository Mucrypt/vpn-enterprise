#!/usr/bin/env bash
# Start the development docker compose and tail logs for core services
# Usage: ./scripts/start-dev.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/infrastructure/docker/docker-compose.dev.yml"
ENV_FILE="$ROOT_DIR/.env"

echo "Bringing up dev stack (compose file: $COMPOSE_FILE)"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up --build -d

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║          VPN Enterprise - Development Services                 ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 Service URLs:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🖥️  Web Dashboard:       http://localhost:3001"
echo "  🔌 Node API Server:      http://localhost:5000"
echo "  🐍 Python API (FastAPI): http://localhost:8000"
echo "  🤖 NexusAI:              http://localhost:8080"
echo "  ⚙️  N8N Workflows:        http://localhost:5678"
echo "  🦙 Ollama AI:            http://localhost:11434"
echo "  🔴 Redis Cache:          localhost:6379"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔐 N8N Credentials:"
echo "  Username: admin"
echo "  Password: n8n_password"
echo ""
echo "💡 Tip: Run './scripts/start-database-platform.sh' for database tools:"
echo "  📊 Database Platform API:  http://localhost:3002"
echo "  🗄️  pgAdmin:                http://localhost:8081"
echo "  🐘 PostgreSQL:             localhost:5433"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Tailing logs (api-dev, web-dev, python-api-dev, redis-dev, n8n-dev, nexusai-dev, ollama-dev)"
echo "   Press Ctrl+C to stop log streaming"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Tail the most relevant logs; fallback to all compose logs if services not recognized
if docker ps --format '{{.Names}}' | grep -q '^vpn-api-dev$'; then
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs -f api-dev web-dev python-api-dev redis-dev n8n-dev nexusai-dev ollama-dev
else
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs -f
fi
