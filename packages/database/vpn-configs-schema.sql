-- VPN Configurations Table
CREATE TABLE IF NOT EXISTS vpn_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  server_id UUID REFERENCES servers(id) ON DELETE SET NULL,
  
  -- WireGuard Keys
  client_public_key TEXT NOT NULL UNIQUE,
  client_private_key_encrypted TEXT NOT NULL,
  
  -- Network Configuration
  allocated_ip INET NOT NULL UNIQUE,
  dns_servers TEXT DEFAULT '1.1.1.1, 1.0.0.1',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_handshake TIMESTAMP,
  
  -- Bandwidth Tracking
  bytes_sent BIGINT DEFAULT 0,
  bytes_received BIGINT DEFAULT 0,
  data_limit_mb INTEGER DEFAULT 500, -- Free tier: 500MB
  
  -- Metadata
  device_name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  
  CONSTRAINT unique_user_device UNIQUE(user_id, device_name)
);

-- Bandwidth Usage Logs
CREATE TABLE IF NOT EXISTS bandwidth_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vpn_config_id UUID REFERENCES vpn_configs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  bytes_sent BIGINT NOT NULL DEFAULT 0,
  bytes_received BIGINT NOT NULL DEFAULT 0,
  
  session_start TIMESTAMP NOT NULL,
  session_end TIMESTAMP,
  duration_seconds INTEGER,
  
  measured_at TIMESTAMP DEFAULT NOW()
);

-- Subscription Tiers Table
CREATE TABLE IF NOT EXISTS subscription_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  
  -- Limits
  max_devices INTEGER NOT NULL,
  data_limit_mb INTEGER, -- NULL = unlimited
  max_concurrent_connections INTEGER DEFAULT 1,
  
  -- Features
  access_level TEXT DEFAULT 'basic', -- basic, premium, enterprise
  can_access_premium_servers BOOLEAN DEFAULT false,
  priority_support BOOLEAN DEFAULT false,
  
  -- Pricing
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2),
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default tiers
INSERT INTO subscription_tiers (name, max_devices, data_limit_mb, price_monthly, price_yearly, access_level, can_access_premium_servers)
VALUES 
  ('Free', 1, 500, 0.00, 0.00, 'basic', false),
  ('Basic', 3, 10240, 4.99, 49.90, 'basic', false),
  ('Premium', 5, NULL, 9.99, 99.90, 'premium', true),
  ('Enterprise', 10, NULL, 19.99, 199.90, 'enterprise', true)
ON CONFLICT (name) DO NOTHING;

-- Update users table to reference subscription tier
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS subscription_tier_id UUID REFERENCES subscription_tiers(id),
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP;

-- Set all existing users to Free tier
UPDATE users 
SET subscription_tier_id = (SELECT id FROM subscription_tiers WHERE name = 'Free')
WHERE subscription_tier_id IS NULL;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_vpn_configs_user_id ON vpn_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_vpn_configs_active ON vpn_configs(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_bandwidth_logs_user_id ON bandwidth_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_bandwidth_logs_measured_at ON bandwidth_logs(measured_at);

-- Function to check if user has reached device limit
CREATE OR REPLACE FUNCTION check_device_limit()
RETURNS TRIGGER AS $$
DECLARE
  device_count INTEGER;
  max_allowed INTEGER;
BEGIN
  -- Get current device count
  SELECT COUNT(*) INTO device_count
  FROM vpn_configs
  WHERE user_id = NEW.user_id AND is_active = true;
  
  -- Get max devices allowed for user's tier
  SELECT st.max_devices INTO max_allowed
  FROM users u
  JOIN subscription_tiers st ON u.subscription_tier_id = st.id
  WHERE u.id = NEW.user_id;
  
  -- Check limit
  IF device_count >= max_allowed THEN
    RAISE EXCEPTION 'Device limit reached. Upgrade your plan to add more devices.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce device limits
DROP TRIGGER IF EXISTS enforce_device_limit ON vpn_configs;
CREATE TRIGGER enforce_device_limit
  BEFORE INSERT ON vpn_configs
  FOR EACH ROW
  EXECUTE FUNCTION check_device_limit();

-- Function to check data limit
CREATE OR REPLACE FUNCTION check_data_limit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  total_usage BIGINT;
  data_limit INTEGER;
BEGIN
  -- Get user's data limit (in MB)
  SELECT st.data_limit_mb INTO data_limit
  FROM users u
  JOIN subscription_tiers st ON u.subscription_tier_id = st.id
  WHERE u.id = p_user_id;
  
  -- NULL means unlimited
  IF data_limit IS NULL THEN
    RETURN true;
  END IF;
  
  -- Calculate total usage this month
  SELECT COALESCE(SUM(bytes_sent + bytes_received), 0) INTO total_usage
  FROM bandwidth_logs
  WHERE user_id = p_user_id
    AND measured_at >= DATE_TRUNC('month', CURRENT_TIMESTAMP);
  
  -- Convert bytes to MB and compare
  RETURN (total_usage / 1048576) < data_limit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE vpn_configs IS 'Stores VPN configuration for each user device';
COMMENT ON TABLE bandwidth_logs IS 'Tracks bandwidth usage for billing and limits';
COMMENT ON TABLE subscription_tiers IS 'Defines subscription plans and limits';
