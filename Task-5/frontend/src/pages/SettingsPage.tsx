import React from 'react';
import { Settings as SettingsIcon, Sun, Moon, Server, Database, ShieldCheck } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export const SettingsPage: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <SettingsIcon className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
          <span>Platform Settings</span>
        </h1>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
          System configuration, visual theme preferences, and backend connection details
        </p>
      </div>

      {/* Visual Theme Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Interface Appearance
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Choose between light and dark visual themes. Your preference is persisted automatically.
        </p>

        <div className="pt-2 flex items-center gap-4">
          <button
            onClick={() => isDark && toggleTheme()}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
              !isDark
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Sun className="w-4 h-4 text-amber-500" />
            <span>Light Mode</span>
          </button>

          <button
            onClick={() => !isDark && toggleTheme()}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
              isDark
                ? 'bg-indigo-950/60 border-indigo-700 text-indigo-300 shadow-xs'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Moon className="w-4 h-4 text-indigo-400" />
            <span>Dark Mode</span>
          </button>
        </div>
      </div>

      {/* API Configuration Overview */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Server className="w-4 h-4 text-indigo-500" />
          <span>REST API Service Information</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 block text-[11px] font-semibold uppercase">Backend Base URL</span>
            <span className="font-mono font-medium text-slate-800 dark:text-slate-200 mt-1 block">
              http://localhost:5000/api
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 block text-[11px] font-semibold uppercase">CORS Allowed Origin</span>
            <span className="font-mono font-medium text-slate-800 dark:text-slate-200 mt-1 block">
              http://localhost:5173
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 block text-[11px] font-semibold uppercase">Storage Architecture</span>
            <span className="font-medium text-slate-800 dark:text-slate-200 mt-1 block flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-500" />
              <span>MongoDB Mongoose + In-Memory Fallback</span>
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 block text-[11px] font-semibold uppercase">Task Scope</span>
            <span className="font-medium text-slate-800 dark:text-slate-200 mt-1 block flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
              <span>Cognifyz Level 3 • Task 5</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

