"use client";

import { useState } from 'react';
import { 
  Server, Globe, Zap, Shield, Copy, Check, AlertCircle, Info, ExternalLink, GitBranch
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DocLayout from '@/components/docs/DocLayout';
import Link from 'next/link';

export default function HostingEndpointsPage() {
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

  const hostingEndpoints = [
    {
      method: "GET",
      path: "/hosting/sites",
      description: "List all hosted sites for the authenticated user",
      response: `{
  "success": true,
  "sites": [
    {
      "id": "site_123",
      "name": "my-website",
      "domain": "my-website.com",
      "status": "active",
      "ssl_enabled": true,
      "region": "global",
      "framework": "nextjs",
      "created_at": "2024-01-15T10:30:00Z",
      "last_deployment": "2024-12-02T14:20:00Z",
      "url": "https://my-website.com",
      "preview_url": "https://preview-abc123.vpnenterprise.app",
      "git_repo": "https://github.com/user/my-website",
      "branch": "main"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}`
    },
    {
      method: "POST",
      path: "/hosting/sites",
      description: "Deploy a new site from a Git repository",
      request: `{
  "name": "my-portfolio",
  "domain": "portfolio.example.com",
  "git_repo": "https://github.com/user/portfolio.git",
  "branch": "main",
  "framework": "react",
  "build_command": "npm run build",
  "output_directory": "dist",
  "environment_variables": {
    "NODE_ENV": "production",
    "API_URL": "https://api.example.com"
  }
}`,
      response: `{
  "success": true,
  "site": {
    "id": "site_124",
    "name": "my-portfolio",
    "domain": "portfolio.example.com",
    "status": "deploying",
    "url": "https://portfolio.example.com",
    "preview_url": "https://preview-def456.vpnenterprise.app",
    "estimated_deployment_time": "3-5 minutes"
  }
}`
    },
    {
      method: "GET",
      path: "/hosting/sites/:id",
      description: "Get details of a specific hosted site",
      response: `{
  "success": true,
  "site": {
    "id": "site_123",
    "name": "my-website",
    "domain": "my-website.com",
    "status": "active",
    "ssl_enabled": true,
    "region": "global",
    "framework": "nextjs",
    "created_at": "2024-01-15T10:30:00Z",
    "last_deployment": "2024-12-02T14:20:00Z",
    "git_repo": "https://github.com/user/my-website",
    "branch": "main",
    "build_settings": {
      "build_command": "npm run build",
      "output_directory": "out",
      "node_version": "18"
    },
    "metrics": {
      "requests_24h": 12450,
      "bandwidth_24h": "156MB",
      "uptime": "99.9%"
    }
  }
}`
    },
    {
      method: "PUT",
      path: "/hosting/sites/:id",
      description: "Update site configuration",
      request: `{
  "domain": "new-domain.com",
  "branch": "production",
  "environment_variables": {
    "API_URL": "https://api.production.com"
  }
}`,
      response: `{
  "success": true,
  "site": {
    "id": "site_123",
    "domain": "new-domain.com",
    "branch": "production",
    "redeployment_triggered": true,
    "updated_at": "2024-12-02T15:30:00Z"
  }
}`
    },
    {
      method: "DELETE",
      path: "/hosting/sites/:id",
      description: "Delete a hosted site",
      response: `{
  "success": true,
  "message": "Site deleted successfully",
  "id": "site_123",
  "domain": "my-website.com"
}`
    },
    {
      method: "POST",
      path: "/hosting/sites/:id/deploy",
      description: "Trigger a new deployment for a site",
      request: `{
  "branch": "main",
  "message": "Manual deployment trigger"
}`,
      response: `{
  "success": true,
  "deployment": {
    "id": "dep_456",
    "site_id": "site_123",
    "status": "building",
    "branch": "main",
    "commit": "abc123def456",
    "estimated_completion": "2024-12-02T15:35:00Z"
  }
}`
    },
    {
      method: "GET",
      path: "/hosting/sites/:id/deployments",
      description: "List deployment history for a site",
      response: `{
  "success": true,
  "deployments": [
    {
      "id": "dep_456",
      "status": "success",
      "branch": "main",
      "commit": "abc123def456",
      "message": "Update homepage content",
      "started_at": "2024-12-02T14:20:00Z",
      "completed_at": "2024-12-02T14:23:00Z",
      "duration": "3m 15s"
    }
  ],
  "total": 25
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
          <span className="text-gray-900 font-medium">Hosting Endpoints</span>
        </div>

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Server className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Hosting Endpoints</h1>
              <p className="text-lg text-gray-600 mt-2">
                Deploy and manage websites and applications with global CDN and automatic SSL
              </p>
            </div>
          </div>
        </div>

        {/* Hosting Overview */}
        <div className="mb-12">
          <Card className="bg-purple-50/50 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-purple-600" />
                Hosting Platform Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Global static site hosting with automatic deployments from Git repositories. Support for popular frameworks and custom build commands.
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Frameworks</h4>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline">React</Badge>
                    <Badge variant="outline">Next.js</Badge>
                    <Badge variant="outline">Vue</Badge>
                    <Badge variant="outline">Angular</Badge>
                  </div>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Features</h4>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline">Auto SSL</Badge>
                    <Badge variant="outline">Global CDN</Badge>
                    <Badge variant="outline">Git Deploy</Badge>
                  </div>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Performance</h4>
                  <span className="text-sm text-gray-600">99.9% Uptime, Global Edge Network</span>
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
                  <GitBranch className="h-6 w-6 text-emerald-600" />
                  <CardTitle className="text-lg">Deploy Site</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-3">Deploy a new site directly from your Git repository with automatic builds.</p>
                <code className="text-xs bg-gray-900 text-green-400 px-2 py-1 rounded">POST /hosting/sites</code>
              </CardContent>
            </Card>

            <Card className="bg-linear-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Globe className="h-6 w-6 text-blue-600" />
                  <CardTitle className="text-lg">Custom Domain</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-3">Configure custom domains with automatic SSL certificate provisioning.</p>
                <code className="text-xs bg-gray-900 text-blue-400 px-2 py-1 rounded">PUT /hosting/sites/:id</code>
              </CardContent>
            </Card>

            <Card className="bg-linear-to-br from-orange-50 to-red-50 border-orange-200">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Zap className="h-6 w-6 text-orange-600" />
                  <CardTitle className="text-lg">Trigger Deploy</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-3">Manually trigger deployments or set up automatic deployments on push.</p>
                <code className="text-xs bg-gray-900 text-orange-400 px-2 py-1 rounded">POST /hosting/sites/:id/deploy</code>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Supported Frameworks */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Supported Frameworks</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">R</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-800">React</h4>
                    <p className="text-blue-700 text-sm">Create React App, Vite, Custom builds</p>
                  </div>
                </div>
                <code className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">npm run build</code>
              </CardContent>
            </Card>

            <Card className="border-gray-200 bg-gray-50/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">N</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Next.js</h4>
                    <p className="text-gray-700 text-sm">Static export, Server-side generation</p>
                  </div>
                </div>
                <code className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">npm run build && npm run export</code>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">V</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-800">Vue.js</h4>
                    <p className="text-green-700 text-sm">Vue CLI, Vite, Nuxt.js static</p>
                  </div>
                </div>
                <code className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">npm run build</code>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">A</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-red-800">Angular</h4>
                    <p className="text-red-700 text-sm">Angular CLI, Universal</p>
                  </div>
                </div>
                <code className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">ng build --prod</code>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* API Endpoints */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">API Endpoints</h2>
          
          <div className="space-y-8">
            {hostingEndpoints.map((endpoint, index) => (
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

        {/* Deployment Status */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Deployment Status</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <h4 className="font-semibold text-green-800">Success</h4>
                    <p className="text-green-700 text-sm">Site deployed successfully and is live</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <div>
                    <h4 className="font-semibold text-blue-800">Building</h4>
                    <p className="text-blue-700 text-sm">Build process is currently running</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 bg-yellow-50/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div>
                    <h4 className="font-semibold text-yellow-800">Queued</h4>
                    <p className="text-yellow-700 text-sm">Deployment is queued and waiting to start</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div>
                    <h4 className="font-semibold text-red-800">Failed</h4>
                    <p className="text-red-700 text-sm">Build or deployment failed with errors</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Environment Variables */}
        <div className="mb-12">
          <Card className="bg-amber-50/50 border-amber-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Info className="h-5 w-5 text-amber-600" />
                Environment Variables
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                Configure environment variables for your deployments. These are injected during the build process.
              </p>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm">
                <code>{`{
  "environment_variables": {
    "NODE_ENV": "production",
    "API_URL": "https://api.mysite.com",
    "ANALYTICS_ID": "GA-XXXXXXXXX"
  }
}`}</code>
              </div>
              <div className="mt-4 p-3 bg-amber-100 border-l-4 border-amber-500 rounded-r-lg">
                <p className="text-amber-800 text-sm">
                  <strong>Security Note:</strong> Avoid storing sensitive data in environment variables for client-side builds, as they become part of the public bundle.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Next Steps */}
        <div className="bg-linear-to-r from-emerald-50 to-green-50 rounded-xl p-8 border border-emerald-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Next Steps</h2>
          <p className="text-gray-600 mb-6">
            Ready to deploy your first site? Check out our other API endpoints and integrations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/docs/api/webhooks">
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                Setup Webhooks
              </Button>
            </Link>
            <Link href="/docs/sdk/javascript">
              <Button variant="outline" className="border-emerald-300 text-emerald-600 hover:bg-emerald-50">
                JavaScript SDK
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </DocLayout>
  );
}