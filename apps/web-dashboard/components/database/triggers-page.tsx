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
  Layers,
  Edit,
  Trash2,
  Play,
  Filter,
  Zap,
} from 'lucide-react'

interface DatabaseTrigger {
  name: string
  table_schema: string
  table_name: string
  event: string
  timing: string
  function_name: string
  enabled: boolean
  description?: string
}

interface TriggersPageProps {
  activeTenant: string
  onCreateTrigger?: () => void
}

export function TriggersPage({
  activeTenant,
  onCreateTrigger,
}: TriggersPageProps) {
  const [triggers, setTriggers] = useState<DatabaseTrigger[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSchema, setSelectedSchema] = useState('public')
  const [schemas, setSchemas] = useState<string[]>(['public'])

  const loadSchemas = async () => {
    if (!activeTenant) return
    try {
      const response = await fetch(`/api/v1/tenants/${activeTenant}/schemas`)
      if (response.ok) {
        const data = await response.json()
        const schemaList = (data.data || data.schemas || []).map(
          (s: any) => s.schema_name || s.name,
        )
        setSchemas(schemaList)
      }
    } catch (error) {
      console.error('Error loading schemas:', error)
    }
  }

  const loadTriggers = async () => {
    if (!activeTenant) return
    setLoading(true)
    try {
      const response = await fetch(
        `/api/v1/tenants/${activeTenant}/schemas/${selectedSchema}/triggers`,
      )
      if (response.ok) {
        const data = await response.json()
        setTriggers(data.data || data.triggers || [])
      }
    } catch (error) {
      console.error('Error loading triggers:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSchemas()
  }, [activeTenant])

  useEffect(() => {
    if (selectedSchema) {
      loadTriggers()
    }
  }, [activeTenant, selectedSchema])

  const filteredTriggers = triggers.filter(
    (trigger) =>
      trigger.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trigger.table_name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getEventBadgeColor = (event: string) => {
    const colors: Record<string, string> = {
      INSERT: 'bg-green-500/10 text-green-400 border-green-500/20',
      UPDATE: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      DELETE: 'bg-red-500/10 text-red-400 border-red-500/20',
      TRUNCATE: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    }
    return colors[event] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'
  }

  const getTimingBadgeColor = (timing: string) => {
    return timing === 'BEFORE'
      ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
      : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-semibold text-white mb-2'>Triggers</h1>
        <p className='text-gray-400'>
          Automatically execute functions in response to table events
        </p>
      </div>

      {/* Actions Bar */}
      <Card className='p-4 bg-gray-900 border-gray-800'>
        <div className='flex items-center justify-between gap-4'>
          <div className='flex items-center gap-3 flex-1'>
            <select
              value={selectedSchema}
              onChange={(e) => setSelectedSchema(e.target.value)}
              className='px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm'
            >
              {schemas.map((schema) => (
                <option key={schema} value={schema}>
                  schema: {schema}
                </option>
              ))}
            </select>

            <div className='relative flex-1 max-w-md'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
              <Input
                placeholder='Search for a trigger'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='pl-10 bg-gray-800 border-gray-700 text-white'
              />
            </div>

            <Button
              variant='outline'
              size='sm'
              className='border-gray-700 text-gray-300 hover:bg-gray-800'
            >
              <Filter className='h-4 w-4 mr-2' />
              Filters
            </Button>
          </div>

          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={loadTriggers}
              disabled={loading}
              className='border-gray-700'
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
              />
            </Button>
            <Button
              size='sm'
              onClick={onCreateTrigger}
              className='bg-emerald-600 hover:bg-emerald-700 text-white'
            >
              <Plus className='h-4 w-4 mr-2' />
              New trigger
            </Button>
          </div>
        </div>
      </Card>

      {/* Triggers Table */}
      <Card className='bg-gray-900 border-gray-800 overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-gray-800/50 border-b border-gray-800'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider'>
                  Name
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider'>
                  Table
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider'>
                  Event
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider'>
                  Timing
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider'>
                  Function
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider'>
                  Status
                </th>
                <th className='px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-800'>
              {loading ? (
                <tr>
                  <td colSpan={7} className='px-6 py-12 text-center'>
                    <RefreshCw className='h-6 w-6 animate-spin text-emerald-400 mx-auto mb-2' />
                    <p className='text-gray-400'>Loading triggers...</p>
                  </td>
                </tr>
              ) : filteredTriggers.length === 0 ? (
                <tr>
                  <td colSpan={7} className='px-6 py-12 text-center'>
                    <Layers className='h-12 w-12 text-gray-600 mx-auto mb-3' />
                    <p className='text-gray-400 mb-2'>No triggers found</p>
                    <p className='text-sm text-gray-500'>
                      Create your first trigger to automate database events
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTriggers.map((trigger, index) => (
                  <tr
                    key={index}
                    className='hover:bg-gray-800/30 transition-colors'
                  >
                    <td className='px-6 py-4'>
                      <div className='flex items-center gap-2'>
                        <Zap className='h-4 w-4 text-purple-400' />
                        <span className='text-sm font-medium text-gray-300'>
                          {trigger.name}
                        </span>
                      </div>
                      {trigger.description && (
                        <p className='text-xs text-gray-500 mt-1'>
                          {trigger.description}
                        </p>
                      )}
                    </td>
                    <td className='px-6 py-4'>
                      <span className='text-sm text-gray-300 font-mono'>
                        {trigger.table_name}
                      </span>
                    </td>
                    <td className='px-6 py-4'>
                      <Badge className={getEventBadgeColor(trigger.event)}>
                        {trigger.event}
                      </Badge>
                    </td>
                    <td className='px-6 py-4'>
                      <Badge className={getTimingBadgeColor(trigger.timing)}>
                        {trigger.timing}
                      </Badge>
                    </td>
                    <td className='px-6 py-4'>
                      <span className='text-sm text-gray-400 font-mono'>
                        {trigger.function_name}()
                      </span>
                    </td>
                    <td className='px-6 py-4'>
                      {trigger.enabled ? (
                        <Badge className='bg-emerald-500/10 text-emerald-400 border-emerald-500/20'>
                          Enabled
                        </Badge>
                      ) : (
                        <Badge className='bg-gray-500/10 text-gray-400 border-gray-500/20'>
                          Disabled
                        </Badge>
                      )}
                    </td>
                    <td className='px-6 py-4'>
                      <div className='flex items-center justify-end gap-2'>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='text-gray-400 hover:text-blue-400'
                        >
                          <Edit className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='text-gray-400 hover:text-red-400'
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className='px-6 py-4 border-t border-gray-800 flex items-center justify-between'>
          <div className='text-sm text-gray-400'>
            Total:{' '}
            <span className='text-white font-medium'>
              {filteredTriggers.length} triggers
            </span>
          </div>
        </div>
      </Card>
    </div>
  )
}
