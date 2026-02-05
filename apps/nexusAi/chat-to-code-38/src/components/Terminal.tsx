// Terminal Component with Real Command Execution
import { useEffect, useRef, useState } from 'react'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'

interface TerminalProps {
  onCommand?: (command: string) => void
  workspaceId?: string
  projectPath?: string
}

export function Terminal({ onCommand, workspaceId, projectPath }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<XTerm | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)

  useEffect(() => {
    if (!terminalRef.current) return

    // Initialize terminal
    const term = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Moscow, "Courier New", monospace',
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
    term.writeln('🚀 NexusAI Terminal - Ready')
    term.writeln('Type commands to install dependencies, run builds, preview apps, etc.')
    term.writeln('💡 Tip: Use "npm install" to install dependencies, "npm run dev" to start preview')
    term.writeln('')
    term.write('$ ')

    let currentLine = ''

    // Handle user input
    term.onData((data) => {
      const char = data

      if (isExecuting) {
        // Don't accept input while command is executing
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
        // Ctrl+C
        if (isExecuting && wsConnection) {
          term.writeln('^C')
          wsConnection.send(JSON.stringify({ action: 'cancel' }))
          setIsExecuting(false)
          term.write('$ ')
        }
      } else {
        // Regular character
        currentLine += char
        term.write(char)
      }
    })

    async function handleCommand(cmd: string) {
      if (cmd === 'clear') {
        term.clear()
        term.write('$ ')
        return
      }
      
      if (cmd === 'help') {
        term.writeln('Available commands:')
        term.writeln('  npm install          - Install dependencies')
        term.writeln('  npm run dev          - Start development server for preview')
        term.writeln('  npm run build        - Build for production')
        term.writeln('  npm create vite@latest - Create new Vite project')
        term.writeln('  ls                   - List files')
        term.writeln('  pwd                  - Print working directory')
        term.writeln('  clear                - Clear terminal')
        term.writeln('  help                 - Show this help')
        term.write('$ ')
        return
      }

      // Execute command via HTTP/WebSocket
      await executeCommand(cmd, term)
    }

    async function executeCommand(cmd: string, term: XTerm) {
      setIsExecuting(true)
      
      try {
        // For now, execute via HTTP API
        // TODO: Switch to WebSocket for streaming output
        const response = await fetch('https://chatbuilds.com/api/terminal/execute', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            command: cmd,
            workspaceId: workspaceId || 'default',
            projectPath: projectPath || '/tmp/nexusai-workspace',
          }),
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()

        if (data.output) {
          // Write output line by line
          const lines = data.output.split('\n')
          lines.forEach((line: string) => {
            term.writeln(line)
          })
        }

        if (data.error) {
          term.writeln(`\r\n❌ Error: ${data.error}`)
        }

        if (data.exitCode !== undefined && data.exitCode !== 0) {
          term.writeln(`\r\n⚠️  Command exited with code ${data.exitCode}`)
        } else if (data.success) {
          term.writeln(`\r\n✅ Command completed successfully`)
        }

        if (onCommand) onCommand(cmd)
      } catch (error) {
        term.writeln(`\r\n❌ Failed to execute command: ${error instanceof Error ? error.message : 'Unknown error'}`)
        term.writeln('🔧 Terminal is running in simulation mode.')
        term.writeln('   Real execution coming soon!')
      } finally {
        setIsExecuting(false)
        term.write('\r\n$ ')
      }
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
  }, [onCommand, workspaceId, projectPath, wsConnection, isExecuting])

  return (
    <div
      ref={terminalRef}
      className='h-full w-full bg-[#1e1e1e] rounded-lg overflow-hidden'
    />
  )
}
