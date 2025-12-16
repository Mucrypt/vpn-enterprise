import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as monaco from 'monaco-editor';

interface AdvancedSQLEditorProps {
  initialValue?: string;
  onChange?: (value: string) => void;
  onExecute?: (sql: string) => void;
  onSelectionExecute?: (selectedSql: string) => void;
  height?: string;
  theme?: 'vs-dark' | 'vs-light';
  readOnly?: boolean;
  showMinimap?: boolean;
  enableSuggestions?: boolean;
  schemas?: Array<{ name: string; tables: Array<{ name: string; columns: Array<{ name: string; type: string }> }> }>;
}

export const AdvancedSQLEditor: React.FC<AdvancedSQLEditorProps> = ({ 
  initialValue = 'SELECT 1;', 
  onChange,
  onExecute,
  onSelectionExecute,
  height = '400px',
  theme = 'vs-dark',
  readOnly = false,
  showMinimap = true,
  enableSuggestions = true,
  schemas = []
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setupSQLLanguageFeatures = useCallback(() => {
    // Register SQL keywords and functions
    monaco.languages.setMonarchTokensProvider('sql', {
      keywords: [
        'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'FROM', 'WHERE', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'OUTER',
        'ON', 'AS', 'AND', 'OR', 'NOT', 'NULL', 'TRUE', 'FALSE', 'LIKE', 'IN', 'EXISTS', 'BETWEEN',
        'ORDER', 'BY', 'GROUP', 'HAVING', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX',
        'CREATE', 'ALTER', 'DROP', 'TABLE', 'INDEX', 'VIEW', 'FUNCTION', 'TRIGGER', 'SCHEMA',
        'DATABASE', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'UNIQUE', 'CHECK', 'DEFAULT',
        'CASCADE', 'RESTRICT', 'SET', 'GRANT', 'REVOKE', 'COMMIT', 'ROLLBACK', 'TRANSACTION'
      ],
      operators: ['=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=', '<>', '&&', '||', '++', '--'],
      symbols: /[=><!~?:&|+\-*\/\^%]+/,
      tokenizer: {
        root: [
          [/[a-z_$][\w$]*/, { cases: { '@keywords': 'keyword', '@default': 'identifier' } }],
          [/[A-Z][\w\$]*/, { cases: { '@keywords': 'keyword.uppercase', '@default': 'type.identifier' } }],
          [/"([^"\\]|\\.)*$/, 'string.invalid'],
          [/"/, 'string', '@string_double'],
          [/'([^'\\]|\\.)*$/, 'string.invalid'],
          [/'/, 'string', '@string_single'],
          [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
          [/\d+/, 'number'],
          [/[;,.]/, 'delimiter'],
          [/[()]/, '@brackets'],
          [/@symbols/, { cases: { '@operators': 'operator', '@default': '' } }],
          [/\s+/, 'white']
        ],
        string_double: [
          [/[^\\"]+/, 'string'],
          [/"/, 'string', '@pop']
        ],
        string_single: [
          [/[^\\']+/, 'string'],
          [/'/, 'string', '@pop']
        ]
      }
    });

    // Register completion provider for SQL
    const completionProvider = monaco.languages.registerCompletionItemProvider('sql', {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        };

        const suggestions: monaco.languages.CompletionItem[] = [];

        // SQL Keywords
        const sqlKeywords = [
          'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'FROM', 'WHERE', 'JOIN', 'INNER JOIN', 'LEFT JOIN',
          'RIGHT JOIN', 'FULL JOIN', 'ON', 'AS', 'AND', 'OR', 'NOT', 'NULL', 'TRUE', 'FALSE',
          'LIKE', 'IN', 'EXISTS', 'BETWEEN', 'ORDER BY', 'GROUP BY', 'HAVING', 'DISTINCT',
          'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE',
          'CREATE INDEX', 'DROP INDEX', 'CREATE VIEW', 'DROP VIEW'
        ];

        sqlKeywords.forEach(keyword => {
          suggestions.push({
            label: keyword,
            kind: monaco.languages.CompletionItemKind.Keyword,
            insertText: keyword,
            range: range
          });
        });

        // Schema and table suggestions
        schemas.forEach(schema => {
          suggestions.push({
            label: schema.name,
            kind: monaco.languages.CompletionItemKind.Module,
            insertText: schema.name,
            range: range,
            detail: 'Schema'
          });

          schema.tables.forEach(table => {
            suggestions.push({
              label: `${schema.name}.${table.name}`,
              kind: monaco.languages.CompletionItemKind.Class,
              insertText: `${schema.name}.${table.name}`,
              range: range,
              detail: 'Table'
            });

            table.columns.forEach(column => {
              suggestions.push({
                label: column.name,
                kind: monaco.languages.CompletionItemKind.Field,
                insertText: column.name,
                range: range,
                detail: `${column.type} - ${table.name}.${column.name}`
              });
            });
          });
        });

        return { suggestions };
      }
    });

    return completionProvider;
  }, [schemas]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Configure Monaco environment
    monaco.editor.defineTheme('supabase-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '569CD6', fontStyle: 'bold' },
        { token: 'keyword.uppercase', foreground: '569CD6', fontStyle: 'bold' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic' }
      ],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#d4d4d4',
        'editorLineNumber.foreground': '#858585',
        'editor.selectionBackground': '#264f78',
        'editor.inactiveSelectionBackground': '#3a3d41'
      }
    });

    // Create editor
    const editor = monaco.editor.create(containerRef.current, {
      value: initialValue,
      language: 'sql',
      theme: theme === 'vs-dark' ? 'supabase-dark' : 'vs-light',
      readOnly: readOnly,
      minimap: { enabled: showMinimap },
      fontSize: 14,
      lineNumbers: 'on',
      roundedSelection: false,
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      wordWrap: 'on',
      suggest: {
        showKeywords: true,
        showSnippets: true,
        showFunctions: true
      },
      quickSuggestions: enableSuggestions,
      contextmenu: true,
      selectOnLineNumbers: true,
      folding: true,
      renderLineHighlight: 'all',
      cursorBlinking: 'blink'
    });

    editorRef.current = editor;

    // Setup onChange handler
    const onChangeDisposable = editor.onDidChangeModelContent(() => {
      if (onChange) {
        onChange(editor.getValue());
      }
    });

    // Setup SQL language features
    const completionProvider = setupSQLLanguageFeatures();

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      const selectedText = editor.getModel()?.getValueInRange(editor.getSelection()!);
      if (selectedText?.trim() && onSelectionExecute) {
        onSelectionExecute(selectedText);
      } else if (onExecute) {
        onExecute(editor.getValue());
      }
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => {
      if (onExecute) {
        onExecute(editor.getValue());
      }
    });

    setIsLoading(false);

    return () => {
      onChangeDisposable?.dispose();
      completionProvider?.dispose();
      editor.dispose();
    };
  }, [initialValue, theme, readOnly, showMinimap, enableSuggestions, onExecute, onSelectionExecute, setupSQLLanguageFeatures]);

  const executeQuery = () => {
    if (!editorRef.current || !onExecute) return;
    onExecute(editorRef.current.getValue());
  };

  const executeSelection = () => {
    if (!editorRef.current || !onSelectionExecute) return;
    const selectedText = editorRef.current.getModel()?.getValueInRange(editorRef.current.getSelection()!);
    if (selectedText?.trim()) {
      onSelectionExecute(selectedText);
    }
  };

  const formatSQL = () => {
    if (!editorRef.current) return;
    editorRef.current.getAction('editor.action.formatDocument')?.run();
  };

  return (
    <div className="sql-editor-container">
      <div className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800 border-b">
        <div className="flex items-center gap-2">
          <button
            onClick={executeQuery}
            className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors flex items-center gap-1"
            disabled={isLoading}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h6m-6 4h6m-6 4h6M12 21l9-5-9-5-9 5 9 5z" />
            </svg>
            Run (Ctrl+Enter)
          </button>
          {onSelectionExecute && (
            <button
              onClick={executeSelection}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
              disabled={isLoading}
            >
              Run Selection
            </button>
          )}
          <button
            onClick={formatSQL}
            className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
            disabled={isLoading}
          >
            Format
          </button>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Ctrl+Enter: Run | Ctrl+Shift+Enter: Run All
        </div>
      </div>
      <div 
        ref={containerRef}
        style={{ height }}
        className="border-0"
      />
    </div>
  );
};
