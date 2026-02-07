# Stripe Integration Setup Guide

✅ **Status**: API deployed with complete Stripe integration

## What's Already Done

1. ✅ Stripe SDK integrated into API
2. ✅ Checkout session endpoint created: `POST /api/v1/billing/create-checkout-session`
3. ✅ Webhook handler created: `POST /api/v1/billing/stripe/webhook`
4. ✅ Frontend updated with pricing plans
5. ✅ API deployed to production

## What You Need to Do Now

### 1. Create Products in Stripe Dashboard

Go to [Stripe Dashboard](https://dashboard.stripe.com/products) and create these products:

#### Starter Plan

- **Name**: Starter Plan
- **Price**: $29.99 USD
- **Billing Period**: Monthly
- **After creation**, copy the **Price ID** (starts with `price_`)

#### Professional Plan

- **Name**: Professional Plan
- **Price**: $79.99 USD
- **Billing Period**: Monthly
- **After creation**, copy the **Price ID** (starts with `price_`)

#### Enterprise Plan

- **Name**: Enterprise Plan
- **Price**: $299.99 USD
- **Billing Period**: Monthly
- **After creation**, copy the **Price ID** (starts with `price_`)

### 2. Update Frontend with Real Price IDs

Edit `apps/web-dashboard/components/billing/PricingPlans.tsx`:

```typescript
{
  id: 'starter',
  name: 'Starter',
  price: 29.99,
  stripePriceId: 'price_XXXXX', // ← Replace with real Starter Price ID
  // ...
},
{
  id: 'professional',
  name: 'Professional',
  price: 79.99,
  stripePriceId: 'price_XXXXX', // ← Replace with real Professional Price ID
  // ...
},
{
  id: 'enterprise',
  name: 'Enterprise',
  price: 299.99,
  stripePriceId: 'price_XXXXX', // ← Replace with real Enterprise Price ID
  // ...
}
```

### 3. Configure Stripe Webhook

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. **Endpoint URL**: `https://chatbuilds.com/api/v1/billing/stripe/webhook`
4. **Select events to listen to**:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Click **Add endpoint**
6. Your webhook is already configured with secret: `whsec_Ox9Wu88fsXi6yD3s6pnL7i4Vgo5pPOSW`

### 4. Deploy Frontend Changes

After updating the Price IDs:

```bash
cd /home/mukulah/vpn-enterprise
git add -A
git commit -m "feat: add real Stripe Price IDs"
git push

# Deploy to production
ssh root@157.180.123.240 'cd /opt/vpn-enterprise && git pull && cd infrastructure/docker && docker compose -f docker-compose.prod.yml up -d --build --no-deps web'
```

## How the Flow Works

### User Upgrades to Paid Plan

1. User visits `/dashboard/billing`
2. User clicks **Select Plan** on a paid plan (Starter/Professional/Enterprise)
3. Frontend calls API: `POST /api/v1/billing/create-checkout-session`
4. API creates Stripe Checkout session and returns URL
5. Frontend redirects user to Stripe Checkout page
6. User enters credit card info and completes payment
7. Stripe processes payment

### Stripe Webhook Handles Payment

1. Stripe sends `checkout.session.completed` event to webhook
2. Webhook verifies signature
3. Webhook updates `service_subscriptions` table in `platform_db`:
   - Sets `plan_id` to the purchased plan
   - Sets `status` to 'active'
   - Saves Stripe `customer_id` and `subscription_id`
   - Updates `credits` based on plan tier
4. User now has active subscription

### User Cancels Subscription

1. User cancels in Stripe Customer Portal or you cancel manually
2. Stripe sends `customer.subscription.deleted` event
3. Webhook updates subscription to 'cancelled' status

## Testing the Flow

### Test Mode (Recommended First)

1. Switch to Stripe test keys in `.env`:

   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_... (from test webhook)
   ```

2. Create test products in [Test Dashboard](https://dashboard.stripe.com/test/products)

3. Use [Stripe test cards](https://stripe.com/docs/testing):
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`

### Production Testing

1. Make sure you have the live keys (already configured)
2. Visit https://chatbuilds.com/dashboard/billing
3. Click upgrade on any paid plan
4. Should redirect to Stripe Checkout
5. Use a real credit card or test in test mode first
6. After payment, check database:
   ```sql
   SELECT * FROM service_subscriptions WHERE user_id = 'YOUR_USER_ID';
   ```

## Current Configuration

**Stripe Keys** (in production):

- Secret Key: `sk_live_51OmeWZKQ...` ✅
- Publishable Key: `pk_live_51OmeWZKQ...` ✅
- Webhook Secret: `whsec_Ox9Wu88fsXi6yD3s6pnL7i4Vgo5pPOSW` ✅

**API Endpoints**:

- Checkout: `https://chatbuilds.com/api/v1/billing/create-checkout-session`
- Webhook: `https://chatbuilds.com/api/v1/billing/stripe/webhook`

**Plan Tiers**:
| Plan | Price | Credits | Description |
|------|-------|---------|-------------|
| Free | $0 | 100 | Basic features |
| Starter | $29.99 | 1,000 | Small projects |
| Professional | $79.99 | 5,000 | Growing teams |
| Enterprise | $299.99 | 25,000 | Large organizations |

## Troubleshooting

### "No Stripe Price ID configured"

- You need to create products in Stripe and update `PricingPlans.tsx`

### Checkout page doesn't open

- Check browser console for errors
- Verify API is receiving the request
- Check API logs: `docker logs vpn-api`

### Webhook not working

- Verify webhook is configured in Stripe Dashboard
- Check webhook secret matches in `.env`
- Test webhook with Stripe CLI: `stripe trigger checkout.session.completed`

### Subscription not activating

- Check webhook logs in Stripe Dashboard
- Verify webhook endpoint is reachable: `curl https://chatbuilds.com/api/v1/billing/stripe/webhook`
- Check API logs: `docker logs vpn-api`

## Support

If you encounter issues:

1. Check API logs: `ssh root@157.180.123.240 'docker logs vpn-api'`
2. Check webhook logs in [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
3. Test locally first with test keys

---

**Next Step**: Create products in Stripe Dashboard and copy the Price IDs! 🚀
