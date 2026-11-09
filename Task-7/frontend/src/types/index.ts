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

export interface GitHubProfile {
  id: number;
  login: string;
  name: string;
  avatarUrl: string;
  profileUrl: string;
  bio: string | null;
  company: string | null;
  location: string | null;
  blog: string | null;
  twitterUsername: string | null;
  publicRepos: number;
  publicGists: number;
  followers: number;
  following: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface GitHubRepoLicense {
  key: string;
  name: string;
  spdxId: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  htmlUrl: string;
  cloneUrl: string;
  language: string | null;
  starsCount: number;
  forksCount: number;
  openIssuesCount: number;
  watchersCount: number;
  isPrivate: boolean;
  isFork: boolean;
  defaultBranch: string;
  topics: string[];
  license: GitHubRepoLicense | null;
  createdAt: string | null;
  updatedAt: string | null;
  pushedAt: string | null;
}

export interface LanguageItem {
  language: string;
  bytes: number;
  percentage: number;
}

export interface LanguageBreakdownData {
  totalBytes: number;
  languages: LanguageItem[];
}

export interface GitHubRateLimit {
  limit: number;
  remaining: number;
  used: number;
  resetTime: number;
  resetDate: string;
  resetInSeconds: number;
}

export interface PaginationMetadata {
  page: number;
  perPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface RepoQueryParams {
  page?: number;
  per_page?: number;
  sort?: 'created' | 'updated' | 'pushed' | 'full_name';
  direction?: 'asc' | 'desc';
  type?: 'all' | 'owner' | 'public' | 'private' | 'member';
}

export interface RepoFilterState {
  search: string;
  language: string;
  sort: 'updated' | 'stars' | 'forks' | 'name';
  direction: 'asc' | 'desc';
}

export interface ProfileApiResponse {
  profile: GitHubProfile;
  rateLimit: GitHubRateLimit;
  isCached?: boolean;
  cachedAt?: string;
}

export interface RepositoriesApiResponse {
  repositories: GitHubRepo[];
  pagination: PaginationMetadata;
  rateLimit: GitHubRateLimit;
  isCached?: boolean;
  cachedAt?: string;
}

export interface RepoDetailsApiResponse {
  repository: GitHubRepo;
  rateLimit: GitHubRateLimit;
  isCached?: boolean;
  cachedAt?: string;
}

export interface LanguagesApiResponse {
  totalBytes: number;
  languages: LanguageItem[];
  rateLimit: GitHubRateLimit;
  isCached?: boolean;
  cachedAt?: string;
}

export interface HealthApiResponse {
  status: string;
  timestamp: string;
  level: string;
  task: string;
  database: {
    mode: string;
    isPersistent: boolean;
    databaseName: string;
  };
  oauth: {
    configured: boolean;
    maskedClientId: string;
  };
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
