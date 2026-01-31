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
      // Call Flask AI API
      const response = await fetch('https://python-api.chatbuilds.com/ai/sql/assist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: userMessage,
          schema: activeTenant,
          action: detectAction(userMessage),
        }),
      })

      if (!response.ok) {
        throw new Error('AI service error')
      }

      const data = await response.json()
      
      // Build assistant message
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.explanation || 'Here\'s what I generated:',
        sql: data.sql || undefined,
      }
      
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('AI error:', error)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, the AI service is currently unavailable. Please try again later.',
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

// Detect what action the user wants based on their input
function detectAction(userInput: string): 'generate' | 'explain' | 'optimize' | 'fix' {
  const input = userInput.toLowerCase()
  
  if (input.includes('explain') || input.includes('what does') || input.includes('how does')) {
    return 'explain'
  }
  
  if (input.includes('optimize') || input.includes('improve') || input.includes('faster') || input.includes('performance')) {
    return 'optimize'
  }
  
  if (input.includes('fix') || input.includes('error') || input.includes('broken') || input.includes('not working')) {
    return 'fix'
  }
  
  // Default to generate
  return 'generate'
}
