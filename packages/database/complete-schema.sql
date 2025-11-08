-- =============================================
-- COMPLETE VPN ENTERPRISE DATABASE SCHEMA
-- Execute this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- CUSTOM TYPES
-- =============================================
DO $$ BEGIN
  CREATE TYPE subscription_plan AS ENUM ('free', 'basic', 'premium', 'enterprise');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'cancelled', 'trial');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE connection_status AS ENUM ('connected', 'disconnected', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE user_role_enum AS ENUM ('super_admin', 'admin', 'user', 'viewer');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- 1. ORGANIZATIONS TABLE (Multi-tenant support)
-- =============================================
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  billing_tier VARCHAR(50) DEFAULT 'free',
  max_users INTEGER DEFAULT 5,
  max_servers INTEGER DEFAULT 1,
  max_devices_per_user INTEGER DEFAULT 3,
  features JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- =============================================
-- 2. USERS TABLE (Extends auth.users)
-- =============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  role user_role_enum DEFAULT 'user',
  mfa_enabled BOOLEAN DEFAULT FALSE,
  mfa_secret TEXT,
  last_login TIMESTAMP WITH TIME ZONE,
  login_attempts INTEGER DEFAULT 0,
  account_locked_until TIMESTAMP WITH TIME ZONE,
  email_verified BOOLEAN DEFAULT FALSE,
  phone VARCHAR(20),
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 3. SERVERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS servers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100) NOT NULL,
    country_code VARCHAR(2) NOT NULL,
    city VARCHAR(100),
    host VARCHAR(255) NOT NULL UNIQUE,
    public_key TEXT NOT NULL,
    port INTEGER NOT NULL DEFAULT 51820,
    load DECIMAL(5,2) DEFAULT 0.00 CHECK (load >= 0 AND load <= 100),
    max_clients INTEGER DEFAULT 100,
    current_clients INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    protocol VARCHAR(50) DEFAULT 'wireguard',
    features JSONB DEFAULT '[]'::jsonb,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 4. USER_SUBSCRIPTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    plan_type subscription_plan DEFAULT 'free',
    status subscription_status DEFAULT 'trial',
    max_devices INTEGER DEFAULT 1,
    data_limit_gb INTEGER,
    bandwidth_limit_mbps INTEGER,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    auto_renew BOOLEAN DEFAULT false,
    payment_method_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- =============================================
-- 5. SUBSCRIPTIONS TABLE (Enhanced)
-- =============================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  plan_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  stripe_subscription_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  price_amount DECIMAL(10, 2),
  price_currency VARCHAR(3) DEFAULT 'USD',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 6. USER_DEVICES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS user_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    device_name VARCHAR(255) NOT NULL,
    public_key TEXT NOT NULL UNIQUE,
    private_key TEXT NOT NULL,
    assigned_ip VARCHAR(45) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    last_connected_at TIMESTAMP WITH TIME ZONE,
    os_type VARCHAR(50),
    device_fingerprint VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 7. CONNECTION_LOGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS connection_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    device_id UUID REFERENCES user_devices(id) ON DELETE SET NULL,
    server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
    status connection_status DEFAULT 'connected',
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    disconnected_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    data_uploaded_mb DECIMAL(12,2) DEFAULT 0.00,
    data_downloaded_mb DECIMAL(12,2) DEFAULT 0.00,
    ip_address INET,
    disconnect_reason VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 8. USER_SECURITY_SETTINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS user_security_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret TEXT,
    backup_codes TEXT[],
    kill_switch_enabled BOOLEAN DEFAULT false,
    auto_connect BOOLEAN DEFAULT false,
    preferred_protocol VARCHAR(50) DEFAULT 'wireguard',
    dns_leak_protection BOOLEAN DEFAULT true,
    ipv6_leak_protection BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 9. SPLIT_TUNNEL_RULES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS split_tunnel_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    rule_type VARCHAR(20) NOT NULL CHECK (rule_type IN ('app', 'domain', 'ip')),
    rule_value TEXT NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('bypass', 'force_vpn')),
    is_active BOOLEAN DEFAULT true,
    platform VARCHAR(20) CHECK (platform IN ('windows', 'macos', 'linux', 'ios', 'android', 'all')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 10. CLIENT_CONFIGURATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS client_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    device_id UUID REFERENCES user_devices(id) ON DELETE CASCADE,
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('windows', 'macos', 'linux', 'ios', 'android', 'web')),
    config_type VARCHAR(20) NOT NULL CHECK (config_type IN ('wireguard', 'openvpn')),
    config_data TEXT NOT NULL,
    encryption_level VARCHAR(20) DEFAULT 'aes-256',
    dns_servers TEXT[],
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 11. SECURITY_AUDIT_LOG TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS security_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,
    event_description TEXT,
    ip_address INET,
    user_agent TEXT,
    severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 12. INVOICES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  due_date TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  stripe_invoice_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255),
  pdf_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 13. API_KEYS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_preview VARCHAR(20) NOT NULL,
  scopes TEXT[] DEFAULT '{}',
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- =============================================
-- 14. USER_SESSIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  device_name VARCHAR(255),
  device_type VARCHAR(50),
  os VARCHAR(50),
  browser VARCHAR(50),
  ip_address INET,
  user_agent TEXT,
  refresh_token_hash TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON public.users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_servers_country ON servers(country);
CREATE INDEX IF NOT EXISTS idx_servers_active ON servers(is_active);
CREATE INDEX IF NOT EXISTS idx_connection_logs_user_id ON connection_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_connection_logs_server_id ON connection_logs(server_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_organization_id ON invoices(organization_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- Public servers are viewable
CREATE POLICY "Public servers viewable" ON servers FOR SELECT USING (is_active = true);

-- Users can view their own data
CREATE POLICY "Users can view own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (auth.uid() = id);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_servers_updated_at BEFORE UPDATE ON servers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create user profile when auth.users is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, email_verified)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email_confirmed_at IS NOT NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- SEED DATA
-- =============================================
INSERT INTO servers (name, country, country_code, city, host, public_key, port, latitude, longitude) VALUES
('US-East-1', 'United States', 'US', 'New York', '45.79.123.45', '4nEWZs+9Mvt9x1PmvFiCDpMMBK/JLkOamgUA66JoTTw=', 51820, 40.7128, -74.0060),
('UK-London-1', 'United Kingdom', 'GB', 'London', '45.79.123.46', 'UK9Mvt9x1PmvFiCDpMMBK/JLkOamgUA66JoTTw=', 51820, 51.5074, -0.1278),
('DE-Frankfurt-1', 'Germany', 'DE', 'Frankfurt', '45.79.123.47', 'DE9Mvt9x1PmvFiCDpMMBK/JLkOamgUA66JoTTw=', 51820, 50.1109, 8.6821),
('SG-Singapore-1', 'Singapore', 'SG', 'Singapore', '45.79.123.48', 'SG9Mvt9x1PmvFiCDpMMBK/JLkOamgUA66JoTTw=', 51820, 1.3521, 103.8198),
('JP-Tokyo-1', 'Japan', 'JP', 'Tokyo', '45.79.123.49', 'JP9Mvt9x1PmvFiCDpMMBK/JLkOamgUA66JoTTw=', 51820, 35.6762, 139.6503),
('AU-Sydney-1', 'Australia', 'AU', 'Sydney', '45.79.123.50', 'AU9Mvt9x1PmvFiCDpMMBK/JLkOamgUA66JoTTw=', 51820, -33.8688, 151.2093),
('CA-Toronto-1', 'Canada', 'CA', 'Toronto', '45.79.123.51', 'CA9Mvt9x1PmvFiCDpMMBK/JLkOamgUA66JoTTw=', 51820, 43.6532, -79.3832),
('BR-SaoPaulo-1', 'Brazil', 'BR', 'São Paulo', '45.79.123.52', 'BR9Mvt9x1PmvFiCDpMMBK/JLkOamgUA66JoTTw=', 51820, -23.5505, -46.6333)
ON CONFLICT (host) DO NOTHING;

-- Insert default organization
INSERT INTO organizations (name, billing_tier, max_users, max_servers)
VALUES ('Default Organization', 'enterprise', 100, 10)
ON CONFLICT DO NOTHING;
