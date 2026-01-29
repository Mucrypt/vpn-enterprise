'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Zap, Shield, Info } from 'lucide-react'

interface RateLimitConfig {
  id: string
  name: string
  description: string
  limit: string
  unit: string
  calculation?: string
}

interface AuthRateLimitsPageProps {
  activeTenant: string
}

export function AuthRateLimitsPage({ activeTenant }: AuthRateLimitsPageProps) {
  const [rateLimits] = useState<RateLimitConfig[]>([
    {
      id: 'email',
      name: 'Rate limit for sending emails',
      description:
        'Number of emails that can be sent per hour from your project',
      limit: '2',
      unit: 'emails/h',
    },
    {
      id: 'sms',
      name: 'Rate limit for sending SMS messages',
      description:
        'Number of SMS messages that can be sent per hour from your project',
      limit: '30',
      unit: 'sms/h',
    },
    {
      id: 'token-refresh',
      name: 'Rate limit for token refreshes',
      description:
        'Number of sessions that can be refreshed in a 5 minute interval per IP address',
      limit: '150',
      unit: 'requests/5 min',
      calculation: '1800 requests per hour',
    },
    {
      id: 'token-verify',
      name: 'Rate limit for token verifications',
      description:
        'Number of OTP/Magic link verifications that can be made in a 5 minute interval per IP address',
      limit: '30',
      unit: 'requests/5 min',
      calculation: '360 requests per hour',
    },
    {
      id: 'anonymous',
      name: 'Rate limit for anonymous users',
      description:
        'Number of anonymous sign-ins that can be made per hour per IP address',
      limit: '30',
      unit: 'requests/h',
    },
    {
      id: 'signup-signin',
      name: 'Rate limit for sign-ups and sign-ins',
      description:
        'Number of sign-up and sign-in requests that can be made in a 5 minute interval per IP address (excludes anonymous users)',
      limit: '30',
      unit: 'requests/5 min',
      calculation: '360 requests per hour',
    },
  ])

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-semibold text-white mb-2'>Rate Limits</h1>
        <p className='text-gray-400'>
          Safeguard against bursts of incoming traffic to prevent abuse and
          maximize stability
        </p>
      </div>

      {/* Info Banner */}
      <Card className='p-4 bg-blue-500/5 border-blue-500/20'>
        <div className='flex items-start gap-3'>
          <Info className='h-5 w-5 text-blue-400 shrink-0 mt-0.5' />
          <div>
            <h4 className='text-sm font-medium text-blue-400 mb-1'>
              Rate Limiting
            </h4>
            <p className='text-sm text-gray-400'>
              Rate limits help protect your authentication endpoints from abuse.
              These limits apply per IP address to prevent malicious actors from
              overwhelming your system with requests.
            </p>
          </div>
        </div>
      </Card>

      {/* Rate Limits Configuration */}
      <Card className='p-6 bg-gray-900 border-gray-800'>
        <div className='flex items-center gap-3 mb-6'>
          <Zap className='h-6 w-6 text-emerald-400' />
          <h2 className='text-lg font-semibold text-white'>
            Authentication Rate Limits
          </h2>
        </div>

        <div className='space-y-6'>
          {rateLimits.map((config, index) => (
            <div
              key={config.id}
              className={`py-6 ${index !== rateLimits.length - 1 ? 'border-b border-gray-800' : ''}`}
            >
              <div className='flex items-start justify-between gap-8'>
                <div className='flex-1'>
                  <h3 className='text-sm font-medium text-white mb-1'>
                    {config.name}
                  </h3>
                  <p className='text-sm text-gray-400 mb-3'>
                    {config.description}
                  </p>
                  {config.calculation && (
                    <Badge
                      variant='outline'
                      className='border-gray-700 text-gray-400 bg-gray-800/50'
                    >
                      {config.calculation}
                    </Badge>
                  )}
                </div>
                <div className='flex items-center gap-3 min-w-[200px]'>
                  <Input
                    type='number'
                    defaultValue={config.limit}
                    className='bg-gray-800 border-gray-700 text-white text-right'
                  />
                  <span className='text-sm text-gray-400 min-w-[100px]'>
                    {config.unit}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className='mt-6 pt-6 border-t border-gray-800 flex justify-end'>
          <Button className='bg-emerald-600 hover:bg-emerald-700 text-white'>
            Save changes
          </Button>
        </div>
      </Card>

      {/* Security Best Practices */}
      <Card className='p-6 bg-gray-900 border-gray-800'>
        <div className='flex items-start gap-4'>
          <div className='p-3 bg-emerald-500/10 rounded-lg shrink-0'>
            <Shield className='h-6 w-6 text-emerald-400' />
          </div>
          <div>
            <h3 className='text-lg font-semibold text-white mb-2'>
              Best Practices for Rate Limiting
            </h3>
            <ul className='space-y-2 text-sm text-gray-400'>
              <li className='flex items-start gap-2'>
                <span className='text-emerald-400 mt-0.5'>•</span>
                <span>
                  Set email/SMS limits conservatively to prevent abuse while
                  allowing legitimate use
                </span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='text-emerald-400 mt-0.5'>•</span>
                <span>
                  Token refresh limits should balance security with user
                  experience
                </span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='text-emerald-400 mt-0.5'>•</span>
                <span>
                  Monitor your rate limit hits to adjust thresholds
                  appropriately
                </span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='text-emerald-400 mt-0.5'>•</span>
                <span>
                  Consider implementing exponential backoff for your clients
                </span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
