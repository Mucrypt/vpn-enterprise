'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Sparkles, Zap, Crown } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import toast from 'react-hot-toast'

// Initialize Stripe - only if key is available
const STRIPE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
const stripePromise =
  STRIPE_KEY && STRIPE_KEY.startsWith('pk_') ? loadStripe(STRIPE_KEY) : null

interface Plan {
  id: string
  name: string
  description: string
  price: number
  credits: number
  features: string[]
  popular?: boolean
  stripePriceId?: string
}

interface CreditPackage {
  id: string
  name: string
  credits: number
  price: number
  bonus?: number
  stripePriceId?: string
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for trying out our platform',
    price: 0,
    credits: 100,
    features: [
      '100 credits/month',
      '1 GB database storage',
      '3 apps maximum',
      'Community support',
      'Basic analytics',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    description: 'Great for small projects',
    price: 29.99,
    credits: 1000,
    stripePriceId: 'price_1Sx9yiKQ56fnaANWBzqrQE49',
    features: [
      '1,000 credits/month',
      '10 GB database storage',
      '5 VPN devices',
      'Email support',
      'Advanced analytics',
    ],
  },
  {
    id: 'pro',
    name: 'Professional',
    description: 'For professional developers',
    price: 79.99,
    credits: 5000,
    popular: true,
    stripePriceId: 'price_1Sx9zAKQ56fnaANW54Rt4j1R',
    features: [
      '5,000 credits/month + 20% bonus',
      '50 GB database storage',
      '10 VPN devices',
      '2 TB hosting bandwidth',
      'Priority support',
      'Advanced VPN features',
      'Automated backups',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large teams and organizations',
    price: 299.99,
    credits: 25000,
    stripePriceId: 'price_1Sx9zcKQ56fnaANWH1vMY4Fy',
    features: [
      '25,000 credits/month + 40% bonus',
      '500 GB database storage',
      'Unlimited VPN devices',
      'Unlimited hosting bandwidth',
      '24/7 dedicated support',
      'Dedicated IP',
      'Team management',
      'API access',
      'Unlimited apps',
      'Dedicated support',
      'Advanced analytics',
      'Custom domains',
      'Team collaboration',
      'SLA guarantee',
      'Custom integrations',
    ],
  },
]

const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    credits: 100,
    price: 10,
    stripePriceId: 'price_1SxA0MKQ56fnaANWqVGE9hL2',
  },
  {
    id: 'popular',
    name: 'Popular Pack',
    credits: 500,
    price: 45,
    bonus: 50,
    stripePriceId: 'price_1SxA0gKQ56fnaANWxML0n5Uw',
  },
  {
    id: 'pro',
    name: 'Pro Pack',
    credits: 1000,
    price: 80,
    bonus: 200,
    stripePriceId: 'price_1SxA17KQ56fnaANW9CaejiXT',
  },
  {
    id: 'enterprise',
    name: 'Enterprise Pack',
    credits: 5000,
    price: 350,
    bonus: 1500,
    stripePriceId: 'price_1SxA1WKQ56fnaANWSKT9QOzO',
  },
]

interface PricingPlansProps {
  currentPlan?: string
  onSelectPlan: (planId: string, stripePriceId?: string) => Promise<void>
  loading?: boolean
}

export function PricingPlans({
  currentPlan,
  onSelectPlan,
  loading,
}: PricingPlansProps) {
  const [selectedTab, setSelectedTab] = useState<'subscription' | 'credits'>(
    'subscription',
  )
  const [processingPlan, setProcessingPlan] = useState<string | null>(null)

  const handleSelectPlan = async (planId: string, stripePriceId?: string) => {
    setProcessingPlan(planId)
    try {
      // Check if this is a credit package without Stripe setup
      const isCreditPackage = selectedTab === 'credits'
      if (isCreditPackage && !stripePriceId) {
        toast.error('Credit purchases require Stripe configuration. Please contact support.')
        return
      }
      
      await onSelectPlan(planId, stripePriceId)
    } catch (error: any) {
      toast.error(error.message || 'Failed to process request')
    } finally {
      setProcessingPlan(null)
    }
  }

  return (
    <div className='space-y-6'>
      {/* Tab Selector */}
      <div className='flex items-center justify-center gap-2 p-1 bg-muted rounded-lg w-fit mx-auto'>
        <Button
          variant={selectedTab === 'subscription' ? 'default' : 'ghost'}
          onClick={() => setSelectedTab('subscription')}
          className='gap-2'
        >
          <Crown className='w-4 h-4' />
          Subscriptions
        </Button>
        <Button
          variant={selectedTab === 'credits' ? 'default' : 'ghost'}
          onClick={() => setSelectedTab('credits')}
          className='gap-2'
        >
          <Zap className='w-4 h-4' />
          Buy Credits
        </Button>
      </div>

      {/* Subscription Plans */}
      {selectedTab === 'subscription' && (
        <div className='grid gap-6 md:grid-cols-3'>
          {PLANS.map((plan) => {
            const isCurrent = currentPlan?.toLowerCase() === plan.id
            const isDowngrade =
              currentPlan &&
              PLANS.findIndex((p) => p.id === currentPlan.toLowerCase()) >
                PLANS.findIndex((p) => p.id === plan.id)

            return (
              <Card
                key={plan.id}
                className={`relative transition-all ${
                  plan.popular
                    ? 'border-primary shadow-lg scale-105'
                    : isCurrent
                      ? 'border-green-500'
                      : ''
                }`}
              >
                {plan.popular && (
                  <div className='absolute -top-3 left-1/2 -translate-x-1/2 z-10'>
                    <Badge className='bg-primary text-primary-foreground px-3 py-1 gap-1'>
                      <Sparkles className='w-3 h-3' />
                      Most Popular
                    </Badge>
                  </div>
                )}
                {isCurrent && (
                  <div className='absolute -top-3 right-4 z-10'>
                    <Badge className='bg-green-500 text-white px-3 py-1'>
                      Current Plan
                    </Badge>
                  </div>
                )}

                <CardHeader className='text-center'>
                  <CardTitle className='text-2xl'>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className='mt-4'>
                    <span className='text-4xl font-bold'>${plan.price}</span>
                    <span className='text-muted-foreground'>/month</span>
                  </div>
                  {plan.credits > 0 && (
                    <p className='text-sm text-muted-foreground mt-2'>
                      {plan.credits.toLocaleString()} credits/month
                    </p>
                  )}
                  {plan.credits === -1 && (
                    <p className='text-sm text-primary font-semibold mt-2'>
                      Unlimited credits
                    </p>
                  )}
                </CardHeader>

                <CardContent className='space-y-4'>
                  <ul className='space-y-3'>
                    {plan.features.map((feature, index) => (
                      <li key={index} className='flex items-start gap-2'>
                        <Check className='w-5 h-5 text-green-500 shrink-0 mt-0.5' />
                        <span className='text-sm'>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className='w-full'
                    variant={
                      isCurrent
                        ? 'outline'
                        : plan.popular
                          ? 'default'
                          : 'secondary'
                    }
                    disabled={isCurrent || loading || processingPlan !== null}
                    onClick={() =>
                      handleSelectPlan(plan.id, plan.stripePriceId)
                    }
                  >
                    {processingPlan === plan.id
                      ? 'Processing...'
                      : isCurrent
                        ? 'Current Plan'
                        : isDowngrade
                          ? 'Downgrade'
                          : plan.price === 0
                            ? 'Get Started'
                            : 'Upgrade Now'}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Credit Packages */}
      {selectedTab === 'credits' && (
        <div className='grid gap-6 md:grid-cols-4'>
          {CREDIT_PACKAGES.map((pkg) => (
            <Card
              key={pkg.id}
              className='relative hover:border-primary transition-all'
            >
              {pkg.bonus && (
                <div className='absolute -top-3 left-1/2 -translate-x-1/2 z-10'>
                  <Badge className='bg-green-500 text-white px-2 py-1 text-xs'>
                    +{pkg.bonus} Bonus
                  </Badge>
                </div>
              )}

              <CardHeader className='text-center pb-4'>
                <CardTitle className='text-lg'>{pkg.name}</CardTitle>
                <div className='mt-2'>
                  <div className='text-3xl font-bold'>{pkg.credits}</div>
                  <div className='text-xs text-muted-foreground'>
                    {pkg.bonus && `+${pkg.bonus} bonus `}credits
                  </div>
                </div>
              </CardHeader>

              <CardContent className='space-y-4'>
                <div className='text-center'>
                  <span className='text-2xl font-bold'>${pkg.price}</span>
                  {pkg.bonus && (
                    <p className='text-xs text-green-600 mt-1'>
                      Total: {pkg.credits + pkg.bonus} credits
                    </p>
                  )}
                </div>

                <Button
                  className='w-full'
                  variant='default'
                  disabled={loading || processingPlan !== null}
                  onClick={() => handleSelectPlan(pkg.id, pkg.stripePriceId)}
                >
                  {processingPlan === pkg.id ? (
                    'Processing...'
                  ) : (
                    <>
                      <Zap className='w-4 h-4 mr-2' />
                      Buy Now
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
