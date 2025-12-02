"use client";

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  BookOpen, Code, Shield, Database, Server, 
  Zap, Rocket, Terminal, Cloud, ArrowRight,
  CheckCircle, Star, Globe, Lock, Play,
  Users, Key, Search, Copy, Check, ChevronDown, ChevronRight,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DocLayout from '@/components/docs/DocLayout';
import Link from 'next/link';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// API Endpoints data
const apiEndpoints = [
  {
    category: "Authentication",
    icon: Key,
    endpoints: [
      {
        method: "POST",
        path: "/auth/login",
        description: "Authenticate and receive an access token",
        example: {
          request: `{
  "email": "user@company.com",
  "password": "secure_password"
}`,
          response: `{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 3600,
  "user": {
    "id": "usr_123",
    "email": "user@company.com",
    "name": "John Doe"
  }
}`
        }
      },
      {
        method: "POST",
        path: "/auth/refresh",
        description: "Refresh an expired access token",
        example: {
          request: `{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}`,
          response: `{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 3600
}`
        }
      }
    ]
  },
  {
    category: "VPN Management",
    icon: Shield,
    endpoints: [
      {
        method: "GET",
        path: "/vpn/connections",
        description: "List all VPN connections",
        example: {
          response: `{
  "connections": [
    {
      "id": "vpn_123",
      "name": "my-connection",
      "status": "active",
      "location": "us-east-1",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}`
        }
      },
      {
        method: "POST",
        path: "/vpn/connections",
        description: "Create a new VPN connection",
        example: {
          request: `{
  "name": "my-connection",
  "location": "us-east-1",
  "protocol": "wireguard"
}`,
          response: `{
  "id": "vpn_124",
  "name": "my-connection",
  "status": "creating",
  "config": "[Interface]\nPrivateKey = ..."
}`
        }
      }
    ]
  },
  {
    category: "Database Management",
    icon: Database,
    endpoints: [
      {
        method: "GET",
        path: "/databases",
        description: "List all managed databases",
        example: {
          response: `{
  "databases": [
    {
      "id": "db_123",
      "name": "my-database",
      "engine": "postgresql",
      "version": "15.0",
      "status": "running",
      "region": "us-east-1"
    }
  ]
}`
        }
      },
      {
        method: "POST",
        path: "/databases",
        description: "Create a new managed database",
        example: {
          request: `{
  "name": "my-database",
  "engine": "postgresql",
  "version": "15.0",
  "size": "small",
  "region": "us-east-1"
}`,
          response: `{
  "id": "db_124",
  "name": "my-database",
  "engine": "postgresql",
  "status": "creating",
  "connection_string": "postgresql://user:pass@db-host:5432/dbname"
}`
        }
      }
    ]
  },
  {
    category: "Hosting Management",
    icon: Server,
    endpoints: [
      {
        method: "GET",
        path: "/hosting/sites",
        description: "List all hosted sites",
        example: {
          response: `{
  "sites": [
    {
      "id": "site_123",
      "name": "my-website",
      "domain": "my-website.com",
      "status": "active",
      "ssl_enabled": true
    }
  ]
}`
        }
      },
      {
        method: "POST",
        path: "/hosting/sites",
        description: "Deploy a new site",
        example: {
          request: `{
  "name": "my-website",
  "domain": "my-website.com",
  "git_repo": "https://github.com/user/repo.git",
  "branch": "main"
}`,
          response: `{
  "id": "site_124",
  "name": "my-website",
  "status": "deploying",
  "url": "https://my-website.com"
}`
        }
      }
    ]
  }
];

export default function DocsPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const quickStartRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<HTMLDivElement>(null);
  
  // API documentation state
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState<string>('');
  const [expandedEndpoints, setExpandedEndpoints] = useState<string[]>([]);

  const quickStartSteps = [
    {
      step: "1",
      title: "Create Account",
      description: "Sign up for your VPN Enterprise account",
      code: "curl -X POST https://api.vpnenterprise.com/auth/register"
    },
    {
      step: "2", 
      title: "Get API Key",
      description: "Generate your authentication token",
      code: "export VPN_API_KEY=your_api_key_here"
    },
    {
      step: "3",
      title: "Connect VPN",
      description: "Establish your first secure connection",
      code: "vpn-cli connect --server us-east-1"
    }
  ];

  // API documentation helper functions
  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(''), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const toggleEndpoint = (endpointId: string) => {
    setExpandedEndpoints(prev => 
      prev.includes(endpointId) 
        ? prev.filter(id => id !== endpointId)
        : [...prev, endpointId]
    );
  };

  // Filter endpoints based on search query
  const filteredEndpoints = apiEndpoints.map(category => ({
    ...category,
    endpoints: category.endpoints.filter(endpoint =>
      endpoint.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      endpoint.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      endpoint.method.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.endpoints.length > 0);

  const serviceCards = [
    {
      icon: Shield,
      title: "VPN Service",
      description: "Enterprise-grade VPN with global servers and military encryption",
      features: ["Global Network", "Zero-Trust Security", "Team Management"],
      href: "/docs/vpn/overview",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: Database,
      title: "Database Service", 
      description: "Managed databases with automatic scaling and backups",
      features: ["Auto-scaling", "Daily Backups", "High Performance"],
      href: "/docs/database/overview",
      color: "from-green-500 to-green-600"
    },
    {
      icon: Cloud,
      title: "Cloud Hosting",
      description: "Scalable web hosting with CDN and auto-deployment",
      features: ["Global CDN", "Auto-deploy", "DDoS Protection"],
      href: "/docs/hosting/overview", 
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: Code,
      title: "API & SDKs",
      description: "RESTful APIs and SDKs for seamless integration",
      features: ["REST APIs", "Multiple SDKs", "Webhooks"],
      href: "/docs/api/authentication",
      color: "from-yellow-500 to-yellow-600"
    }
  ];

  useEffect(() => {
    // Hero animation
    const tl = gsap.timeline();
    
    tl.from(".hero-title", {
      duration: 1.2,
      y: 50,
      opacity: 0,
      ease: "power3.out"
    })
    .from(".hero-subtitle", {
      duration: 1,
      y: 30,
      opacity: 0,
      ease: "power2.out"
    }, "-=0.8")
    .from(".hero-badges", {
      duration: 0.8,
      y: 20,
      opacity: 0,
      stagger: 0.1,
      ease: "back.out(1.7)"
    }, "-=0.6");

    // Service cards animation
    gsap.fromTo(".service-card", {
      y: 60,
      opacity: 0,
      scale: 0.9
    }, {
      y: 0,
      opacity: 1,
      scale: 1,
      duration: 0.8,
      stagger: 0.15,
      ease: "back.out(1.7)",
      scrollTrigger: {
        trigger: cardsRef.current,
        start: "top 80%",
        toggleActions: "play none none none"
      }
    });

    // Quick start steps animation
    gsap.fromTo(".quick-step", {
      x: -50,
      opacity: 0
    }, {
      x: 0,
      opacity: 1,
      duration: 0.8,
      stagger: 0.2,
      ease: "power2.out",
      scrollTrigger: {
        trigger: quickStartRef.current,
        start: "top 80%",
        toggleActions: "play none none none"
      }
    });

  }, []);

  return (
    <DocLayout>
      <div className="px-6 py-8">
        
        {/* Hero Section */}
        <div ref={heroRef} className="mb-16">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="hero-title text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              VPN Enterprise
              <span className="block bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                Documentation
              </span>
            </h1>
            
            <p className="hero-subtitle text-xl text-gray-600 mb-8 leading-relaxed">
              Everything you need to build, deploy, and scale secure infrastructure 
              with VPN Enterprise platform.
            </p>
            
            <div className="hero-badges flex flex-wrap gap-3 justify-center mb-8">
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200">
                <Star className="h-3 w-3 mr-1" />
                Getting Started
              </Badge>
              <Badge variant="outline" className="border-emerald-200 text-emerald-600">
                API v2.0
              </Badge>
              <Badge variant="outline" className="border-emerald-200 text-emerald-600">
                Enterprise Ready
              </Badge>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/docs/quick-start">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                  <Play className="h-4 w-4 mr-2" />
                  Quick Start Guide
                </Button>
              </Link>
              <Button 
                onClick={() => apiRef.current?.scrollIntoView({ behavior: 'smooth' })}
                size="lg" 
                variant="outline" 
                className="border-emerald-300 text-emerald-600 hover:bg-emerald-50"
              >
                <Code className="h-4 w-4 mr-2" />
                API Reference
              </Button>
            </div>
          </div>
        </div>

        {/* Service Cards */}
        <div ref={cardsRef} className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Explore Our Services
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive documentation for all VPN Enterprise services and APIs
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {serviceCards.map((service, index) => (
              <Link key={index} href={service.href}>
                <Card className="service-card group h-full bg-white/70 backdrop-blur-sm border-emerald-200 hover:border-emerald-400 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${service.color} flex items-center justify-center mb-4`}>
                        <service.icon className="h-6 w-6 text-white" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                    </div>
                    <CardTitle className="text-xl text-gray-900 group-hover:text-emerald-600 transition-colors">
                      {service.title}
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      {service.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {service.features.map((feature, i) => (
                        <Badge key={i} variant="secondary" className="text-xs bg-emerald-50 text-emerald-700">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Start */}
        <div ref={quickStartRef} className="mb-16">
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-8 border border-emerald-200">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Quick Start
              </h2>
              <p className="text-lg text-gray-600">
                Get up and running with VPN Enterprise in minutes
              </p>
            </div>

            <div className="space-y-6 max-w-2xl mx-auto">
              {quickStartSteps.map((step, index) => (
                <div key={index} className="quick-step flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {step.step}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{step.title}</h3>
                    <p className="text-gray-600 mb-3">{step.description}</p>
                    <div className="bg-gray-900 rounded-lg p-3 font-mono text-sm text-green-400">
                      {step.code}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link href="/docs/quick-start">
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  View Complete Guide <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* API Reference */}
        <div ref={apiRef} className="mb-16">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              API Reference
            </h2>
            <p className="text-gray-600 mb-6">
              Complete documentation for all VPN Enterprise API endpoints
            </p>
            
            {/* Search */}
            <div className="relative max-w-md mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search endpoints..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* API Endpoints */}
          <div className="space-y-8">
            {filteredEndpoints.map((category, categoryIndex) => (
              <div key={categoryIndex} className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <category.icon className="h-5 w-5 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">{category.category}</h3>
                  </div>
                </div>
                
                <div className="divide-y divide-gray-100">
                  {category.endpoints.map((endpoint, endpointIndex) => {
                    const endpointId = `${category.category}-${endpointIndex}`;
                    const isExpanded = expandedEndpoints.includes(endpointId);
                    
                    return (
                      <div key={endpointIndex} className="">
                        <button
                          onClick={() => toggleEndpoint(endpointId)}
                          className="w-full p-6 text-left hover:bg-gray-50 transition-colors duration-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <Badge 
                                variant={endpoint.method === 'GET' ? 'secondary' : endpoint.method === 'POST' ? 'default' : 'destructive'}
                                className={`font-mono font-semibold ${
                                  endpoint.method === 'GET' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                                  endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' :
                                  endpoint.method === 'PUT' ? 'bg-orange-100 text-orange-800 hover:bg-orange-200' :
                                  'bg-red-100 text-red-800 hover:bg-red-200'
                                }`}
                              >
                                {endpoint.method}
                              </Badge>
                              <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                                {endpoint.path}
                              </code>
                            </div>
                            {isExpanded ? 
                              <ChevronDown className="h-4 w-4 text-gray-500" /> : 
                              <ChevronRight className="h-4 w-4 text-gray-500" />
                            }
                          </div>
                          <p className="mt-2 text-sm text-gray-600">{endpoint.description}</p>
                        </button>
                        
                        {isExpanded && endpoint.example && (
                          <div className="px-6 pb-6">
                            <Tabs defaultValue={endpoint.example.request ? "request" : "response"} className="w-full">
                              <TabsList className="grid w-full grid-cols-2">
                                {endpoint.example.request && (
                                  <TabsTrigger value="request">Request</TabsTrigger>
                                )}
                                <TabsTrigger value="response">Response</TabsTrigger>
                              </TabsList>
                              
                              {endpoint.example.request && (
                                <TabsContent value="request" className="mt-4">
                                  <div className="relative">
                                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                                      <code>{endpoint.example.request}</code>
                                    </pre>
                                    <Button
                                      onClick={() => copyToClipboard(endpoint.example.request!, `${endpointId}-request`)}
                                      size="sm"
                                      variant="outline"
                                      className="absolute top-2 right-2"
                                    >
                                      {copied === `${endpointId}-request` ? 
                                        <Check className="h-3 w-3" /> : 
                                        <Copy className="h-3 w-3" />
                                      }
                                    </Button>
                                  </div>
                                </TabsContent>
                              )}
                              
                              <TabsContent value="response" className="mt-4">
                                <div className="relative">
                                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                                    <code>{endpoint.example.response}</code>
                                  </pre>
                                  <Button
                                    onClick={() => copyToClipboard(endpoint.example.response, `${endpointId}-response`)}
                                    size="sm"
                                    variant="outline"
                                    className="absolute top-2 right-2"
                                  >
                                    {copied === `${endpointId}-response` ? 
                                      <Check className="h-3 w-3" /> : 
                                      <Copy className="h-3 w-3" />
                                    }
                                  </Button>
                                </div>
                              </TabsContent>
                            </Tabs>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            
            {searchQuery && filteredEndpoints.length === 0 && (
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No endpoints found</h3>
                <p className="text-gray-600">Try adjusting your search terms</p>
              </div>
            )}
          </div>
        </div>

        {/* Popular Guides */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Popular Guides
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Team Setup Guide",
                description: "Learn how to set up and manage your team's VPN access",
                href: "/docs/guides/team-setup",
                icon: Users,
                readTime: "10 min"
              },
              {
                title: "Security Best Practices", 
                description: "Essential security measures for enterprise deployment",
                href: "/docs/security/best-practices",
                icon: Lock,
                readTime: "15 min"
              },
              {
                title: "Multi-Region Setup",
                description: "Deploy your infrastructure across multiple regions",
                href: "/docs/guides/multi-region", 
                icon: Globe,
                readTime: "20 min"
              }
            ].map((guide, index) => (
              <Link key={index} href={guide.href}>
                <Card className="group h-full bg-white/50 backdrop-blur-sm hover:bg-white/80 border-gray-200 hover:border-emerald-300 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <guide.icon className="h-5 w-5 text-emerald-600" />
                      <Badge variant="outline" className="text-xs">
                        {guide.readTime}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg group-hover:text-emerald-600 transition-colors">
                      {guide.title}
                    </CardTitle>
                    <CardDescription>
                      {guide.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Support */}
        <div className="text-center bg-white/50 backdrop-blur-sm rounded-2xl p-8 border border-emerald-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Need Help?
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Can't find what you're looking for? Our support team is here to help you succeed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button variant="outline" className="border-emerald-300 text-emerald-600 hover:bg-emerald-50">
                Contact Support
              </Button>
            </Link>
            <Link href="https://github.com/vpn-enterprise" target="_blank">
              <Button variant="outline" className="border-emerald-300 text-emerald-600 hover:bg-emerald-50">
                GitHub Issues
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </DocLayout>
  );
}