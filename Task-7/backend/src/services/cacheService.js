/**
 * In-Memory TTL Cache Service for Forma Developer Intelligence Platform.
 * Provides per-user caching with strict tenant isolation, configurable TTLs,
 * manual refresh bypass, and complete user cache invalidation on account disconnect.
 */

export const CACHE_TTL = Object.freeze({
  PROFILE: 10 * 60 * 1000, // 10 minutes
  REPO_LIST: 5 * 60 * 1000, // 5 minutes
  REPO_DETAIL: 5 * 60 * 1000, // 5 minutes
  LANGUAGES: 15 * 60 * 1000, // 15 minutes
});

class CacheService {
  constructor() {
    this.store = new Map();
  }

  /**
   * Generate isolated cache key for user profile
   * @param {string} userId
   * @returns {string}
   */
  profileKey(userId) {
    return `profile:${String(userId)}`;
  }

  /**
   * Generate isolated cache key for user repository listings
   * @param {string} userId
   * @param {Record<string, unknown>} [params={}]
   * @returns {string}
   */
  repoListKey(userId, params = {}) {
    const serializedParams = Object.keys(params)
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join('&');
    return `repos:${String(userId)}:${serializedParams || 'default'}`;
  }

  /**
   * Generate isolated cache key for single repository details
   * @param {string} userId
   * @param {string} owner
   * @param {string} repo
   * @returns {string}
   */
  repoDetailKey(userId, owner, repo) {
    return `repo_detail:${String(userId)}:${String(owner).toLowerCase()}:${String(repo).toLowerCase()}`;
  }

  /**
   * Generate isolated cache key for repository language breakdown
   * @param {string} userId
   * @param {string} owner
   * @param {string} repo
   * @returns {string}
   */
  languagesKey(userId, owner, repo) {
    return `languages:${String(userId)}:${String(owner).toLowerCase()}:${String(repo).toLowerCase()}`;
  }

  /**
   * Retrieve item from cache if not expired.
   * If bypass is true, returns null immediately to force upstream fetch.
   *
   * @param {string} key - Cache key
   * @param {{ bypass?: boolean }} [options={}]
   * @returns {{ data: any, cachedAt: string } | null}
   */
  get(key, options = {}) {
    if (options.bypass) {
      return null;
    }

    const item = this.store.get(key);
    if (!item) {
      return null;
    }

    // Check TTL expiration
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return {
      data: item.data,
      cachedAt: item.cachedAt,
    };
  }

  /**
   * Set item in cache with specific TTL.
   * Deep-clones data or guarantees safe storage.
   *
   * @param {string} key - Cache key
   * @param {unknown} data - Payload to cache
   * @param {number} ttlMs - TTL in milliseconds
   */
  set(key, data, ttlMs) {
    if (!key || data === undefined || data === null) return;

    this.store.set(key, {
      data: JSON.parse(JSON.stringify(data)), // Clone to prevent mutation
      cachedAt: new Date().toISOString(),
      expiresAt: Date.now() + ttlMs,
    });
  }

  /**
   * Invalidate all cache entries associated with a specific user.
   * Called during GitHub account disconnect.
   *
   * @param {string} userId - User ID whose cache entries must be purged
   * @returns {number} Count of invalidated keys
   */
  invalidateUser(userId) {
    if (!userId) return 0;
    const targetPattern = `:${String(userId)}:`;
    const profilePattern = `profile:${String(userId)}`;

    let count = 0;
    for (const key of this.store.keys()) {
      if (key === profilePattern || key.includes(targetPattern)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Clear entire cache (for tests).
   */
  clear() {
    this.store.clear();
  }

  /**
   * Current size of cache.
   */
  size() {
    return this.store.size;
  }
}

export const cacheService = new CacheService();
export default cacheService;

