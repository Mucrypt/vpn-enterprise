'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Copy, Eye, EyeOff, RefreshCw, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface APIKey {
  id: string
  name: string
  key: string
  created_at: string
}

interface ApiKeysSettingsProps {
  activeTenant: string
}

export function ApiKeysSettings({ activeTenant }: ApiKeysSettingsProps) {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([
    {
      id: '1',
      name: 'default',
      key: 'vpn_pub_abc123def456ghi789jkl012mno345',
      created_at: '2025-01-15',
    },
  ])
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const [newKeyName, setNewKeyName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const toggleKeyVisibility = (id: string) => {
    const newSet = new Set(visibleKeys)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setVisibleKeys(newSet)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const createNewKey = async () => {
    if (!newKeyName.trim()) return
    setIsCreating(true)
    // API call to create key
    setTimeout(() => {
      const newKey: APIKey = {
        id: Date.now().toString(),
        name: newKeyName,
        key: `vpn_pub_${Math.random().toString(36).substring(2, 35)}`,
        created_at: new Date().toISOString().split('T')[0],
      }
      setApiKeys([...apiKeys, newKey])
      setNewKeyName('')
      setIsCreating(false)
    }, 1000)
  }

  const deleteKey = (id: string) => {
    setApiKeys(apiKeys.filter((key) => key.id !== id))
  }

  const maskKey = (key: string) => {
    return key.substring(0, 10) + '•'.repeat(20) + key.substring(key.length - 5)
  }

  return (
    <div className='space-y-8'>
      {/* Header */}
      <div>
        <h1 className='text-2xl font-semibold text-white mb-2'>API Keys</h1>
        <p className='text-gray-400'>
          Configure API keys to securely control access to your project
        </p>
      </div>

      {/* Info Banner */}
      <Card className='bg-blue-950/30 border-blue-900'>
        <div className='p-4'>
          <p className='text-sm text-blue-300'>
            <strong>Your new API keys are here</strong> — We've updated our API
            keys to better support your application needs. API keys can be safely
            shared publicly if you have enabled Row Level Security (RLS) for your
            tables and configured policies.
          </p>
        </div>
      </Card>

      {/* Publishable Key */}
      <Card className='bg-[#1e1e1e] border-gray-800'>
        <div className='p-6 border-b border-gray-800'>
          <h2 className='text-lg font-semibold text-white mb-1'>
            Publishable key
          </h2>
          <p className='text-sm text-gray-400'>
            This key is safe to use in a browser if you have enabled Row Level
            Security (RLS) for your tables and configured policies.
          </p>
        </div>

        <div className='p-6'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b border-gray-800'>
                  <th className='text-left text-xs font-semibold text-gray-400 uppercase tracking-wider pb-3'>
                    Name
                  </th>
                  <th className='text-left text-xs font-semibold text-gray-400 uppercase tracking-wider pb-3'>
                    API Key
                  </th>
                  <th className='text-right text-xs font-semibold text-gray-400 uppercase tracking-wider pb-3'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {apiKeys.map((key) => (
                  <tr key={key.id} className='border-b border-gray-800/50'>
                    <td className='py-4'>
                      <div>
                        <p className='text-sm font-medium text-white'>
                          {key.name}
                        </p>
                        <p className='text-xs text-gray-400'>
                          No description
                        </p>
                      </div>
                    </td>
                    <td className='py-4'>
                      <div className='flex items-center gap-2'>
                        <code className='text-sm text-gray-300 bg-gray-900 px-3 py-1 rounded font-mono'>
                          {visibleKeys.has(key.id)
                            ? key.key
                            : maskKey(key.key)}
                        </code>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => copyToClipboard(key.key)}
                          className='hover:bg-gray-800'
                        >
                          <Copy className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => toggleKeyVisibility(key.id)}
                          className='hover:bg-gray-800'
                        >
                          {visibleKeys.has(key.id) ? (
                            <EyeOff className='h-4 w-4' />
                          ) : (
                            <Eye className='h-4 w-4' />
                          )}
                        </Button>
                      </div>
                      <p className='text-xs text-gray-500 mt-1'>
                        Publishable keys can be safely shared publicly
                      </p>
                    </td>
                    <td className='py-4 text-right'>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => deleteKey(key.id)}
                        className='hover:bg-red-950 hover:text-red-400'
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className='mt-6 flex items-center gap-2'>
            <Button className='bg-emerald-600 hover:bg-emerald-700 text-white'>
              <RefreshCw className='h-4 w-4 mr-2' />
              New publishable key
            </Button>
          </div>
        </div>
      </Card>

      {/* Secret Keys */}
      <Card className='bg-[#1e1e1e] border-gray-800'>
        <div className='p-6 border-b border-gray-800'>
          <h2 className='text-lg font-semibold text-white mb-1'>Secret keys</h2>
          <p className='text-sm text-gray-400'>
            These keys have the ability to bypass Row Level Security. Never
            share them publicly.
          </p>
        </div>

        <div className='p-6'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b border-gray-800'>
                  <th className='text-left text-xs font-semibold text-gray-400 uppercase tracking-wider pb-3'>
                    Name
                  </th>
                  <th className='text-left text-xs font-semibold text-gray-400 uppercase tracking-wider pb-3'>
                    API Key
                  </th>
                  <th className='text-right text-xs font-semibold text-gray-400 uppercase tracking-wider pb-3'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className='border-b border-gray-800/50'>
                  <td className='py-4'>
                    <div className='flex items-center gap-2'>
                      <p className='text-sm font-medium text-white'>
                        service_role
                      </p>
                      <Badge
                        variant='destructive'
                        className='bg-red-950 text-red-400 text-xs'
                      >
                        SECRET
                      </Badge>
                    </div>
                    <p className='text-xs text-gray-400'>
                      Full database access
                    </p>
                  </td>
                  <td className='py-4'>
                    <div className='flex items-center gap-2'>
                      <code className='text-sm text-gray-300 bg-gray-900 px-3 py-1 rounded font-mono'>
                        vpn_secret_••••••••••••••••••••••••
                      </code>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='hover:bg-gray-800'
                      >
                        <Eye className='h-4 w-4' />
                      </Button>
                    </div>
                    <p className='text-xs text-red-400 mt-1'>
                      ⚠️ Never share secret keys publicly
                    </p>
                  </td>
                  <td className='py-4 text-right'>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='hover:bg-gray-800'
                    >
                      <Copy className='h-4 w-4' />
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  )
}
