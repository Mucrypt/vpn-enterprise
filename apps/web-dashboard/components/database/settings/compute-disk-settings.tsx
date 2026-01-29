'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { HardDrive, Info, Zap } from 'lucide-react'

interface ComputeDiskSettingsProps {
  activeTenant: string
}

const COMPUTE_SIZES = [
  {
    id: 'nano',
    name: 'NANO',
    memory: 'Up to 0.5 GB memory',
    cpu: 'Shared CPU',
    price: '$0',
    priceUnit: '/ hour',
    isFree: true,
  },
  {
    id: 'micro',
    name: 'MICRO',
    memory: '1 GB memory',
    cpu: '2-core ARM CPU',
    price: '$0.01344',
    priceUnit: '/ hour',
  },
  {
    id: 'small',
    name: 'SMALL',
    memory: '2 GB memory',
    cpu: '2-core ARM CPU',
    price: '$0.0206',
    priceUnit: '/ hour',
  },
  {
    id: 'medium',
    name: 'MEDIUM',
    memory: '4 GB memory',
    cpu: '2-core ARM CPU',
    price: '$0.0822',
    priceUnit: '/ hour',
    isRecommended: true,
  },
  {
    id: 'large',
    name: 'LARGE',
    memory: '8 GB memory',
    cpu: '2-core ARM CPU',
    price: '$0.1517',
    priceUnit: '/ hour',
  },
  {
    id: 'xl',
    name: 'XL',
    memory: '16 GB memory',
    cpu: '4-core ARM CPU',
    price: '$0.2877',
    priceUnit: '/ hour',
  },
  {
    id: '2xl',
    name: '2XL',
    memory: '32 GB memory',
    cpu: '8-core ARM CPU',
    price: '$0.562',
    priceUnit: '/ hour',
  },
  {
    id: '4xl',
    name: '4XL',
    memory: '64 GB memory',
    cpu: '16-core ARM CPU',
    price: '$1.32',
    priceUnit: '/ hour',
  },
  {
    id: '8xl',
    name: '8XL',
    memory: '128 GB memory',
    cpu: '32-core ARM CPU',
    price: '$2.562',
    priceUnit: '/ hour',
  },
]

export function ComputeDiskSettings({ activeTenant }: ComputeDiskSettingsProps) {
  const [selectedSize] = React.useState('nano')

  return (
    <div className='space-y-8'>
      {/* Header */}
      <div>
        <h1 className='text-2xl font-semibold text-white mb-2'>
          Compute and Disk
        </h1>
        <p className='text-gray-400'>
          Configure the compute and disk settings for your project.
        </p>
      </div>

      {/* Pro Plan Notice */}
      <Card className='bg-amber-950/20 border-amber-900'>
        <div className='p-6 flex items-start gap-3'>
          <Info className='h-5 w-5 text-amber-400 shrink-0 mt-0.5' />
          <div>
            <p className='text-sm font-medium text-amber-300 mb-1'>
              Only available on Pro Plan and above
            </p>
            <p className='text-sm text-amber-200'>
              Upgrade to the Pro Plan to configure compute and disk settings.
            </p>
            <Button className='mt-4 bg-emerald-600 hover:bg-emerald-700 text-white'>
              Upgrade to Pro
            </Button>
          </div>
        </div>
      </Card>

      {/* Compute Size */}
      <Card className='bg-[#1e1e1e] border-gray-800'>
        <div className='p-6 border-b border-gray-800'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='text-lg font-semibold text-white mb-1'>
                Compute size
              </h2>
              <p className='text-sm text-gray-400'>
                Hardware resources allocated to your Postgres database
              </p>
            </div>
            <Button
              variant='outline'
              className='border-gray-700 hover:bg-gray-800 text-white'
            >
              Documentation
            </Button>
          </div>
        </div>

        <div className='p-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {COMPUTE_SIZES.map((size) => {
              const isSelected = selectedSize === size.id
              const isDisabled = !size.isFree

              return (
                <button
                  key={size.id}
                  disabled={isDisabled}
                  className={`
                    relative p-4 rounded-lg border text-left transition-all
                    ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-950/20'
                        : 'border-gray-800 bg-gray-900'
                    }
                    ${
                      isDisabled
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:border-emerald-600/50 cursor-pointer'
                    }
                  `}
                >
                  {size.isRecommended && (
                    <Badge className='absolute -top-2 right-4 bg-emerald-600 text-white text-xs'>
                      RECOMMENDED
                    </Badge>
                  )}
                  {size.isFree && (
                    <Badge className='absolute -top-2 right-4 bg-blue-600 text-white text-xs'>
                      CURRENT
                    </Badge>
                  )}

                  <div className='mb-3'>
                    <h3 className='text-sm font-bold text-emerald-400 mb-1'>
                      {size.name}
                    </h3>
                    <div className='flex items-baseline gap-1'>
                      <span className='text-2xl font-bold text-white'>
                        {size.price}
                      </span>
                      <span className='text-sm text-gray-400'>
                        {size.priceUnit}
                      </span>
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <div className='flex items-center gap-2 text-sm text-gray-300'>
                      <HardDrive className='h-4 w-4 text-gray-500' />
                      {size.memory}
                    </div>
                    <div className='flex items-center gap-2 text-sm text-gray-300'>
                      <Zap className='h-4 w-4 text-gray-500' />
                      {size.cpu}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </Card>

      {/* Disk Size */}
      <Card className='bg-[#1e1e1e] border-gray-800'>
        <div className='p-6 border-b border-gray-800'>
          <h2 className='text-lg font-semibold text-white mb-1'>Disk size</h2>
          <p className='text-sm text-gray-400'>
            Storage capacity allocated to your database
          </p>
        </div>

        <div className='p-6'>
          <div className='bg-gray-900 border border-gray-800 rounded-lg p-6 text-center'>
            <HardDrive className='h-12 w-12 text-gray-600 mx-auto mb-4' />
            <h3 className='text-lg font-semibold text-white mb-2'>
              8 GB Storage
            </h3>
            <p className='text-sm text-gray-400 mb-4'>
              Current disk allocation for your database
            </p>
            <Badge variant='outline' className='border-gray-700 text-gray-400'>
              Free Tier
            </Badge>
          </div>
        </div>
      </Card>

      {/* Connection Pooling */}
      <Card className='bg-[#1e1e1e] border-gray-800'>
        <div className='p-6 border-b border-gray-800'>
          <h2 className='text-lg font-semibold text-white mb-1'>
            Connection Pooling
          </h2>
          <p className='text-sm text-gray-400'>
            Manage database connections efficiently
          </p>
        </div>

        <div className='p-6 space-y-4'>
          <div className='grid grid-cols-2 gap-6'>
            <div>
              <h3 className='text-sm font-medium text-gray-400 mb-1'>Memory</h3>
              <p className='text-lg font-semibold text-white'>0.5 GB</p>
            </div>
            <div>
              <h3 className='text-sm font-medium text-gray-400 mb-1'>CPU</h3>
              <p className='text-lg font-semibold text-white'>
                Shared-core ARM (Shared)
              </p>
            </div>
            <div>
              <h3 className='text-sm font-medium text-gray-400 mb-1'>
                No. of direct connections
              </h3>
              <p className='text-lg font-semibold text-white'>30</p>
            </div>
            <div>
              <h3 className='text-sm font-medium text-gray-400 mb-1'>
                No. of pooler connections
              </h3>
              <p className='text-lg font-semibold text-white'>200</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
