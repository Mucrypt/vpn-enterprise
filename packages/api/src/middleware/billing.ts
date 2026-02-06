import type { Response, NextFunction } from 'express'
import type { AuthRequest } from '@vpn-enterprise/auth'
import { Pool } from 'pg'
import { resolveSecret } from '../utils/secrets'

// Database connection for unified billing
let billingPool: Pool

function getBillingPool(): Pool {
  if (!billingPool) {
    const postgresPassword = resolveSecret({
      valueEnv: 'POSTGRES_PASSWORD',
      fileEnv: 'POSTGRES_PASSWORD_FILE',
      defaultFilePath: '/run/secrets/db_password',
    })

    billingPool = new Pool({
      host: process.env.POSTGRES_HOST || 'localhost',
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

// Service types
export type ServiceType = 'nexusai' | 'database' | 'vpn'

// AI Model pricing configuration with markup for profit
export const AI_MODEL_PRICING: Record<
  string,
  { input: number; output: number; credits_per_1k_tokens: number }
> = {
  // OpenAI Models (cost + 40% markup for profit)
  'gpt-4': { input: 0.042, output: 0.126, credits_per_1k_tokens: 5 }, // $0.03 input + 40% = $0.042
  'gpt-4-turbo': { input: 0.014, output: 0.042, credits_per_1k_tokens: 2 },
  'gpt-4o': { input: 0.007, output: 0.021, credits_per_1k_tokens: 1 },
  'gpt-3.5-turbo': {
    input: 0.0007,
    output: 0.0021,
    credits_per_1k_tokens: 0.5,
  },

  // Anthropic Models (cost + 40% markup for profit)
  'claude-3-opus': { input: 0.021, output: 0.063, credits_per_1k_tokens: 3 },
  'claude-3-sonnet': {
    input: 0.0042,
    output: 0.021,
    credits_per_1k_tokens: 1.5,
  },
  'claude-3-haiku': {
    input: 0.00035,
    output: 0.00175,
    credits_per_1k_tokens: 0.3,
  },
  'claude-3.5-sonnet': {
    input: 0.0042,
    output: 0.021,
    credits_per_1k_tokens: 1.5,
  },
}

// Service costs in credits
export const SERVICE_COSTS = {
  nexusai: {
    generation_base: 10, // Base cost per generation (adjusted by model)
    tokens_included: 2000, // Base tokens included
  },
  database: {
    provision: 20, // Cost to create new database
    storage_per_gb_month: 5, // Monthly storage cost
    queries_per_1k: 0.1, // Cost per 1000 queries
  },
  vpn: {
    connection_per_hour: 2, // Cost per hour connected
    bandwidth_per_gb: 1, // Cost per GB transferred
  },
}

/**
 * Check if user is admin or super_admin (bypass billing during development)
 */
export async function isAdminUser(userId: string): Promise<boolean> {
  try {
    const pool = getBillingPool()
    const result = await pool.query('SELECT "roleSlug" FROM "user" WHERE id = $1', [
      userId,
    ])

    if (result.rows.length === 0) return false

    const roleSlug = result.rows[0].roleSlug || ''
    return roleSlug.includes('admin') || roleSlug.includes('super')
  } catch (error) {
    console.error('[Billing] Error checking admin status:', error)
    return false
  }
}

/**
 * Get user's current credit balance and subscription info
 */
export async function getUserCredits(userId: string): Promise<{
  credits: number
  planType: string
  isAdmin: boolean
}> {
  try {
    const pool = getBillingPool()

    // Check if admin first
    const isAdmin = await isAdminUser(userId)

    // Get subscription from new service_subscriptions table
    const result = await pool.query(
      `SELECT tier_name, credits_remaining, purchased_credits_balance, monthly_credits 
       FROM service_subscriptions 
       WHERE user_id = $1`,
      [userId],
    )

    if (result.rows.length === 0) {
      // Create default free subscription in service_subscriptions
      await pool.query(
        `INSERT INTO service_subscriptions (user_id, tier_name, tier_price, monthly_credits, credits_remaining, purchased_credits_balance)
         VALUES ($1, 'free', 0, 100, 100, 0)
         ON CONFLICT (user_id) DO NOTHING`,
        [userId],
      )

      return {
        credits: 100,
        planType: 'free',
        isAdmin,
      }
    }

    // Total credits = monthly credits remaining + purchased credits (never expire)
    const totalCredits = (result.rows[0].credits_remaining || 0) + (result.rows[0].purchased_credits_balance || 0)

    return {
      credits: totalCredits,
      planType: result.rows[0].tier_name,
      isAdmin,
    }
  } catch (error) {
    console.error('[Billing] Error getting user credits:', error)
    return { credits: 0, planType: 'free', isAdmin: false }
  }
}

/**
 * Calculate AI generation cost based on model and tokens
 */
export function calculateAICost(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const modelPricing =
    AI_MODEL_PRICING[model] || AI_MODEL_PRICING['gpt-3.5-turbo']

  const inputCost = (inputTokens / 1000) * modelPricing.input
  const outputCost = (outputTokens / 1000) * modelPricing.output

  // Convert USD to credits (1 credit = $0.01, so multiply by 100)
  const totalCredits = Math.ceil((inputCost + outputCost) * 100)

  // Minimum 1 credit per generation
  return Math.max(totalCredits, 1)
}

/**
 * Deduct credits from user account
 */
export async function deductCredits(
  userId: string,
  amount: number,
  serviceType: ServiceType,
  operation: string,
  metadata?: any,
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  const pool = getBillingPool()

  try {
    // Start transaction
    await pool.query('BEGIN')

    // Get current balance with row lock from service_subscriptions
    const balanceResult = await pool.query(
      `SELECT credits_remaining, purchased_credits_balance 
       FROM service_subscriptions 
       WHERE user_id = $1 
       FOR UPDATE`,
      [userId],
    )

    if (balanceResult.rows.length === 0) {
      await pool.query('ROLLBACK')
      return { success: false, newBalance: 0, error: 'Subscription not found' }
    }

    const monthlyCredits = balanceResult.rows[0].credits_remaining || 0
    const purchasedCredits = balanceResult.rows[0].purchased_credits_balance || 0
    const currentBalance = monthlyCredits + purchasedCredits

    if (currentBalance < amount) {
      await pool.query('ROLLBACK')
      return {
        success: false,
        newBalance: currentBalance,
        error: 'Insufficient credits',
      }
    }

    // Deduct from monthly credits first, then purchased credits
    let remainingToDeduct = amount
    let newMonthlyCredits = monthlyCredits
    let newPurchasedCredits = purchasedCredits

    if (monthlyCredits >= remainingToDeduct) {
      // Enough monthly credits
      newMonthlyCredits = monthlyCredits - remainingToDeduct
    } else {
      // Use all monthly credits, then deduct from purchased
      remainingToDeduct -= monthlyCredits
      newMonthlyCredits = 0
      newPurchasedCredits = purchasedCredits - remainingToDeduct
    }

    const newBalance = newMonthlyCredits + newPurchasedCredits

    // Update balance in service_subscriptions
    await pool.query(
      `UPDATE service_subscriptions 
       SET credits_remaining = $1, 
           purchased_credits_balance = $2,
           updated_at = NOW() 
       WHERE user_id = $3`,
      [newMonthlyCredits, newPurchasedCredits, userId],
    )

    // Log transaction - billing_transactions only has: user_id, amount, operation, metadata, balance_after
    await pool.query(
      `INSERT INTO billing_transactions 
       (user_id, amount, operation, metadata, balance_after)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        userId,
        amount,
        `${serviceType}:${operation}`, // Combined into operation field
        JSON.stringify(metadata || {}),
        newBalance,
      ],
    )

    await pool.query('COMMIT')

    console.log(
      `[Billing] Deducted ${amount} credits from user ${userId} for ${serviceType}:${operation}. Balance: ${currentBalance} → ${newBalance} (monthly: ${monthlyCredits}→${newMonthlyCredits}, purchased: ${purchasedCredits}→${newPurchasedCredits})`,
    )

    return { success: true, newBalance }
  } catch (error) {
    await pool.query('ROLLBACK')
    console.error('[Billing] Error deducting credits:', error)
    return {
      success: false,
      newBalance: 0,
      error: 'Transaction failed',
    }
  }
}

/**
 * Middleware to check and deduct credits for AI generation
 * Admins bypass billing during development
 */
export async function requireCreditsForAI(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Check if admin - bypass billing
    const isAdmin = await isAdminUser(userId)
    if (isAdmin) {
      console.log(
        `[Billing] Admin user ${userId} bypassing AI generation billing`,
      )
      ;(req as any).billing = {
        creditsDeducted: 0,
        newBalance: -1,
        isAdmin: true,
      }
      return next()
    }

    const requiredCredits = SERVICE_COSTS.nexusai.generation_base
    const { credits, planType } = await getUserCredits(userId)

    if (credits < requiredCredits) {
      return res.status(402).json({
        error: 'insufficient_credits',
        message: `You need ${requiredCredits} credits to generate an app. You have ${credits} credits.`,
        required: requiredCredits,
        available: credits,
        upgrade_url: 'https://chatbuilds.com/dashboard/billing',
      })
    }

    // Deduct credits
    const { success, newBalance, error } = await deductCredits(
      userId,
      requiredCredits,
      'nexusai',
      'ai_generation',
      { planType },
    )

    if (!success) {
      // If subscription not found, bypass billing for development
      if (error === 'Subscription not found') {
        console.log(
          `[Billing] User ${userId} has no subscription, bypassing billing for development`,
        )
        ;(req as any).billing = {
          creditsDeducted: 0,
          newBalance: -1,
          isDevelopment: true,
        }
        return next()
      }

      return res.status(500).json({
        error: 'billing_error',
        message: error || 'Failed to process payment',
      })
    }

    // Attach billing info to request for logging
    ;(req as any).billing = {
      creditsDeducted: requiredCredits,
      newBalance,
      isAdmin: false,
    }

    next()
  } catch (error) {
    console.error('[Billing] Error in requireCreditsForAI:', error)
    res.status(500).json({ error: 'Internal billing error' })
  }
}

/**
 * Middleware to check credits for database provisioning
 * Admins bypass billing during development
 */
export async function requireCreditsForDatabase(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Check if admin - bypass billing
    const isAdmin = await isAdminUser(userId)
    if (isAdmin) {
      console.log(
        `[Billing] Admin user ${userId} bypassing database provisioning billing`,
      )
      ;(req as any).billing = {
        creditsDeducted: 0,
        newBalance: -1,
        isAdmin: true,
      }
      return next()
    }

    const requiredCredits = SERVICE_COSTS.database.provision
    const { credits, planType } = await getUserCredits(userId)

    if (credits < requiredCredits) {
      return res.status(402).json({
        error: 'insufficient_credits',
        message: `You need ${requiredCredits} credits to provision a database. You have ${credits} credits.`,
        required: requiredCredits,
        available: credits,
        upgrade_url: 'https://chatbuilds.com/dashboard/billing',
      })
    }

    // Deduct credits
    const { success, newBalance, error } = await deductCredits(
      userId,
      requiredCredits,
      'database',
      'database_provision',
      { planType },
    )

    if (!success) {
      // If subscription not found, bypass billing for development
      if (error === 'Subscription not found') {
        console.log(
          `[Billing] User ${userId} has no subscription, bypassing database billing for development`,
        )
        ;(req as any).billing = {
          creditsDeducted: 0,
          newBalance: -1,
          isDevelopment: true,
        }
        return next()
      }

      return res.status(500).json({
        error: 'billing_error',
        message: error || 'Failed to process payment',
      })
    }

    // Attach billing info to request
    ;(req as any).billing = {
      creditsDeducted: requiredCredits,
      newBalance,
      isAdmin: false,
    }

    next()
  } catch (error) {
    console.error('[Billing] Error in requireCreditsForDatabase:', error)
    res.status(500).json({ error: 'Internal billing error' })
  }
}
