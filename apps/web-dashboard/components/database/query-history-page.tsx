'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Clock, Play, Trash2, Search } from 'lucide-react';

interface SavedQuery {
  id: string;
  name: string;
  sql: string;
  created_at: string;
  updated_at: string;
}

interface QueryHistoryPageProps {
  activeTenant: string;
  onLoadQuery: (sql: string, name: string) => void;
}

export function QueryHistoryPage({ activeTenant, onLoadQuery }: QueryHistoryPageProps) {
  const [queryHistory, setQueryHistory] = useState<SavedQuery[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Load query history from localStorage
  useEffect(() => {
    const loadHistory = () => {
      try {
        const history = localStorage.getItem(`sql-history-${activeTenant}`);
        if (history) {
          setQueryHistory(JSON.parse(history));
        }
      } catch (error) {
        console.warn('Failed to load query history:', error);
      }
    };
    
    if (activeTenant) {
      loadHistory();
    }
  }, [activeTenant]);

  // Filter history based on search term
  const filteredHistory = queryHistory.filter(query =>
    query.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    query.sql.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Clear all history
  const clearHistory = () => {
    setQueryHistory([]);
    localStorage.removeItem(`sql-history-${activeTenant}`);
  };

  // Delete single query from history
  const deleteQuery = (queryId: string) => {
    const updatedHistory = queryHistory.filter(q => q.id !== queryId);
    setQueryHistory(updatedHistory);
    localStorage.setItem(`sql-history-${activeTenant}`, JSON.stringify(updatedHistory));
  };

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      {/* Header */}
      <div className="shrink-0 border-b border-[#2d2d30] bg-[#1e1e1e] px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Clock className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">Query History</h1>
              <p className="text-sm text-gray-400">Recently executed queries</p>
            </div>
          </div>
          
          {queryHistory.length > 0 && (
            <Button
              onClick={clearHistory}
              variant="outline"
              size="sm"
              className="h-8 px-3 text-gray-400 border-gray-600 hover:text-white hover:border-gray-400"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear All
            </Button>
          )}
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search history..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#2d2d30] border border-[#3e3e42] rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 mx-auto mb-4 text-gray-600" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">
              {searchTerm ? 'No matching queries found' : 'No query history yet'}
            </h3>
            <p className="text-gray-400">
              {searchTerm ? 'Try a different search term' : 'Execute some SQL queries to see them here'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredHistory.map((query) => (
              <div
                key={query.id}
                className="bg-[#2d2d30] border border-[#3e3e42] rounded-lg p-4 hover:border-blue-500 transition-colors group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-white mb-1">{query.name}</h3>
                    <p className="text-xs text-gray-400">
                      {new Date(query.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      onClick={() => onLoadQuery(query.sql, query.name)}
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                    <Button
                      onClick={() => deleteQuery(query.id)}
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="bg-[#1e1e1e] border border-[#3e3e42] rounded p-3">
                  <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono overflow-x-auto">
                    {query.sql.length > 200 ? query.sql.substring(0, 200) + '...' : query.sql}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}