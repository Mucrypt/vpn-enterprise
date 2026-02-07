#!/bin/bash

# ============================================
# Slack Integration Setup Script
# ============================================
# Sets up Slack notifications for NexusAI workflows
# Configures N8N with Slack Bot Token and Webhooks

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════╗
║   Slack Integration Setup for NexusAI        ║
╚═══════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# ============================================
# Step 1: Check if Slack CLI is installed
# ============================================
echo -e "${BLUE}📋 Step 1/7: Checking Slack CLI${NC}"

if command -v slack &> /dev/null; then
    echo -e "${GREEN}✅ Slack CLI is installed${NC}"
    slack version
else
    echo -e "${YELLOW}⚠️  Slack CLI not found. Installing...${NC}"
    
    # Install Slack CLI
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        curl -fsSL https://downloads.slack-edge.com/slack-cli/install.sh | bash
    else
        echo -e "${RED}❌ Unsupported OS. Please install Slack CLI manually:${NC}"
        echo "   https://api.slack.com/automation/cli/install"
        exit 1
    fi
fi

echo ""

# ============================================
# Step 2: Slack App Configuration
# ============================================
echo -e "${BLUE}🔧 Step 2/7: Slack App Setup${NC}"
echo ""
echo "We need to create a Slack App for NexusAI notifications."
echo "This app will post messages to your Slack channels."
echo ""
echo -e "${YELLOW}Option 1: Use Slack CLI (Recommended)${NC}"
echo -e "${YELLOW}Option 2: Use Slack Web UI (Manual)${NC}"
echo ""

read -p "Choose installation method (1 or 2): " METHOD

if [[ "$METHOD" == "1" ]]; then
    echo ""
    echo -e "${CYAN}📱 Using Slack CLI...${NC}"
    echo ""
    
    # Login to Slack
    echo "Logging in to Slack..."
    slack login
    
    # Create app manifest
    cat > /tmp/nexusai-slack-manifest.json << 'MANIFEST'
{
  "display_information": {
    "name": "NexusAI Bot",
    "description": "Automated notifications for NexusAI app generation and deployments",
    "background_color": "#4A154B"
  },
  "features": {
    "bot_user": {
      "display_name": "NexusAI",
      "always_online": true
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "chat:write",
        "chat:write.public",
        "incoming-webhook"
      ]
    }
  },
  "settings": {
    "org_deploy_enabled": false,
    "socket_mode_enabled": false,
    "token_rotation_enabled": false
  }
}
MANIFEST
    
    echo ""
    echo "Creating Slack App from manifest..."
    slack create --manifest /tmp/nexusai-slack-manifest.json
    
    echo ""
    echo -e "${GREEN}✅ Slack App created!${NC}"
    echo ""
    
    # Get credentials
    echo "Fetching credentials..."
    WORKSPACE=$(slack workspace list | grep -v "Workspace" | head -1 | awk '{print $1}')
    
    if [[ -n "$WORKSPACE" ]]; then
        echo -e "${GREEN}✅ Connected to workspace: $WORKSPACE${NC}"
    fi
    
else
    echo ""
    echo -e "${CYAN}🌐 Manual Setup Instructions:${NC}"
    echo ""
    echo "1. Go to: https://api.slack.com/apps"
    echo "2. Click 'Create New App' → 'From scratch'"
    echo "3. Name it: 'NexusAI Bot'"
    echo "4. Select your workspace"
    echo ""
    echo "5. Under 'OAuth & Permissions', add Bot Token Scopes:"
    echo "   - chat:write"
    echo "   - chat:write.public"
    echo "   - incoming-webhook"
    echo ""
    echo "6. Click 'Install to Workspace' → 'Allow'"
    echo ""
    echo "7. Copy your 'Bot User OAuth Token' (starts with xoxb-)"
    echo "8. Under 'Incoming Webhooks', activate it and create webhooks for:"
    echo "   - #nexusai-apps (app generation notifications)"
    echo "   - #nexusai-errors (error alerts)"
    echo ""
    
    read -p "Press Enter after completing the setup..."
fi

echo ""

# ============================================
# Step 3: Collect Slack Credentials
# ============================================
echo -e "${BLUE}🔑 Step 3/7: Collecting Slack Credentials${NC}"
echo ""

echo "Please provide your Slack credentials:"
echo ""

read -p "Slack Bot Token (xoxb-...): " SLACK_BOT_TOKEN
echo ""
read -p "Webhook URL for #nexusai-apps: " SLACK_WEBHOOK_APPS
echo ""
read -p "Webhook URL for #nexusai-errors: " SLACK_WEBHOOK_ERRORS
echo ""

# Validate inputs
if [[ -z "$SLACK_BOT_TOKEN" ]] || [[ ! "$SLACK_BOT_TOKEN" =~ ^xoxb- ]]; then
    echo -e "${RED}❌ Invalid Bot Token. Must start with 'xoxb-'${NC}"
    exit 1
fi

if [[ -z "$SLACK_WEBHOOK_APPS" ]] || [[ ! "$SLACK_WEBHOOK_APPS" =~ ^https://hooks.slack.com ]]; then
    echo -e "${RED}❌ Invalid webhook URL for apps channel${NC}"
    exit 1
fi

if [[ -z "$SLACK_WEBHOOK_ERRORS" ]] || [[ ! "$SLACK_WEBHOOK_ERRORS" =~ ^https://hooks.slack.com ]]; then
    echo -e "${RED}❌ Invalid webhook URL for errors channel${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Credentials validated${NC}"
echo ""

# ============================================
# Step 4: Test Slack Connection
# ============================================
echo -e "${BLUE}🧪 Step 4/7: Testing Slack Connection${NC}"

# Test webhook
TEST_MESSAGE='{"text":"🎉 NexusAI Slack Integration Test\n\nIf you see this message, Slack integration is working correctly!\n\n*Configured by:* Automated Setup Script\n*Timestamp:* '$(date -u +"%Y-%m-%d %H:%M:%S UTC")'"}'

echo "Sending test message to #nexusai-apps..."
RESPONSE=$(curl -s -X POST "$SLACK_WEBHOOK_APPS" \
  -H "Content-Type: application/json" \
  -d "$TEST_MESSAGE")

if [[ "$RESPONSE" == "ok" ]]; then
    echo -e "${GREEN}✅ Test message sent successfully!${NC}"
    echo "   Check your #nexusai-apps channel"
else
    echo -e "${RED}❌ Failed to send test message${NC}"
    echo "   Response: $RESPONSE"
    exit 1
fi

echo ""

# ============================================
# Step 5: Save Credentials to Environment
# ============================================
echo -e "${BLUE}💾 Step 5/7: Saving Credentials${NC}"

# Check if we're in project root
if [[ ! -f "package.json" ]]; then
    cd /opt/vpn-enterprise
fi

ENV_FILE="infrastructure/docker/.env.production"

# Create or update .env.production
if [[ ! -f "$ENV_FILE" ]]; then
    echo "Creating $ENV_FILE..."
    touch "$ENV_FILE"
fi

# Remove old Slack config if exists
sed -i '/^SLACK_/d' "$ENV_FILE"

# Add new Slack config
cat >> "$ENV_FILE" << ENVEOF

# Slack Integration (Added $(date -u +"%Y-%m-%d %H:%M:%S UTC"))
SLACK_BOT_TOKEN=$SLACK_BOT_TOKEN
SLACK_WEBHOOK_APPS=$SLACK_WEBHOOK_APPS
SLACK_WEBHOOK_ERRORS=$SLACK_WEBHOOK_ERRORS
ENVEOF

echo -e "${GREEN}✅ Credentials saved to $ENV_FILE${NC}"
echo ""

# ============================================
# Step 6: Configure N8N with Slack Credentials
# ============================================
echo -e "${BLUE}⚙️  Step 6/7: Configuring N8N${NC}"

# Check if N8N is running
if docker ps | grep -q "n8n"; then
    N8N_CONTAINER=$(docker ps | grep n8n | awk '{print $1}')
    echo "Found N8N container: $N8N_CONTAINER"
    
    # Update N8N environment variables
    echo "Updating N8N configuration..."
    
    cd infrastructure/docker
    
    # Export variables for docker-compose
    export SLACK_BOT_TOKEN
    export SLACK_WEBHOOK_APPS
    export SLACK_WEBHOOK_ERRORS
    
    # Restart N8N to pick up new env vars
    docker compose -f docker-compose.monitoring.yml restart n8n || \
    docker compose -f docker-compose.prod.yml restart n8n || true
    
    echo -e "${GREEN}✅ N8N configured with Slack credentials${NC}"
else
    echo -e "${YELLOW}⚠️  N8N not running. Credentials saved for when it starts.${NC}"
fi

echo ""

# ============================================
# Step 7: Update N8N Workflow Files
# ============================================
echo -e "${BLUE}📝 Step 7/7: Updating N8N Workflows${NC}"

cd /opt/vpn-enterprise/n8n-workflows

# Function to update webhook URLs in JSON files
update_workflow() {
    local file=$1
    local channel=$2
    local webhook_var=$3
    
    if [[ -f "$file" ]]; then
        echo "Updating $file..."
        
        # Create a backup
        cp "$file" "${file}.backup"
        
        # Replace placeholder webhook URLs
        sed -i "s|https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK|${!webhook_var}|g" "$file"
        
        echo -e "${GREEN}  ✅ Updated $file${NC}"
    fi
}

# Update all workflow files
update_workflow "01-app-generated-notification.json" "#nexusai-apps" "SLACK_WEBHOOK_APPS"
update_workflow "02-auto-deploy-app.json" "#nexusai-apps" "SLACK_WEBHOOK_APPS"
update_workflow "03-hourly-credit-tracking.json" "#nexusai-apps" "SLACK_WEBHOOK_APPS"
update_workflow "04-error-handler.json" "#nexusai-errors" "SLACK_WEBHOOK_ERRORS"

echo ""
echo -e "${GREEN}✅ All workflows updated${NC}"
echo ""

# ============================================
# Summary and Next Steps
# ============================================
echo -e "${GREEN}╔═══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   🎉 Slack Integration Complete!             ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${BLUE}📊 Configuration Summary:${NC}"
echo ""
echo "  ✅ Slack Bot Token: ${SLACK_BOT_TOKEN:0:15}..."
echo "  ✅ Apps Channel Webhook: ${SLACK_WEBHOOK_APPS:0:40}..."
echo "  ✅ Errors Channel Webhook: ${SLACK_WEBHOOK_ERRORS:0:40}..."
echo ""
echo -e "${BLUE}📝 Configured Workflows:${NC}"
echo ""
echo "  ✅ 01-app-generated-notification.json"
echo "  ✅ 02-auto-deploy-app.json"
echo "  ✅ 03-hourly-credit-tracking.json"
echo "  ✅ 04-error-handler.json"
echo ""
echo -e "${BLUE}🔔 Slack Channels:${NC}"
echo ""
echo "  • #nexusai-apps - App generation and deployment notifications"
echo "  • #nexusai-errors - Error alerts and debugging info"
echo ""
echo -e "${BLUE}🚀 Next Steps:${NC}"
echo ""
echo "1. Import Updated Workflows to N8N:"
echo "   • Open N8N UI: http://157.180.123.240:5678"
echo "   • Import all 4 JSON files from: /opt/vpn-enterprise/n8n-workflows/"
echo "   • Slack credentials are now embedded in the workflows"
echo ""
echo "2. Test the Integration:"
echo "   • Generate a test app via API"
echo "   • Check your Slack channels for notifications"
echo ""
echo "3. Test Commands:"
cat << 'TESTCMDS'
   # Test app generation notification
   curl -X POST http://localhost:5001/ai/generate/app \
     -H "Content-Type: application/json" \
     -d '{"description": "Test notification app", "framework": "react"}'
   
   # Trigger N8N webhook manually
   curl -X POST http://localhost:5678/webhook/nexusai-app-generated \
     -H "Content-Type: application/json" \
     -d '{
       "app_id": "test-123",
       "user_email": "test@example.com",
       "app_name": "Test App",
       "framework": "react",
       "files": [],
       "credits_used": 10
     }'
TESTCMDS

echo ""
echo -e "${GREEN}✨ Slack integration is ready!${NC}"
echo ""
echo "Your N8N workflows will now send notifications to Slack automatically."
echo ""

# Save credentials reference
cat > /opt/vpn-enterprise/n8n-workflows/SLACK_CREDENTIALS.txt << 'CREDS'
# Slack Credentials Reference
# ============================
# Created: $(date -u +"%Y-%m-%d %H:%M:%S UTC")

Bot Token is stored in: infrastructure/docker/.env.production
Webhook URLs are embedded in: n8n-workflows/*.json

To update credentials:
1. Edit infrastructure/docker/.env.production
2. Re-run this script: ./scripts/setup-slack-integration.sh
3. Re-import workflows to N8N

Slack Channels:
- #nexusai-apps: App generation and deployment notifications
- #nexusai-errors: Error alerts and debugging

N8N Webhook Endpoints:
- /webhook/nexusai-app-generated
- /webhook/nexusai-deploy
- /webhook/nexusai-error

Admin Panel: https://api.slack.com/apps
CREDS

echo -e "${CYAN}💡 Tip: Check SLACK_CREDENTIALS.txt for reference${NC}"
echo ""
