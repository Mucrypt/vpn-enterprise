#!/bin/bash
# Unified Vercel deploy script for API and Web Dashboard
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

# Defaults
SKIP_API_BUILD=0
API_PROJECT=""
WEB_PROJECT=""
VERCEL_ARGS=""

# parse flags
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-api-build)
      SKIP_API_BUILD=1; shift;;
    --api-project)
      API_PROJECT="$2"; shift 2;;
    --web-project)
      WEB_PROJECT="$2"; shift 2;;
    --vercel-args)
      VERCEL_ARGS="$2"; shift 2;;
    --)
      shift; break;;
    *)
      echo "Unknown option: $1"; exit 1;;
  esac
done

echo "🚀 VPN Enterprise — Vercel deployment helper"

if [ $SKIP_API_BUILD -eq 0 ]; then
  echo "🔧 Preparing API dist for Vercel (scripts/build-api-vercel.sh)"
  bash ./scripts/build-api-vercel.sh
else
  echo "ℹ️  Skipping API build as requested"
fi

# Check for vercel CLI
if ! command -v vercel >/dev/null 2>&1; then
  echo "⚠ vercel CLI not found. Install it: npm i -g vercel or use npx vercel"
  exit 1
fi

echo "📡 Deploying API to Vercel (production)"
cd "$ROOT_DIR/packages/api"
API_CMD=(vercel --prod --yes)
if [ -n "$API_PROJECT" ]; then
  API_CMD+=(--project "$API_PROJECT")
fi
if [ -n "$VERCEL_ARGS" ]; then
  API_CMD+=("$VERCEL_ARGS")
fi
# Run deploy
"${API_CMD[@]}"

# Restore package.json if build script created a backup marker
if [ -f .vercel-swap ] && [ -f package.json.backup ]; then
  echo "🔁 Restoring original package.json in packages/api"
  mv -f package.json.backup package.json
  rm -f .vercel-swap || true
fi

echo "🎨 Deploying Web Dashboard to Vercel (production)"
cd "$ROOT_DIR/apps/web-dashboard"
WEB_CMD=(vercel --prod --yes)
if [ -n "$WEB_PROJECT" ]; then
  WEB_CMD+=(--project "$WEB_PROJECT")
fi
if [ -n "$VERCEL_ARGS" ]; then
  WEB_CMD+=("$VERCEL_ARGS")
fi
"${WEB_CMD[@]}"

echo "✅ Deploy completed. Production URLs (if project slugs are configured):"
echo "  API: https://vpn-enterprise-api.vercel.app"
echo "  WEB: https://vpn-enterprise-dashboard.vercel.app"
