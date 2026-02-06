// Terminal Component with Real-Time Streaming via WebSocket
import { useEffect, useRef, useState, useCallback } from 'react'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'

interface TerminalProps {
  onCommand?: (command: string) => void
  appId?: string
  workspaceId?: string
  projectPath?: string
  onPreviewReady?: (url: string) => void
}

export function Terminal({
  onCommand,
  appId,
  workspaceId: externalWorkspaceId,
  projectPath,
  onPreviewReady,
}: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<XTerm | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const [hasPackageJson, setHasPackageJson] = useState(false)
  const [workspaceId, setWorkspaceId] = useState<string | null>(externalWorkspaceId || null)
  const [workspaceReady, setWorkspaceReady] = useState(false)
  const commandQueueRef = useRef<string[]>([])
  const isProcessingRef = useRef(false)

  // Create workspace with app files on mount
  useEffect(() => {
    if (appId && !workspaceId && !workspaceReady) {
      const createWorkspace = async () => {
        try {
          console.log('[Terminal] Creating workspace for app:', appId)
          const response = await fetch('https://chatbuilds.com/api/terminal/workspaces', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              app_id: appId,
              name: 'NexusAI Workspace',
            }),
          })

          if (response.ok) {
            const data = await response.json()
            setWorkspaceId(data.workspace_id)
            setWorkspaceReady(true)
            console.log('[Terminal] Workspace created:', data.workspace_id)
           
            if (data.instructions) {
              console.log('[Terminal] Instructions:', data.instructions)
            }
          } else {
            console.error('[Terminal] Failed to create workspace:', await response.text())
          }
        } catch (error) {
          console.error('[Terminal] Error creating workspace:', error)
        }
      }
      createWorkspace()
    } else if (externalWorkspaceId) {
      setWorkspaceId(externalWorkspaceId)
      setWorkspaceReady(true)
    } else if (!appId) {
      // Use default workspace if no appId provided
      setWorkspaceId('default')
      setWorkspaceReady(true)
    }
  }, [appId, workspaceId, workspaceReady, externalWorkspaceId])

  // Initialize terminal and WebSocket connection
  useEffect(() => {
    if (!terminalRef.current) return
    if (!workspaceReady || !workspaceId) {
      console.log('[Terminal] Waiting for workspace to be ready...')
      return
    }

    // Initialize terminal
    const term = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#ffffff',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#ffffff',
      },
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)

    term.open(terminalRef.current)
    fitAddon.fit()

    xtermRef.current = term
    fitAddonRef.current = fitAddon

    // Welcome message
    term.writeln('🚀 \x1b[1;32mNexusAI Terminal\x1b[0m - Ready')
    term.writeln(
      'Type commands to install dependencies, run builds, preview apps, etc.',
    )
    term.writeln('')
    term.write('$ ')

    let currentLine = ''

    // Check if package.json exists (indicates a project)
    checkForPackageJson(term)

    // Handle user input
    term.onData((data) => {
      const char = data

      if (isExecuting) {
        // Allow Ctrl+C to cancel
        if (char === '\u0003') {
          term.writeln('^C')
          cancelCommand()
          return
        }
        // Don't accept other input while command is executing
        return
      }

      if (char === '\r') {
        // Enter key
        term.write('\r\n')
        if (currentLine.trim()) {
          handleCommand(currentLine.trim())
        }
        currentLine = ''
        if (!isExecuting) {
          term.write('$ ')
        }
      } else if (char === '\u007F') {
        // Backspace
        if (currentLine.length > 0) {
          currentLine = currentLine.slice(0, -1)
          term.write('\b \b')
        }
      } else if (char === '\u0003') {
        // Ctrl+C (not executing)
        term.writeln('^C')
        currentLine = ''
        term.write('$ ')
      } else {
        // Regular character
        currentLine += char
        term.write(char)
      }
    })

    async function checkForPackageJson(term: XTerm) {
      try {
        const response = await fetch(
          'https://chatbuilds.com/api/terminal/execute',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              command: 'ls package.json',
              workspaceId: workspaceId || 'default',
              projectPath: projectPath || '/workspace',
            }),
          },
        )

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.stdout?.includes('package.json')) {
            setHasPackageJson(true)
            term.writeln('\x1b[1;36m📦 Project detected! You can run:\x1b[0m')
            term.writeln(
              '   \x1b[33mnpm install\x1b[0m     - Install dependencies',
            )
            term.writeln(
              '   \x1b[33mnpm run dev\x1b[0m     - Start preview server',
            )
            term.writeln('')

            // Auto-install dependencies
            term.writeln('\x1b[1;32m⚡ Auto-installing dependencies...\x1b[0m')
            term.writeln('')
            commandQueueRef.current.push('npm install')
            processCommandQueue()
          }
        }
      } catch (error) {
        console.error('Failed to check for package.json:', error)
      }
    }

    async function handleCommand(cmd: string) {
      if (cmd === 'clear') {
        term.clear()
        term.write('$ ')
        return
      }

      if (cmd === 'help') {
        term.writeln('\x1b[1;36m📖 Available commands:\x1b[0m')
        term.writeln(
          '   \x1b[33mnpm install\x1b[0m          - Install dependencies',
        )
        term.writeln(
          '   \x1b[33mnpm run dev\x1b[0m          - Start development server',
        )
        term.writeln(
          '   \x1b[33mnpm run build\x1b[0m        - Build for production',
        )
        term.writeln('   \x1b[33mls\x1b[0m                   - List files')
        term.writeln(
          '   \x1b[33mpwd\x1b[0m                  - Print working directory',
        )
        term.writeln(
          '   \x1b[33mcat <file>\x1b[0m           - View file contents',
        )
        term.writeln('   \x1b[33mclear\x1b[0m                - Clear terminal')
        term.writeln('   \x1b[33mhelp\x1b[0m                 - Show this help')
        term.write('\r\n$ ')
        return
      }

      commandQueueRef.current.push(cmd)
      processCommandQueue()
    }

    async function processCommandQueue() {
      if (isProcessingRef.current || commandQueueRef.current.length === 0) {
        return
      }

      isProcessingRef.current = true
      setIsExecuting(true)

      while (commandQueueRef.current.length > 0) {
        const cmd = commandQueueRef.current.shift()!
        await executeCommand(cmd, term)
      }

      isProcessingRef.current = false
      setIsExecuting(false)
      term.write('\r\n$ ')
    }

    async function executeCommand(cmd: string, term: XTerm) {
      try {
        // Show spinner for long-running commands
        const isLongRunning = cmd.includes('install') || cmd.includes(' dev')
        let spinnerFrame = 0
        const spinnerChars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
        let spinnerInterval: NodeJS.Timeout | null = null

        if (isLongRunning) {
          term.writeln(`\x1b[1;33m⏳ Executing: ${cmd}\x1b[0m`)
          term.write('\r')
          spinnerInterval = setInterval(() => {
            term.write(`\r${spinnerChars[spinnerFrame]} Running...`)
            spinnerFrame = (spinnerFrame + 1) % spinnerChars.length
          }, 100)
        }

        const response = await fetch(
          'https://chatbuilds.com/api/terminal/execute',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              command: cmd,
              workspaceId: workspaceId || 'default',
              projectPath: projectPath || '/workspace',
            }),
          },
        )

        if (spinnerInterval) {
          clearInterval(spinnerInterval)
          term.write('\r                    \r')
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()

        // Display output
        if (data.stdout) {
          term.writeln(data.stdout)
        }

        if (data.stderr) {
          term.writeln(`\x1b[1;31m${data.stderr}\x1b[0m`)
        }

        if (data.error) {
          term.writeln(`\r\n\x1b[1;31m❌ Error: ${data.error}\x1b[0m`)
        }

        // Success indicator
        if (data.exitCode === 0) {
          if (cmd.includes('install')) {
            term.writeln(
              '\r\n\x1b[1;32m✅ Dependencies installed successfully!\x1b[0m',
            )
            term.writeln(
              '\x1b[1;36m💡 Tip: Run "\x1b[33mnpm run dev\x1b[0m\x1b[1;36m" to start the preview\x1b[0m',
            )
          } else if (cmd.includes('dev') || cmd.includes('start')) {
            term.writeln('\r\n\x1b[1;32m✅ Dev server started!\x1b[0m')
            const previewUrl = `https://chatbuilds.com/api/terminal/preview/${workspaceId || 'default'}/`
            term.writeln(`\x1b[1;36m🌐 Preview: \x1b[4m${previewUrl}\x1b[0m`)
            if (onPreviewReady) {
              onPreviewReady(previewUrl)
            }
          } else {
            term.writeln(
              '\r\n\x1b[1;32m✅ Command completed successfully\x1b[0m',
            )
          }
        } else if (data.exitCode !== undefined && data.exitCode !== 0) {
          term.writeln(
            `\r\n\x1b[1;33m⚠️  Command exited with code ${data.exitCode}\x1b[0m`,
          )
        }

        if (onCommand) onCommand(cmd)
      } catch (error) {
        term.writeln(
          `\r\n\x1b[1;31m❌ Failed to execute command:\x1b[0m ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
      }
    }

    function cancelCommand() {
      setIsExecuting(false)
      isProcessingRef.current = false
      commandQueueRef.current = []
      term.writeln('\r\n\x1b[1;33m⚠️  Command cancelled\x1b[0m')
      term.write('$ ')
    }

    // Resize handler
    const handleResize = () => {
      fitAddon.fit()
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (wsConnection) {
        wsConnection.close()
      }
      term.dispose()
    }
  }, [
    onCommand,
    workspaceId,
    workspaceReady,
    projectPath,
    wsConnection,
    isExecuting,
    onPreviewReady,
  ])

  return (
    <div
      ref={terminalRef}
      className='h-full w-full bg-[#1e1e1e] rounded-lg overflow-hidden'
    />
  )
}
