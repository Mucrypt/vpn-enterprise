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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAI } from '@/services/aiService'
import { Key, CheckCircle, XCircle, Copy, Trash2, Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface APIKeyInfo {
  isValid: boolean
  usage?: {
    requests_used: number
    requests_limit: number
    requests_remaining: number
    window_reset: string
  }
}

export function APIKeyManager() {
  const [apiKey, setApiKey] = useState('')
  const [storedKey, setStoredKey] = useState('')
  const [keyInfo, setKeyInfo] = useState<APIKeyInfo | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const { toast } = useToast()
  const ai = useAI()

  useEffect(() => {
    // Load stored key on mount
    const stored = localStorage.getItem('nexusai_api_key')
    if (stored) {
      setStoredKey(stored)
      verifyStoredKey(stored)
    }
  }, [])

  const verifyStoredKey = async (key: string) => {
    setIsVerifying(true)
    try {
      ai.setAPIKey(key)
      const isValid = await ai.verifyAPIKey()

      if (isValid) {
        const usage = await ai.getUsage()
        setKeyInfo({ isValid: true, usage })
      } else {
        setKeyInfo({ isValid: false })
      }
    } catch (error) {
      console.error('Key verification failed:', error)
      setKeyInfo({ isValid: false })
    } finally {
      setIsVerifying(false)
    }
  }

  const handleSaveKey = async () => {
    if (!apiKey.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an API key',
        variant: 'destructive',
      })
      return
    }

    if (!apiKey.startsWith('vpn_')) {
      toast({
        title: 'Invalid Key Format',
        description: 'API key should start with "vpn_"',
        variant: 'destructive',
      })
      return
    }

    setIsVerifying(true)
    try {
      ai.setAPIKey(apiKey)
      const isValid = await ai.verifyAPIKey()

      if (isValid) {
        const usage = await ai.getUsage()
        setKeyInfo({ isValid: true, usage })
        setStoredKey(apiKey)
        setApiKey('')

        toast({
          title: 'Success',
          description: 'API key verified and saved',
        })
      } else {
        toast({
          title: 'Invalid Key',
          description: 'The API key could not be verified',
          variant: 'destructive',
        })
      }
    } catch (error: any) {
      toast({
        title: 'Verification Failed',
        description: error.message || 'Failed to verify API key',
        variant: 'destructive',
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const handleRemoveKey = () => {
    ai.clearAPIKey()
    setStoredKey('')
    setKeyInfo(null)
    toast({
      title: 'Key Removed',
      description: 'API key has been cleared',
    })
  }

  const handleCopyKey = () => {
    if (storedKey) {
      navigator.clipboard.writeText(storedKey)
      toast({
        title: 'Copied',
        description: 'API key copied to clipboard',
      })
    }
  }

  const getUsagePercentage = () => {
    if (!keyInfo?.usage) return 0
    return (keyInfo.usage.requests_used / keyInfo.usage.requests_limit) * 100
  }

  const getUsageColor = () => {
    const percentage = getUsagePercentage()
    if (percentage >= 90) return 'text-red-600'
    if (percentage >= 70) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <Card className='w-full max-w-2xl'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Key className='h-5 w-5' />
          API Key Management
        </CardTitle>
        <CardDescription>
          Manage your VPN Enterprise AI API key to use NexusAI features
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Current Key Status */}
        {storedKey ? (
          <div className='space-y-4'>
            <div className='flex items-center justify-between p-4 border rounded-lg'>
              <div className='flex items-center gap-3'>
                {keyInfo?.isValid ? (
                  <CheckCircle className='h-5 w-5 text-green-600' />
                ) : (
                  <XCircle className='h-5 w-5 text-red-600' />
                )}
                <div>
                  <p className='font-medium'>
                    {storedKey.substring(0, 12)}...
                    {storedKey.substring(storedKey.length - 8)}
                  </p>
                  <Badge
                    variant={keyInfo?.isValid ? 'default' : 'destructive'}
                    className='mt-1'
                  >
                    {keyInfo?.isValid ? 'Active' : 'Invalid'}
                  </Badge>
                </div>
              </div>
              <div className='flex gap-2'>
                <Button variant='outline' size='icon' onClick={handleCopyKey}>
                  <Copy className='h-4 w-4' />
                </Button>
                <Button variant='outline' size='icon' onClick={handleRemoveKey}>
                  <Trash2 className='h-4 w-4' />
                </Button>
              </div>
            </div>

            {/* Usage Statistics */}
            {keyInfo?.usage && (
              <div className='p-4 border rounded-lg space-y-3'>
                <h3 className='font-semibold'>Usage Statistics</h3>
                <div className='space-y-2'>
                  <div className='flex justify-between text-sm'>
                    <span>Requests Used</span>
                    <span className={`font-medium ${getUsageColor()}`}>
                      {keyInfo.usage.requests_used} /{' '}
                      {keyInfo.usage.requests_limit}
                    </span>
                  </div>
                  <div className='w-full bg-gray-200 rounded-full h-2'>
                    <div
                      className={`h-2 rounded-full transition-all ${
                        getUsagePercentage() >= 90
                          ? 'bg-red-600'
                          : getUsagePercentage() >= 70
                            ? 'bg-yellow-600'
                            : 'bg-green-600'
                      }`}
                      style={{ width: `${getUsagePercentage()}%` }}
                    />
                  </div>
                  <div className='flex justify-between text-xs text-gray-600'>
                    <span>{keyInfo.usage.requests_remaining} remaining</span>
                    <span>
                      Resets:{' '}
                      {new Date(keyInfo.usage.window_reset).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Add New Key Form
          <div className='space-y-4'>
            <Alert>
              <AlertDescription>
                You need an API key to use AI features. Enter your VPN
                Enterprise AI API key below or request one from your
                administrator.
              </AlertDescription>
            </Alert>

            <div className='space-y-2'>
              <Label htmlFor='apiKey'>API Key</Label>
              <div className='flex gap-2'>
                <Input
                  id='apiKey'
                  type='password'
                  placeholder='vpn_...'
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveKey()}
                />
                <Button onClick={handleSaveKey} disabled={isVerifying}>
                  {isVerifying ? 'Verifying...' : 'Save'}
                </Button>
              </div>
            </div>

            {/* Instructions */}
            <div className='text-sm text-gray-600 space-y-2'>
              <p className='font-medium'>How to get an API key:</p>
              <ol className='list-decimal list-inside space-y-1 ml-2'>
                <li>Contact your VPN Enterprise administrator</li>
                <li>
                  Or create one via the API:{' '}
                  <code className='bg-gray-100 px-1 rounded'>
                    POST /auth/create-key
                  </code>
                </li>
                <li>
                  Your key will start with{' '}
                  <code className='bg-gray-100 px-1 rounded'>vpn_</code>
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* Create Key Info (for admins) */}
        {!showCreateForm && (
          <Button
            variant='outline'
            size='sm'
            className='w-full'
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            <Plus className='h-4 w-4 mr-2' />
            Admin: Create New API Key
          </Button>
        )}

        {showCreateForm && (
          <div className='p-4 border rounded-lg bg-gray-50 space-y-3'>
            <h3 className='font-semibold'>Admin: Create New Key</h3>
            <Alert>
              <AlertDescription>
                Run this command on your server to create a new API key:
              </AlertDescription>
            </Alert>
            <pre className='bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto'>
              {`docker exec vpn-python-api curl -X POST \\
  http://localhost:5001/auth/create-key \\
  -H "Content-Type: application/json" \\
  -d '{
    "tenant_id": "your-tenant",
    "user_id": "your-user-id",
    "name": "NexusAI Key",
    "quota_requests_per_hour": 1000
  }'`}
            </pre>
            <p className='text-sm text-gray-600'>
              Copy the returned API key and paste it above.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
