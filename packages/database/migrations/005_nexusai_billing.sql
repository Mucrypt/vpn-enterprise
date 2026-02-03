-- NexusAI Billing System Schema
-- Add billing tables for credit-based system

-- User subscriptions table (extends existing users)
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  plan_type VARCHAR(20) NOT NULL DEFAULT 'free', -- 'free', 'pro', 'enterprise'
  credits_limit INTEGER NOT NULL DEFAULT 100, -- Monthly credit limit
  credits_remaining INTEGER NOT NULL DEFAULT 100, -- Current balance
  database_quota_gb INTEGER NOT NULL DEFAULT 1, -- GB of database storage allowed
  apps_limit INTEGER DEFAULT 3, -- Max apps (NULL for unlimited)
  stripe_customer_id VARCHAR(255), -- Stripe customer ID for pro/enterprise
  stripe_subscription_id VARCHAR(255), -- Stripe subscription ID
  subscription_status VARCHAR(20) DEFAULT 'active', -- 'active', 'canceled', 'past_due'
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index for quick user lookups
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer ON user_subscriptions(stripe_customer_id);

-- Billing transactions log
CREATE TABLE IF NOT EXISTS billing_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Credits deducted (negative) or added (positive)
  operation VARCHAR(50) NOT NULL, -- 'ai_generation', 'database_provision', 'refund', 'purchase'
  metadata JSONB, -- Additional context (e.g., app_id, database_id)
  balance_after INTEGER NOT NULL, -- Balance after this transaction
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index for transaction history
CREATE INDEX IF NOT EXISTS idx_billing_transactions_user_id ON billing_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_transactions_created_at ON billing_transactions(created_at DESC);

-- Database usage tracking
CREATE TABLE IF NOT EXISTS database_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  storage_used_bytes BIGINT NOT NULL DEFAULT 0,
  queries_count INTEGER NOT NULL DEFAULT 0,
  last_accessed TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id)
);

-- Index for usage queries
CREATE INDEX IF NOT EXISTS idx_database_usage_user_id ON database_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_database_usage_tenant_id ON database_usage(tenant_id);

-- NexusAI app generation logs (for analytics and billing)
CREATE TABLE IF NOT EXISTS nexusai_generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  app_id UUID REFERENCES nexusai_generated_apps(id) ON DELETE SET NULL,
  prompt TEXT NOT NULL, -- User's input description
  tokens_used INTEGER, -- LLM tokens consumed
  credits_charged INTEGER NOT NULL, -- Credits deducted
  generation_time_ms INTEGER, -- How long generation took
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index for analytics
CREATE INDEX IF NOT EXISTS idx_generation_logs_user_id ON nexusai_generation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_logs_created_at ON nexusai_generation_logs(created_at DESC);

-- Function to auto-create free subscription for new users
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_subscriptions (
    user_id,
    plan_type,
    credits_limit,
    credits_remaining,
    database_quota_gb,
    apps_limit
  ) VALUES (
    NEW.id,
    'free',
    100, -- 100 free credits
    100,
    1, -- 1GB database
    3  -- 3 apps max
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create subscription on user signup
DROP TRIGGER IF EXISTS trigger_create_default_subscription ON "user";
CREATE TRIGGER trigger_create_default_subscription
  AFTER INSERT ON "user"
  FOR EACH ROW
  EXECUTE FUNCTION create_default_subscription();

-- Function to reset monthly credits (run via cron)
CREATE OR REPLACE FUNCTION reset_monthly_credits()
RETURNS void AS $$
BEGIN
  UPDATE user_subscriptions
  SET 
    credits_remaining = credits_limit,
    updated_at = NOW()
  WHERE subscription_status = 'active'
    AND current_period_end < NOW();
END;
$$ LANGUAGE plpgsql;

-- View for user subscription summary
CREATE OR REPLACE VIEW user_subscription_summary AS
SELECT 
  u.id AS user_id,
  u.email,
  s.plan_type,
  s.credits_remaining,
  s.credits_limit,
  s.database_quota_gb,
  s.apps_limit,
  s.subscription_status,
  COUNT(DISTINCT a.id) AS apps_count,
  COUNT(DISTINCT t.id) AS databases_count,
  COALESCE(SUM(du.storage_used_bytes), 0) / (1024*1024*1024) AS storage_used_gb
FROM "user" u
LEFT JOIN user_subscriptions s ON s.user_id = u.id
LEFT JOIN nexusai_generated_apps a ON a.user_id = u.id
LEFT JOIN tenants t ON t.id IN (
  SELECT tenant_id FROM nexusai_generated_apps WHERE user_id = u.id
)
LEFT JOIN database_usage du ON du.user_id = u.id
GROUP BY u.id, u.email, s.plan_type, s.credits_remaining, s.credits_limit, 
         s.database_quota_gb, s.apps_limit, s.subscription_status;

-- Grant permissions (adjust based on your roles)
GRANT SELECT, INSERT, UPDATE ON user_subscriptions TO platform_admin;
GRANT SELECT, INSERT ON billing_transactions TO platform_admin;
GRANT SELECT, INSERT, UPDATE ON database_usage TO platform_admin;
GRANT SELECT, INSERT ON nexusai_generation_logs TO platform_admin;
GRANT SELECT ON user_subscription_summary TO platform_admin;

-- Comments
COMMENT ON TABLE user_subscriptions IS 'User subscription plans and credit balances for NexusAI';
COMMENT ON TABLE billing_transactions IS 'Credit transaction history for auditing and analytics';
COMMENT ON TABLE database_usage IS 'Track database storage and query usage for billing';
COMMENT ON TABLE nexusai_generation_logs IS 'Log all AI generation attempts for analytics and cost tracking';
