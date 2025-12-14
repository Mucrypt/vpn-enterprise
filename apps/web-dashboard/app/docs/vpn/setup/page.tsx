"use client";

import { useState } from 'react';
import { 
  Play, Server, Globe, Download, Copy, Check, Shield, 
  Smartphone, Monitor, Tablet, Settings, Info, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DocLayout from '@/components/docs/DocLayout';
import Link from 'next/link';

export default function VPNSetupPage() {
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

  const setupSteps = [
    {
      step: 1,
      title: "Create VPN Server",
      description: "Deploy a VPN server in your preferred region",
      command: "vpn-cli server create --region us-east-1 --protocol wireguard",
      time: "3-5 minutes"
    },
    {
      step: 2,
      title: "Generate Client Config",
      description: "Create configuration files for your devices",
      command: "vpn-cli client generate --server-id srv_123 --name 'John-MacBook'",
      time: "< 1 minute"
    },
    {
      step: 3,
      title: "Download & Install",
      description: "Install the VPN client and import configuration",
      command: "vpn-cli client download --config-id cfg_456 --format openvpn",
      time: "2-3 minutes"
    },
    {
      step: 4,
      title: "Test Connection",
      description: "Verify your VPN connection is working properly",
      command: "vpn-cli connection test --config-id cfg_456",
      time: "< 1 minute"
    }
  ];

  const serverRegions = [
    {
      region: "North America",
      locations: ["New York", "Los Angeles", "Toronto", "Chicago"],
      latency: "15-25ms",
      color: "blue"
    },
    {
      region: "Europe",
      locations: ["London", "Amsterdam", "Frankfurt", "Paris"],
      latency: "20-30ms",
      color: "green"
    },
    {
      region: "Asia Pacific",
      locations: ["Tokyo", "Singapore", "Sydney", "Hong Kong"],
      latency: "25-35ms",
      color: "purple"
    },
    {
      region: "South America",
      locations: ["São Paulo", "Buenos Aires", "Santiago"],
      latency: "35-45ms",
      color: "orange"
    }
  ];

  const deviceTypes = [
    {
      name: "Desktop",
      icon: Monitor,
      platforms: ["Windows", "macOS", "Linux"],
      methods: ["Native App", "OpenVPN", "WireGuard"]
    },
    {
      name: "Mobile",
      icon: Smartphone,
      platforms: ["iOS", "Android"],
      methods: ["Native App", "Manual Config"]
    },
    {
      name: "Tablet",
      icon: Tablet,
      platforms: ["iPad", "Android Tablet"],
      methods: ["Native App", "Profile Install"]
    },
    {
      name: "Router",
      icon: Server,
      platforms: ["DD-WRT", "OpenWrt", "ASUS"],
      methods: ["Firmware Config", "Manual Setup"]
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
          <span className="text-gray-900 font-medium">Connection Setup</span>
        </div>

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <Play className="h-8 w-8 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Connection Setup</h1>
              <p className="text-lg text-gray-600 mt-2">
                Step-by-step guide to set up your VPN connection
              </p>
            </div>
          </div>
        </div>

        {/* Setup Overview */}
        <div className="mb-12">
          <Card className="bg-emerald-50/50 border-emerald-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-emerald-600" />
                Setup Process Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Setting up your VPN connection involves deploying a server, generating client configurations, 
                and connecting your devices. The entire process takes less than 15 minutes.
              </p>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">1. Server</h4>
                  <span className="text-sm text-gray-600">Deploy in your region</span>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">2. Config</h4>
                  <span className="text-sm text-gray-600">Generate client files</span>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">3. Install</h4>
                  <span className="text-sm text-gray-600">Download & configure</span>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">4. Connect</h4>
                  <span className="text-sm text-gray-600">Test & verify</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Step-by-Step Setup */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Step-by-Step Setup</h2>
          
          <div className="space-y-8">
            {setupSteps.map((step, index) => (
              <Card key={index} className="bg-white/70 backdrop-blur-sm border-gray-200">
                <CardHeader className="border-b border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">{step.step}</span>
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl">{step.title}</CardTitle>
                      <CardDescription className="flex items-center gap-3 mt-1">
                        {step.description}
                        <Badge variant="outline">{step.time}</Badge>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-6">
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Command</h4>
                    <div className="relative">
                      <Button
                        onClick={() => copyToClipboard(step.command, `command-${index}`)}
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                      >
                        {copied === `command-${index}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                        <code>{step.command}</code>
                      </pre>
                    </div>
                  </div>
                  
                  {/* Step-specific additional info */}
                  {index === 0 && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h5 className="font-semibold text-blue-800 mb-1">Available Protocols</h5>
                          <p className="text-blue-700 text-sm">
                            Choose from WireGuard (fastest), OpenVPN (most compatible), or IKEv2 (mobile optimized).
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {index === 1 && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-start gap-3">
                        <Shield className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h5 className="font-semibold text-green-800 mb-1">Security Keys</h5>
                          <p className="text-green-700 text-sm">
                            Each client configuration includes unique security keys and certificates for maximum security.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Server Regions */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Server Regions</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {serverRegions.map((region, index) => (
              <Card 
                key={index}
                className={`${
                  region.color === 'blue' ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200' :
                  region.color === 'green' ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' :
                  region.color === 'purple' ? 'bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200' :
                  'bg-gradient-to-br from-orange-50 to-red-50 border-orange-200'
                }`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{region.region}</CardTitle>
                    <Badge className={`${
                      region.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                      region.color === 'green' ? 'bg-green-100 text-green-800' :
                      region.color === 'purple' ? 'bg-purple-100 text-purple-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {region.latency}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {region.locations.map((location, locationIndex) => (
                      <Badge 
                        key={locationIndex}
                        variant="outline"
                        className="text-xs"
                      >
                        {location}
                      </Badge>
                    ))}
                  </div>
                  <Button 
                    className={`w-full mt-4 ${
                      region.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' :
                      region.color === 'green' ? 'bg-green-600 hover:bg-green-700' :
                      region.color === 'purple' ? 'bg-purple-600 hover:bg-purple-700' :
                      'bg-orange-600 hover:bg-orange-700'
                    }`}
                    size="sm"
                  >
                    Deploy Server
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Device Setup */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Device Setup Guide</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {deviceTypes.map((device, index) => (
              <Card key={index} className="bg-white border-gray-200">
                <CardHeader className="text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg mx-auto flex items-center justify-center mb-3">
                    <device.icon className="h-6 w-6 text-gray-600" />
                  </div>
                  <CardTitle className="text-lg">{device.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-2">Platforms</h5>
                      <div className="flex flex-wrap gap-1">
                        {device.platforms.map((platform, platformIndex) => (
                          <Badge 
                            key={platformIndex}
                            variant="outline"
                            className="text-xs"
                          >
                            {platform}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-2">Setup Methods</h5>
                      <div className="space-y-1">
                        {device.methods.map((method, methodIndex) => (
                          <div key={methodIndex} className="text-sm text-gray-600">
                            • {method}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                    size="sm"
                  >
                    Setup Guide
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Setup Commands */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Setup Commands</h2>
          
          <Tabs defaultValue="cli" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="cli">CLI Commands</TabsTrigger>
              <TabsTrigger value="api">API Requests</TabsTrigger>
              <TabsTrigger value="terraform">Terraform</TabsTrigger>
            </TabsList>
            
            <TabsContent value="cli" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>VPN CLI Commands</CardTitle>
                  <CardDescription>
                    One-liner commands to get started quickly
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Complete Setup</h4>
                      <div className="relative">
                        <Button
                          onClick={() => copyToClipboard(`# Install VPN CLI
curl -sSL https://install.vpnenterprise.com/cli | bash

# Quick server setup
vpn-cli server create --region auto --protocol wireguard --name "my-server"

# Generate and download client config
vpn-cli client generate --server auto --download --name "$(whoami)-$(hostname)"

# Test connection
vpn-cli connection test`, 'cli-complete')}
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                        >
                          {copied === 'cli-complete' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                          <code>{`# Install VPN CLI
curl -sSL https://install.vpnenterprise.com/cli | bash

# Quick server setup
vpn-cli server create --region auto --protocol wireguard --name "my-server"

# Generate and download client config
vpn-cli client generate --server auto --download --name "$(whoami)-$(hostname)"

# Test connection
vpn-cli connection test`}</code>
                        </pre>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="api" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>REST API Calls</CardTitle>
                  <CardDescription>
                    Direct API integration for custom applications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Server Creation</h4>
                      <div className="relative">
                        <Button
                          onClick={() => copyToClipboard(`curl -X POST https://api.vpnenterprise.com/servers \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "region": "us-east-1",
    "protocol": "wireguard",
    "name": "production-server",
    "instance_type": "standard"
  }'`, 'api-server')}
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                        >
                          {copied === 'api-server' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                          <code>{`curl -X POST https://api.vpnenterprise.com/servers \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "region": "us-east-1",
    "protocol": "wireguard",
    "name": "production-server",
    "instance_type": "standard"
  }'`}</code>
                        </pre>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="terraform" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Terraform Configuration</CardTitle>
                  <CardDescription>
                    Infrastructure as Code for VPN deployment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">VPN Server Resource</h4>
                      <div className="relative">
                        <Button
                          onClick={() => copyToClipboard(`resource "vpnenterprise_server" "main" {
  name     = "production-vpn"
  region   = "us-east-1"
  protocol = "wireguard"
  
  instance_config {
    type = "standard"
    auto_scaling = true
  }
  
  security_config {
    allowed_protocols = ["tcp", "udp"]
    firewall_rules = [
      {
        port = "51820"
        protocol = "udp"
        source = "0.0.0.0/0"
      }
    ]
  }
}

resource "vpnenterprise_client_config" "team" {
  server_id = vpnenterprise_server.main.id
  name      = "team-config"
  
  dns_servers = ["1.1.1.1", "8.8.8.8"]
}`, 'terraform-config')}
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                        >
                          {copied === 'terraform-config' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                          <code>{`resource "vpnenterprise_server" "main" {
  name     = "production-vpn"
  region   = "us-east-1"
  protocol = "wireguard"
  
  instance_config {
    type = "standard"
    auto_scaling = true
  }
  
  security_config {
    allowed_protocols = ["tcp", "udp"]
    firewall_rules = [
      {
        port = "51820"
        protocol = "udp"
        source = "0.0.0.0/0"
      }
    ]
  }
}

resource "vpnenterprise_client_config" "team" {
  server_id = vpnenterprise_server.main.id
  name      = "team-config"
  
  dns_servers = ["1.1.1.1", "8.8.8.8"]
}`}</code>
                        </pre>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Troubleshooting Tips */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Common Setup Issues</h2>
          
          <div className="space-y-4">
            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-amber-800 mb-1">Connection Timeout</h4>
                    <p className="text-amber-700 text-sm mb-2">
                      If server deployment times out, try a different region or check your account limits.
                    </p>
                    <code className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
                      vpn-cli server list --status failed
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-red-800 mb-1">Authentication Failed</h4>
                    <p className="text-red-700 text-sm mb-2">
                      Verify your API key is correct and has the necessary permissions for VPN management.
                    </p>
                    <code className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                      vpn-cli auth verify
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-1">Port Blocking</h4>
                    <p className="text-blue-700 text-sm mb-2">
                      Some networks block VPN ports. Try different protocols or use port 443 (HTTPS) for better compatibility.
                    </p>
                    <code className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      vpn-cli server create --port 443 --protocol openvpn
                    </code>
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
            Once your VPN connection is established, explore client configuration options and advanced security features.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/docs/vpn/client-config">
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                Client Configuration
              </Button>
            </Link>
            <Link href="/docs/vpn/server-management">
              <Button variant="outline" className="border-emerald-300 text-emerald-600 hover:bg-emerald-50">
                Server Management
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </DocLayout>
  );
}