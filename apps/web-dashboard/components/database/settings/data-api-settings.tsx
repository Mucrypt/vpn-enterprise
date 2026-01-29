'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Copy, Info, Check } from 'lucide-react'
import { Switch } from '@/components/ui/switch'

interface DataApiSettingsProps {
  activeTenant: string
}

export function DataApiSettings({ activeTenant }: DataApiSettingsProps) {
  const [isEnabled, setIsEnabled] = React.useState(true)
  const [copied, setCopied] = React.useState(false)

  const apiUrl = `https://${activeTenant}.database.cloud/rest/v1`

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className='space-y-8'>
      {/* Header */}
      <div>
        <h1 className='text-2xl font-semibold text-white mb-2'>Data API</h1>
        <p className='text-gray-400'>
          RESTful endpoint for querying and managing your database
        </p>
      </div>

      {/* Project URL */}
      <Card className='bg-[#1e1e1e] border-gray-800'>
        <div className='p-6 border-b border-gray-800'>
          <div className='flex items-center justify-between'>
            <h2 className='text-lg font-semibold text-white'>Project URL</h2>
            <div className='flex items-center gap-2'>
              <Badge
                variant='outline'
                className='border-gray-700 text-gray-400'
              >
                Source
              </Badge>
              <Badge className='bg-emerald-600 text-white'>
                Primary Database
              </Badge>
            </div>
          </div>
        </div>

        <div className='p-6'>
          <div>
            <h3 className='text-sm font-medium text-white mb-2'>URL</h3>
            <p className='text-sm text-gray-400 mb-3'>
              RESTful endpoint for querying and managing your database
            </p>
            <div className='flex items-center gap-2'>
              <Input
                value={apiUrl}
                readOnly
                className='bg-gray-900 border-gray-700 text-gray-300 font-mono text-sm'
              />
              <Button
                variant='outline'
                size='icon'
                onClick={() => copyToClipboard(apiUrl)}
                className='border-gray-700 hover:bg-gray-800'
              >
                {copied ? (
                  <Check className='h-4 w-4 text-emerald-500' />
                ) : (
                  <Copy className='h-4 w-4' />
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Data API Settings */}
      <Card className='bg-[#1e1e1e] border-gray-800'>
        <div className='p-6 border-b border-gray-800'>
          <div className='flex items-center justify-between'>
            <h2 className='text-lg font-semibold text-white'>
              Data API Settings
            </h2>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                className='border-gray-700 hover:bg-gray-800 text-white'
              >
                Docs
              </Button>
              <Button
                variant='outline'
                size='sm'
                className='border-gray-700 hover:bg-gray-800 text-white'
              >
                Harden Data API
              </Button>
            </div>
          </div>
        </div>

        <div className='p-6 space-y-6'>
          {/* Enable Data API */}
          <div className='flex items-start justify-between'>
            <div className='flex-1'>
              <h3 className='text-sm font-medium text-white mb-1'>
                Enable Data API
              </h3>
              <p className='text-sm text-gray-400'>
                When enabled you will be able to use any database client library
                and PostgREST endpoints with any schema configured below.
              </p>
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
              className='data-[state=checked]:bg-emerald-600'
            />
          </div>

          {/* Exposed Schemas */}
          <div>
            <h3 className='text-sm font-medium text-white mb-2'>
              Exposed schemas
            </h3>
            <p className='text-sm text-gray-400 mb-3'>
              The schemas to expose in your API. Tables, views and stored
              procedures in these schemas will get API endpoints.
            </p>
            <div className='flex items-center gap-2'>
              <Badge className='bg-gray-800 text-gray-300 px-3 py-1'>
                PUBLIC
              </Badge>
              <Badge className='bg-gray-800 text-gray-300 px-3 py-1'>
                GRAPHQL_PUBLIC
              </Badge>
              <Button
                variant='outline'
                size='sm'
                className='border-gray-700 hover:bg-gray-800 text-white text-xs h-7'
              >
                Select schemas...
              </Button>
            </div>
          </div>

          {/* Extra Search Path */}
          <div>
            <h3 className='text-sm font-medium text-white mb-2'>
              Extra search path
            </h3>
            <p className='text-sm text-gray-400 mb-3'>
              Extra schemas to add to the search path of every request.
            </p>
            <div className='flex items-center gap-2'>
              <Badge className='bg-gray-800 text-gray-300 px-3 py-1'>
                PUBLIC
              </Badge>
              <Badge className='bg-gray-800 text-gray-300 px-3 py-1'>
                EXTENSIONS
              </Badge>
              <Button
                variant='outline'
                size='sm'
                className='border-gray-700 hover:bg-gray-800 text-white text-xs h-7'
              >
                Select schemas...
              </Button>
            </div>
          </div>

          {/* Max Rows */}
          <div>
            <h3 className='text-sm font-medium text-white mb-2'>Max rows</h3>
            <p className='text-sm text-gray-400 mb-3'>
              The maximum number of rows returned from a view, table, or stored
              procedure. Limits payload size for accidental or malicious
              requests.
            </p>
            <div className='flex items-center gap-2'>
              <Input
                type='number'
                defaultValue='1000'
                className='bg-gray-900 border-gray-700 text-white w-32'
              />
              <span className='text-sm text-gray-400'>rows</span>
            </div>
          </div>

          {/* Pool Size */}
          <div>
            <h3 className='text-sm font-medium text-white mb-2'>Pool size</h3>
            <p className='text-sm text-gray-400 mb-3'>
              Number of maximum connections to allocate to the PostgREST API
              server.
            </p>
            <div className='flex items-center gap-2'>
              <Input
                type='number'
                defaultValue='10'
                className='bg-gray-900 border-gray-700 text-white w-32'
              />
              <span className='text-sm text-gray-400'>connections</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Info Card */}
      <Card className='bg-blue-950/20 border-blue-900'>
        <div className='p-6'>
          <div className='flex gap-3'>
            <Info className='h-5 w-5 text-blue-400 shrink-0 mt-0.5' />
            <div className='text-sm text-blue-300'>
              <p className='font-medium mb-2'>About the Data API</p>
              <p>
                The Data API provides a RESTful interface to your PostgreSQL
                database. All tables and views in the exposed schemas are
                accessible via standard HTTP methods (GET, POST, PATCH, DELETE).
                Use the API keys from the API Keys page to authenticate your
                requests.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
