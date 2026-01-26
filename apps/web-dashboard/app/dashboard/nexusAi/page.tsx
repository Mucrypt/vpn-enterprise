'use client'

import { useEffect, useMemo } from 'react'

function resolveNexusAiUrl(): string {
  const configured = (process.env.NEXT_PUBLIC_NEXUSAI_URL || '').trim()
  if (configured) return configured

  // Default to same-domain path routing
  return `${window.location.origin}/nexusai/`
}

export default function NexusAiPage() {
  const targetUrl = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return resolveNexusAiUrl()
  }, [])

  useEffect(() => {
    if (!targetUrl) return
    window.location.assign(targetUrl)
  }, [targetUrl])

  return (
    <div className='p-6'>
      <h1 className='text-2xl font-semibold text-gray-900'>Nexus AI</h1>

      {targetUrl ? (
        <p className='mt-2 text-sm text-gray-600'>
          Redirecting to{' '}
          <a className='text-blue-600 hover:underline' href={targetUrl}>
            {targetUrl}
          </a>
          …
        </p>
      ) : (
        <>
          <p className='mt-2 text-sm text-gray-600'>
            Nexus AI is exposed via the{' '}
            <code className='px-1 py-0.5 bg-gray-100 rounded'>/nexusai</code>{' '}
            path in production.
          </p>
          <p className='mt-2 text-sm text-gray-600'>
            Set{' '}
            <code className='px-1 py-0.5 bg-gray-100 rounded'>
              NEXT_PUBLIC_NEXUSAI_URL
            </code>{' '}
            (optional override, e.g.{' '}
            <code className='px-1 py-0.5 bg-gray-100 rounded'>
              https://chatbuilds.com/nexusai/
            </code>
            ) to configure this link for your environment.
          </p>
        </>
      )}
    </div>
  )
}
