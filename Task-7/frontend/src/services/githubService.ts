import api from './api.ts';
import {
  GitHubStatus,
  GitHubRateLimit,
  ProfileApiResponse,
  RepositoriesApiResponse,
  RepoDetailsApiResponse,
  LanguagesApiResponse,
  HealthApiResponse,
  RepoQueryParams,
} from '../types/index.ts';

export const githubService = {
  /**
   * Probe GitHub OAuth connection status for authenticated user.
   */
  async getStatus(): Promise<GitHubStatus> {
    const res = await api.get('/github/status');
    const body = res.data;
    return {
      connected: Boolean(body.connected),
      oauthConfigured: body.oauthConfigured,
      ...(body.data || {}),
    };
  },

  /**
   * Fetch authenticated student's GitHub developer profile.
   * Supports manual cache invalidation via refresh: true.
   */
  async getProfile(options?: { refresh?: boolean }): Promise<ProfileApiResponse> {
    const query = options?.refresh ? '?refresh=true' : '';
    const res = await api.get(`/github/profile${query}`);
    return {
      profile: res.data.data.profile,
      rateLimit: res.data.data.rateLimit,
      isCached: res.data.isCached,
      cachedAt: res.data.cachedAt,
    };
  },

  /**
   * Fetch authenticated student's GitHub repositories with pagination, sorting, and filters.
   */
  async getRepositories(
    params?: RepoQueryParams,
    options?: { refresh?: boolean }
  ): Promise<RepositoriesApiResponse> {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.per_page) queryParams.set('per_page', String(params.per_page));
    if (params?.sort) queryParams.set('sort', params.sort);
    if (params?.direction) queryParams.set('direction', params.direction);
    if (params?.type) queryParams.set('type', params.type);
    if (options?.refresh) queryParams.set('refresh', 'true');

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const res = await api.get(`/github/repositories${queryString}`);

    return {
      repositories: res.data.data.repositories,
      pagination: res.data.data.pagination,
      rateLimit: res.data.data.rateLimit,
      isCached: res.data.isCached,
      cachedAt: res.data.cachedAt,
    };
  },

  /**
   * Fetch detailed metadata for an individual repository.
   */
  async getRepositoryDetails(
    owner: string,
    repo: string,
    options?: { refresh?: boolean }
  ): Promise<RepoDetailsApiResponse> {
    const query = options?.refresh ? '?refresh=true' : '';
    const res = await api.get(
      `/github/repositories/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}${query}`
    );
    return {
      repository: res.data.data.repository,
      rateLimit: res.data.data.rateLimit,
      isCached: res.data.isCached,
      cachedAt: res.data.cachedAt,
    };
  },

  /**
   * Fetch programming language byte breakdown for an individual repository.
   */
  async getRepositoryLanguages(
    owner: string,
    repo: string,
    options?: { refresh?: boolean }
  ): Promise<LanguagesApiResponse> {
    const query = options?.refresh ? '?refresh=true' : '';
    const res = await api.get(
      `/github/repositories/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/languages${query}`
    );
    return {
      totalBytes: res.data.data.totalBytes,
      languages: res.data.data.languages,
      rateLimit: res.data.data.rateLimit,
      isCached: res.data.isCached,
      cachedAt: res.data.cachedAt,
    };
  },

  /**
   * Probe real-time GitHub REST API hourly quota and allowance.
   */
  async getRateLimit(): Promise<GitHubRateLimit> {
    const res = await api.get('/github/rate-limit');
    return res.data.data.rateLimit;
  },

  /**
   * Probe backend service health and operational telemetry.
   */
  async getHealth(): Promise<HealthApiResponse> {
    const res = await api.get('/health');
    return res.data;
  },

  /**
   * Disconnect GitHub integration and invalidate cached credentials.
   */
  async disconnect(): Promise<void> {
    await api.delete('/github/disconnect');
  },

  /**
   * Returns backend authorization code URL for starting OAuth flow.
   */
  getConnectUrl(): string {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
    return `${baseUrl}/github/connect`;
  },
};

export default githubService;
