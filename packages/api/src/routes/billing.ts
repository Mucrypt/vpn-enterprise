import { Router } from 'express'
import type { AuthRequest } from '@vpn-enterprise/auth'
import { authMiddleware } from '@vpn-enterprise/auth'
import {
  getAIModels,
  getUserSubscription,
  checkCredits,
  getServiceUsage,
} from '../middleware/unified-billing'
import { Pool } from 'pg'
import { resolveSecret } from '../utils/secrets'

const router = Router()

// Database connection for billing
let billingPool: Pool

function getBillingPool(): Pool {
  if (!billingPool) {
    const postgresPassword = resolveSecret({
      valueEnv: 'POSTGRES_PASSWORD',
      fileEnv: 'POSTGRES_PASSWORD_FILE',
      defaultFilePath: '/run/secrets/db_password',
    })

    billingPool = new Pool({
      host: process.env.POSTGRES_HOST || 'vpn-postgres',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB || 'platform_db',
      user: process.env.POSTGRES_USER || 'platform_admin',
      password: postgresPassword,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })
  }
  return billingPool
}

/**
 * Ensure user exists in platform_db (sync from Supabase auth)
 * This prevents foreign key violations when creating subscriptions
 */
async function ensureUserExists(
  userId: string,
  userEmail?: string,
): Promise<void> {
  const pool = getBillingPool()

  try {
    console.log(`[Billing] Checking if user ${userId} exists in platform_db`)
    
    // Check if user already exists
    const checkResult = await pool.query(
      'SELECT id FROM "user" WHERE id = $1',
      [userId],
    )

    if (checkResult.rows.length > 0) {
      console.log(`[Billing] User ${userId} already exists`)
      return // User already exists
    }

    // User doesn't exist, create them
    console.log(`[Billing] Creating user ${userId} in platform_db with email: ${userEmail}`)
    const insertResult = await pool.query(
      `INSERT INTO "user" (id, email, "roleSlug", disabled, "mfaEnabled", "createdAt", "updatedAt")
       VALUES ($1, $2, 'global:member', false, false, NOW(), NOW())
       ON CONFLICT (id) DO NOTHING
       RETURNING id`,
      [userId, userEmail || `user-${userId}@vpn-enterprise.local`],
    )

    if (insertResult.rows.length > 0) {
      console.log(`[Billing] User ${userId} created successfully`)
    } else {
      console.log(`[Billing] User ${userId} insert conflict - likely already exists`)
    }
  } catch (error: any) {
    console.error('[Billing] Error ensuring user exists:', {
      userId,
      userEmail,
      error: error.message,
      detail: error.detail,
      code: error.code,
    })
    // Re-throw to prevent subscription creation if user creation fails
    throw new Error(`Failed to ensure user exists: ${error.message}`)
  }
}

/**
 * GET /api/v1/billing/services
 * Get all available services with pricing
 */
router.get('/services', async (req, res) => {
  try {
    // Get AI models
    const aiModels = await getAIModels()

    // Get service pricing from config (optional, will use defaults if not found)
    let pricingConfig = null
    try {
      const pool = getBillingPool()
      const result = await pool.query('SELECT * FROM service_pricing_config')
      pricingConfig = result.rows
    } catch (error) {
      console.error('[Billing API] Error fetching pricing config:', error)
      // Continue with default pricing if config is missing
    }

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

    // Ensure user exists in platform_db
    await ensureUserExists(userId, req.user?.email)

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

    // Ensure user exists in platform_db
    await ensureUserExists(userId, userEmail)

    const { package_name, credits, amount } = req.body

    if (!package_name || !credits || !amount) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // TODO: Create Stripe checkout session
    // For now, just create a pending purchase record
    const pool = getBillingPool()
    const result = await pool.query(
      `INSERT INTO credit_purchases 
       (user_id, credits_amount, bonus_credits, price_paid, payment_status, created_at)
       VALUES ($1, $2, $3, $4, 'pending', NOW())
       RETURNING *`,
      [userId, credits, Math.floor(credits * 0.1), amount],
    )

    const purchase = result.rows[0]

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

      // Ensure user exists in platform_db
      await ensureUserExists(userId, req.user?.email)

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
      const pool = getBillingPool()
      await pool.query(
        `UPDATE service_subscriptions 
         SET tier_name = $1, tier_price = $2, monthly_credits = $3, updated_at = NOW()
         WHERE user_id = $4`,
        [tier_name, config.price, config.monthly_credits, userId],
      )

      const updated = await getUserSubscription(userId)

      res.json({
        success: true,
        subscription: updated,
      })
    } catch (error: any) {
      console.error('[Billing API] Error updating subscription:', error)
      res.status(500).json({
        error: 'Failed to update subscription',
        message: error.message,
      })
    }
  },
)

/**
 * POST /api/v1/billing/subscription/change
 * Change subscription plan (alias for update)
 */
router.post(
  '/subscription/change',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      // Ensure user exists in platform_db before creating subscription
      await ensureUserExists(userId, req.user?.email)

      const { plan_id, price_id } = req.body

      if (!plan_id) {
        return res.status(400).json({ error: 'plan_id is required' })
      }

      // Map plan_id to tier_name
      const planMapping: Record<string, string> = {
        free: 'free',
        starter: 'starter',
        pro: 'professional',
        professional: 'professional',
        enterprise: 'enterprise',
      }

      const tier_name =
        planMapping[plan_id.toLowerCase()] || plan_id.toLowerCase()

      if (
        !['free', 'starter', 'professional', 'enterprise'].includes(tier_name)
      ) {
        return res.status(400).json({ error: 'Invalid plan' })
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

      // Get or create subscription
      let subscription = await getUserSubscription(userId)
      const pool = getBillingPool()

      if (!subscription) {
        // Create new subscription
        const result = await pool.query(
          `INSERT INTO service_subscriptions 
           (user_id, tier_name, tier_price, monthly_credits, credits_remaining, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, 'active', NOW(), NOW())
           RETURNING *`,
          [
            userId,
            tier_name,
            config.price,
            config.monthly_credits,
            config.monthly_credits,
          ],
        )
        subscription = result.rows[0]
      } else {
        // Update existing subscription
        await pool.query(
          `UPDATE service_subscriptions 
           SET tier_name = $1, tier_price = $2, monthly_credits = $3, updated_at = NOW()
           WHERE user_id = $4`,
          [tier_name, config.price, config.monthly_credits, userId],
        )
      }

      res.json({
        success: true,
        subscription,
        message: 'Plan changed successfully',
      })
    } catch (error: any) {
      console.error('[Billing API] Error changing subscription:', error)
      res.status(500).json({
        error: 'Failed to change subscription',
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

/**
 * GET /api/v1/billing/transactions
 * Get user's transaction history
 */
router.get('/transactions', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const limit = parseInt(req.query.limit as string) || 50
    const offset = parseInt(req.query.offset as string) || 0

    const pool = getBillingPool()
    const result = await pool.query(
      `SELECT * FROM service_usage_logs 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset],
    )

    const transactions = result.rows

    // Transform to match expected format
    const formattedTransactions = (transactions || []).map((tx: any) => ({
      id: tx.id,
      amount: tx.credits_charged || 0,
      type: 'debit', // All usage logs are debits
      service_type: tx.service_type,
      operation: tx.operation,
      status: 'completed',
      created_at: tx.created_at,
      metadata: tx.metadata,
    }))

    res.json({ transactions: formattedTransactions })
  } catch (error: any) {
    console.error('[Billing API] Error fetching transactions:', error)
    res.status(500).json({
      error: 'Failed to fetch transactions',
      message: error.message,
      transactions: [],
    })
  }
})

/**
 * GET /api/v1/billing/invoices
 * Get user's invoices (Stripe invoices)
 */
router.get('/invoices', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Get user's Stripe customer ID
    const subscription = await getUserSubscription(userId)

    if (!subscription?.stripe_customer_id) {
      return res.json({ invoices: [] })
    }

    // TODO: Integrate with Stripe to fetch actual invoices
    // For now, return empty array
    res.json({ invoices: [] })
  } catch (error: any) {
    console.error('[Billing API] Error fetching invoices:', error)
    // Return empty array with 200 instead of 500
    res.status(200).json({
      invoices: [],
    })
  }
})

export function registerBillingRoutes(app: any) {
  app.use('/api/v1/billing', router)
}

export default router
