import { useState, useCallback } from 'react'
import { useToast } from './use-toast'
import { useSlackNotification } from './use-slack-notification'
import { triggerNotification } from './use-notifications'
import {
  aiService,
  type MultiFileGenerateRequest,
  type MultiFileGenerateResponse,
} from '@/services/aiService'

interface GenerationState {
  isGenerating: boolean
  progress: number
  currentStep: string
  error: string | null
}

interface UseAppGenerationReturn extends GenerationState {
  generateApp: (
    request: MultiFileGenerateRequest,
  ) => Promise<MultiFileGenerateResponse | null>
  reset: () => void
}

/**
 * Hook for app generation with integrated notifications
 * Sends progress updates to Slack and in-app notifications
 */
export function useAppGeneration(): UseAppGenerationReturn {
  const { toast } = useToast()
  const { notifyAppGenerated, notifyError } = useSlackNotification()

  const [state, setState] = useState<GenerationState>({
    isGenerating: false,
    progress: 0,
    currentStep: '',
    error: null,
  })

  const updateProgress = useCallback((progress: number, step: string) => {
    setState((prev) => ({ ...prev, progress, currentStep: step }))
  }, [])

  const generateApp = useCallback(
    async (
      request: MultiFileGenerateRequest,
    ): Promise<MultiFileGenerateResponse | null> => {
      setState({
        isGenerating: true,
        progress: 0,
        currentStep: 'Initializing...',
        error: null,
      })

      try {
        // Step 1: Start generation
        updateProgress(10, 'Analyzing requirements...')

        triggerNotification({
          type: 'info',
          title: 'App Generation Started',
          message: `Generating ${request.framework} app: ${request.description}`,
        })

        // Step 2: Call AI service
        updateProgress(30, 'Generating code with AI...')
        const result = await aiService.generateFullApp(request)

        // Step 3: Processing files
        updateProgress(60, `Processing ${result.files.length} files...`)

        // Simulate file processing delay
        await new Promise((resolve) => setTimeout(resolve, 500))

        // Step 4: Complete
        updateProgress(100, 'Complete!')

        // Success notification
        toast({
          title: '✅ App Generated Successfully',
          description: `Generated ${result.files.length} files for your ${request.framework} app`,
        })

        triggerNotification({
          type: 'success',
          title: 'App Generated',
          message: `Your ${request.framework} app is ready with ${result.files.length} files`,
          actionUrl: '/nexusai/my-apps',
          actionLabel: 'View Apps',
        })

        // Send to Slack if available
        const userEmail = localStorage.getItem('user_email') || 'anonymous'
        notifyAppGenerated({
          app_id: `app-${Date.now()}`,
          app_name: request.description,
          framework: request.framework || 'react',
          user_email: userEmail,
          files: result.files,
          credits_used: Math.ceil(result.files.length * 2.5), // Estimate
        }).catch((err) => console.warn('Slack notification failed:', err))

        setState((prev) => ({ ...prev, isGenerating: false }))
        return result
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error'

        setState({
          isGenerating: false,
          progress: 0,
          currentStep: '',
          error: errorMessage,
        })

        toast({
          title: '❌ Generation Failed',
          description: errorMessage,
          variant: 'destructive',
        })

        triggerNotification({
          type: 'error',
          title: 'App Generation Failed',
          message: errorMessage,
        })

        // Send error to Slack
        notifyError({
          title: 'App Generation Error',
          error: errorMessage,
          context: {
            request,
            timestamp: new Date().toISOString(),
          },
        }).catch((err) => console.warn('Slack error notification failed:', err))

        return null
      }
    },
    [toast, notifyAppGenerated, notifyError, updateProgress],
  )

  const reset = useCallback(() => {
    setState({
      isGenerating: false,
      progress: 0,
      currentStep: '',
      error: null,
    })
  }, [])

  return {
    ...state,
    generateApp,
    reset,
  }
}
