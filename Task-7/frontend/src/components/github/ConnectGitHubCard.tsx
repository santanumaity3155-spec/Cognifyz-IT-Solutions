import React, { useState } from 'react';
import { Github, ExternalLink, Unlink, AlertCircle, CheckCircle2, ShieldCheck, Key } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import githubService from '../../services/githubService.ts';
import Button from '../common/Button.tsx';
import Card from '../common/Card.tsx';
import Badge from '../common/Badge.tsx';
import ConfirmModal from '../common/ConfirmModal.tsx';

export const ConnectGitHubCard: React.FC = () => {
  const { githubStatus, githubLoading, disconnectGitHub } = useAuth();
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const isConnected = Boolean(githubStatus?.connected);
  const isOAuthConfigured = githubStatus?.oauthConfigured !== false;

  const handleConnectClick = () => {
    // Navigate browser to backend OAuth initiation endpoint
    window.location.href = githubService.getConnectUrl();
  };

  const handleConfirmDisconnect = async () => {
    try {
      setDisconnecting(true);
      setActionError(null);
      await disconnectGitHub();
      setIsDisconnectModalOpen(false);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to disconnect GitHub account.');
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <>
      <Card
        title="GitHub OAuth 2.0 Integration"
        subtitle="Securely link your GitHub account to unlock Developer Intelligence, repository analytics, and language metrics."
        headerAction={
          isConnected ? (
            <Badge variant="success" dot={true}>
              Active Connection
            </Badge>
          ) : (
            <Badge variant="neutral" dot={true}>
              Not Connected
            </Badge>
          )
        }
      >
        {/* Unconfigured OAuth Warning Banner */}
        {!isOAuthConfigured && (
          <div className="mb-6 p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 text-xs sm:text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">GitHub OAuth App Configuration Required</p>
              <p className="mt-1 text-amber-700 leading-relaxed">
                The backend server requires <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">GITHUB_CLIENT_ID</code> and <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">GITHUB_CLIENT_SECRET</code> to be set in <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">backend/.env</code>.
              </p>
            </div>
          </div>
        )}

        {actionError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {actionError}
          </div>
        )}

        {isConnected ? (
          /* Connected State Interface */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 gap-4">
              <div className="flex items-center gap-4">
                {githubStatus?.avatarUrl ? (
                  <img
                    src={githubStatus.avatarUrl}
                    alt={githubStatus.username || 'GitHub Avatar'}
                    className="w-14 h-14 rounded-full border-2 border-brand-500 shadow-sm"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
                    <Github className="w-7 h-7" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-base">@{githubStatus?.username}</h4>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                      Verified
                    </span>
                  </div>
                  {githubStatus?.connectedAt && (
                    <p className="text-xs text-slate-500 mt-1">
                      Connected on {new Date(githubStatus.connectedAt).toLocaleDateString()}
                    </p>
                  )}
                  {githubStatus?.scopes && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <Key className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs text-slate-500">
                        Scopes: <span className="font-mono text-slate-700">{githubStatus.scopes.join(', ')}</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {githubStatus?.profileUrl && (
                  <a
                    href={githubStatus.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-brand-600 font-medium px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition"
                  >
                    <span>View GitHub Profile</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Unlink className="w-3.5 h-3.5 text-rose-500" />}
                  onClick={() => setIsDisconnectModalOpen(true)}
                  className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300"
                >
                  Disconnect
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
              <div className="p-3 rounded-lg bg-white border border-slate-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Encrypted at rest (AES-256-GCM)</span>
              </div>
              <div className="p-3 rounded-lg bg-white border border-slate-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Zero token exposure to browser JS</span>
              </div>
              <div className="p-3 rounded-lg bg-white border border-slate-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Isolated student ownership</span>
              </div>
            </div>
          </div>
        ) : (
          /* Disconnected State Interface */
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-xl bg-slate-50 border border-slate-200 gap-6">
              <div className="space-y-2 max-w-xl">
                <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Github className="w-5 h-5 text-slate-800" />
                  Connect with GitHub OAuth 2.0
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Link your account to inspect your public repositories, track real-time programming language distributions, and evaluate developer velocity metrics.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <Badge variant="brand" size="sm">
                    Read-only Scope
                  </Badge>
                  <Badge variant="neutral" size="sm">
                    CSRF Protected
                  </Badge>
                  <Badge variant="neutral" size="sm">
                    AES-256-GCM Encrypted
                  </Badge>
                </div>
              </div>

              <div>
                <Button
                  variant="primary"
                  size="lg"
                  leftIcon={<Github className="w-5 h-5" />}
                  isLoading={githubLoading}
                  onClick={handleConnectClick}
                  className="w-full sm:w-auto shadow-md shadow-brand-500/20"
                >
                  Connect GitHub
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Disconnect Confirmation Modal */}
      <ConfirmModal
        isOpen={isDisconnectModalOpen}
        title="Disconnect GitHub Account?"
        message="Are you sure you want to disconnect your GitHub account? This will securely purge your encrypted access token, purge cached developer analytics, and revoke platform access to your GitHub statistics."
        confirmLabel="Yes, Disconnect"
        cancelLabel="Keep Connected"
        variant="danger"
        isLoading={disconnecting}
        onConfirm={handleConfirmDisconnect}
        onCancel={() => setIsDisconnectModalOpen(false)}
      />
    </>
  );
};

export default ConnectGitHubCard;
