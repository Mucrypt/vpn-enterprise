#!/usr/bin/env bash
# Start the development docker compose and tail logs for core services
# Usage: ./scripts/start-dev.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/infrastructure/docker/docker-compose.dev.yml"
ENV_FILE="$ROOT_DIR/.env"

echo "Bringing up dev stack (compose file: $COMPOSE_FILE)"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up --build -d

echo "Tailing logs (api-dev, web-dev, redis-dev). Press Ctrl+C to stop."
# Tail the most relevant logs; fallback to all compose logs if services not recognized
if docker ps --format '{{.Names}}' | grep -q '^vpn-api-dev$'; then
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs -f api-dev web-dev redis-dev
else
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs -f
fi
