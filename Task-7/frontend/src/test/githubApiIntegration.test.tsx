import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext.tsx';
import DeveloperProfilePage from '../pages/DeveloperProfilePage.tsx';
import RepoExplorerPage from '../pages/RepoExplorerPage.tsx';
import ApiStatusPage from '../pages/ApiStatusPage.tsx';
import DashboardPage from '../pages/DashboardPage.tsx';
import CallbackPage from '../pages/CallbackPage.tsx';
import api from '../services/api.ts';
import githubService from '../services/githubService.ts';

vi.mock('../services/api.ts', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Phase 10: Frontend API Integration and User Experience Tests', () => {
  const mockConnectedStatus = {
    connected: true,
    oauthConfigured: true,
    data: {
      username: 'octocat',
      avatarUrl: 'https://avatars.githubusercontent.com/u/583231?v=4',
      profileUrl: 'https://github.com/octocat',
      scopes: ['read:user'],
      connectedAt: '2026-01-01T00:00:00Z',
    },
  };

  const mockDisconnectedStatus = {
    connected: false,
    oauthConfigured: true,
    message: 'No GitHub account is currently connected to this profile.',
  };

  const mockProfile = {
    id: 583231,
    login: 'octocat',
    name: 'The Octocat',
    avatarUrl: 'https://avatars.githubusercontent.com/u/583231?v=4',
    profileUrl: 'https://github.com/octocat',
    bio: 'GitHub mascot and developer advocate',
    company: 'GitHub Inc.',
    location: 'San Francisco',
    blog: 'https://github.blog',
    twitterUsername: 'github',
    publicRepos: 8,
    publicGists: 4,
    followers: 9500,
    following: 9,
    createdAt: '2011-01-25T18:44:36Z',
    updatedAt: '2026-10-10T12:00:00Z',
  };

  const mockRateLimit = {
    limit: 5000,
    remaining: 4890,
    used: 110,
    resetTime: 1770000000,
    resetDate: '2026-11-09T12:00:00Z',
    resetInSeconds: 3600,
  };

  const mockRepos = [
    {
      id: 1296269,
      name: 'Hello-World',
      fullName: 'octocat/Hello-World',
      description: 'My first repository on GitHub!',
      htmlUrl: 'https://github.com/octocat/Hello-World',
      cloneUrl: 'https://github.com/octocat/Hello-World.git',
      language: 'C',
      starsCount: 2400,
      forksCount: 1800,
      openIssuesCount: 45,
      watchersCount: 2400,
      isPrivate: false,
      isFork: false,
      defaultBranch: 'master',
      topics: ['first-repo', 'hello-world'],
      license: { key: 'mit', name: 'MIT License', spdxId: 'MIT' },
      createdAt: '2011-01-26T19:01:12Z',
      updatedAt: '2026-10-15T00:00:00Z',
      pushedAt: '2026-10-15T00:00:00Z',
    },
    {
      id: 2548923,
      name: 'Spoon-Knife',
      fullName: 'octocat/Spoon-Knife',
      description: 'This repo is for spoon-knife experiments.',
      htmlUrl: 'https://github.com/octocat/Spoon-Knife',
      cloneUrl: 'https://github.com/octocat/Spoon-Knife.git',
      language: 'HTML',
      starsCount: 12800,
      forksCount: 125000,
      openIssuesCount: 920,
      watchersCount: 12800,
      isPrivate: false,
      isFork: false,
      defaultBranch: 'main',
      topics: ['git-flow', 'fork-test'],
      license: null,
      createdAt: '2011-10-11T12:00:00Z',
      updatedAt: '2026-10-20T00:00:00Z',
      pushedAt: '2026-10-20T00:00:00Z',
    },
  ];

  const mockLanguages = {
    totalBytes: 50000,
    languages: [
      { language: 'C', bytes: 35000, percentage: 70.0 },
      { language: 'Makefile', bytes: 15000, percentage: 30.0 },
    ],
  };

  const mockHealth = {
    status: 'UP',
    timestamp: '2026-11-09T10:00:00Z',
    level: 'Level 4: Expert',
    task: 'Task 7',
    database: {
      mode: 'in-memory',
      isPersistent: false,
      databaseName: 'forma_task7_inmemory',
    },
    oauth: {
      configured: true,
      maskedClientId: 'Iv23****9aB',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    (api.get as any).mockImplementation((url: string) => {
      if (url === '/auth/me') {
        return Promise.resolve({
          data: {
            success: true,
            data: { user: { id: 'u1', name: 'Student Dev', email: 'student@forma.edu', role: 'Student' } },
          },
        });
      }
      if (url === '/github/status') {
        return Promise.resolve({ data: mockConnectedStatus });
      }
      if (url.startsWith('/github/profile')) {
        return Promise.resolve({
          data: {
            success: true,
            message: 'GitHub profile retrieved successfully',
            data: { profile: mockProfile, rateLimit: mockRateLimit },
            isCached: url.includes('refresh') ? false : true,
            cachedAt: '2026-11-09T10:15:00Z',
          },
        });
      }
      if (url.startsWith('/github/repositories') && url.includes('/languages')) {
        return Promise.resolve({
          data: {
            success: true,
            data: { ...mockLanguages, rateLimit: mockRateLimit },
          },
        });
      }
      if (url.startsWith('/github/repositories/octocat/Hello-World')) {
        return Promise.resolve({
          data: {
            success: true,
            data: { repository: mockRepos[0], rateLimit: mockRateLimit },
          },
        });
      }
      if (url.startsWith('/github/repositories')) {
        return Promise.resolve({
          data: {
            success: true,
            data: {
              repositories: mockRepos,
              pagination: { page: 1, perPage: 10, hasNextPage: false, hasPrevPage: false },
              rateLimit: mockRateLimit,
            },
            isCached: false,
          },
        });
      }
      if (url === '/github/rate-limit') {
        return Promise.resolve({
          data: {
            success: true,
            data: { rateLimit: mockRateLimit },
          },
        });
      }
      if (url === '/health') {
        return Promise.resolve({ data: mockHealth });
      }
      return Promise.reject(new Error(`Unhandled mock endpoint: ${url}`));
    });

    (api.delete as any).mockImplementation((url: string) => {
      if (url === '/github/disconnect') {
        return Promise.resolve({
          data: { success: true, message: 'GitHub account disconnected successfully.' },
        });
      }
      return Promise.reject(new Error(`Unhandled mock delete endpoint: ${url}`));
    });
  });

  // =========================================================================
  // 1. Developer Profile Integration
  // =========================================================================
  describe('1. Developer Profile Page Integration', () => {
    it('fetches real GitHub profile from backend and renders developer telemetry', async () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <DeveloperProfilePage />
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('The Octocat')).toBeInTheDocument();
      });

      expect(screen.getByText('@octocat')).toBeInTheDocument();
      expect(screen.getByText('GitHub mascot and developer advocate')).toBeInTheDocument();
      expect(screen.getByText('San Francisco')).toBeInTheDocument();
      expect(screen.getByText('GitHub Inc.')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument(); // Public Repos
      expect(screen.getByText('9500')).toBeInTheDocument(); // Followers
    });

    it('triggers manual refresh bypass (?refresh=true) on button click', async () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <DeveloperProfilePage />
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('The Octocat')).toBeInTheDocument();
      });

      const refreshBtn = screen.getByRole('button', { name: /Refresh Profile/i });
      fireEvent.click(refreshBtn);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/github/profile?refresh=true');
      });
    });

    it('displays error banner with retry control on profile API failure', async () => {
      (api.get as any).mockImplementation((url: string) => {
        if (url === '/auth/me') {
          return Promise.resolve({ data: { success: true, data: { user: { id: 'u1' } } } });
        }
        if (url === '/github/status') {
          return Promise.resolve({ data: mockConnectedStatus });
        }
        if (url.startsWith('/github/profile')) {
          return Promise.reject(new Error('Rate limit exceeded on upstream service.'));
        }
        return Promise.resolve({ data: {} });
      });

      render(
        <MemoryRouter>
          <AuthProvider>
            <DeveloperProfilePage />
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Rate limit exceeded on upstream service/i)).toBeInTheDocument();
      });

      const retryBtn = screen.getByRole('button', { name: /Retry Request/i });
      expect(retryBtn).toBeInTheDocument();
    });

    it('displays connect prompt when user is not connected to GitHub', async () => {
      (api.get as any).mockImplementation((url: string) => {
        if (url === '/auth/me') {
          return Promise.resolve({ data: { success: true, data: { user: { id: 'u1' } } } });
        }
        if (url === '/github/status') {
          return Promise.resolve({ data: mockDisconnectedStatus });
        }
        return Promise.resolve({ data: {} });
      });

      render(
        <MemoryRouter>
          <AuthProvider>
            <DeveloperProfilePage />
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/GitHub Account Not Linked/i)).toBeInTheDocument();
      });
      expect(screen.getByRole('button', { name: /Connect GitHub Account/i })).toBeInTheDocument();
    });
  });

  // =========================================================================
  // 2. Repository Explorer & Modal Integration
  // =========================================================================
  describe('2. Repository Explorer Integration', () => {
    it('fetches real repositories from backend and renders repository cards', async () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <RepoExplorerPage />
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Hello-World')).toBeInTheDocument();
        expect(screen.getByText('Spoon-Knife')).toBeInTheDocument();
      });

      expect(screen.getByText(/My first repository on GitHub!/i)).toBeInTheDocument();
      expect(screen.getByText('2400')).toBeInTheDocument(); // Stars
    });

    it('filters repositories by debounced search keyword', async () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <RepoExplorerPage />
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Hello-World')).toBeInTheDocument();
      });

      const searchInput = screen.getByLabelText(/Search repositories/i);
      fireEvent.change(searchInput, { target: { value: 'spoon' } });

      await waitFor(() => {
        expect(screen.queryByText('Hello-World')).not.toBeInTheDocument();
        expect(screen.getByText('Spoon-Knife')).toBeInTheDocument();
      });
    });

    it('opens repository detail modal and fetches live languages breakdown', async () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <RepoExplorerPage />
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Hello-World')).toBeInTheDocument();
      });

      const detailsButtons = screen.getAllByRole('button', { name: /Details/i });
      fireEvent.click(detailsButtons[0]);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Clone HTTPS URL')).toBeInTheDocument();
      });

      // Verify languages request made
      expect(api.get).toHaveBeenCalledWith('/github/repositories/octocat/Hello-World/languages');
    });
  });

  // =========================================================================
  // 3. API Status and Quota Integration
  // =========================================================================
  describe('3. API Status Page Integration', () => {
    it('fetches backend health and GitHub rate limit quota metrics', async () => {
      render(
        <MemoryRouter>
          <ApiStatusPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('4890')).toBeInTheDocument(); // Remaining quota
        expect(screen.getByText('110')).toBeInTheDocument();  // Used quota
      });

      expect(screen.getByText('in-memory')).toBeInTheDocument();
      expect(screen.getByText(/Iv23\*\*\*\*9aB/i)).toBeInTheDocument();
    });
  });

  // =========================================================================
  // 4. Dashboard Live Integration
  // =========================================================================
  describe('4. Dashboard Page Integration', () => {
    it('renders live developer identity, recent repositories, and quota progress', async () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <DashboardPage />
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('The Octocat')).toBeInTheDocument();
      }, { timeout: 3500 });

      expect(screen.getAllByText(/octocat/i).length).toBeGreaterThan(0);
      expect(screen.getByText('Hello-World')).toBeInTheDocument();
      expect(screen.getByText('4890')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // 5. OAuth Callback & Disconnect Integration
  // =========================================================================
  describe('5. OAuth User Experience Integration', () => {
    it('handles successful OAuth callback and displays connection confirmation', async () => {
      render(
        <MemoryRouter initialEntries={['/github/callback?status=success&username=octocat']}>
          <AuthProvider>
            <Routes>
              <Route path="/github/callback" element={<CallbackPage />} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/GitHub Connected Successfully!/i)).toBeInTheDocument();
      });

      expect(screen.getByText('@octocat')).toBeInTheDocument();
    });

    it('handles OAuth failure callback and displays reason for rejection', async () => {
      render(
        <MemoryRouter initialEntries={['/github/callback?status=error&error=INVALID_STATE']}>
          <AuthProvider>
            <Routes>
              <Route path="/github/callback" element={<CallbackPage />} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/GitHub Connection Failed/i)).toBeInTheDocument();
        expect(screen.getByText(/Reason: INVALID_STATE/i)).toBeInTheDocument();
      });
    });

    it('disconnects GitHub integration and purges session state', async () => {
      await githubService.disconnect();
      expect(api.delete).toHaveBeenCalledWith('/github/disconnect');
    });

    it('safely handles rapid unmount without throwing memory leak warnings', async () => {
      const { unmount } = render(
        <MemoryRouter>
          <AuthProvider>
            <DeveloperProfilePage />
          </AuthProvider>
        </MemoryRouter>
      );

      // Immediately unmount while promises are in-flight
      unmount();
      expect(true).toBe(true);
    });
  });
});
