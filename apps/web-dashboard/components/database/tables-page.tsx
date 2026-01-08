'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Download,
  X,
  Database,
  Hash,
  Key
} from 'lucide-react';
import EnhancedTableDataViewer from './enhanced-table-data-viewer';
import { TableStructureEditor } from './table-structure-editor';
import DatabaseSchemaVisualizer from './schema-visualizer';

interface TablesPageProps {
  activeTenant: string;
  onCreateTable: () => void;
}

interface DatabaseTable {
  name: string;
  schema: string;
  description?: string;
  rows: number;
  size: string;
  realtime_enabled: boolean;
  columns: number;
}

export function TablesPage({ activeTenant, onCreateTable }: TablesPageProps) {
  const [tables, setTables] = useState<DatabaseTable[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchema, setSelectedSchema] = useState<string>('public');
  const [schemas, setSchemas] = useState<string[]>(['public']);
  const [viewingTable, setViewingTable] = useState<{ name: string; schema: string } | null>(null);
  const [editingTable, setEditingTable] = useState<{ name: string; schema: string } | null>(null);
  const [rightPanelWidth, setRightPanelWidth] = useState(50); // Percentage
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartWidth, setDragStartWidth] = useState(50);
  const [panelMode, setPanelMode] = useState<'view' | 'edit' | 'schema' | null>(null);
  const [isCompactMode, setIsCompactMode] = useState(false);
  const [showTableDetails, setShowTableDetails] = useState(true);

  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragStartWidth(rightPanelWidth);
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    e.preventDefault();
  };

  const handleDragMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const containerWidth = window.innerWidth;
    const deltaX = e.clientX - dragStartX;
    const deltaPercent = (deltaX / containerWidth) * 100;
    const newWidth = Math.min(Math.max(dragStartWidth - deltaPercent, 30), 85);
    
    // Auto-enable compact mode when left panel gets too narrow
    const leftPanelWidth = 100 - newWidth;
    setIsCompactMode(leftPanelWidth < 40);
    setShowTableDetails(leftPanelWidth > 45);
    
    setRightPanelWidth(newWidth);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
  };

  const loadSchemas = async () => {
    if (!activeTenant) return;
    
    try {
      console.log(`Loading schemas for tenant: ${activeTenant}`);
      const response = await fetch(`/api/v1/tenants/${activeTenant}/schemas`);
      if (!response.ok) {
        console.warn(`Failed to load schemas (${response.status}), using default`);
        setSchemas(['public']);
        return;
      }
      
      const data = await response.json();
      console.log('Schemas response:', data);
      const schemaNames = data.data?.map((schema: any) => schema.schema_name || schema.name) || ['public'];
      setSchemas(schemaNames);
      
      // Set first schema as default if public doesn't exist
      if (schemaNames.length > 0 && !schemaNames.includes('public')) {
        setSelectedSchema(schemaNames[0]);
      }
    } catch (error) {
      console.error('Error loading schemas:', error);
      setSchemas(['public']);
    }
  };

  const loadTables = async () => {
    if (!activeTenant) return;
    
    setLoading(true);
    try {
      console.log(`[TablesPage] Loading tables for tenant: ${activeTenant}, schema: ${selectedSchema}`);
      
      // Load tables from the selected schema
      const response = await fetch(`/api/v1/tenants/${activeTenant}/schemas/${selectedSchema}/tables`);
      if (!response.ok) {
        // Try to get more detailed error information
        let errorDetails = response.statusText;
        try {
          const errorBody = await response.json();
          errorDetails = errorBody.error || errorBody.message || response.statusText;
        } catch {
          // If we can't parse JSON, use statusText
        }
        console.error(`[TablesPage] API Error: ${response.status} - ${errorDetails}`);
        throw new Error(`Failed to load tables: ${errorDetails}`);
      }
      
      const data = await response.json();
      console.log('[TablesPage] Tables API response:', data);
      
      // Handle both response formats: { data: [...] } from UnifiedDataAPI or { tables: [...] } from tenants route
      const tablesData = data.data || data.tables || [];
      console.log('[TablesPage] Raw tables data:', tablesData);
      console.log('[TablesPage] Tables count:', tablesData.length);
      
      // Filter to only include BASE TABLEs (exclude VIEWs)
      const actualTables = tablesData.filter((table: any) => 
        (table.table_type || table.type) === 'BASE TABLE'
      );
      console.log('[TablesPage] Filtered BASE TABLEs:', actualTables.length);
      
      // Transform API data to match our interface (simplified - no nested API calls for now)
      const transformedTables: DatabaseTable[] = actualTables.map((table: any) => ({
        name: table.table_name || table.name,
        schema: selectedSchema,
        description: table.comment || table.table_comment || 'No description',
        rows: 0, // Will be loaded later or on demand
        size: '0 kB', // Will be calculated later or on demand
        realtime_enabled: false,
        columns: table.column_count || 0
      }));
      
      console.log('[TablesPage] Transformed tables:', transformedTables);
      console.log('[TablesPage] Setting tables state with', transformedTables.length, 'tables');
      setTables(transformedTables);
    } catch (error) {
      console.error('[TablesPage] Error loading tables:', error);
      // Set empty tables array instead of crashing
      setTables([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTenant) {
      loadSchemas();
    }
  }, [activeTenant]);

  useEffect(() => {
    if (activeTenant && selectedSchema) {
      loadTables();
    }
  }, [activeTenant, selectedSchema]);

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
    };
  }, []);

  const filteredTables = tables.filter(table => {
    const matchesSearch = table.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSchema = selectedSchema === 'all' || table.schema === selectedSchema;
    return matchesSearch && matchesSchema;
  });

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      {/* Header */}
      <div className="shrink-0 border-b border-[#2d2d30] bg-[#1e1e1e]">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className={`transition-all duration-300 ${isCompactMode && panelMode ? 'opacity-80' : ''}`}>
              <h1 className={`font-semibold text-white flex items-center gap-2 transition-all duration-300 ${
                isCompactMode && panelMode ? 'text-lg' : 'text-xl'
              }`}>
                <Table className={`transition-all duration-300 ${
                  isCompactMode && panelMode ? 'h-4 w-4' : 'h-5 w-5'
                }`} />
                {(!isCompactMode || !panelMode) && 'Database Tables'}
                {isCompactMode && panelMode && 'Tables'}
              </h1>
              {(!isCompactMode || !panelMode) && (
                <p className="text-sm text-gray-400 mt-1">
                  Manage your database tables, view data, and configure settings
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {panelMode && (
                <Button
                  onClick={() => {
                    setRightPanelWidth(rightPanelWidth > 60 ? 45 : 70);
                    const newLeftWidth = rightPanelWidth > 60 ? 55 : 30;
                    setIsCompactMode(newLeftWidth < 35);
                    setShowTableDetails(newLeftWidth > 40);
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white hover:bg-[#2d2d30]"
                  title="Toggle layout"
                >
                  {isCompactMode ? (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 002 2m0 0v10" />
                    </svg>
                  )}
                </Button>
              )}
              <Button
                onClick={() => {
                  setPanelMode('schema');
                  setRightPanelWidth(70);
                  setIsCompactMode(true);
                  setShowTableDetails(false);
                }}
                variant="outline"
                size="sm"
                className={`transition-all duration-300 ${
                  panelMode === 'schema' ? 'bg-emerald-600 text-white border-emerald-600' : ''
                } ${isCompactMode && panelMode ? 'px-2' : 'px-3'}`}
              >
                <Database className="h-4 w-4 mr-1" />
                {(!isCompactMode || !panelMode) ? 'Schema' : 'ERD'}
              </Button>
              <Button 
                onClick={onCreateTable}
                className={`bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-300 ${
                  isCompactMode && panelMode ? 'px-2' : 'px-4'
                }`}
              >
                <Plus className="h-4 w-4 mr-2" />
                {(!isCompactMode || !panelMode) ? 'New table' : 'New'}
              </Button>
            </div>
          </div>
          
          {/* Filters and Search */}
          <div className="flex items-center gap-4">
            {/* Schema Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">schema</span>
              <select
                value={selectedSchema}
                onChange={(e) => setSelectedSchema(e.target.value)}
                className="bg-[#2d2d30] border border-[#3e3e42] rounded-md px-3 py-1.5 text-sm text-white min-w-24"
              >
                <option value="all">All schemas</option>
                {schemas.map(schema => (
                  <option key={schema} value={schema}>{schema}</option>
                ))}
              </select>
              <X className="h-4 w-4 text-gray-500 cursor-pointer hover:text-gray-300" />
            </div>

            {/* Search */}
            <div className={`relative transition-all duration-300 ${
              isCompactMode && panelMode ? 'w-full' : 'flex-1 max-w-md'
            }`}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder={isCompactMode && panelMode ? "Search..." : "Search for a table"}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#2d2d30] border-[#3e3e42] text-white placeholder-gray-500"
              />
            </div>

            {(!isCompactMode || !panelMode) && (
              <Button variant="outline" size="sm" className="border-[#3e3e42] text-gray-300 hover:bg-[#2d2d30]">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`flex-1 overflow-hidden relative ${
        panelMode ? 'flex' : ''
      }`}>
        {/* Tables List */}
        <div 
          className={`${panelMode ? '' : 'w-full'} overflow-auto transition-all duration-300`}
          style={{
            width: panelMode ? `${100 - rightPanelWidth}%` : '100%'
          }}
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-400">Loading tables...</div>
            </div>
        ) : filteredTables.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Table className="h-16 w-16 mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No tables found</h3>
            <p className="text-sm text-gray-500 mb-4">
              {searchQuery ? 'No tables match your search criteria' : 'Get started by creating your first table'}
            </p>
            {!searchQuery && (
              <Button 
                onClick={onCreateTable}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create table
              </Button>
            )}
          </div>
        ) : (
          <div className="p-0">
            {/* Table Header */}
            <div className="bg-[#181818] border-b border-[#2d2d30] px-4 py-3 transition-all duration-300 backdrop-blur-sm">
              {isCompactMode ? (
                <div className="flex justify-between items-center">
                  <div className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                    <Table className="h-3 w-3 text-emerald-400" />
                    Tables
                  </div>
                  <div className="text-xs text-gray-500 bg-[#2d2d30] px-2 py-1 rounded-md">
                    {filteredTables.length} {filteredTables.length === 1 ? 'table' : 'tables'}
                  </div>
                </div>
              ) : (
                <div className={`transition-all duration-300 ${
                  showTableDetails 
                    ? 'grid grid-cols-12 gap-4' 
                    : 'grid grid-cols-8 gap-3'
                } text-xs font-semibold text-gray-300 uppercase tracking-wider`}>
                  <div className="col-span-3 flex items-center gap-2">
                    <Table className="h-3 w-3 text-emerald-400" />
                    Name
                  </div>
                  {showTableDetails && (
                    <>
                      <div className="col-span-3">Description</div>
                      <div className="col-span-2">Rows</div>
                      <div className="col-span-2">Size</div>
                      <div className="col-span-1">Realtime</div>
                    </>
                  )}
                  {!showTableDetails && (
                    <>
                      <div className="col-span-2">Rows</div>
                      <div className="col-span-2">Status</div>
                    </>
                  )}
                  <div className="col-span-1 text-right">Actions</div>
                </div>
              )}
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-[#2d2d30]">
              {filteredTables.map((table) => (
                <div 
                  key={`${table.schema}.${table.name}`}
                  className={`px-4 hover:bg-[#252526] transition-all duration-200 group cursor-pointer ${
                    isCompactMode ? 'py-2' : 'py-4'
                  }`}
                  onClick={() => {
                    if (isCompactMode) {
                      setViewingTable({ name: table.name, schema: table.schema });
                      setEditingTable(null);
                      setPanelMode('view');
                    }
                  }}
                >
                  {isCompactMode ? (
                    /* Compact Mode Layout */
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 bg-[#2d2d30] rounded flex items-center justify-center shrink-0">
                          <Table className="h-3 w-3 text-emerald-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-white text-sm truncate">{table.name}</div>
                          <div className="text-xs text-gray-400">
                            {table.rows.toLocaleString()} rows
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-[#3e3e42]"
                          title="View data"
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingTable({ name: table.name, schema: table.schema });
                            setEditingTable(null);
                            setPanelMode('view');
                          }}
                        >
                          <Eye className="h-2.5 w-2.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-[#3e3e42]"
                          title="Edit structure"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTable({ name: table.name, schema: table.schema });
                            setViewingTable(null);
                            setPanelMode('edit');
                          }}
                        >
                          <Edit className="h-2.5 w-2.5" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Full Layout */
                    <div className={`transition-all duration-300 items-center ${
                      showTableDetails 
                        ? 'grid grid-cols-12 gap-4' 
                        : 'grid grid-cols-8 gap-3'
                    }`}>
                      {/* Name */}
                      <div className="col-span-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-[#2d2d30] rounded flex items-center justify-center">
                            <Table className="h-4 w-4 text-emerald-400" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-white text-sm truncate">{table.name}</div>
                            <div className="text-xs text-gray-400">
                              {table.columns} columns
                            </div>
                          </div>
                        </div>
                      </div>

                      {showTableDetails ? (
                        <>
                          {/* Description */}
                          <div className="col-span-3">
                            <span className="text-sm text-gray-300 truncate block">
                              {table.description || 'No description'}
                            </span>
                          </div>

                          {/* Rows */}
                          <div className="col-span-2">
                            <span className="text-sm text-white font-mono">
                              {table.rows.toLocaleString()}
                            </span>
                          </div>

                          {/* Size */}
                          <div className="col-span-2">
                            <span className="text-sm text-white font-mono">
                              {table.size}
                            </span>
                          </div>

                          {/* Realtime */}
                          <div className="col-span-1">
                            {table.realtime_enabled ? (
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                <span className="text-xs text-gray-400">On</span>
                              </div>
                            ) : (
                              <X className="h-4 w-4 text-gray-500" />
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Compact: Rows */}
                          <div className="col-span-2">
                            <span className="text-sm text-white font-mono">
                              {table.rows.toLocaleString()}
                            </span>
                          </div>

                          {/* Compact: Status */}
                          <div className="col-span-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">{table.size}</span>
                              {table.realtime_enabled && (
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" title="Realtime enabled"></div>
                              )}
                            </div>
                          </div>
                        </>
                      )}

                      {/* Actions */}
                      <div className="col-span-1">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 hover:bg-[#3e3e42]"
                            title="View table data"
                            onClick={() => {
                              setViewingTable({ name: table.name, schema: table.schema });
                              setEditingTable(null);
                              setPanelMode('view');
                            }}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 hover:bg-[#3e3e42]"
                            title="Edit table structure"
                            onClick={() => {
                              setEditingTable({ name: table.name, schema: table.schema });
                              setViewingTable(null);
                              setPanelMode('edit');
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 hover:bg-[#3e3e42]"
                            title="More options"
                          >
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        </div>

        {/* Resize Handle */}
        {panelMode && (
          <div
            className={`w-1 bg-[#2d2d30] hover:bg-emerald-500 cursor-col-resize transition-all duration-200 relative group select-none ${
              isDragging ? 'bg-emerald-500 shadow-lg' : ''
            }`}
            onMouseDown={handleDragStart}
          >
            {/* Visual indicator */}
            <div className="absolute inset-y-0 -left-1 -right-1 flex items-center justify-center">
              <div className={`w-0.5 bg-current opacity-40 group-hover:opacity-100 transition-all duration-200 ${
                isDragging ? 'opacity-100 h-16 animate-pulse' : 'h-12'
              }`}></div>
            </div>
            
            {/* Resize dots */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-0 group-hover:opacity-60 transition-opacity pointer-events-none">
              <div className="w-0.5 h-0.5 bg-white rounded-full"></div>
              <div className="w-0.5 h-0.5 bg-white rounded-full"></div>
              <div className="w-0.5 h-0.5 bg-white rounded-full"></div>
            </div>
            
            {/* Hover tooltip */}
            <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 bg-gray-900 text-xs text-gray-200 px-2 py-1 rounded shadow-lg whitespace-nowrap pointer-events-none border border-gray-700 ${
              isDragging ? 'opacity-100 scale-105' : 'opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100'
            }`}>
              {isDragging ? `${Math.round(rightPanelWidth)}%` : 'Drag to resize'}
            </div>
            
            {/* Active drag indicator */}
            {isDragging && (
              <div className="absolute inset-0 bg-emerald-500/20 animate-pulse"></div>
            )}
          </div>
        )}

        {/* Side Panel */}
        {panelMode && (
          <div 
            className="h-full flex flex-col bg-[#1e1e1e] transition-all duration-300"
            style={{
              width: `${rightPanelWidth}%`
            }}
          >
            {/* Panel Header */}
            <div className="shrink-0 border-b border-[#2d2d30] bg-[#252526] px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {panelMode === 'view' ? (
                    <Eye className="h-4 w-4 text-emerald-400" />
                  ) : panelMode === 'edit' ? (
                    <Edit className="h-4 w-4 text-emerald-400" />
                  ) : panelMode === 'schema' ? (
                    <Database className="h-4 w-4 text-emerald-400" />
                  ) : null}
                  <h3 className="font-medium text-white">
                    {panelMode === 'view' && viewingTable && `Viewing: ${viewingTable.schema}.${viewingTable.name}`}
                    {panelMode === 'edit' && editingTable && `Editing: ${editingTable.schema}.${editingTable.name}`}
                    {panelMode === 'schema' && 'Database Schema Visualizer'}
                  </h3>
                </div>
                <div className="flex items-center gap-1">
                  {/* Maximize/Minimize buttons */}
                  <Button
                    onClick={() => setRightPanelWidth(rightPanelWidth > 60 ? 50 : 75)}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-[#3e3e42]"
                    title={rightPanelWidth > 60 ? 'Minimize panel' : 'Maximize panel'}
                  >
                    {rightPanelWidth > 60 ? (
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    ) : (
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      setViewingTable(null);
                      setEditingTable(null);
                      setPanelMode(null);
                      setRightPanelWidth(50);
                    }}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-[#3e3e42]"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-hidden">
              {panelMode === 'view' && viewingTable && (
                <EnhancedTableDataViewer
                  activeTenant={activeTenant}
                  tableName={viewingTable.name}
                  schemaName={viewingTable.schema}
                  onClose={() => {
                    setViewingTable(null);
                    setPanelMode(null);
                  }}
                />
              )}
              
              {panelMode === 'edit' && editingTable && (
                <TableStructureEditor
                  tableName={editingTable.name}
                  schemaName={editingTable.schema}
                  activeTenant={activeTenant}
                  onClose={() => {
                    setEditingTable(null);
                    setPanelMode(null);
                  }}
                  onTableUpdated={() => {
                    setEditingTable(null);
                    setPanelMode(null);
                    loadTables(); // Reload tables after structure update
                  }}
                />
              )}
              
              {panelMode === 'schema' && (
                <DatabaseSchemaVisualizer
                  activeTenant={activeTenant}
                  onClose={() => {
                    setPanelMode(null);
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}