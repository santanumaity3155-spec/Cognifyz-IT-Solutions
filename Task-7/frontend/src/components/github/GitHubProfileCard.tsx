import React, { useState } from 'react';
import {
  Github,
  MapPin,
  Building,
  Globe,
  Calendar,
  Users,
  UserCheck,
  BookOpen,
  ExternalLink,
  User as UserIcon,
} from 'lucide-react';
import { GitHubProfile } from '../../types/index.ts';
import Card from '../common/Card.tsx';
import Badge from '../common/Badge.tsx';

export interface GitHubProfileCardProps {
  profile: GitHubProfile | null;
  isLoading?: boolean;
  className?: string;
}

export const GitHubProfileCard: React.FC<GitHubProfileCardProps> = ({
  profile,
  isLoading = false,
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);

  if (isLoading) {
    return (
      <Card className={`animate-pulse ${className}`}>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-24 h-24 rounded-2xl bg-slate-200" />
          <div className="flex-1 space-y-3 w-full">
            <div className="h-6 bg-slate-200 rounded w-1/3" />
            <div className="h-4 bg-slate-200 rounded w-1/4" />
            <div className="h-4 bg-slate-200 rounded w-3/4" />
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="h-14 bg-slate-200 rounded-xl" />
              <div className="h-14 bg-slate-200 rounded-xl" />
              <div className="h-14 bg-slate-200 rounded-xl" />
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card className={`text-center py-8 ${className}`}>
        <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
          <UserIcon className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-800">No Profile Data Available</h3>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
          Connect your GitHub account to synchronize and analyze your live developer profile.
        </p>
      </Card>
    );
  }

  // Format creation date safely
  const formattedJoinDate = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })
    : 'Unknown';

  return (
    <Card className={`overflow-hidden ${className}`}>
      <div className="flex flex-col md:flex-row items-start gap-6">
        {/* Avatar & Identicon Fallback */}
        <div className="relative mx-auto md:mx-0 flex-shrink-0">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-100 shadow-sm flex items-center justify-center">
            {profile.avatarUrl && !imgError ? (
              <img
                src={profile.avatarUrl}
                alt={`${profile.name || profile.login}'s GitHub avatar`}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-brand-50 text-brand-600">
                <Github className="w-10 h-10" />
                <span className="text-[11px] font-bold font-mono mt-1">
                  {profile.login.slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <span className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-md border border-slate-200">
            <Github className="w-4 h-4 text-slate-800" />
          </span>
        </div>

        {/* Identity & Metadata */}
        <div className="flex-1 min-w-0 w-full text-center md:text-left space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {profile.name || profile.login}
                </h2>
                <Badge variant="brand" size="sm">
                  Developer
                </Badge>
              </div>
              <a
                href={profile.profileUrl || `https://github.com/${profile.login}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs sm:text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline inline-flex items-center gap-1 mt-0.5"
                title="View on GitHub"
              >
                @{profile.login}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <a
              href={profile.profileUrl || `https://github.com/${profile.login}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition shadow-sm mx-auto md:mx-0"
            >
              <Github className="w-3.5 h-3.5" />
              GitHub Profile
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
              {profile.bio}
            </p>
          )}

          {/* Meta Details: Location, Company, Blog, Join Date */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-y-2 gap-x-4 text-xs text-slate-500 pt-1">
            {profile.company && (
              <span className="inline-flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                {profile.company}
              </span>
            )}

            {profile.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {profile.location}
              </span>
            )}

            {profile.blog && (
              <a
                href={profile.blog.startsWith('http') ? profile.blog : `https://${profile.blog}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-brand-600 truncate max-w-xs transition"
              >
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                {profile.blog.replace(/^https?:\/\//, '')}
              </a>
            )}

            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Member since {formattedJoinDate}
            </span>
          </div>

          {/* Numerical Analytics Highlights */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block flex items-center justify-center gap-1">
                <BookOpen className="w-3 h-3 text-slate-400" />
                Public Repos
              </span>
              <span className="text-lg sm:text-xl font-extrabold text-slate-900 font-mono mt-0.5 block">
                {profile.publicRepos}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block flex items-center justify-center gap-1">
                <Users className="w-3 h-3 text-slate-400" />
                Followers
              </span>
              <span className="text-lg sm:text-xl font-extrabold text-slate-900 font-mono mt-0.5 block">
                {profile.followers}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block flex items-center justify-center gap-1">
                <UserCheck className="w-3 h-3 text-slate-400" />
                Following
              </span>
              <span className="text-lg sm:text-xl font-extrabold text-slate-900 font-mono mt-0.5 block">
                {profile.following}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default GitHubProfileCard;

