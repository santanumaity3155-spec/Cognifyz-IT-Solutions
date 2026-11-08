import React, { useEffect, useState, useCallback } from 'react';
import { Activity, Server, Database, ShieldCheck, RotateCcw, Clock, Layers } from 'lucide-react';
import api from '../services/api.ts';
import Card from '../components/common/Card.tsx';
import Button from '../components/common/Button.tsx';
import Badge from '../components/common/Badge.tsx';
import LoadingState from '../components/common/LoadingState.tsx';
import ErrorAlert from '../components/common/ErrorAlert.tsx';

interface HealthData {
  status: string;
  level: string;
  task: string;
  phase: string;
  environment: string;
  database: {
    mode: string;
    isPersistent: boolean;
    databaseName: string;
  };
  oauth: {
    configured: boolean;
    maskedClientId: string;
  };
}

interface RateLimitData {
  limit: number;
  remaining: number;
  used: number;
  resetDate: string;
  resetInSeconds: number;
}

export const ApiStatusPage: React.FC = () => {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [rateLimit, setRateLimit] = useState<RateLimitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Probe health endpoint
      const healthRes = await api.get('/health');
      setHealth(healthRes.data);

      // Probe rate limit endpoint
      try {
        const rateLimitRes = await api.get('/github/rate-limit');
        setRateLimit(rateLimitRes.data.data.rateLimit);
      } catch {
        // Unauthenticated or not yet linked rate limit fallback
        setRateLimit(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to connect to Forma backend.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">API Status & Quota Monitor</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time GitHub REST API hourly quota tracking and backend operational telemetry.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<RotateCcw className="w-4 h-4" />}
          onClick={fetchStatus}
          isLoading={loading}
        >
          Refresh Telemetry
        </Button>
      </div>

      {error && <ErrorAlert title="Connection Warning" message={error} onRetry={fetchStatus} />}

      {loading && !health ? (
        <LoadingState message="Probing backend telemetry..." />
      ) : (
        <>
          {/* Rate Limit Quota Card */}
          <Card title="GitHub REST API Rate Limit Allowance" subtitle="Standard authenticated GitHub API hourly limits">
            {rateLimit ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Remaining</span>
                    <span className="text-2xl font-extrabold text-brand-600 font-mono mt-1 block">
                      {rateLimit.remaining}
                    </span>
                    <span className="text-xs text-slate-400 mt-1 block">out of {rateLimit.limit} total</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Used</span>
                    <span className="text-2xl font-extrabold text-slate-800 font-mono mt-1 block">
                      {rateLimit.used}
                    </span>
                    <span className="text-xs text-slate-400 mt-1 block">requests consumed</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Limit</span>
                    <span className="text-2xl font-extrabold text-slate-800 font-mono mt-1 block">
                      {rateLimit.limit}
                    </span>
                    <span className="text-xs text-slate-400 mt-1 block">requests / hour</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Quota Reset</span>
                    <span className="text-lg font-bold text-slate-800 font-mono mt-1 block flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-500" />
                      {Math.ceil(rateLimit.resetInSeconds / 60)} min
                    </span>
                    <span className="text-[11px] text-slate-400 mt-1 block truncate">
                      {new Date(rateLimit.resetDate).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                {/* Quota Progress Bar */}
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
                    <span>Hourly Allowance Consumption</span>
                    <span className="font-semibold">
                      {((rateLimit.used / rateLimit.limit) * 100).toFixed(1)}% Used
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className="h-full bg-brand-600 transition-all duration-500"
                      style={{ width: `${Math.min(100, (rateLimit.used / rateLimit.limit) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-500 text-xs sm:text-sm">
                Connect your GitHub account to access authenticated rate-limit quota metrics (5,000 requests/hr).
              </div>
            )}
          </Card>

          {/* Backend Diagnostics Card */}
          <Card title="Backend Service Telemetry" subtitle="Environment status and storage persistence diagnostics">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <Server className="w-5 h-5 text-brand-600 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800 block">Server Status</span>
                  <span className="text-xs text-slate-500 mt-0.5 block">{health?.status || 'Online'}</span>
                  <span className="text-[11px] font-mono text-emerald-700 font-semibold mt-1 block">
                    Level 4: Expert
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <Database className="w-5 h-5 text-sky-600 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800 block">Database Mode</span>
                  <span className="text-xs text-slate-500 mt-0.5 block">{health?.database.mode}</span>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    Persistent: {health?.database.isPersistent ? 'Yes' : 'In-Memory Fallback'}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800 block">OAuth Status</span>
                  <span className="text-xs text-slate-500 mt-0.5 block">
                    {health?.oauth.configured ? 'Configured' : 'Credentials Needed'}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 block mt-1">
                    ID: {health?.oauth.maskedClientId}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default ApiStatusPage;
