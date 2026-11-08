import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

/**
 * Standardized API Error format for the Forma frontend
 */
export class ApiError extends Error {
  status: number;
  code: string;
  errors?: Array<{ field: string; message: string }>;
  isNetworkError: boolean;

  constructor(
    message: string,
    status = 500,
    code = 'API_ERROR',
    errors?: Array<{ field: string; message: string }>,
    isNetworkError = false
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.errors = errors;
    this.isNetworkError = isNetworkError;
  }
}

/**
 * Centralized Axios instance
 */
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/**
 * Request Interceptor
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Development request logging
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor for Centralized Error Normalization
 */
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<{ success?: boolean; message?: string; error?: string; errors?: Array<{ field: string; message: string }> }>) => {
    // 1. Network Failure or Server Unreachable
    if (!error.response) {
      console.error('[API Network Error] Backend server appears offline or unreachable:', error.message);
      return Promise.reject(
        new ApiError(
          'Unable to connect to the Forma API server. Please ensure the backend is running on http://localhost:5000.',
          0,
          'NETWORK_UNAVAILABLE',
          undefined,
          true
        )
      );
    }

    const { status, data } = error.response;
    const errorMessage = data?.message || error.message || 'An unexpected API error occurred';
    const errorCode = data?.error || `HTTP_${status}`;
    const fieldErrors = data?.errors;

    // Log error in development
    if (import.meta.env.DEV) {
      console.warn(`[API Error ${status}] ${errorCode}: ${errorMessage}`, fieldErrors);
    }

    return Promise.reject(new ApiError(errorMessage, status, errorCode, fieldErrors, false));
  }
);

export default api;

