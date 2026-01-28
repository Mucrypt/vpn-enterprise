import type { Router } from 'express'
import { DatabasePlatformClient } from '../../database-platform-client'

export function registerTenantColumnsRoutes(router: Router) {
  router.get(
    '/:tenantId/tables/:schema.:tableName/columns',
    async (req, res) => {
      try {
        const { tenantId, schema, tableName } = req.params

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
          c.column_name as name,
          c.data_type as type,
          c.is_nullable = 'YES' as nullable,
          c.column_default as default,
          CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as primary_key,
          c.character_maximum_length,
          c.numeric_precision,
          c.numeric_scale,
          c.ordinal_position,
          fk.foreign_table_schema,
          fk.foreign_table_name,
          fk.foreign_column_name
        FROM information_schema.columns c
        LEFT JOIN (
          SELECT ku.column_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
          WHERE tc.table_schema = $1 AND tc.table_name = $2 AND tc.constraint_type = 'PRIMARY KEY'
        ) pk ON c.column_name = pk.column_name
        LEFT JOIN (
          SELECT
            kcu.column_name,
            ccu.table_schema AS foreign_table_schema,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
          FROM information_schema.table_constraints AS tc
          JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
          JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
          WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = $1 AND tc.table_name = $2
        ) fk ON c.column_name = fk.column_name
        WHERE c.table_schema = $1 AND c.table_name = $2
        ORDER BY c.ordinal_position
      `,
          [schema, tableName],
        )

        const columns = result.rows.map((row: any) => ({
          name: row.name,
          type: row.type,
          nullable: row.nullable,
          default: row.default,
          primary_key: row.primary_key,
          character_maximum_length: row.character_maximum_length,
          numeric_precision: row.numeric_precision,
          numeric_scale: row.numeric_scale,
          ordinal_position: row.ordinal_position,
          foreign_key: row.foreign_table_name
            ? {
                table: row.foreign_table_name,
                column: row.foreign_column_name,
                schema: row.foreign_table_schema,
              }
            : null,
        }))

        res.json({ columns })
      } catch (error) {
        console.error('Error fetching table columns:', error)
        res.status(500).json({ error: 'Failed to fetch table columns' })
      }
    },
  )
}
