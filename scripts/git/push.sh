#!/bin/bash
# Simple helper to commit & push changes to GitHub
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

MSG="${1:-}"
if [ -z "$MSG" ]; then
  echo "Usage: $0 'commit message'"
  exit 2
fi

echo "🔁 Staging changes..."
git add -A

echo "✍️  Committing: $MSG"
if git commit -m "$MSG"; then
  echo "📤 Pushing to origin/main"
  git push origin HEAD:main
else
  echo "ℹ️  No changes to commit. Skipping push." 
fi
