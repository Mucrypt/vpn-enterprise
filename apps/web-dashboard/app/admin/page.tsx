'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/lib/api'
import {
  Shield,
  Activity,
  Database,
  Users,
  Server,
  BarChart3,
  Settings,
  Lock,
  DollarSign,
  Workflow,
  Brain,
  Zap,
  Globe,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  Cpu,
  Bell,
} from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import {
  ServiceHealthMonitor,
  DEFAULT_SERVICES,
} from '@/components/admin/ServiceHealthMonitor'
import {
  SystemMetricsDashboard,
  generateMockMetrics,
} from '@/components/admin/SystemMetricsDashboard'
import {
  ServiceControlPanel,
  MOCK_SERVICES,
} from '@/components/admin/ServiceControlPanel'
import {
  AuditLogsViewer,
  MOCK_AUDIT_LOGS,
} from '@/components/admin/AuditLogsViewer'
import {
  UserAnalyticsDashboard,
  MOCK_ANALYTICS,
} from '@/components/admin/UserAnalyticsDashboard'

interface SystemMetrics {
  cpu: { usage: number; cores: number; temperature?: number; processes: number }
  memory: { used: number; total: number; percentage: number; swap?: number }
  disk: { used: number; total: number; percentage: number; iops?: number }
  network: { inbound: number; outbound: number; connections: number }
  services: { total: number; running: number; stopped: number }
}

export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [services, setServices] = useState(DEFAULT_SERVICES)
  const [metrics, setMetrics] = useState<SystemMetrics>(generateMockMetrics())
  const [activeTab, setActiveTab] = useState('overview')
  const [lastUpdate, setLastUpdate] = useState(new Date())

  useEffect(() => {
    loadAdminData()
    //  Refresh every 30 seconds
    const interval = setInterval(() => {
      loadAdminData()
      setMetrics(generateMockMetrics())
      setServices((prev) =>
        prev.map((s) => ({ ...s, lastCheck: new Date().toISOString() })),
      )
      setLastUpdate(new Date())
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  async function loadAdminData() {
    try {
      setLoading(true)
      const statsData = await api.getAdminDashboardStats()
      setStats(statsData)
    } catch (error: any) {
      console.error('Failed to load admin data:', error)
      toast.error('Failed to load admin data')
      // Set empty stats on error
      setStats({
        users: { total: 0, active: 0, new_this_month: 0 },
        database_platform: { databases: 0, regions: 0 },
        nexus_ai: { apps: 0 },
        subscriptions: { total: 0, active: 0, trial: 0 },
        system: { uptime: 0, memory_usage: 0, node_version: '' },
      })
    } finally {
      setLoading(false)
    }
  }

  const handleServiceStart = async (serviceId: string) => {
    // TODO: Implement real service start
    await new Promise((resolve) => setTimeout(resolve, 1000))
    toast.success(`Started service: ${serviceId}`)
  }

  const handleServiceStop = async (serviceId: string) => {
    // TODO: Implement real service stop
    await new Promise((resolve) => setTimeout(resolve, 1000))
    toast.success(`Stopped service: ${serviceId}`)
  }

  const handleServiceRestart = async (serviceId: string) => {
    // TODO: Implement real service restart
    await new Promise((resolve) => setTimeout(resolve, 1500))
    toast.success(`Restarted service: ${serviceId}`)
  }

  const operationalCount = services.filter(
    (s) => s.status === 'operational',
  ).length

  return (
    <div className='min-h-screen bg-linear-to-br from-background via-background to-muted/20'>
      {/* Animated Background */}
      <div className='fixed inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse' />
        <div className='absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000' />
      </div>

      <div className='relative max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
            <div>
              <h1 className='text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight bg-linear-to-r from-foreground via-primary to-purple-600 bg-clip-text text-transparent mb-2'>
                Admin Control Center
              </h1>
              <p className='text-muted-foreground text-sm sm:text-base'>
                Enterprise-grade platform management and monitoring
              </p>
            </div>
            <div className='flex flex-wrap items-center gap-3'>
              {operationalCount === services.length ? (
                <Badge className='bg-green-500/20 text-green-500 border-green-500/30 px-3 py-1.5 gap-2'>
                  <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse' />
                  All Systems Operational
                </Badge>
              ) : (
                <Badge className='bg-yellow-500/20 text-yellow-500 border-yellow-500/30 px-3 py-1.5 gap-2'>
                  <AlertCircle className='w-4 h-4' />
                  {services.length - operationalCount} Issues
                </Badge>
              )}
              <Button
                variant='outline'
                size='sm'
                onClick={() => {
                  loadAdminData()
                  setMetrics(generateMockMetrics())
                  setLastUpdate(new Date())
                }}
                className='gap-2'
              >
                <RefreshCw className='w-4 h-4' />
                Refresh
              </Button>
              <div className='text-xs text-muted-foreground'>
                Updated {lastUpdate.toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className='flex items-center justify-center py-12'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4' />
              <p className='text-muted-foreground'>
                Loading admin dashboard...
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Quick Stats */}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8'>
              <Card className='relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-shadow'>
                <div className='absolute inset-0 bg-linear-to-br from-blue-500/10 to-transparent' />
                <CardHeader className='relative pb-2'>
                  <div className='flex items-center justify-between'>
                    <CardTitle className='text-sm font-medium text-muted-foreground'>
                      Total Users
                    </CardTitle>
                    <Users className='w-4 h-4 text-blue-500' />
                  </div>
                </CardHeader>
                <CardContent className='relative'>
                  <div className='text-2xl sm:text-3xl font-bold'>
                    {stats?.users?.total || 0}
                  </div>
                  <p className='text-xs text-muted-foreground mt-1'>
                    <span className='text-green-500 inline-flex items-center gap-1'>
                      <TrendingUp className='w-3 h-3' />+
                      {stats?.users?.new_this_month || 0}
                    </span>{' '}
                    new this month
                  </p>
                </CardContent>
              </Card>

              <Card className='relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-shadow'>
                <div className='absolute inset-0 bg-linear-to-br from-green-500/10 to-transparent' />
                <CardHeader className='relative pb-2'>
                  <div className='flex items-center justify-between'>
                    <CardTitle className='text-sm font-medium text-muted-foreground'>
                      Active Services
                    </CardTitle>
                    <Server className='w-4 h-4 text-green-500' />
                  </div>
                </CardHeader>
                <CardContent className='relative'>
                  <div className='text-2xl sm:text-3xl font-bold'>
                    {operationalCount}/{services.length}
                  </div>
                  <p className='text-xs text-muted-foreground mt-1'>
                    {operationalCount === services.length ? (
                      <span className='text-green-500'>All operational</span>
                    ) : (
                      <span className='text-yellow-500'>
                        {services.length - operationalCount} need attention
                      </span>
                    )}
                  </p>
                </CardContent>
              </Card>

              <Card className='relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-shadow'>
                <div className='absolute inset-0 bg-linear-to-br from-purple-500/10 to-transparent' />
                <CardHeader className='relative pb-2'>
                  <div className='flex items-center justify-between'>
                    <CardTitle className='text-sm font-medium text-muted-foreground'>
                      Databases
                    </CardTitle>
                    <Database className='w-4 h-4 text-purple-500' />
                  </div>
                </CardHeader>
                <CardContent className='relative'>
                  <div className='text-2xl sm:text-3xl font-bold'>
                    {stats?.database_platform?.databases || 0}
                  </div>
                  <p className='text-xs text-muted-foreground mt-1'>
                    <span className='text-blue-500 inline-flex items-center gap-1'>
                      <Database className='w-3 h-3' />
                      {stats?.database_platform?.regions || 0}
                    </span>{' '}
                    regions
                  </p>
                </CardContent>
              </Card>

              <Card className='relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-shadow'>
                <div className='absolute inset-0 bg-linear-to-br from-amber-500/10 to-transparent' />
                <CardHeader className='relative pb-2'>
                  <div className='flex items-center justify-between'>
                    <CardTitle className='text-sm font-medium text-muted-foreground'>
                      Subscriptions
                    </CardTitle>
                    <DollarSign className='w-4 h-4 text-amber-500' />
                  </div>
                </CardHeader>
                <CardContent className='relative'>
                  <div className='text-2xl sm:text-3xl font-bold'>
                    {stats?.subscriptions?.active || 0}
                  </div>
                  <p className='text-xs text-muted-foreground mt-1'>
                    <span className='text-amber-500 inline-flex items-center gap-1'>
                      <DollarSign className='w-3 h-3' />
                      {stats?.subscriptions?.trial || 0}
                    </span>{' '}
                    on trial
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className='w-full'
            >
              <TabsList className='grid w-full grid-cols-3 lg:grid-cols-6 bg-card/50 backdrop-blur-sm border border-border/50 p-1 mb-6'>
                <TabsTrigger value='overview' className='gap-2'>
                  <BarChart3 className='w-4 h-4' />
                  <span className='hidden sm:inline'>Overview</span>
                </TabsTrigger>
                <TabsTrigger value='services' className='gap-2'>
                  <Server className='w-4 h-4' />
                  <span className='hidden sm:inline'>Services</span>
                </TabsTrigger>
                <TabsTrigger value='monitoring' className='gap-2'>
                  <Activity className='w-4 h-4' />
                  <span className='hidden sm:inline'>Monitoring</span>
                </TabsTrigger>
                <TabsTrigger value='analytics' className='gap-2'>
                  <Users className='w-4 h-4' />
                  <span className='hidden sm:inline'>Analytics</span>
                </TabsTrigger>
                <TabsTrigger value='security' className='gap-2'>
                  <Shield className='w-4 h-4' />
                  <span className='hidden sm:inline'>Security</span>
                </TabsTrigger>
                <TabsTrigger value='settings' className='gap-2'>
                  <Settings className='w-4 h-4' />
                  <span className='hidden sm:inline'>Settings</span>
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value='overview' className='space-y-6'>
                <ServiceHealthMonitor
                  services={services}
                  onRefresh={() => {
                    setServices((prev) =>
                      prev.map((s) => ({
                        ...s,
                        lastCheck: new Date().toISOString(),
                      })),
                    )
                    toast.success('Services refreshed')
                  }}
                  loading={false}
                />

                <SystemMetricsDashboard
                  metrics={metrics}
                  realTime={true}
                  onRefresh={() => {
                    setMetrics(generateMockMetrics())
                    toast.success('Metrics refreshed')
                  }}
                />

                {/* Quick Actions */}
                <Card className='border-border/50 bg-card/50 backdrop-blur-sm'>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <Zap className='w-5 h-5 text-primary' />
                      Quick Actions
                    </CardTitle>
                    <CardDescription>
                      Commonly used admin tasks and shortcuts
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
                      <Link href='/dashboard/admin'>
                        <Button
                          variant='outline'
                          className='w-full gap-2 justify-start'
                        >
                          <Users className='w-4 h-4' />
                          User Management
                        </Button>
                      </Link>
                      <Link href='/databases/admin'>
                        <Button
                          variant='outline'
                          className='w-full gap-2 justify-start'
                        >
                          <Database className='w-4 h-4' />
                          Database Platform
                        </Button>
                      </Link>
                      <Link href='/admin/n8n'>
                        <Button
                          variant='outline'
                          className='w-full gap-2 justify-start'
                        >
                          <Workflow className='w-4 h-4' />
                          N8N Workflows
                        </Button>
                      </Link>
                      <Link href='/dashboard/billing'>
                        <Button
                          variant='outline'
                          className='w-full gap-2 justify-start'
                        >
                          <DollarSign className='w-4 h-4' />
                          Billing System
                        </Button>
                      </Link>
                      <Link href='/nexusai'>
                        <Button
                          variant='outline'
                          className='w-full gap-2 justify-start'
                        >
                          <Brain className='w-4 h-4' />
                          NexusAI Panel
                        </Button>
                      </Link>
                      <Button
                        variant='outline'
                        className='w-full gap-2 justify-start'
                        onClick={() => setActiveTab('security')}
                      >
                        <Lock className='w-4 h-4' />
                        Security Center
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Services Tab */}
              <TabsContent value='services' className='space-y-6'>
                <ServiceControlPanel
                  services={MOCK_SERVICES}
                  onStart={handleServiceStart}
                  onStop={handleServiceStop}
                  onRestart={handleServiceRestart}
                />
              </TabsContent>

              {/* Monitoring Tab */}
              <TabsContent value='monitoring' className='space-y-6'>
                <ServiceHealthMonitor
                  services={services}
                  onRefresh={() => {
                    setServices((prev) =>
                      prev.map((s) => ({
                        ...s,
                        lastCheck: new Date().toISOString(),
                      })),
                    )
                    toast.success('Services refreshed')
                  }}
                  loading={false}
                />
                <SystemMetricsDashboard
                  metrics={metrics}
                  realTime={true}
                  onRefresh={() => {
                    setMetrics(generateMockMetrics())
                    toast.success('Metrics refreshed')
                  }}
                />
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value='analytics' className='space-y-6'>
                <UserAnalyticsDashboard analytics={MOCK_ANALYTICS} />
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value='security' className='space-y-6'>
                <AuditLogsViewer
                  logs={MOCK_AUDIT_LOGS}
                  onRefresh={() => toast.success('Audit logs refreshed')}
                  onExport={() => toast.success('Exporting audit logs...')}
                />
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value='settings' className='space-y-6'>
                <Card className='border-border/50 bg-card/50 backdrop-blur-sm'>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <Settings className='w-5 h-5 text-primary' />
                      System Configuration
                    </CardTitle>
                    <CardDescription>
                      Global settings and platform configuration
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-4'>
                      <div className='flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors'>
                        <div>
                          <h4 className='font-semibold'>Maintenance Mode</h4>
                          <p className='text-sm text-muted-foreground'>
                            Enable system-wide maintenance mode
                          </p>
                        </div>
                        <Button variant='outline' size='sm'>
                          Configure
                        </Button>
                      </div>
                      <div className='flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors'>
                        <div>
                          <h4 className='font-semibold'>Auto Scaling</h4>
                          <p className='text-sm text-muted-foreground'>
                            Automatic resource scaling configuration
                          </p>
                        </div>
                        <Button variant='outline' size='sm'>
                          Configure
                        </Button>
                      </div>
                      <div className='flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors'>
                        <div>
                          <h4 className='font-semibold'>Backup Settings</h4>
                          <p className='text-sm text-muted-foreground'>
                            Configure automated backup schedules
                          </p>
                        </div>
                        <Button variant='outline' size='sm'>
                          Configure
                        </Button>
                      </div>
                      <div className='flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors'>
                        <div>
                          <h4 className='font-semibold'>Security Policies</h4>
                          <p className='text-sm text-muted-foreground'>
                            Manage authentication and access control
                          </p>
                        </div>
                        <Button variant='outline' size='sm'>
                          Configure
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  )
}
