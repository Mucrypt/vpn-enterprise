#!/bin/bash

# ==============================================
# VPN Enterprise - Production Deploy
# ==============================================
# Commits, pushes, triggers CI/CD, and deploys to live server
# Usage: npm run deploy

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
    echo -e "${YELLOW}📝 Uncommitted changes detected${NC}"
    git status -s
    echo ""
    echo "Enter commit message (or 'skip' to deploy without committing):"
    read -r COMMIT_MSG
    
    if [[ "$COMMIT_MSG" == "skip" ]]; then
        echo -e "${YELLOW}⚠️  Skipping commit${NC}"
    elif [[ -z "$COMMIT_MSG" ]]; then
        echo -e "${RED}❌ Commit message cannot be empty${NC}"
        exit 1
    else
        git add .
        git commit -m "$COMMIT_MSG"
        echo -e "${GREEN}✅ Changes committed${NC}"
    fi
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
# STEP 3: Trigger CI/CD Pipeline
# ==============================================
echo -e "${BLUE}🚀 Step 3/5: Trigger CI/CD Pipeline${NC}"

echo "CI/CD workflows will run automatically on push to $BRANCH"
echo "Waiting for CI to start..."
sleep 5

# Get the latest workflow run
CI_RUN_ID=$(gh run list --repo $REPO --workflow=ci.yml --branch $BRANCH --limit 1 --json databaseId --jq '.[0].databaseId')

if [[ -n "$CI_RUN_ID" ]]; then
    echo -e "${GREEN}✅ CI workflow started (Run ID: $CI_RUN_ID)${NC}"
    echo -e "${CYAN}🔗 https://github.com/$REPO/actions/runs/$CI_RUN_ID${NC}\n"
    
    echo "Wait for CI to complete? (y/n)"
    read -r WAIT_CI
    
    if [[ "$WAIT_CI" == "y" ]]; then
        echo "Watching CI progress..."
        gh run watch $CI_RUN_ID --repo $REPO --exit-status || {
            echo -e "${YELLOW}⚠️  CI failed, but continuing with deployment${NC}"
        }
    fi
else
    echo -e "${YELLOW}⚠️  Could not detect CI run (may still be queued)${NC}"
fi

echo ""

# ==============================================
# STEP 4: Trigger Deployment to Live Server
# ==============================================
echo -e "${BLUE}🚀 Step 4/5: Deploy to Live Server${NC}"

echo "Deploy to production server ($SERVER_HOST)? (y/n)"
read -r DEPLOY_NOW

if [[ "$DEPLOY_NOW" == "y" ]]; then
    echo -e "${YELLOW}🚀 Triggering Hetzner deployment...${NC}"
    
    # Trigger the deployment workflow
    gh workflow run deploy-hetzner.yml \
      --repo $REPO \
      --ref $BRANCH
    
    echo -e "${GREEN}✅ Deployment workflow triggered${NC}"
    sleep 5
    
    # Get the deployment run ID
    DEPLOY_RUN_ID=$(gh run list --repo $REPO --workflow=deploy-hetzner.yml --limit 1 --json databaseId --jq '.[0].databaseId')
    
    if [[ -n "$DEPLOY_RUN_ID" ]]; then
        echo -e "${CYAN}🔗 https://github.com/$REPO/actions/runs/$DEPLOY_RUN_ID${NC}\n"
        
        echo "Watch deployment progress? (y/n)"
        read -r WATCH_DEPLOY
        
        if [[ "$WATCH_DEPLOY" == "y" ]]; then
            gh run watch $DEPLOY_RUN_ID --repo $REPO --exit-status
        fi
    fi
    
    # Wait a bit for deployment to start
    echo -e "${BLUE}⏳ Waiting for deployment to start...${NC}"
    sleep 10
else
    echo -e "${YELLOW}⏭️  Skipping immediate deployment${NC}"
    echo "Deployment will auto-trigger when CI completes successfully"
fi

echo ""

# ==============================================
# STEP 5: Verify Deployment
# ==============================================
echo -e "${BLUE}🔍 Step 5/5: Verify Deployment${NC}"

echo "Check server status? (y/n)"
read -r CHECK_STATUS

if [[ "$CHECK_STATUS" == "y" ]]; then
    echo -e "${YELLOW}📡 Connecting to server...${NC}"
    
    # Check if SSH connection works
    if ssh -o ConnectTimeout=5 $SERVER_USER@$SERVER_HOST "echo 'Connection successful'" 2>/dev/null; then
        echo -e "${GREEN}✅ Server connection successful${NC}\n"
        
        echo "Container status:"
        ssh $SERVER_USER@$SERVER_HOST "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | head -10"
        
        echo ""
        echo -e "${YELLOW}Service health checks:${NC}"
        
        # Health checks
        echo -n "  API:         "
        curl -sf https://chatbuilds.com/api/health -o /dev/null && echo -e "${GREEN}✅ Healthy${NC}" || echo -e "${RED}❌ Down${NC}"
        
        echo -n "  Web:         "
        curl -sf https://chatbuilds.com/ -o /dev/null && echo -e "${GREEN}✅ Healthy${NC}" || echo -e "${RED}❌ Down${NC}"
        
        echo -n "  Python API:  "
        ssh $SERVER_USER@$SERVER_HOST "docker exec vpn-python-api curl -sf http://localhost:5001/health" > /dev/null && echo -e "${GREEN}✅ Healthy${NC}" || echo -e "${RED}❌ Down${NC}"
        
        echo -n "  NexusAI:     "
        curl -sf https://chatbuilds.com/nexusai/ -o /dev/null && echo -e "${GREEN}✅ Healthy${NC}" || echo -e "${RED}❌ Down${NC}"
        
    else
        echo -e "${RED}❌ Could not connect to server${NC}"
        echo "Check your SSH keys and server access"
    fi
fi

# ==============================================
# Summary
# ==============================================
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "📊 ${BLUE}Deployment Summary:${NC}"
echo "   • Branch: $BRANCH"
echo "   • Server: $SERVER_HOST"
echo "   • CI/CD: https://github.com/$REPO/actions"
echo "   • Live Site: https://chatbuilds.com"
echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "   1. Monitor logs: npm run hetzner:logs"
echo "   2. Check status: npm run hetzner:status"
echo "   3. View workflows: gh run list --repo $REPO"
echo ""
