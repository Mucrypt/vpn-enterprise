'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Copy, Play, Database, Table, Hash, Search } from 'lucide-react';

interface SqlTemplatesPageProps {
  onLoadTemplate: (sql: string, name: string) => void;
}

const SQL_TEMPLATES = [
  {
    category: 'Table Operations',
    icon: Table,
    templates: [
      {
        name: 'Create Table',
        description: 'Create a new table with common columns',
        sql: `CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);`
      },
      {
        name: 'Add Column',
        description: 'Add a new column to an existing table',
        sql: `ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);`
      },
      {
        name: 'Drop Column',
        description: 'Remove a column from a table',
        sql: `ALTER TABLE users 
DROP COLUMN IF EXISTS phone;`
      }
    ]
  },
  {
    category: 'Indexes & Performance',
    icon: Hash,
    templates: [
      {
        name: 'Create Index',
        description: 'Create an index for better query performance',
        sql: `CREATE INDEX IF NOT EXISTS idx_users_email 
ON users(email);`
      },
      {
        name: 'Unique Index',
        description: 'Create a unique index',
        sql: `CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique 
ON users(email);`
      },
      {
        name: 'Composite Index',
        description: 'Create an index on multiple columns',
        sql: `CREATE INDEX IF NOT EXISTS idx_users_name_email 
ON users(name, email);`
      }
    ]
  },
  {
    category: 'Query Patterns',
    icon: Database,
    templates: [
      {
        name: 'Select with Join',
        description: 'Query data from multiple related tables',
        sql: `SELECT u.name, u.email, p.title, p.created_at
FROM users u
LEFT JOIN posts p ON u.id = p.user_id
WHERE u.created_at > NOW() - INTERVAL '30 days'
ORDER BY p.created_at DESC
LIMIT 10;`
      },
      {
        name: 'Aggregation Query',
        description: 'Group and aggregate data',
        sql: `SELECT 
  DATE_TRUNC('day', created_at) as day,
  COUNT(*) as user_count,
  COUNT(DISTINCT email) as unique_emails
FROM users 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY day DESC;`
      },
      {
        name: 'Window Function',
        description: 'Use window functions for advanced analytics',
        sql: `SELECT 
  name,
  email,
  created_at,
  ROW_NUMBER() OVER (ORDER BY created_at DESC) as row_num,
  LAG(created_at) OVER (ORDER BY created_at) as prev_created_at
FROM users
ORDER BY created_at DESC;`
      }
    ]
  },
  {
    category: 'Data Modification',
    icon: FileText,
    templates: [
      {
        name: 'Insert Data',
        description: 'Insert new records with proper handling',
        sql: `INSERT INTO users (email, name) 
VALUES 
  ('user1@example.com', 'John Doe'),
  ('user2@example.com', 'Jane Smith')
ON CONFLICT (email) 
DO UPDATE SET 
  name = EXCLUDED.name,
  updated_at = NOW();`
      },
      {
        name: 'Update Records',
        description: 'Update existing records conditionally',
        sql: `UPDATE users 
SET 
  name = 'Updated Name',
  updated_at = NOW()
WHERE email = 'user@example.com'
  AND created_at < NOW() - INTERVAL '1 day';`
      },
      {
        name: 'Soft Delete',
        description: 'Implement soft delete pattern',
        sql: `UPDATE users 
SET 
  deleted_at = NOW(),
  updated_at = NOW()
WHERE id = $1 
  AND deleted_at IS NULL;`
      }
    ]
  }
];

export function SqlTemplatesPage({ onLoadTemplate }: SqlTemplatesPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>('Table Operations');

  // Filter templates based on search
  const filteredCategories = SQL_TEMPLATES.map(category => ({
    ...category,
    templates: category.templates.filter(template =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.sql.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.templates.length > 0);

  const copyToClipboard = (sql: string) => {
    navigator.clipboard.writeText(sql);
  };

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      {/* Header */}
      <div className="shrink-0 border-b border-[#2d2d30] bg-[#1e1e1e] px-6 py-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">SQL Templates</h1>
            <p className="text-sm text-gray-400">Common SQL patterns and snippets</p>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#2d2d30] border border-[#3e3e42] rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-600" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">No templates found</h3>
            <p className="text-gray-400">Try a different search term</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCategories.map((category) => {
              const CategoryIcon = category.icon;
              const isExpanded = expandedCategory === category.category;
              
              return (
                <div key={category.category} className="bg-[#2d2d30] border border-[#3e3e42] rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedCategory(isExpanded ? null : category.category)}
                    className="w-full px-4 py-3 bg-[#3e3e42] hover:bg-[#4e4e52] transition-colors flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-3">
                      <CategoryIcon className="h-4 w-4 text-purple-400" />
                      <span className="font-medium text-white">{category.category}</span>
                      <span className="text-xs bg-[#2d2d30] text-gray-400 px-2 py-1 rounded-full">
                        {category.templates.length}
                      </span>
                    </div>
                    <span className="text-gray-400">{isExpanded ? '−' : '+'}</span>
                  </button>
                  
                  {isExpanded && (
                    <div className="p-4 space-y-3">
                      {category.templates.map((template, index) => (
                        <div key={index} className="bg-[#1e1e1e] border border-[#3e3e42] rounded-lg p-4 group">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-medium text-white mb-1">{template.name}</h3>
                              <p className="text-sm text-gray-400">{template.description}</p>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                onClick={() => onLoadTemplate(template.sql, template.name)}
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-purple-400 hover:text-purple-300 hover:bg-purple-900/20"
                              >
                                <Play className="h-3 w-3" />
                              </Button>
                              <Button
                                onClick={() => copyToClipboard(template.sql)}
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-gray-400 hover:text-gray-300 hover:bg-gray-700/20"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="bg-[#2d2d30] border border-[#3e3e42] rounded p-3 mt-3">
                            <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono overflow-x-auto">
                              {template.sql}
                            </pre>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}