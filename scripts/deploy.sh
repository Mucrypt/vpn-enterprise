#!/bin/bash

# ==============================================
# VPN Enterprise - Quick Deploy Script
# ==============================================
# Pushes code and optionally triggers deployment

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

REPO="Mucrypt/vpn-enterprise"

echo -e "${BLUE}🚀 VPN Enterprise Deployment Script${NC}\n"

# Check if there are changes to commit
if [[ -z $(git status -s) ]]; then
    echo -e "${YELLOW}⚠️  No changes to commit${NC}"
    echo "Do you want to trigger a deployment anyway? (y/n)"
    read -r DEPLOY_ANYWAY
    if [[ "$DEPLOY_ANYWAY" != "y" ]]; then
        echo "Exiting..."
        exit 0
    fi
else
    # Git operations
    echo -e "${YELLOW}📝 Committing changes...${NC}"
    git add .
    
    echo "Enter commit message:"
    read -r COMMIT_MSG
    
    if [[ -z "$COMMIT_MSG" ]]; then
        echo -e "${RED}❌ Commit message cannot be empty${NC}"
        exit 1
    fi
    
    git commit -m "$COMMIT_MSG"
    
    echo -e "${YELLOW}⬆️  Pushing to GitHub...${NC}"
    git push
    echo -e "${GREEN}✅ Code pushed to GitHub${NC}\n"
fi

# Ask about deployment
echo -e "${YELLOW}Deploy to production? (y/n/auto)${NC}"
echo "  y    - Trigger deployment now"
echo "  n    - Skip deployment (CI will auto-deploy on main)"
echo "  auto - Wait for automatic deployment"
read -r DEPLOY_CHOICE

case "$DEPLOY_CHOICE" in
    y)
        echo -e "${BLUE}🚀 Triggering deployment...${NC}"
        gh workflow run "Deploy to Hetzner (Docker Compose)" \
          --repo $REPO \
          --ref main \
          -f ref=main \
          -f rebuild=true
        
        echo -e "${GREEN}✅ Deployment triggered!${NC}\n"
        echo "Waiting for workflow to start..."
        sleep 5
        
        echo "Watch deployment progress? (y/n)"
        read -r WATCH
        if [[ "$WATCH" == "y" ]]; then
            gh run watch --repo $REPO
        else
            echo -e "${BLUE}View deployment at: https://github.com/$REPO/actions${NC}"
        fi
        ;;
    
    auto)
        echo -e "${BLUE}⏳ Waiting for automatic deployment...${NC}"
        echo "The CI workflow will trigger deployment when it completes."
        sleep 3
        echo "Watching for deployment runs..."
        gh run list --repo $REPO --workflow=deploy-hetzner.yml --limit 1
        ;;
    
    n|*)
        echo -e "${GREEN}✅ Done! CI will auto-deploy on main branch.${NC}"
        echo -e "${BLUE}View progress at: https://github.com/$REPO/actions${NC}"
        ;;
esac

echo -e "\n${GREEN}🎉 Complete!${NC}"
