import { Request, Response } from 'express';
import { DatabasePlatformClient } from '../database-platform-client';

export const getTableData = async (req: Request, res: Response) => {
  try {
    const { tenantId, schema, tableName } = req.params;
    const { page = '1', limit = '20', search = '', sortBy = '', sortOrder = 'ASC' } = req.query;

    if (!tenantId || !schema || !tableName) {
      return res.status(400).json({ 
        error: 'Missing required parameters: tenantId, schema, and tableName are required' 
      });
    }

    const databaseClient = new DatabasePlatformClient();
    const pool = await databaseClient.getTenantConnection(tenantId);

    if (!pool) {
      return res.status(400).json({ 
        error: 'Unable to connect to database' 
      });
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Simple query for now - we can enhance this later
    let query = `SELECT * FROM "${schema}"."${tableName}"`;
    let countQuery = `SELECT COUNT(*) as total FROM "${schema}"."${tableName}"`;
    let params: any[] = [];

    // Add sorting if provided
    if (sortBy) {
      query += ` ORDER BY "${sortBy}" ${sortOrder}`;
    }

    // Add pagination
    query += ` LIMIT $1 OFFSET $2`;
    params = [limitNum, offset];

    // Execute queries
    const [dataResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery)
    ]);

    const totalRows = parseInt(countResult.rows[0]?.total || '0');
    const totalPages = Math.ceil(totalRows / limitNum);

    // Get column information
    const columnsResult = await pool.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_schema = $1 AND table_name = $2
      ORDER BY ordinal_position
    `, [schema, tableName]);

    // Get primary key information
    const primaryKeyResult = await pool.query(`
      SELECT kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = $1
        AND tc.table_name = $2
    `, [schema, tableName]);

    const primaryKeys = primaryKeyResult.rows.map((row: any) => row.column_name);

    res.json({
      data: dataResult.rows,
      columns: columnsResult.rows,
      primaryKeys,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalRows,
        limit: limitNum,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });

  } catch (error) {
    console.error('Error fetching table data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch table data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateTableData = async (req: Request, res: Response) => {
  try {
    const { tenantId, schema, tableName } = req.params;
    const { primaryKeys, data, originalData } = req.body;

    if (!tenantId || !schema || !tableName || !primaryKeys || !data) {
      return res.status(400).json({ 
        error: 'Missing required parameters' 
      });
    }

    const databaseClient = new DatabasePlatformClient();
    const pool = await databaseClient.getTenantConnection(tenantId);

    if (!pool) {
      return res.status(400).json({ 
        error: 'Unable to connect to database' 
      });
    }

    // Build WHERE clause for primary key
    const whereConditions = primaryKeys.map((key: string, index: number) => 
      `"${key}" = $${index + 1}`
    ).join(' AND ');
    
    const primaryKeyValues = primaryKeys.map((key: string) => originalData[key]);

    // Build SET clause for update
    const updateColumns = Object.keys(data).filter(key => !primaryKeys.includes(key));
    const setClause = updateColumns.map((col, index) => 
      `"${col}" = $${primaryKeys.length + index + 1}`
    ).join(', ');
    
    const updateValues = updateColumns.map(col => data[col]);

    const query = `UPDATE "${schema}"."${tableName}" SET ${setClause} WHERE ${whereConditions}`;
    const params = [...primaryKeyValues, ...updateValues];

    const result = await pool.query(query, params);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Row not found' });
    }

    res.json({ success: true, message: 'Row updated successfully' });

  } catch (error) {
    console.error('Error updating table data:', error);
    res.status(500).json({ 
      error: 'Failed to update table data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const insertTableData = async (req: Request, res: Response) => {
  try {
    const { tenantId, schema, tableName } = req.params;
    const { data } = req.body;

    if (!tenantId || !schema || !tableName || !data) {
      return res.status(400).json({ 
        error: 'Missing required parameters' 
      });
    }

    const databaseClient = new DatabasePlatformClient();
    const pool = await databaseClient.getTenantConnection(tenantId);

    if (!pool) {
      return res.status(400).json({ 
        error: 'Unable to connect to database' 
      });
    }

    const columns = Object.keys(data);
    const values = Object.values(data);
    
    const columnsList = columns.map(col => `"${col}"`).join(', ');
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
    
    const query = `INSERT INTO "${schema}"."${tableName}" (${columnsList}) VALUES (${placeholders}) RETURNING *`;
    
    const result = await pool.query(query, values);

    res.json({ 
      success: true, 
      message: 'Row inserted successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error inserting table data:', error);
    res.status(500).json({ 
      error: 'Failed to insert table data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const deleteTableData = async (req: Request, res: Response) => {
  try {
    const { tenantId, schema, tableName } = req.params;
    const { primaryKeys, data } = req.body;

    if (!tenantId || !schema || !tableName || !primaryKeys || !data) {
      return res.status(400).json({ 
        error: 'Missing required parameters' 
      });
    }

    const databaseClient = new DatabasePlatformClient();
    const pool = await databaseClient.getTenantConnection(tenantId);

    if (!pool) {
      return res.status(400).json({ 
        error: 'Unable to connect to database' 
      });
    }

    // Build WHERE clause for primary key
    const whereConditions = primaryKeys.map((key: string, index: number) => 
      `"${key}" = $${index + 1}`
    ).join(' AND ');
    
    const primaryKeyValues = primaryKeys.map((key: string) => data[key]);
    
    const query = `DELETE FROM "${schema}"."${tableName}" WHERE ${whereConditions}`;
    
    const result = await pool.query(query, primaryKeyValues);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Row not found' });
    }

    res.json({ success: true, message: 'Row deleted successfully' });

  } catch (error) {
    console.error('Error deleting table data:', error);
    res.status(500).json({ 
      error: 'Failed to delete table data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};