import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldCheck,
  Cpu,
  Layers,
  Activity,
  Server,
  RefreshCw,
  Database,
  CheckCircle2,
  AlertTriangle,
  Menu,
  X,
} from 'lucide-react';
import { fetchHealth } from '../services/api';
import type { SystemHealth } from '../types';

export const DashboardLayout: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const loadHealth = async () => {
    try {
      setIsRefreshing(true);
      const data = await fetchHealth();
      setHealth(data);
    } catch (err) {
      console.error('Failed to load system health:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadHealth();
    const interval = setInterval(loadHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { label: 'Overview', to: '/', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Middleware Inspector', to: '/middleware', icon: <ShieldCheck className="w-5 h-5" /> },
    { label: 'Background Jobs', to: '/jobs', icon: <Layers className="w-5 h-5" /> },
    { label: 'Cache & Performance', to: '/cache', icon: <Cpu className="w-5 h-5" /> },
    { label: 'System Health', to: '/health', icon: <Activity className="w-5 h-5" /> },
  ];

  const redisMode = health?.infrastructure.redis.mode === 'redis' ? 'Redis BullMQ' : 'In-Memory Fallback';
  const isRedisLive = health?.infrastructure.redis.isConnected;

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-800 bg-slate-900/90 backdrop-blur">
        <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/30">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white leading-tight">FORMA PLATFORM</h1>
            <p className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase">Level 4: Expert Task 8</p>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer Diagnostics */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="text-[11px] font-semibold uppercase text-slate-400 mb-2">Engine State</div>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-slate-400" />
                DB Mode
              </span>
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {health?.infrastructure.database.mode || 'fallback'}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-slate-400" />
                Queue Engine
              </span>
              <span
                className={`text-[11px] font-mono px-1.5 py-0.5 rounded border ${
                  isRedisLive
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}
              >
                {isRedisLive ? 'Redis' : 'Fallback'}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="text-sm font-semibold text-slate-200">
              {navItems.find((item) => item.to === location.pathname)?.label || 'Server Intelligence'}
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
              {isRedisLive ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>{redisMode}</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>API UP (Port 5002)</span>
            </div>

            <button
              onClick={loadHealth}
              disabled={isRefreshing}
              title="Refresh telemetry"
              className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          </div>
        </header>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-800 bg-slate-900 px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </div>
        )}

        {/* Page Content Scroll View */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-6 lg:p-8 bg-slate-950 min-w-0 max-w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

