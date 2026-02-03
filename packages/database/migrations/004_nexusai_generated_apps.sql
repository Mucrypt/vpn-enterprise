-- Migration: Add NexusAI Generated Apps Storage
-- Store AI-generated applications and their files

-- =============================================
-- NEXUSAI_GENERATED_APPS TABLE
-- Stores metadata for AI-generated applications
-- =============================================
CREATE TABLE IF NOT EXISTS nexusai_generated_apps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    app_name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    framework VARCHAR(50) NOT NULL, -- react, nextjs, vue, express, fastapi
    styling VARCHAR(50), -- tailwind, css, styled-components
    features JSONB DEFAULT '[]'::jsonb, -- Array of feature strings
    dependencies JSONB DEFAULT '{}'::jsonb, -- npm/pip dependencies object
    requires_database BOOLEAN DEFAULT false,
    project_metadata JSONB DEFAULT '{}'::jsonb, -- Additional metadata
    status VARCHAR(50) DEFAULT 'generated', -- generated, deployed, archived
    deployment_url TEXT, -- URL if deployed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT nexusai_apps_user_name_unique UNIQUE(user_id, app_name)
);

-- =============================================
-- NEXUSAI_APP_FILES TABLE
-- Stores individual files for each generated app
-- =============================================
CREATE TABLE IF NOT EXISTS nexusai_app_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id UUID NOT NULL REFERENCES nexusai_generated_apps(id) ON DELETE CASCADE,
    file_path VARCHAR(500) NOT NULL, -- e.g., src/App.tsx, package.json
    content TEXT NOT NULL, -- File content
    language VARCHAR(50), -- typescript, javascript, json, html, css
    file_size INTEGER, -- Size in bytes
    is_entry_point BOOLEAN DEFAULT false, -- Mark main files
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT nexusai_app_files_unique_path UNIQUE(app_id, file_path)
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_nexusai_apps_user_id ON nexusai_generated_apps(user_id);
CREATE INDEX IF NOT EXISTS idx_nexusai_apps_tenant_id ON nexusai_generated_apps(tenant_id);
CREATE INDEX IF NOT EXISTS idx_nexusai_apps_status ON nexusai_generated_apps(status);
CREATE INDEX IF NOT EXISTS idx_nexusai_apps_created_at ON nexusai_generated_apps(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nexusai_files_app_id ON nexusai_app_files(app_id);

-- =============================================
-- TRIGGERS
-- =============================================
-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_nexusai_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER nexusai_apps_updated_at
    BEFORE UPDATE ON nexusai_generated_apps
    FOR EACH ROW
    EXECUTE FUNCTION update_nexusai_updated_at();

CREATE TRIGGER nexusai_files_updated_at
    BEFORE UPDATE ON nexusai_app_files
    FOR EACH ROW
    EXECUTE FUNCTION update_nexusai_updated_at();

-- =============================================
-- HELPER FUNCTION
-- =============================================
-- Function to calculate total files and size for an app
CREATE OR REPLACE FUNCTION get_nexusai_app_stats(app_uuid UUID)
RETURNS TABLE (
    total_files BIGINT,
    total_size_bytes BIGINT,
    languages TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_files,
        COALESCE(SUM(file_size), 0)::BIGINT as total_size_bytes,
        array_agg(DISTINCT language) as languages
    FROM nexusai_app_files
    WHERE app_id = app_uuid;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- COMMENTS
-- =============================================
COMMENT ON TABLE nexusai_generated_apps IS 'Stores AI-generated applications created by NexusAI';
COMMENT ON TABLE nexusai_app_files IS 'Stores individual files for each generated application';
COMMENT ON COLUMN nexusai_generated_apps.framework IS 'Framework used: react, nextjs, vue, express, fastapi';
COMMENT ON COLUMN nexusai_generated_apps.status IS 'App status: generated, deployed, archived';
COMMENT ON COLUMN nexusai_app_files.is_entry_point IS 'Marks the main entry file of the application';
