import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Database, 
  KeyRound, 
  Users, 
  CheckCircle2, 
  Server,
  Layers
} from 'lucide-react';

export const App: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<{
    loaded: boolean;
    service?: string;
    task?: string;
    status?: string;
    error?: string;
  }>({ loaded: false });

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setHealthStatus({
          loaded: true,
          service: data.service,
          task: data.task,
          status: data.status,
        });
      })
      .catch((err) => {
        setHealthStatus({
          loaded: true,
          error: err.message,
        });
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between">
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white">Forma</span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                Level 3 • Task 6
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Scaffolding Active</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 flex-1 flex flex-col justify-center">
        <div className="text-center space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-900/60 border border-brand-500/30 text-brand-300">
            <Layers className="w-3.5 h-3.5" />
            <span>Phase 2: Scaffolding Complete</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
            Forma – Student Intelligence Platform
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Database Integration, JWT Authentication, and Server-Side Role-Based Authorization
            for Cognifyz IT Solutions Web Development Internship.
          </p>
        </div>

        {/* 3 Mandatory Requirements Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 hover:border-brand-500/40 transition">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">1. MongoDB Integration</h3>
            <p className="text-sm text-slate-400">
              Mongoose schemas for Users and Students with direct document references, validation, and zero-loss storage resilience.
            </p>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 hover:border-brand-500/40 transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <KeyRound className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">2. User Authentication</h3>
            <p className="text-sm text-slate-400">
              bcrypt password hashing, RFC 7519 JWT issuance, secure HTTP-only cookie transport, and protected session verification.
            </p>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 hover:border-brand-500/40 transition">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">3. Role-Based Authorization</h3>
            <p className="text-sm text-slate-400">
              Server-side authorization middleware enforcing Admin vs. Student roles and individual resource ownership checks.
            </p>
          </div>
        </div>

        {/* Live Scaffolding Status Indicator */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-3">
              <Server className="w-5 h-5 text-brand-400" />
              <div>
                <p className="text-sm font-semibold text-white">Backend Health API Status</p>
                <p className="text-xs text-slate-400">
                  {healthStatus.loaded
                    ? healthStatus.status
                      ? `Connected to Express: ${healthStatus.service}`
                      : `Backend offline or proxying: ${healthStatus.error || 'Waiting for startup'}`
                    : 'Querying /api/health...'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
              <span>React 18 + Vite + Tailwind Scaffolding Verified</span>
            </div>
          </div>
        </div>

        {/* Action Note */}
        <div className="text-center text-xs text-slate-500">
          Ready for Phase 3: MongoDB Database Integration & Connection Config.
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        Cognifyz IT Solutions Internship • Level 3, Task 6 • Forma Platform
      </footer>
    </div>
  );
};

export default App;
