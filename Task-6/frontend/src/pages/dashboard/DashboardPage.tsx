import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  GraduationCap, 
  Shield, 
  ArrowRight, 
  Activity, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Plus,
  BarChart3,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import dashboardService from '../../services/dashboardService';
import { DashboardStats } from '../../types/student';

export const DashboardPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    dashboardService
      .getStats()
      .then((res) => {
        if (isMounted && res.success) {
          setStats(res.data);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const message =
            err instanceof Error ? err.message : 'Failed to load dashboard metrics';
          setError(message);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Welcome & Role Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/10 border border-brand-500/20 text-brand-300">
            <Shield className="w-3.5 h-3.5" />
            <span>Authenticated Role: {user?.role}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            {isAdmin
              ? 'Administrator Mode: You possess full system-wide permissions to inspect, audit, and manage all student records.'
              : 'Student Mode: Your session is cryptographically scoped to student records created by your account. Data ownership is enforced on the server.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/students/new"
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-indigo-600/30 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Student</span>
          </Link>
          <Link
            to="/students"
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            <span>View Directory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">
              {isAdmin ? 'Total Students (System)' : 'My Student Records'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">
            {loading ? '...' : stats?.totalStudents ?? 0}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {isAdmin ? 'System-wide count across all owners' : 'Records created by your user account'}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Active Status</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-400">
            {loading ? '...' : stats?.activeStudents ?? 0}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Active academic status</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Pending Review</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-amber-400">
            {loading ? '...' : stats?.pendingStudents ?? 0}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Pending verification</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Total Courses</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-purple-400">
            {loading ? '...' : stats?.totalCourses ?? 0}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Distinct academic courses</span>
        </div>
      </div>

      {/* Course Distribution Breakdown (If available) */}
      {stats?.courseDistribution && stats.courseDistribution.length > 0 && (
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-brand-400" />
              <span>
                {isAdmin ? 'System Course Enrollment Distribution' : 'Your Enrolled Courses Breakdown'}
              </span>
            </h3>
            <span className="text-xs text-slate-400">
              {stats.courseDistribution.length} Active Courses
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {stats.courseDistribution.map((item) => (
              <div
                key={item.course}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white flex items-center space-x-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-brand-400" />
                    <span>{item.course}</span>
                  </span>
                  <span className="text-brand-300 font-mono font-bold">{item.count}</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-brand-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Share</span>
                  <span>{item.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security Architecture Summary Box */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
        <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
          <Activity className="w-4 h-4 text-brand-400" />
          <span>Active Session Security Profile</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-400 pt-2">
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/60">
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">User ID</span>
            <span className="font-mono text-white text-[11px]">{user?.id}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/60">
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Transport Security</span>
            <span className="text-emerald-400 font-semibold">HTTP-Only Cookie (forma_token)</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/60">
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">Authorization Enforcement</span>
            <span className="text-white font-semibold">
              {isAdmin ? 'Admin (System-Wide Control)' : 'Student (Resource-Owned Isolation)'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
