import type { Router } from 'express'
import { requireTenantEditor } from './guards'
import {
  getTableData,
  updateTableData,
  insertTableData,
  deleteTableData,
} from '../../controllers/tableDataController'
import { DatabasePlatformClient } from '../../database-platform-client'

export function registerTenantTableDataRoutes(router: Router) {
  // Table Data Endpoints
  router.get('/:tenantId/tables/:schema.:tableName/data', getTableData)
  router.put(
    '/:tenantId/tables/:schema.:tableName/data',
    ...requireTenantEditor,
    updateTableData,
  )
  router.post(
    '/:tenantId/tables/:schema.:tableName/data',
    ...requireTenantEditor,
    insertTableData,
  )
  router.delete(
    '/:tenantId/tables/:schema.:tableName/data',
    ...requireTenantEditor,
    deleteTableData,
  )

  // Bulk operations endpoint
  router.post(
    '/:tenantId/tables/:schema.:tableName/bulk',
    ...requireTenantEditor,
    async (req, res) => {
      try {
        const { tenantId, schema, tableName } = req.params
        const { operation, rows } = req.body

        const databaseClient = new DatabasePlatformClient()
        const pool = await databaseClient.getTenantConnection(tenantId, 'rw')

        if (!pool) {
          return res
            .status(400)
            .json({ error: 'Unable to connect to database' })
        }

        let result
        switch (operation) {
          case 'delete': {
            const deleteConditions = rows
              .map((row: any, index: number) => {
                const conditions = Object.entries(row).map(
                  ([key, value]) =>
                    `${key} = $${index * Object.keys(row).length + Object.keys(row).indexOf(key) + 1}`,
                )
                return `(${conditions.join(' AND ')})`
              })
              .join(' OR ')

            const deleteValues = rows.flatMap((row: any) => Object.values(row))
            const deleteQuery = `DELETE FROM ${schema}.${tableName} WHERE ${deleteConditions}`

            result = await pool.query(deleteQuery, deleteValues)
            break
          }
          default:
            return res.status(400).json({ error: 'Unsupported bulk operation' })
        }

        res.json({
          success: true,
          affected_rows: result.rowCount,
          operation,
        })
      } catch (error) {
        console.error('Error executing bulk operation:', error)
        res.status(500).json({ error: 'Failed to execute bulk operation' })
      }
    },
  )

  // Export table data to CSV
  router.get(
    '/:tenantId/tables/:schema.:tableName/export',
    async (req, res) => {
      try {
        const { tenantId, schema, tableName } = req.params
        const { format = 'csv' } = req.query

        const databaseClient = new DatabasePlatformClient()
        const pool = await databaseClient.getTenantConnection(tenantId, 'ro')

        if (!pool) {
          return res
            .status(400)
            .json({ error: 'Unable to connect to database' })
        }

        const result = await pool.query(
          `SELECT * FROM ${schema}.${tableName} ORDER BY 1`,
        )

        if (format === 'csv') {
          const headers = Object.keys(result.rows[0] || {})
          const csvHeaders = headers.join(',')
          const csvRows = result.rows
            .map((row) =>
              headers
                .map((header) => {
                  const value = (row as any)[header]
                  if (value === null) return ''
                  if (
                    typeof value === 'string' &&
                    (value.includes(',') ||
                      value.includes('"') ||
                      value.includes('\n'))
                  ) {
                    return `"${value.replace(/"/g, '""')}"`
                  }
                  return value
                })
                .join(','),
            )
            .join('\n')

          const csvContent = `${csvHeaders}\n${csvRows}`

          res.setHeader('Content-Type', 'text/csv')
          res.setHeader(
            'Content-Disposition',
            `attachment; filename="${schema}_${tableName}.csv"`,
          )
          res.send(csvContent)
        } else {
          res.status(400).json({ error: 'Unsupported export format' })
        }
      } catch (error) {
        console.error('Error exporting table data:', error)
        res.status(500).json({ error: 'Failed to export table data' })
      }
    },
  )
}
