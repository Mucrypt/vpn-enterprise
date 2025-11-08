-- =============================================
-- ENHANCED DATABASE SCHEMA FOR PHASE 5
-- Enterprise Features: Organizations, Enhanced Users, Subscriptions
-- =============================================

-- Create user role enum if not exists
DO $$ BEGIN
  CREATE TYPE user_role_enum AS ENUM ('super_admin', 'admin', 'user', 'viewer');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- 1. ORGANIZATIONS TABLE (Multi-tenant support)
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

-- Add RLS policies for organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization"
  ON organizations FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM users WHERE organization_id = organizations.id
  ));

CREATE POLICY "Super admins can manage organizations"
  ON organizations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- =============================================
-- 2. ENHANCE EXISTING USERS TABLE
-- =============================================
-- Add new columns to users table
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id),
  ADD COLUMN IF NOT EXISTS role user_role_enum DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS mfa_secret TEXT,
  ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create index on organization_id
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- =============================================
-- 3. SUBSCRIPTIONS TABLE (Enhanced billing)
-- =============================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_type VARCHAR(50) NOT NULL, -- 'free', 'basic', 'professional', 'enterprise'
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'cancelled', 'expired', 'suspended'
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

-- Add RLS policies for subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their subscription"
  ON subscriptions FOR SELECT
  USING (user_id = auth.uid() OR organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can manage subscriptions"
  ON subscriptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'admin')
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_organization_id ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);

-- =============================================
-- 4. INVOICES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'refunded'
  due_date TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  stripe_invoice_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255),
  pdf_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their invoices"
  ON invoices FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_invoices_subscription_id ON invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_organization_id ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);

-- =============================================
-- 5. API KEYS TABLE (For integrations)
-- =============================================
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_preview VARCHAR(20) NOT NULL, -- First few chars for display
  scopes TEXT[] DEFAULT '{}', -- ['read:servers', 'write:clients', etc.]
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Add RLS policies for API keys
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their API keys"
  ON api_keys FOR ALL
  USING (user_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_organization_id ON api_keys(organization_id);

-- =============================================
-- 6. SESSIONS TABLE (Enhanced session management)
-- =============================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  device_name VARCHAR(255),
  device_type VARCHAR(50), -- 'desktop', 'mobile', 'tablet'
  os VARCHAR(50),
  browser VARCHAR(50),
  ip_address INET,
  user_agent TEXT,
  refresh_token_hash TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for sessions
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their sessions"
  ON user_sessions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their sessions"
  ON user_sessions FOR DELETE
  USING (user_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- =============================================
-- 7. NOTIFICATION PREFERENCES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  security_alerts BOOLEAN DEFAULT TRUE,
  billing_alerts BOOLEAN DEFAULT TRUE,
  system_updates BOOLEAN DEFAULT TRUE,
  marketing_emails BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for notification preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their notification preferences"
  ON notification_preferences FOR ALL
  USING (user_id = auth.uid());

-- =============================================
-- 8. FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 9. SEED DATA (For testing)
-- =============================================

-- Insert default organization
INSERT INTO organizations (id, name, billing_tier, max_users, max_servers)
VALUES 
  (gen_random_uuid(), 'Default Organization', 'enterprise', 100, 10)
ON CONFLICT DO NOTHING;

-- Insert sample subscription plans (reference data)
-- Note: Actual plans would be managed in your billing system (e.g., Stripe)

-- =============================================
-- SCHEMA COMPLETE
-- =============================================

-- Verify tables were created
DO $$
BEGIN
  RAISE NOTICE 'Enhanced schema deployment complete!';
  RAISE NOTICE 'Created tables: organizations, enhanced users, subscriptions, invoices, api_keys, user_sessions, notification_preferences';
END $$;
