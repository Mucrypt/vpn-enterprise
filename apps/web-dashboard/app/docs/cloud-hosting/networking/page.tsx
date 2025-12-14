import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Network, 
  Globe, 
  Shield, 
  Zap, 
  BarChart3,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Router,
  Cloud,
  Activity,
  Settings
} from 'lucide-react'
import Link from 'next/link'

export default function NetworkingPage() {
  const networkingFeatures = [
    {
      title: "Load Balancing",
      description: "Distribute traffic across multiple servers for optimal performance",
      icon: BarChart3,
      features: ["Round-robin distribution", "Health checks", "Automatic failover", "SSL termination"],
      plans: ["VPS (Basic)", "Dedicated (Advanced)"]
    },
    {
      title: "Content Delivery Network",
      description: "Global CDN to accelerate content delivery worldwide",
      icon: Globe,
      features: ["120+ edge locations", "DDoS protection", "SSL acceleration", "Real-time analytics"],
      plans: ["All plans (Premium feature)"]
    },
    {
      title: "Network Security",
      description: "Advanced security features to protect your VPN infrastructure",
      icon: Shield,
      features: ["WAF protection", "DDoS mitigation", "IP whitelisting", "Rate limiting"],
      plans: ["VPS", "Dedicated"]
    },
    {
      title: "Performance Optimization",
      description: "Advanced networking optimizations for maximum speed",
      icon: Zap,
      features: ["TCP optimization", "Bandwidth shaping", "QoS management", "Connection pooling"],
      plans: ["Dedicated (Included)"]
    }
  ]

  const networkingSpecs = {
    shared: {
      bandwidth: "1 TB/month",
      connections: "1,000 concurrent",
      locations: "Single region",
      loadBalancing: "Not available",
      cdn: "Basic CDN",
      ddos: "Basic protection"
    },
    vps: {
      bandwidth: "5 TB/month",
      connections: "5,000 concurrent",
      locations: "Multi-region available",
      loadBalancing: "Basic load balancing",
      cdn: "Premium CDN",
      ddos: "Advanced protection"
    },
    dedicated: {
      bandwidth: "Unlimited",
      connections: "Unlimited",
      locations: "Global deployment",
      loadBalancing: "Advanced load balancing",
      cdn: "Enterprise CDN",
      ddos: "Enterprise protection"
    }
  }

  const cdnLocations = [
    { region: "North America", locations: 25, cities: ["New York", "Los Angeles", "Chicago", "Toronto"] },
    { region: "Europe", locations: 30, cities: ["London", "Frankfurt", "Paris", "Amsterdam"] },
    { region: "Asia Pacific", locations: 20, cities: ["Tokyo", "Singapore", "Sydney", "Mumbai"] },
    { region: "South America", locations: 8, cities: ["São Paulo", "Buenos Aires", "Lima"] },
    { region: "Middle East & Africa", locations: 12, cities: ["Dubai", "Cape Town", "Tel Aviv"] }
  ]

  const optimizationFeatures = [
    {
      icon: Router,
      title: "Intelligent Routing",
      description: "Dynamic routing optimization based on real-time network conditions"
    },
    {
      icon: Activity,
      title: "Real-time Monitoring",
      description: "Continuous monitoring of network performance and automatic adjustments"
    },
    {
      icon: Cloud,
      title: "Multi-Cloud Support",
      description: "Deploy across multiple cloud providers for maximum resilience"
    },
    {
      icon: Settings,
      title: "Custom Configurations",
      description: "Tailor networking settings to your specific requirements"
    }
  ]

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Network className="h-6 w-6 text-blue-600" />
          <h1 className="text-3xl font-bold">Networking Solutions</h1>
          <Badge variant="secondary">Global Infrastructure</Badge>
        </div>
        <p className="text-lg text-muted-foreground mb-6">
          Advanced networking features including load balancing, CDN, DDoS protection, and global deployment 
          options to ensure optimal performance and security for your VPN Enterprise deployment.
        </p>
        
        <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <Globe className="h-5 w-5 text-blue-600" />
          <div>
            <p className="font-medium">Global Network Infrastructure</p>
            <p className="text-sm text-muted-foreground">
              120+ edge locations worldwide with intelligent routing and automatic failover capabilities
            </p>
          </div>
        </div>
      </div>

      {/* Networking Features */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Networking Features</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {networkingFeatures.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <feature.icon className="h-6 w-6 text-blue-600" />
                  <div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Key Features:</h4>
                    <ul className="space-y-1">
                      {feature.features.map((item) => (
                        <li key={item} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Available in:</h4>
                    <div className="flex gap-2">
                      {feature.plans.map((plan) => (
                        <Badge key={plan} variant="outline" className="text-xs">
                          {plan}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Networking Specifications */}
      <Tabs defaultValue="specifications" className="mb-12">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="specifications">Plan Specifications</TabsTrigger>
          <TabsTrigger value="cdn">CDN Locations</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>
        
        <TabsContent value="specifications">
          <Card>
            <CardHeader>
              <CardTitle>Networking Specifications by Plan</CardTitle>
              <CardDescription>
                Detailed networking capabilities and limits for each hosting plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-center text-lg">Shared Hosting</CardTitle>
                    <div className="text-center text-2xl font-bold text-green-600">$29/mo</div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-center justify-between">
                        <span>Bandwidth:</span>
                        <strong>{networkingSpecs.shared.bandwidth}</strong>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Connections:</span>
                        <strong>{networkingSpecs.shared.connections}</strong>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Locations:</span>
                        <strong>{networkingSpecs.shared.locations}</strong>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Load Balancing:</span>
                        <strong>{networkingSpecs.shared.loadBalancing}</strong>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>CDN:</span>
                        <strong>{networkingSpecs.shared.cdn}</strong>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>DDoS Protection:</span>
                        <strong>{networkingSpecs.shared.ddos}</strong>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-center text-lg">VPS Hosting</CardTitle>
                    <div className="text-center text-2xl font-bold text-blue-600">$99/mo</div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-center justify-between">
                        <span>Bandwidth:</span>
                        <strong>{networkingSpecs.vps.bandwidth}</strong>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Connections:</span>
                        <strong>{networkingSpecs.vps.connections}</strong>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Locations:</span>
                        <strong>{networkingSpecs.vps.locations}</strong>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Load Balancing:</span>
                        <strong>{networkingSpecs.vps.loadBalancing}</strong>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>CDN:</span>
                        <strong>{networkingSpecs.vps.cdn}</strong>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>DDoS Protection:</span>
                        <strong>{networkingSpecs.vps.ddos}</strong>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-center text-lg">Dedicated</CardTitle>
                    <div className="text-center text-2xl font-bold text-purple-600">$299/mo</div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-center justify-between">
                        <span>Bandwidth:</span>
                        <strong>{networkingSpecs.dedicated.bandwidth}</strong>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Connections:</span>
                        <strong>{networkingSpecs.dedicated.connections}</strong>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Locations:</span>
                        <strong>{networkingSpecs.dedicated.locations}</strong>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Load Balancing:</span>
                        <strong>{networkingSpecs.dedicated.loadBalancing}</strong>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>CDN:</span>
                        <strong>{networkingSpecs.dedicated.cdn}</strong>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>DDoS Protection:</span>
                        <strong>{networkingSpecs.dedicated.ddos}</strong>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-8 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h3 className="font-medium mb-2">Additional Networking Add-ons:</h3>
                <ul className="text-sm space-y-1">
                  <li>• <strong>Additional bandwidth:</strong> $0.10 per GB over limit</li>
                  <li>• <strong>Premium CDN:</strong> +$20/month for enhanced global performance</li>
                  <li>• <strong>Advanced DDoS protection:</strong> +$50/month for enterprise-grade protection</li>
                  <li>• <strong>Private network peering:</strong> Custom pricing based on requirements</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="cdn">
          <Card>
            <CardHeader>
              <CardTitle>Global CDN Network</CardTitle>
              <CardDescription>
                Our content delivery network spans 120+ locations worldwide for optimal performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {cdnLocations.map((location) => (
                    <Card key={location.region}>
                      <CardHeader>
                        <CardTitle className="text-lg">{location.region}</CardTitle>
                        <Badge variant="secondary">{location.locations} locations</Badge>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Major Cities:</h4>
                          <ul className="text-sm text-muted-foreground">
                            {location.cities.map((city) => (
                              <li key={city}>• {city}</li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">&lt;50ms</div>
                    <div className="text-sm font-medium mb-1">Global Latency</div>
                    <div className="text-xs text-muted-foreground">Average response time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">99.9%</div>
                    <div className="text-sm font-medium mb-1">CDN Uptime</div>
                    <div className="text-xs text-muted-foreground">Guaranteed availability</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">10Tbps</div>
                    <div className="text-sm font-medium mb-1">Network Capacity</div>
                    <div className="text-xs text-muted-foreground">Total bandwidth</div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h3 className="font-medium mb-2">CDN Features:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ul className="text-sm space-y-1">
                      <li>• HTTP/2 and HTTP/3 support</li>
                      <li>• Intelligent caching algorithms</li>
                      <li>• Real-time cache purging</li>
                      <li>• Custom cache rules</li>
                    </ul>
                    <ul className="text-sm space-y-1">
                      <li>• Image and video optimization</li>
                      <li>• Brotli and Gzip compression</li>
                      <li>• Edge computing capabilities</li>
                      <li>• WebSocket support</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="optimization">
          <Card>
            <CardHeader>
              <CardTitle>Performance Optimization</CardTitle>
              <CardDescription>
                Advanced networking optimizations to maximize speed and reliability
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {optimizationFeatures.map((feature) => (
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

                <div>
                  <h3 className="text-lg font-semibold mb-4">Advanced Optimization Techniques</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">TCP/UDP Optimizations:</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          TCP window scaling
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Congestion control algorithms
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Selective acknowledgment
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Bandwidth delay product optimization
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-3">Application Layer Optimizations:</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Connection multiplexing
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Keep-alive optimizations
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Protocol-specific tuning
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          SSL/TLS optimization
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Quality of Service (QoS)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Traffic Prioritization</h4>
                      <p className="text-sm text-muted-foreground">
                        Prioritize critical VPN traffic over less important background processes
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Bandwidth Allocation</h4>
                      <p className="text-sm text-muted-foreground">
                        Guarantee minimum bandwidth for different types of traffic
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Latency Management</h4>
                      <p className="text-sm text-muted-foreground">
                        Minimize latency for real-time communications and applications
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Load Balancing Details */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Load Balancing & High Availability</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Load Balancing Methods</CardTitle>
              <CardDescription>
                Multiple algorithms to distribute traffic optimally
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium mb-1">Round Robin</h4>
                  <p className="text-sm text-muted-foreground">
                    Distribute requests evenly across all available servers
                  </p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium mb-1">Least Connections</h4>
                  <p className="text-sm text-muted-foreground">
                    Route to server with fewest active connections
                  </p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium mb-1">Weighted Round Robin</h4>
                  <p className="text-sm text-muted-foreground">
                    Assign different weights based on server capacity
                  </p>
                </div>
                <div className="p-3 border rounded-lg">
                  <h4 className="font-medium mb-1">Geographic</h4>
                  <p className="text-sm text-muted-foreground">
                    Route users to nearest server based on location
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Health Monitoring</CardTitle>
              <CardDescription>
                Continuous monitoring to ensure optimal availability
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium">Automatic Health Checks</div>
                    <div className="text-sm text-muted-foreground">Regular health monitoring of all servers</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium">Instant Failover</div>
                    <div className="text-sm text-muted-foreground">Automatic traffic rerouting when issues detected</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium">Custom Health Endpoints</div>
                    <div className="text-sm text-muted-foreground">Configure custom health check endpoints</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium">Alerting & Notifications</div>
                    <div className="text-sm text-muted-foreground">Real-time alerts for any issues detected</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Security Features */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Network Security</h2>
        <Card>
          <CardHeader>
            <CardTitle>Multi-Layer Protection</CardTitle>
            <CardDescription>
              Comprehensive security measures to protect your VPN infrastructure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold">DDoS Protection</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    Layer 3/4 protection
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    Application layer filtering
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    Real-time attack mitigation
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    Up to 100 Gbps protection
                  </li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold">Web Application Firewall</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    OWASP Top 10 protection
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    Custom rule sets
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    Bot protection
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    Rate limiting
                  </li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold">Access Control</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    IP whitelisting/blacklisting
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    Geographic restrictions
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    User agent filtering
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    SSL/TLS enforcement
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Network Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Get a comprehensive assessment of your networking requirements and recommendations.
            </p>
            <Button className="w-full">
              Schedule Assessment
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance Testing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Test your current network performance and identify optimization opportunities.
            </p>
            <Button variant="outline" className="w-full">
              Run Speed Test
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5" />
              Migration Planning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Plan your migration with networking considerations and optimization strategies.
            </p>
            <Button variant="outline" asChild className="w-full">
              <Link href="/docs/cloud-hosting/migration">
                Migration Guide
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Contact Section */}
      <div className="mt-12 p-6 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-amber-900 dark:text-amber-100">Need Custom Networking?</h3>
            <p className="text-sm text-amber-700 dark:text-amber-200 mt-1">
              Have complex networking requirements or need enterprise-grade solutions? Our network engineers 
              can design custom architectures including private peering, dedicated circuits, and multi-cloud deployments.
            </p>
            <div className="mt-3">
              <Button size="sm" variant="outline">
                Consult Network Engineer
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}