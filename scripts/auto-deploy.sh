# -----------------------------------------------------------------------------
# auto-deploy.sh
#
# Orchestrates the deployment workflow:
#   1. Commits and pushes local changes to GitHub using a helper script.
#   2. Deploys the project to Vercel using a deployment script.
#
# Usage:
#   ./scripts/auto-deploy.sh [commit-message] [deploy-vercel-args...]
#
# Arguments:
#   commit-message         Optional. Commit message for git push. If omitted,
#                         the push helper script will prompt interactively.
#   deploy-vercel-args     Optional. Additional arguments passed to the
#                         deploy-vercel.sh script (e.g., --skip-api-build).
#
# Environment:
#   ROOT_DIR               The project root directory, determined relative to
#                         the script's location.
#
# Exit Codes:
#   Non-zero exit code on failure.
#
# -----------------------------------------------------------------------------
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
