"use client";

import { useState } from 'react';
import { 
  Shield, Server, Network, MapPin, Copy, Check, AlertCircle, Info, Play, Pause
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DocLayout from '@/components/docs/DocLayout';
import Link from 'next/link';

export default function VpnEndpointsPage() {
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

  const vpnEndpoints = [
    {
      method: "GET",
      path: "/vpn/connections",
      description: "List all VPN connections for the authenticated user",
      response: `{
  "success": true,
  "connections": [
    {
      "id": "vpn_123",
      "name": "my-connection",
      "status": "active",
      "location": "us-east-1",
      "protocol": "wireguard",
      "created_at": "2024-01-15T10:30:00Z",
      "connected_at": "2024-12-02T14:20:00Z",
      "data_usage": {
        "upload": 1024000,
        "download": 2048000
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
      path: "/vpn/connections",
      description: "Create a new VPN connection",
      request: `{
  "name": "my-vpn-connection",
  "location": "us-east-1",
  "protocol": "wireguard"
}`,
      response: `{
  "success": true,
  "connection": {
    "id": "vpn_124",
    "name": "my-vpn-connection",
    "status": "creating",
    "location": "us-east-1",
    "protocol": "wireguard",
    "config": {
      "endpoint": "vpn-us-east-1.vpnenterprise.com:51820",
      "public_key": "abc123def456...",
      "private_key": "xyz789uvw012...",
      "allowed_ips": "0.0.0.0/0",
      "dns": ["1.1.1.1", "8.8.8.8"]
    }
  }
}`
    },
    {
      method: "GET",
      path: "/vpn/connections/:id",
      description: "Get details of a specific VPN connection",
      response: `{
  "success": true,
  "connection": {
    "id": "vpn_123",
    "name": "my-connection",
    "status": "active",
    "location": "us-east-1",
    "protocol": "wireguard",
    "created_at": "2024-01-15T10:30:00Z",
    "last_activity": "2024-12-02T14:20:00Z",
    "config": {
      "endpoint": "vpn-us-east-1.vpnenterprise.com:51820",
      "public_key": "abc123def456..."
    },
    "stats": {
      "uptime": "2 days, 4 hours",
      "data_usage": {
        "upload": 1024000,
        "download": 2048000
      }
    }
  }
}`
    },
    {
      method: "PUT",
      path: "/vpn/connections/:id",
      description: "Update VPN connection settings",
      request: `{
  "name": "updated-connection-name",
  "auto_connect": true
}`,
      response: `{
  "success": true,
  "connection": {
    "id": "vpn_123",
    "name": "updated-connection-name",
    "auto_connect": true,
    "updated_at": "2024-12-02T14:20:00Z"
  }
}`
    },
    {
      method: "DELETE",
      path: "/vpn/connections/:id",
      description: "Delete a VPN connection",
      response: `{
  "success": true,
  "message": "VPN connection deleted successfully",
  "id": "vpn_123"
}`
    },
    {
      method: "GET",
      path: "/vpn/servers",
      description: "List available VPN servers and locations",
      response: `{
  "success": true,
  "servers": [
    {
      "id": "srv_us_east_1",
      "location": "us-east-1",
      "city": "New York",
      "country": "United States",
      "country_code": "US",
      "load": 45,
      "latency": 23,
      "protocols": ["wireguard", "openvpn"],
      "status": "online"
    },
    {
      "id": "srv_eu_west_1",
      "location": "eu-west-1", 
      "city": "London",
      "country": "United Kingdom",
      "country_code": "GB",
      "load": 67,
      "latency": 18,
      "protocols": ["wireguard", "openvpn"],
      "status": "online"
    }
  ]
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
          <span className="text-gray-900 font-medium">VPN Endpoints</span>
        </div>

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <Shield className="h-8 w-8 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">VPN Endpoints</h1>
              <p className="text-lg text-gray-600 mt-2">
                Manage VPN connections, servers, and configurations programmatically
              </p>
            </div>
          </div>
        </div>

        {/* VPN Overview */}
        <div className="mb-12">
          <Card className="bg-emerald-50/50 border-emerald-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Network className="h-5 w-5 text-emerald-600" />
                VPN Management Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                The VPN API allows you to create, manage, and monitor VPN connections. Support for WireGuard and OpenVPN protocols with global server locations.
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Protocols</h4>
                  <div className="flex gap-2">
                    <Badge variant="outline">WireGuard</Badge>
                    <Badge variant="outline">OpenVPN</Badge>
                  </div>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Locations</h4>
                  <span className="text-sm text-gray-600">50+ Global Servers</span>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Security</h4>
                  <span className="text-sm text-gray-600">AES-256 Encryption</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-6">
            
            <Card className="bg-linear-to-br from-green-50 to-emerald-50 border-green-200">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Play className="h-6 w-6 text-green-600" />
                  <CardTitle className="text-lg">Create Connection</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-3">Set up a new VPN connection with your preferred location and protocol.</p>
                <code className="text-xs bg-gray-900 text-green-400 px-2 py-1 rounded">POST /vpn/connections</code>
              </CardContent>
            </Card>

            <Card className="bg-linear-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <MapPin className="h-6 w-6 text-blue-600" />
                  <CardTitle className="text-lg">Browse Servers</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-3">Explore available VPN servers and their current load status.</p>
                <code className="text-xs bg-gray-900 text-blue-400 px-2 py-1 rounded">GET /vpn/servers</code>
              </CardContent>
            </Card>

            <Card className="bg-linear-to-br from-purple-50 to-violet-50 border-purple-200">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Server className="h-6 w-6 text-purple-600" />
                  <CardTitle className="text-lg">Monitor Usage</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-3">Track connection stats, data usage, and connection history.</p>
                <code className="text-xs bg-gray-900 text-purple-400 px-2 py-1 rounded">GET /vpn/connections/:id</code>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* API Endpoints */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">API Endpoints</h2>
          
          <div className="space-y-8">
            {vpnEndpoints.map((endpoint, index) => (
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

        {/* Connection States */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Connection States</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <h4 className="font-semibold text-green-800">Active</h4>
                    <p className="text-green-700 text-sm">Connection is established and data is flowing</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <div>
                    <h4 className="font-semibold text-blue-800">Connecting</h4>
                    <p className="text-blue-700 text-sm">Establishing connection to VPN server</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 bg-gray-50/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Inactive</h4>
                    <p className="text-gray-700 text-sm">Connection is configured but not active</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div>
                    <h4 className="font-semibold text-red-800">Error</h4>
                    <p className="text-red-700 text-sm">Connection failed or encountered an error</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Usage Examples */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Usage Examples</h2>
          
          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="create">Create Connection</TabsTrigger>
              <TabsTrigger value="monitor">Monitor Status</TabsTrigger>
              <TabsTrigger value="servers">List Servers</TabsTrigger>
            </TabsList>
            
            <TabsContent value="create" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Create a New VPN Connection</CardTitle>
                  <CardDescription>Example of creating a WireGuard connection in the US East region</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Button
                      onClick={() => copyToClipboard(`curl -X POST https://api.vpnenterprise.com/v1/vpn/connections \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "my-us-vpn",
    "location": "us-east-1",
    "protocol": "wireguard"
  }'`, 'create-example')}
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 z-10"
                    >
                      {copied === 'create-example' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{`curl -X POST https://api.vpnenterprise.com/v1/vpn/connections \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "my-us-vpn",
    "location": "us-east-1",
    "protocol": "wireguard"
  }'`}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="monitor" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Monitor Connection Status</CardTitle>
                  <CardDescription>Check connection details and usage statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Button
                      onClick={() => copyToClipboard(`curl -X GET https://api.vpnenterprise.com/v1/vpn/connections/vpn_123 \\
  -H "Authorization: Bearer YOUR_TOKEN"`, 'monitor-example')}
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 z-10"
                    >
                      {copied === 'monitor-example' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{`curl -X GET https://api.vpnenterprise.com/v1/vpn/connections/vpn_123 \\
  -H "Authorization: Bearer YOUR_TOKEN"`}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="servers" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>List Available Servers</CardTitle>
                  <CardDescription>Get all available VPN servers with load information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Button
                      onClick={() => copyToClipboard(`curl -X GET https://api.vpnenterprise.com/v1/vpn/servers \\
  -H "Authorization: Bearer YOUR_TOKEN"`, 'servers-example')}
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 z-10"
                    >
                      {copied === 'servers-example' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{`curl -X GET https://api.vpnenterprise.com/v1/vpn/servers \\
  -H "Authorization: Bearer YOUR_TOKEN"`}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Next Steps */}
        <div className="bg-linear-to-r from-emerald-50 to-green-50 rounded-xl p-8 border border-emerald-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Next Steps</h2>
          <p className="text-gray-600 mb-6">
            Explore other API endpoints to build a comprehensive VPN management solution.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/docs/api/database">
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                Database Endpoints
              </Button>
            </Link>
            <Link href="/docs/api/hosting">
              <Button variant="outline" className="border-emerald-300 text-emerald-600 hover:bg-emerald-50">
                Hosting Endpoints
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </DocLayout>
  );
}