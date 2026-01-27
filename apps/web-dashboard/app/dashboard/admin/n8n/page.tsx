'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
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
  const [gateError, setGateError] = useState<string | null>(null)
  const [focusMode, setFocusMode] = useState(false)
  const focusContainerRef = useRef<HTMLDivElement | null>(null)

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
    let cancelled = false

    const setCookie = (name: string, value: string, isHttps: boolean) => {
      const sameSite = isHttps ? 'None' : 'Lax'
      const cookieBits = [
        `${name}=${value}`,
        'path=/',
        `max-age=${60 * 60}`,
        `SameSite=${sameSite}`,
        ...(isHttps ? ['Secure'] : []),
      ]
      document.cookie = cookieBits.join('; ')
    }

    const run = async () => {
      setReady(false)
      setGateError(null)

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

      if (typeof window !== 'undefined' && token) {
        setCookie('access_token', token, isHttps)
      }

      if (typeof window !== 'undefined' && role) {
        setCookie('user_role', role, isHttps)
      }

      // Validate admin authz (prefer Authorization header; fallback to cookie).
      const checkAuthz = async (bearer: string | null) => {
        const headers: Record<string, string> = {}
        if (bearer) headers.Authorization = `Bearer ${bearer}`
        const resp = await fetch('/api/v1/admin/authz', {
          method: 'GET',
          credentials: 'include',
          headers,
        })
        return resp.status
      }

      try {
        let status = await checkAuthz(token)
        if (status === 204) {
          if (!cancelled) {
            setReady(true)
            setIframeKey((k) => k + 1)
          }
          return
        }

        // If unauthorized, attempt a refresh using the httpOnly refresh_token cookie.
        if (status === 401) {
          const refreshResp = await fetch('/api/v1/auth/refresh', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          })

          if (refreshResp.ok) {
            const data = await refreshResp.json().catch(() => ({}))
            const refreshedToken =
              data?.session?.access_token || data?.access_token || null
            if (refreshedToken && typeof window !== 'undefined') {
              try {
                localStorage.setItem('access_token', String(refreshedToken))
              } catch {}
              setCookie('access_token', String(refreshedToken), isHttps)
            }

            status = await checkAuthz(refreshedToken)
            if (status === 204) {
              if (!cancelled) {
                setReady(true)
                setIframeKey((k) => k + 1)
              }
              return
            }
          }
        }

        if (!cancelled) {
          if (status === 403) {
            setGateError('Admin access required to open n8n.')
          } else if (status === 401) {
            setGateError('Session not authorized. Please log in again.')
          } else {
            setGateError(`Unable to validate session (status ${status}).`)
          }
          setReady(false)
        }
      } catch {
        if (!cancelled) {
          setGateError('Unable to reach auth service. Please retry.')
          setReady(false)
        }
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [accessToken, user?.role])

  useEffect(() => {
    if (!focusMode) return

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFocusMode(false)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [focusMode])

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
                {gateError ? gateError : 'Preparing secure session…'}
              </div>
            )}
          </div>

          <div className='mt-3 flex items-center gap-3 text-sm'>
            <button
              type='button'
              className='underline'
              onClick={() => setFocusMode(true)}
              disabled={!ready}
              aria-disabled={!ready}
              title={ready ? 'Open n8n in focus mode' : 'Wait for n8n to load'}
            >
              Full screen
            </button>
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

      {focusMode ? (
        <div
          className='fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm'
          role='dialog'
          aria-modal='true'
          aria-label='n8n full screen'
          onClick={() => setFocusMode(false)}
        >
          <div
            ref={focusContainerRef}
            className='absolute inset-3 md:inset-6 rounded-xl bg-white shadow-2xl overflow-hidden flex flex-col'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='flex items-center justify-between gap-3 border-b px-4 py-3'>
              <div className='min-w-0'>
                <div className='text-sm font-medium text-gray-900 truncate'>
                  n8n — Full screen
                </div>
                <div className='text-xs text-gray-500 truncate'>
                  Press Esc to exit.
                </div>
              </div>

              <div className='flex items-center gap-2'>
                <button
                  type='button'
                  className='rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50'
                  onClick={() => {
                    const el = focusContainerRef.current
                    const maybe = el as (HTMLDivElement & {
                      requestFullscreen?: () => Promise<void>
                    }) | null
                    maybe?.requestFullscreen?.()
                  }}
                >
                  Browser fullscreen
                </button>
                <button
                  type='button'
                  className='rounded-md bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-gray-800'
                  onClick={() => setFocusMode(false)}
                >
                  Exit
                </button>
              </div>
            </div>

            <div className='flex-1 bg-white'>
              {ready ? (
                <iframe
                  key={`focus-${iframeKey}`}
                  title='n8n (full screen)'
                  src={iframeSrc}
                  className='h-full w-full'
                />
              ) : (
                <div className='p-6 text-sm text-gray-700'>
                  {gateError ? gateError : 'Preparing secure session…'}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
