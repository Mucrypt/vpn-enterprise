import type { Response, NextFunction } from 'express'
import type { AuthRequest } from '@vpn-enterprise/auth'
import { supabaseAdmin } from '@vpn-enterprise/database'

export interface BillingConfig {
  ai_generation_cost: number // Credits per AI generation
  database_provision_cost: number // Credits per database provisioned
  database_storage_cost_per_gb: number // Credits per GB per month
}

const BILLING_CONFIG: BillingConfig = {
  ai_generation_cost: 10, // 10 credits per generation
  database_provision_cost: 20, // 20 credits to provision
  database_storage_cost_per_gb: 5, // 5 credits per GB per month
}

/**
 * Check if user has enough credits for an operation
 */
export async function checkCredits(
  userId: string,
  requiredCredits: number,
): Promise<{ hasCredits: boolean; currentCredits: number }> {
  try {
    // Get user's current subscription and credits
    const { data: subscription, error } = await (supabaseAdmin as any)
      .from('user_subscriptions')
      .select('plan_type, credits_remaining, credits_limit')
      .eq('user_id', userId)
      .single()

    if (error || !subscription) {
      // No subscription found, check if they have a default free tier
      return { hasCredits: false, currentCredits: 0 }
    }

    const currentCredits = subscription.credits_remaining || 0

    return {
      hasCredits: currentCredits >= requiredCredits,
      currentCredits,
    }
  } catch (error) {
    console.error('[Billing] Error checking credits:', error)
    return { hasCredits: false, currentCredits: 0 }
  }
}

/**
 * Deduct credits from user's account
 */
export async function deductCredits(
  userId: string,
  amount: number,
  operation: string,
): Promise<{ success: boolean; newBalance: number }> {
  try {
    // Start transaction to deduct credits
    const { data: subscription, error: fetchError } = await (
      supabaseAdmin as any
    )
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (fetchError || !subscription) {
      throw new Error('Subscription not found')
    }

    const currentCredits = subscription.credits_remaining || 0
    const newBalance = currentCredits - amount

    if (newBalance < 0) {
      return { success: false, newBalance: currentCredits }
    }

    // Update credits
    const { error: updateError } = await (supabaseAdmin as any)
      .from('user_subscriptions')
      .update({
        credits_remaining: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    if (updateError) {
      throw updateError
    }

    // Log the transaction
    await (supabaseAdmin as any).from('billing_transactions').insert({
      user_id: userId,
      amount: -amount,
      operation,
      balance_after: newBalance,
      created_at: new Date().toISOString(),
    })

    console.log(
      `[Billing] Deducted ${amount} credits from user ${userId} for ${operation}. New balance: ${newBalance}`,
    )

    return { success: true, newBalance }
  } catch (error) {
    console.error('[Billing] Error deducting credits:', error)
    return { success: false, newBalance: 0 }
  }
}

/**
 * Middleware to check and deduct credits for AI generation
 */
export function requireCreditsForAI(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const requiredCredits = BILLING_CONFIG.ai_generation_cost
      const { hasCredits, currentCredits } = await checkCredits(
        userId,
        requiredCredits,
      )

      if (!hasCredits) {
        return res.status(402).json({
          error: 'insufficient_credits',
          message: `You need ${requiredCredits} credits to generate an app. You have ${currentCredits} credits.`,
          required: requiredCredits,
          available: currentCredits,
          upgrade_url: 'https://chatbuilds.com/dashboard/billing',
        })
      }

      // Deduct credits
      const { success, newBalance } = await deductCredits(
        userId,
        requiredCredits,
        'ai_generation',
      )

      if (!success) {
        return res.status(500).json({
          error: 'billing_error',
          message: 'Failed to process payment',
        })
      }

      // Attach billing info to request for logging
      ;(req as any).billing = {
        creditsDeducted: requiredCredits,
        newBalance,
      }

      next()
    } catch (error) {
      console.error('[Billing] Error in requireCreditsForAI:', error)
      res.status(500).json({ error: 'Internal billing error' })
    }
  }
}

/**
 * Middleware to check credits for database provisioning
 */
export function requireCreditsForDatabase(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const requiredCredits = BILLING_CONFIG.database_provision_cost
      const { hasCredits, currentCredits } = await checkCredits(
        userId,
        requiredCredits,
      )

      if (!hasCredits) {
        return res.status(402).json({
          error: 'insufficient_credits',
          message: `You need ${requiredCredits} credits to provision a database. You have ${currentCredits} credits.`,
          required: requiredCredits,
          available: currentCredits,
          upgrade_url: 'https://chatbuilds.com/dashboard/billing',
        })
      }

      // Deduct credits
      const { success, newBalance } = await deductCredits(
        userId,
        requiredCredits,
        'database_provision',
      )

      if (!success) {
        return res.status(500).json({
          error: 'billing_error',
          message: 'Failed to process payment',
        })
      }

      // Attach billing info to request
      ;(req as any).billing = {
        creditsDeducted: requiredCredits,
        newBalance,
      }

      next()
    } catch (error) {
      console.error('[Billing] Error in requireCreditsForDatabase:', error)
      res.status(500).json({ error: 'Internal billing error' })
    }
  }
}

/**
 * Get billing configuration (publicly accessible)
 */
export function getBillingConfig(): BillingConfig {
  return BILLING_CONFIG
}
