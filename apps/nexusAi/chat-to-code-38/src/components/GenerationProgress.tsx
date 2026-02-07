import { useEffect } from 'react'
import { Loader2, Check, AlertCircle } from 'lucide-react'
import { Progress } from './ui/progress'
import { Card, CardContent } from './ui/card'
import { cn } from '@/lib/utils'

interface GenerationProgressProps {
  isGenerating: boolean
  progress: number
  currentStep: string
  error: string | null
}

/**
 * Generation Progress Component
 * Shows live progress during app generation with animated steps
 */
export function GenerationProgress({
  isGenerating,
  progress,
  currentStep,
  error,
}: GenerationProgressProps) {
  if (!isGenerating && !error && progress !== 100) {
    return null
  }

  const steps = [
    { label: 'Analyzing requirements', threshold: 10 },
    { label: 'Generating code with AI', threshold: 30 },
    { label: 'Processing files', threshold: 60 },
    { label: 'Finalizing app', threshold: 90 },
    { label: 'Complete', threshold: 100 },
  ]

  const getCurrentStepIndex = () => {
    return steps.findIndex((step) => progress < step.threshold)
  }

  const currentStepIndex = getCurrentStepIndex()

  return (
    <Card
      className={cn(
        'border-2 transition-all duration-300',
        error && 'border-destructive bg-destructive/5',
        progress === 100 && !error && 'border-green-500 bg-green-500/5',
      )}
    >
      <CardContent className='pt-6'>
        {/* Header */}
        <div className='flex items-center gap-3 mb-4'>
          {error ? (
            <AlertCircle className='h-5 w-5 text-destructive' />
          ) : progress === 100 ? (
            <Check className='h-5 w-5 text-green-500' />
          ) : (
            <Loader2 className='h-5 w-5 animate-spin text-primary' />
          )}
          <div className='flex-1'>
            <h3 className='font-semibold'>
              {error
                ? 'Generation Failed'
                : progress === 100
                  ? 'Generation Complete!'
                  : 'Generating Your App'}
            </h3>
            <p className='text-sm text-muted-foreground'>
              {error || currentStep}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        {!error && (
          <div className='space-y-3'>
            <Progress value={progress} className='h-2' />
            <div className='text-sm text-right text-muted-foreground'>
              {progress}%
            </div>
          </div>
        )}

        {/* Steps */}
        {!error && (
          <div className='mt-4 space-y-2'>
            {steps.map((step, index) => {
              const isComplete = index < currentStepIndex || progress === 100
              const isCurrent = index === currentStepIndex && progress < 100
              const isPending = index > currentStepIndex && progress < 100

              return (
                <div
                  key={step.label}
                  className={cn(
                    'flex items-center gap-2 text-sm transition-all duration-200',
                    isComplete && 'text-green-600 dark:text-green-400',
                    isCurrent && 'text-primary font-medium',
                    isPending && 'text-muted-foreground',
                  )}
                >
                  {isComplete ? (
                    <Check className='h-4 w-4 flex-shrink-0' />
                  ) : isCurrent ? (
                    <Loader2 className='h-4 w-4 animate-spin flex-shrink-0' />
                  ) : (
                    <div className='h-4 w-4 rounded-full border-2 flex-shrink-0' />
                  )}
                  <span>{step.label}</span>
                </div>
              )
            })}
          </div>
        )}

        {/* Success Animation */}
        {progress === 100 && !error && (
          <div className='mt-4 text-center'>
            <div className='inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-600 dark:text-green-400'>
              <Check className='h-4 w-4' />
              <span className='text-sm font-medium'>App ready to use!</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
