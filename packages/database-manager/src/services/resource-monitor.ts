import { Pool } from 'pg';
import Redis from 'ioredis';
import winston from 'winston';

export class ResourceMonitor {
  constructor(
    private pgPool: Pool,
    private redis: Redis,
    private logger: winston.Logger
  ) {}

  async checkAllResources(): Promise<void> {
    try {
      // Get all active tenants
      const client = await this.pgPool.connect();
      try {
        const result = await client.query('SELECT id FROM tenants WHERE status = $1', ['active']);
        
        for (const tenant of result.rows) {
          await this.checkTenantResources(tenant.id);
        }
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.error('Failed to check resources:', error);
      throw error;
    }
  }

  async checkTenantResources(tenantId: string): Promise<void> {
    try {
      const client = await this.pgPool.connect();
      
      try {
        // Get tenant info
        const tenantResult = await client.query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
        if (!tenantResult.rows[0]) return;
        
        const tenant = tenantResult.rows[0];
        const limits = JSON.parse(tenant.resources || '{}');
        const resources = await this.getTenantResources(tenantId);

        // Check for violations
        const violations = [];

        // Check connection limits
        if (resources.connections > limits.maxConnections) {
          violations.push({
            type: 'connections',
            current: resources.connections,
            limit: limits.maxConnections,
            severity: 'warning'
          });
        }

        // Check storage limits
        if (resources.storage > this.parseStorage(limits.maxStorage)) {
          violations.push({
            type: 'storage',
            current: resources.storage,
            limit: this.parseStorage(limits.maxStorage),
            severity: 'critical'
          });
        }

        // Store resource status
        const status = {
          timestamp: new Date().toISOString(),
          tenantId,
          resources,
          violations,
          healthy: violations.length === 0
        };

        await this.redis.setex(`resources:${tenantId}`, 300, JSON.stringify(status)); // 5 minutes cache

        // Log violations
        if (violations.length > 0) {
          this.logger.warn(`Resource violations detected for tenant ${tenantId}:`, violations);
          
          // Handle critical violations
          const criticalViolations = violations.filter(v => v.severity === 'critical');
          if (criticalViolations.length > 0) {
            await this.handleCriticalViolations(tenantId, criticalViolations);
          }
        }

      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.error(`Failed to check resources for tenant ${tenantId}:`, error);
    }
  }

  async getTenantResources(tenantId: string): Promise<any> {
    try {
      const client = await this.pgPool.connect();
      
      try {
        // Get tenant info
        const tenantResult = await client.query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
        if (!tenantResult.rows[0]) {
          throw new Error(`Tenant ${tenantId} not found`);
        }
        
        const tenant = tenantResult.rows[0];
        const connectionInfo = JSON.parse(tenant.connection_info || '{}');

        const resources = {
          connections: await this.getConnectionCount(client, tenant),
          storage: await this.getStorageUsage(client, tenant),
          cpu: await this.getCPUUsage(tenant),
          memory: await this.getMemoryUsage(tenant),
          queries: await this.getQueryCount(client, tenant)
        };

        return resources;
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.error(`Failed to get tenant resources for ${tenantId}:`, error);
      throw error;
    }
  }

  private async getConnectionCount(client: any, tenant: any): Promise<number> {
    try {
      const connectionInfo = JSON.parse(tenant.connection_info || '{}');
      
      if (tenant.isolation_type === 'database') {
        const result = await client.query(`
          SELECT COUNT(*) as count
          FROM pg_stat_activity 
          WHERE datname = $1 AND state = 'active'
        `, [connectionInfo.database]);
        return parseInt(result.rows[0].count);
      } else if (tenant.isolation_type === 'schema') {
        // For schema isolation, count connections to the role
        const result = await client.query(`
          SELECT COUNT(*) as count
          FROM pg_stat_activity 
          WHERE usename = $1 AND state = 'active'
        `, [connectionInfo.username]);
        return parseInt(result.rows[0].count);
      }
      
      return 0;
    } catch (error) {
      this.logger.warn(`Failed to get connection count for tenant ${tenant.id}:`, error);
      return 0;
    }
  }

  private async getStorageUsage(client: any, tenant: any): Promise<number> {
    try {
      const connectionInfo = JSON.parse(tenant.connection_info || '{}');
      
      if (tenant.isolation_type === 'database') {
        const result = await client.query(`
          SELECT pg_database_size($1) as size
        `, [connectionInfo.database]);
        return parseInt(result.rows[0].size);
      } else if (tenant.isolation_type === 'schema') {
        const result = await client.query(`
          SELECT COALESCE(SUM(pg_total_relation_size(schemaname||'.'||tablename)), 0) as size
          FROM pg_tables 
          WHERE schemaname = $1
        `, [connectionInfo.schema]);
        return parseInt(result.rows[0].size);
      }
      
      return 0;
    } catch (error) {
      this.logger.warn(`Failed to get storage usage for tenant ${tenant.id}:`, error);
      return 0;
    }
  }

  private async getCPUUsage(tenant: any): Promise<number> {
    // For container isolation, we could query Docker stats
    // For now, return 0 as a placeholder
    try {
      if (tenant.isolation_type === 'container') {
        // TODO: Implement Docker stats collection
        return 0;
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  private async getMemoryUsage(tenant: any): Promise<number> {
    // For container isolation, we could query Docker stats
    // For now, return 0 as a placeholder
    try {
      if (tenant.isolation_type === 'container') {
        // TODO: Implement Docker stats collection
        return 0;
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  private async getQueryCount(client: any, tenant: any): Promise<number> {
    try {
      const connectionInfo = JSON.parse(tenant.connection_info || '{}');
      
      if (tenant.isolation_type === 'database') {
        const result = await client.query(`
          SELECT COALESCE(SUM(calls), 0) as count
          FROM pg_stat_statements s
          JOIN pg_database d ON s.dbid = d.oid
          WHERE d.datname = $1
        `, [connectionInfo.database]);
        return parseInt(result.rows[0].count);
      }
      
      return 0;
    } catch (error) {
      // pg_stat_statements might not be enabled
      return 0;
    }
  }

  private parseStorage(storage: string): number {
    const match = storage.match(/^(\d+)(MB|GB)$/);
    if (!match) return 0;
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    if (unit === 'GB') {
      return value * 1024 * 1024 * 1024;
    } else {
      return value * 1024 * 1024;
    }
  }

  private async handleCriticalViolations(tenantId: string, violations: any[]): Promise<void> {
    this.logger.error(`Critical resource violations for tenant ${tenantId}:`, violations);
    
    // For storage violations, we might want to suspend the tenant
    const storageViolations = violations.filter(v => v.type === 'storage');
    if (storageViolations.length > 0) {
      const client = await this.pgPool.connect();
      try {
        await client.query(`
          UPDATE tenants 
          SET status = 'suspended', updated_at = NOW()
          WHERE id = $1
        `, [tenantId]);
        
        this.logger.error(`Tenant ${tenantId} suspended due to storage violations`);
      } finally {
        client.release();
      }
    }
  }

  async getResourceAlerts(): Promise<any[]> {
    try {
      const keys = await this.redis.keys('resources:*');
      const alerts = [];
      
      for (const key of keys) {
        const data = await this.redis.get(key);
        if (data) {
          const status = JSON.parse(data);
          if (!status.healthy) {
            alerts.push(status);
          }
        }
      }
      
      return alerts.sort((a, b) => {
        const severityOrder = { critical: 3, warning: 2, info: 1 };
        const aMaxSeverity = Math.max(...a.violations.map((v: any) => severityOrder[v.severity as keyof typeof severityOrder] || 0));
        const bMaxSeverity = Math.max(...b.violations.map((v: any) => severityOrder[v.severity as keyof typeof severityOrder] || 0));
        return bMaxSeverity - aMaxSeverity;
      });
    } catch (error) {
      this.logger.error('Failed to get resource alerts:', error);
      return [];
    }
  }
}