"use client";

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  BarChart3, 
  AlertTriangle, 
  CheckCircle,
  ArrowRight,
  TrendingUp,
  Bell,
  Eye,
  Zap,
  Settings,
  Database
} from 'lucide-react';
import Link from 'next/link';
import DocLayout from '@/components/docs/DocLayout';

export default function MonitoringToolsPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);
  const metricsRef = useRef<HTMLDivElement>(null);

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

      // Tools animation
      gsap.from(toolsRef.current?.children || [], {
        duration: 0.8,
        scale: 0.9,
        opacity: 0,
        stagger: 0.1,
        ease: "back.out(1.7)",
        delay: 0.3
      });

      // Metrics animation
      gsap.from(metricsRef.current?.children || [], {
        duration: 0.6,
        y: 30,
        opacity: 0,
        stagger: 0.1,
        ease: "power2.out",
        delay: 0.6
      });
    });

    return () => ctx.revert();
  }, []);

  const monitoringTools = [
    {
      name: "Prometheus",
      description: "Open-source monitoring and alerting toolkit",
      logo: "📊",
      type: "Metrics Collection",
      features: ["Time-series data", "PromQL", "Service discovery", "Alertmanager"],
      supported: true,
      setupTime: "20 min",
      color: "from-orange-500 to-red-500"
    },
    {
      name: "Grafana",
      description: "Multi-platform analytics and monitoring solution",
      logo: "📈",
      type: "Visualization",
      features: ["Custom dashboards", "Alerting", "Data sources", "Plugins"],
      supported: true,
      setupTime: "15 min",
      color: "from-blue-500 to-indigo-500"
    },
    {
      name: "DataDog",
      description: "Cloud monitoring and analytics platform",
      logo: "🐕",
      type: "APM & Infrastructure",
      features: ["Real-time metrics", "Log management", "APM", "Synthetics"],
      supported: true,
      setupTime: "10 min",
      color: "from-purple-500 to-pink-500"
    },
    {
      name: "New Relic",
      description: "Full-stack observability platform",
      logo: "🔍",
      type: "APM & Insights",
      features: ["Application monitoring", "Infrastructure", "Browser", "Mobile"],
      supported: true,
      setupTime: "12 min",
      color: "from-green-500 to-teal-500"
    },
    {
      name: "Splunk",
      description: "Data platform for security and observability",
      logo: "🌊",
      type: "Log Analytics",
      features: ["Log search", "Machine learning", "SIEM", "IT Operations"],
      supported: true,
      setupTime: "25 min",
      color: "from-cyan-500 to-blue-500"
    },
    {
      name: "Elastic Stack",
      description: "Search and analytics engine with Kibana",
      logo: "🔍",
      type: "Search & Analytics",
      features: ["Elasticsearch", "Logstash", "Kibana", "Beats"],
      supported: true,
      setupTime: "30 min",
      color: "from-yellow-500 to-orange-500"
    }
  ];

  const availableMetrics = [
    {
      category: "Connection Metrics",
      icon: Activity,
      metrics: [
        "Active connections count",
        "Connection success/failure rates",
        "Connection duration",
        "Bandwidth usage per connection",
        "Geographic distribution of connections"
      ]
    },
    {
      category: "Performance Metrics",
      icon: TrendingUp,
      metrics: [
        "Response time and latency",
        "Throughput (bytes/second)",
        "CPU and memory utilization",
        "Network I/O statistics",
        "SSL handshake time"
      ]
    },
    {
      category: "Security Metrics",
      icon: AlertTriangle,
      metrics: [
        "Authentication attempts",
        "Failed login attempts",
        "Blocked connections",
        "Certificate expiration warnings",
        "Security policy violations"
      ]
    },
    {
      category: "System Health",
      icon: CheckCircle,
      metrics: [
        "Service uptime/downtime",
        "Health check results",
        "Error rates and types",
        "Database connection health",
        "Service dependencies status"
      ]
    }
  ];

  const integrationSteps = [
    {
      step: 1,
      title: "Enable Metrics Export",
      description: "Configure VPN Enterprise to export metrics to your monitoring tool",
      code: `# Enable Prometheus metrics endpoint
monitoring:
  prometheus:
    enabled: true
    port: 9090
    path: /metrics`
    },
    {
      step: 2,
      title: "Configure Monitoring Tool",
      description: "Set up your monitoring tool to scrape metrics from VPN Enterprise",
      code: `# Prometheus scrape configuration
scrape_configs:
  - job_name: 'vpn-enterprise'
    static_configs:
      - targets: ['vpn.company.com:9090']`
    },
    {
      step: 3,
      title: "Create Dashboards",
      description: "Build custom dashboards to visualize your VPN metrics",
      code: `# Grafana dashboard JSON
{
  "title": "VPN Enterprise Dashboard",
  "panels": [
    {
      "title": "Active Connections",
      "targets": [{"expr": "vpn_active_connections"}]
    }
  ]
}`
    }
  ];

  return (
    <DocLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/20 to-red-50/30">
        <div className="container mx-auto px-6 py-12">
          {/* Hero Section */}
          <div ref={heroRef} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-orange-100 dark:bg-orange-900/30 px-4 py-2 rounded-full mb-6">
              <Activity className="h-5 w-5 text-orange-600" />
              <span className="text-orange-700 dark:text-orange-300 font-medium">Monitoring Integration</span>
            </div>
            
            <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-orange-800 to-red-800 bg-clip-text text-transparent mb-6">
              Monitoring Tools
            </h1>
            
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Integrate VPN Enterprise with your existing monitoring and observability stack. 
              Get comprehensive insights into performance, security, and user behavior with real-time metrics and alerts.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-orange-600 to-red-600">
                Setup Monitoring
              </Button>
              <Button size="lg" variant="outline">
                View Metrics Documentation
              </Button>
            </div>
          </div>

          {/* Supported Tools */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Supported Monitoring Tools</h2>
            <div ref={toolsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {monitoringTools.map((tool, index) => (
                <Card 
                  key={index}
                  className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm overflow-hidden"
                >
                  <CardHeader className="relative">
                    <div className={`absolute inset-0 bg-gradient-to-r ${tool.color} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
                    <div className="relative flex items-center gap-4">
                      <div className="text-3xl">{tool.logo}</div>
                      <div>
                        <CardTitle className="text-lg">{tool.name}</CardTitle>
                        <CardDescription>{tool.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {tool.type}
                      </Badge>
                      <Badge variant="outline">
                        <Zap className="h-3 w-3 mr-1" />
                        {tool.setupTime}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="mb-4">
                      <h4 className="font-semibold mb-2 text-gray-700">Key Features:</h4>
                      <div className="space-y-1">
                        {tool.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span className="text-xs text-gray-600">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button className="w-full" variant="outline">
                      Integration Guide
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Available Metrics */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Available Metrics</h2>
            <div ref={metricsRef} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {availableMetrics.map((category, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                        <category.icon className="h-5 w-5 text-white" />
                      </div>
                      <CardTitle className="text-lg">{category.category}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {category.metrics.map((metric, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <BarChart3 className="h-4 w-4 text-orange-600 mt-0.5" />
                          <span className="text-sm text-gray-700">{metric}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Integration Guide */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Integration Setup</h2>
            <div className="space-y-8">
              {integrationSteps.map((step, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-6">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                          {step.step}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                        <p className="text-gray-600 mb-4">{step.description}</p>
                        <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                          <pre className="text-green-400 text-sm">
                            <code>{step.code}</code>
                          </pre>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Dashboard Examples */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Dashboard Templates</h2>
            <Tabs defaultValue="prometheus" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="prometheus">Prometheus</TabsTrigger>
                <TabsTrigger value="grafana">Grafana</TabsTrigger>
                <TabsTrigger value="datadog">DataDog</TabsTrigger>
                <TabsTrigger value="newrelic">New Relic</TabsTrigger>
              </TabsList>
              
              <TabsContent value="prometheus">
                <Card>
                  <CardHeader>
                    <CardTitle>Prometheus Configuration</CardTitle>
                    <CardDescription>
                      Complete Prometheus setup for VPN Enterprise monitoring
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Key Metrics Queries:</h4>
                        <div className="bg-gray-900 rounded-lg p-4 space-y-2">
                          <div className="text-green-400 text-sm">
                            <div className="text-gray-300"># Active VPN connections</div>
                            <div>vpn_active_connections_total</div>
                          </div>
                          <div className="text-green-400 text-sm">
                            <div className="text-gray-300"># Connection success rate</div>
                            <div>rate(vpn_connections_successful_total[5m]) / rate(vpn_connections_total[5m]) * 100</div>
                          </div>
                          <div className="text-green-400 text-sm">
                            <div className="text-gray-300"># Bandwidth utilization</div>
                            <div>rate(vpn_bytes_transferred_total[5m])</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="grafana">
                <Card>
                  <CardHeader>
                    <CardTitle>Grafana Dashboard</CardTitle>
                    <CardDescription>
                      Pre-built Grafana dashboard for VPN Enterprise metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">Dashboard Panels:</h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-blue-600" />
                            Active Connections Over Time
                          </li>
                          <li className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                            Bandwidth Usage Trends
                          </li>
                          <li className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-blue-600" />
                            Error Rate and Alerts
                          </li>
                          <li className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-blue-600" />
                            Geographic Connection Map
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-3">Alert Conditions:</h4>
                        <ul className="space-y-2 text-sm">
                          <li>• Connection success rate below 95%</li>
                          <li>• High CPU usage above 80%</li>
                          <li>• Memory usage above 90%</li>
                          <li>• Certificate expiration warnings</li>
                        </ul>
                      </div>
                    </div>
                    <div className="mt-6">
                      <Button className="w-full">
                        Download Dashboard Template
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="datadog">
                <Card>
                  <CardHeader>
                    <CardTitle>DataDog Integration</CardTitle>
                    <CardDescription>
                      Monitor VPN Enterprise with DataDog's comprehensive platform
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold mb-3">Agent Configuration:</h4>
                          <div className="bg-gray-900 rounded-lg p-4">
                            <pre className="text-green-400 text-sm">
{`init_config:
instances:
  - prometheus_url: http://vpn:9090/metrics
    namespace: vpn_enterprise
    metrics:
      - vpn_*`}
                            </pre>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-3">Custom Metrics:</h4>
                          <ul className="space-y-2 text-sm">
                            <li>• vpn.connections.active</li>
                            <li>• vpn.bandwidth.utilization</li>
                            <li>• vpn.authentication.success_rate</li>
                            <li>• vpn.system.cpu_usage</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="newrelic">
                <Card>
                  <CardHeader>
                    <CardTitle>New Relic Monitoring</CardTitle>
                    <CardDescription>
                      Full-stack observability for VPN Enterprise with New Relic
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">Infrastructure Agent:</h4>
                        <div className="bg-gray-900 rounded-lg p-4">
                          <pre className="text-green-400 text-sm">
{`integrations:
  - name: nri-prometheus
    config:
      urls:
        - http://localhost:9090/metrics
      cluster_name: vpn-enterprise`}
                          </pre>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-3">Available Insights:</h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-center gap-2">
                            <Database className="h-4 w-4 text-green-600" />
                            Application Performance Monitoring
                          </li>
                          <li className="flex items-center gap-2">
                            <Settings className="h-4 w-4 text-green-600" />
                            Infrastructure Monitoring
                          </li>
                          <li className="flex items-center gap-2">
                            <Bell className="h-4 w-4 text-green-600" />
                            Custom Alert Policies
                          </li>
                          <li className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            Synthetic Monitoring
                          </li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Call to Action */}
          <Card className="bg-gradient-to-r from-orange-500 to-red-600 text-white">
            <CardContent className="p-8 text-center">
              <Activity className="h-16 w-16 mx-auto mb-6 opacity-90" />
              <h2 className="text-3xl font-bold mb-4">Start Monitoring Today</h2>
              <p className="text-lg opacity-90 mb-6 max-w-2xl mx-auto">
                Get complete visibility into your VPN infrastructure with our comprehensive 
                monitoring integrations. Setup takes just minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary">
                  Setup Monitoring Integration
                </Button>
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-orange-600">
                  Download Monitoring Guide
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DocLayout>
  );
}