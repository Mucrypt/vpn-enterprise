'use client';

import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { useQueryStorage } from '@/hooks/use-query-storage';
import { Database, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Loading component for Suspense fallback
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-96">
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-2" />
      <p className="text-sm text-gray-600">Loading database components...</p>
    </div>
  </div>
);

// Dynamic imports for heavy components
const DatabaseLayout = lazy(() => import('@/components/database/database-layout').then(module => ({ default: module.DatabaseLayout })));
const TablesPage = lazy(() => import('@/components/database/tables-page').then(module => ({ default: module.TablesPage })));
const SqlEditorPage = lazy(() => import('@/components/database/sql-editor-page').then(module => ({ default: module.SqlEditorPage })));
const QueryHistoryPage = lazy(() => import('@/components/database/query-history-page').then(module => ({ default: module.QueryHistoryPage })));
const SqlTemplatesPage = lazy(() => import('@/components/database/sql-templates-page').then(module => ({ default: module.SqlTemplatesPage })));
const SavedQueriesPage = lazy(() => import('@/components/database/saved-queries-page').then(module => ({ default: module.SavedQueriesPage })));
const CreateTableDialog = lazy(() => import('@/components/database/create-table-dialog').then(module => ({ default: module.CreateTableDialog })));
const CreateSchemaDialog = lazy(() => import('@/components/database/create-schema-dialog').then(module => ({ default: module.CreateSchemaDialog })));
const VisualQueryBuilder = lazy(() => import('@/components/database/visual-query-builder').then(module => ({ default: module.VisualQueryBuilder })));

type DatabaseSection = 
  | 'schema-visualizer'
  | 'tables' 
  | 'functions'
  | 'triggers'
  | 'enumerated-types'
  | 'extensions'
  | 'indexes'
  | 'publications'
  | 'roles'
  | 'policies'
  | 'settings'
  | 'replication'
  | 'backups'
  | 'migrations'
  | 'wrappers'
  | 'webhooks'
  | 'security-advisor'
  | 'performance-advisor'
  | 'query-performance'
  | 'sql-editor'
  | 'query-history'
  | 'sql-templates'
  | 'saved-queries';

export default function DatabasePage() {
  // Query storage hook
  const { addToHistory } = useQueryStorage();

  // Database connection state
  const [tenants, setTenants] = useState<any[]>([]);
  const [activeTenant, setActiveTenant] = useState<string>('');
  const [activeSection, setActiveSection] = useState<DatabaseSection>('tables');
  const [showSampleDataBanner, setShowSampleDataBanner] = useState(false);
  
  // SQL Editor state
  const [sql, setSql] = useState<string>(`-- Welcome to the SQL Editor!
-- Try these example queries:

-- View blog posts
SELECT * FROM blog.posts LIMIT 5;

-- View ecommerce products
-- SELECT * FROM ecommerce.products LIMIT 5;

-- Current database info
-- SELECT current_database(), current_user, version();`);
  const [queryResult, setQueryResult] = useState<any[] | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [activeQueryName, setActiveQueryName] = useState<string>('Welcome Query');
  
  // Dialog state
  const [showCreateTableDialog, setShowCreateTableDialog] = useState(false);
  const [showCreateSchemaDialog, setShowCreateSchemaDialog] = useState(false);
  const [selectedSchemaForTable, setSelectedSchemaForTable] = useState('');

  // Load tenants on mount
  useEffect(() => {
    const loadTenants = async () => {
      try {
        const response = await fetch('/api/v1/tenants');
        if (response.ok) {
          const data = await response.json();
          console.log('Tenants API response:', data);
          const tenantList = data.tenants || data.data || [];
          setTenants(tenantList);
          
          // Auto-select first tenant or use a development tenant ID
          if (tenantList.length > 0) {
            const firstTenant = tenantList[0];
            const tenantId = firstTenant.tenant_id || firstTenant.id;
            console.log('Selected tenant:', firstTenant, 'ID:', tenantId);
            setActiveTenant(tenantId);
          } else {
            // Fallback for development - use a proper UUID format that matches the mock data
            console.log('No tenants found, using development fallback');
            setActiveTenant('123e4567-e89b-12d3-a456-426614174000');
          }
        } else {
          // Fallback for development when API is not available
          console.warn('Could not load tenants, using development fallback');
          setActiveTenant('123e4567-e89b-12d3-a456-426614174000');
        }
      } catch (error) {
        console.error('Error loading tenants:', error);
      }
    };

    loadTenants();
  }, []);
  
  // Test connection and check for existing data when tenant changes
  useEffect(() => {
    if (activeTenant) {
      testConnection();
      checkForExistingData();
    }
  }, [activeTenant]);
  
  const testConnection = async () => {
    if (!activeTenant) return;
    
    try {
      console.log(`Testing connection for tenant: ${activeTenant}`);
      
      // First, try to verify the tenant exists
      const tenantCheckResponse = await fetch(`/api/v1/tenants`);
      if (tenantCheckResponse.ok) {
        const tenantsData = await tenantCheckResponse.json();
        const tenantExists = (tenantsData.tenants || tenantsData.data || []).some(
          (t: any) => (t.tenant_id || t.id) === activeTenant
        );
        
        if (!tenantExists) {
          console.warn(`Tenant ${activeTenant} not found in tenant list`);
          setQueryError(`Tenant not found. Please select a valid tenant.`);
          return;
        }
      }
      
      const response = await fetch(`/api/v1/tenants/${activeTenant}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sql: 'SELECT current_database(), current_user, version() as pg_version;' 
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Connection test successful:', data.data?.[0]);
        // Clear any previous errors
        setQueryError(null);
      } else {
        const errorText = await response.text();
        console.error(`Connection test failed (${response.status}):`, errorText);
        
        // Parse error for better user message
        let userMessage = 'Database connection failed';
        try {
          const errorObj = JSON.parse(errorText);
          if (errorObj.error?.includes('uuid')) {
            userMessage = 'Invalid tenant ID format. Please check tenant configuration.';
          } else if (errorObj.error?.includes('not found')) {
            userMessage = 'Tenant database not found. Please verify tenant exists.';
          } else {
            userMessage = errorObj.error || errorObj.message || userMessage;
          }
        } catch {
          userMessage = response.statusText;
        }
        
        setQueryError(userMessage);
      }
    } catch (error) {
      console.error('Connection test error:', error);
      setQueryError(`Network error: ${(error as Error).message}`);
    }
  };

  // Query execution with cancel capability
  const abortControllerRef = useRef<AbortController | null>(null);
  const [queryStatus, setQueryStatus] = useState<'idle' | 'running' | 'cancelled'>('idle');

  const cancelQuery = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setQueryStatus('cancelled');
      setIsLoading(false);
      setQueryError('Query cancelled by user');
    }
  };

  const runQuery = async (selectedSql?: string) => {
    const queryToRun = selectedSql || sql.trim();
    if (!queryToRun || !activeTenant || isLoading) return;
    
    // Cancel any existing query
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    setIsLoading(true);
    setQueryStatus('running');
    setQueryError(null);
    setQueryResult(null);
    
    const startTime = performance.now();
    
    try {
      const response = await fetch(`/api/v1/tenants/${activeTenant}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql: queryToRun,
          timeout: 30000 // 30 second timeout
        }),
        signal: abortControllerRef.current.signal
      });

      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      setExecutionTime(duration);

      if (!response.ok) {
        const json = await response.json();
        throw new Error(json.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();

      if (json.success !== false) {
        // Handle successful query
        const resultData = json.data || [];
        setQueryResult(resultData);
        setQueryStatus('idle');
        
        addToHistory(queryToRun, 'success', {
          rowCount: resultData.length,
          duration,
          command: json.command || 'QUERY'
        });

        // Show success message for non-SELECT queries
        if (!queryToRun.toLowerCase().trim().startsWith('select') && json.rowCount !== undefined) {
          console.log(`Query executed successfully. ${json.rowCount} rows affected.`);
        }
      } else {
        // Handle query execution error
        const errorMessage = json.error || json.details || 'Query execution failed';
        setQueryError(errorMessage);
        setQueryStatus('idle');
        addToHistory(queryToRun, 'error', {
          error: errorMessage,
          duration,
          hint: json.hint,
          position: json.position
        });
      }
    } catch (error: any) {
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      setExecutionTime(duration);
      
      if (error.name === 'AbortError') {
        setQueryError('Query was cancelled');
        setQueryStatus('cancelled');
      } else {
        const errorMessage = error.message || 'Network error occurred';
        setQueryError(errorMessage);
        setQueryStatus('idle');
        addToHistory(queryToRun, 'error', {
          error: errorMessage,
          duration
        });
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const createSchema = async (schemaName: string, description: string = '') => {
    console.log('createSchema called with:', schemaName, 'activeTenant:', activeTenant);
    if (!activeTenant || !schemaName.trim()) {
      console.log('Early return: missing activeTenant or schemaName');
      return;
    }
    
    try {
      console.log('Creating schema using SQL query...');
      let createSchemaSQL = `CREATE SCHEMA IF NOT EXISTS "${schemaName.trim()}";`;
      if (description.trim()) {
        createSchemaSQL += `\nCOMMENT ON SCHEMA "${schemaName.trim()}" IS '${description.replace(/'/g, "''")}'`;
      }
      
      const resp = await fetch(`/api/v1/tenants/${activeTenant}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: createSchemaSQL })
      });
      
      const json = await resp.json();
      console.log('API response:', json);
      
      if (resp.ok && json.data !== undefined) {
        setShowCreateSchemaDialog(false);
        console.log('Schema created successfully');
        // Refresh tables page if active
        if (activeSection === 'tables') {
          // Trigger refresh logic
        }
      } else {
        const errorMessage = json.error || 'Failed to create schema';
        console.error('Schema creation failed:', errorMessage);
        setQueryError(errorMessage);
      }
    } catch (e: any) {
      console.error('Network error:', e);
      setQueryError(e.message || 'Network error');
    }
  };

  const createSampleData = async () => {
    if (!activeTenant) return;
    
    try {
      const sampleDataSQL = `
        -- Create sample schemas
        CREATE SCHEMA IF NOT EXISTS blog;
        CREATE SCHEMA IF NOT EXISTS ecommerce;
        
        -- Blog schema tables
        CREATE TABLE IF NOT EXISTS blog.posts (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            content TEXT,
            author_id INTEGER,
            status VARCHAR(20) DEFAULT 'draft',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            published_at TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS blog.comments (
            id SERIAL PRIMARY KEY,
            post_id INTEGER REFERENCES blog.posts(id),
            author_name VARCHAR(100) NOT NULL,
            author_email VARCHAR(255),
            content TEXT NOT NULL,
            status VARCHAR(20) DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Ecommerce schema tables
        CREATE TABLE IF NOT EXISTS ecommerce.products (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            price DECIMAL(10,2) NOT NULL,
            sku VARCHAR(50) UNIQUE,
            stock_quantity INTEGER DEFAULT 0,
            status VARCHAR(20) DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Insert sample data
        INSERT INTO blog.posts (title, content, author_id, status, published_at) VALUES
        ('Getting Started with PostgreSQL', 'PostgreSQL is a powerful database...', 1, 'published', CURRENT_TIMESTAMP - INTERVAL '7 days'),
        ('Building Scalable APIs', 'API scalability best practices...', 1, 'published', CURRENT_TIMESTAMP - INTERVAL '3 days')
        ON CONFLICT DO NOTHING;
        
        INSERT INTO ecommerce.products (name, description, price, sku, stock_quantity, status) VALUES
        ('Laptop Pro 15"', 'High-performance laptop', 1299.99, 'LAP-PRO-15', 25, 'active'),
        ('Wireless Mouse', 'Ergonomic wireless mouse', 29.99, 'MOUSE-WL-01', 150, 'active')
        ON CONFLICT (sku) DO NOTHING;
        
        SELECT 'Sample data created successfully!' as message;
      `;
      
      const response = await fetch(`/api/v1/tenants/${activeTenant}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: sampleDataSQL })
      });
      
      const json = await response.json();
      
      if (response.ok && json.data !== undefined) {
        setShowSampleDataBanner(false);
        // Switch to tables view and refresh
        setActiveSection('tables');
        // Set SQL to show the created data
        setSql('-- Sample data created! Try these queries:\n\nSELECT * FROM blog.posts LIMIT 5;\n\n-- SELECT * FROM ecommerce.products LIMIT 5;');
      } else {
        const errorMessage = json.error || 'Failed to create sample data';
        setQueryError(errorMessage);
      }
    } catch (error: any) {
      setQueryError(error.message || 'Network error');
    }
  };
  
  const checkForExistingData = async () => {
    if (!activeTenant) return;
    
    try {
      const response = await fetch(`/api/v1/tenants/${activeTenant}/schemas`);
      if (response.ok) {
        const data = await response.json();
        const schemas = data.data || [];
        const hasCustomSchemas = schemas.some((schema: any) => 
          !['public', 'information_schema', 'pg_catalog', 'pg_toast'].includes(schema.schema_name || schema.name)
        );
        
        setShowSampleDataBanner(!hasCustomSchemas);
      }
    } catch (error) {
      console.warn('Could not check for existing data:', error);
    }
  };

  const createTable = async (tableName: string, description: string, columns: any[], enableRLS: boolean, enableRealtime: boolean) => {
    if (!activeTenant || !tableName.trim() || !selectedSchemaForTable) return;
    
    try {
      // Generate column definitions
      const columnDefs = columns.map(col => {
        let def = `"${col.name}" ${col.type.toUpperCase()}`;
        
        // Add length/precision
        if (col.maxLength && (col.type === 'varchar' || col.type === 'char')) {
          def += `(${col.maxLength})`;
        }
        if (col.precision && (col.type === 'numeric' || col.type === 'decimal')) {
          def += col.scale ? `(${col.precision},${col.scale})` : `(${col.precision})`;
        }
        
        // Add constraints
        if (col.isPrimaryKey) {
          def += ' PRIMARY KEY';
        }
        if (!col.isNullable) {
          def += ' NOT NULL';
        }
        if (col.isUnique && !col.isPrimaryKey) {
          def += ' UNIQUE';
        }
        if (col.defaultValue) {
          def += ` DEFAULT ${col.defaultValue}`;
        }
        
        return def;
      }).join(',\n  ');
      
      // Construct the CREATE TABLE statement
      let createTableSQL = `CREATE TABLE "${selectedSchemaForTable}"."${tableName}" (\n  ${columnDefs}\n);`;
      
      // Add table comment if description provided
      if (description.trim()) {
        createTableSQL += `\nCOMMENT ON TABLE "${selectedSchemaForTable}"."${tableName}" IS '${description.replace(/'/g, "''")}'`;
      }
      
      // Add column comments
      columns.forEach(col => {
        if (col.description?.trim()) {
          createTableSQL += `\nCOMMENT ON COLUMN "${selectedSchemaForTable}"."${tableName}"."${col.name}" IS '${col.description.replace(/'/g, "''")}'`;
        }
      });
      
      // Add RLS if enabled
      if (enableRLS) {
        createTableSQL += `\nALTER TABLE "${selectedSchemaForTable}"."${tableName}" ENABLE ROW LEVEL SECURITY;`;
      }
    
      const resp = await fetch(`/api/v1/tenants/${activeTenant}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: createTableSQL })
      });
      
      const json = await resp.json();
      
      if (resp.ok && json.data !== undefined) {
        setShowCreateTableDialog(false);
        setSelectedSchemaForTable('');
        // Update the SQL editor with a SELECT query for the new table
        setSql(`SELECT * FROM "${selectedSchemaForTable}"."${tableName}" LIMIT 10;`);
        // Switch to SQL editor to show the new query
        setActiveSection('sql-editor');
      } else {
        const errorMessage = json.error || 'Failed to create table';
        setQueryError(errorMessage);
      }
    } catch (e: any) {
      setQueryError(e.message || 'Network error');
    }
  };

  const renderContent = () => {
    // Helper function to load query into SQL editor
    const loadQueryIntoEditor = (sql: string, name: string) => {
      setSql(sql);
      setActiveQueryName(name);
      setActiveSection('sql-editor');
    };

    switch (activeSection) {
      case 'tables':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <TablesPage
              activeTenant={activeTenant}
              onCreateTable={() => {
                setSelectedSchemaForTable('public');
                setShowCreateTableDialog(true);
            }}
            />
          </Suspense>
        );
        
      case 'sql-editor':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <SqlEditorPage
            activeTenant={activeTenant}
            sql={sql}
            setSql={setSql}
            runQuery={runQuery}
            cancelQuery={cancelQuery}
            queryResult={queryResult}
            queryError={queryError}
            isLoading={isLoading}
            queryStatus={queryStatus}
            executionTime={executionTime}
            activeQueryName={activeQueryName}
            setActiveQueryName={setActiveQueryName}
          />
          </Suspense>
        );

      case 'query-history':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <QueryHistoryPage
              activeTenant={activeTenant}
              onLoadQuery={loadQueryIntoEditor}
            />
          </Suspense>
        );

      case 'sql-templates':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <SqlTemplatesPage
              onLoadTemplate={loadQueryIntoEditor}
            />
          </Suspense>
        );

      case 'saved-queries':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <SavedQueriesPage
              activeTenant={activeTenant}
              onLoadQuery={loadQueryIntoEditor}
            />
          </Suspense>
        );

      case 'visual-query-builder':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <VisualQueryBuilder
              activeTenant={activeTenant}
              onQueryGenerated={(sql: string) => {
                setSql(sql);
                setActiveSection('sql-editor');
              }}
            />
          </Suspense>
        );
        
      case 'schema-visualizer':
        return (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Schema Visualizer</h3>
              <p className="text-sm">Visual database schema explorer - Coming soon</p>
            </div>
          </div>
        );
        
      default:
        return (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2 capitalize">{activeSection.replace('-', ' ')}</h3>
              <p className="text-sm">This feature is coming soon</p>
            </div>
          </div>
        );
    }
  };

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <DatabaseLayout
        activeTenant={activeTenant}
        tenants={tenants}
        onTenantChange={setActiveTenant}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onLoadQuery={(sql: string, name: string) => {
          setSql(sql);
          setActiveQueryName(name);
          setActiveSection('sql-editor');
        }}
      >
      {/* Sample Data Banner */}
      {showSampleDataBanner && (
        <div className="bg-gradient-to-r from-emerald-600/10 to-blue-600/10 border border-emerald-500/20 p-4 m-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Database className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-white font-medium">Welcome to your Database!</h3>
                <p className="text-gray-400 text-sm">
                  Get started by creating some sample data with blog posts and ecommerce products
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowSampleDataBanner(false)}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                Skip
              </Button>
              <Button
                onClick={createSampleData}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                size="sm"
              >
                Create Sample Data
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {renderContent()}
      
      {/* Create Schema Dialog */}
      <CreateSchemaDialog
        isOpen={showCreateSchemaDialog}
        onClose={() => setShowCreateSchemaDialog(false)}
        onCreateSchema={createSchema}
      />

      {/* Create Table Dialog */}
      <CreateTableDialog
        isOpen={showCreateTableDialog}
        onClose={() => {
          setShowCreateTableDialog(false);
          setSelectedSchemaForTable('');
        }}
        onCreateTable={createTable}
        schemaName={selectedSchemaForTable}
      />
    </DatabaseLayout>
    </Suspense>
  );
}