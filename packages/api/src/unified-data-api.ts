// packages/api/src/unified-data-api.ts
import { Router } from 'express'
import type { Request, Response } from 'express'
import { DatabasePlatformClient } from './database-platform-client'
import { requireTenantAccess } from './middleware/tenant-access'
import type { TenantAuthRequest } from './types/tenant-access'

export class UnifiedDataAPI {
  constructor(private dbPlatform: DatabasePlatformClient) {
    this.router = Router()
  }

  public readonly router: Router

  initialize() {
    this.setupRESTEndpoints()
    // TODO: setup GraphQL + subscriptions
  }

  setupRESTEndpoints() {
    // Core database operations
    this.router.get('/:tenantId/data/:table', this.handleRESTGet.bind(this))
    this.router.post(
      '/:tenantId/data/:table',
      requireTenantAccess({ minRole: 'editor' }),
      this.handleRESTPost.bind(this),
    )
    this.router.put(
      '/:tenantId/data/:table/:id',
      requireTenantAccess({ minRole: 'editor' }),
      this.handleRESTPut.bind(this),
    )
    this.router.delete(
      '/:tenantId/data/:table/:id',
      requireTenantAccess({ minRole: 'editor' }),
      this.handleRESTDelete.bind(this),
    )

    // SQL query execution
    this.router.post('/:tenantId/query', this.handleQuery.bind(this))

    // Schema management
    this.router.get('/:tenantId/schemas', this.handleGetSchemas.bind(this))
    this.router.post(
      '/:tenantId/schemas',
      requireTenantAccess({ minRole: 'editor' }),
      this.handleCreateSchema.bind(this),
    )
    this.router.get(
      '/:tenantId/schemas/:schemaName/tables',
      this.handleGetTables.bind(this),
    )
    this.router.post(
      '/:tenantId/schemas/:schemaName/tables',
      requireTenantAccess({ minRole: 'editor' }),
      this.handleCreateTable.bind(this),
    )

    // Table structure
    this.router.get(
      '/:tenantId/schemas/:schemaName/tables/:tableName/columns',
      this.handleGetColumns.bind(this),
    )

    // Test endpoint to verify UnifiedDataAPI is working
    this.router.get('/:tenantId/test-unified', (req, res) => {
      res.json({
        message: 'UnifiedDataAPI is working!',
        tenantId: req.params.tenantId,
      })
    })
  }

  private getDbMode(req: TenantAuthRequest): 'ro' | 'rw' {
    return req.tenantAccess?.dbMode || 'ro'
  }

  private getRequiredRoleForQuery(sql: string): 'viewer' | 'editor' {
    const normalized = String(sql || '')
      .trim()
      .toLowerCase()
    // Very conservative: treat anything that's not a SELECT/WITH as requiring editor.
    // Even for editor, we will still rely on DB roles (ro/rw) as the true enforcement.
    if (normalized.startsWith('select') || normalized.startsWith('with'))
      return 'viewer'
    return 'editor'
  }

  async handleRESTGet(req: Request, res: Response) {
    try {
      const { tenantId, table } = req.params
      const { limit = 100, offset = 0, ...filters } = req.query

      let whereClause = ''
      const params: any[] = []
      let paramIndex = 1

      // Build WHERE clause from query parameters
      if (Object.keys(filters).length > 0) {
        const conditions = Object.entries(filters).map(([key, value]) => {
          params.push(value)
          return `"${key}" = $${paramIndex++}`
        })
        whereClause = `WHERE ${conditions.join(' AND ')}`
      }

      const sql = `SELECT * FROM "${table}" ${whereClause} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      params.push(limit, offset)

      const result = await this.dbPlatform.executeQuery(
        tenantId,
        sql,
        params,
        this.getDbMode(req as any),
      )
      res.json({
        data: result.data || [],
        count: result.rowCount || 0,
        executionTime: result.executionTime,
        table: table,
      })
    } catch (error: any) {
      console.error('REST GET error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  async handleRESTPost(req: Request, res: Response) {
    try {
      const { tenantId, table } = req.params
      const data = req.body

      const columns = Object.keys(data)
      const values = Object.values(data)
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ')

      const sql = `INSERT INTO "${table}" (${columns.map((c) => `"${c}"`).join(', ')}) VALUES (${placeholders}) RETURNING *`

      const result = await this.dbPlatform.executeQuery(
        tenantId,
        sql,
        values,
        'rw',
      )
      res.json({ data: result.data[0] })
    } catch (error: any) {
      console.error('REST POST error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  async handleRESTPut(req: Request, res: Response) {
    try {
      const { tenantId, table, id } = req.params
      const data = req.body

      const updates = Object.keys(data)
        .map((key, i) => `"${key}" = $${i + 2}`)
        .join(', ')
      const values = [id, ...Object.values(data)]

      const sql = `UPDATE "${table}" SET ${updates} WHERE id = $1 RETURNING *`

      const result = await this.dbPlatform.executeQuery(
        tenantId,
        sql,
        values,
        'rw',
      )
      if (result.data.length === 0) {
        return res.status(404).json({ error: 'Record not found' })
      }
      res.json({ data: result.data[0] })
    } catch (error: any) {
      console.error('REST PUT error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  async handleRESTDelete(req: Request, res: Response) {
    try {
      const { tenantId, table, id } = req.params

      const sql = `DELETE FROM "${table}" WHERE id = $1 RETURNING *`

      const result = await this.dbPlatform.executeQuery(
        tenantId,
        sql,
        [id],
        'rw',
      )
      if (result.data.length === 0) {
        return res.status(404).json({ error: 'Record not found' })
      }
      res.json({ data: result.data[0] })
    } catch (error: any) {
      console.error('REST DELETE error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  async handleQuery(req: Request, res: Response) {
    try {
      const { tenantId } = req.params
      const { sql, params = [] } = req.body

      if (!sql) {
        return res.status(400).json({ error: 'SQL query is required' })
      }

      const requiredRole = this.getRequiredRoleForQuery(sql)
      if (requiredRole === 'editor') {
        // Enforce elevated role for mutating queries.
        // If the caller was already checked earlier, this is just an in-memory comparison.
        await new Promise<void>((resolve, reject) => {
          requireTenantAccess({ minRole: 'editor' })(
            req as any,
            res as any,
            (err?: any) => {
              if (err) reject(err)
              else resolve()
            },
          )
        })
      }

      const mode = requiredRole === 'viewer' ? this.getDbMode(req as any) : 'rw'
      const result = await this.dbPlatform.executeQuery(
        tenantId,
        sql,
        params,
        mode,
      )
      res.json({
        data: result.data,
        rowCount: result.rowCount,
        executionTime: result.executionTime,
        fields: result.fields,
      })
    } catch (error: any) {
      console.error('Query execution error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  async handleGetSchemas(req: Request, res: Response) {
    try {
      const { tenantId } = req.params
      const schemas = await this.dbPlatform.getSchemas(
        tenantId,
        this.getDbMode(req as any),
      )
      res.json({ data: schemas })
    } catch (error: any) {
      console.error('Get schemas error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  async handleCreateSchema(req: Request, res: Response) {
    try {
      const { tenantId } = req.params
      const { name } = req.body

      if (!name) {
        return res.status(400).json({ error: 'Schema name is required' })
      }

      await this.dbPlatform.createSchema(tenantId, name)
      res.json({
        success: true,
        message: `Schema "${name}" created successfully`,
      })
    } catch (error: any) {
      console.error('Create schema error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  async handleGetTables(req: Request, res: Response) {
    try {
      const { tenantId, schemaName } = req.params
      console.log(
        `[UnifiedDataAPI] handleGetTables - tenant: ${tenantId}, schema: ${schemaName}`,
      )

      const tables = await this.dbPlatform.getTables(
        tenantId,
        schemaName,
        this.getDbMode(req as any),
      )

      console.log(
        `[UnifiedDataAPI] Returning ${tables?.length || 0} tables for schema '${schemaName}'`,
      )

      res.json({ data: tables })
    } catch (error: any) {
      console.error('[UnifiedDataAPI] Get tables error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  async handleCreateTable(req: Request, res: Response) {
    try {
      const { tenantId, schemaName } = req.params
      const { name, columns } = req.body

      if (!name || !columns) {
        return res
          .status(400)
          .json({ error: 'Table name and columns are required' })
      }

      await this.dbPlatform.createTable(tenantId, schemaName, name, columns)
      res.json({
        success: true,
        message: `Table "${name}" created successfully`,
      })
    } catch (error: any) {
      console.error('Create table error:', error)
      res.status(500).json({ error: error.message })
    }
  }

  async handleGetColumns(req: Request, res: Response) {
    try {
      const { tenantId, schemaName, tableName } = req.params
      const columns = await this.dbPlatform.getTableColumns(
        tenantId,
        schemaName,
        tableName,
        this.getDbMode(req as any),
      )
      res.json({ data: columns })
    } catch (error: any) {
      console.error('Get columns error:', error)
      res.status(500).json({ error: error.message })
    }
  }
}
