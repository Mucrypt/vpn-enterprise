# Stripe Webhook Setup Guide

This guide explains how to configure Stripe webhooks to automatically update user credits when they purchase credit packages.

## Why Webhooks Are Needed

When users buy credits through Stripe:
1. User completes payment on Stripe Checkout
2. Stripe sends a webhook event to our server
3. Our server receives the event and updates the database
4. User's credits appear immediately in NexusAI

**Without webhooks configured, credits must be added manually!**

## Prerequisites

- Stripe account with API keys configured
- Production server accessible from internet (https://chatbuilds.com)
- Webhook secret generated from Stripe Dashboard

## Setup Steps

### 1. Access Stripe Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Make sure you're in **Test Mode** for testing (toggle in top right)
3. Navigate to **Developers** → **Webhooks**

### 2. Add Webhook Endpoint

Click **Add endpoint** and configure:

- **Endpoint URL**: `https://chatbuilds.com/api/v1/billing/stripe/webhook`
- **Description**: `VPN Enterprise - Credit Purchases & Subscriptions`
- **Events to send**: Select these events:
  - `checkout.session.completed` ✅ (Credit purchases)
  - `customer.subscription.updated` ✅ (Subscription changes)
  - `customer.subscription.deleted` ✅ (Cancellations)

### 3. Get Webhook Signing Secret

After creating the webhook:
1. Click on the webhook endpoint you just created
2. Click **Reveal** next to **Signing secret**
3. Copy the secret (starts with `whsec_...`)

### 4. Configure Production Server

SSH into your production server:

```bash
ssh root@157.180.123.240
cd /opt/vpn-enterprise/infrastructure/docker/secrets
```

Create/update the webhook secret file:

```bash
echo "whsec_YOUR_WEBHOOK_SECRET_HERE" > stripe_webhook_secret
chmod 600 stripe_webhook_secret
```

### 5. Restart API Container

```bash
cd /opt/vpn-enterprise/infrastructure/docker
docker compose -f docker-compose.prod.yml restart api
```

### 6. Test the Webhook

#### From Stripe Dashboard:
1. Go to your webhook endpoint
2. Click **Send test webhook**
3. Select `checkout.session.completed`
4. Click **Send test event**

#### Check Logs:
```bash
docker logs vpn-api --tail 50 | grep -i webhook
```

You should see:
```
[Stripe Webhook] Received event: checkout.session.completed
[Stripe Webhook] Processing credit purchase for user ...
```

#### Test with Real Purchase:
1. Go to https://chatbuilds.com/nexusai/credits
2. Buy a credit package (use test card: `4242 4242 4242 4242`)
3. Complete checkout
4. Credits should appear immediately without page refresh!

## Troubleshooting

### Webhook Not Firing

**Check endpoint URL:**
```bash
curl -I https://chatbuilds.com/api/v1/billing/stripe/webhook
```
Should return `200 OK` or `400 Bad Request` (not 404)

**Check nginx config:**
```bash
docker exec vpn-nginx nginx -t
```

**Check API logs:**
```bash
docker logs vpn-api --tail 100 | grep -A 10 webhook
```

### Invalid Signature Error

This means the webhook secret doesn't match:

1. Get the correct secret from Stripe Dashboard
2. Update `/opt/vpn-enterprise/infrastructure/docker/secrets/stripe_webhook_secret`
3. Restart API: `docker compose restart api`

### Credits Not Updating

**Check database:**
```sql
-- SSH into server, then:
docker exec vpn-postgres psql -U platform_admin -d platform_db -c "
SELECT user_id, credits_remaining, purchased_credits_balance 
FROM service_subscriptions 
WHERE user_id = 'USER_ID_HERE';
"
```

**Check credit_purchases table:**
```sql
docker exec vpn-postgres psql -U platform_admin -d platform_db -c "
SELECT * FROM credit_purchases 
ORDER BY created_at DESC 
LIMIT 5;
"
```

**Manually sync payment (if webhook failed):**
User can go to `https://chatbuilds.com/nexusai/credits` and click "Sync Credits" button (if implemented), or use the sync endpoint:
```bash
curl -X POST https://chatbuilds.com/api/v1/billing/sync-payment \
  -H "Authorization: Bearer TOKEN_HERE" \
  -H "Content-Type: application/json"
```

## Production vs Test Mode

### Test Mode (Development)
- Use test webhook secret (starts with `whsec_test_...`)
- Use test API keys in docker-compose
- Test with card: 4242 4242 4242 4242

### Live Mode (Production)
- Use live webhook secret (starts with `whsec_...`)
- Use live API keys
- Real payments processed

**⚠️ Important:** Create separate webhook endpoints for test and live modes!

## Security Notes

1. **Never commit webhook secrets** to git
2. **Always verify webhook signature** (our code does this automatically)
3. **Check event types** before processing
4. **Use HTTPS only** for webhook endpoints
5. **Rate limit webhook endpoint** to prevent abuse

## Monitoring

Monitor webhook delivery in Stripe Dashboard:
- Go to **Developers** → **Webhooks**
- Click your endpoint
- View **Recent deliveries**
- Check success/failure rates

Failed webhooks will be retried automatically by Stripe for up to 3 days.

## Quick Reference

| Item | Value |
|------|-------|
| Webhook URL | `https://chatbuilds.com/api/v1/billing/stripe/webhook` |
| Secret File | `/opt/vpn-enterprise/infrastructure/docker/secrets/stripe_webhook_secret` |
| Events | `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted` |
| Log Check | `docker logs vpn-api \| grep webhook` |

## Need Help?

Check the billing route implementation:
- `/packages/api/src/routes/billing.ts` - Webhook handler
- `/packages/api/src/app.ts` - Raw body middleware for webhook

---

**Last Updated:** February 6, 2026  
**Status:** ✅ Ready for production use
