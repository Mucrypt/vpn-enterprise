'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Database, Cpu, Zap, Shield, Globe, Activity } from 'lucide-react'
import toast from 'react-hot-toast'

interface Service {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  enabled: boolean
  cost_per_hour?: number
  cost_per_gb?: number
  status: 'active' | 'inactive' | 'provisioning'
}

interface ServiceManagementProps {
  services: Service[]
  onToggleService: (serviceId: string, enabled: boolean) => Promise<void>
  loading?: boolean
}

export function ServiceManagement({
  services,
  onToggleService,
  loading,
}: ServiceManagementProps) {
  const handleToggle = async (serviceId: string, currentlyEnabled: boolean) => {
    try {
      await onToggleService(serviceId, !currentlyEnabled)
      toast.success(
        `Service ${!currentlyEnabled ? 'enabled' : 'disabled'} successfully`,
      )
    } catch (error: any) {
      toast.error(error.message || 'Failed to toggle service')
    }
  }

  const getServiceIcon = (icon: React.ReactNode) => {
    return <div className='text-primary'>{icon}</div>
  }

  const getStatusBadge = (status: string, enabled: boolean) => {
    if (!enabled) {
      return (
        <Badge
          variant='secondary'
          className='bg-muted/50 text-muted-foreground border-border/50'
        >
          Disabled
        </Badge>
      )
    }

    switch (status) {
      case 'active':
        return (
          <Badge className='bg-linear-to-br from-green-500 to-emerald-600 text-white border-0 shadow-sm'>
            ● Active
          </Badge>
        )
      case 'provisioning':
        return (
          <Badge className='bg-linear-to-br from-yellow-500 to-orange-500 text-white border-0 shadow-sm'>
            ◐ Provisioning
          </Badge>
        )
      case 'inactive':
        return (
          <Badge
            variant='secondary'
            className='bg-muted/50 text-muted-foreground border-border/50'
          >
            Inactive
          </Badge>
        )
      default:
        return (
          <Badge
            variant='secondary'
            className='bg-muted/50 text-muted-foreground border-border/50'
          >
            {status}
          </Badge>
        )
    }
  }

  if (loading) {
    return (
      <Card className='border-border/50 bg-card/50 backdrop-blur-sm'>
        <CardHeader>
          <div className='h-7 w-40 animate-pulse rounded-lg bg-muted' />
          <div className='h-4 w-64 animate-pulse rounded bg-muted mt-3' />
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {[1, 2, 3].map((i) => (
              <div key={i} className='h-24 animate-pulse rounded-xl bg-muted' />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className='relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm'>
      <div className='absolute inset-0 bg-linear-to-br from-primary/5 to-transparent' />
      <CardHeader className='relative'>
        <CardTitle className='text-xl sm:text-2xl font-bold flex items-center gap-3'>
          <div className='p-2.5 rounded-xl bg-linear-to-br from-blue-500/20 to-blue-400/10 backdrop-blur-sm border border-blue-500/30'>
            <Activity className='w-5 h-5 text-blue-400' />
          </div>
          Service Management
        </CardTitle>
        <CardDescription className='text-sm'>
          Enable or disable services to control your costs and resource usage
        </CardDescription>
      </CardHeader>
      <CardContent className='relative'>
        <div className='space-y-4'>
          {services.map((service, index) => (
            <div
              key={service.id}
              className={`group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-xl border transition-all duration-500 ${
                service.enabled
                  ? 'border-primary/30 bg-linear-to-br from-primary/10 to-primary/5 shadow-lg hover:shadow-xl hover:shadow-primary/10'
                  : 'border-border/50 bg-card/50 hover:border-primary/20 hover:shadow-lg'
              }`}
              style={{
                animationDelay: `${index * 100}ms`,
                animation: 'fadeInUp 0.5s ease-out forwards',
              }}
            >
              <div className='flex items-center gap-4 flex-1'>
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-110 ${
                    service.enabled
                      ? 'bg-linear-to-br from-primary/20 to-primary/10 border-primary/30'
                      : 'bg-muted/50 border-border/50'
                  }`}
                >
                  {getServiceIcon(service.icon)}
                </div>

                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2 mb-1.5 flex-wrap'>
                    <h4 className='font-bold text-base sm:text-lg'>
                      {service.name}
                    </h4>
                    {getStatusBadge(service.status, service.enabled)}
                  </div>
                  <p className='text-xs sm:text-sm text-muted-foreground mb-2'>
                    {service.description}
                  </p>
                  <div className='flex items-center gap-3 sm:gap-4 text-xs flex-wrap'>
                    {service.cost_per_hour !== undefined && (
                      <div className='flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20'>
                        <Zap className='w-3 h-3 text-amber-500' />
                        <span className='text-amber-500 font-semibold'>
                          {service.cost_per_hour} credits/hour
                        </span>
                      </div>
                    )}
                    {service.cost_per_gb !== undefined && (
                      <div className='flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20'>
                        <Database className='w-3 h-3 text-blue-500' />
                        <span className='text-blue-500 font-semibold'>
                          {service.cost_per_gb} credits/GB
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Switch
                checked={service.enabled}
                onCheckedChange={() =>
                  handleToggle(service.id, service.enabled)
                }
                disabled={service.status === 'provisioning'}
                className='data-[state=checked]:bg-linear-to-br data-[state=checked]:from-primary data-[state=checked]:to-primary/80'
              />
            </div>
          ))}
        </div>

        <div className='mt-6 p-5 rounded-xl bg-linear-to-br from-muted/50 to-muted/20 border border-border/50 backdrop-blur-sm'>
          <div className='flex items-start gap-3'>
            <div className='p-2 rounded-lg bg-primary/20 border border-primary/30 shrink-0'>
              <Activity className='w-5 h-5 text-primary' />
            </div>
            <div>
              <h4 className='font-bold mb-1.5'>Usage-Based Billing</h4>
              <p className='text-sm text-muted-foreground leading-relaxed'>
                Services are billed based on actual usage. Credits are deducted
                automatically when you use these services. Disable services
                you're not using to save credits.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Default services configuration
export const DEFAULT_SERVICES: Service[] = [
  {
    id: 'nexusai',
    name: 'NexusAI',
    description: 'AI-powered application generator with multiple model support',
    icon: <Cpu className='w-6 h-6' />,
    enabled: true,
    cost_per_hour: 0,
    status: 'active',
  },
  {
    id: 'database',
    name: 'Database Platform',
    description: 'PostgreSQL database provisioning and management',
    icon: <Database className='w-6 h-6' />,
    enabled: true,
    cost_per_gb: 5,
    status: 'active',
  },
  {
    id: 'vpn',
    name: 'VPN Service',
    description: 'Secure VPN connections with global server network',
    icon: <Shield className='w-6 h-6' />,
    enabled: false,
    cost_per_hour: 2,
    status: 'inactive',
  },
]
