'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  RefreshCw,
  Key,
  Filter,
  Download,
  Upload,
  MoreHorizontal,
  ChevronDown,
  Trash,
  Copy,
  Archive,
  ArrowUpDown,
  CheckSquare,
  Square,
  Columns,
  Save,
  AlertCircle
} from 'lucide-react';

interface TableColumn {
  name: string;
  type: string;
  nullable: boolean;
  default: any;
  primary_key: boolean;
}

interface TableRow {
  [key: string]: any;
}

interface ColumnFilter {
  column: string;
  operator: string;
  value: string;
  enabled: boolean;
}

interface TableDataViewerProps {
  activeTenant: string;
  schemaName: string;
  tableName: string;
  onClose: () => void;
}

const FILTER_OPERATORS = [
  { value: 'eq', label: 'Equals', symbol: '=' },
  { value: 'neq', label: 'Not Equals', symbol: '≠' },
  { value: 'gt', label: 'Greater Than', symbol: '>' },
  { value: 'gte', label: 'Greater Than or Equal', symbol: '≥' },
  { value: 'lt', label: 'Less Than', symbol: '<' },
  { value: 'lte', label: 'Less Than or Equal', symbol: '≤' },
  { value: 'like', label: 'Contains', symbol: '~' },
  { value: 'ilike', label: 'Contains (Case Insensitive)', symbol: '~*' },
  { value: 'in', label: 'In List', symbol: '∈' },
  { value: 'is_null', label: 'Is Null', symbol: '∅' },
  { value: 'is_not_null', label: 'Is Not Null', symbol: '∄' }
];

export default function EnhancedTableDataViewer({ activeTenant, schemaName, tableName, onClose }: TableDataViewerProps) {
  
  // Data state
  const [data, setData] = useState<TableRow[]>([]);
  const [columns, setColumns] = useState<TableColumn[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  
  // Search and filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFilter[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Selection state
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  
  // Editing state
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<TableRow>({});
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newRowData, setNewRowData] = useState<TableRow>({});
  
  // Sorting
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Bulk operations
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkOperation, setBulkOperation] = useState<string | null>(null);

  // Load table schema and data
  const loadTableData = useCallback(async () => {
    if (!activeTenant) return;
    
    setLoading(true);
    try {
      // Load columns
      const columnsResponse = await fetch(`/api/v1/tenants/${activeTenant}/tables/${schemaName}.${tableName}/columns`);
      if (columnsResponse.ok) {
        const columnsResult = await columnsResponse.json();
        setColumns(columnsResult.columns);
      }

      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      });
      
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      if (sortColumn) {
        params.append('sort', sortColumn);
        params.append('order', sortDirection);
      }
      
      // Add filters
      columnFilters.forEach((filter, index) => {
        if (filter.enabled && filter.value) {
          params.append(`filter[${index}][column]`, filter.column);
          params.append(`filter[${index}][operator]`, filter.operator);
          params.append(`filter[${index}][value]`, filter.value);
        }
      });

      // Load data
      const dataResponse = await fetch(`/api/v1/tenants/${activeTenant}/tables/${schemaName}.${tableName}/data?${params}`);
      if (dataResponse.ok) {
        const result = await dataResponse.json();
        setData(result.data);
        setTotalRows(result.total);
      }
    } catch (error) {
      console.error('Error loading table data:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTenant, schemaName, tableName, currentPage, pageSize, searchQuery, sortColumn, sortDirection, columnFilters]);

  useEffect(() => {
    loadTableData();
  }, [loadTableData]);

  // Handle sorting
  const handleSort = (columnName: string) => {
    if (sortColumn === columnName) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnName);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Row selection handlers
  const handleRowSelect = (rowIndex: number) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(rowIndex)) {
      newSelection.delete(rowIndex);
    } else {
      newSelection.add(rowIndex);
    }
    setSelectedRows(newSelection);
    setSelectAll(false);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(data.map((_, index) => index)));
    }
    setSelectAll(!selectAll);
  };

  // Filter handlers
  const addColumnFilter = () => {
    setColumnFilters([...columnFilters, {
      column: columns[0]?.name || '',
      operator: 'eq',
      value: '',
      enabled: true
    }]);
    setShowFilters(true);
  };

  const updateColumnFilter = (index: number, field: keyof ColumnFilter, value: any) => {
    const updatedFilters = [...columnFilters];
    updatedFilters[index] = { ...updatedFilters[index], [field]: value };
    setColumnFilters(updatedFilters);
  };

  const removeColumnFilter = (index: number) => {
    setColumnFilters(columnFilters.filter((_, i) => i !== index));
  };

  // Editing handlers
  const startEditing = (rowIndex: number) => {
    setEditingRow(rowIndex);
    setEditingData({ ...data[rowIndex] });
  };

  const saveEdit = async () => {
    if (editingRow === null) return;

    try {
      const response = await fetch(`/api/v1/tenants/${activeTenant}/tables/${schemaName}.${tableName}/data`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: editingData,
          where: getPrimaryKeyCondition(data[editingRow])
        })
      });

      if (response.ok) {
        const updatedData = [...data];
        updatedData[editingRow] = editingData;
        setData(updatedData);
        setEditingRow(null);
        setEditingData({});
      } else {
        throw new Error('Failed to update row');
      }
    } catch (error) {
      console.error('Error updating row:', error);
      alert('Failed to update row. Please try again.');
    }
  };

  const cancelEdit = () => {
    setEditingRow(null);
    setEditingData({});
  };

  // Delete operations
  const deleteRow = async (rowIndex: number) => {
    if (!confirm('Are you sure you want to delete this row?')) return;

    try {
      const response = await fetch(`/api/v1/tenants/${activeTenant}/tables/${schemaName}.${tableName}/data`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          where: getPrimaryKeyCondition(data[rowIndex])
        })
      });

      if (response.ok) {
        setData(data.filter((_, index) => index !== rowIndex));
        setTotalRows(totalRows - 1);
      } else {
        throw new Error('Failed to delete row');
      }
    } catch (error) {
      console.error('Error deleting row:', error);
      alert('Failed to delete row. Please try again.');
    }
  };

  // Bulk operations
  const executeBulkOperation = async (operation: string) => {
    const selectedRowsData = Array.from(selectedRows).map(index => data[index]);
    
    if (selectedRowsData.length === 0) {
      alert('Please select rows to perform bulk operations');
      return;
    }

    if (!confirm(`Are you sure you want to ${operation} ${selectedRowsData.length} selected rows?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/tenants/${activeTenant}/tables/${schemaName}.${tableName}/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation,
          rows: selectedRowsData.map(row => getPrimaryKeyCondition(row))
        })
      });

      if (response.ok) {
        await loadTableData();
        setSelectedRows(new Set());
        setSelectAll(false);
        setShowBulkActions(false);
      } else {
        throw new Error(`Failed to ${operation} rows`);
      }
    } catch (error) {
      console.error(`Error executing bulk ${operation}:`, error);
      alert(`Failed to ${operation} rows. Please try again.`);
    }
  };

  // New row handlers
  const startAddingNew = () => {
    setIsAddingNew(true);
    const initialData: TableRow = {};
    columns.forEach(col => {
      initialData[col.name] = col.default || (col.nullable ? null : '');
    });
    setNewRowData(initialData);
  };

  const saveNewRow = async () => {
    try {
      const response = await fetch(`/api/v1/tenants/${activeTenant}/tables/${schemaName}.${tableName}/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRowData)
      });

      if (response.ok) {
        await loadTableData();
        setIsAddingNew(false);
        setNewRowData({});
      } else {
        throw new Error('Failed to insert row');
      }
    } catch (error) {
      console.error('Error inserting row:', error);
      alert('Failed to insert row. Please try again.');
    }
  };

  const cancelAddNew = () => {
    setIsAddingNew(false);
    setNewRowData({});
  };

  // Export data
  const exportData = async () => {
    try {
      const response = await fetch(`/api/v1/tenants/${activeTenant}/tables/${schemaName}.${tableName}/export`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${schemaName}_${tableName}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  // Utility functions
  const getPrimaryKeyCondition = (row: TableRow) => {
    const pkColumns = columns.filter(col => col.primary_key);
    const condition: any = {};
    pkColumns.forEach(col => {
      condition[col.name] = row[col.name];
    });
    return condition;
  };

  const formatValue = (value: any, columnType: string) => {
    if (value === null) return <span className="text-gray-500 italic">NULL</span>;
    if (value === undefined) return <span className="text-gray-500 italic">-</span>;
    
    if (columnType.includes('json')) {
      return <span className="text-blue-300 font-mono text-xs">{JSON.stringify(value)}</span>;
    }
    
    if (columnType.includes('timestamp') || columnType.includes('date')) {
      return <span className="text-purple-300">{new Date(value).toLocaleString()}</span>;
    }
    
    if (typeof value === 'boolean') {
      return (
        <span className={value ? 'text-green-300' : 'text-red-300'}>
          {value ? 'true' : 'false'}
        </span>
      );
    }
    
    return value.toString();
  };

  const totalPages = Math.ceil(totalRows / pageSize);

  return (
    <div className="h-full bg-[#1e1e1e] flex flex-col border-l border-[#2d2d30]">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-[#2d2d30] bg-[#1e1e1e] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-white">
              {schemaName}.{tableName}
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>{totalRows} rows</span>
              <span>•</span>
              <span>{columns.length} columns</span>
              {selectedRows.size > 0 && (
                <>
                  <span>•</span>
                  <span className="text-emerald-400">{selectedRows.size} selected</span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {selectedRows.size > 0 && (
              <div className="flex items-center gap-2 mr-4 px-3 py-1 bg-emerald-600/20 rounded-md">
                <Button
                  onClick={() => executeBulkOperation('delete')}
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-red-400 hover:bg-red-600/20"
                >
                  <Trash className="h-3 w-3 mr-1" />
                  Delete
                </Button>
                <Button
                  onClick={() => setSelectedRows(new Set())}
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
            
            <Button
              onClick={exportData}
              variant="outline"
              size="sm"
              className="h-8 px-3"
            >
              <Download className="h-3 w-3 mr-1" />
              Export
            </Button>
            
            <Button
              onClick={addColumnFilter}
              variant="outline"
              size="sm"
              className="h-8 px-3"
            >
              <Filter className="h-3 w-3 mr-1" />
              Filter
            </Button>
            
            <Button
              onClick={startAddingNew}
              variant="outline"
              size="sm"
              className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
              disabled={isAddingNew}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Row
            </Button>
            
            <Button
              onClick={loadTableData}
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
        
        {/* Search and filters */}
        <div className="flex items-center gap-4 mt-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search in table..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#2d2d30] border-[#3e3e42] text-white"
            />
          </div>
          
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="px-3 py-2 bg-[#2d2d30] border border-[#3e3e42] rounded-md text-white text-sm"
          >
            <option value={25}>25 rows</option>
            <option value={50}>50 rows</option>
            <option value={100}>100 rows</option>
            <option value={200}>200 rows</option>
          </select>
        </div>

        {/* Column Filters */}
        {columnFilters.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="text-sm text-gray-400 mb-2">Filters:</div>
            {columnFilters.map((filter, index) => (
              <div key={index} className="flex items-center gap-2 bg-[#2d2d30] rounded-md p-2">
                <select
                  value={filter.column}
                  onChange={(e) => updateColumnFilter(index, 'column', e.target.value)}
                  className="px-2 py-1 bg-[#3e3e42] border border-[#4e4e52] rounded text-white text-sm"
                >
                  {columns.map(col => (
                    <option key={col.name} value={col.name}>{col.name}</option>
                  ))}
                </select>
                
                <select
                  value={filter.operator}
                  onChange={(e) => updateColumnFilter(index, 'operator', e.target.value)}
                  className="px-2 py-1 bg-[#3e3e42] border border-[#4e4e52] rounded text-white text-sm"
                >
                  {FILTER_OPERATORS.map(op => (
                    <option key={op.value} value={op.value}>{op.label}</option>
                  ))}
                </select>
                
                {filter.operator !== 'is_null' && filter.operator !== 'is_not_null' && (
                  <Input
                    placeholder="Value"
                    value={filter.value}
                    onChange={(e) => updateColumnFilter(index, 'value', e.target.value)}
                    className="bg-[#3e3e42] border-[#4e4e52] text-white text-sm"
                  />
                )}
                
                <Button
                  onClick={() => updateColumnFilter(index, 'enabled', !filter.enabled)}
                  size="sm"
                  variant="ghost"
                  className={`h-6 w-6 p-0 ${filter.enabled ? 'text-emerald-400' : 'text-gray-500'}`}
                >
                  <Check className="h-3 w-3" />
                </Button>
                
                <Button
                  onClick={() => removeColumnFilter(index)}
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-red-400 hover:bg-red-600/20"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-full">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#2d2d30] border-b border-[#3e3e42]">
              <tr>
                <th className="w-12 px-4 py-3 text-left text-gray-300 font-medium">
                  <button
                    onClick={handleSelectAll}
                    className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-white"
                  >
                    {selectAll ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                  </button>
                </th>
                <th className="w-12 px-4 py-3 text-left text-gray-300 font-medium">#</th>
                {columns.map((column) => (
                  <th
                    key={column.name}
                    className="px-4 py-3 text-left text-gray-300 font-medium cursor-pointer hover:bg-[#3e3e42] group"
                    onClick={() => handleSort(column.name)}
                  >
                    <div className="flex items-center gap-2">
                      <span>{column.name}</span>
                      {column.primary_key && <Key className="h-3 w-3 text-yellow-400" />}
                      <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-50" />
                      {sortColumn === column.name && (
                        <span className={`text-xs ${sortDirection === 'asc' ? 'text-emerald-400' : 'text-emerald-400'}`}>
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {column.type} {!column.nullable && <span className="text-red-400">NOT NULL</span>}
                    </div>
                  </th>
                ))}
                <th className="w-24 px-4 py-3 text-left text-gray-300 font-medium">Actions</th>
              </tr>
            </thead>
            
            <tbody className="bg-[#1e1e1e]">
              {/* New Row */}
              {isAddingNew && (
                <tr className="border-b border-[#3e3e42] bg-blue-900/20">
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-blue-400 font-medium">NEW</td>
                  {columns.map((column) => (
                    <td key={column.name} className="px-4 py-3">
                      <input
                        type="text"
                        value={newRowData[column.name] || ''}
                        onChange={(e) => setNewRowData({
                          ...newRowData,
                          [column.name]: e.target.value
                        })}
                        className="w-full px-2 py-1 bg-[#2d2d30] border border-[#3e3e42] rounded text-white text-sm"
                        placeholder={column.nullable ? 'NULL' : 'Required'}
                      />
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button
                        onClick={saveNewRow}
                        size="sm"
                        className="h-6 w-6 p-0 bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        onClick={cancelAddNew}
                        size="sm"
                        variant="outline"
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
              
              {/* Data Rows */}
              {data.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={`border-b border-[#3e3e42] hover:bg-[#2d2d30] ${
                    editingRow === rowIndex ? 'bg-yellow-900/20' : ''
                  } ${selectedRows.has(rowIndex) ? 'bg-emerald-900/20' : ''}`}
                >
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleRowSelect(rowIndex)}
                      className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-white"
                    >
                      {selectedRows.has(rowIndex) ? 
                        <CheckSquare className="h-4 w-4 text-emerald-400" /> : 
                        <Square className="h-4 w-4" />
                      }
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-400 font-mono">
                    {(currentPage - 1) * pageSize + rowIndex + 1}
                  </td>
                  
                  {columns.map((column) => (
                    <td key={column.name} className="px-4 py-3 max-w-xs">
                      {editingRow === rowIndex ? (
                        <input
                          type="text"
                          value={editingData[column.name] || ''}
                          onChange={(e) => setEditingData({
                            ...editingData,
                            [column.name]: e.target.value
                          })}
                          className="w-full px-2 py-1 bg-[#2d2d30] border border-[#3e3e42] rounded text-white text-sm"
                        />
                      ) : (
                        <div className="truncate">
                          {formatValue(row[column.name], column.type)}
                        </div>
                      )}
                    </td>
                  ))}
                  
                  <td className="px-4 py-3">
                    {editingRow === rowIndex ? (
                      <div className="flex gap-1">
                        <Button
                          onClick={saveEdit}
                          size="sm"
                          className="h-6 w-6 p-0 bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          onClick={cancelEdit}
                          size="sm"
                          variant="outline"
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <Button
                          onClick={() => startEditing(rowIndex)}
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 hover:bg-blue-600"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          onClick={() => deleteRow(rowIndex)}
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 hover:bg-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {data.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="text-gray-400">
                {searchQuery || columnFilters.some(f => f.enabled) ? 'No rows match your filters' : 'No data in this table'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer with pagination */}
      <div className="flex-shrink-0 border-t border-[#2d2d30] bg-[#1e1e1e] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Showing {Math.min((currentPage - 1) * pageSize + 1, totalRows)}-{Math.min(currentPage * pageSize, totalRows)} of {totalRows} rows
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
            >
              Previous
            </Button>
            
            <span className="text-sm text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
            
            <Button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}