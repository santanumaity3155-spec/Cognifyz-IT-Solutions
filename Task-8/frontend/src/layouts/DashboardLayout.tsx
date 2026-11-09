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
  Search,
  HelpCircle,
  Radio,
  Sliders,
  Zap,
} from 'lucide-react';
import { fetchHealth } from '../services/api';
import type { SystemHealth } from '../types';
import Modal from '../components/common/Modal';

export const DashboardLayout: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [apiError, setApiError] = useState(false);
  const location = useLocation();

  const loadHealth = async () => {
    try {
      setIsRefreshing(true);
      const data = await fetchHealth();
      setHealth(data);
      setApiError(false);
    } catch (err) {
      console.error('Failed to load system health:', err);
      setApiError(true);
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
    { label: 'Overview', to: '/', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Middleware Inspector', to: '/middleware', icon: <ShieldCheck className="w-4 h-4" /> },
    { label: 'Background Jobs', to: '/jobs', icon: <Layers className="w-4 h-4" /> },
    { label: 'Cache & Performance', to: '/cache', icon: <Cpu className="w-4 h-4" /> },
    { label: 'System Health', to: '/health', icon: <Activity className="w-4 h-4" /> },
  ];

  // Distinguish actual Redis live vs fallback mode
  const isRedisLive = Boolean(health?.infrastructure?.redis?.isConnected);
  const isMongoLive = Boolean(health?.infrastructure?.database?.isConnected);
  const isBackendHealthy = !apiError && health?.status === 'UP';

  // Status strings - preserves 'Redis BullMQ' for unit test compatibility when connected
  const redisStatusLabel = isRedisLive ? 'Redis BullMQ' : 'In-Memory Fallback';

  const getPageTitle = () => {
    const active = navItems.find((item) => item.to === location.pathname);
    return active?.label || 'Server Intelligence';
  };

  return (
    <div className="w-full h-screen min-h-[100dvh] flex overflow-hidden bg-[#1B2638] font-sans antialiased text-slate-100 m-0 p-0 border-0">
      {/* Primary Icon Rail */}
        <aside className="hidden lg:flex flex-col items-center justify-between w-[70px] bg-[#121B2A] border-r border-[#26374D] py-5 select-none flex-shrink-0">
          <div className="flex flex-col items-center gap-6">
            {/* Forma Logo Emblem */}
            <div
              title="Forma Platform Emblem"
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6257F5] to-[#5379F5] flex items-center justify-center text-white shadow-lg shadow-[#6257F5]/30 cursor-pointer transition hover:scale-105"
            >
              <Server className="w-5 h-5" />
            </div>

            {/* Navigation Icons */}
            <div className="flex flex-col items-center gap-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    title={item.label}
                    className={`relative w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                      isActive
                        ? 'bg-[#6257F5] text-white shadow-lg shadow-[#6257F5]/35'
                        : 'text-slate-400 hover:text-white hover:bg-[#1D2A3D]'
                    }`}
                  >
                    {item.icon}
                    {isActive && (
                      <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-full bg-[#A99CFB]" />
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>

          {/* Bottom Icons: Status & Dialogs */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => setHelpModalOpen(true)}
              title="Platform Architecture & Guide"
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#1D2A3D] transition"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSettingsModalOpen(true)}
              title="Runtime Diagnostics"
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#1D2A3D] transition"
            >
              <Sliders className="w-4 h-4" />
            </button>
            <div
              title={isBackendHealthy ? 'API Gateway Operational' : 'Backend Gateway Offline'}
              className="w-8 h-8 rounded-full flex items-center justify-center mt-1"
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isBackendHealthy ? 'bg-[#65DDA5] shadow-[0_0_10px_#65DDA5]' : 'bg-[#F16C80]'
                } animate-pulse`}
              />
            </div>
          </div>
        </aside>

        {/* Secondary Navigation Sidebar */}
        <aside className="hidden md:flex flex-col w-64 border-r border-[#26374D] bg-[#172235] flex-shrink-0 select-none">
          {/* Header Brand */}
          <div className="flex items-center gap-3 px-5 h-16 border-b border-[#26374D] bg-[#141E2F]">
            <div className="w-8 h-8 rounded-lg bg-[#6257F5] flex items-center justify-center text-white shadow-md shadow-[#6257F5]/30 lg:hidden">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-tight text-white leading-tight">
                FORMA PLATFORM
              </h1>
              <p className="text-[10px] text-[#A99CFB] font-semibold tracking-wider uppercase">
                SERVER INTELLIGENCE
              </p>
            </div>
          </div>

          {/* Nav Items */}
          <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
              Main Menu
            </div>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#6257F5] text-white shadow-md shadow-[#6257F5]/25'
                      : 'text-slate-300 hover:text-white hover:bg-[#1D2A3D]'
                  }`
                }
              >
                <span className="p-1 rounded-lg bg-black/20">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}

            {/* Infrastructure Section: MongoDB, Redis, Queue, and Cache cleanly distinguished */}
            <div className="pt-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1 mb-1">
                Infrastructure
              </div>
              <div className="space-y-1.5 text-xs">
                {/* MongoDB Status */}
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#1D2A3D]/50 border border-[#34435B]/40">
                  <span className="flex items-center gap-2 text-slate-300 text-[11px]">
                    <Database className="w-3.5 h-3.5 text-[#5379F5]" />
                    MongoDB
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      isMongoLive
                        ? 'bg-[#65DDA5]/10 text-[#65DDA5] border-[#65DDA5]/30'
                        : 'bg-[#F5B94C]/10 text-[#F5B94C] border-[#F5B94C]/30'
                    }`}
                  >
                    {isMongoLive ? 'Connected' : 'Fallback'}
                  </span>
                </div>

                {/* Redis Server Status */}
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#1D2A3D]/50 border border-[#34435B]/40">
                  <span className="flex items-center gap-2 text-slate-300 text-[11px]">
                    <Cpu className="w-3.5 h-3.5 text-[#6257F5]" />
                    Redis (6379)
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      isRedisLive
                        ? 'bg-[#65DDA5]/10 text-[#65DDA5] border-[#65DDA5]/30'
                        : 'bg-[#F16C80]/10 text-[#F16C80] border-[#F16C80]/30'
                    }`}
                  >
                    {isRedisLive ? 'Connected' : 'Disconnected'}
                  </span>
                </div>

                {/* Queue Engine Status */}
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#1D2A3D]/50 border border-[#34435B]/40">
                  <span className="flex items-center gap-2 text-slate-300 text-[11px]">
                    <Layers className="w-3.5 h-3.5 text-[#F5B94C]" />
                    Queue Engine
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      isRedisLive
                        ? 'bg-[#65DDA5]/10 text-[#65DDA5] border-[#65DDA5]/30'
                        : 'bg-[#F5B94C]/10 text-[#F5B94C] border-[#F5B94C]/30'
                    }`}
                  >
                    {isRedisLive ? 'BullMQ' : 'Async Fallback'}
                  </span>
                </div>

                {/* Cache Layer Status */}
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#1D2A3D]/50 border border-[#34435B]/40">
                  <span className="flex items-center gap-2 text-slate-300 text-[11px]">
                    <Zap className="w-3.5 h-3.5 text-[#A99CFB]" />
                    Cache Layer
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      isRedisLive
                        ? 'bg-[#65DDA5]/10 text-[#65DDA5] border-[#65DDA5]/30'
                        : 'bg-[#F5B94C]/10 text-[#F5B94C] border-[#F5B94C]/30'
                    }`}
                  >
                    {isRedisLive ? 'Redis Cache' : 'In-Memory Store'}
                  </span>
                </div>
              </div>
            </div>

            {/* Monitoring Summary */}
            <div className="pt-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1 mb-1">
                Engine Diagnostics
              </div>
              <div className="p-3 rounded-xl bg-[#1D2A3D]/60 border border-[#34435B]/40 text-[11px] space-y-1.5">
                <div className="flex justify-between text-slate-300">
                  <span>Runtime:</span>
                  <span className="text-[#A99CFB] font-mono font-bold">{health?.system?.nodeVersion || 'v24'}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Express Port:</span>
                  <span className="text-white font-mono">{health?.port || 5002}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Timer Precision:</span>
                  <span className="text-[#65DDA5] font-semibold">hrtime (ns)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Heartbeat */}
          <div className="p-4 border-t border-[#26374D] bg-[#141E2F]">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Radio className={`w-3.5 h-3.5 ${isBackendHealthy ? 'text-[#65DDA5] animate-pulse' : 'text-[#F16C80]'}`} />
                <span className="text-[11px] text-slate-300 font-medium">Server Heartbeat</span>
              </div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  isBackendHealthy
                    ? 'text-[#65DDA5] bg-[#65DDA5]/10 border-[#65DDA5]/20'
                    : 'text-[#F16C80] bg-[#F16C80]/10 border-[#F16C80]/20'
                }`}
              >
                {isBackendHealthy ? '200 OK' : 'OFFLINE'}
              </span>
            </div>
          </div>
        </aside>

        {/* Main Content Workspace */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#1B2638]">
          {/* Top Header */}
          <header className="h-16 border-b border-[#26374D] bg-[#172235]/95 backdrop-blur px-4 sm:px-6 flex items-center justify-between gap-3 sm:gap-4 flex-shrink-0">
            {/* Left: Mobile hamburger & Page Title */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle navigation menu"
                className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-[#1D2A3D] transition border border-[#34435B] flex-shrink-0"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight truncate leading-tight">
                  {getPageTitle()}
                </h2>
                <p className="hidden md:block text-[11px] text-slate-400 truncate">
                  Forma Server Intelligence &bull; Production SaaS Dashboard
                </p>
              </div>
            </div>

            {/* Middle: Search Bar (Desktop) */}
            <div className="hidden xl:flex items-center flex-1 max-w-xs relative mx-3">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search metrics, routes, jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1D2A3D] border border-[#34435B] rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-[#6257F5] transition"
              />
            </div>

            {/* Right: Engine status, API UP pill, Refresh button */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* Redis Engine Mode Status Indicator */}
              <div
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold shadow-sm ${
                  isRedisLive
                    ? 'bg-[#65DDA5]/10 text-[#65DDA5] border-[#65DDA5]/30'
                    : 'bg-[#1D2A3D] text-slate-300 border-[#34435B]'
                }`}
              >
                {isRedisLive ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#65DDA5]" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-[#F5B94C]" />
                )}
                <span>{redisStatusLabel}</span>
              </div>

              {/* Exact requirement: "Display API UP · 5002 when backend is healthy" */}
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold transition ${
                  isBackendHealthy
                    ? 'bg-[#65DDA5]/10 border-[#65DDA5]/30 text-[#65DDA5]'
                    : 'bg-[#F16C80]/10 border-[#F16C80]/30 text-[#F16C80]'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isBackendHealthy ? 'bg-[#65DDA5] animate-pulse' : 'bg-[#F16C80]'
                  }`}
                />
                <span className="whitespace-nowrap font-medium">
                  {isBackendHealthy ? 'API UP · 5002' : 'API DISCONNECTED · 5002'}
                </span>
              </div>

              {/* Refresh telemetry button */}
              <button
                onClick={loadHealth}
                disabled={isRefreshing}
                title="Refresh system telemetry"
                className="p-2 rounded-xl bg-[#1D2A3D] border border-[#34435B] text-slate-300 hover:text-white hover:bg-[#223249] transition shadow-sm"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#6257F5]' : ''}`} />
              </button>
            </div>
          </header>

          {/* Mobile Navigation Dropdown Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-b border-[#26374D] bg-[#172235] px-4 py-3 space-y-1.5 animate-fadeIn z-30 flex-shrink-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
                FORMA PLATFORM
              </div>
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-[#6257F5] text-white'
                        : 'text-slate-300 hover:text-white hover:bg-[#1D2A3D]'
                    }`
                  }
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              ))}

              <div className="pt-2 border-t border-[#34435B]/50 flex items-center justify-between px-3 text-xs text-slate-400">
                <span>Engine State:</span>
                <span className="font-mono text-[#65DDA5]">{redisStatusLabel}</span>
              </div>
            </div>
          )}

          {/* Main Content Area - Full vertical scrolling with ample bottom breathing padding */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-6 lg:p-8 bg-[#1B2638] min-w-0 max-w-full pb-16 sm:pb-24 scroll-smooth">
            <Outlet />
          </main>
        </div>

      {/* Help & Architecture Information Modal */}
      <Modal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
        title="Forma Server Intelligence Platform Guide"
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs text-slate-300">
          <p>
            Forma Server Intelligence Platform is an enterprise backend infrastructure telemetry and asynchronous task processing dashboard for high-throughput Node.js microservices.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="bg-[#1D2A3D] p-3 rounded-xl border border-[#34435B]">
              <div className="text-[#6257F5] font-bold mb-1">Middleware Pipeline</div>
              <p className="text-slate-400 text-[11px]">
                Inspects incoming requests with UUID request ID tracking, nanosecond timing, sensitive payload sanitization, and structured error handling.
              </p>
            </div>
            <div className="bg-[#1D2A3D] p-3 rounded-xl border border-[#34435B]">
              <div className="text-[#5379F5] font-bold mb-1">Queue & BullMQ</div>
              <p className="text-slate-400 text-[11px]">
                Distributed background job queues for emails, PDF reports, heavy analytics, and maintenance routines with exponential retry policies.
              </p>
            </div>
            <div className="bg-[#1D2A3D] p-3 rounded-xl border border-[#34435B]">
              <div className="text-[#65DDA5] font-bold mb-1">Cache & Performance</div>
              <p className="text-slate-400 text-[11px]">
                Redis-backed low-latency cache layer with automated TTL expiration, manual purge patterns, and live side-by-side benchmark testing.
              </p>
            </div>
            <div className="bg-[#1D2A3D] p-3 rounded-xl border border-[#34435B]">
              <div className="text-[#F5B94C] font-bold mb-1">System Health</div>
              <p className="text-slate-400 text-[11px]">
                Real-time Node.js process telemetry, memory heap usage, platform stats, and readiness probes.
              </p>
            </div>
          </div>
        </div>
      </Modal>

      {/* Settings & Environment Diagnostics Modal */}
      <Modal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        title="Runtime & Environment Diagnostics"
        maxWidth="md"
      >
        <div className="space-y-3 text-xs font-mono">
          <div className="flex justify-between p-2.5 rounded-xl bg-[#1D2A3D] border border-[#34435B]">
            <span className="text-slate-400">API Gateway:</span>
            <span className="text-white">http://localhost:5002/api</span>
          </div>
          <div className="flex justify-between p-2.5 rounded-xl bg-[#1D2A3D] border border-[#34435B]">
            <span className="text-slate-400">Node Platform:</span>
            <span className="text-[#65DDA5]">{health?.system?.platform || 'win32'}</span>
          </div>
          <div className="flex justify-between p-2.5 rounded-xl bg-[#1D2A3D] border border-[#34435B]">
            <span className="text-slate-400">Node Version:</span>
            <span className="text-white">{health?.system?.nodeVersion || 'v24'}</span>
          </div>
          <div className="flex justify-between p-2.5 rounded-xl bg-[#1D2A3D] border border-[#34435B]">
            <span className="text-slate-400">Redis Port:</span>
            <span className="text-white">6379</span>
          </div>
          <div className="flex justify-between p-2.5 rounded-xl bg-[#1D2A3D] border border-[#34435B]">
            <span className="text-slate-400">MongoDB Mode:</span>
            <span className="text-[#A99CFB]">{health?.infrastructure?.database?.mode || 'fallback'}</span>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DashboardLayout;
