/**
 * GitHub API Response Normalization Utility.
 * Transforms raw GitHub REST API responses into clean, consistent, typed internal structures.
 * Sanitizes nulls, guarantees safe defaults, and prunes unused upstream payload bloat.
 */

/**
 * Normalize GitHub user profile response.
 * @param {Record<string, unknown>} raw
 * @returns {Record<string, unknown>}
 */
export const normalizeUserProfile = (raw = {}) => {
  if (!raw || typeof raw !== 'object') return null;

  return {
    id: Number(raw.id) || 0,
    login: String(raw.login || ''),
    name: raw.name ? String(raw.name) : String(raw.login || 'GitHub Developer'),
    avatarUrl: String(raw.avatar_url || ''),
    profileUrl: String(raw.html_url || ''),
    bio: raw.bio ? String(raw.bio) : null,
    company: raw.company ? String(raw.company) : null,
    location: raw.location ? String(raw.location) : null,
    blog: raw.blog ? String(raw.blog) : null,
    twitterUsername: raw.twitter_username ? String(raw.twitter_username) : null,
    publicRepos: Number(raw.public_repos) || 0,
    publicGists: Number(raw.public_gists) || 0,
    followers: Number(raw.followers) || 0,
    following: Number(raw.following) || 0,
    createdAt: raw.created_at ? new Date(raw.created_at).toISOString() : null,
    updatedAt: raw.updated_at ? new Date(raw.updated_at).toISOString() : null,
  };
};

/**
 * Normalize single GitHub repository item.
 * @param {Record<string, unknown>} raw
 * @returns {Record<string, unknown>}
 */
export const normalizeRepository = (raw = {}) => {
  if (!raw || typeof raw !== 'object') return null;

  return {
    id: Number(raw.id) || 0,
    name: String(raw.name || ''),
    fullName: String(raw.full_name || ''),
    description: raw.description ? String(raw.description) : null,
    htmlUrl: String(raw.html_url || ''),
    cloneUrl: String(raw.clone_url || ''),
    language: raw.language ? String(raw.language) : null,
    starsCount: Number(raw.stargazers_count) || 0,
    forksCount: Number(raw.forks_count) || 0,
    openIssuesCount: Number(raw.open_issues_count) || 0,
    watchersCount: Number(raw.watchers_count || raw.stargazers_count) || 0,
    isPrivate: Boolean(raw.private),
    isFork: Boolean(raw.fork),
    defaultBranch: String(raw.default_branch || 'main'),
    topics: Array.isArray(raw.topics) ? raw.topics.map(String) : [],
    license: raw.license
      ? {
          key: String(raw.license.key || ''),
          name: String(raw.license.name || ''),
          spdxId: String(raw.license.spdx_id || ''),
        }
      : null,
    createdAt: raw.created_at ? new Date(raw.created_at).toISOString() : null,
    updatedAt: raw.updated_at ? new Date(raw.updated_at).toISOString() : null,
    pushedAt: raw.pushed_at ? new Date(raw.pushed_at).toISOString() : null,
  };
};

/**
 * Normalize repository list.
 * @param {unknown} rawList
 * @returns {Array<Record<string, unknown>>}
 */
export const normalizeRepositoryList = (rawList = []) => {
  if (!Array.isArray(rawList)) return [];
  return rawList.map(normalizeRepository).filter(Boolean);
};

/**
 * Normalize language byte breakdown and calculate percentages.
 * @param {Record<string, number>} rawLanguages - e.g. { "TypeScript": 12000, "HTML": 3000 }
 * @returns {{ totalBytes: number, languages: Array<{ language: string, bytes: number, percentage: number }> }}
 */
export const normalizeLanguageStatistics = (rawLanguages = {}) => {
  if (!rawLanguages || typeof rawLanguages !== 'object') {
    return { totalBytes: 0, languages: [] };
  }

  const entries = Object.entries(rawLanguages).filter(
    ([, bytes]) => typeof bytes === 'number' && !isNaN(bytes) && bytes > 0
  );

  const totalBytes = entries.reduce((sum, [, bytes]) => sum + bytes, 0);

  if (totalBytes === 0) {
    return { totalBytes: 0, languages: [] };
  }

  const languages = entries
    .map(([language, bytes]) => {
      const percentage = Number(((bytes / totalBytes) * 100).toFixed(1));
      return {
        language,
        bytes,
        percentage,
      };
    })
    .sort((a, b) => b.bytes - a.bytes);

  return {
    totalBytes,
    languages,
  };
};

/**
 * Normalize rate limit information from headers or /rate_limit endpoint.
 * @param {Record<string, unknown>} [data={}]
 * @param {Record<string, unknown>} [headers={}]
 * @returns {{ limit: number, remaining: number, used: number, resetTime: number, resetDate: string, resetInSeconds: number }}
 */
export const normalizeRateLimit = (data = {}, headers = {}) => {
  const core = (data && data.resources && data.resources.core) || {};

  const limit = Number(headers['x-ratelimit-limit'] ?? core.limit ?? 5000);
  const remaining = Number(headers['x-ratelimit-remaining'] ?? core.remaining ?? 5000);
  const used = Number(headers['x-ratelimit-used'] ?? core.used ?? Math.max(0, limit - remaining));
  const resetTime = Number(headers['x-ratelimit-reset'] ?? core.reset ?? Math.floor(Date.now() / 1000) + 3600);

  const resetInSeconds = Math.max(0, resetTime - Math.floor(Date.now() / 1000));
  const resetDate = new Date(resetTime * 1000).toISOString();

  return {
    limit,
    remaining,
    used,
    resetTime,
    resetDate,
    resetInSeconds,
  };
};

export default {
  normalizeUserProfile,
  normalizeRepository,
  normalizeRepositoryList,
  normalizeLanguageStatistics,
  normalizeRateLimit,
};

