import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Server, 
  Users, 
  Cpu, 
  HardDrive, 
  Network,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Shield,
  Clock,
  Phone,
  Settings
} from 'lucide-react'
import Link from 'next/link'

export default function VPSHostingPage() {
  const features = [
    {
      icon: Cpu,
      title: "Dedicated Resources",
      description: "Guaranteed CPU and memory allocation with no resource sharing"
    },
    {
      icon: Users,
      title: "Up to 500 Users",
      description: "Support for medium to large teams with excellent performance"
    },
    {
      icon: Settings,
      title: "Root Access",
      description: "Full administrative control to customize your VPN environment"
    },
    {
      icon: Phone,
      title: "Priority Support",
      description: "Phone and email support with faster response times"
    }
  ]

  const specifications = [
    { label: "CPU Cores", value: "4 vCPU (dedicated)" },
    { label: "RAM", value: "8 GB (dedicated)" },
    { label: "Storage", value: "200 GB NVMe SSD" },
    { label: "Bandwidth", value: "5 TB/month" },
    { label: "Max Users", value: "500 concurrent" },
    { label: "Backup", value: "Hourly automated" },
    { label: "Uptime SLA", value: "99.9%" },
    { label: "Support", value: "Phone + Email (4h response)" }
  ]

  const includedServices = [
    "Full VPN Enterprise deployment with custom configuration",
    "SSL certificates and domain management",
    "Advanced monitoring with custom alerts",
    "Hourly automated backups with 90-day retention",
    "Proactive security updates and patches",
    "Priority phone and email support",
    "Performance tuning and optimization",
    "Weekly detailed usage and performance reports",
    "Root access with optional server management",
    "Custom firewall rules and security hardening"
  ]

  const customizations = [
    "Custom VPN protocols and configurations",
    "Integration with existing authentication systems",
    "Custom branding and white-label options",
    "Advanced logging and compliance features",
    "Multi-region deployment coordination",
    "Load balancing and high availability setup",
    "Custom API integrations and webhooks",
    "Specialized security compliance (SOC2, HIPAA)"
  ]

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Server className="h-6 w-6 text-blue-600" />
          <h1 className="text-3xl font-bold">VPS Hosting</h1>
          <Badge variant="default">$99/month</Badge>
          <Badge variant="secondary">Most Popular</Badge>
        </div>
        <p className="text-lg text-muted-foreground mb-6">
          Dedicated virtual private server hosting with guaranteed resources, root access, 
          and advanced features. Perfect for growing businesses that need performance and control.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Button size="lg">
            Get Started with VPS Hosting
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="#pricing">View Detailed Pricing</Link>
          </Button>
        </div>
      </div>

      {/* Key Benefits */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Why Choose VPS Hosting</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <feature.icon className="h-6 w-6 text-blue-600" />
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

      {/* Performance Comparison */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Performance Advantage</h2>
        <Card>
          <CardHeader>
            <CardTitle>VPS vs Shared Hosting Performance</CardTitle>
            <CardDescription>
              See how dedicated resources improve your VPN performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">4x</div>
                <div className="text-sm font-medium mb-1">Faster Response</div>
                <div className="text-xs text-muted-foreground">Average API response time</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">5x</div>
                <div className="text-sm font-medium mb-1">More Throughput</div>
                <div className="text-xs text-muted-foreground">Concurrent connections</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">99.9%</div>
                <div className="text-sm font-medium mb-1">Uptime SLA</div>
                <div className="text-xs text-muted-foreground">Guaranteed availability</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information */}
      <Tabs defaultValue="specs" className="mb-12">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="specs">Specifications</TabsTrigger>
          <TabsTrigger value="included">What's Included</TabsTrigger>
          <TabsTrigger value="custom">Customizations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="specs">
          <Card>
            <CardHeader>
              <CardTitle>Server Specifications</CardTitle>
              <CardDescription>
                Dedicated VPS resources and performance characteristics
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
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-900 dark:text-green-100">Guaranteed Resources</h4>
                    <p className="text-sm text-green-700 dark:text-green-200">
                      All CPU, RAM, and storage resources are dedicated to your VPS with no sharing or performance impact from other users.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="included">
          <Card>
            <CardHeader>
              <CardTitle>Included Services</CardTitle>
              <CardDescription>
                Comprehensive services included in your VPS hosting plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {includedServices.map((service) => (
                  <li key={service} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                    <span>{service}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="custom">
          <Card>
            <CardHeader>
              <CardTitle>Available Customizations</CardTitle>
              <CardDescription>
                Advanced features and customizations available with VPS hosting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {customizations.map((customization) => (
                  <li key={customization} className="flex items-start gap-3">
                    <Settings className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                    <span>{customization}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm">
                  <strong>Need a custom configuration?</strong> Our solution architects can help design and implement 
                  specialized setups to meet your unique requirements. Custom configuration fees may apply.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Pricing Details */}
      <div id="pricing" className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Pricing & Plans</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Standard VPS - $99/month</CardTitle>
              <CardDescription>
                Most popular plan for growing businesses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">Base Plan Includes:</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Up to 500 concurrent users</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">200 GB NVMe SSD storage</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">5 TB monthly bandwidth</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Priority phone & email support</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Premium Add-ons</CardTitle>
              <CardDescription>
                Enhance your VPS with additional services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center justify-between">
                  <span className="text-sm">Additional CPU cores (per core)</span>
                  <span className="text-sm font-medium">+$25/month</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-sm">Extra RAM (per 4GB)</span>
                  <span className="text-sm font-medium">+$20/month</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-sm">Additional storage (per 100GB)</span>
                  <span className="text-sm font-medium">+$15/month</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-sm">DDoS protection</span>
                  <span className="text-sm font-medium">+$30/month</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-sm">Managed services</span>
                  <span className="text-sm font-medium">+$50/month</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-sm">High availability setup</span>
                  <span className="text-sm font-medium">+$80/month</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Setup Process */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Professional Setup Process</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">1</div>
                Consultation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Initial consultation to understand your requirements and design optimal configuration.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">2</div>
                Provisioning
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                VPS provisioning and security hardening with enterprise-grade configurations.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">3</div>
                Deployment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                VPN Enterprise installation, configuration, and integration with your systems.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">4</div>
                Go Live
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Testing, handover, and training to ensure smooth operation of your VPN infrastructure.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Migration from Shared */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Upgrade from Shared Hosting</h2>
        <Card>
          <CardHeader>
            <CardTitle>Seamless Migration Process</CardTitle>
            <CardDescription>
              Zero-downtime upgrade from shared hosting to VPS
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Migration Benefits:</h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Zero downtime migration</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">All data and configurations preserved</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Same-day migration available</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Free migration assistance</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Performance Improvements:</h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">4x faster API responses</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">5x more concurrent users</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Dedicated resources guarantee</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Advanced monitoring included</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-6">
              <Button asChild>
                <Link href="/docs/cloud-hosting/migration">
                  Start Migration Process <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Support & Contact */}
      <Card>
        <CardHeader>
          <CardTitle>Priority Support Included</CardTitle>
          <CardDescription>
            Professional support with faster response times and direct access to our engineers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <Phone className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Phone Support</h3>
              <p className="text-sm text-muted-foreground">Direct phone line during business hours</p>
            </div>
            <div className="text-center">
              <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">4-Hour Response</h3>
              <p className="text-sm text-muted-foreground">Guaranteed response within 4 hours</p>
            </div>
            <div className="text-center">
              <Shield className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Proactive Monitoring</h3>
              <p className="text-sm text-muted-foreground">24/7 system monitoring and alerts</p>
            </div>
          </div>
          <div className="mt-6 flex justify-center gap-4">
            <Button>Get Started with VPS</Button>
            <Button variant="outline">Contact Sales Team</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}