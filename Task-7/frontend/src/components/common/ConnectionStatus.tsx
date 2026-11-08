import React from 'react';
import { Github, CheckCircle2, AlertCircle } from 'lucide-react';
import Badge from './Badge.tsx';

interface ConnectionStatusProps {
  connected: boolean;
  username?: string;
  showIcon?: boolean;
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  connected,
  username,
  showIcon = true,
  className = '',
}) => {
  if (connected) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        {showIcon && <Github className="w-4 h-4 text-slate-800" />}
        <Badge variant="success" dot={true}>
          Connected{username ? `: @${username}` : ''}
        </Badge>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {showIcon && <Github className="w-4 h-4 text-slate-400" />}
      <Badge variant="neutral" dot={true}>
        Disconnected
      </Badge>
    </div>
  );
};

export default ConnectionStatus;
