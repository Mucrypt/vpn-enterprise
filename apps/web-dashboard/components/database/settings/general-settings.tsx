'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Database, Copy, Info, AlertTriangle } from 'lucide-react'

interface GeneralSettingsProps {
  activeTenant: string
}

export function GeneralSettings({ activeTenant }: GeneralSettingsProps) {
  const [projectName, setProjectName] = useState('portfolio-app')
  const [projectId] = useState(activeTenant)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    // API call to save settings
    setTimeout(() => setIsSaving(false), 1000)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className='space-y-8'>
      {/* Header */}
      <div>
        <h1 className='text-2xl font-semibold text-white mb-2'>
          Project Settings
        </h1>
        <p className='text-gray-400'>
          Configure general options, domains, transfers, and project lifecycle.
        </p>
      </div>

      {/* General Settings */}
      <Card className='bg-[#1e1e1e] border-gray-800'>
        <div className='p-6 border-b border-gray-800'>
          <h2 className='text-lg font-semibold text-white'>General settings</h2>
        </div>

        <div className='p-6 space-y-6'>
          {/* Project Name */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div>
              <h3 className='text-sm font-medium text-white mb-1'>
                Project name
              </h3>
              <p className='text-sm text-gray-400'>
                Displayed throughout the dashboard.
              </p>
            </div>
            <div className='md:col-span-2'>
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className='bg-gray-900 border-gray-700 text-white'
              />
            </div>
          </div>

          {/* Project ID */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div>
              <h3 className='text-sm font-medium text-white mb-1'>
                Project ID
              </h3>
              <p className='text-sm text-gray-400'>
                Reference used in APIs and URLs.
              </p>
            </div>
            <div className='md:col-span-2 flex items-center gap-2'>
              <Input
                value={projectId}
                readOnly
                className='bg-gray-900 border-gray-700 text-gray-400'
              />
              <Button
                variant='outline'
                size='icon'
                onClick={() => copyToClipboard(projectId)}
                className='border-gray-700 hover:bg-gray-800'
              >
                <Copy className='h-4 w-4' />
              </Button>
            </div>
          </div>

          {/* Save Button */}
          <div className='flex justify-end'>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className='bg-emerald-600 hover:bg-emerald-700 text-white'
            >
              {isSaving ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Project Availability */}
      <Card className='bg-[#1e1e1e] border-gray-800'>
        <div className='p-6 border-b border-gray-800'>
          <h2 className='text-lg font-semibold text-white'>
            Project availability
          </h2>
          <p className='text-sm text-gray-400 mt-1'>
            Restart or pause your project when performing maintenance.
          </p>
        </div>

        <div className='p-6 space-y-6'>
          {/* Restart Project */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div>
              <h3 className='text-sm font-medium text-white mb-1'>
                Restart project
              </h3>
              <p className='text-sm text-gray-400'>
                Your project will not be available for a few minutes.
              </p>
            </div>
            <div className='md:col-span-2'>
              <Button
                variant='outline'
                className='border-gray-700 hover:bg-gray-800 text-white'
              >
                Restart project
              </Button>
            </div>
          </div>

          {/* Pause Project */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div>
              <h3 className='text-sm font-medium text-white mb-1'>
                Pause project
              </h3>
              <p className='text-sm text-gray-400'>
                Your project will not be accessible while paused.
              </p>
            </div>
            <div className='md:col-span-2'>
              <Button
                variant='outline'
                className='border-gray-700 hover:bg-gray-800 text-white'
              >
                Pause project
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className='bg-[#1e1e1e] border-red-900'>
        <div className='p-6 border-b border-red-900'>
          <div className='flex items-center gap-2'>
            <AlertTriangle className='h-5 w-5 text-red-500' />
            <h2 className='text-lg font-semibold text-white'>Danger Zone</h2>
          </div>
        </div>

        <div className='p-6 space-y-6'>
          {/* Delete Project */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div>
              <h3 className='text-sm font-medium text-white mb-1'>
                Delete project
              </h3>
              <p className='text-sm text-gray-400'>
                Permanently remove this project and all of its data.
              </p>
            </div>
            <div className='md:col-span-2'>
              <Button
                variant='destructive'
                className='bg-red-600 hover:bg-red-700'
              >
                Delete project
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
