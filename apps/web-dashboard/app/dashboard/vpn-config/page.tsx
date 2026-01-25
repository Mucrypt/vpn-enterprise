'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Download,
  Smartphone,
  Laptop,
  Tablet,
  Plus,
  Trash2,
  Shield,
  Activity,
  AlertCircle,
  CheckCircle,
  Copy,
  ExternalLink,
} from 'lucide-react'
import { useAuthStore } from '@/lib/store'

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://api:5000')

interface VPNConfig {
  id: string
  device_name: string
  allocated_ip: string
  created_at: string
  is_active: boolean
  bytes_sent: number
  bytes_received: number
}

export default function VPNConfigPage() {
  const { user } = useAuthStore()
  const [configs, setConfigs] = useState<VPNConfig[]>([])
  const [usage, setUsage] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showAddDevice, setShowAddDevice] = useState(false)
  const [deviceName, setDeviceName] = useState('')
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    loadConfigs()
    loadUsage()
  }, [user])

  const loadConfigs = async () => {
    if (!user) return

    try {
      const response = await fetch(
        `${API_URL}/api/v1/vpn/configs?userId=${user.id}`,
      )
      const data = await response.json()
      setConfigs(data.configs || [])
    } catch (error) {
      console.error('Failed to load configs:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUsage = async () => {
    if (!user) return

    try {
      const response = await fetch(
        `${API_URL}/api/v1/vpn/usage?userId=${user.id}`,
      )
      const data = await response.json()
      setUsage(data.usage)
    } catch (error) {
      console.error('Failed to load usage:', error)
    }
  }

  const generateConfig = async () => {
    if (!deviceName.trim() || !user) return

    setGenerating(true)
    try {
      const response = await fetch(`${API_URL}/api/v1/vpn/generate-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          deviceName: deviceName.trim(),
        }),
      })

      const data = await response.json()

      if (data.error) {
        alert(data.message || data.error)
        return
      }

      // Download the config file
      const blob = new Blob([data.configFile], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = data.downloadFilename
      a.click()
      URL.revokeObjectURL(url)

      setDeviceName('')
      setShowAddDevice(false)
      loadConfigs()
    } catch (error) {
      console.error('Failed to generate config:', error)
      alert('Failed to generate configuration')
    } finally {
      setGenerating(false)
    }
  }

  const deleteConfig = async (id: string) => {
    if (!confirm('Are you sure you want to remove this device?')) return

    try {
      await fetch(`${API_URL}/api/v1/vpn/configs/${id}`, {
        method: 'DELETE',
      })
      loadConfigs()
    } catch (error) {
      console.error('Failed to delete config:', error)
    }
  }

  const getDeviceIcon = (name: string) => {
    const lower = name.toLowerCase()
    if (
      lower.includes('phone') ||
      lower.includes('iphone') ||
      lower.includes('android')
    ) {
      return <Smartphone className='h-5 w-5' />
    }
    if (lower.includes('ipad') || lower.includes('tablet')) {
      return <Tablet className='h-5 w-5' />
    }
    return <Laptop className='h-5 w-5' />
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center h-96'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600'></div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <div className='relative flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>
            VPN Configuration
          </h1>
          <p className='text-gray-600 mt-1'>
            Download WireGuard configs for your devices
          </p>
        </div>
        <div className='absolute right-4 top-1/2 -translate-y-1/2'>
          <Button
            onClick={() => setShowAddDevice(true)}
            disabled={showAddDevice}
            className='z-9999 shadow bg-black text-white hover:bg-gray-900'
          >
            <Plus className='h-4 w-4 mr-2' />
            Add Device
          </Button>
        </div>
      </div>

      {/* Data Usage */}
      {usage && (
        <Card className='border-emerald-200 bg-emerald-50'>
          <CardHeader>
            <CardTitle className='flex items-center text-emerald-900'>
              <Activity className='h-5 w-5 mr-2' />
              Data Usage This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-emerald-800'>Used</span>
                <span className='text-lg font-bold text-emerald-900'>
                  {usage.total_mb} MB{' '}
                  {usage.unlimited ? '' : `/ ${usage.limit_mb} MB`}
                </span>
              </div>

              {!usage.unlimited && (
                <>
                  <div className='w-full bg-emerald-200 rounded-full h-3'>
                    <div
                      className={`h-3 rounded-full transition-all ${
                        parseFloat(usage.percentage_used) > 90
                          ? 'bg-red-600'
                          : parseFloat(usage.percentage_used) > 75
                            ? 'bg-yellow-600'
                            : 'bg-emerald-600'
                      }`}
                      style={{
                        width: `${Math.min(usage.percentage_used, 100)}%`,
                      }}
                    ></div>
                  </div>
                  <p className='text-xs text-emerald-700'>
                    {usage.percentage_used}% used
                    {parseFloat(usage.percentage_used) > 80 && (
                      <span className='ml-2 text-orange-700 font-medium'>
                        ⚠️ Consider upgrading for unlimited data
                      </span>
                    )}
                  </p>
                </>
              )}

              <div className='grid grid-cols-2 gap-4 pt-2 border-t border-emerald-200'>
                <div>
                  <p className='text-xs text-emerald-700'>Downloaded</p>
                  <p className='text-sm font-medium text-emerald-900'>
                    {formatBytes(usage.bytes_received)}
                  </p>
                </div>
                <div>
                  <p className='text-xs text-emerald-700'>Uploaded</p>
                  <p className='text-sm font-medium text-emerald-900'>
                    {formatBytes(usage.bytes_sent)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Device Form */}
      {showAddDevice && (
        <Card className='border-emerald-300 bg-emerald-50'>
          <CardHeader>
            <CardTitle className='text-blue-900'>Add New Device</CardTitle>
            <CardDescription>
              Generate a WireGuard configuration for your device
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <Label htmlFor='deviceName' className='text-blue-900'>
                Device Name
              </Label>
              <Input
                id='deviceName'
                placeholder='e.g., iPhone 15, MacBook Pro, Windows PC'
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                className='mt-1'
              />
            </div>

            <div className='bg-white border border-blue-200 rounded-lg p-4'>
              <h4 className='font-medium text-sm text-gray-900 mb-2'>
                📱 How to use:
              </h4>
              <ol className='text-sm text-gray-700 space-y-1 list-decimal list-inside'>
                <li>Enter a name for your device</li>
                <li>Click "Generate Configuration"</li>
                <li>Download WireGuard app from your app store</li>
                <li>Import the downloaded .conf file</li>
                <li>Connect and enjoy secure VPN!</li>
              </ol>
            </div>

            <div className='flex space-x-2'>
              <Button
                onClick={generateConfig}
                disabled={!deviceName.trim() || generating}
                className='flex-1 bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-700'
              >
                {generating ? 'Generating...' : 'Generate Configuration'}
              </Button>
              <Button
                variant='outline'
                className='border-emerald-600 text-emerald-700 hover:bg-emerald-100'
                onClick={() => {
                  setShowAddDevice(false)
                  setDeviceName('')
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Device List */}
      <div className='grid grid-cols-1 gap-4'>
        {configs.length === 0 ? (
          <Card>
            <CardContent className='py-16 text-center'>
              <Shield className='h-16 w-16 mx-auto text-gray-300 mb-4' />
              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                No devices configured
              </h3>
              <p className='text-gray-600 mb-4'>
                Add your first device to start using the VPN
              </p>
              <Button
                onClick={() => setShowAddDevice(true)}
                className='bg-black text-white hover:bg-gray-900'
              >
                <Plus className='h-4 w-4 mr-2' />
                Add Your First Device
              </Button>
            </CardContent>
          </Card>
        ) : (
          configs.map((config) => (
            <Card
              key={config.id}
              className={!config.is_active ? 'opacity-50' : ''}
            >
              <CardContent className='p-6'>
                <div className='flex items-start justify-between'>
                  <div className='flex items-start space-x-4'>
                    <div className='p-3 bg-emerald-100 rounded-lg'>
                      {getDeviceIcon(config.device_name)}
                    </div>
                    <div className='flex-1'>
                      <div className='flex items-center space-x-2'>
                        <h3 className='font-semibold text-gray-900'>
                          {config.device_name}
                        </h3>
                        {config.is_active ? (
                          <Badge className='bg-green-100 text-green-800'>
                            <CheckCircle className='h-3 w-3 mr-1' />
                            Active
                          </Badge>
                        ) : (
                          <Badge className='bg-gray-100 text-gray-800'>
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <div className='mt-2 space-y-1'>
                        <p className='text-sm text-gray-600'>
                          IP Address:{' '}
                          <span className='font-mono text-gray-900'>
                            {config.allocated_ip}
                          </span>
                        </p>
                        <p className='text-sm text-gray-600'>
                          Created:{' '}
                          {new Date(config.created_at).toLocaleDateString()}
                        </p>
                        {config.bytes_sent + config.bytes_received > 0 && (
                          <p className='text-sm text-gray-600'>
                            Total Data:{' '}
                            {formatBytes(
                              config.bytes_sent + config.bytes_received,
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => deleteConfig(config.id)}
                    className='text-red-600 hover:text-red-700 hover:bg-red-50'
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started with WireGuard</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <a
              href='https://apps.apple.com/us/app/wireguard/id1441195209'
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors'
            >
              <div className='flex-1'>
                <h4 className='font-medium text-gray-900'>iOS (iPhone/iPad)</h4>
                <p className='text-sm text-gray-600'>Download from App Store</p>
              </div>
              <ExternalLink className='h-5 w-5 text-gray-400' />
            </a>

            <a
              href='https://play.google.com/store/apps/details?id=com.wireguard.android'
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors'
            >
              <div className='flex-1'>
                <h4 className='font-medium text-gray-900'>Android</h4>
                <p className='text-sm text-gray-600'>
                  Download from Play Store
                </p>
              </div>
              <ExternalLink className='h-5 w-5 text-gray-400' />
            </a>

            <a
              href='https://www.wireguard.com/install/'
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors'
            >
              <div className='flex-1'>
                <h4 className='font-medium text-gray-900'>Windows/Mac/Linux</h4>
                <p className='text-sm text-gray-600'>
                  Download from official site
                </p>
              </div>
              <ExternalLink className='h-5 w-5 text-gray-400' />
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
