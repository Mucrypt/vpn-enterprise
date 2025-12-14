"use client";

import { useState } from 'react';
import { 
  Server, BarChart3, Settings, Cpu, HardDrive, Network,
  Copy, Check, Shield, Zap, Globe, AlertCircle, Info, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DocLayout from '@/components/docs/DocLayout';
import Link from 'next/link';

export default function ServerManagementPage() {
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

  const serverTypes = [
    {
      name: "Standard",
      cpu: "2 vCPU",
      memory: "4GB RAM", 
      bandwidth: "1Gbps",
      connections: "Up to 100",
      price: "$29/month",
      color: "blue",
      features: ["Basic monitoring", "Standard support", "99.5% uptime SLA"]
    },
    {
      name: "Performance",
      cpu: "4 vCPU",
      memory: "8GB RAM",
      bandwidth: "5Gbps", 
      connections: "Up to 500",
      price: "$79/month",
      color: "green",
      features: ["Advanced monitoring", "Priority support", "99.9% uptime SLA"],
      popular: true
    },
    {
      name: "Enterprise", 
      cpu: "8 vCPU",
      memory: "16GB RAM",
      bandwidth: "10Gbps",
      connections: "Up to 2000",
      price: "$199/month",
      color: "purple",
      features: ["Real-time analytics", "24/7 dedicated support", "99.99% uptime SLA"]
    }
  ];

  const managementCommands = [
    {
      category: "Server Lifecycle",
      commands: [
        {
          name: "Create Server",
          command: "vpn-cli server create --region us-east-1 --type performance --name prod-vpn",
          description: "Deploy a new VPN server instance"
        },
        {
          name: "List Servers",
          command: "vpn-cli server list --format table --sort-by region",
          description: "View all server instances and their status"
        },
        {
          name: "Scale Server",
          command: "vpn-cli server scale --server-id srv_123 --type enterprise",
          description: "Upgrade or downgrade server resources"
        },
        {
          name: "Delete Server", 
          command: "vpn-cli server delete --server-id srv_123 --force",
          description: "Terminate server instance and cleanup resources"
        }
      ]
    },
    {
      category: "Configuration Management",
      commands: [
        {
          name: "Update Config",
          command: "vpn-cli server config update --server-id srv_123 --max-clients 200",
          description: "Modify server configuration parameters"
        },
        {
          name: "Backup Config",
          command: "vpn-cli server backup create --server-id srv_123 --name daily-backup",
          description: "Create configuration and certificate backups"
        },
        {
          name: "Restore Backup",
          command: "vpn-cli server backup restore --backup-id bak_456 --server-id srv_123",
          description: "Restore server from backup"
        },
        {
          name: "Certificate Rotation",
          command: "vpn-cli server certs rotate --server-id srv_123 --notify-clients",
          description: "Rotate server certificates and update clients"
        }
      ]
    }
  ];

  const monitoringMetrics = [
    {
      metric: "CPU Usage",
      value: "45%",
      status: "normal",
      threshold: "< 80%",
      icon: Cpu
    },
    {
      metric: "Memory Usage", 
      value: "62%",
      status: "normal", 
      threshold: "< 85%",
      icon: HardDrive
    },
    {
      metric: "Network I/O",
      value: "2.3GB/s",
      status: "normal",
      threshold: "< 8GB/s", 
      icon: Network
    },
    {
      metric: "Active Connections",
      value: "156/500",
      status: "normal",
      threshold: "< 450",
      icon: Server
    }
  ];

  return (
    <DocLayout>
      <div className="px-6 py-8">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/docs" className="hover:text-gray-900">Documentation</Link>
          <span>›</span>
          <Link href="/docs/vpn/overview" className="hover:text-gray-900">VPN Service</Link>
          <span>›</span>
          <span className="text-gray-900 font-medium">Server Management</span>
        </div>

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-violet-100 rounded-xl">
              <Server className="h-8 w-8 text-violet-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Server Management</h1>
              <p className="text-lg text-gray-600 mt-2">
                Deploy, configure, and monitor your VPN server infrastructure
              </p>
            </div>
          </div>
        </div>

        {/* Management Overview */}
        <div className="mb-12">
          <Card className="bg-violet-50/50 border-violet-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-violet-600" />
                Server Management Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Comprehensive server management tools for deploying, configuring, monitoring, and maintaining 
                your VPN infrastructure across multiple regions and cloud providers.
              </p>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Deployment</h4>
                  <span className="text-sm text-gray-600">Multi-region, multi-cloud</span>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Monitoring</h4>
                  <span className="text-sm text-gray-600">Real-time metrics & alerts</span>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Scaling</h4>
                  <span className="text-sm text-gray-600">Auto-scaling & load balancing</span>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Backup</h4>
                  <span className="text-sm text-gray-600">Automated backups & recovery</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Server Types */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Server Types & Specifications</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {serverTypes.map((server, index) => (
              <Card 
                key={index}
                className={`relative ${
                  server.color === 'blue' ? 'border-blue-200 bg-blue-50/50' :
                  server.color === 'green' ? 'border-green-200 bg-green-50/50' :
                  'border-purple-200 bg-purple-50/50'
                } ${server.popular ? 'ring-2 ring-green-500' : ''}`}
              >
                {server.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-green-600 text-white">Most Popular</Badge>
                  </div>
                )}
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <h4 className="text-xl font-bold text-gray-900">{server.name}</h4>
                    <div className="text-3xl font-bold text-gray-900 mt-2">
                      {server.price.split('/')[0]}
                      <span className="text-lg font-normal text-gray-600">/{server.price.split('/')[1]}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">CPU:</span>
                      <Badge variant="outline">{server.cpu}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Memory:</span>
                      <Badge variant="outline">{server.memory}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Bandwidth:</span>
                      <Badge variant="outline">{server.bandwidth}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Connections:</span>
                      <Badge variant="outline">{server.connections}</Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-6">
                    {server.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-2">
                        <Check className={`h-4 w-4 ${
                          server.color === 'blue' ? 'text-blue-600' :
                          server.color === 'green' ? 'text-green-600' :
                          'text-purple-600'
                        }`} />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    className={`w-full ${
                      server.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
                      server.color === 'green' ? 'bg-green-600 hover:bg-green-700' :
                      'bg-purple-600 hover:bg-purple-700'
                    }`}
                  >
                    Deploy Server
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Server Monitoring */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Server Monitoring</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {monitoringMetrics.map((metric, index) => (
              <Card key={index} className="bg-gradient-to-br from-white to-gray-50 border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{metric.metric}</p>
                      <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                    </div>
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <metric.icon className="h-6 w-6 text-gray-600" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <Badge 
                      className={`${
                        metric.status === 'normal' ? 'bg-green-100 text-green-800' :
                        metric.status === 'warning' ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}
                    >
                      {metric.status}
                    </Badge>
                    <span className="text-xs text-gray-500">{metric.threshold}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-gray-50/50 border-gray-200">
            <CardHeader>
              <CardTitle>Performance Dashboard</CardTitle>
              <CardDescription>
                Real-time server performance and connection analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Connection Metrics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Active Connections</span>
                      <span className="text-sm font-medium">156</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '31%' }}></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Peak Connections</span>
                      <span className="text-sm font-medium">289</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '58%' }}></div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Bandwidth Usage</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Inbound</span>
                      <span className="text-sm font-medium">1.2 GB/s</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: '24%' }}></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Outbound</span>
                      <span className="text-sm font-medium">1.1 GB/s</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-orange-600 h-2 rounded-full" style={{ width: '22%' }}></div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Health Status</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">System Health: Excellent</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">Network: Stable</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">Load: Moderate</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Management Commands */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Management Commands</h2>
          
          <div className="space-y-8">
            {managementCommands.map((category, index) => (
              <Card key={index} className="bg-white/70 backdrop-blur-sm border-gray-200">
                <CardHeader className="border-b border-gray-200">
                  <CardTitle className="text-lg">{category.category}</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    {category.commands.map((cmd, cmdIndex) => (
                      <div key={cmdIndex}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">{cmd.name}</h4>
                          <Button
                            onClick={() => copyToClipboard(cmd.command, `cmd-${index}-${cmdIndex}`)}
                            size="sm"
                            variant="ghost"
                            className="text-gray-600 hover:text-gray-900"
                          >
                            {copied === `cmd-${index}-${cmdIndex}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{cmd.description}</p>
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                          <code>{cmd.command}</code>
                        </pre>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Auto-Scaling Configuration */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Auto-Scaling & Load Balancing</h2>
          
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Automatic Scaling Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-gray-700">
                Configure automatic scaling policies to handle traffic spikes and optimize costs by scaling down during low usage periods.
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Scaling Triggers</h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-white rounded-lg border">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">CPU Usage</span>
                        <Badge variant="outline">{'> 80%'}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Scale up when CPU exceeds 80% for 5 minutes</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg border">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">Connection Count</span>
                        <Badge variant="outline">{'> 400'}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Scale up when connections exceed 400</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg border">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">Network I/O</span>
                        <Badge variant="outline">{'> 7GB/s'}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Scale up when bandwidth usage is high</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Load Balancing</h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-white rounded-lg border">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">Algorithm</span>
                        <Badge variant="outline">Round Robin</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Distribute connections evenly</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg border">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">Health Checks</span>
                        <Badge variant="outline">Every 30s</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Monitor server health automatically</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg border">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">Failover</span>
                        <Badge variant="outline">{'< 10s'}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Automatic failover to healthy servers</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="relative">
                <Button
                  onClick={() => copyToClipboard(`# Configure auto-scaling policy
vpn-cli autoscale policy create \\
  --name "production-policy" \\
  --min-instances 2 \\
  --max-instances 10 \\
  --cpu-threshold 80 \\
  --scale-up-cooldown 300 \\
  --scale-down-cooldown 600

# Enable load balancing
vpn-cli loadbalancer create \\
  --name "prod-lb" \\
  --algorithm round-robin \\
  --health-check-interval 30 \\
  --failover-timeout 10

# Apply to server group
vpn-cli server group update \\
  --group-id grp_123 \\
  --autoscale-policy production-policy \\
  --load-balancer prod-lb`, 'autoscale-config')}
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                >
                  {copied === 'autoscale-config' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{`# Configure auto-scaling policy
vpn-cli autoscale policy create \\
  --name "production-policy" \\
  --min-instances 2 \\
  --max-instances 10 \\
  --cpu-threshold 80 \\
  --scale-up-cooldown 300 \\
  --scale-down-cooldown 600

# Enable load balancing
vpn-cli loadbalancer create \\
  --name "prod-lb" \\
  --algorithm round-robin \\
  --health-check-interval 30 \\
  --failover-timeout 10

# Apply to server group
vpn-cli server group update \\
  --group-id grp_123 \\
  --autoscale-policy production-policy \\
  --load-balancer prod-lb`}</code>
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Best Practices */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Management Best Practices</h2>
          
          <div className="space-y-4">
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-green-800 mb-1">Regular Backups</h4>
                    <p className="text-green-700 text-sm">
                      Schedule automated daily backups of server configurations, certificates, and user data to ensure quick recovery.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-1">Monitoring & Alerts</h4>
                    <p className="text-blue-700 text-sm">
                      Set up comprehensive monitoring with alerts for CPU, memory, network, and connection thresholds to prevent issues.
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
                    <h4 className="font-semibold text-amber-800 mb-1">Capacity Planning</h4>
                    <p className="text-amber-700 text-sm">
                      Monitor usage trends and plan capacity upgrades before reaching limits to maintain optimal performance.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl p-8 border border-violet-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Next Steps</h2>
          <p className="text-gray-600 mb-6">
            With your servers properly managed, explore advanced security protocols and troubleshooting techniques.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/docs/vpn/security">
              <Button className="bg-violet-600 hover:bg-violet-700">
                Security Protocols
              </Button>
            </Link>
            <Link href="/docs/vpn/troubleshooting">
              <Button variant="outline" className="border-violet-300 text-violet-600 hover:bg-violet-50">
                Troubleshooting Guide
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </DocLayout>
  );
}