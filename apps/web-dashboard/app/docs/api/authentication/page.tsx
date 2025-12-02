"use client";

import { useState } from 'react';
import { 
  Key, Shield, Lock, Copy, Check, AlertCircle, Info, CheckCircle, Eye, EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DocLayout from '@/components/docs/DocLayout';
import Link from 'next/link';

export default function AuthenticationPage() {
  const [copied, setCopied] = useState<string>('');
  const [showToken, setShowToken] = useState(false);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(''), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const authEndpoints = [
    {
      method: "POST",
      path: "/auth/login",
      description: "Authenticate with email and password to receive an access token",
      request: `{
  "email": "user@company.com",
  "password": "secure_password"
}`,
      response: `{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "rt_abc123def456...",
  "expires_in": 3600,
  "user": {
    "id": "usr_123",
    "email": "user@company.com",
    "name": "John Doe",
    "role": "admin"
  }
}`
    },
    {
      method: "POST",
      path: "/auth/refresh",
      description: "Refresh an expired access token using a refresh token",
      request: `{
  "refresh_token": "rt_abc123def456..."
}`,
      response: `{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600
}`
    },
    {
      method: "POST",
      path: "/auth/logout",
      description: "Invalidate the current access token and refresh token",
      request: `{}`,
      response: `{
  "success": true,
  "message": "Successfully logged out"
}`
    },
    {
      method: "GET",
      path: "/auth/me",
      description: "Get information about the currently authenticated user",
      response: `{
  "success": true,
  "user": {
    "id": "usr_123",
    "email": "user@company.com",
    "name": "John Doe",
    "role": "admin",
    "created_at": "2024-01-15T10:30:00Z",
    "last_login": "2024-12-02T14:20:00Z"
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
          <span className="text-gray-900 font-medium">Authentication</span>
        </div>

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Key className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Authentication</h1>
              <p className="text-lg text-gray-600 mt-2">
                Secure authentication endpoints for managing user sessions and API access
              </p>
            </div>
          </div>
        </div>

        {/* Authentication Overview */}
        <div className="mb-12">
          <Card className="bg-blue-50/50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-blue-600" />
                Authentication Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                VPN Enterprise uses Bearer token authentication. All API requests must include a valid access token in the Authorization header.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Token Format</h4>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">Bearer eyJhbGciOiJIUzI1NiIs...</code>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Token Expiry</h4>
                  <span className="text-sm text-gray-600">3600 seconds (1 hour)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Start */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Start</h2>
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Step 1 */}
            <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <CardTitle className="text-lg">Login</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-3">Authenticate with your credentials to get an access token.</p>
                <div className="bg-gray-900 text-gray-100 p-3 rounded text-xs font-mono overflow-x-auto">
                  <code>POST /auth/login</code>
                </div>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <CardTitle className="text-lg">Use Token</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-3">Include the token in the Authorization header for API requests.</p>
                <div className="bg-gray-900 text-gray-100 p-3 rounded text-xs font-mono overflow-x-auto">
                  <code>Authorization: Bearer TOKEN</code>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* API Endpoints */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">API Endpoints</h2>
          
          <div className="space-y-8">
            {authEndpoints.map((endpoint, index) => (
              <Card key={index} className="bg-white/70 backdrop-blur-sm border-gray-200">
                <CardHeader className="border-b border-gray-200">
                  <div className="flex items-center gap-4 mb-2">
                    <Badge 
                      className={`font-mono font-semibold ${
                        endpoint.method === 'GET' ? 'bg-green-100 text-green-800' :
                        endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800' :
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
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-green-800 mb-1">Secure Token Storage</h4>
                    <p className="text-green-700 text-sm">
                      Store tokens securely in environment variables or secure storage solutions. Never expose tokens in client-side code.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-1">Token Refresh</h4>
                    <p className="text-blue-700 text-sm">
                      Implement automatic token refresh using refresh tokens to maintain session continuity without user intervention.
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
                    <h4 className="font-semibold text-amber-800 mb-1">HTTPS Only</h4>
                    <p className="text-amber-700 text-sm">
                      Always use HTTPS in production. Authentication endpoints will reject HTTP requests in production environments.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Example Implementation */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Example Implementation</h2>
          
          <Tabs defaultValue="javascript" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="javascript">JavaScript</TabsTrigger>
              <TabsTrigger value="python">Python</TabsTrigger>
              <TabsTrigger value="curl">cURL</TabsTrigger>
            </TabsList>
            
            <TabsContent value="javascript" className="mt-4">
              <div className="relative">
                <Button
                  onClick={() => copyToClipboard(`const response = await fetch('https://api.vpnenterprise.com/v1/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@company.com',
    password: 'secure_password'
  })
});

const data = await response.json();
if (data.success) {
  localStorage.setItem('token', data.token);
  // Use token for subsequent requests
  const apiResponse = await fetch('https://api.vpnenterprise.com/v1/auth/me', {
    headers: {
      'Authorization': \`Bearer \${data.token}\`
    }
  });
}`, 'js-example')}
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2 z-10"
                >
                  {copied === 'js-example' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{`const response = await fetch('https://api.vpnenterprise.com/v1/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@company.com',
    password: 'secure_password'
  })
});

const data = await response.json();
if (data.success) {
  localStorage.setItem('token', data.token);
  // Use token for subsequent requests
  const apiResponse = await fetch('https://api.vpnenterprise.com/v1/auth/me', {
    headers: {
      'Authorization': \`Bearer \${data.token}\`
    }
  });
}`}</code>
                </pre>
              </div>
            </TabsContent>
            
            <TabsContent value="python" className="mt-4">
              <div className="relative">
                <Button
                  onClick={() => copyToClipboard(`import requests
import os

# Login
response = requests.post(
    'https://api.vpnenterprise.com/v1/auth/login',
    json={
        'email': 'user@company.com',
        'password': 'secure_password'
    }
)

data = response.json()
if data['success']:
    token = data['token']
    os.environ['VPN_API_TOKEN'] = token
    
    # Use token for subsequent requests
    headers = {'Authorization': f'Bearer {token}'}
    user_response = requests.get(
        'https://api.vpnenterprise.com/v1/auth/me',
        headers=headers
    )`, 'python-example')}
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2 z-10"
                >
                  {copied === 'python-example' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{`import requests
import os

# Login
response = requests.post(
    'https://api.vpnenterprise.com/v1/auth/login',
    json={
        'email': 'user@company.com',
        'password': 'secure_password'
    }
)

data = response.json()
if data['success']:
    token = data['token']
    os.environ['VPN_API_TOKEN'] = token
    
    # Use token for subsequent requests
    headers = {'Authorization': f'Bearer {token}'}
    user_response = requests.get(
        'https://api.vpnenterprise.com/v1/auth/me',
        headers=headers
    )`}</code>
                </pre>
              </div>
            </TabsContent>
            
            <TabsContent value="curl" className="mt-4">
              <div className="relative">
                <Button
                  onClick={() => copyToClipboard(`# Login
curl -X POST https://api.vpnenterprise.com/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@company.com",
    "password": "secure_password"
  }'

# Use the returned token for subsequent requests
curl -X GET https://api.vpnenterprise.com/v1/auth/me \\
  -H "Authorization: Bearer YOUR_TOKEN_HERE"`, 'curl-example')}
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2 z-10"
                >
                  {copied === 'curl-example' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{`# Login
curl -X POST https://api.vpnenterprise.com/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@company.com",
    "password": "secure_password"
  }'

# Use the returned token for subsequent requests
curl -X GET https://api.vpnenterprise.com/v1/auth/me \\
  -H "Authorization: Bearer YOUR_TOKEN_HERE"`}</code>
                </pre>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Next Steps */}
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-8 border border-emerald-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Next Steps</h2>
          <p className="text-gray-600 mb-6">
            Now that you understand authentication, explore other API endpoints to build your application.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/docs/api/vpn">
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                VPN Endpoints
              </Button>
            </Link>
            <Link href="/docs/api/database">
              <Button variant="outline" className="border-emerald-300 text-emerald-600 hover:bg-emerald-50">
                Database Endpoints
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </DocLayout>
  );
}