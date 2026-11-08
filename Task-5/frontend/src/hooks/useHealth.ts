import { useState, useEffect, useCallback } from 'react';
import { dashboardService, HealthStatus } from '../services/dashboardService';
import { ApiError } from '../services/api';

interface UseHealthResult {
  health: HealthStatus | null;
  isOnline: boolean;
  isLoading: boolean;
  error: ApiError | null;
  checkHealth: () => Promise<void>;
}

/**
 * Custom hook to verify backend server connectivity and storage mode
 */
export const useHealth = (): UseHealthResult => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<ApiError | null>(null);

  const checkHealth = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await dashboardService.getHealthStatus();
      setHealth(data);
      setIsOnline(data.success === true);
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : new ApiError('Backend server unreachable');
      setError(apiErr);
      setIsOnline(false);
      setHealth(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return {
    health,
    isOnline,
    isLoading,
    error,
    checkHealth,
  };
};

