-- =============================================
-- PHASE 4: ENTERPRISE FEATURES - DATABASE ENHANCEMENTS
-- =============================================
-- Add this to your existing Supabase database after running schema.sql

-- =============================================
-- USER SECURITY SETTINGS
-- Two-Factor Authentication and Security Preferences
-- =============================================
CREATE TABLE IF NOT EXISTS user_security_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret TEXT, -- TOTP secret
    backup_codes TEXT[], -- Array of backup codes
    kill_switch_enabled BOOLEAN DEFAULT false,
    auto_connect BOOLEAN DEFAULT false,
    preferred_protocol VARCHAR(50) DEFAULT 'wireguard',
    dns_leak_protection BOOLEAN DEFAULT true,
    ipv6_leak_protection BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- SPLIT TUNNELING RULES
-- Per-user application and domain routing rules
-- =============================================
CREATE TABLE IF NOT EXISTS split_tunnel_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rule_type VARCHAR(20) NOT NULL CHECK (rule_type IN ('app', 'domain', 'ip')),
    rule_value TEXT NOT NULL, -- app name, domain, or IP address
    action VARCHAR(20) NOT NULL CHECK (action IN ('bypass', 'force_vpn')),
    is_active BOOLEAN DEFAULT true,
    platform VARCHAR(20) CHECK (platform IN ('windows', 'macos', 'linux', 'ios', 'android', 'all')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- VPN CLIENT CONFIGURATIONS
-- Store generated configs for different platforms
-- =============================================
CREATE TABLE IF NOT EXISTS client_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id UUID REFERENCES user_devices(id) ON DELETE CASCADE,
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('windows', 'macos', 'linux', 'ios', 'android', 'web')),
    config_type VARCHAR(20) NOT NULL CHECK (config_type IN ('wireguard', 'openvpn')),
    config_data TEXT NOT NULL, -- The actual .conf or .ovpn file content
    encryption_level VARCHAR(20) DEFAULT 'aes-256',
    dns_servers TEXT[], -- Custom DNS servers
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- KILL SWITCH EVENTS LOG
-- Track when kill switch activates/deactivates
-- =============================================
CREATE TABLE IF NOT EXISTS kill_switch_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id UUID REFERENCES user_devices(id) ON DELETE SET NULL,
    event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('activated', 'deactivated', 'triggered')),
    reason TEXT,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- SECURITY AUDIT LOG
-- Track security-related events for compliance
-- =============================================
CREATE TABLE IF NOT EXISTS security_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,
    event_description TEXT,
    ip_address INET,
    user_agent TEXT,
    severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ENCRYPTION PROTOCOLS
-- Supported encryption methods and ciphers
-- =============================================
CREATE TABLE IF NOT EXISTS encryption_protocols (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    protocol_type VARCHAR(20) NOT NULL CHECK (protocol_type IN ('wireguard', 'openvpn', 'ikev2')),
    cipher VARCHAR(50) NOT NULL, -- e.g., 'AES-256-GCM', 'ChaCha20-Poly1305'
    key_size INTEGER NOT NULL,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    security_level VARCHAR(20) DEFAULT 'high' CHECK (security_level IN ('standard', 'high', 'maximum')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX idx_user_security_settings_user_id ON user_security_settings(user_id);
CREATE INDEX idx_split_tunnel_rules_user_id ON split_tunnel_rules(user_id);
CREATE INDEX idx_split_tunnel_rules_platform ON split_tunnel_rules(platform);
CREATE INDEX idx_client_configurations_user_id ON client_configurations(user_id);
CREATE INDEX idx_client_configurations_device_id ON client_configurations(device_id);
CREATE INDEX idx_kill_switch_events_user_id ON kill_switch_events(user_id);
CREATE INDEX idx_security_audit_log_user_id ON security_audit_log(user_id);
CREATE INDEX idx_security_audit_log_created_at ON security_audit_log(created_at);

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================
ALTER TABLE user_security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE split_tunnel_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE kill_switch_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE encryption_protocols ENABLE ROW LEVEL SECURITY;

-- User Security Settings: Users can view/update their own
CREATE POLICY "Users can view own security settings"
    ON user_security_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own security settings"
    ON user_security_settings FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own security settings"
    ON user_security_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Split Tunnel Rules: Users manage their own rules
CREATE POLICY "Users can manage own split tunnel rules"
    ON split_tunnel_rules FOR ALL
    USING (auth.uid() = user_id);

-- Client Configurations: Users can view their own configs
CREATE POLICY "Users can view own configurations"
    ON client_configurations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service can manage configurations"
    ON client_configurations FOR ALL
    WITH CHECK (true);

-- Kill Switch Events: Users can view their own events
CREATE POLICY "Users can view own kill switch events"
    ON kill_switch_events FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service can insert kill switch events"
    ON kill_switch_events FOR INSERT
    WITH CHECK (true);

-- Security Audit Log: Users can view their own logs
CREATE POLICY "Users can view own audit logs"
    ON security_audit_log FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service can insert audit logs"
    ON security_audit_log FOR INSERT
    WITH CHECK (true);

-- Encryption Protocols: Public read
CREATE POLICY "Anyone can view encryption protocols"
    ON encryption_protocols FOR SELECT
    USING (is_active = true);

-- =============================================
-- TRIGGERS
-- =============================================
CREATE TRIGGER update_user_security_settings_updated_at BEFORE UPDATE ON user_security_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_split_tunnel_rules_updated_at BEFORE UPDATE ON split_tunnel_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_configurations_updated_at BEFORE UPDATE ON client_configurations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- SEED DATA: Default Encryption Protocols
-- =============================================
INSERT INTO encryption_protocols (name, protocol_type, cipher, key_size, is_default, security_level, description) VALUES
('WireGuard ChaCha20', 'wireguard', 'ChaCha20-Poly1305', 256, true, 'maximum', 'Default WireGuard encryption - fastest and most secure'),
('OpenVPN AES-256-GCM', 'openvpn', 'AES-256-GCM', 256, true, 'maximum', 'OpenVPN with AES-256-GCM - maximum security'),
('OpenVPN AES-128-GCM', 'openvpn', 'AES-128-GCM', 128, false, 'high', 'OpenVPN with AES-128-GCM - balanced security and speed'),
('IKEv2 AES-256', 'ikev2', 'AES-256-CBC', 256, false, 'high', 'IKEv2 with AES-256 - good for mobile devices')
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- FUNCTION: Auto-create security settings for new users
-- =============================================
CREATE OR REPLACE FUNCTION create_default_security_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_security_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create security settings
CREATE TRIGGER on_auth_user_created_security
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_default_security_settings();

-- =============================================
-- FUNCTION: Log security events
-- =============================================
CREATE OR REPLACE FUNCTION log_security_event(
    p_user_id UUID,
    p_event_type VARCHAR,
    p_description TEXT,
    p_ip_address INET DEFAULT NULL,
    p_severity VARCHAR DEFAULT 'info'
)
RETURNS UUID AS $$
DECLARE
    v_event_id UUID;
BEGIN
    INSERT INTO security_audit_log (user_id, event_type, event_description, ip_address, severity)
    VALUES (p_user_id, p_event_type, p_description, p_ip_address, p_severity)
    RETURNING id INTO v_event_id;
    
    RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
