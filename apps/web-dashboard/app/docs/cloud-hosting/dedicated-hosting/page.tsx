import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Cpu, 
  Users, 
  Server, 
  HardDrive, 
  Network,
  CheckCircle,
  Crown,
  ArrowRight,
  Shield,
  Clock,
  Phone,
  Settings,
  Zap,
  Database
} from 'lucide-react'
import Link from 'next/link'

export default function DedicatedHostingPage() {
  const features = [
    {
      icon: Crown,
      title: "Full Server Control",
      description: "Complete administrative control with root access and custom configurations"
    },
    {
      icon: Users,
      title: "Unlimited Users",
      description: "No limits on concurrent users - scale to support your entire organization"
    },
    {
      icon: Zap,
      title: "Maximum Performance",
      description: "Dedicated hardware resources for optimal speed and responsiveness"
    },
    {
      icon: Phone,
      title: "24/7 Phone Support",
      description: "Direct phone access to senior engineers around the clock"
    }
  ]

  const specifications = [
    { label: "CPU Cores", value: "16 vCPU (dedicated)" },
    { label: "RAM", value: "32 GB (dedicated)" },
    { label: "Storage", value: "1 TB NVMe SSD + 2 TB HDD" },
    { label: "Bandwidth", value: "Unlimited" },
    { label: "Max Users", value: "Unlimited" },
    { label: "Backup", value: "Real-time + Hourly snapshots" },
    { label: "Uptime SLA", value: "99.95%" },
    { label: "Support", value: "24/7 Phone + Priority Email" }
  ]

  const enterpriseServices = [
    "Fully managed dedicated server with 24/7 monitoring",
    "Custom VPN Enterprise deployment with enterprise features",
    "Multi-domain SSL certificates and DNS management",
    "Real-time monitoring with custom dashboards and alerting",
    "Continuous backup with instant recovery options",
    "Proactive security management and compliance reporting",
    "24/7 priority phone support with dedicated account manager",
    "Performance optimization and capacity planning",
    "Full root access with optional managed services",
    "Custom firewall, IDS/IPS, and security hardening",
    "High availability and disaster recovery planning",
    "Compliance assistance (SOC2, HIPAA, PCI-DSS)"
  ]

  const enterpriseFeatures = [
    {
      title: "High Availability Setup",
      description: "Redundant server configuration with automatic failover",
      included: true
    },
    {
      title: "Load Balancing",
      description: "Advanced load balancing for optimal resource distribution",
      included: true
    },
    {
      title: "Custom Integrations",
      description: "Integration with enterprise systems (LDAP, SAML, etc.)",
      included: true
    },
    {
      title: "White-label Branding",
      description: "Complete customization of VPN client and dashboard",
      included: true
    },
    {
      title: "Advanced Analytics",
      description: "Detailed reporting and analytics with custom dashboards",
      included: true
    },
    {
      title: "Compliance Features",
      description: "Built-in compliance tools and audit logging",
      included: true
    },
    {
      title: "API Access",
      description: "Full API access for custom integrations and automation",
      included: true
    },
    {
      title: "Multi-region Support",
      description: "Deploy across multiple data centers for global coverage",
      addOn: "$200/month per additional region"
    }
  ]

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Crown className="h-6 w-6 text-purple-600" />
          <h1 className="text-3xl font-bold">Dedicated Hosting</h1>
          <Badge variant="default">$299/month</Badge>
          <Badge className="bg-purple-600">Enterprise</Badge>
        </div>
        <p className="text-lg text-muted-foreground mb-6">
          Enterprise-grade dedicated server hosting with unlimited users, maximum performance, 
          and comprehensive support. The ultimate solution for large organizations and high-traffic deployments.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Button size="lg">
            Get Started with Dedicated Hosting
          </Button>
          <Button variant="outline" size="lg">
            Schedule Enterprise Consultation
          </Button>
        </div>
      </div>

      {/* Enterprise Benefits */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Enterprise-Grade Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <feature.icon className="h-6 w-6 text-purple-600" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Performance at Scale</h2>
        <Card>
          <CardHeader>
            <CardTitle>Dedicated Server Performance</CardTitle>
            <CardDescription>
              Engineered for enterprise workloads and unlimited scalability
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">10,000+</div>
                <div className="text-sm font-medium mb-1">Concurrent Users</div>
                <div className="text-xs text-muted-foreground">Tested capacity</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">&lt;5ms</div>
                <div className="text-sm font-medium mb-1">API Response</div>
                <div className="text-xs text-muted-foreground">Average latency</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">99.95%</div>
                <div className="text-sm font-medium mb-1">Uptime SLA</div>
                <div className="text-xs text-muted-foreground">Guaranteed availability</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">24/7</div>
                <div className="text-sm font-medium mb-1">Phone Support</div>
                <div className="text-xs text-muted-foreground">Direct engineer access</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information */}
      <Tabs defaultValue="specs" className="mb-12">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="specs">Specifications</TabsTrigger>
          <TabsTrigger value="services">Enterprise Services</TabsTrigger>
          <TabsTrigger value="features">Advanced Features</TabsTrigger>
        </TabsList>
        
        <TabsContent value="specs">
          <Card>
            <CardHeader>
              <CardTitle>Dedicated Server Specifications</CardTitle>
              <CardDescription>
                High-performance dedicated hardware exclusively for your deployment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {specifications.map((spec) => (
                  <div key={spec.label} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="font-medium">{spec.label}</span>
                    <span className="text-muted-foreground">{spec.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <Server className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-purple-900 dark:text-purple-100">Dedicated Hardware</h4>
                    <p className="text-sm text-purple-700 dark:text-purple-200">
                      Your dedicated server runs on enterprise-grade hardware with redundant components, 
                      ensuring maximum uptime and performance for mission-critical applications.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle>Comprehensive Enterprise Services</CardTitle>
              <CardDescription>
                Full-service managed hosting with enterprise support and features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {enterpriseServices.map((service) => (
                  <li key={service} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                    <span>{service}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Enterprise Features</CardTitle>
              <CardDescription>
                Cutting-edge features designed for enterprise deployments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {enterpriseFeatures.map((feature) => (
                  <div key={feature.title} className="flex items-start gap-3 p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{feature.title}</h3>
                        {feature.included && <Badge variant="secondary" className="text-xs">Included</Badge>}
                        {feature.addOn && <Badge variant="outline" className="text-xs">Add-on</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                      {feature.addOn && (
                        <p className="text-sm font-medium text-blue-600 mt-1">{feature.addOn}</p>
                      )}
                    </div>
                    {feature.included ? (
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                    ) : (
                      <Settings className="h-5 w-5 text-blue-600 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Pricing */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Enterprise Pricing</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-purple-600">Most Comprehensive</Badge>
            </div>
            <CardHeader className="pt-8">
              <CardTitle>Dedicated Server - $299/month</CardTitle>
              <CardDescription>
                Everything included for enterprise deployments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-4">
                  <div className="text-3xl font-bold">$299</div>
                  <div className="text-sm text-muted-foreground">per month, billed annually</div>
                  <div className="text-xs text-muted-foreground mt-1">$329/month if billed monthly</div>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">Everything Included:</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Unlimited concurrent users</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">1 TB NVMe + 2 TB HDD storage</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Unlimited bandwidth</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">24/7 priority phone support</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Dedicated account manager</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">All enterprise features</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Custom Enterprise Solutions</CardTitle>
              <CardDescription>
                Tailored solutions for unique requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">Available Enhancements:</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center justify-between">
                      <span className="text-sm">Additional server nodes</span>
                      <span className="text-sm font-medium">+$250/month each</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="text-sm">Multi-region deployment</span>
                      <span className="text-sm font-medium">+$200/month per region</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="text-sm">Advanced DDoS protection</span>
                      <span className="text-sm font-medium">+$100/month</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="text-sm">Compliance audit support</span>
                      <span className="text-sm font-medium">Custom pricing</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="text-sm">24/7 on-site support</span>
                      <span className="text-sm font-medium">Custom pricing</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-2">Volume Discounts:</h3>
                  <p className="text-sm text-muted-foreground">
                    Organizations deploying multiple dedicated servers or requiring 
                    custom enterprise solutions may qualify for volume pricing. 
                    Contact our enterprise team for a custom quote.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Enterprise Setup Process */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">White-Glove Setup Process</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm">1</div>
                Enterprise Consultation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Comprehensive needs assessment with solution architects and technical planning session.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm">2</div>
                Infrastructure Design
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Custom architecture design, security planning, and integration strategy development.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm">3</div>
                Professional Deployment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Dedicated server provisioning, VPN Enterprise deployment, and enterprise integrations.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm">4</div>
                Launch & Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Comprehensive testing, staff training, and ongoing 24/7 enterprise support activation.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Success Stories */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Enterprise Success</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Global Financial Services</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                "Dedicated hosting enabled us to support 15,000+ remote employees across 40+ countries 
                with enterprise-grade security and compliance."
              </p>
              <div className="text-xs text-muted-foreground">
                <strong>Scale:</strong> 15,000 users • <strong>Uptime:</strong> 99.98%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Healthcare Organization</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                "HIPAA-compliant dedicated infrastructure with real-time monitoring and 
                audit logging for our distributed healthcare network."
              </p>
              <div className="text-xs text-muted-foreground">
                <strong>Scale:</strong> 8,000 users • <strong>Compliance:</strong> HIPAA, SOC2
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Technology Startup</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                "Scalable dedicated hosting grew with us from 500 to 25,000+ users with 
                seamless performance and 24/7 support."
              </p>
              <div className="text-xs text-muted-foreground">
                <strong>Scale:</strong> 25,000+ users • <strong>Growth:</strong> 5000% in 2 years
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Contact Section */}
      <Card className="text-center">
        <CardHeader>
          <CardTitle>Ready for Enterprise-Grade VPN Hosting?</CardTitle>
          <CardDescription>
            Get started with dedicated hosting or schedule a consultation with our enterprise team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg">
              Get Started Now
            </Button>
            <Button variant="outline" size="lg">
              Schedule Enterprise Consultation
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/docs/cloud-hosting/migration">
                Migration Guide <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              24/7 Phone Support
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              99.95% Uptime SLA
            </div>
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Dedicated Account Manager
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}