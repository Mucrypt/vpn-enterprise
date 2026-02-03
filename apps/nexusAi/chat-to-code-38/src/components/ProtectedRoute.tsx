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
  }, [])

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
    // Save the attempted URL to redirect back after login
    const returnUrl = encodeURIComponent(window.location.href)
    window.location.href = `https://chatbuilds.com/auth/login?redirect=${returnUrl}`
    return null
  }

  return <>{children}</>
}
