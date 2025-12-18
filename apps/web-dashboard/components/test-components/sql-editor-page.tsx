'use client';

import React, { useState, useRef, useCallback, useEffect, Suspense, lazy } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Play,
  Save,
  Database,
  Eye,
  AlertCircle,
  BarChart3,
  FileText,
  Clock,
  GripHorizontal,
  Trash2,
  Download,
  Copy,
  Plus,
  X,
  Heart,
  Settings,
  ChevronDown,
  Type,
  Maximize2,
  Code
} from 'lucide-react';
import { SimpleSqlEditor } from '@/components/test-components/simple-sql-editor';


// Lazy load the heavy Monaco editor
const AdvancedSQLEditor = lazy(() => 
  import('@vpn-enterprise/editor/src/sql-editor').then(module => ({
    default: module.AdvancedSQLEditor
  }))
);

interface SqlEditorPageProps {
  activeTenant: string;
  sql: string;
  setSql: (sql: string) => void;
  runQuery: (selectedSql?: string) => void;
  cancelQuery?: () => void;
  queryResult: any[] | null;
  queryError: string | null;
  isLoading: boolean;
  queryStatus?: 'idle' | 'running' | 'cancelled';
  executionTime: number | null;
  activeQueryName: string;
  setActiveQueryName: (name: string) => void;
}

// SQL Syntax Highlighting Functions
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

interface SavedQuery {
  id: string;
  name: string;
  sql: string;
  created_at: string;
  updated_at: string;
}

export function SqlEditorPage({
  activeTenant,
  sql,
  setSql,
  runQuery,
  cancelQuery,
  queryResult,
  queryError,
  isLoading,
  queryStatus = 'idle',
  executionTime,
  activeQueryName,
  setActiveQueryName
}: SqlEditorPageProps) {
  const [activeTab, setActiveTab] = useState<'results' | 'chart'>('results');
  const [editorHeight, setEditorHeight] = useState(300);
  const [isDragging, setIsDragging] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Saved query management
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [activeQueryId, setActiveQueryId] = useState<string | null>(null);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      runQuery();
    }
  }, [runQuery]);

  // Sync scroll between textarea and highlight overlay
  const handleScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement>) => {
    if (highlightRef.current && editorRef.current) {
      highlightRef.current.scrollTop = editorRef.current.scrollTop;
      highlightRef.current.scrollLeft = editorRef.current.scrollLeft;
    }
  }, []);
  
  // Load saved queries from localStorage
  useEffect(() => {
    const loadSavedQueries = () => {
      try {
        const saved = localStorage.getItem(`sql-queries-${activeTenant}`);
        if (saved) {
          setSavedQueries(JSON.parse(saved));
        }
      } catch (error) {
        console.warn('Failed to load saved queries:', error);
      }
    };
    
    if (activeTenant) {
      loadSavedQueries();
    }
  }, [activeTenant]);
  
  // Save current query
  const saveCurrentQuery = useCallback(() => {
    if (!sql.trim() || !activeTenant) return;
    
    const now = new Date().toISOString();
    const queryId = activeQueryId || `query_${Date.now()}`;
    const queryName = activeQueryName.trim() || 'Untitled query';
    
    const query: SavedQuery = {
      id: queryId,
      name: queryName,
      sql: sql.trim(),
      created_at: activeQueryId ? savedQueries.find(q => q.id === activeQueryId)?.created_at || now : now,
      updated_at: now
    };
    
    const updatedQueries = activeQueryId
      ? savedQueries.map(q => q.id === activeQueryId ? query : q)
      : [...savedQueries, query];
    
    setSavedQueries(updatedQueries);
    setActiveQueryId(queryId);
    
    // Save to localStorage
    try {
      localStorage.setItem(`sql-queries-${activeTenant}`, JSON.stringify(updatedQueries));
    } catch (error) {
      console.warn('Failed to save query:', error);
    }
  }, [sql, activeTenant, activeQueryId, activeQueryName, savedQueries]);
  
  // Auto-save after successful query execution that creates tables/schemas
  const handleQueryWithAutoSave = useCallback(async () => {
    await runQuery();
    
    // Add to query history (for Query History page)
    const historyEntry: SavedQuery = {
      id: `history_${Date.now()}`,
      name: `Query at ${new Date().toLocaleTimeString()}`,
      sql: sql.trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    try {
      const existingHistory = localStorage.getItem(`sql-history-${activeTenant}`);
      const history = existingHistory ? JSON.parse(existingHistory) : [];
      const updatedHistory = [historyEntry, ...history.slice(0, 19)]; // Keep last 20
      localStorage.setItem(`sql-history-${activeTenant}`, JSON.stringify(updatedHistory));
    } catch (error) {
      console.warn('Failed to save query history:', error);
    }
    
    // Check if the query was a CREATE statement
    const sqlLower = sql.toLowerCase().trim();
    if (sqlLower.startsWith('create table') || sqlLower.startsWith('create schema') || sqlLower.includes('create table')) {
      // Extract table name for auto-naming
      const createTableMatch = sqlLower.match(/create\s+table\s+(?:if\s+not\s+exists\s+)?(?:"?([^"\s.]+)"?\.)?"?([^"\s(]+)"?/);
      if (createTableMatch) {
        const tableName = createTableMatch[2];
        const schemaName = createTableMatch[1];
        const suggestedName = schemaName 
          ? `Create ${tableName} in ${schemaName}`
          : `Create ${tableName} table`;
        
        if (activeQueryName === 'Untitled query') {
          setActiveQueryName(suggestedName);
        }
        
        // Auto-save the query
        setTimeout(() => saveCurrentQuery(), 100);
      }
    }
  }, [runQuery, sql, activeQueryName, saveCurrentQuery, activeTenant]);

  // Resize functionality
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const newHeight = Math.max(200, Math.min(600, e.clientY - containerRect.top - 60)); // Min 200px, Max 600px
    setEditorHeight(newHeight);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div ref={containerRef} className="h-full flex flex-col bg-[#1e1e1e] overflow-hidden">
      {/* Supabase-style Top Action Bar */}
      <div className="flex-shrink-0 border-b border-[#2d2d30] bg-[#181818] px-6 py-2.5">
        <div className="flex items-center justify-between">
          {/* Left Side - Tabs and Actions */}
          <div className="flex items-center gap-3">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'results' | 'chart')}>
              <TabsList className="bg-[#2d2d30] border-[#3e3e42] h-8">
                <TabsTrigger value="results" className="text-xs h-7 px-3">
                  Results
                </TabsTrigger>
                <TabsTrigger value="chart" className="text-xs h-7 px-3">
                  Chart
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            {/* Action Icons */}
            <div className="flex items-center gap-1 border-l border-[#2d2d30] pl-3">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-gray-400 hover:text-white hover:bg-[#2d2d30]"
                title="Format SQL"
              >
                <Code className="h-3.5 w-3.5" />
              </Button>
              <Button
                onClick={saveCurrentQuery}
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-gray-400 hover:text-white hover:bg-[#2d2d30]"
                title="Save query"
                disabled={!sql.trim()}
              >
                <Heart className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-gray-400 hover:text-white hover:bg-[#2d2d30]"
                title="Full screen"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-gray-400 hover:text-white hover:bg-[#2d2d30]"
                title="Settings"
              >
                <Settings className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          
          {/* Right Side - Database Selector, Role, and Run Button */}
          <div className="flex items-center gap-3">
            {/* Source Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Source</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 bg-[#2d2d30] hover:bg-[#3e3e42] text-gray-300 text-xs border border-[#3e3e42]"
              >
                API
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </div>
            
            {/* Primary Database Selector */}
            <div className="relative">
              <select 
                value={activeTenant} 
                onChange={(e) => {}}
                className="h-7 bg-[#2d2d30] border border-[#3e3e42] rounded px-2 pr-6 text-xs text-gray-300 appearance-none cursor-pointer hover:bg-[#3e3e42] transition-colors"
              >
                <option value="">Primary Database</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
            </div>
            
            {/* Role Indicator */}
            <div className="flex items-center gap-2 px-2 py-1 bg-[#2d2d30] border border-[#3e3e42] rounded text-xs">
              <span className="text-gray-500">Role:</span>
              <span className="text-gray-300">postgres</span>
            </div>
            
            {/* Run Button - Supabase Green */}
            {isLoading && cancelQuery ? (
              <Button
                onClick={cancelQuery}
                variant="ghost"
                size="sm"
                className="h-7 px-3 bg-red-600 hover:bg-red-700 text-white border-red-600 text-xs font-medium"
              >
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
            ) : (
              <Button
                onClick={handleQueryWithAutoSave}
                disabled={!activeTenant || isLoading || !sql.trim()}
                className="h-7 px-3 bg-[#3ecf8e] hover:bg-[#34b378] text-[#0e1c16] text-xs font-medium border-[#3ecf8e]"
              >
                <Play className="h-3 w-3 mr-1 fill-current" />
                Run
                <span className="ml-1.5 opacity-75">CTRL ⏎</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Monaco Editor Section  */}
      <div className="flex-shrink-0 relative bg-[#1e1e1e]" style={{ height: editorHeight }}>
        <Suspense 
          fallback={
            <SimpleSqlEditor
              sql={sql}
              setSql={setSql}
              runQuery={() => runQuery(sql)}
              cancelQuery={cancelQuery || (() => {})}
              isLoading={isLoading}
              queryStatus={queryStatus}
            />
          }
        >
          <AdvancedSQLEditor
            initialValue={sql}
            onChange={(value) => setSql(value || '')}
            onExecute={(sqlToRun) => runQuery(sqlToRun)}
            onSelectionExecute={(selectedSql) => runQuery(selectedSql)}
            height={`${editorHeight}px`}
            theme="vs-dark"
            showMinimap={editorHeight > 400}
            enableSuggestions={true}
            schemas={[]} // TODO: Pass actual schema data
          />
        </Suspense>

        {/* Resize Handle */}
        <div
          ref={resizeRef}
          onMouseDown={handleMouseDown}
          className={`absolute bottom-0 left-0 right-0 h-2 cursor-row-resize group hover:bg-emerald-500/20 transition-colors ${
            isDragging ? 'bg-emerald-500/30' : ''
          }`}
        >
          <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 flex justify-center">
            <GripHorizontal className="h-3 w-3 text-gray-500 group-hover:text-emerald-400 transition-colors" />
          </div>
        </div>
      </div>
     

      {/* Results Section - Takes remaining space */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Status Bar - Minimal */}
        {(queryStatus === 'running' || queryStatus === 'cancelled' || executionTime) && (
          <div className="flex-shrink-0 px-6 py-2 bg-[#181818] border-b border-[#2d2d30]">
            <div className="flex items-center gap-3 text-xs">
              {queryStatus === 'running' && (
                <div className="flex items-center text-blue-400">
                  <div className="w-2.5 h-2.5 border border-blue-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                  Executing query...
                </div>
              )}
              {queryStatus === 'cancelled' && (
                <div className="flex items-center text-yellow-400">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Query cancelled
                </div>
              )}
              {executionTime && queryStatus === 'idle' && (
                <div className="flex items-center text-gray-400">
                  <Clock className="h-3 w-3 mr-1" />
                  Executed in {executionTime}ms
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results Content */}
        <div className="flex-1 overflow-auto min-h-0 bg-[#1e1e1e]">
          <Tabs value={activeTab}>
            <TabsContent value="results" className="h-full m-0">
              {!queryResult && !queryError && !isLoading && (
                <div className="h-full flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <Database className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                    <div className="text-lg mb-2">Ready to run SQL queries</div>
                    <p className="text-sm mb-4">Write your SQL and press <kbd className="px-2 py-1 bg-[#2d2d30] border border-[#3e3e42] rounded text-xs text-emerald-300">Ctrl+Enter</kbd> to execute</p>
                    <div className="text-xs text-gray-500">
                      💡 Try the Templates dropdown for common SQL patterns
                    </div>
                  </div>
                </div>
              )}

              {isLoading && (
                <div className="h-full flex items-center justify-center">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm">Executing query...</span>
                  </div>
                </div>
              )}

              {queryError && (
                <div className="p-6">
                  <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-red-400 mb-2">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium">Query Error</span>
                    </div>
                    <div className="text-sm text-red-300 whitespace-pre-wrap font-mono">
                      {(() => {
                        // Improve common error messages
                        if (queryError.includes('already exists')) {
                          const match = queryError.match(/relation "([^"]+)" already exists/);
                          const tableName = match ? match[1] : 'table';
                          return (
                            <div>
                              <div className="text-red-300 mb-3">Table "{tableName}" already exists.</div>
                              <div className="text-yellow-300 text-xs mb-2">
                                💡 <span className="font-medium">Tip:</span> Add "IF NOT EXISTS" to your CREATE TABLE statement:
                              </div>
                              <div className="p-3 bg-[#2d2d30] rounded border border-[#3e3e42] text-emerald-300">
                                CREATE TABLE IF NOT EXISTS {tableName} (...)
                              </div>
                            </div>
                          );
                        }
                        
                        if (queryError.includes('syntax error')) {
                          return (
                            <div>
                              <div className="text-red-300 mb-3">SQL syntax error detected.</div>
                              <div className="text-yellow-300 text-xs mb-2">
                                💡 <span className="font-medium">Tip:</span> Check for missing semicolons, typos in keywords, or incorrect SQL syntax.
                              </div>
                              <pre className="text-xs text-red-400 p-2 bg-[#2d2d30] rounded border border-[#3e3e42]">{queryError}</pre>
                            </div>
                          );
                        }
                        
                        if (queryError.includes('does not exist')) {
                          const match = queryError.match(/relation "([^"]+)" does not exist/);
                          const tableName = match ? match[1] : 'table';
                          return (
                            <div>
                              <div className="text-red-300 mb-3">Table "{tableName}" does not exist.</div>
                              <div className="text-yellow-300 text-xs">
                                💡 <span className="font-medium">Tip:</span> Create the table first or check the table name spelling.
                              </div>
                            </div>
                          );
                        }
                        
                        return queryError;
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {queryResult && (
                <div className="p-6">
                  {queryResult.length === 0 ? (
                    <div className="mb-4 p-3 bg-emerald-900/20 border border-emerald-800 rounded-lg">
                      <div className="flex items-center gap-2 text-emerald-400">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                        <span className="text-sm font-medium">Query executed successfully</span>
                        {executionTime && <span className="text-xs text-gray-400">in {executionTime}ms</span>}
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4 text-sm text-gray-400">
                      {queryResult.length} row{queryResult.length !== 1 ? 's' : ''} returned
                      {executionTime && ` in ${executionTime}ms`}
                    </div>
                  )}
                  
                  {queryResult.length > 0 ? (
                    <div className="border border-[#3e3e42] rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-[#2d2d30]">
                            <tr>
                              {Object.keys(queryResult[0]).map((column) => (
                                <th
                                  key={column}
                                  className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-r border-[#3e3e42] last:border-r-0"
                                >
                                  {column}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-[#1e1e1e] divide-y divide-[#2d2d30]">
                            {queryResult.map((row, index) => (
                              <tr key={index} className="hover:bg-[#252526]">
                                {Object.values(row).map((value, cellIndex) => (
                                  <td
                                    key={cellIndex}
                                    className="px-4 py-3 text-sm text-gray-300 border-r border-[#3e3e42] last:border-r-0"
                                  >
                                    {value === null || value === undefined 
                                      ? <span className="text-gray-500 italic">null</span>
                                      : typeof value === 'object'
                                        ? JSON.stringify(value)
                                        : String(value)
                                    }
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 py-8">
                      <Database className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                      <p className="text-sm">No data returned</p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="chart" className="h-full m-0">
              <div className="h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-600" />
                  <p className="text-sm">Chart visualization coming soon</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>


    </div>
  );
}