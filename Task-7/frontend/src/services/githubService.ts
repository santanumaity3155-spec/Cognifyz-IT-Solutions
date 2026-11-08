import api from './api.ts';
import { GitHubStatus, GitHubRateLimit } from '../types/index.ts';

export const githubService = {
  async getStatus(): Promise<GitHubStatus> {
    const res = await api.get('/github/status');
    const body = res.data;
    return {
      connected: Boolean(body.connected),
      oauthConfigured: body.oauthConfigured,
      ...(body.data || {}),
    };
  },

  async disconnect(): Promise<void> {
    await api.delete('/github/disconnect');
  },

  async getRateLimit(): Promise<GitHubRateLimit> {
    const res = await api.get('/github/rate-limit');
    return res.data.data.rateLimit;
  },

  getConnectUrl(): string {
    // Navigate directly to backend connect endpoint to initiate OAuth code flow
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
    return `${baseUrl}/github/connect`;
  },
};

export default githubService;

