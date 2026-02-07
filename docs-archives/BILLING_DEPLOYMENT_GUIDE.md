# Billing Service - Production Deployment Guide

## ✅ Issues Fixed

### 1. **Stripe Configuration Error**

**Error**: `Please call Stripe() with your publishable key. You used an empty string.`

**Fix Applied**:

- Added Stripe key validation in `PricingPlans.tsx`
- Added `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to environment files
- Graceful fallback when Stripe is not configured

### 2. **Missing API Endpoints**

**Errors**:

- `404: /api/v1/billing/transactions`
- `404: /api/v1/billing/invoices`

**Fix Applied**:

- Added `/api/v1/billing/transactions` endpoint
- Added `/api/v1/billing/invoices` endpoint
- Both endpoints return proper JSON structure with empty arrays as fallback

### 3. **500 Error on /api/v1/billing/services**

**Fix Applied**:

- Added error handling for missing `service_pricing_config` table
- Graceful fallback to default pricing
- Proper error logging for debugging

### 4. **Data Formatting Errors**

**Error**: `TypeError: Cannot read properties of undefined (reading 'toLocaleString')`

**Fix Applied**:

- Added default empty arrays in `BillingHistory` component
- Added safe data access throughout billing components

---

## 🚀 Production Deployment Steps

### Step 1: Set Up Stripe Account (Required for Payments)

1. **Create/Login to Stripe Account**:

   ```bash
   # Visit: https://dashboard.stripe.com/
   ```

2. **Get Your API Keys**:
   - Go to: https://dashboard.stripe.com/apikeys
   - Copy your **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - Copy your **Secret key** (starts with `sk_test_` or `sk_live_`)

3. **Update Environment Variables**:
   ```bash
   # In /home/mukulah/vpn-enterprise/.env.production
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_real_key_here
   STRIPE_SECRET_KEY=sk_live_your_real_key_here
   ```

### Step 2: Update Environment Files on Hetzner

1. **SSH into your Hetzner server**:

   ```bash
   ssh root@your-hetzner-ip
   cd /path/to/vpn-enterprise
   ```

2. **Update `.env.production`**:

   ```bash
   nano .env.production
   ```

   Add/Update these lines:

   ```env
   # Stripe Configuration (PRODUCTION)
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_XXXXXXXXXXXXXXXXXX
   STRIPE_SECRET_KEY=sk_live_XXXXXXXXXXXXXXXXXX

   # For testing, use test keys:
   # NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_XXXXXXXXXXXXXXXXXX
   # STRIPE_SECRET_KEY=sk_test_XXXXXXXXXXXXXXXXXX
   ```

3. **Update web-dashboard `.env.local`**:

   ```bash
   nano apps/web-dashboard/.env.local
   ```

   Add:

   ```env
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_XXXXXXXXXXXXXXXXXX
   NEXT_PUBLIC_API_URL=https://chatbuilds.com
   ```

### Step 3: Rebuild and Deploy

1. **Rebuild the containers**:

   ```bash
   cd infrastructure/docker
   docker-compose down
   docker-compose build --no-cache web-dashboard api
   docker-compose up -d
   ```

2. **Verify the services are running**:

   ```bash
   docker-compose ps
   docker-compose logs -f web-dashboard
   docker-compose logs -f api
   ```

3. **Check for errors**:

   ```bash
   # Check API logs
   docker-compose logs api | grep -i error

   # Check web-dashboard logs
   docker-compose logs web-dashboard | grep -i error
   ```

### Step 4: Verify Environment Variables in Container

```bash
# Check if Stripe key is loaded in web-dashboard
docker exec vpn-web-dashboard env | grep STRIPE

# Should output:
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### Step 5: Test the Billing Page

1. **Visit**: `https://chatbuilds.com/dashboard/billing`

2. **Expected Results**:
   - ✅ No Stripe errors in console
   - ✅ Pricing plans display correctly
   - ✅ Transaction history shows (empty or with data)
   - ✅ No 404 errors for `/transactions` or `/invoices`
   - ✅ No 500 error for `/services`

---

## 📋 Database Tables Required

Ensure these tables exist in your Supabase database:

### 1. `service_subscriptions` table:

```sql
CREATE TABLE IF NOT EXISTS service_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES "user"(id),
    tier_name TEXT DEFAULT 'free',
    credits_limit INTEGER DEFAULT 100,
    credits_remaining INTEGER DEFAULT 100,
    credits_used_this_month INTEGER DEFAULT 0,
    purchased_credits_balance INTEGER DEFAULT 0,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    current_period_start TIMESTAMP DEFAULT NOW(),
    current_period_end TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days'),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. `service_usage_logs` table:

```sql
CREATE TABLE IF NOT EXISTS service_usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES "user"(id),
    service_type TEXT NOT NULL,
    operation TEXT NOT NULL,
    credits_charged INTEGER NOT NULL,
    source_balance TEXT DEFAULT 'monthly',
    cost_breakdown JSONB,
    model_used TEXT,
    input_tokens INTEGER,
    output_tokens INTEGER,
    total_tokens INTEGER,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. `ai_model_pricing` table:

```sql
CREATE TABLE IF NOT EXISTS ai_model_pricing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id TEXT UNIQUE NOT NULL,
    model_name TEXT NOT NULL,
    provider TEXT NOT NULL,
    user_input_cost_per_1m NUMERIC NOT NULL,
    user_output_cost_per_1m NUMERIC NOT NULL,
    markup_multiplier NUMERIC DEFAULT 1.4,
    is_available BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default models
INSERT INTO ai_model_pricing (model_id, model_name, provider, user_input_cost_per_1m, user_output_cost_per_1m, markup_multiplier, display_order) VALUES
('gpt-4o', 'GPT-4o', 'openai', 5.0, 15.0, 1.4, 1),
('gpt-4-turbo', 'GPT-4 Turbo', 'openai', 10.0, 30.0, 1.4, 2),
('claude-3.5-sonnet', 'Claude 3.5 Sonnet', 'anthropic', 3.0, 15.0, 1.4, 3)
ON CONFLICT (model_id) DO NOTHING;
```

### 4. `service_pricing_config` table (optional):

```sql
CREATE TABLE IF NOT EXISTS service_pricing_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_type TEXT UNIQUE NOT NULL,
    pricing JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🧪 Testing Checklist

- [ ] Stripe key is set in environment
- [ ] Web dashboard builds successfully
- [ ] API endpoints respond without errors
- [ ] Billing page loads without console errors
- [ ] Transaction history displays correctly
- [ ] Pricing plans show proper formatting
- [ ] Stripe checkout can be initiated (test mode)

---

## 🔧 Troubleshooting

### Issue: Stripe key still showing as empty

**Solution**:

```bash
# 1. Verify the key is in the file
cat apps/web-dashboard/.env.local | grep STRIPE

# 2. Rebuild with no cache
docker-compose build --no-cache web-dashboard

# 3. Restart the container
docker-compose restart web-dashboard
```

### Issue: 500 error on /services endpoint

**Solution**:

```bash
# Check if ai_model_pricing table exists
# Connect to your Supabase database and run:
SELECT * FROM ai_model_pricing;

# If table doesn't exist, create it using SQL above
```

### Issue: Transactions not showing

**Solution**:

```bash
# Check if service_usage_logs table exists
# The table will be empty for new users - this is normal
```

---

## 📝 Production Checklist

- [ ] Replace all test Stripe keys with live keys
- [ ] Set up Stripe webhooks for payment events
- [ ] Enable Stripe billing portal
- [ ] Configure tax rates in Stripe (if applicable)
- [ ] Set up proper error monitoring (Sentry, etc.)
- [ ] Test payment flow end-to-end
- [ ] Set up automated backups for transaction data
- [ ] Configure rate limiting for API endpoints
- [ ] Enable HTTPS enforcement
- [ ] Set up monitoring alerts for failed payments

---

## 🎯 Next Steps

1. **Set up Stripe Products**: Create products in Stripe Dashboard for each plan
2. **Configure Webhooks**: Set up webhook endpoints for payment events
3. **Test Payment Flow**: Make test purchases using Stripe test cards
4. **Monitor Logs**: Keep an eye on error logs for the first few days
5. **User Testing**: Have beta users test the complete payment flow

---

## 📞 Support

If you encounter issues:

1. Check Docker logs: `docker-compose logs -f`
2. Check API response: `curl -H "Authorization: Bearer YOUR_TOKEN" https://chatbuilds.com/api/v1/billing/services`
3. Verify Stripe configuration in dashboard
