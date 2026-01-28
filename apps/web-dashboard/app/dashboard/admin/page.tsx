'use client'

import { useState, useEffect } from 'react'
import { useClientDate } from '@/hooks/useClientDate'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import {
  Settings,
  Users,
  Server,
  Database,
  Bell,
  Lock,
  Globe,
  Zap,
  Activity,
  BarChart3,
  Shield,
} from 'lucide-react'
import toast from 'react-hot-toast'
// Lightweight QR image generator using the 'qrcode' library (loaded dynamically)
function QRImage({
  value,
  size = 128,
}: {
  value?: string | null
  size?: number
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    if (!value) {
      setDataUrl(null)
      return
    }
    ;(async () => {
      try {
        const qrcode = await import('qrcode')
        const url = await qrcode.toDataURL(value, { margin: 1, width: size })
        if (mounted) setDataUrl(url)
      } catch (err) {
        console.error('Failed to generate QR', err)
      }
    })()
    return () => {
      mounted = false
    }
  }, [value, size])

  if (!dataUrl)
    return (
      <div className='w-32 h-32 bg-gray-50 flex items-center justify-center text-xs text-gray-400'>
        No QR
      </div>
    )
  return <img src={dataUrl} width={size} height={size} alt='QR code' />
}

export default function AdminPage() {
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [lastConfig, setLastConfig] = useState<string | null>(null)
  const [lastClient, setLastClient] = useState<any | null>(null)
  const [showQRModal, setShowQRModal] = useState(false)
  const lastBackupDate = useClientDate()

  useEffect(() => {
    loadAdminData()
  }, [])

  // Close QR modal on Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowQRModal(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  async function loadAdminData() {
    try {
      setLoading(true)
      const statsData = await api.getUserStats().catch(() => ({}))
      setStats(statsData)
    } catch (error: any) {
      toast.error('Failed to load admin data')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen bg-[#0a0a0a]'>
      {/* Header with gradient */}
      <div className='border-b border-gray-800 bg-linear-to-r from-[#1e1e1e] to-[#0a0a0a]'>
        <div className='max-w-7xl mx-auto px-6 py-8'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-white flex items-center gap-3'>
                <Shield className='h-8 w-8 text-emerald-500' />
                Super Admin Panel
              </h1>
              <p className='text-gray-400 mt-2'>
                System-wide configuration and management
              </p>
            </div>
            <Button
              onClick={async () => {
                try {
                  setShowQRModal(false)
                  toast.loading('Creating test client...')
                  const name = `admin-test-${Date.now() % 10000}`
                  const isLocal =
                    typeof window !== 'undefined' &&
                    (window.location.hostname === 'localhost' ||
                      window.location.hostname === '127.0.0.1')
                  const payload = {
                    name,
                    testMode: true,
                    wgDir: '/tmp/wgtest',
                    publicIP: '127.0.0.1',
                    port: 51820,
                  }
                  const resp = isLocal
                    ? await api.createDevVPNClient(payload)
                    : await api.createAdminVPNClient(payload)
                  setLastClient(resp.client)
                  setLastConfig(resp.config || null)
                  toast.dismiss()
                  toast.success('Test client created')
                } catch (err: any) {
                  toast.dismiss()
                  console.error(err)
                  toast.error('Failed to create test client')
                }
              }}
              className='bg-emerald-600 hover:bg-emerald-700 text-white'
            >
              <Zap className='h-4 w-4 mr-2' />
              Quick Test Client
            </Button>
          </div>
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-6 py-8 space-y-8'>
        {/* System Overview - Dark Theme */}
        <div className='grid gap-4 md:grid-cols-4'>
          <Card className='bg-[#1e1e1e] border-gray-800'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium text-gray-400 flex items-center gap-2'>
                <Server className='h-4 w-4' />
                Total Servers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-3xl font-bold text-white'>
                {stats?.totalServers || 0}
              </div>
              <p className='text-xs text-emerald-500 mt-1'>
                ↑ 2 added this week
              </p>
            </CardContent>
          </Card>

          <Card className='bg-[#1e1e1e] border-gray-800'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium text-gray-400 flex items-center gap-2'>
                <Users className='h-4 w-4' />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-3xl font-bold text-white'>
                {stats?.totalUsers || 0}
              </div>
              <p className='text-xs text-emerald-500 mt-1'>↑ 15% growth rate</p>
            </CardContent>
          </Card>

          <Card className='bg-[#1e1e1e] border-gray-800'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium text-gray-400 flex items-center gap-2'>
                <Activity className='h-4 w-4' />
                Active Connections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-3xl font-bold text-emerald-500'>
                {stats?.activeConnections || 0}
              </div>
              <p className='text-xs text-gray-500 mt-1'>real-time</p>
            </CardContent>
          </Card>

          <Card className='bg-[#1e1e1e] border-gray-800'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium text-gray-400 flex items-center gap-2'>
                <BarChart3 className='h-4 w-4' />
                Data Transfer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-3xl font-bold text-white'>
                {stats?.dataTransferred || '0 GB'}
              </div>
              <p className='text-xs text-gray-500 mt-1'>this month</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className='bg-[#1e1e1e] border-gray-800'>
          <CardHeader>
            <CardTitle className='text-white'>Quick Actions</CardTitle>
            <CardDescription className='text-gray-400'>
              Navigate to key administrative areas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
              <Button
                className='h-24 flex-col gap-2 bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-emerald-600'
                variant='outline'
                onClick={() => router.push('/databases/admin')}
              >
                <Database className='h-8 w-8 text-emerald-500' />
                <span>Database Platform</span>
              </Button>
              <Button
                className='h-24 flex-col gap-2 bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-emerald-600'
                variant='outline'
                onClick={() => router.push('/dashboard/admin/organizations')}
              >
                <Users className='h-8 w-8 text-blue-500' />
                <span>Organizations</span>
              </Button>
              <Button
                className='h-24 flex-col gap-2 bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-emerald-600'
                variant='outline'
                onClick={() => router.push('/dashboard/admin/realtime')}
              >
                <Activity className='h-8 w-8 text-purple-500' />
                <span>Realtime</span>
              </Button>
              <Button
                className='h-24 flex-col gap-2 bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-emerald-600'
                variant='outline'
                onClick={() => router.push('/dashboard/admin/n8n')}
              >
                <Zap className='h-8 w-8 text-orange-500' />
                <span>N8N Workflows</span>
              </Button>
              <Button
                className='h-24 flex-col gap-2 bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-emerald-600'
                variant='outline'
                onClick={async () => {
                  try {
                    toast.loading('Creating test client...')
                    const name = `admin-test-${Date.now() % 10000}`
                    const isLocal =
                      typeof window !== 'undefined' &&
                      (window.location.hostname === 'localhost' ||
                        window.location.hostname === '127.0.0.1')
                    const payload = {
                      name,
                      testMode: true,
                      wgDir: '/tmp/wgtest',
                      publicIP: '127.0.0.1',
                      port: 51820,
                    }
                    const resp = isLocal
                      ? await api.createDevVPNClient(payload)
                      : await api.createAdminVPNClient(payload)
                    setLastClient(resp.client)
                    setLastConfig(resp.config || null)
                    toast.dismiss()
                    toast.success('Test client created')
                  } catch (err: any) {
                    toast.dismiss()
                    console.error(err)
                    toast.error('Failed to create test client')
                  }
                }}
              >
                <Server className='h-8 w-8 text-green-500' />
                <span>Create Test Client</span>
              </Button>
              <Button
                className='h-24 flex-col gap-2 bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-emerald-600'
                variant='outline'
              >
                <Bell className='h-8 w-8 text-yellow-500' />
                <span>View Alerts</span>
              </Button>
              <Button
                className='h-24 flex-col gap-2 bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-emerald-600'
                variant='outline'
              >
                <Lock className='h-8 w-8 text-red-500' />
                <span>Security</span>
              </Button>
              <Button
                className='h-24 flex-col gap-2 bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-emerald-600'
                variant='outline'
              >
                <Database className='h-8 w-8 text-cyan-500' />
                <span>Backup Data</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Configuration */}
        <div className='grid gap-6 md:grid-cols-2'>
          {/* General Settings */}
          <Card className='bg-[#1e1e1e] border-gray-800'>
            <CardHeader>
              <CardTitle className='text-white flex items-center gap-2'>
                <Settings className='h-5 w-5 text-emerald-500' />
                General Settings
              </CardTitle>
              <CardDescription className='text-gray-400'>
                Core system configuration
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center justify-between py-3 border-b border-gray-800'>
                <div>
                  <p className='font-medium text-white'>Maintenance Mode</p>
                  <p className='text-sm text-gray-500'>
                    Temporarily disable user access
                  </p>
                </div>
                <label className='relative inline-flex items-center cursor-pointer'>
                  <input type='checkbox' className='sr-only peer' />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className='flex items-center justify-between py-3 border-b border-gray-800'>
                <div>
                  <p className='font-medium text-white'>Auto-scaling</p>
                  <p className='text-sm text-gray-500'>
                    Automatically provision servers
                  </p>
                </div>
                <label className='relative inline-flex items-center cursor-pointer'>
                  <input
                    type='checkbox'
                    className='sr-only peer'
                    defaultChecked
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className='flex items-center justify-between py-3'>
                <div>
                  <p className='font-medium text-white'>Email Notifications</p>
                  <p className='text-sm text-gray-500'>
                    Send system alerts via email
                  </p>
                </div>
                <label className='relative inline-flex items-center cursor-pointer'>
                  <input
                    type='checkbox'
                    className='sr-only peer'
                    defaultChecked
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className='bg-[#1e1e1e] border-gray-800'>
            <CardHeader>
              <CardTitle className='text-white flex items-center gap-2'>
                <Lock className='h-5 w-5 text-red-500' />
                Security Settings
              </CardTitle>
              <CardDescription className='text-gray-400'>
                Security and access control
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center justify-between py-3 border-b border-gray-800'>
                <div>
                  <p className='font-medium text-white'>
                    Require 2FA for Admins
                  </p>
                  <p className='text-sm text-gray-500'>
                    Enforce two-factor authentication
                  </p>
                </div>
                <label className='relative inline-flex items-center cursor-pointer'>
                  <input
                    type='checkbox'
                    className='sr-only peer'
                    defaultChecked
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className='flex items-center justify-between py-3 border-b border-gray-800'>
                <div>
                  <p className='font-medium text-white'>IP Whitelist</p>
                  <p className='text-sm text-gray-500'>
                    Restrict admin access by IP
                  </p>
                </div>
                <label className='relative inline-flex items-center cursor-pointer'>
                  <input type='checkbox' className='sr-only peer' />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className='flex items-center justify-between py-3'>
                <div>
                  <p className='font-medium text-white'>Audit Logging</p>
                  <p className='text-sm text-gray-500'>
                    Track all admin actions
                  </p>
                </div>
                <label className='relative inline-flex items-center cursor-pointer'>
                  <input
                    type='checkbox'
                    className='sr-only peer'
                    defaultChecked
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* API Configuration */}
          <Card className='bg-[#1e1e1e] border-gray-800'>
            <CardHeader>
              <CardTitle className='text-white flex items-center gap-2'>
                <Globe className='h-5 w-5 text-purple-500' />
                API Configuration
              </CardTitle>
              <CardDescription className='text-gray-400'>
                API keys and integrations
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='p-3 bg-gray-900 border border-gray-700 rounded-lg'>
                <p className='text-sm font-medium text-gray-300 mb-1'>
                  Production API Key
                </p>
                <p className='font-mono text-xs text-gray-500 break-all'>
                  pk_live_51H...3xK2
                </p>
              </div>
              <Button
                variant='outline'
                size='sm'
                className='w-full border-gray-700 text-gray-300 hover:bg-gray-800'
              >
                Generate New Key
              </Button>
              <Button
                variant='outline'
                size='sm'
                className='w-full border-gray-700 text-gray-300 hover:bg-gray-800'
              >
                View API Documentation
              </Button>
            </CardContent>
          </Card>

          {/* Database Management */}
          <Card className='bg-[#1e1e1e] border-gray-800'>
            <CardHeader>
              <CardTitle className='text-white flex items-center gap-2'>
                <Database className='h-5 w-5 text-cyan-500' />
                Database Management
              </CardTitle>
              <CardDescription className='text-gray-400'>
                Backup and maintenance
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='p-3 bg-emerald-950 border border-emerald-800 rounded-lg'>
                <p className='text-sm font-medium text-emerald-300 mb-1'>
                  Last Backup
                </p>
                <p className='text-xs text-emerald-400'>
                  {lastBackupDate
                    ? lastBackupDate.toLocaleString()
                    : 'Loading...'}
                </p>
              </div>
              <Button
                variant='outline'
                size='sm'
                className='w-full border-gray-700 text-gray-300 hover:bg-gray-800'
              >
                Create Backup Now
              </Button>
              <Button
                variant='outline'
                size='sm'
                className='w-full border-gray-700 text-gray-300 hover:bg-gray-800'
              >
                Restore from Backup
              </Button>
              <Button
                variant='outline'
                size='sm'
                className='w-full border-gray-700 text-gray-300 hover:bg-gray-800'
              >
                Run Maintenance
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* System Health */}
        <Card className='bg-[#1e1e1e] border-gray-800'>
          <CardHeader>
            <CardTitle className='text-white flex items-center gap-2'>
              <Activity className='h-5 w-5 text-emerald-500' />
              System Health
            </CardTitle>
            <CardDescription className='text-gray-400'>
              Infrastructure status and performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid gap-4 md:grid-cols-3'>
              <div className='p-4 bg-emerald-950 border border-emerald-800 rounded-lg'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-sm font-medium text-gray-300'>
                    API Status
                  </span>
                  <span className='h-3 w-3 rounded-full bg-emerald-500 animate-pulse'></span>
                </div>
                <p className='text-2xl font-bold text-emerald-400'>
                  Operational
                </p>
                <p className='text-xs text-gray-500 mt-1'>
                  Response time: 45ms
                </p>
              </div>

              <div className='p-4 bg-emerald-950 border border-emerald-800 rounded-lg'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-sm font-medium text-gray-300'>
                    Database
                  </span>
                  <span className='h-3 w-3 rounded-full bg-emerald-500 animate-pulse'></span>
                </div>
                <p className='text-2xl font-bold text-emerald-400'>Healthy</p>
                <p className='text-xs text-gray-500 mt-1'>
                  Connections: 45/100
                </p>
              </div>

              <div className='p-4 bg-emerald-950 border border-emerald-800 rounded-lg'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-sm font-medium text-gray-300'>
                    VPN Servers
                  </span>
                  <span className='h-3 w-3 rounded-full bg-emerald-500 animate-pulse'></span>
                </div>
                <p className='text-2xl font-bold text-emerald-400'>
                  All Online
                </p>
                <p className='text-xs text-gray-500 mt-1'>Average load: 45%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {lastConfig && (
          <Card className='bg-[#1e1e1e] border-gray-800'>
            <CardHeader>
              <CardTitle className='text-white'>
                Last Generated Client Config
              </CardTitle>
              <CardDescription className='text-gray-400'>
                Copy or download the client configuration for quick testing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='mb-3'>
                <p className='text-sm text-gray-400'>
                  Client:{' '}
                  <span className='text-white'>{lastClient?.name || '—'}</span>
                </p>
                <p className='text-sm text-gray-400'>
                  Allocated IP:{' '}
                  <span className='text-white'>
                    {lastClient?.ipAddress || '—'}
                  </span>
                </p>
              </div>
              <div className='mb-3'>
                <pre className='p-3 bg-gray-900 border border-gray-700 rounded text-xs whitespace-pre-wrap text-gray-300'>
                  {lastConfig}
                </pre>
              </div>
              <div className='flex gap-2 items-center'>
                <div className='p-2 bg-gray-900 border border-gray-700 rounded shadow'>
                  <QRImage value={lastConfig} size={128} />
                </div>
                <Button
                  size='sm'
                  className='bg-emerald-600 hover:bg-emerald-700'
                  onClick={async () => {
                    await navigator.clipboard.writeText(lastConfig)
                    toast.success('Config copied to clipboard')
                  }}
                >
                  Copy
                </Button>
                <Button
                  size='sm'
                  variant='outline'
                  className='border-gray-700 text-gray-300 hover:bg-gray-800'
                  onClick={() => setShowQRModal(true)}
                >
                  Open QR
                </Button>
                <Button
                  size='sm'
                  variant='outline'
                  className='border-gray-700 text-gray-300 hover:bg-gray-800'
                  onClick={() => {
                    const blob = new Blob([lastConfig], { type: 'text/plain' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `${lastClient?.name || 'client'}-wg.conf`
                    document.body.appendChild(a)
                    a.click()
                    a.remove()
                    URL.revokeObjectURL(url)
                  }}
                >
                  Download
                </Button>
              </div>

              {/* QR Modal */}
              {showQRModal && (
                <div
                  className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75'
                  onClick={(e) => {
                    if (e.target === e.currentTarget) setShowQRModal(false)
                  }}
                >
                  <div className='relative bg-[#1e1e1e] border border-gray-700 rounded-lg p-6 w-[min(90%,600px)]'>
                    <button
                      onClick={() => setShowQRModal(false)}
                      aria-label='Close QR modal'
                      className='absolute top-3 right-3 bg-gray-800 hover:bg-gray-700 rounded-full w-8 h-8 flex items-center justify-center text-gray-300 text-xl'
                    >
                      ×
                    </button>
                    <div className='flex justify-between items-start'>
                      <h3 className='text-lg font-semibold text-white'>
                        Scan to import (WireGuard)
                      </h3>
                    </div>
                    <div className='mt-4 flex flex-col items-center gap-4'>
                      <div className='bg-white p-4 rounded'>
                        <QRImage value={lastConfig || ''} size={256} />
                      </div>
                      <div className='w-full'>
                        <p className='text-sm text-gray-400 mb-2'>
                          Client:{' '}
                          <span className='font-mono text-white'>
                            {lastClient?.name}
                          </span>
                        </p>
                        <pre className='p-3 bg-gray-900 border border-gray-700 rounded text-xs whitespace-pre-wrap max-h-48 overflow-auto text-gray-300'>
                          {lastConfig}
                        </pre>
                      </div>
                      <div className='flex gap-2'>
                        <Button
                          className='bg-emerald-600 hover:bg-emerald-700'
                          onClick={async () => {
                            await navigator.clipboard.writeText(
                              lastConfig || '',
                            )
                            toast.success('Config copied to clipboard')
                          }}
                        >
                          Copy
                        </Button>
                        <Button
                          variant='outline'
                          className='border-gray-700 text-gray-300 hover:bg-gray-800'
                          onClick={() => {
                            const blob = new Blob([lastConfig || ''], {
                              type: 'text/plain',
                            })
                            const url = URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            a.download = `${lastClient?.name || 'client'}-wg.conf`
                            document.body.appendChild(a)
                            a.click()
                            a.remove()
                            URL.revokeObjectURL(url)
                          }}
                        >
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
