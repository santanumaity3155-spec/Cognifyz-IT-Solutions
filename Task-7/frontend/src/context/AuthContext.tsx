import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, GitHubStatus, AuthContextType } from '../types/index.ts';
import authService from '../services/authService.ts';
import githubService from '../services/githubService.ts';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [githubStatus, setGithubStatus] = useState<GitHubStatus | null>(null);
  const [githubLoading, setGithubLoading] = useState<boolean>(false);

  const refreshGitHubStatus = useCallback(async () => {
    try {
      setGithubLoading(true);
      const status = await githubService.getStatus();
      setGithubStatus(status);
    } catch {
      setGithubStatus({ connected: false, oauthConfigured: false });
    } finally {
      setGithubLoading(false);
    }
  }, []);

  const loadSession = useCallback(async () => {
    try {
      setLoading(true);
      const { user: profile } = await authService.getMe();
      setUser(profile);
      await refreshGitHubStatus();
    } catch {
      // Unauthenticated visitor
      setUser(null);
      setGithubStatus(null);
    } finally {
      setLoading(false);
    }
  }, [refreshGitHubStatus]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const login = async (credentials: { email: string; password: string }) => {
    const { user: loggedInUser } = await authService.login(credentials);
    setUser(loggedInUser);
    await refreshGitHubStatus();
  };

  const register = async (data: { name: string; email: string; password: string }) => {
    const { user: newUser } = await authService.register(data);
    setUser(newUser);
    await refreshGitHubStatus();
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setGithubStatus(null);
    }
  };

  const disconnectGitHub = async () => {
    await githubService.disconnect();
    setGithubStatus((prev) => (prev ? { ...prev, connected: false, username: undefined } : { connected: false }));
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    githubStatus,
    githubLoading,
    login,
    register,
    logout,
    refreshGitHubStatus,
    disconnectGitHub,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
