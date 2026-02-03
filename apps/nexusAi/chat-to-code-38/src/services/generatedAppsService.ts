// Service for saving and managing generated apps in the database

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
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
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
      const error = await response.json().catch(() => ({ error: 'Failed to list apps' }))
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
      const error = await response.json().catch(() => ({ error: 'Failed to get app' }))
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
      const error = await response.json().catch(() => ({ error: 'Failed to save app' }))
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
      const error = await response.json().catch(() => ({ error: 'Failed to update app' }))
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
      const error = await response.json().catch(() => ({ error: 'Failed to delete app' }))
      throw new Error(error.error || error.message || 'Failed to delete app')
    }
  }

  // Get app versions/history
  async getVersions(appId: string): Promise<AppVersion[]> {
    const response = await fetch(`${API_BASE_URL}/generated-apps/${appId}/versions`, {
      method: 'GET',
      headers: this.getHeaders(),
      credentials: 'include',
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to get versions' }))
      throw new Error(error.error || error.message || 'Failed to get versions')
    }

    const data = await response.json()
    return data.versions || []
  }
}

export const generatedAppsService = new GeneratedAppsService()
