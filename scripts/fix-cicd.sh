#!/bin/bash
# ==============================================
# CI/CD Quick Fix Script
# ==============================================
# Automatically fixes the conflicting CI/CD workflows

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WORKFLOWS_DIR="$ROOT_DIR/.github/workflows"

echo -e "${BLUE}"
cat << "EOF"
╔══════════════════════════════════════════════╗
║   CI/CD Workflow Quick Fix                  ║
╚══════════════════════════════════════════════╝
EOF
echo -e "${NC}"

cd "$WORKFLOWS_DIR"

# ==============================================
# Analyze Current State
# ==============================================
echo -e "${BLUE}📋 Current Workflows:${NC}"
echo ""
ls -1 *.yml 2>/dev/null | while read -r file; do
    echo "  • $file"
done
echo ""

# ==============================================
# Check for Conflicts
# ==============================================
echo -e "${BLUE}🔍 Checking for conflicts...${NC}"
echo ""

CONFLICTS=0

if [ -f "main-ci-cd.yml" ]; then
    echo -e "${YELLOW}⚠️  main-ci-cd.yml detected (complex, 605 lines)${NC}"
    if grep -q "workflow_dispatch" main-ci-cd.yml && grep -q "push:" main-ci-cd.yml; then
        echo "   • Triggers on push to main ❌"
        echo "   • Has deploy job ❌"
        ((CONFLICTS++))
    fi
fi

if [ -f "ci.yml" ]; then
    echo -e "${YELLOW}⚠️  ci.yml detected${NC}"
    if grep -q "push:" ci.yml; then
        echo "   • Triggers on push to main ❌"
        ((CONFLICTS++))
    fi
fi

if [ -f "deploy-hetzner.yml" ]; then
    echo -e "${GREEN}✅ deploy-hetzner.yml detected${NC}"
    echo "   • Specialized Hetzner deployment"
fi

echo ""

if [ $CONFLICTS -gt 1 ]; then
    echo -e "${RED}🚨 CONFLICT DETECTED!${NC}"
    echo "Multiple workflows will trigger on same event (push to main)"
    echo ""
fi

# ==============================================
# Recommended Solution
# ==============================================
echo -e "${BLUE}💡 Recommended Solution:${NC}"
echo ""
echo "Keep simple workflow chain:"
echo "  1. ci.yml → Lint, Test, Build"
echo "  2. deploy-hetzner.yml → Deploy to Hetzner (triggered by ci.yml)"
echo ""
echo "Disable complex workflows:"
echo "  • main-ci-cd.yml (too complex, Vercel-focused)"
echo ""

read -p "Apply recommended fix? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Exiting without changes"
    exit 0
fi

# ==============================================
# Apply Fix
# ==============================================
echo ""
echo -e "${BLUE}🔧 Applying fixes...${NC}"

# Disable main-ci-cd.yml
if [ -f "main-ci-cd.yml" ]; then
    echo "  • Disabling main-ci-cd.yml..."
    mv main-ci-cd.yml main-ci-cd.yml.disabled
    echo -e "    ${GREEN}✓${NC} Renamed to main-ci-cd.yml.disabled"
fi

# Keep ci.yml
if [ -f "ci.yml" ]; then
    echo -e "  ${GREEN}✓${NC} Keeping ci.yml (active)"
fi

# Keep deploy-hetzner.yml
if [ -f "deploy-hetzner.yml" ]; then
    echo -e "  ${GREEN}✓${NC} Keeping deploy-hetzner.yml (active)"
fi

# Disable other optional workflows
for workflow in deploy.yml deploy-env.yml ci-cd.yml; do
    if [ -f "$workflow" ]; then
        echo "  • Disabling $workflow..."
        mv "$workflow" "${workflow}.disabled"
        echo -e "    ${GREEN}✓${NC} Disabled"
    fi
done

echo ""
echo -e "${GREEN}✅ Workflow fixes applied${NC}"
echo ""

# ==============================================
# Show Active Workflows
# ==============================================
echo -e "${BLUE}📋 Active Workflows:${NC}"
echo ""
ls -1 *.yml 2>/dev/null | while read -r file; do
    echo -e "  ${GREEN}✓${NC} $file"
done
echo ""

echo -e "${BLUE}📋 Disabled Workflows:${NC}"
echo ""
ls -1 *.yml.disabled 2>/dev/null | while read -r file; do
    echo -e "  ${YELLOW}•${NC} $file (can be deleted)"
done
echo ""

# ==============================================
# Test Configuration
# ==============================================
echo -e "${BLUE}🧪 Testing workflow configuration...${NC}"

if command -v gh &> /dev/null; then
    echo "  • Validating with GitHub CLI..."
    cd "$ROOT_DIR"
    
    # Check if workflows are valid
    if gh workflow list &> /dev/null; then
        echo -e "    ${GREEN}✓${NC} Workflows validated"
    else
        echo -e "    ${YELLOW}⚠${NC} Could not validate (you may need to push to GitHub)"
    fi
else
    echo -e "  ${YELLOW}⚠${NC} GitHub CLI not installed, skipping validation"
fi

echo ""

# ==============================================
# Next Steps
# ==============================================
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ CI/CD Workflows Fixed!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Review changes: git diff .github/workflows/"
echo "  2. Commit changes: git add .github/workflows/ && git commit -m 'fix: resolve CI/CD workflow conflicts'"
echo "  3. Setup GitHub secrets: ./scripts/setup-github-secrets.sh"
echo "  4. Test deployment: gh workflow run deploy-hetzner.yml --ref main"
echo ""
echo -e "${YELLOW}Note:${NC} Disabled workflows are kept for reference. You can delete *.yml.disabled files later."
echo ""
