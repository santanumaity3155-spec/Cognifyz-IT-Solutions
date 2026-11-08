import React, { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  Users, 
  User, 
  LogOut, 
  Loader2,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const MainLayout: React.FC = () => {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Auto-close mobile drawer on route navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
      isActive
        ? 'bg-brand-600 text-white shadow-md shadow-indigo-600/30'
        : 'text-slate-400 hover:text-white hover:bg-slate-800'
    }`;

  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
      isActive
        ? 'bg-brand-600 text-white shadow-md shadow-indigo-600/30'
        : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
    }`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-brand-500 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Desktop Navigation */}
          <div className="flex items-center space-x-8">
            <Link to="/dashboard" className="flex items-center space-x-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-xl">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-white">Forma</span>
                <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  Task 6
                </span>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <nav className="hidden md:flex items-center space-x-2" aria-label="Desktop primary navigation">
              <NavLink to="/dashboard" className={navLinkClass}>
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </NavLink>
              <NavLink to="/students" className={navLinkClass}>
                <Users className="w-4 h-4" />
                <span>Students</span>
              </NavLink>
              <NavLink to="/profile" className={navLinkClass}>
                <User className="w-4 h-4" />
                <span>Profile</span>
              </NavLink>
            </nav>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-white tracking-tight">{user.name}</span>
                  <div className="flex items-center justify-end space-x-1.5 mt-0.5">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        user.role === 'Admin'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-brand-500/10 text-brand-400 border-brand-500/20'
                      }`}
                    >
                      {user.role}
                    </span>
                    <span className="text-[10px] text-slate-500 truncate max-w-[140px]">{user.email}</span>
                  </div>
                </div>

                {/* Desktop Sign Out */}
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Sign out of Forma"
                  className="hidden md:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700/80 hover:border-rose-500/30 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <LogOut className="w-3.5 h-3.5" />
                  )}
                  <span>Sign Out</span>
                </button>

                {/* Mobile Menu Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  aria-label="Toggle navigation menu"
                  aria-expanded={isMobileMenuOpen}
                  className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Mobile Navigation Drawer / Panel */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800/80 bg-slate-900/95 backdrop-blur-lg px-4 pt-3 pb-4 space-y-3 animate-in slide-in-from-top-2">
            {/* User Info Card in Mobile Menu */}
            {user && (
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">{user.name}</p>
                  <p className="text-[11px] text-slate-400 truncate max-w-[200px]">{user.email}</p>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    user.role === 'Admin'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-brand-500/10 text-brand-400 border-brand-500/20'
                  }`}
                >
                  {user.role}
                </span>
              </div>
            )}

            {/* Navigation Links */}
            <nav className="space-y-1" aria-label="Mobile navigation">
              <NavLink to="/dashboard" className={mobileNavLinkClass}>
                <LayoutDashboard className="w-4 h-4 text-brand-400" />
                <span>Dashboard Overview</span>
              </NavLink>
              <NavLink to="/students" className={mobileNavLinkClass}>
                <Users className="w-4 h-4 text-brand-400" />
                <span>Student Directory</span>
              </NavLink>
              <NavLink to="/profile" className={mobileNavLinkClass}>
                <User className="w-4 h-4 text-brand-400" />
                <span>Profile &amp; Security</span>
              </NavLink>
            </nav>

            {/* Mobile Sign Out Button */}
            <div className="pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleLogout}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                <span>Sign Out of Forma</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Outlet */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 text-center text-xs text-slate-500">
        Cognifyz IT Solutions Internship • Level 3, Task 6 • Forma Platform
      </footer>
    </div>
  );
};

export default MainLayout;
