import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { useAuth } from '../hooks/useAuth';
import { ProtectedRoute } from '../routes/ProtectedRoute';
import { PublicRoute } from '../routes/PublicRoute';
import { UnauthorizedPage } from '../pages/auth/UnauthorizedPage';
import { ProfilePage } from '../pages/profile/ProfilePage';
import authService, { UserProfile } from '../services/authService';

// Mock authService
vi.mock('../services/authService', () => ({
  default: {
    login: vi.fn(),
    register: vi.fn(),
    getMe: vi.fn(),
    logout: vi.fn(),
  },
}));

// Mock api service for Dashboard/stats calls
vi.mock('../services/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({
      data: {
        success: true,
        data: {
          totalStudents: 12,
          activeStudents: 10,
          pendingStudents: 2,
          graduatedStudents: 0,
          totalCourses: 4,
          scope: 'personal',
        },
      },
    }),
    post: vi.fn().mockResolvedValue({ data: { success: true } }),
  },
}));

const mockStudentUser: UserProfile = {
  id: 'usr_student_01',
  name: 'Alex Mercer',
  email: 'alex.mercer@forma.edu',
  role: 'Student',
  isActive: true,
  createdAt: '2026-03-01T10:00:00.000Z',
};

const mockAdminUser: UserProfile = {
  id: 'usr_admin_01',
  name: 'System Admin',
  email: 'admin@forma.edu',
  role: 'Admin',
  isActive: true,
  createdAt: '2026-01-01T08:00:00.000Z',
};

describe('Phase 10: Authentication Context and Protected Routing Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========================================================
  // 1. AUTH CONTEXT INITIALIZATION & SESSION PERSISTENCE
  // ========================================================
  describe('AuthContext Session Hydration', () => {
    it('1.1 hydrates active session on mount using GET /api/auth/me', async () => {
      vi.mocked(authService.getMe).mockResolvedValueOnce({
        success: true,
        data: { user: mockStudentUser },
      });

      const TestConsumer = () => {
        const { user, isAuthenticated, loading, isStudent } = useAuth();
        if (loading) return <div>Checking auth...</div>;
        return (
          <div>
            <span>User: {user?.name}</span>
            <span>Authenticated: {isAuthenticated ? 'YES' : 'NO'}</span>
            <span>Student Role: {isStudent ? 'YES' : 'NO'}</span>
          </div>
        );
      };

      render(
        <MemoryRouter>
          <AuthProvider>
            <TestConsumer />
          </AuthProvider>
        </MemoryRouter>
      );

      // Loading state initially shown
      expect(screen.getByText(/Checking auth.../i)).toBeInTheDocument();

      // Successfully hydrates user
      await waitFor(() => {
        expect(screen.getByText('User: Alex Mercer')).toBeInTheDocument();
        expect(screen.getByText('Authenticated: YES')).toBeInTheDocument();
        expect(screen.getByText('Student Role: YES')).toBeInTheDocument();
      });

      expect(authService.getMe).toHaveBeenCalledTimes(1);
    });

    it('1.2 sets user to null when getMe fails with 401 or network error', async () => {
      vi.mocked(authService.getMe).mockRejectedValueOnce(new Error('Unauthorized'));

      const TestConsumer = () => {
        const { isAuthenticated, loading } = useAuth();
        if (loading) return <div>Checking auth...</div>;
        return <div>Status: {isAuthenticated ? 'Logged In' : 'Logged Out'}</div>;
      };

      render(
        <MemoryRouter>
          <AuthProvider>
            <TestConsumer />
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Status: Logged Out')).toBeInTheDocument();
      });
    });
  });

  // ========================================================
  // 2. PROTECTED ROUTING & REDIRECTION
  // ========================================================
  describe('ProtectedRoute Component', () => {
    it('2.1 redirects unauthenticated user from protected route to /login', async () => {
      vi.mocked(authService.getMe).mockResolvedValueOnce({
        success: false,
        data: { user: null as unknown as UserProfile },
      });

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<div>LoginPage View</div>} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <div>Secret Dashboard</div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('LoginPage View')).toBeInTheDocument();
        expect(screen.queryByText('Secret Dashboard')).not.toBeInTheDocument();
      });
    });

    it('2.2 permits authenticated users to access protected routes', async () => {
      vi.mocked(authService.getMe).mockResolvedValueOnce({
        success: true,
        data: { user: mockStudentUser },
      });

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<div>LoginPage View</div>} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <div>Secret Dashboard</div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Secret Dashboard')).toBeInTheDocument();
        expect(screen.queryByText('LoginPage View')).not.toBeInTheDocument();
      });
    });

    it('2.3 redirects student away from admin-only routes to /unauthorized', async () => {
      vi.mocked(authService.getMe).mockResolvedValueOnce({
        success: true,
        data: { user: mockStudentUser },
      });

      render(
        <MemoryRouter initialEntries={['/admin/analytics']}>
          <AuthProvider>
            <Routes>
              <Route path="/unauthorized" element={<div>Forbidden View</div>} />
              <Route
                path="/admin/analytics"
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <div>Admin Analytics Only</div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Forbidden View')).toBeInTheDocument();
        expect(screen.queryByText('Admin Analytics Only')).not.toBeInTheDocument();
      });
    });

    it('2.4 permits admin users into admin-only routes', async () => {
      vi.mocked(authService.getMe).mockResolvedValueOnce({
        success: true,
        data: { user: mockAdminUser },
      });

      render(
        <MemoryRouter initialEntries={['/admin/analytics']}>
          <AuthProvider>
            <Routes>
              <Route path="/unauthorized" element={<div>Forbidden View</div>} />
              <Route
                path="/admin/analytics"
                element={
                  <ProtectedRoute allowedRoles={['Admin']}>
                    <div>Admin Analytics Only</div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Admin Analytics Only')).toBeInTheDocument();
        expect(screen.queryByText('Forbidden View')).not.toBeInTheDocument();
      });
    });
  });

  // ========================================================
  // 3. PUBLIC ROUTING & GUEST GUARD
  // ========================================================
  describe('PublicRoute Component', () => {
    it('3.1 allows unauthenticated guests to view login / register', async () => {
      vi.mocked(authService.getMe).mockResolvedValueOnce({
        success: false,
        data: { user: null as unknown as UserProfile },
      });

      render(
        <MemoryRouter initialEntries={['/login']}>
          <AuthProvider>
            <Routes>
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <div>Guest Login Page</div>
                  </PublicRoute>
                }
              />
              <Route path="/dashboard" element={<div>User Dashboard</div>} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Guest Login Page')).toBeInTheDocument();
      });
    });

    it('3.2 redirects already-authenticated users away from login to /dashboard', async () => {
      vi.mocked(authService.getMe).mockResolvedValueOnce({
        success: true,
        data: { user: mockStudentUser },
      });

      render(
        <MemoryRouter initialEntries={['/login']}>
          <AuthProvider>
            <Routes>
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <div>Guest Login Page</div>
                  </PublicRoute>
                }
              />
              <Route path="/dashboard" element={<div>User Dashboard</div>} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('User Dashboard')).toBeInTheDocument();
        expect(screen.queryByText('Guest Login Page')).not.toBeInTheDocument();
      });
    });
  });

  // ========================================================
  // 4. PROFILE PAGE & SESSION TERMINATION
  // ========================================================
  describe('ProfilePage Component', () => {
    it('4.1 renders authenticated user profile attributes', async () => {
      vi.mocked(authService.getMe).mockResolvedValueOnce({
        success: true,
        data: { user: mockStudentUser },
      });

      render(
        <MemoryRouter initialEntries={['/profile']}>
          <AuthProvider>
            <Routes>
              <Route path="/profile" element={<ProfilePage />} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Alex Mercer')).toBeInTheDocument();
        expect(screen.getByText('alex.mercer@forma.edu')).toBeInTheDocument();
        expect(screen.getByText('Student')).toBeInTheDocument();
        expect(screen.getByText('usr_student_01')).toBeInTheDocument();
        expect(screen.getByText('Account Active')).toBeInTheDocument();
        expect(screen.getByText('HTTP-Only Cookie Authenticated')).toBeInTheDocument();
      });
    });

    it('4.2 allows user to sign out and clears session via logout()', async () => {
      vi.mocked(authService.getMe).mockResolvedValueOnce({
        success: true,
        data: { user: mockStudentUser },
      });
      vi.mocked(authService.logout).mockResolvedValueOnce({
        success: true,
        message: 'Logged out successfully.',
      });

      render(
        <MemoryRouter initialEntries={['/profile']}>
          <AuthProvider>
            <Routes>
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/login" element={<div>Redirected to Login</div>} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Alex Mercer')).toBeInTheDocument();
      });

      const signOutBtn = screen.getByRole('button', { name: /Sign Out/i });
      fireEvent.click(signOutBtn);

      await waitFor(() => {
        expect(authService.logout).toHaveBeenCalledTimes(1);
        expect(screen.getByText('Redirected to Login')).toBeInTheDocument();
      });
    });
  });

  // ========================================================
  // 5. UNAUTHORIZED 403 PAGE
  // ========================================================
  describe('UnauthorizedPage Component', () => {
    it('5.1 renders 403 Forbidden message with role details', async () => {
      vi.mocked(authService.getMe).mockResolvedValueOnce({
        success: true,
        data: { user: mockStudentUser },
      });

      render(
        <MemoryRouter initialEntries={['/unauthorized']}>
          <AuthProvider>
            <Routes>
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
        expect(screen.getByText(/403 Forbidden/i)).toBeInTheDocument();
        expect(screen.getByText(/"Student"/i)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Return to Dashboard/i })).toBeInTheDocument();
      });
    });
  });
});
