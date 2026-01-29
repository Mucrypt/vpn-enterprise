'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import {
  Activity,
  Database,
  Zap,
  AlertTriangle,
  TrendingUp,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SmartMonitoringPanelProps {
  activeTenant: string
}

interface Metrics {
  activeConnections: number
  queryCount: number
  avgQueryTime: number
  storageUsed: number
  storageLimit: number
  recentErrors: number
  healthScore: number
}

export function SmartMonitoringPanel({
  activeTenant,
}: SmartMonitoringPanelProps) {
  const [metrics, setMetrics] = useState<Metrics>({
    activeConnections: 3,
    queryCount: 1247,
    avgQueryTime: 45,
    storageUsed: 128,
    storageLimit: 1024,
    recentErrors: 0,
    healthScore: 98,
  })
  const [isLive, setIsLive] = useState(true)

  // Simulate live updates
  useEffect(() => {
    if (!isLive || !activeTenant) return

    const interval = setInterval(() => {
      setMetrics((prev) => ({
        ...prev,
        activeConnections: Math.max(
          0,
          prev.activeConnections + Math.floor(Math.random() * 3) - 1,
        ),
        queryCount: prev.queryCount + Math.floor(Math.random() * 5),
        avgQueryTime: Math.max(
          10,
          prev.avgQueryTime + Math.floor(Math.random() * 10) - 5,
        ),
      }))
    }, 3000)

    return () => clearInterval(interval)
  }, [isLive, activeTenant])

  const storagePercent = (metrics.storageUsed / metrics.storageLimit) * 100
  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-emerald-500'
    if (score >= 70) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getHealthBg = (score: number) => {
    if (score >= 90) return 'bg-emerald-500/10 border-emerald-500/20'
    if (score >= 70) return 'bg-yellow-500/10 border-yellow-500/20'
    return 'bg-red-500/10 border-red-500/20'
  }

  if (!activeTenant) {
    return (
      <div className='h-full flex items-center justify-center bg-[#1e1e1e] p-6'>
        <div className='text-center text-gray-400'>
          <Database className='h-12 w-12 mx-auto mb-3 opacity-50' />
          <p className='text-sm'>Select a database to view metrics</p>
        </div>
      </div>
    )
  }

  return (
    <div className='h-full bg-[#1e1e1e] overflow-y-auto p-4 space-y-4 scrollbar scrollbar--neutral'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Activity className='h-5 w-5 text-emerald-500' />
          <h2 className='font-semibold text-white'>Live Monitoring</h2>
        </div>
        <div className='flex items-center gap-2'>
          <div
            className={cn(
              'w-2 h-2 rounded-full',
              isLive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-500',
            )}
          />
          <span className='text-xs text-gray-400'>
            {isLive ? 'Live' : 'Paused'}
          </span>
        </div>
      </div>

      {/* Health Score */}
      <Card className={cn('p-4 border', getHealthBg(metrics.healthScore))}>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-xs text-gray-400 mb-1'>Database Health</p>
            <div className='flex items-baseline gap-2'>
              <span
                className={cn(
                  'text-3xl font-bold',
                  getHealthColor(metrics.healthScore),
                )}
              >
                {metrics.healthScore}
              </span>
              <span className='text-sm text-gray-400'>/ 100</span>
            </div>
          </div>
          <div
            className={cn(
              'w-16 h-16 rounded-full flex items-center justify-center border-4',
              metrics.healthScore >= 90
                ? 'border-emerald-500'
                : metrics.healthScore >= 70
                  ? 'border-yellow-500'
                  : 'border-red-500',
            )}
          >
            <TrendingUp
              className={cn('h-6 w-6', getHealthColor(metrics.healthScore))}
            />
          </div>
        </div>
        <p className='text-xs text-gray-500 mt-2'>
          {metrics.healthScore >= 90
            ? 'Excellent performance'
            : metrics.healthScore >= 70
              ? 'Good performance'
              : 'Needs attention'}
        </p>
      </Card>

      {/* Metrics Grid */}
      <div className='grid grid-cols-2 gap-3'>
        {/* Active Connections */}
        <Card className='p-3 bg-[#2d2d30] border-[#3e3e42]'>
          <div className='flex items-center gap-2 mb-2'>
            <Zap className='h-4 w-4 text-blue-400' />
            <span className='text-xs text-gray-400'>Connections</span>
          </div>
          <div className='text-2xl font-bold text-white'>
            {metrics.activeConnections}
          </div>
          <p className='text-xs text-gray-500 mt-1'>active now</p>
        </Card>

        {/* Query Count */}
        <Card className='p-3 bg-[#2d2d30] border-[#3e3e42]'>
          <div className='flex items-center gap-2 mb-2'>
            <Database className='h-4 w-4 text-purple-400' />
            <span className='text-xs text-gray-400'>Queries</span>
          </div>
          <div className='text-2xl font-bold text-white'>
            {metrics.queryCount.toLocaleString()}
          </div>
          <p className='text-xs text-gray-500 mt-1'>today</p>
        </Card>

        {/* Avg Query Time */}
        <Card className='p-3 bg-[#2d2d30] border-[#3e3e42]'>
          <div className='flex items-center gap-2 mb-2'>
            <Clock className='h-4 w-4 text-emerald-400' />
            <span className='text-xs text-gray-400'>Avg Time</span>
          </div>
          <div className='text-2xl font-bold text-white'>
            {metrics.avgQueryTime}ms
          </div>
          <p className='text-xs text-emerald-400 mt-1'>↓ 12% faster</p>
        </Card>

        {/* Errors */}
        <Card className='p-3 bg-[#2d2d30] border-[#3e3e42]'>
          <div className='flex items-center gap-2 mb-2'>
            <AlertTriangle className='h-4 w-4 text-yellow-400' />
            <span className='text-xs text-gray-400'>Errors</span>
          </div>
          <div className='text-2xl font-bold text-white'>
            {metrics.recentErrors}
          </div>
          <p className='text-xs text-gray-500 mt-1'>last hour</p>
        </Card>
      </div>

      {/* Storage Usage */}
      <Card className='p-4 bg-[#2d2d30] border-[#3e3e42]'>
        <div className='flex items-center justify-between mb-2'>
          <span className='text-xs text-gray-400'>Storage Usage</span>
          <span className='text-xs font-medium text-white'>
            {metrics.storageUsed} MB / {metrics.storageLimit} MB
          </span>
        </div>
        <div className='w-full h-2 bg-[#1e1e1e] rounded-full overflow-hidden'>
          <div
            className={cn(
              'h-full transition-all duration-500 rounded-full',
              storagePercent < 70
                ? 'bg-emerald-500'
                : storagePercent < 90
                  ? 'bg-yellow-500'
                  : 'bg-red-500',
            )}
            style={{ width: `${storagePercent}%` }}
          />
        </div>
        <p className='text-xs text-gray-500 mt-2'>
          {storagePercent.toFixed(1)}% used
        </p>
      </Card>

      {/* Quick Actions */}
      <Card className='p-4 bg-[#2d2d30] border-[#3e3e42]'>
        <h3 className='text-xs font-medium text-gray-400 mb-3'>
          Quick Actions
        </h3>
        <div className='space-y-2'>
          <button className='w-full text-left px-3 py-2 bg-[#1e1e1e] hover:bg-[#3e3e42] rounded-lg text-xs text-gray-300 transition-colors'>
            View slow queries
          </button>
          <button className='w-full text-left px-3 py-2 bg-[#1e1e1e] hover:bg-[#3e3e42] rounded-lg text-xs text-gray-300 transition-colors'>
            Analyze performance
          </button>
          <button className='w-full text-left px-3 py-2 bg-[#1e1e1e] hover:bg-[#3e3e42] rounded-lg text-xs text-gray-300 transition-colors'>
            Export metrics
          </button>
        </div>
      </Card>
    </div>
  )
}
