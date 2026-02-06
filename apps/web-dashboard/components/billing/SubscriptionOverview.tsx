'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Zap,
  TrendingUp,
  Calendar,
  CreditCard,
  Sparkles,
  Crown,
  AlertCircle,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface SubscriptionOverviewProps {
  subscription: {
    plan_type: string
    status: string
    credits_remaining: number
    credits_limit: number
    current_period_end?: string
    stripe_customer_id?: string
  } | null
  onUpgrade: () => void
  loading?: boolean
}

const PLAN_CONFIGS: Record<
  string,
  { gradient: string; icon: any; color: string }
> = {
  free: {
    gradient: 'from-slate-500/20 via-slate-400/10 to-background',
    icon: Sparkles,
    color: 'text-slate-400',
  },
  starter: {
    gradient: 'from-blue-500/20 via-blue-400/10 to-background',
    icon: Zap,
    color: 'text-blue-400',
  },
  pro: {
    gradient: 'from-purple-500/20 via-purple-400/10 to-background',
    icon: Crown,
    color: 'text-purple-400',
  },
  professional: {
    gradient: 'from-purple-500/20 via-purple-400/10 to-background',
    icon: Crown,
    color: 'text-purple-400',
  },
  enterprise: {
    gradient: 'from-amber-500/20 via-amber-400/10 to-background',
    icon: Crown,
    color: 'text-amber-400',
  },
}

const STATUS_CONFIGS: Record<
  string,
  { bg: string; text: string; icon: string }
> = {
  active: { bg: 'bg-green-500/10', text: 'text-green-500', icon: '●' },
  trialing: { bg: 'bg-blue-500/10', text: 'text-blue-500', icon: '◐' },
  past_due: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', icon: '!' },
  canceled: { bg: 'bg-red-500/10', text: 'text-red-500', icon: '✕' },
}

export function SubscriptionOverview({
  subscription,
  onUpgrade,
  loading,
}: SubscriptionOverviewProps) {
  if (loading) {
    return (
      <Card className='relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm'>
        <div className='absolute inset-0 bg-linear-to-br from-primary/5 to-transparent' />
        <CardHeader className='relative'>
          <div className='h-8 w-48 animate-pulse rounded-lg bg-muted' />
          <div className='h-4 w-64 animate-pulse rounded bg-muted mt-3' />
        </CardHeader>
        <CardContent className='relative'>
          <div className='space-y-4'>
            <div className='h-24 animate-pulse rounded-xl bg-muted' />
            <div className='h-32 animate-pulse rounded-xl bg-muted' />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!subscription) {
    return (
      <Card className='relative overflow-hidden border-border/50 bg-linear-to-br from-card via-card to-primary/5 backdrop-blur-sm'>
        <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent' />
        <CardHeader className='relative pb-4'>
          <CardTitle className='text-2xl sm:text-3xl font-bold flex items-center gap-3'>
            <div className='p-3 rounded-xl bg-primary/10 backdrop-blur-sm border border-primary/20'>
              <Sparkles className='w-6 h-6 sm:w-7 sm:h-7 text-primary' />
            </div>
            <span className='bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent'>
              No Active Subscription
            </span>
          </CardTitle>
          <CardDescription className='text-base'>
            Start your journey with VPN Enterprise
          </CardDescription>
        </CardHeader>
        <CardContent className='relative text-center py-8 sm:py-12'>
          <div className='max-w-md mx-auto space-y-6'>
            <div className='relative'>
              <div className='absolute inset-0 bg-primary/20 blur-3xl' />
              <Zap className='relative w-16 h-16 sm:w-20 sm:h-20 mx-auto text-primary animate-pulse' />
            </div>
            <div className='space-y-2'>
              <p className='text-base sm:text-lg font-medium'>
                Unlock powerful features and scale your business
              </p>
              <p className='text-sm text-muted-foreground'>
                Choose from our flexible plans designed for every stage of
                growth
              </p>
            </div>
            <Button
              onClick={onUpgrade}
              size='lg'
              className='gap-2 bg-linear-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:scale-105'
            >
              <TrendingUp className='w-5 h-5' />
              <span className='font-semibold'>Choose Your Plan</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const planType = subscription.plan_type?.toLowerCase() || 'free'
  const status = subscription.status?.toLowerCase() || 'active'
  const creditsRemaining = subscription.credits_remaining || 0
  const creditsLimit = subscription.credits_limit || 1
  const creditPercentage = Math.min(
    Math.round((creditsRemaining / creditsLimit) * 100),
    100,
  )

  const planConfig = PLAN_CONFIGS[planType] || PLAN_CONFIGS.free
  const statusConfig = STATUS_CONFIGS[status] || STATUS_CONFIGS.active
  const PlanIcon = planConfig.icon

  return (
    <Card className='relative overflow-hidden border-border/40 bg-card backdrop-blur-sm group hover:border-primary/50 transition-all duration-500 shadow-lg'>
      {/* Animated Background Gradient */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${planConfig.gradient} opacity-[0.03]`}
      />
      <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-primary/[0.02] via-transparent to-transparent' />

      <CardHeader className='relative pb-4'>
        <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4'>
          <div className='space-y-2'>
            <CardTitle className='text-xl sm:text-2xl font-bold flex items-center gap-3 flex-wrap'>
              <div
                className={`p-2.5 rounded-xl bg-gradient-to-br ${planConfig.gradient} backdrop-blur-sm border border-white/10 shadow-lg`}
              >
                <PlanIcon
                  className={`w-5 h-5 sm:w-6 sm:h-6 text-white`}
                />
              </div>
              <span>Current Subscription</span>
              <Badge
                variant='outline'
                className='px-3 py-1 text-sm font-semibold bg-primary/20 border-primary/40 text-primary capitalize shadow-sm'
              >
                {subscription.plan_type}
              </Badge>
            </CardTitle>
            <CardDescription className='text-sm'>
              Manage your subscription and track usage
            </CardDescription>
          </div>

          {/* Status Badge */}
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-full ${statusConfig.bg} border border-border/50 backdrop-blur-sm`}
          >
            <span className={`text-lg ${statusConfig.text}`}>
              {statusConfig.icon}
            </span>
            <span
              className={`text-sm font-medium ${statusConfig.text} capitalize`}
            >
              {subscription.status}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className='relative space-y-6'>
        {/* Credits Section with Modern Design */}
        <div className='space-y-4'>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            {/* Credits Card */}
            <div className='p-5 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/30 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow'>
              <div className='flex items-start justify-between mb-3'>
                <div>
                  <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wide'>
                    Available Credits
                  </p>
                  <p className='text-3xl sm:text-4xl font-bold mt-1 bg-gradient-to-r from-primary via-primary to-primary/80 bg-clip-text text-transparent'>
                    {creditsRemaining.toLocaleString()}
                  </p>
                </div>
                <div className='p-2 rounded-lg bg-primary/30 shadow-sm'>
                  <Zap className='w-5 h-5 text-primary drop-shadow-sm' />
                </div>
              </div>
              <p className='text-xs text-muted-foreground'>
                of {creditsLimit.toLocaleString()} total credits
              </p>
            </div>

            {/* Renewal Card */}
            {subscription.current_period_end && (
              <div className='p-5 rounded-xl bg-gradient-to-br from-muted/60 to-muted/30 border border-border/60 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow'>
                <div className='flex items-start justify-between mb-3'>
                  <div>
                    <p className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>
                      Next Billing
                    </p>
                    <p className='text-lg sm:text-xl font-bold mt-1'>
                      {formatDate(subscription.current_period_end)}
                    </p>
                  </div>
                  <div className='p-2 rounded-lg bg-muted/80 shadow-sm'>
                    <Calendar className='w-5 h-5 text-foreground/80' />
                  </div>
                </div>
                <p className='text-xs text-muted-foreground'>
                  Auto-renewal enabled
                </p>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className='space-y-3'>
            <div className='flex items-center justify-between text-sm'>
              <span className='font-medium'>Credit Usage</span>
              <span
                className={`font-bold ${
                  creditPercentage > 50
                    ? 'text-green-500'
                    : creditPercentage > 20
                      ? 'text-yellow-500'
                      : 'text-red-500'
                }`}
              >
                {creditPercentage}%
              </span>
            </div>
            <div className='relative h-3 bg-muted/60 rounded-full overflow-hidden border border-border/60 shadow-inner'>
              <div
                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out shadow-md ${
                  creditPercentage > 50
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                    : creditPercentage > 20
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                      : 'bg-gradient-to-r from-red-500 to-rose-500'
                }`}
                style={{ width: `${creditPercentage}%` }}
              >
                <div className='absolute inset-0 bg-white/20 animate-pulse' />
              </div>
            </div>
            {creditPercentage < 20 && (
              <div className='flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20'>
                <AlertCircle className='w-4 h-4 text-red-500 shrink-0 mt-0.5' />
                <p className='text-xs text-red-500 font-medium'>
                  Low credits! Consider purchasing more or upgrading your plan
                  to avoid service interruption.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex flex-col sm:flex-row gap-3 pt-2'>
          {planType !== 'enterprise' && (
            <Button
              onClick={onUpgrade}
              className='flex-1 gap-2 bg-gradient-to-r from-primary via-primary to-primary/80 hover:from-primary hover:to-primary/90 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] font-semibold'
            >
              <TrendingUp className='w-4 h-4' />
              <span>Upgrade Plan</span>
            </Button>
          )}
          {subscription.stripe_customer_id && (
            <Button
              variant='outline'
              className='flex-1 gap-2 hover:bg-muted hover:border-primary/40 transition-all font-medium border-border/60'
            >
              <CreditCard className='w-4 h-4' />
              Manage Billing
            </Button>
          )}
          {!subscription.stripe_customer_id && planType === 'enterprise' && (
            <Button
              variant='outline'
              className='w-full gap-2 hover:bg-muted hover:border-primary/30 transition-all'
            >
              <CreditCard className='w-4 h-4' />
              Add Payment Method
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
