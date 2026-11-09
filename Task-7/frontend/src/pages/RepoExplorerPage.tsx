import React, { useState, useMemo, useEffect } from 'react';
import { FolderGit2, Github, RotateCcw, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useGitHubRepos, useRepoDetails } from '../hooks/useGitHubData.ts';
import Card from '../components/common/Card.tsx';
import Button from '../components/common/Button.tsx';
import Badge from '../components/common/Badge.tsx';
import EmptyState from '../components/common/EmptyState.tsx';
import Pagination from '../components/common/Pagination.tsx';
import ErrorAlert from '../components/common/ErrorAlert.tsx';
import LoadingState from '../components/common/LoadingState.tsx';
import githubService from '../services/githubService.ts';
import RepoFilterBar from '../components/github/RepoFilterBar.tsx';
import RepoCard from '../components/github/RepoCard.tsx';
import RepoDetailModal from '../components/github/RepoDetailModal.tsx';
import { GitHubRepo } from '../types/index.ts';

export const RepoExplorerPage: React.FC = () => {
  const { githubStatus } = useAuth();
  const isConnected = Boolean(githubStatus?.connected);

  // Filter State
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [sortBy, setSortBy] = useState<'updated' | 'stars' | 'forks' | 'name'>('updated');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Map UI sort choices to backend-supported sort params
  const backendSortParam = useMemo<'created' | 'updated' | 'pushed' | 'full_name'>(() => {
    switch (sortBy) {
      case 'name':
        return 'full_name';
      case 'updated':
      default:
        return 'updated';
    }
  }, [sortBy]);

  // Hook for repository list
  const {
    repositories,
    pagination,
    loading,
    error,
    isCached,
    cachedAt,
    params,
    setParams,
    refresh,
  } = useGitHubRepos(
    {
      page: 1,
      per_page: 20,
      sort: backendSortParam,
      direction: sortDirection,
    },
    { autoFetch: isConnected }
  );

  // Hook for repository details & languages modal
  const {
    isOpen,
    selectedRepo,
    languagesData,
    loading: detailsLoading,
    languagesLoading,
    openRepoDetails,
    closeRepoDetails,
  } = useRepoDetails();

  // Extract available distinct languages from loaded repositories
  const availableLanguages = useMemo(() => {
    const set = new Set<string>();
    repositories.forEach((repo) => {
      if (repo.language) set.add(repo.language);
    });
    return Array.from(set).sort();
  }, [repositories]);

  // Filter and sort repositories on the client side
  const filteredRepositories = useMemo(() => {
    let result = [...repositories];

    // Search filter: matching repo name, description, or topics
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      result = result.filter(
        (repo) =>
          repo.name.toLowerCase().includes(q) ||
          (repo.description && repo.description.toLowerCase().includes(q)) ||
          repo.topics?.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Language filter
    if (selectedLanguage) {
      result = result.filter(
        (repo) => repo.language?.toLowerCase() === selectedLanguage.toLowerCase()
      );
    }

    // Client-side sorting for stars / forks or name
    if (sortBy === 'stars') {
      result.sort((a, b) =>
        sortDirection === 'desc'
          ? b.starsCount - a.starsCount
          : a.starsCount - b.starsCount
      );
    } else if (sortBy === 'forks') {
      result.sort((a, b) =>
        sortDirection === 'desc'
          ? b.forksCount - a.forksCount
          : a.forksCount - b.forksCount
      );
    }

    return result;
  }, [repositories, debouncedSearch, selectedLanguage, sortBy, sortDirection]);

  // Clear filters handler
  const handleClearFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setSelectedLanguage('');
    setSortBy('updated');
    setSortDirection('desc');
    setParams((prev) => ({ ...prev, page: 1, sort: 'updated', direction: 'desc' }));
  };

  // Sort direction toggle handler
  const handleSortDirectionToggle = () => {
    const nextDir = sortDirection === 'desc' ? 'asc' : 'desc';
    setSortDirection(nextDir);
    setParams((prev) => ({ ...prev, direction: nextDir }));
  };

  // Sort criteria change handler
  const handleSortChange = (newSort: 'updated' | 'stars' | 'forks' | 'name') => {
    setSortBy(newSort);
    if (newSort === 'updated' || newSort === 'name') {
      setParams((prev) => ({
        ...prev,
        sort: newSort === 'name' ? 'full_name' : 'updated',
      }));
    }
  };

  // Page change handler
  const handlePageChange = (newPage: number) => {
    setParams((prev) => ({ ...prev, page: newPage }));
  };

  // Open modal with repository details
  const handleViewDetails = (repo: GitHubRepo) => {
    const owner = repo.fullName.split('/')[0] || githubStatus?.username || 'user';
    openRepoDetails(owner, repo.name, repo);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Repository Explorer</h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse public repositories, inspect star and fork velocity, and analyze language distributions.
          </p>
        </div>

        {isConnected && (
          <div className="flex items-center gap-2">
            {isCached && (
              <Badge variant="neutral" size="sm" dot>
                <Clock className="w-3 h-3 text-slate-400 mr-1" />
                Cached {cachedAt ? new Date(cachedAt).toLocaleTimeString() : 'Recently'}
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={refresh}
              isLoading={loading}
              title="Bypass server cache and fetch fresh repositories"
            >
              Refresh Repositories
            </Button>
          </div>
        )}
      </div>

      {error && (
        <ErrorAlert
          title="Repository Sync Error"
          message={error}
          onRetry={refresh}
        />
      )}

      {isConnected ? (
        <div className="space-y-6">
          {/* Controls: Search, Language Filter, Sorting */}
          <RepoFilterBar
            search={searchInput}
            onSearchChange={setSearchInput}
            language={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
            availableLanguages={availableLanguages}
            sortBy={sortBy}
            onSortByChange={handleSortChange}
            sortDirection={sortDirection}
            onSortDirectionToggle={handleSortDirectionToggle}
            onClearFilters={handleClearFilters}
            totalResults={filteredRepositories.length}
          />

          {/* Repository Cards Grid */}
          {loading && repositories.length === 0 ? (
            <div className="py-12">
              <LoadingState message="Fetching repositories from GitHub REST API..." />
            </div>
          ) : filteredRepositories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRepositories.map((repo) => (
                <RepoCard
                  key={repo.id}
                  repo={repo}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          ) : (
            <Card>
              <div className="py-8">
                <EmptyState
                  icon={<FolderGit2 className="w-10 h-10 text-slate-400" />}
                  title={
                    searchInput || selectedLanguage
                      ? 'No Matching Repositories'
                      : 'No Repositories Found'
                  }
                  message={
                    searchInput || selectedLanguage
                      ? 'No repositories match your active search criteria. Try resetting your search filters.'
                      : 'No public repositories were returned for this GitHub account.'
                  }
                  actionLabel={
                    searchInput || selectedLanguage ? 'Reset Filters' : 'Refresh Telemetry'
                  }
                  onAction={
                    searchInput || selectedLanguage ? handleClearFilters : refresh
                  }
                />
              </div>
            </Card>
          )}

          {/* Pagination */}
          {pagination && (pagination.hasNextPage || (params.page && params.page > 1)) && (
            <Pagination
              currentPage={pagination.page}
              perPage={pagination.perPage}
              hasNextPage={pagination.hasNextPage}
              onPageChange={handlePageChange}
            />
          )}

          {/* Detail Modal with Real Upstream Language Data */}
          <RepoDetailModal
            isOpen={isOpen}
            repo={selectedRepo}
            languagesData={languagesData}
            languagesLoading={detailsLoading || languagesLoading}
            onClose={closeRepoDetails}
          />
        </div>
      ) : (
        <Card>
          <div className="text-center py-12">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-4">
              <FolderGit2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Connect GitHub to Explore Repositories</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-6">
              Connect your GitHub account to access repository metadata, language breakdown bars, and star distributions.
            </p>
            <Button
              variant="primary"
              size="md"
              leftIcon={<Github className="w-4 h-4" />}
              onClick={() => {
                window.location.href = githubService.getConnectUrl();
              }}
            >
              Connect GitHub
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default RepoExplorerPage;
