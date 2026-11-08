import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, 
  ShieldCheck, 
  KeyRound, 
  Calendar, 
  Lock, 
  LogOut, 
  CheckCircle2, 
  Fingerprint
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const ProfilePage: React.FC = () => {
  const { user, isAdmin, logout, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const formattedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Active Session';

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          User Profile &amp; Security
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Review your authenticated identity, session transport parameters, and role-based permissions.
        </p>
      </div>

      {/* Main Profile Identity Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-600/30">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h2 className="text-xl font-bold text-white">{user?.name}</h2>
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                    isAdmin
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-brand-500/10 text-brand-300 border-brand-500/20'
                  }`}
                >
                  {user?.role}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center space-x-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>{user?.email}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Account Active</span>
            </span>
          </div>
        </div>

        {/* Identity Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-6 text-xs">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <div className="flex items-center space-x-1.5 text-slate-500">
              <Fingerprint className="w-4 h-4 text-brand-400" />
              <span className="uppercase text-[10px] font-semibold tracking-wider">Database ID</span>
            </div>
            <p className="font-mono text-slate-200 text-xs break-all">{user?.id}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <div className="flex items-center space-x-1.5 text-slate-500">
              <Calendar className="w-4 h-4 text-brand-400" />
              <span className="uppercase text-[10px] font-semibold tracking-wider">Account Created</span>
            </div>
            <p className="text-slate-200 text-xs">{formattedDate}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <div className="flex items-center space-x-1.5 text-slate-500">
              <KeyRound className="w-4 h-4 text-brand-400" />
              <span className="uppercase text-[10px] font-semibold tracking-wider">Assigned Role</span>
            </div>
            <p className="text-slate-200 text-xs font-medium">
              {isAdmin ? 'System Administrator' : 'Standard Student User'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <div className="flex items-center space-x-1.5 text-slate-500">
              <Lock className="w-4 h-4 text-brand-400" />
              <span className="uppercase text-[10px] font-semibold tracking-wider">Session Security</span>
            </div>
            <p className="text-slate-200 text-xs font-medium text-emerald-400">
              HTTP-Only Cookie Authenticated
            </p>
          </div>
        </div>
      </div>

      {/* Security Architecture & Role Overview */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-brand-400" />
          <span>Role-Based Access Control &amp; Data Ownership</span>
        </h3>
        
        <p className="text-xs text-slate-400 leading-relaxed">
          The Forma platform enforces multi-layered authorization checks on the server side:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/60 text-xs space-y-2">
            <span className="font-semibold text-brand-300 block">Student Privileges:</span>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>Read &amp; manage records where <code className="text-slate-300">createdBy == userId</code></li>
              <li>Forbidden from accessing administrative dashboards</li>
              <li>Strict server-side validation against unauthorized edits</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/60 text-xs space-y-2">
            <span className="font-semibold text-amber-300 block">Administrator Privileges:</span>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>Full access to all student records across the database</li>
              <li>Access to system-wide audit telemetry and metrics</li>
              <li>Authority to delete or update any database record</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="flex items-center justify-between p-6 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
        <div>
          <h4 className="text-sm font-semibold text-white">End Active Session</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Clear your HTTP-only cookie and securely sign out of Forma.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loading}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 transition shadow-lg shadow-rose-950/40 focus:outline-none"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
