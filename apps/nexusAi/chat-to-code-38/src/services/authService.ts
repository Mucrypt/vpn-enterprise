/**
 * Authentication Service for NexusAI
 * Integrates with VPN Enterprise Dashboard authentication
 */

export interface User {
  id: string
  email: string
  name?: string
  role: string
  subscription: {
    plan: 'free' | 'pro' | 'enterprise'
    credits: number
    database_quota: number // GB
  }
}

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
}

class AuthService {
  private readonly STORAGE_KEY = 'nexusai_auth'
  private readonly API_BASE = '/api/v1'
  private syncInterval: NodeJS.Timeout | null = null
  private authCheckInterval: NodeJS.Timeout | null = null

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const auth = this.getAuthState()
    // Check if we have a user and token (Supabase handles expiry via cookies)
    return auth.isAuthenticated && !!auth.user && !!auth.token
  }

  /**
   * Get current auth state from localStorage
   */
  getAuthState(): AuthState {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) {
        return { isAuthenticated: false, user: null, token: null }
      }
      return JSON.parse(stored)
    } catch {
      return { isAuthenticated: false, user: null, token: null }
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.getAuthState().user
  }

  /**
   * Get auth token
   */
  getToken(): string | null {
    return this.getAuthState().token
  }

  /**
   * Set auth state
   */
  setAuthState(state: AuthState): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state))
  }

  /**
   * Clear auth state (logout)
   */
  logout(): void {
    // Clear nexusAi auth
    localStorage.removeItem(this.STORAGE_KEY)

    // Clear dashboard auth storage to trigger logout there too
    try {
      localStorage.removeItem('vpn-enterprise-auth-storage')
      localStorage.removeItem('access_token')

      // Broadcast logout event to dashboard
      localStorage.setItem('nexusai_logout_event', Date.now().toString())
      localStorage.removeItem('nexusai_logout_event')
    } catch (error) {
      console.warn('Failed to clear dashboard auth:', error)
    }

    // Redirect to dashboard login
    window.location.href = 'https://chatbuilds.com/auth/login?redirect=nexusai'
  }

  /**
   * Redirect to dashboard login
   */
  redirectToLogin(): void {
    const currentUrl = encodeURIComponent(window.location.href)
    window.location.href = `https://chatbuilds.com/auth/login?redirect=${currentUrl}`
  }

  /**
   * Start automatic auth sync and logout detection
   */
  startAuthSync(): void {
    // Initial sync
    this.syncAuthFromDashboard()

    // Listen for storage changes (login/logout events)
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageChange)
    }

    // Periodic auth check every 30 seconds (gentle polling)
    // This ensures nexusAI detects when user logs in from dashboard
    this.authCheckInterval = setInterval(() => {
      const currentAuth = this.getAuthState()
      // Only sync if not already authenticated to avoid unnecessary API calls
      if (!currentAuth.isAuthenticated || !currentAuth.user) {
        this.syncAuthFromDashboard()
      }
    }, 30000) // 30 seconds
  }

  /**
   * Stop automatic auth sync
   */
  stopAuthSync(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', this.handleStorageChange)
    }

    // Clear auth check interval
    if (this.authCheckInterval) {
      clearInterval(this.authCheckInterval)
      this.authCheckInterval = null
    }
  }

  /**
   * Handle storage changes (detect login/logout from dashboard)
   */
  private handleStorageChange = (e: StorageEvent) => {
    // Detect if main dashboard cleared auth (logout)
    if (e.key === 'vpn-enterprise-auth-storage' && !e.newValue) {
      console.log('[NexusAI Auth] Logout detected from dashboard')
      this.logout()
    }

    // Detect if main dashboard added auth (login)
    if (e.key === 'vpn-enterprise-auth-storage' && e.newValue) {
      console.log('[NexusAI Auth] Login detected from dashboard')
      this.syncAuthFromDashboard()
    }

    // Detect explicit logout event
    if (e.key === 'logout_event') {
      console.log('[NexusAI Auth] Logout event detected from dashboard')
      this.logout()
    }
  }

  /**
   * Sync auth from dashboard (via postMessage or shared localStorage)
   */
  async syncAuthFromDashboard(): Promise<void> {
    try {
      // Try to get auth from main dashboard domain
      const response = await fetch('https://chatbuilds.com/api/v1/auth/me', {
        credentials: 'include', // Send cookies
      })

      if (response.ok) {
        const data = await response.json()
        this.setAuthState({
          isAuthenticated: true,
          user: {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            role: data.user.role,
            subscription: data.user.subscription || {
              plan: 'free',
              credits: 100,
              database_quota: 1,
            },
          },
          token: data.token,
        })
      } else if (response.status === 401 || response.status === 403) {
        // User is logged out from dashboard, clear local auth only
        console.log('[NexusAI Auth] User logged out from dashboard')
        localStorage.removeItem(this.STORAGE_KEY)
        // Don't auto-redirect, let ProtectedRoute handle it
      }
    } catch (error) {
      // Network errors are ok, don't clear auth
      console.warn('Failed to sync auth from dashboard:', error)
    }
  }

  /**
   * Check if user has enough credits for AI generation
   */
  hasCredits(required: number = 1): boolean {
    const user = this.getCurrentUser()
    if (!user) return false
    return user.subscription.credits >= required
  }

  /**
   * Check if user can provision database
   */
  canProvisionDatabase(): boolean {
    const user = this.getCurrentUser()
    if (!user) return false

    // Pro and Enterprise can provision unlimited databases
    if (user.subscription.plan !== 'free') return true

    // Free tier: check quota (handled on backend, but give UI hint)
    return true
  }

  /**
   * Get subscription display info
   */
  getSubscriptionInfo() {
    const user = this.getCurrentUser()
    if (!user) return null

    return {
      plan: user.subscription.plan,
      planName:
        user.subscription.plan.charAt(0).toUpperCase() +
        user.subscription.plan.slice(1),
      credits: user.subscription.credits,
      databaseQuota: user.subscription.database_quota,
      canUpgrade: user.subscription.plan === 'free',
    }
  }
}

export const authService = new AuthService()
