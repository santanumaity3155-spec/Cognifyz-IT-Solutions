import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../server.js';
import authStore from '../services/authStore.js';
import { generateToken, AUTH_COOKIE_NAME } from '../utils/tokenUtils.js';
import { githubService, GitHubServiceError } from '../services/githubService.js';
import { cacheService } from '../services/cacheService.js';

vi.mock('../services/githubService.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    githubService: {
      getUserProfile: vi.fn(),
      getUserRepositories: vi.fn(),
      getRepositoryDetails: vi.fn(),
      getRepositoryLanguages: vi.fn(),
      getRateLimit: vi.fn(),
    },
  };
});

describe('Phase 6: GitHub API Routes & Controllers Integration Tests', () => {
  let linkedUser;
  let unlinkedUser;
  let linkedAuthToken;
  let unlinkedAuthToken;

  const mockRateLimit = {
    limit: 5000,
    remaining: 4995,
    used: 5,
    resetTime: Math.floor(Date.now() / 1000) + 3600,
    resetDate: new Date(Date.now() + 3600000).toISOString(),
    resetInSeconds: 3600,
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    authStore.clearMemoryStoreForTesting();
    cacheService.clear();

    // 1. Linked user with connected GitHub account
    linkedUser = await authStore.createUser({
      name: 'Diana Prince',
      email: 'diana@forma.edu',
      password: 'StrongPassword123!',
      role: 'Student',
    });

    await authStore.updateGitHubConnection(linkedUser.id, {
      githubId: '777888',
      username: 'diana-prince',
      avatarUrl: 'https://avatars.githubusercontent.com/u/777888',
      profileUrl: 'https://github.com/diana-prince',
      encryptedAccessToken: 'valid_encrypted_token_sample',
      scopes: ['read:user'],
    });

    // 2. Unlinked user without GitHub account
    unlinkedUser = await authStore.createUser({
      name: 'Clark Kent',
      email: 'clark@forma.edu',
      password: 'StrongPassword123!',
      role: 'Student',
    });

    linkedAuthToken = generateToken(linkedUser);
    unlinkedAuthToken = generateToken(unlinkedUser);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Authentication and Authorization Guards', () => {
    it('rejects unauthenticated requests with 401 UNAUTHORIZED', async () => {
      const endpoints = [
        ['get', '/api/github/profile'],
        ['get', '/api/github/repositories'],
        ['get', '/api/github/repositories/diana/test-repo'],
        ['get', '/api/github/repositories/diana/test-repo/languages'],
        ['get', '/api/github/rate-limit'],
      ];

      for (const [method, url] of endpoints) {
        const res = await request(app)[method](url);
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('UNAUTHORIZED');
      }
    });

    it('returns 400 GITHUB_NOT_CONNECTED when student has not connected their GitHub account', async () => {
      githubService.getUserProfile.mockRejectedValueOnce(
        new GitHubServiceError(
          'GitHub account is not connected. Please connect your GitHub account via /api/github/connect.',
          'GITHUB_NOT_CONNECTED',
          400
        )
      );

      const res = await request(app)
        .get('/api/github/profile')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${unlinkedAuthToken}`]);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('GITHUB_NOT_CONNECTED');
    });
  });

  describe('2. GET /api/github/profile', () => {
    it('retrieves normalized GitHub profile for authenticated student', async () => {
      githubService.getUserProfile.mockResolvedValueOnce({
        profile: {
          id: 777888,
          login: 'diana-prince',
          name: 'Diana Prince',
          avatarUrl: 'https://avatars.githubusercontent.com/u/777888',
          profileUrl: 'https://github.com/diana-prince',
          bio: 'Amazonian Developer',
          company: 'Justice League',
          location: 'Themyscira',
          blog: 'https://diana.dev',
          twitterUsername: null,
          publicRepos: 12,
          publicGists: 0,
          followers: 120,
          following: 15,
          createdAt: '2022-01-01T00:00:00.000Z',
          updatedAt: '2026-10-01T00:00:00.000Z',
        },
        rateLimit: mockRateLimit,
      });

      const res = await request(app)
        .get('/api/github/profile')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${linkedAuthToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('GitHub profile retrieved successfully');
      expect(res.body.data.profile.login).toBe('diana-prince');
      expect(res.body.data.profile.publicRepos).toBe(12);
      expect(res.body.data.rateLimit.remaining).toBe(4995);

      // Verify decrypted token or secrets are NEVER in response
      const resStr = JSON.stringify(res.body);
      expect(resStr).not.toContain('valid_encrypted_token_sample');
      expect(resStr).not.toContain('gho_');
    });
  });

  describe('3. GET /api/github/repositories', () => {
    it('retrieves repositories with default pagination', async () => {
      githubService.getUserRepositories.mockResolvedValueOnce({
        repositories: [
          {
            id: 101,
            name: 'lasso-security',
            fullName: 'diana-prince/lasso-security',
            description: 'Truth-verification toolkit',
            htmlUrl: 'https://github.com/diana-prince/lasso-security',
            language: 'TypeScript',
            starsCount: 45,
            forksCount: 5,
            openIssuesCount: 1,
            watchersCount: 45,
            isPrivate: false,
            defaultBranch: 'main',
            topics: ['security', 'cryptography'],
          },
        ],
        pagination: {
          page: 1,
          perPage: 30,
          hasNextPage: false,
        },
        rateLimit: mockRateLimit,
      });

      const res = await request(app)
        .get('/api/github/repositories')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${linkedAuthToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.repositories).toHaveLength(1);
      expect(res.body.data.repositories[0].name).toBe('lasso-security');
      expect(res.body.data.pagination.page).toBe(1);
    });

    it('passes custom query parameters to githubService cleanly', async () => {
      githubService.getUserRepositories.mockResolvedValueOnce({
        repositories: [],
        pagination: { page: 2, perPage: 15, hasNextPage: true },
        rateLimit: mockRateLimit,
      });

      const res = await request(app)
        .get('/api/github/repositories?page=2&per_page=15&sort=created&direction=asc&type=public')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${linkedAuthToken}`]);

      expect(res.status).toBe(200);
      expect(githubService.getUserRepositories).toHaveBeenCalledWith(linkedUser.id, {
        page: 2,
        perPage: 15,
        sort: 'created',
        direction: 'asc',
        type: 'public',
      });
    });

    it('rejects invalid query parameters with 400 VALIDATION_ERROR', async () => {
      const res = await request(app)
        .get('/api/github/repositories?page=0&per_page=999&sort=unsupported_sort')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${linkedAuthToken}`]);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('VALIDATION_ERROR');
      expect(res.body.details).toBeDefined();
      expect(res.body.details.length).toBeGreaterThan(0);
    });
  });

  describe('4. GET /api/github/repositories/:owner/:repo', () => {
    it('retrieves individual repository details for valid parameters', async () => {
      githubService.getRepositoryDetails.mockResolvedValueOnce({
        repository: {
          id: 101,
          name: 'lasso-security',
          fullName: 'diana-prince/lasso-security',
          starsCount: 45,
          defaultBranch: 'main',
        },
        rateLimit: mockRateLimit,
      });

      const res = await request(app)
        .get('/api/github/repositories/diana-prince/lasso-security')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${linkedAuthToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.repository.name).toBe('lasso-security');
    });

    it('rejects invalid owner or repo name parameters containing forbidden characters', async () => {
      const res = await request(app)
        .get('/api/github/repositories/owner%20with%20spaces/repo<script>')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${linkedAuthToken}`]);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('VALIDATION_ERROR');
    });

    it('returns 404 when requested repository does not exist', async () => {
      githubService.getRepositoryDetails.mockRejectedValueOnce(
        new GitHubServiceError('Requested GitHub resource was not found.', 'GITHUB_RESOURCE_NOT_FOUND', 404)
      );

      const res = await request(app)
        .get('/api/github/repositories/diana-prince/non-existent-repo')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${linkedAuthToken}`]);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('GITHUB_RESOURCE_NOT_FOUND');
    });
  });

  describe('5. GET /api/github/repositories/:owner/:repo/languages', () => {
    it('returns language byte distribution and percentages', async () => {
      githubService.getRepositoryLanguages.mockResolvedValueOnce({
        totalBytes: 50000,
        languages: [
          { language: 'TypeScript', bytes: 40000, percentage: 80.0 },
          { language: 'CSS', bytes: 10000, percentage: 20.0 },
        ],
        rateLimit: mockRateLimit,
      });

      const res = await request(app)
        .get('/api/github/repositories/diana-prince/lasso-security/languages')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${linkedAuthToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalBytes).toBe(50000);
      expect(res.body.data.languages).toHaveLength(2);
      expect(res.body.data.languages[0].language).toBe('TypeScript');
      expect(res.body.data.languages[0].percentage).toBe(80.0);
    });
  });

  describe('6. GET /api/github/rate-limit', () => {
    it('returns rate limit status for authenticated student', async () => {
      githubService.getRateLimit.mockResolvedValueOnce(mockRateLimit);

      const res = await request(app)
        .get('/api/github/rate-limit')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${linkedAuthToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.rateLimit.limit).toBe(5000);
      expect(res.body.data.rateLimit.remaining).toBe(4995);
    });
  });

  describe('7. Upstream External API Error Mapping', () => {
    it('handles 429 GITHUB_RATE_LIMIT_EXCEEDED with reset metadata', async () => {
      githubService.getUserProfile.mockRejectedValueOnce(
        new GitHubServiceError('GitHub API rate limit exceeded.', 'GITHUB_RATE_LIMIT_EXCEEDED', 429, {
          resetInSeconds: 450,
        })
      );

      const res = await request(app)
        .get('/api/github/profile')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${linkedAuthToken}`]);

      expect(res.status).toBe(429);
      expect(res.body.error).toBe('GITHUB_RATE_LIMIT_EXCEEDED');
      expect(res.body.details.resetInSeconds).toBe(450);
    });

    it('handles 503 GITHUB_UPSTREAM_UNAVAILABLE', async () => {
      githubService.getUserProfile.mockRejectedValueOnce(
        new GitHubServiceError(
          'GitHub upstream service is temporarily unavailable after multiple retries.',
          'GITHUB_UPSTREAM_UNAVAILABLE',
          503
        )
      );

      const res = await request(app)
        .get('/api/github/profile')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${linkedAuthToken}`]);

      expect(res.status).toBe(503);
      expect(res.body.error).toBe('GITHUB_UPSTREAM_UNAVAILABLE');
    });
  });

  describe('8. Caching Integration and Invalidation', () => {
    it('serves cached data on subsequent requests and bypasses cache with ?refresh=true', async () => {
      githubService.getUserProfile.mockResolvedValue({
        profile: { id: 777888, login: 'diana-prince', publicRepos: 12 },
        rateLimit: mockRateLimit,
      });

      // 1st request -> Cache miss, calls service
      const res1 = await request(app)
        .get('/api/github/profile')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${linkedAuthToken}`]);

      expect(res1.status).toBe(200);
      expect(res1.body.isCached).toBe(false);
      expect(githubService.getUserProfile).toHaveBeenCalledTimes(1);

      // 2nd request -> Cache hit, does NOT call service again!
      const res2 = await request(app)
        .get('/api/github/profile')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${linkedAuthToken}`]);

      expect(res2.status).toBe(200);
      expect(res2.body.isCached).toBe(true);
      expect(res2.body.cachedAt).toBeDefined();
      expect(githubService.getUserProfile).toHaveBeenCalledTimes(1); // Still 1

      // 3rd request with ?refresh=true -> Bypasses cache and calls service
      const res3 = await request(app)
        .get('/api/github/profile?refresh=true')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${linkedAuthToken}`]);

      expect(res3.status).toBe(200);
      expect(res3.body.isCached).toBe(false);
      expect(githubService.getUserProfile).toHaveBeenCalledTimes(2);
    });

    it('purges cached data when user disconnects their GitHub account', async () => {
      githubService.getUserProfile.mockResolvedValue({
        profile: { id: 777888, login: 'diana-prince' },
        rateLimit: mockRateLimit,
      });

      // Populate cache
      await request(app)
        .get('/api/github/profile')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${linkedAuthToken}`]);

      expect(cacheService.get(cacheService.profileKey(linkedUser.id))).not.toBeNull();

      // Disconnect GitHub
      const resDisconnect = await request(app)
        .delete('/api/github/disconnect')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${linkedAuthToken}`]);

      expect(resDisconnect.status).toBe(200);

      // Cache MUST be completely purged for this user
      expect(cacheService.get(cacheService.profileKey(linkedUser.id))).toBeNull();
    });
  });
});

