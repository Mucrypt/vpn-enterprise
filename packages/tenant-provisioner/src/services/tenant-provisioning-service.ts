import { Pool } from 'pg';
import Docker from 'dockerode';
import winston from 'winston';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

export interface TenantConfig {
  id: string;
  organizationId: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  isolation: 'schema' | 'database' | 'container';
  status: 'provisioning' | 'active' | 'scaling' | 'suspended' | 'destroying';
  resources?: {
    maxConnections: number;
    maxStorage: string;
    maxCpu: string;
    maxMemory: string;
  };
  options?: any;
}

export class TenantProvisioningService {
  constructor(
    private pgPool: Pool,
    private docker: Docker,
    private logger: winston.Logger
  ) {}

  async createTenant(
    organizationId: string,
    name: string,
    plan: string,
    options: any = {}
  ): Promise<TenantConfig> {
    const tenantId = uuidv4();
    const isolation = this.determineIsolation(plan);
    
    this.logger.info(`Creating tenant ${tenantId} with ${isolation} isolation`);

    try {
      // Create tenant record
      const tenant = await this.createTenantRecord(tenantId, organizationId, name, plan, isolation, options);
      
      // Provision based on isolation type
      switch (isolation) {
        case 'schema':
          await this.provisionSchemaIsolation(tenant);
          break;
        case 'database':
          await this.provisionDatabaseIsolation(tenant);
          break;
        case 'container':
          await this.provisionContainerIsolation(tenant);
          break;
      }

      // Update status to active
      await this.updateTenantStatus(tenantId, 'active');
      tenant.status = 'active';

      return tenant;

    } catch (error) {
      await this.updateTenantStatus(tenantId, 'suspended');
      throw error;
    }
  }

  private determineIsolation(plan: string): 'schema' | 'database' | 'container' {
    switch (plan) {
      case 'free':
        return 'schema';
      case 'pro':
        return 'database';
      case 'enterprise':
        return 'container';
      default:
        return 'schema';
    }
  }

  private async createTenantRecord(
    tenantId: string,
    organizationId: string,
    name: string,
    plan: string,
    isolation: string,
    options: any
  ): Promise<TenantConfig> {
    const client = await this.pgPool.connect();
    
    try {
      const result = await client.query(`
        INSERT INTO tenants (
          id, organization_id, name, plan, isolation_type, 
          status, resources, options, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        RETURNING *
      `, [
        tenantId,
        organizationId,
        name,
        plan,
        isolation,
        'provisioning',
        this.getDefaultResources(plan),
        JSON.stringify(options)
      ]);

      const row = result.rows[0];
      return {
        id: row.id,
        organizationId: row.organization_id,
        name: row.name,
        plan: row.plan,
        isolation: row.isolation_type,
        status: row.status,
        resources: JSON.parse(row.resources || '{}'),
        options: JSON.parse(row.options || '{}')
      };
    } finally {
      client.release();
    }
  }

  private getDefaultResources(plan: string) {
    const resourceLimits: Record<string, any> = {
      free: {
        maxConnections: 5,
        maxStorage: '100MB',
        maxCpu: '0.1',
        maxMemory: '128MB'
      },
      pro: {
        maxConnections: 50,
        maxStorage: '10GB',
        maxCpu: '1',
        maxMemory: '1GB'
      },
      enterprise: {
        maxConnections: 200,
        maxStorage: '100GB',
        maxCpu: '4',
        maxMemory: '8GB'
      }
    };

    return JSON.stringify(resourceLimits[plan] || resourceLimits.free);
  }

  private async provisionSchemaIsolation(tenant: TenantConfig): Promise<void> {
    const client = await this.pgPool.connect();
    const schemaName = `tenant_${tenant.id.replace(/-/g, '_')}`;
    const roleName = `tenant_${tenant.id.replace(/-/g, '_')}_role`;
    const password = crypto.randomBytes(32).toString('hex');

    try {
      await client.query('BEGIN');

      // Create schema
      await client.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);
      
      // Create role
      await client.query(`CREATE ROLE ${roleName} WITH LOGIN PASSWORD '${password}'`);
      
      // Grant permissions
      await client.query(`GRANT USAGE ON SCHEMA ${schemaName} TO ${roleName}`);
      await client.query(`GRANT CREATE ON SCHEMA ${schemaName} TO ${roleName}`);
      await client.query(`GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA ${schemaName} TO ${roleName}`);
      await client.query(`GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA ${schemaName} TO ${roleName}`);
      
      // Set default privileges
      await client.query(`
        ALTER DEFAULT PRIVILEGES IN SCHEMA ${schemaName} 
        GRANT ALL PRIVILEGES ON TABLES TO ${roleName}
      `);
      
      // Update tenant connection info
      await client.query(`
        UPDATE tenants 
        SET connection_info = $1 
        WHERE id = $2
      `, [JSON.stringify({
        host: process.env.POSTGRES_HOST || 'postgres-primary',
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        database: process.env.POSTGRES_DB || 'platform_db',
        schema: schemaName,
        username: roleName,
        password: password
      }), tenant.id]);

      await client.query('COMMIT');
      
      this.logger.info(`Schema isolation provisioned for tenant ${tenant.id}`);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async provisionDatabaseIsolation(tenant: TenantConfig): Promise<void> {
    const client = await this.pgPool.connect();
    const dbName = `tenant_${tenant.id.replace(/-/g, '_')}`;
    const roleName = `${dbName}_owner`;
    const password = crypto.randomBytes(32).toString('hex');

    try {
      await client.query('BEGIN');

      // Create database
      await client.query(`CREATE DATABASE ${dbName} OWNER ${roleName}`);
      
      // Create role
      await client.query(`CREATE ROLE ${roleName} WITH LOGIN PASSWORD '${password}'`);
      
      // Grant permissions
      await client.query(`GRANT ALL PRIVILEGES ON DATABASE ${dbName} TO ${roleName}`);
      
      // Update tenant connection info
      await client.query(`
        UPDATE tenants 
        SET connection_info = $1 
        WHERE id = $2
      `, [JSON.stringify({
        host: process.env.POSTGRES_HOST || 'postgres-primary',
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        database: dbName,
        username: roleName,
        password: password
      }), tenant.id]);

      await client.query('COMMIT');
      
      this.logger.info(`Database isolation provisioned for tenant ${tenant.id}`);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async provisionContainerIsolation(tenant: TenantConfig): Promise<void> {
    const containerName = `tenant-db-${tenant.id}`;
    const dbName = `tenant_${tenant.id.replace(/-/g, '_')}`;
    const password = crypto.randomBytes(32).toString('hex');

    try {
      // Create dedicated PostgreSQL container for tenant
      const container = await this.docker.createContainer({
        Image: 'postgres:15-alpine',
        name: containerName,
        Env: [
          `POSTGRES_DB=${dbName}`,
          `POSTGRES_USER=${dbName}_owner`,
          `POSTGRES_PASSWORD=${password}`
        ],
        HostConfig: {
          NetworkMode: 'docker_database-platform',
          Memory: this.parseMemory(tenant.resources?.maxMemory || '1GB'),
          NanoCpus: this.parseCpu(tenant.resources?.maxCpu || '1') * 1000000000,
          RestartPolicy: { Name: 'unless-stopped' }
        },
        Labels: {
          'vpn-enterprise.service': 'tenant-database',
          'vpn-enterprise.tenant-id': tenant.id,
          'vpn-enterprise.plan': tenant.plan
        }
      });

      await container.start();

      // Wait for container to be ready
      await this.waitForContainerHealth(container, 30000);

      // Update tenant connection info
      const client = await this.pgPool.connect();
      try {
        await client.query(`
          UPDATE tenants 
          SET connection_info = $1 
          WHERE id = $2
        `, [JSON.stringify({
          host: containerName,
          port: 5432,
          database: dbName,
          username: `${dbName}_owner`,
          password: password,
          containerId: container.id
        }), tenant.id]);
      } finally {
        client.release();
      }

      this.logger.info(`Container isolation provisioned for tenant ${tenant.id}`);

    } catch (error) {
      // Cleanup on failure
      try {
        const container = this.docker.getContainer(containerName);
        await container.stop();
        await container.remove();
      } catch (cleanupError) {
        this.logger.warn(`Failed to cleanup container ${containerName}:`, cleanupError);
      }
      throw error;
    }
  }

  private parseMemory(memory: string): number {
    const units = { MB: 1024 * 1024, GB: 1024 * 1024 * 1024 };
    const match = memory.match(/^(\d+)(MB|GB)$/);
    if (!match) return 128 * 1024 * 1024; // Default 128MB
    return parseInt(match[1]) * units[match[2] as keyof typeof units];
  }

  private parseCpu(cpu: string): number {
    return parseFloat(cpu);
  }

  private async waitForContainerHealth(container: Docker.Container, timeoutMs: number): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      const info = await container.inspect();
      if (info.State.Running) {
        // Additional check for PostgreSQL readiness could be added here
        await new Promise(resolve => setTimeout(resolve, 2000));
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error('Container failed to start within timeout period');
  }

  async scaleTenant(tenantId: string, newPlan: string, resources?: any): Promise<void> {
    const client = await this.pgPool.connect();
    
    try {
      const tenant = await this.getTenant(tenantId);
      if (!tenant) {
        throw new Error(`Tenant ${tenantId} not found`);
      }

      await this.updateTenantStatus(tenantId, 'scaling');

      // Update plan and resources
      await client.query(`
        UPDATE tenants 
        SET plan = $1, resources = $2, updated_at = NOW()
        WHERE id = $3
      `, [newPlan, JSON.stringify(resources || this.getDefaultResources(newPlan)), tenantId]);

      // Handle container scaling if needed
      if (tenant.isolation_type === 'container') {
        await this.scaleContainer(tenant, resources);
      }

      await this.updateTenantStatus(tenantId, 'active');
      
      this.logger.info(`Tenant ${tenantId} scaled to ${newPlan} plan`);

    } catch (error) {
      await this.updateTenantStatus(tenantId, 'active'); // Revert to previous state
      throw error;
    } finally {
      client.release();
    }
  }

  private async scaleContainer(tenant: any, resources: any): Promise<void> {
    if (!tenant.connection_info?.containerId) {
      throw new Error('Container ID not found for tenant');
    }

    const container = this.docker.getContainer(tenant.connection_info.containerId);
    
    // Update container resource limits
    await container.update({
      Memory: resources?.maxMemory ? this.parseMemory(resources.maxMemory) : undefined,
      NanoCpus: resources?.maxCpu ? this.parseCpu(resources.maxCpu) * 1000000000 : undefined
    });
  }

  async destroyTenant(tenantId: string): Promise<void> {
    const client = await this.pgPool.connect();
    
    try {
      const tenant = await this.getTenant(tenantId);
      if (!tenant) {
        throw new Error(`Tenant ${tenantId} not found`);
      }

      await this.updateTenantStatus(tenantId, 'destroying');

      // Handle different isolation types
      switch (tenant.isolation_type) {
        case 'container':
          await this.destroyContainer(tenant);
          break;
        case 'database':
          await this.destroyDatabase(tenant);
          break;
        case 'schema':
          await this.destroySchema(tenant);
          break;
      }

      // Remove tenant record
      await client.query('DELETE FROM tenants WHERE id = $1', [tenantId]);
      
      this.logger.info(`Tenant ${tenantId} destroyed`);

    } catch (error) {
      await this.updateTenantStatus(tenantId, 'suspended');
      throw error;
    } finally {
      client.release();
    }
  }

  private async destroyContainer(tenant: any): Promise<void> {
    if (tenant.connection_info?.containerId) {
      const container = this.docker.getContainer(tenant.connection_info.containerId);
      try {
        await container.stop({ t: 10 });
        await container.remove();
      } catch (error) {
        this.logger.warn(`Failed to remove container for tenant ${tenant.id}:`, error);
      }
    }
  }

  private async destroyDatabase(tenant: any): Promise<void> {
    const client = await this.pgPool.connect();
    try {
      const dbName = `tenant_${tenant.id.replace(/-/g, '_')}`;
      const roleName = `${dbName}_owner`;
      
      await client.query(`DROP DATABASE IF EXISTS ${dbName}`);
      await client.query(`DROP ROLE IF EXISTS ${roleName}`);
    } finally {
      client.release();
    }
  }

  private async destroySchema(tenant: any): Promise<void> {
    const client = await this.pgPool.connect();
    try {
      const schemaName = `tenant_${tenant.id.replace(/-/g, '_')}`;
      const roleName = `tenant_${tenant.id.replace(/-/g, '_')}_role`;
      
      await client.query(`DROP SCHEMA IF EXISTS ${schemaName} CASCADE`);
      await client.query(`DROP ROLE IF EXISTS ${roleName}`);
    } finally {
      client.release();
    }
  }

  async getTenant(tenantId: string): Promise<any> {
    const client = await this.pgPool.connect();
    try {
      const result = await client.query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async getTenantStatus(tenantId: string): Promise<any> {
    return this.getTenant(tenantId);
  }

  private async updateTenantStatus(tenantId: string, status: string): Promise<void> {
    const client = await this.pgPool.connect();
    try {
      await client.query(`
        UPDATE tenants 
        SET status = $1, updated_at = NOW() 
        WHERE id = $2
      `, [status, tenantId]);
    } finally {
      client.release();
    }
  }
}