"use client";

import { useState } from 'react';
import { 
  BookOpen, Code, Shield, Database, Server, 
  Zap, Globe, Key, Copy, Check,
  FileText, ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DocLayout from '@/components/docs/DocLayout';
import Link from 'next/link';

export default function ApiOverviewPage() {
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

  return (
    <DocLayout>
      <div className="px-6 py-8">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/docs" className="hover:text-gray-900">Documentation</Link>
          <span>›</span>
          <Link href="/docs/api" className="hover:text-gray-900">API Reference</Link>
          <span>›</span>
          <span className="text-gray-900 font-medium">Overview</span>
        </div>

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            API Overview
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed max-w-3xl">
            Complete reference for the VPN Enterprise REST API. Manage VPN connections, databases, 
            hosting, and more programmatically with our comprehensive API.
          </p>
        </div>

        {/* API Info Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-blue-50/50 border-blue-200">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Globe className="h-5 w-5 text-blue-600" />
                </div>
                <CardTitle className="text-lg">Base URL</CardTitle>
              </div>
              <code className="text-sm bg-white px-3 py-2 rounded border block">
                https://api.vpnenterprise.com/v1
              </code>
            </CardHeader>
          </Card>

          <Card className="bg-green-50/50 border-green-200">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Key className="h-5 w-5 text-green-600" />
                </div>
                <CardTitle className="text-lg">Authentication</CardTitle>
              </div>
              <code className="text-sm bg-white px-3 py-2 rounded border block">
                Bearer TOKEN
              </code>
            </CardHeader>
          </Card>

          <Card className="bg-purple-50/50 border-purple-200">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
                <CardTitle className="text-lg">Response Format</CardTitle>
              </div>
              <code className="text-sm bg-white px-3 py-2 rounded border block">
                JSON
              </code>
            </CardHeader>
          </Card>
        </div>

        {/* Authentication Section */}
        <div className="mb-12">
          <Card className="bg-slate-50/50 border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Key className="h-5 w-5 text-blue-600" />
                </div>
                Authentication
              </CardTitle>
              <CardDescription className="text-base">
                All API requests require authentication using a Bearer token. Include your API token in the Authorization header.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-400">Example Request</span>
                  <Button
                    onClick={() => copyToClipboard('curl -H "Authorization: Bearer YOUR_API_KEY" https://api.vpnenterprise.com/v1/vpn/connections', 'auth-example')}
                    size="sm"
                    variant="ghost"
                    className="text-gray-400 hover:text-gray-200 h-8 w-8 p-0"
                  >
                    {copied === 'auth-example' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <code>
                  curl -H "Authorization: Bearer YOUR_API_KEY" \<br />
                  &nbsp;&nbsp;https://api.vpnenterprise.com/v1/vpn/connections
                </code>
              </div>
              
              <div className="mt-6 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg">
                <h4 className="font-semibold text-amber-800 mb-2">🔐 Keep your API key secure</h4>
                <p className="text-amber-700 text-sm">
                  Never expose your API key in client-side code or public repositories. 
                  Store it securely in environment variables or your preferred secret management system.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rate Limiting Section */}
        <div className="mb-12">
          <Card className="bg-amber-50/50 border-amber-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Zap className="h-5 w-5 text-amber-600" />
                </div>
                Rate Limits
              </CardTitle>
              <CardDescription className="text-base">
                API requests are rate limited to ensure fair usage and system stability. Rate limits vary by plan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6 text-center">
                <div className="p-4 bg-white rounded-lg border">
                  <div className="text-2xl font-bold text-amber-700 mb-2">1,000</div>
                  <div className="text-sm text-amber-600 font-medium">Free Plan</div>
                  <div className="text-xs text-gray-500 mt-1">requests/hour</div>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <div className="text-2xl font-bold text-amber-700 mb-2">10,000</div>
                  <div className="text-sm text-amber-600 font-medium">Pro Plan</div>
                  <div className="text-xs text-gray-500 mt-1">requests/hour</div>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <div className="text-2xl font-bold text-amber-700 mb-2">100,000</div>
                  <div className="text-sm text-amber-600 font-medium">Enterprise</div>
                  <div className="text-xs text-gray-500 mt-1">requests/hour</div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">📊 Rate Limit Headers</h4>
                <p className="text-blue-700 text-sm mb-3">
                  Every API response includes headers to help you track your usage:
                </p>
                <div className="bg-gray-900 text-gray-100 p-3 rounded text-xs font-mono">
                  <code>
                    X-RateLimit-Limit: 1000<br />
                    X-RateLimit-Remaining: 999<br />
                    X-RateLimit-Reset: 1640995200
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Service Categories */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">API Categories</h2>
          <div className="grid md:grid-cols-2 gap-6">
            
            <Link href="/docs/api/auth">
              <Card className="group h-full bg-white/70 backdrop-blur-sm hover:bg-white/90 border-gray-200 hover:border-emerald-300 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                      <Key className="h-5 w-5 text-blue-600" />
                    </div>
                    <CardTitle className="group-hover:text-emerald-600 transition-colors">
                      Authentication
                    </CardTitle>
                  </div>
                  <CardDescription>
                    Manage user authentication, tokens, and session handling
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/docs/api/vpn">
              <Card className="group h-full bg-white/70 backdrop-blur-sm hover:bg-white/90 border-gray-200 hover:border-emerald-300 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                      <Shield className="h-5 w-5 text-emerald-600" />
                    </div>
                    <CardTitle className="group-hover:text-emerald-600 transition-colors">
                      VPN Management
                    </CardTitle>
                  </div>
                  <CardDescription>
                    Create, configure, and manage VPN connections and servers
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/docs/api/database">
              <Card className="group h-full bg-white/70 backdrop-blur-sm hover:bg-white/90 border-gray-200 hover:border-emerald-300 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                      <Database className="h-5 w-5 text-green-600" />
                    </div>
                    <CardTitle className="group-hover:text-emerald-600 transition-colors">
                      Database Management
                    </CardTitle>
                  </div>
                  <CardDescription>
                    Provision, scale, and manage your databases programmatically
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href="/docs/api/hosting">
              <Card className="group h-full bg-white/70 backdrop-blur-sm hover:bg-white/90 border-gray-200 hover:border-emerald-300 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                      <Server className="h-5 w-5 text-purple-600" />
                    </div>
                    <CardTitle className="group-hover:text-emerald-600 transition-colors">
                      Hosting Management
                    </CardTitle>
                  </div>
                  <CardDescription>
                    Deploy and manage websites, applications, and static content
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>

        {/* Error Handling */}
        <div className="mb-12">
          <Card className="bg-red-50/50 border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Code className="h-5 w-5 text-red-600" />
                </div>
                Error Handling
              </CardTitle>
              <CardDescription className="text-base">
                Our API uses conventional HTTP response codes to indicate the success or failure of requests.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <code className="bg-green-100 text-green-800 px-2 py-1 rounded font-mono text-sm">200</code>
                    <span className="text-green-800 font-medium">OK - Request successful</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <code className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-mono text-sm">201</code>
                    <span className="text-blue-800 font-medium">Created - Resource created</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <code className="bg-orange-100 text-orange-800 px-2 py-1 rounded font-mono text-sm">400</code>
                    <span className="text-orange-800 font-medium">Bad Request - Invalid parameters</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <code className="bg-red-100 text-red-800 px-2 py-1 rounded font-mono text-sm">401</code>
                    <span className="text-red-800 font-medium">Unauthorized - Invalid API key</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <code className="bg-red-100 text-red-800 px-2 py-1 rounded font-mono text-sm">404</code>
                    <span className="text-red-800 font-medium">Not Found - Resource not found</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <code className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-mono text-sm">429</code>
                    <span className="text-yellow-800 font-medium">Rate Limited - Too many requests</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Next Steps */}
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-8 border border-emerald-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to get started?</h2>
          <p className="text-gray-600 mb-6">
            Explore our API endpoints and start building with VPN Enterprise.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/docs/api/auth">
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                View Authentication Guide
              </Button>
            </Link>
            <Link href="/docs/api/vpn">
              <Button variant="outline" className="border-emerald-300 text-emerald-600 hover:bg-emerald-50">
                Explore VPN Endpoints
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </DocLayout>
  );
}