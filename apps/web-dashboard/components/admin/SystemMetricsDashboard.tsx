'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Cpu,
  HardDrive,
  Activity,
  Network,
  MemoryStick,
  Server,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Zap,
  Database,
} from 'lucide-react'

interface SystemMetrics {
  cpu: {
    usage: number
    cores: number
    temperature?: number
    processes: number
  }
  memory: {
    used: number
    total: number
    percentage: number
    swap?: number
  }
  disk: {
    used: number
    total: number
    percentage: number
    iops?: number
  }
  network: {
    inbound: number
    outbound: number
    connections: number
  }
  services: {
    total: number
    running: number
    stopped: number
  }
}

interface MetricsDashboardProps {
  metrics: SystemMetrics
  realTime?: boolean
  onRefresh?: () => void
}

export function SystemMetricsDashboard({
  metrics,
  realTime = true,
  onRefresh,
}: MetricsDashboardProps) {
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable')

  const getPercentageColor = (percentage: number) => {
    if (percentage < 60) return 'from-green-500 to-emerald-500'
    if (percentage < 80) return 'from-yellow-500 to-orange-500'
    return 'from-red-500 to-rose-500'
  }

  const getStatusColor = (percentage: number) => {
    if (percentage < 60) return 'text-green-500'
    if (percentage < 80) return 'text-yellow-500'
    return 'text-red-500'
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <Card className='border-border/50 bg-card/50 backdrop-blur-sm'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='flex items-center gap-2 text-xl'>
              <Server className='w-5 h-5 text-primary' />
              System Metrics
              {realTime && (
                <Badge variant='outline' className='ml-2 gap-1'>
                  <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse' />
                  Live
                </Badge>
              )}
            </CardTitle>
            <CardDescription className='mt-1.5'>
              Real-time system resource utilization and performance
            </CardDescription>
          </div>
          <Button variant='outline' size='sm' onClick={onRefresh}>
            <Activity className='w-4 h-4 mr-2' />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* CPU Metrics */}
        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <div className='p-2 rounded-lg bg-blue-500/10'>
                <Cpu className='w-4 h-4 text-blue-500' />
              </div>
              <div>
                <h4 className='font-semibold text-sm'>CPU Usage</h4>
                <p className='text-xs text-muted-foreground'>
                  {metrics.cpu.cores} cores • {metrics.cpu.processes} processes
                </p>
              </div>
            </div>
            <div className='text-right'>
              <p className={`text-2xl font-bold ${getStatusColor(metrics.cpu.usage)}`}>
                {metrics.cpu.usage.toFixed(1)}%
              </p>
              {metrics.cpu.temperature && (
                <p className='text-xs text-muted-foreground'>
                  {metrics.cpu.temperature}°C
                </p>
              )}
            </div>
          </div>
          <div className='relative'>
            <Progress value={metrics.cpu.usage} className='h-3' />
            <div
              className={`absolute inset-0 h-3 rounded-full bg-linear-to-r ${getPercentageColor(metrics.cpu.usage)} opacity-80`}
              style={{ width: `${metrics.cpu.usage}%` }}
            />
          </div>
        </div>

        {/* Memory Metrics */}
        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <div className='p-2 rounded-lg bg-purple-500/10'>
                <MemoryStick className='w-4 h-4 text-purple-500' />
              </div>
              <div>
                <h4 className='font-semibold text-sm'>Memory Usage</h4>
                <p className='text-xs text-muted-foreground'>
                  {formatBytes(metrics.memory.used)} of {formatBytes(metrics.memory.total)}
                </p>
              </div>
            </div>
            <div className='text-right'>
              <p className={`text-2xl font-bold ${getStatusColor(metrics.memory.percentage)}`}>
                {metrics.memory.percentage.toFixed(1)}%
              </p>
              {metrics.memory.swap !== undefined && (
                <p className='text-xs text-muted-foreground'>
                  Swap: {formatBytes(metrics.memory.swap)}
                </p>
              )}
            </div>
          </div>
          <div className='relative'>
            <Progress value={metrics.memory.percentage} className='h-3' />
            <div
              className={`absolute inset-0 h-3 rounded-full bg-linear-to-r ${getPercentageColor(metrics.memory.percentage)} opacity-80`}
              style={{ width: `${metrics.memory.percentage}%` }}
            />
          </div>
        </div>

        {/* Disk Metrics */}
        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <div className='p-2 rounded-lg bg-amber-500/10'>
                <HardDrive className='w-4 h-4 text-amber-500' />
              </div>
              <div>
                <h4 className='font-semibold text-sm'>Disk Usage</h4>
                <p className='text-xs text-muted-foreground'>
                  {formatBytes(metrics.disk.used)} of {formatBytes(metrics.disk.total)}
                  {metrics.disk.iops !== undefined && ` • ${metrics.disk.iops} IOPS`}
                </p>
              </div>
            </div>
            <div className='text-right'>
              <p className={`text-2xl font-bold ${getStatusColor(metrics.disk.percentage)}`}>
                {metrics.disk.percentage.toFixed(1)}%
              </p>
            </div>
          </div>
          <div className='relative'>
            <Progress value={metrics.disk.percentage} className='h-3' />
            <div
              className={`absolute inset-0 h-3 rounded-full bg-linear-to-r ${getPercentageColor(metrics.disk.percentage)} opacity-80`}
              style={{ width: `${metrics.disk.percentage}%` }}
            />
          </div>
        </div>

        {/* Network Metrics */}
        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <div className='p-2 rounded-lg bg-green-500/10'>
                <Network className='w-4 h-4 text-green-500' />
              </div>
              <div>
                <h4 className='font-semibold text-sm'>Network Activity</h4>
                <p className='text-xs text-muted-foreground'>
                  {metrics.network.connections} active connections
                </p>
              </div>
            </div>
            <div className='text-right'>
              <p className='text-sm font-semibold text-green-500'>
                ↓ {formatBytes(metrics.network.inbound)}/s
              </p>
              <p className='text-sm font-semibold text-blue-500'>
                ↑ {formatBytes(metrics.network.outbound)}/s
              </p>
            </div>
          </div>
          <div className='grid grid-cols-2 gap-2'>
            <div className='p-3 rounded-lg bg-green-500/5 border border-green-500/20'>
              <p className='text-xs text-muted-foreground'>Inbound</p>
              <p className='text-lg font-bold text-green-500'>
                {formatBytes(metrics.network.inbound)}/s
              </p>
            </div>
            <div className='p-3 rounded-lg bg-blue-500/5 border border-blue-500/20'>
              <p className='text-xs text-muted-foreground'>Outbound</p>
              <p className='text-lg font-bold text-blue-500'>
                {formatBytes(metrics.network.outbound)}/s
              </p>
            </div>
          </div>
        </div>

        {/* Services Status */}
        <div className='p-4 rounded-lg bg-muted/30 border border-border/50'>
          <div className='flex items-center justify-between mb-3'>
            <h4 className='font-semibold text-sm flex items-center gap-2'>
              <Zap className='w-4 h-4 text-primary' />
              Services Status
            </h4>
          </div>
          <div className='grid grid-cols-3 gap-3'>
            <div className='text-center'>
              <p className='text-2xl font-bold text-green-500'>
                {metrics.services.running}
              </p>
              <p className='text-xs text-muted-foreground'>Running</p>
            </div>
            <div className='text-center'>
              <p className='text-2xl font-bold text-red-500'>
                {metrics.services.stopped}
              </p>
              <p className='text-xs text-muted-foreground'>Stopped</p>
            </div>
            <div className='text-center'>
              <p className='text-2xl font-bold'>{metrics.services.total}</p>
              <p className='text-xs text-muted-foreground'>Total</p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {(metrics.cpu.usage > 80 ||
          metrics.memory.percentage > 80 ||
          metrics.disk.percentage > 80) && (
          <div className='p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30'>
            <div className='flex items-start gap-3'>
              <AlertCircle className='w-5 h-5 text-yellow-500 shrink-0 mt-0.5' />
              <div>
                <h4 className='font-semibold text-sm text-yellow-500'>
                  High Resource Usage Detected
                </h4>
                <p className='text-xs text-muted-foreground mt-1'>
                  {metrics.cpu.usage > 80 && 'CPU usage is above 80%. '}
                  {metrics.memory.percentage > 80 && 'Memory usage is above 80%. '}
                  {metrics.disk.percentage > 80 && 'Disk usage is above 80%. '}
                  Consider scaling resources or optimizing services.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Mock data generator for testing
export const generateMockMetrics = (): SystemMetrics => ({
  cpu: {
    usage: Math.random() * 60 + 20,
    cores: 8,
    temperature: Math.random() * 20 + 50,
    processes: Math.floor(Math.random() * 100 + 150),
  },
  memory: {
    used: Math.random() * 8 * 1024 * 1024 * 1024 + 4 * 1024 * 1024 * 1024,
    total: 16 * 1024 * 1024 * 1024,
    percentage: Math.random() * 50 + 30,
    swap: Math.random() * 1024 * 1024 * 1024,
  },
  disk: {
    used: Math.random() * 200 * 1024 * 1024 * 1024 + 50 * 1024 * 1024 * 1024,
    total: 500 * 1024 * 1024 * 1024,
    percentage: Math.random() * 40 + 20,
    iops: Math.floor(Math.random() * 500 + 200),
  },
  network: {
    inbound: Math.random() * 100 * 1024 * 1024,
    outbound: Math.random() * 50 * 1024 * 1024,
    connections: Math.floor(Math.random() * 200 + 100),
  },
  services: {
    total: 12,
    running: 11,
    stopped: 1,
  },
})
