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
    stripePriceId: 'price_1SxB6JKQ56fnaANWKj4Ta5Dk',
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
    stripePriceId: 'price_1SxB6LKQ56fnaANW4NP1qEq5',
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
    stripePriceId: 'price_1SxB6NKQ56fnaANWmf9qisum',
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
    stripePriceId: 'price_1SxB6QKQ56fnaANW8CEtay6X',
  },
  {
    id: 'popular',
    name: 'Popular Pack',
    credits: 500,
    price: 45,
    bonus: 50,
    stripePriceId: 'price_1SxB6SKQ56fnaANWc74bMAho',
  },
  {
    id: 'pro',
    name: 'Pro Pack',
    credits: 1000,
    price: 80,
    bonus: 200,
    stripePriceId: 'price_1SxB6UKQ56fnaANWSEP2BtYh',
  },
  {
    id: 'enterprise',
    name: 'Enterprise Pack',
    credits: 5000,
    price: 350,
    bonus: 1500,
    stripePriceId: 'price_1SxB6WKQ56fnaANW7DD6cDO2',
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
        toast.error(
          'Credit purchases require Stripe configuration. Please contact support.',
        )
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
    <div className='space-y-6 sm:space-y-8'>
      {/* Tab Selector with Glass Morphism */}
      <div className='flex items-center justify-center gap-2 p-1.5 bg-muted/50 backdrop-blur-sm rounded-xl border border-border/50 w-fit mx-auto shadow-lg'>
        <Button
          variant={selectedTab === 'subscription' ? 'default' : 'ghost'}
          onClick={() => setSelectedTab('subscription')}
          className={`gap-2 transition-all ${
            selectedTab === 'subscription'
              ? 'bg-linear-to-br from-primary to-primary/80 shadow-lg shadow-primary/25'
              : 'hover:bg-primary/10'
          }`}
        >
          <Crown className='w-4 h-4' />
          <span className='hidden sm:inline'>Subscriptions</span>
        </Button>
        <Button
          variant={selectedTab === 'credits' ? 'default' : 'ghost'}
          onClick={() => setSelectedTab('credits')}
          className={`gap-2 transition-all ${
            selectedTab === 'credits'
              ? 'bg-linear-to-br from-primary to-primary/80 shadow-lg shadow-primary/25'
              : 'hover:bg-primary/10'
          }`}
        >
          <Zap className='w-4 h-4' />
          <span className='hidden sm:inline'>Buy Credits</span>
        </Button>
      </div>

      {/* Subscription Plans */}
      {selectedTab === 'subscription' && (
        <div className='grid gap-6 sm:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-4'>
          {PLANS.map((plan) => {
            const isCurrent = currentPlan?.toLowerCase() === plan.id
            const isDowngrade =
              currentPlan &&
              PLANS.findIndex((p) => p.id === currentPlan.toLowerCase()) >
                PLANS.findIndex((p) => p.id === plan.id)

            return (
              <Card
                key={plan.id}
                className={`relative overflow-hidden transition-all duration-500 group ${
                  plan.popular
                    ? 'border-primary/50 shadow-2xl shadow-primary/10 lg:scale-105 lg:hover:scale-110 bg-card/50 backdrop-blur-sm'
                    : isCurrent
                      ? 'border-green-500/50 shadow-xl shadow-green-500/10 bg-card/50 backdrop-blur-sm'
                      : 'border-border/50 bg-card/30 backdrop-blur-sm hover:border-primary/30 hover:shadow-xl'
                }`}
              >
                {/* Background Gradient Effect */}
                <div
                  className={`absolute inset-0 bg-linear-to-br ${
                    plan.popular
                      ? 'from-primary/10 via-purple-500/5 to-transparent'
                      : isCurrent
                        ? 'from-green-500/10 to-transparent'
                        : 'from-muted/20 to-transparent'
                  } opacity-50`}
                />
                <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent' />

                {plan.popular && (
                  <div className='absolute -top-3 left-1/2 -translate-x-1/2 z-10'>
                    <Badge className='bg-linear-to-br from-primary via-purple-500 to-primary text-primary-foreground px-4 py-1.5 gap-1.5 text-xs font-bold shadow-lg animate-pulse'>
                      <Sparkles className='w-3.5 h-3.5' />
                      Most Popular
                    </Badge>
                  </div>
                )}
                {isCurrent && (
                  <div className='absolute -top-3 right-4 z-10'>
                    <Badge className='bg-linear-to-br from-green-500 to-emerald-600 text-white px-3 py-1.5 text-xs font-bold shadow-lg'>
                      ✓ Current Plan
                    </Badge>
                  </div>
                )}

                <CardHeader className='relative text-center pb-4'>
                  <div className='flex justify-center mb-4'>
                    {plan.id === 'free' && (
                      <div className='p-3 rounded-xl bg-linear-to-br from-slate-500/20 to-slate-400/10 backdrop-blur-sm border border-slate-500/30 shadow-sm'>
                        <Sparkles className='w-6 h-6 text-slate-400' />
                      </div>
                    )}
                    {plan.id === 'starter' && (
                      <div className='p-3 rounded-xl bg-linear-to-br from-blue-500/20 to-blue-400/10 backdrop-blur-sm border border-blue-500/30 shadow-sm'>
                        <Zap className='w-6 h-6 text-blue-400' />
                      </div>
                    )}
                    {(plan.id === 'pro' || plan.id === 'professional') && (
                      <div className='p-3 rounded-xl bg-linear-to-br from-purple-500/20 to-purple-400/10 backdrop-blur-sm border border-purple-500/30 shadow-sm'>
                        <Crown className='w-6 h-6 text-purple-400' />
                      </div>
                    )}
                    {plan.id === 'enterprise' && (
                      <div className='p-3 rounded-xl bg-linear-to-br from-amber-500/20 to-amber-400/10 backdrop-blur-sm border border-amber-500/30 shadow-sm'>
                        <Crown className='w-6 h-6 text-amber-400' />
                      </div>
                    )}
                  </div>
                  <CardTitle className='text-2xl font-bold'>
                    {plan.name}
                  </CardTitle>
                  <CardDescription className='text-sm mt-1'>
                    {plan.description}
                  </CardDescription>
                  <div className='mt-4'>
                    <span className='text-4xl sm:text-5xl font-bold bg-linear-to-br from-foreground to-foreground/70 bg-clip-text text-transparent'>
                      ${plan.price}
                    </span>
                    <span className='text-muted-foreground text-sm'>
                      /month
                    </span>
                  </div>
                  {plan.credits > 0 && (
                    <div className='mt-3 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 inline-block'>
                      <p className='text-xs sm:text-sm font-semibold text-primary'>
                        {plan.credits.toLocaleString()} credits/month
                      </p>
                    </div>
                  )}
                  {plan.credits === -1 && (
                    <div className='mt-3 px-3 py-1.5 rounded-full bg-linear-to-br from-primary/20 to-purple-500/20 border border-primary/30 inline-block'>
                      <p className='text-sm font-bold bg-linear-to-br from-primary to-purple-500 bg-clip-text text-transparent'>
                        ∞ Unlimited credits
                      </p>
                    </div>
                  )}
                </CardHeader>

                <CardContent className='relative space-y-4'>
                  <ul className='space-y-2.5'>
                    {plan.features.map((feature, index) => (
                      <li
                        key={index}
                        className='flex items-start gap-2.5 text-sm'
                      >
                        <div className='p-0.5 rounded-full bg-green-500/20 mt-0.5 shrink-0'>
                          <Check className='w-3.5 h-3.5 text-green-500' />
                        </div>
                        <span className='text-muted-foreground'>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full transition-all duration-300 ${
                      isCurrent
                        ? 'bg-green-500/10 text-green-500 border border-green-500/30 hover:bg-green-500/20 shadow-none'
                        : plan.popular
                          ? 'bg-linear-to-br from-primary via-purple-500 to-primary hover:from-primary/90 hover:via-purple-500/90 hover:to-primary/90 shadow-lg hover:shadow-xl hover:shadow-primary/30 hover:scale-105'
                          : 'bg-card/80 hover:bg-primary/10 border border-border/50 hover:border-primary/30 shadow-md hover:shadow-lg'
                    }`}
                    variant={
                      isCurrent
                        ? 'outline'
                        : plan.popular
                          ? 'default'
                          : 'outline'
                    }
                    disabled={isCurrent || loading || processingPlan !== null}
                    onClick={() =>
                      handleSelectPlan(plan.id, plan.stripePriceId)
                    }
                  >
                    {processingPlan === plan.id
                      ? 'Processing...'
                      : isCurrent
                        ? '✓ Current Plan'
                        : isDowngrade
                          ? 'Downgrade'
                          : plan.price === 0
                            ? 'Get Started Free'
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
        <div className='grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
          {CREDIT_PACKAGES.map((pkg) => (
            <Card
              key={pkg.id}
              className='relative overflow-hidden transition-all duration-500 hover:scale-105 border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 group'
            >
              {/* Background Gradient Effect */}
              <div className='absolute inset-0 bg-linear-to-br from-primary/10 via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500' />
              <div className='absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent' />

              {pkg.bonus && (
                <div className='absolute -top-3 left-1/2 -translate-x-1/2 z-10'>
                  <Badge className='bg-linear-to-br from-green-500 to-emerald-600 text-white px-3 py-1 text-xs font-bold shadow-lg animate-bounce'>
                    +{pkg.bonus} Bonus ⚡
                  </Badge>
                </div>
              )}

              <CardHeader className='relative text-center pb-4 pt-6'>
                <div className='flex justify-center mb-3'>
                  <div className='p-3 rounded-xl bg-linear-to-br from-amber-500/20 via-yellow-500/10 to-orange-500/10 backdrop-blur-sm border border-amber-500/30 shadow-lg'>
                    <Zap className='w-7 h-7 text-amber-500' />
                  </div>
                </div>
                <CardTitle className='text-lg font-bold'>{pkg.name}</CardTitle>
                <div className='mt-3'>
                  <div className='text-3xl sm:text-4xl font-bold bg-linear-to-br from-amber-500 via-yellow-500 to-orange-500 bg-clip-text text-transparent'>
                    {pkg.credits}
                  </div>
                  <div className='text-xs text-muted-foreground mt-1'>
                    {pkg.bonus && (
                      <span className='text-green-500 font-semibold'>
                        +{pkg.bonus} bonus{' '}
                      </span>
                    )}
                    credits
                  </div>
                </div>
              </CardHeader>

              <CardContent className='relative space-y-4'>
                <div className='text-center p-4 rounded-xl bg-linear-to-br from-muted/50 to-muted/20 border border-border/50 shadow-sm'>
                  <span className='text-3xl font-bold bg-linear-to-br from-foreground to-foreground/70 bg-clip-text text-transparent'>
                    ${pkg.price}
                  </span>
                  {pkg.bonus && (
                    <div className='mt-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 inline-block'>
                      <p className='text-xs font-semibold text-green-500'>
                        Total: {(pkg.credits + pkg.bonus).toLocaleString()}{' '}
                        credits
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  className='w-full gap-2 bg-linear-to-br from-amber-500 via-yellow-500 to-orange-500 hover:from-amber-600 hover:via-yellow-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl hover:shadow-amber-500/30 transition-all hover:scale-105 font-semibold'
                  disabled={loading || processingPlan !== null}
                  onClick={() => handleSelectPlan(pkg.id, pkg.stripePriceId)}
                >
                  {processingPlan === pkg.id ? (
                    'Processing...'
                  ) : (
                    <>
                      <Zap className='w-4 h-4' />
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
