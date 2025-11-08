-- =============================================
-- ADD MISSING TABLES FOR PHASE 5
-- Run this in Supabase SQL Editor
-- =============================================

-- Create user_role enum if not exists
DO $$ BEGIN
  CREATE TYPE user_role_enum AS ENUM ('super_admin', 'admin', 'user', 'viewer');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- 1. CREATE PUBLIC.USERS TABLE
-- Extends auth.users with additional fields
-- =============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  organization_id UUID,
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
-- 2. CREATE ORGANIZATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Now add foreign key to users table
ALTER TABLE public.users 
  ADD CONSTRAINT users_organization_id_fkey 
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;

-- =============================================
-- 3. UPDATE EXISTING TABLES TO USE PUBLIC.USERS
-- =============================================

-- Update user_devices foreign key
ALTER TABLE user_devices DROP CONSTRAINT IF EXISTS user_devices_user_id_fkey;
ALTER TABLE user_devices 
  ADD CONSTRAINT user_devices_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Update user_subscriptions foreign key  
ALTER TABLE user_subscriptions DROP CONSTRAINT IF EXISTS user_subscriptions_user_id_fkey;
ALTER TABLE user_subscriptions 
  ADD CONSTRAINT user_subscriptions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Update connection_logs foreign key
ALTER TABLE connection_logs DROP CONSTRAINT IF EXISTS connection_logs_user_id_fkey;
ALTER TABLE connection_logs 
  ADD CONSTRAINT connection_logs_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Update user_security_settings foreign key
ALTER TABLE user_security_settings DROP CONSTRAINT IF EXISTS user_security_settings_user_id_fkey;
ALTER TABLE user_security_settings 
  ADD CONSTRAINT user_security_settings_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Update split_tunnel_rules foreign key
ALTER TABLE split_tunnel_rules DROP CONSTRAINT IF EXISTS split_tunnel_rules_user_id_fkey;
ALTER TABLE split_tunnel_rules 
  ADD CONSTRAINT split_tunnel_rules_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Update client_configurations foreign key
ALTER TABLE client_configurations DROP CONSTRAINT IF EXISTS client_configurations_user_id_fkey;
ALTER TABLE client_configurations 
  ADD CONSTRAINT client_configurations_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Update kill_switch_events foreign key
ALTER TABLE kill_switch_events DROP CONSTRAINT IF EXISTS kill_switch_events_user_id_fkey;
ALTER TABLE kill_switch_events 
  ADD CONSTRAINT kill_switch_events_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Update security_audit_log foreign key
ALTER TABLE security_audit_log DROP CONSTRAINT IF EXISTS security_audit_log_user_id_fkey;
ALTER TABLE security_audit_log 
  ADD CONSTRAINT security_audit_log_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- =============================================
-- 4. CREATE SUBSCRIPTIONS TABLE (Enhanced)
-- =============================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
-- 5. CREATE INVOICES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
-- 6. CREATE API_KEYS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
-- 7. CREATE USER_SESSIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
-- 8. ADD LATITUDE/LONGITUDE TO SERVERS
-- =============================================
ALTER TABLE servers 
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- =============================================
-- 9. CREATE INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON public.users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_organization_id ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_organization_id ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);

-- =============================================
-- 10. ENABLE RLS
-- =============================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 11. RLS POLICIES
-- =============================================

-- Users can view their own data
CREATE POLICY "Users can view own data" ON public.users 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users 
  FOR UPDATE USING (auth.uid() = id);

-- Organizations policies
CREATE POLICY "Users can view their organization" ON organizations 
  FOR SELECT USING (
    id IN (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );

-- =============================================
-- 12. AUTO-CREATE USER PROFILE TRIGGER
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, email_verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email_confirmed_at IS NOT NULL
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 12b. CREATE UPDATED_AT TRIGGERS FOR NEW TABLES
-- =============================================

-- Create update_updated_at_column function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for new tables only
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at 
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at 
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at 
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 13. UPDATE EXISTING SERVERS WITH COORDINATES
-- =============================================
UPDATE servers SET latitude = 40.7128, longitude = -74.0060 WHERE name LIKE '%US-East%';
UPDATE servers SET latitude = 51.5074, longitude = -0.1278 WHERE name LIKE '%London%' OR name LIKE '%UK%';
UPDATE servers SET latitude = 50.1109, longitude = 8.6821 WHERE name LIKE '%Frankfurt%' OR name LIKE '%DE%';
UPDATE servers SET latitude = 1.3521, longitude = 103.8198 WHERE name LIKE '%Singapore%' OR name LIKE '%SG%';
UPDATE servers SET latitude = 35.6762, longitude = 139.6503 WHERE name LIKE '%Tokyo%' OR name LIKE '%JP%';

-- Insert missing servers with coordinates
INSERT INTO servers (name, country, country_code, city, host, public_key, port, latitude, longitude) VALUES
('AU-Sydney-1', 'Australia', 'AU', 'Sydney', '45.79.123.50', 'AU9Mvt9x1PmvFiCDpMMBK/JLkOamgUA66JoTTw=', 51820, -33.8688, 151.2093),
('CA-Toronto-1', 'Canada', 'CA', 'Toronto', '45.79.123.51', 'CA9Mvt9x1PmvFiCDpMMBK/JLkOamgUA66JoTTw=', 51820, 43.6532, -79.3832),
('BR-SaoPaulo-1', 'Brazil', 'BR', 'São Paulo', '45.79.123.52', 'BR9Mvt9x1PmvFiCDpMMBK/JLkOamgUA66JoTTw=', 51820, -23.5505, -46.6333)
ON CONFLICT (host) DO NOTHING;

-- =============================================
-- 14. SEED DEFAULT ORGANIZATION
-- =============================================
INSERT INTO organizations (name, billing_tier, max_users, max_servers)
VALUES ('Default Organization', 'enterprise', 100, 10)
ON CONFLICT DO NOTHING;

-- =============================================
-- DONE!
-- =============================================
SELECT 'Migration complete! Tables added: public.users, organizations, subscriptions, invoices, api_keys, user_sessions' AS message;
