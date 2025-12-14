"use client";

import { useState } from 'react';
import { 
  Shield, Server, Globe, Lock, Zap, Users, Copy, Check, 
  Network, Cpu, BarChart3, Settings, AlertCircle, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DocLayout from '@/components/docs/DocLayout';
import Link from 'next/link';

export default function VPNOverviewPage() {
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

  const vpnFeatures = [
    {
      title: "Global Server Network",
      description: "200+ servers across 50+ countries for optimal performance",
      icon: Globe,
      color: "blue",
      stats: ["200+ Servers", "50+ Countries", "99.9% Uptime"]
    },
    {
      title: "Enterprise Security",
      description: "Military-grade encryption with advanced security protocols",
      icon: Lock,
      color: "green", 
      stats: ["AES-256 Encryption", "Zero-logs Policy", "Kill Switch"]
    },
    {
      title: "High Performance",
      description: "Optimized infrastructure for maximum speed and reliability",
      icon: Zap,
      color: "purple",
      stats: ["10Gbps Bandwidth", "< 50ms Latency", "Auto-scaling"]
    },
    {
      title: "Team Management",
      description: "Centralized control for enterprise team deployments",
      icon: Users,
      color: "orange",
      stats: ["User Management", "Access Control", "Usage Analytics"]
    }
  ];

  const protocolComparison = [
    {
      protocol: "WireGuard",
      performance: 95,
      security: 90,
      compatibility: 80,
      description: "Modern, fast, and secure protocol with minimal overhead"
    },
    {
      protocol: "OpenVPN",
      performance: 75,
      security: 95,
      compatibility: 95,
      description: "Industry standard with excellent security and broad compatibility"
    },
    {
      protocol: "IKEv2/IPSec",
      performance: 85,
      security: 90,
      compatibility: 85,
      description: "Fast reconnection and excellent mobile device support"
    }
  ];

  const quickStartSteps = [
    {
      step: 1,
      title: "Create Organization",
      description: "Set up your VPN Enterprise organization and invite team members",
      code: "curl -X POST https://api.vpnenterprise.com/organizations",
      time: "2 minutes"
    },
    {
      step: 2,
      title: "Deploy Servers",
      description: "Launch VPN servers in your preferred regions worldwide",
      code: "vpn-cli server create --region us-east-1 --type enterprise",
      time: "5 minutes"
    },
    {
      step: 3,
      title: "Configure Clients",
      description: "Download and configure VPN clients for your devices and team",
      code: "vpn-cli client generate --user john@company.com",
      time: "3 minutes"
    }
  ];

  return (
    <DocLayout>
      <div className="px-6 py-8">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/docs" className="hover:text-gray-900">Documentation</Link>
          <span>›</span>
          <span className="text-gray-900 font-medium">VPN Service</span>
          <span>›</span>
          <span className="text-gray-900 font-medium">Overview</span>
        </div>

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">VPN Service Overview</h1>
              <p className="text-lg text-gray-600 mt-2">
                Enterprise-grade VPN infrastructure with global reach and maximum security
              </p>
            </div>
          </div>
        </div>

        {/* Service Overview */}
        <div className="mb-12">
          <Card className="bg-blue-50/50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Network className="h-5 w-5 text-blue-600" />
                VPN Enterprise Service
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                VPN Enterprise provides a comprehensive virtual private network solution designed for businesses, 
                teams, and organizations requiring secure, fast, and reliable internet connectivity worldwide.
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Global Infrastructure</h4>
                  <span className="text-sm text-gray-600">200+ servers in 50+ countries</span>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Enterprise Security</h4>
                  <span className="text-sm text-gray-600">AES-256 encryption, zero-logs</span>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Team Management</h4>
                  <span className="text-sm text-gray-600">Centralized control & analytics</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Key Features */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Features</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {vpnFeatures.map((feature, index) => (
              <Card 
                key={index} 
                className={`${
                  feature.color === 'blue' ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200' :
                  feature.color === 'green' ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' :
                  feature.color === 'purple' ? 'bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200' :
                  'bg-gradient-to-br from-orange-50 to-red-50 border-orange-200'
                }`}
              >
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${
                      feature.color === 'blue' ? 'bg-blue-100' :
                      feature.color === 'green' ? 'bg-green-100' :
                      feature.color === 'purple' ? 'bg-purple-100' :
                      'bg-orange-100'
                    }`}>
                      <feature.icon className={`h-6 w-6 ${
                        feature.color === 'blue' ? 'text-blue-600' :
                        feature.color === 'green' ? 'text-green-600' :
                        feature.color === 'purple' ? 'text-purple-600' :
                        'text-orange-600'
                      }`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                      <CardDescription>{feature.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 flex-wrap">
                    {feature.stats.map((stat, statIndex) => (
                      <Badge 
                        key={statIndex}
                        className={`${
                          feature.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                          feature.color === 'green' ? 'bg-green-100 text-green-800' :
                          feature.color === 'purple' ? 'bg-purple-100 text-purple-800' :
                          'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {stat}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Protocol Comparison */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">VPN Protocols</h2>
          
          <Card className="bg-gray-50/50 border-gray-200">
            <CardHeader>
              <CardTitle>Protocol Performance Comparison</CardTitle>
              <CardDescription>
                Choose the right VPN protocol for your use case
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {protocolComparison.map((protocol, index) => (
                  <div key={index} className="p-4 bg-white rounded-lg border">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">{protocol.protocol}</h4>
                      <Badge variant="outline">Supported</Badge>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4">{protocol.description}</p>
                    
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-600">Performance</span>
                          <span className="text-sm font-semibold text-gray-900">{protocol.performance}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                            style={{ width: `${protocol.performance}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-600">Security</span>
                          <span className="text-sm font-semibold text-gray-900">{protocol.security}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full transition-all duration-500" 
                            style={{ width: `${protocol.security}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-600">Compatibility</span>
                          <span className="text-sm font-semibold text-gray-900">{protocol.compatibility}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full transition-all duration-500" 
                            style={{ width: `${protocol.compatibility}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Start */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Start Guide</h2>
          
          <div className="space-y-6">
            {quickStartSteps.map((step, index) => (
              <Card key={index} className="bg-white/70 backdrop-blur-sm border-gray-200">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">{step.step}</span>
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{step.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        {step.description}
                        <Badge variant="outline" className="ml-2">{step.time}</Badge>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Button
                      onClick={() => copyToClipboard(step.code, `step-${index}`)}
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                    >
                      {copied === `step-${index}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{step.code}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Service Status */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Service Status & Metrics</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Service Uptime</p>
                    <p className="text-2xl font-bold text-gray-900">99.9%</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <p className="text-xs text-green-700 mt-2">Last 30 days</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Avg Latency</p>
                    <p className="text-2xl font-bold text-gray-900">42ms</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Zap className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-xs text-blue-700 mt-2">Global average</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Active Servers</p>
                    <p className="text-2xl font-bold text-gray-900">247</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Server className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <p className="text-xs text-purple-700 mt-2">Across 52 countries</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Bandwidth</p>
                    <p className="text-2xl font-bold text-gray-900">10Gb/s</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Network className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <p className="text-xs text-orange-700 mt-2">Per server capacity</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Security Highlights */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Security Features</h2>
          
          <div className="space-y-4">
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-green-800 mb-1">Military-Grade Encryption</h4>
                    <p className="text-green-700 text-sm">
                      AES-256 encryption with perfect forward secrecy ensures your data remains secure even if keys are compromised.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Lock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-1">Zero-Logs Policy</h4>
                    <p className="text-blue-700 text-sm">
                      We don't store any logs of your online activity, ensuring complete privacy and anonymity.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Cpu className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-purple-800 mb-1">Advanced Kill Switch</h4>
                    <p className="text-purple-700 text-sm">
                      Automatic internet blocking when VPN connection drops, preventing data leaks and ensuring continuous protection.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Explore VPN Service</h2>
          <p className="text-gray-600 mb-6">
            Get started with VPN Enterprise by setting up your first connection or exploring advanced features.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <Link href="/docs/vpn/setup">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Connection Setup
              </Button>
            </Link>
            <Link href="/docs/vpn/client-config">
              <Button variant="outline" className="w-full border-blue-300 text-blue-600 hover:bg-blue-50">
                Client Configuration
              </Button>
            </Link>
            <Link href="/docs/vpn/security">
              <Button variant="outline" className="w-full border-blue-300 text-blue-600 hover:bg-blue-50">
                Security Protocols
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </DocLayout>
  );
}