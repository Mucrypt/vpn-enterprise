'use client'

import { useEffect, useMemo, useState } from 'react'
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
  const { user, accessToken } = useAuthStore()
  const [iframeKey, setIframeKey] = useState(0)
  const [ready, setReady] = useState(false)

  const iframeSrc = process.env.NEXT_PUBLIC_N8N_UI_URL?.trim() || '/admin/n8n/'

  const isAdmin = useMemo(() => {
    const roleKey = (user?.role || '').toLowerCase().replace(/[\s_-]/g, '')
    return (
      roleKey === 'superadmin' ||
      roleKey === 'admin' ||
      roleKey === 'administrator'
    )
  }, [user?.role])

  useEffect(() => {
    // nginx protects /admin/n8n/* via auth_request which relies on cookies.
    // Ensure the access_token cookie exists BEFORE the iframe loads.
    try {
      const token =
        accessToken ||
        (typeof window !== 'undefined'
          ? localStorage.getItem('access_token')
          : null)
      const role =
        user?.role ||
        (typeof window !== 'undefined'
          ? localStorage.getItem('user_role')
          : null)

      const isHttps =
        typeof window !== 'undefined' && window.location.protocol === 'https:'
      const sameSite = isHttps ? 'None' : 'Lax'

      if (typeof window !== 'undefined' && token) {
        const cookieBits = [
          `access_token=${token}`,
          'path=/',
          `max-age=${60 * 60}`,
          `SameSite=${sameSite}`,
          ...(isHttps ? ['Secure'] : []),
        ]
        document.cookie = cookieBits.join('; ')
      }

      if (typeof window !== 'undefined' && role) {
        const roleBits = [
          `user_role=${role}`,
          'path=/',
          `max-age=${60 * 60}`,
          `SameSite=${isHttps ? 'None' : 'Lax'}`,
          ...(isHttps ? ['Secure'] : []),
        ]
        document.cookie = roleBits.join('; ')
      }
    } catch {
      // Best-effort; if cookie writes fail, iframe will likely 401.
    } finally {
      setReady(true)
    }
  }, [accessToken, user?.role])

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
            {ready ? (
              <iframe
                key={iframeKey}
                title='n8n'
                src={iframeSrc}
                className='w-full'
                style={{ height: '75vh' }}
              />
            ) : (
              <div className='p-6 text-sm text-gray-700'>
                Preparing secure session…
              </div>
            )}
          </div>

          <div className='mt-3 flex items-center gap-3 text-sm'>
            <button
              type='button'
              className='underline'
              onClick={() => setIframeKey((k) => k + 1)}
            >
              Reload console
            </button>
            <span className='text-gray-500'>
              If you see a 401/blank frame, reload after login.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
