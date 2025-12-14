"use client";

import { useState } from 'react';
import { 
  Database, Server, Zap, Shield, BarChart3, Globe,
  Copy, Check, ArrowRight, Clock, Users, Cpu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DocLayout from '@/components/docs/DocLayout';
import Link from 'next/link';

export default function DatabaseOverviewPage() {
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

  const databaseFeatures = [
    {
      feature: "Multi-Tenant Architecture",
      description: "Isolated database instances for each organization with shared infrastructure",
      icon: Users,
      benefits: ["Complete data isolation", "Tenant-specific scaling", "Simplified compliance"],
      color: "blue"
    },
    {
      feature: "High Availability",
      description: "99.99% uptime with automatic failover and disaster recovery",
      icon: Shield,
      benefits: ["Multi-region deployment", "Automatic backups", "Point-in-time recovery"],
      color: "green"
    },
    {
      feature: "Performance Optimization",
      description: "Advanced indexing, caching, and query optimization for lightning-fast responses",
      icon: Zap,
      benefits: ["Sub-millisecond queries", "Smart caching", "Auto-scaling compute"],
      color: "yellow"
    },
    {
      feature: "Global Distribution", 
      description: "Deploy databases closer to your users with edge locations worldwide",
      icon: Globe,
      benefits: ["Low-latency access", "Data residency compliance", "Edge computing"],
      color: "purple"
    },
    {
      feature: "Advanced Analytics",
      description: "Built-in analytics and reporting with real-time insights",
      icon: BarChart3,
      benefits: ["Query performance metrics", "Usage analytics", "Cost optimization"],
      color: "orange"
    },
    {
      feature: "Enterprise Security",
      description: "Comprehensive security with encryption, auditing, and compliance",
      icon: Database,
      benefits: ["End-to-end encryption", "Audit logging", "Role-based access"],
      color: "red"
    }
  ];

  const databaseTypes = [
    {
      type: "PostgreSQL",
      description: "Advanced open-source relational database with JSONB support",
      version: "16.1",
      useCases: ["OLTP applications", "Complex queries", "JSON workloads"],
      features: ["ACID compliance", "Advanced indexing", "Full-text search", "Geospatial data"],
      performance: "Excellent",
      recommended: true
    },
    {
      type: "MySQL",
      description: "Popular open-source relational database optimized for web applications",
      version: "8.0.35",
      useCases: ["Web applications", "E-commerce", "Content management"],
      features: ["InnoDB engine", "Replication", "Partitioning", "JSON support"],
      performance: "Very Good"
    },
    {
      type: "MongoDB",
      description: "Document-oriented NoSQL database for flexible data models",
      version: "7.0.4",
      useCases: ["Content management", "IoT applications", "Real-time analytics"],
      features: ["Flexible schema", "Horizontal scaling", "Aggregation framework", "GridFS"],
      performance: "Good"
    },
    {
      type: "Redis",
      description: "In-memory data structure store for caching and real-time applications",
      version: "7.2.3",
      useCases: ["Caching", "Session storage", "Pub/sub messaging"],
      features: ["Sub-millisecond latency", "Data structures", "Persistence", "Clustering"],
      performance: "Outstanding"
    }
  ];

  const quickStartSteps = [
    {
      step: "Create Database Instance",
      description: "Deploy a new database with your preferred configuration",
      command: "db-cli create --type postgresql --plan pro --region us-east-1",
      time: "2 minutes"
    },
    {
      step: "Configure Access",
      description: "Set up users, roles, and security policies",
      command: "db-cli user create --username admin --role owner --database myapp",
      time: "30 seconds"
    },
    {
      step: "Connect Application",
      description: "Get connection string and integrate with your application",
      command: "db-cli connection-string --format env > .env.database",
      time: "1 minute"
    },
    {
      step: "Load Sample Data",
      description: "Import initial data or run migrations",
      command: "db-cli import --file schema.sql --database myapp",
      time: "Variable"
    }
  ];

  const serviceMetrics = [
    { metric: "Uptime", value: "99.99%", color: "green" },
    { metric: "Average Response Time", value: "< 5ms", color: "blue" },
    { metric: "Data Centers", value: "25+", color: "purple" },
    { metric: "Concurrent Connections", value: "10,000+", color: "orange" }
  ];

  return (
    <DocLayout>
      <div className="px-6 py-8">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/docs" className="hover:text-gray-900">Documentation</Link>
          <span>›</span>
          <span className="text-gray-900 font-medium">Database Service</span>
          <span>›</span>
          <span className="text-gray-900 font-medium">Overview</span>
        </div>

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Database className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Database Service</h1>
              <p className="text-lg text-gray-600 mt-2">
                Managed database infrastructure with enterprise-grade performance and security
              </p>
            </div>
          </div>

          {/* Service Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {serviceMetrics.map((metric, index) => (
              <div key={index} className="p-4 bg-white rounded-lg border border-gray-200">
                <div className={`text-2xl font-bold mb-1 ${
                  metric.color === 'green' ? 'text-green-600' :
                  metric.color === 'blue' ? 'text-blue-600' :
                  metric.color === 'purple' ? 'text-purple-600' :
                  'text-orange-600'
                }`}>
                  {metric.value}
                </div>
                <div className="text-sm text-gray-600">{metric.metric}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Introduction */}
        <div className="mb-12">
          <Card className="bg-blue-50/50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Server className="h-5 w-5 text-blue-600" />
                Database-as-a-Service Platform
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                VPN Enterprise Database Service provides fully managed database infrastructure with automatic 
                scaling, high availability, and enterprise security. Deploy PostgreSQL, MySQL, MongoDB, or Redis 
                instances in seconds with zero maintenance overhead.
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Multi-Engine Support</h4>
                  <span className="text-sm text-gray-600">PostgreSQL, MySQL, MongoDB, Redis</span>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Global Availability</h4>
                  <span className="text-sm text-gray-600">25+ regions with edge deployment</span>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Enterprise Ready</h4>
                  <span className="text-sm text-gray-600">SOC 2, HIPAA, GDPR compliant</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Database Features */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Features</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {databaseFeatures.map((feature, index) => (
              <Card 
                key={index}
                className={`${
                  feature.color === 'blue' ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200' :
                  feature.color === 'green' ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' :
                  feature.color === 'yellow' ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200' :
                  feature.color === 'purple' ? 'bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200' :
                  feature.color === 'orange' ? 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-200' :
                  'bg-gradient-to-br from-red-50 to-pink-50 border-red-200'
                }`}
              >
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${
                      feature.color === 'blue' ? 'bg-blue-100' :
                      feature.color === 'green' ? 'bg-green-100' :
                      feature.color === 'yellow' ? 'bg-yellow-100' :
                      feature.color === 'purple' ? 'bg-purple-100' :
                      feature.color === 'orange' ? 'bg-orange-100' :
                      'bg-red-100'
                    }`}>
                      <feature.icon className={`h-6 w-6 ${
                        feature.color === 'blue' ? 'text-blue-600' :
                        feature.color === 'green' ? 'text-green-600' :
                        feature.color === 'yellow' ? 'text-yellow-600' :
                        feature.color === 'purple' ? 'text-purple-600' :
                        feature.color === 'orange' ? 'text-orange-600' :
                        'text-red-600'
                      }`} />
                    </div>
                    <CardTitle className="text-lg">{feature.feature}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4">{feature.description}</p>
                  <div className="space-y-2">
                    {feature.benefits.map((benefit, benefitIndex) => (
                      <div key={benefitIndex} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Database Types */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Supported Database Engines</h2>
          
          <div className="space-y-6">
            {databaseTypes.map((db, index) => (
              <Card key={index} className="bg-white/70 backdrop-blur-sm border-gray-200">
                <CardHeader className="border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl flex items-center gap-3">
                        {db.type}
                        {db.recommended && (
                          <Badge className="bg-blue-600 text-white">Recommended</Badge>
                        )}
                        <Badge variant="outline" className="font-mono text-xs">
                          v{db.version}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-1">{db.description}</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600 mb-1">Performance</div>
                      <Badge className={
                        db.performance === 'Outstanding' ? 'bg-green-100 text-green-800' :
                        db.performance === 'Excellent' ? 'bg-blue-100 text-blue-800' :
                        db.performance === 'Very Good' ? 'bg-purple-100 text-purple-800' :
                        'bg-orange-100 text-orange-800'
                      }>
                        {db.performance}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Common Use Cases</h4>
                      <div className="space-y-2">
                        {db.useCases.map((useCase, useCaseIndex) => (
                          <div key={useCaseIndex} className="flex items-center gap-2">
                            <ArrowRight className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{useCase}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Key Features</h4>
                      <div className="space-y-2">
                        {db.features.map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Start Guide */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Start Guide</h2>
          
          <Card className="bg-gray-50/50 border-gray-200">
            <CardHeader>
              <CardTitle>Get Started in Minutes</CardTitle>
              <CardDescription>
                Follow these simple steps to create your first database instance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {quickStartSteps.map((step, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">{step.step}</h4>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">{step.time}</span>
                        </div>
                      </div>
                      <p className="text-gray-700 mb-3">{step.description}</p>
                      <div className="relative">
                        <Button
                          onClick={() => copyToClipboard(step.command, `quickstart-${index}`)}
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                        >
                          {copied === `quickstart-${index}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                          <code>{step.command}</code>
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Architecture Overview */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Architecture & Deployment</h2>
          
          <Tabs defaultValue="single" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="single">Single Instance</TabsTrigger>
              <TabsTrigger value="cluster">High Availability</TabsTrigger>
              <TabsTrigger value="distributed">Global Distribution</TabsTrigger>
            </TabsList>
            
            <TabsContent value="single" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Single Instance Deployment</CardTitle>
                  <CardDescription>
                    Perfect for development, testing, and small applications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Features</h4>
                        <ul className="space-y-2">
                          <li className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-gray-700">Automatic backups</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-gray-700">Point-in-time recovery</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-gray-700">Monitoring & alerting</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-gray-700">SSL/TLS encryption</span>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Best For</h4>
                        <ul className="space-y-2">
                          <li className="flex items-center gap-2">
                            <ArrowRight className="h-4 w-4 text-blue-600" />
                            <span className="text-sm text-gray-700">Development environments</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <ArrowRight className="h-4 w-4 text-blue-600" />
                            <span className="text-sm text-gray-700">Small applications</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <ArrowRight className="h-4 w-4 text-blue-600" />
                            <span className="text-sm text-gray-700">Prototyping</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <ArrowRight className="h-4 w-4 text-blue-600" />
                            <span className="text-sm text-gray-700">Cost optimization</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                    <div className="relative">
                      <Button
                        onClick={() => copyToClipboard(`# Deploy single PostgreSQL instance
db-cli create \\
  --type postgresql \\
  --plan starter \\
  --region us-east-1 \\
  --name myapp-db \\
  --version 16.1`, 'single-deploy')}
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                      >
                        {copied === 'single-deploy' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                        <code>{`# Deploy single PostgreSQL instance
db-cli create \\
  --type postgresql \\
  --plan starter \\
  --region us-east-1 \\
  --name myapp-db \\
  --version 16.1`}</code>
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="cluster" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>High Availability Cluster</CardTitle>
                  <CardDescription>
                    Production-ready with automatic failover and read replicas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Features</h4>
                        <ul className="space-y-2">
                          <li className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-gray-700">99.99% uptime SLA</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-gray-700">Automatic failover</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-gray-700">Read replicas</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-gray-700">Connection pooling</span>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Best For</h4>
                        <ul className="space-y-2">
                          <li className="flex items-center gap-2">
                            <ArrowRight className="h-4 w-4 text-blue-600" />
                            <span className="text-sm text-gray-700">Production applications</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <ArrowRight className="h-4 w-4 text-blue-600" />
                            <span className="text-sm text-gray-700">Mission-critical systems</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <ArrowRight className="h-4 w-4 text-blue-600" />
                            <span className="text-sm text-gray-700">High-traffic websites</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <ArrowRight className="h-4 w-4 text-blue-600" />
                            <span className="text-sm text-gray-700">Enterprise applications</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                    <div className="relative">
                      <Button
                        onClick={() => copyToClipboard(`# Deploy HA PostgreSQL cluster
db-cli create \\
  --type postgresql \\
  --plan pro \\
  --region us-east-1 \\
  --name myapp-db \\
  --ha-enabled \\
  --read-replicas 2 \\
  --connection-pooling enabled`, 'ha-deploy')}
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                      >
                        {copied === 'ha-deploy' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                        <code>{`# Deploy HA PostgreSQL cluster
db-cli create \\
  --type postgresql \\
  --plan pro \\
  --region us-east-1 \\
  --name myapp-db \\
  --ha-enabled \\
  --read-replicas 2 \\
  --connection-pooling enabled`}</code>
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="distributed" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Global Distribution</CardTitle>
                  <CardDescription>
                    Deploy across multiple regions for global applications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Features</h4>
                        <ul className="space-y-2">
                          <li className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-gray-700">Multi-region deployment</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-gray-700">Edge replication</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-gray-700">Intelligent routing</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-gray-700">Conflict resolution</span>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Best For</h4>
                        <ul className="space-y-2">
                          <li className="flex items-center gap-2">
                            <ArrowRight className="h-4 w-4 text-blue-600" />
                            <span className="text-sm text-gray-700">Global applications</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <ArrowRight className="h-4 w-4 text-blue-600" />
                            <span className="text-sm text-gray-700">Compliance requirements</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <ArrowRight className="h-4 w-4 text-blue-600" />
                            <span className="text-sm text-gray-700">Low-latency access</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <ArrowRight className="h-4 w-4 text-blue-600" />
                            <span className="text-sm text-gray-700">Disaster recovery</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                    <div className="relative">
                      <Button
                        onClick={() => copyToClipboard(`# Deploy globally distributed PostgreSQL
db-cli create \\
  --type postgresql \\
  --plan enterprise \\
  --regions us-east-1,eu-west-1,ap-southeast-1 \\
  --name myapp-global-db \\
  --global-distribution enabled \\
  --edge-caching enabled \\
  --conflict-resolution last-write-wins`, 'global-deploy')}
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                      >
                        {copied === 'global-deploy' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                        <code>{`# Deploy globally distributed PostgreSQL
db-cli create \\
  --type postgresql \\
  --plan enterprise \\
  --regions us-east-1,eu-west-1,ap-southeast-1 \\
  --name myapp-global-db \\
  --global-distribution enabled \\
  --edge-caching enabled \\
  --conflict-resolution last-write-wins`}</code>
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Next Steps */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
          <p className="text-gray-600 mb-6">
            Explore our comprehensive guides to learn more about database setup, configuration, and optimization.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/docs/database/getting-started">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Getting Started Guide
              </Button>
            </Link>
            <Link href="/docs/database/connection-strings">
              <Button variant="outline" className="border-blue-300 text-blue-600 hover:bg-blue-50">
                Connection Strings
              </Button>
            </Link>
            <Link href="/docs/database/performance">
              <Button variant="outline" className="border-blue-300 text-blue-600 hover:bg-blue-50">
                Performance Tuning
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </DocLayout>
  );
}