import React from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Database,
  Server,
  ArrowRight,
  ShieldCheck,
  Zap,
  BarChart3,
  Users,
} from 'lucide-react';
import { Button } from '../components/common/Button';

export const LandingPage: React.FC = () => {
  return (
    <div className="space-y-10 py-4">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-8 md:p-12 text-white shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 backdrop-blur-sm">
            <span>Cognifyz Internship</span>
            <span>•</span>
            <span>Level 3, Task 5</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
            FORMA – Student Intelligence Platform
          </h1>

          <p className="text-indigo-100/90 text-sm md:text-base leading-relaxed max-w-2xl">
            Introducing true server-client communication through an enterprise RESTful API.
            Manage student records, perform seamless CRUD operations, and explore real-time
            intelligence analytics.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <Link to="/dashboard">
              <Button size="lg" icon={ArrowRight} iconPosition="right" className="bg-white text-indigo-900 hover:bg-indigo-50">
                Open Dashboard
              </Button>
            </Link>
            <Link to="/students">
              <Button size="lg" variant="outline" className="border-indigo-300/40 text-white hover:bg-white/10">
                Explore Students Directory
              </Button>
            </Link>
          </div>
        </div>

        {/* Subtle decorative background graphic */}
        <div className="absolute -right-10 -bottom-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Task 5 Three Core Requirements Showcase */}
      <div className="space-y-4">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
            Official Task 5 Requirements
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            Engineered to demonstrate server-client communication and state synchronization
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1 */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 flex items-center justify-center mb-4">
              <Server className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Requirement 1
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
              RESTful API Endpoints
            </h3>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Express.js server handling full CRUD operations across GET, POST, PUT, and DELETE with schema validation and error formatting.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Requirement 2
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
              Interactive Frontend Client
            </h3>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Modern React 18 & TypeScript interface utilizing centralized Axios service clients to perform asynchronous server communication.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center mb-4">
              <BarChart3 className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Requirement 3
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
              Dynamic Data Fetching
            </h3>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Fetch and display real-time student lists, search queries, filter results, and aggregated dashboard analytics directly from your server.
            </p>
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 md:p-8 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
          Architectural Highlights
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <Database className="w-5 h-5 text-indigo-500 mb-2" />
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Dual-Mode Persistence</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              MongoDB Mongoose with resilient fallback in-memory store
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <ShieldCheck className="w-5 h-5 text-indigo-500 mb-2" />
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Robust Validation</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Duplicate email prevention, schema enforcement & status checks
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <Users className="w-5 h-5 text-indigo-500 mb-2" />
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Full Student Directory</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Paginated tables, course filters, search & detail profiles
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <GraduationCap className="w-5 h-5 text-indigo-500 mb-2" />
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Cognifyz Standard</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Level 3 Advanced full-stack specifications verified
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

