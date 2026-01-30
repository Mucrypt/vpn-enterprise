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
  Zap,
  Code,
  Edit,
  Trash2,
  Play,
  ChevronDown,
  Filter,
} from 'lucide-react'

interface DatabaseFunction {
  name: string
  schema: string
  language: string
  return_type: string
  arguments: string
  definition: string
  is_security_definer: boolean
  volatility: string
  description?: string
}

interface FunctionsPageProps {
  activeTenant: string
  onCreateFunction?: () => void
}

export function FunctionsPage({
  activeTenant,
  onCreateFunction,
}: FunctionsPageProps) {
  const [functions, setFunctions] = useState<DatabaseFunction[]>([])
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

  const loadFunctions = async () => {
    if (!activeTenant) return
    setLoading(true)
    try {
      const response = await fetch(
        `/api/v1/tenants/${activeTenant}/schemas/${selectedSchema}/functions`,
      )
      if (response.ok) {
        const data = await response.json()
        setFunctions(data.data || data.functions || [])
      }
    } catch (error) {
      console.error('Error loading functions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSchemas()
  }, [activeTenant])

  useEffect(() => {
    if (selectedSchema) {
      loadFunctions()
    }
  }, [activeTenant, selectedSchema])

  const filteredFunctions = functions.filter((func) =>
    func.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getLanguageBadgeColor = (language: string) => {
    const colors: Record<string, string> = {
      plpgsql: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      sql: 'bg-green-500/10 text-green-400 border-green-500/20',
      plpython: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      plperl: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      c: 'bg-red-500/10 text-red-400 border-red-500/20',
    }
    return (
      colors[language.toLowerCase()] ||
      'bg-gray-500/10 text-gray-400 border-gray-500/20'
    )
  }

  const getVolatilityBadgeColor = (volatility: string) => {
    const colors: Record<string, string> = {
      volatile: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      stable: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      immutable: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    }
    return (
      colors[volatility.toLowerCase()] ||
      'bg-gray-500/10 text-gray-400 border-gray-500/20'
    )
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-semibold text-white mb-2'>Functions</h1>
        <p className='text-gray-400'>
          Database functions for reusable SQL logic and stored procedures
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
                placeholder='Search for a function'
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
              onClick={loadFunctions}
              disabled={loading}
              className='border-gray-700'
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
              />
            </Button>
            <Button
              size='sm'
              onClick={onCreateFunction}
              className='bg-emerald-600 hover:bg-emerald-700 text-white'
            >
              <Plus className='h-4 w-4 mr-2' />
              New function
            </Button>
          </div>
        </div>
      </Card>

      {/* Functions Table */}
      <Card className='bg-gray-900 border-gray-800 overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-gray-800/50 border-b border-gray-800'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider'>
                  Name
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider'>
                  Return Type
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider'>
                  Arguments
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider'>
                  Language
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider'>
                  Volatility
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider'>
                  Security
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
                    <p className='text-gray-400'>Loading functions...</p>
                  </td>
                </tr>
              ) : filteredFunctions.length === 0 ? (
                <tr>
                  <td colSpan={7} className='px-6 py-12 text-center'>
                    <Zap className='h-12 w-12 text-gray-600 mx-auto mb-3' />
                    <p className='text-gray-400 mb-2'>No functions found</p>
                    <p className='text-sm text-gray-500'>
                      Create your first function to get started
                    </p>
                  </td>
                </tr>
              ) : (
                filteredFunctions.map((func, index) => (
                  <tr
                    key={index}
                    className='hover:bg-gray-800/30 transition-colors'
                  >
                    <td className='px-6 py-4'>
                      <div className='flex items-center gap-2'>
                        <Code className='h-4 w-4 text-emerald-400' />
                        <span className='text-sm font-medium text-gray-300'>
                          {func.name}
                        </span>
                      </div>
                      {func.description && (
                        <p className='text-xs text-gray-500 mt-1'>
                          {func.description}
                        </p>
                      )}
                    </td>
                    <td className='px-6 py-4'>
                      <span className='text-sm text-gray-300 font-mono'>
                        {func.return_type}
                      </span>
                    </td>
                    <td className='px-6 py-4'>
                      <span className='text-sm text-gray-400 font-mono'>
                        {func.arguments || '()'}
                      </span>
                    </td>
                    <td className='px-6 py-4'>
                      <Badge className={getLanguageBadgeColor(func.language)}>
                        {func.language}
                      </Badge>
                    </td>
                    <td className='px-6 py-4'>
                      <Badge
                        className={getVolatilityBadgeColor(func.volatility)}
                      >
                        {func.volatility}
                      </Badge>
                    </td>
                    <td className='px-6 py-4'>
                      {func.is_security_definer ? (
                        <Badge className='bg-orange-500/10 text-orange-400 border-orange-500/20'>
                          DEFINER
                        </Badge>
                      ) : (
                        <Badge className='bg-gray-500/10 text-gray-400 border-gray-500/20'>
                          INVOKER
                        </Badge>
                      )}
                    </td>
                    <td className='px-6 py-4'>
                      <div className='flex items-center justify-end gap-2'>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='text-gray-400 hover:text-emerald-400'
                        >
                          <Play className='h-4 w-4' />
                        </Button>
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
              {filteredFunctions.length} functions
            </span>
          </div>
        </div>
      </Card>
    </div>
  )
}
