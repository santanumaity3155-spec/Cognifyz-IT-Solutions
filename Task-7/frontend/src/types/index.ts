export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Student' | 'Admin';
}

export interface GitHubStatus {
  connected: boolean;
  username?: string;
  avatarUrl?: string;
  profileUrl?: string;
  scopes?: string[];
  connectedAt?: string;
  oauthConfigured?: boolean;
}

export interface GitHubRateLimit {
  limit: number;
  remaining: number;
  used: number;
  resetTime: number;
  resetDate: string;
  resetInSeconds: number;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  githubStatus: GitHubStatus | null;
  githubLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshGitHubStatus: () => Promise<void>;
  disconnectGitHub: () => Promise<void>;
}
