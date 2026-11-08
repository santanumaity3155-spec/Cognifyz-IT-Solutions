import { describe, it, expect, beforeEach } from 'vitest';
import { cacheService, CACHE_TTL } from '../services/cacheService.js';

describe('In-Memory TTL Cache Service Tests', () => {
  const USER_1 = 'user_alice_123';
  const USER_2 = 'user_bob_456';

  beforeEach(() => {
    cacheService.clear();
  });

  describe('1. Basic Cache Operations & Hits/Misses', () => {
    it('returns null on cache miss', () => {
      const result = cacheService.get('non_existent_key');
      expect(result).toBeNull();
    });

    it('stores and retrieves cached items with metadata (cache hit)', () => {
      const key = cacheService.profileKey(USER_1);
      const profileData = { login: 'alice', name: 'Alice Smith', publicRepos: 10 };

      cacheService.set(key, profileData, CACHE_TTL.PROFILE);

      const cached = cacheService.get(key);
      expect(cached).not.toBeNull();
      expect(cached.data).toEqual(profileData);
      expect(cached.cachedAt).toBeDefined();
      expect(new Date(cached.cachedAt).getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('bypasses cache when bypass option is set to true', () => {
      const key = cacheService.profileKey(USER_1);
      cacheService.set(key, { login: 'alice' }, CACHE_TTL.PROFILE);

      const bypassed = cacheService.get(key, { bypass: true });
      expect(bypassed).toBeNull();

      // Normal read still hits cache
      const normal = cacheService.get(key);
      expect(normal).not.toBeNull();
    });

    it('prevents cached data mutation through deep cloning', () => {
      const key = cacheService.profileKey(USER_1);
      const original = { login: 'alice', stats: { stars: 50 } };

      cacheService.set(key, original, CACHE_TTL.PROFILE);
      original.stats.stars = 999; // Mutate original

      const cached = cacheService.get(key);
      expect(cached.data.stats.stars).toBe(50); // Cache remains unmutated
    });
  });

  describe('2. TTL Expiration', () => {
    it('expires cached items when current time exceeds TTL', () => {
      const key = 'test_expiring_key';
      cacheService.set(key, { data: 'quick_expire' }, -100); // Already expired

      const result = cacheService.get(key);
      expect(result).toBeNull();
      expect(cacheService.size()).toBe(0); // Automatically cleaned up on access
    });
  });

  describe('3. Multi-Tenant User Isolation', () => {
    it('isolates cache keys between different users', () => {
      const key1 = cacheService.profileKey(USER_1);
      const key2 = cacheService.profileKey(USER_2);

      cacheService.set(key1, { user: 'Alice Profile' }, CACHE_TTL.PROFILE);
      cacheService.set(key2, { user: 'Bob Profile' }, CACHE_TTL.PROFILE);

      expect(cacheService.get(key1).data.user).toBe('Alice Profile');
      expect(cacheService.get(key2).data.user).toBe('Bob Profile');
    });

    it('isolates repository list keys for different users and query parameters', () => {
      const key1 = cacheService.repoListKey(USER_1, { page: 1, sort: 'updated' });
      const key2 = cacheService.repoListKey(USER_1, { page: 2, sort: 'updated' });
      const key3 = cacheService.repoListKey(USER_2, { page: 1, sort: 'updated' });

      cacheService.set(key1, ['repo-alice-p1'], CACHE_TTL.REPO_LIST);
      cacheService.set(key2, ['repo-alice-p2'], CACHE_TTL.REPO_LIST);
      cacheService.set(key3, ['repo-bob-p1'], CACHE_TTL.REPO_LIST);

      expect(cacheService.get(key1).data).toEqual(['repo-alice-p1']);
      expect(cacheService.get(key2).data).toEqual(['repo-alice-p2']);
      expect(cacheService.get(key3).data).toEqual(['repo-bob-p1']);
    });
  });

  describe('4. Invalidation on Account Disconnect', () => {
    it('invalidates all cache entries for the disconnected user only', () => {
      // Seed entries for Alice
      cacheService.set(cacheService.profileKey(USER_1), { user: 'Alice' }, CACHE_TTL.PROFILE);
      cacheService.set(cacheService.repoListKey(USER_1, { page: 1 }), ['repo1'], CACHE_TTL.REPO_LIST);
      cacheService.set(cacheService.repoDetailKey(USER_1, 'alice', 'my-repo'), { detail: 1 }, CACHE_TTL.REPO_DETAIL);
      cacheService.set(cacheService.languagesKey(USER_1, 'alice', 'my-repo'), { TS: 100 }, CACHE_TTL.LANGUAGES);

      // Seed entries for Bob
      cacheService.set(cacheService.profileKey(USER_2), { user: 'Bob' }, CACHE_TTL.PROFILE);
      cacheService.set(cacheService.repoListKey(USER_2, { page: 1 }), ['repo2'], CACHE_TTL.REPO_LIST);

      expect(cacheService.size()).toBe(6);

      // Invalidate Alice
      const purged = cacheService.invalidateUser(USER_1);
      expect(purged).toBe(4);

      // Verify Alice has zero cached entries
      expect(cacheService.get(cacheService.profileKey(USER_1))).toBeNull();
      expect(cacheService.get(cacheService.repoListKey(USER_1, { page: 1 }))).toBeNull();

      // Verify Bob's cache is 100% intact
      expect(cacheService.get(cacheService.profileKey(USER_2))).not.toBeNull();
      expect(cacheService.get(cacheService.repoListKey(USER_2, { page: 1 }))).not.toBeNull();
      expect(cacheService.size()).toBe(2);
    });
  });
});

