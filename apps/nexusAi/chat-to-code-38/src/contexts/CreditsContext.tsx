import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'
import { authService, type User } from '@/services/authService'

interface CreditsContextType {
  credits: number
  user: User | null
  refreshCredits: () => Promise<void>
  deductCredits: (amount: number) => void
  loading: boolean
}

const CreditsContext = createContext<CreditsContextType | undefined>(undefined)

export const CreditsProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(authService.getCurrentUser())
  const [loading, setLoading] = useState(false)

  const credits = user?.subscription?.credits || 0

  const refreshCredits = async () => {
    setLoading(true)
    try {
      await authService.syncAuthFromDashboard()
      setUser(authService.getCurrentUser())
    } catch (error) {
      console.error('Failed to refresh credits:', error)
    } finally {
      setLoading(false)
    }
  }

  const deductCredits = (amount: number) => {
    // Optimistically update UI
    if (user && user.subscription) {
      const updatedUser = {
        ...user,
        subscription: {
          ...user.subscription,
          credits: Math.max(0, user.subscription.credits - amount),
        },
      }
      setUser(updatedUser)

      // Update localStorage immediately
      const authState = authService.getAuthState()
      authService.setAuthState({
        ...authState,
        user: updatedUser,
      })

      // Refresh from server to get accurate count
      setTimeout(() => refreshCredits(), 1000)
    }
  }

  // Start auth sync and automatic logout detection on mount
  useEffect(() => {
    authService.startAuthSync()

    // Initial refresh
    refreshCredits()

    // Listen for auth changes from dashboard
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'vpn-enterprise-auth-storage' || e.key === 'nexusai_auth') {
        console.log('[CreditsContext] Auth state changed, refreshing user...')
        // Update user state immediately
        setUser(authService.getCurrentUser())
        // Then refresh from server
        refreshCredits()
      }
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      authService.stopAuthSync()
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  // Auto-refresh credits every 60 seconds (reduced from 30) if authenticated
  useEffect(() => {
    if (!authService.isAuthenticated()) return

    const interval = setInterval(() => {
      refreshCredits()
    }, 60000) // 60 seconds instead of 30

    return () => clearInterval(interval)
  }, [])

  return (
    <CreditsContext.Provider
      value={{
        credits,
        user,
        refreshCredits,
        deductCredits,
        loading,
      }}
    >
      {children}
    </CreditsContext.Provider>
  )
}

export const useCredits = () => {
  const context = useContext(CreditsContext)
  if (context === undefined) {
    throw new Error('useCredits must be used within a CreditsProvider')
  }
  return context
}
