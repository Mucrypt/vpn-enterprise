'use client'

import { useMemo } from 'react'
import { useAuthStore } from '@/lib/store'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'

export default function AdminN8nPage() {
  const { user } = useAuthStore()

  const iframeSrc = process.env.NEXT_PUBLIC_N8N_UI_URL?.trim() || '/admin/n8n/'

  const isAdmin = useMemo(() => {
    const roleKey = (user?.role || '').toLowerCase().replace(/[\s_-]/g, '')
    return (
      roleKey === 'superadmin' ||
      roleKey === 'admin' ||
      roleKey === 'administrator'
    )
  }, [user?.role])

  if (!isAdmin) {
    return (
      <div className='space-y-4'>
        <h1 className='text-2xl font-semibold text-gray-900'>Automation</h1>
        <Card>
          <CardHeader>
            <CardTitle>Access denied</CardTitle>
            <CardDescription>Admin privileges required.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-sm text-gray-700'>
              You don’t have permission to view the automation console.
            </p>
            <p className='text-sm text-gray-700 mt-2'>
              Go back to the{' '}
              <Link className='underline' href='/dashboard'>
                dashboard
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      <div>
        <h1 className='text-2xl font-semibold text-gray-900'>
          Automation (n8n)
        </h1>
        <p className='text-sm text-gray-600 mt-1'>
          Admin-only workflows that power NexusAI + Ollama automation.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>n8n Console</CardTitle>
          <CardDescription>
            Embedded n8n UI (served from{' '}
            <span className='font-mono'>{iframeSrc}</span>).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='w-full overflow-hidden rounded-lg border bg-white'>
            <iframe
              title='n8n'
              src={iframeSrc}
              className='w-full'
              style={{ height: '75vh' }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
