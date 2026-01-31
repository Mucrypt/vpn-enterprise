-- AI Service Usage Tracking & Token Management
-- Add to platform_db

-- AI API Keys table
CREATE TABLE IF NOT EXISTS ai_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_hash VARCHAR(64) UNIQUE NOT NULL,
    key_prefix VARCHAR(8) NOT NULL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID,
    name VARCHAR(255),
    tier VARCHAR(50) DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'enterprise', 'unlimited')),
    rate_limit_requests INTEGER DEFAULT 100,
    rate_limit_window INTEGER DEFAULT 3600,
    enabled BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_ai_api_keys_tenant ON ai_api_keys(tenant_id);
CREATE INDEX idx_ai_api_keys_user ON ai_api_keys(user_id);
CREATE INDEX idx_ai_api_keys_enabled ON ai_api_keys(enabled) WHERE enabled = true;

-- AI Usage Logs table
CREATE TABLE IF NOT EXISTS ai_usage_logs (
    id BIGSERIAL PRIMARY KEY,
    api_key_id UUID REFERENCES ai_api_keys(id) ON DELETE SET NULL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    model VARCHAR(100),
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    total_tokens INTEGER,
    cached BOOLEAN DEFAULT false,
    duration_ms INTEGER,
    status_code INTEGER,
    error_message TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Partitioning by month for scalability
CREATE INDEX idx_ai_usage_logs_created_at ON ai_usage_logs(created_at DESC);
CREATE INDEX idx_ai_usage_logs_tenant ON ai_usage_logs(tenant_id, created_at DESC);
CREATE INDEX idx_ai_usage_logs_api_key ON ai_usage_logs(api_key_id, created_at DESC);

-- AI Usage Quotas table
CREATE TABLE IF NOT EXISTS ai_usage_quotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,
    tier VARCHAR(50) DEFAULT 'free',
    monthly_request_limit INTEGER DEFAULT 10000,
    monthly_requests_used INTEGER DEFAULT 0,
    monthly_token_limit BIGINT DEFAULT 1000000,
    monthly_tokens_used BIGINT DEFAULT 0,
    reset_date DATE DEFAULT (DATE_TRUNC('month', NOW()) + INTERVAL '1 month'),
    overage_allowed BOOLEAN DEFAULT false,
    overage_rate DECIMAL(10, 4) DEFAULT 0.002,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ai_usage_quotas_tenant ON ai_usage_quotas(tenant_id);
CREATE INDEX idx_ai_usage_quotas_reset_date ON ai_usage_quotas(reset_date);

-- AI Cache table (for frequently used queries)
CREATE TABLE IF NOT EXISTS ai_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key VARCHAR(64) UNIQUE NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    request_hash VARCHAR(64) NOT NULL,
    response_data JSONB NOT NULL,
    model VARCHAR(100),
    hit_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_ai_cache_key ON ai_cache(cache_key);
CREATE INDEX idx_ai_cache_expires ON ai_cache(expires_at);
CREATE INDEX idx_ai_cache_endpoint ON ai_cache(endpoint, hit_count DESC);

-- Function to auto-reset monthly quotas
CREATE OR REPLACE FUNCTION reset_monthly_ai_quotas()
RETURNS void AS $$
BEGIN
    UPDATE ai_usage_quotas
    SET 
        monthly_requests_used = 0,
        monthly_tokens_used = 0,
        reset_date = DATE_TRUNC('month', NOW()) + INTERVAL '1 month',
        updated_at = NOW()
    WHERE reset_date <= CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Function to clean expired cache
CREATE OR REPLACE FUNCTION clean_expired_ai_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM ai_cache
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to track AI usage
CREATE OR REPLACE FUNCTION track_ai_usage(
    p_tenant_id UUID,
    p_tokens INTEGER DEFAULT 0
) RETURNS void AS $$
BEGIN
    INSERT INTO ai_usage_quotas (tenant_id, monthly_requests_used, monthly_tokens_used)
    VALUES (p_tenant_id, 1, p_tokens)
    ON CONFLICT (tenant_id) DO UPDATE
    SET 
        monthly_requests_used = ai_usage_quotas.monthly_requests_used + 1,
        monthly_tokens_used = ai_usage_quotas.monthly_tokens_used + p_tokens,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Add AI columns to tenants table
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS ai_tier VARCHAR(50) DEFAULT 'free',
ADD COLUMN IF NOT EXISTS ai_custom_quota INTEGER;

-- Create materialized view for AI analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS ai_usage_analytics AS
SELECT 
    DATE_TRUNC('day', created_at) as date,
    tenant_id,
    endpoint,
    model,
    COUNT(*) as request_count,
    COUNT(*) FILTER (WHERE cached = true) as cached_requests,
    SUM(total_tokens) as total_tokens,
    AVG(duration_ms) as avg_duration_ms,
    COUNT(*) FILTER (WHERE status_code >= 400) as error_count
FROM ai_usage_logs
WHERE created_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE_TRUNC('day', created_at), tenant_id, endpoint, model;

CREATE UNIQUE INDEX ON ai_usage_analytics(date, tenant_id, endpoint, model);

-- Grant permissions
GRANT SELECT ON ai_api_keys TO platform_admin;
GRANT ALL ON ai_usage_logs TO platform_admin;
GRANT ALL ON ai_usage_quotas TO platform_admin;
GRANT SELECT ON ai_cache TO platform_admin;
GRANT SELECT ON ai_usage_analytics TO platform_admin;

-- Insert default quotas for existing tenants
INSERT INTO ai_usage_quotas (tenant_id, tier, monthly_request_limit, monthly_token_limit)
SELECT id, 'free', 10000, 1000000
FROM tenants
WHERE NOT EXISTS (
    SELECT 1 FROM ai_usage_quotas WHERE tenant_id = tenants.id
);

COMMENT ON TABLE ai_api_keys IS 'API keys for AI service authentication';
COMMENT ON TABLE ai_usage_logs IS 'Detailed logs of AI service usage for billing and analytics';
COMMENT ON TABLE ai_usage_quotas IS 'Monthly usage quotas and limits per tenant';
COMMENT ON TABLE ai_cache IS 'Cached AI responses for faster repeated queries';
