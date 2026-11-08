import axios from 'axios';
import { env } from '../config/environment.js';
import { githubConfig } from '../config/githubConfig.js';
import { oauthStateStore } from '../services/oauthStateStore.js';
import { encrypt } from '../services/encryptionService.js';
import { cacheService } from '../services/cacheService.js';
import authStore from '../services/authStore.js';
import { logger } from '../utils/logger.js';

const STATE_COOKIE_NAME = githubConfig.stateCookie.name;

/**
 * Initiate GitHub OAuth 2.0 Authorization Code flow.
 * GET /api/github/connect
 */
export const connectGitHub = async (req, res, next) => {
  try {
    // 1. Verify that GitHub OAuth credentials are configured
    if (!env.isOAuthConfigured) {
      return res.status(503).json({
        success: false,
        error: 'OAUTH_CONFIG_REQUIRED',
        message: 'GitHub OAuth is not configured on this server. Please configure GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in backend/.env.',
        setupGuide: 'https://github.com/settings/developers',
      });
    }

    // 2. Generate cryptographically random state bound to the authenticated student ID
    const state = oauthStateStore.generateState(req.user.id);

    // 3. Set short-lived HTTP-only state cookie for CSRF defense
    res.cookie(STATE_COOKIE_NAME, state, {
      httpOnly: githubConfig.stateCookie.httpOnly,
      sameSite: githubConfig.stateCookie.sameSite,
      secure: githubConfig.stateCookie.secure,
      maxAge: githubConfig.stateCookie.maxAgeMs,
      path: '/',
    });

    // 4. Construct GitHub OAuth authorization URL with minimum required scopes
    const params = new URLSearchParams({
      client_id: env.GITHUB_CLIENT_ID,
      redirect_uri: githubConfig.callbackUrl,
      scope: githubConfig.scopes.join(' '),
      state,
      allow_signup: 'true',
    });

    const authUrl = `${githubConfig.oauthAuthorizeUrl}?${params.toString()}`;

    logger.info(`[GITHUB OAUTH] Initiated connection for user ${req.user.id}`);

    // If client requested JSON (e.g. AJAX or test suite), return JSON url
    if (req.headers.accept?.includes('application/json') || req.query.json === 'true') {
      return res.status(200).json({
        success: true,
        authUrl,
        state,
        scopes: githubConfig.scopes,
      });
    }

    // Standard browser navigation: 302 redirect to GitHub
    return res.redirect(authUrl);
  } catch (error) {
    next(error);
  }
};

/**
 * Handle GitHub OAuth 2.0 authorization callback.
 * GET /api/github/callback
 */
export const handleGitHubCallback = async (req, res, next) => {
  const isJsonRequest = req.headers.accept?.includes('application/json') || req.query.json === 'true';

  try {
    const { code, state, error, error_description } = req.query;

    // 1. Handle authorization denial by user
    if (error === 'access_denied' || error) {
      res.clearCookie(STATE_COOKIE_NAME, { path: '/' });
      logger.warn(`[GITHUB OAUTH] Authorization denied or failed: ${error} - ${error_description || ''}`);

      if (isJsonRequest) {
        return res.status(400).json({
          success: false,
          error: 'AUTHORIZATION_DENIED',
          message: error_description || 'User declined GitHub authorization.',
        });
      }
      return res.redirect(`${env.CLIENT_URL}/github/callback?status=denied&error=${encodeURIComponent(error || 'denied')}`);
    }

    // 2. Validate authorization code existence
    if (!code || typeof code !== 'string') {
      res.clearCookie(STATE_COOKIE_NAME, { path: '/' });
      if (isJsonRequest) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_AUTHORIZATION_CODE',
          message: 'GitHub callback is missing authorization code.',
        });
      }
      return res.redirect(`${env.CLIENT_URL}/github/callback?status=error&error=MISSING_CODE`);
    }

    // 3. State CSRF Validation (Cross-check state parameter and cookie against in-memory registry)
    const cookieState = req.cookies?.[STATE_COOKIE_NAME];
    if (!cookieState || cookieState !== state) {
      res.clearCookie(STATE_COOKIE_NAME, { path: '/' });
      logger.warn('[GITHUB OAUTH] CSRF state mismatch or missing state cookie.');

      if (isJsonRequest) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_OAUTH_STATE',
          message: 'OAuth state parameter is missing, mismatched, or expired. Potential CSRF attempt blocked.',
        });
      }
      return res.redirect(`${env.CLIENT_URL}/github/callback?status=error&error=INVALID_STATE`);
    }

    // Single-use consumption check
    const stateValidation = oauthStateStore.validateAndConsumeState(state);
    if (!stateValidation.valid) {
      res.clearCookie(STATE_COOKIE_NAME, { path: '/' });
      logger.warn(`[GITHUB OAUTH] State validation failed: ${stateValidation.error}`);

      if (isJsonRequest) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_OAUTH_STATE',
          message: `OAuth state validation rejected (${stateValidation.error}).`,
        });
      }
      return res.redirect(`${env.CLIENT_URL}/github/callback?status=error&error=${stateValidation.error}`);
    }

    const targetUserId = stateValidation.userId;

    // 4. Exchange authorization code for access token with GitHub OAuth endpoint
    let tokenExchangeResponse;
    try {
      tokenExchangeResponse = await axios.post(
        githubConfig.oauthTokenUrl,
        {
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: githubConfig.callbackUrl,
        },
        {
          headers: {
            Accept: 'application/json',
            'User-Agent': githubConfig.userAgent,
          },
          timeout: githubConfig.timeoutMs,
        }
      );
    } catch (err) {
      res.clearCookie(STATE_COOKIE_NAME, { path: '/' });
      logger.error('[GITHUB OAUTH] Token exchange network error:', { message: err.message });
      if (isJsonRequest) {
        return res.status(502).json({
          success: false,
          error: 'TOKEN_EXCHANGE_NETWORK_ERROR',
          message: 'Failed to communicate with GitHub OAuth service.',
        });
      }
      return res.redirect(`${env.CLIENT_URL}/github/callback?status=error&error=EXCHANGE_NETWORK_ERROR`);
    }

    const { access_token, scope, token_type, error: tokenError, error_description: tokenErrorDesc } = tokenExchangeResponse.data;

    if (tokenError || !access_token) {
      res.clearCookie(STATE_COOKIE_NAME, { path: '/' });
      logger.error(`[GITHUB OAUTH] Token exchange rejected by GitHub: ${tokenError} - ${tokenErrorDesc || ''}`);

      if (isJsonRequest) {
        return res.status(400).json({
          success: false,
          error: 'TOKEN_EXCHANGE_FAILED',
          message: tokenErrorDesc || 'GitHub rejected authorization code exchange.',
        });
      }
      return res.redirect(`${env.CLIENT_URL}/github/callback?status=error&error=TOKEN_EXCHANGE_FAILED`);
    }

    // 5. Fetch authenticated GitHub user profile using the new access token
    let profileResponse;
    try {
      profileResponse = await axios.get(`${githubConfig.apiBaseUrl}/user`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': githubConfig.apiVersion,
          'User-Agent': githubConfig.userAgent,
        },
        timeout: githubConfig.timeoutMs,
      });
    } catch (err) {
      res.clearCookie(STATE_COOKIE_NAME, { path: '/' });
      logger.error('[GITHUB OAUTH] Profile fetch failed with access token:', { message: err.message });

      if (isJsonRequest) {
        return res.status(502).json({
          success: false,
          error: 'PROFILE_FETCH_FAILED',
          message: 'Unable to retrieve GitHub profile using acquired access token.',
        });
      }
      return res.redirect(`${env.CLIENT_URL}/github/callback?status=error&error=PROFILE_FETCH_FAILED`);
    }

    const ghProfile = profileResponse.data;

    // 6. Encrypt access token at rest using AES-256-GCM before database persistence
    const encryptedAccessToken = encrypt(access_token);

    // 7. Persist connection details in authenticated student account
    const scopesList = scope ? scope.split(',').map((s) => s.trim()) : githubConfig.scopes;

    const updatedUser = await authStore.updateGitHubConnection(targetUserId, {
      githubId: String(ghProfile.id),
      username: ghProfile.login,
      avatarUrl: ghProfile.avatar_url,
      profileUrl: ghProfile.html_url,
      encryptedAccessToken,
      scopes: scopesList,
    });

    if (!updatedUser) {
      res.clearCookie(STATE_COOKIE_NAME, { path: '/' });
      if (isJsonRequest) {
        return res.status(500).json({
          success: false,
          error: 'STORAGE_FAILED',
          message: 'Failed to update user account with GitHub credentials.',
        });
      }
      return res.redirect(`${env.CLIENT_URL}/github/callback?status=error&error=STORAGE_FAILED`);
    }

    // 8. Clean up state cookie
    res.clearCookie(STATE_COOKIE_NAME, { path: '/' });

    logger.info(`[GITHUB OAUTH] User ${targetUserId} successfully connected GitHub account: ${ghProfile.login}`);

    // 9. Return clean response (Never leak access token or encrypted token)
    if (isJsonRequest) {
      return res.status(200).json({
        success: true,
        message: 'GitHub account connected successfully.',
        data: {
          username: ghProfile.login,
          avatarUrl: ghProfile.avatar_url,
          profileUrl: ghProfile.html_url,
          scopes: scopesList,
          connectedAt: new Date().toISOString(),
        },
      });
    }

    return res.redirect(
      `${env.CLIENT_URL}/github/callback?status=success&username=${encodeURIComponent(ghProfile.login)}`
    );
  } catch (error) {
    res.clearCookie(STATE_COOKIE_NAME, { path: '/' });
    next(error);
  }
};

/**
 * Retrieve GitHub connection status for authenticated user.
 * GET /api/github/status
 */
export const getGitHubStatus = async (req, res, next) => {
  try {
    const user = await authStore.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User account not found.',
      });
    }

    const github = user.github || {};

    if (!github.connected) {
      return res.status(200).json({
        success: true,
        connected: false,
        oauthConfigured: env.isOAuthConfigured,
        message: 'No GitHub account is currently connected to this profile.',
      });
    }

    // Return sanitized connection data - never return raw or encrypted tokens
    return res.status(200).json({
      success: true,
      connected: true,
      oauthConfigured: env.isOAuthConfigured,
      data: {
        username: github.username,
        avatarUrl: github.avatarUrl,
        profileUrl: github.profileUrl,
        scopes: github.scopes || [],
        connectedAt: github.connectedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Disconnect GitHub account from authenticated user.
 * DELETE /api/github/disconnect
 */
export const disconnectGitHub = async (req, res, next) => {
  try {
    const updated = await authStore.disconnectGitHub(req.user.id);

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User account not found.',
      });
    }

    res.clearCookie(STATE_COOKIE_NAME, { path: '/' });

    // Invalidate cached profile, repo, and language data for disconnected user
    cacheService.invalidateUser(req.user.id);

    logger.info(`[GITHUB OAUTH] User ${req.user.id} disconnected their GitHub account.`);

    return res.status(200).json({
      success: true,
      message: 'GitHub account disconnected successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export default {
  connectGitHub,
  handleGitHubCallback,
  getGitHubStatus,
  disconnectGitHub,
};
