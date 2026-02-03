-- ============================================
-- VPN Enterprise - Unified Billing System
-- Migration 006: Service-based billing with dynamic AI pricing
-- ============================================

-- Drop existing tables if they conflict
DROP TABLE IF EXISTS service_usage_logs CASCADE;
DROP TABLE IF EXISTS credit_purchases CASCADE;
DROP TABLE IF EXISTS ai_model_pricing CASCADE;

-- ============================================
-- 1. Enhanced Service Subscriptions Table
-- ============================================
CREATE TABLE IF NOT EXISTS service_subscriptions (
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
    
    -- Usage tracking (current billing period)
    vpn_bandwidth_used_gb DECIMAL(10,2) DEFAULT 0,
    vpn_devices_count INTEGER DEFAULT 0,
    
    database_storage_gb DECIMAL(10,2) DEFAULT 0,
    database_queries_count INTEGER DEFAULT 0,
    database_count INTEGER DEFAULT 0,
    
    nexusai_generations_count INTEGER DEFAULT 0,
    nexusai_tokens_used BIGINT DEFAULT 0,
    
    hosting_bandwidth_gb DECIMAL(10,2) DEFAULT 0,
    hosting_builds_count INTEGER DEFAULT 0,
    
    -- Service-specific quotas (based on tier)
    vpn_device_limit INTEGER DEFAULT 1,
    vpn_bandwidth_limit_gb DECIMAL(10,2) DEFAULT 10,
    
    database_storage_limit_gb DECIMAL(10,2) DEFAULT 1,
    database_count_limit INTEGER DEFAULT 1,
    
    hosting_bandwidth_limit_gb DECIMAL(10,2) DEFAULT 100,
    hosting_builds_limit INTEGER DEFAULT 100,
    
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
CREATE INDEX idx_service_subs_billing_date ON service_subscriptions(next_billing_date);

-- ============================================
-- 2. AI Model Pricing Table (Dynamic)
-- ============================================
CREATE TABLE IF NOT EXISTS ai_model_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Model details
    provider TEXT NOT NULL,
    model_id TEXT NOT NULL UNIQUE,
    model_name TEXT NOT NULL,
    
    -- Cost per 1M tokens (what we pay to provider)
    input_cost_per_1m DECIMAL(10,4) NOT NULL,
    output_cost_per_1m DECIMAL(10,4) NOT NULL,
    
    -- Our markup multiplier (profit margin)
    markup_multiplier DECIMAL(4,2) NOT NULL DEFAULT 3.0,
    
    -- Calculated user cost (auto-updated)
    user_input_cost_per_1m DECIMAL(10,4) GENERATED ALWAYS AS (input_cost_per_1m * markup_multiplier) STORED,
    user_output_cost_per_1m DECIMAL(10,4) GENERATED ALWAYS AS (output_cost_per_1m * markup_multiplier) STORED,
    
    -- Model capabilities
    max_tokens INTEGER,
    context_window INTEGER DEFAULT 128000,
    supports_vision BOOLEAN DEFAULT false,
    supports_function_calling BOOLEAN DEFAULT false,
    supports_streaming BOOLEAN DEFAULT true,
    
    -- Display info
    display_order INTEGER DEFAULT 999,
    is_featured BOOLEAN DEFAULT false,
    description TEXT,
    
    -- Availability
    is_available BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_provider CHECK (provider IN ('openai', 'anthropic', 'google', 'meta'))
);

CREATE INDEX idx_ai_model_provider ON ai_model_pricing(provider);
CREATE INDEX idx_ai_model_available ON ai_model_pricing(is_available);

-- Seed initial AI models with current pricing (as of Feb 2026)
INSERT INTO ai_model_pricing (
    provider, model_id, model_name, 
    input_cost_per_1m, output_cost_per_1m, markup_multiplier,
    max_tokens, context_window, supports_vision, supports_function_calling,
    display_order, is_featured, description, is_default
) VALUES
-- OpenAI Models
('openai', 'gpt-4o', 'GPT-4o', 
 2.50, 10.00, 3.0, 
 16384, 128000, true, true, 
 1, true, 'Most capable multimodal model, great for complex tasks', false),
 
('openai', 'gpt-4o-mini', 'GPT-4o Mini', 
 0.15, 0.60, 4.0, 
 16384, 128000, true, true, 
 2, true, 'Affordable and fast, perfect for most tasks', true),
 
('openai', 'o1-preview', 'o1 Preview', 
 15.00, 60.00, 2.5, 
 32768, 128000, false, false, 
 5, false, 'Advanced reasoning model for complex problem-solving', false),
 
('openai', 'o1-mini', 'o1 Mini', 
 3.00, 12.00, 3.0, 
 16384, 128000, false, false, 
 6, false, 'Reasoning model optimized for STEM', false),

-- Anthropic Models
('anthropic', 'claude-3-5-sonnet-20241022', 'Claude 3.5 Sonnet', 
 3.00, 15.00, 3.0, 
 8192, 200000, true, true, 
 3, true, 'Best balance of speed, cost, and intelligence', false),
 
('anthropic', 'claude-3-opus-20240229', 'Claude 3 Opus', 
 15.00, 75.00, 2.5, 
 4096, 200000, true, true, 
 7, false, 'Most powerful model for highly complex tasks', false),
 
('anthropic', 'claude-3-haiku-20240307', 'Claude 3 Haiku', 
 0.25, 1.25, 4.0, 
 4096, 200000, true, true, 
 4, false, 'Fastest and most compact model for instant responses', false)

ON CONFLICT (model_id) DO UPDATE SET
    input_cost_per_1m = EXCLUDED.input_cost_per_1m,
    output_cost_per_1m = EXCLUDED.output_cost_per_1m,
    markup_multiplier = EXCLUDED.markup_multiplier,
    updated_at = NOW();

-- ============================================
-- 3. Credit Purchases Table (Top-ups)
-- ============================================
CREATE TABLE IF NOT EXISTS credit_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    
    -- Purchase details
    package_name TEXT NOT NULL,
    credits_purchased INTEGER NOT NULL,
    bonus_credits INTEGER DEFAULT 0,
    total_credits INTEGER GENERATED ALWAYS AS (credits_purchased + bonus_credits) STORED,
    
    -- Pricing
    amount_paid DECIMAL(10,2) NOT NULL,
    amount_currency TEXT DEFAULT 'USD',
    
    -- Payment info
    stripe_payment_intent_id TEXT UNIQUE,
    payment_status TEXT NOT NULL DEFAULT 'pending',
    
    -- Application
    applied_at TIMESTAMPTZ,
    applied_to_balance BOOLEAN DEFAULT false,
    
    -- Metadata
    purchase_source TEXT DEFAULT 'web', -- 'web', 'mobile', 'api'
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_payment_status CHECK (payment_status IN ('pending', 'succeeded', 'failed', 'refunded'))
);

CREATE INDEX idx_credit_purchases_user ON credit_purchases(user_id, created_at DESC);
CREATE INDEX idx_credit_purchases_status ON credit_purchases(payment_status);
CREATE INDEX idx_credit_purchases_stripe ON credit_purchases(stripe_payment_intent_id);

-- ============================================
-- 4. Service Usage Logs (Detailed Analytics)
-- ============================================
CREATE TABLE IF NOT EXISTS service_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    
    -- Service identification
    service_type TEXT NOT NULL,
    operation TEXT NOT NULL,
    
    -- Cost calculation
    credits_charged INTEGER DEFAULT 0,
    source_balance TEXT DEFAULT 'monthly', -- 'monthly' or 'purchased'
    
    -- Detailed cost breakdown
    cost_breakdown JSONB,
    
    -- AI-specific tracking
    model_used TEXT,
    input_tokens INTEGER,
    output_tokens INTEGER,
    total_tokens INTEGER,
    
    -- Metadata
    metadata JSONB,
    
    -- IP and location (for fraud detection)
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_service CHECK (service_type IN ('vpn', 'database', 'nexusai', 'hosting')),
    CONSTRAINT valid_balance_source CHECK (source_balance IN ('monthly', 'purchased'))
);

CREATE INDEX idx_service_usage_user_date ON service_usage_logs(user_id, created_at DESC);
CREATE INDEX idx_service_usage_service ON service_usage_logs(service_type, created_at DESC);
CREATE INDEX idx_service_usage_model ON service_usage_logs(model_used) WHERE model_used IS NOT NULL;

-- ============================================
-- 5. Service Pricing Configurations
-- ============================================
CREATE TABLE IF NOT EXISTS service_pricing_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_type TEXT NOT NULL UNIQUE,
    
    -- Pricing structure (JSONB for flexibility)
    pricing JSONB NOT NULL,
    
    -- Tier limits
    tier_limits JSONB NOT NULL,
    
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_service_type CHECK (service_type IN ('vpn', 'database', 'hosting', 'support'))
);

-- Seed service pricing
INSERT INTO service_pricing_config (service_type, pricing, tier_limits) VALUES
('database', 
 '{"storage_per_gb_month": 0.25, "queries_per_1000": 0.01, "backup_automated_month": 10.00, "backup_manual": 1.00}'::jsonb,
 '{"free": {"storage_gb": 1, "queries": 10000}, "starter": {"storage_gb": 10, "queries": 100000}, "professional": {"storage_gb": 50, "queries": 1000000}, "enterprise": {"storage_gb": 500, "queries": 10000000}}'::jsonb),
 
('hosting',
 '{"bandwidth_per_gb": 0.01, "builds_per_100": 5.00, "serverless_per_1m_invocations": 2.00}'::jsonb,
 '{"free": {"bandwidth_gb": 100, "builds": 100}, "starter": {"bandwidth_gb": 500, "builds": 500}, "professional": {"bandwidth_gb": 2000, "builds": "unlimited"}, "enterprise": {"bandwidth_gb": "unlimited", "builds": "unlimited"}}'::jsonb)
 
ON CONFLICT (service_type) DO NOTHING;

-- ============================================
-- 6. Functions and Triggers
-- ============================================

-- Function to reset monthly credits at billing cycle
CREATE OR REPLACE FUNCTION reset_service_monthly_credits()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE service_subscriptions
    SET 
        credits_remaining = monthly_credits,
        credits_used_this_month = 0,
        vpn_bandwidth_used_gb = 0,
        database_queries_count = 0,
        nexusai_generations_count = 0,
        nexusai_tokens_used = 0,
        hosting_bandwidth_gb = 0,
        hosting_builds_count = 0,
        current_period_start = current_period_end,
        current_period_end = current_period_end + INTERVAL '1 month',
        next_billing_date = next_billing_date + INTERVAL '1 month',
        updated_at = NOW()
    WHERE 
        next_billing_date <= NOW()
        AND status = 'active'
        AND auto_renewal = true;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Function to apply credit purchase to balance
CREATE OR REPLACE FUNCTION apply_credit_purchase()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.payment_status = 'succeeded' AND NEW.applied_to_balance = false THEN
        -- Add credits to user's purchased balance
        UPDATE service_subscriptions
        SET 
            purchased_credits_balance = purchased_credits_balance + NEW.total_credits,
            updated_at = NOW()
        WHERE user_id = NEW.user_id;
        
        -- Mark as applied
        NEW.applied_to_balance = true;
        NEW.applied_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_apply_credit_purchase
    BEFORE UPDATE ON credit_purchases
    FOR EACH ROW
    WHEN (NEW.payment_status = 'succeeded' AND OLD.applied_to_balance = false)
    EXECUTE FUNCTION apply_credit_purchase();

-- Function to calculate AI generation cost
CREATE OR REPLACE FUNCTION calculate_ai_cost(
    p_model_id TEXT,
    p_input_tokens INTEGER,
    p_output_tokens INTEGER
)
RETURNS TABLE (
    credits_required INTEGER,
    cost_breakdown JSONB
) AS $$
DECLARE
    v_model RECORD;
    v_input_cost DECIMAL(10,4);
    v_output_cost DECIMAL(10,4);
    v_total_cost DECIMAL(10,4);
    v_credits INTEGER;
BEGIN
    -- Get model pricing
    SELECT * INTO v_model
    FROM ai_model_pricing
    WHERE model_id = p_model_id AND is_available = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Model not found or not available: %', p_model_id;
    END IF;
    
    -- Calculate costs
    v_input_cost := (p_input_tokens::DECIMAL / 1000000.0) * v_model.user_input_cost_per_1m;
    v_output_cost := (p_output_tokens::DECIMAL / 1000000.0) * v_model.user_output_cost_per_1m;
    v_total_cost := v_input_cost + v_output_cost;
    
    -- Convert to credits (1 credit = $0.01)
    v_credits := CEIL(v_total_cost * 100);
    
    RETURN QUERY SELECT 
        v_credits,
        jsonb_build_object(
            'model', v_model.model_name,
            'input_tokens', p_input_tokens,
            'output_tokens', p_output_tokens,
            'input_cost_usd', ROUND(v_input_cost::numeric, 4),
            'output_cost_usd', ROUND(v_output_cost::numeric, 4),
            'total_cost_usd', ROUND(v_total_cost::numeric, 4),
            'markup_multiplier', v_model.markup_multiplier
        );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. Migrate Existing Data
-- ============================================

-- Migrate from old user_subscriptions to new service_subscriptions
INSERT INTO service_subscriptions (
    user_id,
    tier_name,
    tier_price,
    monthly_credits,
    credits_remaining,
    purchased_credits_balance,
    current_period_start,
    current_period_end,
    stripe_customer_id,
    stripe_subscription_id,
    created_at
)
SELECT 
    user_id,
    plan_type as tier_name,
    CASE plan_type
        WHEN 'free' THEN 0
        WHEN 'pro' THEN 29
        WHEN 'enterprise' THEN 299
        ELSE 0
    END as tier_price,
    credits_limit as monthly_credits,
    credits_remaining,
    0 as purchased_credits_balance,
    created_at as current_period_start,
    created_at + INTERVAL '1 month' as current_period_end,
    stripe_customer_id,
    stripe_subscription_id,
    created_at
FROM user_subscriptions
WHERE NOT EXISTS (
    SELECT 1 FROM service_subscriptions ss WHERE ss.user_id = user_subscriptions.user_id
);

-- ============================================
-- 8. Views for Analytics
-- ============================================

CREATE OR REPLACE VIEW service_revenue_summary AS
SELECT 
    DATE_TRUNC('month', s.created_at) as month,
    s.tier_name,
    COUNT(DISTINCT s.user_id) as subscriber_count,
    SUM(s.tier_price) as monthly_recurring_revenue,
    SUM(s.credits_used_this_month) as total_credits_used,
    SUM(s.vpn_bandwidth_used_gb) as total_vpn_bandwidth_gb,
    SUM(s.database_storage_gb) as total_database_storage_gb,
    SUM(s.nexusai_generations_count) as total_ai_generations
FROM service_subscriptions s
WHERE s.status = 'active'
GROUP BY DATE_TRUNC('month', s.created_at), s.tier_name
ORDER BY month DESC, tier_name;

CREATE OR REPLACE VIEW user_service_overview AS
SELECT 
    u.id as user_id,
    u.email,
    s.tier_name,
    s.tier_price,
    s.credits_remaining + s.purchased_credits_balance as total_credits,
    s.credits_remaining as monthly_credits_left,
    s.purchased_credits_balance as purchased_credits_left,
    s.nexusai_generations_count as generations_this_month,
    s.database_count as active_databases,
    s.vpn_devices_count as connected_devices,
    s.current_period_end as billing_cycle_ends,
    s.status as subscription_status
FROM "user" u
LEFT JOIN service_subscriptions s ON u.id = s.user_id;

-- ============================================
-- 9. Grant Permissions
-- ============================================

GRANT SELECT, INSERT, UPDATE ON service_subscriptions TO platform_admin;
GRANT SELECT ON ai_model_pricing TO platform_admin;
GRANT SELECT, INSERT, UPDATE ON credit_purchases TO platform_admin;
GRANT SELECT, INSERT ON service_usage_logs TO platform_admin;
GRANT SELECT ON service_pricing_config TO platform_admin;
GRANT SELECT ON service_revenue_summary TO platform_admin;
GRANT SELECT ON user_service_overview TO platform_admin;

-- ============================================
-- 10. Comments
-- ============================================

COMMENT ON TABLE service_subscriptions IS 'Unified subscription management for all VPN Enterprise services';
COMMENT ON TABLE ai_model_pricing IS 'Dynamic pricing for AI models with automatic markup calculation';
COMMENT ON TABLE credit_purchases IS 'One-time credit purchases (top-ups) that never expire';
COMMENT ON TABLE service_usage_logs IS 'Detailed usage tracking for analytics and billing';
COMMENT ON COLUMN service_subscriptions.purchased_credits_balance IS 'Credits purchased separately, never expire';
COMMENT ON COLUMN service_subscriptions.credits_remaining IS 'Monthly credits that reset each billing cycle';
COMMENT ON FUNCTION calculate_ai_cost IS 'Calculate credit cost for AI generation based on token usage';

-- Done!
SELECT 'Migration 006: Unified Billing System completed successfully!' as status;
