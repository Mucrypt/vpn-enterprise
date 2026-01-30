'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Plus,
  RefreshCw,
  Package,
  Check,
  Download,
  Trash2,
  ExternalLink,
  AlertCircle,
} from 'lucide-react'

interface DatabaseExtension {
  name: string
  version: string
  schema: string
  installed: boolean
  description?: string
  comment?: string
  available_versions?: string[]
}

interface ExtensionsPageProps {
  activeTenant: string
}

export function ExtensionsPage({ activeTenant }: ExtensionsPageProps) {
  const [extensions, setExtensions] = useState<DatabaseExtension[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showInstalled, setShowInstalled] = useState(true)
  const [showAvailable, setShowAvailable] = useState(true)

  const loadExtensions = async () => {
    if (!activeTenant) return
    setLoading(true)
    try {
      const response = await fetch(`/api/v1/tenants/${activeTenant}/extensions`)
      if (response.ok) {
        const data = await response.json()
        setExtensions(data.data || data.extensions || [])
      }
    } catch (error) {
      console.error('Error loading extensions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadExtensions()
  }, [activeTenant])

  const filteredExtensions = extensions.filter((ext) => {
    const matchesSearch = ext.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
    const matchesFilter =
      (showInstalled && ext.installed) || (showAvailable && !ext.installed)
    return matchesSearch && matchesFilter
  })

  const installedCount = extensions.filter((e) => e.installed).length
  const availableCount = extensions.filter((e) => !e.installed).length

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-semibold text-white mb-2'>Extensions</h1>
        <p className='text-gray-400'>
          Extend PostgreSQL functionality with additional features and data
          types
        </p>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <Card className='p-4 bg-gray-900 border-gray-800'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-emerald-500/10 rounded-lg'>
              <Check className='h-5 w-5 text-emerald-400' />
            </div>
            <div>
              <p className='text-sm text-gray-400'>Installed Extensions</p>
              <p className='text-2xl font-semibold text-white'>
                {installedCount}
              </p>
            </div>
          </div>
        </Card>

        <Card className='p-4 bg-gray-900 border-gray-800'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-blue-500/10 rounded-lg'>
              <Package className='h-5 w-5 text-blue-400' />
            </div>
            <div>
              <p className='text-sm text-gray-400'>Available Extensions</p>
              <p className='text-2xl font-semibold text-white'>
                {availableCount}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Actions Bar */}
      <Card className='p-4 bg-gray-900 border-gray-800'>
        <div className='flex items-center justify-between gap-4'>
          <div className='flex items-center gap-3 flex-1'>
            <div className='relative flex-1 max-w-md'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
              <Input
                placeholder='Search for an extension'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='pl-10 bg-gray-800 border-gray-700 text-white'
              />
            </div>

            <div className='flex items-center gap-2 border-l border-gray-700 pl-3'>
              <button
                onClick={() => setShowInstalled(!showInstalled)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  showInstalled
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                Installed
              </button>
              <button
                onClick={() => setShowAvailable(!showAvailable)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  showAvailable
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                Available
              </button>
            </div>
          </div>

          <Button
            variant='outline'
            size='sm'
            onClick={loadExtensions}
            disabled={loading}
            className='border-gray-700'
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </Card>

      {/* Info Banner */}
      <Card className='p-4 bg-blue-500/5 border-blue-500/20'>
        <div className='flex items-start gap-3'>
          <AlertCircle className='h-5 w-5 text-blue-400 shrink-0 mt-0.5' />
          <div>
            <h4 className='text-sm font-medium text-blue-400 mb-1'>
              About PostgreSQL Extensions
            </h4>
            <p className='text-sm text-gray-400'>
              Extensions add new functionality to your database. Popular
              extensions include PostGIS for geospatial data, pg_stat_statements
              for query analytics, and uuid-ossp for UUID generation.
            </p>
          </div>
        </div>
      </Card>

      {/* Extensions Grid */}
      {loading ? (
        <Card className='p-12 bg-gray-900 border-gray-800 text-center'>
          <RefreshCw className='h-8 w-8 animate-spin text-emerald-400 mx-auto mb-2' />
          <p className='text-gray-400'>Loading extensions...</p>
        </Card>
      ) : filteredExtensions.length === 0 ? (
        <Card className='p-12 bg-gray-900 border-gray-800 text-center'>
          <Package className='h-12 w-12 text-gray-600 mx-auto mb-3' />
          <p className='text-gray-400 mb-2'>No extensions found</p>
          <p className='text-sm text-gray-500'>
            Try adjusting your search or filters
          </p>
        </Card>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {filteredExtensions.map((ext, index) => (
            <Card
              key={index}
              className='p-5 bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors'
            >
              <div className='flex items-start justify-between mb-3'>
                <div className='flex items-center gap-2'>
                  <div className='p-2 bg-purple-500/10 rounded-lg'>
                    <Package className='h-5 w-5 text-purple-400' />
                  </div>
                  <div>
                    <h3 className='text-sm font-semibold text-white'>
                      {ext.name}
                    </h3>
                    <p className='text-xs text-gray-500'>v{ext.version}</p>
                  </div>
                </div>
                {ext.installed && (
                  <Badge className='bg-emerald-500/10 text-emerald-400 border-emerald-500/20'>
                    <Check className='h-3 w-3 mr-1' />
                    Installed
                  </Badge>
                )}
              </div>

              <p className='text-sm text-gray-400 mb-4 line-clamp-2'>
                {ext.description || ext.comment || 'No description available'}
              </p>

              {ext.installed && ext.schema && (
                <p className='text-xs text-gray-500 mb-3'>
                  Schema: <span className='text-gray-400'>{ext.schema}</span>
                </p>
              )}

              <div className='flex items-center gap-2'>
                {ext.installed ? (
                  <>
                    <Button
                      variant='outline'
                      size='sm'
                      className='flex-1 border-gray-700 text-gray-300 hover:bg-gray-800'
                    >
                      <ExternalLink className='h-3 w-3 mr-1' />
                      Details
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      className='border-red-500/20 text-red-400 hover:bg-red-500/10'
                    >
                      <Trash2 className='h-3 w-3' />
                    </Button>
                  </>
                ) : (
                  <Button
                    size='sm'
                    className='w-full bg-blue-600 hover:bg-blue-700 text-white'
                  >
                    <Download className='h-3 w-3 mr-1' />
                    Install
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
