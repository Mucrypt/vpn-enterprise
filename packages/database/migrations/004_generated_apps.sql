-- Migration: Add Generated Apps Storage
-- Store AI-generated applications and their files

-- =============================================
-- GENERATED_APPS TABLE
-- Stores metadata for AI-generated applications
-- =============================================
CREATE TABLE IF NOT EXISTS generated_apps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
    CONSTRAINT generated_apps_user_name_unique UNIQUE(user_id, app_name)
);

-- =============================================
-- GENERATED_APP_FILES TABLE
-- Stores individual files for each generated app
-- =============================================
CREATE TABLE IF NOT EXISTS generated_app_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    app_id UUID NOT NULL REFERENCES generated_apps(id) ON DELETE CASCADE,
    file_path VARCHAR(500) NOT NULL, -- e.g., src/App.tsx, package.json
    content TEXT NOT NULL, -- File content
    language VARCHAR(50), -- typescript, javascript, json, html, css
    file_size INTEGER, -- Size in bytes
    is_entry_point BOOLEAN DEFAULT false, -- Mark main files
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT app_files_unique_path UNIQUE(app_id, file_path)
);

-- =============================================
-- APP_VERSIONS TABLE
-- Track versions/history of generated apps
-- =============================================
CREATE TABLE IF NOT EXISTS generated_app_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    app_id UUID NOT NULL REFERENCES generated_apps(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    description TEXT,
    changes_summary TEXT,
    snapshot_data JSONB, -- Full snapshot of app + files
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT app_versions_unique UNIQUE(app_id, version_number)
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_generated_apps_user_id ON generated_apps(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_apps_tenant_id ON generated_apps(tenant_id);
CREATE INDEX IF NOT EXISTS idx_generated_apps_status ON generated_apps(status);
CREATE INDEX IF NOT EXISTS idx_generated_app_files_app_id ON generated_app_files(app_id);
CREATE INDEX IF NOT EXISTS idx_app_versions_app_id ON generated_app_versions(app_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE generated_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_app_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_app_versions ENABLE ROW LEVEL SECURITY;

-- Users can view their own generated apps
CREATE POLICY "Users can view own apps"
    ON generated_apps FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own generated apps
CREATE POLICY "Users can insert own apps"
    ON generated_apps FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own generated apps
CREATE POLICY "Users can update own apps"
    ON generated_apps FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own generated apps
CREATE POLICY "Users can delete own apps"
    ON generated_apps FOR DELETE
    USING (auth.uid() = user_id);

-- Users can view files for their apps
CREATE POLICY "Users can view own app files"
    ON generated_app_files FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM generated_apps
        WHERE generated_apps.id = generated_app_files.app_id
        AND generated_apps.user_id = auth.uid()
    ));

-- Users can insert files for their apps
CREATE POLICY "Users can insert own app files"
    ON generated_app_files FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM generated_apps
        WHERE generated_apps.id = generated_app_files.app_id
        AND generated_apps.user_id = auth.uid()
    ));

-- Users can update files for their apps
CREATE POLICY "Users can update own app files"
    ON generated_app_files FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM generated_apps
        WHERE generated_apps.id = generated_app_files.app_id
        AND generated_apps.user_id = auth.uid()
    ));

-- Users can delete files for their apps
CREATE POLICY "Users can delete own app files"
    ON generated_app_files FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM generated_apps
        WHERE generated_apps.id = generated_app_files.app_id
        AND generated_apps.user_id = auth.uid()
    ));

-- Users can view versions for their apps
CREATE POLICY "Users can view own app versions"
    ON generated_app_versions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM generated_apps
        WHERE generated_apps.id = generated_app_versions.app_id
        AND generated_apps.user_id = auth.uid()
    ));

-- Users can insert versions for their apps
CREATE POLICY "Users can insert own app versions"
    ON generated_app_versions FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM generated_apps
        WHERE generated_apps.id = generated_app_versions.app_id
        AND generated_apps.user_id = auth.uid()
    ));

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_generated_apps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trigger_update_generated_apps_updated_at
    BEFORE UPDATE ON generated_apps
    FOR EACH ROW
    EXECUTE FUNCTION update_generated_apps_updated_at();

CREATE TRIGGER trigger_update_generated_app_files_updated_at
    BEFORE UPDATE ON generated_app_files
    FOR EACH ROW
    EXECUTE FUNCTION update_generated_apps_updated_at();

-- Function to calculate total files and size for an app
CREATE OR REPLACE FUNCTION get_app_stats(app_uuid UUID)
RETURNS TABLE (
    total_files BIGINT,
    total_size_bytes BIGINT,
    languages JSON
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_files,
        COALESCE(SUM(file_size), 0)::BIGINT as total_size_bytes,
        json_agg(DISTINCT language) as languages
    FROM generated_app_files
    WHERE app_id = app_uuid;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL ON generated_apps TO authenticated;
GRANT ALL ON generated_app_files TO authenticated;
GRANT ALL ON generated_app_versions TO authenticated;
