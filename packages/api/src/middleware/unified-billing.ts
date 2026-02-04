import type { Response, NextFunction } from 'express'
import type { AuthRequest } from '@vpn-enterprise/auth'
import { Pool } from 'pg'
import { resolveSecret } from '../utils/secrets'

/**
 * Unified Billing Service for VPN Enterprise
 * Handles all billing operations across VPN, Database, NexusAI, and Hosting services
 * Uses platform_db PostgreSQL database
 */

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

interface AIModelPricing {
  model_id: string
  model_name: string
  provider: string
  user_input_cost_per_1m: number
  user_output_cost_per_1m: number
  markup_multiplier: number
  is_available: boolean
}

interface CreditCalculation {
  credits_required: number
  cost_breakdown: {
    model: string
    input_tokens: number
    output_tokens: number
    input_cost_usd: number
    output_cost_usd: number
    total_cost_usd: number
    markup_multiplier: number
  }
}

/**
 * Get available AI models with pricing
 */
export async function getAIModels(): Promise<AIModelPricing[]> {
  try {
    const pool = getBillingPool()
    const result = await pool.query(
      `SELECT model_id, model_name, provider, input_cost_per_1m as user_input_cost_per_1m, 
              output_cost_per_1m as user_output_cost_per_1m, markup_multiplier, is_available
       FROM ai_model_pricing 
       WHERE is_available = true 
       ORDER BY provider, model_name`,
    )
    return result.rows || []
  } catch (error) {
    console.error('[Billing] Error fetching AI models:', error)
    return []
  }
}

/**
 * Calculate AI generation cost based on model and token usage
 */
export async function calculateAICost(
  modelId: string,
  inputTokens: number,
  outputTokens: number,
): Promise<CreditCalculation | null> {
  try {
    const pool = getBillingPool()
    const result = await pool.query(
      `SELECT credits_per_1k_input * ($2::numeric / 1000) + credits_per_1k_output * ($3::numeric / 1000) as credits_required
       FROM ai_model_pricing
       WHERE model_id = $1 AND is_available = true`,
      [modelId, inputTokens, outputTokens],
    )

    if (result.rows.length === 0) return null

    return {
      credits_required: Math.ceil(result.rows[0].credits_required),
      cost_breakdown: {
        model: modelId,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        input_cost_usd: 0,
        output_cost_usd: 0,
        total_cost_usd: 0,
        markup_multiplier: 3.0,
      },
    }
  } catch (error) {
    console.error('[Billing] Error calculating AI cost:', error)
    return null
  }
}

/**
 * Get user's current subscription with all credits
 */
export async function getUserSubscription(userId: string) {
  try {
    const pool = getBillingPool()
    const result = await pool.query(
      'SELECT * FROM service_subscriptions WHERE user_id = $1',
      [userId],
    )

    if (result.rows.length === 0) {
      return null
    }

    return result.rows[0]
  } catch (error) {
    console.error('[Billing] Error fetching subscription:', error)
    return null
  }
}

/**
 * Check if user has enough credits (monthly + purchased)
 * Prioritizes monthly credits first, then purchased credits
 */
export async function checkCredits(
  userId: string,
  requiredCredits: number,
): Promise<{
  hasCredits: boolean
  totalCredits: number
  monthlyCredits: number
  purchasedCredits: number
}> {
  try {
    const subscription = await getUserSubscription(userId)

    if (!subscription) {
      return {
        hasCredits: false,
        totalCredits: 0,
        monthlyCredits: 0,
        purchasedCredits: 0,
      }
    }

    const monthlyCredits = subscription.credits_remaining || 0
    const purchasedCredits = subscription.purchased_credits_balance || 0
    const totalCredits = monthlyCredits + purchasedCredits

    return {
      hasCredits: totalCredits >= requiredCredits,
      totalCredits,
      monthlyCredits,
      purchasedCredits,
    }
  } catch (error) {
    console.error('[Billing] Error checking credits:', error)
    return {
      hasCredits: false,
      totalCredits: 0,
      monthlyCredits: 0,
      purchasedCredits: 0,
    }
  }
}

/**
 * Deduct credits from user's account
 * Uses monthly credits first, then purchased credits
 */
export async function deductCredits(
  userId: string,
  amount: number,
  operation: string,
  metadata?: any,
): Promise<{ success: boolean; newBalance: number; source: string }> {
  try {
    const subscription = await getUserSubscription(userId)

    if (!subscription) {
      throw new Error('No subscription found')
    }

    let monthlyCredits = subscription.credits_remaining || 0
    let purchasedCredits = subscription.purchased_credits_balance || 0
    let amountFromMonthly = 0
    let amountFromPurchased = 0
    let balanceSource = 'monthly'

    // Deduct from monthly credits first
    if (monthlyCredits >= amount) {
      monthlyCredits -= amount
      amountFromMonthly = amount
    } else {
      // Use all monthly credits, then deduct from purchased
      amountFromMonthly = monthlyCredits
      amountFromPurchased = amount - monthlyCredits
      monthlyCredits = 0
      purchasedCredits -= amountFromPurchased

      if (purchasedCredits < 0) {
        return {
          success: false,
          newBalance:
            subscription.credits_remaining +
            subscription.purchased_credits_balance,
          source: 'insufficient',
        }
      }

      balanceSource = amountFromPurchased > 0 ? 'purchased' : 'monthly'
    }

    // Update subscription
    const pool = getBillingPool()
    await pool.query(
      `UPDATE service_subscriptions 
       SET credits_remaining = $1, purchased_credits_balance = $2, 
           credits_used_this_month = $3, updated_at = NOW()
       WHERE user_id = $4`,
      [
        monthlyCredits,
        purchasedCredits,
        (subscription.credits_used_this_month || 0) + amountFromMonthly,
        userId,
      ],
    )

    // Log usage
    await pool.query(
      `INSERT INTO service_usage_logs 
       (user_id, service_type, operation, credits_charged, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        userId,
        metadata?.service_type || 'nexusai',
        operation,
        amount,
        JSON.stringify(metadata || {}),
      ],
    )

    console.log(
      `[Billing] Deducted ${amount} credits from user ${userId} for ${operation}. ` +
        `Monthly: ${amountFromMonthly}, Purchased: ${amountFromPurchased}. ` +
        `New balance: ${monthlyCredits + purchasedCredits}`,
    )

    return {
      success: true,
      newBalance: monthlyCredits + purchasedCredits,
      source: balanceSource,
    }
  } catch (error) {
    console.error('[Billing] Error deducting credits:', error)
    return { success: false, newBalance: 0, source: 'error' }
  }
}

/**
 * Middleware for AI generation with dynamic model pricing
 * Usage: router.post('/generate', requireCreditsForAI('gpt-4o', 1000, 3000), handler)
 */
export function requireCreditsForAI(
  modelIdOrExtractor?: string | ((req: AuthRequest) => string),
  estimatedInputTokens: number = 1000,
  estimatedOutputTokens: number = 3000,
) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      // Extract model ID from request or use provided
      let modelId: string
      if (typeof modelIdOrExtractor === 'function') {
        modelId = modelIdOrExtractor(req)
      } else if (modelIdOrExtractor) {
        modelId = modelIdOrExtractor
      } else {
        modelId = req.body.model || req.query.model || 'gpt-4o-mini' // default
      }

      // Get actual token counts if provided in request
      const inputTokens = req.body.estimatedInputTokens || estimatedInputTokens
      const outputTokens =
        req.body.estimatedOutputTokens || estimatedOutputTokens

      // Calculate cost
      const costCalc = await calculateAICost(modelId, inputTokens, outputTokens)

      if (!costCalc) {
        return res.status(400).json({
          error: 'invalid_model',
          message: `Model ${modelId} is not available or pricing not configured`,
        })
      }

      const requiredCredits = costCalc.credits_required

      // Check credits
      const creditCheck = await checkCredits(userId, requiredCredits)

      if (!creditCheck.hasCredits) {
        return res.status(402).json({
          error: 'insufficient_credits',
          message: `You need ${requiredCredits} credits to use ${costCalc.cost_breakdown.model}. You have ${creditCheck.totalCredits} credits.`,
          required: requiredCredits,
          available: creditCheck.totalCredits,
          breakdown: {
            monthly: creditCheck.monthlyCredits,
            purchased: creditCheck.purchasedCredits,
          },
          upgrade_url: 'https://chatbuilds.com/dashboard/billing',
          buy_credits_url:
            'https://chatbuilds.com/dashboard/billing?action=buy-credits',
        })
      }

      // Deduct credits
      const { success, newBalance, source } = await deductCredits(
        userId,
        requiredCredits,
        'ai_generation',
        {
          service_type: 'nexusai',
          model_used: modelId,
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          total_tokens: inputTokens + outputTokens,
          cost_breakdown: costCalc.cost_breakdown,
        },
      )

      if (!success) {
        return res.status(500).json({
          error: 'billing_error',
          message: 'Failed to process payment',
        })
      }

      // Attach billing info to request for response
      ;(req as any).billing = {
        creditsDeducted: requiredCredits,
        newBalance,
        source,
        model: costCalc.cost_breakdown.model,
        costBreakdown: costCalc.cost_breakdown,
      }

      next()
    } catch (error) {
      console.error('[Billing] Error in requireCreditsForAI:', error)
      res.status(500).json({ error: 'Internal billing error' })
    }
  }
}

/**
 * Middleware for database provisioning
 */
export function requireCreditsForDatabase() {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const requiredCredits = 20 // Fixed cost for database provisioning

      const creditCheck = await checkCredits(userId, requiredCredits)

      if (!creditCheck.hasCredits) {
        return res.status(402).json({
          error: 'insufficient_credits',
          message: `You need ${requiredCredits} credits to provision a database. You have ${creditCheck.totalCredits} credits.`,
          required: requiredCredits,
          available: creditCheck.totalCredits,
          breakdown: {
            monthly: creditCheck.monthlyCredits,
            purchased: creditCheck.purchasedCredits,
          },
          upgrade_url: 'https://chatbuilds.com/dashboard/billing',
        })
      }

      const { success, newBalance, source } = await deductCredits(
        userId,
        requiredCredits,
        'database_provision',
        {
          service_type: 'database',
        },
      )

      if (!success) {
        return res.status(500).json({
          error: 'billing_error',
          message: 'Failed to process payment',
        })
      }

      ;(req as any).billing = {
        creditsDeducted: requiredCredits,
        newBalance,
        source,
      }

      next()
    } catch (error) {
      console.error('[Billing] Error in requireCreditsForDatabase:', error)
      res.status(500).json({ error: 'Internal billing error' })
    }
  }
}

/**
 * Get service usage for current billing period
 */
export async function getServiceUsage(userId: string) {
  try {
    const subscription = await getUserSubscription(userId)
    if (!subscription) return null

    const pool = getBillingPool()
    const result = await pool.query(
      `SELECT * FROM service_usage_logs 
       WHERE user_id = $1 
         AND created_at >= $2 
         AND created_at <= $3
       ORDER BY created_at DESC`,
      [
        userId,
        subscription.current_period_start,
        subscription.current_period_end,
      ],
    )

    return {
      subscription,
      logs: result.rows || [],
      period: {
        start: subscription.current_period_start,
        end: subscription.current_period_end,
      },
    }
  } catch (error) {
    console.error('[Billing] Error fetching service usage:', error)
    return null
  }
}
