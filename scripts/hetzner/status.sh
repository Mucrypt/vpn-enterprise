#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
COMPOSE_DIR="$ROOT_DIR/infrastructure/docker"
COMPOSE_FILE="$COMPOSE_DIR/docker-compose.prod.yml"

cd "$COMPOSE_DIR"
docker compose -f "$COMPOSE_FILE" ps

echo ""
docker compose -f "$COMPOSE_FILE" logs --tail=50 nginx
