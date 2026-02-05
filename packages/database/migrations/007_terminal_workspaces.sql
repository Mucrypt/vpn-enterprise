-- Migration: Add Terminal Workspaces for NexusAI
-- Links Docker-based terminal workspaces to AI-generated apps

-- =============================================
-- TERMINAL_WORKSPACES TABLE
-- Tracks active terminal workspaces and their lifecycle
-- =============================================
CREATE TABLE IF NOT EXISTS terminal_workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    app_id UUID REFERENCES nexusai_generated_apps(id) ON DELETE CASCADE, -- Optional: links to nexusAI app
    container_id VARCHAR(255), -- Docker container ID
    name VARCHAR(255), -- Custom workspace name
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, stopped, error
    last_command TEXT, -- Last executed command
    command_count INTEGER DEFAULT 0, -- Total commands executed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT terminal_workspaces_status_check CHECK (status IN ('active', 'stopped', 'error'))
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_terminal_workspaces_user_id ON terminal_workspaces(user_id);
CREATE INDEX IF NOT EXISTS idx_terminal_workspaces_app_id ON terminal_workspaces(app_id);
CREATE INDEX IF NOT EXISTS idx_terminal_workspaces_status ON terminal_workspaces(status);
CREATE INDEX IF NOT EXISTS idx_terminal_workspaces_created_at ON terminal_workspaces(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_terminal_workspaces_last_used ON terminal_workspaces(last_used_at);
CREATE INDEX IF NOT EXISTS idx_terminal_workspaces_container_id ON terminal_workspaces(container_id);

-- =============================================
-- TRIGGERS
-- =============================================
-- Update updated_at timestamp automatically
CREATE TRIGGER terminal_workspaces_updated_at
    BEFORE UPDATE ON terminal_workspaces
    FOR EACH ROW
    EXECUTE FUNCTION update_nexusai_updated_at(); -- Reuse existing function

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to get workspace statistics
CREATE OR REPLACE FUNCTION get_terminal_workspace_stats(workspace_uuid UUID)
RETURNS TABLE (
    workspace_id UUID,
    workspace_name VARCHAR(255),
    has_app BOOLEAN,
    app_name VARCHAR(255),
    command_count INTEGER,
    age_hours NUMERIC,
    inactive_minutes NUMERIC,
    status VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tw.id as workspace_id,
        tw.name as workspace_name,
        (tw.app_id IS NOT NULL) as has_app,
        nga.app_name,
        tw.command_count,
        EXTRACT(EPOCH FROM (NOW() - tw.created_at)) / 3600 as age_hours,
        EXTRACT(EPOCH FROM (NOW() - tw.last_used_at)) / 60 as inactive_minutes,
        tw.status
    FROM terminal_workspaces tw
    LEFT JOIN nexusai_generated_apps nga ON tw.app_id = nga.id
    WHERE tw.id = workspace_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old inactive workspaces
CREATE OR REPLACE FUNCTION cleanup_old_terminal_workspaces(max_age_hours INTEGER DEFAULT 24)
RETURNS TABLE (
    cleaned_count INTEGER,
    workspace_ids UUID[]
) AS $$
DECLARE
    cleaned UUID[];
    count INTEGER;
BEGIN
    -- Find old inactive workspaces
    SELECT array_agg(id) INTO cleaned
    FROM terminal_workspaces
    WHERE status = 'active'
    AND (
        -- Inactive for more than 2 hours
        (NOW() - last_used_at) > INTERVAL '2 hours'
        OR
        -- Or created more than max_age_hours ago
        (NOW() - created_at) > (max_age_hours || ' hours')::INTERVAL
    );

    -- Update their status to stopped
    UPDATE terminal_workspaces
    SET status = 'stopped', updated_at = NOW()
    WHERE id = ANY(cleaned);

    GET DIAGNOSTICS count = ROW_COUNT;

    RETURN QUERY SELECT count, COALESCE(cleaned, ARRAY[]::UUID[]);
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- COMMENTS
-- =============================================
COMMENT ON TABLE terminal_workspaces IS 'Tracks Docker-based terminal workspaces for NexusAI apps';
COMMENT ON COLUMN terminal_workspaces.app_id IS 'Optional link to nexusai_generated_apps - pre-loads app files';
COMMENT ON COLUMN terminal_workspaces.container_id IS 'Docker container ID for exec and cleanup';
COMMENT ON COLUMN terminal_workspaces.status IS 'Workspace status: active, stopped, error';
COMMENT ON COLUMN terminal_workspaces.last_used_at IS 'Last command execution time - used for auto-cleanup';

-- =============================================
-- SAMPLE QUERIES
-- =============================================

-- Get user's active workspaces with app info
-- SELECT tw.*, nga.app_name, nga.framework
-- FROM terminal_workspaces tw
-- LEFT JOIN nexusai_generated_apps nga ON tw.app_id = nga.id
-- WHERE tw.user_id = '<user-uuid>'
-- AND tw.status = 'active'
-- ORDER BY tw.last_used_at DESC;

-- Cleanup inactive workspaces
-- SELECT * FROM cleanup_old_terminal_workspaces(24);

-- Get workspace statistics
-- SELECT * FROM get_terminal_workspace_stats('<workspace-uuid>');
