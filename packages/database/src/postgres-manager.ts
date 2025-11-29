// packages/database/src/postgres-manager.ts
import type { Pool } from 'pg';

export class PostgresDatabaseManager {
  constructor(private adminPool: Pool) {}

  async createTenantDatabase(tenantId: string, databaseName: string) {
    const dbName = this.sanitizeName(`${tenantId}_${databaseName}`);
    await this.adminPool.query(`CREATE DATABASE ${dbName}`);
    return { databaseName: dbName, status: 'active' };
  }

  async executeQuery(pool: Pool, query: string, params: any[] = []) {
    const result = await pool.query(query, params);
    return { data: result.rows, rowCount: result.rowCount };
  }

  sanitizeName(name: string) {
    return name.replace(/[^a-zA-Z0-9_]/g, '_');
  }
}
