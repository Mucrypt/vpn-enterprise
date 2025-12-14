import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Globe, 
  Users, 
  Cpu, 
  HardDrive, 
  Network,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  DollarSign,
  Clock,
  Mail
} from 'lucide-react'
import Link from 'next/link'

export default function SharedHostingPage() {
  const features = [
    {
      icon: DollarSign,
      title: "Cost Effective",
      description: "Shared infrastructure keeps costs low while providing professional VPN hosting"
    },
    {
      icon: Users,
      title: "Up to 100 Users",
      description: "Perfect for small to medium teams with concurrent user management"
    },
    {
      icon: Clock,
      title: "Quick Setup",
      description: "Deploy your VPN infrastructure in under 24 hours"
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "Professional support during business hours via email"
    }
  ]

  const specifications = [
    { label: "CPU Cores", value: "2 vCPU (shared)" },
    { label: "RAM", value: "4 GB (shared)" },
    { label: "Storage", value: "100 GB SSD" },
    { label: "Bandwidth", value: "1 TB/month" },
    { label: "Max Users", value: "100 concurrent" },
    { label: "Backup", value: "Daily automated" },
    { label: "Uptime SLA", value: "99.5%" },
    { label: "Support", value: "Email (24h response)" }
  ]

  const includedServices = [
    "VPN Enterprise installation and configuration",
    "SSL certificates and domain setup",
    "Basic monitoring and alerting",
    "Daily automated backups",
    "Security patches and updates",
    "Email support during business hours",
    "Basic performance optimization",
    "Monthly usage reports"
  ]

  const limitations = [
    "Shared CPU and memory resources",
    "Limited customization options",
    "No root access to server",
    "Standard backup retention (30 days)",
    "Email support only (no phone/chat)",
    "Cannot install custom software",
    "Limited to standard configurations"
  ]

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="h-6 w-6 text-green-600" />
          <h1 className="text-3xl font-bold">Shared Hosting</h1>
          <Badge variant="secondary">$29/month</Badge>
        </div>
        <p className="text-lg text-muted-foreground mb-6">
          Cost-effective VPN hosting solution perfect for small businesses and startups. 
          Get professional VPN infrastructure without the complexity of server management.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Button size="lg">
            Get Started with Shared Hosting
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="#pricing">View Detailed Pricing</Link>
          </Button>
        </div>
      </div>

      {/* Overview */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Why Choose Shared Hosting</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <feature.icon className="h-6 w-6 text-green-600" />
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

      {/* Specifications */}
      <Tabs defaultValue="specs" className="mb-12">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="specs">Specifications</TabsTrigger>
          <TabsTrigger value="included">What's Included</TabsTrigger>
          <TabsTrigger value="limitations">Limitations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="specs">
          <Card>
            <CardHeader>
              <CardTitle>Server Specifications</CardTitle>
              <CardDescription>
                Shared hosting resources and performance characteristics
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
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="included">
          <Card>
            <CardHeader>
              <CardTitle>Included Services</CardTitle>
              <CardDescription>
                Everything included in your shared hosting plan
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
        
        <TabsContent value="limitations">
          <Card>
            <CardHeader>
              <CardTitle>Plan Limitations</CardTitle>
              <CardDescription>
                Understanding the constraints of shared hosting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {limitations.map((limitation) => (
                  <li key={limitation} className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                    <span>{limitation}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm">
                  <strong>Need more flexibility?</strong> Consider upgrading to 
                  <Link href="/docs/cloud-hosting/vps-hosting" className="text-blue-600 hover:underline ml-1">
                    VPS Hosting
                  </Link> for dedicated resources and root access.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Pricing Details */}
      <div id="pricing" className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Pricing & Plans</h2>
        <Card>
          <CardHeader>
            <CardTitle>Shared Hosting - $29/month</CardTitle>
            <CardDescription>
              Billed monthly with no long-term contracts required
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Base Plan Includes:</h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Up to 100 concurrent users</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">100 GB SSD storage</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">1 TB monthly bandwidth</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Email support</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Optional Add-ons:</h3>
                <ul className="space-y-2">
                  <li className="flex items-center justify-between">
                    <span className="text-sm">Additional storage (per 50GB)</span>
                    <span className="text-sm font-medium">+$10/month</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-sm">Extra bandwidth (per 500GB)</span>
                    <span className="text-sm font-medium">+$5/month</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-sm">Priority email support</span>
                    <span className="text-sm font-medium">+$15/month</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-sm">Extended backup retention</span>
                    <span className="text-sm font-medium">+$8/month</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Setup Process */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Getting Started</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm">1</div>
                Order & Payment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Complete the order form with your requirements and make payment. 
                Setup begins immediately after payment confirmation.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm">2</div>
                Deployment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Our team deploys and configures your VPN infrastructure. 
                You'll receive access credentials within 12-24 hours.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm">3</div>
                Go Live
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Access your VPN dashboard, configure users, and start using your 
                professional VPN infrastructure immediately.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Comparison */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Compare Hosting Options</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Shared Hosting</CardTitle>
              <div className="text-center text-2xl font-bold text-green-600">$29/mo</div>
              <Badge className="w-fit mx-auto">Current Plan</Badge>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Up to 100 users</li>
                <li>• Shared resources</li>
                <li>• Email support</li>
                <li>• 99.5% uptime SLA</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-center">VPS Hosting</CardTitle>
              <div className="text-center text-2xl font-bold">$99/mo</div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Up to 500 users</li>
                <li>• Dedicated resources</li>
                <li>• Priority support</li>
                <li>• 99.9% uptime SLA</li>
              </ul>
              <Button variant="outline" size="sm" className="w-full mt-4" asChild>
                <Link href="/docs/cloud-hosting/vps-hosting">
                  Compare VPS <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-center">Dedicated</CardTitle>
              <div className="text-center text-2xl font-bold">$299/mo</div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Unlimited users</li>
                <li>• Full server control</li>
                <li>• 24/7 phone support</li>
                <li>• 99.9% uptime SLA</li>
              </ul>
              <Button variant="outline" size="sm" className="w-full mt-4" asChild>
                <Link href="/docs/cloud-hosting/dedicated-hosting">
                  Compare Dedicated <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Support Information */}
      <Card>
        <CardHeader>
          <CardTitle>Support & Migration</CardTitle>
          <CardDescription>
            Need help or want to upgrade? We're here to assist.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Get Support</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Email support is available during business hours with guaranteed 24-hour response time.
              </p>
              <Button size="sm">Contact Support</Button>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Upgrade Anytime</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Need more resources? Upgrade to VPS or dedicated hosting with zero downtime migration.
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/docs/cloud-hosting/migration">
                  Plan Upgrade <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}