import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Plus,
  Paperclip,
  Palette,
  Send,
  Code,
  Database,
  Sparkles,
  Zap,
  Rocket,
  Terminal,
  Cloud,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { aiService, AIService } from '@/services/aiService'

const HeroSection = () => {
  const navigate = useNavigate()
  const [inputValue, setInputValue] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

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
    if (!inputValue.trim() || isGenerating) return

    const userMessage = inputValue
    setIsGenerating(true)

    // Redirect to App Description page with the prompt pre-filled
    navigate('/describe', { state: { initialPrompt: userMessage } })
  }

  return (
    <section className='relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-16 pb-24'>
      {/* Background gradient effect */}
      <div className='absolute inset-0 bg-gradient-to-br from-background via-primary/5 to-purple-600/10' />
      <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent' />
      <div className='absolute inset-0 bg-gradient-hero animate-pulse-glow opacity-20' />

      {/* Content */}
      <div className='container mx-auto px-6 relative z-10 flex flex-col items-center text-center'>
        {/* Promotional Badge */}
        <div className='mb-8 animate-fade-up'>
          <div className='inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border-2 border-primary/20'>
            <span className='text-lg'>🚀</span>
            <span className='text-sm font-medium text-primary'>
              More Powerful Than Cursor & Lovable Combined
            </span>
            <Sparkles className='w-4 h-4 text-primary' />
          </div>
        </div>

        {/* Main Headline */}
        <h1
          className='text-5xl md:text-6xl lg:text-8xl font-bold leading-tight mb-6 animate-fade-up'
          style={{ animationDelay: '0.1s' }}
        >
          Build. Preview. Deploy.
          <br />
          <span className='bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent'>
            All in One Place.
          </span>
        </h1>

        {/* Subtitle */}
        <p
          className='text-xl md:text-2xl text-muted-foreground mb-4 max-w-3xl animate-fade-up'
          style={{ animationDelay: '0.2s' }}
        >
          Generate full-stack apps with AI, preview them live, and deploy to
          your own platform
        </p>
        <p
          className='text-lg text-muted-foreground/80 mb-10 max-w-2xl animate-fade-up'
          style={{ animationDelay: '0.3s' }}
        >
          Complete with automatic database provisioning, hosting, and live URLs
          - all without leaving your browser
        </p>

        {/* CTA Buttons */}
        <div
          className='flex flex-col sm:flex-row gap-4 mb-12 animate-fade-up'
          style={{ animationDelay: '0.4s' }}
        >
          <Link to='/describe'>
            <Button
              size='lg'
              className='group text-lg px-8 py-6 bg-gradient-to-r from-primary to-purple-600 text-white hover:opacity-90 shadow-lg hover:shadow-xl transition-all'
            >
              <Rocket className='mr-2 h-5 w-5 group-hover:translate-y-[-2px] transition-transform' />
              Launch Builder
            </Button>
          </Link>
          <Button
            size='lg'
            variant='outline'
            className='text-lg px-8 py-6 border-2'
          >
            <Eye className='mr-2 h-5 w-5' />
            Watch Demo
          </Button>
        </div>

        {/* Feature Highlights */}
        <div
          className='grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mb-16 animate-fade-up'
          style={{ animationDelay: '0.5s' }}
        >
          <div className='flex flex-col items-center p-4 rounded-lg bg-background/50 border border-primary/20 hover:border-primary/40 transition-colors'>
            <Code className='h-8 w-8 text-primary mb-2' />
            <span className='text-sm font-medium'>AI Generation</span>
          </div>
          <div className='flex flex-col items-center p-4 rounded-lg bg-background/50 border border-purple-500/20 hover:border-purple-500/40 transition-colors'>
            <Eye className='h-8 w-8 text-purple-500 mb-2' />
            <span className='text-sm font-medium'>Live Preview</span>
          </div>
          <div className='flex flex-col items-center p-4 rounded-lg bg-background/50 border border-pink-500/20 hover:border-pink-500/40 transition-colors'>
            <Terminal className='h-8 w-8 text-pink-500 mb-2' />
            <span className='text-sm font-medium'>Terminal</span>
          </div>
          <div className='flex flex-col items-center p-4 rounded-lg bg-background/50 border border-green-500/20 hover:border-green-500/40 transition-colors'>
            <Cloud className='h-8 w-8 text-green-500 mb-2' />
            <span className='text-sm font-medium'>One-Click Deploy</span>
          </div>
        </div>

        {/* CTA Button - App Builder */}
        <div
          className='mb-16 animate-fade-up'
          style={{ animationDelay: '0.25s' }}
        >
          <Link to='/describe'>
            <Button
              size='lg'
              className='gap-2 text-lg px-10 py-7 rounded-xl shadow-2xl hover:shadow-primary/50 transition-all hover:scale-105 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90'
            >
              <Zap className='w-6 h-6' />
              Try Full App Builder
              <ArrowRight className='w-6 h-6' />
            </Button>
          </Link>
          <p className='text-sm text-muted-foreground mt-4 font-medium'>
            Generate complete applications like Cursor and Lovable
          </p>
        </div>

        {/* Chat Input Box */}
        <div
          className='w-full max-w-5xl mb-24 animate-scale-in'
          style={{ animationDelay: '0.3s' }}
        >
          {/* Example Prompts */}
          {!isGenerating && (
            <div className='mb-6 flex flex-wrap gap-3 justify-center'>
              <Button
                variant='outline'
                size='sm'
                onClick={() =>
                  setInputValue('Create a todo app with React and TypeScript')
                }
                className='text-xs hover:bg-primary/10 hover:border-primary/50 transition-all hover:scale-105'
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
                className='text-xs hover:bg-purple-500/10 hover:border-purple-500/50 transition-all hover:scale-105'
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
                className='text-xs hover:bg-pink-500/10 hover:border-pink-500/50 transition-all hover:scale-105'
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
                className='text-xs hover:bg-green-500/10 hover:border-green-500/50 transition-all hover:scale-105'
              >
                <Code className='w-3 h-3 mr-1' />
                Blog API
              </Button>
            </div>
          )}

          <div className='bg-card/80 backdrop-blur-md rounded-3xl border-2 border-border hover:border-primary/50 shadow-2xl overflow-hidden transition-all hover:shadow-primary/20'>
            {/* Input Area */}
            <div className='p-6'>
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder='Ask NexusAI to create anything... Try "Build a todo app" or "Create a login form"'
                className='w-full bg-transparent text-foreground placeholder:text-muted-foreground text-lg resize-none focus:outline-none min-h-[80px] font-medium'
                rows={3}
                disabled={isGenerating}
                autoFocus
              />
            </div>

            {/* Bottom Toolbar */}
            <div className='flex items-center justify-between px-6 pb-6 border-t border-border/50 pt-4'>
              {/* Left Actions */}
              <div className='flex items-center gap-3'>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all hover:scale-105'
                  disabled={isGenerating}
                >
                  <Plus className='w-5 h-5' />
                </Button>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-10 px-4 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/80 gap-2 transition-all hover:scale-105'
                  disabled={isGenerating}
                >
                  <Paperclip className='w-4 h-4' />
                  Attach
                </Button>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-10 px-4 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/80 gap-2 transition-all hover:scale-105'
                  disabled={isGenerating}
                >
                  <Palette className='w-4 h-4' />
                  Theme
                </Button>
              </div>

              {/* Right Actions */}
              <div className='flex items-center gap-3'>
                <span className='text-xs text-muted-foreground'>
                  {isGenerating ? 'Generating...' : 'Press Enter to send'}
                </span>
                {/* Send Button */}
                <Button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isGenerating}
                  className='h-10 px-6 rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-primary-foreground shadow-lg hover:shadow-primary/50 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {isGenerating ? (
                    <>
                      <Sparkles className='w-5 h-5 mr-2 animate-pulse' />
                      Generating
                    </>
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
    </section>
  )
}

export default HeroSection
