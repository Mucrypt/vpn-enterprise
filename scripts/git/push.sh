#!/bin/bash
# Simple helper to commit & push changes to GitHub
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

MSG="${1:-}"

if [ -z "$MSG" ]; then
  # Prompt for a commit message if none provided
  read -rp "Commit message (leave empty to cancel): " MSG
  if [ -z "$MSG" ]; then
    echo "Aborting: no commit message provided. No changes were pushed."
    exit 1
  fi
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
