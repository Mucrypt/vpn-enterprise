import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { authService } from '@/services/authService'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
}

export function ProtectedRoute({
  children,
  requireAuth = true,
}: ProtectedRouteProps) {
  const location = useLocation()
  const [isChecking, setIsChecking] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      // Try to sync auth from dashboard first
      await authService.syncAuthFromDashboard()

      const authenticated = authService.isAuthenticated()
      setIsAuthenticated(authenticated)
      setIsChecking(false)
    }

    checkAuth()

    // Listen for auth changes from dashboard
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'vpn-enterprise-auth-storage' || e.key === 'nexusai_auth') {
        console.log('[ProtectedRoute] Auth state changed, rechecking...')
        checkAuth()
      }
    }

    window.addEventListener('storage', handleStorageChange)

    // Also periodically recheck auth state
    const interval = setInterval(() => {
      const authenticated = authService.isAuthenticated()
      setIsAuthenticated(authenticated)
    }, 5000) // Check every 5 seconds

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [location.pathname])

  if (isChecking) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5'>
        <div className='text-center'>
          <Loader2 className='w-8 h-8 animate-spin text-primary mx-auto mb-4' />
          <p className='text-muted-foreground'>Loading...</p>
        </div>
      </div>
    )
  }

  if (requireAuth && !isAuthenticated) {
    // Save the attempted URL in sessionStorage for return after login
    const currentPath = `${window.location.pathname}${window.location.search}`
    sessionStorage.setItem('nexusai_return_path', currentPath)

    // Build the full return URL for the main dashboard
    const returnUrl = encodeURIComponent(
      `${window.location.origin}${currentPath}`,
    )

    // Redirect to main dashboard login with return URL
    window.location.href = `https://chatbuilds.com/auth/login?redirect=${returnUrl}`
    return null
  }

  return <>{children}</>
}
