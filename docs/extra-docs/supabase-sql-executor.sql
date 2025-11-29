-- Enhanced SQL functions for Supabase-style database operations
-- This needs to be created in your Supabase database for the SQL editor to work

-- Function for SELECT queries (data retrieval)
CREATE OR REPLACE FUNCTION execute_sql(sql_query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    -- Basic security: only allow SELECT statements
    IF lower(trim(sql_query)) NOT LIKE 'select%' THEN
        RAISE EXCEPTION 'Only SELECT statements are allowed in this function';
    END IF;
    
    -- Execute the query and return results as JSON
    EXECUTE format('SELECT json_agg(row_to_json(t)) FROM (%s) t', sql_query) INTO result;
    
    RETURN COALESCE(result, '[]'::json);
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Query execution failed: %', SQLERRM;
END;
$$;

-- Function for DDL/DML operations (CREATE, INSERT, UPDATE, DELETE, ALTER, DROP)
CREATE OR REPLACE FUNCTION execute_ddl(sql_query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
    affected_rows integer;
BEGIN
    -- Enhanced security checks
    IF lower(sql_query) ~ '(drop\s+database|drop\s+schema|truncate|delete\s+from\s+pg_|alter\s+system)' THEN
        RAISE EXCEPTION 'Dangerous operations are not allowed';
    END IF;
    
    -- Execute DDL/DML statement
    EXECUTE sql_query;
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    -- Return execution status
    result := json_build_object(
        'success', true,
        'affectedRows', affected_rows,
        'message', 'Statement executed successfully'
    );
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Statement execution failed: %', SQLERRM;
END;
$$;

-- Function to create tenant-specific schemas/databases
CREATE OR REPLACE FUNCTION create_tenant_schema(schema_name text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Validate schema name
    IF schema_name !~ '^[a-zA-Z_][a-zA-Z0-9_]*$' THEN
        RAISE EXCEPTION 'Invalid schema name. Use only letters, numbers, and underscores.';
    END IF;
    
    -- Create schema
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', schema_name);
    
    -- Set up basic permissions
    EXECUTE format('GRANT USAGE ON SCHEMA %I TO authenticated', schema_name);
    EXECUTE format('GRANT CREATE ON SCHEMA %I TO authenticated', schema_name);
    
    RETURN json_build_object(
        'success', true,
        'schema', schema_name,
        'message', 'Schema created successfully'
    );
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Schema creation failed: %', SQLERRM;
END;
$$;

-- Function to list all schemas accessible to current user
CREATE OR REPLACE FUNCTION list_schemas()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    SELECT json_agg(json_build_object(
        'schema_name', schema_name,
        'owner', schema_owner
    ))
    INTO result
    FROM information_schema.schemata
    WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
    AND schema_name NOT LIKE 'pg_%';
    
    RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Function to list tables in a schema
CREATE OR REPLACE FUNCTION list_tables(schema_name text DEFAULT 'public')
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    SELECT json_agg(json_build_object(
        'table_name', table_name,
        'table_type', table_type
    ))
    INTO result
    FROM information_schema.tables
    WHERE table_schema = schema_name;
    
    RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION execute_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION execute_ddl(text) TO authenticated;
GRANT EXECUTE ON FUNCTION create_tenant_schema(text) TO authenticated;
GRANT EXECUTE ON FUNCTION list_schemas() TO authenticated;
GRANT EXECUTE ON FUNCTION list_tables(text) TO authenticated;