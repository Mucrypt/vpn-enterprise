"use client";

import { useState } from 'react';
import { 
  Webhook, Send, Shield, AlertTriangle, Copy, Check, Info, 
  Lock, Bell, Code, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DocLayout from '@/components/docs/DocLayout';
import Link from 'next/link';

export default function WebhooksPage() {
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

  const webhookEndpoints = [
    {
      method: "GET",
      path: "/webhooks",
      description: "List all configured webhooks for your organization",
      response: `{
  "success": true,
  "webhooks": [
    {
      "id": "wh_123",
      "url": "https://api.myapp.com/webhooks/vpn-enterprise",
      "events": ["user.created", "vpn.connected", "billing.invoice.paid"],
      "status": "active",
      "secret": "whsec_***masked***",
      "created_at": "2024-01-15T10:30:00Z",
      "last_delivery": "2024-12-02T14:20:00Z",
      "delivery_stats": {
        "successful": 1249,
        "failed": 3,
        "last_30_days": 87
      }
    }
  ],
  "total": 2
}`
    },
    {
      method: "POST",
      path: "/webhooks",
      description: "Create a new webhook endpoint",
      request: `{
  "url": "https://api.myapp.com/webhooks/vpn-enterprise",
  "events": ["user.created", "vpn.connected", "billing.invoice.paid"],
  "description": "Production webhook for user and billing events",
  "active": true
}`,
      response: `{
  "success": true,
  "webhook": {
    "id": "wh_124",
    "url": "https://api.myapp.com/webhooks/vpn-enterprise",
    "events": ["user.created", "vpn.connected", "billing.invoice.paid"],
    "status": "active",
    "secret": "whsec_1234567890abcdef1234567890abcdef12345678",
    "created_at": "2024-12-02T15:30:00Z",
    "description": "Production webhook for user and billing events"
  }
}`
    },
    {
      method: "GET",
      path: "/webhooks/:id",
      description: "Get detailed information about a specific webhook",
      response: `{
  "success": true,
  "webhook": {
    "id": "wh_123",
    "url": "https://api.myapp.com/webhooks/vpn-enterprise",
    "events": ["user.created", "vpn.connected", "billing.invoice.paid"],
    "status": "active",
    "secret": "whsec_***masked***",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-11-15T09:20:00Z",
    "description": "Production webhook for user and billing events",
    "delivery_stats": {
      "total_deliveries": 1252,
      "successful_deliveries": 1249,
      "failed_deliveries": 3,
      "last_successful_delivery": "2024-12-02T14:20:00Z",
      "last_failed_delivery": "2024-11-28T11:15:00Z",
      "average_response_time_ms": 145
    }
  }
}`
    },
    {
      method: "PUT",
      path: "/webhooks/:id",
      description: "Update webhook configuration",
      request: `{
  "url": "https://api.myapp.com/webhooks/vpn-enterprise-v2",
  "events": ["user.created", "user.deleted", "vpn.connected", "vpn.disconnected", "billing.invoice.paid"],
  "description": "Updated webhook with additional events",
  "active": true
}`,
      response: `{
  "success": true,
  "webhook": {
    "id": "wh_123",
    "url": "https://api.myapp.com/webhooks/vpn-enterprise-v2",
    "events": ["user.created", "user.deleted", "vpn.connected", "vpn.disconnected", "billing.invoice.paid"],
    "status": "active",
    "updated_at": "2024-12-02T15:30:00Z",
    "description": "Updated webhook with additional events"
  }
}`
    },
    {
      method: "DELETE",
      path: "/webhooks/:id",
      description: "Delete a webhook endpoint",
      response: `{
  "success": true,
  "message": "Webhook deleted successfully",
  "webhook_id": "wh_123"
}`
    },
    {
      method: "GET",
      path: "/webhooks/:id/deliveries",
      description: "Get delivery history for a specific webhook",
      response: `{
  "success": true,
  "deliveries": [
    {
      "id": "del_789",
      "webhook_id": "wh_123",
      "event_type": "user.created",
      "delivered_at": "2024-12-02T14:20:00Z",
      "status": "success",
      "response_status": 200,
      "response_time_ms": 142,
      "attempts": 1,
      "event_data": {
        "user_id": "usr_456",
        "email": "newuser@example.com",
        "created_at": "2024-12-02T14:19:45Z"
      }
    }
  ],
  "total": 1252,
  "has_more": true
}`
    },
    {
      method: "POST",
      path: "/webhooks/:id/test",
      description: "Send a test webhook to verify your endpoint",
      request: `{
  "event_type": "webhook.test",
  "custom_data": {
    "test": true,
    "timestamp": "2024-12-02T15:30:00Z"
  }
}`,
      response: `{
  "success": true,
  "test_delivery": {
    "delivery_id": "del_test_123",
    "status": "success",
    "response_status": 200,
    "response_time_ms": 89,
    "response_body": "OK",
    "delivered_at": "2024-12-02T15:30:05Z"
  }
}`
    }
  ];

  const webhookEvents = [
    {
      category: "User Events",
      color: "blue",
      events: [
        { name: "user.created", description: "New user registered or invited" },
        { name: "user.updated", description: "User profile or permissions updated" },
        { name: "user.deleted", description: "User removed from organization" },
        { name: "user.login", description: "User successfully authenticated" }
      ]
    },
    {
      category: "VPN Events",
      color: "green",
      events: [
        { name: "vpn.connected", description: "VPN connection established" },
        { name: "vpn.disconnected", description: "VPN connection terminated" },
        { name: "vpn.server.created", description: "New VPN server provisioned" },
        { name: "vpn.server.deleted", description: "VPN server decommissioned" }
      ]
    },
    {
      category: "Database Events",
      color: "purple",
      events: [
        { name: "database.created", description: "Database instance created" },
        { name: "database.updated", description: "Database configuration changed" },
        { name: "database.deleted", description: "Database instance deleted" },
        { name: "database.backup.completed", description: "Database backup finished" }
      ]
    },
    {
      category: "Billing Events",
      color: "orange",
      events: [
        { name: "billing.invoice.created", description: "New invoice generated" },
        { name: "billing.invoice.paid", description: "Invoice payment successful" },
        { name: "billing.invoice.failed", description: "Invoice payment failed" },
        { name: "billing.subscription.updated", description: "Subscription plan changed" }
      ]
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
          <span className="text-gray-900 font-medium">Webhooks</span>
        </div>

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-violet-100 rounded-xl">
              <Webhook className="h-8 w-8 text-violet-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Webhooks</h1>
              <p className="text-lg text-gray-600 mt-2">
                Real-time event notifications for your applications
              </p>
            </div>
          </div>
        </div>

        {/* Webhooks Overview */}
        <div className="mb-12">
          <Card className="bg-violet-50/50 border-violet-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Send className="h-5 w-5 text-violet-600" />
                Webhooks Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Webhooks allow your application to receive real-time notifications when events occur in VPN Enterprise. 
                Secure, reliable, and with automatic retry logic for failed deliveries.
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Event Types</h4>
                  <span className="text-sm text-gray-600">User, VPN, Database, Billing events</span>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Security</h4>
                  <span className="text-sm text-gray-600">HMAC signature verification</span>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Reliability</h4>
                  <span className="text-sm text-gray-600">Automatic retries and monitoring</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Setup */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Setup</h2>
          <div className="grid md:grid-cols-3 gap-6">
            
            <Card className="bg-linear-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">1</span>
                  </div>
                  <CardTitle className="text-lg">Create Endpoint</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-3">Set up an HTTPS endpoint to receive webhook events from VPN Enterprise.</p>
                <code className="text-xs bg-gray-900 text-blue-400 px-2 py-1 rounded">POST /webhooks</code>
              </CardContent>
            </Card>

            <Card className="bg-linear-to-br from-green-50 to-emerald-50 border-green-200">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold text-sm">2</span>
                  </div>
                  <CardTitle className="text-lg">Verify Signatures</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-3">Implement HMAC-SHA256 signature verification for security.</p>
                <code className="text-xs bg-gray-900 text-green-400 px-2 py-1 rounded">X-VPN-Signature</code>
              </CardContent>
            </Card>

            <Card className="bg-linear-to-br from-purple-50 to-violet-50 border-purple-200">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-bold text-sm">3</span>
                  </div>
                  <CardTitle className="text-lg">Handle Events</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-3">Process webhook events and return 2xx status codes for successful handling.</p>
                <code className="text-xs bg-gray-900 text-purple-400 px-2 py-1 rounded">200 OK</code>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Event Types */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Event Types</h2>
          
          <div className="space-y-6">
            {webhookEvents.map((category, index) => (
              <Card key={index} className={`${
                category.color === 'blue' ? 'bg-blue-50/50 border-blue-200' :
                category.color === 'green' ? 'bg-green-50/50 border-green-200' :
                category.color === 'purple' ? 'bg-purple-50/50 border-purple-200' :
                'bg-orange-50/50 border-orange-200'
              }`}>
                <CardHeader>
                  <CardTitle className={`text-lg ${
                    category.color === 'blue' ? 'text-blue-800' :
                    category.color === 'green' ? 'text-green-800' :
                    category.color === 'purple' ? 'text-purple-800' :
                    'text-orange-800'
                  }`}>
                    {category.category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {category.events.map((event, eventIndex) => (
                      <div key={eventIndex} className="p-3 bg-white rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <code className={`text-sm font-mono ${
                            category.color === 'blue' ? 'text-blue-600' :
                            category.color === 'green' ? 'text-green-600' :
                            category.color === 'purple' ? 'text-purple-600' :
                            'text-orange-600'
                          }`}>
                            {event.name}
                          </code>
                          <Badge variant="outline" className="text-xs">Event</Badge>
                        </div>
                        <p className="text-gray-600 text-sm">{event.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Security Implementation */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Security Implementation</h2>
          
          <Card className="bg-gray-50/50 border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-gray-600" />
                Webhook Signature Verification
              </CardTitle>
              <CardDescription>
                Verify webhook authenticity using HMAC-SHA256 signatures
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Node.js Example */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Node.js Example
                </h4>
                <div className="relative">
                  <Button
                    onClick={() => copyToClipboard(`const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');
  
  const providedSignature = signature.replace('sha256=', '');
  
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(providedSignature, 'hex')
  );
}

// Express.js middleware
app.use('/webhooks', express.raw({type: 'application/json'}));

app.post('/webhooks/vpn-enterprise', (req, res) => {
  const signature = req.get('X-VPN-Signature');
  const payload = req.body;
  
  if (!verifyWebhookSignature(payload, signature, process.env.WEBHOOK_SECRET)) {
    return res.status(401).send('Unauthorized');
  }
  
  const event = JSON.parse(payload);
  console.log('Received event:', event.type);
  
  res.status(200).send('OK');
});`, 'nodejs-example')}
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                  >
                    {copied === 'nodejs-example' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{`const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');
  
  const providedSignature = signature.replace('sha256=', '');
  
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(providedSignature, 'hex')
  );
}

// Express.js middleware
app.use('/webhooks', express.raw({type: 'application/json'}));

app.post('/webhooks/vpn-enterprise', (req, res) => {
  const signature = req.get('X-VPN-Signature');
  const payload = req.body;
  
  if (!verifyWebhookSignature(payload, signature, process.env.WEBHOOK_SECRET)) {
    return res.status(401).send('Unauthorized');
  }
  
  const event = JSON.parse(payload);
  console.log('Received event:', event.type);
  
  res.status(200).send('OK');
});`}</code>
                  </pre>
                </div>
              </div>

              {/* Python Example */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Python Example
                </h4>
                <div className="relative">
                  <Button
                    onClick={() => copyToClipboard(`import hmac
import hashlib
from flask import Flask, request, abort

app = Flask(__name__)

def verify_webhook_signature(payload, signature, secret):
    expected_signature = hmac.new(
        secret.encode('utf-8'),
        payload,
        hashlib.sha256
    ).hexdigest()
    
    provided_signature = signature.replace('sha256=', '')
    
    return hmac.compare_digest(expected_signature, provided_signature)

@app.route('/webhooks/vpn-enterprise', methods=['POST'])
def handle_webhook():
    signature = request.headers.get('X-VPN-Signature')
    payload = request.get_data()
    
    if not verify_webhook_signature(payload, signature, 'your-webhook-secret'):
        abort(401)
    
    event = request.get_json()
    print(f"Received event: {event['type']}")
    
    return 'OK', 200`, 'python-example')}
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                  >
                    {copied === 'python-example' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{`import hmac
import hashlib
from flask import Flask, request, abort

app = Flask(__name__)

def verify_webhook_signature(payload, signature, secret):
    expected_signature = hmac.new(
        secret.encode('utf-8'),
        payload,
        hashlib.sha256
    ).hexdigest()
    
    provided_signature = signature.replace('sha256=', '')
    
    return hmac.compare_digest(expected_signature, provided_signature)

@app.route('/webhooks/vpn-enterprise', methods=['POST'])
def handle_webhook():
    signature = request.headers.get('X-VPN-Signature')
    payload = request.get_data()
    
    if not verify_webhook_signature(payload, signature, 'your-webhook-secret'):
        abort(401)
    
    event = request.get_json()
    print(f"Received event: {event['type']}")
    
    return 'OK', 200`}</code>
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* API Endpoints */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">API Endpoints</h2>
          
          <div className="space-y-8">
            {webhookEndpoints.map((endpoint, index) => (
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
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Webhook Best Practices</h2>
          
          <div className="space-y-4">
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-green-800 mb-1">Idempotent Processing</h4>
                    <p className="text-green-700 text-sm">
                      Design your webhook handlers to be idempotent. The same event may be delivered multiple times due to retries.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-1">Fast Response Times</h4>
                    <p className="text-blue-700 text-sm">
                      Respond within 10 seconds and return 2xx status codes. For heavy processing, acknowledge receipt first and process asynchronously.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-amber-800 mb-1">Error Handling & Monitoring</h4>
                    <p className="text-amber-700 text-sm">
                      Implement proper error handling and monitoring. Failed deliveries will be retried with exponential backoff for up to 3 days.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-linear-to-r from-violet-50 to-purple-50 rounded-xl p-8 border border-violet-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Next Steps</h2>
          <p className="text-gray-600 mb-6">
            Complete your integration by understanding rate limiting policies and implementing proper error handling.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/docs/api/rate-limiting">
              <Button className="bg-violet-600 hover:bg-violet-700">
                Rate Limiting Guide
              </Button>
            </Link>
            <Link href="/docs/api/users">
              <Button variant="outline" className="border-violet-300 text-violet-600 hover:bg-violet-50">
                User Management
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </DocLayout>
  );
}