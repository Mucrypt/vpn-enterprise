'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database, 
  Table, 
  Play, 
  Save, 
  ChevronDown, 
  ChevronRight, 
  Folder, 
  Star,
  Clock,
  Settings,
  Eye,
  Hash,
  Key,
  Zap,
  Plus,
  X,
  AlertCircle,
  PanelLeftClose,
  PanelLeft,
  BarChart3,
  Download,
  Copy,
  Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SchemaTable {
  name: string;
  columns: Array<{ name: string; type: string; nullable: boolean; primary_key?: boolean; }>;
}

interface SavedQuery {
  id: string;
  name: string;
  sql: string;
  created_at: string;
}

// SQL Syntax Highlighting Function
function highlightSQLText(code: string): React.ReactElement[] {
  if (!code) return [];
  
  const lines = code.split('\n');
  return lines.map((line, lineIndex) => (
    <div key={lineIndex}>
      {highlightSQLLine(line)}
    </div>
  ));
}

function highlightSQLLine(line: string): React.ReactElement[] {
  const tokens = [];
  let currentIndex = 0;
  
  // SQL Keywords regex
  const keywordRegex = /\b(SELECT|FROM|WHERE|JOIN|INNER|LEFT|RIGHT|OUTER|FULL|CROSS|ON|GROUP\s+BY|ORDER\s+BY|HAVING|LIMIT|OFFSET|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TABLE|INDEX|DATABASE|SCHEMA|VIEW|TRIGGER|FUNCTION|PROCEDURE|AS|AND|OR|NOT|IN|EXISTS|NULL|IS|LIKE|ILIKE|BETWEEN|CASE|WHEN|THEN|ELSE|END|UNION|ALL|DISTINCT|COUNT|SUM|AVG|MIN|MAX|CAST|CONVERT|SUBSTRING|LOWER|UPPER|TRIM|COALESCE|NULLIF|WITH|RECURSIVE|DEFAULT|PRIMARY|KEY|FOREIGN|REFERENCES|UNIQUE|CHECK|CONSTRAINT|IF|NOT\s+EXISTS|NOT\s+NULL|AUTO_INCREMENT|SERIAL|BOOLEAN|INTEGER|INT|VARCHAR|TEXT|TIMESTAMP|DATE|TIME|TIMESTAMPTZ|UUID|JSON|JSONB)\b/gi;
  
  // String regex
  const stringRegex = /'([^'\\]|\\.|'')*'|"([^"\\]|\\.)*"/g;
  
  // Number regex  
  const numberRegex = /\b\d+(\.\d+)?\b/g;
  
  // Comment regex
  const commentRegex = /--.*$|\/\*[\s\S]*?\*\//g;
  
  // Function regex
  const functionRegex = /\b([A-Z_][A-Z0-9_]*)\s*(?=\()/gi;
  
  // Find all matches
  const allMatches = [];
  
  // Comments (highest priority)
  let match;
  while ((match = commentRegex.exec(line)) !== null) {
    allMatches.push({ start: match.index, end: match.index + match[0].length, type: 'comment', text: match[0] });
  }
  
  // Only process non-comment parts
  const commentRanges = allMatches.filter(m => m.type === 'comment');
  
  // Keywords
  keywordRegex.lastIndex = 0;
  while ((match = keywordRegex.exec(line)) !== null) {
    if (!isInCommentRange(match.index, commentRanges)) {
      allMatches.push({ start: match.index, end: match.index + match[0].length, type: 'keyword', text: match[0] });
    }
  }
  
  // Strings
  stringRegex.lastIndex = 0;
  while ((match = stringRegex.exec(line)) !== null) {
    if (!isInCommentRange(match.index, commentRanges)) {
      allMatches.push({ start: match.index, end: match.index + match[0].length, type: 'string', text: match[0] });
    }
  }
  
  // Numbers
  numberRegex.lastIndex = 0;
  while ((match = numberRegex.exec(line)) !== null) {
    if (!isInCommentRange(match.index, commentRanges)) {
      allMatches.push({ start: match.index, end: match.index + match[0].length, type: 'number', text: match[0] });
    }
  }
  
  // Functions
  functionRegex.lastIndex = 0;
  while ((match = functionRegex.exec(line)) !== null) {
    if (!isInCommentRange(match.index, commentRanges)) {
      allMatches.push({ start: match.index, end: match.index + match[1].length, type: 'function', text: match[1] });
    }
  }
  
  // Sort by start position
  allMatches.sort((a, b) => a.start - b.start);
  
  // Remove overlaps (keep first match in case of overlap)
  const filteredMatches = [];
  let lastEnd = 0;
  for (const match of allMatches) {
    if (match.start >= lastEnd) {
      filteredMatches.push(match);
      lastEnd = match.end;
    }
  }
  
  // Build tokens
  let pos = 0;
  filteredMatches.forEach((match, index) => {
    // Add plain text before match
    if (match.start > pos) {
      tokens.push(
        <span key={`text-${index}`} style={{ color: '#d4d4d4' }}>
          {line.substring(pos, match.start)}
        </span>
      );
    }
    
    // Add highlighted match
    const className = `sql-${match.type}`;
    tokens.push(
      <span key={`${match.type}-${index}`} className={className}>
        {match.text}
      </span>
    );
    
    pos = match.end;
  });
  
  // Add remaining text
  if (pos < line.length) {
    tokens.push(
      <span key="remaining" style={{ color: '#d4d4d4' }}>
        {line.substring(pos)}
      </span>
    );
  }
  
  return tokens.length > 0 ? tokens : [<span key="empty" style={{ color: '#d4d4d4' }}>{line}</span>];
}

function isInCommentRange(position: number, commentRanges: any[]): boolean {
  return commentRanges.some(range => position >= range.start && position < range.end);
}

export default function DatabaseDashboardPage() {
  // Database connection state
  const [tenants, setTenants] = useState<any[]>([]);
  const [activeTenant, setActiveTenant] = useState<string>('');
  const [schema, setSchema] = useState<{ tables: SchemaTable[] }>({ tables: [] });
  
  // SQL Editor state
  const [sql, setSql] = useState<string>('-- Hit CTRL+K to generate query or just start typing\nSELECT * FROM users LIMIT 10;');
  const [queryResult, setQueryResult] = useState<any[] | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  
  // UI state
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['tables', 'schemas', 'favorites']));
  const [activeTab, setActiveTab] = useState<'results' | 'chart'>('results');
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [schemas, setSchemas] = useState<any[]>([]);
  const [schemaTables, setSchemaTables] = useState<Record<string, any[]>>({});
  const [allTables, setAllTables] = useState<any[]>([]);
  const [expandedSchemas, setExpandedSchemas] = useState<Set<string>>(new Set());
  const [showCreateTableDialog, setShowCreateTableDialog] = useState(false);
  const [selectedSchemaForTable, setSelectedSchemaForTable] = useState('');
  const [tablesLoading, setTablesLoading] = useState(false);
  const [schemasLoading, setSchemasLoading] = useState(false);
  
  // Resize state
  const [editorHeight, setEditorHeight] = useState(50); // percentage
  const [sidebarWidth, setSidebarWidth] = useState(320); // pixels
  const [isResizingEditor, setIsResizingEditor] = useState(false);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTenants();
  }, []);

  useEffect(() => {
    if (activeTenant) {
      loadSchemas();
      loadSchema(activeTenant);
      loadSavedQueries(activeTenant);
      loadAllTables();
    }
  }, [activeTenant]);

  async function loadTenants() {
    try {
      const resp = await fetch('/api/v1/tenants/me/associations');
      const json = await resp.json();
      setTenants(json.tenants || []);
      if (json.tenants?.length > 0) {
        setActiveTenant(json.tenants[0].tenant_id);
      }
    } catch (e) {
      console.error('Failed to load tenants:', e);
    }
  }

  async function loadSchema(tenantId: string) {
    try {
      const resp = await fetch(`/api/v1/tenants/${tenantId}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sql: `SELECT table_name, column_name, data_type, is_nullable, 
                       CASE WHEN column_name = 'id' THEN true ELSE false END as primary_key
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                ORDER BY table_name, ordinal_position`
        })
      });
      const json = await resp.json();
      if (resp.ok && json.rows) {
        // Group columns by table
        const tables: Record<string, SchemaTable> = {};
        json.rows.forEach((row: any) => {
          const tableName = row.table_name;
          if (!tables[tableName]) {
            tables[tableName] = { name: tableName, columns: [] };
          }
          tables[tableName].columns.push({
            name: row.column_name,
            type: row.data_type,
            nullable: row.is_nullable === 'YES',
            primary_key: row.primary_key
          });
        });
        setSchema({ tables: Object.values(tables) });
      }
    } catch (e) {
      console.error('Failed to load schema:', e);
    }
  }

  async function loadSavedQueries(tenantId: string) {
    // Mock data for now - you'd implement this in your backend
    setSavedQueries([
      { id: '1', name: 'User activity report', sql: 'SELECT * FROM users WHERE last_login > NOW() - INTERVAL \'7 days\';', created_at: '2024-11-25' },
      { id: '2', name: 'Active services count', sql: 'SELECT COUNT(*) FROM hosted_services WHERE status = \'active\';', created_at: '2024-11-24' }
    ]);
  }

  async function runQuery(customSql?: string) {
    const queryToRun = customSql || sql;
    if (!queryToRun.trim()) return;
    if (!activeTenant) {
      setQueryError('Please select a database first');
      return;
    }

    setIsLoading(true);
    setQueryError(null);
    setQueryResult(null);
    const startTime = Date.now();

    try {
      const resp = await fetch(`/api/v1/tenants/${activeTenant}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: queryToRun })
      });
      const json = await resp.json();
      const endTime = Date.now();
      setExecutionTime(endTime - startTime);

      if (!resp.ok) {
        setQueryError(json.message || json.error || 'Query failed');
      } else {
        // Handle enhanced result format with multiple statements
        if (json.results && Array.isArray(json.results)) {
          // Multiple statement results
          const hasErrors = json.results.some((r: any) => r.error);
          if (hasErrors) {
            const errors = json.results.filter((r: any) => r.error).map((r: any) => `Statement ${r.statement}: ${r.error}`);
            setQueryError(errors.join('\n'));
          } else {
            // Show results from SELECT statements, or success messages for DDL/DML
            const selectResults = json.results.filter((r: any) => r.rows);
            if (selectResults.length > 0) {
              setQueryResult(selectResults[0].rows);
            } else {
              // Show success message for DDL/DML operations
              const messages = json.results.map((r: any) => `${r.command}: ${r.message || 'Success'}`);
              setQueryResult([{ message: messages.join('; ') }]);
            }
            
            // Refresh schema if database structure might have changed
            const hasSchemaChanges = json.results.some((r: any) => 
              ['CREATE TABLE', 'DROP TABLE', 'ALTER TABLE', 'CREATE DATABASE', 'CREATE SCHEMA'].includes(r.command)
            );
            if (hasSchemaChanges) {
              await loadSchemas();
              await loadSchema(activeTenant);
            }
          }
        } else {
          // Legacy single result format
          setQueryResult(json.rows || []);
        }
        setActiveTab('results');
      }
    } catch (e: any) {
      setQueryError(e.message || 'Network error');
      setExecutionTime(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadSchemas() {
    if (!activeTenant) return;
    setSchemasLoading(true);
    try {
      const resp = await fetch(`/api/v1/tenants/${activeTenant}/schemas`);
      if (resp.ok) {
        const json = await resp.json();
        setSchemas(json.schemas || []);
      }
    } catch (e) {
      console.error('Failed to load schemas:', e);
    } finally {
      setSchemasLoading(false);
    }
  }

  async function loadAllTables() {
    if (!activeTenant) return;
    setTablesLoading(true);
    try {
      // Get all schemas first
      const schemasResp = await fetch(`/api/v1/tenants/${activeTenant}/schemas`);
      if (!schemasResp.ok) return;
      
      const schemasJson = await schemasResp.json();
      const schemas = schemasJson.schemas || [];
      
      // Load tables from all schemas
      const allTablesPromises = schemas.map(async (schema: any) => {
        try {
          const tablesResp = await fetch(`/api/v1/tenants/${activeTenant}/schemas/${schema.schema_name}/tables`);
          if (tablesResp.ok) {
            const tablesJson = await tablesResp.json();
            return (tablesJson.tables || []).map((table: any) => ({
              ...table,
              schema_name: schema.schema_name,
              full_name: `${schema.schema_name}.${table.table_name}`
            }));
          }
        } catch (e) {
          console.error(`Failed to load tables for schema ${schema.schema_name}:`, e);
        }
        return [];
      });
      
      const allTablesArrays = await Promise.all(allTablesPromises);
      const flatTables = allTablesArrays.flat().sort((a, b) => {
        // Sort by schema first, then by table name
        if (a.schema_name !== b.schema_name) {
          return a.schema_name.localeCompare(b.schema_name);
        }
        return a.table_name.localeCompare(b.table_name);
      });
      
      setAllTables(flatTables);
    } catch (e) {
      console.error('Failed to load all tables:', e);
    } finally {
      setTablesLoading(false);
    }
  }

  async function createSchema(schemaName: string) {
    console.log('createSchema called with:', schemaName, 'activeTenant:', activeTenant);
    if (!activeTenant || !schemaName.trim()) {
      console.log('Early return: missing activeTenant or schemaName');
      return;
    }
    
    try {
      console.log('Making API call to create schema...');
      const resp = await fetch(`/api/v1/tenants/${activeTenant}/schemas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schemaName: schemaName.trim() })
      });
      
      console.log('API response status:', resp.status);
      const json = await resp.json();
      console.log('API response:', json);
      
      if (resp.ok) {
        await loadSchemas();
        setShowCreateDialog(false);
        console.log('Schema created successfully');
      } else {
        const errorMessage = json.message || json.error || 'Failed to create schema';
        console.error('Schema creation failed:', errorMessage);
        setQueryError(errorMessage);
      }
    } catch (e: any) {
      console.error('Network error:', e);
      setQueryError(e.message || 'Network error');
    }
  }

  function toggleSection(section: string) {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  }

  function insertTable(tableName: string) {
    const currentSql = sql || '';
    const newSql = currentSql.includes('FROM') 
      ? currentSql 
      : `SELECT * FROM ${tableName} LIMIT 10;`;
    setSql(newSql);
    if (editorRef.current) {
      editorRef.current.focus();
    }
  }

  function loadSavedQuery(query: SavedQuery) {
    setSql(query.sql);
    if (editorRef.current) {
      editorRef.current.focus();
    }
  }

  async function loadSchemaTables(schemaName: string) {
    if (!activeTenant) return;
    
    console.log('Loading tables for schema:', schemaName, 'activeTenant:', activeTenant);
    console.log('Current schemaTables:', schemaTables);
    
    try {
      const resp = await fetch(`/api/v1/tenants/${activeTenant}/schemas/${schemaName}/tables`);
      console.log('Tables API response status:', resp.status);
      
      if (resp.ok) {
        const json = await resp.json();
        console.log('Tables API response:', json);
        const tables = json.tables || [];
        console.log('Extracted tables:', tables);
        
        setSchemaTables(prev => {
          const updated = {
            ...prev,
            [schemaName]: tables
          };
          console.log('Updated schemaTables:', updated);
          return updated;
        });
      } else {
        const errorText = await resp.text();
        console.error('Tables API error:', errorText);
      }
    } catch (e) {
      console.error(`Failed to load tables for schema ${schemaName}:`, e);
    }
  }

  function toggleSchema(schemaName: string) {
    console.log('toggleSchema called for:', schemaName);
    const newExpanded = new Set(expandedSchemas);
    if (newExpanded.has(schemaName)) {
      newExpanded.delete(schemaName);
      console.log('Collapsing schema:', schemaName);
    } else {
      newExpanded.add(schemaName);
      console.log('Expanding schema:', schemaName);
      // Always try to load tables when expanding, even if we think we have them
      loadSchemaTables(schemaName);
    }
    setExpandedSchemas(newExpanded);
  }

  async function createTable(schemaName: string, tableName: string, columns: string) {
    if (!activeTenant || !schemaName.trim() || !tableName.trim()) return;
    
    const createTableSQL = `CREATE TABLE ${schemaName}.${tableName} (${columns});`;
    
    try {
      const resp = await fetch(`/api/v1/tenants/${activeTenant}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: createTableSQL })
      });
      
      if (resp.ok) {
        await loadSchemaTables(schemaName);
        await loadAllTables();
        setShowCreateTableDialog(false);
        // Update the SQL editor with a SELECT query for the new table
        setSql(`SELECT * FROM ${schemaName}.${tableName} LIMIT 10;`);
      } else {
        const json = await resp.json();
        setQueryError(json.message || json.error || 'Failed to create table');
      }
    } catch (e: any) {
      setQueryError(e.message || 'Network error');
    }
  }

  // Resize handlers
  const handleEditorResize = (e: React.MouseEvent) => {
    setIsResizingEditor(true);
    e.preventDefault();
  };

  const handleSidebarResize = (e: React.MouseEvent) => {
    setIsResizingSidebar(true);
    e.preventDefault();
  };

  // Mouse move and up handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingEditor && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const headerHeight = 60; // approximate header height
        const newHeight = ((e.clientY - containerRect.top - headerHeight) / (containerRect.height - headerHeight)) * 100;
        setEditorHeight(Math.min(Math.max(20, newHeight), 80)); // between 20% and 80%
      }
      
      if (isResizingSidebar) {
        const newWidth = Math.min(Math.max(200, e.clientX), 500); // between 200px and 500px
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizingEditor(false);
      setIsResizingSidebar(false);
    };

    if (isResizingEditor || isResizingSidebar) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = isResizingEditor ? 'ns-resize' : 'ew-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingEditor, isResizingSidebar]);

  // Synchronize scroll between textarea and highlight overlay
  useEffect(() => {
    const textarea = editorRef.current;
    const highlight = highlightRef.current;
    
    if (!textarea || !highlight) return;
    
    const syncScroll = () => {
      highlight.scrollTop = textarea.scrollTop;
      highlight.scrollLeft = textarea.scrollLeft;
    };
    
    textarea.addEventListener('scroll', syncScroll);
    
    return () => {
      textarea.removeEventListener('scroll', syncScroll);
    };
  }, []);

  return (
    <div ref={containerRef} className="h-screen flex flex-col bg-[#1e1e1e]">
      {/* Header */}
      <div className="bg-[#2d2d30] border-b border-gray-600 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1 rounded hover:bg-[#3e3e42] text-gray-300 hover:text-white transition-colors"
            title={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-emerald-400" />
            <h1 className="text-lg font-semibold text-white">SQL Editor</h1>
          </div>
          <select 
            value={activeTenant} 
            onChange={(e) => setActiveTenant(e.target.value)}
            className="border border-gray-600 rounded-md px-3 py-1.5 text-sm bg-[#3c3c3c] text-white"
          >
            <option value="">Select Database</option>
            {tenants.map((tenant) => (
              <option key={tenant.tenant_id} value={tenant.tenant_id}>
                {tenant.name || tenant.tenant_id}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setShowCreateDialog(true)}
            className="border-emerald-600 text-emerald-400 hover:bg-emerald-600 hover:text-white"
          >
            <Plus className="h-4 w-4 mr-1" />
            New Schema
          </Button>
          <Button size="sm" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
            <Save className="h-4 w-4 mr-1" />
            Save query
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Schema Sidebar */}
        {!sidebarCollapsed && (
          <div 
            className="bg-[#252526] border-r border-[#2d2d30] flex-shrink-0 overflow-hidden flex flex-col"
            style={{ width: `${sidebarWidth}px` }}
          >
          <div className="p-4 border-b border-[#3e3e42]">
            <h2 className="font-medium text-white text-sm flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-400" />
              Schema Explorer
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar scrollbar--neutral">
            <div className="p-2">
              
              {/* Tables Section - All Tables from All Schemas */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={() => toggleSection('tables')}
                    className="flex items-center gap-1 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                  >
                    {expandedSections.has('tables') ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <Table className="h-4 w-4" />
                    Tables
                    {allTables.length > 0 && (
                      <span className="ml-1 px-1 py-0.5 bg-emerald-600 text-white text-xs rounded-full min-w-[14px] h-3.5 flex items-center justify-center">
                        {allTables.length}
                      </span>
                    )}
                  </button>
                  {tablesLoading && (
                    <div className="w-3 h-3 border border-gray-400 border-t-emerald-400 rounded-full animate-spin"></div>
                  )}
                </div>
                {expandedSections.has('tables') && (
                  <div className="ml-5 space-y-1 max-h-64 overflow-y-auto scrollbar scrollbar--sm">
                    {tablesLoading ? (
                      <div className="flex items-center gap-2 py-2 text-xs text-gray-500">
                        <div className="w-3 h-3 border border-gray-400 border-t-emerald-400 rounded-full animate-spin"></div>
                        Loading tables...
                      </div>
                    ) : allTables.length === 0 ? (
                      <p className="text-xs text-gray-500 py-2">No tables found</p>
                    ) : (
                      allTables.map((table) => (
                        <div key={table.full_name} className="group">
                          <button
                            onClick={() => {
                              const query = `SELECT * FROM ${table.full_name} LIMIT 10;`;
                              setSql(query);
                              if (editorRef.current) {
                                editorRef.current.focus();
                              }
                            }}
                            className="text-sm text-gray-300 hover:text-emerald-400 hover:bg-[#2d2d30] px-2 py-1 rounded w-full text-left flex items-center gap-2 transition-colors"
                          >
                            <Table className="h-3 w-3 text-emerald-400" />
                            <div className="flex items-center gap-1 flex-1 min-w-0">
                              <span className="truncate">{table.table_name}</span>
                              <span className={`px-1 py-0 text-xs rounded text-white font-medium leading-tight ${
                                table.schema_name === 'public' ? 'bg-blue-500' :
                                table.schema_name === 'auth' ? 'bg-purple-500' :
                                table.schema_name === 'storage' ? 'bg-orange-500' :
                                table.schema_name === 'realtime' ? 'bg-green-500' :
                                'bg-gray-500'
                              }`}>
                                {table.schema_name}
                              </span>
                            </div>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Schemas - Database Structure */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={() => toggleSection('schemas')}
                    className="flex items-center gap-1 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                  >
                    {expandedSections.has('schemas') ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <Database className="h-4 w-4" />
                    Database Structure
                    {schemas.length > 0 && (
                      <span className="ml-1 px-1 py-0.5 bg-blue-600 text-white text-xs rounded-full min-w-[14px] h-3.5 flex items-center justify-center">
                        {schemas.length}
                      </span>
                    )}
                  </button>
                  {schemasLoading && (
                    <div className="w-3 h-3 border border-gray-400 border-t-blue-400 rounded-full animate-spin"></div>
                  )}
                </div>
                {expandedSections.has('schemas') && (
                  <div className="ml-5 space-y-2">
                    {schemasLoading ? (
                      <div className="flex items-center gap-2 py-2 text-xs text-gray-500">
                        <div className="w-3 h-3 border border-gray-400 border-t-blue-400 rounded-full animate-spin"></div>
                        Loading schemas...
                      </div>
                    ) : schemas.length === 0 ? (
                      <p className="text-xs text-gray-500 py-2">No schemas found</p>
                    ) : (
                      schemas.map((schema) => {
                        const tableCount = schemaTables[schema.schema_name]?.length || 0;
                        const isSystemSchema = ['information_schema', 'pg_catalog', 'pg_toast'].includes(schema.schema_name);
                        
                        return (
                          <div key={schema.schema_name} className={`border rounded-md ${
                            isSystemSchema ? 'border-gray-700 bg-gray-800/30' : 'border-gray-600 bg-gray-700/20'
                          }`}>
                            <div className="flex items-center justify-between group p-2">
                              <button
                                onClick={() => toggleSchema(schema.schema_name)}
                                className="flex-1 text-left text-sm text-gray-300 hover:text-white flex items-center gap-2 transition-colors"
                              >
                                {expandedSchemas.has(schema.schema_name) ? (
                                  <ChevronDown className="h-3 w-3" />
                                ) : (
                                  <ChevronRight className="h-3 w-3" />
                                )}
                                <Database className={`h-3 w-3 ${
                                  schema.schema_name === 'public' ? 'text-blue-400' :
                                  schema.schema_name === 'auth' ? 'text-purple-400' :
                                  schema.schema_name === 'storage' ? 'text-orange-400' :
                                  schema.schema_name === 'realtime' ? 'text-green-400' :
                                  isSystemSchema ? 'text-gray-500' : 'text-cyan-400'
                                }`} />
                                <span className="font-medium">{schema.schema_name}</span>
                                {tableCount > 0 && (
                                  <span className="text-xs text-gray-500 font-normal">({tableCount})</span>
                                )}
                                {schema.schema_name === 'public' && (
                                  <span className="text-xs bg-blue-500 text-white px-1 py-0.5 rounded leading-none">default</span>
                                )}
                                {isSystemSchema && (
                                  <span className="text-xs bg-gray-500 text-gray-300 px-1 py-0.5 rounded leading-none">system</span>
                                )}
                              </button>
                              {!isSystemSchema && (
                                <button
                                  onClick={() => {
                                    setSelectedSchemaForTable(schema.schema_name);
                                    setShowCreateTableDialog(true);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-emerald-400 hover:bg-gray-700 rounded transition-all"
                                  title="Create new table"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                            {expandedSchemas.has(schema.schema_name) && (
                              <div className="px-4 pb-2 space-y-1 border-t border-gray-600/50">
                                {(schemaTables[schema.schema_name] || []).length === 0 ? (
                                  <div className="flex items-center justify-between py-2">
                                    <p className="text-xs text-gray-500">No tables in this schema</p>
                                    {!isSystemSchema && (
                                      <button
                                        onClick={() => {
                                          setSelectedSchemaForTable(schema.schema_name);
                                          setShowCreateTableDialog(true);
                                        }}
                                        className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-700 transition-colors"
                                      >
                                        <Plus className="h-3 w-3" />
                                        Create table
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  (schemaTables[schema.schema_name] || []).map((table: any) => (
                                    <button
                                      key={table.table_name}
                                      onClick={() => {
                                        const query = `SELECT * FROM ${schema.schema_name}.${table.table_name} LIMIT 10;`;
                                        setSql(query);
                                        if (editorRef.current) {
                                          editorRef.current.focus();
                                        }
                                      }}
                                      className="w-full text-left text-xs text-gray-400 hover:text-white px-2 py-1.5 flex items-center gap-2 hover:bg-gray-600/50 rounded transition-colors group"
                                    >
                                      <Table className="h-3 w-3 text-emerald-400" />
                                      <span className="flex-1">{table.table_name}</span>
                                      <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {table.table_type === 'VIEW' ? 'view' : 'table'}
                                      </span>
                                    </button>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Saved Queries */}
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('favorites')}
                  className="flex items-center gap-1 text-sm font-medium text-gray-300 hover:text-white mb-2 transition-colors"
                >
                  {expandedSections.has('favorites') ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <Star className="h-4 w-4" />
                  Favorites
                </button>
                {expandedSections.has('favorites') && (
                  <div className="ml-5 space-y-1">
                    {savedQueries.length === 0 ? (
                      <p className="text-xs text-gray-500 py-2">No saved queries</p>
                    ) : (
                      savedQueries.map((query) => (
                        <button
                          key={query.id}
                          onClick={() => loadSavedQuery(query)}
                          className="text-sm text-gray-300 hover:text-emerald-400 hover:bg-[#2d2d30] px-2 py-1 rounded w-full text-left block truncate transition-colors"
                          title={query.name}
                        >
                          {query.name}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Recent Queries */}
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('recent')}
                  className="flex items-center gap-1 text-sm font-medium text-gray-300 hover:text-white mb-2 transition-colors"
                >
                  {expandedSections.has('recent') ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <Clock className="h-4 w-4" />
                  Recent
                </button>
                {expandedSections.has('recent') && (
                  <div className="ml-5 space-y-1">
                    <p className="text-xs text-gray-500 py-2">No recent queries</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
        )}

        {/* Sidebar Resize Handle */}
        {!sidebarCollapsed && (
          <div 
            className="w-1 bg-[#2d2d30] hover:bg-[#007fd4] cursor-ew-resize flex-shrink-0 transition-all duration-150 hover:w-1.5"
            onMouseDown={handleSidebarResize}
            title="Drag to resize sidebar"
          />
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* SQL Editor */}
          <div 
            className="bg-[#1e1e1e] border-b border-[#2d2d30] flex flex-col overflow-hidden"
            style={{ height: `${editorHeight}%` }}
          >
            {/* Editor Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d30] border-b border-[#3e3e42]">
              <h3 className="text-sm font-medium text-gray-300">SQL Editor</h3>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setSql('')}
                  variant="outline"
                  size="sm"
                  className="border-[#3e3e42] hover:bg-[#3e3e42] text-gray-300 text-xs px-3 py-1"
                >
                  Clear
                </Button>
              </div>
            </div>

            {/* Editor Content */}
            <div className="flex-1 p-4">
              <div className="h-full border border-[#3e3e42] rounded-md overflow-hidden bg-[#1e1e1e]">
                <div className="h-full relative">
                  {/* Line numbers */}
                  <div className="absolute left-0 top-0 bottom-0 w-12 bg-[#252526] border-r border-[#3e3e42] flex flex-col text-xs text-[#858585] font-mono">
                    {sql.split('\n').map((_, index) => (
                      <div key={index} className="px-2 py-0 leading-6 text-right select-none">
                        {index + 1}
                      </div>
                    ))}
                  </div>
                  
                  {/* SQL Editor with Syntax Highlighting */}
                  <div className="ml-12 h-full relative overflow-hidden">
                    {/* Syntax Highlighting Overlay */}
                    <div 
                      ref={highlightRef}
                      className="absolute inset-0 p-4 font-mono text-sm leading-6 whitespace-pre-wrap pointer-events-none overflow-hidden"
                      style={{ 
                        fontSize: '14px',
                        fontFamily: 'Consolas, "Courier New", monospace',
                        lineHeight: '1.5',
                        zIndex: 5
                      }}
                    >
                      {highlightSQLText(sql)}
                    </div>
                    
                    {/* Textarea */}
                    <textarea
                      ref={editorRef}
                      value={sql}
                      onChange={(e) => setSql(e.target.value)}
                      onKeyDown={(e) => {
                        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                          e.preventDefault();
                          runQuery();
                        }
                      }}
                      className="w-full h-full p-4 font-mono text-sm border-0 outline-0 resize-none bg-transparent leading-6 scrollbar scrollbar--neutral sql-editor relative z-10 overflow-auto"
                      placeholder="-- Hit Ctrl+Enter to run query or click Run button&#10;SELECT * FROM users LIMIT 10;"
                      spellCheck={false}
                      style={{ 
                        background: 'transparent',
                        color: 'transparent',
                        caretColor: 'white',
                        fontSize: '14px',
                        fontFamily: 'Consolas, "Courier New", monospace',
                        lineHeight: '1.5'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Editor/Results Resize Handle */}
          <div 
            className="h-1 bg-[#2d2d30] hover:bg-[#007fd4] cursor-ns-resize flex-shrink-0 transition-all duration-150 hover:h-1.5"
            onMouseDown={handleEditorResize}
            title="Drag to resize editor panels"
          />

          {/* Results Panel */}
          <div 
            className="bg-[#252526] overflow-hidden flex flex-col"
            style={{ height: `${100 - editorHeight}%` }}
          >
            {/* Results Header */}
            <div className="border-b border-[#3e3e42] px-4 py-2 bg-[#2d2d30] flex-shrink-0 relative">
              <div className="flex items-center justify-between">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                  <TabsList className="bg-[#3e3e42] border-[#3e3e42] p-0">
                    <TabsTrigger 
                      value="results" 
                      className="text-gray-300 data-[state=active]:bg-[#1e1e1e] data-[state=active]:text-white px-3 py-1 text-sm"
                    >
                      Results
                    </TabsTrigger>
                    <TabsTrigger 
                      value="chart" 
                      className="text-gray-300 data-[state=active]:bg-[#1e1e1e] data-[state=active]:text-white px-3 py-1 text-sm"
                    >
                      Chart
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                
                {/* Centered Run Button */}
                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <Button
                    onClick={() => runQuery()}
                    disabled={isLoading || !sql.trim() || !activeTenant}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 disabled:hover:bg-gray-600 text-white border-0 text-xs px-4 py-1.5 rounded-md shadow-lg flex items-center gap-2 transition-all duration-200 hover:shadow-xl"
                  >
                    <Play className="h-3 w-3" />
                    {isLoading ? 'Running...' : 'Run Query'}
                  </Button>
                </div>

                {executionTime !== null && (
                  <div className="text-xs text-[#858585]">
                    Executed in {executionTime}ms
                    {queryResult && ` • ${queryResult.length} rows`}
                  </div>
                )}
              </div>
            </div>

            {/* Results Content */}
            <div className="flex-1 overflow-hidden bg-[#252526]">
              <Tabs value={activeTab} className="h-full">
                <TabsContent value="results" className="h-full m-0 p-4 overflow-auto scrollbar scrollbar--neutral">
                  {queryError && (
                    <div className="bg-red-900/20 border border-red-700/50 rounded-md p-3 mb-4">
                      <div className="text-sm font-medium text-red-300 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Query Error
                      </div>
                      <div className="text-sm text-red-200 mt-1 font-mono">{queryError}</div>
                    </div>
                  )}

                  {isLoading && (
                    <div className="flex items-center justify-center py-12">
                      <div className="flex items-center gap-3 text-gray-400">
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-[#007fd4] rounded-full animate-spin"></div>
                        <span className="text-sm">Running query...</span>
                      </div>
                    </div>
                  )}

                  {queryResult && !isLoading && (
                    <div className="border border-[#3e3e42] rounded-md overflow-hidden bg-[#1e1e1e]">
                      {queryResult.length === 0 ? (
                        <div className="p-8 text-center text-[#858585] text-sm">
                          <Database className="h-8 w-8 mx-auto mb-3 opacity-50" />
                          No rows returned
                        </div>
                      ) : (
                        <div className="overflow-auto scrollbar scrollbar--neutral">
                          <table className="w-full text-sm">
                            <thead className="bg-[#2d2d30] border-b border-[#3e3e42] sticky top-0">
                              <tr>
                                {Object.keys(queryResult[0] || {}).map((column) => (
                                  <th key={column} className="px-4 py-3 text-left font-medium text-gray-300 whitespace-nowrap">
                                    {column}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#3e3e42]">
                              {queryResult.map((row, index) => (
                                <tr key={index} className="hover:bg-[#2d2d30] transition-colors">
                                  {Object.values(row).map((value: any, cellIndex) => (
                                    <td key={cellIndex} className="px-4 py-3 whitespace-nowrap">
                                      {value === null ? (
                                        <span className="text-[#858585] italic">null</span>
                                      ) : typeof value === 'object' ? (
                                        <span className="font-mono text-xs text-[#ce9178]">{JSON.stringify(value)}</span>
                                      ) : typeof value === 'number' ? (
                                        <span className="text-[#b5cea8]">{String(value)}</span>
                                      ) : typeof value === 'boolean' ? (
                                        <span className="text-[#569cd6]">{String(value)}</span>
                                      ) : (
                                        <span className="text-[#d4d4d4]">{String(value)}</span>
                                      )}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {!queryResult && !queryError && !isLoading && (
                    <div className="flex items-center justify-center py-16 text-[#858585]">
                      <div className="text-center">
                        <Database className="h-16 w-16 mx-auto mb-4 opacity-30" />
                        <p className="text-sm mb-2">Ready to execute SQL queries</p>
                        <p className="text-xs">Click the <kbd className="px-1 py-0.5 bg-[#3e3e42] rounded text-xs">Run Query</kbd> button above or press <kbd className="px-1 py-0.5 bg-[#3e3e42] rounded text-xs">Ctrl+Enter</kbd></p>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="chart" className="h-full m-0 p-4">
                  <div className="flex items-center justify-center py-16 text-[#858585]">
                    <div className="text-center">
                      <Eye className="h-16 w-16 mx-auto mb-4 opacity-30" />
                      <p className="text-sm mb-2">Chart visualization</p>
                      <p className="text-xs">Coming soon - visualize query results as charts</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      {/* Create Schema Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#2d2d30] rounded-lg p-6 w-96 border border-gray-600">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Database className="h-5 w-5 text-emerald-400" />
                Create New Schema
              </h3>
              <button
                onClick={() => setShowCreateDialog(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const schemaName = formData.get('schemaName') as string;
              console.log('Creating schema:', schemaName);
              await createSchema(schemaName);
            }}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Schema Name
                </label>
                <input
                  type="text"
                  name="schemaName"
                  placeholder="e.g., my_app_schema"
                  className="w-full px-3 py-2 bg-[#3c3c3c] border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                  pattern="^[a-zA-Z_][a-zA-Z0-9_]*$"
                  title="Schema name must start with a letter or underscore, followed by letters, numbers, or underscores"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use letters, numbers, and underscores only. Must start with letter or underscore.
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateDialog(false)}
                  className="px-4 py-2 text-sm border border-gray-600 rounded-md text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
                >
                  Create Schema
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Table Dialog */}
      {showCreateTableDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#2d2d30] rounded-lg p-6 w-[600px] border border-gray-600">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Table className="h-5 w-5 text-emerald-400" />
                Create New Table in {selectedSchemaForTable}
              </h3>
              <button
                onClick={() => {
                  setShowCreateTableDialog(false);
                  setSelectedSchemaForTable('');
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const tableName = formData.get('tableName') as string;
              const columns = formData.get('columns') as string;
              await createTable(selectedSchemaForTable, tableName, columns);
            }}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Table Name
                </label>
                <input
                  type="text"
                  name="tableName"
                  placeholder="e.g., users"
                  className="w-full px-3 py-2 bg-[#3c3c3c] border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                  pattern="^[a-zA-Z_][a-zA-Z0-9_]*$"
                  title="Table name must start with a letter or underscore, followed by letters, numbers, or underscores"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Columns (SQL)
                </label>
                <textarea
                  name="columns"
                  placeholder={`id SERIAL PRIMARY KEY,
name VARCHAR(100) NOT NULL,
email VARCHAR(255) UNIQUE,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`}
                  rows={4}
                  className="w-full px-3 py-2 bg-[#3c3c3c] border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono text-sm"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter column definitions separated by commas (e.g., id SERIAL PRIMARY KEY, name VARCHAR(100))
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateTableDialog(false);
                    setSelectedSchemaForTable('');
                  }}
                  className="px-4 py-2 text-sm border border-gray-600 rounded-md text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
                >
                  Create Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>

  );

}
