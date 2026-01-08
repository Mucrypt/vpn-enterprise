'use client';

import React, { useState, useCallback, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Play,
  Heart,
  Settings,
  ChevronDown,
  Maximize2,
  Code,
  X,
  AlertCircle,
  Clock,
  Database,
  BarChart3,
  Plus
} from 'lucide-react';
import { getSuggestionForError } from '@/lib/sql-utils';

interface SqlEditorPageLightProps {
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

// Memoized result table to prevent unnecessary re-renders
const ResultTable = memo(({ data }: { data: any[] }) => {
  if (!data || data.length === 0) return null;
  
  const columns = Object.keys(data[0]);
  
  return (
    <div className="border border-[#3e3e42] rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#2d2d30]">
            <tr>
              {columns.map((column) => (
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
            {data.map((row, index) => (
              <tr key={index} className="hover:bg-[#252526]">
                {columns.map((column, cellIndex) => {
                  const value = row[column];
                  return (
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
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

ResultTable.displayName = 'ResultTable';

// Professional SQL syntax highlighter - Returns React elements like the original
function highlightSQLLine(line: string): React.ReactElement[] {
  if (!line) return [<span key="empty" style={{ color: '#d4d4d4' }}>{line || '\n'}</span>];
  
  const tokens: React.ReactElement[] = [];
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
  const allMatches: Array<{start: number, end: number, type: string, text: string}> = [];
  
  // Comments (highest priority)
  let match;
  commentRegex.lastIndex = 0;
  while ((match = commentRegex.exec(line)) !== null) {
    allMatches.push({ start: match.index, end: match.index + match[0].length, type: 'comment', text: match[0] });
  }
  
  // Only process non-comment parts
  const commentRanges = allMatches.filter(m => m.type === 'comment');
  
  const isInCommentRange = (position: number) => {
    return commentRanges.some(range => position >= range.start && position < range.end);
  };
  
  // Keywords
  keywordRegex.lastIndex = 0;
  while ((match = keywordRegex.exec(line)) !== null) {
    if (!isInCommentRange(match.index)) {
      allMatches.push({ start: match.index, end: match.index + match[0].length, type: 'keyword', text: match[0] });
    }
  }
  
  // Strings
  stringRegex.lastIndex = 0;
  while ((match = stringRegex.exec(line)) !== null) {
    if (!isInCommentRange(match.index)) {
      allMatches.push({ start: match.index, end: match.index + match[0].length, type: 'string', text: match[0] });
    }
  }
  
  // Numbers
  numberRegex.lastIndex = 0;
  while ((match = numberRegex.exec(line)) !== null) {
    if (!isInCommentRange(match.index)) {
      allMatches.push({ start: match.index, end: match.index + match[0].length, type: 'number', text: match[0] });
    }
  }
  
  // Functions
  functionRegex.lastIndex = 0;
  while ((match = functionRegex.exec(line)) !== null) {
    if (!isInCommentRange(match.index)) {
      allMatches.push({ start: match.index, end: match.index + match[1].length, type: 'function', text: match[1] });
    }
  }
  
  // Sort by start position
  allMatches.sort((a, b) => a.start - b.start);
  
  // Remove overlaps (keep first match in case of overlap)
  const filteredMatches: typeof allMatches = [];
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
    
    // Add highlighted match with VS Code colors
    const colors: Record<string, React.CSSProperties> = {
      keyword: { color: '#569CD6', fontWeight: 500 },
      string: { color: '#CE9178' },
      number: { color: '#B5CEA8' },
      comment: { color: '#6A9955', fontStyle: 'italic' },
      function: { color: '#DCDCAA', fontWeight: 500 }
    };
    
    tokens.push(
      <span key={`${match.type}-${index}`} style={colors[match.type]}>
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

function highlightSQLText(code: string): React.ReactElement[] {
  if (!code) return [];
  
  const lines = code.split('\n');
  return lines.map((line, lineIndex) => (
    <div key={lineIndex}>
      {highlightSQLLine(line)}
    </div>
  ));
}

export function SqlEditorPageLight({
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
}: SqlEditorPageLightProps) {
  const [activeTab, setActiveTab] = useState<'results' | 'chart'>('results');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const highlightRef = React.useRef<HTMLDivElement>(null);
  const lineNumbersRef = React.useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      runQuery();
    }
  }, [runQuery]);

  const handleScroll = useCallback(() => {
    if (textareaRef.current && highlightRef.current && lineNumbersRef.current) {
      const scrollTop = textareaRef.current.scrollTop;
      const scrollLeft = textareaRef.current.scrollLeft;
      highlightRef.current.scrollTop = scrollTop;
      highlightRef.current.scrollLeft = scrollLeft;
      lineNumbersRef.current.scrollTop = scrollTop;
    }
  }, []);

  const saveCurrentQuery = useCallback(() => {
    if (!sql.trim() || !activeTenant) return;
    
    try {
      const saved = localStorage.getItem(`sql-queries-${activeTenant}`);
      const queries = saved ? JSON.parse(saved) : [];
      const newQuery = {
        id: `query_${Date.now()}`,
        name: activeQueryName || 'Untitled query',
        sql: sql.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      queries.unshift(newQuery);
      localStorage.setItem(`sql-queries-${activeTenant}`, JSON.stringify(queries.slice(0, 50)));
    } catch (error) {
      console.warn('Failed to save query:', error);
    }
  }, [sql, activeTenant, activeQueryName]);

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] overflow-hidden">
      {/* Top Header Bar - Supabase Style */}
      <div className="shrink-0 border-b border-[#2d2d30] bg-[#181818] px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Left Side - Plus Icon */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                setSql('-- New query\n');
                setActiveQueryName('Untitled query');
              }}
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-gray-400 hover:text-white hover:bg-[#2d2d30]"
              title="New query"
            >
              <Plus className="h-4 w-4" />
            </Button>
            
            <div className="h-4 w-px bg-[#2d2d30]"></div>
            
            <span className="text-xs text-gray-400">{activeQueryName}</span>
          </div>
          
          {/* Right Side - Action Icons and Role */}
          <div className="flex items-center gap-2">
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
            
            <div className="h-4 w-px bg-[#2d2d30] mx-1"></div>
            
            {/* Role Badge */}
            <div className="flex items-center gap-1.5 px-2 py-1 bg-[#2d2d30] border border-[#3e3e42] rounded text-xs">
              <span className="text-gray-500">Role:</span>
              <span className="text-gray-300">postgres</span>
            </div>
          </div>
        </div>
      </div>

      {/* Professional SQL Editor with Advanced Syntax Highlighting */}
      <div className="shrink-0 bg-[#1e1e1e] border-b border-[#2d2d30] relative overflow-hidden" style={{ height: '400px' }}>
        {/* Line numbers */}
        <div 
          ref={lineNumbersRef}
          className="absolute left-0 top-0 bottom-0 w-12 bg-[#181818] border-r border-[#2d2d30] overflow-hidden pointer-events-none select-none z-10"
        >
          <div className="py-4 font-mono text-xs leading-6 text-gray-600 text-right pr-2">
            {sql.split('\n').map((_, index) => (
              <div key={index} style={{ height: '24px' }}>{index + 1}</div>
            ))}
          </div>
        </div>
        
        {/* Syntax highlighted background */}
        <div 
          ref={highlightRef as any}
          className="absolute inset-0 pl-16 pr-4 py-4 font-mono text-sm overflow-hidden pointer-events-none select-none"
          style={{ 
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            lineHeight: '1.5rem',
            fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', 'Consolas', monospace"
          }}
        >
          {highlightSQLText(sql)}
        </div>
        
        {/* Actual textarea on top */}
        <textarea
          ref={textareaRef}
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          className="absolute inset-0 w-full h-full bg-transparent pl-16 pr-4 py-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 overflow-auto"
          placeholder=""
          spellCheck={false}
          style={{
            caretColor: '#D4D4D4',
            lineHeight: '1.5rem',
            color: 'transparent',
            WebkitTextFillColor: 'transparent',
            fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', 'Consolas', monospace",
            tabSize: 2,
            scrollbarWidth: 'thin',
            scrollbarColor: '#4a5568 transparent'
          }}
        />
        
        {/* Editor hints overlay */}
        {!sql.trim() && (
          <div className="absolute inset-0 pl-16 pr-4 py-4 pointer-events-none select-none">
            <div className="text-sm text-gray-600 font-mono italic" style={{ lineHeight: '1.5rem' }}>
              <div>-- Write your SQL query here</div>
              <div>-- Press Ctrl+Enter to execute</div>
            </div>
          </div>
        )}
      </div>

      {/* Control Bar - Between Editor and Results */}
      <div className="shrink-0 border-b border-[#2d2d30] bg-[#181818] px-6 py-2.5">
        <div className="flex items-center justify-between">
          {/* Left Side - Tabs */}
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
            
            {/* Status */}
            {queryStatus === 'running' && (
              <div className="flex items-center text-xs text-blue-400">
                <div className="w-2.5 h-2.5 border border-blue-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                Executing query...
              </div>
            )}
            {queryStatus === 'cancelled' && (
              <div className="flex items-center text-xs text-yellow-400">
                <AlertCircle className="h-3 w-3 mr-1" />
                Query cancelled
              </div>
            )}
            {executionTime && queryStatus === 'idle' && (
              <div className="flex items-center text-xs text-gray-400">
                <Clock className="h-3 w-3 mr-1" />
                Executed in {executionTime}ms
              </div>
            )}
          </div>
          
          {/* Right Side - Run Button Only */}
          <div className="flex items-center gap-3">
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
                onClick={() => runQuery()}
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
                  <div className="text-sm text-red-300 whitespace-pre-wrap font-mono mb-2">
                    {queryError}
                  </div>
                  {getSuggestionForError(queryError) && (
                    <div className="text-xs text-yellow-300 mt-3 p-2 bg-[#2d2d30] rounded border border-[#3e3e42]">
                      {getSuggestionForError(queryError)}
                    </div>
                  )}
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
                  <>
                    <div className="mb-4 text-sm text-gray-400">
                      {queryResult.length} row{queryResult.length !== 1 ? 's' : ''} returned
                      {executionTime && ` in ${executionTime}ms`}
                    </div>
                    <ResultTable data={queryResult} />
                  </>
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
  );
}
