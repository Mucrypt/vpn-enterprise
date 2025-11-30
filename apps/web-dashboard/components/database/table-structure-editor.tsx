'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  Plus,
  Minus,
  Save,
  X,
  Edit,
  Trash2,
  Key,
  Hash,
  AlertTriangle,
  Check,
  Info,
  Database,
  Settings
} from 'lucide-react';

interface TableStructureEditorProps {
  tableName: string;
  schemaName: string;
  activeTenant: string;
  onClose: () => void;
  onTableUpdated: () => void;
}

interface ColumnDefinition {
  name: string;
  type: string;
  nullable: boolean;
  default: string | null;
  primary_key: boolean;
  unique: boolean;
  foreign_key: boolean;
  foreign_table?: string;
  foreign_column?: string;
  check_constraint?: string;
  comment?: string;
}

interface IndexDefinition {
  name: string;
  columns: string[];
  unique: boolean;
  type: string;
}

const COMMON_TYPES = [
  'UUID', 'VARCHAR(255)', 'TEXT', 'INTEGER', 'BIGINT', 'DECIMAL', 'NUMERIC',
  'BOOLEAN', 'TIMESTAMP', 'DATE', 'TIME', 'JSON', 'JSONB', 'BYTEA'
];

export function TableStructureEditor({ 
  tableName, 
  schemaName, 
  activeTenant, 
  onClose, 
  onTableUpdated 
}: TableStructureEditorProps) {
  const [columns, setColumns] = useState<ColumnDefinition[]>([]);
  const [indexes, setIndexes] = useState<IndexDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changes, setChanges] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'columns' | 'indexes' | 'constraints'>('columns');

  useEffect(() => {
    loadTableStructure();
  }, [tableName, schemaName, activeTenant]);

  const loadTableStructure = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/tenants/${activeTenant}/tables/${schemaName}.${tableName}/structure`);
      if (response.ok) {
        const result = await response.json();
        setColumns(result.columns || []);
        
        // Ensure all indexes have properly initialized columns arrays
        const normalizedIndexes = (result.indexes || []).map((index: any) => ({
          ...index,
          columns: Array.isArray(index.columns) ? index.columns : []
        }));
        setIndexes(normalizedIndexes);
      }
    } catch (error) {
      console.error('Failed to load table structure:', error);
    } finally {
      setLoading(false);
    }
  };

  const addColumn = () => {
    const newColumn: ColumnDefinition = {
      name: 'new_column',
      type: 'VARCHAR(255)',
      nullable: true,
      default: null,
      primary_key: false,
      unique: false,
      foreign_key: false,
      comment: ''
    };
    setColumns([...columns, newColumn]);
    addChange({ action: 'add_column', column: newColumn });
  };

  const updateColumn = (index: number, field: keyof ColumnDefinition, value: any) => {
    const updatedColumns = [...columns];
    updatedColumns[index] = { ...updatedColumns[index], [field]: value };
    setColumns(updatedColumns);
    addChange({ 
      action: 'modify_column', 
      column: updatedColumns[index], 
      originalName: columns[index].name 
    });
  };

  const removeColumn = (index: number) => {
    if (!confirm(`Are you sure you want to drop column "${columns[index].name}"? This action cannot be undone.`)) {
      return;
    }
    
    const columnToRemove = columns[index];
    setColumns(columns.filter((_, i) => i !== index));
    addChange({ action: 'drop_column', column: columnToRemove });
  };

  const addIndex = () => {
    const newIndex: IndexDefinition = {
      name: `idx_${tableName}_new`,
      columns: [],
      unique: false,
      type: 'btree'
    };
    setIndexes([...indexes, newIndex]);
  };

  const updateIndex = (index: number, field: keyof IndexDefinition, value: any) => {
    const updatedIndexes = [...indexes];
    updatedIndexes[index] = { ...updatedIndexes[index], [field]: value };
    setIndexes(updatedIndexes);
  };

  const removeIndex = (index: number) => {
    if (!confirm(`Are you sure you want to drop index "${indexes[index].name}"?`)) {
      return;
    }
    
    const indexToRemove = indexes[index];
    setIndexes(indexes.filter((_, i) => i !== index));
    addChange({ action: 'drop_index', index: indexToRemove });
  };

  const addChange = (change: any) => {
    setChanges([...changes, { ...change, timestamp: Date.now() }]);
  };

  const applyChanges = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/v1/tenants/${activeTenant}/tables/${schemaName}.${tableName}/structure`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          columns,
          indexes,
          changes
        })
      });

      if (response.ok) {
        setChanges([]);
        onTableUpdated();
        alert('Table structure updated successfully!');
      } else {
        throw new Error('Failed to update table structure');
      }
    } catch (error) {
      console.error('Error updating table structure:', error);
      alert('Failed to update table structure. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const resetChanges = () => {
    setChanges([]);
    loadTableStructure();
  };

  return (
    <div className="h-full bg-[#1e1e1e] flex flex-col border-l border-[#2d2d30]">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-[#2d2d30] bg-[#1e1e1e] px-4 py-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-emerald-400" />
            <h2 className="text-lg font-medium text-white">
              Edit: {schemaName}.{tableName}
            </h2>
          </div>
          
          <div className="flex items-center gap-2">
            {changes.length > 0 && (
              <>
                <Button
                  onClick={resetChanges}
                  variant="outline"
                  size="sm"
                  className="h-8 px-3"
                >
                  Reset Changes
                </Button>
                
                <Button
                  onClick={applyChanges}
                  size="sm"
                  className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={saving}
                >
                  <Save className="h-3 w-3 mr-1" />
                  {saving ? 'Saving...' : `Apply ${changes.length} Changes`}
                </Button>
              </>
            )}
            
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

        {/* Tabs */}
        <div className="flex gap-1">
          {[
            { id: 'columns', label: 'Columns', icon: Database },
            { id: 'indexes', label: 'Indexes', icon: Hash },
            { id: 'constraints', label: 'Constraints', icon: Key }
          ].map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-[#2d2d30] text-white border-b-2 border-emerald-400'
                    : 'text-gray-400 hover:text-white hover:bg-[#2d2d30]'
                }`}
              >
                <TabIcon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'columns' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-white">Table Columns</h2>
              <Button
                onClick={addColumn}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Column
              </Button>
            </div>

            <div className="space-y-4">
              {columns.map((column, index) => (
                <div key={index} className="bg-[#2d2d30] border border-[#3e3e42] rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Column Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Name {column.primary_key && <Key className="inline h-3 w-3 text-yellow-400 ml-1" />}
                      </label>
                      <Input
                        value={column.name}
                        onChange={(e) => updateColumn(index, 'name', e.target.value)}
                        className="bg-[#1e1e1e] border-[#3e3e42] text-white"
                        placeholder="column_name"
                      />
                    </div>

                    {/* Data Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
                      <select
                        value={column.type}
                        onChange={(e) => updateColumn(index, 'type', e.target.value)}
                        className="w-full px-3 py-2 bg-[#1e1e1e] border border-[#3e3e42] rounded-md text-white"
                      >
                        {COMMON_TYPES.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    {/* Default Value */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Default</label>
                      <Input
                        value={column.default || ''}
                        onChange={(e) => updateColumn(index, 'default', e.target.value || null)}
                        className="bg-[#1e1e1e] border-[#3e3e42] text-white"
                        placeholder="NULL"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex items-end gap-2">
                      <Button
                        onClick={() => removeColumn(index)}
                        size="sm"
                        variant="outline"
                        className="text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Checkboxes */}
                  <div className="flex gap-4 mt-4">
                    <label className="flex items-center gap-2 text-sm text-gray-300">
                      <input
                        type="checkbox"
                        checked={!column.nullable}
                        onChange={(e) => updateColumn(index, 'nullable', !e.target.checked)}
                        className="rounded"
                      />
                      NOT NULL
                    </label>
                    
                    <label className="flex items-center gap-2 text-sm text-gray-300">
                      <input
                        type="checkbox"
                        checked={column.unique}
                        onChange={(e) => updateColumn(index, 'unique', e.target.checked)}
                        className="rounded"
                      />
                      UNIQUE
                    </label>
                    
                    <label className="flex items-center gap-2 text-sm text-gray-300">
                      <input
                        type="checkbox"
                        checked={column.primary_key}
                        onChange={(e) => updateColumn(index, 'primary_key', e.target.checked)}
                        className="rounded"
                      />
                      PRIMARY KEY
                    </label>
                  </div>

                  {/* Comment */}
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Comment</label>
                    <Input
                      value={column.comment || ''}
                      onChange={(e) => updateColumn(index, 'comment', e.target.value)}
                      className="bg-[#1e1e1e] border-[#3e3e42] text-white"
                      placeholder="Column description..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'indexes' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-white">Table Indexes</h2>
              <Button
                onClick={addIndex}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Index
              </Button>
            </div>

            <div className="space-y-4">
              {indexes.map((index, indexIdx) => (
                <div key={indexIdx} className="bg-[#2d2d30] border border-[#3e3e42] rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Index Name</label>
                      <Input
                        value={index.name}
                        onChange={(e) => updateIndex(indexIdx, 'name', e.target.value)}
                        className="bg-[#1e1e1e] border-[#3e3e42] text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
                      <select
                        value={index.type}
                        onChange={(e) => updateIndex(indexIdx, 'type', e.target.value)}
                        className="w-full px-3 py-2 bg-[#1e1e1e] border border-[#3e3e42] rounded-md text-white"
                      >
                        <option value="btree">B-Tree</option>
                        <option value="hash">Hash</option>
                        <option value="gin">GIN</option>
                        <option value="gist">GiST</option>
                      </select>
                    </div>

                    <div className="flex items-end gap-2">
                      <label className="flex items-center gap-2 text-sm text-gray-300">
                        <input
                          type="checkbox"
                          checked={index.unique}
                          onChange={(e) => updateIndex(indexIdx, 'unique', e.target.checked)}
                          className="rounded"
                        />
                        UNIQUE
                      </label>
                      
                      <Button
                        onClick={() => removeIndex(indexIdx)}
                        size="sm"
                        variant="outline"
                        className="text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Columns</label>
                    <div className="flex gap-2">
                      {columns.map((col) => (
                        <label key={col.name} className="flex items-center gap-1 text-sm text-gray-300">
                          <input
                            type="checkbox"
                            checked={Array.isArray(index.columns) && index.columns.includes(col.name)}
                            onChange={(e) => {
                              const currentColumns = Array.isArray(index.columns) ? index.columns : [];
                              const newColumns = e.target.checked
                                ? [...currentColumns, col.name]
                                : currentColumns.filter(c => c !== col.name);
                              updateIndex(indexIdx, 'columns', newColumns);
                            }}
                            className="rounded text-xs"
                          />
                          {col.name}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'constraints' && (
          <div className="text-center py-12">
            <Info className="h-12 w-12 mx-auto mb-4 text-gray-600" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">Advanced Constraints</h3>
            <p className="text-gray-400">Foreign keys, check constraints, and triggers - Coming soon</p>
          </div>
        )}
      </div>

      {/* Changes Summary */}
      {changes.length > 0 && (
        <div className="flex-shrink-0 border-t border-[#2d2d30] bg-[#2d2d30] px-6 py-3">
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            <span className="text-yellow-400 font-medium">Pending Changes:</span>
            <span className="text-gray-300">
              {changes.length} modification{changes.length !== 1 ? 's' : ''} ready to apply
            </span>
          </div>
        </div>
      )}
    </div>
  );
}