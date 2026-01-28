import type { Router } from 'express'
import type { TenantAuthRequest } from '../../types/tenant-access'
import { DatabasePlatformClient } from '../../database-platform-client'

export function registerTenantQueryRoutes(router: Router) {
  router.post('/:tenantId/query', async (req, res) => {
    try {
      const { tenantId } = req.params
      const { sql } = req.body

      if (!sql) {
        return res.status(400).json({ error: 'SQL query is required' })
      }

      const loweredSql = String(sql).toLowerCase().trim()

      const dangerousKeywords = [
        'drop database',
        'drop schema',
        'truncate',
        'delete from pg_',
      ]
      const isDangerous = dangerousKeywords.some((keyword) =>
        loweredSql.includes(keyword),
      )

      if (isDangerous) {
        return res
          .status(400)
          .json({ error: 'Dangerous SQL operations are not allowed' })
      }

      const isSelect =
        loweredSql.startsWith('select') || loweredSql.startsWith('with')
      if (!isSelect) {
        const typedReq = req as TenantAuthRequest
        const role = typedReq.tenantAccess?.role
        if (
          process.env.NODE_ENV !== 'development' &&
          role !== 'owner' &&
          role !== 'admin' &&
          role !== 'editor'
        ) {
          return res.status(403).json({
            success: false,
            error: 'Insufficient tenant permissions for write queries',
          })
        }
      }

      const databaseClient = new DatabasePlatformClient()
      const mode: 'ro' | 'rw' = isSelect ? 'ro' : 'rw'

      const start = Date.now()

      try {
        const result = await databaseClient.executeQuery(
          tenantId,
          sql,
          [],
          mode,
        )
        const executionTime = Date.now() - start

        res.json({
          success: true,
          data: result.data,
          rowCount: result.rowCount,
          executionTime,
          command: isSelect ? 'SELECT' : 'MODIFY',
          fields:
            result.fields?.map((f: any) => ({
              name: f.name,
              type: f.dataTypeID,
            })) || [],
        })
      } catch (queryError: any) {
        const executionTime = Date.now() - start
        res.status(400).json({
          success: false,
          error: queryError.message,
          executionTime,
          position: queryError.position,
          hint: queryError.hint,
        })
      }
    } catch (error) {
      console.error('Error executing query:', error)
      res.status(500).json({ error: 'Failed to execute query' })
    }
  })
}
