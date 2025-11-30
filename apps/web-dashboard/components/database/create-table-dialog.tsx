'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  Plus,
  Trash2,
  Key,
  Hash,
  Clock,
  Text,
  Calendar,
  ToggleLeft,
  FileText,
  Database,
  Settings,
  Info,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface Column {
  id: string;
  name: string;
  type: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  isUnique: boolean;
  defaultValue: string;
  description: string;
  isAutoIncrement: boolean;
  maxLength?: number;
  precision?: number;
  scale?: number;
}

interface CreateTableDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTable: (tableName: string, description: string, columns: Column[], enableRLS: boolean, enableRealtime: boolean) => Promise<void>;
  schemaName: string;
}

const DATA_TYPES = [
  // Text Types
  { value: 'varchar', label: 'varchar', category: 'Text', hasLength: true },
  { value: 'text', label: 'text', category: 'Text' },
  { value: 'char', label: 'char', category: 'Text', hasLength: true },
  
  // Numeric Types
  { value: 'integer', label: 'int4', category: 'Numeric' },
  { value: 'bigint', label: 'int8', category: 'Numeric' },
  { value: 'smallint', label: 'int2', category: 'Numeric' },
  { value: 'serial', label: 'serial', category: 'Numeric' },
  { value: 'bigserial', label: 'bigserial', category: 'Numeric' },
  { value: 'numeric', label: 'numeric', category: 'Numeric', hasPrecision: true },
  { value: 'decimal', label: 'decimal', category: 'Numeric', hasPrecision: true },
  { value: 'real', label: 'float4', category: 'Numeric' },
  { value: 'double precision', label: 'float8', category: 'Numeric' },
  
  // Date/Time Types
  { value: 'timestamp', label: 'timestamp', category: 'Date/Time' },
  { value: 'timestamptz', label: 'timestamptz', category: 'Date/Time' },
  { value: 'date', label: 'date', category: 'Date/Time' },
  { value: 'time', label: 'time', category: 'Date/Time' },
  { value: 'timetz', label: 'timetz', category: 'Date/Time' },
  
  // Boolean
  { value: 'boolean', label: 'bool', category: 'Boolean' },
  
  // JSON
  { value: 'json', label: 'json', category: 'JSON' },
  { value: 'jsonb', label: 'jsonb', category: 'JSON' },
  
  // UUID
  { value: 'uuid', label: 'uuid', category: 'UUID' },
  
  // Arrays
  { value: 'text[]', label: 'text[]', category: 'Array' },
  { value: 'integer[]', label: 'int4[]', category: 'Array' },
];

const DEFAULT_VALUES = {
  'now()': 'now()',
  'current_timestamp': 'CURRENT_TIMESTAMP',
  'current_date': 'CURRENT_DATE',
  'current_time': 'CURRENT_TIME',
  'gen_random_uuid()': 'gen_random_uuid()',
  'true': 'true',
  'false': 'false',
  '0': '0',
  '1': '1',
  "''": "''",
};

export function CreateTableDialog({ isOpen, onClose, onCreateTable, schemaName }: CreateTableDialogProps) {
  const [tableName, setTableName] = useState('');
  const [description, setDescription] = useState('');
  const [enableRLS, setEnableRLS] = useState(true);
  const [enableRealtime, setEnableRealtime] = useState(false);
  const [columns, setColumns] = useState<Column[]>([
    {
      id: '1',
      name: 'id',
      type: 'bigserial',
      isNullable: false,
      isPrimaryKey: true,
      isUnique: false,
      defaultValue: '',
      description: '',
      isAutoIncrement: true
    }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['columns']));

  const addColumn = () => {
    const newColumn: Column = {
      id: Date.now().toString(),
      name: '',
      type: 'text',
      isNullable: true,
      isPrimaryKey: false,
      isUnique: false,
      defaultValue: '',
      description: '',
      isAutoIncrement: false
    };
    setColumns([...columns, newColumn]);
  };

  const updateColumn = (id: string, updates: Partial<Column>) => {
    setColumns(columns.map(col => {
      if (col.id === id) {
        const updatedCol = { ...col, ...updates };
        // Auto-adjust related properties
        if (updates.type === 'serial' || updates.type === 'bigserial') {
          updatedCol.isAutoIncrement = true;
          updatedCol.isNullable = false;
        }
        if (updates.isPrimaryKey) {
          updatedCol.isNullable = false;
          updatedCol.isUnique = true;
        }
        return updatedCol;
      }
      return col;
    }));
  };

  const removeColumn = (id: string) => {
    if (columns.length > 1) {
      setColumns(columns.filter(col => col.id !== id));
    }
  };

  const generateSQL = useCallback(() => {
    const columnDefs = columns.map(col => {
      let def = `"${col.name}" ${col.type.toUpperCase()}`;
      
      // Add length/precision
      if (col.maxLength && (col.type === 'varchar' || col.type === 'char')) {
        def += `(${col.maxLength})`;
      }
      if (col.precision && (col.type === 'numeric' || col.type === 'decimal')) {
        def += col.scale ? `(${col.precision},${col.scale})` : `(${col.precision})`;
      }
      
      // Add constraints
      if (col.isPrimaryKey) {
        def += ' PRIMARY KEY';
      }
      if (!col.isNullable) {
        def += ' NOT NULL';
      }
      if (col.isUnique && !col.isPrimaryKey) {
        def += ' UNIQUE';
      }
      if (col.defaultValue && col.defaultValue !== '__none__') {
        def += ` DEFAULT ${col.defaultValue}`;
      }
      
      return def;
    });
    
    return `CREATE TABLE "${schemaName}"."${tableName}" (\n  ${columnDefs.join(',\n  ')}\n);`;
  }, [columns, schemaName, tableName]);

  const handleSubmit = async () => {
    if (!tableName.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onCreateTable(tableName, description, columns, enableRLS, enableRealtime);
      // Reset form
      setTableName('');
      setDescription('');
      setColumns([{
        id: '1',
        name: 'id',
        type: 'bigserial',
        isNullable: false,
        isPrimaryKey: true,
        isUnique: false,
        defaultValue: '',
        description: '',
        isAutoIncrement: true
      }]);
      setEnableRLS(true);
      setEnableRealtime(false);
      onClose();
    } catch (error) {
      console.error('Error creating table:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getTypeIcon = (type: string) => {
    if (type.includes('int') || type.includes('serial') || type.includes('numeric') || type.includes('decimal')) {
      return <Hash className="h-4 w-4" />;
    }
    if (type.includes('text') || type.includes('varchar') || type.includes('char')) {
      return <Text className="h-4 w-4" />;
    }
    if (type.includes('timestamp') || type.includes('date') || type.includes('time')) {
      return <Calendar className="h-4 w-4" />;
    }
    if (type === 'boolean') {
      return <ToggleLeft className="h-4 w-4" />;
    }
    if (type.includes('json')) {
      return <FileText className="h-4 w-4" />;
    }
    return <Database className="h-4 w-4" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#2d2d30] border-[#3e3e42] text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Database className="h-5 w-5 text-emerald-400" />
            Create a new table under <Badge variant="secondary" className="bg-emerald-600 text-white">{schemaName}</Badge>
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Design your table structure with columns, constraints, and settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Table Name</label>
              <Input
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                placeholder="e.g., users, posts, orders"
                className="bg-[#1e1e1e] border-[#3e3e42] text-white"
                pattern="^[a-zA-Z_][a-zA-Z0-9_]*$"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Description</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                className="bg-[#1e1e1e] border-[#3e3e42] text-white"
              />
            </div>
          </div>

          {/* Security Settings */}
          <div className="border border-[#3e3e42] rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-emerald-400" />
                <span className="font-medium text-gray-300">Security & Features</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-300">Enable Row Level Security (RLS)</span>
                    <Badge variant="secondary" className="text-xs bg-emerald-600 text-white">Recommended</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Restrict access to your table by enabling RLS and writing Postgres policies.
                  </p>
                </div>
                <Switch
                  checked={enableRLS}
                  onCheckedChange={setEnableRLS}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-gray-300">Enable Realtime</span>
                  <p className="text-xs text-gray-500 mt-1">
                    Broadcast changes on this table to authorized subscribers
                  </p>
                </div>
                <Switch
                  checked={enableRealtime}
                  onCheckedChange={setEnableRealtime}
                />
              </div>
            </div>
          </div>

          {/* Columns */}
          <div className="border border-[#3e3e42] rounded-lg">
            <div 
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#3e3e42]"
              onClick={() => toggleSection('columns')}
            >
              <div className="flex items-center gap-2">
                {expandedSections.has('columns') ? (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
                <span className="font-medium text-gray-300">Columns ({columns.length})</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  addColumn();
                }}
                className="border-emerald-600 text-emerald-400 hover:bg-emerald-600 hover:text-white"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Column
              </Button>
            </div>
            
            {expandedSections.has('columns') && (
              <div className="border-t border-[#3e3e42] p-4">
                <div className="space-y-4">
                  {columns.map((column, index) => (
                    <div key={column.id} className="border border-[#3e3e42] rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(column.type)}
                          <span className="font-medium text-gray-300">
                            Column {index + 1}
                          </span>
                          {column.isPrimaryKey && (
                            <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-500">
                              <Key className="h-3 w-3 mr-1" />
                              Primary Key
                            </Badge>
                          )}
                        </div>
                        {columns.length > 1 && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-[#2d2d30] border-[#3e3e42] text-white">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Column</AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-400">
                                  Are you sure you want to delete this column? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-[#3e3e42] text-white border-[#3e3e42] hover:bg-[#4e4e52]">Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => removeColumn(column.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="text-xs font-medium text-gray-400 mb-1 block">Name</label>
                          <Input
                            value={column.name}
                            onChange={(e) => updateColumn(column.id, { name: e.target.value })}
                            placeholder="column_name"
                            className="h-8 text-sm bg-[#1e1e1e] border-[#3e3e42] text-white"
                          />
                        </div>
                        
                        <div>
                          <label className="text-xs font-medium text-gray-400 mb-1 block">Type</label>
                          <Select
                            value={column.type}
                            onValueChange={(value) => updateColumn(column.id, { type: value })}
                          >
                            <SelectTrigger className="h-8 text-sm bg-[#1e1e1e] border-[#3e3e42] text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(
                                DATA_TYPES.reduce((acc, type) => {
                                  if (!acc[type.category]) acc[type.category] = [];
                                  acc[type.category].push(type);
                                  return acc;
                                }, {} as Record<string, typeof DATA_TYPES>)
                              ).map(([category, types]) => (
                                <div key={category}>
                                  <div className="px-2 py-1 text-xs font-medium text-gray-500">{category}</div>
                                  {types.map(type => (
                                    <SelectItem key={type.value} value={type.value}>
                                      {type.label}
                                    </SelectItem>
                                  ))}
                                </div>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <label className="text-xs font-medium text-gray-400 mb-1 block">Default Value</label>
                          <Select
                            value={column.defaultValue || '__none__'}
                            onValueChange={(value) => updateColumn(column.id, { defaultValue: value === '__none__' ? '' : value })}
                          >
                            <SelectTrigger className="h-8 text-sm bg-[#1e1e1e] border-[#3e3e42] text-white">
                              <SelectValue placeholder="No default" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">No default</SelectItem>
                              {Object.entries(DEFAULT_VALUES).map(([label, value]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {(column.type === 'varchar' || column.type === 'char') && (
                          <div>
                            <label className="text-xs font-medium text-gray-400 mb-1 block">Max Length</label>
                            <Input
                              type="number"
                              value={column.maxLength || ''}
                              onChange={(e) => updateColumn(column.id, { maxLength: parseInt(e.target.value) || undefined })}
                              placeholder="255"
                              className="h-8 text-sm bg-[#1e1e1e] border-[#3e3e42] text-white"
                            />
                          </div>
                        )}
                        
                        {(column.type === 'numeric' || column.type === 'decimal') && (
                          <>
                            <div>
                              <label className="text-xs font-medium text-gray-400 mb-1 block">Precision</label>
                              <Input
                                type="number"
                                value={column.precision || ''}
                                onChange={(e) => updateColumn(column.id, { precision: parseInt(e.target.value) || undefined })}
                                placeholder="10"
                                className="h-8 text-sm bg-[#1e1e1e] border-[#3e3e42] text-white"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-400 mb-1 block">Scale</label>
                              <Input
                                type="number"
                                value={column.scale || ''}
                                onChange={(e) => updateColumn(column.id, { scale: parseInt(e.target.value) || undefined })}
                                placeholder="2"
                                className="h-8 text-sm bg-[#1e1e1e] border-[#3e3e42] text-white"
                              />
                            </div>
                          </>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={!column.isNullable}
                            onChange={(e) => updateColumn(column.id, { isNullable: !e.target.checked })}
                            className="rounded"
                          />
                          <span className="text-gray-300">Required</span>
                        </label>
                        
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={column.isPrimaryKey}
                            onChange={(e) => updateColumn(column.id, { isPrimaryKey: e.target.checked })}
                            className="rounded"
                          />
                          <span className="text-gray-300">Primary Key</span>
                        </label>
                        
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={column.isUnique}
                            onChange={(e) => updateColumn(column.id, { isUnique: e.target.checked })}
                            className="rounded"
                            disabled={column.isPrimaryKey}
                          />
                          <span className="text-gray-300">Unique</span>
                        </label>
                      </div>
                      
                      <div>
                        <label className="text-xs font-medium text-gray-400 mb-1 block">Description</label>
                        <Input
                          value={column.description}
                          onChange={(e) => updateColumn(column.id, { description: e.target.value })}
                          placeholder="Optional column description"
                          className="h-8 text-sm bg-[#1e1e1e] border-[#3e3e42] text-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SQL Preview */}
          <div className="border border-[#3e3e42] rounded-lg">
            <div 
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#3e3e42]"
              onClick={() => toggleSection('sql')}
            >
              <div className="flex items-center gap-2">
                {expandedSections.has('sql') ? (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
                <span className="font-medium text-gray-300">SQL Preview</span>
              </div>
            </div>
            
            {expandedSections.has('sql') && (
              <div className="border-t border-[#3e3e42] p-4">
                <pre className="text-sm bg-[#1e1e1e] p-4 rounded border border-[#3e3e42] text-green-400 font-mono overflow-x-auto">
                  {generateSQL()}
                </pre>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-[#3e3e42] text-gray-300 hover:bg-[#3e3e42]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!tableName.trim() || isSubmitting || columns.some(col => !col.name.trim())}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isSubmitting ? 'Creating...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}