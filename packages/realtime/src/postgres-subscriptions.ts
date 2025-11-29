// packages/realtime/src/postgres-subscriptions.ts
import { Client, Pool } from 'pg';
import { PassThrough } from 'stream';
// Lightweight pgoutput decoder (topic-level scaffold)
import { PgoutputDecoder } from './pgoutput-decoder';
import type { WebSocket } from 'ws';
import Redis from 'ioredis';

type SubscriptionEntry = { socket: WebSocket; filter: any };

export class PostgresSubscriptionEngine {
  private pgPool?: Pool;
  private redis?: Redis;
  private wsConnections: Map<string, SubscriptionEntry[]> = new Map();

  async initializeRealtime(pgPool: Pool, redis: Redis) {
    this.pgPool = pgPool;
    this.redis = redis;
    if (process.env.REALTIME_DISABLE_REPLICATION !== '1') {
      await this.setupLogicalReplication();
    }
  }

  async createSubscription(tenantId: string, table: string, filter: any, client: WebSocket) {
    const key = `${tenantId}:${table}`;
    const list = this.wsConnections.get(key) || [];
    list.push({ socket: client, filter });
    this.wsConnections.set(key, list);
    try { await this.redis?.hset(`subscription:${key}`, Date.now().toString(), JSON.stringify({ filter })); } catch {}
    return key;
  }

  async unsubscribe(tenantId: string, table: string, client: WebSocket) {
    const key = `${tenantId}:${table}`;
    const list = this.wsConnections.get(key) || [];
    const filtered = list.filter(entry => entry.socket !== client);
    if (filtered.length === 0) this.wsConnections.delete(key); else this.wsConnections.set(key, filtered);
    return key;
  }

  listSubscriptions() {
    const summary: { key: string; count: number }[] = [];
    for (const [key, entries] of this.wsConnections.entries()) {
      summary.push({ key, count: entries.length });
    }
    return summary;
  }

  async broadcastMockEvent(tenantId: string, table: string, op: 'INSERT'|'UPDATE'|'DELETE', row: any) {
    await this.notifySubscribers(tenantId, table, op, row);
    try { await this.redis?.publish(`wal:${tenantId}:${table}`, JSON.stringify({ op, row })); } catch {}
  }

  private async setupLogicalReplication() {
    // Establish a raw client for replication commands
    if (!this.pgPool) return;
    const client = new Client((this.pgPool as any).options || (this.pgPool as any));
    await client.connect();
    // Ensure wal_level = logical and create slot if missing
    try {
      await client.query(`SELECT 1`);
      await client.query(`SELECT pg_create_logical_replication_slot('platform_realtime', 'pgoutput')`);
    } catch (_) {
      // slot may already exist; continue
    }
    // Start logical replication stream using copy protocol (scaffold)
    try {
      const queryText = `START_REPLICATION SLOT platform_realtime LOGICAL 0/0`;
      // NOTE: The pg module doesn't provide a direct logical replication stream API.
      // In production, use a driver that supports replication protocol or a custom COPY handler.
      const decoder = new PgoutputDecoder();
      const stream = new PassThrough();
      stream.on('data', async (buf: Buffer) => {
        try {
          const events = decoder.decode(buf);
          for (const ev of events) {
            const { schema, table, op, row } = ev as any;
            const tenantId = (row?.tenant_id) || 'unknown';
            await this.notifySubscribers(tenantId, `${schema}.${table}`, op, row);
            try { await this.redis?.publish(`wal:${tenantId}:${schema}.${table}`, JSON.stringify({ op, row })); } catch {}
          }
        } catch (e) {
          // swallow decode errors; log in future
        }
      });
      // Attach stream to client: placeholder until full replication copy is wired
      // stream.write(await client.query(queryText)); // pseudo
    } catch (_) {
      // continue
    }
    await client.end();
  }

  private async notifySubscribers(tenantId: string, table: string, op: 'INSERT'|'UPDATE'|'DELETE', data: any) {
    const key = `${tenantId}:${table}`;
    const entries = this.wsConnections.get(key) || [];
    for (const { socket, filter } of entries) {
      if (this.matchesFilter(filter, data)) {
        try { socket.send(JSON.stringify({ op, data })); } catch { /* noop */ }
      }
    }
  }

  private matchesFilter(filter: any, row: any): boolean {
    if (!filter || typeof filter !== 'object') return true;
    for (const k of Object.keys(filter)) {
      if (row == null || row[k] !== filter[k]) return false;
    }
    return true;
  }
}
