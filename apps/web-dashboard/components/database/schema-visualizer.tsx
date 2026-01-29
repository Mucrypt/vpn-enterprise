'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Download,
  RefreshCw,
  Eye,
  EyeOff,
  Database,
  Table,
  Key,
  Link,
  ArrowRight,
  Filter,
  X,
  Settings
} from 'lucide-react';
interface TableInfo {
  name: string;
  schema: string;
  columns: ColumnInfo[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  primary_key: boolean;
  foreign_key?: {
    table: string;
    column: string;
    schema: string;
  };
}

interface Relationship {
  from: {
    table: string;
    schema: string;
    column: string;
  };
  to: {
    table: string;
    schema: string;
    column: string;
  };
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
}

interface SchemaVisualizerProps {
  activeTenant: string;
  onClose: () => void;
}

export default function DatabaseSchemaVisualizer({ activeTenant, onClose }: SchemaVisualizerProps) {
  
  // State
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSchema, setSelectedSchema] = useState<string>('public');
  const [schemas, setSchemas] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [showRelationships, setShowRelationships] = useState(true);
  
  // Refs
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Load schemas
  useEffect(() => {
    const loadSchemas = async () => {
      if (!activeTenant) return;
      
      try {
        const response = await fetch(`/api/v1/tenants/${activeTenant}/schemas`);
        if (response.ok) {
          const result = await response.json();
          setSchemas(result.schemas.map((s: any) => s.name));
          if (result.schemas.length > 0) {
            setSelectedSchema(result.schemas[0].name);
          }
        }
      } catch (error) {
        console.error('Error loading schemas:', error);
      }
    };
    
    loadSchemas();
  }, [activeTenant]);

  // Load schema data
  const loadSchemaData = async () => {
    if (!activeTenant || !selectedSchema) return;
    
    setLoading(true);
    try {
      // Load tables for the schema
      const tablesResponse = await fetch(`/api/v1/tenants/${activeTenant}/schemas/${selectedSchema}/tables`);
      if (!tablesResponse.ok) throw new Error('Failed to fetch tables');
      
      const tablesResult = await tablesResponse.json();
      
      // Load column details for each table
      const tablesWithColumns = await Promise.all(
        tablesResult.tables.map(async (table: any) => {
          const columnsResponse = await fetch(
            `/api/v1/tenants/${activeTenant}/tables/${selectedSchema}.${table.name}/columns`
          );
          
          if (columnsResponse.ok) {
            const columnsResult = await columnsResponse.json();
            return {
              name: table.name,
              schema: selectedSchema,
              columns: columnsResult.columns
            };
          }
          return {
            name: table.name,
            schema: selectedSchema,
            columns: []
          };
        })
      );
      
      // Load foreign key relationships
      const relationshipsResponse = await fetch(
        `/api/v1/tenants/${activeTenant}/schemas/${selectedSchema}/relationships`
      );
      
      let relationshipsData: Relationship[] = [];
      if (relationshipsResponse.ok) {
        const result = await relationshipsResponse.json();
        relationshipsData = result.relationships || [];
      }
      
      // Auto-layout tables in a grid
      const layoutTables = autoLayoutTables(tablesWithColumns);
      
      setTables(layoutTables);
      setRelationships(relationshipsData);
      
    } catch (error) {
      console.error('Error loading schema data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSchema) {
      loadSchemaData();
    }
  }, [selectedSchema, activeTenant]);

  // Auto-layout algorithm
  const autoLayoutTables = (tables: TableInfo[]): TableInfo[] => {
    const PADDING = 20;
    const TABLE_WIDTH = 250;
    const COLUMN_HEIGHT = 25;
    const HEADER_HEIGHT = 40;
    
    const cols = Math.ceil(Math.sqrt(tables.length));
    
    return tables.map((table, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      
      const tableHeight = HEADER_HEIGHT + (table.columns.length * COLUMN_HEIGHT) + PADDING;
      
      return {
        ...table,
        x: col * (TABLE_WIDTH + PADDING * 2) + PADDING,
        y: row * (tableHeight + PADDING) + PADDING,
        width: TABLE_WIDTH,
        height: tableHeight
      };
    });
  };

  // Handle mouse events for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Zoom controls
  const handleZoomIn = () => setZoom(Math.min(zoom * 1.2, 3));
  const handleZoomOut = () => setZoom(Math.max(zoom / 1.2, 0.3));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Filter tables by search
  const filteredTables = tables.filter(table =>
    table.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    table.columns.some(col => 
      col.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Render relationship lines
  const renderRelationships = () => {
    if (!showRelationships) return null;
    
    return relationships.map((rel, index) => {
      const fromTable = tables.find(t => t.name === rel.from.table && t.schema === rel.from.schema);
      const toTable = tables.find(t => t.name === rel.to.table && t.schema === rel.to.schema);
      
      if (!fromTable || !toTable || 
          typeof fromTable.x !== 'number' || typeof fromTable.y !== 'number' || 
          typeof fromTable.width !== 'number' || typeof fromTable.height !== 'number' ||
          typeof toTable.x !== 'number' || typeof toTable.y !== 'number' || 
          typeof toTable.width !== 'number' || typeof toTable.height !== 'number') {
        return null;
      }
      
      const fromX = fromTable.x + fromTable.width / 2;
      const fromY = fromTable.y + fromTable.height / 2;
      const toX = toTable.x + toTable.width / 2;
      const toY = toTable.y + toTable.height / 2;
      
      return (
        <g key={index}>
          <line
            x1={fromX}
            y1={fromY}
            x2={toX}
            y2={toY}
            stroke="#10b981"
            strokeWidth="2"
            markerEnd="url(#arrowhead)"
          />
          <text
            x={(fromX + toX) / 2}
            y={(fromY + toY) / 2 - 10}
            fill="#10b981"
            fontSize="12"
            textAnchor="middle"
          >
            {rel.type}
          </text>
        </g>
      );
    });
  };

  return (
    <div className="h-full bg-[#1e1e1e] flex flex-col border-l border-[#2d2d30]">
      {/* Header */}
      <div className="shrink-0 border-b border-[#2d2d30] bg-[#1e1e1e] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-white flex items-center gap-2">
              <Database className="h-5 w-5" />
              Schema Visualizer
            </h1>
            <select
              value={selectedSchema}
              onChange={(e) => setSelectedSchema(e.target.value)}
              className="px-3 py-1 bg-[#2d2d30] border border-[#3e3e42] rounded text-white text-sm"
            >
              {schemas.map(schema => (
                <option key={schema} value={schema}>{schema}</option>
              ))}
            </select>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>{tables.length} tables</span>
              <span>•</span>
              <span>{relationships.length} relationships</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowRelationships(!showRelationships)}
              variant="outline"
              size="sm"
              className={`h-8 px-3 ${showRelationships ? 'bg-emerald-600 text-white' : ''}`}
            >
              <Link className="h-3 w-3 mr-1" />
              Relations
            </Button>
            
            <Button
              onClick={loadSchemaData}
              variant="outline"
              size="sm"
              className="h-8 px-3"
              disabled={loading}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
              className="h-8 px-3"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex items-center gap-4 mt-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search tables and columns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#2d2d30] border-[#3e3e42] text-white"
            />
          </div>
          
          <div className="flex items-center gap-1 bg-[#2d2d30] rounded-md p-1">
            <Button
              onClick={handleZoomOut}
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
            >
              <ZoomOut className="h-3 w-3" />
            </Button>
            <span className="text-xs text-gray-400 px-2 min-w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              onClick={handleZoomIn}
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
            >
              <ZoomIn className="h-3 w-3" />
            </Button>
            <Button
              onClick={handleResetView}
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
            >
              <Maximize className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Schema Diagram */}
      <div className="flex-1 overflow-hidden relative bg-[#0d1117]">
        <svg
          ref={svgRef}
          className="w-full h-full cursor-grab"
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="10"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="#10b981"
              />
            </marker>
          </defs>
          
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Render relationships first (behind tables) */}
            {renderRelationships()}
            
            {/* Render tables */}
            {filteredTables.map((table) => (
              <g
                key={`${table.schema}.${table.name}`}
                onClick={() => setSelectedTable(
                  selectedTable === `${table.schema}.${table.name}` ? null : `${table.schema}.${table.name}`
                )}
                className="cursor-pointer"
              >
                {/* Table container */}
                <rect
                  x={table.x || 0}
                  y={table.y || 0}
                  width={table.width || 250}
                  height={table.height || 200}
                  fill={selectedTable === `${table.schema}.${table.name}` ? '#374151' : '#1f2937'}
                  stroke={selectedTable === `${table.schema}.${table.name}` ? '#10b981' : '#4b5563'}
                  strokeWidth="2"
                  rx="8"
                />
                
                {/* Table header */}
                <rect
                  x={table.x || 0}
                  y={table.y || 0}
                  width={table.width || 250}
                  height={40}
                  fill="#374151"
                  rx="8"
                />
                <rect
                  x={table.x || 0}
                  y={(table.y || 0) + 32}
                  width={table.width || 250}
                  height={8}
                  fill="#374151"
                />
                
                {/* Table icon and name */}
                <g transform={`translate(${(table.x || 0) + 12}, ${(table.y || 0) + 8})`}>
                  <Table className="h-4 w-4" fill="#fbbf24" />
                </g>
                <text
                  x={(table.x || 0) + 35}
                  y={(table.y || 0) + 25}
                  fill="#ffffff"
                  fontSize="14"
                  fontWeight="bold"
                >
                  {table.name}
                </text>
                
                {/* Columns */}
                {table.columns.map((column, colIndex) => (
                  <g key={column.name}>
                    <text
                      x={(table.x || 0) + 12}
                      y={(table.y || 0) + 55 + colIndex * 25}
                      fill={column.primary_key ? '#fbbf24' : '#d1d5db'}
                      fontSize="12"
                    >
                      {column.primary_key && (
                        <tspan>
                          <Key className="h-3 w-3 inline" />
                        </tspan>
                      )}
                      {column.name}
                    </text>
                    <text
                      x={(table.x || 0) + (table.width || 250) - 12}
                      y={(table.y || 0) + 55 + colIndex * 25}
                      fill="#9ca3af"
                      fontSize="10"
                      textAnchor="end"
                    >
                      {column.type}
                    </text>
                    {column.foreign_key && (
                      <text
                        x={(table.x || 0) + (table.width || 250) - 25}
                        y={(table.y || 0) + 55 + colIndex * 25}
                        fill="#10b981"
                        fontSize="10"
                        textAnchor="end"
                      >
                        FK
                      </text>
                    )}
                  </g>
                ))}
              </g>
            ))}
          </g>
        </svg>
        
        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-[#1e1e1e] rounded-lg p-4 flex items-center gap-3">
              <RefreshCw className="h-4 w-4 animate-spin text-emerald-400" />
              <span className="text-white">Loading schema...</span>
            </div>
          </div>
        )}
      </div>

      {/* Table details sidebar */}
      {selectedTable && (
        <div className="absolute right-0 top-0 w-80 h-full bg-[#1e1e1e] border-l border-[#2d2d30] shadow-xl">
          <div className="p-4 border-b border-[#2d2d30]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Table Details</h3>
              <Button
                onClick={() => setSelectedTable(null)}
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          <div className="p-4 space-y-4">
            {/* Table info would go here */}
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2">Table: {selectedTable}</h4>
              {/* Add more detailed table information here */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}