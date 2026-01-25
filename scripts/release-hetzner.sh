#!/usr/bin/env bash
# Push changes to main; Hetzner deploy is handled by GitHub Actions.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

MSG=""
if [ $# -ge 1 ]; then
  MSG="$1"
fi

echo "🔁 Commit & push changes (main)"
bash ./scripts/git/push.sh "$MSG"

echo ""
echo "✅ Pushed. Next steps:"
echo "- GitHub Actions will run 'CI' then 'Deploy to Hetzner (Docker Compose)' on main."
echo "- Or run the deploy manually in Actions: 'Deploy to Hetzner (Docker Compose)' -> Run workflow."
