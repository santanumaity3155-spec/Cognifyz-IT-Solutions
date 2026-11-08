import React from 'react';
import { FolderGit2, Search, Filter, Github } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import Card from '../components/common/Card.tsx';
import Button from '../components/common/Button.tsx';
import Badge from '../components/common/Badge.tsx';
import githubService from '../services/githubService.ts';

export const RepoExplorerPage: React.FC = () => {
  const { githubStatus } = useAuth();
  const isConnected = Boolean(githubStatus?.connected);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Repository Explorer</h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse public repositories, inspect star/fork metrics, and explore language byte statistics.
          </p>
        </div>
        <Badge variant="brand" size="md">
          Phase 8 Foundation
        </Badge>
      </div>

      {isConnected ? (
        <Card title="Repository Directory Interface">
          {/* Mock Search / Filter Shell */}
          <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                disabled
                placeholder="Search repositories by name, language, or topic..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button variant="outline" size="sm" leftIcon={<Filter className="w-4 h-4" />} disabled>
                Filters
              </Button>
            </div>
          </div>

          <div className="border border-dashed border-slate-300 rounded-xl p-12 text-center">
            <FolderGit2 className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">Repository Explorer Scaffolding Active</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
              Connected to @{githubStatus?.username}. Full searchable grid, pagination, language percentage bars, and repository modal deep-dives will activate in Phases 9 and 10.
            </p>
            <Badge variant="neutral" size="sm">
              Endpoints Ready: /api/github/repositories
            </Badge>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="text-center py-12">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-4">
              <FolderGit2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Connect GitHub to Explore Repositories</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-6">
              Connect your GitHub account to access repository metadata, language breakdown bars, and star distributions.
            </p>
            <Button
              variant="primary"
              size="md"
              leftIcon={<Github className="w-4 h-4" />}
              onClick={() => {
                window.location.href = githubService.getConnectUrl();
              }}
            >
              Connect GitHub
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default RepoExplorerPage;

