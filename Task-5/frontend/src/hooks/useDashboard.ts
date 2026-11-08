import { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '../services/dashboardService';
import { ApiError } from '../services/api';
import { DashboardStats } from '../types/student';

interface UseDashboardResult {
  stats: DashboardStats | null;
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to manage fetching and state for institutional dashboard metrics
 */
export const useDashboard = (): UseDashboardResult => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await dashboardService.getDashboardStats();
      setStats(response.data);
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : new ApiError('Failed to load dashboard statistics');
      setError(apiErr);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats,
  };
};

