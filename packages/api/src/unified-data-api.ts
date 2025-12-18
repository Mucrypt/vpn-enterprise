// packages/api/src/unified-data-api.ts
import type { Express, Request, Response } from 'express';
import { DatabasePlatformClient } from './database-platform-client';

export class UnifiedDataAPI {
  constructor(
    private app: Express, 
    private dbPlatform: DatabasePlatformClient
  ) {}

  initialize() {
    this.setupRESTEndpoints();
    // TODO: setup GraphQL + subscriptions
  }

  setupRESTEndpoints() {
    // Core database operations
    this.app.get('/api/v1/tenants/:tenantId/data/:table', this.handleRESTGet.bind(this));
    this.app.post('/api/v1/tenants/:tenantId/data/:table', this.handleRESTPost.bind(this));
    this.app.put('/api/v1/tenants/:tenantId/data/:table/:id', this.handleRESTPut.bind(this));
    this.app.delete('/api/v1/tenants/:tenantId/data/:table/:id', this.handleRESTDelete.bind(this));
    
    // SQL query execution
    this.app.post('/api/v1/tenants/:tenantId/query', this.handleQuery.bind(this));
    
    // Schema management
    this.app.get('/api/v1/tenants/:tenantId/schemas', this.handleGetSchemas.bind(this));
    this.app.post('/api/v1/tenants/:tenantId/schemas', this.handleCreateSchema.bind(this));
    this.app.get('/api/v1/tenants/:tenantId/schemas/:schemaName/tables', this.handleGetTables.bind(this));
    this.app.post('/api/v1/tenants/:tenantId/schemas/:schemaName/tables', this.handleCreateTable.bind(this));
    
    // Table structure
    this.app.get('/api/v1/tenants/:tenantId/schemas/:schemaName/tables/:tableName/columns', this.handleGetColumns.bind(this));
    
    // Test endpoint to verify UnifiedDataAPI is working
    this.app.get('/api/v1/tenants/:tenantId/test-unified', (req, res) => {
      res.json({ message: 'UnifiedDataAPI is working!', tenantId: req.params.tenantId });
    });

    // Tenant management
    this.app.get('/api/v1/tenants/me/associations', this.handleGetUserTenants.bind(this));
    this.app.post('/api/v1/tenants', this.handleCreateTenant.bind(this));
  }

  async handleRESTGet(req: Request, res: Response) {
    try {
      const { tenantId, table } = req.params;
      const { limit = 100, offset = 0, ...filters } = req.query;
      
      let whereClause = '';
      const params: any[] = [];
      let paramIndex = 1;

      // Build WHERE clause from query parameters
      if (Object.keys(filters).length > 0) {
        const conditions = Object.entries(filters).map(([key, value]) => {
          params.push(value);
          return `"${key}" = $${paramIndex++}`;
        });
        whereClause = `WHERE ${conditions.join(' AND ')}`;
      }

      const sql = `SELECT * FROM "${table}" ${whereClause} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await this.dbPlatform.executeQuery(tenantId, sql, params);
      res.json({ 
        data: result.data || [], 
        count: result.rowCount || 0,
        executionTime: result.executionTime,
        table: table
      });
    } catch (error: any) {
      console.error('REST GET error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async handleRESTPost(req: Request, res: Response) {
    try {
      const { tenantId, table } = req.params;
      const data = req.body;
      
      const columns = Object.keys(data);
      const values = Object.values(data);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
      
      const sql = `INSERT INTO "${table}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders}) RETURNING *`;
      
      const result = await this.dbPlatform.executeQuery(tenantId, sql, values);
      res.json({ data: result.data[0] });
    } catch (error: any) {
      console.error('REST POST error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async handleRESTPut(req: Request, res: Response) {
    try {
      const { tenantId, table, id } = req.params;
      const data = req.body;
      
      const updates = Object.keys(data).map((key, i) => `"${key}" = $${i + 2}`).join(', ');
      const values = [id, ...Object.values(data)];
      
      const sql = `UPDATE "${table}" SET ${updates} WHERE id = $1 RETURNING *`;
      
      const result = await this.dbPlatform.executeQuery(tenantId, sql, values);
      if (result.data.length === 0) {
        return res.status(404).json({ error: 'Record not found' });
      }
      res.json({ data: result.data[0] });
    } catch (error: any) {
      console.error('REST PUT error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async handleRESTDelete(req: Request, res: Response) {
    try {
      const { tenantId, table, id } = req.params;
      
      const sql = `DELETE FROM "${table}" WHERE id = $1 RETURNING *`;
      
      const result = await this.dbPlatform.executeQuery(tenantId, sql, [id]);
      if (result.data.length === 0) {
        return res.status(404).json({ error: 'Record not found' });
      }
      res.json({ data: result.data[0] });
    } catch (error: any) {
      console.error('REST DELETE error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async handleQuery(req: Request, res: Response) {
    try {
      const { tenantId } = req.params;
      const { sql, params = [] } = req.body;
      
      if (!sql) {
        return res.status(400).json({ error: 'SQL query is required' });
      }

      const result = await this.dbPlatform.executeQuery(tenantId, sql, params);
      res.json({
        data: result.data,
        rowCount: result.rowCount,
        executionTime: result.executionTime,
        fields: result.fields
      });
    } catch (error: any) {
      console.error('Query execution error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async handleGetSchemas(req: Request, res: Response) {
    try {
      const { tenantId } = req.params;
      const schemas = await this.dbPlatform.getSchemas(tenantId);
      res.json({ data: schemas });
    } catch (error: any) {
      console.error('Get schemas error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async handleCreateSchema(req: Request, res: Response) {
    try {
      const { tenantId } = req.params;
      const { name } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: 'Schema name is required' });
      }

      await this.dbPlatform.createSchema(tenantId, name);
      res.json({ success: true, message: `Schema "${name}" created successfully` });
    } catch (error: any) {
      console.error('Create schema error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async handleGetTables(req: Request, res: Response) {
    try {
      const { tenantId, schemaName } = req.params;
      console.log(`[UnifiedDataAPI] handleGetTables - tenant: ${tenantId}, schema: ${schemaName}`);
      
      const tables = await this.dbPlatform.getTables(tenantId, schemaName);
      
      console.log(`[UnifiedDataAPI] Returning ${tables?.length || 0} tables for schema '${schemaName}'`);
      
      res.json({ data: tables });
    } catch (error: any) {
      console.error('[UnifiedDataAPI] Get tables error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async handleCreateTable(req: Request, res: Response) {
    try {
      const { tenantId, schemaName } = req.params;
      const { name, columns } = req.body;
      
      if (!name || !columns) {
        return res.status(400).json({ error: 'Table name and columns are required' });
      }

      await this.dbPlatform.createTable(tenantId, schemaName, name, columns);
      res.json({ success: true, message: `Table "${name}" created successfully` });
    } catch (error: any) {
      console.error('Create table error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async handleGetColumns(req: Request, res: Response) {
    try {
      const { tenantId, schemaName, tableName } = req.params;
      const columns = await this.dbPlatform.getTableColumns(tenantId, schemaName, tableName);
      res.json({ data: columns });
    } catch (error: any) {
      console.error('Get columns error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async handleGetUserTenants(req: Request, res: Response) {
    try {
      // TODO: Get user ID from auth token
      const userId = req.headers['x-user-id'] as string; // Temporary
      const tenants = await this.dbPlatform.getTenants(userId);
      res.json({ data: tenants });
    } catch (error: any) {
      console.error('Get user tenants error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async handleCreateTenant(req: Request, res: Response) {
    try {
      const { organizationId, name, plan } = req.body;
      
      if (!organizationId || !name) {
        return res.status(400).json({ error: 'Organization ID and name are required' });
      }

      const result = await this.dbPlatform.createTenant(organizationId, name, plan);
      res.json(result);
    } catch (error: any) {
      console.error('Create tenant error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}
