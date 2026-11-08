import api from './api';
import { DashboardStats, ApiResponse } from '../types/student';

export interface HealthStatus {
  success: boolean;
  message: string;
  service: string;
  version: string;
  environment: string;
  uptime: string;
  timestamp: string;
  database: {
    mode: 'mongodb' | 'in-memory-fallback';
    isConnected: boolean;
    databaseName: string;
    statusMessage: string;
  };
}

/**
 * Service for fetching platform statistics and server health from Express backend
 */
export const dashboardService = {
  /**
   * GET /api/dashboard/stats
   * Fetch aggregated institutional metrics, course distribution, and recent registrations
   */
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    const response = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
    return response.data;
  },

  /**
   * GET /api/health
   * Inspect API server status, uptime, and database storage mode
   */
  async getHealthStatus(): Promise<HealthStatus> {
    const response = await api.get<HealthStatus>('/health');
    return response.data;
  },
};

