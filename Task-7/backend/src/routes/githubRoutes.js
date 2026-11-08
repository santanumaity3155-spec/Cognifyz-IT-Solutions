import { Router } from 'express';
import {
  connectGitHub,
  handleGitHubCallback,
  getGitHubStatus,
  disconnectGitHub,
} from '../controllers/githubAuthController.js';
import {
  getProfile,
  getRepositories,
  getRepositoryDetails,
  getRepositoryLanguages,
  getRateLimit,
} from '../controllers/githubDataController.js';
import { authenticateUser } from '../middleware/authenticateUser.js';
import { authLimiter, githubProxyLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// ==========================================
// 1. OAuth 2.0 Flow Endpoints (Phase 4)
// ==========================================

// Initiate GitHub OAuth flow (auth rate limiter + session authentication)
router.get('/connect', authLimiter, authenticateUser, connectGitHub);

// OAuth callback from GitHub servers (skips auth limiter to protect callback completion)
router.get('/callback', handleGitHubCallback);

// Probe connection status of current user
router.get('/status', authenticateUser, getGitHubStatus);

// Disconnect GitHub account
router.delete('/disconnect', authenticateUser, disconnectGitHub);

// ==========================================
// 2. Developer Intelligence Data Endpoints (Phase 6/7)
// Gated by GitHub Proxy Rate Limiter + authenticateUser
// ==========================================

// Retrieve authenticated student's GitHub profile
router.get('/profile', githubProxyLimiter, authenticateUser, getProfile);

// Retrieve student's repositories with pagination & filtering
router.get('/repositories', githubProxyLimiter, authenticateUser, getRepositories);

// Retrieve individual repository details
router.get('/repositories/:owner/:repo', githubProxyLimiter, authenticateUser, getRepositoryDetails);

// Retrieve programming language statistics for repository
router.get('/repositories/:owner/:repo/languages', githubProxyLimiter, authenticateUser, getRepositoryLanguages);

// Probe GitHub API rate limit quota
router.get('/rate-limit', githubProxyLimiter, authenticateUser, getRateLimit);

export default router;
