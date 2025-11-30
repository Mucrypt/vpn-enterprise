import { useState, useEffect } from 'react';

export interface SavedQuery {
  id: string;
  name: string;
  description?: string;
  sql: string;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
}

export interface QueryHistoryItem {
  id: string;
  sql: string;
  executedAt: Date;
  duration?: number;
  rowCount?: number;
  status: 'success' | 'error';
  error?: string;
}

const STORAGE_KEYS = {
  SAVED_QUERIES: 'visual-query-builder-saved-queries',
  QUERY_HISTORY: 'visual-query-builder-query-history'
};

export function useQueryStorage() {
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [queryHistory, setQueryHistory] = useState<QueryHistoryItem[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const savedQueriesData = localStorage.getItem(STORAGE_KEYS.SAVED_QUERIES);
      if (savedQueriesData) {
        const queries = JSON.parse(savedQueriesData).map((q: any) => ({
          ...q,
          createdAt: new Date(q.createdAt),
          updatedAt: new Date(q.updatedAt)
        }));
        setSavedQueries(queries);
      }

      const historyData = localStorage.getItem(STORAGE_KEYS.QUERY_HISTORY);
      if (historyData) {
        const history = JSON.parse(historyData).map((h: any) => ({
          ...h,
          executedAt: new Date(h.executedAt)
        }));
        setQueryHistory(history);
      }
    } catch (error) {
      console.error('Error loading query storage:', error);
    }
  }, []);

  // Save queries to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SAVED_QUERIES, JSON.stringify(savedQueries));
    } catch (error) {
      console.error('Error saving queries:', error);
    }
  }, [savedQueries]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.QUERY_HISTORY, JSON.stringify(queryHistory));
    } catch (error) {
      console.error('Error saving query history:', error);
    }
  }, [queryHistory]);

  const saveQuery = (name: string, sql: string, description?: string, tags?: string[]) => {
    const newQuery: SavedQuery = {
      id: `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      sql,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags
    };
    setSavedQueries(prev => [...prev, newQuery]);
    return newQuery;
  };

  const updateQuery = (id: string, updates: Partial<Omit<SavedQuery, 'id' | 'createdAt'>>) => {
    setSavedQueries(prev => prev.map(query => 
      query.id === id 
        ? { ...query, ...updates, updatedAt: new Date() }
        : query
    ));
  };

  const deleteQuery = (id: string) => {
    setSavedQueries(prev => prev.filter(query => query.id !== id));
  };

  const addToHistory = (sql: string, status: 'success' | 'error', metadata?: {
    duration?: number;
    rowCount?: number;
    error?: string;
  }) => {
    const historyItem: QueryHistoryItem = {
      id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sql,
      executedAt: new Date(),
      status,
      ...metadata
    };
    
    setQueryHistory(prev => {
      const newHistory = [historyItem, ...prev];
      // Keep only the last 100 items
      return newHistory.slice(0, 100);
    });
    
    return historyItem;
  };

  const clearHistory = () => {
    setQueryHistory([]);
  };

  const searchQueries = (searchTerm: string): SavedQuery[] => {
    if (!searchTerm.trim()) return savedQueries;
    
    const term = searchTerm.toLowerCase();
    return savedQueries.filter(query => 
      query.name.toLowerCase().includes(term) ||
      query.description?.toLowerCase().includes(term) ||
      query.sql.toLowerCase().includes(term) ||
      query.tags?.some(tag => tag.toLowerCase().includes(term))
    );
  };

  const getQueriesByTag = (tag: string): SavedQuery[] => {
    return savedQueries.filter(query => 
      query.tags?.some(t => t.toLowerCase() === tag.toLowerCase())
    );
  };

  const getAllTags = (): string[] => {
    const tags = new Set<string>();
    savedQueries.forEach(query => {
      query.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  };

  return {
    savedQueries,
    queryHistory,
    saveQuery,
    updateQuery,
    deleteQuery,
    addToHistory,
    clearHistory,
    searchQueries,
    getQueriesByTag,
    getAllTags
  };
}