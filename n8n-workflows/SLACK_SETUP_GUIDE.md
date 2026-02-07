# Slack Integration Quick Setup Guide

## 🚀 Automated Setup (Recommended)

Run this single command on your Hetzner server:

```bash
cd /opt/vpn-enterprise
chmod +x scripts/setup-slack-integration.sh
./scripts/setup-slack-integration.sh
```

The script will:

1. ✅ Check for Slack CLI (install if needed)
2. ✅ Create Slack App with proper permissions
3. ✅ Collect Bot Token and Webhook URLs
4. ✅ Test Slack connection
5. ✅ Save credentials securely
6. ✅ Update N8N workflows with credentials
7. ✅ Send test message to verify setup

---

## 🎯 Manual Setup (If Script Fails)

### Step 1: Create Slack App

1. Go to: https://api.slack.com/apps
2. Click **"Create New App"** → **"From scratch"**
3. Name: `NexusAI Bot`
4. Select your workspace

### Step 2: Configure Permissions

1. Go to **"OAuth & Permissions"**
2. Under **"Bot Token Scopes"**, add:
   - `chat:write`
   - `chat:write.public`
   - `incoming-webhook`
3. Click **"Install to Workspace"** → **"Allow"**
4. Copy the **Bot User OAuth Token** (starts with `xoxb-`)

### Step 3: Create Incoming Webhooks

1. Go to **"Incoming Webhooks"**
2. Activate Incoming Webhooks: **ON**
3. Click **"Add New Webhook to Workspace"**
4. Select channel: `#nexusai-apps` → **"Allow"**
5. Copy the webhook URL
6. Repeat for `#nexusai-errors` channel

### Step 4: Save Credentials

Add to `/opt/vpn-enterprise/infrastructure/docker/.env.production`:

```bash
# Slack Integration
SLACK_BOT_TOKEN=xoxb-your-bot-token-here
SLACK_WEBHOOK_APPS=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SLACK_WEBHOOK_ERRORS=https://hooks.slack.com/services/YOUR/ERROR/WEBHOOK
```

### Step 5: Update N8N Workflows

Replace placeholder webhooks in all workflow JSON files:

```bash
cd /opt/vpn-enterprise/n8n-workflows

# Update app notification webhook
sed -i 's|https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK|YOUR_ACTUAL_WEBHOOK_URL|g' \
  01-app-generated-notification.json

# Update deployment webhook
sed -i 's|https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK|YOUR_ACTUAL_WEBHOOK_URL|g' \
  02-auto-deploy-app.json

# Update billing webhook
sed -i 's|https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK|YOUR_ACTUAL_WEBHOOK_URL|g' \
  03-hourly-credit-tracking.json

# Update error handler webhook
sed -i 's|https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK|YOUR_ERROR_WEBHOOK_URL|g' \
  04-error-handler.json
```

### Step 6: Test Connection

```bash
# Test webhook with curl
curl -X POST "YOUR_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"text":"🎉 NexusAI Slack Integration Test - Success!"}'
```

---

## 📋 Slack Channels Setup

Create these channels in your Slack workspace:

### 1. `#nexusai-apps`

**Purpose**: App generation and deployment notifications

**Example messages**:

- 🎉 New app generated
- ✅ Deployment successful
- 💰 Credit usage updates

### 2. `#nexusai-errors`

**Purpose**: Error alerts and debugging

**Example messages**:

- ❌ Deployment failed
- 🐛 Error detected in production
- 🔧 Auto-fix PR created

---

## 🧪 Testing the Integration

### Test 1: Send Manual Slack Message

```bash
curl -X POST "YOUR_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Test from NexusAI",
    "blocks": [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "🎉 *NexusAI Integration Test*\n\nSlack notifications are working!"
        }
      }
    ]
  }'
```

### Test 2: Trigger N8N Webhook

```bash
curl -X POST http://localhost:5678/webhook/nexusai-app-generated \
  -H "Content-Type: application/json" \
  -d '{
    "app_id": "test-123",
    "user_email": "test@example.com",
    "app_name": "Test App",
    "framework": "react",
    "files": [{"path": "App.jsx", "language": "javascript"}],
    "credits_used": 10
  }'
```

Check your `#nexusai-apps` channel for the notification!

### Test 3: Generate Real App

```bash
curl -X POST http://localhost:5001/ai/generate/app \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Simple counter app",
    "framework": "react"
  }'
```

This should:

1. Generate the app
2. Trigger Python API webhook to N8N
3. N8N sends notification to Slack
4. You see message in `#nexusai-apps`

---

## 🔧 Troubleshooting

### ❌ "Invalid webhook URL" error

**Problem**: Webhook URL is incorrect or expired

**Solution**:

```bash
# Regenerate webhook in Slack
# 1. Go to https://api.slack.com/apps
# 2. Select your app → "Incoming Webhooks"
# 3. Click "Add New Webhook to Workspace"
# 4. Update .env.production with new URL
```

### ❌ "Channel not found" error

**Problem**: Slack channels don't exist

**Solution**:

```bash
# Create channels in Slack:
# 1. Click "+" next to "Channels"
# 2. Create "#nexusai-apps" (public)
# 3. Create "#nexusai-errors" (public)
# 4. Invite @NexusAI Bot to both channels
```

### ❌ "Authentication failed" error

**Problem**: Bot token is invalid or expired

**Solution**:

```bash
# Reinstall app to workspace:
# 1. Go to https://api.slack.com/apps
# 2. Select your app → "OAuth & Permissions"
# 3. Click "Reinstall to Workspace"
# 4. Copy new Bot Token
# 5. Update .env.production
```

### ❌ Messages not appearing in Slack

**Problem**: N8N workflow not configured or not running

**Solution**:

```bash
# Check N8N status
docker ps | grep n8n

# Check N8N logs
docker logs $(docker ps -qf "name=n8n") --tail 50

# Restart N8N
docker restart $(docker ps -qf "name=n8n")

# Re-import workflows to N8N UI
```

### ❌ "No active workflows" in N8N

**Problem**: Workflows not imported or not activated

**Solution**:

1. Open N8N UI: http://157.180.123.240:5678
2. Import all 4 JSON files from `/opt/vpn-enterprise/n8n-workflows/`
3. Click each workflow → Toggle "Active" ON (top right)
4. Save changes

---

## 📊 Monitoring Slack Integration

### Check Slack Message Rate Limits

Slack has rate limits:

- Free: 1 message per second
- Standard/Plus: Higher limits

Monitor in N8N:

- Executions → Check for "Rate limit" errors
- If errors: Add delay nodes between Slack notifications

### View Slack Logs

```bash
# N8N execution logs (includes Slack calls)
docker logs -f $(docker ps -qf "name=n8n") | grep -i slack

# Python API logs (webhook triggers)
docker logs -f vpn-python-api | grep -i webhook
```

### Slack Analytics

Go to: https://slack.com/apps/manage → Select "NexusAI Bot" → "Analytics"

View:

- Messages sent per day
- Active users
- Error rate

---

## 🎨 Customize Slack Messages

Edit the workflow JSON files to customize:

### Example: Rich App Notification

```json
{
  "text": "🎉 *New App Generated*",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*User:* {{$json.user_email}}\n*App:* {{$json.app_name}}\n*Framework:* {{$json.framework}}"
      }
    },
    {
      "type": "section",
      "fields": [
        {
          "type": "mrkdwn",
          "text": "*Files:*\n{{$json.files.length}}"
        },
        {
          "type": "mrkdwn",
          "text": "*Credits:*\n{{$json.credits_used}}"
        }
      ]
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "View App"
          },
          "url": "https://chatbuilds.com/nexusai/apps/{{$json.app_id}}"
        }
      ]
    }
  ]
}
```

---

## 📚 Additional Resources

- **Slack API Docs**: https://api.slack.com/
- **Block Kit Builder**: https://api.slack.com/block-kit
- **Webhook Guide**: https://api.slack.com/messaging/webhooks
- **N8N Slack Node**: https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.slack/

---

## ✅ Success Checklist

- [ ] Slack App created
- [ ] Bot Token obtained (xoxb-...)
- [ ] Webhooks created for both channels
- [ ] Credentials saved to .env.production
- [ ] N8N workflows updated with webhooks
- [ ] N8N is running and workflows are active
- [ ] Test message sent successfully
- [ ] #nexusai-apps channel receiving notifications
- [ ] #nexusai-errors channel configured
- [ ] Bot invited to both channels

Once all checked, your Slack integration is complete! 🎉

---

**Need Help?** Check troubleshooting section or run: `./scripts/setup-slack-integration.sh` for automated setup.
