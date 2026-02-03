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
      return <Badge variant='secondary'>Disabled</Badge>
    }

    switch (status) {
      case 'active':
        return <Badge className='bg-green-500 text-white'>Active</Badge>
      case 'provisioning':
        return <Badge className='bg-yellow-500 text-white'>Provisioning</Badge>
      case 'inactive':
        return <Badge variant='secondary'>Inactive</Badge>
      default:
        return <Badge variant='secondary'>{status}</Badge>
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className='h-6 w-32 animate-pulse rounded bg-gray-200' />
          <div className='h-4 w-64 animate-pulse rounded bg-gray-200 mt-2' />
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {[1, 2, 3].map((i) => (
              <div key={i} className='h-20 animate-pulse rounded bg-gray-200' />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Management</CardTitle>
        <CardDescription>
          Enable or disable services to control your costs and resource usage
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {services.map((service) => (
            <div
              key={service.id}
              className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                service.enabled
                  ? 'border-primary/30 bg-primary/5'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className='flex items-center gap-4 flex-1'>
                <div className='shrink-0'>
                  {getServiceIcon(service.icon)}
                </div>

                <div className='flex-1'>
                  <div className='flex items-center gap-2 mb-1'>
                    <h4 className='font-semibold'>{service.name}</h4>
                    {getStatusBadge(service.status, service.enabled)}
                  </div>
                  <p className='text-sm text-muted-foreground'>
                    {service.description}
                  </p>
                  <div className='flex items-center gap-4 mt-2 text-xs text-muted-foreground'>
                    {service.cost_per_hour && (
                      <span>💰 {service.cost_per_hour} credits/hour</span>
                    )}
                    {service.cost_per_gb && (
                      <span>💾 {service.cost_per_gb} credits/GB</span>
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
              />
            </div>
          ))}
        </div>

        <div className='mt-6 p-4 rounded-lg bg-muted'>
          <div className='flex items-start gap-3'>
            <Activity className='w-5 h-5 text-primary shrink-0 mt-0.5' />
            <div>
              <h4 className='font-semibold mb-1'>Usage-Based Billing</h4>
              <p className='text-sm text-muted-foreground'>
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
