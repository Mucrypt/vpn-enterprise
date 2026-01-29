'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Mail, Check, AlertCircle } from 'lucide-react'

interface AuthProvidersPageProps {
  activeTenant: string
}

export function AuthProvidersPage({ activeTenant }: AuthProvidersPageProps) {
  const [allowSignup, setAllowSignup] = useState(true)
  const [allowManualLinking, setAllowManualLinking] = useState(false)
  const [allowAnonymous, setAllowAnonymous] = useState(false)
  const [confirmEmail, setConfirmEmail] = useState(true)

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-semibold text-white mb-2'>
          Sign In / Providers
        </h1>
        <p className='text-gray-400'>
          Configure authentication providers and login methods for your users
        </p>
      </div>

      {/* Tabs */}
      <div className='flex items-center gap-4 border-b border-gray-800'>
        <button className='px-4 py-2 text-white border-b-2 border-emerald-500 font-medium'>
          Supabase Auth
        </button>
        <button className='px-4 py-2 text-gray-400 hover:text-white transition-colors'>
          Third-Party Auth
        </button>
      </div>

      {/* User Signups Section */}
      <Card className='p-6 bg-gray-900 border-gray-800'>
        <h2 className='text-lg font-semibold text-white mb-4'>User Signups</h2>
        <div className='space-y-6'>
          <div className='flex items-start justify-between py-4 border-b border-gray-800'>
            <div className='flex-1'>
              <h3 className='text-sm font-medium text-white mb-1'>
                Allow new users to sign up
              </h3>
              <p className='text-sm text-gray-400'>
                If this is disabled, new users will not be able to sign up to
                your application
              </p>
            </div>
            <Switch checked={allowSignup} onCheckedChange={setAllowSignup} />
          </div>

          <div className='flex items-start justify-between py-4 border-b border-gray-800'>
            <div className='flex-1'>
              <h3 className='text-sm font-medium text-white mb-1'>
                Allow manual linking
              </h3>
              <p className='text-sm text-gray-400'>
                Enable{' '}
                <a href='#' className='text-emerald-400 underline'>
                  manual linking APIs
                </a>{' '}
                for your project
              </p>
            </div>
            <Switch
              checked={allowManualLinking}
              onCheckedChange={setAllowManualLinking}
            />
          </div>

          <div className='flex items-start justify-between py-4 border-b border-gray-800'>
            <div className='flex-1'>
              <h3 className='text-sm font-medium text-white mb-1'>
                Allow anonymous sign-ins
              </h3>
              <p className='text-sm text-gray-400'>
                Enable{' '}
                <a href='#' className='text-emerald-400 underline'>
                  anonymous sign-ins
                </a>{' '}
                for your project
              </p>
            </div>
            <Switch
              checked={allowAnonymous}
              onCheckedChange={setAllowAnonymous}
            />
          </div>

          <div className='flex items-start justify-between py-4'>
            <div className='flex-1'>
              <h3 className='text-sm font-medium text-white mb-1'>
                Confirm email
              </h3>
              <p className='text-sm text-gray-400'>
                Users will need to confirm their email address before signing in
                for the first time
              </p>
            </div>
            <Switch checked={confirmEmail} onCheckedChange={setConfirmEmail} />
          </div>
        </div>

        <div className='mt-6 pt-6 border-t border-gray-800 flex justify-end'>
          <Button className='bg-emerald-600 hover:bg-emerald-700 text-white'>
            Save changes
          </Button>
        </div>
      </Card>

      {/* Email Provider Status */}
      <Card className='p-6 bg-gray-900 border-gray-800'>
        <div className='flex items-start gap-4'>
          <div className='p-3 bg-emerald-500/10 rounded-lg'>
            <Mail className='h-6 w-6 text-emerald-400' />
          </div>
          <div className='flex-1'>
            <div className='flex items-center gap-2 mb-2'>
              <h3 className='text-lg font-semibold text-white'>
                Email Provider
              </h3>
              <Badge className='bg-emerald-500/10 text-emerald-400 border-emerald-500/20'>
                <Check className='h-3 w-3 mr-1' />
                Enabled
              </Badge>
            </div>
            <p className='text-sm text-gray-400 mb-4'>
              Email-based authentication is enabled for your project. Users can
              sign up and sign in using their email address.
            </p>
            <div className='flex items-center gap-3'>
              <Button
                variant='outline'
                size='sm'
                className='border-gray-700 text-white hover:bg-gray-800'
              >
                Configure
              </Button>
              <Button
                variant='outline'
                size='sm'
                className='border-gray-700 text-white hover:bg-gray-800'
              >
                View Documentation
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Info Banner */}
      <Card className='p-4 bg-blue-500/5 border-blue-500/20'>
        <div className='flex items-start gap-3'>
          <AlertCircle className='h-5 w-5 text-blue-400 shrink-0 mt-0.5' />
          <div>
            <h4 className='text-sm font-medium text-blue-400 mb-1'>
              Third-Party Providers
            </h4>
            <p className='text-sm text-gray-400'>
              Configure OAuth providers like Google, GitHub, and more in the
              "Third-Party Auth" tab. Enable social login to give your users
              more sign-in options.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
