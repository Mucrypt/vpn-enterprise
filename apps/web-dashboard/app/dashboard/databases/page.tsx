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
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['tables', 'favorites']));
  const [activeTab, setActiveTab] = useState<'results' | 'chart'>('results');
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
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
      loadSchema(activeTenant);
      loadSavedQueries(activeTenant);
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
        setQueryResult(json.rows || []);
        setActiveTab('results');
      }
    } catch (e: any) {
      setQueryError(e.message || 'Network error');
      setExecutionTime(null);
    } finally {
      setIsLoading(false);
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
              
              {/* Tables Section */}
              <div className="mb-4">
                <button
                  onClick={() => toggleSection('tables')}
                  className="flex items-center gap-1 text-sm font-medium text-gray-300 hover:text-white mb-2 transition-colors"
                >
                  {expandedSections.has('tables') ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <Table className="h-4 w-4" />
                  Tables
                </button>
                {expandedSections.has('tables') && (
                  <div className="ml-5 space-y-1">
                    {schema.tables.length === 0 ? (
                      <p className="text-xs text-gray-500 py-2">No tables found</p>
                    ) : (
                      schema.tables.map((table) => (
                        <div key={table.name} className="group">
                          <button
                            onClick={() => insertTable(table.name)}
                            className="text-sm text-gray-300 hover:text-emerald-400 hover:bg-[#2d2d30] px-2 py-1 rounded w-full text-left flex items-center gap-1 transition-colors"
                          >
                            <Table className="h-3 w-3" />
                            {table.name}
                          </button>
                          <div className="ml-4 mt-1 space-y-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {table.columns.slice(0, 4).map((col) => (
                              <div key={col.name} className="text-xs text-gray-500 flex items-center gap-1">
                                {col.primary_key ? (
                                  <Key className="h-3 w-3 text-emerald-400" />
                                ) : col.type.includes('int') || col.type.includes('serial') ? (
                                  <Hash className="h-3 w-3" />
                                ) : (
                                  <span className="w-3" />
                                )}
                                <span className="truncate">{col.name}</span>
                                <span className="text-gray-600">({col.type})</span>
                              </div>
                            ))}
                            {table.columns.length > 4 && (
                              <div className="text-xs text-gray-600">
                                +{table.columns.length - 4} more columns
                              </div>
                            )}
                          </div>
                        </div>
                      ))
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
    </div>

  );

}
