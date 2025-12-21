#!/usr/bin/env bash
# Test Ollama using API (works around interactive memory issues)

set -e

echo "🦙 Testing Ollama API..."
echo ""

# Test with generate endpoint
echo "📝 Sending prompt: 'What is VPN in 10 words?'"
echo ""

RESPONSE=$(curl -s http://localhost:11434/api/generate -d '{
  "model": "llama3.2:1b",
  "prompt": "What is VPN in exactly 10 words?",
  "stream": false,
  "options": {
    "temperature": 0.7,
    "num_predict": 50
  }
}')

# Check if response is valid
if echo "$RESPONSE" | grep -q "response"; then
    echo "✅ Response received:"
    echo ""
    echo "$RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print('   ' + data['response'].strip())"
    echo ""
    echo "📊 Stats:"
    echo "$RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(f\"   • Tokens: {data.get('eval_count', 0)}\")"
    echo "$RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(f\"   • Duration: {data.get('total_duration', 0) / 1e9:.2f}s\")"
else
    echo "❌ Error in response"
    echo "$RESPONSE"
    exit 1
fi

echo ""
echo "✅ Ollama API is working!"
echo ""
echo "💡 Examples:"
echo ""
echo "   # JavaScript/TypeScript"
echo "   const res = await fetch('http://localhost:11434/api/generate', {"
echo "     method: 'POST',"
echo "     body: JSON.stringify({ model: 'llama3.2:1b', prompt: 'Hello!' })"
echo "   });"
echo ""
echo "   # Python"
echo "   import requests"
echo "   res = requests.post('http://localhost:11434/api/generate',"
echo "     json={'model': 'llama3.2:1b', 'prompt': 'Hello!'})"
echo ""
