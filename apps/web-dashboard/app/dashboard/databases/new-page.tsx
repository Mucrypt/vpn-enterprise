'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DatabaseLayout } from '@/components/database/database-layout';
import { TablesPage } from '@/components/database/tables-page';
import { SqlEditorPage } from '@/components/test-components/sql-editor-page';
import { CreateTableDialog } from '@/components/database/create-table-dialog';
import { CreateSchemaDialog } from '@/components/database/create-schema-dialog';
import { VisualQueryBuilder } from '@/components/database/visual-query-builder';
import { SavedQueries } from '@/components/database/saved-queries';
import { useQueryStorage } from '@/hooks/use-query-storage';

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
  | 'saved-queries'
  | 'visual-query-builder';

export default function DatabasePage() {
  // Query storage hook
  const { addToHistory } = useQueryStorage();

  // Database connection state
  const [tenants, setTenants] = useState<any[]>([]);
  const [activeTenant, setActiveTenant] = useState<string>('');
  const [activeSection, setActiveSection] = useState<DatabaseSection>('tables');
  
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
  const [activeQueryName, setActiveQueryName] = useState<string>('');
  
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
          const tenantList = data.data || [];
          setTenants(tenantList);
          
          // Auto-select first tenant or default
          if (tenantList.length > 0) {
            setActiveTenant('123e4567-e89b-12d3-a456-426614174000');
          }
        }
      } catch (error) {
        console.error('Error loading tenants:', error);
      }
    };

    loadTenants();
  }, []);

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
        
      case 'schema-visualizer':
        return (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Schema Visualizer</h3>
              <p className="text-sm">Visual database schema explorer - Coming soon</p>
            </div>
          </div>
        );
        
      case 'query-history':
        return (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Query History</h3>
              <p className="text-sm">View your recent SQL queries and results</p>
            </div>
          </div>
        );
        
      case 'sql-templates':
        return (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">SQL Templates</h3>
              <p className="text-sm">Pre-built SQL templates for common operations</p>
            </div>
          </div>
        );
        
      case 'saved-queries':
        return (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Saved Queries</h3>
              <p className="text-sm">Manage your saved SQL queries</p>
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

  const handleSectionChange = (section: DatabaseSection) => {
    setActiveSection(section);
  };

  return (
    <DatabaseLayout
      activeTenant={activeTenant}
      tenants={tenants}
      onTenantChange={setActiveTenant}
      activeSection={activeSection}
      onSectionChange={handleSectionChange}
    >
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