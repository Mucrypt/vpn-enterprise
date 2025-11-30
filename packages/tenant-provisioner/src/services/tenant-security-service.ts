import { Pool } from 'pg';
import winston from 'winston';
import crypto from 'crypto';

export interface SecurityConfig {
  enforceSSL?: boolean;
  allowedIPs?: string[];
  maxLoginAttempts?: number;
  sessionTimeout?: number;
  enableAuditLog?: boolean;
  dataEncryption?: boolean;
  backupEncryption?: boolean;
  accessRestrictions?: {
    allowedOperations: string[];
    deniedTables?: string[];
    readOnlyMode?: boolean;
  };
}

export class TenantSecurityService {
  constructor(
    private pgPool: Pool,
    private logger: winston.Logger
  ) {}

  async setupTenantSecurity(tenantId: string): Promise<void> {
    const client = await this.pgPool.connect();
    
    try {
      // Get tenant info
      const tenantResult = await client.query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
      const tenant = tenantResult.rows[0];
      
      if (!tenant) {
        throw new Error(`Tenant ${tenantId} not found`);
      }

      // Apply default security configuration
      const defaultConfig = this.getDefaultSecurityConfig(tenant.plan);
      await this.applySecurityConfiguration(client, tenant, defaultConfig);
      
      // Set up Row Level Security (RLS)
      await this.setupRowLevelSecurity(client, tenant);
      
      // Create audit log table if needed
      if (defaultConfig.enableAuditLog) {
        await this.setupAuditLogging(client, tenant);
      }

      this.logger.info(`Security setup completed for tenant ${tenantId}`);

    } catch (error) {
      this.logger.error(`Failed to setup security for tenant ${tenantId}:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  async updateSecurityConfig(tenantId: string, securityConfig: SecurityConfig): Promise<void> {
    const client = await this.pgPool.connect();
    
    try {
      // Get tenant info
      const tenantResult = await client.query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
      const tenant = tenantResult.rows[0];
      
      if (!tenant) {
        throw new Error(`Tenant ${tenantId} not found`);
      }

      // Update security configuration
      await client.query(`
        UPDATE tenants 
        SET security_config = $1, updated_at = NOW()
        WHERE id = $2
      `, [JSON.stringify(securityConfig), tenantId]);

      // Apply new configuration
      await this.applySecurityConfiguration(client, tenant, securityConfig);
      
      this.logger.info(`Security configuration updated for tenant ${tenantId}`);

    } catch (error) {
      this.logger.error(`Failed to update security config for tenant ${tenantId}:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  private async applySecurityConfiguration(client: any, tenant: any, config: SecurityConfig): Promise<void> {
    const connectionInfo = JSON.parse(tenant.connection_info || '{}');
    
    try {
      // Apply SSL enforcement
      if (config.enforceSSL && connectionInfo.username) {
        await this.enforceSSL(client, connectionInfo.username);
      }

      // Apply IP restrictions
      if (config.allowedIPs && config.allowedIPs.length > 0) {
        await this.applyIPRestrictions(client, connectionInfo.username, config.allowedIPs);
      }

      // Apply access restrictions
      if (config.accessRestrictions) {
        await this.applyAccessRestrictions(client, tenant, config.accessRestrictions);
      }

      // Set session timeout
      if (config.sessionTimeout && connectionInfo.username) {
        await this.setSessionTimeout(client, connectionInfo.username, config.sessionTimeout);
      }

    } catch (error) {
      this.logger.warn(`Failed to apply some security configurations for tenant ${tenant.id}:`, error);
    }
  }

  private async enforceSSL(client: any, username: string): Promise<void> {
    try {
      // Update pg_hba.conf entry to require SSL (would need to be done at system level)
      // For now, we'll set the role to require SSL connections
      await client.query(`ALTER ROLE ${username} SET ssl = on`);
    } catch (error) {
      this.logger.warn(`Failed to enforce SSL for user ${username}:`, error);
    }
  }

  private async applyIPRestrictions(client: any, username: string, allowedIPs: string[]): Promise<void> {
    try {
      // Store IP restrictions in tenant_security table
      await client.query(`
        INSERT INTO tenant_security (tenant_id, security_type, config, created_at)
        VALUES ($1, 'ip_restrictions', $2, NOW())
        ON CONFLICT (tenant_id, security_type) 
        DO UPDATE SET config = $2, updated_at = NOW()
      `, [username, JSON.stringify({ allowedIPs })]);

    } catch (error) {
      this.logger.warn(`Failed to apply IP restrictions for user ${username}:`, error);
    }
  }

  private async applyAccessRestrictions(client: any, tenant: any, restrictions: any): Promise<void> {
    const connectionInfo = JSON.parse(tenant.connection_info || '{}');
    
    try {
      if (restrictions.readOnlyMode && connectionInfo.username) {
        // Revoke write permissions
        if (tenant.isolation_type === 'schema') {
          await client.query(`
            REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA ${connectionInfo.schema} 
            FROM ${connectionInfo.username}
          `);
        }
      }

      // Store access restrictions
      await client.query(`
        INSERT INTO tenant_security (tenant_id, security_type, config, created_at)
        VALUES ($1, 'access_restrictions', $2, NOW())
        ON CONFLICT (tenant_id, security_type) 
        DO UPDATE SET config = $2, updated_at = NOW()
      `, [tenant.id, JSON.stringify(restrictions)]);

    } catch (error) {
      this.logger.warn(`Failed to apply access restrictions for tenant ${tenant.id}:`, error);
    }
  }

  private async setSessionTimeout(client: any, username: string, timeoutSeconds: number): Promise<void> {
    try {
      // Set idle session timeout
      await client.query(`
        ALTER ROLE ${username} 
        SET idle_in_transaction_session_timeout = '${timeoutSeconds}s'
      `);
    } catch (error) {
      this.logger.warn(`Failed to set session timeout for user ${username}:`, error);
    }
  }

  private async setupRowLevelSecurity(client: any, tenant: any): Promise<void> {
    if (tenant.isolation_type !== 'schema') {
      return; // RLS mainly useful for schema-level isolation
    }

    const connectionInfo = JSON.parse(tenant.connection_info || '{}');
    const schemaName = connectionInfo.schema;

    try {
      // Enable RLS on all tables in tenant schema
      const tablesResult = await client.query(`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = $1
      `, [schemaName]);

      for (const row of tablesResult.rows) {
        await client.query(`ALTER TABLE ${schemaName}.${row.tablename} ENABLE ROW LEVEL SECURITY`);
        
        // Create a basic RLS policy for the tenant
        await client.query(`
          CREATE POLICY tenant_isolation ON ${schemaName}.${row.tablename}
          FOR ALL TO ${connectionInfo.username}
          USING (true)
        `);
      }

    } catch (error) {
      this.logger.warn(`Failed to setup RLS for tenant ${tenant.id}:`, error);
    }
  }

  private async setupAuditLogging(client: any, tenant: any): Promise<void> {
    const connectionInfo = JSON.parse(tenant.connection_info || '{}');
    
    try {
      let auditTableName;
      
      if (tenant.isolation_type === 'schema') {
        auditTableName = `${connectionInfo.schema}.audit_log`;
      } else {
        auditTableName = 'audit_log';
      }

      // Create audit log table
      await client.query(`
        CREATE TABLE IF NOT EXISTS ${auditTableName} (
          id SERIAL PRIMARY KEY,
          tenant_id UUID NOT NULL,
          user_name TEXT,
          operation TEXT,
          table_name TEXT,
          record_id TEXT,
          old_values JSONB,
          new_values JSONB,
          timestamp TIMESTAMP DEFAULT NOW(),
          ip_address INET,
          session_id TEXT
        )
      `);

      // Create audit trigger function
      await client.query(`
        CREATE OR REPLACE FUNCTION audit_trigger_function()
        RETURNS TRIGGER AS $$
        BEGIN
          IF TG_OP = 'DELETE' THEN
            INSERT INTO ${auditTableName} (
              tenant_id, user_name, operation, table_name, 
              record_id, old_values, timestamp
            ) VALUES (
              '${tenant.id}', session_user, TG_OP, TG_TABLE_NAME,
              OLD.id::text, row_to_json(OLD), NOW()
            );
            RETURN OLD;
          ELSIF TG_OP = 'UPDATE' THEN
            INSERT INTO ${auditTableName} (
              tenant_id, user_name, operation, table_name,
              record_id, old_values, new_values, timestamp
            ) VALUES (
              '${tenant.id}', session_user, TG_OP, TG_TABLE_NAME,
              NEW.id::text, row_to_json(OLD), row_to_json(NEW), NOW()
            );
            RETURN NEW;
          ELSIF TG_OP = 'INSERT' THEN
            INSERT INTO ${auditTableName} (
              tenant_id, user_name, operation, table_name,
              record_id, new_values, timestamp
            ) VALUES (
              '${tenant.id}', session_user, TG_OP, TG_TABLE_NAME,
              NEW.id::text, row_to_json(NEW), NOW()
            );
            RETURN NEW;
          END IF;
        END;
        $$ LANGUAGE plpgsql;
      `);

    } catch (error) {
      this.logger.warn(`Failed to setup audit logging for tenant ${tenant.id}:`, error);
    }
  }

  private getDefaultSecurityConfig(plan: string): SecurityConfig {
    const configs: Record<string, SecurityConfig> = {
      free: {
        enforceSSL: false,
        maxLoginAttempts: 5,
        sessionTimeout: 3600, // 1 hour
        enableAuditLog: false,
        dataEncryption: false,
        backupEncryption: false,
        accessRestrictions: {
          allowedOperations: ['SELECT', 'INSERT', 'UPDATE', 'DELETE']
        }
      },
      pro: {
        enforceSSL: true,
        maxLoginAttempts: 10,
        sessionTimeout: 7200, // 2 hours
        enableAuditLog: true,
        dataEncryption: true,
        backupEncryption: true,
        accessRestrictions: {
          allowedOperations: ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP']
        }
      },
      enterprise: {
        enforceSSL: true,
        maxLoginAttempts: 20,
        sessionTimeout: 14400, // 4 hours
        enableAuditLog: true,
        dataEncryption: true,
        backupEncryption: true,
        accessRestrictions: {
          allowedOperations: ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER']
        }
      }
    };

    return configs[plan] || configs.free;
  }

  async validateAccess(tenantId: string, operation: string, clientIP?: string): Promise<boolean> {
    const client = await this.pgPool.connect();
    
    try {
      // Get tenant security configuration
      const tenantResult = await client.query('SELECT security_config FROM tenants WHERE id = $1', [tenantId]);
      const tenant = tenantResult.rows[0];
      
      if (!tenant) {
        return false;
      }

      const securityConfig: SecurityConfig = JSON.parse(tenant.security_config || '{}');

      // Check IP restrictions
      if (clientIP && securityConfig.allowedIPs && securityConfig.allowedIPs.length > 0) {
        if (!securityConfig.allowedIPs.includes(clientIP)) {
          this.logger.warn(`Access denied for tenant ${tenantId}: IP ${clientIP} not in allowed list`);
          return false;
        }
      }

      // Check operation restrictions
      if (securityConfig.accessRestrictions?.allowedOperations) {
        if (!securityConfig.accessRestrictions.allowedOperations.includes(operation.toUpperCase())) {
          this.logger.warn(`Access denied for tenant ${tenantId}: Operation ${operation} not allowed`);
          return false;
        }
      }

      return true;

    } catch (error) {
      this.logger.error(`Access validation failed for tenant ${tenantId}:`, error);
      return false;
    } finally {
      client.release();
    }
  }

  async rotateCredentials(tenantId: string): Promise<{ username: string; password: string }> {
    const client = await this.pgPool.connect();
    
    try {
      // Get tenant info
      const tenantResult = await client.query('SELECT * FROM tenants WHERE id = $1', [tenantId]);
      const tenant = tenantResult.rows[0];
      
      if (!tenant) {
        throw new Error(`Tenant ${tenantId} not found`);
      }

      const connectionInfo = JSON.parse(tenant.connection_info || '{}');
      const newPassword = crypto.randomBytes(32).toString('hex');

      // Update password
      await client.query(`ALTER ROLE ${connectionInfo.username} PASSWORD '${newPassword}'`);

      // Update stored connection info
      connectionInfo.password = newPassword;
      await client.query(`
        UPDATE tenants 
        SET connection_info = $1, updated_at = NOW()
        WHERE id = $2
      `, [JSON.stringify(connectionInfo), tenantId]);

      this.logger.info(`Credentials rotated for tenant ${tenantId}`);

      return {
        username: connectionInfo.username,
        password: newPassword
      };

    } catch (error) {
      this.logger.error(`Failed to rotate credentials for tenant ${tenantId}:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getSecurityMetrics(tenantId: string): Promise<any> {
    const client = await this.pgPool.connect();
    
    try {
      // Get basic security info
      const tenantResult = await client.query(`
        SELECT security_config, created_at, updated_at 
        FROM tenants 
        WHERE id = $1
      `, [tenantId]);

      if (!tenantResult.rows[0]) {
        return null;
      }

      const securityConfig = JSON.parse(tenantResult.rows[0].security_config || '{}');

      // Get audit log count (if enabled)
      let auditCount = 0;
      if (securityConfig.enableAuditLog) {
        try {
          const auditResult = await client.query(`
            SELECT COUNT(*) as count 
            FROM audit_log 
            WHERE tenant_id = $1
          `, [tenantId]);
          auditCount = parseInt(auditResult.rows[0].count);
        } catch (error) {
          // Audit table might not exist
        }
      }

      return {
        securityConfig,
        auditLogEntries: auditCount,
        lastCredentialRotation: tenantResult.rows[0].updated_at,
        createdAt: tenantResult.rows[0].created_at
      };

    } finally {
      client.release();
    }
  }
}