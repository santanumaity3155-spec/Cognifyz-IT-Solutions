import api from './api.ts';
import { User } from '../types/index.ts';

export const authService = {
  async register(data: { name: string; email: string; password: string }): Promise<{ user: User }> {
    const res = await api.post('/auth/register', data);
    return res.data.data;
  },

  async login(credentials: { email: string; password: string }): Promise<{ user: User }> {
    const res = await api.post('/auth/login', credentials);
    return res.data.data;
  },

  async getMe(): Promise<{ user: User }> {
    const res = await api.get('/auth/me');
    return res.data.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },
};

export default authService;
