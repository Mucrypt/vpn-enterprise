import { Pool } from 'pg';
import winston from 'winston';

export class CleanupService {
  constructor(
    private pgPool: Pool,
    private logger: winston.Logger
  ) {}

  async performCleanup(): Promise<any> {
    this.logger.info('Starting cleanup operations');
    
    const results = {
      expiredBackups: 0,
      oldLogs: 0,
      tempFiles: 0,
      unusedConnections: 0,
      errors: [] as string[]
    };

    try {
      // Clean up expired backups
      results.expiredBackups = await this.cleanupExpiredBackups();
      
      // Clean up old log entries
      results.oldLogs = await this.cleanupOldLogs();
      
      // Clean up temporary files
      results.tempFiles = await this.cleanupTempFiles();
      
      // Clean up unused connections
      results.unusedConnections = await this.cleanupUnusedConnections();
      
      this.logger.info('Cleanup operations completed', results);
      return results;
      
    } catch (error) {
      this.logger.error('Cleanup operations failed:', error);
      results.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return results;
    }
  }

  private async cleanupExpiredBackups(): Promise<number> {
    try {
      const client = await this.pgPool.connect();
      
      try {
        // Delete backups older than 30 days
        const result = await client.query(`
          DELETE FROM backups 
          WHERE created_at < NOW() - INTERVAL '30 days'
          AND status = 'completed'
        `);
        
        const deletedCount = result.rowCount || 0;
        this.logger.info(`Cleaned up ${deletedCount} expired backups`);
        return deletedCount;
        
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.error('Failed to cleanup expired backups:', error);
      return 0;
    }
  }

  private async cleanupOldLogs(): Promise<number> {
    try {
      const client = await this.pgPool.connect();
      
      try {
        // Delete audit logs older than 90 days
        let deletedCount = 0;
        
        // Check if audit_log table exists
        const tableExists = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'audit_log'
          )
        `);
        
        if (tableExists.rows[0].exists) {
          const result = await client.query(`
            DELETE FROM audit_log 
            WHERE timestamp < NOW() - INTERVAL '90 days'
          `);
          deletedCount = result.rowCount || 0;
        }
        
        this.logger.info(`Cleaned up ${deletedCount} old log entries`);
        return deletedCount;
        
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.error('Failed to cleanup old logs:', error);
      return 0;
    }
  }

  private async cleanupTempFiles(): Promise<number> {
    try {
      // This would typically involve filesystem cleanup
      // For now, we'll clean up temporary database objects
      
      const client = await this.pgPool.connect();
      
      try {
        // Clean up temporary tables that might have been left behind
        const tempTables = await client.query(`
          SELECT schemaname, tablename
          FROM pg_tables
          WHERE tablename LIKE 'temp_%'
          AND schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
        `);
        
        let deletedCount = 0;
        for (const table of tempTables.rows) {
          try {
            await client.query(`DROP TABLE IF EXISTS ${table.schemaname}.${table.tablename}`);
            deletedCount++;
          } catch (error) {
            this.logger.warn(`Failed to drop temp table ${table.schemaname}.${table.tablename}:`, error);
          }
        }
        
        this.logger.info(`Cleaned up ${deletedCount} temporary tables`);
        return deletedCount;
        
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.error('Failed to cleanup temp files:', error);
      return 0;
    }
  }

  private async cleanupUnusedConnections(): Promise<number> {
    try {
      const client = await this.pgPool.connect();
      
      try {
        // Terminate idle connections that have been inactive for more than 1 hour
        const result = await client.query(`
          SELECT pg_terminate_backend(pid) as terminated
          FROM pg_stat_activity
          WHERE state = 'idle'
          AND state_change < NOW() - INTERVAL '1 hour'
          AND pid != pg_backend_pid()
          AND usename NOT IN ('postgres', 'platform_admin')
        `);
        
        const terminatedCount = result.rows.filter(row => row.terminated).length;
        this.logger.info(`Terminated ${terminatedCount} unused connections`);
        return terminatedCount;
        
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.error('Failed to cleanup unused connections:', error);
      return 0;
    }
  }

  async cleanupTenant(tenantId: string): Promise<void> {
    this.logger.info(`Starting cleanup for tenant ${tenantId}`);
    
    try {
      const client = await this.pgPool.connect();
      
      try {
        // Get tenant info
        const tenantResult = await client.query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
        if (!tenantResult.rows[0]) {
          throw new Error(`Tenant ${tenantId} not found`);
        }
        
        const tenant = tenantResult.rows[0];
        
        // Clean up tenant-specific data
        if (tenant.isolation_type === 'schema') {
          await this.cleanupTenantSchema(client, tenant);
        } else if (tenant.isolation_type === 'database') {
          await this.cleanupTenantDatabase(client, tenant);
        }
        
        this.logger.info(`Cleanup completed for tenant ${tenantId}`);
        
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.error(`Failed to cleanup tenant ${tenantId}:`, error);
      throw error;
    }
  }

  private async cleanupTenantSchema(client: any, tenant: any): Promise<void> {
    const connectionInfo = JSON.parse(tenant.connection_info || '{}');
    const schemaName = connectionInfo.schema;
    
    try {
      // Clean up temporary tables in the tenant schema
      const tempTables = await client.query(`
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = $1 AND tablename LIKE 'temp_%'
      `, [schemaName]);
      
      for (const table of tempTables.rows) {
        await client.query(`DROP TABLE IF EXISTS ${schemaName}.${table.tablename}`);
      }
      
      // Analyze tables for better performance
      const tables = await client.query(`
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = $1
      `, [schemaName]);
      
      for (const table of tables.rows) {
        await client.query(`ANALYZE ${schemaName}.${table.tablename}`);
      }
      
    } catch (error) {
      this.logger.error(`Failed to cleanup tenant schema ${schemaName}:`, error);
    }
  }

  private async cleanupTenantDatabase(client: any, tenant: any): Promise<void> {
    const connectionInfo = JSON.parse(tenant.connection_info || '{}');
    const dbName = connectionInfo.database;
    
    try {
      // For database isolation, we'd need a separate connection to the tenant database
      // For now, we'll just log that cleanup is needed
      this.logger.info(`Tenant database ${dbName} would be cleaned up here`);
      
      // TODO: Implement database-specific cleanup
      
    } catch (error) {
      this.logger.error(`Failed to cleanup tenant database ${dbName}:`, error);
    }
  }

  async getCleanupStats(): Promise<any> {
    try {
      const client = await this.pgPool.connect();
      
      try {
        const stats = {
          totalBackups: 0,
          oldBackups: 0,
          totalConnections: 0,
          idleConnections: 0,
          tempTables: 0,
          totalSize: 0
        };
        
        // Get backup stats
        const backupStats = await client.query(`
          SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE created_at < NOW() - INTERVAL '30 days') as old
          FROM backups
        `);
        
        if (backupStats.rows[0]) {
          stats.totalBackups = parseInt(backupStats.rows[0].total);
          stats.oldBackups = parseInt(backupStats.rows[0].old);
        }
        
        // Get connection stats
        const connectionStats = await client.query(`
          SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE state = 'idle') as idle
          FROM pg_stat_activity
          WHERE pid != pg_backend_pid()
        `);
        
        if (connectionStats.rows[0]) {
          stats.totalConnections = parseInt(connectionStats.rows[0].total);
          stats.idleConnections = parseInt(connectionStats.rows[0].idle);
        }
        
        // Get temp table stats
        const tempStats = await client.query(`
          SELECT COUNT(*) as count
          FROM pg_tables
          WHERE tablename LIKE 'temp_%'
          AND schemaname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
        `);
        
        if (tempStats.rows[0]) {
          stats.tempTables = parseInt(tempStats.rows[0].count);
        }
        
        // Get total database size
        const sizeStats = await client.query(`
          SELECT SUM(pg_database_size(datname)) as total_size
          FROM pg_database
          WHERE datname NOT IN ('template0', 'template1', 'postgres')
        `);
        
        if (sizeStats.rows[0]) {
          stats.totalSize = parseInt(sizeStats.rows[0].total_size || 0);
        }
        
        return stats;
        
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.error('Failed to get cleanup stats:', error);
      return {};
    }
  }
}