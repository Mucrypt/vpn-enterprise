import { Pool } from 'pg';
import winston from 'winston';
import { execSync } from 'child_process';
import { v4 as uuidv4 } from 'uuid';

export class BackupService {
  constructor(
    private pgPool: Pool,
    private logger: winston.Logger
  ) {}

  async createBackup(tenantId: string, type: 'full' | 'incremental' = 'full'): Promise<string> {
    const backupId = uuidv4();
    
    try {
      // Get tenant database info
      const tenantResult = await this.pgPool.query(
        'SELECT database_name FROM tenant_databases WHERE id = $1',
        [tenantId]
      );
      
      if (tenantResult.rows.length === 0) {
        throw new Error(`Tenant ${tenantId} not found`);
      }
      
      const databaseName = tenantResult.rows[0].database_name;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = `/backups/${databaseName}_${type}_${timestamp}.sql`;
      
      // Record backup start
      await this.pgPool.query(
        `INSERT INTO backup_history (id, tenant_database_id, backup_type, file_path, status, started_at)
         VALUES ($1, $2, $3, $4, 'in_progress', NOW())`,
        [backupId, tenantId, type, backupFile]
      );
      
      // Perform backup
      const pgDumpCommand = `pg_dump -h ${process.env.POSTGRES_HOST} -U ${process.env.POSTGRES_USER} -d ${databaseName} -f ${backupFile}`;
      
      this.logger.info(`Starting ${type} backup for tenant ${tenantId}`);
      execSync(pgDumpCommand, { env: { ...process.env, PGPASSWORD: process.env.POSTGRES_PASSWORD } });
      
      // Get file size
      const fileSize = execSync(`stat -c%s ${backupFile}`).toString().trim();
      
      // Update backup record
      await this.pgPool.query(
        `UPDATE backup_history 
         SET status = 'completed', file_size_bytes = $1, completed_at = NOW()
         WHERE id = $2`,
        [parseInt(fileSize), backupId]
      );
      
      this.logger.info(`Backup completed for tenant ${tenantId}: ${backupFile}`);
      return backupId;
      
    } catch (error) {
      this.logger.error(`Backup failed for tenant ${tenantId}:`, error);
      
      // Update backup record with error
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.pgPool.query(
        `UPDATE backup_history 
         SET status = 'failed', error_message = $1, completed_at = NOW()
         WHERE id = $2`,
        [errorMessage, backupId]
      );
      
      throw error;
    }
  }

  async restoreBackup(tenantId: string, backupId: string): Promise<void> {
    try {
      // Get backup info
      const backupResult = await this.pgPool.query(
        `SELECT bh.file_path, td.database_name
         FROM backup_history bh
         JOIN tenant_databases td ON bh.tenant_database_id = td.id
         WHERE bh.id = $1 AND bh.status = 'completed'`,
        [backupId]
      );
      
      if (backupResult.rows.length === 0) {
        throw new Error(`Backup ${backupId} not found or not completed`);
      }
      
      const { file_path: backupFile, database_name: databaseName } = backupResult.rows[0];
      
      this.logger.info(`Starting restore for tenant ${tenantId} from ${backupFile}`);
      
      // Terminate existing connections
      await this.pgPool.query(
        `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1`,
        [databaseName]
      );
      
      // Drop and recreate database
      await this.pgPool.query(`DROP DATABASE IF EXISTS ${databaseName}`);
      await this.pgPool.query(`CREATE DATABASE ${databaseName}`);
      
      // Restore from backup
      const restoreCommand = `psql -h ${process.env.POSTGRES_HOST} -U ${process.env.POSTGRES_USER} -d ${databaseName} -f ${backupFile}`;
      execSync(restoreCommand, { env: { ...process.env, PGPASSWORD: process.env.POSTGRES_PASSWORD } });
      
      this.logger.info(`Restore completed for tenant ${tenantId}`);
      
    } catch (error) {
      this.logger.error(`Restore failed for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  async getBackupHistory(tenantId: string): Promise<any[]> {
    const result = await this.pgPool.query(
      `SELECT id, backup_type, file_path, file_size_bytes, status, 
              error_message, started_at, completed_at
       FROM backup_history 
       WHERE tenant_database_id = $1 
       ORDER BY started_at DESC 
       LIMIT 50`,
      [tenantId]
    );
    
    return result.rows;
  }

  async performDailyBackups(): Promise<void> {
    const tenantsResult = await this.pgPool.query(
      'SELECT id FROM tenant_databases WHERE status = \'active\''
    );
    
    for (const tenant of tenantsResult.rows) {
      try {
        await this.createBackup(tenant.id, 'full');
      } catch (error) {
        this.logger.error(`Daily backup failed for tenant ${tenant.id}:`, error);
      }
    }
  }

  async cleanupOldBackups(retentionDays: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    // Get old backup files
    const oldBackupsResult = await this.pgPool.query(
      `SELECT id, file_path FROM backup_history 
       WHERE completed_at < $1 AND status = 'completed'`,
      [cutoffDate]
    );
    
    for (const backup of oldBackupsResult.rows) {
      try {
        // Delete file
        execSync(`rm -f ${backup.file_path}`);
        
        // Remove record
        await this.pgPool.query(
          'DELETE FROM backup_history WHERE id = $1',
          [backup.id]
        );
        
        this.logger.info(`Cleaned up old backup: ${backup.file_path}`);
      } catch (error) {
        this.logger.error(`Failed to cleanup backup ${backup.file_path}:`, error);
      }
    }
  }
}