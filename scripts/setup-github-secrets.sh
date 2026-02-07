#!/bin/bash
# ==============================================
# GitHub Secrets Setup Helper
# ==============================================
# Automatically configure all required GitHub secrets for CI/CD

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

REPO="Mucrypt/vpn-enterprise"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SECRETS_DIR="$ROOT_DIR/infrastructure/docker/secrets"

echo -e "${BLUE}"
cat << "EOF"
╔══════════════════════════════════════════════╗
║   GitHub Secrets Setup for CI/CD            ║
╚══════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) is not installed${NC}"
    echo "Install it with: sudo apt install gh"
    echo "Or visit: https://cli.github.com"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not authenticated with GitHub${NC}"
    echo "Authenticating..."
    gh auth login
fi

echo -e "${GREEN}✅ GitHub CLI ready${NC}\n"

# ==============================================
# STEP 1: Server Configuration
# ==============================================
echo -e "${BLUE}📡 Step 1/4: Server Configuration${NC}"

HETZNER_HOST="${HETZNER_HOST:-157.180.123.240}"
HETZNER_USER="${HETZNER_USER:-root}"
HETZNER_APP_DIR="${HETZNER_APP_DIR:-/opt/vpn-enterprise}"

echo "Hetzner Server Host: $HETZNER_HOST"
echo "SSH User: $HETZNER_USER"
echo "App Directory: $HETZNER_APP_DIR"
echo ""
read -p "Is this correct? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Edit the script or export HETZNER_HOST, HETZNER_USER, HETZNER_APP_DIR"
    exit 1
fi

echo "Setting server secrets..."
gh secret set HETZNER_HOST -b "$HETZNER_HOST" -R "$REPO"
gh secret set HETZNER_USER -b "$HETZNER_USER" -R "$REPO"
gh secret set HETZNER_APP_DIR -b "$HETZNER_APP_DIR" -R "$REPO"
echo -e "${GREEN}✅ Server configuration secrets set${NC}\n"

# ==============================================
# STEP 2: SSH Key
# ==============================================
echo -e "${BLUE}🔑 Step 2/4: SSH Private Key${NC}"

SSH_KEY_PATH="${SSH_HOME:-$HOME}/.ssh/id_ed25519"
if [ ! -f "$SSH_KEY_PATH" ]; then
    echo -e "${YELLOW}⚠️  SSH key not found at $SSH_KEY_PATH${NC}"
    echo "Available keys:"
    ls -1 "$HOME/.ssh/" | grep -E "^id_"
    read -p "Enter SSH key path: " SSH_KEY_PATH
    SSH_KEY_PATH="${SSH_KEY_PATH/#\~/$HOME}"
fi

if [ -f "$SSH_KEY_PATH" ]; then
    echo "Using SSH key: $SSH_KEY_PATH"
    gh secret set HETZNER_SSH_PRIVATE_KEY < "$SSH_KEY_PATH" -R "$REPO"
    echo -e "${GREEN}✅ SSH key secret set${NC}\n"
else
    echo -e "${RED}❌ SSH key not found${NC}"
    exit 1
fi

# ==============================================
# STEP 3: Environment File
# ==============================================
echo -e "${BLUE}📄 Step 3/4: Environment Configuration${NC}"

ENV_FILE="$ROOT_DIR/.env.production"
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ .env.production not found at $ENV_FILE${NC}"
    echo "Create it first or specify path:"
    read -p "Path to .env.production: " ENV_FILE
    ENV_FILE="${ENV_FILE/#\~/$HOME}"
fi

if [ -f "$ENV_FILE" ]; then
    echo "Environment file: $ENV_FILE"
    echo "Lines: $(wc -l < "$ENV_FILE")"
    gh secret set ENV_PRODUCTION < "$ENV_FILE" -R "$REPO"
    echo -e "${GREEN}✅ Environment file secret set${NC}\n"
else
    echo -e "${RED}❌ Environment file not found${NC}"
    exit 1
fi

# ==============================================
# STEP 4: Docker Secrets
# ==============================================
echo -e "${BLUE}🔐 Step 4/4: Docker Secrets${NC}"

if [ ! -d "$SECRETS_DIR" ]; then
    echo -e "${RED}❌ Secrets directory not found: $SECRETS_DIR${NC}"
    exit 1
fi

cd "$SECRETS_DIR"

# Function to set secret from file
set_secret_from_file() {
    local file_name=$1
    local secret_name=$2
    
    if [ -f "$file_name" ]; then
        echo "  Setting $secret_name..."
        gh secret set "$secret_name" < "$file_name" -R "$REPO"
        echo -e "  ${GREEN}✓${NC} $secret_name set"
    else
        echo -e "  ${YELLOW}⚠${NC} $file_name not found, skipping..."
    fi
}

echo "Setting Docker secrets from: $SECRETS_DIR"
echo ""

set_secret_from_file "db_password" "SECRET_DB_PASSWORD"
set_secret_from_file "redis_password" "SECRET_REDIS_PASSWORD"
set_secret_from_file "n8n_encryption_key" "SECRET_N8N_ENCRYPTION_KEY"
set_secret_from_file "api_key" "SECRET_API_KEY"
set_secret_from_file "stripe_secret_key" "SECRET_STRIPE_SECRET_KEY"
set_secret_from_file "stripe_webhook_secret" "SECRET_STRIPE_WEBHOOK_SECRET"

echo -e "\n${GREEN}✅ All Docker secrets set${NC}\n"

# ==============================================
# STEP 5: Optional Secrets
# ==============================================
echo -e "${BLUE}🔔 Optional: Slack Webhook${NC}"
read -p "Configure Slack webhook? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter Slack webhook URL: " SLACK_WEBHOOK
    echo "$SLACK_WEBHOOK" | gh secret set SLACK_WEBHOOK -R "$REPO"
    echo -e "${GREEN}✅ Slack webhook set${NC}\n"
else
    echo "Skipping Slack webhook (notifications will be disabled)"
    echo ""
fi

# ==============================================
# Verification
# ==============================================
echo -e "${BLUE}🔍 Verifying secrets...${NC}"
gh secret list -R "$REPO"

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ GitHub Secrets Setup Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Test SSH connection: ssh $HETZNER_USER@$HETZNER_HOST 'echo success'"
echo "  2. Verify repo on server: ssh $HETZNER_USER@$HETZNER_HOST 'ls -la $HETZNER_APP_DIR'"
echo "  3. Test deployment: gh workflow run deploy-hetzner.yml --ref main"
echo "  4. Watch deployment: gh run watch"
echo ""
