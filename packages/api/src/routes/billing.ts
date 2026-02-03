import { Router } from 'express'
import type { AuthRequest } from '@vpn-enterprise/auth'
import { authMiddleware } from '@vpn-enterprise/auth'
import {
  getAIModels,
  getUserSubscription,
  checkCredits,
  getServiceUsage,
} from '../middleware/unified-billing'
import { supabaseAdmin } from '@vpn-enterprise/database'

const router = Router()

/**
 * GET /api/v1/billing/services
 * Get all available services with pricing
 */
router.get('/services', async (req, res) => {
  try {
    // Get AI models
    const aiModels = await getAIModels()

    // Get service pricing from config
    const { data: pricingConfig, error } = await (supabaseAdmin as any)
      .from('service_pricing_config')
      .select('*')

    if (error) throw error

    res.json({
      services: {
        nexusai: {
          name: 'NexusAI',
          description: 'AI-powered app generation with multiple models',
          type: 'credit-based',
          models: aiModels,
          credit_packages: [
            {
              name: 'Starter Pack',
              credits: 1000,
              price: 9.99,
              bonus: 0,
              savings: '0%',
            },
            {
              name: 'Professional Pack',
              credits: 5000,
              price: 39.99,
              bonus: 500,
              savings: '20%',
            },
            {
              name: 'Business Pack',
              credits: 15000,
              price: 99.99,
              bonus: 3000,
              savings: '33%',
            },
            {
              name: 'Enterprise Pack',
              credits: 50000,
              price: 299.99,
              bonus: 15000,
              savings: '40%',
            },
          ],
        },
        database: {
          name: 'Database Platform',
          description: 'PostgreSQL databases with realtime sync',
          type: 'usage-based',
          pricing:
            pricingConfig?.find((p: any) => p.service_type === 'database')
              ?.pricing || {},
        },
        vpn: {
          name: 'VPN Service',
          description: 'Secure VPN connections with global servers',
          type: 'subscription',
          tiers: [
            { name: 'Free', price: 0, devices: 1, bandwidth: 10, servers: 3 },
            {
              name: 'Basic',
              price: 9.99,
              devices: 3,
              bandwidth: 100,
              servers: 20,
            },
            {
              name: 'Professional',
              price: 19.99,
              devices: 10,
              bandwidth: 500,
              servers: 50,
            },
            {
              name: 'Enterprise',
              price: 49.99,
              devices: 'unlimited',
              bandwidth: 'unlimited',
              servers: 'all',
            },
          ],
        },
        hosting: {
          name: 'App Hosting',
          description: 'Deploy your apps with serverless functions',
          type: 'usage-based',
          pricing:
            pricingConfig?.find((p: any) => p.service_type === 'hosting')
              ?.pricing || {},
        },
      },
      subscriptions: [
        {
          name: 'Free',
          price: 0,
          services: {
            vpn: 'free',
            database: '1 GB storage',
            nexusai: '100 credits/month',
            hosting: '100 GB bandwidth',
          },
          features: [
            '1 VPN device',
            '1 GB database storage',
            '100 AI credits/month',
            '100 GB hosting bandwidth',
          ],
        },
        {
          name: 'Starter',
          price: 29.99,
          popular: true,
          services: {
            vpn: 'basic',
            database: '10 GB storage',
            nexusai: '1000 credits/month',
            hosting: '500 GB bandwidth',
          },
          features: [
            '3 VPN devices',
            '10 GB database storage',
            '1000 AI credits/month',
            '500 GB hosting bandwidth',
            'Email support',
          ],
        },
        {
          name: 'Professional',
          price: 79.99,
          services: {
            vpn: 'professional',
            database: '50 GB storage',
            nexusai: '5000 credits/month + 20% bonus',
            hosting: '2 TB bandwidth',
          },
          features: [
            '10 VPN devices',
            '50 GB database storage',
            '5000 AI credits/month + 20% bonus purchases',
            '2 TB hosting bandwidth',
            'Priority support',
            'Advanced VPN features',
            'Automated backups',
          ],
        },
        {
          name: 'Enterprise',
          price: 299.99,
          services: {
            vpn: 'enterprise',
            database: '500 GB storage',
            nexusai: '25000 credits/month + 40% bonus',
            hosting: 'Unlimited bandwidth',
          },
          features: [
            'Unlimited VPN devices',
            '500 GB database storage',
            '25000 AI credits/month + 40% bonus purchases',
            'Unlimited hosting bandwidth',
            '24/7 support',
            'Dedicated IP',
            'Team management',
            'API access',
          ],
        },
      ],
    })
  } catch (error: any) {
    console.error('[Billing API] Error fetching services:', error)
    res
      .status(500)
      .json({ error: 'Failed to fetch services', message: error.message })
  }
})

/**
 * GET /api/v1/billing/subscription
 * Get user's current subscription
 */
router.get('/subscription', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const subscription = await getUserSubscription(userId)

    if (!subscription) {
      return res.json({
        subscription: null,
        message: 'No subscription found',
      })
    }

    res.json({ subscription })
  } catch (error: any) {
    console.error('[Billing API] Error fetching subscription:', error)
    res
      .status(500)
      .json({ error: 'Failed to fetch subscription', message: error.message })
  }
})

/**
 * GET /api/v1/billing/credits
 * Get user's credit balance
 */
router.get('/credits', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const creditCheck = await checkCredits(userId, 0)

    res.json({
      total: creditCheck.totalCredits,
      monthly: creditCheck.monthlyCredits,
      purchased: creditCheck.purchasedCredits,
      breakdown: {
        monthly_credits: creditCheck.monthlyCredits,
        purchased_credits: creditCheck.purchasedCredits,
        total_available: creditCheck.totalCredits,
      },
    })
  } catch (error: any) {
    console.error('[Billing API] Error fetching credits:', error)
    res
      .status(500)
      .json({ error: 'Failed to fetch credits', message: error.message })
  }
})

/**
 * GET /api/v1/billing/usage
 * Get usage for current billing period
 */
router.get('/usage', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const usage = await getServiceUsage(userId)

    if (!usage) {
      return res.status(404).json({ error: 'No usage data found' })
    }

    // Aggregate by service
    const byService = usage.logs.reduce((acc: any, log: any) => {
      if (!acc[log.service_type]) {
        acc[log.service_type] = {
          total_credits: 0,
          operations: 0,
          logs: [],
        }
      }
      acc[log.service_type].total_credits += log.credits_charged || 0
      acc[log.service_type].operations += 1
      acc[log.service_type].logs.push(log)
      return acc
    }, {})

    res.json({
      subscription: {
        tier: usage.subscription.tier_name,
        credits_remaining: usage.subscription.credits_remaining,
        purchased_credits: usage.subscription.purchased_credits_balance,
        period: usage.period,
      },
      usage: {
        by_service: byService,
        total_logs: usage.logs.length,
        period: usage.period,
      },
      recent_activity: usage.logs.slice(0, 20), // Last 20 activities
    })
  } catch (error: any) {
    console.error('[Billing API] Error fetching usage:', error)
    res
      .status(500)
      .json({ error: 'Failed to fetch usage', message: error.message })
  }
})

/**
 * POST /api/v1/billing/credits/buy
 * Purchase credit package (creates Stripe checkout session)
 */
router.post('/credits/buy', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id
    const userEmail = req.user?.email
    if (!userId || !userEmail) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { package_name, credits, amount } = req.body

    if (!package_name || !credits || !amount) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // TODO: Create Stripe checkout session
    // For now, just create a pending purchase record
    const { data: purchase, error } = await (supabaseAdmin as any)
      .from('credit_purchases')
      .insert({
        user_id: userId,
        package_name,
        credits_purchased: credits,
        bonus_credits: Math.floor(credits * 0.1), // 10% bonus for now
        amount_paid: amount,
        payment_status: 'pending',
        purchase_source: 'web',
      })
      .select()
      .single()

    if (error) throw error

    res.json({
      purchase,
      checkout_url: 'https://checkout.stripe.com/...', // TODO: Real Stripe URL
    })
  } catch (error: any) {
    console.error('[Billing API] Error creating credit purchase:', error)
    res
      .status(500)
      .json({ error: 'Failed to create purchase', message: error.message })
  }
})

/**
 * POST /api/v1/billing/subscription/update
 * Update subscription tier
 */
router.post(
  '/subscription/update',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const { tier_name } = req.body

      if (
        !['free', 'starter', 'professional', 'enterprise'].includes(tier_name)
      ) {
        return res.status(400).json({ error: 'Invalid tier' })
      }

      // Define tier properties
      const tierConfig: any = {
        free: { price: 0, monthly_credits: 100, storage_limit: 1 },
        starter: { price: 29.99, monthly_credits: 1000, storage_limit: 10 },
        professional: {
          price: 79.99,
          monthly_credits: 5000,
          storage_limit: 50,
        },
        enterprise: {
          price: 299.99,
          monthly_credits: 25000,
          storage_limit: 500,
        },
      }

      const config = tierConfig[tier_name]

      // Update subscription
      const { error } = await (supabaseAdmin as any)
        .from('service_subscriptions')
        .update({
          tier_name,
          tier_price: config.price,
          monthly_credits: config.monthly_credits,
          database_storage_limit_gb: config.storage_limit,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)

      if (error) throw error

      const updated = await getUserSubscription(userId)

      res.json({
        success: true,
        subscription: updated,
      })
    } catch (error: any) {
      console.error('[Billing API] Error updating subscription:', error)
      res
        .status(500)
        .json({
          error: 'Failed to update subscription',
          message: error.message,
        })
    }
  },
)

/**
 * GET /api/v1/billing/models
 * Get available AI models with pricing
 */
router.get('/models', async (req, res) => {
  try {
    const models = await getAIModels()
    res.json({ models })
  } catch (error: any) {
    console.error('[Billing API] Error fetching models:', error)
    res
      .status(500)
      .json({ error: 'Failed to fetch models', message: error.message })
  }
})

export function registerBillingRoutes(app: any) {
  app.use('/api/v1/billing', router)
}

export default router
