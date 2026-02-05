/**
 * Container Manager Service
 * Manages isolated Docker containers for terminal workspaces
 * Provides secure sandboxed environments with resource limits
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import * as path from 'path'
import * as fs from 'fs/promises'

const execAsync = promisify(exec)

interface ContainerConfig {
  workspaceId: string
  userId: string
  memoryLimit: string
  cpuLimit: string
  diskLimit: string
  timeoutMinutes: number
  files?: Array<{ file_path: string; content: string; language: string }>
  env?: Record<string, string>
}

interface ContainerInfo {
  containerId: string
  workspaceId: string
  userId: string
  status: 'starting' | 'running' | 'stopped' | 'error'
  createdAt: Date
  ports: { internal: number; external: number }[]
  memoryUsage?: number
  cpuUsage?: number
}

export class ContainerManager {
  private containers: Map<string, ContainerInfo> = new Map()
  private readonly BASE_IMAGE = 'node:20-alpine'
  private readonly NETWORK_NAME = 'nexusai-network'
  private readonly WORKSPACES_DIR =
    process.env.WORKSPACES_DIR || '/tmp/nexusai-workspaces'
  private readonly MAX_CONTAINERS_PER_USER = 5
  private readonly DEFAULT_TIMEOUT = 60 // minutes

  constructor() {
    this.initialize()
  }

  /**
   * Initialize the container manager
   */
  private async initialize(): Promise<void> {
    try {
      // Create workspaces directory
      await fs.mkdir(this.WORKSPACES_DIR, { recursive: true })

      // Create Docker network if it doesn't exist
      await this.ensureNetwork()

      // Clean up any orphaned containers from previous runs
      await this.cleanupOrphanedContainers()

      console.log('[ContainerManager] Initialized successfully')
    } catch (error) {
      console.error('[ContainerManager] Initialization failed:', error)
    }
  }

  /**
   * Ensure Docker network exists
   */
  private async ensureNetwork(): Promise<void> {
    try {
      await execAsync(`docker network inspect ${this.NETWORK_NAME}`)
    } catch {
      // Network doesn't exist, create it
      await execAsync(`docker network create ${this.NETWORK_NAME}`)
      console.log(`[ContainerManager] Created network: ${this.NETWORK_NAME}`)
    }
  }

  /**
   * Create a new isolated container for a workspace
   */
  async createContainer(config: ContainerConfig): Promise<ContainerInfo> {
    // Check user's container limit
    const userContainers = Array.from(this.containers.values()).filter(
      (c) => c.userId === config.userId && c.status !== 'stopped',
    )

    if (userContainers.length >= this.MAX_CONTAINERS_PER_USER) {
      throw new Error(
        `Maximum ${this.MAX_CONTAINERS_PER_USER} containers per user exceeded`,
      )
    }

    const workspacePath = path.join(this.WORKSPACES_DIR, config.workspaceId)

    try {
      // Create workspace directory
      await fs.mkdir(workspacePath, { recursive: true })

      // Write app files if provided
      if (config.files && config.files.length > 0) {
        console.log(
          `[ContainerManager] Writing ${config.files.length} files to workspace...`,
        )
        for (const file of config.files) {
          const filePath = path.join(workspacePath, file.file_path)
          const fileDir = path.dirname(filePath)

          // Create directory structure
          await fs.mkdir(fileDir, { recursive: true })

          // Write file content
          await fs.writeFile(filePath, file.content, 'utf-8')
        }
        console.log(`[ContainerManager] Files written successfully`)
      } else {
        // Create package.json if it doesn't exist and no files provided
        const packageJsonPath = path.join(workspacePath, 'package.json')
        try {
          await fs.access(packageJsonPath)
        } catch {
          await fs.writeFile(
            packageJsonPath,
            JSON.stringify(
              {
                name: config.workspaceId,
                version: '1.0.0',
                private: true,
              },
              null,
              2,
            ),
          )
        }
      }

      // Allocate random port for preview (3000-3999 range)
      const previewPort = await this.allocatePort()

      // Build environment variables
      const envVars = [
        `-e NODE_ENV=development`,
        `-e WORKSPACE_ID=${config.workspaceId}`,
        `-e USER_ID=${config.userId}`,
      ]

      // Add custom environment variables (e.g., database credentials)
      if (config.env) {
        for (const [key, value] of Object.entries(config.env)) {
          envVars.push(`-e ${key}='${value.replace(/'/g, "'\\''")}'`) // Escape single quotes
        }
      }

      // Create container with security constraints
      const containerName = `nexusai-${config.workspaceId}`
      const dockerCommand = [
        'docker run -d',
        `--name ${containerName}`,
        `--network ${this.NETWORK_NAME}`,
        `--memory=${config.memoryLimit || '512m'}`,
        `--cpus=${config.cpuLimit || '1.0'}`,
        `--storage-opt size=${config.diskLimit || '2G'}`,
        '--cap-drop=ALL', // Drop all capabilities
        '--cap-add=CHOWN', // Only allow changing file ownership
        '--cap-add=SETGID',
        '--cap-add=SETUID',
        '--security-opt=no-new-privileges', // Prevent privilege escalation
        '--read-only', // Read-only root filesystem
        '--tmpfs /tmp:rw,noexec,nosuid,size=100m', // Writable tmp with restrictions
        `--tmpfs /home/node/.npm:rw,noexec,nosuid,size=100m`, // npm cache
        `-v ${workspacePath}:/workspace:rw`, // Workspace volume
        `-p ${previewPort}:3000`, // Preview port
        ...envVars, // Environment variables
        '--user node', // Run as non-root user
        '--workdir /workspace',
        this.BASE_IMAGE,
        'tail -f /dev/null', // Keep container running
      ].join(' ')

      const { stdout } = await execAsync(dockerCommand)
      const containerId = stdout.trim()

      const containerInfo: ContainerInfo = {
        containerId,
        workspaceId: config.workspaceId,
        userId: config.userId,
        status: 'running',
        createdAt: new Date(),
        ports: [{ internal: 3000, external: previewPort }],
      }

      this.containers.set(config.workspaceId, containerInfo)

      // Set auto-cleanup timer
      this.scheduleCleanup(
        config.workspaceId,
        config.timeoutMinutes || this.DEFAULT_TIMEOUT,
      )

      console.log(
        `[ContainerManager] Created container for workspace: ${config.workspaceId}`,
      )
      return containerInfo
    } catch (error) {
      console.error(`[ContainerManager] Failed to create container:`, error)
      throw new Error('Failed to create isolated environment')
    }
  }

  /**
   * Execute command in container
   */
  async executeCommand(
    workspaceId: string,
    command: string,
    options: { timeout?: number; cwd?: string } = {},
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const container = this.containers.get(workspaceId)
    if (!container || container.status !== 'running') {
      throw new Error('Container not found or not running')
    }

    // Security: Validate and sanitize command
    const sanitizedCommand = this.sanitizeCommand(command)
    if (!sanitizedCommand) {
      throw new Error('Command not allowed')
    }

    const timeout = options.timeout || 300000 // 5 minutes default
    const workdir = options.cwd || '/workspace'

    try {
      const dockerCommand = [
        'docker exec',
        `-w ${workdir}`,
        container.containerId,
        'sh -c',
        `"${sanitizedCommand}"`,
      ].join(' ')

      const { stdout, stderr } = await execAsync(dockerCommand, {
        timeout,
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      })

      return { stdout, stderr, exitCode: 0 }
    } catch (error: any) {
      return {
        stdout: error.stdout || '',
        stderr: error.stderr || error.message,
        exitCode: error.code || 1,
      }
    }
  }

  /**
   * Sanitize and validate command for security
   */
  private sanitizeCommand(command: string): string | null {
    // Remove any command injection attempts
    const dangerous = [
      ';',
      '&&',
      '||',
      '|',
      '`',
      '$(',
      '../',
      '~/',
      '/etc/',
      '/proc/',
      '/sys/',
      'rm -rf',
      'chmod',
      'chown',
      'sudo',
      'su',
      'docker',
      'kubectl',
      'curl http',
      'wget http',
    ]

    const lower = command.toLowerCase()
    for (const pattern of dangerous) {
      if (lower.includes(pattern)) {
        console.warn(`[ContainerManager] Blocked dangerous command: ${command}`)
        return null
      }
    }

    // Whitelist allowed commands - comprehensive list for development
    const allowedCommands = [
      'npm',
      'yarn',
      'pnpm',
      'bun',
      'node',
      'npx',
      'ls',
      'cat',
      'pwd',
      'cd',
      'mkdir',
      'touch',
      'echo',
      'git',
      'code',
      'vite',
      'next',
      'react',
      'vue',
      'python',
      'python3',
      'pip',
      'pip3',
      'composer',
      'php',
      'ruby',
      'bundle',
      'go',
      'cargo',
      'rustc',
      'clear',
      'help',
      'exit',
      'mv',
      'cp',
      'rm',
      'grep',
      'find',
      'head',
      'tail',
      'wc',
      'sort',
      'uniq',
      'diff',
      'tree',
      'which',
      'whereis',
      'man',
      'env',
      'export',
      'source',
    ]

    const firstWord = command.trim().split(/\s+/)[0]
    const isAllowed = allowedCommands.includes(firstWord)

    if (!isAllowed) {
      console.warn(`[ContainerManager] Command not in whitelist: ${firstWord}`)
      return null
    }

    return command.replace(/[`$]/g, '') // Remove backticks and $
  }

  /**
   * Get container info
   */
  getContainer(workspaceId: string): ContainerInfo | undefined {
    return this.containers.get(workspaceId)
  }

  /**
   * Stop and remove container
   */
  async stopContainer(workspaceId: string): Promise<void> {
    const container = this.containers.get(workspaceId)
    if (!container) {
      return
    }

    try {
      // Stop container
      await execAsync(`docker stop ${container.containerId}`, {
        timeout: 10000,
      })
      // Remove container
      await execAsync(`docker rm ${container.containerId}`, { timeout: 10000 })

      container.status = 'stopped'
      this.containers.delete(workspaceId)

      console.log(`[ContainerManager] Stopped container: ${workspaceId}`)
    } catch (error) {
      console.error(`[ContainerManager] Failed to stop container:`, error)
    }
  }

  /**
   * Get container resource usage
   */
  async getResourceUsage(
    workspaceId: string,
  ): Promise<{ memory: number; cpu: number } | null> {
    const container = this.containers.get(workspaceId)
    if (!container || container.status !== 'running') {
      return null
    }

    try {
      const { stdout } = await execAsync(
        `docker stats ${container.containerId} --no-stream --format "{{.MemUsage}} {{.CPUPerc}}"`,
      )

      const [memStr, cpuStr] = stdout.trim().split(' ')
      const memory = parseFloat(memStr)
      const cpu = parseFloat(cpuStr)

      return { memory, cpu }
    } catch {
      return null
    }
  }

  /**
   * List all containers for a user
   */
  getUserContainers(userId: string): ContainerInfo[] {
    return Array.from(this.containers.values()).filter(
      (c) => c.userId === userId,
    )
  }

  /**
   * Allocate a random available port
   */
  private async allocatePort(): Promise<number> {
    const usedPorts = Array.from(this.containers.values()).flatMap((c) =>
      c.ports.map((p) => p.external),
    )

    let port: number
    do {
      port = 3000 + Math.floor(Math.random() * 1000)
    } while (usedPorts.includes(port))

    return port
  }

  /**
   * Schedule automatic cleanup of container
   */
  private scheduleCleanup(workspaceId: string, minutes: number): void {
    setTimeout(
      async () => {
        const container = this.containers.get(workspaceId)
        if (container && container.status === 'running') {
          console.log(
            `[ContainerManager] Auto-cleanup triggered for: ${workspaceId}`,
          )
          await this.stopContainer(workspaceId)
        }
      },
      minutes * 60 * 1000,
    )
  }

  /**
   * Clean up orphaned containers from previous runs
   */
  private async cleanupOrphanedContainers(): Promise<void> {
    try {
      const { stdout } = await execAsync(
        `docker ps -a --filter "name=nexusai-" --format "{{.Names}}"`,
      )

      const containerNames = stdout.trim().split('\n').filter(Boolean)

      for (const name of containerNames) {
        try {
          await execAsync(`docker stop ${name}`, { timeout: 5000 })
          await execAsync(`docker rm ${name}`, { timeout: 5000 })
          console.log(
            `[ContainerManager] Cleaned up orphaned container: ${name}`,
          )
        } catch (error) {
          console.error(`[ContainerManager] Failed to cleanup ${name}:`, error)
        }
      }
    } catch {
      // No containers to clean up
    }
  }

  /**
   * Cleanup all containers (for shutdown)
   */
  async cleanupAll(): Promise<void> {
    console.log('[ContainerManager] Cleaning up all containers...')
    const workspaces = Array.from(this.containers.keys())

    await Promise.all(
      workspaces.map((workspace) => this.stopContainer(workspace)),
    )
  }
}

// Singleton instance
export const containerManager = new ContainerManager()

// Cleanup on process exit
process.on('SIGTERM', async () => {
  await containerManager.cleanupAll()
  process.exit(0)
})

process.on('SIGINT', async () => {
  await containerManager.cleanupAll()
  process.exit(0)
})
