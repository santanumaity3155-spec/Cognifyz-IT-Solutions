import { env } from './environment.js';

/**
 * Centralized GitHub API and OAuth 2.0 configuration constants.
 * Strictly avoids embedding secrets in code.
 */
export const githubConfig = Object.freeze({
  // Base URLs
  apiBaseUrl: 'https://api.github.com',
  oauthAuthorizeUrl: 'https://github.com/login/oauth/authorize',
  oauthTokenUrl: 'https://github.com/login/oauth/access_token',

  // Callback URL
  callbackUrl: env.GITHUB_CALLBACK_URL || 'http://localhost:5001/api/github/callback',

  // API Version & User Agent per GitHub REST API specifications
  apiVersion: '2022-11-28',
  userAgent: 'Forma-Developer-Intelligence-Platform',

  // Scopes requested for student developer intelligence
  // - read:user: minimum permission necessary to read student profile, bio, organizations, and public avatar
  // Note: Public repositories do not require the elevated 'repo' scope.
  scopes: ['read:user'],

  // Default network request timeout in milliseconds
  timeoutMs: 8000,

  // Default headers for GitHub REST API requests
  defaultHeaders: Object.freeze({
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'Forma-Developer-Intelligence-Platform',
  }),

  // State cookie configuration for CSRF protection
  stateCookie: Object.freeze({
    name: 'forma_github_oauth_state',
    maxAgeMs: 10 * 60 * 1000, // 10 minutes TTL
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
  }),
});

export default githubConfig;

