import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';
import { MainLayout } from '../layouts/MainLayout';
import { LandingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { UnauthorizedPage } from '../pages/auth/UnauthorizedPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { ProfilePage } from '../pages/profile/ProfilePage';
import { StudentsPage } from '../pages/students/StudentsPage';
import { StudentDetailPage } from '../pages/students/StudentDetailPage';
import { AddStudentPage } from '../pages/students/AddStudentPage';
import { EditStudentPage } from '../pages/students/EditStudentPage';

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Guest-only routes: redirect to /dashboard if already authenticated */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />

          {/* Forbidden / Access Denied */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Protected Application Routes wrapped with Main Layout */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/students/new" element={<AddStudentPage />} />
            <Route path="/students/:id" element={<StudentDetailPage />} />
            <Route path="/students/:id/edit" element={<EditStudentPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default AppRoutes;
