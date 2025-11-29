import { PostgresSubscriptionEngine } from '../src/postgres-subscriptions';

// Minimal mocks for Pool, Redis, and WebSocket
class MockPool { options = {}; }
class MockRedis {
  async hset() { return 1; }
  async publish(_channel: string, _message: string) { return 1; }
}
class MockWS {
  send(_data: string) {}
}

async function main() {
  const engine = new PostgresSubscriptionEngine();
  // Initialize with mocks (no real connections)
  await engine.initializeRealtime((new MockPool() as any), (new MockRedis() as any));
  const ws = new MockWS() as any;
  const key = await engine.createSubscription('tenant_demo', 'public.test_table', {}, ws);
  console.log('Smoke subscription key:', key);
}

main().catch((e) => {
  console.error('Realtime smoke test failed:', e);
  process.exit(1);
});
