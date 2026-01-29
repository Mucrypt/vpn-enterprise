"use client";

import { useState } from 'react';
import { 
  Users, UserPlus, Shield, Key, Copy, Check, AlertCircle, Info, Settings, Crown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DocLayout from '@/components/docs/DocLayout';
import Link from 'next/link';

export default function UserManagementPage() {
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

  const userEndpoints = [
    {
      method: "GET",
      path: "/users",
      description: "List all users in your organization (admin only)",
      response: `{
  "success": true,
  "users": [
    {
      "id": "usr_123",
      "email": "john@company.com",
      "name": "John Doe",
      "role": "member",
      "status": "active",
      "last_login": "2024-12-02T14:20:00Z",
      "created_at": "2024-01-15T10:30:00Z",
      "permissions": ["vpn:read", "database:read"],
      "two_factor_enabled": true
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 20
}`
    },
    {
      method: "POST",
      path: "/users",
      description: "Invite a new user to your organization (admin only)",
      request: `{
  "email": "newuser@company.com",
  "name": "New User",
  "role": "member",
  "permissions": ["vpn:read", "database:read"],
  "send_invitation": true
}`,
      response: `{
  "success": true,
  "user": {
    "id": "usr_124",
    "email": "newuser@company.com",
    "name": "New User",
    "role": "member",
    "status": "invited",
    "invitation_sent": true,
    "invitation_expires": "2024-12-09T14:20:00Z"
  }
}`
    },
    {
      method: "GET",
      path: "/users/:id",
      description: "Get details of a specific user",
      response: `{
  "success": true,
  "user": {
    "id": "usr_123",
    "email": "john@company.com",
    "name": "John Doe",
    "role": "member",
    "status": "active",
    "last_login": "2024-12-02T14:20:00Z",
    "created_at": "2024-01-15T10:30:00Z",
    "permissions": ["vpn:read", "vpn:write", "database:read"],
    "two_factor_enabled": true,
    "profile": {
      "avatar_url": "https://avatars.vpnenterprise.com/usr_123.jpg",
      "timezone": "America/New_York",
      "language": "en"
    },
    "activity": {
      "vpn_connections": 12,
      "databases_created": 3,
      "api_calls_30d": 1250
    }
  }
}`
    },
    {
      method: "PUT",
      path: "/users/:id",
      description: "Update user information and permissions",
      request: `{
  "name": "John Smith",
  "role": "admin",
  "permissions": ["vpn:read", "vpn:write", "database:read", "database:write"],
  "status": "active"
}`,
      response: `{
  "success": true,
  "user": {
    "id": "usr_123",
    "name": "John Smith",
    "role": "admin",
    "permissions": ["vpn:read", "vpn:write", "database:read", "database:write"],
    "updated_at": "2024-12-02T15:30:00Z"
  }
}`
    },
    {
      method: "DELETE",
      path: "/users/:id",
      description: "Remove a user from your organization (admin only)",
      response: `{
  "success": true,
  "message": "User removed from organization",
  "id": "usr_123",
  "email": "john@company.com",
  "resources_transferred_to": "usr_456"
}`
    },
    {
      method: "GET",
      path: "/users/:id/permissions",
      description: "Get detailed permissions for a user",
      response: `{
  "success": true,
  "permissions": {
    "vpn": {
      "read": true,
      "write": true,
      "delete": false
    },
    "database": {
      "read": true,
      "write": true,
      "delete": true
    },
    "hosting": {
      "read": true,
      "write": false,
      "delete": false
    },
    "billing": {
      "read": false,
      "write": false
    }
  }
}`
    },
    {
      method: "PUT",
      path: "/users/:id/permissions",
      description: "Update user permissions",
      request: `{
  "permissions": {
    "vpn": {
      "read": true,
      "write": true,
      "delete": true
    },
    "database": {
      "read": true,
      "write": true,
      "delete": false
    }
  }
}`,
      response: `{
  "success": true,
  "permissions": {
    "vpn": {
      "read": true,
      "write": true,
      "delete": true
    },
    "database": {
      "read": true,
      "write": true,
      "delete": false
    }
  },
  "updated_at": "2024-12-02T15:30:00Z"
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
          <span className="text-gray-900 font-medium">User Management</span>
        </div>

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <Users className="h-8 w-8 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">User Management</h1>
              <p className="text-lg text-gray-600 mt-2">
                Manage users, roles, and permissions for your organization
              </p>
            </div>
          </div>
        </div>

        {/* User Management Overview */}
        <div className="mb-12">
          <Card className="bg-indigo-50/50 border-indigo-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-indigo-600" />
                User Management Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Comprehensive user management system with role-based access control (RBAC), fine-grained permissions, and organization management.
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Roles</h4>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline">Owner</Badge>
                    <Badge variant="outline">Admin</Badge>
                    <Badge variant="outline">Member</Badge>
                  </div>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Permissions</h4>
                  <span className="text-sm text-gray-600">Resource-based access control</span>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Security</h4>
                  <span className="text-sm text-gray-600">2FA, Activity logs, Session management</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-6">
            
            <Card className="bg-linear-to-br from-emerald-50 to-green-50 border-emerald-200">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <UserPlus className="h-6 w-6 text-emerald-600" />
                  <CardTitle className="text-lg">Invite User</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-3">Send invitations to new team members with specific roles and permissions.</p>
                <code className="text-xs bg-gray-900 text-green-400 px-2 py-1 rounded">POST /users</code>
              </CardContent>
            </Card>

            <Card className="bg-linear-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Settings className="h-6 w-6 text-blue-600" />
                  <CardTitle className="text-lg">Manage Permissions</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-3">Configure fine-grained permissions for users and resources.</p>
                <code className="text-xs bg-gray-900 text-blue-400 px-2 py-1 rounded">PUT /users/:id/permissions</code>
              </CardContent>
            </Card>

            <Card className="bg-linear-to-br from-purple-50 to-violet-50 border-purple-200">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Crown className="h-6 w-6 text-purple-600" />
                  <CardTitle className="text-lg">User Activity</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-3">Track user activity, resource usage, and access patterns.</p>
                <code className="text-xs bg-gray-900 text-purple-400 px-2 py-1 rounded">GET /users/:id</code>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* User Roles */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">User Roles</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-red-200 bg-red-50/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                    <Crown className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-red-800">Owner</h4>
                    <Badge className="bg-red-100 text-red-800 text-xs">Highest Access</Badge>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-red-600" />
                    <span className="text-red-700">Full organization control</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-red-600" />
                    <span className="text-red-700">Billing and subscription</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-red-600" />
                    <span className="text-red-700">Delete organization</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-800">Admin</h4>
                    <Badge className="bg-blue-100 text-blue-800 text-xs">Management Access</Badge>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-blue-600" />
                    <span className="text-blue-700">User management</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-blue-600" />
                    <span className="text-blue-700">Resource management</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-blue-600" />
                    <span className="text-blue-700">API key management</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-800">Member</h4>
                    <Badge className="bg-green-100 text-green-800 text-xs">Standard Access</Badge>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-green-600" />
                    <span className="text-green-700">Own resources only</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-green-600" />
                    <span className="text-green-700">Limited permissions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-green-600" />
                    <span className="text-green-700">Read-only by default</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Permission System */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Permission System</h2>
          
          <Card className="bg-gray-50/50 border-gray-200">
            <CardHeader>
              <CardTitle>Resource-Based Permissions</CardTitle>
              <CardDescription>
                Fine-grained access control for all VPN Enterprise resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Available Resources</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-2 bg-white rounded border">
                      <Shield className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm text-gray-700">VPN (connections, servers)</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-white rounded border">
                      <div className="h-4 w-4 bg-green-600 rounded"></div>
                      <span className="text-sm text-gray-700">Database (instances, backups)</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-white rounded border">
                      <div className="h-4 w-4 bg-purple-600 rounded"></div>
                      <span className="text-sm text-gray-700">Hosting (sites, deployments)</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-white rounded border">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-gray-700">Users (management)</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Permission Levels</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-2 bg-white rounded border">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-700"><strong>Read:</strong> View resources and data</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-white rounded border">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-700"><strong>Write:</strong> Create and modify resources</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-white rounded border">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-gray-700"><strong>Delete:</strong> Remove resources</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-white rounded border">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="text-sm text-gray-700"><strong>Admin:</strong> Full resource control</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* API Endpoints */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">API Endpoints</h2>
          
          <div className="space-y-8">
            {userEndpoints.map((endpoint, index) => (
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

        {/* Security Best Practices */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Security Best Practices</h2>
          
          <div className="space-y-4">
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-green-800 mb-1">Principle of Least Privilege</h4>
                    <p className="text-green-700 text-sm">
                      Grant users only the minimum permissions required for their role. Regularly review and audit user permissions.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Key className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-1">Two-Factor Authentication</h4>
                    <p className="text-blue-700 text-sm">
                      Enforce 2FA for all users, especially those with administrative privileges. Monitor authentication events.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-amber-800 mb-1">Regular Access Review</h4>
                    <p className="text-amber-700 text-sm">
                      Conduct quarterly access reviews to ensure users have appropriate permissions and remove inactive users.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-linear-to-r from-emerald-50 to-green-50 rounded-xl p-8 border border-emerald-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Next Steps</h2>
          <p className="text-gray-600 mb-6">
            Learn about billing management and webhook integrations for complete platform control.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/docs/api/billing">
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                Billing Management
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