'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Github, ExternalLink } from 'lucide-react'

interface IntegrationsSettingsProps {
  activeTenant: string
}

export function IntegrationsSettings({
  activeTenant,
}: IntegrationsSettingsProps) {
  return (
    <div className='space-y-8'>
      {/* Header */}
      <div>
        <h1 className='text-2xl font-semibold text-white mb-2'>
          Integrations
        </h1>
        <p className='text-gray-400'>
          Connect external services and tools to your project
        </p>
      </div>

      {/* GitHub Integration */}
      <Card className='bg-[#1e1e1e] border-gray-800'>
        <div className='p-6 border-b border-gray-800'>
          <h2 className='text-lg font-semibold text-white mb-1'>
            GitHub Integration
          </h2>
          <p className='text-sm text-gray-400'>
            Connect any of your GitHub repositories to a project.
          </p>
        </div>

        <div className='p-6'>
          <div className='flex items-start gap-6'>
            {/* GitHub Icon */}
            <div className='w-24 h-24 bg-gray-900 border border-gray-800 rounded-lg flex items-center justify-center shrink-0'>
              <Github className='h-12 w-12 text-white' />
            </div>

            {/* Content */}
            <div className='flex-1'>
              <div className='mb-4'>
                <h3 className='text-base font-semibold text-white mb-2'>
                  How does the GitHub integration work?
                </h3>
                <p className='text-sm text-gray-400'>
                  Connecting to GitHub allows you to sync preview branches with a
                  chosen GitHub branch, keep your production branch in sync, and
                  automatically create preview branches for every pull request.
                </p>
              </div>

              <Card className='bg-gray-900 border-gray-800 p-4 mb-4'>
                <div className='flex items-start gap-3'>
                  <div className='text-amber-500'>⚠️</div>
                  <div>
                    <p className='text-sm font-medium text-white mb-1'>
                      Upgrade to unlock GitHub integration
                    </p>
                    <p className='text-sm text-gray-400'>
                      Connect your GitHub repository to automatically sync preview
                      branches and deploy changes.
                    </p>
                  </div>
                </div>
              </Card>

              <Button className='bg-emerald-600 hover:bg-emerald-700 text-white'>
                Upgrade to Pro
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Vercel Integration */}
      <Card className='bg-[#1e1e1e] border-gray-800'>
        <div className='p-6 border-b border-gray-800'>
          <h2 className='text-lg font-semibold text-white mb-1'>
            Vercel Integration
          </h2>
          <p className='text-sm text-gray-400'>
            Connect your Vercel teams to your organization.
          </p>
        </div>

        <div className='p-6'>
          <div className='flex items-start gap-6'>
            {/* Vercel Icon */}
            <div className='w-24 h-24 bg-gray-900 border border-gray-800 rounded-lg flex items-center justify-center shrink-0'>
              <svg
                className='h-12 w-12 text-white'
                viewBox='0 0 24 24'
                fill='currentColor'
              >
                <path d='M12 1.5L23.5 22.5H0.5L12 1.5z' />
              </svg>
            </div>

            {/* Content */}
            <div className='flex-1'>
              <div className='mb-4'>
                <h3 className='text-base font-semibold text-white mb-2'>
                  How does the Vercel integration work?
                </h3>
                <p className='text-sm text-gray-400 mb-3'>
                  Our platform will keep your environment variables up to date in
                  each of the projects you assign to a database project. You can
                  also link multiple Vercel Projects to the same database project.
                </p>
                <Button
                  variant='link'
                  className='text-emerald-400 hover:text-emerald-300 p-0 h-auto'
                >
                  <ExternalLink className='h-4 w-4 mr-1' />
                  Install Vercel Integration
                </Button>
              </div>

              <div className='bg-gray-900 border border-gray-800 rounded-lg p-6 text-center'>
                <p className='text-sm text-gray-400'>
                  No Vercel teams connected yet
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* More Integrations Coming Soon */}
      <Card className='bg-[#1e1e1e] border-gray-800'>
        <div className='p-6'>
          <div className='text-center py-8'>
            <div className='w-16 h-16 bg-gray-900 border border-gray-800 rounded-full flex items-center justify-center mx-auto mb-4'>
              <ExternalLink className='h-8 w-8 text-gray-600' />
            </div>
            <h3 className='text-lg font-semibold text-white mb-2'>
              More integrations coming soon
            </h3>
            <p className='text-sm text-gray-400 max-w-md mx-auto'>
              We're working on bringing you more integrations to connect your
              favorite tools and services.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
