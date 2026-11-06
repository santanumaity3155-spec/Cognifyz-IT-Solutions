import { GraduationCap, Database, Server, LayoutDashboard, ArrowRight } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20 p-6 md:p-12 flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-6">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
          <GraduationCap className="w-10 h-10" />
        </div>

        <div>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 mb-3">
            Cognifyz Internship • Level 3, Task 5
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Forma – Student Intelligence Platform
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300 text-sm md:text-base">
            RESTful API Integration • Full CRUD Operations • Live Dashboard Analytics
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <Server className="w-5 h-5 text-indigo-500 mb-2" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">RESTful Endpoints</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Express API with full CRUD, search, pagination & filters</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <Database className="w-5 h-5 text-indigo-500 mb-2" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Dual-Mode DB</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">MongoDB Mongoose with resilient in-memory fallback</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <LayoutDashboard className="w-5 h-5 text-indigo-500 mb-2" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Frontend Client</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Centralized Axios services, live dashboard & management UI</p>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400 rounded-lg border border-emerald-200 dark:border-emerald-800">
          <span>Phase 2 Project Scaffold Initialized</span>
          <ArrowRight className="w-3.5 h-3.5" />
          <span>Awaiting Phase 3 Implementation</span>
        </div>
      </div>
    </div>
  );
}

