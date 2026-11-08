import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface PublicRouteProps {
  children?: React.ReactElement;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500 mb-3" />
        <p className="text-xs font-medium text-slate-400">Loading Forma...</p>
      </div>
    );
  }

  // If already authenticated, redirect away from login/register to intended destination or dashboard
  if (isAuthenticated) {
    const origin = (location.state as { from?: Location })?.from?.pathname || '/dashboard';
    return <Navigate to={origin} replace />;
  }

  return children ? children : <Outlet />;
};

export default PublicRoute;

