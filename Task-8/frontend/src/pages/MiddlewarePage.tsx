import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Send,
  Trash2,
  AlertTriangle,
  Layers,
  Terminal,
  RotateCw,
} from 'lucide-react';
import {
  fetchMiddlewareTelemetry,
  clearMiddlewareTelemetry,
  testEchoEndpoint,
  testSimulateError,
} from '../services/api';
import type { MiddlewareTelemetryData, RequestLogEntry } from '../types';

export const MiddlewarePage: React.FC = () => {
  const [telemetry, setTelemetry] = useState<MiddlewareTelemetryData | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Interactive console states
  const [echoPayload, setEchoPayload] = useState('{\n  "service": "Forma Client",\n  "testValue": 42,\n  "secretKey": "mySecretToken123"\n}');
  const [echoResponse, setEchoResponse] = useState<any>(null);
  const [errorSimulationResult, setErrorSimulationResult] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const loadTelemetry = async () => {
    try {
      const data = await fetchMiddlewareTelemetry();
      setTelemetry(data);
    } catch (err) {
      console.error('Failed to load middleware telemetry:', err);
    }
  };

  useEffect(() => {
    loadTelemetry();
    const interval = setInterval(loadTelemetry, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleClearTelemetry = async () => {
    await clearMiddlewareTelemetry();
    await loadTelemetry();
  };

  const handleSendEcho = async () => {
    try {
      setIsExecuting(true);
      const parsed = JSON.parse(echoPayload);
      const result = await testEchoEndpoint(parsed);
      setEchoResponse(result);
      await loadTelemetry();
    } catch (err: any) {
      setEchoResponse({ error: err.message || 'JSON Parse error in input' });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSimulateError = async (type: string) => {
    try {
      setIsExecuting(true);
      const res = await testSimulateError(type);
      setErrorSimulationResult(res);
      await loadTelemetry();
    } catch (err: any) {
      setErrorSimulationResult(err);
      await loadTelemetry();
    } finally {
      setIsExecuting(false);
    }
  };

  const filteredRequests = (telemetry?.recentRequests || []).filter((req: RequestLogEntry) => {
    const matchesSearch =
      req.path.toLowerCase().includes(searchFilter.toLowerCase()) ||
      req.method.toLowerCase().includes(searchFilter.toLowerCase()) ||
      req.id.toLowerCase().includes(searchFilter.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'ALL') return true;
    if (statusFilter === '2xx') return req.status >= 200 && req.status < 300;
    if (statusFilter === '4xx') return req.status >= 400 && req.status < 500;
    if (statusFilter === '5xx') return req.status >= 500;
    return true;
  });

  const pipelineSteps = [
    { name: 'X-Request-Id', desc: 'UUID injection & propagation', icon: '1' },
    { name: 'Request Timer', desc: 'Nanosecond hrtime precision', icon: '2' },
    { name: 'Helmet & CORS', desc: 'HSTS, CSP, Frameguard headers', icon: '3' },
    { name: 'Body Parsers', desc: '1MB JSON & URL-encoded parser', icon: '4' },
    { name: 'Sanitized Logger', desc: 'Sensitive data masking & logs', icon: '5' },
    { name: 'Rate Limiter', desc: 'express-rate-limit protection', icon: '6' },
    { name: 'Zod Validator', desc: 'Type-safe schema validation', icon: '7' },
    { name: 'Error Handler', desc: 'Centralized envelope normalization', icon: '8' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            Middleware & Request Lifecycle Inspector
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Real-time inspection of request processing, headers, sanitization, and timing pipelines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadTelemetry}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition border border-slate-700"
          >
            <RotateCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button
            onClick={handleClearTelemetry}
            className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-medium flex items-center gap-1.5 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Buffer
          </button>
        </div>
      </div>

      {/* Middleware Architecture Pipeline Map */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          Active Express Middleware Sequence
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {pipelineSteps.map((step) => (
            <div
              key={step.name}
              className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center flex flex-col items-center justify-center transition hover:border-indigo-500/50"
            >
              <div className="w-6 h-6 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 text-xs font-bold flex items-center justify-center mb-1.5">
                {step.icon}
              </div>
              <div className="text-xs font-bold text-slate-200">{step.name}</div>
              <div className="text-[10px] text-slate-400 mt-1 leading-tight">{step.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Telemetry Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <div className="text-[11px] font-medium text-slate-400 uppercase">Total Requests</div>
          <div className="text-xl font-bold text-white mt-1">{telemetry?.summary.totalRequests ?? 0}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <div className="text-[11px] font-medium text-slate-400 uppercase">Avg Latency</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">{telemetry?.summary.avgDurationMs ?? 0}ms</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <div className="text-[11px] font-medium text-slate-400 uppercase">P95 Latency</div>
          <div className="text-xl font-bold text-indigo-400 mt-1">{telemetry?.summary.p95DurationMs ?? 0}ms</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <div className="text-[11px] font-medium text-slate-400 uppercase">2xx Success</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">{telemetry?.summary.statusCounts['2xx'] ?? 0}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <div className="text-[11px] font-medium text-slate-400 uppercase">4xx Client Errors</div>
          <div className="text-xl font-bold text-amber-400 mt-1">{telemetry?.summary.statusCounts['4xx'] ?? 0}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <div className="text-[11px] font-medium text-slate-400 uppercase">5xx Server Errors</div>
          <div className="text-xl font-bold text-rose-400 mt-1">{telemetry?.summary.statusCounts['5xx'] ?? 0}</div>
        </div>
      </div>

      {/* Interactive Testing Console */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Echo & Body Parser Tester */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-400" />
              Body Parser & Header Tester
            </h3>
            <span className="text-xs text-slate-400">POST /api/middleware/echo</span>
          </div>

          <p className="text-xs text-slate-400 mb-3">
            Sends JSON body to backend. Inspect how the body parser, X-Request-Id, and X-Response-Time headers are generated.
          </p>

          <textarea
            value={echoPayload}
            onChange={(e) => setEchoPayload(e.target.value)}
            rows={5}
            className="w-full bg-slate-950 font-mono text-xs text-slate-200 border border-slate-700 rounded-xl p-3 focus:outline-none focus:border-indigo-500 mb-3"
          />

          <button
            onClick={handleSendEcho}
            disabled={isExecuting}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition shadow-md shadow-indigo-600/30"
          >
            <Send className="w-3.5 h-3.5" />
            Send Echo Request
          </button>

          {echoResponse && (
            <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800 overflow-x-auto text-xs font-mono">
              <div className="text-slate-400 text-[11px] mb-1 font-semibold uppercase">Response & Headers:</div>
              <pre className="text-slate-300">{JSON.stringify(echoResponse, null, 2)}</pre>
            </div>
          )}
        </div>

        {/* Centralized Error Simulation Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Centralized Error Handling Simulator
            </h3>
            <span className="text-xs text-slate-400">GET /api/middleware/simulate-error</span>
          </div>

          <p className="text-xs text-slate-400 mb-4">
            Simulate specific HTTP exceptions to inspect how the centralized error middleware normalizes them into structured JSON envelopes.
          </p>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => handleSimulateError('bad_request')}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
            >
              Simulate 400 Bad Request
            </button>
            <button
              onClick={() => handleSimulateError('validation')}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
            >
              Simulate 422 Validation
            </button>
            <button
              onClick={() => handleSimulateError('unauthorized')}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
            >
              Simulate 401 Unauthorized
            </button>
            <button
              onClick={() => handleSimulateError('internal_error')}
              className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-medium transition"
            >
              Simulate 500 Internal
            </button>
          </div>

          {errorSimulationResult && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 overflow-x-auto text-xs font-mono flex-1">
              <div className="text-rose-400 text-[11px] mb-1 font-semibold uppercase">Normalized Error Envelope:</div>
              <pre className="text-slate-300">{JSON.stringify(errorSimulationResult, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>

      {/* Live Request Inspector Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h3 className="text-sm font-semibold text-white">Live Request Log Stream (Buffer: {telemetry?.recentRequests.length || 0})</h3>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Filter by path, method, ID..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 w-48"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="2xx">2xx OK</option>
              <option value="4xx">4xx Errors</option>
              <option value="5xx">5xx Server</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 uppercase text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Method</th>
                <th className="py-2.5 px-3">Path</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Duration</th>
                <th className="py-2.5 px-3">Request ID</th>
                <th className="py-2.5 px-3">IP Address</th>
                <th className="py-2.5 px-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500 font-sans">
                    No requests match filter.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.id + req.timestamp} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-3 font-bold text-slate-200">{req.method}</td>
                    <td className="py-2.5 px-3 text-indigo-300 font-medium">{req.path}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                          req.status >= 500
                            ? 'bg-rose-500/20 text-rose-400'
                            : req.status >= 400
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{req.durationMs}ms</td>
                    <td className="py-2.5 px-3 text-slate-400 truncate max-w-[140px]" title={req.id}>
                      {req.id}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{req.ip}</td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {new Date(req.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MiddlewarePage;
