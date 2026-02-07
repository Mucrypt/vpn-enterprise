'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Globe,
  Zap,
  Clock,
  BarChart3,
  PieChart,
  Target,
} from 'lucide-react'

interface UserAnalytics {
  totalUsers: number
  activeUsers: number
  newUsers: number
  churnRate: number
  avgSessionDuration: number
  topRegions: { name: string; users: number; percentage: number }[]
  userGrowth: { month: string; users: number; growth: number }[]
  engagement: {
    dailyActive: number
    weeklyActive: number
    monthlyActive: number
  }
  revenue: {
    mrr: number
    arr: number
    arpu: number
    ltv: number
  }
}

interface UserAnalyticsDashboardProps {
  analytics: UserAnalytics
}

export function UserAnalyticsDashboard({ analytics }: UserAnalyticsDashboardProps) {
  const userGrowthPercentage =
    ((analytics.newUsers / analytics.totalUsers) * 100).toFixed(1)
  const activePercentage = ((analytics.activeUsers / analytics.totalUsers) * 100).toFixed(1)

  return (
    <Card className='border-border/50 bg-card/50 backdrop-blur-sm'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-xl'>
          <BarChart3 className='w-5 h-5 text-primary' />
          User Analytics & Insights
        </CardTitle>
        <CardDescription>
          Comprehensive user behavior, engagement, and revenue metrics
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Key Metrics Grid */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          <div className='relative overflow-hidden p-4 rounded-lg border border-border/50 bg-linear-to-br from-blue-500/10 to-transparent'>
            <div className='flex items-center justify-between mb-2'>
              <div className='p-2 rounded-lg bg-blue-500/10'>
                <Users className='w-5 h-5 text-blue-500' />
              </div>
              <Badge className='bg-blue-500/20 text-blue-500 border-blue-500/30 gap-1'>
                <TrendingUp className='w-3 h-3' />
                {userGrowthPercentage}%
              </Badge>
            </div>
            <p className='text-3xl font-bold mb-1'>{analytics.totalUsers.toLocaleString()}</p>
            <p className='text-sm text-muted-foreground'>Total Users</p>
            <p className='text-xs text-muted-foreground mt-1'>
              +{analytics.newUsers} this month
            </p>
          </div>

          <div className='relative overflow-hidden p-4 rounded-lg border border-border/50 bg-linear-to-br from-green-500/10 to-transparent'>
            <div className='flex items-center justify-between mb-2'>
              <div className='p-2 rounded-lg bg-green-500/10'>
                <Activity className='w-5 h-5 text-green-500' />
              </div>
              <Badge className='bg-green-500/20 text-green-500 border-green-500/30'>
                {activePercentage}%
              </Badge>
            </div>
            <p className='text-3xl font-bold mb-1'>{analytics.activeUsers.toLocaleString()}</p>
            <p className='text-sm text-muted-foreground'>Active Users</p>
            <p className='text-xs text-muted-foreground mt-1'>Last 30 days</p>
          </div>

          <div className='relative overflow-hidden p-4 rounded-lg border border-border/50 bg-linear-to-br from-amber-500/10 to-transparent'>
            <div className='flex items-center justify-between mb-2'>
              <div className='p-2 rounded-lg bg-amber-500/10'>
                <DollarSign className='w-5 h-5 text-amber-500' />
              </div>
              <Badge className='bg-amber-500/20 text-amber-500 border-amber-500/30 gap-1'>
                <TrendingUp className='w-3 h-3' />
                12%
              </Badge>
            </div>
            <p className='text-3xl font-bold mb-1'>
              ${analytics.revenue.mrr.toLocaleString()}
            </p>
            <p className='text-sm text-muted-foreground'>Monthly Revenue</p>
            <p className='text-xs text-muted-foreground mt-1'>
              ARR: ${analytics.revenue.arr.toLocaleString()}
            </p>
          </div>

          <div className='relative overflow-hidden p-4 rounded-lg border border-border/50 bg-linear-to-br from-purple-500/10 to-transparent'>
            <div className='flex items-center justify-between mb-2'>
              <div className='p-2 rounded-lg bg-purple-500/10'>
                <Clock className='w-5 h-5 text-purple-500' />
              </div>
            </div>
            <p className='text-3xl font-bold mb-1'>
              {Math.round(analytics.avgSessionDuration)}m
            </p>
            <p className='text-sm text-muted-foreground'>Avg Session</p>
            <p className='text-xs text-muted-foreground mt-1'>Duration per user</p>
          </div>
        </div>

        {/* Engagement Metrics */}
        <div className='p-4 rounded-lg bg-muted/30 border border-border/50'>
          <h4 className='font-semibold mb-4 flex items-center gap-2'>
            <Zap className='w-4 h-4 text-primary' />
            User Engagement
          </h4>
          <div className='grid grid-cols-3 gap-4'>
            <div className='text-center'>
              <p className='text-2xl font-bold text-blue-500'>
                {analytics.engagement.dailyActive.toLocaleString()}
              </p>
              <p className='text-xs text-muted-foreground mt-1'>Daily Active Users</p>
            </div>
            <div className='text-center'>
              <p className='text-2xl font-bold text-green-500'>
                {analytics.engagement.weeklyActive.toLocaleString()}
              </p>
              <p className='text-xs text-muted-foreground mt-1'>Weekly Active Users</p>
            </div>
            <div className='text-center'>
              <p className='text-2xl font-bold text-purple-500'>
                {analytics.engagement.monthlyActive.toLocaleString()}
              </p>
              <p className='text-xs text-muted-foreground mt-1'>Monthly Active Users</p>
            </div>
          </div>
        </div>

        {/* Revenue Metrics */}
        <div className='p-4 rounded-lg bg-muted/30 border border-border/50'>
          <h4 className='font-semibold mb-4 flex items-center gap-2'>
            <DollarSign className='w-4 h-4 text-primary' />
            Revenue Metrics
          </h4>
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
            <div>
              <p className='text-sm text-muted-foreground mb-1'>MRR</p>
              <p className='text-xl font-bold'>${analytics.revenue.mrr.toLocaleString()}</p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground mb-1'>ARR</p>
              <p className='text-xl font-bold'>${analytics.revenue.arr.toLocaleString()}</p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground mb-1'>ARPU</p>
              <p className='text-xl font-bold'>${analytics.revenue.arpu.toFixed(0)}</p>
            </div>
            <div>
              <p className='text-sm text-muted-foreground mb-1'>LTV</p>
              <p className='text-xl font-bold'>${analytics.revenue.ltv.toFixed(0)}</p>
            </div>
          </div>
        </div>

        {/* Top Regions */}
        <div className='space-y-3'>
          <h4 className='font-semibold flex items-center gap-2'>
            <Globe className='w-4 h-4 text-primary' />
            Top Regions
          </h4>
          <div className='space-y-2'>
            {analytics.topRegions.map((region, index) => (
              <div key={region.name} className='flex items-center gap-3'>
                <div className='w-8 text-center'>
                  <Badge variant='outline' className='w-6 h-6 flex items-center justify-center p-0'>
                    {index + 1}
                  </Badge>
                </div>
                <div className='flex-1'>
                  <div className='flex items-center justify-between mb-1'>
                    <span className='font-medium text-sm'>{region.name}</span>
                    <span className='text-sm text-muted-foreground'>
                      {region.users.toLocaleString()} users
                    </span>
                  </div>
                  <div className='relative h-2 bg-muted rounded-full overflow-hidden'>
                    <div
                      className='absolute inset-y-0 left-0 bg-linear-to-r from-primary to-primary/70 rounded-full transition-all'
                      style={{ width: `${region.percentage}%` }}
                    />
                  </div>
                </div>
                <span className='text-sm font-medium text-muted-foreground w-12 text-right'>
                  {region.percentage.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Growth Trend */}
        <div className='space-y-3'>
          <h4 className='font-semibold flex items-center gap-2'>
            <TrendingUp className='w-4 h-4 text-primary' />
            User Growth Trend
          </h4>
          <div className='grid grid-cols-6 gap-2'>
            {analytics.userGrowth.map((month) => (
              <div key={month.month} className='text-center'>
                <div className='text-xs text-muted-foreground mb-2'>{month.month}</div>
                <div className='flex flex-col items-center gap-1'>
                  <div className='text-sm font-bold'>
                    {(month.users / 1000).toFixed(1)}k
                  </div>
                  <Badge
                    variant='outline'
                    className={`text-xs ${month.growth >= 0 ? 'text-green-500' : 'text-red-500'}`}
                  >
                    {month.growth >= 0 ? '+' : ''}
                    {month.growth.toFixed(0)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Churn Rate Alert */}
        {analytics.churnRate > 5 && (
          <div className='p-4 rounded-lg bg-red-500/10 border border-red-500/30'>
            <div className='flex items-start gap-3'>
              <Target className='w-5 h-5 text-red-500 shrink-0 mt-0.5' />
              <div>
                <h4 className='font-semibold text-sm text-red-500'>High Churn Rate Detected</h4>
                <p className='text-xs text-muted-foreground mt-1'>
                  Current churn rate is {analytics.churnRate.toFixed(2)}%, which is above the
                  healthy threshold of 5%. Consider implementing retention campaigns.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Mock analytics data
export const MOCK_ANALYTICS: UserAnalytics = {
  totalUsers: 15420,
  activeUsers: 12340,
  newUsers: 1240,
  churnRate: 3.2,
  avgSessionDuration: 24.5,
  topRegions: [
    { name: 'United States', users: 6200, percentage: 40.2 },
    { name: 'United Kingdom', users: 3100, percentage: 20.1 },
    { name: 'Germany', users: 2300, percentage: 14.9 },
    { name: 'Canada', users: 1500, percentage: 9.7 },
    { name: 'Australia', users: 1200, percentage: 7.8 },
  ],
  userGrowth: [
    { month: 'Aug', users: 11200, growth: 8.2 },
    { month: 'Sep', users: 12100, growth: 8.0 },
    { month: 'Oct', users: 13000, growth: 7.4 },
    { month: 'Nov', users: 14200, growth: 9.2 },
    { month: 'Dec', users: 15100, growth: 6.3 },
    { month: 'Jan', users: 15420, growth: 2.1 },
  ],
  engagement: {
    dailyActive: 5600,
    weeklyActive: 8900,
    monthlyActive: 12340,
  },
  revenue: {
    mrr: 45600,
    arr: 547200,
    arpu: 29.5,
    ltv: 890,
  },
}
