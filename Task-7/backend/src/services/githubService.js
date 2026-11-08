import axios from 'axios';
import { githubConfig } from '../config/githubConfig.js';
import authStore from './authStore.js';
import { decrypt } from './encryptionService.js';
import { logger } from '../utils/logger.js';
import {
  normalizeUserProfile,
  normalizeRepository,
  normalizeRepositoryList,
  normalizeLanguageStatistics,
  normalizeRateLimit,
} from '../utils/githubNormalizer.js';

/**
 * Custom error class for standardized GitHub API errors.
 */
export class GitHubServiceError extends Error {
  constructor(message, code, status = 500, details = null) {
    super(message);
    this.name = 'GitHubServiceError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/**
 * Retrieve and decrypt the GitHub access token for a given authenticated student.
 * Guarantees zero leakage: token is only used within backend service execution.
 * @param {string} userId
 * @returns {Promise<string>} Plaintext GitHub access token
 */
export const getDecryptedTokenForUser = async (userId) => {
  if (!userId) {
    throw new GitHubServiceError('User ID is required to access GitHub resources.', 'MISSING_USER_ID', 400);
  }

  const user = await authStore.findById(userId);

  if (!user) {
    throw new GitHubServiceError('Student user account not found.', 'USER_NOT_FOUND', 404);
  }

  const github = user.github || {};

  if (!github.connected || !github.encryptedAccessToken) {
    throw new GitHubServiceError(
      'GitHub account is not connected. Please connect your GitHub account via /api/github/connect.',
      'GITHUB_NOT_CONNECTED',
      400
    );
  }

  try {
    const plaintextToken = decrypt(github.encryptedAccessToken);
    return plaintextToken;
  } catch (err) {
    logger.error(`[GITHUB SERVICE] Failed to decrypt token for user ${userId}: ${err.message}`);
    throw new GitHubServiceError(
      'Stored GitHub credentials cannot be decrypted. Please reconnect your account.',
      'TOKEN_DECRYPTION_FAILED',
      500
    );
  }
};

/**
 * Sleep utility for exponential backoff.
 * @param {number} ms
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Execute an external GitHub REST API request with controlled retry logic.
 * Retries transient 502/503/504 and network timeouts up to 2 times with exponential backoff and jitter.
 * Never retries non-idempotent mutations or 4xx client errors.
 *
 * @param {import('axios').AxiosRequestConfig} requestConfig
 * @param {number} [maxRetries=2]
 * @returns {Promise<{ data: any, headers: any, rateLimit: ReturnType<typeof normalizeRateLimit> }>}
 */
export const requestWithRetry = async (requestConfig, maxRetries = 2) => {
  const mergedHeaders = {
    ...githubConfig.defaultHeaders,
    ...(requestConfig.headers || {}),
  };

  const finalConfig = {
    timeout: githubConfig.timeoutMs,
    ...requestConfig,
    headers: mergedHeaders,
  };

  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      const response = await axios(finalConfig);
      const rateLimit = normalizeRateLimit(response.data, response.headers);

      return {
        data: response.data,
        headers: response.headers,
        rateLimit,
      };
    } catch (err) {
      const isLastAttempt = attempt >= maxRetries;
      const status = err.response?.status;
      const headers = err.response?.headers || {};
      const rateLimit = normalizeRateLimit(err.response?.data, headers);

      // Handle 401: Token revoked or invalid
      if (status === 401) {
        throw new GitHubServiceError(
          'GitHub access token is invalid or has been revoked. Please reconnect your account.',
          'GITHUB_TOKEN_REVOKED',
          401,
          { rateLimit }
        );
      }

      // Handle 403 / 429: Rate Limit Exceeded
      if ((status === 403 || status === 429) && String(headers['x-ratelimit-remaining']) === '0') {
        throw new GitHubServiceError(
          `GitHub API rate limit exceeded. Quota resets in ${rateLimit.resetInSeconds} seconds (${rateLimit.resetDate}).`,
          'GITHUB_RATE_LIMIT_EXCEEDED',
          429,
          { rateLimit }
        );
      }

      // Handle 404: Resource Not Found
      if (status === 404) {
        throw new GitHubServiceError(
          'Requested GitHub resource was not found.',
          'GITHUB_RESOURCE_NOT_FOUND',
          404,
          { rateLimit }
        );
      }

      // Determine if error is transient and retryable (502, 503, 504, or network timeout)
      const isTransientHttp = status === 502 || status === 503 || status === 504;
      const isNetworkTimeout =
        !err.response && (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT' || err.code === 'ECONNRESET');

      if ((isTransientHttp || isNetworkTimeout) && !isLastAttempt) {
        attempt++;
        // Calculate exponential backoff with jitter
        let backoffMs = Math.pow(2, attempt) * 300 + Math.floor(Math.random() * 100);

        // Respect Retry-After header if provided by GitHub
        if (headers['retry-after']) {
          const retryAfterSec = parseInt(headers['retry-after'], 10);
          if (!isNaN(retryAfterSec) && retryAfterSec > 0 && retryAfterSec <= 5) {
            backoffMs = retryAfterSec * 1000;
          }
        }

        logger.warn(
          `[GITHUB SERVICE] Transient failure (${status || err.code}). Retrying in ${backoffMs}ms (Attempt ${attempt}/${maxRetries})...`
        );
        await sleep(backoffMs);
        continue;
      }

      // Exhausted retries or non-retryable error
      if (isTransientHttp) {
        throw new GitHubServiceError(
          'GitHub upstream service is temporarily unavailable after multiple retries.',
          'GITHUB_UPSTREAM_UNAVAILABLE',
          503,
          { rateLimit, statusCode: status }
        );
      }

      if (isNetworkTimeout) {
        throw new GitHubServiceError(
          'GitHub API connection timed out. Please check network connectivity.',
          'GITHUB_NETWORK_TIMEOUT',
          504,
          { rateLimit }
        );
      }

      // Generic GitHub error
      const message = err.response?.data?.message || err.message || 'GitHub API communication error.';
      throw new GitHubServiceError(message, 'GITHUB_API_ERROR', status || 500, {
        rateLimit,
        details: err.response?.data,
      });
    }
  }
};

/**
 * Centralized GitHub REST API Service.
 */
export const githubService = {
  /**
   * Retrieve authenticated student's GitHub user profile.
   * @param {string} userId
   * @returns {Promise<{ profile: ReturnType<typeof normalizeUserProfile>, rateLimit: ReturnType<typeof normalizeRateLimit> }>}
   */
  async getUserProfile(userId) {
    const token = await getDecryptedTokenForUser(userId);

    const { data, rateLimit } = await requestWithRetry({
      method: 'GET',
      url: `${githubConfig.apiBaseUrl}/user`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return {
      profile: normalizeUserProfile(data),
      rateLimit,
    };
  },

  /**
   * Retrieve authenticated student's repositories with pagination and sorting.
   * @param {string} userId
   * @param {{ page?: number, perPage?: number, sort?: 'updated' | 'created' | 'pushed' | 'full_name', direction?: 'asc' | 'desc', type?: 'all' | 'owner' | 'public' | 'member' }} [options={}]
   * @returns {Promise<{ repositories: Array<ReturnType<typeof normalizeRepository>>, pagination: { page: number, perPage: number, hasNextPage: boolean }, rateLimit: ReturnType<typeof normalizeRateLimit> }>}
   */
  async getUserRepositories(userId, options = {}) {
    const token = await getDecryptedTokenForUser(userId);

    const page = Math.max(1, parseInt(String(options.page || 1), 10));
    const perPage = Math.min(100, Math.max(1, parseInt(String(options.perPage || 30), 10)));
    const sort = options.sort || 'updated';
    const direction = options.direction || 'desc';
    const type = options.type || 'owner';

    const { data, headers, rateLimit } = await requestWithRetry({
      method: 'GET',
      url: `${githubConfig.apiBaseUrl}/user/repos`,
      params: {
        page,
        per_page: perPage,
        sort,
        direction,
        type,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const repositories = normalizeRepositoryList(data);

    // Determine if there is a next page from GitHub's Link header or returned items length
    const linkHeader = headers['link'] || '';
    const hasNextPage = linkHeader.includes('rel="next"') || repositories.length === perPage;

    return {
      repositories,
      pagination: {
        page,
        perPage,
        hasNextPage,
      },
      rateLimit,
    };
  },

  /**
   * Retrieve individual repository details.
   * @param {string} userId
   * @param {string} owner - Repository owner login (e.g. 'octocat')
   * @param {string} repo - Repository name (e.g. 'Hello-World')
   * @returns {Promise<{ repository: ReturnType<typeof normalizeRepository>, rateLimit: ReturnType<typeof normalizeRateLimit> }>}
   */
  async getRepositoryDetails(userId, owner, repo) {
    if (!owner || !repo) {
      throw new GitHubServiceError('Repository owner and name are required parameters.', 'MISSING_PARAMS', 400);
    }

    const token = await getDecryptedTokenForUser(userId);

    const { data, rateLimit } = await requestWithRetry({
      method: 'GET',
      url: `${githubConfig.apiBaseUrl}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return {
      repository: normalizeRepository(data),
      rateLimit,
    };
  },

  /**
   * Retrieve repository language breakdown and calculate percentage statistics.
   * @param {string} userId
   * @param {string} owner
   * @param {string} repo
   * @returns {Promise<{ totalBytes: number, languages: Array<{ language: string, bytes: number, percentage: number }>, rateLimit: ReturnType<typeof normalizeRateLimit> }>}
   */
  async getRepositoryLanguages(userId, owner, repo) {
    if (!owner || !repo) {
      throw new GitHubServiceError('Repository owner and name are required parameters.', 'MISSING_PARAMS', 400);
    }

    const token = await getDecryptedTokenForUser(userId);

    const { data, rateLimit } = await requestWithRetry({
      method: 'GET',
      url: `${githubConfig.apiBaseUrl}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/languages`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const languageStats = normalizeLanguageStatistics(data);

    return {
      totalBytes: languageStats.totalBytes,
      languages: languageStats.languages,
      rateLimit,
    };
  },

  /**
   * Retrieve GitHub rate limit quota status.
   * @param {string | null} [userId=null] - If provided, uses authenticated token (5000 requests/hr quota)
   * @returns {Promise<ReturnType<typeof normalizeRateLimit>>}
   */
  async getRateLimit(userId = null) {
    let headers = {};

    if (userId) {
      try {
        const token = await getDecryptedTokenForUser(userId);
        headers.Authorization = `Bearer ${token}`;
      } catch {
        // Fall back to unauthenticated rate limit probe if user token cannot be fetched
      }
    }

    const { data, headers: resHeaders } = await requestWithRetry({
      method: 'GET',
      url: `${githubConfig.apiBaseUrl}/rate_limit`,
      headers,
    });

    return normalizeRateLimit(data, resHeaders);
  },
};

export default githubService;

