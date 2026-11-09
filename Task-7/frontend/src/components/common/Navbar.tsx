import React from 'react';
import { Menu, LogOut, Github, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import ConnectionStatus from './ConnectionStatus.tsx';
import Button from './Button.tsx';

interface NavbarProps {
  onToggleSidebar: () => void;
  title?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, title = 'Developer Intelligence' }) => {
  const { user, isAuthenticated, githubStatus, logout } = useAuth();

  return (
    <header
      role="banner"
      aria-label="Forma platform header"
      className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Page Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="md:hidden text-slate-500 hover:text-slate-800 p-2 rounded-lg hover:bg-slate-100 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold shadow-xs shadow-brand-500/20">
              <Github className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-slate-900 tracking-tight text-base">Forma</span>
          </div>

          <div className="h-5 w-px bg-slate-200 hidden sm:block mx-1 flex-shrink-0" />

          <h2 className="text-sm font-semibold text-slate-800 truncate" title={title}>
            {title}
          </h2>
        </div>

        {/* Right: GitHub Status & User Profile */}
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          <ConnectionStatus
            connected={Boolean(githubStatus?.connected)}
            username={githubStatus?.username}
            className="hidden sm:inline-flex"
          />

          {isAuthenticated && user ? (
            <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:border-l sm:border-slate-200">
              <div className="w-8 h-8 rounded-full bg-brand-50 border border-brand-200 text-brand-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                {user.name ? user.name.slice(0, 2).toUpperCase() : <UserIcon className="w-4 h-4" />}
              </div>
              <div className="hidden lg:flex flex-col text-right min-w-0">
                <span className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                  {user.name}
                </span>
                <span className="text-[10px] text-slate-500 truncate max-w-[120px]">
                  {user.email}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                leftIcon={<LogOut className="w-4 h-4 text-slate-500" />}
                title="Sign out of student session"
                aria-label="Sign Out"
              >
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 hidden sm:inline font-medium">Guest Session</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
