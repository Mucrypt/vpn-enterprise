"use client";

import { useState } from 'react';
import { 
  CreditCard, Receipt, DollarSign, TrendingUp, Copy, Check, AlertCircle, 
  Info, Calendar, Download, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DocLayout from '@/components/docs/DocLayout';
import Link from 'next/link';

export default function BillingPage() {
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

  const billingEndpoints = [
    {
      method: "GET",
      path: "/billing/subscription",
      description: "Get current subscription details and usage information",
      response: `{
  "success": true,
  "subscription": {
    "id": "sub_123",
    "plan": "pro",
    "status": "active",
    "current_period_start": "2024-12-01T00:00:00Z",
    "current_period_end": "2025-01-01T00:00:00Z",
    "cancel_at_period_end": false,
    "trial_end": null
  },
  "usage": {
    "vpn_connections": {
      "current": 12,
      "limit": 50,
      "percentage": 24
    },
    "databases": {
      "current": 3,
      "limit": 10,
      "percentage": 30
    },
    "hosting_sites": {
      "current": 5,
      "limit": 25,
      "percentage": 20
    },
    "api_calls": {
      "current": 15230,
      "limit": 100000,
      "percentage": 15.23
    }
  }
}`
    },
    {
      method: "PUT",
      path: "/billing/subscription",
      description: "Update subscription plan or payment settings",
      request: `{
  "plan": "enterprise",
  "payment_method": "pm_456",
  "proration_behavior": "always_invoice"
}`,
      response: `{
  "success": true,
  "subscription": {
    "id": "sub_123",
    "plan": "enterprise",
    "status": "active",
    "proration_invoice": "inv_789",
    "effective_date": "2024-12-02T15:30:00Z",
    "next_billing_date": "2025-01-01T00:00:00Z"
  }
}`
    },
    {
      method: "GET",
      path: "/billing/invoices",
      description: "List all invoices for your organization",
      response: `{
  "success": true,
  "invoices": [
    {
      "id": "inv_123",
      "number": "INV-2024-001",
      "amount": 99.00,
      "currency": "usd",
      "status": "paid",
      "created": "2024-11-01T00:00:00Z",
      "due_date": "2024-11-15T00:00:00Z",
      "paid_at": "2024-11-02T10:30:00Z",
      "hosted_invoice_url": "https://invoice.vpnenterprise.com/inv_123",
      "pdf_url": "https://files.vpnenterprise.com/inv_123.pdf"
    }
  ],
  "total": 12,
  "has_more": false
}`
    },
    {
      method: "GET",
      path: "/billing/invoices/:id",
      description: "Get detailed invoice information",
      response: `{
  "success": true,
  "invoice": {
    "id": "inv_123",
    "number": "INV-2024-001",
    "amount": 99.00,
    "currency": "usd",
    "status": "paid",
    "line_items": [
      {
        "description": "VPN Enterprise Pro Plan",
        "amount": 79.00,
        "quantity": 1
      },
      {
        "description": "Additional Database (2x)",
        "amount": 20.00,
        "quantity": 2
      }
    ],
    "tax": {
      "amount": 7.92,
      "rate": 8.25,
      "jurisdiction": "US-CA"
    },
    "total": 106.92,
    "created": "2024-11-01T00:00:00Z",
    "paid_at": "2024-11-02T10:30:00Z",
    "payment_method": {
      "type": "card",
      "last4": "4242",
      "brand": "visa"
    }
  }
}`
    },
    {
      method: "GET",
      path: "/billing/payment-methods",
      description: "List all saved payment methods",
      response: `{
  "success": true,
  "payment_methods": [
    {
      "id": "pm_123",
      "type": "card",
      "card": {
        "last4": "4242",
        "brand": "visa",
        "exp_month": 12,
        "exp_year": 2026
      },
      "is_default": true,
      "created": "2024-01-15T10:30:00Z"
    }
  ],
  "default_payment_method": "pm_123"
}`
    },
    {
      method: "POST",
      path: "/billing/payment-methods",
      description: "Add a new payment method",
      request: `{
  "payment_method": "pm_new_456",
  "set_as_default": true
}`,
      response: `{
  "success": true,
  "payment_method": {
    "id": "pm_new_456",
    "type": "card",
    "card": {
      "last4": "5555",
      "brand": "mastercard",
      "exp_month": 8,
      "exp_year": 2027
    },
    "is_default": true,
    "created": "2024-12-02T15:30:00Z"
  }
}`
    },
    {
      method: "GET",
      path: "/billing/usage",
      description: "Get detailed usage statistics and billing metrics",
      response: `{
  "success": true,
  "current_period": {
    "start": "2024-12-01T00:00:00Z",
    "end": "2025-01-01T00:00:00Z"
  },
  "usage": {
    "vpn": {
      "connections": 12,
      "data_transfer_gb": 245.6,
      "server_hours": 8760
    },
    "database": {
      "instances": 3,
      "storage_gb": 15.2,
      "compute_hours": 2190
    },
    "hosting": {
      "sites": 5,
      "bandwidth_gb": 89.3,
      "build_minutes": 120
    },
    "api": {
      "requests": 15230,
      "rate_limit_hits": 12,
      "webhook_deliveries": 456
    }
  },
  "costs": {
    "base_plan": 79.00,
    "overages": 12.50,
    "add_ons": 8.00,
    "total": 99.50
  }
}`
    },
    {
      method: "GET",
      path: "/billing/plans",
      description: "Get available subscription plans and pricing",
      response: `{
  "success": true,
  "plans": [
    {
      "id": "starter",
      "name": "Starter",
      "price": 29.00,
      "currency": "usd",
      "interval": "month",
      "features": {
        "vpn_connections": 10,
        "databases": 2,
        "hosting_sites": 5,
        "api_calls": 10000,
        "support": "community"
      }
    },
    {
      "id": "pro",
      "name": "Pro",
      "price": 79.00,
      "currency": "usd",
      "interval": "month",
      "features": {
        "vpn_connections": 50,
        "databases": 10,
        "hosting_sites": 25,
        "api_calls": 100000,
        "support": "priority"
      },
      "popular": true
    },
    {
      "id": "enterprise",
      "name": "Enterprise",
      "price": 199.00,
      "currency": "usd",
      "interval": "month",
      "features": {
        "vpn_connections": "unlimited",
        "databases": "unlimited",
        "hosting_sites": "unlimited",
        "api_calls": "unlimited",
        "support": "dedicated",
        "sso": true,
        "advanced_security": true
      }
    }
  ]
}`
    }
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "$29",
      description: "Perfect for small teams and personal projects",
      color: "green",
      features: ["10 VPN connections", "2 databases", "5 hosting sites", "10k API calls", "Community support"]
    },
    {
      name: "Pro",
      price: "$79",
      description: "Ideal for growing businesses and teams",
      color: "blue",
      popular: true,
      features: ["50 VPN connections", "10 databases", "25 hosting sites", "100k API calls", "Priority support"]
    },
    {
      name: "Enterprise",
      price: "$199",
      description: "Advanced features for large organizations",
      color: "purple",
      features: ["Unlimited connections", "Unlimited databases", "Unlimited hosting", "Unlimited API calls", "Dedicated support", "SSO integration"]
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
          <span className="text-gray-900 font-medium">Billing</span>
        </div>

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <CreditCard className="h-8 w-8 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Billing & Subscriptions</h1>
              <p className="text-lg text-gray-600 mt-2">
                Manage your subscription, invoices, and payment methods
              </p>
            </div>
          </div>
        </div>

        {/* Billing Overview */}
        <div className="mb-12">
          <Card className="bg-emerald-50/50 border-emerald-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                Billing Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Complete billing management system with subscription control, usage tracking, invoice management, and automated billing cycles.
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Subscription Management</h4>
                  <span className="text-sm text-gray-600">Plan upgrades, downgrades, and cancellation</span>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Usage Tracking</h4>
                  <span className="text-sm text-gray-600">Real-time resource usage monitoring</span>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Invoice Management</h4>
                  <span className="text-sm text-gray-600">Detailed invoices with PDF downloads</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-6">
            
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                  <CardTitle className="text-lg">Usage Analytics</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-3">Track resource usage, costs, and billing metrics in real-time.</p>
                <code className="text-xs bg-gray-900 text-blue-400 px-2 py-1 rounded">GET /billing/usage</code>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Receipt className="h-6 w-6 text-green-600" />
                  <CardTitle className="text-lg">Invoice History</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-3">Access and download detailed invoices and billing history.</p>
                <code className="text-xs bg-gray-900 text-green-400 px-2 py-1 rounded">GET /billing/invoices</code>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <CreditCard className="h-6 w-6 text-purple-600" />
                  <CardTitle className="text-lg">Payment Methods</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-3">Manage saved payment methods and update billing information.</p>
                <code className="text-xs bg-gray-900 text-purple-400 px-2 py-1 rounded">POST /billing/payment-methods</code>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Pricing Plans */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Plans</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {pricingPlans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative ${
                  plan.color === 'green' ? 'border-green-200 bg-green-50/50' :
                  plan.color === 'blue' ? 'border-blue-200 bg-blue-50/50' :
                  'border-purple-200 bg-purple-50/50'
                } ${plan.popular ? 'ring-2 ring-blue-500' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white">Most Popular</Badge>
                  </div>
                )}
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <h4 className="text-xl font-bold text-gray-900">{plan.name}</h4>
                    <div className="text-3xl font-bold text-gray-900 mt-2">
                      {plan.price}
                      <span className="text-lg font-normal text-gray-600">/month</span>
                    </div>
                    <p className="text-gray-600 mt-2">{plan.description}</p>
                  </div>
                  
                  <div className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-3">
                        <Check className={`h-4 w-4 ${
                          plan.color === 'green' ? 'text-green-600' :
                          plan.color === 'blue' ? 'text-blue-600' :
                          'text-purple-600'
                        }`} />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    className={`w-full mt-6 ${
                      plan.color === 'green' ? 'bg-green-600 hover:bg-green-700' :
                      plan.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
                      'bg-purple-600 hover:bg-purple-700'
                    }`}
                  >
                    {plan.popular ? 'Get Started' : 'Choose Plan'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Usage Metrics */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Usage Metrics</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">VPN Connections</p>
                    <p className="text-2xl font-bold text-gray-900">12 / 50</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Zap className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
                <div className="mt-4 bg-emerald-200 rounded-full h-2">
                  <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '24%' }}></div>
                </div>
                <p className="text-xs text-emerald-700 mt-1">24% used</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Databases</p>
                    <p className="text-2xl font-bold text-gray-900">3 / 10</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <div className="w-6 h-6 bg-blue-600 rounded"></div>
                  </div>
                </div>
                <div className="mt-4 bg-blue-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '30%' }}></div>
                </div>
                <p className="text-xs text-blue-700 mt-1">30% used</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Hosting Sites</p>
                    <p className="text-2xl font-bold text-gray-900">5 / 25</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <div className="w-6 h-6 bg-purple-600 rounded"></div>
                  </div>
                </div>
                <div className="mt-4 bg-purple-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: '20%' }}></div>
                </div>
                <p className="text-xs text-purple-700 mt-1">20% used</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">API Calls</p>
                    <p className="text-2xl font-bold text-gray-900">15.2k / 100k</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <div className="mt-4 bg-orange-200 rounded-full h-2">
                  <div className="bg-orange-600 h-2 rounded-full" style={{ width: '15%' }}></div>
                </div>
                <p className="text-xs text-orange-700 mt-1">15% used</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* API Endpoints */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">API Endpoints</h2>
          
          <div className="space-y-8">
            {billingEndpoints.map((endpoint, index) => (
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

        {/* Billing Best Practices */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Billing Best Practices</h2>
          
          <div className="space-y-4">
            <Card className="border-emerald-200 bg-emerald-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-emerald-800 mb-1">Monitor Usage Regularly</h4>
                    <p className="text-emerald-700 text-sm">
                      Set up usage alerts and monitor your resource consumption to avoid unexpected charges and optimize costs.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-1">Plan Changes & Prorations</h4>
                    <p className="text-blue-700 text-sm">
                      Understand proration policies when upgrading or downgrading plans. Changes take effect immediately with appropriate billing adjustments.
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
                    <h4 className="font-semibold text-amber-800 mb-1">Payment Method Backup</h4>
                    <p className="text-amber-700 text-sm">
                      Keep multiple payment methods on file to prevent service interruptions due to payment failures or expired cards.
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
            Set up webhooks to receive billing events and implement rate limiting for your API usage.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/docs/api/webhooks">
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                Webhook Integration
              </Button>
            </Link>
            <Link href="/docs/api/rate-limiting">
              <Button variant="outline" className="border-emerald-300 text-emerald-600 hover:bg-emerald-50">
                Rate Limiting
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </DocLayout>
  );
}