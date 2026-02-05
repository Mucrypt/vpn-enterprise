/**
 * Preview Proxy Service
 * Proxies HTTP requests to running dev servers in containers
 * Supports hot reload and WebSocket connections for HMR
 */

import { Response, NextFunction } from 'express'
import { AuthRequest } from '@vpn-enterprise/auth'
import httpProxy from 'http-proxy'
import { containerManager } from './ContainerManager'

interface PreviewSession {
  workspaceId: string
  port: number
  lastAccess: Date
  accessCount: number
}

export class PreviewProxyService {
  private proxy: httpProxy
  private sessions: Map<string, PreviewSession> = new Map()
  private readonly SESSION_TIMEOUT = 60 * 60 * 1000 // 1 hour

  constructor() {
    this.proxy = httpProxy.createProxyServer({
      ws: true, // Enable WebSocket proxying for HMR
      changeOrigin: true,
      followRedirects: true,
      timeout: 30000,
    })

    // Handle proxy errors
    this.proxy.on('error', (err, req, res) => {
      console.error('[PreviewProxy] Proxy error:', err.message)
      
      if (res && 'headersSent' in res && !res.headersSent) {
        const response = res as Response
        response.status(502).json({
          error: 'Preview server not responding',
          message: 'Make sure your dev server is running (npm run dev)',
        })
      }
    })

    // Cleanup inactive sessions
    setInterval(() => this.cleanupInactiveSessions(), 300000) // Every 5 minutes

    console.log('[PreviewProxy] Service initialized')
  }

  /**
   * Handle preview request
   */
  async handleRequest(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    const workspaceId = req.params.workspaceId
    const userId = req.user?.id

    if (!workspaceId) {
      res.status(400).json({ error: 'Workspace ID required' })
      return
    }

    if (!userId) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    try {
      // Get container info
      const container = containerManager.getContainer(workspaceId)
      
      if (!container) {
        res.status(404).json({
          error: 'Preview not available',
          message: 'Workspace not found. Start a terminal session first.'
        })
        return
      }

      // Verify user owns this workspace
      if (container.userId !== userId) {
        res.status(403).json({ error: 'Access denied' })
        return
      }

      // Get or create preview session
      let session = this.sessions.get(workspaceId)
      if (!session) {
        const previewPort = container.ports.find(p => p.internal === 3000)
        
        if (!previewPort) {
          res.status(500).json({ error: 'Preview port not configured' })
          return
        }

        session = {
          workspaceId,
          port: previewPort.external,
          lastAccess: new Date(),
          accessCount: 0
        }

        this.sessions.set(workspaceId, session)
      }

      // Update session
      session.lastAccess = new Date()
      session.accessCount++

      // Proxy the request
      const target = `http://localhost:${session.port}`
      
      // Remove /preview/:workspaceId prefix from path
      const originalUrl = req.url
      req.url = req.url.replace(`/preview/${workspaceId}`, '') || '/'

      console.log(`[PreviewProxy] Proxying ${originalUrl} -> ${target}${req.url}`)

      this.proxy.web(req, res, {
        target,
        headers: {
          'X-Forwarded-For': req.ip || req.socket.remoteAddress || '',
          'X-Forwarded-Proto': req.secure ? 'https' : 'http',
          'X-Forwarded-Host': req.hostname,
        }
      })
    } catch (error: any) {
      console.error('[PreviewProxy] Error handling request:', error)
      res.status(500).json({
        error: 'Preview error',
        message: error.message
      })
    }
  }

  /**
   * Handle WebSocket upgrade for HMR
   */
  async handleUpgrade(req: any, socket: any, head: any): Promise<void> {
    const urlParts = req.url.split('/')
    const workspaceIndex = urlParts.findIndex((part: string) => part === 'preview')
    
    if (workspaceIndex === -1 || !urlParts[workspaceIndex + 1]) {
      socket.destroy()
      return
    }

    const workspaceId = urlParts[workspaceIndex + 1]
    const session = this.sessions.get(workspaceId)

    if (!session) {
      console.warn(`[PreviewProxy] WebSocket upgrade failed: No session for ${workspaceId}`)
      socket.destroy()
      return
    }

    const target = `http://localhost:${session.port}`
    
    console.log(`[PreviewProxy] WebSocket upgrade for ${workspaceId} -> ${target}`)

    this.proxy.ws(req, socket, head, { target })
  }

  /**
   * Get preview URL for a workspace
   */
  getPreviewUrl(workspaceId: string, baseUrl: string): string | null {
    const session = this.sessions.get(workspaceId)
    if (!session) return null

    return `${baseUrl}/api/v1/terminal/preview/${workspaceId}`
  }

  /**
   * Get preview session info
   */
  getSession(workspaceId: string): PreviewSession | undefined {
    return this.sessions.get(workspaceId)
  }

  /**
   * Close preview session
   */
  closeSession(workspaceId: string): void {
    this.sessions.delete(workspaceId)
    console.log(`[PreviewProxy] Session closed: ${workspaceId}`)
  }

  /**
   * Cleanup inactive sessions
   */
  private cleanupInactiveSessions(): void {
    const now = new Date().getTime()

    for (const [workspaceId, session] of this.sessions.entries()) {
      const inactiveTime = now - session.lastAccess.getTime()
      
      if (inactiveTime > this.SESSION_TIMEOUT) {
        console.log(`[PreviewProxy] Cleaning up inactive session: ${workspaceId}`)
        this.sessions.delete(workspaceId)
      }
    }
  }

  /**
   * Get statistics
   */
  getStats(): { totalSessions: number; sessions: PreviewSession[] } {
    return {
      totalSessions: this.sessions.size,
      sessions: Array.from(this.sessions.values())
    }
  }
}

// Singleton instance
export const previewProxyService = new PreviewProxyService()
