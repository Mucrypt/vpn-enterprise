'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Activity,
  Zap,
  Database,
  Brain,
  Workflow,
  Globe,
  Shield,
  Server,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'

interface ServiceHealth {
  id: string
  name: string
  url: string
  status: 'operational' | 'degraded' | 'down' | 'maintenance'
  uptime: number
  responseTime: number
  lastCheck: string
  icon: React.ReactNode
  metrics?: {
    requests: number
    errors: number
    avgLatency: number
  }
}

interface ServiceHealthMonitorProps {
  services: ServiceHealth[]
  onRefresh?: () => void
  loading?: boolean
}

export function ServiceHealthMonitor({
  services,
  onRefresh,
  loading = false,
}: ServiceHealthMonitorProps) {
  const [selectedService, setSelectedService] = useState<string | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-green-500'
      case 'degraded':
        return 'bg-yellow-500'
      case 'down':
        return 'bg-red-500'
      case 'maintenance':
        return 'bg-blue-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'operational':
        return (
          <Badge className='bg-green-500/20 text-green-500 border-green-500/30 gap-1'>
            <CheckCircle className='w-3 h-3' />
            Operational
          </Badge>
        )
      case 'degraded':
        return (
          <Badge className='bg-yellow-500/20 text-yellow-500 border-yellow-500/30 gap-1'>
            <AlertCircle className='w-3 h-3' />
            Degraded
          </Badge>
        )
      case 'down':
        return (
          <Badge className='bg-red-500/20 text-red-500 border-red-500/30 gap-1'>
            <XCircle className='w-3 h-3' />
            Down
          </Badge>
        )
      case 'maintenance':
        return (
          <Badge className='bg-blue-500/20 text-blue-500 border-blue-500/30 gap-1'>
            <Activity className='w-3 h-3' />
            Maintenance
          </Badge>
        )
      default:
        return null
    }
  }

  const getResponseTimeColor = (time: number) => {
    if (time < 100) return 'text-green-500'
    if (time < 300) return 'text-yellow-500'
    return 'text-red-500'
  }

  const operationalCount = services.filter((s) => s.status === 'operational').length
  const totalServices = services.length
  const avgUptime = (services.reduce((acc, s) => acc + s.uptime, 0) / totalServices).toFixed(2)

  return (
    <Card className='border-border/50 bg-card/50 backdrop-blur-sm'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='flex items-center gap-2 text-xl'>
              <Activity className='w-5 h-5 text-primary' />
              Service Health Monitor
            </CardTitle>
            <CardDescription className='mt-1.5'>
              Real-time monitoring of all platform services
            </CardDescription>
          </div>
          <div className='flex items-center gap-3'>
            <div className='text-right'>
              <p className='text-2xl font-bold text-green-500'>
                {operationalCount}/{totalServices}
              </p>
              <p className='text-xs text-muted-foreground'>Services Online</p>
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={onRefresh}
              disabled={loading}
              className='gap-2'
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Summary Stats */}
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-lg bg-muted/30'>
          <div className='text-center'>
            <p className='text-sm text-muted-foreground'>Average Uptime</p>
            <p className='text-2xl font-bold text-green-500'>{avgUptime}%</p>
          </div>
          <div className='text-center'>
            <p className='text-sm text-muted-foreground'>Avg Response Time</p>
            <p className='text-2xl font-bold'>
              {Math.round(
                services.reduce((acc, s) => acc + s.responseTime, 0) / totalServices
              )}
              ms
            </p>
          </div>
          <div className='text-center'>
            <p className='text-sm text-muted-foreground'>Status</p>
            <p className='text-2xl font-bold'>
              {operationalCount === totalServices ? (
                <span className='text-green-500'>All Systems Go</span>
              ) : (
                <span className='text-yellow-500'>Issues Detected</span>
              )}
            </p>
          </div>
        </div>

        {/* Service Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {services.map((service) => (
            <Card
              key={service.id}
              className={`relative overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-lg border-border/50 ${
                selectedService === service.id ? 'ring-2 ring-primary' : ''
              } ${service.status === 'down' ? 'border-red-500/50' : ''}`}
              onClick={() =>
                setSelectedService(selectedService === service.id ? null : service.id)
              }
            >
              {/* Status Indicator */}
              <div
                className={`absolute top-0 left-0 w-full h-1 ${getStatusColor(service.status)}`}
              />

              <CardHeader className='pb-3'>
                <div className='flex items-start justify-between'>
                  <div className='flex items-center gap-3'>
                    <div
                      className={`p-2 rounded-lg ${
                        service.status === 'operational'
                          ? 'bg-green-500/10'
                          : service.status === 'down'
                            ? 'bg-red-500/10'
                            : 'bg-yellow-500/10'
                      }`}
                    >
                      {service.icon}
                    </div>
                    <div>
                      <CardTitle className='text-sm font-semibold'>
                        {service.name}
                      </CardTitle>
                      <p className='text-xs text-muted-foreground mt-0.5'>
                        {service.url}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className='space-y-3'>
                <div className='flex items-center justify-between'>
                  {getStatusBadge(service.status)}
                  <div
                    className={`w-2 h-2 rounded-full ${getStatusColor(service.status)} animate-pulse`}
                  />
                </div>

                <div className='space-y-2 text-xs'>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Uptime</span>
                    <span className='font-semibold'>{service.uptime}%</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Response Time</span>
                    <span className={`font-semibold ${getResponseTimeColor(service.responseTime)}`}>
                      {service.responseTime}ms
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Last Check</span>
                    <span className='font-medium'>
                      {new Date(service.lastCheck).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                {/* Expanded Metrics */}
                {selectedService === service.id && service.metrics && (
                  <div className='mt-4 p-3 rounded-lg bg-muted/30 space-y-2 animate-in fade-in duration-200'>
                    <h4 className='text-xs font-semibold mb-2'>24h Metrics</h4>
                    <div className='flex justify-between text-xs'>
                      <span className='text-muted-foreground'>Requests</span>
                      <span className='font-semibold'>{service.metrics.requests.toLocaleString()}</span>
                    </div>
                    <div className='flex justify-between text-xs'>
                      <span className='text-muted-foreground'>Errors</span>
                      <span className='font-semibold text-red-500'>
                        {service.metrics.errors}
                      </span>
                    </div>
                    <div className='flex justify-between text-xs'>
                      <span className='text-muted-foreground'>Avg Latency</span>
                      <span className='font-semibold'>
                        {service.metrics.avgLatency}ms
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Default services configuration with real endpoints
export const DEFAULT_SERVICES: ServiceHealth[] = [
  {
    id: 'nexusai',
    name: 'NexusAI',
    url: '/nexusai',
    status: 'operational',
    uptime: 99.9,
    responseTime: 145,
    lastCheck: new Date().toISOString(),
    icon: <Brain className='w-5 h-5 text-purple-500' />,
    metrics: {
      requests: 12450,
      errors: 3,
      avgLatency: 142,
    },
  },
  {
    id: 'database',
    name: 'Database Platform',
    url: '/databases',
    status: 'operational',
    uptime: 99.95,
    responseTime: 89,
    lastCheck: new Date().toISOString(),
    icon: <Database className='w-5 h-5 text-blue-500' />,
    metrics: {
      requests: 45230,
      errors: 1,
      avgLatency: 86,
    },
  },
  {
    id: 'api',
    name: 'API Server',
    url: '/api/health',
    status: 'operational',
    uptime: 99.8,
    responseTime: 67,
    lastCheck: new Date().toISOString(),
    icon: <Zap className='w-5 h-5 text-amber-500' />,
    metrics: {
      requests: 89450,
      errors: 12,
      avgLatency: 65,
    },
  },
  {
    id: 'vpn',
    name: 'VPN Service',
    url: '/dashboard/admin',
    status: 'operational',
    uptime: 99.7,
    responseTime: 234,
    lastCheck: new Date().toISOString(),
    icon: <Shield className='w-5 h-5 text-green-500' />,
    metrics: {
      requests: 23400,
      errors: 8,
      avgLatency: 230,
    },
  },
  {
    id: 'hosting',
    name: 'Hosting Service',
    url: '/dashboard/hosting',
    status: 'operational',
    uptime: 99.6,
    responseTime: 178,
    lastCheck: new Date().toISOString(),
    icon: <Globe className='w-5 h-5 text-orange-500' />,
    metrics: {
      requests: 15670,
      errors: 5,
      avgLatency: 175,
    },
  },
  {
    id: 'n8n',
    name: 'N8N Workflows',
    url: '/admin/n8n',
    status: 'operational',
    uptime: 99.4,
    responseTime: 312,
    lastCheck: new Date().toISOString(),
    icon: <Workflow className='w-5 h-5 text-cyan-500' />,
    metrics: {
      requests: 8920,
      errors: 4,
      avgLatency: 308,
    },
  },
  {
    id: 'python-api',
    name: 'Python AI API',
    url: '/ai/generate',
    status: 'operational',
    uptime: 99.3,
    responseTime: 456,
    lastCheck: new Date().toISOString(),
    icon: <Server className='w-5 h-5 text-red-500' />,
    metrics: {
      requests: 5430,
      errors: 2,
      avgLatency: 450,
    },
  },
]
