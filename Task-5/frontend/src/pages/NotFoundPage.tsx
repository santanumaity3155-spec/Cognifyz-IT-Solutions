import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';
import { Button } from '../components/common/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center py-12">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 text-center space-y-5 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 mx-auto flex items-center justify-center">
          <FileQuestion className="w-8 h-8" />
        </div>

        <div>
          <span className="text-xs font-bold font-mono text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
            Error 404
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            Page Not Found
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            The page you are looking for does not exist or has been moved to another URL.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Link to="/dashboard">
            <Button size="sm" icon={Home}>
              Go to Dashboard
            </Button>
          </Link>
          <Link to="/">
            <Button size="sm" variant="outline" icon={ArrowLeft}>
              Back Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

