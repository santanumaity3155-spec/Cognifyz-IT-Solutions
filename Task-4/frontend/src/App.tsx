import { GraduationCap, ShieldCheck, Sparkles, Navigation } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20 p-6 md:p-12 flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-6">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
          <GraduationCap className="w-10 h-10" />
        </div>
        
        <div>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 mb-3">
            Cognifyz Internship • Level 2, Task 4
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Forma – Student Intelligence Platform
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300 text-sm md:text-base">
            Complex Form Validation • Dynamic DOM Manipulation • Client-Side Routing
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <ShieldCheck className="w-5 h-5 text-indigo-500 mb-2" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Validation</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Zod + RHF, password strength meter, age & phone checks</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <Sparkles className="w-5 h-5 text-indigo-500 mb-2" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Dynamic DOM</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Live preview, dynamic qualifications, real-time filters</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <Navigation className="w-5 h-5 text-indigo-500 mb-2" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Client Routing</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">React Router DOM, protected routes, clean transitions</p>
          </div>
        </div>

        <div className="text-xs text-slate-400 dark:text-slate-500 pt-2">
          Phase 2 Project Scaffold Initialized • All systems operational
        </div>
      </div>
    </div>
  );
}
