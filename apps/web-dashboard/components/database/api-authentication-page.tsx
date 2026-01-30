// apps/web-dashboard/components/database/api-authentication-page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Copy,
  Check,
  Key,
  Shield,
  Eye,
  EyeOff,
  AlertTriangle,
  Lock,
  Unlock,
  RefreshCw,
  Loader2,
} from 'lucide-react'

interface ApiAuthenticationPageProps {
  activeTenant: string
}

interface TenantApiKeys {
  apiUrl: string
  anonKey: string
  serviceKey: string
  projectRef: string
}

export function ApiAuthenticationPage({
  activeTenant,
}: ApiAuthenticationPageProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [showAnonKey, setShowAnonKey] = useState(false)
  const [showServiceKey, setShowServiceKey] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [apiKeys, setApiKeys] = useState<TenantApiKeys | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch tenant API keys
  useEffect(() => {
    if (activeTenant) {
      fetchApiKeys()
    }
  }, [activeTenant])

  const fetchApiKeys = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `/api/v1/tenants/${activeTenant}/api-keys`,
        {
          credentials: 'include',
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch API keys')
      }

      const data = await response.json()
      setApiKeys(data)
    } catch (err) {
      console.error('Error fetching API keys:', err)
      setError('Failed to load API keys')
      // Set default values for development
      setApiKeys({
        apiUrl: `https://api.vpnenterprise.com/v1/projects/${activeTenant}`,
        anonKey: 'API keys not configured - click Generate to create',
        serviceKey: 'API keys not configured - click Generate to create',
        projectRef: activeTenant,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const generateApiKeys = async () => {
    setIsGenerating(true)
    setError(null)
    try {
      const response = await fetch(
        `/api/v1/tenants/${activeTenant}/api-keys/generate`,
        {
          method: 'POST',
          credentials: 'include',
        }
      )

      if (!response.ok) {
        throw new Error('Failed to generate API keys')
      }

      const data = await response.json()
      setApiKeys(data)
    } catch (err) {
      console.error('Error generating API keys:', err)
      setError('Failed to generate API keys')
    } finally {
      setIsGenerating(false)
    }
  }

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-96'>
        <div className='text-center'>
          <Loader2 className='h-8 w-8 animate-spin text-emerald-600 mx-auto mb-2' />
          <p className='text-sm text-gray-400'>Loading API keys...</p>
        </div>
      </div>
    )
  }

  const apiUrl = apiKeys?.apiUrl || ''
  const anonKey = apiKeys?.anonKey || ''
  const serviceKey = apiKeys?.serviceKey || ''

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(type)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const signUpExample = `// Sign up new user
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure-password-123'
})

// Access user data
console.log(data.user)
console.log(data.session)`

  const signInExample = `// Sign in existing user
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure-password-123'
})

// Session contains access_token
console.log(data.session.access_token)`

  const useAuthExample = `// Get current user
const { data: { user } } = await supabase.auth.getUser()

// Get current session
const { data: { session } } = await supabase.auth.getSession()

// Listen to auth changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log(event, session)
})`

  const authenticatedRequestExample = `// The SDK automatically includes the access_token
const { data, error } = await supabase
  .from('private_table')
  .select('*')

// Manual API request with token
const response = await fetch('${apiUrl}/rest/v1/private_table', {
  headers: {
    'apikey': '${anonKey}',
    'Authorization': \`Bearer \${session.access_token}\`
  }
})`

  const rlsExample = `-- Enable RLS on a table
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own posts
CREATE POLICY "Users can view own posts"
ON posts FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own posts
CREATE POLICY "Users can insert own posts"
ON posts FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own posts
CREATE POLICY "Users can update own posts"
ON posts FOR UPDATE
USING (auth.uid() = user_id);`

  const serviceRoleExample = `// Service role key bypasses RLS - use server-side only!
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  '${apiUrl}',
  '${serviceKey}' // ⚠️ NEVER expose this in client code
)

// This query bypasses all RLS policies
const { data, error } = await supabase
  .from('users')
  .select('*') // Returns ALL users regardless of RLS`

  return (
    <div className='p-6 max-w-5xl mx-auto space-y-6'>
      {/* Header */}
      <div>
        <div className='flex items-center justify-between mb-2'>
          <h1 className='text-3xl font-bold text-white'>Authentication</h1>
          <Button
            onClick={generateApiKeys}
            disabled={isGenerating}
            className='bg-emerald-600 hover:bg-emerald-700'
          >
            {isGenerating ? (
              <>
                <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className='h-4 w-4 mr-2' />
                Regenerate Keys
              </>
            )}
          </Button>
        </div>
        <p className='text-gray-400'>
          Secure your API with built-in authentication and authorization. All
          requests must include valid API keys.
        </p>
        {error && (
          <div className='mt-4 p-3 bg-red-600/10 border border-red-600/20 rounded-lg'>
            <p className='text-sm text-red-400'>
              <AlertTriangle className='h-4 w-4 inline mr-2' />
              {error}
            </p>
          </div>
        )}
      </div>

      {/* API Keys */}
      <div className='space-y-4'>
        <h2 className='text-xl font-semibold text-white flex items-center gap-2'>
          <Key className='h-5 w-5 text-emerald-400' />
          API Keys
        </h2>

        {/* Anon Key */}
        <Card className='bg-gray-900 border-gray-800 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 rounded-lg bg-emerald-600/20 flex items-center justify-center'>
                <Unlock className='h-5 w-5 text-emerald-400' />
              </div>
              <div>
                <h3 className='font-semibold text-white'>Anon / Public Key</h3>
                <p className='text-xs text-gray-400'>
                  Safe to use in browser and mobile apps
                </p>
              </div>
            </div>
            <Badge variant='outline' className='text-emerald-400'>
              Public
            </Badge>
          </div>

          <div className='flex items-center gap-2'>
            <div className='flex-1 bg-gray-950 border border-gray-800 rounded-lg p-3 font-mono text-sm text-gray-300 overflow-x-auto'>
              {showAnonKey ? anonKey : '•'.repeat(120)}
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setShowAnonKey(!showAnonKey)}
            >
              {showAnonKey ? (
                <EyeOff className='h-4 w-4' />
              ) : (
                <Eye className='h-4 w-4' />
              )}
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => copyToClipboard(anonKey, 'anon')}
            >
              {copiedCode === 'anon' ? (
                <Check className='h-4 w-4 text-emerald-400' />
              ) : (
                <Copy className='h-4 w-4' />
              )}
            </Button>
          </div>

          <div className='mt-4 p-3 bg-blue-600/10 border border-blue-600/20 rounded-lg'>
            <p className='text-sm text-blue-400'>
              <Shield className='h-4 w-4 inline mr-2' />
              This key is safe to use in a browser if you have Row Level
              Security (RLS) enabled.
            </p>
          </div>
        </Card>

        {/* Service Role Key */}
        <Card className='bg-gray-900 border-gray-800 p-6'>
          <div className='flex items-center justify-between mb-4'>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 rounded-lg bg-red-600/20 flex items-center justify-center'>
                <Lock className='h-5 w-5 text-red-400' />
              </div>
              <div>
                <h3 className='font-semibold text-white'>Service Role Key</h3>
                <p className='text-xs text-gray-400'>
                  Bypasses RLS - server-side only!
                </p>
              </div>
            </div>
            <Badge variant='outline' className='text-red-400'>
              Secret
            </Badge>
          </div>

          <div className='flex items-center gap-2'>
            <div className='flex-1 bg-gray-950 border border-gray-800 rounded-lg p-3 font-mono text-sm text-gray-300 overflow-x-auto'>
              {showServiceKey ? serviceKey : '•'.repeat(120)}
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setShowServiceKey(!showServiceKey)}
            >
              {showServiceKey ? (
                <EyeOff className='h-4 w-4' />
              ) : (
                <Eye className='h-4 w-4' />
              )}
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => copyToClipboard(serviceKey, 'service')}
            >
              {copiedCode === 'service' ? (
                <Check className='h-4 w-4 text-emerald-400' />
              ) : (
                <Copy className='h-4 w-4' />
              )}
            </Button>
          </div>

          <div className='mt-4 p-3 bg-red-600/10 border border-red-600/20 rounded-lg'>
            <p className='text-sm text-red-400'>
              <AlertTriangle className='h-4 w-4 inline mr-2' />
              NEVER expose this key in client-side code! It bypasses all Row
              Level Security.
            </p>
          </div>
        </Card>
      </div>

      {/* Auth Examples */}
      <div className='space-y-4'>
        <h2 className='text-xl font-semibold text-white'>
          Authentication Examples
        </h2>

        <Tabs defaultValue='signup' className='w-full'>
          <TabsList className='bg-gray-900 border border-gray-800'>
            <TabsTrigger value='signup'>Sign Up</TabsTrigger>
            <TabsTrigger value='signin'>Sign In</TabsTrigger>
            <TabsTrigger value='session'>Session</TabsTrigger>
            <TabsTrigger value='request'>Auth Request</TabsTrigger>
          </TabsList>

          <TabsContent value='signup' className='mt-4'>
            <Card className='bg-gray-900 border-gray-800 overflow-hidden'>
              <div className='flex items-center justify-between bg-gray-950 border-b border-gray-800 px-4 py-2'>
                <Badge variant='outline' className='text-xs'>
                  JavaScript
                </Badge>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => copyToClipboard(signUpExample, 'signup')}
                >
                  {copiedCode === 'signup' ? (
                    <Check className='h-4 w-4 text-emerald-400' />
                  ) : (
                    <Copy className='h-4 w-4' />
                  )}
                </Button>
              </div>
              <pre className='p-4 overflow-x-auto'>
                <code className='text-sm text-gray-300 font-mono'>
                  {signUpExample}
                </code>
              </pre>
            </Card>
          </TabsContent>

          <TabsContent value='signin' className='mt-4'>
            <Card className='bg-gray-900 border-gray-800 overflow-hidden'>
              <div className='flex items-center justify-between bg-gray-950 border-b border-gray-800 px-4 py-2'>
                <Badge variant='outline' className='text-xs'>
                  JavaScript
                </Badge>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => copyToClipboard(signInExample, 'signin')}
                >
                  {copiedCode === 'signin' ? (
                    <Check className='h-4 w-4 text-emerald-400' />
                  ) : (
                    <Copy className='h-4 w-4' />
                  )}
                </Button>
              </div>
              <pre className='p-4 overflow-x-auto'>
                <code className='text-sm text-gray-300 font-mono'>
                  {signInExample}
                </code>
              </pre>
            </Card>
          </TabsContent>

          <TabsContent value='session' className='mt-4'>
            <Card className='bg-gray-900 border-gray-800 overflow-hidden'>
              <div className='flex items-center justify-between bg-gray-950 border-b border-gray-800 px-4 py-2'>
                <Badge variant='outline' className='text-xs'>
                  JavaScript
                </Badge>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => copyToClipboard(useAuthExample, 'useauth')}
                >
                  {copiedCode === 'useauth' ? (
                    <Check className='h-4 w-4 text-emerald-400' />
                  ) : (
                    <Copy className='h-4 w-4' />
                  )}
                </Button>
              </div>
              <pre className='p-4 overflow-x-auto'>
                <code className='text-sm text-gray-300 font-mono'>
                  {useAuthExample}
                </code>
              </pre>
            </Card>
          </TabsContent>

          <TabsContent value='request' className='mt-4'>
            <Card className='bg-gray-900 border-gray-800 overflow-hidden'>
              <div className='flex items-center justify-between bg-gray-950 border-b border-gray-800 px-4 py-2'>
                <Badge variant='outline' className='text-xs'>
                  JavaScript
                </Badge>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() =>
                    copyToClipboard(authenticatedRequestExample, 'authreq')
                  }
                >
                  {copiedCode === 'authreq' ? (
                    <Check className='h-4 w-4 text-emerald-400' />
                  ) : (
                    <Copy className='h-4 w-4' />
                  )}
                </Button>
              </div>
              <pre className='p-4 overflow-x-auto'>
                <code className='text-sm text-gray-300 font-mono'>
                  {authenticatedRequestExample}
                </code>
              </pre>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Row Level Security */}
      <div className='space-y-4'>
        <h2 className='text-xl font-semibold text-white flex items-center gap-2'>
          <Shield className='h-5 w-5 text-emerald-400' />
          Row Level Security (RLS)
        </h2>

        <Card className='bg-gray-900 border-gray-800 p-6'>
          <p className='text-gray-400 mb-4'>
            Row Level Security ensures that users can only access data they're
            authorized to see. Create policies to control access at the row
            level.
          </p>

          <Card className='bg-gray-950 border-gray-800 overflow-hidden'>
            <div className='flex items-center justify-between bg-gray-900 border-b border-gray-800 px-4 py-2'>
              <Badge variant='outline' className='text-xs'>
                SQL
              </Badge>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => copyToClipboard(rlsExample, 'rls')}
              >
                {copiedCode === 'rls' ? (
                  <Check className='h-4 w-4 text-emerald-400' />
                ) : (
                  <Copy className='h-4 w-4' />
                )}
              </Button>
            </div>
            <pre className='p-4 overflow-x-auto'>
              <code className='text-sm text-gray-300 font-mono'>
                {rlsExample}
              </code>
            </pre>
          </Card>
        </Card>

        {/* Service Role Warning */}
        <Card className='bg-gray-900 border-gray-800 p-6'>
          <h3 className='font-semibold text-white mb-3'>
            Service Role Key Usage
          </h3>
          <p className='text-gray-400 mb-4'>
            The service role key bypasses all RLS policies. Only use it in
            secure server-side environments.
          </p>

          <Card className='bg-gray-950 border-gray-800 overflow-hidden'>
            <div className='flex items-center justify-between bg-gray-900 border-b border-gray-800 px-4 py-2'>
              <Badge variant='outline' className='text-xs text-red-400'>
                JavaScript (Server-side only!)
              </Badge>
              <Button
                variant='ghost'
                size='sm'
                onClick={() =>
                  copyToClipboard(serviceRoleExample, 'servicerole')
                }
              >
                {copiedCode === 'servicerole' ? (
                  <Check className='h-4 w-4 text-emerald-400' />
                ) : (
                  <Copy className='h-4 w-4' />
                )}
              </Button>
            </div>
            <pre className='p-4 overflow-x-auto'>
              <code className='text-sm text-gray-300 font-mono'>
                {serviceRoleExample}
              </code>
            </pre>
          </Card>
        </Card>
      </div>
    </div>
  )
}
