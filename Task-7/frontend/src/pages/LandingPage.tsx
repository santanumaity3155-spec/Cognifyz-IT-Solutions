import React from 'react';
import { NavLink } from 'react-router-dom';
import { Github, ShieldCheck, Cpu, Layers, ArrowRight, CheckCircle2 } from 'lucide-react';
import Button from '../components/common/Button.tsx';
import Badge from '../components/common/Badge.tsx';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold shadow-md shadow-brand-500/20">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base text-slate-900 tracking-tight">Forma</span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-100 text-brand-700">
                Developer Intelligence
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NavLink to="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </NavLink>
            <NavLink to="/dashboard">
              <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Launch Dashboard
              </Button>
            </NavLink>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-1 flex flex-col justify-center">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2">
            <Badge variant="brand" size="md">
              Cognifyz Level 4: Expert Task 7
            </Badge>
            <Badge variant="neutral" size="md">
              GitHub REST API v2022-11-28
            </Badge>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Advanced API Usage & <span className="text-brand-600">Developer Intelligence</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Forma connects authenticated students with the GitHub REST API via secure OAuth 2.0 Authorization Code flow. Analyze programming language distributions, explore public repositories, and track real-time API quotas.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <NavLink to="/dashboard">
              <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                Open Developer Dashboard
              </Button>
            </NavLink>
            <NavLink to="/login">
              <Button variant="outline" size="lg">
                Student Sign In
              </Button>
            </NavLink>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-5xl mx-auto w-full">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-brand-600 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">OAuth 2.0 & Token Protection</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Cryptographically random CSRF state nonces, AES-256-GCM token encryption at rest, and zero client-side token leakage.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">External API Integration</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Live GitHub REST API integration for profiles, repositories, commit velocity, and language byte breakdowns with retries and backoff.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Rate Limiting & In-Memory TTL Cache</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Tiered express-rate-limiters, per-user TTL caching (5–15 min), and standardized HTTP 429 response headers.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <p>Forma Platform &copy; 2026. Cognifyz Internship — Level 4: Expert Task 7.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
