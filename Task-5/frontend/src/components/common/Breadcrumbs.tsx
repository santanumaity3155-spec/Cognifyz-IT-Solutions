import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0) return null;

  const breadcrumbNameMap: Record<string, string> = {
    dashboard: 'Dashboard',
    students: 'Students',
    new: 'Add Student',
    edit: 'Edit Student',
    settings: 'Settings',
  };

  return (
    <nav className="flex items-center text-xs text-slate-500 dark:text-slate-400 py-3 mb-4" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-2">
        <li className="inline-flex items-center">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Forma</span>
          </Link>
        </li>

        {pathnames.map((value, index) => {
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          const displayName = breadcrumbNameMap[value] || (value.startsWith('STU-') ? value : value);

          return (
            <li key={to} className="inline-flex items-center">
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 mx-1" />
              {isLast ? (
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {displayName}
                </span>
              ) : (
                <Link
                  to={to}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  {displayName}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
