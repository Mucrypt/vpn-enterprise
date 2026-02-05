import { Router } from 'express'
import { spawn } from 'child_process'
import { authMiddleware, AuthRequest } from '@vpn-enterprise/auth'
import path from 'path'
import fs from 'fs/promises'
import os from 'os'

const router = Router()

// Workspace directory for terminal sessions
const WORKSPACE_BASE = path.join(os.tmpdir(), 'nexusai-workspaces')

// Allowed commands for security
const ALLOWED_COMMANDS = [
  'npm',
  'node',
  'npx',
  'ls',
  'pwd',
  'cat',
  'mkdir',
  'rm',
  'cp',
  'mv',
  'touch',
  'echo',
  'git',
]

// Maximum execution time (30 seconds)
const MAX_EXECUTION_TIME = 30000

/**
 * Execute terminal command in a sandboxed workspace
 * POST /api/terminal/execute
 */
router.post('/execute', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { command, workspaceId = 'default', projectPath } = req.body

    if (!command || typeof command !== 'string') {
      return res.status(400).json({ error: 'Command is required' })
    }

    // Parse command
    const commandParts = command.trim().split(/\s+/)
    const baseCommand = commandParts[0]

    // Security check: only allow whitelisted commands
    if (!ALLOWED_COMMANDS.includes(baseCommand)) {
      return res.status(403).json({
        error: `Command "${baseCommand}" is not allowed`,
        allowedCommands: ALLOWED_COMMANDS,
      })
    }

    // Create workspace directory if it doesn't exist
    const workspacePath = path.join(
      WORKSPACE_BASE,
      req.user?.id || 'anonymous',
      workspaceId,
    )
    await fs.mkdir(workspacePath, { recursive: true })

    // Execute command
    const result = await executeCommand(command, workspacePath)

    res.json({
      success: result.exitCode === 0,
      output: result.output,
      error: result.error,
      exitCode: result.exitCode,
      workspacePath,
    })
  } catch (error) {
    console.error('[Terminal] Execution error:', error)
    res.status(500).json({
      error: 'Failed to execute command',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
})

/**
 * Get workspace files
 * GET /api/terminal/workspace/:workspaceId
 */
router.get(
  '/workspace/:workspaceId',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const { workspaceId } = req.params
      const workspacePath = path.join(
        WORKSPACE_BASE,
        req.user?.id || 'anonymous',
        workspaceId,
      )

      // Check if workspace exists
      try {
        await fs.access(workspacePath)
      } catch {
        return res.status(404).json({ error: 'Workspace not found' })
      }

      // List files
      const files = await listFilesRecursive(workspacePath)

      res.json({
        workspaceId,
        path: workspacePath,
        files,
      })
    } catch (error) {
      console.error('[Terminal] Workspace list error:', error)
      res.status(500).json({
        error: 'Failed to list workspace files',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  },
)

/**
 * Write file to workspace
 * POST /api/terminal/workspace/:workspaceId/write
 */
router.post(
  '/workspace/:workspaceId/write',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const { workspaceId } = req.params
      const { filePath: relativePath, content } = req.body

      if (!relativePath || !content) {
        return res
          .status(400)
          .json({ error: 'filePath and content are required' })
      }

      const workspacePath = path.join(
        WORKSPACE_BASE,
        req.user?.id || 'anonymous',
        workspaceId,
      )

      // Security: ensure file is within workspace
      const absolutePath = path.resolve(workspacePath, relativePath)
      if (!absolutePath.startsWith(workspacePath)) {
        return res.status(403).json({ error: 'Invalid file path' })
      }

      // Create directory if it doesn't exist
      await fs.mkdir(path.dirname(absolutePath), { recursive: true })

      // Write file
      await fs.writeFile(absolutePath, content, 'utf-8')

      res.json({
        success: true,
        filePath: relativePath,
        absolutePath,
      })
    } catch (error) {
      console.error('[Terminal] File write error:', error)
      res.status(500).json({
        error: 'Failed to write file',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  },
)

/**
 * Delete workspace
 * DELETE /api/terminal/workspace/:workspaceId
 */
router.delete(
  '/workspace/:workspaceId',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const { workspaceId } = req.params
      const workspacePath = path.join(
        WORKSPACE_BASE,
        req.user?.id || 'anonymous',
        workspaceId,
      )

      // Delete workspace directory
      await fs.rm(workspacePath, { recursive: true, force: true })

      res.json({
        success: true,
        message: 'Workspace deleted',
      })
    } catch (error) {
      console.error('[Terminal] Workspace delete error:', error)
      res.status(500).json({
        error: 'Failed to delete workspace',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  },
)

// Helper function to execute command
async function executeCommand(
  command: string,
  workingDirectory: string,
): Promise<{ output: string; error: string; exitCode: number }> {
  return new Promise((resolve) => {
    const shell = process.platform === 'win32' ? 'cmd.exe' : '/bin/sh'
    const shellFlag = process.platform === 'win32' ? '/c' : '-c'

    const child = spawn(shell, [shellFlag, command], {
      cwd: workingDirectory,
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PATH: process.env.PATH,
      },
      timeout: MAX_EXECUTION_TIME,
    })

    let output = ''
    let error = ''

    child.stdout?.on('data', (data) => {
      output += data.toString()
    })

    child.stderr?.on('data', (data) => {
      error += data.toString()
    })

    child.on('close', (code) => {
      resolve({
        output: output.trim(),
        error: error.trim(),
        exitCode: code || 0,
      })
    })

    child.on('error', (err) => {
      resolve({
        output: output.trim(),
        error: `Process error: ${err.message}\n${error.trim()}`,
        exitCode: 1,
      })
    })

    // Force kill if exceeds timeout
    setTimeout(() => {
      if (!child.killed) {
        child.kill('SIGKILL')
        resolve({
          output: output.trim(),
          error: `Command timed out after ${MAX_EXECUTION_TIME / 1000}s\n${error.trim()}`,
          exitCode: 124,
        })
      }
    }, MAX_EXECUTION_TIME)
  })
}

// Helper function to list files recursively
async function listFilesRecursive(
  dir: string,
  baseDir: string = dir,
): Promise<string[]> {
  const files: string[] = []

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        // Skip node_modules and .git directories
        if (entry.name !== 'node_modules' && entry.name !== '.git') {
          const subFiles = await listFilesRecursive(fullPath, baseDir)
          files.push(...subFiles)
        }
      } else {
        const relativePath = path.relative(baseDir, fullPath)
        files.push(relativePath)
      }
    }
  } catch (error) {
    console.error(`Failed to list directory ${dir}:`, error)
  }

  return files
}

export default router
