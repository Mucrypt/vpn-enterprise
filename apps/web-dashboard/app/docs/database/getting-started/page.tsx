"use client";

import { useState } from 'react';
import { 
  Rocket, Database, Code, Settings, CheckCircle, Clock, 
  Copy, Check, ArrowRight, User, Shield, Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DocLayout from '@/components/docs/DocLayout';
import Link from 'next/link';

export default function GettingStartedPage() {
  const [copied, setCopied] = useState<string>('');
  const [currentStep, setCurrentStep] = useState(1);

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
      title: "Install CLI Tool",
      description: "Download and install the VPN Enterprise Database CLI",
      timeEstimate: "2 minutes",
      commands: [
        {
          title: "Install via npm",
          command: "npm install -g @vpn-enterprise/db-cli"
        },
        {
          title: "Verify installation",
          command: "db-cli --version"
        }
      ],
      validation: "db-cli auth status"
    },
    {
      step: 2,
      title: "Authenticate",
      description: "Log in to your VPN Enterprise account",
      timeEstimate: "1 minute",
      commands: [
        {
          title: "Login with credentials",
          command: "db-cli auth login --email your@email.com"
        },
        {
          title: "Or use API key",
          command: "db-cli auth login --api-key YOUR_API_KEY"
        }
      ],
      validation: "db-cli auth whoami"
    },
    {
      step: 3,
      title: "Create Database",
      description: "Deploy your first database instance",
      timeEstimate: "3-5 minutes",
      commands: [
        {
          title: "Create PostgreSQL database",
          command: "db-cli create --type postgresql --name my-first-db --plan starter"
        },
        {
          title: "Check deployment status",
          command: "db-cli status my-first-db"
        }
      ],
      validation: "db-cli list --status running"
    },
    {
      step: 4,
      title: "Connect Application",
      description: "Get connection details and connect your application",
      timeEstimate: "2-3 minutes",
      commands: [
        {
          title: "Get connection string",
          command: "db-cli connection-string my-first-db"
        },
        {
          title: "Test connection",
          command: "db-cli test-connection my-first-db"
        }
      ],
      validation: "db-cli ping my-first-db"
    }
  ];

  const quickTemplates = [
    {
      name: "Node.js + PostgreSQL",
      description: "Express.js application with PostgreSQL database",
      language: "JavaScript",
      framework: "Express.js",
      database: "PostgreSQL",
      features: ["JWT Authentication", "REST API", "Database migrations"],
      setupCommand: "db-cli template deploy nodejs-postgres --name my-app"
    },
    {
      name: "Python + PostgreSQL",
      description: "FastAPI application with PostgreSQL and SQLAlchemy",
      language: "Python",
      framework: "FastAPI",
      database: "PostgreSQL",
      features: ["Async/await", "OpenAPI docs", "Database ORM"],
      setupCommand: "db-cli template deploy python-postgres --name my-app"
    },
    {
      name: "React + MongoDB",
      description: "React frontend with Node.js backend and MongoDB",
      language: "JavaScript",
      framework: "React + Node.js",
      database: "MongoDB",
      features: ["Real-time updates", "Document storage", "GraphQL API"],
      setupCommand: "db-cli template deploy react-mongodb --name my-app"
    },
    {
      name: "Next.js + MySQL",
      description: "Full-stack Next.js application with MySQL database",
      language: "TypeScript",
      framework: "Next.js",
      database: "MySQL",
      features: ["Server components", "API routes", "Prisma ORM"],
      setupCommand: "db-cli template deploy nextjs-mysql --name my-app"
    }
  ];

  const planComparison = [
    {
      plan: "Starter",
      price: "$19/month",
      databases: "Up to 3",
      storage: "10 GB",
      connections: "100",
      backups: "Daily",
      support: "Community",
      features: ["Basic monitoring", "SSL encryption", "Point-in-time recovery"],
      recommended: false,
      color: "blue"
    },
    {
      plan: "Pro",
      price: "$49/month",
      databases: "Up to 10",
      storage: "100 GB",
      connections: "500",
      backups: "Hourly",
      support: "Standard",
      features: ["Advanced monitoring", "Read replicas", "Connection pooling", "Performance insights"],
      recommended: true,
      color: "green"
    },
    {
      plan: "Enterprise",
      price: "$199/month",
      databases: "Unlimited",
      storage: "1 TB",
      connections: "2000",
      backups: "Continuous",
      support: "Priority",
      features: ["Multi-region", "High availability", "Custom configurations", "Dedicated support"],
      recommended: false,
      color: "purple"
    }
  ];

  const troubleshootingTips = [
    {
      issue: "Installation fails",
      solution: "Ensure Node.js version 16+ is installed. Try using sudo for global npm installs.",
      command: "sudo npm install -g @vpn-enterprise/db-cli"
    },
    {
      issue: "Authentication error",
      solution: "Verify your email/password or API key. Check if your account has database access enabled.",
      command: "db-cli auth logout && db-cli auth login"
    },
    {
      issue: "Database creation fails",
      solution: "Check if you have reached your plan limits. Verify region availability.",
      command: "db-cli limits check && db-cli regions list"
    },
    {
      issue: "Connection timeout",
      solution: "Ensure your firewall allows outbound connections. Check if database is fully deployed.",
      command: "db-cli status my-first-db --verbose"
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
          <span className="text-gray-900 font-medium">Getting Started</span>
        </div>

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <Rocket className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Getting Started</h1>
              <p className="text-lg text-gray-600 mt-2">
                Set up your first database instance in minutes with our step-by-step guide
              </p>
            </div>
          </div>
        </div>

        {/* Prerequisites */}
        <div className="mb-12">
          <Card className="bg-blue-50/50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                Prerequisites
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">System Requirements</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-gray-700">Node.js 16 or higher</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-gray-700">npm or yarn package manager</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-gray-700">Internet connection</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-gray-700">Command line access</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Account Setup</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-gray-700">VPN Enterprise account</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-gray-700">Database service enabled</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-gray-700">Valid payment method</span>
                    </li>
                  </ul>
                  <div className="mt-4">
                    <Link href="/signup">
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        Create Account
                      </Button>
                    </Link>
                  </div>
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
              <Card 
                key={index} 
                className={`transition-all duration-300 ${
                  currentStep === step.step ? 'ring-2 ring-green-500 bg-green-50/30' : 'bg-white'
                }`}
              >
                <CardHeader className="border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                        currentStep > step.step ? 'bg-green-600 text-white' :
                        currentStep === step.step ? 'bg-blue-600 text-white' :
                        'bg-gray-200 text-gray-600'
                      }`}>
                        {currentStep > step.step ? <Check className="h-5 w-5" /> : step.step}
                      </div>
                      <div>
                        <CardTitle className="text-xl">{step.title}</CardTitle>
                        <CardDescription>{step.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{step.timeEstimate}</span>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {step.commands.map((cmd, cmdIndex) => (
                      <div key={cmdIndex}>
                        <h5 className="font-medium text-gray-900 mb-2">{cmd.title}</h5>
                        <div className="relative">
                          <Button
                            onClick={() => copyToClipboard(cmd.command, `step-${step.step}-${cmdIndex}`)}
                            size="sm"
                            variant="ghost"
                            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                          >
                            {copied === `step-${step.step}-${cmdIndex}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                            <code>{cmd.command}</code>
                          </pre>
                        </div>
                      </div>
                    ))}
                    
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                      <h5 className="font-medium text-gray-900 mb-2">✅ Validation</h5>
                      <p className="text-sm text-gray-600 mb-2">Run this command to verify the step completed successfully:</p>
                      <div className="relative">
                        <Button
                          onClick={() => copyToClipboard(step.validation, `validation-${step.step}`)}
                          size="sm"
                          variant="ghost"
                          className="absolute top-1 right-1 text-gray-500 hover:text-gray-700"
                        >
                          {copied === `validation-${step.step}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </Button>
                        <code className="block bg-white p-2 rounded border text-sm font-mono">
                          {step.validation}
                        </code>
                      </div>
                    </div>
                    
                    <div className="flex justify-end pt-4">
                      <Button
                        onClick={() => setCurrentStep(Math.min(step.step + 1, setupSteps.length))}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Mark as Complete
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Start Templates */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Start Templates</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {quickTemplates.map((template, index) => (
              <Card key={index} className="bg-white/70 backdrop-blur-sm border-gray-200">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">{template.language}</Badge>
                      <Badge variant="outline" className="text-xs">{template.database}</Badge>
                    </div>
                  </div>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Framework</h5>
                      <p className="text-sm text-gray-600">{template.framework}</p>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Features Included</h5>
                      <div className="space-y-1">
                        {template.features.map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Deploy Command</h5>
                      <div className="relative">
                        <Button
                          onClick={() => copyToClipboard(template.setupCommand, `template-${index}`)}
                          size="sm"
                          variant="ghost"
                          className="absolute top-1 right-1 text-gray-500 hover:text-gray-700"
                        >
                          {copied === `template-${index}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </Button>
                        <code className="block bg-gray-900 text-gray-100 p-3 rounded text-sm overflow-x-auto">
                          {template.setupCommand}
                        </code>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Pricing Plans */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Choose Your Plan</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {planComparison.map((plan, index) => (
              <Card 
                key={index}
                className={`${
                  plan.recommended ? 'ring-2 ring-green-500 bg-green-50/30' : 'bg-white'
                } relative`}
              >
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-green-600 text-white px-4 py-1">
                      Recommended
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl">{plan.plan}</CardTitle>
                  <div className="text-3xl font-bold text-gray-900">{plan.price}</div>
                  <CardDescription>Perfect for growing applications</CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-gray-600">Databases:</div>
                      <div className="font-medium">{plan.databases}</div>
                      
                      <div className="text-gray-600">Storage:</div>
                      <div className="font-medium">{plan.storage}</div>
                      
                      <div className="text-gray-600">Connections:</div>
                      <div className="font-medium">{plan.connections}</div>
                      
                      <div className="text-gray-600">Backups:</div>
                      <div className="font-medium">{plan.backups}</div>
                      
                      <div className="text-gray-600">Support:</div>
                      <div className="font-medium">{plan.support}</div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <h5 className="font-medium text-gray-900 mb-2">Features</h5>
                      <div className="space-y-2">
                        {plan.features.map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <Button className={`w-full ${
                      plan.recommended ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
                    }`}>
                      Choose {plan.plan}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Common Issues</h2>
          
          <Tabs defaultValue="installation" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="installation">Installation</TabsTrigger>
              <TabsTrigger value="authentication">Authentication</TabsTrigger>
              <TabsTrigger value="creation">Database Creation</TabsTrigger>
              <TabsTrigger value="connection">Connection</TabsTrigger>
            </TabsList>
            
            {troubleshootingTips.map((tip, index) => (
              <TabsContent 
                key={index}
                value={index === 0 ? 'installation' : index === 1 ? 'authentication' : index === 2 ? 'creation' : 'connection'}
                className="mt-6"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{tip.issue}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4">{tip.solution}</p>
                    <div className="relative">
                      <Button
                        onClick={() => copyToClipboard(tip.command, `troubleshoot-${index}`)}
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                      >
                        {copied === `troubleshoot-${index}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                        <code>{tip.command}</code>
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Next Steps */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-8 border border-green-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Next Steps</h2>
          <p className="text-gray-600 mb-6">
            Now that you have your database running, learn how to optimize connections, configure backups, and scale your infrastructure.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/docs/database/connection-strings">
              <Button className="bg-green-600 hover:bg-green-700">
                Connection Strings
              </Button>
            </Link>
            <Link href="/docs/database/backup-recovery">
              <Button variant="outline" className="border-green-300 text-green-600 hover:bg-green-50">
                Backup & Recovery
              </Button>
            </Link>
            <Link href="/docs/database/scaling">
              <Button variant="outline" className="border-green-300 text-green-600 hover:bg-green-50">
                Scaling Guide
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </DocLayout>
  );
}