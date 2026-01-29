import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowRightLeft, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Database,
  Users,
  Settings,
  Shield,
  ArrowRight,
  Zap,
  Copy,
  FileText,
  Workflow
} from 'lucide-react'
import Link from 'next/link'

export default function MigrationPage() {
  const migrationTypes = [
    {
      title: "Self-Hosted to Cloud",
      description: "Migrate from your own servers to our managed cloud hosting",
      complexity: "Medium",
      duration: "2-5 days",
      downtime: "< 2 hours",
      icon: ArrowRightLeft
    },
    {
      title: "Shared to VPS/Dedicated",
      description: "Upgrade from shared hosting to dedicated resources",
      complexity: "Low",
      duration: "4-24 hours",
      downtime: "< 30 minutes",
      icon: Zap
    },
    {
      title: "Cross-Provider Migration",
      description: "Move from another hosting provider to our platform",
      complexity: "High",
      duration: "5-10 days",
      downtime: "< 4 hours",
      icon: Copy
    }
  ]

  const migrationSteps = [
    {
      step: 1,
      title: "Assessment & Planning",
      description: "Analyze current deployment and plan migration strategy",
      duration: "1-2 days",
      tasks: [
        "Infrastructure audit and documentation",
        "Data and configuration assessment",
        "Dependencies and integration mapping",
        "Migration timeline and risk assessment"
      ]
    },
    {
      step: 2,
      title: "Environment Setup",
      description: "Prepare and configure the new hosting environment",
      duration: "1-2 days",
      tasks: [
        "Provision new server infrastructure",
        "Install and configure VPN Enterprise",
        "Set up networking and security",
        "Configure monitoring and backups"
      ]
    },
    {
      step: 3,
      title: "Data Migration",
      description: "Transfer all data and configurations to new environment",
      duration: "1-3 days",
      tasks: [
        "Database migration and synchronization",
        "User account and configuration transfer",
        "SSL certificates and security settings",
        "Log history and audit trail migration"
      ]
    },
    {
      step: 4,
      title: "Testing & Validation",
      description: "Comprehensive testing to ensure everything works correctly",
      duration: "1-2 days",
      tasks: [
        "Functional testing of all features",
        "Performance and load testing",
        "Security validation and compliance checks",
        "User acceptance testing"
      ]
    },
    {
      step: 5,
      title: "Cutover & Go-Live",
      description: "Final switch to new environment with minimal downtime",
      duration: "2-4 hours",
      tasks: [
        "DNS updates and traffic routing",
        "Final data synchronization",
        "Service activation and monitoring",
        "Post-migration validation and support"
      ]
    }
  ]

  const migrationServices = [
    {
      icon: FileText,
      title: "Migration Planning",
      description: "Comprehensive assessment and detailed migration plan",
      included: ["Current system audit", "Risk assessment", "Timeline planning", "Rollback procedures"]
    },
    {
      icon: Database,
      title: "Data Migration",
      description: "Secure transfer of all data with zero data loss guarantee",
      included: ["Database migration", "File transfers", "Configuration sync", "Data validation"]
    },
    {
      icon: Settings,
      title: "System Configuration",
      description: "Complete setup and optimization of the new environment",
      included: ["Server provisioning", "VPN configuration", "Security setup", "Performance tuning"]
    },
    {
      icon: Shield,
      title: "Security Validation",
      description: "Ensure all security measures are properly configured",
      included: ["Security hardening", "SSL configuration", "Access controls", "Compliance validation"]
    }
  ]

  const migrationChecklist = [
    { category: "Pre-Migration", items: [
      "Document current configuration and settings",
      "Export user accounts and permissions",
      "Backup all data and configurations",
      "Test backup restoration procedures",
      "Notify users about planned migration",
      "Prepare rollback plan if needed"
    ]},
    { category: "During Migration", items: [
      "Monitor data transfer progress",
      "Validate data integrity throughout process",
      "Test system functionality at each stage",
      "Keep communication channels open with support",
      "Document any issues or deviations",
      "Maintain security protocols during transfer"
    ]},
    { category: "Post-Migration", items: [
      "Verify all services are operational",
      "Test user authentication and access",
      "Validate network connectivity and performance",
      "Update DNS and service endpoints",
      "Monitor system performance and logs",
      "Conduct user training if needed"
    ]}
  ]

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <ArrowRightLeft className="h-6 w-6 text-purple-600" />
          <h1 className="text-3xl font-bold">Migration Guide</h1>
          <Badge variant="secondary">Professional Support</Badge>
        </div>
        <p className="text-lg text-muted-foreground mb-6">
          Comprehensive migration services to move your VPN Enterprise deployment to our cloud hosting 
          with minimal downtime and zero data loss. Our migration specialists handle the entire process.
        </p>
        
        <div className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div>
            <p className="font-medium">Zero Data Loss Guarantee</p>
            <p className="text-sm text-muted-foreground">
              All migrations include comprehensive data validation and rollback procedures to ensure 100% data integrity
            </p>
          </div>
        </div>
      </div>

      {/* Migration Types */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Migration Scenarios</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {migrationTypes.map((type) => (
            <Card key={type.title}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <type.icon className="h-6 w-6 text-purple-600" />
                  <div>
                    <CardTitle className="text-lg">{type.title}</CardTitle>
                    <CardDescription>{type.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Complexity:</span>
                    <Badge variant={type.complexity === 'Low' ? 'default' : type.complexity === 'Medium' ? 'secondary' : 'destructive'}>
                      {type.complexity}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Duration:</span>
                    <span className="text-sm text-muted-foreground">{type.duration}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Downtime:</span>
                    <span className="text-sm text-muted-foreground">{type.downtime}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Migration Process */}
      <Tabs defaultValue="process" className="mb-12">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="process">Migration Process</TabsTrigger>
          <TabsTrigger value="services">Migration Services</TabsTrigger>
          <TabsTrigger value="checklist">Migration Checklist</TabsTrigger>
        </TabsList>
        
        <TabsContent value="process">
          <Card>
            <CardHeader>
              <CardTitle>5-Step Migration Process</CardTitle>
              <CardDescription>
                Our proven methodology ensures smooth migration with minimal disruption
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {migrationSteps.map((step) => (
                  <div key={step.step} className="relative">
                    <div className="flex items-start gap-4">
                      <div className="shrink-0">
                        <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                          {step.step}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold">{step.title}</h3>
                          <Badge variant="outline">{step.duration}</Badge>
                        </div>
                        <p className="text-muted-foreground mb-4">{step.description}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {step.tasks.map((task, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-sm">{task}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    {step.step < migrationSteps.length && (
                      <div className="absolute left-5 top-12 w-0.5 h-16 bg-border"></div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle>Professional Migration Services</CardTitle>
              <CardDescription>
                Comprehensive services included in all migration projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {migrationServices.map((service) => (
                  <Card key={service.title}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <service.icon className="h-6 w-6 text-purple-600" />
                        <CardTitle className="text-lg">{service.title}</CardTitle>
                      </div>
                      <CardDescription>{service.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {service.included.map((item) => (
                          <li key={item} className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="mt-8 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <h3 className="font-medium mb-2">What's Included in Every Migration:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ul className="text-sm space-y-1">
                    <li>• Dedicated migration specialist</li>
                    <li>• 24/7 support during migration</li>
                    <li>• Data integrity validation</li>
                    <li>• Performance optimization</li>
                  </ul>
                  <ul className="text-sm space-y-1">
                    <li>• Rollback procedures if needed</li>
                    <li>• Post-migration monitoring</li>
                    <li>• User training and documentation</li>
                    <li>• 30-day post-migration support</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="checklist">
          <Card>
            <CardHeader>
              <CardTitle>Migration Checklist</CardTitle>
              <CardDescription>
                Essential tasks and considerations for a successful migration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {migrationChecklist.map((section) => (
                  <div key={section.category}>
                    <h3 className="text-lg font-semibold mb-4">{section.category}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {section.items.map((item) => (
                        <div key={item} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                          <span className="text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Migration Pricing */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Migration Pricing</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Plan Upgrades</CardTitle>
              <div className="text-center text-2xl font-bold text-green-600">Free</div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Shared to VPS migration
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  VPS to Dedicated migration
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Same-day migration
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Data transfer assistance
                </li>
              </ul>
              <Button className="w-full mt-4" disabled>
                Included with Upgrade
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-center">Self-Hosted Migration</CardTitle>
              <div className="text-center text-2xl font-bold text-blue-600">$500</div>
              <div className="text-center text-sm text-muted-foreground">One-time fee</div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Full system migration
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Data and configuration transfer
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Testing and validation
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  30-day support included
                </li>
              </ul>
              <Button className="w-full mt-4">
                Start Migration
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-center">Enterprise Migration</CardTitle>
              <div className="text-center text-2xl font-bold text-purple-600">Custom</div>
              <div className="text-center text-sm text-muted-foreground">Contact for quote</div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Complex multi-server migrations
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Custom integrations
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Compliance requirements
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Dedicated project manager
                </li>
              </ul>
              <Button variant="outline" className="w-full mt-4">
                Get Custom Quote
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Timeline Examples */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Typical Migration Timelines</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Small Deployment
              </CardTitle>
              <CardDescription>&lt; 100 users, basic configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Assessment:</span>
                  <span>4-8 hours</span>
                </div>
                <div className="flex justify-between">
                  <span>Setup:</span>
                  <span>8-16 hours</span>
                </div>
                <div className="flex justify-between">
                  <span>Migration:</span>
                  <span>4-12 hours</span>
                </div>
                <div className="flex justify-between">
                  <span>Testing:</span>
                  <span>4-8 hours</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Total:</span>
                  <span>1-2 days</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Medium Deployment
              </CardTitle>
              <CardDescription>100-1000 users, custom integrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Assessment:</span>
                  <span>1-2 days</span>
                </div>
                <div className="flex justify-between">
                  <span>Setup:</span>
                  <span>1-2 days</span>
                </div>
                <div className="flex justify-between">
                  <span>Migration:</span>
                  <span>1-2 days</span>
                </div>
                <div className="flex justify-between">
                  <span>Testing:</span>
                  <span>1-2 days</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Total:</span>
                  <span>3-7 days</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Enterprise Deployment
              </CardTitle>
              <CardDescription>1000+ users, complex integrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Assessment:</span>
                  <span>2-3 days</span>
                </div>
                <div className="flex justify-between">
                  <span>Setup:</span>
                  <span>3-5 days</span>
                </div>
                <div className="flex justify-between">
                  <span>Migration:</span>
                  <span>2-4 days</span>
                </div>
                <div className="flex justify-between">
                  <span>Testing:</span>
                  <span>2-3 days</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Total:</span>
                  <span>7-14 days</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Risk Mitigation */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Risk Mitigation</h2>
        <Card>
          <CardHeader>
            <CardTitle>How We Minimize Migration Risks</CardTitle>
            <CardDescription>
              Comprehensive measures to ensure safe and successful migration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  Data Protection
                </h3>
                <ul className="space-y-2 text-sm">
                  <li>• Multiple backup copies before migration</li>
                  <li>• Encrypted data transfer protocols</li>
                  <li>• Real-time data validation checks</li>
                  <li>• Incremental sync to minimize transfer time</li>
                  <li>• Rollback procedures if issues arise</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Workflow className="h-5 w-5 text-blue-600" />
                  Process Controls
                </h3>
                <ul className="space-y-2 text-sm">
                  <li>• Detailed pre-migration testing</li>
                  <li>• Staged migration approach</li>
                  <li>• Continuous monitoring during transfer</li>
                  <li>• Automated validation procedures</li>
                  <li>• 24/7 expert support availability</li>
                </ul>
              </div>
            </div>
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h3 className="font-medium mb-2">Migration Success Rate: 99.8%</h3>
              <p className="text-sm text-muted-foreground">
                Based on over 1,000 completed migrations, our proven process ensures reliable results 
                with minimal downtime and zero data loss.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Get Started */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ready to Migrate?</CardTitle>
            <CardDescription>
              Start your migration journey with a free consultation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-green-600" />
                <span className="text-sm">Free migration consultation</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-green-600" />
                <span className="text-sm">Detailed timeline and planning</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-600" />
                <span className="text-sm">Risk assessment and mitigation</span>
              </div>
              <Button className="w-full">
                Schedule Migration Consultation
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Need More Information?</CardTitle>
            <CardDescription>
              Explore related documentation and resources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" asChild className="w-full justify-start">
                <Link href="/docs/cloud-hosting">
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Compare Hosting Plans
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full justify-start">
                <Link href="/docs/cloud-hosting/storage">
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Storage Solutions
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full justify-start">
                <Link href="/docs/cloud-hosting/networking">
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Networking Features
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact Section */}
      <div className="mt-12 p-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-purple-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-purple-900 dark:text-purple-100">Questions About Migration?</h3>
            <p className="text-sm text-purple-700 dark:text-purple-200 mt-1">
              Our migration specialists are available to discuss your specific requirements and provide 
              detailed planning assistance. Contact us for a free consultation and custom migration strategy.
            </p>
            <div className="mt-3 flex gap-3">
              <Button size="sm">
                Contact Migration Team
              </Button>
              <Button size="sm" variant="outline">
                Download Migration Guide
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}