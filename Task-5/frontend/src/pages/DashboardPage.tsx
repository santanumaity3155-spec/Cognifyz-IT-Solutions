import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserCheck,
  Clock,
  BookOpen,
  ArrowRight,
  TrendingUp,
  GraduationCap,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { useDashboard } from '../hooks/useDashboard';

export const DashboardPage: React.FC = () => {
  const { stats, isLoading, error, refetch } = useDashboard();

  // Skeleton loading view
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse w-72" />
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse w-48" />
          </div>
          <div className="h-9 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse w-28" />
        </div>

        {/* 4 Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 animate-pulse"
            />
          ))}
        </div>

        {/* Distribution Grids Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 animate-pulse" />
          <div className="h-64 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 animate-pulse" />
        </div>

        {/* Recent Table Skeleton */}
        <div className="h-64 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 animate-pulse" />
      </div>
    );
  }

  // Error Banner State with Retry
  if (error || !stats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Executive Intelligence Dashboard
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
              High-level institutional statistics and student distribution analytics
            </p>
          </div>
        </div>

        <ErrorBanner
          message={error?.message || 'Failed to connect to the backend stats service.'}
          onRetry={refetch}
          isRetrying={isLoading}
        />
      </div>
    );
  }

  const activeRatio = stats.totalStudents > 0
    ? `${Math.round((stats.activeStudents / stats.totalStudents) * 100)}% active`
    : '0% active';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Executive Intelligence Dashboard
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time analytics fetched directly from the Express REST API
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            icon={RefreshCw}
            isLoading={isLoading}
            onClick={() => refetch()}
            title="Refresh statistics from server"
          >
            Refresh Data
          </Button>

          <Link to="/students">
            <Button size="sm" icon={ArrowRight} iconPosition="right">
              Manage Students
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          subtitle="Enrolled institutional records"
          icon={Users}
          trend={{ value: `${stats.totalStudents} total`, isPositive: true }}
        />
        <StatCard
          title="Active Students"
          value={stats.activeStudents}
          subtitle="Currently active attendance"
          icon={UserCheck}
          iconColor="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400"
          trend={{ value: activeRatio, isPositive: true }}
        />
        <StatCard
          title="Pending Registrations"
          value={stats.pendingStudents}
          subtitle="Awaiting document verification"
          icon={Clock}
          iconColor="text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-400"
        />
        <StatCard
          title="Offered Courses"
          value={stats.totalCourses}
          subtitle="Distinct active departments"
          icon={BookOpen}
          iconColor="text-blue-600 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-400"
        />
      </div>

      {/* Distributions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course-Wise Student Distribution */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Course-Wise Student Distribution
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enrollment breakdown by department
              </p>
            </div>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3 pt-2">
            {stats.courseDistribution && stats.courseDistribution.length > 0 ? (
              stats.courseDistribution.map((item) => (
                <div key={item.course} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {item.course}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 font-semibold">
                      {item.count} student{item.count === 1 ? '' : 's'} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center italic">
                No course enrollment data available.
              </p>
            )}
          </div>
        </div>

        {/* Academic Year Distribution */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Academic Year Breakdown
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cohorts across undergraduate and postgraduate progression
              </p>
            </div>
            <GraduationCap className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3 pt-2">
            {stats.academicYearDistribution && stats.academicYearDistribution.length > 0 ? (
              stats.academicYearDistribution.map((item) => (
                <div key={item.academicYear} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {item.academicYear}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 font-semibold">
                      {item.count} student{item.count === 1 ? '' : 's'} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center italic">
                No academic year distribution data available.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Registrations Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Recent Student Registrations
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Latest additions to the institutional registry fetched live from backend
            </p>
          </div>
          <Link
            to="/students"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <span>View All Directory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-2.5 px-3">Student ID</th>
                <th className="py-2.5 px-3">Name & Email</th>
                <th className="py-2.5 px-3">Course</th>
                <th className="py-2.5 px-3">Registered On</th>
                <th className="py-2.5 px-3 text-right">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {stats.recentStudents && stats.recentStudents.length > 0 ? (
                stats.recentStudents.map((item) => (
                  <tr key={item.studentId || item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                      <Link to={`/students/${item.studentId || item._id}`} className="hover:underline">
                        {item.studentId}
                      </Link>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {item.fullName}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {item.email}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-medium">
                      {item.course}
                    </td>
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Badge status={item.registrationStatus} size="sm" />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        to={`/students/${item.studentId || item._id}`}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                    No recent student registrations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
