#!/bin/bash
# ==============================================
# Quick Fix CI/CD Conflicts
# ==============================================
# Disables duplicate workflows, keeps only ci.yml + deploy-hetzner.yml

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR/.github/workflows"

echo -e "${BLUE}🔧 Fixing CI/CD Workflow Conflicts${NC}"
echo ""

# Workflows to disable
DISABLE=(
    "main-ci-cd"
    "deploy-env" 
    "deploy"
    "ci-cd"
    "docker-build"
    "security-scan"
    "release"
)

# Disable conflicting workflows
for workflow in "${DISABLE[@]}"; do
    if [ -f "${workflow}.yml" ]; then
        mv "${workflow}.yml" "${workflow}.yml.disabled"
        echo -e "${GREEN}✓${NC} Disabled ${workflow}.yml"
    else
        echo -e "${YELLOW}•${NC} ${workflow}.yml not found (already disabled or deleted)"
    fi
done

echo ""
echo -e "${BLUE}📋 Active workflows:${NC}"
ls -1 *.yml 2>/dev/null | while read -r f; do
    echo -e "  ${GREEN}✓${NC} $f"
done

echo ""
echo -e "${BLUE}📋 Disabled workflows:${NC}"
ls -1 *.yml.disabled 2>/dev/null | while read -r f; do
    echo -e "  ${YELLOW}•${NC} $f"
done

echo ""
echo -e "${GREEN}✅ CI/CD conflicts resolved!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Review changes: git diff .github/workflows/"
echo "  2. Commit: git add .github/workflows/ && git commit -m 'fix: resolve CI/CD workflow conflicts'"
echo "  3. Push: git push origin main"
echo "  4. Watch: gh run watch"
echo ""
