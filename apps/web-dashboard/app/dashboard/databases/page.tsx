'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DatabaseLayout } from '@/components/database/database-layout';
import { TablesPage } from '@/components/database/tables-page';
import { SqlEditorPage } from '@/components/database/sql-editor-page';
import { QueryHistoryPage } from '@/components/database/query-history-page';
import { SqlTemplatesPage } from '@/components/database/sql-templates-page';
import { SavedQueriesPage } from '@/components/database/saved-queries-page';
import { CreateTableDialog } from '@/components/database/create-table-dialog';
import { CreateSchemaDialog } from '@/components/database/create-schema-dialog';
import { VisualQueryBuilder } from '@/components/database/visual-query-builder';
import { useQueryStorage } from '@/hooks/use-query-storage';
import { Database } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

  const runQuery = async () => {
    if (!sql.trim() || !activeTenant || isLoading) return;
    
    setIsLoading(true);
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
          sql: sql.trim()
        }),
      });

      const endTime = performance.now();
      setExecutionTime(Math.round(endTime - startTime));

      const json = await response.json();

      if (response.ok && json.data !== undefined) {
        setQueryResult(json.data);
        addToHistory(sql.trim(), 'success', {
          rowCount: json.data.length,
          duration: Math.round(endTime - startTime)
        });
      } else {
        const errorMessage = json.error || json.details || 'Query failed';
        setQueryError(errorMessage);
        addToHistory(sql.trim(), 'error', {
          error: errorMessage,
          duration: Math.round(endTime - startTime)
        });
      }
    } catch (error: any) {
      const endTime = performance.now();
      setExecutionTime(Math.round(endTime - startTime));
      const errorMessage = error.message || 'Network error occurred';
      setQueryError(errorMessage);
      addToHistory(sql.trim(), 'error', {
        error: errorMessage,
        duration: Math.round(endTime - startTime)
      });
    } finally {
      setIsLoading(false);
    }
  };

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
          <TablesPage
            activeTenant={activeTenant}
            onCreateTable={() => {
              setSelectedSchemaForTable('public');
              setShowCreateTableDialog(true);
            }}
          />
        );
        
      case 'sql-editor':
        return (
          <SqlEditorPage
            activeTenant={activeTenant}
            sql={sql}
            setSql={setSql}
            runQuery={runQuery}
            queryResult={queryResult}
            queryError={queryError}
            isLoading={isLoading}
            executionTime={executionTime}
            activeQueryName={activeQueryName}
            setActiveQueryName={setActiveQueryName}
          />
        );

      case 'query-history':
        return (
          <QueryHistoryPage
            activeTenant={activeTenant}
            onLoadQuery={loadQueryIntoEditor}
          />
        );

      case 'sql-templates':
        return (
          <SqlTemplatesPage
            onLoadTemplate={loadQueryIntoEditor}
          />
        );

      case 'saved-queries':
        return (
          <SavedQueriesPage
            activeTenant={activeTenant}
            onLoadQuery={loadQueryIntoEditor}
          />
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
  );
}