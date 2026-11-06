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
  Sparkles,
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

export const DashboardPage: React.FC = () => {
  // Demonstration preview dataset prepared for Phase 7 API connection
  const sampleMetrics = {
    totalStudents: 10,
    activeStudents: 7,
    pendingStudents: 2,
    totalCourses: 5,
  };

  const sampleCourses = [
    { course: 'Computer Science', count: 3, percentage: 30 },
    { course: 'Data Science', count: 2, percentage: 20 },
    { course: 'Information Technology', count: 2, percentage: 20 },
    { course: 'Electronics', count: 2, percentage: 20 },
    { course: 'Mechanical', count: 1, percentage: 10 },
  ];

  const sampleYears = [
    { academicYear: '1st Year', count: 2, percentage: 20 },
    { academicYear: '2nd Year', count: 2, percentage: 20 },
    { academicYear: '3rd Year', count: 3, percentage: 30 },
    { academicYear: '4th Year', count: 3, percentage: 30 },
  ];

  const recentPreview = [
    {
      studentId: 'STU-2026-010',
      fullName: 'Zoe Washington',
      course: 'Computer Science',
      date: 'Feb 10, 2026',
      status: 'Active',
    },
    {
      studentId: 'STU-2026-009',
      fullName: 'Carlos Mendez',
      course: 'Electronics',
      date: 'Feb 08, 2026',
      status: 'Suspended',
    },
    {
      studentId: 'STU-2026-008',
      fullName: 'Ananya Patel',
      course: 'Data Science',
      date: 'Feb 05, 2026',
      status: 'Graduated',
    },
    {
      studentId: 'STU-2026-007',
      fullName: "David O'Connor",
      course: 'Information Technology',
      date: 'Feb 03, 2026',
      status: 'Pending',
    },
    {
      studentId: 'STU-2026-006',
      fullName: 'Sarah Jenkins',
      course: 'Computer Science',
      date: 'Feb 01, 2026',
      status: 'Active',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/60 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Phase 6 UI Routing Scaffold Initialized
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Visual dashboard components mounted. Real-time Axios backend fetching connects in Phase 7.
            </p>
          </div>
        </div>

        <Link to="/students">
          <Button size="sm" icon={ArrowRight} iconPosition="right">
            Manage Students
          </Button>
        </Link>
      </div>

      {/* Page Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Executive Intelligence Dashboard
        </h1>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
          High-level institutional statistics and student distribution analytics
        </p>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={sampleMetrics.totalStudents}
          subtitle="Enrolled institutional records"
          icon={Users}
          trend={{ value: '+12% this term', isPositive: true }}
        />
        <StatCard
          title="Active Students"
          value={sampleMetrics.activeStudents}
          subtitle="Currently active attendance"
          icon={UserCheck}
          iconColor="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400"
          trend={{ value: '70% ratio', isPositive: true }}
        />
        <StatCard
          title="Pending Registrations"
          value={sampleMetrics.pendingStudents}
          subtitle="Awaiting document verification"
          icon={Clock}
          iconColor="text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-400"
        />
        <StatCard
          title="Offered Courses"
          value={sampleMetrics.totalCourses}
          subtitle="Engineering & Science branches"
          icon={BookOpen}
          iconColor="text-blue-600 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-400"
        />
      </div>

      {/* Distributions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Distribution */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Course Distribution
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enrollment breakdown by department
              </p>
            </div>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3 pt-2">
            {sampleCourses.map((item) => (
              <div key={item.course} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {item.course}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 font-semibold">
                    {item.count} ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Academic Year Split */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Academic Year Breakdown
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cohorts across undergraduate progression
              </p>
            </div>
            <GraduationCap className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3 pt-2">
            {sampleYears.map((item) => (
              <div key={item.academicYear} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {item.academicYear}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 font-semibold">
                    {item.count} ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
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
              Latest 5 additions to the institutional registry
            </p>
          </div>
          <Link
            to="/students"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-2.5 px-3">Student ID</th>
                <th className="py-2.5 px-3">Student Name</th>
                <th className="py-2.5 px-3">Course</th>
                <th className="py-2.5 px-3">Registered On</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {recentPreview.map((item) => (
                <tr key={item.studentId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                    {item.studentId}
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                    {item.fullName}
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                    {item.course}
                  </td>
                  <td className="py-3 px-3 text-slate-500 dark:text-slate-400">
                    {item.date}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Badge status={item.status} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
