# VPN Enterprise - Unified Billing System Architecture

## 🎯 Overview

Centralized, profitable billing system for all VPN Enterprise services:

- **VPN Service**: Connection-based pricing
- **Database Platform**: Storage + query-based pricing
- **NexusAI**: Credit-based with model-specific markup
- **Hosting**: Server resource pricing

## 💰 Pricing Strategy

### 1. AI Model Pricing (NexusAI)

#### Cost Analysis

| Model             | Provider  | Input Cost (per 1M tokens) | Output Cost (per 1M tokens) | Our Markup |
| ----------------- | --------- | -------------------------- | --------------------------- | ---------- |
| GPT-4o            | OpenAI    | $2.50                      | $10.00                      | 3x         |
| GPT-4o-mini       | OpenAI    | $0.15                      | $0.60                       | 4x         |
| o1-preview        | OpenAI    | $15.00                     | $60.00                      | 2.5x       |
| o1-mini           | OpenAI    | $3.00                      | $12.00                      | 3x         |
| Claude 3.5 Sonnet | Anthropic | $3.00                      | $15.00                      | 3x         |
| Claude 3 Opus     | Anthropic | $15.00                     | $75.00                      | 2.5x       |
| Claude 3 Haiku    | Anthropic | $0.25                      | $1.25                       | 4x         |

#### Credit Pricing Formula

```
Credits Required = (Input Tokens / 1M * Input Cost * Markup) +
                   (Output Tokens / 1M * Output Cost * Markup)
```

**Example Calculation (GPT-4o):**

- Prompt: 500 tokens, Response: 2000 tokens
- Input: 0.0005M _ $2.50 _ 3 = $0.00375 = 3.75 credits
- Output: 0.002M _ $10.00 _ 3 = $0.06 = 60 credits
- **Total: 64 credits** (we charge 70 to include overhead)

#### Credit Package Pricing

```typescript
const CREDIT_PACKAGES = {
  starter: {
    name: 'Starter Pack',
    credits: 1000,
    price: 9.99, // $0.01 per credit
    bonus: 0,
    savings: '0%',
  },
  professional: {
    name: 'Professional Pack',
    credits: 5000,
    price: 39.99, // $0.008 per credit
    bonus: 500,
    savings: '20%',
  },
  business: {
    name: 'Business Pack',
    credits: 15000,
    price: 99.99, // $0.0067 per credit
    bonus: 3000,
    savings: '33%',
  },
  enterprise: {
    name: 'Enterprise Pack',
    credits: 50000,
    price: 299.99, // $0.006 per credit
    bonus: 15000,
    savings: '40%',
  },
}
```

### 2. Database Platform Pricing

```typescript
const DATABASE_PRICING = {
  storage: {
    free: 1, // 1 GB free
    perGb: 0.25, // $0.25/GB/month (AWS RDS equivalent: $0.115)
    markup: 2.17, // 2.17x profit margin
  },
  compute: {
    queries: {
      free: 10000, // 10K free queries/month
      per1000: 0.01, // $0.01 per 1K queries
    },
    connections: {
      free: 100, // 100 concurrent free
      per100: 5.0, // $5 per 100 additional connections
    },
  },
  backups: {
    automated: 10.0, // $10/month for automated backups
    onDemand: 1.0, // $1 per manual backup
  },
}
```

### 3. VPN Service Pricing

```typescript
const VPN_PRICING = {
  tier: {
    free: {
      price: 0,
      devices: 1,
      bandwidth: 10, // 10 GB/month
      servers: 3,
      speed: 'standard',
      support: 'community',
    },
    basic: {
      price: 9.99,
      devices: 3,
      bandwidth: 100, // 100 GB/month
      servers: 20,
      speed: 'high',
      support: 'email',
    },
    professional: {
      price: 19.99,
      devices: 10,
      bandwidth: 500, // 500 GB/month
      servers: 50,
      speed: 'premium',
      support: 'priority',
      features: ['split-tunnel', 'kill-switch', 'custom-dns'],
    },
    enterprise: {
      price: 49.99,
      devices: 'unlimited',
      bandwidth: 'unlimited',
      servers: 'all',
      speed: 'ultra',
      support: '24/7',
      features: ['dedicated-ip', 'team-management', 'api-access'],
    },
  },
}
```

### 4. Hosting Service Pricing

```typescript
const HOSTING_PRICING = {
  static: {
    free: {
      price: 0,
      bandwidth: 100, // 100 GB/month
      builds: 100, // 100 builds/month
      storage: 10, // 10 GB
    },
    pro: {
      price: 20,
      bandwidth: 1000, // 1 TB/month
      builds: 'unlimited',
      storage: 100, // 100 GB
    },
  },
  serverless: {
    functions: {
      free: 100000, // 100K invocations/month
      per1M: 2.0, // $2 per 1M invocations
    },
    duration: {
      free: 400000, // 400K GB-seconds/month
      per100k: 0.2, // $0.20 per 100K GB-seconds
    },
  },
}
```

## 📊 Unified Service Subscription Model

### Monthly Subscription Tiers

```typescript
interface ServiceSubscription {
  name: string
  price: number
  services: {
    vpn?: VPNTier
    database?: DatabaseTier
    nexusai_credits?: number
    hosting?: HostingTier
  }
  features: string[]
  support: 'community' | 'email' | 'priority' | '24/7'
}

const SUBSCRIPTION_TIERS: ServiceSubscription[] = [
  {
    name: 'Free',
    price: 0,
    services: {
      vpn: 'free',
      database: 'free',
      nexusai_credits: 100, // 100 credits/month
      hosting: 'free',
    },
    features: [
      '1 VPN device',
      '1 GB database storage',
      '100 AI credits/month',
      '100 GB hosting bandwidth',
    ],
    support: 'community',
  },
  {
    name: 'Starter',
    price: 29.99,
    services: {
      vpn: 'basic',
      database: 'basic',
      nexusai_credits: 1000, // 1000 credits/month
      hosting: 'basic',
    },
    features: [
      '3 VPN devices',
      '10 GB database storage',
      '1000 AI credits/month',
      '500 GB hosting bandwidth',
      'Email support',
    ],
    support: 'email',
  },
  {
    name: 'Professional',
    price: 79.99,
    services: {
      vpn: 'professional',
      database: 'professional',
      nexusai_credits: 5000, // 5000 credits/month
      hosting: 'pro',
    },
    features: [
      '10 VPN devices',
      '50 GB database storage',
      '5000 AI credits/month + 20% bonus on purchases',
      '2 TB hosting bandwidth',
      'Priority support',
      'Advanced VPN features',
      'Automated database backups',
    ],
    support: 'priority',
  },
  {
    name: 'Enterprise',
    price: 299.99,
    services: {
      vpn: 'enterprise',
      database: 'enterprise',
      nexusai_credits: 25000, // 25000 credits/month
      hosting: 'enterprise',
    },
    features: [
      'Unlimited VPN devices',
      '500 GB database storage',
      '25000 AI credits/month + 40% bonus on purchases',
      'Unlimited hosting bandwidth',
      '24/7 support',
      'Dedicated IP',
      'Team management',
      'API access',
      'Custom SLA',
    ],
    support: '24/7',
  },
]
```

## 🏗️ Database Schema

```sql
-- Enhanced billing tables
CREATE TABLE IF NOT EXISTS service_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,

    -- Subscription details
    tier_name TEXT NOT NULL DEFAULT 'free',
    tier_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'active',

    -- Monthly credits
    monthly_credits INTEGER NOT NULL DEFAULT 100,
    credits_remaining INTEGER NOT NULL DEFAULT 100,
    credits_used_this_month INTEGER DEFAULT 0,

    -- Service toggles
    vpn_enabled BOOLEAN DEFAULT true,
    database_enabled BOOLEAN DEFAULT true,
    nexusai_enabled BOOLEAN DEFAULT true,
    hosting_enabled BOOLEAN DEFAULT true,

    -- Usage tracking
    vpn_bandwidth_used_gb DECIMAL(10,2) DEFAULT 0,
    database_storage_gb DECIMAL(10,2) DEFAULT 0,
    database_queries_count INTEGER DEFAULT 0,
    nexusai_generations_count INTEGER DEFAULT 0,
    hosting_bandwidth_gb DECIMAL(10,2) DEFAULT 0,

    -- Billing cycle
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '1 month',

    -- Stripe integration
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    stripe_payment_method_id TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_tier CHECK (tier_name IN ('free', 'starter', 'professional', 'enterprise'))
);

-- Credit purchases (one-time top-ups)
CREATE TABLE IF NOT EXISTS credit_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,

    -- Purchase details
    package_name TEXT NOT NULL,
    credits_purchased INTEGER NOT NULL,
    bonus_credits INTEGER DEFAULT 0,
    amount_paid DECIMAL(10,2) NOT NULL,

    -- Payment info
    stripe_payment_intent_id TEXT,
    payment_status TEXT NOT NULL DEFAULT 'pending',

    -- Applied to balance
    applied_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service usage logs (for detailed analytics)
CREATE TABLE IF NOT EXISTS service_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,

    -- Service type
    service_type TEXT NOT NULL, -- 'vpn', 'database', 'nexusai', 'hosting'
    operation TEXT NOT NULL,

    -- Cost calculation
    credits_charged INTEGER DEFAULT 0,
    cost_breakdown JSONB, -- Detailed cost info

    -- Metadata
    metadata JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_service CHECK (service_type IN ('vpn', 'database', 'nexusai', 'hosting'))
);

CREATE INDEX idx_service_usage_user_date ON service_usage_logs(user_id, created_at DESC);
CREATE INDEX idx_service_usage_service ON service_usage_logs(service_type, created_at DESC);

-- AI model pricing (dynamic, can be updated)
CREATE TABLE IF NOT EXISTS ai_model_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Model details
    provider TEXT NOT NULL, -- 'openai', 'anthropic'
    model_id TEXT NOT NULL UNIQUE,
    model_name TEXT NOT NULL,

    -- Cost per 1M tokens
    input_cost_per_1m DECIMAL(10,4) NOT NULL,
    output_cost_per_1m DECIMAL(10,4) NOT NULL,

    -- Our markup multiplier
    markup_multiplier DECIMAL(4,2) NOT NULL DEFAULT 3.0,

    -- Model capabilities
    max_tokens INTEGER,
    supports_vision BOOLEAN DEFAULT false,
    supports_function_calling BOOLEAN DEFAULT false,

    -- Availability
    is_available BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial AI models
INSERT INTO ai_model_pricing (provider, model_id, model_name, input_cost_per_1m, output_cost_per_1m, markup_multiplier, max_tokens) VALUES
('openai', 'gpt-4o', 'GPT-4o', 2.50, 10.00, 3.0, 128000),
('openai', 'gpt-4o-mini', 'GPT-4o Mini', 0.15, 0.60, 4.0, 128000),
('openai', 'o1-preview', 'o1 Preview', 15.00, 60.00, 2.5, 128000),
('openai', 'o1-mini', 'o1 Mini', 3.00, 12.00, 3.0, 128000),
('anthropic', 'claude-3-5-sonnet-20241022', 'Claude 3.5 Sonnet', 3.00, 15.00, 3.0, 200000),
('anthropic', 'claude-3-opus-20240229', 'Claude 3 Opus', 15.00, 75.00, 2.5, 200000),
('anthropic', 'claude-3-haiku-20240307', 'Claude 3 Haiku', 0.25, 1.25, 4.0, 200000)
ON CONFLICT (model_id) DO NOTHING;
```

## 🔧 Implementation Plan

### Phase 1: Database Migration ✅

- [x] Create unified billing schema
- [ ] Migrate existing `user_subscriptions` to `service_subscriptions`
- [ ] Seed AI model pricing table

### Phase 2: Backend API

- [ ] Create `/api/v1/billing/services` - List all services with pricing
- [ ] Create `/api/v1/billing/subscription` - Get/update subscription
- [ ] Create `/api/v1/billing/credits/buy` - Purchase credit packages
- [ ] Create `/api/v1/billing/usage` - Get usage analytics
- [ ] Update AI generation to use model-specific pricing
- [ ] Implement service-based usage tracking

### Phase 3: Frontend (Unified Billing Page)

- [ ] Service selector with toggle switches
- [ ] Real-time price calculator
- [ ] Credit package purchase flow
- [ ] Usage dashboard with charts
- [ ] Service-specific settings

### Phase 4: Stripe Integration

- [ ] Subscription checkout
- [ ] Credit package checkout
- [ ] Webhook handling for renewals
- [ ] Invoice generation

## 💡 Revenue Optimization

### Profit Margins by Service

| Service              | Cost   | Price  | Margin |
| -------------------- | ------ | ------ | ------ |
| GPT-4o (avg request) | $0.024 | $0.070 | 191%   |
| Claude 3.5 Sonnet    | $0.036 | $0.108 | 200%   |
| Database (10GB)      | $1.15  | $2.50  | 117%   |
| VPN (per user)       | $2.50  | $9.99  | 299%   |
| Hosting (100GB)      | $0.50  | $2.00  | 300%   |

### Monthly Recurring Revenue (MRR) Projections

**Scenario: 1000 Active Users**

- 700 Free (0%)
- 200 Starter ($29.99) = $5,998/month
- 80 Professional ($79.99) = $6,399/month
- 20 Enterprise ($299.99) = $6,000/month

**Total MRR: $18,397/month**
**Estimated costs: $4,500/month**
**Net Profit: $13,897/month (75% margin)**

### Credit Purchase Revenue

**Average monthly credit purchases:**

- 30% of paid users buy additional credits
- Average purchase: $39.99 (Professional Pack)
- 300 users _ 0.30 _ $39.99 = $3,599/month additional

**Total Revenue: $21,996/month**
**Annual Recurring Revenue (ARR): $263,952**

## 🎨 User Experience Flow

### Service Selection Journey

1. **User visits Billing Page**
   - See current plan with all services
   - Toggle services on/off to see price change
   - View usage for current billing period

2. **Add/Remove Services**

   ```
   [ VPN Service ]       [ON]  $9.99/month
   [ Database Platform ] [ON]  $0.00/month (1GB free)
   [ NexusAI ]          [ON]  100 credits/month
   [ Hosting ]          [OFF] $0.00/month

   Total: $9.99/month + 100 AI credits
   ```

3. **Upgrade Plan**
   - Compare tiers side-by-side
   - See what's included vs add-ons
   - Instant upgrade with prorated billing

4. **Buy Credits (NexusAI)**
   - Choose package with bonus credits
   - Credits never expire
   - Use across any AI model

### Example User Story

**Sarah - Freelance Developer:**

- Starts with Free tier (100 AI credits/month)
- Builds 5 apps in first month (50 credits used)
- Database needs grow to 5GB ($1.00 extra)
- Wants to try GPT-4o (premium model)
- Buys Professional Pack ($39.99) → Gets 5000 + 500 bonus credits
- Upgrades to Starter tier ($29.99) for 1000 monthly credits
- **Total spent: $69.98 one-time + $29.99/month**
- **Our profit: ~$45 first month, ~$22/month recurring**

## 🚀 Next Steps

1. Run database migration
2. Update billing middleware with dynamic model pricing
3. Create unified billing API endpoints
4. Build new billing page with service toggles
5. Integrate Stripe for payments
6. Add usage analytics dashboard
7. Implement email notifications for low credits

---

**Key Benefits of This System:**

- ✅ Profitable on every model, even expensive ones
- ✅ Users can mix & match services
- ✅ Clear, transparent pricing
- ✅ Scalable credit system
- ✅ Encourages upgrades through bundles
- ✅ High profit margins (65-300%)
