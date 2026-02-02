# VPN Enterprise - AI Provider API Keys Setup Guide

## 🚀 Quick Start

NexusAI now uses **OpenAI GPT-4o** and **Anthropic Claude 3.7 Sonnet** - MORE POWERFUL than Cursor or Lovable!

### Step 1: Get API Keys

#### Option A: OpenAI (Recommended)

1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Model: **GPT-4o** (best for code generation)
4. Cost: ~$2.50 per 1M input tokens, ~$10 per 1M output tokens

#### Option B: Anthropic

1. Go to https://console.anthropic.com/
2. Create a new API key
3. Model: **Claude 3.7 Sonnet** (excellent reasoning)
4. Cost: ~$3 per 1M input tokens, ~$15 per 1M output tokens

### Step 2: Set Environment Variables on Server

```bash
# SSH into your server
ssh root@157.180.123.240

# Navigate to the project
cd /opt/vpn-enterprise/infrastructure/docker

# Create .env file (if it doesn't exist)
nano .env

# Add your API keys:
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx
AI_PROVIDER=openai

# Or for Anthropic:
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxx
AI_PROVIDER=anthropic

# Save and restart
docker compose -f docker-compose.prod.yml restart python-api
```

### Step 3: Test

```bash
curl -X POST https://chatbuilds.com/api/ai/generate/app \
  -H "Content-Type: application/json" \
  -H "X-API-Token: test-token-for-demo" \
  -d '{
    "description": "Todo app with dark mode",
    "framework": "react",
    "provider": "openai"
  }'
```

## 💰 Cost Estimates

### Small App (Todo List)

- Input: ~2,000 tokens ($0.005)
- Output: ~8,000 tokens ($0.08)
- **Total: ~$0.085 per app**

### Large App (Full Dashboard)

- Input: ~5,000 tokens ($0.0125)
- Output: ~15,000 tokens ($0.15)
- **Total: ~$0.1625 per app**

**Much cheaper than hiring developers!** 🎉

## 🔥 Why This Is Better Than Cursor/Lovable

1. **Latest Models**: GPT-4o & Claude 3.7 Sonnet (Feb 2025)
2. **Larger Context**: 128K tokens vs their limits
3. **Better Code**: More accurate, production-ready output
4. **No Server Limits**: Runs on powerful OpenAI/Anthropic infrastructure
5. **Flexible**: Switch between providers instantly

## 🛠️ Removed Components

- ✅ Ollama container removed (freed ~15GB disk space)
- ✅ All Ollama models deleted
- ✅ Ollama volumes and images removed
- ✅ Python API updated to use external providers

## 📊 Server Resources After Cleanup

```
Before: 54GB used
After: ~39GB used
Freed: ~15GB
```

Your server now has more resources for other services! 🚀
