import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { CacheService } from '../src/cache/cacheService.js';
import { initRedis, disconnectRedis } from '../src/config/redis.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Server-Side Caching & Optimization', () => {
  beforeAll(async () => {
    await initRedis();
  });

  afterAll(async () => {
    await disconnectRedis();
  });

  beforeEach(async () => {
    CacheService.resetStats();
    await CacheService.flush();
  });

  it('sets and gets cache items correctly', async () => {
    await CacheService.set('test_key', { message: 'hello world' }, 10);
    const item = await CacheService.get('test_key');
    expect(item).not.toBeNull();
    expect(item.value).toEqual({ message: 'hello world' });
  });

  it('accurately tracks hits and misses', async () => {
    // 1st read: miss
    const missed = await CacheService.get('unseen_key');
    expect(missed).toBeNull();

    // Write and 2nd read: hit
    await CacheService.set('seen_key', 'val', 10);
    const hit = await CacheService.get('seen_key');
    expect(hit.value).toBe('val');

    const stats = await CacheService.getStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
    expect(stats.totalReads).toBe(2);
    expect(stats.hitRatio).toBe('50.0%');
  });

  it('invalidates cache keys by pattern', async () => {
    await CacheService.set('user:1:profile', { name: 'Alice' }, 60);
    await CacheService.set('user:2:profile', { name: 'Bob' }, 60);
    await CacheService.set('order:100', { total: 45 }, 60);

    const deleted = await CacheService.delPattern('user:*');
    expect(deleted).toBeGreaterThanOrEqual(2);

    const check1 = await CacheService.get('user:1:profile');
    const checkOrder = await CacheService.get('order:100');
    expect(check1).toBeNull();
    expect(checkOrder).not.toBeNull();
  });

  it('cacheResponse middleware emits X-Cache: MISS on first request and HIT on subsequent request', async () => {
    // 1st request -> MISS
    const res1 = await request(app).get('/api/cache/demo/stats');
    expect(res1.status).toBe(200);
    expect(res1.headers['x-cache']).toBe('MISS');

    // 2nd request -> HIT
    const res2 = await request(app).get('/api/cache/demo/stats');
    expect(res2.status).toBe(200);
    expect(res2.headers['x-cache']).toBe('HIT');
    expect(res2.headers['x-cache-ttl']).toBeDefined();
  });

  it('bypasses cache when X-Cache-Bypass: true is provided', async () => {
    // Prime the cache
    await request(app).get('/api/cache/demo/stats');

    // Send request with bypass header
    const res = await request(app)
      .get('/api/cache/demo/stats')
      .set('X-Cache-Bypass', 'true');

    expect(res.status).toBe(200);
    expect(res.headers['x-cache']).toBe('BYPASS');
  });

  it('expires cache key automatically after TTL elapses', async () => {
    await CacheService.set('ttl_key', { temporary: true }, 1);
    const immediate = await CacheService.get('ttl_key');
    expect(immediate).not.toBeNull();
    expect(immediate.value).toEqual({ temporary: true });

    // Wait 1.1s for TTL expiration
    await sleep(1100);

    const expired = await CacheService.get('ttl_key');
    expect(expired).toBeNull();
  });

  it('supports explicit key invalidation via DELETE /api/cache/key/:key', async () => {
    await CacheService.set('to_be_deleted', { value: 123 }, 60);
    const beforeDel = await CacheService.get('to_be_deleted');
    expect(beforeDel).not.toBeNull();

    const delRes = await request(app).delete('/api/cache/key/to_be_deleted');
    expect(delRes.status).toBe(200);
    expect(delRes.body.success).toBe(true);

    const afterDel = await CacheService.get('to_be_deleted');
    expect(afterDel).toBeNull();
  });

  it('runs live performance comparison benchmark endpoint successfully', async () => {
    const res = await request(app).post('/api/cache/benchmark');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.measurements).toHaveProperty('uncachedMs');
    expect(res.body.data.measurements).toHaveProperty('avgCacheHitMs');
    expect(res.body.data.comparison).toHaveProperty('speedupMultiplier');
  });
});

