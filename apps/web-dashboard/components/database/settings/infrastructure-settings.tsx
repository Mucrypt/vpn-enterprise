'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Server, MapPin } from 'lucide-react'

interface InfrastructureSettingsProps {
  activeTenant: string
}

export function InfrastructureSettings({
  activeTenant,
}: InfrastructureSettingsProps) {
  return (
    <div className='space-y-8'>
      {/* Header */}
      <div>
        <h1 className='text-2xl font-semibold text-white mb-2'>
          Infrastructure
        </h1>
        <p className='text-gray-400'>
          General information regarding your server instance
        </p>
      </div>

      {/* Primary Database */}
      <Card className='bg-[#1e1e1e] border-gray-800'>
        <div className='p-6'>
          <div className='flex items-center gap-6'>
            {/* Database Icon */}
            <div className='w-20 h-20 bg-emerald-600/10 border border-emerald-600/30 rounded-lg flex items-center justify-center shrink-0'>
              <Server className='h-10 w-10 text-emerald-500' />
            </div>

            {/* Info */}
            <div className='flex-1'>
              <div className='flex items-center gap-2 mb-2'>
                <h3 className='text-lg font-semibold text-white'>
                  Primary Database
                </h3>
                <Badge className='bg-emerald-600 text-white text-xs'>
                  PRODUCTION
                </Badge>
              </div>
              <div className='flex items-center gap-2 text-sm text-gray-400'>
                <MapPin className='h-4 w-4' />
                <span>West EU (Ireland)</span>
                <span className='text-gray-600'>•</span>
                <span>AWS • t4g.nano</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Infrastructure Details */}
      <Card className='bg-[#1e1e1e] border-gray-800'>
        <div className='p-6 border-b border-gray-800'>
          <h2 className='text-lg font-semibold text-white'>
            Infrastructure Details
          </h2>
        </div>

        <div className='p-6 space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <h3 className='text-sm font-medium text-gray-400 mb-1'>Region</h3>
              <p className='text-base text-white'>West EU (Ireland)</p>
            </div>

            <div>
              <h3 className='text-sm font-medium text-gray-400 mb-1'>
                Cloud Provider
              </h3>
              <p className='text-base text-white'>AWS</p>
            </div>

            <div>
              <h3 className='text-sm font-medium text-gray-400 mb-1'>
                Instance Type
              </h3>
              <p className='text-base text-white'>t4g.nano</p>
            </div>

            <div>
              <h3 className='text-sm font-medium text-gray-400 mb-1'>
                Database Version
              </h3>
              <p className='text-base text-white'>PostgreSQL 15.3</p>
            </div>

            <div>
              <h3 className='text-sm font-medium text-gray-400 mb-1'>Memory</h3>
              <p className='text-base text-white'>0.5 GB</p>
            </div>

            <div>
              <h3 className='text-sm font-medium text-gray-400 mb-1'>
                Storage
              </h3>
              <p className='text-base text-white'>8 GB</p>
            </div>

            <div>
              <h3 className='text-sm font-medium text-gray-400 mb-1'>
                Max Connections
              </h3>
              <p className='text-base text-white'>30</p>
            </div>

            <div>
              <h3 className='text-sm font-medium text-gray-400 mb-1'>Status</h3>
              <Badge className='bg-emerald-600 text-white'>Active</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Network Information */}
      <Card className='bg-[#1e1e1e] border-gray-800'>
        <div className='p-6 border-b border-gray-800'>
          <h2 className='text-lg font-semibold text-white'>
            Network Information
          </h2>
        </div>

        <div className='p-6 space-y-4'>
          <div>
            <h3 className='text-sm font-medium text-gray-400 mb-1'>
              Connection String
            </h3>
            <code className='text-sm text-gray-300 bg-gray-900 px-3 py-2 rounded block overflow-x-auto'>
              postgresql://user:password@db.{activeTenant}.database.cloud:5432/
              {activeTenant}
            </code>
          </div>

          <div>
            <h3 className='text-sm font-medium text-gray-400 mb-1'>Host</h3>
            <code className='text-sm text-gray-300 bg-gray-900 px-3 py-2 rounded block'>
              db.{activeTenant}.database.cloud
            </code>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <h3 className='text-sm font-medium text-gray-400 mb-1'>Port</h3>
              <code className='text-sm text-gray-300 bg-gray-900 px-3 py-2 rounded block'>
                5432
              </code>
            </div>

            <div>
              <h3 className='text-sm font-medium text-gray-400 mb-1'>
                Database
              </h3>
              <code className='text-sm text-gray-300 bg-gray-900 px-3 py-2 rounded block'>
                {activeTenant}
              </code>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
