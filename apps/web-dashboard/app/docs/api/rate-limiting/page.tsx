"use client";

import { useState } from 'react';
import { 
  Timer, Shield, AlertCircle, TrendingDown, Copy, Check, Info, 
  Clock, BarChart3, Gauge, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DocLayout from '@/components/docs/DocLayout';
import Link from 'next/link';

export default function RateLimitingPage() {
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

  const rateLimitEndpoints = [
    {
      method: "GET",
      path: "/rate-limits/status",
      description: "Check current rate limit status for your API key",
      response: `{
  "success": true,
  "rate_limits": {
    "requests": {
      "limit": 5000,
      "remaining": 4847,
      "reset": 1701619200,
      "reset_time": "2024-12-03T12:00:00Z"
    },
    "burst": {
      "limit": 100,
      "remaining": 94,
      "window": 60
    }
  },
  "plan": "pro",
  "usage_percentage": 3.06
}`
    },
    {
      method: "GET",
      path: "/rate-limits/usage",
      description: "Get detailed rate limit usage statistics",
      response: `{
  "success": true,
  "current_period": {
    "start": "2024-12-01T00:00:00Z",
    "end": "2024-12-31T23:59:59Z"
  },
  "usage": {
    "total_requests": 153847,
    "successful_requests": 152340,
    "rate_limited_requests": 1507,
    "error_requests": 0,
    "daily_average": 5128,
    "peak_rps": 45
  },
  "limits": {
    "monthly_requests": 100000,
    "burst_per_minute": 100,
    "concurrent_requests": 50
  },
  "plan": "pro",
  "upgrade_recommendation": null
}`
    },
    {
      method: "GET",
      path: "/rate-limits/history",
      description: "Get historical rate limit usage data",
      response: `{
  "success": true,
  "history": [
    {
      "date": "2024-12-01",
      "requests": 4832,
      "rate_limited": 12,
      "success_rate": 99.75
    },
    {
      "date": "2024-11-30",
      "requests": 5124,
      "rate_limited": 24,
      "success_rate": 99.53
    }
  ],
  "summary": {
    "total_days": 30,
    "average_daily_requests": 5089,
    "total_rate_limited": 456,
    "overall_success_rate": 99.12
  }
}`
    }
  ];

  const rateLimitPlans = [
    {
      plan: "Starter",
      color: "green",
      limits: {
        monthly: "10,000",
        burst: "20/min",
        concurrent: "10"
      },
      price: "$29/month"
    },
    {
      plan: "Pro",
      color: "blue",
      limits: {
        monthly: "100,000",
        burst: "100/min",
        concurrent: "50"
      },
      price: "$79/month"
    },
    {
      plan: "Enterprise",
      color: "purple",
      limits: {
        monthly: "Unlimited",
        burst: "500/min",
        concurrent: "200"
      },
      price: "$199/month"
    }
  ];

  const responseHeaders = [
    {
      header: "X-RateLimit-Limit",
      description: "Maximum requests allowed in the current window",
      example: "5000"
    },
    {
      header: "X-RateLimit-Remaining",
      description: "Number of requests remaining in current window",
      example: "4847"
    },
    {
      header: "X-RateLimit-Reset",
      description: "Unix timestamp when the rate limit resets",
      example: "1701619200"
    },
    {
      header: "X-RateLimit-Window",
      description: "Rate limit window in seconds",
      example: "3600"
    },
    {
      header: "Retry-After",
      description: "Seconds to wait before retrying (when rate limited)",
      example: "60"
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
          <span className="text-gray-900 font-medium">Rate Limiting</span>
        </div>

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-amber-100 rounded-xl">
              <Gauge className="h-8 w-8 text-amber-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Rate Limiting</h1>
              <p className="text-lg text-gray-600 mt-2">
                API usage limits, monitoring, and best practices
              </p>
            </div>
          </div>
        </div>

        {/* Rate Limiting Overview */}
        <div className="mb-12">
          <Card className="bg-amber-50/50 border-amber-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Timer className="h-5 w-5 text-amber-600" />
                Rate Limiting Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                VPN Enterprise implements intelligent rate limiting to ensure fair usage and optimal performance for all users. 
                Limits are enforced per API key and vary by subscription plan.
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Request Limits</h4>
                  <span className="text-sm text-gray-600">Monthly and burst rate limits</span>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Plan-Based</h4>
                  <span className="text-sm text-gray-600">Different limits for each plan tier</span>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Monitoring</h4>
                  <span className="text-sm text-gray-600">Real-time usage tracking</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Understanding */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Understanding Rate Limits</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-linear-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Time-Based Limits
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Monthly Quota</span>
                  <Badge variant="outline">Overall usage limit</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Burst Rate</span>
                  <Badge variant="outline">Per-minute limit</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Concurrent</span>
                  <Badge variant="outline">Simultaneous requests</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-linear-to-br from-green-50 to-emerald-50 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  Response Headers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-gray-700 text-sm mb-3">Every API response includes rate limit headers:</p>
                <div className="space-y-2">
                  <code className="block text-xs bg-gray-900 text-green-400 px-2 py-1 rounded">
                    X-RateLimit-Limit: 5000
                  </code>
                  <code className="block text-xs bg-gray-900 text-green-400 px-2 py-1 rounded">
                    X-RateLimit-Remaining: 4847
                  </code>
                  <code className="block text-xs bg-gray-900 text-green-400 px-2 py-1 rounded">
                    X-RateLimit-Reset: 1701619200
                  </code>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Plan Limits */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Rate Limits by Plan</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {rateLimitPlans.map((plan, index) => (
              <Card 
                key={index} 
                className={`${
                  plan.color === 'green' ? 'border-green-200 bg-green-50/50' :
                  plan.color === 'blue' ? 'border-blue-200 bg-blue-50/50' :
                  'border-purple-200 bg-purple-50/50'
                }`}
              >
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <h4 className="text-xl font-bold text-gray-900">{plan.plan}</h4>
                    <p className="text-gray-600 mt-1">{plan.price}</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                      <span className="text-gray-700 font-medium">Monthly Requests</span>
                      <Badge className={`${
                        plan.color === 'green' ? 'bg-green-100 text-green-800' :
                        plan.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {plan.limits.monthly}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                      <span className="text-gray-700 font-medium">Burst Rate</span>
                      <Badge className={`${
                        plan.color === 'green' ? 'bg-green-100 text-green-800' :
                        plan.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {plan.limits.burst}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg border">
                      <span className="text-gray-700 font-medium">Concurrent</span>
                      <Badge className={`${
                        plan.color === 'green' ? 'bg-green-100 text-green-800' :
                        plan.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {plan.limits.concurrent}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Current Usage Example */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Current Usage (Example)</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-linear-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Monthly Usage</p>
                    <p className="text-2xl font-bold text-gray-900">15.3k / 100k</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4 bg-blue-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '15%' }}></div>
                </div>
                <p className="text-xs text-blue-700 mt-1">15% used</p>
              </CardContent>
            </Card>

            <Card className="bg-linear-to-br from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Burst Rate</p>
                    <p className="text-2xl font-bold text-gray-900">23 / 100</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Zap className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-4 bg-green-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '23%' }}></div>
                </div>
                <p className="text-xs text-green-700 mt-1">23% used (per minute)</p>
              </CardContent>
            </Card>

            <Card className="bg-linear-to-br from-purple-50 to-violet-50 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Concurrent</p>
                    <p className="text-2xl font-bold text-gray-900">8 / 50</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Timer className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="mt-4 bg-purple-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: '16%' }}></div>
                </div>
                <p className="text-xs text-purple-700 mt-1">16% used (active)</p>
              </CardContent>
            </Card>

            <Card className="bg-linear-to-br from-amber-50 to-yellow-50 border-amber-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Rate Limited</p>
                    <p className="text-2xl font-bold text-gray-900">0.3%</p>
                  </div>
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                    <TrendingDown className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
                <div className="mt-4 bg-amber-200 rounded-full h-2">
                  <div className="bg-amber-600 h-2 rounded-full" style={{ width: '0.3%' }}></div>
                </div>
                <p className="text-xs text-amber-700 mt-1">Very low error rate</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* HTTP Headers */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Rate Limit Headers</h2>
          
          <Card className="bg-gray-50/50 border-gray-200">
            <CardHeader>
              <CardTitle>Response Headers</CardTitle>
              <CardDescription>
                Every API response includes these rate limiting headers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {responseHeaders.map((header, index) => (
                  <div key={index} className="p-4 bg-white rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <code className="text-sm font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        {header.header}
                      </code>
                      <Badge variant="outline" className="text-xs">
                        {header.example}
                      </Badge>
                    </div>
                    <p className="text-gray-700 text-sm">{header.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error Response */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Rate Limited Response</h2>
          
          <Card className="bg-red-50/50 border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-red-800">
                <AlertCircle className="h-5 w-5" />
                HTTP 429 - Too Many Requests
              </CardTitle>
              <CardDescription>
                Response when rate limit is exceeded
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Button
                  onClick={() => copyToClipboard(`HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 5000
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1701619200
Retry-After: 3600
Content-Type: application/json

{
  "success": false,
  "error": {
    "type": "rate_limit_exceeded",
    "message": "API rate limit exceeded",
    "details": {
      "limit": 5000,
      "window": "1 hour",
      "reset_at": "2024-12-03T12:00:00Z",
      "retry_after": 3600
    }
  }
}`, 'rate-limit-error')}
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                >
                  {copied === 'rate-limit-error' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{`HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 5000
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1701619200
Retry-After: 3600
Content-Type: application/json

{
  "success": false,
  "error": {
    "type": "rate_limit_exceeded",
    "message": "API rate limit exceeded",
    "details": {
      "limit": 5000,
      "window": "1 hour",
      "reset_at": "2024-12-03T12:00:00Z",
      "retry_after": 3600
    }
  }
}`}</code>
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* API Endpoints */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Rate Limit API Endpoints</h2>
          
          <div className="space-y-8">
            {rateLimitEndpoints.map((endpoint, index) => (
              <Card key={index} className="bg-white/70 backdrop-blur-sm border-gray-200">
                <CardHeader className="border-b border-gray-200">
                  <div className="flex items-center gap-4 mb-2">
                    <Badge className="bg-green-100 text-green-800 font-mono font-semibold">
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
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Best Practices */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Best Practices</h2>
          
          <div className="space-y-4">
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-green-800 mb-1">Monitor Headers</h4>
                    <p className="text-green-700 text-sm">
                      Check rate limit headers in every response to track usage and avoid hitting limits unexpectedly.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Timer className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-1">Implement Backoff</h4>
                    <p className="text-blue-700 text-sm">
                      Use exponential backoff when rate limited. Respect the Retry-After header for optimal retry timing.
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
                    <h4 className="font-semibold text-amber-800 mb-1">Plan for Growth</h4>
                    <p className="text-amber-700 text-sm">
                      Monitor your usage patterns and upgrade your plan before hitting limits regularly to ensure smooth operation.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Implementation Example */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Implementation Example</h2>
          
          <Card className="bg-gray-50/50 border-gray-200">
            <CardHeader>
              <CardTitle>Rate Limit Handling in JavaScript</CardTitle>
              <CardDescription>
                Example implementation with exponential backoff
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Button
                  onClick={() => copyToClipboard(`async function apiRequest(url, options = {}) {
  const maxRetries = 3;
  let retryCount = 0;
  
  while (retryCount <= maxRetries) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': 'Bearer your-api-key',
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      
      // Check rate limit headers
      const remaining = response.headers.get('X-RateLimit-Remaining');
      const reset = response.headers.get('X-RateLimit-Reset');
      
      console.log(\`Rate limit remaining: \${remaining}\`);
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, retryCount) * 1000;
        
        console.log(\`Rate limited. Retrying in \${delay}ms...\`);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        retryCount++;
        continue;
      }
      
      if (!response.ok) {
        throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
      }
      
      return await response.json();
      
    } catch (error) {
      if (retryCount === maxRetries) {
        throw error;
      }
      
      retryCount++;
      const delay = Math.pow(2, retryCount) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Usage
try {
  const data = await apiRequest('https://api.vpnenterprise.com/vpn/connections');
  console.log('API response:', data);
} catch (error) {
  console.error('API request failed:', error);
}`, 'js-example')}
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                >
                  {copied === 'js-example' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{`async function apiRequest(url, options = {}) {
  const maxRetries = 3;
  let retryCount = 0;
  
  while (retryCount <= maxRetries) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': 'Bearer your-api-key',
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      
      // Check rate limit headers
      const remaining = response.headers.get('X-RateLimit-Remaining');
      const reset = response.headers.get('X-RateLimit-Reset');
      
      console.log(\`Rate limit remaining: \${remaining}\`);
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, retryCount) * 1000;
        
        console.log(\`Rate limited. Retrying in \${delay}ms...\`);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        retryCount++;
        continue;
      }
      
      if (!response.ok) {
        throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
      }
      
      return await response.json();
      
    } catch (error) {
      if (retryCount === maxRetries) {
        throw error;
      }
      
      retryCount++;
      const delay = Math.pow(2, retryCount) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Usage
try {
  const data = await apiRequest('https://api.vpnenterprise.com/vpn/connections');
  console.log('API response:', data);
} catch (error) {
  console.error('API request failed:', error);
}`}</code>
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Completion */}
        <div className="bg-linear-to-r from-amber-50 to-orange-50 rounded-xl p-8 border border-amber-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">API Reference Complete</h2>
          <p className="text-gray-600 mb-6">
            You've reached the end of our comprehensive API documentation. Explore other sections to learn more about VPN Enterprise.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/docs/api/overview">
              <Button className="bg-amber-600 hover:bg-amber-700">
                Back to API Overview
              </Button>
            </Link>
            <Link href="/docs">
              <Button variant="outline" className="border-amber-300 text-amber-600 hover:bg-amber-50">
                Documentation Home
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </DocLayout>
  );
}