#!/bin/bash
# Orchestrator: push changes to GitHub, then deploy to Vercel
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

MSG="${1:-Auto-deploy from script}" 

echo "🔁 Commit & push changes"
bash ./scripts/git/push.sh "$MSG"

echo "🚀 Deploying to Vercel"
# Build API included by default
bash ./scripts/deploy-vercel.sh

echo "🎉 Auto-deploy finished"
