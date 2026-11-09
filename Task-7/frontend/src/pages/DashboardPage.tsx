import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ShieldCheck,
  Cpu,
  Layers,
  ArrowRight,
  UserCheck,
  FolderGit2,
  Activity,
  Star,
  GitFork,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useGitHubProfile, useGitHubRepos } from '../hooks/useGitHubData.ts';
import ConnectGitHubCard from '../components/github/ConnectGitHubCard.tsx';
import Card from '../components/common/Card.tsx';
import Badge from '../components/common/Badge.tsx';
import { getLanguageColor } from '../components/github/LanguageBreakdown.tsx';

export const DashboardPage: React.FC = () => {
  const { githubStatus } = useAuth();
  const isConnected = Boolean(githubStatus?.connected);

  const { profile, rateLimit } = useGitHubProfile({ autoFetch: isConnected });
  const { repositories } = useGitHubRepos({ per_page: 2 }, { autoFetch: isConnected });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Badge variant="brand" size="sm">
            Phase 10: API Integration Live
          </Badge>
          <Badge variant="neutral" size="sm">
            Cognifyz Level 4: Expert
          </Badge>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Forma Developer Intelligence Platform
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
          Advanced external API integration with GitHub REST API, OAuth 2.0 Authorization Code flow, tiered rate limiting, and in-memory TTL caching.
        </p>
      </div>

      {/* GitHub Connection Panel */}
      <ConnectGitHubCard />

      {/* Live Developer Profile & Quota Summary (when connected) */}
      {isConnected && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Overview Card */}
          <Card
            title="Developer Identity"
            subtitle="Live authenticated profile"
            headerAction={
              profile?.profileUrl && (
                <a
                  href={profile.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-brand-600 hover:text-brand-700 font-semibold inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
                >
                  GitHub <ExternalLink className="w-3 h-3" />
                </a>
              )
            }
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3 min-w-0">
                {profile?.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.login}
                    className="w-12 h-12 rounded-xl border border-slate-200 object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold flex-shrink-0">
                    {profile?.login?.slice(0, 2).toUpperCase() || 'GH'}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-slate-900 text-sm truncate">
                    {profile?.name || profile?.login || 'Authenticated Developer'}
                  </h4>
                  <p className="text-xs font-mono text-slate-500 truncate">
                    @{profile?.login || githubStatus?.username}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Repos</span>
                  <span className="text-sm font-extrabold text-slate-800 font-mono">
                    {profile?.publicRepos ?? '-'}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Followers</span>
                  <span className="text-sm font-extrabold text-slate-800 font-mono">
                    {profile?.followers ?? '-'}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Following</span>
                  <span className="text-sm font-extrabold text-slate-800 font-mono">
                    {profile?.following ?? '-'}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Recent Repositories Snapshot */}
          <Card
            title="Repository Snapshot"
            subtitle="Recent public repositories"
            headerAction={
              <NavLink
                to="/github/repositories"
                className="text-xs text-brand-600 hover:text-brand-700 font-semibold inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
              >
                Explorer <ArrowRight className="w-3 h-3" />
              </NavLink>
            }
          >
            {repositories.length > 0 ? (
              <div className="space-y-3">
                {repositories.slice(0, 2).map((repo) => (
                  <div
                    key={repo.id}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <span className="font-semibold text-xs text-slate-900 truncate block">
                        {repo.name}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                        {repo.language && (
                          <span className="inline-flex items-center gap-1">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: getLanguageColor(repo.language) }}
                            />
                            {repo.language}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-0.5">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                          {repo.starsCount}
                        </span>
                        <span className="inline-flex items-center gap-0.5">
                          <GitFork className="w-3 h-3 text-slate-400" />
                          {repo.forksCount}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-slate-500">
                No repositories synchronized yet.
              </div>
            )}
          </Card>

          {/* Rate Limit Hourly Allowance */}
          <Card
            title="API Quota Status"
            subtitle="Hourly GitHub rate limit quota"
            headerAction={
              <NavLink
                to="/api-status"
                className="text-xs text-brand-600 hover:text-brand-700 font-semibold inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
              >
                Telemetry <ArrowRight className="w-3 h-3" />
              </NavLink>
            }
          >
            {rateLimit ? (
              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black font-mono text-brand-600">
                    {rateLimit.remaining}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    of {rateLimit.limit} / hr
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className="h-full bg-brand-600 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (rateLimit.used / rateLimit.limit) * 100)}%`,
                    }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Quota Resets in</span>
                  <span className="font-semibold text-slate-700">
                    {Math.ceil(rateLimit.resetInSeconds / 60)} min
                  </span>
                </p>
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-slate-500">
                Probe live quota at the API Status page.
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <NavLink to="/github/profile" className="block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-2xl">
          <Card className="h-full hover:border-brand-300 transition-all duration-200 hover:shadow-md">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-brand-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <UserCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors flex items-center justify-between text-base">
              Developer Profile
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Explore your GitHub public bio, commit velocity, and programming language distributions.
            </p>
          </Card>
        </NavLink>

        <NavLink to="/github/repositories" className="block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-2xl">
          <Card className="h-full hover:border-brand-300 transition-all duration-200 hover:shadow-md">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors flex items-center justify-between text-base">
              Repository Explorer
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Browse public repositories with pagination, stars, forks, and language byte statistics.
            </p>
          </Card>
        </NavLink>

        <NavLink to="/api-status" className="block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-2xl">
          <Card className="h-full hover:border-brand-300 transition-all duration-200 hover:shadow-md">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors flex items-center justify-between text-base">
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
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-brand-600 flex-shrink-0" />
              <span>OAuth 2.0 Security</span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              Cryptographically random 32-byte CSRF state, single-use state consumption, AES-256-GCM token encryption at rest.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Cpu className="w-4 h-4 text-sky-600 flex-shrink-0" />
              <span>External API Resilience</span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              Exponential backoff with jitter on 502/503/504 errors, request timeouts, and GitHub rate-limit header parsing.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Layers className="w-4 h-4 text-emerald-600 flex-shrink-0" />
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
