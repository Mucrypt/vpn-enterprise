'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Copy,
  Check,
  ExternalLink,
  Zap,
  Shield,
  Globe,
  Code,
  BookOpen,
  Terminal,
} from 'lucide-react'

interface ApiIntroductionPageProps {
  activeTenant: string
}

export function ApiIntroductionPage({
  activeTenant,
}: ApiIntroductionPageProps) {
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [copiedKey, setCopiedKey] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const apiUrl = `https://api.vpnenterprise.com/v1/projects/${activeTenant}`
  const apiKey = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yaHFkbnlwY2Rmb3ZoenhycmgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0MjQyNzIwMCwiZXhwIjoxOTU4MDAzMjAwfQ.example`

  const copyToClipboard = (text: string, type: 'url' | 'key' | string) => {
    navigator.clipboard.writeText(text)
    if (type === 'url') {
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 2000)
    } else if (type === 'key') {
      setCopiedKey(true)
      setTimeout(() => setCopiedKey(false), 2000)
    } else {
      setCopiedCode(type)
      setTimeout(() => setCopiedCode(null), 2000)
    }
  }

  const jsExample = `import { createClient } from '@supabase/supabase-js'

const supabaseUrl = '${apiUrl}'
const supabaseKey = '${apiKey}'
const supabase = createClient(supabaseUrl, supabaseKey)

// Example: Fetch data
const { data, error } = await supabase
  .from('users')
  .select('*')
  .limit(10)`

  const curlExample = `curl '${apiUrl}/rest/v1/users?select=*&limit=10' \\
  -H "apikey: ${apiKey}" \\
  -H "Authorization: Bearer ${apiKey}"`

  const pythonExample = `from supabase import create_client, Client

url: str = "${apiUrl}"
key: str = "${apiKey}"
supabase: Client = create_client(url, key)

# Example: Fetch data
response = supabase.table('users').select("*").limit(10).execute()`

  return (
    <div className='p-6 max-w-5xl mx-auto space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold text-white mb-2'>
          Introduction to API
        </h1>
        <p className='text-gray-400'>
          All projects have a RESTful endpoint that you can use with your
          project's API key to query and manage your database.
        </p>
      </div>

      {/* Quick Start */}
      <Card className='bg-gray-900 border-gray-800 p-6'>
        <div className='flex items-center gap-2 mb-4'>
          <Zap className='h-5 w-5 text-emerald-400' />
          <h2 className='text-lg font-semibold text-white'>Quick Start</h2>
        </div>

        <div className='space-y-4'>
          {/* API URL */}
          <div>
            <label className='text-sm font-medium text-gray-400 mb-2 block'>
              Project URL
            </label>
            <div className='flex items-center gap-2'>
              <div className='flex-1 bg-gray-950 border border-gray-800 rounded-lg p-3 font-mono text-sm text-gray-300 overflow-x-auto'>
                {apiUrl}
              </div>
              <Button
                variant='outline'
                size='sm'
                onClick={() => copyToClipboard(apiUrl, 'url')}
                className='shrink-0'
              >
                {copiedUrl ? (
                  <Check className='h-4 w-4 text-emerald-400' />
                ) : (
                  <Copy className='h-4 w-4' />
                )}
              </Button>
            </div>
          </div>

          {/* API Key */}
          <div>
            <label className='text-sm font-medium text-gray-400 mb-2 block'>
              API Key (anon/public)
            </label>
            <div className='flex items-center gap-2'>
              <div className='flex-1 bg-gray-950 border border-gray-800 rounded-lg p-3 font-mono text-sm text-gray-300 overflow-x-auto'>
                {apiKey}
              </div>
              <Button
                variant='outline'
                size='sm'
                onClick={() => copyToClipboard(apiKey, 'key')}
                className='shrink-0'
              >
                {copiedKey ? (
                  <Check className='h-4 w-4 text-emerald-400' />
                ) : (
                  <Copy className='h-4 w-4' />
                )}
              </Button>
            </div>
            <p className='text-xs text-gray-600 mt-2'>
              This key is safe to use in a browser if you have enabled Row Level
              Security for your tables.
            </p>
          </div>
        </div>
      </Card>

      {/* Features Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <Card className='bg-gray-900 border-gray-800 p-6'>
          <div className='flex items-center gap-3 mb-3'>
            <div className='w-10 h-10 rounded-lg bg-emerald-600/20 flex items-center justify-center'>
              <Shield className='h-5 w-5 text-emerald-400' />
            </div>
            <h3 className='font-semibold text-white'>Secure by Default</h3>
          </div>
          <p className='text-sm text-gray-400'>
            Built-in authentication, authorization, and Row Level Security (RLS)
            protect your data automatically.
          </p>
        </Card>

        <Card className='bg-gray-900 border-gray-800 p-6'>
          <div className='flex items-center gap-3 mb-3'>
            <div className='w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center'>
              <Globe className='h-5 w-5 text-blue-400' />
            </div>
            <h3 className='font-semibold text-white'>Global CDN</h3>
          </div>
          <p className='text-sm text-gray-400'>
            Your API is distributed globally for low latency access from
            anywhere in the world.
          </p>
        </Card>

        <Card className='bg-gray-900 border-gray-800 p-6'>
          <div className='flex items-center gap-3 mb-3'>
            <div className='w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center'>
              <Code className='h-5 w-5 text-purple-400' />
            </div>
            <h3 className='font-semibold text-white'>Auto-generated</h3>
          </div>
          <p className='text-sm text-gray-400'>
            REST API endpoints are automatically created for all your database
            tables and views.
          </p>
        </Card>

        <Card className='bg-gray-900 border-gray-800 p-6'>
          <div className='flex items-center gap-3 mb-3'>
            <div className='w-10 h-10 rounded-lg bg-orange-600/20 flex items-center justify-center'>
              <Zap className='h-5 w-5 text-orange-400' />
            </div>
            <h3 className='font-semibold text-white'>Realtime</h3>
          </div>
          <p className='text-sm text-gray-400'>
            Subscribe to database changes via WebSockets and get instant updates
            when data changes.
          </p>
        </Card>
      </div>

      {/* Code Examples */}
      <div className='space-y-4'>
        <div className='flex items-center gap-2'>
          <Terminal className='h-5 w-5 text-emerald-400' />
          <h2 className='text-lg font-semibold text-white'>Code Examples</h2>
        </div>

        {/* JavaScript/TypeScript */}
        <Card className='bg-gray-900 border-gray-800 overflow-hidden'>
          <div className='flex items-center justify-between bg-gray-950 border-b border-gray-800 px-4 py-2'>
            <div className='flex items-center gap-2'>
              <Badge variant='outline' className='text-xs'>
                JavaScript
              </Badge>
              <span className='text-sm text-gray-400'>
                Using @supabase/supabase-js
              </span>
            </div>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => copyToClipboard(jsExample, 'js')}
            >
              {copiedCode === 'js' ? (
                <Check className='h-4 w-4 text-emerald-400' />
              ) : (
                <Copy className='h-4 w-4' />
              )}
            </Button>
          </div>
          <pre className='p-4 overflow-x-auto'>
            <code className='text-sm text-gray-300 font-mono'>{jsExample}</code>
          </pre>
        </Card>

        {/* cURL */}
        <Card className='bg-gray-900 border-gray-800 overflow-hidden'>
          <div className='flex items-center justify-between bg-gray-950 border-b border-gray-800 px-4 py-2'>
            <div className='flex items-center gap-2'>
              <Badge variant='outline' className='text-xs'>
                cURL
              </Badge>
              <span className='text-sm text-gray-400'>Direct HTTP request</span>
            </div>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => copyToClipboard(curlExample, 'curl')}
            >
              {copiedCode === 'curl' ? (
                <Check className='h-4 w-4 text-emerald-400' />
              ) : (
                <Copy className='h-4 w-4' />
              )}
            </Button>
          </div>
          <pre className='p-4 overflow-x-auto'>
            <code className='text-sm text-gray-300 font-mono'>
              {curlExample}
            </code>
          </pre>
        </Card>

        {/* Python */}
        <Card className='bg-gray-900 border-gray-800 overflow-hidden'>
          <div className='flex items-center justify-between bg-gray-950 border-b border-gray-800 px-4 py-2'>
            <div className='flex items-center gap-2'>
              <Badge variant='outline' className='text-xs'>
                Python
              </Badge>
              <span className='text-sm text-gray-400'>Using supabase-py</span>
            </div>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => copyToClipboard(pythonExample, 'python')}
            >
              {copiedCode === 'python' ? (
                <Check className='h-4 w-4 text-emerald-400' />
              ) : (
                <Copy className='h-4 w-4' />
              )}
            </Button>
          </div>
          <pre className='p-4 overflow-x-auto'>
            <code className='text-sm text-gray-300 font-mono'>
              {pythonExample}
            </code>
          </pre>
        </Card>
      </div>

      {/* Next Steps */}
      <Card className='bg-gray-900 border-gray-800 p-6'>
        <div className='flex items-center gap-2 mb-4'>
          <BookOpen className='h-5 w-5 text-emerald-400' />
          <h2 className='text-lg font-semibold text-white'>Next Steps</h2>
        </div>
        <div className='grid gap-3'>
          <Button
            variant='outline'
            className='justify-between'
            onClick={() => window.open('https://supabase.com/docs', '_blank')}
          >
            <span>Read the full documentation</span>
            <ExternalLink className='h-4 w-4' />
          </Button>
          <Button
            variant='outline'
            className='justify-between'
            onClick={() =>
              window.open('https://github.com/supabase/supabase-js', '_blank')
            }
          >
            <span>View client library on GitHub</span>
            <ExternalLink className='h-4 w-4' />
          </Button>
          <Button
            variant='outline'
            className='justify-between'
            onClick={() =>
              window.open('https://supabase.com/dashboard/api', '_blank')
            }
          >
            <span>Explore API examples</span>
            <ExternalLink className='h-4 w-4' />
          </Button>
        </div>
      </Card>
    </div>
  )
}
