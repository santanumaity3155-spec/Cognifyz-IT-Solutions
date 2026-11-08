import React from 'react';
import { ShieldCheck, Database, KeyRound, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Top Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 group">
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
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">256-bit Encrypted Session</span>
          </div>
        </div>
      </header>

      {/* Main Form Centerpiece */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12 flex-1 flex items-center justify-center w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full max-w-5xl">
          {/* Left Hero Pitch (Visible on Desktop) */}
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-center space-y-6 pr-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-900/60 border border-brand-500/30 text-brand-300 w-fit">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Cognifyz Level 3 • Task 6</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
              Enterprise Student Intelligence Platform
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Experience secure database integration with MongoDB, server-side JWT authentication,
              and role-based authorization ensuring data ownership and integrity.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">MongoDB Persistence</h4>
                  <p className="text-xs text-slate-400">Mongoose schemas with User-Student relationship constraints.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Secure HTTP-Only Sessions</h4>
                  <p className="text-xs text-slate-400">bcrypt password hashing and RFC 7519 JSON Web Tokens.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Authentication Card */}
          <div className="lg:col-span-7 flex justify-center w-full">
            <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/40">
              <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-white">{title}</h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">{subtitle}</p>
              </div>

              {children}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 text-center text-xs text-slate-500">
        Cognifyz IT Solutions Internship • Level 3, Task 6 • Forma Platform
      </footer>
    </div>
  );
};

export default AuthLayout;

