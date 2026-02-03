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
import { Zap, TrendingUp, Calendar, CreditCard } from 'lucide-react'
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

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-gray-100 text-gray-800',
  pro: 'bg-blue-100 text-blue-800',
  enterprise: 'bg-purple-100 text-purple-800',
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  trialing: 'bg-blue-100 text-blue-800',
  past_due: 'bg-yellow-100 text-yellow-800',
  canceled: 'bg-red-100 text-red-800',
}

export function SubscriptionOverview({
  subscription,
  onUpgrade,
  loading,
}: SubscriptionOverviewProps) {
  if (loading) {
    return (
      <Card className='border-primary/20 bg-linear-to-br from-primary/5 to-primary/10'>
        <CardHeader>
          <div className='h-6 w-32 animate-pulse rounded bg-gray-200' />
          <div className='h-4 w-48 animate-pulse rounded bg-gray-200 mt-2' />
        </CardHeader>
        <CardContent>
          <div className='h-24 animate-pulse rounded bg-gray-200' />
        </CardContent>
      </Card>
    )
  }

  if (!subscription) {
    return (
      <Card className='border-primary/20 bg-linear-to-br from-primary/5 to-primary/10'>
        <CardHeader>
          <CardTitle>No Active Subscription</CardTitle>
          <CardDescription>
            Start your journey with VPN Enterprise
          </CardDescription>
        </CardHeader>
        <CardContent className='text-center py-8'>
          <Zap className='w-12 h-12 mx-auto text-primary mb-4' />
          <p className='text-muted-foreground mb-6'>
            Choose a plan to unlock powerful features and scale your business
          </p>
          <Button onClick={onUpgrade} size='lg' className='gap-2'>
            <TrendingUp className='w-4 h-4' />
            Choose Your Plan
          </Button>
        </CardContent>
      </Card>
    )
  }

  const planType = subscription.plan_type?.toLowerCase() || 'free'
  const status = subscription.status?.toLowerCase() || 'active'
  const creditPercentage = Math.round(
    (subscription.credits_remaining / subscription.credits_limit) * 100,
  )

  return (
    <Card className='border-primary/20 bg-linear-to-br from-primary/5 to-primary/10'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='flex items-center gap-2'>
              Current Subscription
              <Badge className={PLAN_COLORS[planType] || PLAN_COLORS.free}>
                {subscription.plan_type}
              </Badge>
            </CardTitle>
            <CardDescription>
              Manage your subscription and billing
            </CardDescription>
          </div>
          <CreditCard className='w-8 h-8 text-primary' />
        </div>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Status and Renewal */}
        <div className='flex items-center justify-between p-4 rounded-lg bg-background/60'>
          <div>
            <p className='text-sm text-muted-foreground'>Status</p>
            <Badge className={STATUS_COLORS[status] || STATUS_COLORS.active}>
              {subscription.status}
            </Badge>
          </div>
          {subscription.current_period_end && (
            <div className='text-right'>
              <p className='text-sm text-muted-foreground flex items-center gap-1'>
                <Calendar className='w-3 h-3' />
                Renews on
              </p>
              <p className='font-semibold'>
                {formatDate(subscription.current_period_end)}
              </p>
            </div>
          )}
        </div>

        {/* Credits Overview */}
        <div>
          <div className='flex items-center justify-between mb-2'>
            <p className='text-sm font-medium'>Credits Available</p>
            <p className='text-sm text-muted-foreground'>
              {subscription.credits_remaining.toLocaleString()} /{' '}
              {subscription.credits_limit.toLocaleString()}
            </p>
          </div>
          <div className='h-2 bg-gray-200 rounded-full overflow-hidden'>
            <div
              className={`h-full transition-all ${
                creditPercentage > 50
                  ? 'bg-green-500'
                  : creditPercentage > 20
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
              }`}
              style={{ width: `${creditPercentage}%` }}
            />
          </div>
          {creditPercentage < 20 && (
            <p className='text-xs text-red-600 mt-2'>
              ⚠️ Low credits! Consider purchasing more or upgrading your plan.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className='flex gap-3'>
          {planType !== 'enterprise' && (
            <Button onClick={onUpgrade} className='flex-1'>
              <TrendingUp className='w-4 h-4 mr-2' />
              Upgrade Plan
            </Button>
          )}
          {subscription.stripe_customer_id && (
            <Button variant='outline' className='flex-1'>
              Manage Billing
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
