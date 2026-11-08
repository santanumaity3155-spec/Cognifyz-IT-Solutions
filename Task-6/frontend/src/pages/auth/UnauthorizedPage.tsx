import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const UnauthorizedPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 font-bold">
              F
            </div>
            <span className="text-lg font-bold tracking-tight text-white">Forma</span>
          </Link>
          <span className="text-xs px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 font-medium">
            403 Forbidden
          </span>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-16 text-center flex-1 flex flex-col justify-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto mb-6 shadow-xl shadow-rose-950/30">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
          Access Denied
        </h1>
        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          Your account is registered with the role{' '}
          <span className="font-semibold text-brand-300">"{user?.role || 'Guest'}"</span>. You do not have
          sufficient permissions to access this administrative section.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-indigo-600/30 transition"
          >
            <Home className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        </div>
      </main>

      <footer className="border-t border-slate-800/80 py-4 text-center text-xs text-slate-500">
        Forma Student Intelligence Platform • Role-Based Access Control
      </footer>
    </div>
  );
};

export default UnauthorizedPage;

