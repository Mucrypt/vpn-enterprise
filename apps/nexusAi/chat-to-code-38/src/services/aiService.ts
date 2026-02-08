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
  name: string
  path: string
  content: string
  language: string
}

export interface MultiFileGenerateResponse {
  files: FileOutput[]
  instructions: string
  dependencies: Record<string, string>
  requires_database?: boolean
  database_schema?: string
  database_info?: {
    // Database connection credentials (from automatic provisioning)
    tenantId?: string
    database?: string
    host?: string
    port?: number
    username?: string
    password?: string
    connection_string?: string
    tables_created?: number
    status?: 'provisioned' | 'exists'
  }
  app_id?: string // Saved app ID (already persisted to database)
  deployment_config?: Record<string, any>
  provider_used?: string // AI provider that generated the code (e.g., "openai-gpt4o", "anthropic-claude")
  generation_time_ms?: number // Time taken to generate (milliseconds)
  tokens_used?: number // Total tokens consumed
}

// Async Job Queue Types
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed'
export type JobPhase = 'architecture' | 'frontend' | 'backend' | 'integration' | 'database'

export interface JobInfo {
  job_id: string
  status: JobStatus
  phase?: JobPhase
  progress_percent: number
  message: string
  created_at: string
  updated_at: string
  result?: MultiFileGenerateResponse
  error?: string
}

export interface AsyncJobResponse {
  job_id: string
  status: string
  message: string
  poll_url: string
}

export interface DeployAppRequest {
  app_name: string
  files: FileOutput[]
  dependencies: Record<string, string>
  framework: string
  requires_database: boolean
  user_id: string
}

export interface DeploymentResponse {
  deployment_id: string
  app_name: string
  status: string
  database?: {
    tenant_id: string
    database_name: string
    connection_string: string
  }
  hosting?: {
    service_id: string
    domain: string
    status: string
  }
  app_url?: string
  environment?: Record<string, string>
  steps: Array<{ step: string; status: string }>
  n8n?: {
    workflow_id: string
    execution_id: string
    webhook_url: string
  }
  slack?: {
    notification_sent: boolean
    channel: string
    message_ts?: string
  }
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

export interface AIProvider {
  name: 'openai' | 'anthropic' | 'auto'
  model: string
}

export interface DeploymentStatus {
  deployment_id: string
  status:
    | 'pending'
    | 'building'
    | 'deploying'
    | 'testing'
    | 'success'
    | 'failed'
  progress: number
  current_step: string
  logs: string[]
  error?: string
}

export interface NotificationStatus {
  slack_sent: boolean
  channel: string
  message: string
  timestamp: string
}

export class AIService {
  private apiKey: string | null = null
  private baseURL: string
  private n8nWebhookURL: string

  constructor(apiKey?: string, usePublicAPI = true) {
    // Default to public API for browser usage
    this.apiKey = apiKey || this.getStoredAPIKey()
    this.baseURL = usePublicAPI ? PUBLIC_API_URL : AI_API_URL
    this.n8nWebhookURL =
      import.meta.env.VITE_N8N_WEBHOOK_URL || 'http://localhost:5678/webhook'
  }

  // Trigger N8N webhook for notifications (Slack integration)
  private async triggerN8NWebhook(
    webhookName: string,
    payload: any,
  ): Promise<void> {
    try {
      const response = await fetch(`${this.n8nWebhookURL}/${webhookName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        console.warn(`N8N webhook ${webhookName} failed:`, response.statusText)
      }
    } catch (error) {
      console.warn(`N8N webhook ${webhookName} error:`, error)
    }
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
  // Uses BOTH OpenAI GPT-4o AND Anthropic Claude 3.7 Sonnet
  // Auto-routes: Claude for backend, GPT-4o for frontend (best of both worlds)
  async generateFullApp(
    request: MultiFileGenerateRequest,
    provider?: AIProvider,
  ): Promise<MultiFileGenerateResponse> {
    const response = await fetch(`${this.baseURL}/generate/app`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        description: request.description,
        framework: request.framework || 'react',
        features: request.features || [],
        styling: request.styling || 'tailwind',
        provider: provider?.name || 'auto', // Auto-routing: Claude (backend) + GPT-4o (frontend)
        model: provider?.model || 'auto',
        enable_slack: true, // Enable Slack notifications via N8N
        enable_monitoring: true, // Enable Prometheus metrics
      }),
    })

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: 'Unknown error' }))
      throw new Error(error.detail || `API Error: ${response.status}`)
    }

    const result = await response.json()

    // Trigger N8N webhook for app generation notification
    this.triggerN8NWebhook('nexusai-app-generated', {
      app_name: request.description.substring(0, 50),
      framework: request.framework,
      files_count: result.files?.length || 0,
      timestamp: new Date().toISOString(),
    }).catch((err) => console.warn('N8N webhook failed:', err))

    return result
  }

  // Generate FULL-STACK application (Frontend + Backend API + Postman Collection)
  // Uses DUAL-AI system: Claude for architecture, GPT-4 for code generation
  // MORE POWERFUL than Cursor, Lovable, or Bolt!
  /**
   * Poll job status every 2 seconds until completed or failed
   */
  private async pollJobStatus(
    jobId: string,
    onProgress?: (jobInfo: JobInfo) => void,
  ): Promise<MultiFileGenerateResponse> {
    const maxAttempts = 180 // 6 minutes max (180 * 2s = 360s)
    let attempts = 0

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`${this.baseURL}/jobs/${jobId}`, {
          headers: this.getHeaders(),
        })

        if (!response.ok) {
          throw new Error(`Polling failed: ${response.status}`)
        }

        const jobInfo: JobInfo = await response.json()

        // Call progress callback
        if (onProgress) {
          onProgress(jobInfo)
        }

        // Check if completed
        if (jobInfo.status === 'completed' && jobInfo.result) {
          return jobInfo.result
        }

        // Check if failed
        if (jobInfo.status === 'failed') {
          throw new Error(jobInfo.error || 'Generation failed')
        }

        // Wait 2 seconds before next poll
        await new Promise((resolve) => setTimeout(resolve, 2000))
        attempts++
      } catch (error) {
        console.error('Polling error:', error)
        throw error
      }
    }

    throw new Error('Generation timeout: Job took longer than expected')
  }

  /**
   * Generate full-stack app using async job queue
   * Returns immediately with job_id, then polls for completion
   */
  async generateFullStackApp(
    request: MultiFileGenerateRequest,
    onProgress?: (jobInfo: JobInfo) => void,
  ): Promise<MultiFileGenerateResponse> {
    // Create async job
    const response = await fetch(`${this.baseURL}/generate/fullstack/async`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        description: request.description,
        framework: request.framework || 'react',
        features: request.features || [],
        styling: request.styling || 'tailwind',
        include_database: true,
        include_auth: true,
        include_api: true,
      }),
    })

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: 'Unknown error' }))
      throw new Error(error.detail || `API Error: ${response.status}`)
    }

    const asyncResponse: AsyncJobResponse = await response.json()
    const jobId = asyncResponse.job_id

    console.log(`✅ Job ${jobId} created, polling for completion...`)

    // Poll for completion
    const result = await this.pollJobStatus(jobId, onProgress)

    // Trigger N8N webhook
    this.triggerN8NWebhook('nexusai-app-generated', {
      app_name: request.description.substring(0, 50),
      framework: request.framework,
      files_count: result.files?.length || 0,
      fullstack_mode: true,
      timestamp: new Date().toISOString(),
    }).catch((err) => console.warn('N8N webhook failed:', err))

    return result
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

  // Deploy app to VPN Enterprise Platform with N8N automation
  async deployApp(request: DeployAppRequest): Promise<DeploymentResponse> {
    const response = await fetch(`${this.baseURL}/deploy/app`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        ...request,
        enable_n8n: true, // Enable N8N automated deployment
        enable_slack: true, // Send Slack notifications
      }),
    })

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: 'Deployment failed' }))

      // Trigger N8N error webhook
      this.triggerN8NWebhook('nexusai-error', {
        error_type: 'deployment_failed',
        app_name: request.app_name,
        error_message: error.detail || 'Unknown deployment error',
        timestamp: new Date().toISOString(),
      }).catch((err) => console.warn('N8N error webhook failed:', err))

      throw new Error(error.detail || `Deployment Error: ${response.status}`)
    }

    const result = await response.json()

    // Trigger N8N deployment webhook
    this.triggerN8NWebhook('nexusai-deploy', {
      app_name: request.app_name,
      deployment_id: result.deployment_id,
      status: result.status,
      app_url: result.app_url,
      timestamp: new Date().toISOString(),
    }).catch((err) => console.warn('N8N deployment webhook failed:', err))

    return result
  }

  // Get deployment status (polls N8N workflow execution)
  async getDeploymentStatus(deploymentId: string): Promise<DeploymentStatus> {
    const response = await fetch(
      `${this.baseURL}/deploy/status/${deploymentId}`,
      {
        method: 'GET',
        headers: this.getHeaders(),
      },
    )

    if (!response.ok) {
      throw new Error(`Failed to get deployment status: ${response.status}`)
    }

    return response.json()
  }

  // Get AI provider info (shows which AI is being used)
  async getAIProviderInfo(): Promise<{
    providers: Array<{ name: string; model: string; status: string }>
    routing_strategy: string
  }> {
    const response = await fetch(`${this.baseURL}/ai/providers`, {
      method: 'GET',
      headers: this.getHeaders(),
    })

    if (!response.ok) {
      return {
        providers: [
          { name: 'OpenAI', model: 'gpt-4o', status: 'available' },
          {
            name: 'Anthropic',
            model: 'claude-3-7-sonnet-20250219',
            status: 'available',
          },
        ],
        routing_strategy: 'auto',
      }
    }

    return response.json()
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
    generateFullStackApp: (req: MultiFileGenerateRequest) =>
      service.generateFullStackApp(req),
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

    // Platform deployment
    deployApp: (req: DeployAppRequest) => service.deployApp(req),

    // API key management
    setAPIKey: (key: string) => service.setAPIKey(key),
    clearAPIKey: () => service.clearAPIKey(),
  }
}
