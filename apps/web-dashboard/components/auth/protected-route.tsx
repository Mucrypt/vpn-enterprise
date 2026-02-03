'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { Loader2 } from 'lucide-react'

function normalizeRole(role?: string) {
  return (role || '').toLowerCase().replace(/[\s_-]/g, '')
}

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string | string[]
}

export default function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const {
    isAuthenticated,
    user,
    isLoading,
    hasHydrated,
    lastSuccessfulAuth,
    clearAuth,
  } = useAuthStore()
  const router = useRouter()
  const isDev = process.env.NODE_ENV === 'development'

  useEffect(() => {
    if (isDev) return

    // Wait until store has hydrated before making any auth-based redirects
    if (!hasHydrated) return

    // Check token expiration (1 hour = 3600000ms)
    const TOKEN_EXPIRY = 60 * 60 * 1000 // 1 hour
    if (isAuthenticated && lastSuccessfulAuth) {
      const elapsed = Date.now() - lastSuccessfulAuth
      if (elapsed > TOKEN_EXPIRY) {
        console.log('[ProtectedRoute] Token expired, redirecting to login')
        clearAuth()
        router.push('/auth/login?expired=true')
        return
      }
    }

    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login')
      return
    }

    if (!isLoading && isAuthenticated && requiredRole) {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
      const userRole = normalizeRole(user?.role)
      const hasRequiredRole = roles.some(
        (role) => normalizeRole(role) === userRole,
      )

      if (!hasRequiredRole) {
        router.push('/dashboard')
        return
      }
    }
  }, [
    isAuthenticated,
    isLoading,
    user,
    requiredRole,
    router,
    hasHydrated,
    isDev,
  ])

  if (isDev) {
    return <>{children}</>
  }

  // Only gate on hydration; avoid being stuck on global isLoading for unrelated fetches
  if (!hasHydrated) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <Loader2 className='h-8 w-8 animate-spin mx-auto mb-4 text-gray-400' />
          <p className='text-gray-600'>Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <p className='text-gray-600'>Redirecting to login...</p>
        </div>
      </div>
    )
  }

  if (requiredRole && user) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    const userRole = normalizeRole(user.role)
    const hasRequiredRole = roles.some(
      (role) => normalizeRole(role) === userRole,
    )

    if (!hasRequiredRole) {
      return (
        <div className='flex items-center justify-center min-h-screen'>
          <div className='text-center'>
            <p className='text-gray-600'>Access denied. Redirecting...</p>
          </div>
        </div>
      )
    }
  }

  return <>{children}</>
}
