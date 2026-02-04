-- ============================================
-- VPN Enterprise - Billing Tables for Supabase
-- Run this in your Supabase SQL Editor
-- ============================================

-- Drop existing tables if they conflict
DROP TABLE IF EXISTS service_usage_logs CASCADE;
DROP TABLE IF EXISTS credit_purchases CASCADE;
DROP TABLE IF EXISTS ai_model_pricing CASCADE;
DROP TABLE IF EXISTS service_subscriptions CASCADE;

-- ============================================
-- 1. Service Subscriptions Table
-- ============================================
CREATE TABLE service_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    
    -- Subscription details
    tier_name TEXT NOT NULL DEFAULT 'free',
    tier_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'active',
    
    -- Monthly credits (for NexusAI)
    monthly_credits INTEGER NOT NULL DEFAULT 100,
    credits_remaining INTEGER NOT NULL DEFAULT 100,
    credits_used_this_month INTEGER DEFAULT 0,
    
    -- Purchased credits (never expire, separate from monthly)
    purchased_credits_balance INTEGER DEFAULT 0,
    
    -- Service toggles
    vpn_enabled BOOLEAN DEFAULT true,
    database_enabled BOOLEAN DEFAULT true,
    nexusai_enabled BOOLEAN DEFAULT true,
    hosting_enabled BOOLEAN DEFAULT true,
    
    -- Billing cycle
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '1 month',
    next_billing_date TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '1 month',
    
    -- Stripe integration
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT,
    stripe_payment_method_id TEXT,
    auto_renewal BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_tier CHECK (tier_name IN ('free', 'starter', 'professional', 'enterprise')),
    CONSTRAINT valid_status CHECK (status IN ('active', 'past_due', 'cancelled', 'paused'))
);

CREATE INDEX idx_service_subs_user ON service_subscriptions(user_id);
CREATE INDEX idx_service_subs_stripe_customer ON service_subscriptions(stripe_customer_id);

-- ============================================
-- 2. AI Model Pricing Table
-- ============================================
CREATE TABLE ai_model_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Model details
    provider TEXT NOT NULL,
    model_id TEXT NOT NULL UNIQUE,
    model_name TEXT NOT NULL,
    
    -- Cost per 1M tokens
    input_cost_per_1m DECIMAL(10,4) NOT NULL,
    output_cost_per_1m DECIMAL(10,4) NOT NULL,
    
    -- Our markup multiplier
    markup_multiplier DECIMAL(4,2) NOT NULL DEFAULT 3.0,
    
    -- Credits per 1k tokens (calculated)
    credits_per_1k_input INTEGER GENERATED ALWAYS AS (
        CEIL((input_cost_per_1m / 1000) * markup_multiplier)
    ) STORED,
    credits_per_1k_output INTEGER GENERATED ALWAYS AS (
        CEIL((output_cost_per_1m / 1000) * markup_multiplier)
    ) STORED,
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_pricing_model ON ai_model_pricing(model_id);
CREATE INDEX idx_ai_pricing_active ON ai_model_pricing(is_active);

-- Insert default AI model pricing
INSERT INTO ai_model_pricing (provider, model_id, model_name, input_cost_per_1m, output_cost_per_1m, markup_multiplier) VALUES
('openai', 'gpt-4', 'GPT-4', 30.0, 60.0, 3.0),
('openai', 'gpt-3.5-turbo', 'GPT-3.5 Turbo', 0.5, 1.5, 3.0),
('anthropic', 'claude-3-opus', 'Claude 3 Opus', 15.0, 75.0, 3.0),
('anthropic', 'claude-3-sonnet', 'Claude 3 Sonnet', 3.0, 15.0, 3.0),
('anthropic', 'claude-3-haiku', 'Claude 3 Haiku', 0.25, 1.25, 3.0),
('google', 'gemini-pro', 'Gemini Pro', 0.5, 1.5, 3.0),
('mistral', 'mistral-medium', 'Mistral Medium', 2.7, 8.1, 3.0);

-- ============================================
-- 3. Service Usage Logs Table
-- ============================================
CREATE TABLE service_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    
    -- Service info
    service_type TEXT NOT NULL,
    operation TEXT NOT NULL,
    
    -- Credit tracking
    credits_charged INTEGER NOT NULL DEFAULT 0,
    
    -- AI-specific fields
    model_id TEXT,
    input_tokens INTEGER,
    output_tokens INTEGER,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_service CHECK (service_type IN ('nexusai', 'database', 'vpn', 'hosting'))
);

CREATE INDEX idx_usage_user ON service_usage_logs(user_id);
CREATE INDEX idx_usage_service ON service_usage_logs(service_type);
CREATE INDEX idx_usage_created ON service_usage_logs(created_at DESC);

-- ============================================
-- 4. Credit Purchases Table
-- ============================================
CREATE TABLE credit_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    
    -- Purchase details
    credits_amount INTEGER NOT NULL,
    price_paid DECIMAL(10,2) NOT NULL,
    bonus_credits INTEGER DEFAULT 0,
    
    -- Payment info
    stripe_payment_intent_id TEXT UNIQUE,
    payment_status TEXT NOT NULL DEFAULT 'pending',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    CONSTRAINT valid_payment_status CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded'))
);

CREATE INDEX idx_purchases_user ON credit_purchases(user_id);
CREATE INDEX idx_purchases_status ON credit_purchases(payment_status);

-- ============================================
-- Enable Row Level Security
-- ============================================
ALTER TABLE service_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_model_pricing ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Users can only see their own data)
CREATE POLICY "Users can view own subscription" ON service_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own usage logs" ON service_usage_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own purchases" ON credit_purchases
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view AI pricing" ON ai_model_pricing
    FOR SELECT TO authenticated USING (true);

-- Service role has full access (for API)
CREATE POLICY "Service role full access subscriptions" ON service_subscriptions
    FOR ALL TO service_role USING (true);

CREATE POLICY "Service role full access usage" ON service_usage_logs
    FOR ALL TO service_role USING (true);

CREATE POLICY "Service role full access purchases" ON credit_purchases
    FOR ALL TO service_role USING (true);

CREATE POLICY "Service role full access pricing" ON ai_model_pricing
    FOR ALL TO service_role USING (true);
