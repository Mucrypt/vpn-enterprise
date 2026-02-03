'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/store'
import { useRouter } from 'next/navigation'

/**
 * TokenExpirationMonitor
 *
 * Monitors the auth token expiration and automatically logs out the user
 * when the token expires. Should be added to the root layout.
 */
export function TokenExpirationMonitor() {
  const { isAuthenticated, lastSuccessfulAuth, clearAuth } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) return

    // Check token expiration every minute
    const TOKEN_EXPIRY = 60 * 60 * 1000 // 1 hour
    const CHECK_INTERVAL = 60 * 1000 // 1 minute

    const checkExpiration = () => {
      if (lastSuccessfulAuth) {
        const elapsed = Date.now() - lastSuccessfulAuth

        if (elapsed > TOKEN_EXPIRY) {
          console.log('[TokenMonitor] Token expired, logging out')
          clearAuth()
          router.push('/auth/login?expired=true')
        }
      }
    }

    // Check immediately
    checkExpiration()

    // Set up interval
    const interval = setInterval(checkExpiration, CHECK_INTERVAL)

    return () => clearInterval(interval)
  }, [isAuthenticated, lastSuccessfulAuth, clearAuth, router])

  return null
}
