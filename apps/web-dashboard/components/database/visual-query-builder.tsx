'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Plus,
  Trash2,
  Link,
  Table as TableIcon,
  Filter,
  SortAsc,
  SortDesc,
  ArrowRight,
  Code,
  Eye,
  X,
  Columns,
  Database
} from 'lucide-react';

interface Column {
  name: string;
  type: string;
  table: string;
  schema: string;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
}

interface Table {
  name: string;
  schema: string;
  columns: Column[];
  alias?: string;
}

interface JoinCondition {
  id: string;
  leftTable: string;
  leftColumn: string;
  operator: string;
  rightTable: string;
  rightColumn: string;
  joinType: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
}

interface FilterCondition {
  id: string;
  column: string;
  operator: string;
  value: string;
  logicalOperator?: 'AND' | 'OR';
}

interface SortCondition {
  id: string;
  column: string;
  direction: 'ASC' | 'DESC';
}

interface SelectedColumn {
  id: string;
  table: string;
  column: string;
  alias?: string;
  aggregation?: 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX';
}

interface VisualQueryBuilderProps {
  availableTables: Table[];
  onQueryGenerated: (sql: string) => void;
  onExecuteQuery: (sql: string) => void;
}

export function VisualQueryBuilder({ availableTables, onQueryGenerated, onExecuteQuery }: VisualQueryBuilderProps) {
  const [selectedTables, setSelectedTables] = useState<Table[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<SelectedColumn[]>([]);
  const [joins, setJoins] = useState<JoinCondition[]>([]);
  const [filters, setFilters] = useState<FilterCondition[]>([]);
  const [sorts, setSorts] = useState<SortCondition[]>([]);
  const [generatedSQL, setGeneratedSQL] = useState<string>('');
  const [showSQL, setShowSQL] = useState<boolean>(false);
  const [limit, setLimit] = useState<number>(100);

  // Generate SQL whenever the query components change
  useEffect(() => {
    generateSQL();
  }, [selectedTables, selectedColumns, joins, filters, sorts, limit]);

  const generateSQL = useCallback(() => {
    if (selectedTables.length === 0 || selectedColumns.length === 0) {
      setGeneratedSQL('');
      onQueryGenerated('');
      return;
    }

    let sql = 'SELECT ';

    // Add columns with aggregations and aliases
    const columnParts = selectedColumns.map(col => {
      const fullColumn = `${col.table}.${col.column}`;
      let columnSQL = col.aggregation ? `${col.aggregation}(${fullColumn})` : fullColumn;
      if (col.alias) {
        columnSQL += ` AS ${col.alias}`;
      }
      return columnSQL;
    });
    sql += columnParts.join(', ');

    // Add FROM clause
    sql += `\nFROM ${selectedTables[0].schema}.${selectedTables[0].name}`;
    if (selectedTables[0].alias) {
      sql += ` AS ${selectedTables[0].alias}`;
    }

    // Add JOINs
    joins.forEach(join => {
      sql += `\n${join.joinType} JOIN ${join.rightTable} ON ${join.leftTable}.${join.leftColumn} ${join.operator} ${join.rightTable}.${join.rightColumn}`;
    });

    // Add WHERE conditions
    if (filters.length > 0) {
      sql += '\nWHERE ';
      const filterParts = filters.map((filter, index) => {
        const operator = filter.operator === 'LIKE' ? `LIKE '%${filter.value}%'` : 
                        filter.operator === 'IN' ? `IN (${filter.value})` :
                        `${filter.operator} '${filter.value}'`;
        const condition = `${filter.column} ${operator}`;
        return index > 0 && filter.logicalOperator ? `${filter.logicalOperator} ${condition}` : condition;
      });
      sql += filterParts.join(' ');
    }

    // Add GROUP BY (if aggregations are used)
    const hasAggregations = selectedColumns.some(col => col.aggregation);
    const nonAggregatedColumns = selectedColumns.filter(col => !col.aggregation);
    if (hasAggregations && nonAggregatedColumns.length > 0) {
      sql += '\nGROUP BY ';
      sql += nonAggregatedColumns.map(col => `${col.table}.${col.column}`).join(', ');
    }

    // Add ORDER BY
    if (sorts.length > 0) {
      sql += '\nORDER BY ';
      sql += sorts.map(sort => `${sort.column} ${sort.direction}`).join(', ');
    }

    // Add LIMIT
    if (limit > 0) {
      sql += `\nLIMIT ${limit}`;
    }

    sql += ';';
    
    setGeneratedSQL(sql);
    onQueryGenerated(sql);
  }, [selectedTables, selectedColumns, joins, filters, sorts, limit, onQueryGenerated]);

  const addTable = (table: Table) => {
    if (!selectedTables.find(t => t.name === table.name && t.schema === table.schema)) {
      const newTable = { ...table, alias: `${table.name}_${selectedTables.length + 1}` };
      setSelectedTables([...selectedTables, newTable]);
    }
  };

  const removeTable = (tableKey: string) => {
    const [schema, name] = tableKey.split('.');
    setSelectedTables(selectedTables.filter(t => !(t.schema === schema && t.name === name)));
    // Remove related columns, joins, filters
    setSelectedColumns(selectedColumns.filter(col => col.table !== `${schema}.${name}`));
    setJoins(joins.filter(join => !join.leftTable.startsWith(`${schema}.${name}`) && !join.rightTable.startsWith(`${schema}.${name}`)));
    setFilters(filters.filter(filter => !filter.column.startsWith(`${schema}.${name}`)));
    setSorts(sorts.filter(sort => !sort.column.startsWith(`${schema}.${name}`)));
  };

  const addColumn = (table: Table, column: Column) => {
    const newColumn: SelectedColumn = {
      id: `${Date.now()}_${Math.random()}`,
      table: `${table.schema}.${table.name}`,
      column: column.name,
    };
    setSelectedColumns([...selectedColumns, newColumn]);
  };

  const removeColumn = (columnId: string) => {
    setSelectedColumns(selectedColumns.filter(col => col.id !== columnId));
  };

  const updateColumn = (columnId: string, updates: Partial<SelectedColumn>) => {
    setSelectedColumns(selectedColumns.map(col => 
      col.id === columnId ? { ...col, ...updates } : col
    ));
  };

  const addJoin = () => {
    if (selectedTables.length < 2) return;
    
    const newJoin: JoinCondition = {
      id: `join_${Date.now()}`,
      leftTable: `${selectedTables[0].schema}.${selectedTables[0].name}`,
      leftColumn: '',
      operator: '=',
      rightTable: `${selectedTables[1].schema}.${selectedTables[1].name}`,
      rightColumn: '',
      joinType: 'INNER'
    };
    setJoins([...joins, newJoin]);
  };

  const updateJoin = (joinId: string, updates: Partial<JoinCondition>) => {
    setJoins(joins.map(join => join.id === joinId ? { ...join, ...updates } : join));
  };

  const removeJoin = (joinId: string) => {
    setJoins(joins.filter(join => join.id !== joinId));
  };

  const addFilter = () => {
    if (selectedColumns.length === 0) return;
    
    const newFilter: FilterCondition = {
      id: `filter_${Date.now()}`,
      column: `${selectedColumns[0].table}.${selectedColumns[0].column}`,
      operator: '=',
      value: '',
      logicalOperator: filters.length > 0 ? 'AND' : undefined
    };
    setFilters([...filters, newFilter]);
  };

  const updateFilter = (filterId: string, updates: Partial<FilterCondition>) => {
    setFilters(filters.map(filter => filter.id === filterId ? { ...filter, ...updates } : filter));
  };

  const removeFilter = (filterId: string) => {
    setFilters(filters.filter(filter => filter.id !== filterId));
  };

  const addSort = () => {
    if (selectedColumns.length === 0) return;
    
    const newSort: SortCondition = {
      id: `sort_${Date.now()}`,
      column: `${selectedColumns[0].table}.${selectedColumns[0].column}`,
      direction: 'ASC'
    };
    setSorts([...sorts, newSort]);
  };

  const updateSort = (sortId: string, updates: Partial<SortCondition>) => {
    setSorts(sorts.map(sort => sort.id === sortId ? { ...sort, ...updates } : sort));
  };

  const removeSort = (sortId: string) => {
    setSorts(sorts.filter(sort => sort.id !== sortId));
  };

  const getAllColumns = (): Column[] => {
    return selectedTables.flatMap(table => 
      table.columns.map(col => ({ ...col, table: `${table.schema}.${table.name}` }))
    );
  };

  return (
    <div className="space-y-6 p-4 bg-[#1e1e1e] text-white min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-emerald-400" />
          <h3 className="text-lg font-semibold text-white">Visual Query Builder</h3>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSQL(!showSQL)}
            className="flex items-center gap-2"
          >
            {showSQL ? <Eye className="h-4 w-4" /> : <Code className="h-4 w-4" />}
            {showSQL ? 'Hide SQL' : 'Show SQL'}
          </Button>
          <Button
            onClick={() => generatedSQL && onExecuteQuery(generatedSQL)}
            disabled={!generatedSQL}
            size="sm"
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            Run Query
          </Button>
        </div>
      </div>

      {/* SQL Preview */}
      {showSQL && generatedSQL && (
        <Card className="bg-[#252526] border-[#3e3e42]">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2 text-white">
              <Code className="h-4 w-4 text-emerald-400" />
              Generated SQL
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-[#1e1e1e] text-white p-3 rounded border border-[#3e3e42] font-mono overflow-x-auto">
              {generatedSQL}
            </pre>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Available Tables */}
        <Card className="bg-[#252526] border-[#3e3e42]">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2 text-white">
              <TableIcon className="h-4 w-4 text-emerald-400" />
              Available Tables
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {availableTables.map(table => (
              <div
                key={`${table.schema}.${table.name}`}
                className="flex items-center justify-between p-2 border border-[#3e3e42] rounded hover:bg-[#3e3e42] cursor-pointer transition-colors"
                onClick={() => addTable(table)}
              >
                <div>
                  <div className="font-medium text-sm text-white">{table.name}</div>
                  <div className="text-xs text-gray-400">{table.schema}</div>
                </div>
                <Plus className="h-4 w-4 text-gray-400" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Selected Tables */}
        <Card className="bg-[#252526] border-[#3e3e42]">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2 text-white">
              <TableIcon className="h-4 w-4 text-emerald-400" />
              Selected Tables
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {selectedTables.map(table => (
              <div key={`${table.schema}.${table.name}`} className="border border-[#3e3e42] rounded p-2">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-medium text-sm text-white">{table.name}</div>
                    <div className="text-xs text-gray-400">{table.schema}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTable(`${table.schema}.${table.name}`)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="space-y-1">
                  {table.columns.slice(0, 3).map(column => (
                    <div
                      key={column.name}
                      className="flex items-center justify-between text-xs hover:bg-[#3e3e42] p-1 rounded cursor-pointer transition-colors"
                      onClick={() => addColumn(table, column)}
                    >
                      <span className="flex items-center gap-1 text-gray-300">
                        <Columns className="h-3 w-3" />
                        {column.name}
                      </span>
                      <span className="text-gray-400">{column.type}</span>
                    </div>
                  ))}
                  {table.columns.length > 3 && (
                    <div className="text-xs text-gray-500 px-1">
                      +{table.columns.length - 3} more columns
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Query Settings */}
        <Card className="bg-[#252526] border-[#3e3e42]">
          <CardHeader>
            <CardTitle className="text-sm text-white">Query Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-300">Limit Results</label>
              <Input
                type="number"
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value) || 0)}
                className="mt-1 bg-[#1e1e1e] border-[#3e3e42] text-white"
                min="0"
                max="10000"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Selected Columns */}
      {selectedColumns.length > 0 && (
        <Card className="bg-[#252526] border-[#3e3e42]">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2 text-white">
              <Columns className="h-4 w-4 text-emerald-400" />
              Selected Columns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {selectedColumns.map(column => (
                <div key={column.id} className="border border-[#3e3e42] rounded p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs border-emerald-400 text-emerald-400">
                      {column.table}.{column.column}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeColumn(column.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs font-medium text-gray-300">Aggregation</label>
                      <Select
                        value={column.aggregation || ''}
                        onValueChange={(value) => updateColumn(column.id, { aggregation: value as any || undefined })}
                      >
                        <SelectTrigger className="h-8 text-xs bg-[#1e1e1e] border-[#3e3e42] text-white">
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          <SelectItem value="COUNT">COUNT</SelectItem>
                          <SelectItem value="SUM">SUM</SelectItem>
                          <SelectItem value="AVG">AVG</SelectItem>
                          <SelectItem value="MIN">MIN</SelectItem>
                          <SelectItem value="MAX">MAX</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-300">Alias</label>
                      <Input
                        value={column.alias || ''}
                        onChange={(e) => updateColumn(column.id, { alias: e.target.value || undefined })}
                        className="h-8 text-xs bg-[#1e1e1e] border-[#3e3e42] text-white placeholder-gray-500"
                        placeholder="Optional alias"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Joins */}
      {selectedTables.length > 1 && (
        <Card className="bg-[#252526] border-[#3e3e42]">
          <CardHeader>
            <CardTitle className="text-sm flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Link className="h-4 w-4 text-emerald-400" />
                Joins
              </div>
              <Button variant="outline" size="sm" onClick={addJoin}>
                <Plus className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {joins.map(join => (
              <div key={join.id} className="border border-[#3e3e42] rounded p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Select
                    value={join.joinType}
                    onValueChange={(value) => updateJoin(join.id, { joinType: value as any })}
                  >
                    <SelectTrigger className="w-24 h-8 text-xs bg-[#1e1e1e] border-[#3e3e42] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INNER">INNER</SelectItem>
                      <SelectItem value="LEFT">LEFT</SelectItem>
                      <SelectItem value="RIGHT">RIGHT</SelectItem>
                      <SelectItem value="FULL">FULL</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeJoin(join.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="grid grid-cols-5 gap-2 items-center">
                  <Select
                    value={join.leftTable}
                    onValueChange={(value) => updateJoin(join.id, { leftTable: value })}
                  >
                    <SelectTrigger className="h-8 text-xs bg-[#1e1e1e] border-[#3e3e42] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedTables.map(table => (
                        <SelectItem key={`${table.schema}.${table.name}`} value={`${table.schema}.${table.name}`}>
                          {table.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={join.leftColumn}
                    onValueChange={(value) => updateJoin(join.id, { leftColumn: value })}
                  >
                    <SelectTrigger className="h-8 text-xs bg-[#1e1e1e] border-[#3e3e42] text-white">
                      <SelectValue placeholder="Column" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedTables.find(t => `${t.schema}.${t.name}` === join.leftTable)?.columns.map(col => (
                        <SelectItem key={col.name} value={col.name}>
                          {col.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="text-center text-xs text-gray-300">=</div>
                  <Select
                    value={join.rightTable}
                    onValueChange={(value) => updateJoin(join.id, { rightTable: value })}
                  >
                    <SelectTrigger className="h-8 text-xs bg-[#1e1e1e] border-[#3e3e42] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedTables.map(table => (
                        <SelectItem key={`${table.schema}.${table.name}`} value={`${table.schema}.${table.name}`}>
                          {table.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={join.rightColumn}
                    onValueChange={(value) => updateJoin(join.id, { rightColumn: value })}
                  >
                    <SelectTrigger className="h-8 text-xs bg-[#1e1e1e] border-[#3e3e42] text-white">
                      <SelectValue placeholder="Column" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedTables.find(t => `${t.schema}.${t.name}` === join.rightTable)?.columns.map(col => (
                        <SelectItem key={col.name} value={col.name}>
                          {col.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="bg-[#252526] border-[#3e3e42]">
        <CardHeader>
          <CardTitle className="text-sm flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-emerald-400" />
              Filters
            </div>
            <Button variant="outline" size="sm" onClick={addFilter} disabled={selectedColumns.length === 0}>
              <Plus className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {filters.map((filter, index) => (
            <div key={filter.id} className="border border-[#3e3e42] rounded p-3 space-y-2">
              <div className="flex items-center justify-between">
                {index > 0 && (
                  <Select
                    value={filter.logicalOperator || 'AND'}
                    onValueChange={(value) => updateFilter(filter.id, { logicalOperator: value as any })}
                  >
                    <SelectTrigger className="w-20 h-8 text-xs bg-[#1e1e1e] border-[#3e3e42] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AND">AND</SelectItem>
                      <SelectItem value="OR">OR</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFilter(filter.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <Select
                  value={filter.column}
                  onValueChange={(value) => updateFilter(filter.id, { column: value })}
                >
                  <SelectTrigger className="h-8 text-xs bg-[#1e1e1e] border-[#3e3e42] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getAllColumns().map(col => (
                      <SelectItem key={`${col.table}.${col.name}`} value={`${col.table}.${col.name}`}>
                        {col.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filter.operator}
                  onValueChange={(value) => updateFilter(filter.id, { operator: value })}
                >
                  <SelectTrigger className="h-8 text-xs bg-[#1e1e1e] border-[#3e3e42] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="=">=</SelectItem>
                    <SelectItem value="!=">!=</SelectItem>
                    <SelectItem value=">">{'>'}</SelectItem>
                    <SelectItem value="<">{'<'}</SelectItem>
                    <SelectItem value=">=">{'>'}=</SelectItem>
                    <SelectItem value="<=">{"<="}</SelectItem>
                    <SelectItem value="LIKE">LIKE</SelectItem>
                    <SelectItem value="IN">IN</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={filter.value}
                  onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                  className="h-8 text-xs col-span-2 bg-[#1e1e1e] border-[#3e3e42] text-white placeholder-gray-500"
                  placeholder="Value"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Sorting */}
      <Card className="bg-[#252526] border-[#3e3e42]">
        <CardHeader>
          <CardTitle className="text-sm flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <SortAsc className="h-4 w-4 text-emerald-400" />
              Sorting
            </div>
            <Button variant="outline" size="sm" onClick={addSort} disabled={selectedColumns.length === 0}>
              <Plus className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sorts.map(sort => (
            <div key={sort.id} className="border border-[#3e3e42] rounded p-3 flex items-center gap-2">
              <Select
                value={sort.column}
                onValueChange={(value) => updateSort(sort.id, { column: value })}
              >
                <SelectTrigger className="flex-1 h-8 text-xs bg-[#1e1e1e] border-[#3e3e42] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getAllColumns().map(col => (
                    <SelectItem key={`${col.table}.${col.name}`} value={`${col.table}.${col.name}`}>
                      {col.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={sort.direction}
                onValueChange={(value) => updateSort(sort.id, { direction: value as any })}
              >
                <SelectTrigger className="w-24 h-8 text-xs bg-[#1e1e1e] border-[#3e3e42] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ASC">ASC</SelectItem>
                  <SelectItem value="DESC">DESC</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeSort(sort.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}