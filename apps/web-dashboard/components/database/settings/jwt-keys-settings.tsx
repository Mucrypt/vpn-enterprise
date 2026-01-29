'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, Copy, Info } from 'lucide-react'

interface JwtKeysSettingsProps {
  activeTenant: string
}

export function JwtKeysSettings({ activeTenant }: JwtKeysSettingsProps) {
  const [currentKey] = useState({
    id: '42C4C791-4A79-4946-AB31-29A53CBC48E4',
    type: 'ECC (P-256)',
    status: 'CURRENT KEY',
  })

  const [previousKey] = useState({
    id: '5FDB6E2E-55CF-4E76-BDD1-138C31EDCA52',
    type: 'Legacy HS256 (Shared Secret)',
    rotatedAt: '9 days ago',
    status: 'PREVIOUS KEY',
  })

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className='space-y-8'>
      {/* Header */}
      <div>
        <h1 className='text-2xl font-semibold text-white mb-2'>JWT Keys</h1>
        <p className='text-gray-400'>
          Control the keys used to sign JSON Web Tokens for your project
        </p>
      </div>

      {/* JWT Signing Keys */}
      <Card className='bg-[#1e1e1e] border-gray-800'>
        <div className='p-6 border-b border-gray-800'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='text-lg font-semibold text-white mb-1'>
                JWT Signing Keys
              </h2>
              <p className='text-sm text-gray-400'>
                Control the keys used to sign JSON Web Tokens for your project
              </p>
            </div>
            <Button
              variant='outline'
              className='border-gray-700 hover:bg-gray-800 text-white'
            >
              Legacy JWT Secret
            </Button>
          </div>
        </div>

        <div className='p-6'>
          {/* Create Standby Key */}
          <Card className='bg-gray-900 border-gray-800 mb-6'>
            <div className='p-6'>
              <h3 className='text-base font-semibold text-white mb-2'>
                CREATE STANDBY KEY
              </h3>
              <p className='text-sm text-gray-400 mb-4'>
                Set up a new key which you can switch to once it has been picked
                up by all components of your application.
              </p>
              <Button className='bg-emerald-600 hover:bg-emerald-700 text-white'>
                <Shield className='h-4 w-4 mr-2' />
                Create Standby Key
              </Button>
            </div>
          </Card>

          {/* Current Key */}
          <div className='mb-6'>
            <h3 className='text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4'>
              Status
            </h3>
            <div className='border border-emerald-600/30 rounded-lg overflow-hidden'>
              <div className='bg-emerald-950/20 p-4 border-b border-emerald-600/30'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <Badge className='bg-emerald-600 text-white'>
                      {currentKey.status}
                    </Badge>
                    <code className='text-sm text-gray-300 font-mono'>
                      {currentKey.id}
                    </code>
                  </div>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => copyToClipboard(currentKey.id)}
                    className='hover:bg-gray-800'
                  >
                    <Copy className='h-4 w-4' />
                  </Button>
                </div>
              </div>
              <div className='bg-[#1e1e1e] p-4 flex items-center gap-2'>
                <Shield className='h-4 w-4 text-emerald-500' />
                <span className='text-sm text-gray-300'>{currentKey.type}</span>
                <Info className='h-4 w-4 text-gray-500 ml-auto' />
              </div>
            </div>
          </div>

          {/* Previous Keys */}
          <div>
            <h3 className='text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4'>
              Previously used keys
            </h3>
            <p className='text-sm text-gray-400 mb-4'>
              These JWT signing keys are still used to{' '}
              <span className='text-emerald-400'>verify tokens</span> that are
              yet to expire. Revoke once all tokens have expired.
            </p>

            <div className='border border-gray-800 rounded-lg overflow-hidden'>
              <div className='bg-gray-900 p-4 border-b border-gray-800'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <Badge
                      variant='outline'
                      className='border-gray-700 text-gray-400'
                    >
                      {previousKey.status}
                    </Badge>
                    <code className='text-sm text-gray-300 font-mono'>
                      {previousKey.id}
                    </code>
                  </div>
                  <div className='flex items-center gap-2'>
                    <span className='text-xs text-gray-500'>
                      Last rotated {previousKey.rotatedAt}
                    </span>
                    <Button
                      variant='ghost'
                      size='icon'
                      onClick={() => copyToClipboard(previousKey.id)}
                      className='hover:bg-gray-800'
                    >
                      <Copy className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              </div>
              <div className='bg-[#1e1e1e] p-4 flex items-center gap-2'>
                <Shield className='h-4 w-4 text-gray-500' />
                <span className='text-sm text-gray-400'>{previousKey.type}</span>
                <Info className='h-4 w-4 text-gray-500 ml-auto' />
              </div>
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
              <p className='font-medium mb-2'>About JWT Key Rotation</p>
              <p>
                JWT keys are used to sign authentication tokens. When you create
                a standby key, it will be used for signing new tokens while the
                current key continues to verify existing tokens until they
                expire. This ensures zero-downtime key rotation.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
