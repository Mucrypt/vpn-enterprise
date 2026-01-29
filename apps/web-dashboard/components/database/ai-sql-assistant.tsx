'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Sparkles, Send, Copy, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AiSqlAssistantProps {
  activeTenant: string
  onQueryGenerated: (sql: string) => void
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  sql?: string
}

export function AiSqlAssistant({
  activeTenant,
  onQueryGenerated,
}: AiSqlAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Hi! I'm your AI SQL assistant. I can help you write queries, optimize SQL, explain complex queries, or generate test data. What would you like to do?",
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      // TODO: Replace with actual AI API call (OpenAI, Anthropic, etc.)
      // For now, simulate with basic pattern matching
      const response = await simulateAiResponse(userMessage, activeTenant)
      setMessages((prev) => [...prev, response])
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (
    <div className='flex flex-col h-full bg-[#1e1e1e]'>
      {/* Header */}
      <div className='flex items-center gap-2 p-4 border-b border-[#2d2d30]'>
        <div className='w-8 h-8 bg-linear-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center'>
          <Sparkles className='h-4 w-4 text-white' />
        </div>
        <div>
          <h2 className='font-semibold text-white text-sm'>AI SQL Assistant</h2>
          <p className='text-xs text-gray-400'>Powered by AI</p>
        </div>
      </div>

      {/* Messages */}
      <div className='flex-1 overflow-y-auto p-4 space-y-4 scrollbar scrollbar--neutral'>
        {messages.map((message, index) => (
          <div
            key={index}
            className={cn(
              'flex gap-3',
              message.role === 'user' ? 'justify-end' : 'justify-start',
            )}
          >
            {message.role === 'assistant' && (
              <div className='w-8 h-8 bg-linear-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shrink-0'>
                <Sparkles className='h-4 w-4 text-white' />
              </div>
            )}
            <div
              className={cn(
                'max-w-[80%] rounded-lg p-3',
                message.role === 'user'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#2d2d30] text-gray-200',
              )}
            >
              <p className='text-sm whitespace-pre-wrap'>{message.content}</p>
              {message.sql && (
                <div className='mt-3 relative'>
                  <pre className='p-3 bg-[#1e1e1e] rounded text-xs font-mono overflow-x-auto text-gray-300'>
                    {message.sql}
                  </pre>
                  <div className='flex gap-2 mt-2'>
                    <Button
                      size='sm'
                      onClick={() => copyToClipboard(message.sql!, index)}
                      className='bg-[#3e3e42] hover:bg-[#4e4e52] text-white h-7 text-xs'
                    >
                      {copiedIndex === index ? (
                        <>
                          <Check className='h-3 w-3 mr-1' /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className='h-3 w-3 mr-1' /> Copy
                        </>
                      )}
                    </Button>
                    <Button
                      size='sm'
                      onClick={() => onQueryGenerated(message.sql!)}
                      className='bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs'
                    >
                      Use Query
                    </Button>
                  </div>
                </div>
              )}
            </div>
            {message.role === 'user' && (
              <div className='w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shrink-0'>
                <span className='text-white text-sm font-medium'>U</span>
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className='flex gap-3 justify-start'>
            <div className='w-8 h-8 bg-linear-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shrink-0'>
              <Sparkles className='h-4 w-4 text-white' />
            </div>
            <div className='bg-[#2d2d30] text-gray-200 rounded-lg p-3'>
              <Loader2 className='h-4 w-4 animate-spin' />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className='p-4 border-t border-[#2d2d30]'>
        <div className='flex gap-2'>
          <input
            type='text'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask me anything... (e.g., 'Create a users table with email')"
            className='flex-1 bg-[#2d2d30] border border-[#3e3e42] rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500'
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className='bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
          >
            <Send className='h-4 w-4' />
          </Button>
        </div>
        <p className='text-xs text-gray-500 mt-2'>
          💡 Try: "Show me all users", "Create a posts table", "Optimize this
          query"
        </p>
      </div>
    </div>
  )
}

// Simulate AI response (replace with actual AI API)
async function simulateAiResponse(
  userInput: string,
  tenantId: string,
): Promise<Message> {
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const input = userInput.toLowerCase()

  // Create table patterns
  if (input.includes('create') && input.includes('table')) {
    const tableName = input.match(/table\s+(\w+)/)?.[1] || 'my_table'
    return {
      role: 'assistant',
      content: `I'll help you create the "${tableName}" table. Here's a well-structured SQL statement with common columns:`,
      sql: `CREATE TABLE ${tableName} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_${tableName}_created_at ON ${tableName}(created_at);`,
    }
  }

  // Select patterns
  if (
    input.includes('show') ||
    input.includes('select') ||
    input.includes('get')
  ) {
    return {
      role: 'assistant',
      content: "Here's an optimized SELECT query with common best practices:",
      sql: `SELECT 
  id,
  email,
  name,
  created_at
FROM users
WHERE created_at > NOW() - INTERVAL '30 days'
ORDER BY created_at DESC
LIMIT 100;`,
    }
  }

  // Optimization
  if (input.includes('optimize') || input.includes('performance')) {
    return {
      role: 'assistant',
      content:
        "Here are some optimization suggestions:\n\n1. Add indexes on frequently queried columns\n2. Use LIMIT clauses to reduce result sets\n3. Avoid SELECT * - specify needed columns\n4. Use JOIN instead of subqueries when possible\n\nHere's an example of an optimized query:",
      sql: `-- Add index first
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Optimized query
SELECT id, email, name 
FROM users 
WHERE email = $1
LIMIT 1;`,
    }
  }

  // Default response
  return {
    role: 'assistant',
    content:
      'I can help you with:\n\n• Writing SQL queries\n• Creating tables with best practices\n• Optimizing existing queries\n• Explaining complex SQL\n• Generating test data\n\nWhat would you like me to help with?',
  }
}
