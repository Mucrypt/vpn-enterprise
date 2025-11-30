'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Database,
  Info
} from 'lucide-react';

interface CreateSchemaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSchema: (schemaName: string, description: string) => Promise<void>;
}

export function CreateSchemaDialog({ isOpen, onClose, onCreateSchema }: CreateSchemaDialogProps) {
  const [schemaName, setSchemaName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!schemaName.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onCreateSchema(schemaName, description);
      // Reset form
      setSchemaName('');
      setDescription('');
      onClose();
    } catch (error) {
      console.error('Error creating schema:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateSQL = () => {
    let sql = `CREATE SCHEMA IF NOT EXISTS "${schemaName}";`;
    if (description.trim()) {
      sql += `\nCOMMENT ON SCHEMA "${schemaName}" IS '${description.replace(/'/g, "''")}';`;
    }
    return sql;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-[#2d2d30] border-[#3e3e42] text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Database className="h-5 w-5 text-emerald-400" />
            Create New Schema
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Schemas are like folders that organize your database tables, views, and other objects.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Schema Name</label>
            <Input
              value={schemaName}
              onChange={(e) => setSchemaName(e.target.value)}
              placeholder="e.g., blog, ecommerce, auth"
              className="bg-[#1e1e1e] border-[#3e3e42] text-white"
              pattern="^[a-zA-Z_][a-zA-Z0-9_]*$"
            />
            <p className="text-xs text-gray-500 mt-1">
              Schema name must start with a letter or underscore, followed by letters, numbers, or underscores
            </p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description of what this schema will contain"
              className="bg-[#1e1e1e] border-[#3e3e42] text-white resize-none"
              rows={3}
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-200">
                <p className="font-medium mb-1">Schema Best Practices</p>
                <ul className="text-xs space-y-1 text-blue-300">
                  <li>• Use descriptive names like "blog", "auth", "analytics"</li>
                  <li>• Group related tables together in the same schema</li>
                  <li>• Consider access control - each schema can have different permissions</li>
                  <li>• The "public" schema is the default if no schema is specified</li>
                </ul>
              </div>
            </div>
          </div>

          {/* SQL Preview */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">SQL Preview</label>
            <pre className="text-sm bg-[#1e1e1e] p-4 rounded border border-[#3e3e42] text-green-400 font-mono overflow-x-auto">
              {generateSQL()}
            </pre>
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
            disabled={!schemaName.trim() || isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isSubmitting ? 'Creating...' : 'Create Schema'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}