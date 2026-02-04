'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  CheckCircle,
  Loader2,
  Sparkles,
  Download,
  ArrowRight,
} from 'lucide-react'
import { motion } from 'framer-motion'
import Confetti from 'react-confetti'

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [verifying, setVerifying] = useState(true)
  const [paymentDetails, setPaymentDetails] = useState<{
    type: 'subscription' | 'credits'
    amount: string
    planName?: string
    credits?: number
  } | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })

  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }
  }, [])

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        router.push('/dashboard/billing')
        return
      }

      try {
        // Verify payment with backend
        const response = await fetch(
          `/api/v1/billing/verify-payment?session_id=${sessionId}`,
        )

        if (response.ok) {
          const data = await response.json()
          setPaymentDetails(data)
          setShowConfetti(true)

          // Stop confetti after 5 seconds
          setTimeout(() => setShowConfetti(false), 5000)
        }
      } catch (error) {
        console.error('Payment verification error:', error)
      } finally {
        setVerifying(false)
      }
    }

    verifyPayment()
  }, [sessionId, router])

  if (verifying) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900'>
        <Card className='w-full max-w-md mx-4'>
          <CardContent className='pt-6 text-center'>
            <Loader2 className='w-16 h-16 mx-auto mb-4 animate-spin text-primary' />
            <h2 className='text-2xl font-bold mb-2'>Verifying Payment</h2>
            <p className='text-muted-foreground'>
              Please wait while we confirm your payment...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900'>
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.3}
        />
      )}

      <div className='container mx-auto px-4 py-16'>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className='max-w-2xl mx-auto'
        >
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className='flex justify-center mb-8'
          >
            <div className='relative'>
              <div className='absolute inset-0 bg-green-500 blur-3xl opacity-20 animate-pulse' />
              <CheckCircle className='w-24 h-24 text-green-500 relative' />
            </div>
          </motion.div>

          {/* Main Success Card */}
          <Card className='border-2 border-green-500/20 shadow-2xl'>
            <CardHeader className='text-center space-y-4 pb-4'>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <CardTitle className='text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent'>
                  Payment Successful! 🎉
                </CardTitle>
                <p className='text-xl text-muted-foreground mt-2'>
                  Thank you for your purchase
                </p>
              </motion.div>
            </CardHeader>

            <CardContent className='space-y-6'>
              {/* Payment Details */}
              {paymentDetails && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className='bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg p-6 space-y-4'
                >
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium text-muted-foreground'>
                      Transaction Type
                    </span>
                    <span className='text-sm font-bold capitalize'>
                      {paymentDetails.type}
                    </span>
                  </div>

                  {paymentDetails.planName && (
                    <div className='flex items-center justify-between'>
                      <span className='text-sm font-medium text-muted-foreground'>
                        Plan
                      </span>
                      <span className='text-sm font-bold flex items-center gap-2'>
                        <Sparkles className='w-4 h-4 text-yellow-500' />
                        {paymentDetails.planName}
                      </span>
                    </div>
                  )}

                  {paymentDetails.credits && (
                    <div className='flex items-center justify-between'>
                      <span className='text-sm font-medium text-muted-foreground'>
                        Credits Added
                      </span>
                      <span className='text-sm font-bold text-green-600'>
                        +{paymentDetails.credits.toLocaleString()} credits
                      </span>
                    </div>
                  )}

                  <div className='flex items-center justify-between pt-4 border-t'>
                    <span className='text-base font-medium'>Amount Paid</span>
                    <span className='text-2xl font-bold text-green-600'>
                      ${paymentDetails.amount}
                    </span>
                  </div>
                </motion.div>
              )}

              {/* What's Next */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className='space-y-3'
              >
                <h3 className='font-semibold text-lg'>What&apos;s Next?</h3>
                <ul className='space-y-2 text-sm text-muted-foreground'>
                  <li className='flex items-start gap-2'>
                    <CheckCircle className='w-4 h-4 text-green-500 mt-0.5 flex-shrink-0' />
                    <span>Your payment has been processed successfully</span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <CheckCircle className='w-4 h-4 text-green-500 mt-0.5 flex-shrink-0' />
                    <span>
                      {paymentDetails?.type === 'subscription'
                        ? 'Your subscription is now active and renews automatically'
                        : 'Your credits have been added to your account'}
                    </span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <CheckCircle className='w-4 h-4 text-green-500 mt-0.5 flex-shrink-0' />
                    <span>
                      A confirmation email has been sent to your inbox
                    </span>
                  </li>
                  <li className='flex items-start gap-2'>
                    <CheckCircle className='w-4 h-4 text-green-500 mt-0.5 flex-shrink-0' />
                    <span>You can view your receipt and invoices below</span>
                  </li>
                </ul>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className='flex flex-col sm:flex-row gap-3 pt-4'
              >
                <Button
                  onClick={() => router.push('/dashboard/billing')}
                  className='flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                >
                  View Billing Dashboard
                  <ArrowRight className='w-4 h-4 ml-2' />
                </Button>
                <Button
                  variant='outline'
                  onClick={() => window.print()}
                  className='flex-1'
                >
                  <Download className='w-4 h-4 mr-2' />
                  Download Receipt
                </Button>
              </motion.div>

              {/* Back to Dashboard Link */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className='text-center pt-4'
              >
                <Button
                  variant='ghost'
                  onClick={() => router.push('/dashboard')}
                  className='text-sm'
                >
                  ← Back to Dashboard
                </Button>
              </motion.div>
            </CardContent>
          </Card>

          {/* Support Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className='mt-8 text-center text-sm text-muted-foreground'
          >
            <p>
              Need help?{' '}
              <a
                href='/contact'
                className='text-primary hover:underline font-medium'
              >
                Contact our support team
              </a>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
