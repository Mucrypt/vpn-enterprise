"use client";

import { useState } from 'react';
import { 
  AlertTriangle, HelpCircle, Cpu, Wifi, Shield, Zap, 
  Copy, Check, Info, XCircle, CheckCircle, Clock, Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import DocLayout from '@/components/docs/DocLayout';
import Link from 'next/link';

export default function TroubleshootingPage() {
  const [copied, setCopied] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(''), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const commonIssues = [
    {
      issue: "VPN Connection Fails",
      symptoms: ["Cannot establish connection", "Authentication failed", "Timeout errors"],
      causes: ["Incorrect credentials", "Firewall blocking", "Network configuration"],
      priority: "high",
      category: "connection"
    },
    {
      issue: "Slow Internet Speed",
      symptoms: ["Reduced download/upload speeds", "High latency", "Page loading delays"],
      causes: ["Server overload", "Protocol inefficiency", "Bandwidth limitations"],
      priority: "medium", 
      category: "performance"
    },
    {
      issue: "DNS Resolution Issues",
      symptoms: ["Cannot access websites", "Domain not found errors", "Intermittent connectivity"],
      causes: ["DNS leak", "Incorrect DNS settings", "ISP blocking"],
      priority: "high",
      category: "dns"
    },
    {
      issue: "Frequent Disconnections",
      symptoms: ["Connection drops regularly", "Auto-reconnect fails", "Unstable connection"],
      causes: ["Network instability", "Power management", "Protocol issues"],
      priority: "medium",
      category: "connection"
    }
  ];

  const diagnosticCommands = [
    {
      name: "Connection Status",
      description: "Check current VPN connection status and configuration",
      command: "vpn-cli status --detailed",
      category: "basic"
    },
    {
      name: "Network Diagnostics",
      description: "Run comprehensive network connectivity tests",
      command: "vpn-cli diagnose network --comprehensive",
      category: "network"
    },
    {
      name: "DNS Leak Test",
      description: "Test for DNS leaks and verify DNS resolution",
      command: "vpn-cli diagnose dns --leak-test --resolver-check",
      category: "dns"
    },
    {
      name: "Speed Test", 
      description: "Measure connection speed with and without VPN",
      command: "vpn-cli diagnose speed --compare --servers nearest",
      category: "performance"
    },
    {
      name: "Log Analysis",
      description: "Analyze recent connection logs for errors",
      command: "vpn-cli logs analyze --last 24h --level error,warning",
      category: "logs"
    },
    {
      name: "Certificate Verification",
      description: "Verify server certificates and PKI chain",
      command: "vpn-cli diagnose certificates --verify-chain --check-expiry",
      category: "security"
    }
  ];

  const troubleshootingSteps = {
    connection: [
      {
        step: "Verify Credentials",
        description: "Check username, password, and server details",
        commands: ["vpn-cli auth verify", "vpn-cli config validate"]
      },
      {
        step: "Test Network Connectivity", 
        description: "Ensure basic internet connectivity exists",
        commands: ["ping 8.8.8.8", "curl -I https://google.com"]
      },
      {
        step: "Check Firewall Rules",
        description: "Verify firewall allows VPN traffic",
        commands: ["vpn-cli firewall check", "sudo iptables -L | grep -i vpn"]
      },
      {
        step: "Try Different Servers",
        description: "Test connection to alternative servers",
        commands: ["vpn-cli server list --available", "vpn-cli connect --server nearest"]
      }
    ],
    performance: [
      {
        step: "Run Speed Test",
        description: "Measure baseline and VPN speeds",
        commands: ["vpn-cli diagnose speed --baseline", "vpn-cli diagnose speed --connected"]
      },
      {
        step: "Check Server Load",
        description: "Verify server utilization and capacity",
        commands: ["vpn-cli server stats --current", "vpn-cli server list --sort-by load"]
      },
      {
        step: "Optimize Protocol",
        description: "Switch to faster protocol if needed",
        commands: ["vpn-cli protocol set wireguard", "vpn-cli config optimize --for-speed"]
      },
      {
        step: "Adjust MTU Settings",
        description: "Optimize packet size for network",
        commands: ["vpn-cli mtu auto-detect", "vpn-cli mtu set 1420"]
      }
    ],
    dns: [
      {
        step: "Check DNS Settings",
        description: "Verify DNS configuration and servers",
        commands: ["vpn-cli dns status", "nslookup google.com"]
      },
      {
        step: "Test DNS Leak",
        description: "Confirm DNS queries route through VPN",
        commands: ["vpn-cli diagnose dns --leak-test", "curl -s https://1.1.1.1/cdn-cgi/trace"]
      },
      {
        step: "Flush DNS Cache",
        description: "Clear local DNS cache to resolve conflicts",
        commands: ["sudo systemctl flush-dns", "vpn-cli dns flush"]
      },
      {
        step: "Set Custom DNS",
        description: "Configure reliable DNS servers",
        commands: ["vpn-cli dns set 1.1.1.1,1.0.0.1", "vpn-cli dns test --servers custom"]
      }
    ]
  };

  const performanceOptimization = [
    {
      optimization: "Protocol Selection",
      description: "Choose optimal protocol for your use case",
      impact: "High",
      difficulty: "Easy",
      steps: [
        "Use WireGuard for best performance",
        "OpenVPN for compatibility", 
        "IKEv2 for mobile devices"
      ]
    },
    {
      optimization: "Server Location",
      description: "Connect to geographically closer servers",
      impact: "High", 
      difficulty: "Easy",
      steps: [
        "Choose servers in your region",
        "Test multiple locations",
        "Consider server load balancing"
      ]
    },
    {
      optimization: "MTU Optimization",
      description: "Adjust Maximum Transmission Unit for network",
      impact: "Medium",
      difficulty: "Medium", 
      steps: [
        "Auto-detect optimal MTU",
        "Test different MTU values",
        "Monitor packet fragmentation"
      ]
    },
    {
      optimization: "Split Tunneling",
      description: "Route only necessary traffic through VPN",
      impact: "High",
      difficulty: "Medium",
      steps: [
        "Identify critical applications",
        "Configure bypass rules",
        "Test application connectivity"
      ]
    }
  ];

  const filteredIssues = commonIssues.filter(issue =>
    issue.issue.toLowerCase().includes(searchQuery.toLowerCase()) ||
    issue.symptoms.some(symptom => symptom.toLowerCase().includes(searchQuery.toLowerCase())) ||
    issue.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DocLayout>
      <div className="px-6 py-8">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/docs" className="hover:text-gray-900">Documentation</Link>
          <span>›</span>
          <Link href="/docs/vpn/overview" className="hover:text-gray-900">VPN Service</Link>
          <span>›</span>
          <span className="text-gray-900 font-medium">Troubleshooting</span>
        </div>

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-orange-100 rounded-xl">
              <HelpCircle className="h-8 w-8 text-orange-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Troubleshooting Guide</h1>
              <p className="text-lg text-gray-600 mt-2">
                Diagnose and resolve common VPN issues quickly and effectively
              </p>
            </div>
          </div>
        </div>

        {/* Quick Help Search */}
        <div className="mb-12">
          <Card className="bg-blue-50/50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Search className="h-5 w-5 text-blue-600" />
                Quick Problem Search
              </CardTitle>
              <CardDescription>
                Search for your specific issue or browse common problems below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Describe your issue (e.g., 'connection fails', 'slow speed', 'dns error')"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Common Issues */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Common Issues</h2>
          
          <div className="space-y-4">
            {filteredIssues.map((issue, index) => (
              <Card key={index} className="bg-white/70 backdrop-blur-sm border-gray-200">
                <CardHeader className="border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3">
                      <AlertTriangle className={`h-5 w-5 ${
                        issue.priority === 'high' ? 'text-red-600' : 'text-yellow-600'
                      }`} />
                      {issue.issue}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="capitalize">{issue.category}</Badge>
                      <Badge className={
                        issue.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }>
                        {issue.priority} priority
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Common Symptoms</h4>
                      <ul className="space-y-2">
                        {issue.symptoms.map((symptom, symptomIndex) => (
                          <li key={symptomIndex} className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{symptom}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Likely Causes</h4>
                      <ul className="space-y-2">
                        {issue.causes.map((cause, causeIndex) => (
                          <li key={causeIndex} className="flex items-center gap-2">
                            <Info className="h-4 w-4 text-blue-500 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{cause}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredIssues.length === 0 && searchQuery && (
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="py-8 text-center">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">No issues found matching "{searchQuery}"</p>
                <p className="text-sm text-gray-500">Try different keywords or browse all issues below</p>
                <Button
                  onClick={() => setSearchQuery('')}
                  variant="outline"
                  size="sm"
                  className="mt-4"
                >
                  Clear Search
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Diagnostic Tools */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Diagnostic Commands</h2>
          
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="network">Network</TabsTrigger>
              <TabsTrigger value="dns">DNS</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
            </TabsList>
            
            {['basic', 'network', 'dns', 'performance', 'security', 'logs'].map((category) => (
              <TabsContent key={category} value={category} className="mt-6">
                <div className="space-y-4">
                  {diagnosticCommands
                    .filter(cmd => cmd.category === category)
                    .map((cmd, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <CardTitle className="text-lg">{cmd.name}</CardTitle>
                          <CardDescription>{cmd.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="relative">
                            <Button
                              onClick={() => copyToClipboard(cmd.command, `${category}-${index}`)}
                              size="sm"
                              variant="ghost"
                              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                            >
                              {copied === `${category}-${index}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                              <code>{cmd.command}</code>
                            </pre>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Step-by-Step Troubleshooting */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Step-by-Step Solutions</h2>
          
          <Tabs defaultValue="connection" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="connection">Connection Issues</TabsTrigger>
              <TabsTrigger value="performance">Performance Issues</TabsTrigger>
              <TabsTrigger value="dns">DNS Issues</TabsTrigger>
            </TabsList>
            
            {Object.entries(troubleshootingSteps).map(([category, steps]) => (
              <TabsContent key={category} value={category} className="mt-6">
                <div className="space-y-6">
                  {steps.map((step, index) => (
                    <Card key={index} className="bg-white border-gray-200">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                            {index + 1}
                          </div>
                          {step.step}
                        </CardTitle>
                        <CardDescription>{step.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {step.commands.map((command, cmdIndex) => (
                            <div key={cmdIndex} className="relative">
                              <Button
                                onClick={() => copyToClipboard(command, `${category}-step-${index}-${cmdIndex}`)}
                                size="sm"
                                variant="ghost"
                                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 z-10"
                              >
                                {copied === `${category}-step-${index}-${cmdIndex}` ? 
                                  <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />
                                }
                              </Button>
                              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                                <code>{command}</code>
                              </pre>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Performance Optimization */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Performance Optimization</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {performanceOptimization.map((opt, index) => (
              <Card key={index} className={`${
                opt.impact === 'High' ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' :
                'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'
              }`}>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-lg">{opt.optimization}</CardTitle>
                    <div className="flex gap-2">
                      <Badge className={
                        opt.impact === 'High' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }>
                        {opt.impact} Impact
                      </Badge>
                      <Badge variant="outline" className="text-gray-600">
                        {opt.difficulty}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>{opt.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {opt.steps.map((step, stepIndex) => (
                      <div key={stepIndex} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{step}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Emergency Procedures */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Emergency Procedures</h2>
          
          <div className="space-y-6">
            <Card className="border-red-200 bg-red-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-red-800">
                  <AlertTriangle className="h-5 w-5" />
                  Complete VPN Failure
                </CardTitle>
                <CardDescription className="text-red-700">
                  When VPN stops working completely and internet access is blocked
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-white rounded-lg border border-red-200">
                    <h4 className="font-semibold text-red-900 mb-2">Immediate Actions</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-red-800">
                      <li>Disconnect VPN: <code className="bg-red-100 px-2 py-1 rounded">vpn-cli disconnect --force</code></li>
                      <li>Reset network: <code className="bg-red-100 px-2 py-1 rounded">vpn-cli network reset</code></li>
                      <li>Restart network service: <code className="bg-red-100 px-2 py-1 rounded">sudo systemctl restart NetworkManager</code></li>
                      <li>Test internet: <code className="bg-red-100 px-2 py-1 rounded">ping 8.8.8.8</code></li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-orange-800">
                  <Shield className="h-5 w-5" />
                  Security Breach Suspected
                </CardTitle>
                <CardDescription className="text-orange-700">
                  When you suspect unauthorized access or security compromise
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-white rounded-lg border border-orange-200">
                    <h4 className="font-semibold text-orange-900 mb-2">Security Response</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-orange-800">
                      <li>Disconnect immediately: <code className="bg-orange-100 px-2 py-1 rounded">vpn-cli disconnect --emergency</code></li>
                      <li>Revoke all sessions: <code className="bg-orange-100 px-2 py-1 rounded">vpn-cli auth revoke --all-sessions</code></li>
                      <li>Generate new keys: <code className="bg-orange-100 px-2 py-1 rounded">vpn-cli keys regenerate --force</code></li>
                      <li>Contact support: <code className="bg-orange-100 px-2 py-1 rounded">vpn-cli support emergency --incident security</code></li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Support Resources */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Support Resources</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-blue-600" />
                  24/7 Support
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">
                  Get immediate help from our technical support team
                </p>
                <div className="space-y-2">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Create Support Ticket
                  </Button>
                  <Button variant="outline" className="w-full border-blue-300 text-blue-600">
                    Live Chat Support
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <HelpCircle className="h-5 w-5 text-green-600" />
                  Knowledge Base
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">
                  Comprehensive guides and tutorials
                </p>
                <div className="space-y-2">
                  <Link href="/docs/guides" className="block">
                    <Button variant="outline" className="w-full border-green-300 text-green-600">
                      Browse All Guides
                    </Button>
                  </Link>
                  <Link href="/docs/faq" className="block">
                    <Button variant="outline" className="w-full border-green-300 text-green-600">
                      Frequently Asked Questions
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Cpu className="h-5 w-5 text-purple-600" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">
                  Check service status and known issues
                </p>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full border-purple-300 text-purple-600">
                    System Status Page
                  </Button>
                  <Button variant="outline" className="w-full border-purple-300 text-purple-600">
                    Maintenance Schedule
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Still Need Help */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Still Need Help?</h2>
          <p className="text-gray-600 mb-6">
            If you couldn't find a solution to your problem, our support team is ready to help you resolve any issues.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Contact Support Team
            </Button>
            <Button variant="outline" className="border-blue-300 text-blue-600 hover:bg-blue-50">
              Schedule a Call
            </Button>
            <Link href="/docs/vpn/overview">
              <Button variant="outline" className="border-blue-300 text-blue-600 hover:bg-blue-50">
                Back to VPN Overview
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </DocLayout>
  );
}