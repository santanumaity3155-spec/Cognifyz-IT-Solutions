import React from 'react';
import { UserCheck, Github, ArrowRight, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import Card from '../components/common/Card.tsx';
import Button from '../components/common/Button.tsx';
import Badge from '../components/common/Badge.tsx';
import githubService from '../services/githubService.ts';

export const DeveloperProfilePage: React.FC = () => {
  const { githubStatus } = useAuth();
  const isConnected = Boolean(githubStatus?.connected);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Developer Profile</h1>
          <p className="text-sm text-slate-500 mt-1">
            Student developer intelligence, programming language breakdown, and public profile metrics.
          </p>
        </div>
        <Badge variant="brand" size="md">
          Phase 8 Foundation
        </Badge>
      </div>

      {isConnected ? (
        <Card
          title={`GitHub Identity: @${githubStatus?.username}`}
          subtitle="Connected via OAuth 2.0 Authorization Code flow"
          headerAction={
            githubStatus?.profileUrl && (
              <a
                href={githubStatus.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-semibold"
              >
                <span>Open on GitHub</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )
          }
        >
          <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            {githubStatus?.avatarUrl ? (
              <img
                src={githubStatus.avatarUrl}
                alt={githubStatus.username}
                className="w-16 h-16 rounded-full border-2 border-brand-500 shadow-sm"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                <Github className="w-8 h-8" />
              </div>
            )}
            <div>
              <h3 className="font-bold text-slate-900 text-lg">@{githubStatus?.username}</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Connected on {githubStatus?.connectedAt ? new Date(githubStatus.connectedAt).toLocaleDateString() : 'Active session'}
              </p>
              <div className="mt-2 inline-flex items-center gap-2">
                <Badge variant="success" size="sm">
                  Scopes: {githubStatus?.scopes?.join(', ') || 'read:user'}
                </Badge>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl border border-dashed border-slate-300 text-center py-8">
            <UserCheck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-700">Developer Analytics Module Ready</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Phase 8 frontend foundation connected. Full interactive profile visualization, bio inspection, and language distribution metrics will activate in Phases 9 and 10.
            </p>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="text-center py-12">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-4">
              <Github className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">GitHub Account Not Linked</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-6">
              Connect your GitHub account to inspect your public repositories, language distribution, and developer analytics.
            </p>
            <Button
              variant="primary"
              size="md"
              leftIcon={<Github className="w-4 h-4" />}
              onClick={() => {
                window.location.href = githubService.getConnectUrl();
              }}
            >
              Connect GitHub Account
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default DeveloperProfilePage;
