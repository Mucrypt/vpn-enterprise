'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Play,
  Square,
  RotateCcw,
  Trash2,
  Settings,
  Activity,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Service {
  id: string
  name: string
  status: 'running' | 'stopped' | 'starting' | 'stopping'
  port?: number
  memory?: string
  cpu?: string
  uptime?: string
}

interface ServiceControlPanelProps {
  services: Service[]
  onStart: (serviceId: string) => Promise<void>
  onStop: (serviceId: string) => Promise<void>
  onRestart: (serviceId: string) => Promise<void>
  onDelete?: (serviceId: string) => Promise<void>
  loading?: boolean
}

export function ServiceControlPanel({
  services,
  onStart,
  onStop,
  onRestart,
  onDelete,
  loading = false,
}: ServiceControlPanelProps) {
  const [actioningService, setActioningService] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null)

  const handleStart = async (serviceId: string) => {
    try {
      setActioningService(serviceId)
      await onStart(serviceId)
      toast.success('Service started successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to start service')
    } finally {
      setActioningService(null)
    }
  }

  const handleStop = async (serviceId: string) => {
    try {
      setActioningService(serviceId)
      await onStop(serviceId)
      toast.success('Service stopped successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to stop service')
    } finally {
      setActioningService(null)
    }
  }

  const handleRestart = async (serviceId: string) => {
    try {
      setActioningService(serviceId)
      await onRestart(serviceId)
      toast.success('Service restarted successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to restart service')
    } finally {
      setActioningService(null)
    }
  }

  const handleDeleteRequest = (serviceId: string) => {
    setServiceToDelete(serviceId)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!serviceToDelete || !onDelete) return

    try {
      setActioningService(serviceToDelete)
      await onDelete(serviceToDelete)
      toast.success('Service deleted successfully')
      setShowDeleteDialog(false)
      setServiceToDelete(null)
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete service')
    } finally {
      setActioningService(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return (
          <Badge className='bg-green-500/20 text-green-500 border-green-500/30 gap-1'>
            <CheckCircle className='w-3 h-3' />
            Running
          </Badge>
        )
      case 'stopped':
        return (
          <Badge className='bg-red-500/20 text-red-500 border-red-500/30 gap-1'>
            <XCircle className='w-3 h-3' />
            Stopped
          </Badge>
        )
      case 'starting':
        return (
          <Badge className='bg-blue-500/20 text-blue-500 border-blue-500/30 gap-1'>
            <Activity className='w-3 h-3 animate-pulse' />
            Starting
          </Badge>
        )
      case 'stopping':
        return (
          <Badge className='bg-yellow-500/20 text-yellow-500 border-yellow-500/30 gap-1'>
            <Activity className='w-3 h-3 animate-pulse' />
            Stopping
          </Badge>
        )
      default:
        return null
    }
  }

  const runningCount = services.filter((s) => s.status === 'running').length

  return (
    <>
      <Card className='border-border/50 bg-card/50 backdrop-blur-sm'>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='flex items-center gap-2 text-xl'>
                <Zap className='w-5 h-5 text-primary' />
                Service Control Panel
              </CardTitle>
              <CardDescription className='mt-1.5'>
                Start, stop, restart, and manage all services
              </CardDescription>
            </div>
            <Badge variant='outline' className='text-sm'>
              {runningCount}/{services.length} Running
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            {services.map((service) => (
              <div
                key={service.id}
                className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-border/50 bg-background/50 hover:shadow-md transition-shadow'
              >
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-3 mb-2'>
                    <h4 className='font-semibold'>{service.name}</h4>
                    {getStatusBadge(service.status)}
                  </div>
                  <div className='grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-muted-foreground'>
                    {service.port && (
                      <div>
                        <span className='font-medium'>Port:</span> {service.port}
                      </div>
                    )}
                    {service.memory && (
                      <div>
                        <span className='font-medium'>Memory:</span> {service.memory}
                      </div>
                    )}
                    {service.cpu && (
                      <div>
                        <span className='font-medium'>CPU:</span> {service.cpu}
                      </div>
                    )}
                    {service.uptime && (
                      <div>
                        <span className='font-medium'>Uptime:</span> {service.uptime}
                      </div>
                    )}
                  </div>
                </div>

                <div className='flex items-center gap-2'>
                  {service.status === 'stopped' ? (
                    <Button
                      size='sm'
                      variant='outline'
                      className='gap-2'
                      onClick={() => handleStart(service.id)}
                      disabled={actioningService === service.id || loading}
                    >
                      <Play className='w-4 h-4' />
                      Start
                    </Button>
                  ) : service.status === 'running' ? (
                    <Button
                      size='sm'
                      variant='outline'
                      className='gap-2'
                      onClick={() => handleStop(service.id)}
                      disabled={actioningService === service.id || loading}
                    >
                      <Square className='w-4 h-4' />
                      Stop
                    </Button>
                  ) : null}

                  <Button
                    size='sm'
                    variant='outline'
                    className='gap-2'
                    onClick={() => handleRestart(service.id)}
                    disabled={
                      actioningService === service.id ||
                      loading ||
                      service.status !== 'running'
                    }
                  >
                    <RotateCcw className='w-4 h-4' />
                    Restart
                  </Button>

                  <Button
                    size='sm'
                    variant='ghost'
                    disabled={actioningService === service.id || loading}
                  >
                    <Settings className='w-4 h-4' />
                  </Button>

                  {onDelete && (
                    <Button
                      size='sm'
                      variant='ghost'
                      className='text-red-500 hover:text-red-600 hover:bg-red-500/10'
                      onClick={() => handleDeleteRequest(service.id)}
                      disabled={actioningService === service.id || loading}
                    >
                      <Trash2 className='w-4 h-4' />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <AlertTriangle className='w-5 h-5 text-red-500' />
              Confirm Service Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this service? This action cannot be undone.
              All data associated with this service will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setShowDeleteDialog(false)}
              disabled={actioningService !== null}
            >
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={confirmDelete}
              disabled={actioningService !== null}
              className='gap-2'
            >
              {actioningService ? (
                <>
                  <Activity className='w-4 h-4 animate-spin' />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className='w-4 h-4' />
                  Delete Service
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Mock services for testing
export const MOCK_SERVICES: Service[] = [
  {
    id: 'api',
    name: 'API Server',
    status: 'running',
    port: 3000,
    memory: '256MB',
    cpu: '12%',
    uptime: '5d 12h',
  },
  {
    id: 'web',
    name: 'Web Dashboard',
    status: 'running',
    port: 3001,
    memory: '512MB',
    cpu: '8%',
    uptime: '5d 12h',
  },
  {
    id: 'postgres',
    name: 'PostgreSQL',
    status: 'running',
    port: 5432,
    memory: '1.2GB',
    cpu: '15%',
    uptime: '5d 12h',
  },
  {
    id: 'redis',
    name: 'Redis Cache',
    status: 'running',
    port: 6379,
    memory: '128MB',
    cpu: '3%',
    uptime: '5d 12h',
  },
  {
    id: 'n8n',
    name: 'N8N Workflows',
    status: 'running',
    port: 5678,
    memory: '384MB',
    cpu: '5%',
    uptime: '3d 8h',
  },
  {
    id: 'python-api',
    name: 'Python AI API',
    status: 'running',
    port: 5001,
    memory: '768MB',
    cpu: '18%',
    uptime: '2d 4h',
  },
]
