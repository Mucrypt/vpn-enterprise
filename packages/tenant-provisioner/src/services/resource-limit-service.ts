import { Pool } from 'pg';
import winston from 'winston';

export interface ResourceLimits {
  maxConnections: number;
  maxStorage: string;
  maxCpu: string;
  maxMemory: string;
  maxQueryTime?: number;
  maxTableSize?: string;
  maxIndexes?: number;
}

export class ResourceLimitService {
  constructor(
    private pgPool: Pool,
    private logger: winston.Logger
  ) {}

  async applyResourceLimits(tenantId: string, plan: string): Promise<void> {
    const limits = this.getPlanLimits(plan);
    await this.updateResourceLimits(tenantId, limits);
  }

  async updateResourceLimits(tenantId: string, limits: ResourceLimits): Promise<void> {
    const client = await this.pgPool.connect();
    
    try {
      // Update tenant record
      await client.query(`
        UPDATE tenants 
        SET resources = $1, updated_at = NOW()
        WHERE id = $2
      `, [JSON.stringify(limits), tenantId]);

      // Apply database-level limits
      await this.applyDatabaseLimits(client, tenantId, limits);
      
      this.logger.info(`Resource limits updated for tenant ${tenantId}`, { limits });

    } catch (error) {
      this.logger.error(`Failed to update resource limits for tenant ${tenantId}:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  private async applyDatabaseLimits(client: any, tenantId: string, limits: ResourceLimits): Promise<void> {
    try {
      // Get tenant info
      const tenantResult = await client.query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
      const tenant = tenantResult.rows[0];
      
      if (!tenant) {
        throw new Error(`Tenant ${tenantId} not found`);
      }

      const connectionInfo = JSON.parse(tenant.connection_info || '{}');
      
      // Apply connection limits
      if (tenant.isolation_type === 'schema') {
        await this.applySchemaLimits(client, connectionInfo.username, limits);
      } else if (tenant.isolation_type === 'database') {
        await this.applyDatabaseRoleLimits(client, connectionInfo.username, limits);
      }
      // Container limits are handled at the Docker level

    } catch (error) {
      this.logger.warn(`Failed to apply database limits for tenant ${tenantId}:`, error);
    }
  }

  private async applySchemaLimits(client: any, roleName: string, limits: ResourceLimits): Promise<void> {
    try {
      // Set connection limit
      await client.query(`ALTER ROLE ${roleName} CONNECTION LIMIT ${limits.maxConnections}`);
      
      // Set query timeout if specified
      if (limits.maxQueryTime) {
        await client.query(`
          ALTER ROLE ${roleName} 
          SET statement_timeout = '${limits.maxQueryTime}s'
        `);
      }

    } catch (error) {
      this.logger.warn(`Failed to apply schema limits for role ${roleName}:`, error);
    }
  }

  private async applyDatabaseRoleLimits(client: any, roleName: string, limits: ResourceLimits): Promise<void> {
    try {
      // Set connection limit
      await client.query(`ALTER ROLE ${roleName} CONNECTION LIMIT ${limits.maxConnections}`);
      
      // Set query timeout if specified
      if (limits.maxQueryTime) {
        await client.query(`
          ALTER ROLE ${roleName} 
          SET statement_timeout = '${limits.maxQueryTime}s'
        `);
      }

      // Set work_mem limit based on memory allocation
      const workMem = this.calculateWorkMem(limits.maxMemory);
      await client.query(`
        ALTER ROLE ${roleName} 
        SET work_mem = '${workMem}'
      `);

    } catch (error) {
      this.logger.warn(`Failed to apply database role limits for ${roleName}:`, error);
    }
  }

  private calculateWorkMem(maxMemory: string): string {
    const memoryMB = this.parseMemoryToMB(maxMemory);
    // Allocate 25% of max memory for work_mem, but cap at 256MB
    const workMemMB = Math.min(Math.floor(memoryMB * 0.25), 256);
    return `${workMemMB}MB`;
  }

  private parseMemoryToMB(memory: string): number {
    const match = memory.match(/^(\d+)(MB|GB)$/);
    if (!match) return 128; // Default 128MB
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    return unit === 'GB' ? value * 1024 : value;
  }

  private getPlanLimits(plan: string): ResourceLimits {
    const planLimits: Record<string, ResourceLimits> = {
      free: {
        maxConnections: 5,
        maxStorage: '100MB',
        maxCpu: '0.1',
        maxMemory: '128MB',
        maxQueryTime: 30,
        maxTableSize: '10MB',
        maxIndexes: 10
      },
      pro: {
        maxConnections: 50,
        maxStorage: '10GB',
        maxCpu: '1',
        maxMemory: '1GB',
        maxQueryTime: 300,
        maxTableSize: '1GB',
        maxIndexes: 100
      },
      enterprise: {
        maxConnections: 200,
        maxStorage: '100GB',
        maxCpu: '4',
        maxMemory: '8GB',
        maxQueryTime: 1800,
        maxTableSize: '10GB',
        maxIndexes: 1000
      }
    };

    return planLimits[plan] || planLimits.free;
  }

  async getCurrentUsage(tenantId: string): Promise<any> {
    const client = await this.pgPool.connect();
    
    try {
      // Get tenant info
      const tenantResult = await client.query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
      const tenant = tenantResult.rows[0];
      
      if (!tenant) {
        throw new Error(`Tenant ${tenantId} not found`);
      }

      const connectionInfo = JSON.parse(tenant.connection_info || '{}');
      let usage = {};

      if (tenant.isolation_type === 'schema') {
        usage = await this.getSchemaUsage(client, connectionInfo.schema);
      } else if (tenant.isolation_type === 'database') {
        usage = await this.getDatabaseUsage(client, connectionInfo.database);
      }

      return usage;

    } finally {
      client.release();
    }
  }

  private async getSchemaUsage(client: any, schemaName: string): Promise<any> {
    try {
      // Get table count and sizes
      const tablesResult = await client.query(`
        SELECT 
          COUNT(*) as table_count,
          COALESCE(SUM(pg_total_relation_size(schemaname||'.'||tablename)), 0) as total_size
        FROM pg_tables 
        WHERE schemaname = $1
      `, [schemaName]);

      // Get connection count
      const connectionsResult = await client.query(`
        SELECT COUNT(*) as active_connections
        FROM pg_stat_activity 
        WHERE query NOT LIKE '%pg_stat_activity%' 
        AND state = 'active'
      `);

      return {
        tableCount: parseInt(tablesResult.rows[0].table_count),
        totalSize: parseInt(tablesResult.rows[0].total_size),
        activeConnections: parseInt(connectionsResult.rows[0].active_connections)
      };

    } catch (error) {
      this.logger.warn(`Failed to get schema usage for ${schemaName}:`, error);
      return {};
    }
  }

  private async getDatabaseUsage(client: any, databaseName: string): Promise<any> {
    try {
      // Get database size
      const sizeResult = await client.query(`
        SELECT pg_database_size($1) as database_size
      `, [databaseName]);

      // Get connection count for this database
      const connectionsResult = await client.query(`
        SELECT COUNT(*) as active_connections
        FROM pg_stat_activity 
        WHERE datname = $1 
        AND query NOT LIKE '%pg_stat_activity%' 
        AND state = 'active'
      `, [databaseName]);

      return {
        databaseSize: parseInt(sizeResult.rows[0].database_size),
        activeConnections: parseInt(connectionsResult.rows[0].active_connections)
      };

    } catch (error) {
      this.logger.warn(`Failed to get database usage for ${databaseName}:`, error);
      return {};
    }
  }

  async checkResourceViolations(tenantId: string): Promise<any[]> {
    const client = await this.pgPool.connect();
    const violations: any[] = [];
    
    try {
      // Get tenant info and limits
      const tenantResult = await client.query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
      const tenant = tenantResult.rows[0];
      
      if (!tenant) {
        return violations;
      }

      const limits = JSON.parse(tenant.resources || '{}');
      const usage = await this.getCurrentUsage(tenantId);

      // Check connection limits
      if (usage.activeConnections > limits.maxConnections) {
        violations.push({
          type: 'connections',
          current: usage.activeConnections,
          limit: limits.maxConnections,
          severity: 'warning'
        });
      }

      // Check storage limits
      const storageLimit = this.parseMemoryToMB(limits.maxStorage) * 1024 * 1024; // Convert to bytes
      const currentStorage = usage.totalSize || usage.databaseSize || 0;
      
      if (currentStorage > storageLimit) {
        violations.push({
          type: 'storage',
          current: currentStorage,
          limit: storageLimit,
          severity: 'critical'
        });
      }

      return violations;

    } finally {
      client.release();
    }
  }

  async enforceResourceLimits(tenantId: string): Promise<void> {
    const violations = await this.checkResourceViolations(tenantId);
    
    for (const violation of violations) {
      switch (violation.type) {
        case 'connections':
          await this.enforceConnectionLimit(tenantId);
          break;
        case 'storage':
          await this.enforceStorageLimit(tenantId);
          break;
      }
    }
  }

  private async enforceConnectionLimit(tenantId: string): Promise<void> {
    const client = await this.pgPool.connect();
    
    try {
      const tenantResult = await client.query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
      const tenant = tenantResult.rows[0];
      
      if (!tenant) return;

      const connectionInfo = JSON.parse(tenant.connection_info || '{}');
      
      // Terminate excess connections
      if (tenant.isolation_type === 'database') {
        await client.query(`
          SELECT pg_terminate_backend(pid)
          FROM pg_stat_activity 
          WHERE datname = $1 
          AND pid != pg_backend_pid()
          ORDER BY backend_start DESC
          LIMIT 5
        `, [connectionInfo.database]);
      }

      this.logger.warn(`Enforced connection limit for tenant ${tenantId}`);

    } finally {
      client.release();
    }
  }

  private async enforceStorageLimit(tenantId: string): Promise<void> {
    // This would typically involve alerting and potentially suspending the tenant
    this.logger.error(`Storage limit exceeded for tenant ${tenantId} - manual intervention required`);
    
    // Update tenant status to suspended
    const client = await this.pgPool.connect();
    try {
      await client.query(`
        UPDATE tenants 
        SET status = 'suspended', updated_at = NOW()
        WHERE id = $1
      `, [tenantId]);
    } finally {
      client.release();
    }
  }
}