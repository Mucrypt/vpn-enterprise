#!/usr/bin/env bash
# Quick test script for Ollama integration
# Run this after pulling a model to verify everything works

set -e

echo "🦙 Testing Ollama Integration..."
echo ""

# Check if Ollama is running
echo "1️⃣ Checking Ollama status..."
if curl -s http://localhost:11434/ | grep -q "Ollama is running"; then
    echo "   ✅ Ollama is running"
else
    echo "   ❌ Ollama is not responding"
    exit 1
fi

echo ""
echo "2️⃣ Listing available models..."
docker exec vpn-ollama-dev ollama list

echo ""
echo "3️⃣ Testing API with curl..."
curl -s http://localhost:11434/api/tags | python3 -c "import sys, json; data=json.load(sys.stdin); print(f'   Found {len(data[\"models\"])} model(s)')"

echo ""
echo "4️⃣ Testing simple generation (this may take 30-60 seconds)..."
echo "   Prompt: 'Say hello in 5 words'"
echo ""

# Run with timeout
timeout 120s docker exec vpn-ollama-dev ollama run llama3.2:1b "Say hello in 5 words" 2>&1 || {
    EXIT_CODE=$?
    if [ $EXIT_CODE -eq 124 ]; then
        echo "   ⚠️  Timeout after 2 minutes"
        echo "   💡 Tip: Model loading can be slow on first run"
    elif [ $EXIT_CODE -eq 1 ]; then
        echo ""
        echo "   ⚠️  Memory error detected"
        echo ""
        echo "   📝 Solutions:"
        echo "   1. Increase Docker Desktop memory to at least 4GB:"
        echo "      Docker Desktop → Settings → Resources → Memory → 4GB+"
        echo ""
        echo "   2. Or use the API directly (doesn't require interactive mode):"
        echo "      ./test-ollama-api.sh"
        echo ""
        echo "   3. Or pull a smaller model:"
        echo "      docker exec vpn-ollama-dev ollama pull tinyllama"
    fi
    exit $EXIT_CODE
}

echo ""
echo "✅ All tests passed!"
echo ""
echo "📚 Quick Reference:"
echo "   • API: http://localhost:11434"
echo "   • Pull models: docker exec vpn-ollama-dev ollama pull <model>"
echo "   • List models: docker exec vpn-ollama-dev ollama list"
echo "   • Chat: docker exec vpn-ollama-dev ollama run <model> \"<prompt>\""
echo ""
echo "📖 Full documentation: docs/OLLAMA_INTEGRATION.md"
