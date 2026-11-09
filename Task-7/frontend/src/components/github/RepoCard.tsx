import React from 'react';
import {
  Star,
  GitFork,
  CircleDot,
  Scale,
  ExternalLink,
  BookMarked,
  Info,
  Calendar,
} from 'lucide-react';
import { GitHubRepo } from '../../types/index.ts';
import Badge from '../common/Badge.tsx';
import Button from '../common/Button.tsx';
import { getLanguageColor } from './LanguageBreakdown.tsx';

export interface RepoCardProps {
  repo: GitHubRepo;
  onViewDetails?: (repo: GitHubRepo) => void;
  className?: string;
}

export const RepoCard: React.FC<RepoCardProps> = ({
  repo,
  onViewDetails,
  className = '',
}) => {
  // Format updated date cleanly
  const formattedUpdateDate = repo.updatedAt
    ? new Date(repo.updatedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recently';

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between ${className}`}
    >
      <div className="space-y-3">
        {/* Header: Name, Visibility Pill, and External Link */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-brand-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <BookMarked className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug truncate" title={repo.name}>
                {repo.name}
              </h3>
              <p className="text-[11px] font-mono text-slate-400 truncate" title={repo.fullName}>
                {repo.fullName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {repo.isPrivate ? (
              <Badge variant="warning" size="sm">Private</Badge>
            ) : (
              <Badge variant="neutral" size="sm">Public</Badge>
            )}
            {repo.isFork && (
              <Badge variant="purple" size="sm">Fork</Badge>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 min-h-[2.5rem] leading-relaxed break-words">
          {repo.description || (
            <span className="italic text-slate-400">No repository description provided.</span>
          )}
        </p>

        {/* Topics */}
        {repo.topics && repo.topics.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {repo.topics.slice(0, 4).map((topic) => (
              <span
                key={topic}
                className="text-[10px] font-medium bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full border border-brand-100"
              >
                #{topic}
              </span>
            ))}
            {repo.topics.length > 4 && (
              <span className="text-[10px] text-slate-400 px-1 py-0.5 self-center">
                +{repo.topics.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer: Metadata & Actions */}
      <div className="pt-4 mt-3 border-t border-slate-100 space-y-3">
        {/* Language, Stars, Forks, Issues, License */}
        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-500">
          {repo.language ? (
            <div className="inline-flex items-center gap-1.5 font-medium text-slate-700">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: getLanguageColor(repo.language) }}
              />
              <span className="truncate max-w-[100px]">{repo.language}</span>
            </div>
          ) : (
            <span className="text-slate-400">Markdown / Assets</span>
          )}

          <div className="inline-flex items-center gap-1" title={`${repo.starsCount} stargazers`}>
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400 flex-shrink-0" />
            <span className="font-mono text-slate-700">{repo.starsCount}</span>
          </div>

          <div className="inline-flex items-center gap-1" title={`${repo.forksCount} forks`}>
            <GitFork className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="font-mono text-slate-700">{repo.forksCount}</span>
          </div>

          <div className="inline-flex items-center gap-1" title={`${repo.openIssuesCount} open issues`}>
            <CircleDot className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="font-mono text-slate-700">{repo.openIssuesCount}</span>
          </div>

          {repo.license && (
            <div className="inline-flex items-center gap-1 text-[11px] text-slate-500" title={repo.license.name}>
              <Scale className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate max-w-[80px]">{repo.license.spdxId || repo.license.name}</span>
            </div>
          )}
        </div>

        {/* Date and Action Controls */}
        <div className="flex items-center justify-between pt-1 gap-2">
          <span className="text-[11px] text-slate-400 inline-flex items-center gap-1 truncate">
            <Calendar className="w-3 h-3 text-slate-400 flex-shrink-0" />
            {formattedUpdateDate}
          </span>

          <div className="flex items-center gap-2 flex-shrink-0">
            {onViewDetails && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDetails(repo)}
                leftIcon={<Info className="w-3.5 h-3.5" />}
              >
                Details
              </Button>
            )}

            <a
              href={repo.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-brand-600 hover:border-slate-300 hover:bg-slate-50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              title="Open repository on GitHub"
              aria-label={`Open repository ${repo.name} on GitHub`}
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RepoCard;
