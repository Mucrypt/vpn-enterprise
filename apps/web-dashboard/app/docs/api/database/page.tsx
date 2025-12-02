"use client";

import { useState } from 'react';
import { 
  Database, Server, HardDrive, BarChart, Copy, Check, AlertCircle, Info, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DocLayout from '@/components/docs/DocLayout';
import Link from 'next/link';

export default function DatabaseEndpointsPage() {
  const [copied, setCopied] = useState<string>('');

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(''), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const databaseEndpoints = [
    {
      method: "GET",
      path: "/databases",
      description: "List all managed databases for the authenticated user",
      response: `{
  "success": true,
  "databases": [
    {
      "id": "db_123",
      "name": "my-database",
      "engine": "postgresql",
      "version": "15.0",
      "status": "running",
      "region": "us-east-1",
      "size": "small",
      "storage": "20GB",
      "created_at": "2024-01-15T10:30:00Z",
      "connection_string": "postgresql://user:***@db-host:5432/dbname",
      "metrics": {
        "cpu_usage": 45,
        "memory_usage": 67,
        "storage_usage": 23
      }
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}`
    },
    {
      method: "POST",
      path: "/databases",
      description: "Create a new managed database",
      request: `{
  "name": "my-production-db",
  "engine": "postgresql",
  "version": "15.0",
  "size": "medium",
  "region": "us-east-1",
  "backup_enabled": true,
  "multi_az": false
}`,
      response: `{
  "success": true,
  "database": {
    "id": "db_124",
    "name": "my-production-db",
    "engine": "postgresql",
    "version": "15.0",
    "status": "creating",
    "region": "us-east-1",
    "size": "medium",
    "estimated_setup_time": "5-10 minutes",
    "connection_string": "postgresql://user:password@db-host:5432/dbname"
  }
}`
    },
    {
      method: "GET",
      path: "/databases/:id",
      description: "Get details of a specific database",
      response: `{
  "success": true,
  "database": {
    "id": "db_123",
    "name": "my-database",
    "engine": "postgresql",
    "version": "15.0",
    "status": "running",
    "region": "us-east-1",
    "size": "small",
    "storage": "20GB",
    "created_at": "2024-01-15T10:30:00Z",
    "last_backup": "2024-12-02T02:00:00Z",
    "connection_info": {
      "host": "db-host.vpnenterprise.com",
      "port": 5432,
      "database": "my_database",
      "ssl_required": true
    },
    "metrics": {
      "cpu_usage": 45,
      "memory_usage": 67,
      "storage_usage": 23,
      "connections": {
        "active": 12,
        "max": 100
      }
    }
  }
}`
    },
    {
      method: "PUT",
      path: "/databases/:id",
      description: "Update database configuration",
      request: `{
  "size": "large",
  "backup_enabled": true,
  "backup_retention": 30
}`,
      response: `{
  "success": true,
  "database": {
    "id": "db_123",
    "size": "large",
    "backup_enabled": true,
    "backup_retention": 30,
    "scaling_in_progress": true,
    "estimated_completion": "2024-12-02T15:30:00Z"
  }
}`
    },
    {
      method: "DELETE",
      path: "/databases/:id",
      description: "Delete a database (irreversible action)",
      response: `{
  "success": true,
  "message": "Database deletion initiated",
  "id": "db_123",
  "final_backup": "backup_final_db_123_20241202",
  "deletion_scheduled": "2024-12-02T16:00:00Z"
}`
    },
    {
      method: "GET",
      path: "/databases/:id/backups",
      description: "List backups for a specific database",
      response: `{
  "success": true,
  "backups": [
    {
      "id": "backup_123",
      "database_id": "db_123",
      "type": "automatic",
      "status": "completed",
      "size": "2.5GB",
      "created_at": "2024-12-02T02:00:00Z",
      "expires_at": "2024-12-32T02:00:00Z"
    }
  ],
  "total": 30
}`
    },
    {
      method: "POST",
      path: "/databases/:id/backups",
      description: "Create a manual backup of the database",
      request: `{
  "name": "pre-migration-backup",
  "description": "Backup before major schema changes"
}`,
      response: `{
  "success": true,
  "backup": {
    "id": "backup_124",
    "name": "pre-migration-backup",
    "status": "in_progress",
    "estimated_completion": "2024-12-02T15:30:00Z"
  }
}`
    }
  ];

  return (
    <DocLayout>
      <div className="px-6 py-8">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/docs" className="hover:text-gray-900">Documentation</Link>
          <span>›</span>
          <Link href="/docs/api/overview" className="hover:text-gray-900">API Reference</Link>
          <span>›</span>
          <span className="text-gray-900 font-medium">Database Endpoints</span>
        </div>

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <Database className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Database Endpoints</h1>
              <p className="text-lg text-gray-600 mt-2">
                Provision, scale, and manage your databases with automatic backups and monitoring
              </p>
            </div>
          </div>
        </div>

        {/* Database Overview */}
        <div className="mb-12">
          <Card className="bg-green-50/50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Server className="h-5 w-5 text-green-600" />
                Database Management Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Fully managed database service with automatic scaling, backups, and monitoring. Support for PostgreSQL, MySQL, and MongoDB.
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Engines</h4>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline">PostgreSQL</Badge>
                    <Badge variant="outline">MySQL</Badge>
                    <Badge variant="outline">MongoDB</Badge>
                  </div>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Sizes</h4>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline">Small</Badge>
                    <Badge variant="outline">Medium</Badge>
                    <Badge variant="outline">Large</Badge>
                    <Badge variant="outline">XL</Badge>
                  </div>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Features</h4>
                  <span className="text-sm text-gray-600">Auto-backups, Scaling, Monitoring</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-6">
            
            <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Database className="h-6 w-6 text-emerald-600" />
                  <CardTitle className="text-lg">Create Database</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-3">Provision a new managed database with your preferred engine and size.</p>
                <code className="text-xs bg-gray-900 text-green-400 px-2 py-1 rounded">POST /databases</code>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <BarChart className="h-6 w-6 text-blue-600" />
                  <CardTitle className="text-lg">Monitor Performance</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-3">Track CPU, memory, and storage usage with real-time metrics.</p>
                <code className="text-xs bg-gray-900 text-blue-400 px-2 py-1 rounded">GET /databases/:id</code>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <HardDrive className="h-6 w-6 text-purple-600" />
                  <CardTitle className="text-lg">Manage Backups</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-3">Create manual backups and manage retention policies.</p>
                <code className="text-xs bg-gray-900 text-purple-400 px-2 py-1 rounded">GET /databases/:id/backups</code>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Database Sizes */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Database Sizes</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Badge className="bg-green-100 text-green-800">Small</Badge>
                  <span className="text-2xl font-bold text-green-700">$29/mo</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">CPU</span>
                    <span className="text-gray-900">1 vCPU</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Memory</span>
                    <span className="text-gray-900">2 GB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Storage</span>
                    <span className="text-gray-900">20 GB SSD</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Badge className="bg-blue-100 text-blue-800">Medium</Badge>
                  <span className="text-2xl font-bold text-blue-700">$89/mo</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">CPU</span>
                    <span className="text-gray-900">2 vCPU</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Memory</span>
                    <span className="text-gray-900">4 GB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Storage</span>
                    <span className="text-gray-900">100 GB SSD</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Badge className="bg-purple-100 text-purple-800">Large</Badge>
                  <span className="text-2xl font-bold text-purple-700">$199/mo</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">CPU</span>
                    <span className="text-gray-900">4 vCPU</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Memory</span>
                    <span className="text-gray-900">8 GB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Storage</span>
                    <span className="text-gray-900">500 GB SSD</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Badge className="bg-orange-100 text-orange-800">XL</Badge>
                  <span className="text-2xl font-bold text-orange-700">$499/mo</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">CPU</span>
                    <span className="text-gray-900">8 vCPU</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Memory</span>
                    <span className="text-gray-900">16 GB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Storage</span>
                    <span className="text-gray-900">1 TB SSD</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* API Endpoints */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">API Endpoints</h2>
          
          <div className="space-y-8">
            {databaseEndpoints.map((endpoint, index) => (
              <Card key={index} className="bg-white/70 backdrop-blur-sm border-gray-200">
                <CardHeader className="border-b border-gray-200">
                  <div className="flex items-center gap-4 mb-2">
                    <Badge 
                      className={`font-mono font-semibold ${
                        endpoint.method === 'GET' ? 'bg-green-100 text-green-800' :
                        endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                        endpoint.method === 'PUT' ? 'bg-orange-100 text-orange-800' :
                        endpoint.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {endpoint.method}
                    </Badge>
                    <code className="text-lg font-mono bg-gray-100 px-3 py-1 rounded">
                      {endpoint.path}
                    </code>
                  </div>
                  <CardDescription className="text-base">
                    {endpoint.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-6">
                  <Tabs defaultValue={endpoint.request ? "request" : "response"} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      {endpoint.request && (
                        <TabsTrigger value="request">Request</TabsTrigger>
                      )}
                      <TabsTrigger value="response">Response</TabsTrigger>
                    </TabsList>
                    
                    {endpoint.request && (
                      <TabsContent value="request" className="mt-4">
                        <div className="relative">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">Request Body</h4>
                            <Button
                              onClick={() => copyToClipboard(endpoint.request!, `request-${index}`)}
                              size="sm"
                              variant="ghost"
                              className="text-gray-600 hover:text-gray-900"
                            >
                              {copied === `request-${index}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </div>
                          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                            <code>{endpoint.request}</code>
                          </pre>
                        </div>
                      </TabsContent>
                    )}
                    
                    <TabsContent value="response" className="mt-4">
                      <div className="relative">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">Response</h4>
                          <Button
                            onClick={() => copyToClipboard(endpoint.response, `response-${index}`)}
                            size="sm"
                            variant="ghost"
                            className="text-gray-600 hover:text-gray-900"
                          >
                            {copied === `response-${index}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                          <code>{endpoint.response}</code>
                        </pre>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Best Practices */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Best Practices</h2>
          
          <div className="space-y-4">
            <Card className="border-emerald-200 bg-emerald-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-emerald-800 mb-1">Auto-Scaling</h4>
                    <p className="text-emerald-700 text-sm">
                      Enable auto-scaling to handle traffic spikes automatically. Monitor CPU and memory usage to determine optimal scaling policies.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <HardDrive className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-1">Regular Backups</h4>
                    <p className="text-blue-700 text-sm">
                      Implement automated daily backups with proper retention policies. Test backup restoration procedures regularly.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-amber-800 mb-1">Security</h4>
                    <p className="text-amber-700 text-sm">
                      Always use SSL connections and regularly rotate database credentials. Implement proper network security groups.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-8 border border-emerald-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Next Steps</h2>
          <p className="text-gray-600 mb-6">
            Continue exploring our API to build comprehensive cloud infrastructure solutions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/docs/api/hosting">
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                Hosting Endpoints
              </Button>
            </Link>
            <Link href="/docs/api/webhooks">
              <Button variant="outline" className="border-emerald-300 text-emerald-600 hover:bg-emerald-50">
                Webhooks
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </DocLayout>
  );
}