"use client";

import { useState } from 'react';
import { 
  Shield, Lock, Key, Eye, FileKey, Cpu, 
  Copy, Check, AlertTriangle, Info, Zap, Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DocLayout from '@/components/docs/DocLayout';
import Link from 'next/link';

export default function SecurityProtocolsPage() {
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

  const securityProtocols = [
    {
      name: "WireGuard",
      description: "Modern, lightweight protocol with state-of-the-art cryptography",
      security: 95,
      performance: 98,
      compatibility: 85,
      features: [
        "ChaCha20 for symmetric encryption",
        "Poly1305 for authentication", 
        "Curve25519 for ECDH",
        "BLAKE2s for hashing",
        "Perfect forward secrecy"
      ],
      color: "green",
      recommended: true
    },
    {
      name: "OpenVPN",
      description: "Industry-standard protocol with extensive security features",
      security: 98,
      performance: 80,
      compatibility: 95,
      features: [
        "AES-256-CBC/GCM encryption",
        "RSA-4096 key exchange",
        "SHA-256 authentication",
        "Perfect forward secrecy",
        "TLS 1.3 support"
      ],
      color: "blue"
    },
    {
      name: "IKEv2/IPSec",
      description: "Enterprise-grade protocol optimized for mobile devices",
      security: 92,
      performance: 88,
      compatibility: 90,
      features: [
        "AES-256 encryption",
        "SHA-256/384 authentication",
        "DH Group 14+ key exchange",
        "NAT traversal support",
        "Automatic reconnection"
      ],
      color: "purple"
    }
  ];

  const encryptionDetails = [
    {
      component: "Data Encryption",
      algorithm: "AES-256-GCM",
      keySize: "256-bit",
      description: "Military-grade encryption for all data transmission",
      strength: "Unbreakable with current technology"
    },
    {
      component: "Key Exchange", 
      algorithm: "ECDH P-384",
      keySize: "384-bit",
      description: "Secure key establishment between client and server",
      strength: "Perfect forward secrecy guaranteed"
    },
    {
      component: "Authentication",
      algorithm: "HMAC-SHA256",
      keySize: "256-bit", 
      description: "Message authentication and integrity verification",
      strength: "Prevents tampering and replay attacks"
    },
    {
      component: "Digital Signatures",
      algorithm: "RSA-4096",
      keySize: "4096-bit",
      description: "Certificate-based identity verification", 
      strength: "Non-repudiation and authenticity"
    }
  ];

  const securityFeatures = [
    {
      feature: "Perfect Forward Secrecy",
      icon: Key,
      description: "Each session uses unique encryption keys that cannot decrypt past or future sessions",
      implementation: "Automatic key rotation every 24 hours or 1GB of data",
      color: "green"
    },
    {
      feature: "Kill Switch",
      icon: Shield,
      description: "Automatically blocks internet access if VPN connection drops unexpectedly", 
      implementation: "Network firewall rules prevent data leakage",
      color: "blue"
    },
    {
      feature: "DNS Leak Protection",
      icon: Globe,
      description: "Ensures all DNS queries are routed through VPN to prevent location exposure",
      implementation: "Custom DNS servers with DoH/DoT support",
      color: "purple"
    },
    {
      feature: "Zero-Logs Policy",
      icon: Eye,
      description: "No logging of user activity, connection times, or traffic data",
      implementation: "RAM-only servers with automatic data wiping",
      color: "orange"
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
          <span className="text-gray-900 font-medium">Security Protocols</span>
        </div>

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <Lock className="h-8 w-8 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Security Protocols</h1>
              <p className="text-lg text-gray-600 mt-2">
                Advanced encryption and security features protecting your data
              </p>
            </div>
          </div>
        </div>

        {/* Security Overview */}
        <div className="mb-12">
          <Card className="bg-emerald-50/50 border-emerald-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-emerald-600" />
                Security Architecture Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                VPN Enterprise implements multiple layers of security using industry-leading encryption protocols, 
                advanced key management, and comprehensive leak protection to ensure maximum privacy and security.
              </p>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Encryption</h4>
                  <span className="text-sm text-gray-600">AES-256, ChaCha20</span>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Authentication</h4>
                  <span className="text-sm text-gray-600">HMAC, Digital certificates</span>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Key Exchange</h4>
                  <span className="text-sm text-gray-600">ECDH, Perfect forward secrecy</span>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">Protection</h4>
                  <span className="text-sm text-gray-600">Kill switch, DNS leak prevention</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Protocol Comparison */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Supported Protocols</h2>
          
          <div className="space-y-6">
            {securityProtocols.map((protocol, index) => (
              <Card key={index} className="bg-white/70 backdrop-blur-sm border-gray-200">
                <CardHeader className="border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl flex items-center gap-3">
                        {protocol.name}
                        {protocol.recommended && (
                          <Badge className="bg-emerald-600 text-white">Recommended</Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">{protocol.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-4">Performance Metrics</h4>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-600">Security Level</span>
                            <span className="text-sm font-semibold text-gray-900">{protocol.security}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-emerald-600 h-2 rounded-full transition-all duration-500" 
                              style={{ width: `${protocol.security}%` }}
                            ></div>
                          </div>
                        </div>
                        
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
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-4">Security Features</h4>
                      <div className="space-y-2">
                        {protocol.features.map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-center gap-3">
                            <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
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

        {/* Encryption Details */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Encryption Implementation</h2>
          
          <Card className="bg-gray-50/50 border-gray-200">
            <CardHeader>
              <CardTitle>Cryptographic Components</CardTitle>
              <CardDescription>
                Detailed breakdown of encryption algorithms and security measures
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {encryptionDetails.map((detail, index) => (
                  <div key={index} className="p-4 bg-white rounded-lg border">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-semibold text-gray-900">{detail.component}</h4>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="font-mono">{detail.algorithm}</Badge>
                        <Badge variant="outline" className="font-mono">{detail.keySize}</Badge>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-2">{detail.description}</p>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm text-emerald-700 font-medium">{detail.strength}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security Features */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Advanced Security Features</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {securityFeatures.map((feature, index) => (
              <Card 
                key={index}
                className={`${
                  feature.color === 'green' ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' :
                  feature.color === 'blue' ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200' :
                  feature.color === 'purple' ? 'bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200' :
                  'bg-gradient-to-br from-orange-50 to-red-50 border-orange-200'
                }`}
              >
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${
                      feature.color === 'green' ? 'bg-green-100' :
                      feature.color === 'blue' ? 'bg-blue-100' :
                      feature.color === 'purple' ? 'bg-purple-100' :
                      'bg-orange-100'
                    }`}>
                      <feature.icon className={`h-6 w-6 ${
                        feature.color === 'green' ? 'text-green-600' :
                        feature.color === 'blue' ? 'text-blue-600' :
                        feature.color === 'purple' ? 'text-purple-600' :
                        'text-orange-600'
                      }`} />
                    </div>
                    <CardTitle className="text-lg">{feature.feature}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4">{feature.description}</p>
                  <div className="p-3 bg-white rounded-lg border">
                    <h5 className="font-semibold text-gray-900 mb-2">Implementation</h5>
                    <p className="text-sm text-gray-600">{feature.implementation}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Security Configuration */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Security Configuration</h2>
          
          <Tabs defaultValue="server" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="server">Server Security</TabsTrigger>
              <TabsTrigger value="client">Client Security</TabsTrigger>
              <TabsTrigger value="certificates">Certificate Management</TabsTrigger>
            </TabsList>
            
            <TabsContent value="server" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Server Security Configuration</CardTitle>
                  <CardDescription>
                    Configure server-side security settings and policies
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Button
                      onClick={() => copyToClipboard(`# Configure WireGuard server security
vpn-cli server security configure \\
  --protocol wireguard \\
  --encryption chacha20-poly1305 \\
  --key-rotation 24h \\
  --persistent-keepalive 25

# Enable advanced security features
vpn-cli server security enable \\
  --kill-switch global \\
  --dns-leak-protection true \\
  --traffic-obfuscation true \\
  --port-randomization true

# Set up firewall rules
vpn-cli server firewall create \\
  --rule "allow inbound udp 51820" \\
  --rule "allow inbound tcp 443" \\
  --rule "block all other inbound" \\
  --default-policy deny`, 'server-security')}
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                    >
                      {copied === 'server-security' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{`# Configure WireGuard server security
vpn-cli server security configure \\
  --protocol wireguard \\
  --encryption chacha20-poly1305 \\
  --key-rotation 24h \\
  --persistent-keepalive 25

# Enable advanced security features
vpn-cli server security enable \\
  --kill-switch global \\
  --dns-leak-protection true \\
  --traffic-obfuscation true \\
  --port-randomization true

# Set up firewall rules
vpn-cli server firewall create \\
  --rule "allow inbound udp 51820" \\
  --rule "allow inbound tcp 443" \\
  --rule "block all other inbound" \\
  --default-policy deny`}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="client" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Client Security Policies</CardTitle>
                  <CardDescription>
                    Configure client-side security enforcement and policies
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Button
                      onClick={() => copyToClipboard(`# Configure client security policies
vpn-cli client security policy create \\
  --name "enterprise-policy" \\
  --kill-switch mandatory \\
  --dns-servers "1.1.1.1,1.0.0.1" \\
  --block-lan false \\
  --auto-connect true

# Enable split tunneling rules
vpn-cli client security split-tunnel \\
  --mode allowlist \\
  --apps "chrome,firefox,thunderbird" \\
  --domains "*.company.com,*.secure-site.com" \\
  --exclude-local-traffic false

# Configure leak protection
vpn-cli client security leak-protection \\
  --ipv6-leak-protection true \\
  --webrtc-leak-protection true \\
  --dns-leak-protection strict \\
  --test-on-connect true`, 'client-security')}
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                    >
                      {copied === 'client-security' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{`# Configure client security policies
vpn-cli client security policy create \\
  --name "enterprise-policy" \\
  --kill-switch mandatory \\
  --dns-servers "1.1.1.1,1.0.0.1" \\
  --block-lan false \\
  --auto-connect true

# Enable split tunneling rules
vpn-cli client security split-tunnel \\
  --mode allowlist \\
  --apps "chrome,firefox,thunderbird" \\
  --domains "*.company.com,*.secure-site.com" \\
  --exclude-local-traffic false

# Configure leak protection
vpn-cli client security leak-protection \\
  --ipv6-leak-protection true \\
  --webrtc-leak-protection true \\
  --dns-leak-protection strict \\
  --test-on-connect true`}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="certificates" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Certificate & Key Management</CardTitle>
                  <CardDescription>
                    Manage PKI infrastructure and certificate lifecycle
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Button
                      onClick={() => copyToClipboard(`# Initialize PKI infrastructure
vpn-cli pki init \\
  --ca-name "VPN Enterprise Root CA" \\
  --ca-expiry 10y \\
  --key-size 4096 \\
  --digest sha256

# Generate server certificate
vpn-cli pki server-cert create \\
  --cn "vpn.example.com" \\
  --san "vpn1.example.com,vpn2.example.com" \\
  --expiry 2y \\
  --key-usage "digital-signature,key-encipherment"

# Set up automatic certificate rotation
vpn-cli pki rotation enable \\
  --renew-before 30d \\
  --notify-clients true \\
  --rollback-on-failure true \\
  --validation-period 24h

# Revoke compromised certificate
vpn-cli pki revoke \\
  --serial 0x1234567890abcdef \\
  --reason "key-compromise" \\
  --update-crl true`, 'certificates')}
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                    >
                      {copied === 'certificates' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{`# Initialize PKI infrastructure
vpn-cli pki init \\
  --ca-name "VPN Enterprise Root CA" \\
  --ca-expiry 10y \\
  --key-size 4096 \\
  --digest sha256

# Generate server certificate
vpn-cli pki server-cert create \\
  --cn "vpn.example.com" \\
  --san "vpn1.example.com,vpn2.example.com" \\
  --expiry 2y \\
  --key-usage "digital-signature,key-encipherment"

# Set up automatic certificate rotation
vpn-cli pki rotation enable \\
  --renew-before 30d \\
  --notify-clients true \\
  --rollback-on-failure true \\
  --validation-period 24h

# Revoke compromised certificate
vpn-cli pki revoke \\
  --serial 0x1234567890abcdef \\
  --reason "key-compromise" \\
  --update-crl true`}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Security Audit */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Security Compliance & Auditing</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <FileKey className="h-5 w-5 text-blue-600" />
                  Compliance Standards
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <span className="font-medium text-gray-900">SOC 2 Type II</span>
                    <Badge className="bg-green-100 text-green-800">Certified</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <span className="font-medium text-gray-900">ISO 27001</span>
                    <Badge className="bg-green-100 text-green-800">Certified</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <span className="font-medium text-gray-900">GDPR Compliant</span>
                    <Badge className="bg-green-100 text-green-800">Verified</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <span className="font-medium text-gray-900">HIPAA Ready</span>
                    <Badge className="bg-blue-100 text-blue-800">Available</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Cpu className="h-5 w-5 text-purple-600" />
                  Security Monitoring
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-white rounded-lg border">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-gray-900">Threat Detection</span>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <p className="text-sm text-gray-600">Real-time monitoring for anomalous activity</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-gray-900">Intrusion Detection</span>
                      <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                    </div>
                    <p className="text-sm text-gray-600">Automated blocking of malicious traffic</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-gray-900">Security Logs</span>
                      <Badge className="bg-blue-100 text-blue-800">Retained 90d</Badge>
                    </div>
                    <p className="text-sm text-gray-600">Comprehensive audit trail and forensics</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Security Best Practices */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Security Best Practices</h2>
          
          <div className="space-y-4">
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-green-800 mb-1">Use Strong Protocols</h4>
                    <p className="text-green-700 text-sm">
                      Choose WireGuard for optimal security and performance, or OpenVPN for maximum compatibility. Avoid legacy protocols.
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
                    <h4 className="font-semibold text-blue-800 mb-1">Regular Key Rotation</h4>
                    <p className="text-blue-700 text-sm">
                      Implement automatic key rotation policies and ensure perfect forward secrecy to protect against future compromises.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-amber-800 mb-1">Monitor and Audit</h4>
                    <p className="text-amber-700 text-sm">
                      Enable comprehensive logging, set up security alerts, and conduct regular security audits and penetration testing.
                    </p>
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
            With security protocols configured, learn troubleshooting techniques and explore our comprehensive guides.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/docs/vpn/troubleshooting">
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                Troubleshooting Guide
              </Button>
            </Link>
            <Link href="/docs/guides/production">
              <Button variant="outline" className="border-emerald-300 text-emerald-600 hover:bg-emerald-50">
                Production Deployment
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </DocLayout>
  );
}