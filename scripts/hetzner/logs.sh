#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
COMPOSE_DIR="$ROOT_DIR/infrastructure/docker"
COMPOSE_FILE="$COMPOSE_DIR/docker-compose.prod.yml"

SERVICE="${1:-}"

cd "$COMPOSE_DIR"

if [ -z "$SERVICE" ]; then
  echo "Usage: ./scripts/hetzner/logs.sh <service>"
  echo "Example: ./scripts/hetzner/logs.sh api"
  echo ""
  docker compose -f "$COMPOSE_FILE" ps --services
  exit 1
fi

docker compose -f "$COMPOSE_FILE" logs -f "$SERVICE"
