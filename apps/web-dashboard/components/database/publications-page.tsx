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
  Share,
  Edit,
  Trash2,
  Radio,
  AlertCircle,
} from 'lucide-react'

interface DatabasePublication {
  name: string
  owner: string
  tables: string[]
  all_tables: boolean
  publish_insert: boolean
  publish_update: boolean
  publish_delete: boolean
  publish_truncate: boolean
}

interface PublicationsPageProps {
  activeTenant: string
  onCreatePublication?: () => void
}

export function PublicationsPage({
  activeTenant,
  onCreatePublication,
}: PublicationsPageProps) {
  const [publications, setPublications] = useState<DatabasePublication[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const loadPublications = async () => {
    if (!activeTenant) return
    setLoading(true)
    try {
      const response = await fetch(
        `/api/v1/tenants/${activeTenant}/publications`,
      )
      if (response.ok) {
        const data = await response.json()
        setPublications(data.data || data.publications || [])
      }
    } catch (error) {
      console.error('Error loading publications:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPublications()
  }, [activeTenant])

  const filteredPublications = publications.filter((pub) =>
    pub.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getEventBadges = (pub: DatabasePublication) => {
    const events = []
    if (pub.publish_insert)
      events.push({
        name: 'INSERT',
        color: 'bg-green-500/10 text-green-400 border-green-500/20',
      })
    if (pub.publish_update)
      events.push({
        name: 'UPDATE',
        color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      })
    if (pub.publish_delete)
      events.push({
        name: 'DELETE',
        color: 'bg-red-500/10 text-red-400 border-red-500/20',
      })
    if (pub.publish_truncate)
      events.push({
        name: 'TRUNCATE',
        color: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      })
    return events
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-semibold text-white mb-2'>Publications</h1>
        <p className='text-gray-400'>
          Logical replication publications for streaming database changes
        </p>
      </div>

      {/* Info Banner */}
      <Card className='p-4 bg-blue-500/5 border-blue-500/20'>
        <div className='flex items-start gap-3'>
          <AlertCircle className='h-5 w-5 text-blue-400 shrink-0 mt-0.5' />
          <div>
            <h4 className='text-sm font-medium text-blue-400 mb-1'>
              About Publications
            </h4>
            <p className='text-sm text-gray-400'>
              Publications define sets of tables whose data changes are intended
              to be replicated. Use publications for logical replication,
              real-time subscriptions, and change data capture (CDC).
            </p>
          </div>
        </div>
      </Card>

      {/* Actions Bar */}
      <Card className='p-4 bg-gray-900 border-gray-800'>
        <div className='flex items-center justify-between gap-4'>
          <div className='flex items-center gap-3 flex-1'>
            <div className='relative flex-1 max-w-md'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
              <Input
                placeholder='Search for a publication'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='pl-10 bg-gray-800 border-gray-700 text-white'
              />
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={loadPublications}
              disabled={loading}
              className='border-gray-700'
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
              />
            </Button>
            <Button
              size='sm'
              onClick={onCreatePublication}
              className='bg-emerald-600 hover:bg-emerald-700 text-white'
            >
              <Plus className='h-4 w-4 mr-2' />
              New publication
            </Button>
          </div>
        </div>
      </Card>

      {/* Publications Table */}
      <Card className='bg-gray-900 border-gray-800 overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-gray-800/50 border-b border-gray-800'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider'>
                  Name
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider'>
                  Owner
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider'>
                  Tables
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider'>
                  Events Published
                </th>
                <th className='px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-800'>
              {loading ? (
                <tr>
                  <td colSpan={5} className='px-6 py-12 text-center'>
                    <RefreshCw className='h-6 w-6 animate-spin text-emerald-400 mx-auto mb-2' />
                    <p className='text-gray-400'>Loading publications...</p>
                  </td>
                </tr>
              ) : filteredPublications.length === 0 ? (
                <tr>
                  <td colSpan={5} className='px-6 py-12 text-center'>
                    <Radio className='h-12 w-12 text-gray-600 mx-auto mb-3' />
                    <p className='text-gray-400 mb-2'>No publications found</p>
                    <p className='text-sm text-gray-500'>
                      Create a publication to enable logical replication
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPublications.map((pub, index) => (
                  <tr
                    key={index}
                    className='hover:bg-gray-800/30 transition-colors'
                  >
                    <td className='px-6 py-4'>
                      <div className='flex items-center gap-2'>
                        <Share className='h-4 w-4 text-green-400' />
                        <span className='text-sm font-medium text-gray-300'>
                          {pub.name}
                        </span>
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <span className='text-sm text-gray-400'>{pub.owner}</span>
                    </td>
                    <td className='px-6 py-4'>
                      {pub.all_tables ? (
                        <Badge className='bg-purple-500/10 text-purple-400 border-purple-500/20'>
                          ALL TABLES
                        </Badge>
                      ) : (
                        <div className='flex flex-wrap gap-1'>
                          {pub.tables.slice(0, 3).map((table, i) => (
                            <Badge
                              key={i}
                              className='bg-gray-800 text-gray-300 border-gray-700'
                            >
                              {table}
                            </Badge>
                          ))}
                          {pub.tables.length > 3 && (
                            <Badge className='bg-gray-800 text-gray-400 border-gray-700'>
                              +{pub.tables.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </td>
                    <td className='px-6 py-4'>
                      <div className='flex flex-wrap gap-1'>
                        {getEventBadges(pub).map((event, i) => (
                          <Badge key={i} className={event.color}>
                            {event.name}
                          </Badge>
                        ))}
                      </div>
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
              {filteredPublications.length} publications
            </span>
          </div>
        </div>
      </Card>
    </div>
  )
}
