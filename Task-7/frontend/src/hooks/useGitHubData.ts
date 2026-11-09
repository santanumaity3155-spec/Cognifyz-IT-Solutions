import { useState, useEffect, useCallback, useRef } from 'react';
import githubService from '../services/githubService.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  GitHubProfile,
  GitHubRepo,
  GitHubRateLimit,
  PaginationMetadata,
  RepoQueryParams,
  LanguageBreakdownData,
} from '../types/index.ts';

/**
 * Custom hook to fetch and manage authenticated GitHub Developer Profile telemetry.
 */
export const useGitHubProfile = (options?: { autoFetch?: boolean }) => {
  const { githubStatus } = useAuth();
  const isConnected = Boolean(githubStatus?.connected);

  const [profile, setProfile] = useState<GitHubProfile | null>(null);
  const [rateLimit, setRateLimit] = useState<GitHubRateLimit | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [cachedAt, setCachedAt] = useState<string | null>(null);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchProfile = useCallback(
    async (opts?: { refresh?: boolean }) => {
      if (!isConnected) {
        setProfile(null);
        setError(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const res = await githubService.getProfile({ refresh: opts?.refresh });

        if (isMountedRef.current) {
          setProfile(res.profile);
          setRateLimit(res.rateLimit);
          setIsCached(Boolean(res.isCached));
          setCachedAt(res.cachedAt || null);
        }
      } catch (err: unknown) {
        if (isMountedRef.current) {
          const message =
            (err as any)?.response?.data?.message ||
            (err instanceof Error ? err.message : 'Failed to fetch GitHub profile telemetry.');
          setError(message);
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [isConnected]
  );

  const refresh = useCallback(() => fetchProfile({ refresh: true }), [fetchProfile]);

  useEffect(() => {
    if (options?.autoFetch !== false && isConnected) {
      fetchProfile();
    } else if (!isConnected) {
      setProfile(null);
    }
  }, [isConnected, fetchProfile, options?.autoFetch]);

  return {
    profile,
    rateLimit,
    loading,
    error,
    isCached,
    cachedAt,
    fetchProfile,
    refresh,
  };
};

/**
 * Custom hook to fetch and manage authenticated GitHub Repositories listing.
 */
export const useGitHubRepos = (
  initialParams?: RepoQueryParams,
  options?: { autoFetch?: boolean }
) => {
  const { githubStatus } = useAuth();
  const isConnected = Boolean(githubStatus?.connected);

  const [repositories, setRepositories] = useState<GitHubRepo[]>([]);
  const [pagination, setPagination] = useState<PaginationMetadata | null>(null);
  const [rateLimit, setRateLimit] = useState<GitHubRateLimit | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [cachedAt, setCachedAt] = useState<string | null>(null);

  const [params, setParams] = useState<RepoQueryParams>({
    page: 1,
    per_page: 10,
    sort: 'updated',
    direction: 'desc',
    ...initialParams,
  });

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchRepos = useCallback(
    async (opts?: { refresh?: boolean }) => {
      if (!isConnected) {
        setRepositories([]);
        setPagination(null);
        setError(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const res = await githubService.getRepositories(params, { refresh: opts?.refresh });

        if (isMountedRef.current) {
          setRepositories(res.repositories);
          setPagination(res.pagination);
          setRateLimit(res.rateLimit);
          setIsCached(Boolean(res.isCached));
          setCachedAt(res.cachedAt || null);
        }
      } catch (err: unknown) {
        if (isMountedRef.current) {
          const message =
            (err as any)?.response?.data?.message ||
            (err instanceof Error ? err.message : 'Failed to retrieve GitHub repositories.');
          setError(message);
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [isConnected, params]
  );

  const refresh = useCallback(() => fetchRepos({ refresh: true }), [fetchRepos]);

  useEffect(() => {
    if (options?.autoFetch !== false && isConnected) {
      fetchRepos();
    } else if (!isConnected) {
      setRepositories([]);
      setPagination(null);
    }
  }, [isConnected, fetchRepos, options?.autoFetch]);

  return {
    repositories,
    pagination,
    rateLimit,
    loading,
    error,
    isCached,
    cachedAt,
    params,
    setParams,
    fetchRepos,
    refresh,
  };
};

/**
 * Custom hook to load repository details and language distribution for the detail modal.
 */
export const useRepoDetails = () => {
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [languagesData, setLanguagesData] = useState<LanguageBreakdownData | null>(null);
  const [loading, setLoading] = useState(false);
  const [languagesLoading, setLanguagesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const openRepoDetails = useCallback(
    async (owner: string, repo: string, fallbackRepo?: GitHubRepo) => {
      setIsOpen(true);
      setError(null);
      if (fallbackRepo) {
        setSelectedRepo(fallbackRepo);
      }

      try {
        setLoading(true);
        setLanguagesLoading(true);

        // Fetch detailed repo metadata and languages concurrently
        const [detailsRes, languagesRes] = await Promise.allSettled([
          githubService.getRepositoryDetails(owner, repo),
          githubService.getRepositoryLanguages(owner, repo),
        ]);

        if (!isMountedRef.current) return;

        if (detailsRes.status === 'fulfilled') {
          setSelectedRepo(detailsRes.value.repository);
        } else if (!fallbackRepo) {
          setError(detailsRes.reason?.response?.data?.message || 'Failed to load repository details.');
        }

        if (languagesRes.status === 'fulfilled') {
          setLanguagesData({
            totalBytes: languagesRes.value.totalBytes,
            languages: languagesRes.value.languages,
          });
        } else {
          setLanguagesData(null);
        }
      } catch (err: unknown) {
        if (isMountedRef.current) {
          setError(err instanceof Error ? err.message : 'Unexpected error loading repository data.');
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          setLanguagesLoading(false);
        }
      }
    },
    []
  );

  const closeRepoDetails = useCallback(() => {
    setIsOpen(false);
    setSelectedRepo(null);
    setLanguagesData(null);
    setError(null);
  }, []);

  return {
    isOpen,
    selectedRepo,
    languagesData,
    loading,
    languagesLoading,
    error,
    openRepoDetails,
    closeRepoDetails,
  };
};

/**
 * Custom hook to monitor live GitHub REST API rate limits and quotas.
 */
export const useGitHubRateLimit = (options?: { autoFetch?: boolean }) => {
  const { githubStatus } = useAuth();
  const isConnected = Boolean(githubStatus?.connected);

  const [rateLimit, setRateLimit] = useState<GitHubRateLimit | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchRateLimit = useCallback(async () => {
    if (!isConnected) {
      setRateLimit(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await githubService.getRateLimit();
      if (isMountedRef.current) {
        setRateLimit(data);
      }
    } catch (err: unknown) {
      if (isMountedRef.current) {
        setError(
          (err as any)?.response?.data?.message ||
            (err instanceof Error ? err.message : 'Failed to retrieve rate limit.')
        );
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [isConnected]);

  useEffect(() => {
    if (options?.autoFetch !== false && isConnected) {
      fetchRateLimit();
    }
  }, [isConnected, fetchRateLimit, options?.autoFetch]);

  return {
    rateLimit,
    loading,
    error,
    fetchRateLimit,
  };
};

export default {
  useGitHubProfile,
  useGitHubRepos,
  useRepoDetails,
  useGitHubRateLimit,
};

