#!/bin/bash
# Test Stripe Webhook by Making a Real Purchase

echo "==================================="
echo "Stripe Webhook Test - Live Purchase"
echo "==================================="
echo ""
echo "📋 Steps to test:"
echo ""
echo "1. Open NexusAI Credits page:"
echo "   https://chatbuilds.com/nexusai/credits"
echo ""
echo "2. Click 'Buy Now' on STARTER PACK (\$10)"
echo ""
echo "3. Use Stripe TEST card:"
echo "   Card: 4242 4242 4242 4242"
echo "   Expiry: 12/28"
echo "   CVV: 123"
echo "   ZIP: 12345"
echo ""
echo "4. Complete payment"
echo ""
echo "5. Run this script to check results:"
echo ""

# Wait for user to complete purchase
read -p "Press ENTER after completing the purchase..."

echo ""
echo "🔍 Checking webhook logs..."
ssh root@157.180.123.240 "docker logs vpn-api 2>&1 | grep -B 2 -A 10 'Stripe Webhook.*checkout.session.completed' | tail -30"

echo ""
echo "💳 Checking credit purchases..."
ssh root@157.180.123.240 "docker exec vpn-postgres psql -U platform_admin -d platform_db -c 'SELECT user_id, package_name, credits_purchased, amount_paid, payment_status, created_at FROM credit_purchases ORDER BY created_at DESC LIMIT 5'"

echo ""
echo "💰 Checking current credit balance..."
ssh root@157.180.123.240 "docker exec vpn-postgres psql -U platform_admin -d platform_db -c 'SELECT user_id, credits_remaining, purchased_credits_balance, credits_remaining + purchased_credits_balance as total FROM service_subscriptions WHERE user_id IN ('\''8a8f52ac-2f0f-4249-9bad-2175d04dd001'\'', '\''76461857-6930-4e18-93f6-7579c99e563d'\'')'"

echo ""
echo "✅ Test complete!"
echo ""
echo "Expected result:"
echo "- Webhook should show: 'Processing credit purchase for user...'"
echo "- Credit purchase should show: new row with payment_status='succeeded'"
echo "- Credit balance should increase by 100 credits"
