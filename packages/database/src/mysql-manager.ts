// packages/database/src/mysql-manager.ts
import type { Pool } from 'mysql2/promise';

export interface MySQLConfig { databaseName: string; replication?: boolean; }

export class MySQLDatabaseManager {
  constructor(private adminPool: Pool) {}

  async createMySQLDatabase(tenantId: string, config: MySQLConfig) {
    const dbName = `${tenantId}_${config.databaseName}`.replace(/[^a-zA-Z0-9_]/g, '_');
    await this.adminPool.query(`CREATE DATABASE \`${dbName}\``);
    return { database: dbName, status: 'active' };
  }

  async setupMySQLReplication() {
    // TODO: configure group replication
  }
}
