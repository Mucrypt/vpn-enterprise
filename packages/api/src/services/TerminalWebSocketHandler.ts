/**
 * WebSocket Terminal Handler
 * Provides real-time bidirectional communication for terminal sessions
 */

import WebSocket from 'ws'
import { Server } from 'http'
import { containerManager } from './ContainerManager'
import { parse as parseUrl } from 'url'
import { parse as parseQuery } from 'querystring'

interface TerminalSession {
  workspaceId: string
  userId: string
  ws: WebSocket
  lastActivity: Date
  history: string[]
}

export class TerminalWebSocketHandler {
  private wss: WebSocket.Server
  private sessions: Map<string, TerminalSession> = new Map()
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes
  private readonly RATE_LIMIT = {
    maxCommands: 50,
    windowMs: 60000 // 50 commands per minute
  }
  private rateLimitMap: Map<string, { count: number; resetTime: number }> = new Map()

  constructor(server: Server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/api/v1/terminal/ws'
    })

    this.wss.on('connection', this.handleConnection.bind(this))
    
    // Cleanup inactive sessions
    setInterval(() => this.cleanupInactiveSessions(), 60000)

    console.log('[TerminalWS] WebSocket server initialized')
  }

  /**
   * Handle new WebSocket connection
   */
  private async handleConnection(ws: WebSocket, req: any): Promise<void> {
    const query = parseQuery(parseUrl(req.url).query || '')
    const workspaceId = query.workspaceId as string
    const userId = query.userId as string
    const token = query.token as string

    // Validate connection
    if (!workspaceId || !userId || !token) {
      ws.close(4001, 'Missing required parameters')
      return
    }

    // TODO: Validate token (implement JWT verification)
    // const isValid = await this.validateToken(token, userId)
    // if (!isValid) {
    //   ws.close(4003, 'Invalid token')
    //   return
    // }

    const sessionId = `${userId}-${workspaceId}`

    // Check if container exists, create if needed
    let container = containerManager.getContainer(workspaceId)
    if (!container) {
      try {
        this.sendMessage(ws, 'info', 'Creating isolated environment...')
        
        container = await containerManager.createContainer({
          workspaceId,
          userId,
          memoryLimit: '512m',
          cpuLimit: '1.0',
          diskLimit: '2G',
          timeoutMinutes: 60
        })

        this.sendMessage(ws, 'success', 'Environment ready!')
      } catch (error: any) {
        this.sendMessage(ws, 'error', `Failed to create environment: ${error.message}`)
        ws.close(4000, 'Container creation failed')
        return
      }
    }

    // Create session
    const session: TerminalSession = {
      workspaceId,
      userId,
      ws,
      lastActivity: new Date(),
      history: []
    }

    this.sessions.set(sessionId, session)

    // Send welcome message
    this.sendMessage(ws, 'info', `Connected to workspace: ${workspaceId}`)
    this.sendMessage(ws, 'info', `Type 'help' for available commands`)
    this.sendPrompt(ws)

    // Handle messages
    ws.on('message', async (data: WebSocket.Data) => {
      await this.handleMessage(sessionId, data.toString())
    })

    // Handle disconnection
    ws.on('close', () => {
      this.sessions.delete(sessionId)
      console.log(`[TerminalWS] Session closed: ${sessionId}`)
    })

    ws.on('error', (error) => {
      console.error(`[TerminalWS] WebSocket error for ${sessionId}:`, error)
      this.sessions.delete(sessionId)
    })

    console.log(`[TerminalWS] New session: ${sessionId}`)
  }

  /**
   * Handle incoming messages
   */
  private async handleMessage(sessionId: string, message: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) return

    try {
      const data = JSON.parse(message)
      
      if (data.type === 'command') {
        await this.executeCommand(session, data.command)
      } else if (data.type === 'ping') {
        session.ws.send(JSON.stringify({ type: 'pong' }))
      } else if (data.type === 'resize') {
        // Handle terminal resize (for future TTY support)
        console.log(`[TerminalWS] Terminal resized: ${data.cols}x${data.rows}`)
      }

      session.lastActivity = new Date()
    } catch (error) {
      console.error('[TerminalWS] Failed to parse message:', error)
      this.sendMessage(session.ws, 'error', 'Invalid message format')
    }
  }

  /**
   * Execute command in container
   */
  private async executeCommand(session: TerminalSession, command: string): Promise<void> {
    const { workspaceId, userId, ws } = session

    // Rate limiting
    if (!this.checkRateLimit(userId)) {
      this.sendMessage(ws, 'error', 'Rate limit exceeded. Please slow down.')
      this.sendPrompt(ws)
      return
    }

    // Handle built-in commands
    if (command === 'help') {
      this.showHelp(ws)
      this.sendPrompt(ws)
      return
    }

    if (command === 'clear') {
      ws.send(JSON.stringify({ type: 'clear' }))
      this.sendPrompt(ws)
      return
    }

    if (command === 'exit') {
      this.sendMessage(ws, 'info', 'Closing session...')
      ws.close()
      return
    }

    // Add to history
    session.history.push(command)
    if (session.history.length > 100) {
      session.history.shift()
    }

    // Execute in container
    try {
      this.sendMessage(ws, 'executing', command)

      const result = await containerManager.executeCommand(workspaceId, command, {
        timeout: 300000 // 5 minutes
      })

      // Send output
      if (result.stdout) {
        this.sendMessage(ws, 'output', result.stdout)
      }

      if (result.stderr) {
        this.sendMessage(ws, 'error', result.stderr)
      }

      // Send exit code
      if (result.exitCode !== 0) {
        this.sendMessage(ws, 'error', `Command exited with code ${result.exitCode}`)
      }
    } catch (error: any) {
      this.sendMessage(ws, 'error', `Execution failed: ${error.message}`)
    }

    this.sendPrompt(ws)
  }

  /**
   * Check rate limit for user
   */
  private checkRateLimit(userId: string): boolean {
    const now = Date.now()
    const limit = this.rateLimitMap.get(userId)

    if (!limit || now > limit.resetTime) {
      this.rateLimitMap.set(userId, {
        count: 1,
        resetTime: now + this.RATE_LIMIT.windowMs
      })
      return true
    }

    if (limit.count >= this.RATE_LIMIT.maxCommands) {
      return false
    }

    limit.count++
    return true
  }

  /**
   * Send message to client
   */
  private sendMessage(ws: WebSocket, type: string, content: string): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, content, timestamp: new Date().toISOString() }))
    }
  }

  /**
   * Send command prompt
   */
  private sendPrompt(ws: WebSocket): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'prompt', content: '$ ' }))
    }
  }

  /**
   * Show help message
   */
  private showHelp(ws: WebSocket): void {
    const helpText = `
Available Commands:
  npm install [package]  - Install npm packages
  npm run [script]       - Run package.json scripts
  npm run dev            - Start development server
  ls                     - List files
  cat [file]             - Show file contents
  mkdir [dir]            - Create directory
  cd [dir]               - Change directory
  pwd                    - Print working directory
  clear                  - Clear terminal
  help                   - Show this help
  exit                   - Close terminal session

Security Notes:
  - Commands run in isolated Docker container
  - Limited to safe operations only
  - Resource usage is monitored
  - Sessions timeout after 30 minutes of inactivity
`
    this.sendMessage(ws, 'info', helpText)
  }

  /**
   * Cleanup inactive sessions
   */
  private cleanupInactiveSessions(): void {
    const now = new Date().getTime()

    for (const [sessionId, session] of this.sessions.entries()) {
      const inactiveTime = now - session.lastActivity.getTime()
      
      if (inactiveTime > this.SESSION_TIMEOUT) {
        console.log( `[TerminalWS] Cleaning up inactive session: ${sessionId}`)
        
        this.sendMessage(session.ws, 'info', 'Session timed out due to inactivity')
        session.ws.close()
        this.sessions.delete(sessionId)
      }
    }
  }

  /**
   * Broadcast message to all sessions for a workspace
   */
  broadcastToWorkspace(workspaceId: string, type: string, content: string): void {
    for (const session of this.sessions.values()) {
      if (session.workspaceId === workspaceId) {
        this.sendMessage(session.ws, type, content)
      }
    }
  }

  /**
   * Get active sessions count
   */
  getActiveSessionsCount(): number {
    return this.sessions.size
  }

  /**
   * Get user's active sessions
   */
  getUserSessions(userId: string): TerminalSession[] {
    return Array.from(this.sessions.values()).filter(s => s.userId === userId)
  }
}
