import React, { useEffect, useState, useRef } from 'react';
import {
  X,
  Star,
  GitFork,
  CircleDot,
  Eye,
  GitBranch,
  Scale,
  Calendar,
  Copy,
  Check,
  ExternalLink,
  BookMarked,
  Code2,
} from 'lucide-react';
import { GitHubRepo, LanguageBreakdownData } from '../../types/index.ts';
import Badge from '../common/Badge.tsx';
import Button from '../common/Button.tsx';
import { LanguageBreakdown } from './LanguageBreakdown.tsx';

export interface RepoDetailModalProps {
  isOpen: boolean;
  repo: GitHubRepo | null;
  languagesData?: LanguageBreakdownData | null;
  languagesLoading?: boolean;
  onClose: () => void;
}

export const RepoDetailModal: React.FC<RepoDetailModalProps> = ({
  isOpen,
  repo,
  languagesData = null,
  languagesLoading = false,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Copy clone URL handler
  const handleCopyClone = async () => {
    if (!repo?.cloneUrl) return;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(repo.cloneUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = repo.cloneUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(false);
    }
  };

  if (!isOpen || !repo) return null;

  const formatDate = (iso: string | null) => {
    if (!iso) return 'N/A';
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="repo-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scaleUp"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <BookMarked className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 id="repo-modal-title" className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                  {repo.name}
                </h2>
                <Badge variant={repo.isPrivate ? 'warning' : 'neutral'} size="sm">
                  {repo.isPrivate ? 'Private' : 'Public'}
                </Badge>
                {repo.isFork && <Badge variant="purple" size="sm">Fork</Badge>}
              </div>
              <p className="text-xs font-mono text-slate-500 mt-0.5 truncate">{repo.fullName}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
            aria-label="Close repository details dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Description */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Description
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
              {repo.description || 'No description provided for this repository.'}
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-center gap-1">
                <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                Stars
              </span>
              <span className="text-lg font-bold text-slate-900 font-mono mt-1 block">
                {repo.starsCount}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-center gap-1">
                <GitFork className="w-3 h-3 text-slate-400" />
                Forks
              </span>
              <span className="text-lg font-bold text-slate-900 font-mono mt-1 block">
                {repo.forksCount}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-center gap-1">
                <CircleDot className="w-3 h-3 text-slate-400" />
                Open Issues
              </span>
              <span className="text-lg font-bold text-slate-900 font-mono mt-1 block">
                {repo.openIssuesCount}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-center gap-1">
                <Eye className="w-3 h-3 text-slate-400" />
                Watchers
              </span>
              <span className="text-lg font-bold text-slate-900 font-mono mt-1 block">
                {repo.watchersCount}
              </span>
            </div>
          </div>

          {/* Repository Properties & Branch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-slate-400" />
                Default Branch
              </span>
              <span className="font-mono font-semibold text-slate-800">{repo.defaultBranch}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-slate-400" />
                License
              </span>
              <span className="font-semibold text-slate-800 truncate max-w-[150px]">
                {repo.license ? repo.license.spdxId || repo.license.name : 'None specified'}
              </span>
            </div>
          </div>

          {/* Clone URL with Copy Action */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Clone HTTPS URL
            </h4>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={repo.cloneUrl}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 select-all focus:outline-none"
              />
              <Button
                variant={copied ? 'secondary' : 'outline'}
                size="sm"
                onClick={handleCopyClone}
                leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              >
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>

          {/* Topics */}
          {repo.topics && repo.topics.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Repository Topics
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {repo.topics.map((topic) => (
                  <span
                    key={topic}
                    className="text-xs font-medium bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full border border-brand-100"
                  >
                    #{topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Language Breakdown in Modal (if provided) */}
          {languagesData ? (
            <LanguageBreakdown
              data={languagesData}
              title="Repository Language Distribution"
              subtitle="Byte shares identified in this repository"
              isLoading={languagesLoading}
            />
          ) : (
            repo.language && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-slate-400" />
                  Primary Language
                </span>
                <span className="font-semibold text-slate-800">{repo.language}</span>
              </div>
            )
          )}

          {/* Dates & Timeline */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-100 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              Created: {formatDate(repo.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              Updated: {formatDate(repo.updatedAt)}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              Pushed: {formatDate(repo.pushedAt)}
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-200 bg-slate-50">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
          <a
            href={repo.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition shadow-sm"
          >
            Open on GitHub
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default RepoDetailModal;

