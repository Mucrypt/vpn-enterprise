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

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const auth = this.getAuthState()
    if (!auth.token) return false

    // Check if token is expired (1 hour TTL)
    try {
      const payload = JSON.parse(atob(auth.token.split('.')[1]))
      const exp = payload.exp * 1000
      return Date.now() < exp
    } catch {
      return false
    }
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
    localStorage.removeItem(this.STORAGE_KEY)
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
      }
    } catch (error) {
      console.error('Failed to sync auth from dashboard:', error)
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
