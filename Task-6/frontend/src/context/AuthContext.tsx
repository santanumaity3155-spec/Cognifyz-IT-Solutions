import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import authService, { UserProfile } from '../services/authService';

export interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isStudent: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  /**
   * Hydrate session on application mount via GET /api/auth/me
   * Uses HTTP-only cookie automatically managed by the browser.
   */
  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authService.getMe();
      if (res.success && res.data?.user) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch {
      // 401 or network failure - user session is inactive or expired
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  /**
   * Log into account: sets HTTP-only cookie and updates user state
   */
  const login = useCallback(async (credentials: { email: string; password: string }) => {
    setLoading(true);
    try {
      const res = await authService.login(credentials);
      if (res.success && res.data?.user) {
        setUser(res.data.user);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Register new student account: sets HTTP-only cookie and updates user state
   */
  const register = useCallback(async (data: { name: string; email: string; password: string }) => {
    setLoading(true);
    try {
      const res = await authService.register(data);
      if (res.success && res.data?.user) {
        setUser(res.data.user);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Log out: instructs backend to clear cookie, then resets local state
   */
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn('Logout API warning (clearing local state anyway):', err);
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'Admin',
      isStudent: user?.role === 'Student',
      login,
      register,
      logout,
      checkAuth,
    }),
    [user, loading, login, register, logout, checkAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;

