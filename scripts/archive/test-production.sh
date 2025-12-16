#!/bin/bash
echo "════════════════════════════════════════════════════════════"
echo "🚀 VPN ENTERPRISE - PRODUCTION TEST SUITE"
echo "════════════════════════════════════════════════════════════"
echo ""

# Test 1: Production API Health
echo "✓ Testing Production API Health..."
API_HEALTH=$(curl -s https://vpn-enterprise-api.vercel.app/health)
if echo "$API_HEALTH" | grep -q "ok"; then
  echo "  ✅ API is healthy"
else
  echo "  ❌ API health check failed"
fi
echo ""

# Test 2: Production Signup
echo "✓ Testing Production Signup..."
SIGNUP_EMAIL="prodtest$(date +%s)@gmail.com"
SIGNUP_RESULT=$(curl -s -X POST https://vpn-enterprise-api.vercel.app/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$SIGNUP_EMAIL\",\"password\":\"Test1234@@\"}")

if echo "$SIGNUP_RESULT" | grep -q "success.*true\|Account created successfully"; then
  echo "  ✅ Signup successful"
  echo "  📧 Email: $SIGNUP_EMAIL"
else
  echo "  ⚠️  Signup response:"
  echo "  $SIGNUP_RESULT" | head -c 200
fi
echo ""

# Test 3: Production Dashboard
echo "✓ Testing Production Dashboard..."
DASH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://vpn-enterprise-dashboard.vercel.app)
if [ "$DASH_STATUS" = "200" ]; then
  echo "  ✅ Dashboard accessible (HTTP $DASH_STATUS)"
else
  echo "  ❌ Dashboard returned HTTP $DASH_STATUS"
fi
echo ""

# Test 4: Get Servers Endpoint
echo "✓ Testing Servers Endpoint..."
SERVERS=$(curl -s https://vpn-enterprise-api.vercel.app/api/v1/servers)
if echo "$SERVERS" | grep -q "servers"; then
  SERVER_COUNT=$(echo "$SERVERS" | grep -o '"id"' | wc -l)
  echo "  ✅ Servers endpoint working ($SERVER_COUNT servers available)"
else
  echo "  ❌ Servers endpoint failed"
fi
echo ""

echo "════════════════════════════════════════════════════════════"
echo "📊 TEST SUMMARY"
echo "════════════════════════════════════════════════════════════"
echo "Production API:        https://vpn-enterprise-api.vercel.app"
echo "Production Dashboard:  https://vpn-enterprise-dashboard.vercel.app"
echo "Local API:             http://localhost:3000"
echo "════════════════════════════════════════════════════════════"
