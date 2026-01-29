"use client";

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  GitBranch, 
  Zap, 
  CheckCircle,
  ArrowRight,
  Settings,
  Rocket,
  Shield,
  Clock,
  Code,
  FileText,
  Play,
  Package
} from 'lucide-react';
import Link from 'next/link';
import DocLayout from '@/components/docs/DocLayout';

export default function CICDPlatformsPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const platformsRef = useRef<HTMLDivElement>(null);
  const workflowRef = useRef<HTMLDivElement>(null);

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

      // Platforms animation
      gsap.from(platformsRef.current?.children || [], {
        duration: 0.8,
        scale: 0.9,
        opacity: 0,
        stagger: 0.1,
        ease: "back.out(1.7)",
        delay: 0.3
      });

      // Workflow animation
      gsap.from(workflowRef.current?.children || [], {
        duration: 0.6,
        x: -30,
        opacity: 0,
        stagger: 0.15,
        ease: "power2.out",
        delay: 0.6
      });
    });

    return () => ctx.revert();
  }, []);

  const cicdPlatforms = [
    {
      name: "GitHub Actions",
      description: "Native CI/CD solution integrated with GitHub",
      logo: "🐙",
      features: ["Workflow automation", "Matrix builds", "Secrets management", "Marketplace actions"],
      supported: true,
      setupTime: "5 min",
      color: "from-gray-700 to-black"
    },
    {
      name: "GitLab CI/CD",
      description: "Integrated CI/CD platform with GitLab",
      logo: "🦊",
      features: ["Pipeline as code", "Auto DevOps", "Built-in registry", "Review apps"],
      supported: true,
      setupTime: "8 min",
      color: "from-orange-500 to-red-500"
    },
    {
      name: "Jenkins",
      description: "Open-source automation server",
      logo: "👨‍💼",
      features: ["Extensible plugins", "Distributed builds", "Pipeline DSL", "Blue Ocean UI"],
      supported: true,
      setupTime: "15 min",
      color: "from-blue-600 to-indigo-600"
    },
    {
      name: "Azure DevOps",
      description: "Microsoft's complete DevOps solution",
      logo: "🔵",
      features: ["Azure Pipelines", "Boards", "Repos", "Test Plans"],
      supported: true,
      setupTime: "10 min",
      color: "from-blue-500 to-cyan-500"
    },
    {
      name: "CircleCI",
      description: "Cloud-native continuous integration platform",
      logo: "⭕",
      features: ["Docker support", "Parallel execution", "Orbs", "Insights"],
      supported: true,
      setupTime: "7 min",
      color: "from-green-500 to-emerald-500"
    },
    {
      name: "Bitbucket Pipelines",
      description: "Atlassian's integrated CI/CD service",
      logo: "🪣",
      features: ["Built-in Docker", "Deployments", "Branch workflows", "Jira integration"],
      supported: true,
      setupTime: "6 min",
      color: "from-blue-600 to-purple-600"
    }
  ];

  const deploymentSteps = [
    {
      step: 1,
      title: "Source Code Management",
      description: "Trigger deployments from your version control system",
      icon: Code,
      features: ["Git webhooks", "Branch protection", "Pull request workflows", "Tag-based releases"]
    },
    {
      step: 2,
      title: "Build & Test",
      description: "Automated building and testing of VPN Enterprise configurations",
      icon: Settings,
      features: ["Configuration validation", "Unit testing", "Integration tests", "Security scans"]
    },
    {
      step: 3,
      title: "Deploy to Staging",
      description: "Automated deployment to staging environment for validation",
      icon: Play,
      features: ["Environment provisioning", "Configuration deployment", "Health checks", "Smoke tests"]
    },
    {
      step: 4,
      title: "Production Deployment",
      description: "Controlled deployment to production with rollback capabilities",
      icon: Rocket,
      features: ["Blue-green deployment", "Rolling updates", "Canary releases", "Automatic rollback"]
    }
  ];

  const workflowExamples = {
    github: {
      title: "GitHub Actions Workflow",
      description: "Complete CI/CD pipeline for VPN Enterprise deployment",
      code: `name: VPN Enterprise Deploy
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Validate Configuration
        run: |
          vpn-enterprise validate config/
      - name: Run Security Scan
        run: |
          vpn-enterprise security-scan

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Production
        env:
          VPN_API_KEY: \${{ secrets.VPN_API_KEY }}
        run: |
          vpn-enterprise deploy --env production`
    },
    gitlab: {
      title: "GitLab CI/CD Pipeline",
      description: "GitLab pipeline configuration for automated deployment",
      code: `stages:
  - validate
  - test
  - deploy

variables:
  VPN_ENTERPRISE_VERSION: "latest"

validate_config:
  stage: validate
  script:
    - vpn-enterprise validate config/
  only:
    - merge_requests
    - main

security_scan:
  stage: test
  script:
    - vpn-enterprise security-scan
  artifacts:
    reports:
      security: security-report.json

deploy_production:
  stage: deploy
  script:
    - vpn-enterprise deploy --env production
  environment:
    name: production
    url: https://vpn.company.com
  only:
    - main`
    },
    jenkins: {
      title: "Jenkins Pipeline",
      description: "Declarative Jenkins pipeline for VPN Enterprise",
      code: `pipeline {
  agent any
  
  environment {
    VPN_API_KEY = credentials('vpn-api-key')
  }
  
  stages {
    stage('Validate') {
      steps {
        sh 'vpn-enterprise validate config/'
      }
    }
    
    stage('Test') {
      parallel {
        stage('Unit Tests') {
          steps {
            sh 'vpn-enterprise test --unit'
          }
        }
        stage('Security Scan') {
          steps {
            sh 'vpn-enterprise security-scan'
          }
        }
      }
    }
    
    stage('Deploy') {
      when { branch 'main' }
      steps {
        sh 'vpn-enterprise deploy --env production'
      }
    }
  }
  
  post {
    always {
      publishHTML([
        allowMissing: false,
        alwaysLinkToLastBuild: true,
        keepAll: true,
        reportDir: 'reports',
        reportFiles: 'index.html',
        reportName: 'VPN Enterprise Report'
      ])
    }
  }
}`
    }
  };

  const automationFeatures = [
    {
      icon: Shield,
      title: "Configuration Validation",
      description: "Automatically validate VPN configurations before deployment",
      benefits: ["Prevent configuration errors", "Ensure security compliance", "Validate network settings"]
    },
    {
      icon: Zap,
      title: "Zero-Downtime Deployment",
      description: "Deploy updates without interrupting active VPN connections",
      benefits: ["Blue-green deployments", "Rolling updates", "Connection preservation"]
    },
    {
      icon: Clock,
      title: "Scheduled Operations",
      description: "Automate routine maintenance and operational tasks",
      benefits: ["Certificate renewal", "Log rotation", "Performance optimization"]
    },
    {
      icon: Package,
      title: "Environment Management",
      description: "Manage multiple environments with consistent deployments",
      benefits: ["Dev/Staging/Prod parity", "Environment-specific configs", "Promotion workflows"]
    }
  ];

  return (
    <DocLayout>
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/20 to-purple-50/30">
        <div className="container mx-auto px-6 py-12">
          {/* Hero Section */}
          <div ref={heroRef} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 px-4 py-2 rounded-full mb-6">
              <GitBranch className="h-5 w-5 text-blue-600" />
              <span className="text-blue-700 dark:text-blue-300 font-medium">DevOps Integration</span>
            </div>
            
            <h1 className="text-5xl font-bold bg-linear-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-6">
              CI/CD Platforms
            </h1>
            
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Automate your VPN Enterprise deployments with seamless CI/CD integration. 
              Deploy configurations, manage updates, and maintain infrastructure with confidence through automated pipelines.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-linear-to-r from-blue-600 to-purple-600">
                Setup CI/CD Pipeline
              </Button>
              <Button size="lg" variant="outline">
                Browse Pipeline Templates
              </Button>
            </div>
          </div>

          {/* Supported Platforms */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Supported CI/CD Platforms</h2>
            <div ref={platformsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cicdPlatforms.map((platform, index) => (
                <Card 
                  key={index}
                  className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm overflow-hidden"
                >
                  <CardHeader className="relative">
                    <div className={`absolute inset-0 bg-linear-to-r ${platform.color} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
                    <div className="relative flex items-center gap-4">
                      <div className="text-3xl">{platform.logo}</div>
                      <div>
                        <CardTitle className="text-lg">{platform.name}</CardTitle>
                        <CardDescription>{platform.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Supported
                      </Badge>
                      <Badge variant="outline">
                        <Clock className="h-3 w-3 mr-1" />
                        {platform.setupTime}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="mb-4">
                      <h4 className="font-semibold mb-2 text-gray-700">Key Features:</h4>
                      <div className="space-y-1">
                        {platform.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span className="text-xs text-gray-600">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button className="w-full" variant="outline">
                      View Setup Guide
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Deployment Workflow */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Automated Deployment Workflow</h2>
            <div ref={workflowRef} className="space-y-8">
              {deploymentSteps.map((step, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-6">
                      <div className="shrink-0">
                        <div className="w-12 h-12 bg-linear-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                          {step.step}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <step.icon className="h-5 w-5 text-blue-600" />
                          <h3 className="text-xl font-semibold text-gray-900">{step.title}</h3>
                        </div>
                        <p className="text-gray-600 mb-4">{step.description}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {step.features.map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
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

          {/* Pipeline Examples */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Pipeline Examples</h2>
            <Tabs defaultValue="github" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="github">GitHub Actions</TabsTrigger>
                <TabsTrigger value="gitlab">GitLab CI/CD</TabsTrigger>
                <TabsTrigger value="jenkins">Jenkins</TabsTrigger>
              </TabsList>
              
              {Object.entries(workflowExamples).map(([key, example]) => (
                <TabsContent key={key} value={key}>
                  <Card>
                    <CardHeader>
                      <CardTitle>{example.title}</CardTitle>
                      <CardDescription>{example.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                        <pre className="text-green-400 text-sm">
                          <code>{example.code}</code>
                        </pre>
                      </div>
                      <div className="mt-4 flex gap-4">
                        <Button size="sm">
                          <FileText className="mr-2 h-4 w-4" />
                          Download Template
                        </Button>
                        <Button size="sm" variant="outline">
                          <Code className="mr-2 h-4 w-4" />
                          View Full Example
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          {/* Automation Features */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Automation Capabilities</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {automationFeatures.map((feature, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-linear-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <feature.icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                        <CardDescription>{feature.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {feature.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-gray-700">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Security & Compliance */}
          <Card className="mb-16 bg-linear-to-r from-indigo-50 to-purple-50 border-0">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <Shield className="h-12 w-12 text-indigo-600 mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Security & Compliance Built-In</h2>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>Encrypted secrets management</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>Role-based access control</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>Audit logging and compliance</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>Automated security scanning</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>Infrastructure as Code validation</span>
                    </li>
                  </ul>
                </div>
                <div className="text-center">
                  <div className="bg-white rounded-lg p-6 shadow-lg">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Deployment Success Rate</h3>
                    <div className="text-4xl font-bold text-indigo-600 mb-2">99.7%</div>
                    <p className="text-sm text-gray-600">Based on automated deployments</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Call to Action */}
          <Card className="bg-linear-to-r from-blue-500 to-purple-600 text-white">
            <CardContent className="p-8 text-center">
              <Rocket className="h-16 w-16 mx-auto mb-6 opacity-90" />
              <h2 className="text-3xl font-bold mb-4">Accelerate Your Deployments</h2>
              <p className="text-lg opacity-90 mb-6 max-w-2xl mx-auto">
                Transform your VPN Enterprise deployment process with automated CI/CD pipelines. 
                Reduce deployment time, eliminate errors, and improve reliability.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary">
                  Start Pipeline Setup
                </Button>
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600">
                  Download Pipeline Templates
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DocLayout>
  );
}