#!/bin/bash
# Orchestrator: push changes to GitHub, then deploy to Vercel
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

MSG=""

# If a message is provided, use it; otherwise the push helper will prompt interactively
if [ $# -ge 1 ]; then
	MSG="$1"
	shift
fi

echo "🔁 Commit & push changes"
bash ./scripts/git/push.sh "$MSG"

echo "🚀 Deploying to Vercel"
# Pass any remaining args through to deploy-vercel (e.g. --skip-api-build)
bash ./scripts/deploy-vercel.sh "$@"

echo "🎉 Auto-deploy finished"
