import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Standardize error message
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected network error occurred. Please try again.';

    const standardizedError = {
      status: error.response?.status || 500,
      code: error.response?.data?.error || 'NETWORK_ERROR',
      message,
      details: error.response?.data?.details || null,
      raw: error,
    };

    return Promise.reject(standardizedError);
  }
);

export default api;

