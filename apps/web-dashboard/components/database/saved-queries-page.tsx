'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bookmark, Play, Edit, Trash2, Search, Plus, Save, X } from 'lucide-react';

interface SavedQuery {
  id: string;
  name: string;
  sql: string;
  created_at: string;
  updated_at: string;
}

interface SavedQueriesPageProps {
  activeTenant: string;
  onLoadQuery: (sql: string, name: string) => void;
}

export function SavedQueriesPage({ activeTenant, onLoadQuery }: SavedQueriesPageProps) {
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingQuery, setEditingQuery] = useState<SavedQuery | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Load saved queries from localStorage
  useEffect(() => {
    const loadQueries = () => {
      try {
        const queries = localStorage.getItem(`sql-queries-${activeTenant}`);
        if (queries) {
          setSavedQueries(JSON.parse(queries));
        }
      } catch (error) {
        console.warn('Failed to load saved queries:', error);
      }
    };
    
    if (activeTenant) {
      loadQueries();
    }
  }, [activeTenant]);

  // Filter queries based on search term
  const filteredQueries = savedQueries.filter(query =>
    query.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    query.sql.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Save queries to localStorage
  const saveQueries = (queries: SavedQuery[]) => {
    setSavedQueries(queries);
    localStorage.setItem(`sql-queries-${activeTenant}`, JSON.stringify(queries));
  };

  // Create new query
  const createNewQuery = () => {
    const newQuery: SavedQuery = {
      id: `query_${Date.now()}`,
      name: 'New Query',
      sql: 'SELECT 1;',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setEditingQuery(newQuery);
    setIsCreatingNew(true);
  };

  // Save query (create or update)
  const saveQuery = (query: SavedQuery) => {
    if (isCreatingNew) {
      saveQueries([query, ...savedQueries]);
      setIsCreatingNew(false);
    } else {
      const updatedQueries = savedQueries.map(q => 
        q.id === query.id 
          ? { ...query, updated_at: new Date().toISOString() }
          : q
      );
      saveQueries(updatedQueries);
    }
    setEditingQuery(null);
  };

  // Delete query
  const deleteQuery = (queryId: string) => {
    const updatedQueries = savedQueries.filter(q => q.id !== queryId);
    saveQueries(updatedQueries);
    if (editingQuery?.id === queryId) {
      setEditingQuery(null);
      setIsCreatingNew(false);
    }
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingQuery(null);
    setIsCreatingNew(false);
  };

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-[#2d2d30] bg-[#1e1e1e] px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Bookmark className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">Saved Queries</h1>
              <p className="text-sm text-gray-400">Your personal query collection</p>
            </div>
          </div>
          
          <Button
            onClick={createNewQuery}
            variant="outline"
            size="sm"
            className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
          >
            <Plus className="h-3 w-3 mr-1" />
            New Query
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search saved queries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#2d2d30] border border-[#3e3e42] rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Edit Modal */}
        {editingQuery && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-[#1e1e1e] border border-[#3e3e42] rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-[#3e3e42]">
                <h2 className="text-lg font-semibold text-white">
                  {isCreatingNew ? 'Create New Query' : 'Edit Query'}
                </h2>
                <Button
                  onClick={cancelEditing}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="p-4 flex-1 overflow-y-auto">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Query Name
                  </label>
                  <input
                    type="text"
                    value={editingQuery.name}
                    onChange={(e) => setEditingQuery({ ...editingQuery, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#2d2d30] border border-[#3e3e42] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Enter query name..."
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    SQL Query
                  </label>
                  <textarea
                    value={editingQuery.sql}
                    onChange={(e) => setEditingQuery({ ...editingQuery, sql: e.target.value })}
                    className="w-full h-64 px-3 py-2 bg-[#2d2d30] border border-[#3e3e42] rounded-md text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                    placeholder="Enter your SQL query..."
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-2 p-4 border-t border-[#3e3e42]">
                <Button
                  onClick={cancelEditing}
                  variant="outline"
                  size="sm"
                  className="h-8 px-3"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => saveQuery(editingQuery)}
                  size="sm"
                  className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={!editingQuery.name.trim() || !editingQuery.sql.trim()}
                >
                  <Save className="h-3 w-3 mr-1" />
                  Save Query
                </Button>
              </div>
            </div>
          </div>
        )}

        {filteredQueries.length === 0 ? (
          <div className="text-center py-12">
            <Bookmark className="h-12 w-12 mx-auto mb-4 text-gray-600" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">
              {searchTerm ? 'No matching queries found' : 'No saved queries yet'}
            </h3>
            <p className="text-gray-400 mb-4">
              {searchTerm ? 'Try a different search term' : 'Create your first saved query to get started'}
            </p>
            {!searchTerm && (
              <Button
                onClick={createNewQuery}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Query
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredQueries.map((query) => (
              <div
                key={query.id}
                className="bg-[#2d2d30] border border-[#3e3e42] rounded-lg p-4 hover:border-emerald-500 transition-colors group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-white mb-1 truncate">{query.name}</h3>
                    <p className="text-xs text-gray-400">
                      Updated {new Date(query.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      onClick={() => onLoadQuery(query.sql, query.name)}
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/20"
                      title="Load query"
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                    <Button
                      onClick={() => setEditingQuery(query)}
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                      title="Edit query"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      onClick={() => deleteQuery(query.id)}
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      title="Delete query"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="bg-[#1e1e1e] border border-[#3e3e42] rounded p-3">
                  <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono overflow-x-auto max-h-32 overflow-y-auto">
                    {query.sql.length > 150 ? query.sql.substring(0, 150) + '...' : query.sql}
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