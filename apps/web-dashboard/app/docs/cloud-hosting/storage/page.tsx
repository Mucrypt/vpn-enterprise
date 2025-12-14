import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  HardDrive, 
  Database, 
  Shield, 
  Copy, 
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Clock,
  Lock,
  Archive,
  CloudUpload
} from 'lucide-react'
import Link from 'next/link'

export default function StoragePage() {
  const storageOptions = [
    {
      title: "SSD Storage",
      description: "High-performance NVMe SSD storage for optimal performance",
      icon: HardDrive,
      features: ["Ultra-fast read/write speeds", "Low latency operations", "Enterprise-grade reliability"],
      plans: [
        { name: "Shared", storage: "100 GB SSD" },
        { name: "VPS", storage: "200 GB NVMe SSD" },
        { name: "Dedicated", storage: "1 TB NVMe SSD" }
      ]
    },
    {
      title: "Database Storage",
      description: "Optimized storage for VPN user data and configuration",
      icon: Database,
      features: ["Automatic indexing", "Real-time replication", "ACID compliance"],
      plans: [
        { name: "Shared", storage: "5 GB database" },
        { name: "VPS", storage: "25 GB database" },
        { name: "Dedicated", storage: "100 GB database" }
      ]
    },
    {
      title: "Log Storage",
      description: "Secure storage for audit logs and activity monitoring",
      icon: Archive,
      features: ["Encrypted at rest", "Compliance ready", "Long-term retention"],
      plans: [
        { name: "Shared", storage: "10 GB logs" },
        { name: "VPS", storage: "50 GB logs" },
        { name: "Dedicated", storage: "500 GB logs" }
      ]
    }
  ]

  const backupFeatures = [
    {
      plan: "Shared Hosting",
      frequency: "Daily",
      retention: "30 days",
      encryption: "AES-256",
      recovery: "Self-service restore",
      cost: "Included"
    },
    {
      plan: "VPS Hosting",
      frequency: "Hourly",
      retention: "90 days",
      encryption: "AES-256",
      recovery: "Point-in-time restore",
      cost: "Included"
    },
    {
      plan: "Dedicated Hosting",
      frequency: "Real-time + Hourly snapshots",
      retention: "1 year",
      encryption: "AES-256",
      recovery: "Instant recovery",
      cost: "Included"
    }
  ]

  const securityFeatures = [
    {
      icon: Lock,
      title: "Encryption at Rest",
      description: "All data encrypted with AES-256 encryption"
    },
    {
      icon: Shield,
      title: "Encryption in Transit",
      description: "TLS 1.3 for all data transfers and replication"
    },
    {
      icon: Copy,
      title: "Redundant Storage",
      description: "Multiple copies across different physical locations"
    },
    {
      icon: Clock,
      title: "Version Control",
      description: "Track and restore previous versions of configurations"
    }
  ]

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <HardDrive className="h-6 w-6 text-blue-600" />
          <h1 className="text-3xl font-bold">Storage Solutions</h1>
          <Badge variant="secondary">Secure & Scalable</Badge>
        </div>
        <p className="text-lg text-muted-foreground mb-6">
          Comprehensive storage solutions for your VPN Enterprise deployment with automatic backups, 
          encryption, and scalable capacity to meet your growing needs.
        </p>
        
        <div className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div>
            <p className="font-medium">Enterprise-Grade Security</p>
            <p className="text-sm text-muted-foreground">
              All storage solutions include encryption at rest, automated backups, and compliance-ready features
            </p>
          </div>
        </div>
      </div>

      {/* Storage Options */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Storage Types</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {storageOptions.map((option) => (
            <Card key={option.title}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <option.icon className="h-6 w-6 text-blue-600" />
                  <CardTitle className="text-lg">{option.title}</CardTitle>
                </div>
                <CardDescription>{option.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Key Features:</h4>
                    <ul className="space-y-1">
                      {option.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">By Plan:</h4>
                    <ul className="space-y-1">
                      {option.plans.map((plan) => (
                        <li key={plan.name} className="flex items-center justify-between text-sm">
                          <span>{plan.name}:</span>
                          <span className="font-medium">{plan.storage}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Storage Specifications */}
      <Tabs defaultValue="specifications" className="mb-12">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="specifications">Specifications</TabsTrigger>
          <TabsTrigger value="backup">Backup & Recovery</TabsTrigger>
          <TabsTrigger value="security">Security Features</TabsTrigger>
        </TabsList>
        
        <TabsContent value="specifications">
          <Card>
            <CardHeader>
              <CardTitle>Storage Specifications by Plan</CardTitle>
              <CardDescription>
                Detailed storage allocations and performance characteristics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-center text-lg">Shared Hosting</CardTitle>
                      <div className="text-center text-2xl font-bold text-green-600">$29/mo</div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li className="flex justify-between">
                          <span>Primary Storage:</span>
                          <strong>100 GB SSD</strong>
                        </li>
                        <li className="flex justify-between">
                          <span>Database:</span>
                          <strong>5 GB</strong>
                        </li>
                        <li className="flex justify-between">
                          <span>Log Storage:</span>
                          <strong>10 GB</strong>
                        </li>
                        <li className="flex justify-between">
                          <span>Backup Storage:</span>
                          <strong>50 GB</strong>
                        </li>
                        <li className="flex justify-between">
                          <span>IOPS:</span>
                          <strong>1,000</strong>
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
                      <ul className="space-y-2 text-sm">
                        <li className="flex justify-between">
                          <span>Primary Storage:</span>
                          <strong>200 GB NVMe</strong>
                        </li>
                        <li className="flex justify-between">
                          <span>Database:</span>
                          <strong>25 GB</strong>
                        </li>
                        <li className="flex justify-between">
                          <span>Log Storage:</span>
                          <strong>50 GB</strong>
                        </li>
                        <li className="flex justify-between">
                          <span>Backup Storage:</span>
                          <strong>200 GB</strong>
                        </li>
                        <li className="flex justify-between">
                          <span>IOPS:</span>
                          <strong>5,000</strong>
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
                      <ul className="space-y-2 text-sm">
                        <li className="flex justify-between">
                          <span>Primary Storage:</span>
                          <strong>1 TB NVMe</strong>
                        </li>
                        <li className="flex justify-between">
                          <span>Secondary:</span>
                          <strong>2 TB HDD</strong>
                        </li>
                        <li className="flex justify-between">
                          <span>Database:</span>
                          <strong>100 GB</strong>
                        </li>
                        <li className="flex justify-between">
                          <span>Log Storage:</span>
                          <strong>500 GB</strong>
                        </li>
                        <li className="flex justify-between">
                          <span>IOPS:</span>
                          <strong>25,000+</strong>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h3 className="font-medium mb-2">Storage Expansion Options:</h3>
                  <ul className="text-sm space-y-1">
                    <li>• <strong>Shared:</strong> Additional 50GB blocks at $10/month each</li>
                    <li>• <strong>VPS:</strong> Additional 100GB blocks at $15/month each</li>
                    <li>• <strong>Dedicated:</strong> Custom storage configurations available</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="backup">
          <Card>
            <CardHeader>
              <CardTitle>Backup & Recovery Features</CardTitle>
              <CardDescription>
                Comprehensive backup strategies to protect your VPN infrastructure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  {backupFeatures.map((backup) => (
                    <div key={backup.plan} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">{backup.plan}</h3>
                        <Badge variant="outline">{backup.cost}</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <div className="font-medium mb-1">Frequency</div>
                          <div className="text-muted-foreground">{backup.frequency}</div>
                        </div>
                        <div>
                          <div className="font-medium mb-1">Retention</div>
                          <div className="text-muted-foreground">{backup.retention}</div>
                        </div>
                        <div>
                          <div className="font-medium mb-1">Encryption</div>
                          <div className="text-muted-foreground">{backup.encryption}</div>
                        </div>
                        <div>
                          <div className="font-medium mb-1">Recovery</div>
                          <div className="text-muted-foreground">{backup.recovery}</div>
                        </div>
                        <div>
                          <div className="font-medium mb-1">Cost</div>
                          <div className="text-muted-foreground">{backup.cost}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <RotateCcw className="h-5 w-5" />
                        Recovery Options
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Full system restore
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Selective file recovery
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Database point-in-time recovery
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Configuration rollback
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Cross-region recovery (Dedicated)
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CloudUpload className="h-5 w-5" />
                        Backup Locations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Multiple geographic regions
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Separate data centers
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Cloud storage integration
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Offline backup copies
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Immutable backup storage
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security & Compliance</CardTitle>
              <CardDescription>
                Advanced security features to protect your data and meet compliance requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {securityFeatures.map((feature) => (
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

              <div className="mt-8 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Compliance Standards</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-3 bg-muted rounded-lg text-center">
                      <div className="font-medium">SOC 2 Type II</div>
                      <div className="text-sm text-muted-foreground">Available</div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg text-center">
                      <div className="font-medium">HIPAA</div>
                      <div className="text-sm text-muted-foreground">BAA Available</div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg text-center">
                      <div className="font-medium">GDPR</div>
                      <div className="text-sm text-muted-foreground">Compliant</div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg text-center">
                      <div className="font-medium">ISO 27001</div>
                      <div className="text-sm text-muted-foreground">Certified</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Additional Security Features</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Zero-knowledge encryption</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Hardware security modules (HSM)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Key rotation and management</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Audit logging and monitoring</span>
                      </li>
                    </ul>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Access controls and permissions</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Data loss prevention (DLP)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Network segmentation</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Intrusion detection systems</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Storage Management */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Storage Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Monitoring & Alerts</CardTitle>
              <CardDescription>
                Proactive monitoring to prevent storage issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium">Real-time Usage Monitoring</div>
                    <div className="text-sm text-muted-foreground">Track storage utilization across all systems</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium">Automated Alerts</div>
                    <div className="text-sm text-muted-foreground">Notifications at 80% and 90% capacity</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium">Performance Metrics</div>
                    <div className="text-sm text-muted-foreground">IOPS, latency, and throughput monitoring</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium">Predictive Analysis</div>
                    <div className="text-sm text-muted-foreground">Forecast storage needs based on usage trends</div>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scaling Options</CardTitle>
              <CardDescription>
                Flexible options to expand storage as you grow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium">Instant Expansion</div>
                    <div className="text-sm text-muted-foreground">Add storage capacity without downtime</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium">Auto-scaling</div>
                    <div className="text-sm text-muted-foreground">Automatic capacity expansion (Enterprise)</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium">Tiered Storage</div>
                    <div className="text-sm text-muted-foreground">Hot, warm, and cold storage tiers</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium">Migration Assistance</div>
                    <div className="text-sm text-muted-foreground">Professional help with storage upgrades</div>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Calculate Storage Needs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Use our storage calculator to estimate your requirements based on user count and usage patterns.
            </p>
            <Button className="w-full">
              Storage Calculator
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Review security features and compliance requirements for your industry and use case.
            </p>
            <Button variant="outline" className="w-full">
              Security Guide
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
              Plan your migration to cloud hosting with our comprehensive migration guide and tools.
            </p>
            <Button variant="outline" asChild className="w-full">
              <Link href="/docs/cloud-hosting/migration">
                Migration Guide
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Support Notice */}
      <div className="mt-12 p-6 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-amber-900 dark:text-amber-100">Need Custom Storage?</h3>
            <p className="text-sm text-amber-700 dark:text-amber-200 mt-1">
              Have unique storage requirements or compliance needs? Our storage specialists can design 
              custom solutions including hybrid cloud, multi-region replication, and specialized compliance features.
            </p>
            <div className="mt-3">
              <Button size="sm" variant="outline">
                Consult Storage Specialist
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}