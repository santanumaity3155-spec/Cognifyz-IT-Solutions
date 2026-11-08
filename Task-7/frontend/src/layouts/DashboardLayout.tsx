import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar.tsx';
import Navbar from '../components/common/Navbar.tsx';

export const DashboardLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = (pathname: string) => {
    if (pathname.includes('/github/profile')) return 'Developer Profile';
    if (pathname.includes('/github/repositories')) return 'Repository Explorer';
    if (pathname.includes('/api-status')) return 'API Status & Quota';
    if (pathname.includes('/settings')) return 'Settings';
    return 'Developer Intelligence Dashboard';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Shell */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          title={getPageTitle(location.pathname)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

