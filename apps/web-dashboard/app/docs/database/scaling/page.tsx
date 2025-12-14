"use client";

import { useState } from 'react';
import { 
  TrendingUp, Cpu, MemoryStick, HardDrive, Activity, Gauge,
  Copy, Check, ArrowUp, ArrowDown, BarChart3, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DocLayout from '@/components/docs/DocLayout';
import Link from 'next/link';

export default function ScalingPage() {
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

  const scalingTypes = [
    {
      type: "Vertical Scaling",
      description: "Scale up by increasing CPU, RAM, and storage on existing instance",
      icon: ArrowUp,
      benefits: ["Simple to implement", "No application changes", "Better single-query performance"],
      limitations: ["Hardware limits", "Downtime required", "Single point of failure"],
      useCases: ["CPU-intensive workloads", "Memory-hungry applications", "Simple scaling needs"],
      color: "blue"
    },
    {
      type: "Horizontal Scaling",
      description: "Scale out by adding read replicas and distributing load",
      icon: BarChart3,
      benefits: ["No theoretical limits", "Improved availability", "Better fault tolerance"],
      limitations: ["Application complexity", "Eventual consistency", "Read/write split required"],
      useCases: ["Read-heavy workloads", "Global applications", "High availability needs"],
      color: "green"
    },
    {
      type: "Auto Scaling",
      description: "Automatically adjust resources based on demand patterns",
      icon: Gauge,
      benefits: ["Cost optimization", "Zero manual intervention", "Responsive to traffic"],
      limitations: ["Configuration complexity", "Potential over-scaling", "Monitoring required"],
      useCases: ["Variable workloads", "Traffic spikes", "Cost-sensitive applications"],
      color: "purple"
    }
  ];

  const scalingMetrics = [
    { metric: "Current Connections", value: "1,247", max: "2,000", utilization: 62, color: "blue" },
    { metric: "CPU Usage", value: "45%", max: "100%", utilization: 45, color: "green" },
    { metric: "Memory Usage", value: "8.2 GB", max: "16 GB", utilization: 51, color: "purple" },
    { metric: "Storage Usage", value: "145 GB", max: "500 GB", utilization: 29, color: "orange" }
  ];

  const scalingStrategies = [
    {
      strategy: "Read Replica Scaling",
      description: "Distribute read queries across multiple replica instances",
      implementation: "Add read replicas in same or different regions",
      benefits: ["Reduced primary load", "Improved read performance", "Geographic distribution"],
      complexity: "Medium",
      commands: [
        "db-cli replica create my-database --name my-database-read-1 --region us-west-2",
        "db-cli replica create my-database --name my-database-read-2 --region eu-west-1"
      ]
    },
    {
      strategy: "Connection Pooling",
      description: "Optimize connection usage with intelligent pooling",
      implementation: "Configure connection pool with optimal parameters",
      benefits: ["Better resource utilization", "Reduced connection overhead", "Improved scalability"],
      complexity: "Low",
      commands: [
        "db-cli pool configure my-database --max-connections 200 --pool-mode transaction",
        "db-cli pool enable my-database --type pgbouncer"
      ]
    },
    {
      strategy: "Sharding",
      description: "Distribute data across multiple database instances",
      implementation: "Partition data based on shard key",
      benefits: ["Horizontal data scaling", "Reduced per-shard load", "Parallel processing"],
      complexity: "High",
      commands: [
        "db-cli shard create my-database --strategy hash --shard-key user_id --shards 4",
        "db-cli shard rebalance my-database --target-distribution even"
      ]
    },
    {
      strategy: "Caching Layer",
      description: "Implement Redis caching to reduce database load",
      implementation: "Deploy Redis cache with application integration",
      benefits: ["Faster response times", "Reduced database load", "Better user experience"],
      complexity: "Medium",
      commands: [
        "db-cli cache create --type redis --name my-app-cache --region us-east-1",
        "db-cli cache configure my-app-cache --ttl 3600 --max-memory 4gb"
      ]
    }
  ];

  const autoscalingPolicies = [
    {
      policy: "CPU-based Scaling",
      description: "Scale based on CPU utilization thresholds",
      trigger: "CPU > 70% for 5 minutes",
      action: "Add read replica or scale up compute",
      cooldown: "10 minutes",
      configuration: `db-cli autoscale policy create \\
  --database my-database \\
  --metric cpu \\
  --threshold-up 70 \\
  --threshold-down 30 \\
  --action scale-compute \\
  --cooldown 600`
    },
    {
      policy: "Connection-based Scaling",
      description: "Scale based on active database connections",
      trigger: "Connections > 80% of limit",
      action: "Add read replica or increase connection pool",
      cooldown: "5 minutes",
      configuration: `db-cli autoscale policy create \\
  --database my-database \\
  --metric connections \\
  --threshold-up 80 \\
  --action add-replica \\
  --cooldown 300`
    },
    {
      policy: "Memory-based Scaling",
      description: "Scale based on memory utilization patterns",
      trigger: "Memory > 85% for 3 minutes",
      action: "Scale up instance size",
      cooldown: "15 minutes",
      configuration: `db-cli autoscale policy create \\
  --database my-database \\
  --metric memory \\
  --threshold-up 85 \\
  --action scale-up \\
  --cooldown 900`
    },
    {
      policy: "Query Response Time",
      description: "Scale based on average query response times",
      trigger: "Avg response > 500ms for 2 minutes",
      action: "Add read replica",
      cooldown: "8 minutes",
      configuration: `db-cli autoscale policy create \\
  --database my-database \\
  --metric query-time \\
  --threshold-up 500 \\
  --action add-replica \\
  --cooldown 480`
    }
  ];

  const performanceTips = [
    {
      category: "Query Optimization",
      tips: [
        "Use EXPLAIN ANALYZE to identify slow queries",
        "Create appropriate indexes for frequent queries", 
        "Avoid SELECT * in production queries",
        "Use query result caching for repeated queries"
      ]
    },
    {
      category: "Connection Management",
      tips: [
        "Implement connection pooling in applications",
        "Set appropriate connection timeouts",
        "Monitor connection pool utilization",
        "Use prepared statements for repeated queries"
      ]
    },
    {
      category: "Resource Monitoring",
      tips: [
        "Monitor CPU, memory, and I/O utilization",
        "Set up alerts for resource thresholds", 
        "Track query performance over time",
        "Monitor connection counts and patterns"
      ]
    },
    {
      category: "Capacity Planning",
      tips: [
        "Analyze growth patterns and trends",
        "Test scaling operations in staging",
        "Plan for peak traffic scenarios",
        "Consider seasonal usage patterns"
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
          <Link href="/docs/database/overview" className="hover:text-gray-900">Database Service</Link>
          <span>›</span>
          <span className="text-gray-900 font-medium">Scaling</span>
        </div>

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <TrendingUp className="h-8 w-8 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Database Scaling</h1>
              <p className="text-lg text-gray-600 mt-2">
                Scale your database infrastructure to handle growing demands and traffic
              </p>
            </div>
          </div>

          {/* Current Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {scalingMetrics.map((metric, index) => (
              <Card key={index} className="bg-white border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`text-lg font-bold ${
                      metric.color === 'blue' ? 'text-blue-600' :
                      metric.color === 'green' ? 'text-green-600' :
                      metric.color === 'purple' ? 'text-purple-600' :
                      'text-orange-600'
                    }`}>
                      {metric.value}
                    </div>
                    <div className={`text-xs px-2 py-1 rounded ${
                      metric.utilization < 50 ? 'bg-green-100 text-green-800' :
                      metric.utilization < 80 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {metric.utilization}%
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">{metric.metric}</div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        metric.color === 'blue' ? 'bg-blue-600' :
                        metric.color === 'green' ? 'bg-green-600' :
                        metric.color === 'purple' ? 'bg-purple-600' :
                        'bg-orange-600'
                      }`}
                      style={{ width: `${metric.utilization}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Max: {metric.max}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Scaling Overview */}
        <div className="mb-12">
          <Card className="bg-indigo-50/50 border-indigo-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-indigo-600" />
                Scaling Strategy Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                VPN Enterprise offers multiple scaling approaches to handle increased load, from simple vertical scaling 
                to sophisticated horizontal distribution with auto-scaling capabilities. Choose the right strategy based 
                on your application's requirements and growth patterns.
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Vertical Scaling</h4>
                  <span className="text-sm text-gray-600">Increase resources per instance</span>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Horizontal Scaling</h4>
                  <span className="text-sm text-gray-600">Add more database instances</span>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Auto Scaling</h4>
                  <span className="text-sm text-gray-600">Automatic resource adjustment</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scaling Types */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Scaling Approaches</h2>
          
          <div className="space-y-6">
            {scalingTypes.map((type, index) => (
              <Card 
                key={index}
                className={`${
                  type.color === 'blue' ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200' :
                  type.color === 'green' ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' :
                  'bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200'
                }`}
              >
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${
                      type.color === 'blue' ? 'bg-blue-100' :
                      type.color === 'green' ? 'bg-green-100' :
                      'bg-purple-100'
                    }`}>
                      <type.icon className={`h-6 w-6 ${
                        type.color === 'blue' ? 'text-blue-600' :
                        type.color === 'green' ? 'text-green-600' :
                        'text-purple-600'
                      }`} />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{type.type}</CardTitle>
                      <CardDescription>{type.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Benefits</h4>
                      <div className="space-y-2">
                        {type.benefits.map((benefit, benefitIndex) => (
                          <div key={benefitIndex} className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Limitations</h4>
                      <div className="space-y-2">
                        {type.limitations.map((limitation, limitIndex) => (
                          <div key={limitIndex} className="flex items-center gap-2">
                            <ArrowDown className="h-4 w-4 text-orange-600 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{limitation}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Best For</h4>
                      <div className="space-y-2">
                        {type.useCases.map((useCase, useCaseIndex) => (
                          <div key={useCaseIndex} className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{useCase}</span>
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

        {/* Scaling Strategies */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Scaling Strategies</h2>
          
          <div className="space-y-6">
            {scalingStrategies.map((strategy, index) => (
              <Card key={index} className="bg-white/70 backdrop-blur-sm border-gray-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">{strategy.strategy}</CardTitle>
                      <CardDescription>{strategy.description}</CardDescription>
                    </div>
                    <Badge className={
                      strategy.complexity === 'Low' ? 'bg-green-100 text-green-800' :
                      strategy.complexity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }>
                      {strategy.complexity} Complexity
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Implementation</h4>
                      <p className="text-sm text-gray-700">{strategy.implementation}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Benefits</h4>
                      <div className="space-y-1">
                        {strategy.benefits.map((benefit, benefitIndex) => (
                          <div key={benefitIndex} className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Implementation Commands</h4>
                    <div className="space-y-3">
                      {strategy.commands.map((command, cmdIndex) => (
                        <div key={cmdIndex} className="relative">
                          <Button
                            onClick={() => copyToClipboard(command, `strategy-${index}-${cmdIndex}`)}
                            size="sm"
                            variant="ghost"
                            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                          >
                            {copied === `strategy-${index}-${cmdIndex}` ? 
                              <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />
                            }
                          </Button>
                          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                            <code>{command}</code>
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Auto-scaling Policies */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Auto-scaling Policies</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {autoscalingPolicies.map((policy, index) => (
              <Card key={index} className="bg-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg">{policy.policy}</CardTitle>
                  <CardDescription>{policy.description}</CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Trigger:</span>
                        <div className="font-medium text-gray-900">{policy.trigger}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Cooldown:</span>
                        <div className="font-medium text-gray-900">{policy.cooldown}</div>
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-sm text-gray-600">Action:</span>
                      <div className="text-sm font-medium text-gray-900">{policy.action}</div>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Configuration</h5>
                      <div className="relative">
                        <Button
                          onClick={() => copyToClipboard(policy.configuration, `policy-${index}`)}
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                        >
                          {copied === `policy-${index}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <pre className="bg-gray-900 text-gray-100 p-3 rounded text-sm overflow-x-auto">
                          <code>{policy.configuration}</code>
                        </pre>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Scaling Operations */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Scaling Operations</h2>
          
          <Tabs defaultValue="vertical" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="vertical">Vertical Scale</TabsTrigger>
              <TabsTrigger value="replicas">Read Replicas</TabsTrigger>
              <TabsTrigger value="autoscale">Auto-scale</TabsTrigger>
              <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            </TabsList>
            
            <TabsContent value="vertical" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Vertical Scaling Operations</CardTitle>
                  <CardDescription>
                    Scale up database instances by increasing CPU, memory, and storage
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Button
                      onClick={() => copyToClipboard(`# Scale up database instance
db-cli scale my-database \\
  --plan pro \\
  --cpu 4 \\
  --memory 16gb \\
  --storage 500gb

# Scale with maintenance window
db-cli scale my-database \\
  --plan enterprise \\
  --maintenance-window "Sunday 02:00-04:00"

# Preview scaling changes
db-cli scale preview my-database \\
  --plan pro \\
  --show-cost

# Scale storage only (online operation)
db-cli scale storage my-database \\
  --size 1tb \\
  --iops 3000`, 'vertical-scale')}
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                    >
                      {copied === 'vertical-scale' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{`# Scale up database instance
db-cli scale my-database \\
  --plan pro \\
  --cpu 4 \\
  --memory 16gb \\
  --storage 500gb

# Scale with maintenance window
db-cli scale my-database \\
  --plan enterprise \\
  --maintenance-window "Sunday 02:00-04:00"

# Preview scaling changes
db-cli scale preview my-database \\
  --plan pro \\
  --show-cost

# Scale storage only (online operation)
db-cli scale storage my-database \\
  --size 1tb \\
  --iops 3000`}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="replicas" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Read Replica Management</CardTitle>
                  <CardDescription>
                    Create and manage read replicas for horizontal scaling
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Button
                      onClick={() => copyToClipboard(`# Create read replica
db-cli replica create my-database \\
  --name my-database-read-1 \\
  --region us-west-2 \\
  --instance-type r5.large

# Create cross-region replica
db-cli replica create my-database \\
  --name my-database-eu \\
  --region eu-west-1 \\
  --enable-cross-region-backup

# List all replicas
db-cli replica list my-database

# Promote replica to master
db-cli replica promote my-database-read-1

# Delete replica
db-cli replica delete my-database-read-1

# Configure replica lag monitoring
db-cli replica monitor my-database-read-1 \\
  --max-lag 30s \\
  --alert-webhook https://alerts.company.com`, 'replica-ops')}
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                    >
                      {copied === 'replica-ops' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{`# Create read replica
db-cli replica create my-database \\
  --name my-database-read-1 \\
  --region us-west-2 \\
  --instance-type r5.large

# Create cross-region replica
db-cli replica create my-database \\
  --name my-database-eu \\
  --region eu-west-1 \\
  --enable-cross-region-backup

# List all replicas
db-cli replica list my-database

# Promote replica to master
db-cli replica promote my-database-read-1

# Delete replica
db-cli replica delete my-database-read-1

# Configure replica lag monitoring
db-cli replica monitor my-database-read-1 \\
  --max-lag 30s \\
  --alert-webhook https://alerts.company.com`}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="autoscale" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Auto-scaling Configuration</CardTitle>
                  <CardDescription>
                    Set up automatic scaling based on performance metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Button
                      onClick={() => copyToClipboard(`# Enable auto-scaling
db-cli autoscale enable my-database

# Configure CPU-based scaling
db-cli autoscale policy create \\
  --database my-database \\
  --name "cpu-scaling" \\
  --metric cpu \\
  --scale-up-threshold 70 \\
  --scale-down-threshold 30 \\
  --cooldown 300

# Configure connection-based scaling
db-cli autoscale policy create \\
  --database my-database \\
  --name "connection-scaling" \\
  --metric connections \\
  --scale-up-threshold 80 \\
  --action add-replica \\
  --max-replicas 5

# View scaling history
db-cli autoscale history my-database

# Disable auto-scaling
db-cli autoscale disable my-database`, 'autoscale-config')}
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                    >
                      {copied === 'autoscale-config' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{`# Enable auto-scaling
db-cli autoscale enable my-database

# Configure CPU-based scaling
db-cli autoscale policy create \\
  --database my-database \\
  --name "cpu-scaling" \\
  --metric cpu \\
  --scale-up-threshold 70 \\
  --scale-down-threshold 30 \\
  --cooldown 300

# Configure connection-based scaling
db-cli autoscale policy create \\
  --database my-database \\
  --name "connection-scaling" \\
  --metric connections \\
  --scale-up-threshold 80 \\
  --action add-replica \\
  --max-replicas 5

# View scaling history
db-cli autoscale history my-database

# Disable auto-scaling
db-cli autoscale disable my-database`}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="monitoring" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Scaling Monitoring</CardTitle>
                  <CardDescription>
                    Monitor scaling metrics and performance indicators
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Button
                      onClick={() => copyToClipboard(`# Monitor scaling metrics
db-cli metrics my-database \\
  --metric "cpu,memory,connections,query_time" \\
  --period 1h \\
  --interval 5m

# Set up scaling alerts
db-cli alerts create \\
  --database my-database \\
  --metric cpu \\
  --threshold 80 \\
  --action email:admin@company.com

# View current resource utilization
db-cli status my-database --resources

# Monitor replica lag
db-cli replica lag my-database --all-replicas

# Generate scaling report
db-cli reports scaling my-database \\
  --period 30d \\
  --format pdf \\
  --email admin@company.com

# Test scaling triggers
db-cli autoscale test my-database \\
  --simulate-load cpu:80`, 'monitoring-scale')}
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                    >
                      {copied === 'monitoring-scale' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{`# Monitor scaling metrics
db-cli metrics my-database \\
  --metric "cpu,memory,connections,query_time" \\
  --period 1h \\
  --interval 5m

# Set up scaling alerts
db-cli alerts create \\
  --database my-database \\
  --metric cpu \\
  --threshold 80 \\
  --action email:admin@company.com

# View current resource utilization
db-cli status my-database --resources

# Monitor replica lag
db-cli replica lag my-database --all-replicas

# Generate scaling report
db-cli reports scaling my-database \\
  --period 30d \\
  --format pdf \\
  --email admin@company.com

# Test scaling triggers
db-cli autoscale test my-database \\
  --simulate-load cpu:80`}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Performance Tips */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Scaling Best Practices</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {performanceTips.map((category, index) => (
              <Card key={index} className="bg-gradient-to-br from-gray-50 to-white border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg">{category.category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {category.tips.map((tip, tipIndex) => (
                      <div key={tipIndex} className="flex items-start gap-3">
                        <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{tip}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl p-8 border border-indigo-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Next Steps</h2>
          <p className="text-gray-600 mb-6">
            With scaling strategies in place, optimize your database performance and implement comprehensive monitoring.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/docs/database/performance">
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                Performance Optimization
              </Button>
            </Link>
            <Link href="/docs/database/backup-recovery">
              <Button variant="outline" className="border-indigo-300 text-indigo-600 hover:bg-indigo-50">
                Backup & Recovery
              </Button>
            </Link>
            <Link href="/docs/database/connection-strings">
              <Button variant="outline" className="border-indigo-300 text-indigo-600 hover:bg-indigo-50">
                Connection Strings
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </DocLayout>
  );
}