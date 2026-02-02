// AI Service Integration for NexusAI
// Connects to VPN Enterprise Production AI API

import { useState } from 'react'

const AI_API_URL =
  import.meta.env.VITE_AI_API_URL || 'http://vpn-python-api:5001'
const PUBLIC_API_URL =
  import.meta.env.VITE_PUBLIC_AI_API_URL || 'https://chatbuilds.com/api/ai'

export interface AIGenerateRequest {
  prompt: string
  model?: string
  temperature?: number
  max_tokens?: number
  num_ctx?: number // Context window size
  stream?: boolean
}

export interface AIGenerateResponse {
  response: string
  model: string
  cached: boolean
  eval_count?: number
  total_duration_ms?: number
}

export interface MultiFileGenerateRequest {
  description: string
  framework?: 'react' | 'vue' | 'angular' | 'nextjs' | 'express' | 'fastapi'
  features?: string[]
  styling?: 'tailwind' | 'css' | 'styled-components' | 'sass'
}

export interface FileOutput {
  path: string
  content: string
  language: string
}

export interface MultiFileGenerateResponse {
  files: FileOutput[]
  instructions: string
  dependencies: Record<string, string>
}

export interface SQLAssistRequest {
  query: string
  action: 'generate' | 'explain' | 'optimize' | 'fix'
  schema?: string
  sql?: string
}

export interface SQLAssistResponse {
  sql?: string
  explanation?: string
  optimized?: string
  fixed?: string
  suggestions?: string[]
}

export interface UsageStats {
  requests_used: number
  requests_limit: number
  requests_remaining: number
  window_reset: string
}

export class AIService {
  private apiKey: string | null = null
  private baseURL: string

  constructor(apiKey?: string, usePublicAPI = true) {
    // Default to public API for browser usage
    this.apiKey = apiKey || this.getStoredAPIKey()
    this.baseURL = usePublicAPI ? PUBLIC_API_URL : AI_API_URL
  }

  // Store API key in localStorage
  setAPIKey(key: string) {
    this.apiKey = key
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexusai_api_key', key)
    }
  }

  // Retrieve API key from localStorage
  private getStoredAPIKey(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('nexusai_api_key')
  }

  // Clear stored API key
  clearAPIKey() {
    this.apiKey = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nexusai_api_key')
    }
  }

  // Get request headers with authentication
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey
    }

    return headers
  }

  // Generate AI text/code
  async generate(request: AIGenerateRequest): Promise<AIGenerateResponse> {
    const response = await fetch(`${this.baseURL}/generate`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        prompt: request.prompt,
        model: request.model || 'deepseek-coder-v2:16b',
        temperature: request.temperature || 0.7,
        max_tokens: request.max_tokens || 4096,
        num_ctx: request.num_ctx || 32768,
      }),
    })

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: 'Unknown error' }))
      throw new Error(error.detail || `API Error: ${response.status}`)
    }

    return response.json()
  }

  // Generate full application with multiple files (MORE POWERFUL than Cursor/Lovable)
  // Uses OpenAI GPT-4o or Anthropic Claude 3.7 Sonnet
  async generateFullApp(
    request: MultiFileGenerateRequest,
  ): Promise<MultiFileGenerateResponse> {
    const response = await fetch(`${this.baseURL}/generate/app`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        description: request.description,
        framework: request.framework || 'react',
        features: request.features || [],
        styling: request.styling || 'tailwind',
        provider: 'openai', // Use OpenAI GPT-4o by default (more powerful than any local model)
        model: 'gpt-4o', // GPT-4o is excellent for code generation
      }),
    })

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: 'Unknown error' }))
      throw new Error(error.detail || `API Error: ${response.status}`)
    }

    return response.json()
  }

  // SQL assistance (generate, explain, optimize, fix)
  async sqlAssist(request: SQLAssistRequest): Promise<SQLAssistResponse> {
    const response = await fetch(`${this.baseURL}/sql/assist`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: 'Unknown error' }))
      throw new Error(error.detail || `API Error: ${response.status}`)
    }

    return response.json()
  }

  // Get usage statistics (not implemented in FastAPI yet)
  async getUsage(): Promise<UsageStats> {
    // Placeholder - FastAPI doesn't have /usage endpoint yet
    return {
      requests_used: 0,
      requests_limit: 100,
      requests_remaining: 100,
      window_reset: new Date(Date.now() + 3600000).toISOString(),
    }
  }

  // List available AI models
  async listModels(): Promise<string[]> {
    const response = await fetch(`${this.baseURL}/models`, {
      method: 'GET',
      headers: this.getHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status}`)
    }

    const data = await response.json()
    return data.models || []
  }

  // Verify API key is valid
  async verifyAPIKey(): Promise<boolean> {
    if (!this.apiKey) return false

    try {
      await this.listModels()
      return true
    } catch {
      return false
    }
  }

  // ============================================
  // NEXUSAI SPECIFIC METHODS
  // ============================================

  // Generate React component code
  async generateComponent(description: string): Promise<string> {
    const prompt = `Generate a React component with TypeScript based on this description:

${description}

Requirements:
- Use React hooks (useState, useEffect, etc.)
- Include TypeScript types
- Use Tailwind CSS for styling
- Add proper error handling
- Include JSDoc comments
- Make it production-ready

Return only the component code, no explanations.`

    const response = await this.generate({ prompt, max_tokens: 2000 })
    return response.response
  }

  // Generate full app structure
  async generateApp(description: string): Promise<{
    components: Array<{ name: string; code: string }>
    routes: string[]
    description: string
  }> {
    const prompt = `Create a complete React application structure for:

${description}

Generate:
1. List of component names needed
2. Routes for the app
3. Component hierarchy
4. Brief description of each component's purpose

Format response as JSON.`

    const response = await this.generate({ prompt, max_tokens: 2000 })
    return JSON.parse(response.response)
  }

  // Generate database schema
  async generateDatabaseSchema(description: string): Promise<string> {
    const request: SQLAssistRequest = {
      query: `Create a complete PostgreSQL database schema for: ${description}. Include tables, relationships, indexes, and constraints.`,
      action: 'generate',
    }

    const response = await this.sqlAssist(request)
    return response.sql || ''
  }

  // Explain code
  async explainCode(code: string): Promise<string> {
    const prompt = `Explain what this code does in simple terms:

\`\`\`
${code}
\`\`\`

Include:
- Purpose and functionality
- Key components and their roles
- Potential improvements`

    const response = await this.generate({ prompt, max_tokens: 1000 })
    return response.response
  }

  // Fix code errors
  async fixCode(code: string, error: string): Promise<string> {
    const prompt = `Fix this code that's producing an error:

**Code:**
\`\`\`
${code}
\`\`\`

**Error:**
${error}

Return only the fixed code, no explanations.`

    const response = await this.generate({ prompt, max_tokens: 2000 })
    return response.response
  }

  // Optimize code
  async optimizeCode(code: string): Promise<string> {
    const prompt = `Optimize this code for better performance and readability:

\`\`\`
${code}
\`\`\`

Return only the optimized code with inline comments explaining key improvements.`

    const response = await this.generate({ prompt, max_tokens: 2000 })
    return response.response
  }

  // Generate API endpoints
  async generateAPI(description: string): Promise<string> {
    const prompt = `Generate Express.js API endpoints for:

${description}

Include:
- Route handlers with TypeScript
- Input validation
- Error handling
- Response formatting
- Example request/response

Return only the code.`

    const response = await this.generate({ prompt, max_tokens: 2000 })
    return response.response
  }

  // Code completion
  async completeCode(code: string, cursor: number): Promise<string> {
    const before = code.substring(0, cursor)
    const after = code.substring(cursor)

    const prompt = `Complete this code at the cursor position (marked by |):

\`\`\`
${before}|${after}
\`\`\`

Return only the completion text that should be inserted at the cursor, no explanations.`

    const response = await this.generate({
      prompt,
      max_tokens: 500,
      temperature: 0.3, // Lower temperature for more predictable completions
    })

    return response.response
  }
}

// Export singleton instance
export const aiService = new AIService()

// Export hook for React components
export function useAI(apiKey?: string) {
  const [service] = useState(() => new AIService(apiKey, true)) // Use public API for client-side

  return {
    generate: (req: AIGenerateRequest) => service.generate(req),
    generateFullApp: (req: MultiFileGenerateRequest) =>
      service.generateFullApp(req),
    sqlAssist: (req: SQLAssistRequest) => service.sqlAssist(req),
    getUsage: () => service.getUsage(),
    listModels: () => service.listModels(),
    verifyAPIKey: () => service.verifyAPIKey(),

    // NexusAI specific
    generateComponent: (desc: string) => service.generateComponent(desc),
    generateApp: (desc: string) => service.generateApp(desc),
    generateDatabaseSchema: (desc: string) =>
      service.generateDatabaseSchema(desc),
    explainCode: (code: string) => service.explainCode(code),
    fixCode: (code: string, error: string) => service.fixCode(code, error),
    optimizeCode: (code: string) => service.optimizeCode(code),
    generateAPI: (desc: string) => service.generateAPI(desc),
    completeCode: (code: string, cursor: number) =>
      service.completeCode(code, cursor),

    // API key management
    setAPIKey: (key: string) => service.setAPIKey(key),
    clearAPIKey: () => service.clearAPIKey(),
  }
}
