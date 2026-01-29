'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Clock, Shield, AlertCircle } from 'lucide-react'

interface AuthSessionsPageProps {
  activeTenant: string
}

export function AuthSessionsPage({ activeTenant }: AuthSessionsPageProps) {
  const [detectCompromised, setDetectCompromised] = useState(true)
  const [reuseInterval, setReuseInterval] = useState('10')
  const [enforceSingleSession, setEnforceSingleSession] = useState(false)
  const [timeboxSessions, setTimeboxSessions] = useState(false)

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-semibold text-white mb-2'>
          User Sessions
        </h1>
        <p className='text-gray-400'>
          Configure settings for user sessions and refresh tokens
        </p>
      </div>

      {/* Refresh Tokens Section */}
      <Card className='p-6 bg-gray-900 border-gray-800'>
        <div className='flex items-center gap-3 mb-6'>
          <Shield className='h-6 w-6 text-emerald-400' />
          <h2 className='text-lg font-semibold text-white'>Refresh Tokens</h2>
        </div>

        <div className='space-y-6'>
          <div className='flex items-start justify-between py-4 border-b border-gray-800'>
            <div className='flex-1'>
              <h3 className='text-sm font-medium text-white mb-1'>
                Detect and revoke potentially compromised refresh tokens
              </h3>
              <p className='text-sm text-gray-400'>
                Prevent replay attacks from potentially compromised refresh
                tokens.
              </p>
            </div>
            <Switch
              checked={detectCompromised}
              onCheckedChange={setDetectCompromised}
            />
          </div>

          <div className='py-4 border-b border-gray-800'>
            <h3 className='text-sm font-medium text-white mb-2'>
              Refresh token reuse interval
            </h3>
            <p className='text-sm text-gray-400 mb-4'>
              Time interval where the same refresh token can be used multiple
              times to request for an access token. Recommendation: 10 seconds.
            </p>
            <div className='flex items-center gap-3'>
              <Input
                type='number'
                value={reuseInterval}
                onChange={(e) => setReuseInterval(e.target.value)}
                className='w-32 bg-gray-800 border-gray-700 text-white'
              />
              <span className='text-sm text-gray-400'>seconds</span>
            </div>
          </div>
        </div>

        <div className='mt-6 pt-6 border-t border-gray-800 flex justify-end'>
          <Button className='bg-emerald-600 hover:bg-emerald-700 text-white'>
            Save changes
          </Button>
        </div>
      </Card>

      {/* User Sessions Section */}
      <Card className='p-6 bg-gray-900 border-gray-800'>
        <div className='flex items-center gap-3 mb-6'>
          <Clock className='h-6 w-6 text-emerald-400' />
          <h2 className='text-lg font-semibold text-white'>User Sessions</h2>
        </div>

        <div className='space-y-6'>
          <div className='flex items-start justify-between py-4 border-b border-gray-800'>
            <div className='flex-1'>
              <h3 className='text-sm font-medium text-white mb-1'>
                Enforce single session per user
              </h3>
              <p className='text-sm text-gray-400'>
                If enabled, all but a user's most recently active session will
                be terminated.
              </p>
            </div>
            <Switch
              checked={enforceSingleSession}
              onCheckedChange={setEnforceSingleSession}
            />
          </div>

          <div className='flex items-start justify-between py-4'>
            <div className='flex-1'>
              <h3 className='text-sm font-medium text-white mb-1'>
                Time-box user sessions
              </h3>
              <p className='text-sm text-gray-400'>
                Force users to sign in again after a certain period of time.
              </p>
            </div>
            <Switch
              checked={timeboxSessions}
              onCheckedChange={setTimeboxSessions}
            />
          </div>
        </div>

        {timeboxSessions && (
          <Card className='p-4 bg-gray-800 border-gray-700 mt-4'>
            <h4 className='text-sm font-medium text-white mb-3'>
              Session timeout duration
            </h4>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='text-xs text-gray-400 mb-2 block'>
                  Inactivity timeout
                </label>
                <div className='flex items-center gap-2'>
                  <Input
                    type='number'
                    defaultValue='24'
                    className='bg-gray-900 border-gray-700 text-white'
                  />
                  <span className='text-sm text-gray-400'>hours</span>
                </div>
              </div>
              <div>
                <label className='text-xs text-gray-400 mb-2 block'>
                  Absolute timeout
                </label>
                <div className='flex items-center gap-2'>
                  <Input
                    type='number'
                    defaultValue='720'
                    className='bg-gray-900 border-gray-700 text-white'
                  />
                  <span className='text-sm text-gray-400'>hours</span>
                </div>
              </div>
            </div>
          </Card>
        )}

        <div className='mt-6 pt-6 border-t border-gray-800 flex justify-end'>
          <Button className='bg-emerald-600 hover:bg-emerald-700 text-white'>
            Save changes
          </Button>
        </div>
      </Card>

      {/* Security Notice */}
      <Card className='p-4 bg-orange-500/5 border-orange-500/20'>
        <div className='flex items-start gap-3'>
          <AlertCircle className='h-5 w-5 text-orange-400 shrink-0 mt-0.5' />
          <div>
            <h4 className='text-sm font-medium text-orange-400 mb-1'>
              Security Best Practice
            </h4>
            <p className='text-sm text-gray-400'>
              Enabling refresh token rotation and compromised token detection
              helps protect your users from session hijacking attacks. Consider
              keeping the reuse interval at 10 seconds for optimal security.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
