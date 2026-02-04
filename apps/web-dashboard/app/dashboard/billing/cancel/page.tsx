'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  XCircle,
  ArrowLeft,
  HelpCircle,
  RefreshCw,
  MessageCircle,
} from 'lucide-react'
import { motion } from 'framer-motion'

export default function PaymentCancelPage() {
  const router = useRouter()

  const commonReasons = [
    {
      icon: '💳',
      title: 'Payment Method Issues',
      description: 'Card declined or insufficient funds',
      action: 'Update payment method',
    },
    {
      icon: '🔒',
      title: 'Security Concerns',
      description: 'Reviewing the purchase or site security',
      action: 'View our security policy',
    },
    {
      icon: '💭',
      title: 'Changed Your Mind',
      description: 'Need more time to decide',
      action: 'Compare plans',
    },
    {
      icon: '❓',
      title: 'Have Questions',
      description: 'Need clarification before purchasing',
      action: 'Contact support',
    },
  ]

  return (
    <div className='min-h-screen bg-linear-to-br from-orange-50 via-white to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900'>
      <div className='container mx-auto px-4 py-16'>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className='max-w-2xl mx-auto'
        >
          {/* Cancel Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className='flex justify-center mb-8'
          >
            <div className='relative'>
              <div className='absolute inset-0 bg-orange-500 blur-3xl opacity-20' />
              <XCircle className='w-24 h-24 text-orange-500 relative' />
            </div>
          </motion.div>

          {/* Main Cancel Card */}
          <Card className='border-2 border-orange-500/20 shadow-2xl'>
            <CardHeader className='text-center space-y-4 pb-4'>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <CardTitle className='text-4xl font-bold bg-linear-to-r from-orange-600 to-red-600 bg-clip-text text-transparent'>
                  Payment Cancelled
                </CardTitle>
                <p className='text-xl text-muted-foreground mt-2'>
                  Your payment was not processed
                </p>
              </motion.div>
            </CardHeader>

            <CardContent className='space-y-6'>
              {/* Info Message */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className='bg-linear-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 rounded-lg p-6 border border-orange-200 dark:border-orange-900'
              >
                <div className='flex items-start gap-3'>
                  <HelpCircle className='w-5 h-5 text-orange-600 mt-0.5 shrink-0' />
                  <div className='space-y-1'>
                    <p className='font-medium text-sm'>No charges were made</p>
                    <p className='text-sm text-muted-foreground'>
                      Your payment was cancelled before processing. No charges
                      have been applied to your payment method.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Common Reasons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className='space-y-4'
              >
                <h3 className='font-semibold text-lg'>
                  Common reasons for cancellation:
                </h3>
                <div className='grid gap-3'>
                  {commonReasons.map((reason, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className='flex items-start gap-3 p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-700 transition-colors'
                    >
                      <span className='text-2xl'>{reason.icon}</span>
                      <div className='flex-1'>
                        <h4 className='font-medium text-sm'>{reason.title}</h4>
                        <p className='text-xs text-muted-foreground'>
                          {reason.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className='flex flex-col sm:flex-row gap-3 pt-4'
              >
                <Button
                  onClick={() => router.push('/dashboard/billing')}
                  className='flex-1 bg-linear-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700'
                >
                  <RefreshCw className='w-4 h-4 mr-2' />
                  Try Again
                </Button>
                <Button
                  variant='outline'
                  onClick={() => router.push('/contact')}
                  className='flex-1'
                >
                  <MessageCircle className='w-4 h-4 mr-2' />
                  Contact Support
                </Button>
              </motion.div>

              {/* Additional Help */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className='space-y-3 pt-4 border-t'
              >
                <h3 className='font-semibold text-sm'>Need help deciding?</h3>
                <div className='grid gap-2 text-sm'>
                  <Button
                    variant='ghost'
                    className='justify-start h-auto py-2'
                    onClick={() => router.push('/dashboard/billing')}
                  >
                    <span className='text-left'>
                      📊 Compare all plans and features
                    </span>
                  </Button>
                  <Button
                    variant='ghost'
                    className='justify-start h-auto py-2'
                    onClick={() => router.push('/docs')}
                  >
                    <span className='text-left'>📖 Read our documentation</span>
                  </Button>
                  <Button
                    variant='ghost'
                    className='justify-start h-auto py-2'
                    onClick={() => router.push('/contact')}
                  >
                    <span className='text-left'>
                      💬 Chat with our sales team
                    </span>
                  </Button>
                </div>
              </motion.div>

              {/* Back to Dashboard Link */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1 }}
                className='text-center pt-4'
              >
                <Button
                  variant='ghost'
                  onClick={() => router.push('/dashboard')}
                  className='text-sm'
                >
                  <ArrowLeft className='w-4 h-4 mr-2' />
                  Back to Dashboard
                </Button>
              </motion.div>
            </CardContent>
          </Card>

          {/* Reassurance Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className='mt-8 text-center space-y-4'
          >
            <div className='bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700'>
              <h4 className='font-semibold mb-2'>
                Your security is our priority 🔒
              </h4>
              <p className='text-sm text-muted-foreground'>
                All payments are processed securely through Stripe. We never
                store your payment information on our servers.
              </p>
            </div>
            <p className='text-sm text-muted-foreground'>
              Questions?{' '}
              <a
                href='/contact'
                className='text-primary hover:underline font-medium'
              >
                We&apos;re here to help 24/7
              </a>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
