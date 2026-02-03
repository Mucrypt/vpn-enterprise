// Service for saving and managing generated apps in the database

import type {
  DatabaseInfo,
  ProvisionDatabaseRequest,
  ProvisionDatabaseResponse,
  GetDatabaseResponse,
} from '../types/database'

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'https://chatbuilds.com/api/v1'

export interface SavedApp {
  id: string
  user_id: string
  tenant_id?: string
  app_name: string
  description: string
  framework: string
  styling?: string
  features: string[]
  dependencies: Record<string, string>
  requires_database: boolean
  status: 'generated' | 'deployed' | 'archived'
  deployment_url?: string
  created_at: string
  updated_at: string
  files?: AppFile[]
}

export interface AppFile {
  id?: string
  app_id?: string
  file_path: string
  content: string
  language: string
  file_size?: number
  is_entry_point?: boolean
}

export interface AppVersion {
  id: string
  app_id: string
  version_number: number
  description?: string
  changes_summary?: string
  snapshot_data?: any
  created_at: string
}

class GeneratedAppsService {
  private getHeaders() {
    // Get token from cookies (set by API after login)
    const cookieToken = this.getCookie('access_token')
    // Check localStorage with both possible keys (access_token from web-dashboard, authToken for compatibility)
    const storageToken =
      localStorage.getItem('access_token') ||
      localStorage.getItem('authToken') ||
      sessionStorage.getItem('authToken')
    const token = cookieToken || storageToken

    // Debug log in development
    if (import.meta.env.DEV && !token) {
      console.warn(
        '[GeneratedAppsService] No auth token found. Cookies:',
        document.cookie,
      )
    }

    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  private getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null
    return null
  }

  private handleAuthError(response: Response) {
    if (response.status === 401 || response.status === 403) {
      // Token expired or invalid - redirect to login
      console.warn(
        '[GeneratedAppsService] Authentication failed, redirecting to login',
      )
      localStorage.removeItem('access_token')
      localStorage.removeItem('authToken')
      sessionStorage.removeItem('authToken')
      // Redirect to main app login (web-dashboard)
      window.location.href =
        'https://chatbuilds.com/login?redirect=' +
        encodeURIComponent(window.location.pathname)
    }
  }

  // List all user's generated apps
  async listApps(): Promise<SavedApp[]> {
    const response = await fetch(`${API_BASE_URL}/generated-apps`, {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include',
    })

    if (!response.ok) {
      this.handleAuthError(response)
      const error = await response
        .json()
        .catch(() => ({ error: 'Failed to list apps' }))
      throw new Error(error.error || error.message || 'Failed to list apps')
    }

    const data = await response.json()
    return data.apps || []
  }

  // Get a specific app with files
  async getApp(appId: string): Promise<SavedApp> {
    const response = await fetch(`${API_BASE_URL}/generated-apps/${appId}`, {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include',
    })

    if (!response.ok) {
      this.handleAuthError(response)
      const error = await response
        .json()
        .catch(() => ({ error: 'Failed to get app' }))
      throw new Error(error.error || error.message || 'Failed to get app')
    }

    const data = await response.json()
    return data.app
  }

  // Save a newly generated app
  async saveApp(appData: {
    app_name: string
    description: string
    framework: string
    styling?: string
    features?: string[]
    dependencies?: Record<string, string>
    requires_database?: boolean
    files: AppFile[]
    tenant_id?: string
  }): Promise<SavedApp> {
    const response = await fetch(`${API_BASE_URL}/generated-apps`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify(appData),
    })

    if (!response.ok) {
      this.handleAuthError(response)
      const error = await response
        .json()
        .catch(() => ({ error: 'Failed to save app' }))
      throw new Error(error.error || error.message || 'Failed to save app')
    }

    const data = await response.json()
    return data.app
  }

  // Update an existing app
  async updateApp(
    appId: string,
    updates: {
      app_name?: string
      description?: string
      status?: 'generated' | 'deployed' | 'archived'
      deployment_url?: string
      files?: AppFile[]
    },
  ): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/generated-apps/${appId}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      this.handleAuthError(response)
      const error = await response
        .json()
        .catch(() => ({ error: 'Failed to update app' }))
      throw new Error(error.error || error.message || 'Failed to update app')
    }
  }

  // Delete an app
  async deleteApp(appId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/generated-apps/${appId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      credentials: 'include',
    })

    if (!response.ok) {
      this.handleAuthError(response)
      const error = await response
        .json()
        .catch(() => ({ error: 'Failed to delete app' }))
      throw new Error(error.error || error.message || 'Failed to delete app')
    }
  }

  // Get app versions/history
  async getVersions(appId: string): Promise<AppVersion[]> {
    const response = await fetch(
      `${API_BASE_URL}/generated-apps/${appId}/versions`,
      {
        method: 'GET',
        headers: this.getHeaders(),
        credentials: 'include',
      },
    )

    if (!response.ok) {
      this.handleAuthError(response)
      const error = await response
        .json()
        .catch(() => ({ error: 'Failed to get versions' }))
      throw new Error(error.error || error.message || 'Failed to get versions')
    }

    const data = await response.json()
    return data.versions || []
  }

  // ==========================================
  // DATABASE PROVISIONING METHODS
  // ==========================================

  /**
   * Provision a database for a generated app
   */
  async provisionDatabase(
    appId: string,
    options: ProvisionDatabaseRequest = {},
  ): Promise<ProvisionDatabaseResponse> {
    const response = await fetch(
      `${API_BASE_URL}/generated-apps/${appId}/database/provision`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        credentials: 'include',
        body: JSON.stringify(options),
      },
    )

    if (!response.ok) {
      this.handleAuthError(response)
      const error = await response
        .json()
        .catch(() => ({ error: 'Failed to provision database' }))
      throw new Error(
        error.error || error.message || 'Failed to provision database',
      )
    }

    return await response.json()
  }

  /**
   * Get database info for an app
   */
  async getDatabaseInfo(appId: string): Promise<GetDatabaseResponse> {
    const response = await fetch(
      `${API_BASE_URL}/generated-apps/${appId}/database`,
      {
        method: 'GET',
        headers: this.getHeaders(),
        credentials: 'include',
      },
    )

    if (!response.ok) {
      this.handleAuthError(response)
      const error = await response
        .json()
        .catch(() => ({ error: 'Failed to get database info' }))
      throw new Error(
        error.error || error.message || 'Failed to get database info',
      )
    }

    return await response.json()
  }

  /**
   * Deprovision database for an app
   */
  async deprovisionDatabase(appId: string): Promise<{ message: string }> {
    const response = await fetch(
      `${API_BASE_URL}/generated-apps/${appId}/database`,
      {
        method: 'DELETE',
        headers: this.getHeaders(),
        credentials: 'include',
      },
    )

    if (!response.ok) {
      this.handleAuthError(response)
      const error = await response
        .json()
        .catch(() => ({ error: 'Failed to deprovision database' }))
      throw new Error(
        error.error || error.message || 'Failed to deprovision database',
      )
    }

    return await response.json()
  }
}

export const generatedAppsService = new GeneratedAppsService()
