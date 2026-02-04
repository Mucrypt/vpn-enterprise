'use client'

import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SubscriptionOverview } from '@/components/billing/SubscriptionOverview'
import { PricingPlans } from '@/components/billing/PricingPlans'
import {
  ServiceManagement,
  DEFAULT_SERVICES,
} from '@/components/billing/ServiceManagement'
import { BillingHistory } from '@/components/billing/BillingHistory'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { Package, Settings, History } from 'lucide-react'

export default function BillingPage() {
  const [subscription, setSubscription] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [services, setServices] = useState(DEFAULT_SERVICES)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadBillingData()
  }, [])

  async function loadBillingData() {
    try {
      setLoading(true)

      // Load all billing data in parallel
      const [subData, transData, invoicesData, servicesData] =
        await Promise.all([
          api.fetchAPI('/api/v1/billing/subscription').catch(() => null),
          api
            .fetchAPI('/api/v1/billing/transactions')
            .catch(() => ({ transactions: [] })),
          api
            .fetchAPI('/api/v1/billing/invoices')
            .catch(() => ({ invoices: [] })),
          api
            .fetchAPI('/api/v1/billing/services')
            .catch(() => ({ services: DEFAULT_SERVICES })),
        ])

      setSubscription(subData)
      setTransactions(transData.transactions || [])
      setInvoices(invoicesData.invoices || [])

      // Merge API services with defaults
      if (servicesData?.services) {
        setServices(servicesData.services)
      }
    } catch (error: any) {
      console.error('Failed to load billing data:', error)
      toast.error('Failed to load billing data')
    } finally {
      setLoading(false)
    }
  }

  async function handleSelectPlan(planId: string, stripePriceId?: string) {
    try {
      if (!stripePriceId) {
        // Handle free plan or plans without Stripe
        toast.loading('Processing subscription change...', { id: 'plan-change' })
        
        const response = await api.fetchAPI(
          '/api/v1/billing/subscription/change',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan_id: planId }),
          },
        )

        toast.success('Plan updated successfully!', { id: 'plan-change' })
        await loadBillingData()
        return
      }

      // Detect if this is a credit purchase or subscription
      const isCreditPurchase =
        planId === 'starter' ||
        planId === 'popular' ||
        (planId === 'pro' && stripePriceId.includes('A17KQ')) ||
        (planId === 'enterprise' && stripePriceId.includes('A1WKQ'))

      // Create Stripe checkout session and redirect
      toast.loading('Redirecting to payment...', { id: 'plan-change' })
      
      const response = await api.fetchAPI(
        '/api/v1/billing/create-checkout-session',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            priceId: stripePriceId,
            planId,
            mode: isCreditPurchase ? 'payment' : 'subscription',
            successUrl: `${window.location.origin}/dashboard/billing?session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${window.location.origin}/dashboard/billing`,
          }),
        },
      )

      if (!response.url) {
        throw new Error('Failed to create checkout session')
      }

      // Redirect to Stripe Checkout
      window.location.href = response.url
    } catch (error: any) {
      console.error('Failed to select plan:', error)
      toast.error(error.message || 'Failed to process payment', { id: 'plan-change' })
      throw error
    }
  }

  async function handleToggleService(serviceId: string, enabled: boolean) {
    try {
      await api.fetchAPI(`/api/v1/billing/services/${serviceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      })

      // Update local state
      setServices((prev) =>
        prev.map((service) =>
          service.id === serviceId
            ? { ...service, enabled, status: enabled ? 'active' : 'inactive' }
            : service,
        ),
      )
    } catch (error: any) {
      console.error('Failed to toggle service:', error)
      throw error
    }
  }

  async function handleUpgrade() {
    setActiveTab('plans')
  }

  return (
    <div className='space-y-6 p-6'>
      {/* Header */}
      <div className='space-y-2'>
        <h1 className='text-3xl font-bold tracking-tight text-foreground'>
          Billing & Subscriptions
        </h1>
        <p className='text-muted-foreground'>
          Manage your subscription, credits, and payment methods
        </p>
      </div>

      {/* Subscription Overview - Always Visible */}
      <SubscriptionOverview
        subscription={subscription}
        onUpgrade={handleUpgrade}
        loading={loading}
      />

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
        <TabsList className='grid w-full grid-cols-3 lg:w-fit bg-muted'>
          <TabsTrigger
            value='plans'
            className='gap-2 data-[state=active]:bg-background'
          >
            <Package className='w-4 h-4' />
            <span className='hidden sm:inline'>Plans & Credits</span>
            <span className='sm:hidden'>Plans</span>
          </TabsTrigger>
          <TabsTrigger
            value='services'
            className='gap-2 data-[state=active]:bg-background'
          >
            <Settings className='w-4 h-4' />
            <span className='hidden sm:inline'>Services</span>
            <span className='sm:hidden'>Services</span>
          </TabsTrigger>
          <TabsTrigger
            value='history'
            className='gap-2 data-[state=active]:bg-background'
          >
            <History className='w-4 h-4' />
            <span className='hidden sm:inline'>History</span>
            <span className='sm:hidden'>History</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value='plans' className='mt-6'>
          <PricingPlans
            currentPlan={subscription?.plan_type}
            onSelectPlan={handleSelectPlan}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value='services' className='mt-6'>
          <ServiceManagement
            services={services}
            onToggleService={handleToggleService}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value='history' className='mt-6'>
          <BillingHistory
            transactions={transactions}
            invoices={invoices}
            loading={loading}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
