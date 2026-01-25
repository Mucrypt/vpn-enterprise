#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
COMPOSE_DIR="$ROOT_DIR/infrastructure/docker"
COMPOSE_FILE="$COMPOSE_DIR/docker-compose.prod.yml"
ENV_FILE="$ROOT_DIR/.env.production"
SECRETS_DIR="$COMPOSE_DIR/secrets"

PULL=0
BUILD=0

usage() {
  cat <<'USAGE'
Usage: ./scripts/hetzner/deploy-prod.sh [--pull] [--build]

  --pull   git pull origin/main before deploying
  --build  rebuild Docker images during deploy

Runs: docker compose -f infrastructure/docker/docker-compose.prod.yml up -d
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --pull) PULL=1; shift;;
    --build) BUILD=1; shift;;
    -h|--help) usage; exit 0;;
    *) echo "Unknown arg: $1"; usage; exit 1;;
  esac
done

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $ENV_FILE"
  echo "Create it from example: ./scripts/hetzner/setup-env-production.sh"
  exit 1
fi

for f in db_password redis_password n8n_encryption_key api_key; do
  if [ ! -f "$SECRETS_DIR/$f" ]; then
    echo "Missing secret file: $SECRETS_DIR/$f"
    echo "Create secrets: ./scripts/setup-secrets.sh"
    exit 1
  fi
  chmod 600 "$SECRETS_DIR/$f" || true
  chmod 700 "$SECRETS_DIR" || true
  chmod 600 "$ENV_FILE" || true
done

if [ $PULL -eq 1 ]; then
  echo "Updating repo (git pull)"
  cd "$ROOT_DIR"
  git fetch --prune origin
  git checkout main
  git pull --ff-only origin main
fi

echo "Validating compose config"
cd "$COMPOSE_DIR"
docker compose -f "$COMPOSE_FILE" config >/dev/null

echo "Deploying production stack"
if [ $BUILD -eq 1 ]; then
  docker compose -f "$COMPOSE_FILE" up -d --build --remove-orphans
else
  docker compose -f "$COMPOSE_FILE" up -d --remove-orphans
fi

echo ""
docker compose -f "$COMPOSE_FILE" ps

echo ""
echo "Quick checks:"
echo "- nginx health (http): curl -fsS http://localhost/health"
echo "- api health via nginx (https, insecure): curl -kfsS https://localhost/api/health"
