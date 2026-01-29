"use client";

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Code, 
  Webhook, 
  Zap, 
  CheckCircle,
  ArrowRight,
  Settings,
  Database,
  Bell,
  Lock,
  Globe,
  MessageSquare,
  Key,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import DocLayout from '@/components/docs/DocLayout';

export default function ThirdPartyAPIsPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const examplesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero animation
      gsap.from(heroRef.current?.children || [], {
        duration: 1,
        y: 50,
        opacity: 0,
        stagger: 0.2,
        ease: "power3.out"
      });

      // Categories animation
      gsap.from(categoriesRef.current?.children || [], {
        duration: 0.8,
        scale: 0.9,
        opacity: 0,
        stagger: 0.1,
        ease: "back.out(1.7)",
        delay: 0.3
      });

      // Examples animation
      gsap.from(examplesRef.current?.children || [], {
        duration: 0.6,
        y: 30,
        opacity: 0,
        stagger: 0.15,
        ease: "power2.out",
        delay: 0.6
      });
    });

    return () => ctx.revert();
  }, []);

  const apiCategories = [
    {
      title: "Webhooks",
      description: "Real-time event notifications for external systems",
      icon: Webhook,
      color: "from-blue-500 to-cyan-500",
      features: [
        "User connection events",
        "Authentication notifications",
        "System health alerts",
        "Configuration changes"
      ],
      examples: [
        "Slack notifications",
        "SIEM integrations",
        "Ticketing systems",
        "Custom workflows"
      ]
    },
    {
      title: "REST APIs",
      description: "RESTful APIs for system integration and automation",
      icon: Globe,
      color: "from-green-500 to-emerald-500",
      features: [
        "User management",
        "Configuration management",
        "Metrics and analytics",
        "System administration"
      ],
      examples: [
        "ITSM platforms",
        "Identity providers",
        "Analytics tools",
        "Custom dashboards"
      ]
    },
    {
      title: "GraphQL",
      description: "Flexible GraphQL API for complex data queries",
      icon: Database,
      color: "from-purple-500 to-violet-500",
      features: [
        "Complex data relationships",
        "Real-time subscriptions",
        "Efficient data fetching",
        "Type-safe queries"
      ],
      examples: [
        "Business intelligence",
        "Custom reporting",
        "Real-time dashboards",
        "Mobile applications"
      ]
    },
    {
      title: "Message Queues",
      description: "Asynchronous messaging for reliable integrations",
      icon: MessageSquare,
      color: "from-orange-500 to-red-500",
      features: [
        "Event streaming",
        "Reliable delivery",
        "Message persistence",
        "Dead letter queues"
      ],
      examples: [
        "Apache Kafka",
        "RabbitMQ",
        "AWS SQS",
        "Azure Service Bus"
      ]
    }
  ];

  const integrationExamples = [
    {
      title: "Slack Integration",
      description: "Get real-time VPN notifications in Slack channels",
      category: "Communication",
      icon: "💬",
      setup: "5 min",
      code: `{
  "webhook_url": "https://hooks.slack.com/services/...",
  "events": [
    "user.connected",
    "user.disconnected",
    "system.alert"
  ],
  "format": "slack"
}`
    },
    {
      title: "ServiceNow Integration",
      description: "Automatically create tickets for VPN issues",
      category: "ITSM",
      icon: "🎫",
      setup: "15 min",
      code: `{
  "servicenow": {
    "instance": "company.service-now.com",
    "username": "vpn_integration",
    "table": "incident",
    "auto_create_tickets": true
  }
}`
    },
    {
      title: "Splunk Integration",
      description: "Stream VPN logs to Splunk for analysis",
      category: "Analytics",
      icon: "📊",
      setup: "10 min",
      code: `{
  "splunk": {
    "hec_endpoint": "https://splunk.company.com:8088",
    "index": "vpn_logs",
    "sourcetype": "vpn_enterprise"
  }
}`
    }
  ];

  const webhookEvents = [
    { event: "user.connected", description: "User successfully connected to VPN" },
    { event: "user.disconnected", description: "User disconnected from VPN" },
    { event: "user.authentication_failed", description: "User authentication failed" },
    { event: "system.health_check_failed", description: "System health check failed" },
    { event: "certificate.expiring", description: "SSL certificate expiring soon" },
    { event: "configuration.updated", description: "VPN configuration was updated" }
  ];

  const apiEndpoints = [
    {
      method: "GET",
      endpoint: "/api/v1/users",
      description: "List all VPN users",
      auth: "Bearer token required"
    },
    {
      method: "POST",
      endpoint: "/api/v1/users",
      description: "Create a new VPN user",
      auth: "Admin privileges required"
    },
    {
      method: "GET",
      endpoint: "/api/v1/connections",
      description: "Get active VPN connections",
      auth: "Read-only access"
    },
    {
      method: "PUT",
      endpoint: "/api/v1/config",
      description: "Update VPN configuration",
      auth: "Admin privileges required"
    },
    {
      method: "GET",
      endpoint: "/api/v1/metrics",
      description: "Retrieve system metrics",
      auth: "Monitoring access"
    }
  ];

  return (
    <DocLayout>
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-green-50/20 to-blue-50/30">
        <div className="container mx-auto px-6 py-12">
          {/* Hero Section */}
          <div ref={heroRef} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 px-4 py-2 rounded-full mb-6">
              <Code className="h-5 w-5 text-green-600" />
              <span className="text-green-700 dark:text-green-300 font-medium">API Integration</span>
            </div>
            
            <h1 className="text-5xl font-bold bg-linear-to-r from-gray-900 via-green-800 to-blue-800 bg-clip-text text-transparent mb-6">
              Third-party APIs
            </h1>
            
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Extend VPN Enterprise functionality by integrating with external systems through webhooks, 
              REST APIs, GraphQL, and message queues. Build custom workflows and automate processes.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-linear-to-r from-green-600 to-blue-600">
                Explore API Documentation
              </Button>
              <Button size="lg" variant="outline">
                Get API Key
              </Button>
            </div>
          </div>

          {/* API Categories */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Integration Categories</h2>
            <div ref={categoriesRef} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {apiCategories.map((category, index) => (
                <Card 
                  key={index}
                  className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm overflow-hidden"
                >
                  <CardHeader className="relative">
                    <div className={`absolute inset-0 bg-linear-to-r ${category.color} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
                    <div className="relative flex items-center gap-4">
                      <div className={`p-3 rounded-lg bg-linear-to-r ${category.color} text-white`}>
                        <category.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{category.title}</CardTitle>
                        <CardDescription>{category.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2 text-gray-700 text-sm">Features:</h4>
                        <ul className="space-y-1">
                          {category.features.map((feature, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-green-600" />
                              <span className="text-xs text-gray-600">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2 text-gray-700 text-sm">Use Cases:</h4>
                        <ul className="space-y-1">
                          {category.examples.map((example, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <ArrowRight className="h-3 w-3 text-blue-600" />
                              <span className="text-xs text-gray-600">{example}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Integration Examples */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Popular Integrations</h2>
            <div ref={examplesRef} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {integrationExamples.map((example, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{example.icon}</div>
                      <div>
                        <CardTitle className="text-lg">{example.title}</CardTitle>
                        <CardDescription>{example.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <Badge variant="outline">{example.category}</Badge>
                      <Badge variant="secondary">
                        <Zap className="h-3 w-3 mr-1" />
                        {example.setup}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-900 rounded-lg p-3 mb-4">
                      <pre className="text-green-400 text-xs overflow-x-auto">
                        <code>{example.code}</code>
                      </pre>
                    </div>
                    <Button className="w-full" size="sm">
                      Setup Integration
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* API Documentation */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">API Reference</h2>
            <Tabs defaultValue="webhooks" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
                <TabsTrigger value="rest">REST API</TabsTrigger>
                <TabsTrigger value="graphql">GraphQL</TabsTrigger>
                <TabsTrigger value="auth">Authentication</TabsTrigger>
              </TabsList>
              
              <TabsContent value="webhooks">
                <Card>
                  <CardHeader>
                    <CardTitle>Webhook Configuration</CardTitle>
                    <CardDescription>
                      Configure webhooks to receive real-time notifications about VPN events
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-semibold mb-3">Available Events:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {webhookEvents.map((event, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-3 border rounded-lg">
                              <Bell className="h-4 w-4 text-blue-600 mt-0.5" />
                              <div>
                                <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                                  {event.event}
                                </code>
                                <p className="text-xs text-gray-600 mt-1">{event.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-3">Webhook Payload Example:</h4>
                        <div className="bg-gray-900 rounded-lg p-4">
                          <pre className="text-green-400 text-sm">
                            <code>{`{
  "event": "user.connected",
  "timestamp": "2023-12-02T10:30:00Z",
  "user": {
    "id": "user_123",
    "email": "john@company.com",
    "ip_address": "192.168.1.100"
  },
  "connection": {
    "server": "vpn-us-east-1",
    "protocol": "OpenVPN",
    "duration": 0
  }
}`}</code>
                          </pre>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="rest">
                <Card>
                  <CardHeader>
                    <CardTitle>REST API Endpoints</CardTitle>
                    <CardDescription>
                      Comprehensive REST API for VPN Enterprise management and automation
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {apiEndpoints.map((endpoint, idx) => (
                        <div key={idx} className="p-4 border rounded-lg">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge 
                              variant={endpoint.method === 'GET' ? 'secondary' : 
                                      endpoint.method === 'POST' ? 'default' : 'destructive'}
                              className="font-mono"
                            >
                              {endpoint.method}
                            </Badge>
                            <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                              {endpoint.endpoint}
                            </code>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{endpoint.description}</p>
                          <div className="flex items-center gap-2">
                            <Lock className="h-4 w-4 text-orange-600" />
                            <span className="text-xs text-orange-600">{endpoint.auth}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6">
                      <Button className="w-full">
                        <FileText className="mr-2 h-4 w-4" />
                        View Complete API Documentation
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="graphql">
                <Card>
                  <CardHeader>
                    <CardTitle>GraphQL API</CardTitle>
                    <CardDescription>
                      Flexible GraphQL API for complex queries and real-time subscriptions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-semibold mb-3">Example Query:</h4>
                        <div className="bg-gray-900 rounded-lg p-4">
                          <pre className="text-green-400 text-sm">
                            <code>{`query GetUserConnections($userId: ID!) {
  user(id: $userId) {
    id
    email
    connections {
      id
      server
      connectedAt
      status
      bytesTransferred
    }
    lastActivity
  }
}`}</code>
                          </pre>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-3">Real-time Subscription:</h4>
                        <div className="bg-gray-900 rounded-lg p-4">
                          <pre className="text-green-400 text-sm">
                            <code>{`subscription ConnectionEvents {
  connectionEvent {
    event
    user {
      id
      email
    }
    connection {
      server
      protocol
    }
    timestamp
  }
}`}</code>
                          </pre>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold mb-2">Available Types:</h4>
                          <ul className="text-sm space-y-1">
                            <li>• User</li>
                            <li>• Connection</li>
                            <li>• Server</li>
                            <li>• Configuration</li>
                            <li>• Metrics</li>
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Subscriptions:</h4>
                          <ul className="text-sm space-y-1">
                            <li>• connectionEvent</li>
                            <li>• userActivity</li>
                            <li>• systemHealth</li>
                            <li>• configChanges</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="auth">
                <Card>
                  <CardHeader>
                    <CardTitle>API Authentication</CardTitle>
                    <CardDescription>
                      Secure your API integrations with proper authentication methods
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold mb-3">API Key Authentication:</h4>
                          <div className="bg-gray-900 rounded-lg p-4">
                            <pre className="text-green-400 text-sm">
                              <code>{`curl -H "Authorization: Bearer YOUR_API_KEY" \\
     -H "Content-Type: application/json" \\
     https://api.vpn-enterprise.com/v1/users`}</code>
                            </pre>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-3">OAuth 2.0 Flow:</h4>
                          <div className="bg-gray-900 rounded-lg p-4">
                            <pre className="text-green-400 text-sm">
                              <code>{`POST /oauth/token
Content-Type: application/json

{
  "grant_type": "client_credentials",
  "client_id": "your_client_id",
  "client_secret": "your_secret"
}`}</code>
                            </pre>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-3">API Key Scopes:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-3 border rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Key className="h-4 w-4 text-blue-600" />
                              <strong className="text-sm">read</strong>
                            </div>
                            <p className="text-xs text-gray-600">Read-only access to resources</p>
                          </div>
                          <div className="p-3 border rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Key className="h-4 w-4 text-green-600" />
                              <strong className="text-sm">write</strong>
                            </div>
                            <p className="text-xs text-gray-600">Create and update resources</p>
                          </div>
                          <div className="p-3 border rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Key className="h-4 w-4 text-red-600" />
                              <strong className="text-sm">admin</strong>
                            </div>
                            <p className="text-xs text-gray-600">Full administrative access</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* SDK and Tools */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">SDKs & Integration Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: "JavaScript SDK", icon: "🟨", description: "Full-featured JavaScript SDK" },
                { name: "Python SDK", icon: "🐍", description: "Python library for automation" },
                { name: "Go SDK", icon: "🐹", description: "High-performance Go client" },
                { name: "CLI Tool", icon: "⚡", description: "Command-line interface" }
              ].map((tool, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="text-3xl mb-3">{tool.icon}</div>
                    <h3 className="font-semibold text-lg mb-2">{tool.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">{tool.description}</p>
                    <Button size="sm" className="w-full">
                      Get Started
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <Card className="bg-linear-to-r from-green-500 to-blue-600 text-white">
            <CardContent className="p-8 text-center">
              <Code className="h-16 w-16 mx-auto mb-6 opacity-90" />
              <h2 className="text-3xl font-bold mb-4">Build Custom Integrations</h2>
              <p className="text-lg opacity-90 mb-6 max-w-2xl mx-auto">
                Leverage our comprehensive APIs to build custom integrations that fit your unique requirements. 
                Get started with our SDKs and detailed documentation.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary">
                  Get API Access
                </Button>
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-green-600">
                  View API Documentation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DocLayout>
  );
}