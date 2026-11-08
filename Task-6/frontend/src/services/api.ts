import axios from 'axios';

/**
 * Base Axios instance configured for Forma Platform
 * withCredentials: true ensures that secure HTTP-only cookies (e.g. forma_token)
 * are sent with every cross-origin request.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  timeout: 10000,
});

// Request Interceptor: Attach bearer token if present in session memory
api.interceptors.request.use(
  (config) => {
    // Allows optional Bearer token header injection alongside HTTP-only cookies
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Standardize error extraction
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Structured error payload extraction
    const customMessage = error.response?.data?.message || error.message || 'An unexpected network error occurred';
    return Promise.reject(new Error(customMessage));
  }
);

export default api;

