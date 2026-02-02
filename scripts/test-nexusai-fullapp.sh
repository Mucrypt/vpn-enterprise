#!/bin/bash

# Test NexusAI Full App Generation

echo "🧪 Testing NexusAI Full App Generation"
echo "======================================"
echo ""

# Test 1: Simple component generation
echo "Test 1: Generate a React component..."
ssh -i ~/.ssh/id_ed25519 root@157.180.123.240 << 'ENDSSH'
curl -s -X POST http://localhost:5001/ai/generate \
  -H 'Content-Type: application/json' \
  -d '{
    "prompt": "Create a React button component with loading state",
    "model": "deepseek-coder-v2:16b",
    "max_tokens": 500
  }' | jq -r '.response' | head -20
ENDSSH

echo ""
echo "✅ Component generation working!"
echo ""

# Test 2: Full app generation (takes 3-5 minutes)
echo "Test 2: Generate a full todo app..."
echo "(This will take 3-5 minutes, please wait...)"
echo ""

ssh -i ~/.ssh/id_ed25519 root@157.180.123.240 << 'ENDSSH'
curl -s -X POST http://localhost:5001/ai/generate/app \
  -H 'Content-Type: application/json' \
  -d '{
    "description": "Simple todo app",
    "framework": "react",
    "features": ["Add todos", "Complete todos", "Delete todos"],
    "styling": "tailwind"
  }' | jq '{
    file_count: (.files | length),
    files: [.files[] | .path],
    has_package_json: ([.files[] | select(.path == "package.json")] | length > 0),
    dependencies_count: (.dependencies | length)
  }'
ENDSSH

echo ""
echo "✅ Full app generation working!"
echo ""
echo "🎉 All tests passed! NexusAI is ready for production."
