#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
ENV_EXAMPLE="$ROOT_DIR/.env.production.example"
ENV_FILE="$ROOT_DIR/.env.production"

if [ ! -f "$ENV_EXAMPLE" ]; then
  echo "Missing $ENV_EXAMPLE"
  exit 1
fi

if [ -f "$ENV_FILE" ]; then
  echo "$ENV_FILE already exists"
  read -r -p "Overwrite? (y/N): " reply
  if [[ ! "$reply" =~ ^[Yy]$ ]]; then
    echo "Leaving existing .env.production as-is"
    exit 0
  fi
fi

cp "$ENV_EXAMPLE" "$ENV_FILE"
chmod 600 "$ENV_FILE" || true

echo ""
echo "Now editing $ENV_FILE"
echo "- Set ALLOWED_ORIGINS to your real domains"
echo "- Set N8N_BASIC_AUTH_USER and N8N_BASIC_AUTH_PASSWORD"
echo ""

editor="${EDITOR:-nano}"
"$editor" "$ENV_FILE"

echo ""
echo "Done. Next: run ./scripts/setup-secrets.sh and then ./scripts/hetzner/deploy-prod.sh"
