import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Send,
  Trash2,
  AlertTriangle,
  Layers,
  Terminal,
  RotateCw,
  Search,
  CheckCircle2,
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
  const [echoPayload, setEchoPayload] = useState('{\n  "service": "Forma Client",\n  "testValue": 42,\n  "secretKey": "TEST_SECRET_PLACEHOLDER"\n}');
  const [echoResponse, setEchoResponse] = useState<any>(null);
  const [errorSimulationResult, setErrorSimulationResult] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

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

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleClearTelemetry = async () => {
    await clearMiddlewareTelemetry();
    await loadTelemetry();
    showNotification('Telemetry buffer cleared successfully.');
  };

  const handleSendEcho = async () => {
    try {
      setIsExecuting(true);
      const parsed = JSON.parse(echoPayload);
      const result = await testEchoEndpoint(parsed);
      setEchoResponse(result);
      await loadTelemetry();
      showNotification('Echo request processed through complete pipeline.');
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
      showNotification(`Simulated ${type.toUpperCase()} error envelope received.`);
    } catch (err: any) {
      setErrorSimulationResult(err);
      await loadTelemetry();
      showNotification(`Normalized error response received.`);
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
    { num: '01', name: 'X-Request-Id', desc: 'UUID injection & propagation' },
    { num: '02', name: 'Request Timer', desc: 'Nanosecond hrtime precision' },
    { num: '03', name: 'Helmet & CORS', desc: 'HSTS, CSP, Frameguard headers' },
    { num: '04', name: 'Body Parsers', desc: '1MB JSON & URL-encoded parser' },
    { num: '05', name: 'Sanitized Logger', desc: 'Sensitive data masking & logs' },
    { num: '06', name: 'Rate Limiter', desc: 'express-rate-limit protection' },
    { num: '07', name: 'Zod Validator', desc: 'Type-safe schema validation' },
    { num: '08', name: 'Error Handler', desc: 'Centralized envelope normalization' },
  ];

  return (
    <div className="space-y-6 min-w-0 max-w-full font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-[#6257F5]" />
            Middleware & Request Lifecycle Inspector
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time inspection of request processing, headers, sanitization, and timing pipelines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadTelemetry}
            className="px-3.5 py-2 rounded-xl bg-[#1D2A3D] hover:bg-[#223249] text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition border border-[#34435B] shadow-sm"
          >
            <RotateCw className="w-3.5 h-3.5 text-[#5379F5]" />
            Refresh
          </button>
          <button
            onClick={handleClearTelemetry}
            className="px-3.5 py-2 rounded-xl bg-[#F16C80]/10 hover:bg-[#F16C80]/20 text-[#F16C80] border border-[#F16C80]/30 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Buffer
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3 bg-[#6257F5]/10 border border-[#6257F5]/30 rounded-xl text-xs text-[#A99CFB] flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-[#65DDA5] flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Middleware Architecture Pipeline Map */}
      <div className="bg-[#1D2A3D] border border-[#34435B] rounded-2xl p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#6257F5]" />
            Active Express Middleware Sequence
          </h3>
          <span className="text-[11px] text-[#65DDA5] font-mono bg-[#65DDA5]/10 px-2.5 py-0.5 rounded-full border border-[#65DDA5]/20 font-semibold">
            All 8 Stages Active
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {pipelineSteps.map((step) => (
            <div
              key={step.name}
              className="p-3 rounded-xl bg-[#172235] border border-[#34435B]/70 text-center flex flex-col items-center justify-center transition-all hover:border-[#6257F5] hover:shadow-glow-purple group"
            >
              <div className="w-7 h-7 rounded-lg bg-[#6257F5]/20 text-[#A99CFB] border border-[#6257F5]/40 text-xs font-bold flex items-center justify-center mb-2 font-mono group-hover:bg-[#6257F5] group-hover:text-white transition">
                {step.num}
              </div>
              <div className="text-xs font-bold text-slate-200 group-hover:text-white transition">{step.name}</div>
              <div className="text-[10px] text-slate-400 mt-1 leading-tight line-clamp-2">{step.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Telemetry Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-[#1D2A3D] border border-[#34435B] rounded-2xl p-4 shadow-card">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Requests</div>
          <div className="text-2xl font-extrabold text-white mt-1 font-sans">{telemetry?.summary.totalRequests ?? 0}</div>
        </div>

        <div className="bg-[#1D2A3D] border border-[#34435B] rounded-2xl p-4 shadow-card">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Avg Latency</div>
          <div className="text-2xl font-extrabold text-[#65DDA5] mt-1 font-mono">{telemetry?.summary.avgDurationMs ?? 0}ms</div>
        </div>

        <div className="bg-[#1D2A3D] border border-[#34435B] rounded-2xl p-4 shadow-card">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">P95 Latency</div>
          <div className="text-2xl font-extrabold text-[#5379F5] mt-1 font-mono">{telemetry?.summary.p95DurationMs ?? 0}ms</div>
        </div>

        <div className="bg-[#1D2A3D] border border-[#34435B] rounded-2xl p-4 shadow-card">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">2xx Success</div>
          <div className="text-2xl font-extrabold text-[#65DDA5] mt-1 font-mono">{telemetry?.summary.statusCounts['2xx'] ?? 0}</div>
        </div>

        <div className="bg-[#1D2A3D] border border-[#34435B] rounded-2xl p-4 shadow-card">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">4xx Client Errors</div>
          <div className="text-2xl font-extrabold text-[#F5B94C] mt-1 font-mono">{telemetry?.summary.statusCounts['4xx'] ?? 0}</div>
        </div>

        <div className="bg-[#1D2A3D] border border-[#34435B] rounded-2xl p-4 shadow-card">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">5xx Server Errors</div>
          <div className="text-2xl font-extrabold text-[#F16C80] mt-1 font-mono">{telemetry?.summary.statusCounts['5xx'] ?? 0}</div>
        </div>
      </div>

      {/* Interactive Testing Console */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Echo & Body Parser Tester */}
        <div className="bg-[#1D2A3D] border border-[#34435B] rounded-2xl p-5 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#6257F5]" />
                Body Parser & Header Tester
              </h3>
              <span className="text-xs font-mono text-slate-400 bg-[#172235] px-2 py-0.5 rounded border border-[#34435B]">
                POST /api/middleware/echo
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-3 leading-relaxed">
              Sends JSON body to backend. Inspect how the body parser, X-Request-Id, and X-Response-Time headers are generated.
            </p>

            <textarea
              value={echoPayload}
              onChange={(e) => setEchoPayload(e.target.value)}
              rows={5}
              className="w-full bg-[#141F30] font-mono text-xs text-slate-200 border border-[#34435B] rounded-xl p-3 focus:outline-none focus:border-[#6257F5] transition mb-3"
            />
          </div>

          <div>
            <button
              onClick={handleSendEcho}
              disabled={isExecuting}
              className="w-full px-4 py-2.5 rounded-xl bg-[#6257F5] hover:bg-[#5346EE] text-white text-xs font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-[#6257F5]/30"
            >
              <Send className="w-3.5 h-3.5" />
              Send Echo Request
            </button>

            {echoResponse && (
              <div className="mt-4 p-3.5 rounded-xl bg-[#141F30] border border-[#34435B] overflow-x-auto text-xs font-mono animate-fadeIn">
                <div className="text-[#A99CFB] text-[11px] mb-1.5 font-bold uppercase tracking-wider">
                  Response & Headers:
                </div>
                <pre className="text-slate-300 leading-tight">{JSON.stringify(echoResponse, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>

        {/* Centralized Error Simulation Panel */}
        <div className="bg-[#1D2A3D] border border-[#34435B] rounded-2xl p-5 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#F5B94C]" />
                Centralized Error Handling Simulator
              </h3>
              <span className="text-xs font-mono text-slate-400 bg-[#172235] px-2 py-0.5 rounded border border-[#34435B]">
                GET /api/middleware/simulate-error
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Simulate specific HTTP exceptions to inspect how the centralized error middleware normalizes them into structured JSON envelopes.
            </p>

            <div className="grid grid-cols-2 gap-2.5 mb-4">
              <button
                onClick={() => handleSimulateError('bad_request')}
                className="px-3.5 py-2.5 rounded-xl bg-[#172235] hover:bg-[#223249] text-slate-200 text-xs font-bold border border-[#34435B] transition"
              >
                Simulate 400 Bad Request
              </button>
              <button
                onClick={() => handleSimulateError('validation')}
                className="px-3.5 py-2.5 rounded-xl bg-[#172235] hover:bg-[#223249] text-slate-200 text-xs font-bold border border-[#34435B] transition"
              >
                Simulate 422 Validation
              </button>
              <button
                onClick={() => handleSimulateError('unauthorized')}
                className="px-3.5 py-2.5 rounded-xl bg-[#172235] hover:bg-[#223249] text-slate-200 text-xs font-bold border border-[#34435B] transition"
              >
                Simulate 401 Unauthorized
              </button>
              <button
                onClick={() => handleSimulateError('internal_error')}
                className="px-3.5 py-2.5 rounded-xl bg-[#F16C80]/15 hover:bg-[#F16C80]/25 text-[#F16C80] border border-[#F16C80]/30 text-xs font-bold transition"
              >
                Simulate 500 Internal
              </button>
            </div>
          </div>

          {errorSimulationResult && (
            <div className="p-3.5 rounded-xl bg-[#141F30] border border-[#34435B] overflow-x-auto text-xs font-mono animate-fadeIn">
              <div className="text-[#F16C80] text-[11px] mb-1.5 font-bold uppercase tracking-wider">
                Normalized Error Envelope:
              </div>
              <pre className="text-slate-300 leading-tight">{JSON.stringify(errorSimulationResult, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>

      {/* Live Request Inspector Table */}
      <div className="bg-[#1D2A3D] border border-[#34435B] rounded-2xl p-5 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h3 className="text-sm font-bold text-white tracking-tight">
            Live Request Log Stream (Buffer: {telemetry?.recentRequests.length || 0})
          </h3>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Filter by path, method, ID..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="bg-[#141F30] border border-[#34435B] text-xs text-slate-200 rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:border-[#6257F5] w-full sm:w-52"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#141F30] border border-[#34435B] text-xs text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#6257F5]"
            >
              <option value="ALL">All Status</option>
              <option value="2xx">2xx OK</option>
              <option value="4xx">4xx Errors</option>
              <option value="5xx">5xx Server</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs font-mono">
            <thead className="bg-[#141F30] text-slate-400 border-b border-[#34435B] uppercase text-[11px]">
              <tr>
                <th className="py-3 px-3.5">Method</th>
                <th className="py-3 px-3.5">Path</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5">Duration</th>
                <th className="py-3 px-3.5">Request ID</th>
                <th className="py-3 px-3.5">IP Address</th>
                <th className="py-3 px-3.5">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#34435B]/50 text-slate-300">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                    No requests match filter.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.id + req.timestamp} className="hover:bg-[#202E42] transition">
                    <td className="py-3 px-3.5">
                      <span className="font-bold text-white px-2 py-0.5 rounded bg-[#223249]">
                        {req.method}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-[#A99CFB] font-medium">{req.path}</td>
                    <td className="py-3 px-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                          req.status >= 500
                            ? 'bg-[#F16C80]/15 text-[#F16C80] border-[#F16C80]/30'
                            : req.status >= 400
                            ? 'bg-[#F5B94C]/15 text-[#F5B94C] border-[#F5B94C]/30'
                            : 'bg-[#65DDA5]/15 text-[#65DDA5] border-[#65DDA5]/30'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-slate-200">{req.durationMs}ms</td>
                    <td className="py-3 px-3.5 text-slate-400 truncate max-w-[140px]" title={req.id}>
                      {req.id}
                    </td>
                    <td className="py-3 px-3.5 text-slate-400">{req.ip}</td>
                    <td className="py-3 px-3.5 text-slate-400">
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
