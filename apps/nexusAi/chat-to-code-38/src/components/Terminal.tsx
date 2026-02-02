// Terminal Component
import { useEffect, useRef } from 'react'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'

interface TerminalProps {
  onCommand?: (command: string) => void
}

export function Terminal({ onCommand }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<XTerm | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)

  useEffect(() => {
    if (!terminalRef.current) return

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
    term.writeln('🚀 NexusAI Terminal - Ready')
    term.writeln('Type commands to install dependencies, run builds, etc.')
    term.writeln('')
    term.write('$ ')

    let currentLine = ''

    // Handle user input
    term.onData((data) => {
      const char = data

      if (char === '\r') {
        // Enter key
        term.write('\r\n')
        if (currentLine.trim()) {
          handleCommand(currentLine.trim())
        }
        currentLine = ''
        term.write('$ ')
      } else if (char === '\u007F') {
        // Backspace
        if (currentLine.length > 0) {
          currentLine = currentLine.slice(0, -1)
          term.write('\b \b')
        }
      } else {
        // Regular character
        currentLine += char
        term.write(char)
      }
    })

    function handleCommand(cmd: string) {
      if (cmd === 'clear') {
        term.clear()
      } else if (cmd === 'help') {
        term.writeln('Available commands:')
        term.writeln('  npm install - Install dependencies')
        term.writeln('  npm run dev - Start development server')
        term.writeln('  npm run build - Build for production')
        term.writeln('  clear - Clear terminal')
        term.writeln('  help - Show this help')
      } else if (cmd.startsWith('npm')) {
        term.writeln(`Executing: ${cmd}`)
        term.writeln('⏳ Running...')
        // Simulate command execution
        setTimeout(() => {
          term.writeln('✅ Command completed')
          if (onCommand) onCommand(cmd)
        }, 1000)
      } else {
        term.writeln(`Command not found: ${cmd}`)
        term.writeln('Type "help" for available commands')
      }
    }

    // Resize handler
    const handleResize = () => {
      fitAddon.fit()
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      term.dispose()
    }
  }, [onCommand])

  return (
    <div
      ref={terminalRef}
      className='h-full w-full bg-[#1e1e1e] rounded-lg overflow-hidden'
    />
  )
}
