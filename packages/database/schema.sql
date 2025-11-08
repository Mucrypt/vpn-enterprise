-- VPN Enterprise Database Schema for Supabase
-- Execute this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE subscription_plan AS ENUM ('free', 'basic', 'premium', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'cancelled', 'trial');
CREATE TYPE connection_status AS ENUM ('connected', 'disconnected', 'failed');

-- =============================================
-- SERVERS TABLE
-- Stores VPN server information
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- USER_SUBSCRIPTIONS TABLE
-- Manages user subscription plans
-- =============================================
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
-- USER_DEVICES TABLE
-- Tracks user devices/clients
-- =============================================
CREATE TABLE IF NOT EXISTS user_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
-- CONNECTION_LOGS TABLE
-- Tracks user VPN connections
-- =============================================
CREATE TABLE IF NOT EXISTS connection_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id UUID REFERENCES user_devices(id) ON DELETE SET NULL,
    server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
    status connection_status DEFAULT 'connected',
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    disconnected_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER GENERATED ALWAYS AS (
        CASE 
            WHEN disconnected_at IS NOT NULL THEN 
                EXTRACT(EPOCH FROM (disconnected_at - connected_at)) / 60
            ELSE NULL
        END
    ) STORED,
    data_uploaded_mb DECIMAL(12,2) DEFAULT 0.00,
    data_downloaded_mb DECIMAL(12,2) DEFAULT 0.00,
    ip_address INET,
    disconnect_reason VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- SERVER_STATISTICS TABLE
-- Aggregated server performance metrics
-- =============================================
CREATE TABLE IF NOT EXISTS server_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    server_id UUID NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cpu_usage DECIMAL(5,2),
    memory_usage DECIMAL(5,2),
    bandwidth_in_mbps DECIMAL(10,2),
    bandwidth_out_mbps DECIMAL(10,2),
    active_connections INTEGER DEFAULT 0,
    total_data_transferred_gb DECIMAL(12,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX idx_servers_country ON servers(country);
CREATE INDEX idx_servers_active ON servers(is_active);
CREATE INDEX idx_servers_load ON servers(load);

CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_expires_at ON user_subscriptions(expires_at);

CREATE INDEX idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX idx_user_devices_public_key ON user_devices(public_key);

CREATE INDEX idx_connection_logs_user_id ON connection_logs(user_id);
CREATE INDEX idx_connection_logs_server_id ON connection_logs(server_id);
CREATE INDEX idx_connection_logs_connected_at ON connection_logs(connected_at);

CREATE INDEX idx_server_statistics_server_id ON server_statistics(server_id);
CREATE INDEX idx_server_statistics_timestamp ON server_statistics(timestamp);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_statistics ENABLE ROW LEVEL SECURITY;

-- Servers: Public read access for active servers
CREATE POLICY "Public servers are viewable by everyone"
    ON servers FOR SELECT
    USING (is_active = true);

CREATE POLICY "Only admins can modify servers"
    ON servers FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin');

-- User Subscriptions: Users can view their own
CREATE POLICY "Users can view own subscription"
    ON user_subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Only admins can modify subscriptions"
    ON user_subscriptions FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin');

-- User Devices: Users can manage their own devices
CREATE POLICY "Users can view own devices"
    ON user_devices FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own devices"
    ON user_devices FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own devices"
    ON user_devices FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own devices"
    ON user_devices FOR DELETE
    USING (auth.uid() = user_id);

-- Connection Logs: Users can view their own logs
CREATE POLICY "Users can view own connection logs"
    ON connection_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service can insert connection logs"
    ON connection_logs FOR INSERT
    WITH CHECK (true);

-- Server Statistics: Public read access
CREATE POLICY "Anyone can view server statistics"
    ON server_statistics FOR SELECT
    USING (true);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to relevant tables
CREATE TRIGGER update_servers_updated_at BEFORE UPDATE ON servers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_devices_updated_at BEFORE UPDATE ON user_devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update server load and current clients
CREATE OR REPLACE FUNCTION update_server_load()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE servers
    SET 
        current_clients = (
            SELECT COUNT(*) 
            FROM connection_logs 
            WHERE server_id = NEW.server_id 
            AND status = 'connected'
            AND disconnected_at IS NULL
        ),
        load = (
            SELECT COUNT(*) * 100.0 / NULLIF(max_clients, 0)
            FROM connection_logs 
            WHERE server_id = NEW.server_id 
            AND status = 'connected'
            AND disconnected_at IS NULL
        )
    WHERE id = NEW.server_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update server load on connection changes
CREATE TRIGGER update_server_load_on_connection
    AFTER INSERT OR UPDATE ON connection_logs
    FOR EACH ROW EXECUTE FUNCTION update_server_load();

-- =============================================
-- SEED DATA (Optional - for testing)
-- =============================================

-- Insert sample servers
INSERT INTO servers (name, country, country_code, city, host, public_key, port) VALUES
('US-East-1', 'United States', 'US', 'New York', '45.79.123.45', '4nEWZs+9Mvt9x1PmvFiCDpMMBK/JLkOamgUA66JoTTw=', 51820),
('UK-London-1', 'United Kingdom', 'GB', 'London', '45.79.123.46', 'UK9Mvt9x1PmvFiCDpMMBK/JLkOamgUA66JoTTw=', 51820),
('DE-Frankfurt-1', 'Germany', 'DE', 'Frankfurt', '45.79.123.47', 'DE9Mvt9x1PmvFiCDpMMBK/JLkOamgUA66JoTTw=', 51820),
('SG-Singapore-1', 'Singapore', 'SG', 'Singapore', '45.79.123.48', 'SG9Mvt9x1PmvFiCDpMMBK/JLkOamgUA66JoTTw=', 51820),
('JP-Tokyo-1', 'Japan', 'JP', 'Tokyo', '45.79.123.49', 'JP9Mvt9x1PmvFiCDpMMBK/JLkOamgUA66JoTTw=', 51820)
ON CONFLICT (host) DO NOTHING;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
