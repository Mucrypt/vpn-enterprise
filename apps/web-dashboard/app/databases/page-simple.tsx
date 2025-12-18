'use client';

import React, { useState } from 'react';
import { Database, Play, Save, FileText, Table, History } from 'lucide-react';

type DatabaseSection = 'tables' | 'sql-editor' | 'query-history';

export default function DatabasePage() {
  const [activeSection, setActiveSection] = useState<DatabaseSection>('tables');
  const [queryResult, setQueryResult] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleExecuteQuery = () => {
    const query = 'SELECT * FROM users LIMIT 10;';
    console.log('Executing query:', query);
    setIsLoading(true);
    // Simulate query execution
    setTimeout(() => {
      setQueryResult([
        { id: 1, name: 'Sample User', email: 'user@example.com' },
        { id: 2, name: 'Test User', email: 'test@example.com' }
      ]);
      setIsLoading(false);
    }, 1000);
  };

  const handleSaveQuery = () => {
    const query = 'SELECT * FROM users LIMIT 10;';
    console.log('Saving query:', query);
    // TODO: Implement save functionality
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Database className="h-8 w-8 text-emerald-600" />
            Database Manager
          </h2>
          <p className="text-gray-600">
            Manage your database schemas, tables, and run SQL queries
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'tables' as const, label: 'Tables', icon: Table },
            { id: 'sql-editor' as const, label: 'SQL Editor', icon: FileText },
            { id: 'query-history' as const, label: 'Query History', icon: History }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeSection === item.id
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content Sections */}
      <div className="min-h-96">
        {activeSection === 'tables' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Database Tables</h3>
              <button className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700">
                Create Table
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Sample tables */}
              <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <Table className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">users</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">User authentication and profiles</p>
                <div className="text-xs text-gray-500">
                  <div>5 columns • 1,247 rows</div>
                  <div>Last updated: 2 hours ago</div>
                </div>
              </div>
              
              <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <Table className="h-5 w-5 text-green-600" />
                  <span className="font-medium">tenants</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">Multi-tenant configuration</p>
                <div className="text-xs text-gray-500">
                  <div>8 columns • 23 rows</div>
                  <div>Last updated: 1 day ago</div>
                </div>
              </div>
              
              <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <Table className="h-5 w-5 text-purple-600" />
                  <span className="font-medium">sessions</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">User session management</p>
                <div className="text-xs text-gray-500">
                  <div>6 columns • 89 rows</div>
                  <div>Last updated: 5 minutes ago</div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeSection === 'sql-editor' && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">SQL Editor</h3>
            <div className="space-y-4">
              <div className="relative border rounded-lg">
                <textarea
                  className="w-full h-64 p-4 font-mono text-sm resize-none border-0 focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-lg"
                  placeholder="-- Write your SQL query here&#10;SELECT * FROM users LIMIT 10;"
                  spellCheck={false}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleExecuteQuery}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  Execute
                </button>
                <button
                  onClick={handleSaveQuery}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save
                </button>
              </div>
            </div>
            
            {/* Query Results */}
            {isLoading && (
              <div className="border rounded-lg p-6 text-center">
                <div className="animate-spin h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-gray-600">Executing query...</p>
              </div>
            )}
            
            {queryResult && !isLoading && (
              <div className="border rounded-lg">
                <div className="border-b p-4 bg-gray-50">
                  <h4 className="font-medium">Query Results ({queryResult.length} rows)</h4>
                </div>
                <div className="p-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        {queryResult.length > 0 && Object.keys(queryResult[0]).map(key => (
                          <th key={key} className="text-left p-2 font-medium">{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {queryResult.map((row, index) => (
                        <tr key={index} className="border-b">
                          {Object.values(row).map((value, cellIndex) => (
                            <td key={cellIndex} className="p-2">{String(value)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeSection === 'query-history' && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Query History</h3>
            <div className="border rounded-lg">
              <div className="border-b p-4 bg-gray-50">
                <h4 className="font-medium">Recent Queries</h4>
              </div>
              <div className="divide-y">
                {/* Sample query history */}
                <div className="p-4 hover:bg-gray-50">
                  <div className="font-mono text-sm mb-2">SELECT * FROM users WHERE active = true LIMIT 10;</div>
                  <div className="text-xs text-gray-500 flex gap-4">
                    <span>Executed 5 minutes ago</span>
                    <span>Duration: 23ms</span>
                    <span>10 rows returned</span>
                  </div>
                </div>
                
                <div className="p-4 hover:bg-gray-50">
                  <div className="font-mono text-sm mb-2">SELECT COUNT(*) FROM tenants;</div>
                  <div className="text-xs text-gray-500 flex gap-4">
                    <span>Executed 1 hour ago</span>
                    <span>Duration: 12ms</span>
                    <span>1 row returned</span>
                  </div>
                </div>
                
                <div className="p-4 hover:bg-gray-50">
                  <div className="font-mono text-sm mb-2">DESCRIBE users;</div>
                  <div className="text-xs text-gray-500 flex gap-4">
                    <span>Executed 2 hours ago</span>
                    <span>Duration: 8ms</span>
                    <span>5 rows returned</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}