import { githubService, GitHubServiceError } from '../services/githubService.js';
import { cacheService, CACHE_TTL } from '../services/cacheService.js';
import {
  repositoriesQuerySchema,
  repoParamsSchema,
  validateSchema,
} from '../validators/githubValidators.js';
import { logger } from '../utils/logger.js';

/**
 * Handle and normalize errors for GitHub data controllers.
 * @param {Error} err
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const handleControllerError = (err, res, next) => {
  if (err instanceof GitHubServiceError) {
    logger.warn(`[GITHUB CONTROLLER] ${err.code} (${err.status}): ${err.message}`);
    return res.status(err.status).json({
      success: false,
      error: err.code,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  logger.error('[GITHUB CONTROLLER UNEXPECTED ERROR]:', { message: err.message, stack: err.stack });
  next(err);
};

/**
 * Retrieve authenticated student's GitHub profile with 10-minute caching.
 * Supports manual cache bypass via ?refresh=true
 * GET /api/github/profile
 */
export const getProfile = async (req, res, next) => {
  try {
    const bypassCache = req.query.refresh === 'true';
    const cacheKey = cacheService.profileKey(req.user.id);

    // 1. Check in-memory TTL cache
    const cached = cacheService.get(cacheKey, { bypass: bypassCache });
    if (cached) {
      return res.status(200).json({
        success: true,
        message: 'GitHub profile retrieved successfully',
        data: {
          profile: cached.data.profile,
          rateLimit: cached.data.rateLimit,
        },
        isCached: true,
        cachedAt: cached.cachedAt,
      });
    }

    // 2. Cache miss or manual refresh requested: Fetch from upstream GitHub REST API
    const result = await githubService.getUserProfile(req.user.id);

    // 3. Store normalized profile in cache
    cacheService.set(cacheKey, result, CACHE_TTL.PROFILE);

    return res.status(200).json({
      success: true,
      message: 'GitHub profile retrieved successfully',
      data: {
        profile: result.profile,
        rateLimit: result.rateLimit,
      },
      isCached: false,
    });
  } catch (err) {
    handleControllerError(err, res, next);
  }
};

/**
 * Retrieve authenticated student's GitHub repositories with pagination and 5-minute caching.
 * Supports manual cache bypass via ?refresh=true
 * GET /api/github/repositories
 */
export const getRepositories = async (req, res, next) => {
  try {
    const validation = validateSchema(repositoriesQuerySchema, req.query);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid repository query parameters.',
        details: validation.errors,
      });
    }

    const query = validation.data;
    const bypassCache = req.query.refresh === 'true';
    const cacheKey = cacheService.repoListKey(req.user.id, query);

    // 1. Check in-memory TTL cache
    const cached = cacheService.get(cacheKey, { bypass: bypassCache });
    if (cached) {
      return res.status(200).json({
        success: true,
        message: 'GitHub repositories retrieved successfully',
        data: {
          repositories: cached.data.repositories,
          pagination: cached.data.pagination,
          rateLimit: cached.data.rateLimit,
        },
        isCached: true,
        cachedAt: cached.cachedAt,
      });
    }

    // 2. Upstream fetch
    const result = await githubService.getUserRepositories(req.user.id, {
      page: query.page,
      perPage: query.per_page,
      sort: query.sort,
      direction: query.direction,
      type: query.type,
    });

    // 3. Store in cache
    cacheService.set(cacheKey, result, CACHE_TTL.REPO_LIST);

    return res.status(200).json({
      success: true,
      message: 'GitHub repositories retrieved successfully',
      data: {
        repositories: result.repositories,
        pagination: result.pagination,
        rateLimit: result.rateLimit,
      },
      isCached: false,
    });
  } catch (err) {
    handleControllerError(err, res, next);
  }
};

/**
 * Retrieve individual repository details with 5-minute caching.
 * GET /api/github/repositories/:owner/:repo
 */
export const getRepositoryDetails = async (req, res, next) => {
  try {
    const validation = validateSchema(repoParamsSchema, req.params);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid repository owner or name parameters.',
        details: validation.errors,
      });
    }

    const { owner, repo } = validation.data;
    const bypassCache = req.query.refresh === 'true';
    const cacheKey = cacheService.repoDetailKey(req.user.id, owner, repo);

    // 1. Check cache
    const cached = cacheService.get(cacheKey, { bypass: bypassCache });
    if (cached) {
      return res.status(200).json({
        success: true,
        message: 'Repository details retrieved successfully',
        data: {
          repository: cached.data.repository,
          rateLimit: cached.data.rateLimit,
        },
        isCached: true,
        cachedAt: cached.cachedAt,
      });
    }

    // 2. Fetch from GitHub
    const result = await githubService.getRepositoryDetails(req.user.id, owner, repo);

    // 3. Store in cache
    cacheService.set(cacheKey, result, CACHE_TTL.REPO_DETAIL);

    return res.status(200).json({
      success: true,
      message: 'Repository details retrieved successfully',
      data: {
        repository: result.repository,
        rateLimit: result.rateLimit,
      },
      isCached: false,
    });
  } catch (err) {
    handleControllerError(err, res, next);
  }
};

/**
 * Retrieve repository language statistics with 15-minute caching.
 * GET /api/github/repositories/:owner/:repo/languages
 */
export const getRepositoryLanguages = async (req, res, next) => {
  try {
    const validation = validateSchema(repoParamsSchema, req.params);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid repository owner or name parameters.',
        details: validation.errors,
      });
    }

    const { owner, repo } = validation.data;
    const bypassCache = req.query.refresh === 'true';
    const cacheKey = cacheService.languagesKey(req.user.id, owner, repo);

    // 1. Check cache
    const cached = cacheService.get(cacheKey, { bypass: bypassCache });
    if (cached) {
      return res.status(200).json({
        success: true,
        message: 'Repository language statistics retrieved successfully',
        data: {
          totalBytes: cached.data.totalBytes,
          languages: cached.data.languages,
          rateLimit: cached.data.rateLimit,
        },
        isCached: true,
        cachedAt: cached.cachedAt,
      });
    }

    // 2. Fetch from GitHub
    const result = await githubService.getRepositoryLanguages(req.user.id, owner, repo);

    // 3. Store in cache
    cacheService.set(cacheKey, result, CACHE_TTL.LANGUAGES);

    return res.status(200).json({
      success: true,
      message: 'Repository language statistics retrieved successfully',
      data: {
        totalBytes: result.totalBytes,
        languages: result.languages,
        rateLimit: result.rateLimit,
      },
      isCached: false,
    });
  } catch (err) {
    handleControllerError(err, res, next);
  }
};

/**
 * Probe GitHub REST API rate limit quota status.
 * Rate limit quotas are never cached to ensure fresh analytics.
 * GET /api/github/rate-limit
 */
export const getRateLimit = async (req, res, next) => {
  try {
    const rateLimit = await githubService.getRateLimit(req.user.id);

    return res.status(200).json({
      success: true,
      message: 'GitHub API rate limit quota retrieved successfully',
      data: {
        rateLimit,
      },
      isCached: false,
    });
  } catch (err) {
    handleControllerError(err, res, next);
  }
};

export default {
  getProfile,
  getRepositories,
  getRepositoryDetails,
  getRepositoryLanguages,
  getRateLimit,
};
