import React from 'react';
import { NavLink } from 'react-router-dom';
import { ShieldCheck, Cpu, Layers, ArrowRight, UserCheck, FolderGit2, Activity } from 'lucide-react';
import ConnectGitHubCard from '../components/github/ConnectGitHubCard.tsx';
import Card from '../components/common/Card.tsx';
import Badge from '../components/common/Badge.tsx';

export const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Badge variant="brand" size="sm">
            Phase 8: Frontend Shell Active
          </Badge>
          <Badge variant="neutral" size="sm">
            Cognifyz Level 4: Expert
          </Badge>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Forma Developer Intelligence Platform
        </h1>
        <p className="mt-1 text-sm text-slate-600 max-w-3xl">
          Advanced external API integration with GitHub REST API, OAuth 2.0 Authorization Code flow, tiered rate limiting, and in-memory TTL caching.
        </p>
      </div>

      {/* GitHub Connection Panel */}
      <ConnectGitHubCard />

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <NavLink to="/github/profile" className="block group">
          <Card className="h-full hover:border-brand-300 transition hover:shadow-md">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-brand-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <UserCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors flex items-center justify-between">
              Developer Profile
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Explore your GitHub public bio, commit velocity, and programming language distributions.
            </p>
          </Card>
        </NavLink>

        <NavLink to="/github/repositories" className="block group">
          <Card className="h-full hover:border-brand-300 transition hover:shadow-md">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors flex items-center justify-between">
              Repository Explorer
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Browse public repositories with pagination, stars, forks, and language byte statistics.
            </p>
          </Card>
        </NavLink>

        <NavLink to="/api-status" className="block group">
          <Card className="h-full hover:border-brand-300 transition hover:shadow-md">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors flex items-center justify-between">
              API Status & Rate Limits
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Monitor real-time GitHub REST API hourly quota allowance, reset epochs, and backend diagnostics.
            </p>
          </Card>
        </NavLink>
      </div>

      {/* Architecture Specifications */}
      <Card title="Task 7 Architecture Implementation Summary">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs sm:text-sm">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-brand-600" />
              <span>OAuth 2.0 Security</span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              Cryptographically random 32-byte CSRF state, single-use state consumption, AES-256-GCM token encryption at rest.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <Cpu className="w-4 h-4 text-sky-600" />
              <span>External API Resilience</span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              Exponential backoff with jitter on 502/503/504 errors, request timeouts, and GitHub rate-limit header parsing.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Tiered Rate Limiting & Cache</span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              General, Auth, and GitHub Proxy rate limiters with HTTP 429 backoff headers, and in-memory TTL caching with manual refresh.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DashboardPage;

