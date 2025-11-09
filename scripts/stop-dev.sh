#!/usr/bin/env bash
# Stop the development docker compose and remove dev-only containers
# Usage: ./scripts/stop-dev.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/infrastructure/docker/docker-compose.dev.yml"
ENV_FILE="$ROOT_DIR/.env"

echo "Stopping dev stack (compose file: $COMPOSE_FILE)"
# Bring down the dev compose and remove orphans
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down --remove-orphans

echo "Dev stack stopped."
