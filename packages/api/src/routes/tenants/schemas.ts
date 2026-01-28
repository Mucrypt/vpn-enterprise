import type { Router } from 'express'
import { DatabasePlatformClient } from '../../database-platform-client'

export function registerTenantSchemaRoutes(router: Router) {
  // Schema list
  router.get('/:tenantId/schemas', async (req, res) => {
    try {
      const { tenantId } = req.params
      const databaseClient = new DatabasePlatformClient()
      const pool = await databaseClient.getTenantConnection(tenantId, 'ro')

      if (!pool) {
        return res.status(400).json({ error: 'Unable to connect to database' })
      }

      const result = await pool.query(`
        SELECT schema_name as name
        FROM information_schema.schemata
        WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
        ORDER BY schema_name
      `)

      res.json({ schemas: result.rows })
    } catch (error) {
      console.error('Error fetching schemas:', error)
      res.status(500).json({ error: 'Failed to fetch schemas' })
    }
  })

  // Tables listing for a schema
  router.get('/:tenantId/schemas/:schemaName/tables', async (req, res) => {
    try {
      const { tenantId, schemaName } = req.params
      const databaseClient = new DatabasePlatformClient()
      const pool = await databaseClient.getTenantConnection(tenantId, 'ro')

      if (!pool) {
        return res.status(400).json({ error: 'Unable to connect to database' })
      }

      const result = await pool.query(
        `
        SELECT 
          t.table_name as name,
          t.table_type as type,
          obj_description(c.oid) as comment
        FROM information_schema.tables t
        LEFT JOIN pg_class c ON c.relname = t.table_name
        LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE t.table_schema = $1
        ORDER BY t.table_name
      `,
        [schemaName],
      )

      res.json({ tables: result.rows })
    } catch (error) {
      console.error('Error fetching tables:', error)
      res.status(500).json({ error: 'Failed to fetch tables' })
    }
  })

  // Get schema relationships
  router.get(
    '/:tenantId/schemas/:schemaName/relationships',
    async (req, res) => {
      try {
        const { tenantId, schemaName } = req.params

        const databaseClient = new DatabasePlatformClient()
        const pool = await databaseClient.getTenantConnection(tenantId, 'ro')

        if (!pool) {
          return res
            .status(400)
            .json({ error: 'Unable to connect to database' })
        }

        const result = await pool.query(
          `
        SELECT
          tc.table_schema as from_schema,
          tc.table_name as from_table,
          kcu.column_name as from_column,
          ccu.table_schema as to_schema,
          ccu.table_name as to_table,
          ccu.column_name as to_column,
          tc.constraint_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu 
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu 
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_schema = $1
        ORDER BY tc.table_name, kcu.column_name
      `,
          [schemaName],
        )

        const relationships = result.rows.map((row: any) => ({
          from: {
            table: row.from_table,
            schema: row.from_schema,
            column: row.from_column,
          },
          to: {
            table: row.to_table,
            schema: row.to_schema,
            column: row.to_column,
          },
          type: 'one-to-many' as const,
          constraint_name: row.constraint_name,
        }))

        res.json({ relationships })
      } catch (error) {
        console.error('Error fetching relationships:', error)
        res.status(500).json({ error: 'Failed to fetch relationships' })
      }
    },
  )
}
