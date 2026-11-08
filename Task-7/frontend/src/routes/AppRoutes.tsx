import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout.tsx';
import LandingPage from '../pages/LandingPage.tsx';
import DashboardPage from '../pages/DashboardPage.tsx';
import DeveloperProfilePage from '../pages/DeveloperProfilePage.tsx';
import RepoExplorerPage from '../pages/RepoExplorerPage.tsx';
import ApiStatusPage from '../pages/ApiStatusPage.tsx';
import SettingsPage from '../pages/SettingsPage.tsx';
import CallbackPage from '../pages/CallbackPage.tsx';
import LoginPage from '../pages/LoginPage.tsx';
import RegisterPage from '../pages/RegisterPage.tsx';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Landing & Auth Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/github/callback" element={<CallbackPage />} />

      {/* Main Dashboard Application Shell */}
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/github/profile" element={<DeveloperProfilePage />} />
        <Route path="/github/repositories" element={<RepoExplorerPage />} />
        <Route path="/api-status" element={<ApiStatusPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Fallback Catch-all Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
