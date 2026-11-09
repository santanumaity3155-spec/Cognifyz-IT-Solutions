import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import GitHubProfileCard from '../components/github/GitHubProfileCard.tsx';
import LanguageBreakdown, { formatBytes } from '../components/github/LanguageBreakdown.tsx';
import RepoCard from '../components/github/RepoCard.tsx';
import RepoDetailModal from '../components/github/RepoDetailModal.tsx';
import RepoFilterBar from '../components/github/RepoFilterBar.tsx';
import { GitHubProfile, GitHubRepo, LanguageBreakdownData } from '../types/index.ts';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

describe('Phase 9: GitHub Developer Intelligence Dashboard Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // 1. GitHubProfileCard Tests
  // =========================================================================
  describe('1. GitHubProfileCard', () => {
    const mockProfile: GitHubProfile = {
      id: 12345,
      login: 'alex-developer',
      name: 'Alex Rivera',
      avatarUrl: 'https://avatars.githubusercontent.com/u/12345?v=4',
      profileUrl: 'https://github.com/alex-developer',
      bio: 'Full Stack Engineer & Cloud Architecture Enthusiast',
      company: 'Forma Inc.',
      location: 'San Francisco, CA',
      blog: 'https://alexrivera.dev',
      twitterUsername: 'alex_codes',
      publicRepos: 42,
      publicGists: 5,
      followers: 128,
      following: 64,
      createdAt: '2022-04-15T10:00:00Z',
      updatedAt: '2026-10-01T12:00:00Z',
    };

    it('renders a valid profile with all attributes and numerical metrics', () => {
      render(<GitHubProfileCard profile={mockProfile} />);

      expect(screen.getByText('Alex Rivera')).toBeInTheDocument();
      expect(screen.getByText('@alex-developer')).toBeInTheDocument();
      expect(screen.getByText(/Full Stack Engineer/i)).toBeInTheDocument();
      expect(screen.getByText('Forma Inc.')).toBeInTheDocument();
      expect(screen.getByText('San Francisco, CA')).toBeInTheDocument();
      expect(screen.getByText('alexrivera.dev')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText('128')).toBeInTheDocument();
      expect(screen.getByText('64')).toBeInTheDocument();
      expect(screen.getByText(/Member since Apr 2022/i)).toBeInTheDocument();
    });

    it('handles missing optional fields (bio, company, location, blog) gracefully', () => {
      const minimalProfile: GitHubProfile = {
        ...mockProfile,
        name: '',
        bio: null,
        company: null,
        location: null,
        blog: null,
        twitterUsername: null,
      };

      render(<GitHubProfileCard profile={minimalProfile} />);

      // Uses login when name is blank
      expect(screen.getByText('alex-developer')).toBeInTheDocument();
      expect(screen.queryByText('Forma Inc.')).not.toBeInTheDocument();
      expect(screen.queryByText('San Francisco, CA')).not.toBeInTheDocument();
    });

    it('renders fallback avatar when avatarUrl is missing or fails to load', () => {
      const noAvatarProfile: GitHubProfile = {
        ...mockProfile,
        avatarUrl: '',
      };

      render(<GitHubProfileCard profile={noAvatarProfile} />);
      expect(screen.getByText('AL')).toBeInTheDocument(); // Initial letters of login
    });

    it('renders external GitHub profile link with secure attributes', () => {
      render(<GitHubProfileCard profile={mockProfile} />);

      const links = screen.getAllByRole('link', { name: /GitHub Profile/i });
      expect(links.length).toBeGreaterThan(0);
      expect(links[0]).toHaveAttribute('href', 'https://github.com/alex-developer');
      expect(links[0]).toHaveAttribute('target', '_blank');
      expect(links[0]).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('renders loading skeleton state when isLoading is true', () => {
      const { container } = render(<GitHubProfileCard profile={mockProfile} isLoading={true} />);
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
      expect(screen.queryByText('Alex Rivera')).not.toBeInTheDocument();
    });

    it('renders empty placeholder when profile is null', () => {
      render(<GitHubProfileCard profile={null} />);
      expect(screen.getByText('No Profile Data Available')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // 2. LanguageBreakdown Tests
  // =========================================================================
  describe('2. LanguageBreakdown', () => {
    const mockLanguagesData: LanguageBreakdownData = {
      totalBytes: 100000,
      languages: [
        { language: 'TypeScript', bytes: 60000, percentage: 60.0 },
        { language: 'JavaScript', bytes: 25000, percentage: 25.0 },
        { language: 'HTML', bytes: 10000, percentage: 10.0 },
        { language: 'CSS', bytes: 5000, percentage: 5.0 },
      ],
    };

    it('renders multiple languages with names, byte tallies, and percentages', () => {
      render(<LanguageBreakdown data={mockLanguagesData} />);

      expect(screen.getByText('TypeScript')).toBeInTheDocument();
      expect(screen.getByText('60%')).toBeInTheDocument();
      expect(screen.getByText('JavaScript')).toBeInTheDocument();
      expect(screen.getByText('25%')).toBeInTheDocument();
      expect(screen.getByText('HTML')).toBeInTheDocument();
      expect(screen.getByText('10%')).toBeInTheDocument();
      expect(screen.getByText('CSS')).toBeInTheDocument();
      expect(screen.getByText('5%')).toBeInTheDocument();
    });

    it('renders horizontal progress bar with accessible role and aria attributes', () => {
      render(<LanguageBreakdown data={mockLanguagesData} />);

      const progressBar = screen.getByRole('progressbar', { name: /Language distribution bar/i });
      expect(progressBar).toBeInTheDocument();
    });

    it('handles empty language array safely without crashing', () => {
      render(<LanguageBreakdown data={{ totalBytes: 0, languages: [] }} />);
      expect(screen.getByText('No Language Telemetry Available')).toBeInTheDocument();
    });

    it('handles zero total bytes and prevents division-by-zero errors', () => {
      render(
        <LanguageBreakdown
          data={{
            totalBytes: 0,
            languages: [{ language: 'Python', bytes: 0, percentage: 0 }],
          }}
        />
      );
      expect(screen.getByText('No Language Telemetry Available')).toBeInTheDocument();
    });

    it('formats bytes correctly using formatBytes helper', () => {
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(512)).toBe('512 B');
      expect(formatBytes(2048)).toBe('2.0 KB');
      expect(formatBytes(1048576)).toBe('1.0 MB');
    });

    it('renders loading skeleton state when isLoading is true', () => {
      const { container } = render(
        <LanguageBreakdown data={mockLanguagesData} isLoading={true} />
      );
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
      expect(screen.queryByText('TypeScript')).not.toBeInTheDocument();
    });
  });

  // =========================================================================
  // 3. RepoCard Tests
  // =========================================================================
  describe('3. RepoCard', () => {
    const mockRepo: GitHubRepo = {
      id: 987654,
      name: 'forma-student-intelligence',
      fullName: 'alex-developer/forma-student-intelligence',
      description: 'An advanced cognitive platform for academic analytics.',
      htmlUrl: 'https://github.com/alex-developer/forma-student-intelligence',
      cloneUrl: 'https://github.com/alex-developer/forma-student-intelligence.git',
      language: 'TypeScript',
      starsCount: 88,
      forksCount: 14,
      openIssuesCount: 3,
      watchersCount: 88,
      isPrivate: false,
      isFork: false,
      defaultBranch: 'main',
      topics: ['react', 'typescript', 'analytics', 'dashboard'],
      license: {
        key: 'mit',
        name: 'MIT License',
        spdxId: 'MIT',
      },
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2026-10-15T00:00:00Z',
      pushedAt: '2026-10-15T00:00:00Z',
    };

    it('renders complete repository with all attributes and metrics', () => {
      render(<RepoCard repo={mockRepo} />);

      expect(screen.getByText('forma-student-intelligence')).toBeInTheDocument();
      expect(screen.getByText(/An advanced cognitive platform/i)).toBeInTheDocument();
      expect(screen.getByText('TypeScript')).toBeInTheDocument();
      expect(screen.getByText('88')).toBeInTheDocument();
      expect(screen.getByText('14')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('MIT')).toBeInTheDocument();
      expect(screen.getByText('#react')).toBeInTheDocument();
      expect(screen.getByText('#typescript')).toBeInTheDocument();
      expect(screen.getByText('Public')).toBeInTheDocument();
    });

    it('handles missing description with safe italic placeholder', () => {
      const noDescRepo: GitHubRepo = {
        ...mockRepo,
        description: null,
      };

      render(<RepoCard repo={noDescRepo} />);
      expect(screen.getByText(/No repository description provided/i)).toBeInTheDocument();
    });

    it('handles missing language with Markdown / Assets fallback', () => {
      const noLangRepo: GitHubRepo = {
        ...mockRepo,
        language: null,
      };

      render(<RepoCard repo={noLangRepo} />);
      expect(screen.getByText('Markdown / Assets')).toBeInTheDocument();
    });

    it('handles missing license without crashing', () => {
      const noLicenseRepo: GitHubRepo = {
        ...mockRepo,
        license: null,
      };

      render(<RepoCard repo={noLicenseRepo} />);
      expect(screen.queryByText('MIT')).not.toBeInTheDocument();
    });

    it('fires onViewDetails callback when Details button is clicked', () => {
      const handleDetails = vi.fn();
      render(<RepoCard repo={mockRepo} onViewDetails={handleDetails} />);

      const detailsBtn = screen.getByRole('button', { name: /Details/i });
      fireEvent.click(detailsBtn);
      expect(handleDetails).toHaveBeenCalledTimes(1);
      expect(handleDetails).toHaveBeenCalledWith(mockRepo);
    });

    it('renders external link to GitHub repository with correct href', () => {
      render(<RepoCard repo={mockRepo} />);

      const externalLink = screen.getByTitle(/Open repository on GitHub/i);
      expect(externalLink).toHaveAttribute(
        'href',
        'https://github.com/alex-developer/forma-student-intelligence'
      );
    });
  });

  // =========================================================================
  // 4. RepoDetailModal Tests
  // =========================================================================
  describe('4. RepoDetailModal', () => {
    const mockRepo: GitHubRepo = {
      id: 987654,
      name: 'forma-student-intelligence',
      fullName: 'alex-developer/forma-student-intelligence',
      description: 'An advanced cognitive platform for academic analytics.',
      htmlUrl: 'https://github.com/alex-developer/forma-student-intelligence',
      cloneUrl: 'https://github.com/alex-developer/forma-student-intelligence.git',
      language: 'TypeScript',
      starsCount: 88,
      forksCount: 14,
      openIssuesCount: 3,
      watchersCount: 88,
      isPrivate: false,
      isFork: false,
      defaultBranch: 'main',
      topics: ['react', 'typescript'],
      license: {
        key: 'mit',
        name: 'MIT License',
        spdxId: 'MIT',
      },
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2026-10-15T00:00:00Z',
      pushedAt: '2026-10-15T00:00:00Z',
    };

    it('renders modal dialog when isOpen is true', () => {
      render(<RepoDetailModal isOpen={true} repo={mockRepo} onClose={vi.fn()} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('forma-student-intelligence')).toBeInTheDocument();
      expect(screen.getByText('Default Branch')).toBeInTheDocument();
      expect(screen.getByText('main')).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockRepo.cloneUrl)).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(<RepoDetailModal isOpen={false} repo={mockRepo} onClose={vi.fn()} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('fires onClose when escape key is pressed', () => {
      const handleClose = vi.fn();
      render(<RepoDetailModal isOpen={true} repo={mockRepo} onClose={handleClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('fires onClose when close button is clicked', () => {
      const handleClose = vi.fn();
      render(<RepoDetailModal isOpen={true} repo={mockRepo} onClose={handleClose} />);

      const closeBtn = screen.getByLabelText(/Close repository details dialog/i);
      fireEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('copies clone URL to clipboard when Copy button is clicked', async () => {
      render(<RepoDetailModal isOpen={true} repo={mockRepo} onClose={vi.fn()} />);

      const copyBtn = screen.getByRole('button', { name: /Copy/i });
      await act(async () => {
        fireEvent.click(copyBtn);
      });
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockRepo.cloneUrl);
    });
  });

  // =========================================================================
  // 5. RepoFilterBar Tests
  // =========================================================================
  describe('5. RepoFilterBar', () => {
    const defaultProps = {
      search: '',
      onSearchChange: vi.fn(),
      language: '',
      onLanguageChange: vi.fn(),
      availableLanguages: ['TypeScript', 'JavaScript', 'Python'],
      sortBy: 'updated' as const,
      onSortByChange: vi.fn(),
      sortDirection: 'desc' as const,
      onSortDirectionToggle: vi.fn(),
      onClearFilters: vi.fn(),
      totalResults: 15,
    };

    it('renders search input and responds to user typing', () => {
      render(<RepoFilterBar {...defaultProps} />);

      const input = screen.getByLabelText(/Search repositories/i);
      expect(input).toBeInTheDocument();

      fireEvent.change(input, { target: { value: 'forma' } });
      expect(defaultProps.onSearchChange).toHaveBeenCalledWith('forma');
    });

    it('renders language selector and triggers callback on change', () => {
      render(<RepoFilterBar {...defaultProps} />);

      const select = screen.getByLabelText(/Filter by programming language/i);
      expect(select).toBeInTheDocument();

      fireEvent.change(select, { target: { value: 'TypeScript' } });
      expect(defaultProps.onLanguageChange).toHaveBeenCalledWith('TypeScript');
    });

    it('renders sort criteria selector and triggers callback on change', () => {
      render(<RepoFilterBar {...defaultProps} />);

      const select = screen.getByLabelText(/Sort repositories by criteria/i);
      expect(select).toBeInTheDocument();

      fireEvent.change(select, { target: { value: 'stars' } });
      expect(defaultProps.onSortByChange).toHaveBeenCalledWith('stars');
    });

    it('toggles sort direction when direction button is clicked', () => {
      render(<RepoFilterBar {...defaultProps} />);

      const toggleBtn = screen.getByRole('button', { name: /Sort order/i });
      fireEvent.click(toggleBtn);
      expect(defaultProps.onSortDirectionToggle).toHaveBeenCalledTimes(1);
    });

    it('renders clear filters button when active filters exist and triggers callback', () => {
      render(<RepoFilterBar {...defaultProps} search="forma" />);

      const resetBtn = screen.getByRole('button', { name: /Reset/i });
      expect(resetBtn).toBeInTheDocument();

      fireEvent.click(resetBtn);
      expect(defaultProps.onClearFilters).toHaveBeenCalledTimes(1);
    });
  });
});
