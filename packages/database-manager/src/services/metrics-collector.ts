import { Pool } from 'pg';
import Redis from 'ioredis';
import winston from 'winston';

export class MetricsCollector {
  constructor(
    private pgPool: Pool,
    private redis: Redis,
    private logger: winston.Logger
  ) {}

  async collectAllMetrics(): Promise<void> {
    try {
      this.logger.info('Starting metrics collection for all tenants');
      
      // Get all active tenants
      const client = await this.pgPool.connect();
      try {
        const result = await client.query('SELECT id FROM tenants WHERE status = $1', ['active']);
        
        for (const tenant of result.rows) {
          await this.collectTenantMetrics(tenant.id);
        }
        
        this.logger.info('Metrics collection completed for all tenants');
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.error('Failed to collect metrics:', error);
      throw error;
    }
  }

  async collectTenantMetrics(tenantId: string): Promise<void> {
    try {
      const client = await this.pgPool.connect();
      
      try {
        // Get tenant info
        const tenantResult = await client.query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
        if (!tenantResult.rows[0]) return;
        
        const tenant = tenantResult.rows[0];
        const connectionInfo = JSON.parse(tenant.connection_info || '{}');

        // Collect basic metrics
        const metrics = {
          timestamp: new Date().toISOString(),
          tenantId,
          connections: await this.getConnectionCount(client, tenant),
          storage: await this.getStorageUsage(client, tenant),
          queries: await this.getQueryMetrics(client, tenant),
          performance: await this.getPerformanceMetrics(client, tenant)
        };

        // Store metrics in Redis
        const key = `metrics:${tenantId}:${Date.now()}`;
        await this.redis.setex(key, 7 * 24 * 3600, JSON.stringify(metrics)); // Keep for 7 days

        // Also store latest metrics
        await this.redis.set(`metrics:latest:${tenantId}`, JSON.stringify(metrics));

      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.error(`Failed to collect metrics for tenant ${tenantId}:`, error);
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
        // For schema isolation, we approximate based on current_schema usage
        const result = await client.query(`
          SELECT COUNT(*) as count
          FROM pg_stat_activity 
          WHERE state = 'active'
        `);
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

  private async getQueryMetrics(client: any, tenant: any): Promise<any> {
    try {
      // Get basic query statistics
      const result = await client.query(`
        SELECT 
          calls,
          total_time,
          mean_time,
          rows
        FROM pg_stat_statements 
        WHERE query NOT LIKE '%pg_stat_%'
        ORDER BY calls DESC
        LIMIT 10
      `);

      return {
        topQueries: result.rows,
        totalQueries: result.rows.reduce((sum: number, row: any) => sum + parseInt(row.calls), 0),
        averageTime: result.rows.reduce((sum: number, row: any) => sum + parseFloat(row.mean_time), 0) / Math.max(result.rows.length, 1)
      };
    } catch (error) {
      // pg_stat_statements might not be enabled
      return {
        topQueries: [],
        totalQueries: 0,
        averageTime: 0
      };
    }
  }

  private async getPerformanceMetrics(client: any, tenant: any): Promise<any> {
    try {
      const result = await client.query(`
        SELECT 
          datname,
          numbackends,
          xact_commit,
          xact_rollback,
          blks_read,
          blks_hit,
          tup_returned,
          tup_fetched,
          tup_inserted,
          tup_updated,
          tup_deleted
        FROM pg_stat_database 
        WHERE datname NOT IN ('template0', 'template1', 'postgres')
      `);

      return result.rows[0] || {};
    } catch (error) {
      this.logger.warn(`Failed to get performance metrics for tenant ${tenant.id}:`, error);
      return {};
    }
  }

  async getTenantMetrics(tenantId: string, period: string = '24h'): Promise<any> {
    try {
      // Get latest metrics
      const latest = await this.redis.get(`metrics:latest:${tenantId}`);
      
      // Get historical metrics based on period
      const periodMs = this.parsePeriod(period);
      const since = Date.now() - periodMs;
      
      const keys = await this.redis.keys(`metrics:${tenantId}:*`);
      const historicalMetrics = [];
      
      for (const key of keys) {
        const timestamp = parseInt(key.split(':')[2]);
        if (timestamp >= since) {
          const data = await this.redis.get(key);
          if (data) {
            historicalMetrics.push(JSON.parse(data));
          }
        }
      }
      
      return {
        latest: latest ? JSON.parse(latest) : null,
        historical: historicalMetrics.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      };
    } catch (error) {
      this.logger.error(`Failed to get tenant metrics for ${tenantId}:`, error);
      throw error;
    }
  }

  private parsePeriod(period: string): number {
    const units = {
      'h': 60 * 60 * 1000,      // hours
      'd': 24 * 60 * 60 * 1000,  // days
      'w': 7 * 24 * 60 * 60 * 1000  // weeks
    };

    const match = period.match(/^(\d+)([hdw])$/);
    if (!match) return 24 * 60 * 60 * 1000; // Default to 24 hours

    const value = parseInt(match[1]);
    const unit = match[2] as keyof typeof units;
    
    return value * units[unit];
  }
}