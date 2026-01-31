import { useState, useEffect, useRef } from 'react'
import {
  ArrowRight,
  Plus,
  Paperclip,
  Palette,
  MessageSquare,
  Mic,
  Send,
  Settings,
  Code,
  Database,
  Eye,
  Download,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AIService } from '@/services/aiService'

interface Message {
  role: 'user' | 'assistant' | 'error' | 'system'
  content: string
  code?: string
  sql?: string
  language?: string
  type?: 'text' | 'component' | 'app' | 'sql' | 'api'
}

const HeroSection = () => {
  const [inputValue, setInputValue] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [showAPIKeyDialog, setShowAPIKeyDialog] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [aiService] = useState(() => new AIService(undefined, true))
  const [hasApiKey, setHasApiKey] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [previewHtml, setPreviewHtml] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stored = localStorage.getItem('nexusai_api_key')
    setHasApiKey(!!stored)
    if (!stored) {
      setTimeout(() => setShowAPIKeyDialog(true), 2000)
    }

    // Welcome message
    setMessages([
      {
        role: 'system',
        content:
          '👋 Welcome to NexusAI! I can help you:\n\n• Generate React components\n• Build complete applications\n• Create database schemas\n• Generate APIs\n• Fix and optimize code\n\nTry: "Create a todo app with React" or "Generate a user database schema"',
        type: 'text',
      },
    ])
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      aiService.setAPIKey(apiKey)
      setHasApiKey(true)
      setShowAPIKeyDialog(false)
    }
  }

  const detectIntentAndGenerate = async (userMessage: string) => {
    const lowerMsg = userMessage.toLowerCase()

    // Detect intent
    if (
      lowerMsg.includes('component') ||
      lowerMsg.includes('button') ||
      lowerMsg.includes('form') ||
      lowerMsg.includes('navbar') ||
      lowerMsg.includes('card')
    ) {
      return await generateComponent(userMessage)
    } else if (
      lowerMsg.includes('app') ||
      lowerMsg.includes('application') ||
      lowerMsg.includes('project')
    ) {
      return await generateApp(userMessage)
    } else if (
      lowerMsg.includes('database') ||
      lowerMsg.includes('schema') ||
      lowerMsg.includes('table') ||
      lowerMsg.includes('sql')
    ) {
      return await generateDatabase(userMessage)
    } else if (
      lowerMsg.includes('api') ||
      lowerMsg.includes('endpoint') ||
      lowerMsg.includes('route')
    ) {
      return await generateAPI(userMessage)
    } else {
      // General AI response
      const response = await aiService.generate({
        prompt: userMessage,
        model: 'llama3.2:1b',
        temperature: 0.7,
        max_tokens: 2000,
      })
      return {
        role: 'assistant' as const,
        content: response.response,
        type: 'text' as const,
      }
    }
  }

  const generateComponent = async (description: string) => {
    const code = await aiService.generateComponent(description)
    return {
      role: 'assistant' as const,
      content: `✨ Generated React component:\n\nYou can copy this code and use it in your project!`,
      code: code,
      language: 'tsx',
      type: 'component' as const,
    }
  }

  const generateApp = async (description: string) => {
    const app = await aiService.generateApp(description)
    const componentsList =
      app.components?.map((c) => `- ${c.name}`).join('\n') || 'N/A'
    return {
      role: 'assistant' as const,
      content: `🚀 Generated application structure:\n\n**Components:**\n${componentsList}\n\n**Routes:**\n${app.routes?.join(', ') || 'N/A'}\n\n**Description:**\n${app.description}`,
      code: JSON.stringify(app, null, 2),
      language: 'json',
      type: 'app' as const,
    }
  }

  const generateDatabase = async (description: string) => {
    const sql = await aiService.generateDatabaseSchema(description)
    return {
      role: 'assistant' as const,
      content: `🗄️ Generated database schema:\n\nYou can run this SQL in your database editor or PostgreSQL.`,
      code: sql,
      sql: sql,
      language: 'sql',
      type: 'sql' as const,
    }
  }

  const generateAPI = async (description: string) => {
    const code = await aiService.generateAPI(description)
    return {
      role: 'assistant' as const,
      content: `🔌 Generated API endpoints:\n\nExpress.js routes with TypeScript, validation, and error handling.`,
      code: code,
      language: 'typescript',
      type: 'api' as const,
    }
  }

  const handleSend = async () => {
    if (!inputValue.trim()) return

    if (!hasApiKey) {
      setShowAPIKeyDialog(true)
      return
    }

    const userMessage = inputValue
    setInputValue('')
    setIsGenerating(true)

    setMessages((prev) => [
      ...prev,
      { role: 'user', content: userMessage, type: 'text' },
    ])

    try {
      const aiMessage = await detectIntentAndGenerate(userMessage)
      setMessages((prev) => [...prev, aiMessage])

      // Generate preview for components
      if (aiMessage.code && aiMessage.type === 'component') {
        generatePreview(aiMessage.code)
      }
    } catch (error: any) {
      console.error('❌ Failed to generate:', error)
      setMessages((prev) => [
        ...prev,
        {
          role: 'error',
          content: `Error: ${error.message || 'Failed to connect to AI service. Make sure you have a valid API key.'}`,
          type: 'text',
        },
      ])
    } finally {
      setIsGenerating(false)
    }
  }

  const generatePreview = (code: string) => {
    // Simple preview generation (wrap component in basic HTML)
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
          <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="p-8">
          <div id="root"></div>
          <script type="module">
            ${code}
          </script>
        </body>
      </html>
    `
    setPreviewHtml(html)
  }

  const copyToClipboard = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const openInDatabaseEditor = (sql: string) => {
    // Open database editor with SQL pre-filled
    const baseUrl = window.location.origin
    const editorUrl = `${baseUrl}/databases?sql=${encodeURIComponent(sql)}`
    window.open(editorUrl, '_blank')
  }

  return (
    <section className='relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-16'>
      {/* Background gradient effect */}
      <div className='absolute inset-0 bg-gradient-hero animate-pulse-glow' />

      {/* Content */}
      <div className='container mx-auto px-6 relative z-10 flex flex-col items-center text-center'>
        {/* Promotional Badge */}
        <div className='mb-8 animate-fade-up'>
          <a
            href='#'
            className='inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/60 border border-border hover:bg-secondary/80 transition-colors group'
          >
            <span className='text-lg'>🎁</span>
            <span className='text-sm text-muted-foreground group-hover:text-foreground transition-colors'>
              Buy a NexusAI gift card
            </span>
            <ArrowRight className='w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors' />
          </a>
        </div>

        {/* Main Headline */}
        <h1
          className='text-4xl md:text-6xl lg:text-7xl font-semibold leading-tight mb-6 animate-fade-up'
          style={{ animationDelay: '0.1s' }}
        >
          Build something{' '}
          <span className='inline-flex items-center gap-2'>
            <span className='text-primary'>🧡</span>
            <span className='text-gradient'>NexusAI</span>
          </span>
        </h1>

        {/* Subtitle */}
        <p
          className='text-lg md:text-xl text-muted-foreground mb-12 animate-fade-up'
          style={{ animationDelay: '0.2s' }}
        >
          Create apps and websites by chatting with AI
        </p>

        {/* Messages Display */}
        {messages.length > 0 && (
          <div
            className='w-full max-w-4xl mb-6 animate-fade-up'
            style={{ animationDelay: '0.25s' }}
          >
            <div className='bg-card rounded-2xl border border-border shadow-lg p-6 max-h-[600px] overflow-y-auto space-y-6'>
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-full rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground p-4'
                        : msg.role === 'error'
                          ? 'bg-destructive/10 text-destructive border border-destructive/20 p-4'
                          : msg.role === 'system'
                            ? 'bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4 text-sm'
                            : 'w-full'
                    }`}
                  >
                    {/* Text content */}
                    {msg.content && (
                      <p className='text-sm whitespace-pre-wrap mb-3'>
                        {msg.content}
                      </p>
                    )}

                    {/* Code block with actions */}
                    {msg.code && (
                      <div className='mt-3 rounded-lg overflow-hidden border border-border bg-slate-950'>
                        {/* Code header */}
                        <div className='flex items-center justify-between bg-slate-900 px-4 py-2 border-b border-slate-800'>
                          <span className='text-xs font-mono text-slate-400'>
                            {msg.language || 'code'}
                          </span>
                          <div className='flex gap-2'>
                            {msg.type === 'sql' && (
                              <Button
                                size='sm'
                                variant='ghost'
                                className='h-7 text-xs text-green-400 hover:text-green-300 hover:bg-slate-800'
                                onClick={() => openInDatabaseEditor(msg.sql!)}
                              >
                                <Database className='w-3 h-3 mr-1' />
                                Open in Editor
                              </Button>
                            )}
                            {msg.type === 'component' && (
                              <Button
                                size='sm'
                                variant='ghost'
                                className='h-7 text-xs text-blue-400 hover:text-blue-300 hover:bg-slate-800'
                                onClick={() => generatePreview(msg.code!)}
                              >
                                <Eye className='w-3 h-3 mr-1' />
                                Preview
                              </Button>
                            )}
                            <Button
                              size='sm'
                              variant='ghost'
                              className='h-7 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                              onClick={() => copyToClipboard(msg.code!, idx)}
                            >
                              {copiedIndex === idx ? (
                                <>
                                  <Check className='w-3 h-3 mr-1' />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className='w-3 h-3 mr-1' />
                                  Copy
                                </>
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Code content */}
                        <pre className='p-4 overflow-x-auto text-xs text-slate-200 font-mono max-h-96'>
                          <code>{msg.code}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isGenerating && (
                <div className='flex justify-start'>
                  <div className='bg-muted rounded-lg p-4 flex items-center gap-3'>
                    <Sparkles className='w-4 h-4 animate-pulse text-primary' />
                    <p className='text-sm text-muted-foreground'>
                      Generating your code...
                    </p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* Chat Input Box */}
        <div
          className='w-full max-w-4xl animate-scale-in'
          style={{ animationDelay: '0.3s' }}
        >
          {/* Example Prompts */}
          {messages.length <= 1 && (
            <div className='mb-4 flex flex-wrap gap-2 justify-center'>
              <Button
                variant='outline'
                size='sm'
                onClick={() =>
                  setInputValue('Create a todo app with React and TypeScript')
                }
                className='text-xs'
              >
                <Sparkles className='w-3 h-3 mr-1' />
                Todo App
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() =>
                  setInputValue('Generate a responsive navbar component')
                }
                className='text-xs'
              >
                <Code className='w-3 h-3 mr-1' />
                Navbar Component
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() =>
                  setInputValue(
                    'Create a database schema for an e-commerce store',
                  )
                }
                className='text-xs'
              >
                <Database className='w-3 h-3 mr-1' />
                Database Schema
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() =>
                  setInputValue('Generate REST API for blog posts')
                }
                className='text-xs'
              >
                <Code className='w-3 h-3 mr-1' />
                Blog API
              </Button>
            </div>
          )}

          <div className='bg-card rounded-2xl border border-border shadow-lg overflow-hidden'>
            {/* Input Area */}
            <div className='p-4'>
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder='Ask NexusAI to create a landing page for my...'
                className='w-full bg-transparent text-foreground placeholder:text-muted-foreground text-base resize-none focus:outline-none min-h-[60px]'
                rows={2}
                disabled={isGenerating}
              />
            </div>

            {/* Bottom Toolbar */}
            <div className='flex items-center justify-between px-4 pb-4'>
              {/* Left Actions */}
              <div className='flex items-center gap-2'>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary'
                >
                  <Plus className='w-5 h-5' />
                </Button>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary gap-2'
                >
                  <Paperclip className='w-4 h-4' />
                  Attach
                </Button>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary gap-2'
                >
                  <Palette className='w-4 h-4' />
                  Theme
                </Button>
              </div>

              {/* Right Actions */}
              <div className='flex items-center gap-2'>
                {/* Settings for API Key */}
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => setShowAPIKeyDialog(true)}
                  className='h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary'
                  title='API Key Settings'
                >
                  <Settings className='w-5 h-5' />
                </Button>

                {/* Send Button */}
                <Button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isGenerating}
                  className='h-9 px-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground'
                >
                  {isGenerating ? (
                    <Sparkles className='w-5 h-5 animate-pulse' />
                  ) : (
                    <>
                      <Send className='w-4 h-4 mr-2' />
                      Send
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* API Key Dialog */}
      <Dialog open={showAPIKeyDialog} onOpenChange={setShowAPIKeyDialog}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Settings className='w-5 h-5' />
              API Key Setup
            </DialogTitle>
            <DialogDescription>
              Enter your VPN Enterprise AI API key to use NexusAI features.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid gap-2'>
              <Label htmlFor='api-key'>API Key</Label>
              <Input
                id='api-key'
                type='password'
                placeholder='vpn_...'
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className='font-mono text-sm'
              />
            </div>
            {hasApiKey && (
              <div className='flex items-center gap-2 text-sm text-green-600 dark:text-green-400'>
                <Check className='w-4 h-4' />
                API key is configured and active
              </div>
            )}
            <div className='p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm'>
              <p className='font-medium text-yellow-900 dark:text-yellow-200 mb-1'>
                Demo Key:
              </p>
              <code className='text-xs break-all text-yellow-800 dark:text-yellow-300'>
                vpn_U5zBa_Ze2a4g5zVcJgl1d9ZLXlDJs6uSOTtlO0QRnTg
              </code>
            </div>
          </div>
          <DialogFooter>
            <Button
              type='submit'
              onClick={handleSaveApiKey}
              disabled={!apiKey.trim()}
              className='w-full'
            >
              Save API Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

export default HeroSection
