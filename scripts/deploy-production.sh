#!/bin/bash

# ==============================================
# VPN Enterprise - Production Deploy
# ==============================================
# Commits, pushes, triggers CI/CD, and deploys to live server
# Usage: npm run deploy [message]
# Example: npm run deploy "feat: add new dashboard"

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

REPO="Mucrypt/vpn-enterprise"
BRANCH="main"
SERVER_HOST="${HETZNER_HOST:-157.180.123.240}"
SERVER_USER="${HETZNER_USER:-root}"

# Get commit message from argument
DEPLOY_MESSAGE="$*"
AUTO_MODE=false

# Check for flags
if [[ "$1" == "--auto" ]] || [[ "$1" == "-a" ]]; then
    AUTO_MODE=true
    shift
    DEPLOY_MESSAGE="$*"
fi

echo -e "${CYAN}"
cat << "EOF"
╔══════════════════════════════════════════════╗
║   VPN Enterprise - Production Deployment    ║
╚══════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# ==============================================
# STEP 1: Pre-flight Checks
# ==============================================
echo -e "${BLUE}🔍 Step 1/5: Pre-flight Checks${NC}"

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) is not installed${NC}"
    echo "Install it with: sudo apt install gh"
    exit 1
fi

# Check if on correct branch
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "$BRANCH" ]]; then
    echo -e "${YELLOW}⚠️  You're on branch '$CURRENT_BRANCH', not '$BRANCH'${NC}"
    echo "Switch to $BRANCH? (y/n)"
    read -r SWITCH
    if [[ "$SWITCH" == "y" ]]; then
        git checkout $BRANCH
        git pull origin $BRANCH
    else
        echo "Deploying from $CURRENT_BRANCH..."
        BRANCH=$CURRENT_BRANCH
    fi
fi

echo -e "${GREEN}✅ Pre-flight checks passed${NC}\n"

# ==============================================
# STEP 2: Commit & Push Changes
# ==============================================
echo -e "${BLUE}🔄 Step 2/5: Commit & Push Changes${NC}"

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    echo -e "${YELLOW}📝 Uncommitted changes detected:${NC}"
    git status -s | head -10
    if [[ $(git status -s | wc -l) -gt 10 ]]; then
        echo "   ... and $(($(git status -s | wc -l) - 10)) more files"
    fi
    echo ""
    
    # Use provided message or ask
    if [[ -n "$DEPLOY_MESSAGE" ]]; then
        COMMIT_MSG="$DEPLOY_MESSAGE"
        echo -e "${CYAN}Using commit message: ${NC}$COMMIT_MSG"
    else
        echo "Enter commit message (or 'skip' to deploy without committing):"
        read -r COMMIT_MSG
    fi
    
    if [[ "$COMMIT_MSG" == "skip" ]]; then
        echo -e "${YELLOW}⚠️  Skipping commit${NC}"
    elif [[ -z "$COMMIT_MSG" ]]; then
        echo -e "${RED}❌ Commit message cannot be empty${NC}"
        exit 1
    else
        git add .
        git commit -m "$COMMIT_MSG"
        echo -e "${GREEN}✅ Changes committed: ${NC}$COMMIT_MSG"
    fi
else
    echo -e "${GREEN}✅ No uncommitted changes${NC}"
fi

# Push to GitHub
if [[ $(git rev-list --count origin/$BRANCH..$BRANCH 2>/dev/null) -gt 0 ]]; then
    echo -e "${YELLOW}⬆️  Pushing to GitHub...${NC}"
    git push origin $BRANCH
    echo -e "${GREEN}✅ Code pushed to GitHub${NC}\n"
    sleep 2
else
    echo -e "${YELLOW}ℹ️  No new commits to push${NC}\n"
fi

# ==============================================
# STEP 3: Monitor CI/CD Pipeline
# ==============================================
echo -e "${BLUE}🚀 Step 3/5: Monitor CI/CD Pipeline${NC}"

echo "CI/CD will run automatically on push to $BRANCH"
echo -e "${CYAN}⏳ Waiting for CI to start...${NC}"
sleep 5

# Get the latest workflow run
CI_RUN_ID=$(gh run list --repo $REPO --workflow=ci.yml --branch $BRANCH --limit 1 --json databaseId,status,conclusion --jq '.[0]')

if [[ -n "$CI_RUN_ID" ]]; then
    RUN_ID=$(echo "$CI_RUN_ID" | jq -r '.databaseId')
    RUN_STATUS=$(echo "$CI_RUN_ID" | jq -r '.status')
    
    echo -e "${GREEN}✅ CI workflow detected${NC}"
    echo -e "${CYAN}🔗 https://github.com/$REPO/actions/runs/$RUN_ID${NC}"
    
    # Auto-watch in auto mode, otherwise ask
    if [[ "$AUTO_MODE" == true ]]; then
        WAIT_CI="y"
    else
        echo ""
        read -p "Watch CI progress? (Y/n): " -n 1 -r WAIT_CI
        echo
        [[ -z "$WAIT_CI" || "$WAIT_CI" =~ ^[Yy]$ ]] && WAIT_CI="y" || WAIT_CI="n"
    fi
    
    if [[ "$WAIT_CI" == "y" ]]; then
        echo -e "${CYAN}👀 Watching CI pipeline...${NC}"
        gh run watch $RUN_ID --repo $REPO --exit-status || {
            echo -e "${RED}❌ CI failed!${NC}"
            echo "Check logs: gh run view $RUN_ID --repo $REPO --log-failed"
            exit 1
        }
        echo -e "${GREEN}✅ CI passed successfully!${NC}"
    else
        echo -e "${YELLOW}⏭️  Skipping CI watch${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Could not detect CI run (may still be queued)${NC}"
fi

echo ""

# ==============================================
# STEP 4: Monitor Deployment to Production
# ==============================================
echo -e "${BLUE}🚀 Step 4/5: Monitor Production Deployment${NC}"

echo -e "${CYAN}⏳ Waiting for deployment to trigger...${NC}"
sleep 10

# Get the latest deployment run
DEPLOY_RUN_ID=$(gh run list --repo $REPO --workflow=deploy-hetzner.yml --branch $BRANCH --limit 1 --json databaseId,status,conclusion --jq '.[0]')

if [[ -n "$DEPLOY_RUN_ID" ]]; then
    RUN_ID=$(echo "$DEPLOY_RUN_ID" | jq -r '.databaseId')
    RUN_STATUS=$(echo "$DEPLOY_RUN_ID" | jq -r '.status')
    
    echo -e "${GREEN}✅ Deployment workflow detected${NC}"
    echo -e "${CYAN}🔗 https://github.com/$REPO/actions/runs/$RUN_ID${NC}"
    
    # Auto-watch in auto mode, otherwise ask
    if [[ "$AUTO_MODE" == true ]]; then
        WATCH_DEPLOY="y"
    else
        echo ""
        read -p "Watch deployment progress? (Y/n): " -n 1 -r WATCH_DEPLOY
        echo
        [[ -z "$WATCH_DEPLOY" || "$WATCH_DEPLOY" =~ ^[Yy]$ ]] && WATCH_DEPLOY="y" || WATCH_DEPLOY="n"
    fi
    
    if [[ "$WATCH_DEPLOY" == "y" ]]; then
        echo -e "${CYAN}👀 Watching deployment to $SERVER_HOST...${NC}"
        gh run watch $RUN_ID --repo $REPO --exit-status || {
            echo -e "${RED}❌ Deployment failed!${NC}"
            echo "Check logs: gh run view $RUN_ID --repo $REPO --log-failed"
            exit 1
        }
        echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
    else
        echo -e "${YELLOW}⏭️  Deployment running in background${NC}"
        echo "Monitor: gh run watch $RUN_ID --repo $REPO"
    fi
else
    echo -e "${YELLOW}⚠️  Deployment workflow not detected yet${NC}"
    echo "It will auto-trigger when CI completes"
fi

echo ""

# ==============================================
# STEP 5: Verify Deployment
# ==============================================
echo -e "${BLUE}🔍 Step 5/5: Verify Deployment${NC}"

# Auto-verify in auto mode
if [[ "$AUTO_MODE" == true ]]; then
    CHECK_STATUS="y"
else
    read -p "Run health checks? (Y/n): " -n 1 -r CHECK_STATUS
    echo
    [[ -z "$CHECK_STATUS" || "$CHECK_STATUS" =~ ^[Yy]$ ]] && CHECK_STATUS="y" || CHECK_STATUS="n"
fi

if [[ "$CHECK_STATUS" == "y" ]]; then
    echo -e "${CYAN}⏳ Waiting for services to stabilize...${NC}"
    sleep 15
    
    echo -e "${YELLOW}🏥 Running health checks...${NC}"
    echo ""
    
    FAIL_COUNT=0
    
    # Health checks
    echo -n "  API:           "
    if curl -sf https://chatbuilds.com/api/health -o /dev/null 2>&1; then
        echo -e "${GREEN}✅ Healthy${NC}"
    else
        echo -e "${RED}❌ Down${NC}"
        ((FAIL_COUNT++))
    fi
    
    echo -n "  Web:           "
    if curl -sf https://chatbuilds.com/ -o /dev/null 2>&1; then
        echo -e "${GREEN}✅ Healthy${NC}"
    else
        echo -e "${RED}❌ Down${NC}"
        ((FAIL_COUNT++))
    fi
    
    echo -n "  NexusAI:       "
    if curl -sf https://chatbuilds.com/nexusai/ -o /dev/null 2>&1; then
        echo -e "${GREEN}✅ Healthy${NC}"
    else
        echo -e "${YELLOW}⚠️  Unavailable${NC}"
    fi
    
    echo ""
    if [[ $FAIL_COUNT -eq 0 ]]; then
        echo -e "${GREEN}✅ All critical services healthy${NC}"
    else
        echo -e "${YELLOW}⚠️  $FAIL_COUNT service(s) need attention${NC}"
    fi
else
    echo -e "${YELLOW}⏭️  Skipped health checks${NC}"
fi

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     🎉 Deployment Workflow Complete!         ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "📊 ${BLUE}Summary:${NC}"
echo "   • Branch:    $BRANCH"
echo "   • Server:    $SERVER_HOST"
echo "   • Live Site: ${CYAN}https://chatbuilds.com${NC}"
if [[ -n "$COMMIT_MSG" && "$COMMIT_MSG" != "skip" ]]; then
    echo "   • Changes:   $COMMIT_MSG"
fi
echo ""
echo -e "${YELLOW}🔧 Quick Commands:${NC}"
echo "   • Logs:     ${CYAN}npm run hetzner:logs${NC}"
echo "   • Status:   ${CYAN}npm run hetzner:status${NC}"
echo "   • Actions:  ${CYAN}https://github.com/$REPO/actions${NC}"
echo ""
echo -e "${GREEN}✨ Your feature is now live!${NC}"
echo ""
