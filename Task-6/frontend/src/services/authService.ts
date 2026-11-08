import api from './api';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Student';
  isActive: boolean;
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: UserProfile;
    token?: string;
  };
}

export const authService = {
  /**
   * Register a new Student account
   */
  async register(data: { name: string; email: string; password: string }): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/auth/register', data);
    return res.data;
  },

  /**
   * Log into account (sets HTTP-only cookie automatically via browser)
   */
  async login(credentials: { email: string; password: string }): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/auth/login', credentials);
    return res.data;
  },

  /**
   * Retrieve current user profile
   */
  async getMe(): Promise<{ success: boolean; data: { user: UserProfile } }> {
    const res = await api.get('/auth/me');
    return res.data;
  },

  /**
   * Invalidate session and clear HTTP-only cookie
   */
  async logout(): Promise<{ success: boolean; message: string }> {
    const res = await api.post('/auth/logout');
    return res.data;
  },
};

export default authService;

