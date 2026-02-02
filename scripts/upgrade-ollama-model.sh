#!/bin/bash

# ==============================================
# Ollama Model Upgrade Script
# Pull better models for full app generation
# ==============================================

set -e

HETZNER_IP="157.180.123.240"
HETZNER_USER="root"
SSH_KEY="$HOME/.ssh/id_ed25519"

echo "🤖 Ollama Model Upgrade Script"
echo "================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Available models
echo "📦 Available Models for Code Generation:"
echo ""
echo "1. deepseek-coder-v2:16b (10GB) - RECOMMENDED"
echo "   - Best for code generation"
echo "   - 128K context window"
echo "   - Requires: 16GB RAM minimum"
echo ""
echo "2. qwen2.5-coder:7b (4GB) - FAST & GOOD"
echo "   - Fast code generation"
echo "   - 32K context window"
echo "   - Requires: 8GB RAM minimum"
echo ""
echo "3. codellama:13b (7GB) - BALANCED"
echo "   - Meta's code specialist"
echo "   - 100K context window"
echo "   - Requires: 16GB RAM minimum"
echo ""
echo "4. llama3.1:8b (4.7GB) - GENERAL PURPOSE"
echo "   - Good all-rounder"
echo "   - 128K context window"
echo "   - Requires: 8GB RAM minimum"
echo ""

# Check current server resources
echo -e "${BLUE}Checking server resources...${NC}"
ssh -i "$SSH_KEY" "$HETZNER_USER@$HETZNER_IP" << 'ENDSSH'
echo "Current System:"
echo "- RAM: $(free -h | awk '/^Mem:/ {print $2}')"
echo "- Available: $(free -h | awk '/^Mem:/ {print $7}')"
echo "- Disk: $(df -h / | awk 'NR==2 {print $4}') free"
echo ""
ENDSSH

# Prompt for model selection
read -p "$(echo -e ${YELLOW}Enter model number to install [1-4, default: 1]: ${NC})" MODEL_CHOICE
MODEL_CHOICE=${MODEL_CHOICE:-1}

case $MODEL_CHOICE in
  1)
    MODEL="deepseek-coder-v2:16b"
    MODEL_SIZE="10GB"
    ;;
  2)
    MODEL="qwen2.5-coder:7b"
    MODEL_SIZE="4GB"
    ;;
  3)
    MODEL="codellama:13b"
    MODEL_SIZE="7GB"
    ;;
  4)
    MODEL="llama3.1:8b"
    MODEL_SIZE="4.7GB"
    ;;
  *)
    echo -e "${RED}Invalid choice. Using default: deepseek-coder-v2:16b${NC}"
    MODEL="deepseek-coder-v2:16b"
    MODEL_SIZE="10GB"
    ;;
esac

echo ""
echo -e "${GREEN}Selected Model: $MODEL ($MODEL_SIZE)${NC}"
echo ""

# Confirm
read -p "$(echo -e ${YELLOW}This will download ${MODEL_SIZE}. Continue? [y/N]: ${NC})" CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
  echo "❌ Aborted"
  exit 1
fi

echo ""
echo -e "${BLUE}📥 Pulling model $MODEL...${NC}"
echo "This may take 15-30 minutes depending on your connection..."
echo ""

# Pull the model
ssh -i "$SSH_KEY" "$HETZNER_USER@$HETZNER_IP" << ENDSSH
set -e

echo "🔍 Checking Ollama status..."
docker ps | grep vpn-ollama || {
  echo "❌ Ollama container is not running!"
  exit 1
}

echo ""
echo "📥 Pulling model: $MODEL"
echo "Started at: \$(date)"
echo ""

# Pull the model with progress
docker exec vpn-ollama ollama pull $MODEL

echo ""
echo "✅ Model pulled successfully!"
echo "Finished at: \$(date)"
echo ""

# List all installed models
echo "📋 Installed models:"
docker exec vpn-ollama ollama list

echo ""
echo "💾 Model storage:"
docker exec vpn-ollama du -sh /root/.ollama/models

ENDSSH

if [ $? -eq 0 ]; then
  echo ""
  echo -e "${GREEN}✅ Model $MODEL installed successfully!${NC}"
  echo ""
  echo "📝 Next steps:"
  echo "1. Update your API calls to use: model='$MODEL'"
  echo "2. Restart the Python API to apply changes:"
  echo "   ssh root@$HETZNER_IP 'docker restart vpn-python-api'"
  echo ""
  echo "3. Test the new model:"
  echo "   curl -X POST https://python-api.chatbuilds.com/ai/generate/app \\"
  echo "     -H 'Content-Type: application/json' \\"
  echo "     -d '{\"description\": \"Create a todo app\", \"framework\": \"react\"}'"
  echo ""
else
  echo -e "${RED}❌ Failed to install model${NC}"
  exit 1
fi

# Optional: Remove old models to save space
echo ""
read -p "$(echo -e ${YELLOW}Remove old llama3.2:1b model to save space? [y/N]: ${NC})" REMOVE_OLD
if [[ "$REMOVE_OLD" =~ ^[Yy]$ ]]; then
  echo "🗑️  Removing old model..."
  ssh -i "$SSH_KEY" "$HETZNER_USER@$HETZNER_IP" << 'ENDSSH'
  docker exec vpn-ollama ollama rm llama3.2:1b || echo "Model not found or already removed"
ENDSSH
  echo -e "${GREEN}✅ Old model removed${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Upgrade complete!${NC}"
echo ""
echo "Your NexusAI can now generate full applications like Cursor and Lovable!"
echo ""
