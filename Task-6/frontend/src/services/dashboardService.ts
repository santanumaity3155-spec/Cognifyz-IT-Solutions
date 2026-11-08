import api from './api';
import { DashboardStats, ApiResponse } from '../types/student';

export interface AdminOverviewData extends DashboardStats {
  audit?: {
    requestedBy: string;
    timestamp: string;
  };
}

export const dashboardService = {
  /**
   * GET /api/dashboard/stats
   * Retrieves dashboard metrics: scoped to personal records for Student, system-wide for Admin.
   */
  async getStats(): Promise<ApiResponse<DashboardStats>> {
    const response = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
    return response.data;
  },

  /**
   * GET /api/dashboard/admin-overview
   * Admin-only endpoint returning system-wide stats and audit telemetry.
   */
  async getAdminOverview(): Promise<ApiResponse<AdminOverviewData>> {
    const response = await api.get<ApiResponse<AdminOverviewData>>('/dashboard/admin-overview');
    return response.data;
  },
};

export default dashboardService;

