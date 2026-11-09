import axios from 'axios';
import type {
  SystemHealth,
  MiddlewareTelemetryData,
  BackgroundJob,
  QueueDiagnostics,
  CacheStats,
  BenchmarkResult,
} from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5002/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor to capture server timing and request IDs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error.response?.data?.error || error);
  }
);

export const fetchHealth = async (): Promise<SystemHealth> => {
  const res = await api.get<{ success: boolean; data: SystemHealth }>('/health');
  return res.data.data;
};

export const fetchReadiness = async () => {
  const res = await api.get('/health/ready');
  return res.data;
};

// Middleware & Telemetry API
export const fetchMiddlewareTelemetry = async (): Promise<MiddlewareTelemetryData> => {
  const res = await api.get<{ success: boolean; data: MiddlewareTelemetryData }>('/middleware/metrics');
  return res.data.data;
};

export const clearMiddlewareTelemetry = async () => {
  const res = await api.delete('/middleware/metrics');
  return res.data;
};

export const testEchoEndpoint = async (payload: any) => {
  const res = await api.post('/middleware/echo', payload);
  return {
    data: res.data,
    headers: {
      requestId: res.headers['x-request-id'],
      responseTime: res.headers['x-response-time'],
    },
  };
};

export const testSimulateError = async (type: string) => {
  const res = await api.get(`/middleware/simulate-error?type=${type}`);
  return res.data;
};

// Background Jobs API
export const fetchQueueStats = async (): Promise<QueueDiagnostics> => {
  const res = await api.get<{ success: boolean; data: QueueDiagnostics }>('/jobs/stats/summary');
  return res.data.data;
};

export const fetchJobs = async (params: { page?: number; limit?: number; queueName?: string; status?: string } = {}) => {
  const res = await api.get<{ success: boolean; data: { jobs: BackgroundJob[]; pagination: any } }>('/jobs', {
    params,
  });
  return res.data.data;
};

export const fetchJobById = async (jobId: string): Promise<BackgroundJob> => {
  const res = await api.get<{ success: boolean; data: BackgroundJob }>(`/jobs/${jobId}`);
  return res.data.data;
};

export const fetchJobResult = async (jobId: string) => {
  const res = await api.get(`/jobs/${jobId}/result`);
  return res.data.data;
};

export const enqueueEmailJob = async (payload: any) => {
  const res = await api.post('/jobs/email', payload);
  return res.data;
};

export const enqueueReportJob = async (payload: any) => {
  const res = await api.post('/jobs/report', payload);
  return res.data;
};

export const enqueueAnalyticsJob = async (payload: any) => {
  const res = await api.post('/jobs/analytics', payload);
  return res.data;
};

export const enqueueMaintenanceJob = async (payload: any) => {
  const res = await api.post('/jobs/maintenance', payload);
  return res.data;
};

export const retryJob = async (jobId: string) => {
  const res = await api.post(`/jobs/${jobId}/retry`);
  return res.data;
};

export const deleteJob = async (jobId: string) => {
  const res = await api.delete(`/jobs/${jobId}`);
  return res.data;
};

// Caching API
export const fetchCacheStats = async (): Promise<CacheStats> => {
  const res = await api.get<{ success: boolean; data: CacheStats }>('/cache/stats');
  return res.data.data;
};

export const purgeCache = async (pattern?: string) => {
  const res = await api.post('/cache/purge', { pattern });
  return res.data;
};

export const deleteCacheKey = async (key: string) => {
  const res = await api.delete(`/cache/key/${encodeURIComponent(key)}`);
  return res.data;
};

export const fetchDemoStats = async (bypass = false) => {
  const start = performance.now();
  const res = await api.get('/cache/demo/stats', {
    headers: bypass ? { 'X-Cache-Bypass': 'true' } : {},
  });
  const clientLatencyMs = Math.round(performance.now() - start);

  return {
    data: res.data.data,
    cacheHeader: res.headers['x-cache'] || 'UNKNOWN',
    cacheTtl: res.headers['x-cache-ttl'] || null,
    responseTimeHeader: res.headers['x-response-time'] || 'N/A',
    clientLatencyMs,
  };
};

export const fetchHeavyAnalytics = async (bypass = false) => {
  const start = performance.now();
  const res = await api.get('/cache/demo/heavy-analytics', {
    headers: bypass ? { 'X-Cache-Bypass': 'true' } : {},
  });
  const clientLatencyMs = Math.round(performance.now() - start);

  return {
    data: res.data.data,
    cacheHeader: res.headers['x-cache'] || 'UNKNOWN',
    cacheTtl: res.headers['x-cache-ttl'] || null,
    responseTimeHeader: res.headers['x-response-time'] || 'N/A',
    clientLatencyMs,
  };
};

export const executeBenchmark = async (): Promise<BenchmarkResult> => {
  const res = await api.post<{ success: boolean; data: BenchmarkResult }>('/cache/benchmark');
  return res.data.data;
};

export default api;

