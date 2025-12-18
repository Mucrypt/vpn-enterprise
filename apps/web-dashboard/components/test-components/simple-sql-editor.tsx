'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Save, FileText } from 'lucide-react';

interface SimpleSqlEditorProps {
  value?: string;
  sql?: string;
  onChange?: (value: string) => void;
  setSql?: (sql: string) => void;
  onExecute?: (query: string) => void;
  runQuery?: () => void;
  onSave?: (query: string) => void;
  cancelQuery?: () => void;
  isLoading?: boolean;
  queryStatus?: "running" | "idle" | "cancelled";
  placeholder?: string;
  className?: string;
}

export function SimpleSqlEditor({
  value = '',
  sql,
  onChange,
  setSql,
  onExecute,
  runQuery,
  onSave,
  cancelQuery,
  isLoading = false,
  queryStatus = 'idle',
  placeholder = "-- Write your SQL query here\nSELECT * FROM users LIMIT 10;",
  className = ''
}: SimpleSqlEditorProps) {
  const [query, setQuery] = useState(value || sql || '');

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    onChange?.(newValue);
    setSql?.(newValue);
  };

  const handleExecute = () => {
    if (runQuery) {
      runQuery();
    } else {
      onExecute?.(query);
    }
  };

  const handleSave = () => {
    onSave?.(query);
  };

  const handleCancel = () => {
    cancelQuery?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl/Cmd + Enter to execute
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
    }
    
    // Ctrl/Cmd + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }

    // Tab handling for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.target as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = query.substring(0, start) + '  ' + query.substring(end);
      setQuery(newValue);
      onChange?.(newValue);
      
      // Set cursor position after tab
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="relative border rounded-lg">
        {/* Line numbers */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gray-50 border-r text-xs text-gray-500 p-2 select-none">
          {query.split('\n').map((_, index) => (
            <div key={index} className="leading-6">
              {index + 1}
            </div>
          ))}
        </div>
        
        {/* Editor textarea */}
        <textarea
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full h-64 pl-14 pr-4 py-2 font-mono text-sm resize-none border-0 focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-lg"
          spellCheck={false}
        />
      </div>
      
      {/* Action buttons */}
      <div className="flex gap-2">
        {queryStatus === 'running' || isLoading ? (
          <Button onClick={handleCancel} variant="destructive" size="sm">
            Cancel
          </Button>
        ) : (
          <Button onClick={handleExecute} size="sm">
            <Play className="h-4 w-4 mr-1" />
            Execute
          </Button>
        )}
        <Button onClick={handleSave} variant="outline" size="sm">
          <Save className="h-4 w-4 mr-1" />
          Save
        </Button>
        <Button variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-1" />
          Format
        </Button>
      </div>
      
      {/* Keyboard shortcuts info */}
      <div className="text-xs text-gray-500">
        <span className="font-mono">Ctrl+Enter</span> to execute, <span className="font-mono">Ctrl+S</span> to save
      </div>
    </div>
  );
}