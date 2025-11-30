import { Request, Response } from 'express';
import { DatabasePlatformClient } from '../database-platform-client';

export const getTableStructure = async (req: Request, res: Response) => {
  try {
    const { tenantId, schema, tableName } = req.params;

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

    // Get basic column information
    const columnsResult = await pool.query(`
      SELECT 
        column_name as name,
        data_type as type,
        is_nullable = 'YES' as nullable,
        column_default as default,
        false as primary_key,
        false as unique,
        false as foreign_key
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

    const primaryKeyColumns = new Set(primaryKeyResult.rows.map((row: any) => row.column_name));

    // Mark primary key columns
    columnsResult.rows.forEach((col: any) => {
      if (primaryKeyColumns.has(col.name)) {
        col.primary_key = true;
      }
    });

    // Get basic index information
    const indexesResult = await pool.query(`
      SELECT 
        i.relname as name,
        false as unique,
        'btree' as type
      FROM pg_class t
      JOIN pg_namespace n ON n.oid = t.relnamespace
      JOIN pg_index ix ON t.oid = ix.indrelid
      JOIN pg_class i ON i.oid = ix.indexrelid
      WHERE n.nspname = $1 AND t.relname = $2
        AND NOT ix.indisprimary
      ORDER BY i.relname
    `, [schema, tableName]);

    res.json({
      columns: columnsResult.rows,
      indexes: indexesResult.rows || []
    });

  } catch (error) {
    console.error('Error fetching table structure:', error);
    res.status(500).json({ 
      error: 'Failed to fetch table structure',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateTableStructure = async (req: Request, res: Response) => {
  try {
    const { tenantId, schema, tableName } = req.params;
    const { columns, indexes, changes } = req.body;

    if (!tenantId || !schema || !tableName) {
      return res.status(400).json({ 
        error: 'Missing required parameters: tenantId, schema, and tableName are required' 
      });
    }

    // For now, just return success - implementing structure changes requires careful planning
    res.json({ 
      success: true, 
      message: 'Table structure modification is not yet implemented. This feature is coming soon.' 
    });

  } catch (error) {
    console.error('Error updating table structure:', error);
    res.status(500).json({ 
      error: 'Failed to update table structure',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};