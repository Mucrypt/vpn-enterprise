-- AI API Keys and Usage Tracking Tables
-- Run this on platform_db

-- API Keys table
CREATE TABLE IF NOT EXISTS ai_api_keys (
    id SERIAL PRIMARY KEY,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    tenant_id VARCHAR(255) NOT NULL,
    tier VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'enterprise')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    last_used_at TIMESTAMP,
    
    -- Rate limiting fields
    requests_today INTEGER DEFAULT 0,
    requests_this_hour INTEGER DEFAULT 0,
    last_request_date DATE DEFAULT CURRENT_DATE,
    last_request_hour INTEGER DEFAULT EXTRACT(HOUR FROM NOW())::INT,
    daily_limit INTEGER DEFAULT 1000,
    hourly_limit INTEGER DEFAULT 100,
    
    -- Metadata
    description TEXT,
    created_by VARCHAR(255),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Usage logs table for analytics
CREATE TABLE IF NOT EXISTS ai_usage_logs (
    id BIGSERIAL PRIMARY KEY,
    api_key VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    tenant_id VARCHAR(255) NOT NULL,
    endpoint VARCHAR(100) NOT NULL,
    action VARCHAR(50),
    model VARCHAR(100),
    prompt_length INTEGER,
    response_length INTEGER,
    cached BOOLEAN DEFAULT false,
    duration_ms FLOAT,
    status_code INTEGER,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Indexes for analytics queries
    CONSTRAINT fk_api_key FOREIGN KEY (api_key) REFERENCES ai_api_keys(api_key) ON DELETE CASCADE
);

-- Tenant AI quotas
CREATE TABLE IF NOT EXISTS ai_tenant_quotas (
    id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(255) UNIQUE NOT NULL,
    tier VARCHAR(20) NOT NULL DEFAULT 'free',
    monthly_limit INTEGER DEFAULT 10000,
    requests_this_month INTEGER DEFAULT 0,
    reset_date DATE DEFAULT (CURRENT_DATE + INTERVAL '1 month'),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON ai_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_tenant ON ai_api_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON ai_api_keys(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_usage_logs_created ON ai_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_logs_api_key ON ai_usage_logs(api_key);
CREATE INDEX IF NOT EXISTS idx_usage_logs_tenant ON ai_usage_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_quotas_tenant ON ai_tenant_quotas(tenant_id);

-- Function to reset daily counters
CREATE OR REPLACE FUNCTION reset_daily_ai_counters()
RETURNS void AS $$
BEGIN
    UPDATE ai_api_keys
    SET requests_today = 0,
        last_request_date = CURRENT_DATE
    WHERE last_request_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Function to reset hourly counters
CREATE OR REPLACE FUNCTION reset_hourly_ai_counters()
RETURNS void AS $$
BEGIN
    UPDATE ai_api_keys
    SET requests_this_hour = 0,
        last_request_hour = EXTRACT(HOUR FROM NOW())::INT
    WHERE last_request_hour != EXTRACT(HOUR FROM NOW())::INT;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_api_keys_updated_at
    BEFORE UPDATE ON ai_api_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_tenant_quotas_updated_at
    BEFORE UPDATE ON ai_tenant_quotas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON ai_api_keys TO platform_admin;
GRANT SELECT, INSERT ON ai_usage_logs TO platform_admin;
GRANT SELECT, INSERT, UPDATE ON ai_tenant_quotas TO platform_admin;
GRANT USAGE, SELECT ON SEQUENCE ai_api_keys_id_seq TO platform_admin;
GRANT USAGE, SELECT ON SEQUENCE ai_usage_logs_id_seq TO platform_admin;
GRANT USAGE, SELECT ON SEQUENCE ai_tenant_quotas_id_seq TO platform_admin;

COMMENT ON TABLE ai_api_keys IS 'API keys for AI service authentication and rate limiting';
COMMENT ON TABLE ai_usage_logs IS 'Detailed logs of AI API usage for analytics';
COMMENT ON TABLE ai_tenant_quotas IS 'Monthly quotas and limits per tenant';
