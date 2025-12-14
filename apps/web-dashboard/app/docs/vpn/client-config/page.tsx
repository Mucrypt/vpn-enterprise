"use client";

import { useState } from 'react';
import { 
  Settings, Download, Smartphone, Monitor, Tablet, Router,
  Copy, Check, Shield, Key, Wifi, Globe, AlertCircle, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DocLayout from '@/components/docs/DocLayout';
import Link from 'next/link';

export default function ClientConfigPage() {
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

  const platformConfigs = [
    {
      platform: "Windows",
      icon: Monitor,
      color: "blue",
      methods: [
        {
          name: "Native App",
          difficulty: "Easy",
          steps: ["Download VPN Enterprise app", "Import .ovpn file", "Connect"]
        },
        {
          name: "OpenVPN GUI",
          difficulty: "Medium", 
          steps: ["Install OpenVPN GUI", "Import config file", "Configure auto-connect"]
        }
      ],
      config: `# Windows OpenVPN Configuration
client
dev tun
proto udp
remote vpn.example.com 1194
resolv-retry infinite
nobind
persist-key
persist-tun
ca ca.crt
cert client.crt
key client.key
cipher AES-256-CBC
auth SHA256
verb 3`
    },
    {
      platform: "macOS",
      icon: Monitor,
      color: "green",
      methods: [
        {
          name: "Native App",
          difficulty: "Easy",
          steps: ["Download from Mac App Store", "Import configuration", "Connect"]
        },
        {
          name: "Tunnelblick",
          difficulty: "Medium",
          steps: ["Install Tunnelblick", "Import .ovpn file", "Configure preferences"]
        }
      ],
      config: `# macOS OpenVPN Configuration  
client
dev tun
proto udp
remote vpn.example.com 1194
resolv-retry infinite
nobind
persist-key
persist-tun
ca ca.crt
cert client.crt
key client.key
cipher AES-256-CBC
auth SHA256
script-security 2
up /etc/openvpn/update-resolv-conf
down /etc/openvpn/update-resolv-conf`
    },
    {
      platform: "iOS",
      icon: Smartphone,
      color: "purple",
      methods: [
        {
          name: "Native App",
          difficulty: "Easy",
          steps: ["Download from App Store", "Scan QR code or import", "Enable VPN"]
        },
        {
          name: "OpenVPN Connect",
          difficulty: "Easy",
          steps: ["Install OpenVPN Connect", "Import .ovpn profile", "Connect"]
        }
      ],
      config: `# iOS WireGuard Configuration
[Interface]
PrivateKey = YOUR_PRIVATE_KEY
Address = 10.8.0.2/24
DNS = 1.1.1.1, 8.8.8.8

[Peer]
PublicKey = SERVER_PUBLIC_KEY
Endpoint = vpn.example.com:51820
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25`
    },
    {
      platform: "Android",
      icon: Smartphone,
      color: "orange",
      methods: [
        {
          name: "Native App",
          difficulty: "Easy",
          steps: ["Download from Play Store", "Import configuration", "Connect"]
        },
        {
          name: "WireGuard App",
          difficulty: "Easy",
          steps: ["Install WireGuard app", "Scan QR code", "Activate tunnel"]
        }
      ],
      config: `# Android WireGuard Configuration
[Interface]
PrivateKey = YOUR_PRIVATE_KEY
Address = 10.8.0.3/24
DNS = 1.1.1.1

[Peer]
PublicKey = SERVER_PUBLIC_KEY
Endpoint = vpn.example.com:51820
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25`
    }
  ];

  const advancedSettings = [
    {
      title: "DNS Configuration",
      description: "Custom DNS servers for enhanced privacy and speed",
      settings: [
        { name: "Primary DNS", value: "1.1.1.1", description: "Cloudflare DNS" },
        { name: "Secondary DNS", value: "8.8.8.8", description: "Google DNS" },
        { name: "DNS over HTTPS", value: "Enabled", description: "Encrypted DNS queries" }
      ]
    },
    {
      title: "Kill Switch",
      description: "Block internet if VPN connection drops",
      settings: [
        { name: "Enable Kill Switch", value: "True", description: "Prevent data leaks" },
        { name: "Leak Protection", value: "IPv4 + IPv6", description: "Comprehensive blocking" },
        { name: "Auto-Reconnect", value: "Enabled", description: "Automatic reconnection" }
      ]
    },
    {
      title: "Split Tunneling", 
      description: "Route specific apps through VPN or direct connection",
      settings: [
        { name: "Mode", value: "App-based", description: "Per-application routing" },
        { name: "VPN Apps", value: "Browser, Email", description: "Apps using VPN" },
        { name: "Direct Apps", value: "Gaming, Local", description: "Apps bypassing VPN" }
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
          <Link href="/docs/vpn/overview" className="hover:text-gray-900">VPN Service</Link>
          <span>›</span>
          <span className="text-gray-900 font-medium">Client Configuration</span>
        </div>

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <Settings className="h-8 w-8 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Client Configuration</h1>
              <p className="text-lg text-gray-600 mt-2">
                Configure VPN clients across all your devices and platforms
              </p>
            </div>
          </div>
        </div>

        {/* Configuration Overview */}
        <div className="mb-12">
          <Card className="bg-indigo-50/50 border-indigo-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Wifi className="h-5 w-5 text-indigo-600" />
                Client Configuration Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                VPN Enterprise supports all major platforms with native apps and manual configuration options. 
                Each client can be customized with advanced security features and performance optimizations.
              </p>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Native Apps</h4>
                  <span className="text-sm text-gray-600">iOS, Android, Windows, macOS</span>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Protocols</h4>
                  <span className="text-sm text-gray-600">WireGuard, OpenVPN, IKEv2</span>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Features</h4>
                  <span className="text-sm text-gray-600">Kill switch, Split tunneling</span>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Management</h4>
                  <span className="text-sm text-gray-600">Remote configuration</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Platform-Specific Setup */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Platform-Specific Setup</h2>
          
          <div className="space-y-8">
            {platformConfigs.map((platform, index) => (
              <Card key={index} className="bg-white/70 backdrop-blur-sm border-gray-200">
                <CardHeader className="border-b border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${
                      platform.color === 'blue' ? 'bg-blue-100' :
                      platform.color === 'green' ? 'bg-green-100' :
                      platform.color === 'purple' ? 'bg-purple-100' :
                      'bg-orange-100'
                    }`}>
                      <platform.icon className={`h-6 w-6 ${
                        platform.color === 'blue' ? 'text-blue-600' :
                        platform.color === 'green' ? 'text-green-600' :
                        platform.color === 'purple' ? 'text-purple-600' :
                        'text-orange-600'
                      }`} />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{platform.platform}</CardTitle>
                      <CardDescription>Multiple setup methods available</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-6">
                  <Tabs defaultValue="methods" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="methods">Setup Methods</TabsTrigger>
                      <TabsTrigger value="config">Configuration</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="methods" className="mt-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        {platform.methods.map((method, methodIndex) => (
                          <Card key={methodIndex} className="border-gray-200">
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">{method.name}</CardTitle>
                                <Badge variant={method.difficulty === 'Easy' ? 'default' : 'secondary'}>
                                  {method.difficulty}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                {method.steps.map((step, stepIndex) => (
                                  <div key={stepIndex} className="flex items-center gap-3">
                                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                                      <span className="text-xs font-semibold text-gray-600">{stepIndex + 1}</span>
                                    </div>
                                    <span className="text-sm text-gray-700">{step}</span>
                                  </div>
                                ))}
                              </div>
                              <Button className="w-full mt-4" size="sm" variant="outline">
                                <Download className="h-4 w-4 mr-2" />
                                Download Guide
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="config" className="mt-6">
                      <div className="relative">
                        <Button
                          onClick={() => copyToClipboard(platform.config, `config-${index}`)}
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                        >
                          {copied === `config-${index}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                          <code>{platform.config}</code>
                        </pre>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Advanced Settings</h2>
          
          <div className="space-y-6">
            {advancedSettings.map((setting, index) => (
              <Card key={index} className="bg-gray-50/50 border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg">{setting.title}</CardTitle>
                  <CardDescription>{setting.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {setting.settings.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                        <div>
                          <h5 className="font-semibold text-gray-900">{item.name}</h5>
                          <p className="text-sm text-gray-600">{item.description}</p>
                        </div>
                        <Badge variant="outline" className="font-mono">
                          {item.value}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Configuration Commands */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Configuration Commands</h2>
          
          <Tabs defaultValue="generate" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="generate">Generate Config</TabsTrigger>
              <TabsTrigger value="bulk">Bulk Deploy</TabsTrigger>
              <TabsTrigger value="update">Update Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="generate" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Generate Client Configuration</CardTitle>
                  <CardDescription>
                    Create custom configurations for different devices and users
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Button
                      onClick={() => copyToClipboard(`# Generate WireGuard config for mobile
vpn-cli client generate \\
  --protocol wireguard \\
  --device-type mobile \\
  --name "John-iPhone" \\
  --dns "1.1.1.1,8.8.8.8" \\
  --kill-switch enabled

# Generate OpenVPN config for desktop
vpn-cli client generate \\
  --protocol openvpn \\
  --device-type desktop \\
  --name "John-MacBook" \\
  --compression lz4 \\
  --split-tunneling enabled

# Generate bulk configs for team
vpn-cli client bulk-generate \\
  --users-file team.csv \\
  --template enterprise \\
  --output-dir ./configs`, 'generate-configs')}
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                    >
                      {copied === 'generate-configs' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{`# Generate WireGuard config for mobile
vpn-cli client generate \\
  --protocol wireguard \\
  --device-type mobile \\
  --name "John-iPhone" \\
  --dns "1.1.1.1,8.8.8.8" \\
  --kill-switch enabled

# Generate OpenVPN config for desktop
vpn-cli client generate \\
  --protocol openvpn \\
  --device-type desktop \\
  --name "John-MacBook" \\
  --compression lz4 \\
  --split-tunneling enabled

# Generate bulk configs for team
vpn-cli client bulk-generate \\
  --users-file team.csv \\
  --template enterprise \\
  --output-dir ./configs`}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="bulk" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Bulk Configuration Deployment</CardTitle>
                  <CardDescription>
                    Deploy configurations to multiple users and devices
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Button
                      onClick={() => copyToClipboard(`# Create team configuration template
vpn-cli template create \\
  --name "enterprise-template" \\
  --protocol wireguard \\
  --dns "1.1.1.1,8.8.8.8" \\
  --kill-switch enabled \\
  --auto-connect true

# Deploy to all team members
vpn-cli deploy bulk \\
  --template enterprise-template \\
  --users-file team-members.csv \\
  --send-email true \\
  --qr-codes true

# Monitor deployment status
vpn-cli deploy status --deployment-id dep_123`, 'bulk-deploy')}
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                    >
                      {copied === 'bulk-deploy' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{`# Create team configuration template
vpn-cli template create \\
  --name "enterprise-template" \\
  --protocol wireguard \\
  --dns "1.1.1.1,8.8.8.8" \\
  --kill-switch enabled \\
  --auto-connect true

# Deploy to all team members
vpn-cli deploy bulk \\
  --template enterprise-template \\
  --users-file team-members.csv \\
  --send-email true \\
  --qr-codes true

# Monitor deployment status
vpn-cli deploy status --deployment-id dep_123`}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="update" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Update Client Settings</CardTitle>
                  <CardDescription>
                    Remotely update client configurations and policies
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Button
                      onClick={() => copyToClipboard(`# Update DNS settings for all clients
vpn-cli client update \\
  --all \\
  --dns "1.1.1.1,1.0.0.1" \\
  --apply-immediately

# Enable kill switch for specific users
vpn-cli client update \\
  --users "john@company.com,jane@company.com" \\
  --kill-switch enabled \\
  --force-update

# Update server endpoint for region
vpn-cli client update \\
  --region us-east-1 \\
  --endpoint vpn-new.example.com:51820 \\
  --rotate-keys`, 'update-settings')}
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                    >
                      {copied === 'update-settings' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{`# Update DNS settings for all clients
vpn-cli client update \\
  --all \\
  --dns "1.1.1.1,1.0.0.1" \\
  --apply-immediately

# Enable kill switch for specific users
vpn-cli client update \\
  --users "john@company.com,jane@company.com" \\
  --kill-switch enabled \\
  --force-update

# Update server endpoint for region
vpn-cli client update \\
  --region us-east-1 \\
  --endpoint vpn-new.example.com:51820 \\
  --rotate-keys`}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Security Considerations */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Security Best Practices</h2>
          
          <div className="space-y-4">
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-green-800 mb-1">Key Management</h4>
                    <p className="text-green-700 text-sm">
                      Regularly rotate client keys and certificates. Use unique keys for each device and never share configuration files.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Key className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-1">Kill Switch Configuration</h4>
                    <p className="text-blue-700 text-sm">
                      Always enable kill switch on all clients to prevent data leaks if VPN connection drops unexpectedly.
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
                    <h4 className="font-semibold text-amber-800 mb-1">Configuration Backup</h4>
                    <p className="text-amber-700 text-sm">
                      Keep secure backups of client configurations and maintain an inventory of all deployed devices.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-8 border border-indigo-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Next Steps</h2>
          <p className="text-gray-600 mb-6">
            With your clients configured, learn about server management and advanced security protocols.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/docs/vpn/server-management">
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                Server Management
              </Button>
            </Link>
            <Link href="/docs/vpn/security">
              <Button variant="outline" className="border-indigo-300 text-indigo-600 hover:bg-indigo-50">
                Security Protocols
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </DocLayout>
  );
}