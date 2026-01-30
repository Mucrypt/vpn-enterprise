import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { DatabasePlatformClient } from '../../database-platform-client'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this'
const API_BASE_URL = process.env.API_BASE_URL || 'https://api.vpnenterprise.com'

interface TenantApiKeys {
  apiUrl: string
  anonKey: string
  serviceKey: string
  projectRef: string
}

/**
 * Generate JWT token for tenant API access
 */
function generateTenantJWT(
  tenantId: string,
  role: 'anon' | 'service_role',
): string {
  const payload = {
    iss: 'vpn-enterprise-database',
    ref: tenantId,
    role: role,
    tenant_id: tenantId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 315360000, // 10 years
  }

  return jwt.sign(payload, JWT_SECRET)
}

/**
 * Get or generate API keys for a tenant
 */
async function getOrGenerateTenantApiKeys(
  tenantId: string,
): Promise<TenantApiKeys> {
  const dbClient = new DatabasePlatformClient()

  // Check if keys already exist in database
  const existingKeys = await dbClient.executeQuery(
    'platform_db',
    `SELECT anon_key, service_role_key FROM tenants WHERE tenant_id = $1`,
    [tenantId],
    'ro',
  )

  let anonKey: string
  let serviceKey: string

  if (
    existingKeys.data &&
    existingKeys.data.length > 0 &&
    existingKeys.data[0].anon_key &&
    existingKeys.data[0].service_role_key
  ) {
    // Use existing keys
    anonKey = existingKeys.data[0].anon_key
    serviceKey = existingKeys.data[0].service_role_key
  } else {
    // Generate new keys
    anonKey = generateTenantJWT(tenantId, 'anon')
    serviceKey = generateTenantJWT(tenantId, 'service_role')

    // Store keys in database
    await dbClient.executeQuery(
      'platform_db',
      `UPDATE tenants 
       SET anon_key = $1, 
           service_role_key = $2,
           api_keys_generated_at = NOW(),
           updated_at = NOW()
       WHERE tenant_id = $3`,
      [anonKey, serviceKey, tenantId],
      'rw',
    )
  }

  return {
    apiUrl: `${API_BASE_URL}/v1/projects/${tenantId}`,
    anonKey,
    serviceKey,
    projectRef: tenantId,
  }
}

/**
 * Regenerate API keys for a tenant
 */
async function regenerateTenantApiKeys(
  tenantId: string,
): Promise<TenantApiKeys> {
  const dbClient = new DatabasePlatformClient()

  // Always generate new keys
  const anonKey = generateTenantJWT(tenantId, 'anon')
  const serviceKey = generateTenantJWT(tenantId, 'service_role')

  // Store keys in database
  await dbClient.executeQuery(
    'platform_db',
    `UPDATE tenants 
     SET anon_key = $1, 
         service_role_key = $2,
         api_keys_generated_at = NOW(),
         updated_at = NOW()
     WHERE tenant_id = $3`,
    [anonKey, serviceKey, tenantId],
    'rw',
  )

  return {
    apiUrl: `${API_BASE_URL}/v1/projects/${tenantId}`,
    anonKey,
    serviceKey,
    projectRef: tenantId,
  }
}

export function registerTenantApiKeyRoutes(router: Router) {
  /**
   * GET /api/v1/tenants/:tenantId/api-keys
   * Get API keys for a tenant
   */
  router.get('/:tenantId/api-keys', async (req, res) => {
    try {
      const { tenantId } = req.params

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID is required' })
      }

      const apiKeys = await getOrGenerateTenantApiKeys(tenantId)

      res.json(apiKeys)
    } catch (error) {
      console.error('Error fetching API keys:', error)
      res.status(500).json({ error: 'Failed to fetch API keys' })
    }
  })

  /**
   * POST /api/v1/tenants/:tenantId/api-keys/generate
   * Regenerate API keys for a tenant
   */
  router.post('/:tenantId/api-keys/generate', async (req, res) => {
    try {
      const { tenantId } = req.params

      if (!tenantId) {
        return res.status(400).json({ error: 'Tenant ID is required' })
      }

      const apiKeys = await regenerateTenantApiKeys(tenantId)

      res.json(apiKeys)
    } catch (error) {
      console.error('Error generating API keys:', error)
      res.status(500).json({ error: 'Failed to generate API keys' })
    }
  })
}
