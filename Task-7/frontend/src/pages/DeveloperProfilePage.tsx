import React from 'react';
import { RotateCcw, Github, Clock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useGitHubProfile } from '../hooks/useGitHubData.ts';
import Card from '../components/common/Card.tsx';
import Button from '../components/common/Button.tsx';
import Badge from '../components/common/Badge.tsx';
import ErrorAlert from '../components/common/ErrorAlert.tsx';
import githubService from '../services/githubService.ts';
import GitHubProfileCard from '../components/github/GitHubProfileCard.tsx';

export const DeveloperProfilePage: React.FC = () => {
  const { githubStatus, githubLoading } = useAuth();
  const isConnected = Boolean(githubStatus?.connected);

  const {
    profile,
    rateLimit,
    loading,
    error,
    isCached,
    cachedAt,
    refresh,
  } = useGitHubProfile({ autoFetch: isConnected });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Developer Profile</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time developer intelligence, GitHub REST API analytics, and repository counts.
          </p>
        </div>

        {isConnected && (
          <div className="flex items-center gap-2">
            {isCached && (
              <Badge variant="neutral" size="sm" dot>
                <Clock className="w-3 h-3 text-slate-400 mr-1" />
                Cached {cachedAt ? new Date(cachedAt).toLocaleTimeString() : 'Recently'}
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={refresh}
              isLoading={loading}
              title="Bypass server cache and fetch fresh GitHub API profile"
            >
              Refresh Profile
            </Button>
          </div>
        )}
      </div>

      {error && (
        <ErrorAlert
          title="Profile Fetch Error"
          message={error}
          onRetry={refresh}
        />
      )}

      {isConnected ? (
        <div className="space-y-6">
          {/* Real Live Profile Card */}
          <GitHubProfileCard profile={profile} isLoading={loading || githubLoading} />

          {/* Operational Diagnostics & Rate Limit Allowance */}
          {rateLimit && (
            <Card title="API Rate Limit & Session Metadata">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Hourly Quota Remaining
                  </span>
                  <span className="text-xl font-bold font-mono text-brand-600 mt-1 block">
                    {rateLimit.remaining} / {rateLimit.limit}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Resets in {Math.ceil(rateLimit.resetInSeconds / 60)} minutes
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Security Layer
                  </span>
                  <span className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    AES-256-GCM Encrypted
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Tokens never transmitted to frontend
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Scope Level
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-800 mt-1 block">
                    {githubStatus?.scopes?.join(', ') || 'read:user'}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Least-privilege authorization
                  </span>
                </div>
              </div>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <div className="text-center py-12">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-4">
              <Github className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">GitHub Account Not Linked</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-6">
              Connect your GitHub account to inspect your public repositories, language distribution, and developer analytics.
            </p>
            <Button
              variant="primary"
              size="md"
              leftIcon={<Github className="w-4 h-4" />}
              onClick={() => {
                window.location.href = githubService.getConnectUrl();
              }}
            >
              Connect GitHub Account
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default DeveloperProfilePage;
