import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import axios from 'axios';
import { githubService, GitHubServiceError, getDecryptedTokenForUser } from '../services/githubService.js';
import authStore from '../services/authStore.js';
import { encrypt } from '../services/encryptionService.js';
import {
  normalizeUserProfile,
  normalizeRepository,
  normalizeLanguageStatistics,
  normalizeRateLimit,
} from '../utils/githubNormalizer.js';

vi.mock('axios');

describe('GitHub External API Service Test Suite', () => {
  let testUser;
  const RAW_TOKEN = 'gho_validMockedGitHubToken1234567890';

  beforeEach(async () => {
    vi.clearAllMocks();
    authStore.clearMemoryStoreForTesting();

    // Create a student user with an encrypted GitHub access token
    testUser = await authStore.createUser({
      name: 'Charlie Developer',
      email: 'charlie@forma.edu',
      password: 'Password123!',
      role: 'Student',
    });

    const encryptedToken = encrypt(RAW_TOKEN);
    await authStore.updateGitHubConnection(testUser.id, {
      githubId: '54321',
      username: 'charlie-dev',
      avatarUrl: 'https://avatars.githubusercontent.com/u/54321',
      profileUrl: 'https://github.com/charlie-dev',
      encryptedAccessToken: encryptedToken,
      scopes: ['read:user'],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Token Retrieval & Decryption', () => {
    it('retrieves and decrypts the GitHub access token successfully', async () => {
      const token = await getDecryptedTokenForUser(testUser.id);
      expect(token).toBe(RAW_TOKEN);
    });

    it('throws GITHUB_NOT_CONNECTED when student has not linked GitHub', async () => {
      const unlinkedUser = await authStore.createUser({
        name: 'Unlinked Student',
        email: 'unlinked@forma.edu',
        password: 'Password123!',
      });

      await expect(getDecryptedTokenForUser(unlinkedUser.id)).rejects.toThrowError(
        /GitHub account is not connected/i
      );
    });

    it('throws MISSING_USER_ID if user ID is undefined or empty', async () => {
      await expect(getDecryptedTokenForUser(null)).rejects.toThrowError(/User ID is required/i);
    });
  });

  describe('2. User Profile Retrieval', () => {
    it('retrieves and normalizes authenticated GitHub user profile', async () => {
      axios.mockResolvedValueOnce({
        status: 200,
        headers: {
          'x-ratelimit-limit': '5000',
          'x-ratelimit-remaining': '4980',
          'x-ratelimit-reset': '1700000000',
        },
        data: {
          id: 54321,
          login: 'charlie-dev',
          name: 'Charlie Developer',
          avatar_url: 'https://avatars.githubusercontent.com/u/54321',
          html_url: 'https://github.com/charlie-dev',
          bio: 'Full Stack Engineer & Student',
          public_repos: 18,
          followers: 42,
          following: 10,
          created_at: '2023-01-15T00:00:00Z',
        },
      });

      const result = await githubService.getUserProfile(testUser.id);

      expect(result.profile.login).toBe('charlie-dev');
      expect(result.profile.name).toBe('Charlie Developer');
      expect(result.profile.publicRepos).toBe(18);
      expect(result.profile.followers).toBe(42);
      expect(result.rateLimit.remaining).toBe(4980);

      // Verify Authorization header had decrypted token
      expect(axios).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${RAW_TOKEN}`,
          }),
        })
      );
    });
  });

  describe('3. Repository Retrieval & Pagination', () => {
    it('retrieves user repositories with sorting and pagination parameters', async () => {
      axios.mockResolvedValueOnce({
        status: 200,
        headers: {
          'x-ratelimit-limit': '5000',
          'x-ratelimit-remaining': '4979',
          link: '<https://api.github.com/user/repos?page=2>; rel="next"',
        },
        data: [
          {
            id: 101,
            name: 'forma-app',
            full_name: 'charlie-dev/forma-app',
            description: 'Student Intelligence Platform',
            html_url: 'https://github.com/charlie-dev/forma-app',
            language: 'TypeScript',
            stargazers_count: 25,
            forks_count: 4,
            open_issues_count: 2,
            private: false,
          },
        ],
      });

      const result = await githubService.getUserRepositories(testUser.id, {
        page: 1,
        perPage: 10,
        sort: 'updated',
      });

      expect(result.repositories.length).toBe(1);
      expect(result.repositories[0].name).toBe('forma-app');
      expect(result.repositories[0].language).toBe('TypeScript');
      expect(result.repositories[0].starsCount).toBe(25);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.hasNextPage).toBe(true);
    });

    it('handles empty repository list cleanly', async () => {
      axios.mockResolvedValueOnce({
        status: 200,
        headers: {},
        data: [],
      });

      const result = await githubService.getUserRepositories(testUser.id);
      expect(result.repositories).toEqual([]);
      expect(result.pagination.hasNextPage).toBe(false);
    });
  });

  describe('4. Repository Details & Language Statistics', () => {
    it('retrieves single repository details', async () => {
      axios.mockResolvedValueOnce({
        status: 200,
        headers: {},
        data: {
          id: 101,
          name: 'forma-app',
          full_name: 'charlie-dev/forma-app',
          language: 'TypeScript',
          stargazers_count: 15,
          default_branch: 'main',
          topics: ['react', 'node', 'oauth'],
        },
      });

      const result = await githubService.getRepositoryDetails(testUser.id, 'charlie-dev', 'forma-app');
      expect(result.repository.name).toBe('forma-app');
      expect(result.repository.topics).toEqual(['react', 'node', 'oauth']);
      expect(result.repository.defaultBranch).toBe('main');
    });

    it('calculates accurate language percentages from raw byte data', async () => {
      axios.mockResolvedValueOnce({
        status: 200,
        headers: {},
        data: {
          TypeScript: 75000,
          HTML: 15000,
          CSS: 10000,
        },
      });

      const result = await githubService.getRepositoryLanguages(testUser.id, 'charlie-dev', 'forma-app');

      expect(result.totalBytes).toBe(100000);
      expect(result.languages).toHaveLength(3);

      expect(result.languages[0]).toEqual({
        language: 'TypeScript',
        bytes: 75000,
        percentage: 75,
      });

      expect(result.languages[1]).toEqual({
        language: 'HTML',
        bytes: 15000,
        percentage: 15,
      });

      expect(result.languages[2]).toEqual({
        language: 'CSS',
        bytes: 10000,
        percentage: 10,
      });
    });

    it('handles repositories with no language data without division-by-zero error', async () => {
      axios.mockResolvedValueOnce({
        status: 200,
        headers: {},
        data: {},
      });

      const result = await githubService.getRepositoryLanguages(testUser.id, 'charlie-dev', 'empty-repo');
      expect(result.totalBytes).toBe(0);
      expect(result.languages).toEqual([]);
    });
  });

  describe('5. Error Handling, Retries & Resilience', () => {
    it('throws GITHUB_TOKEN_REVOKED on HTTP 401 response without retrying', async () => {
      axios.mockRejectedValueOnce({
        response: {
          status: 401,
          data: { message: 'Bad credentials' },
          headers: {},
        },
      });

      await expect(githubService.getUserProfile(testUser.id)).rejects.toMatchObject({
        code: 'GITHUB_TOKEN_REVOKED',
        status: 401,
      });

      // Crucial: Must NOT retry 401 errors
      expect(axios).toHaveBeenCalledTimes(1);
    });

    it('throws GITHUB_RATE_LIMIT_EXCEEDED when x-ratelimit-remaining is 0', async () => {
      axios.mockRejectedValueOnce({
        response: {
          status: 403,
          headers: {
            'x-ratelimit-remaining': '0',
            'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 120),
          },
          data: { message: 'API rate limit exceeded' },
        },
      });

      await expect(githubService.getUserProfile(testUser.id)).rejects.toMatchObject({
        code: 'GITHUB_RATE_LIMIT_EXCEEDED',
        status: 429,
      });

      expect(axios).toHaveBeenCalledTimes(1);
    });

    it('retries transient HTTP 502/503/504 errors and succeeds on subsequent attempt', async () => {
      // 1st attempt: 502 Bad Gateway
      axios.mockRejectedValueOnce({
        response: {
          status: 502,
          data: { message: 'Bad Gateway' },
          headers: {},
        },
      });

      // 2nd attempt: Success
      axios.mockResolvedValueOnce({
        status: 200,
        headers: {},
        data: { id: 101, name: 'recovered-repo' },
      });

      const result = await githubService.getRepositoryDetails(testUser.id, 'charlie-dev', 'recovered-repo');

      expect(result.repository.name).toBe('recovered-repo');
      expect(axios).toHaveBeenCalledTimes(2); // 1 retry executed
    });

    it('exhausts maximum retries and throws GITHUB_UPSTREAM_UNAVAILABLE on persistent 503', async () => {
      const error503 = {
        response: {
          status: 503,
          data: { message: 'Service Unavailable' },
          headers: {},
        },
      };

      // Fails initial attempt + 2 retries = 3 attempts total
      axios
        .mockRejectedValueOnce(error503)
        .mockRejectedValueOnce(error503)
        .mockRejectedValueOnce(error503);

      await expect(
        githubService.getRepositoryDetails(testUser.id, 'charlie-dev', 'test-repo')
      ).rejects.toMatchObject({
        code: 'GITHUB_UPSTREAM_UNAVAILABLE',
        status: 503,
      });

      expect(axios).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
    });

    it('retries network timeouts (ECONNABORTED) and throws GITHUB_NETWORK_TIMEOUT after retries', async () => {
      const timeoutError = {
        code: 'ECONNABORTED',
        message: 'timeout of 8000ms exceeded',
      };

      axios
        .mockRejectedValueOnce(timeoutError)
        .mockRejectedValueOnce(timeoutError)
        .mockRejectedValueOnce(timeoutError);

      await expect(
        githubService.getRepositoryDetails(testUser.id, 'charlie-dev', 'timeout-repo')
      ).rejects.toMatchObject({
        code: 'GITHUB_NETWORK_TIMEOUT',
        status: 504,
      });

      expect(axios).toHaveBeenCalledTimes(3);
    });
  });

  describe('6. Rate Limit Quota Probe', () => {
    it('retrieves rate limit statistics from GitHub /rate_limit endpoint', async () => {
      axios.mockResolvedValueOnce({
        status: 200,
        headers: {},
        data: {
          resources: {
            core: {
              limit: 5000,
              remaining: 4890,
              used: 110,
              reset: Math.floor(Date.now() / 1000) + 1800,
            },
          },
        },
      });

      const quota = await githubService.getRateLimit(testUser.id);
      expect(quota.limit).toBe(5000);
      expect(quota.remaining).toBe(4890);
      expect(quota.used).toBe(110);
      expect(quota.resetInSeconds).toBeGreaterThan(0);
    });
  });
});

