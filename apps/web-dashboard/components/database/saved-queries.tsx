'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Save,
  Search,
  Play,
  Edit,
  Trash2,
  Tag,
  Clock,
  Copy,
  Download,
  Upload,
  Star,
  History
} from 'lucide-react';
import { SavedQuery, QueryHistoryItem, useQueryStorage } from '@/hooks/use-query-storage';
import { formatDistanceToNow } from 'date-fns';

interface SavedQueriesProps {
  currentSQL: string;
  onLoadQuery: (sql: string) => void;
  onExecuteQuery: (sql: string) => void;
  onQueryExecuted?: (sql: string, status: 'success' | 'error', metadata?: any) => void;
}

export function SavedQueries({ currentSQL, onLoadQuery, onExecuteQuery, onQueryExecuted }: SavedQueriesProps) {
  const {
    savedQueries,
    queryHistory,
    saveQuery,
    updateQuery,
    deleteQuery,
    addToHistory,
    clearHistory,
    searchQueries,
    getAllTags
  } = useQueryStorage();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [editingQuery, setEditingQuery] = useState<SavedQuery | null>(null);
  const [queryName, setQueryName] = useState('');
  const [queryDescription, setQueryDescription] = useState('');
  const [queryTags, setQueryTags] = useState('');

  const filteredQueries = searchTerm 
    ? searchQueries(searchTerm)
    : selectedTag 
      ? savedQueries.filter(q => q.tags?.includes(selectedTag))
      : savedQueries;

  const handleSaveQuery = () => {
    if (!queryName.trim() || !currentSQL.trim()) return;

    const tags = queryTags.split(',').map(t => t.trim()).filter(t => t);

    if (editingQuery) {
      updateQuery(editingQuery.id, {
        name: queryName,
        description: queryDescription,
        sql: currentSQL,
        tags
      });
      setEditingQuery(null);
    } else {
      saveQuery(queryName, currentSQL, queryDescription, tags);
    }

    // Reset form
    setQueryName('');
    setQueryDescription('');
    setQueryTags('');
    setSaveDialogOpen(false);
  };

  const handleEditQuery = (query: SavedQuery) => {
    setEditingQuery(query);
    setQueryName(query.name);
    setQueryDescription(query.description || '');
    setQueryTags(query.tags?.join(', ') || '');
    setSaveDialogOpen(true);
  };

  const handleExecuteQuery = (sql: string) => {
    onExecuteQuery(sql);
    
    // Add to history (simplified - in real app you'd track actual execution results)
    if (onQueryExecuted) {
      onQueryExecuted(sql, 'success', { executedAt: new Date() });
    } else {
      addToHistory(sql, 'success');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const exportQueries = () => {
    const data = {
      queries: savedQueries,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `saved-queries-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importQueries = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.queries && Array.isArray(data.queries)) {
          data.queries.forEach((query: any) => {
            saveQuery(
              query.name,
              query.sql,
              query.description,
              query.tags
            );
          });
        }
      } catch (error) {
        console.error('Error importing queries:', error);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Query Library</h3>
        <div className="flex gap-2">
          <input
            type="file"
            accept=".json"
            onChange={importQueries}
            className="hidden"
            id="import-queries"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('import-queries')?.click()}
          >
            <Upload className="h-4 w-4 mr-1" />
            Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportQueries}
            disabled={savedQueries.length === 0}
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={!currentSQL.trim()}>
                <Save className="h-4 w-4 mr-1" />
                Save Query
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingQuery ? 'Update Query' : 'Save Query'}
                </DialogTitle>
                <DialogDescription>
                  {editingQuery ? 'Update the details of your query' : 'Save your current query for later use'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Name *</label>
                  <Input
                    value={queryName}
                    onChange={(e) => setQueryName(e.target.value)}
                    placeholder="Enter query name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={queryDescription}
                    onChange={(e) => setQueryDescription(e.target.value)}
                    placeholder="Optional description"
                    className="mt-1"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Tags</label>
                  <Input
                    value={queryTags}
                    onChange={(e) => setQueryTags(e.target.value)}
                    placeholder="tag1, tag2, tag3"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
                </div>
                <div>
                  <label className="text-sm font-medium">SQL Preview</label>
                  <pre className="text-xs bg-gray-50 p-2 rounded border mt-1 max-h-32 overflow-y-auto">
                    {currentSQL}
                  </pre>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSaveDialogOpen(false);
                    setEditingQuery(null);
                    setQueryName('');
                    setQueryDescription('');
                    setQueryTags('');
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveQuery} disabled={!queryName.trim()}>
                  {editingQuery ? 'Update' : 'Save'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search queries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <select
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
          className="px-3 py-2 border rounded-md text-sm bg-white"
        >
          <option value="">All tags</option>
          {getAllTags().map(tag => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>
      </div>

      {/* Saved Queries */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Star className="h-4 w-4" />
            Saved Queries ({filteredQueries.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredQueries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm || selectedTag ? 'No queries match your filters' : 'No saved queries yet'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredQueries.map(query => (
                <div key={query.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{query.name}</h4>
                      {query.description && (
                        <p className="text-xs text-gray-600 mt-1">{query.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(query.updatedAt, { addSuffix: true })}
                      </div>
                    </div>
                    <div className="flex gap-1 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onLoadQuery(query.sql)}
                        title="Load query"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleExecuteQuery(query.sql)}
                        title="Execute query"
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(query.sql)}
                        title="Copy SQL"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditQuery(query)}
                        title="Edit query"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Delete query"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Query</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{query.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteQuery(query.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  {query.tags && query.tags.length > 0 && (
                    <div className="flex gap-1 mb-2">
                      {query.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          <Tag className="h-2 w-2 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <pre className="text-xs bg-gray-50 p-2 rounded border max-h-20 overflow-y-auto">
                    {query.sql}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Query History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Query History ({queryHistory.length})
            </div>
            {queryHistory.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    Clear History
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear Query History</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to clear all query history? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={clearHistory}>
                      Clear History
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {queryHistory.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No query history yet
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {queryHistory.slice(0, 10).map(item => (
                <div key={item.id} className="border rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(item.executedAt, { addSuffix: true })}
                      <Badge variant={item.status === 'success' ? 'default' : 'destructive'} className="text-xs">
                        {item.status}
                      </Badge>
                      {item.duration && (
                        <span>{item.duration}ms</span>
                      )}
                      {item.rowCount !== undefined && (
                        <span>{item.rowCount} rows</span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onLoadQuery(item.sql)}
                        title="Load query"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleExecuteQuery(item.sql)}
                        title="Execute query"
                      >
                        <Play className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(item.sql)}
                        title="Copy SQL"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <pre className="text-xs bg-gray-50 p-2 rounded border max-h-16 overflow-y-auto">
                    {item.sql}
                  </pre>
                  {item.error && (
                    <div className="text-xs text-red-600 mt-2 p-2 bg-red-50 rounded border">
                      {item.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}