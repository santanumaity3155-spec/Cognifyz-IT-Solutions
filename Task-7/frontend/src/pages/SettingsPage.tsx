import React from 'react';
import { Settings, User, Shield, Github, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import Card from '../components/common/Card.tsx';
import Button from '../components/common/Button.tsx';
import Badge from '../components/common/Badge.tsx';

export const SettingsPage: React.FC = () => {
  const { user, githubStatus, logout, disconnectGitHub } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Account & Platform Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your student credentials, GitHub OAuth linkage, and developer session.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Student Session Card */}
        <Card title="Student Account Profile">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{user?.name || 'Student User'}</h4>
                <p className="text-xs text-slate-500">{user?.email || 'student@forma.edu'}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Role:</span>
                <span className="font-semibold text-slate-800">{user?.role || 'Student'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Security:</span>
                <span className="font-semibold text-emerald-700">HTTP-Only Cookie Session</span>
              </div>
            </div>

            <div className="pt-2">
              <Button variant="outline" size="sm" onClick={logout} leftIcon={<LogOut className="w-3.5 h-3.5" />}>
                Sign Out
              </Button>
            </div>
          </div>
        </Card>

        {/* GitHub Linkage Settings */}
        <Card title="GitHub OAuth Linkage">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Github className="w-5 h-5 text-slate-800" />
                <span className="font-semibold text-sm text-slate-800">Connection State</span>
              </div>
              {githubStatus?.connected ? (
                <Badge variant="success" dot={true}>
                  Linked
                </Badge>
              ) : (
                <Badge variant="neutral" dot={true}>
                  Unlinked
                </Badge>
              )}
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {githubStatus?.connected
                ? `Connected to @${githubStatus.username}. Tokens are encrypted with AES-256-GCM at rest.`
                : 'No GitHub identity linked. Connect your account from the dashboard.'}
            </p>

            {githubStatus?.connected && (
              <div className="pt-2">
                <Button variant="danger" size="sm" onClick={disconnectGitHub}>
                  Disconnect GitHub Account
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
