import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import Card from '../components/common/Card.tsx';
import Button from '../components/common/Button.tsx';

export const CallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshGitHubStatus } = useAuth();
  const [hydrating, setHydrating] = useState(true);

  const status = searchParams.get('status');
  const username = searchParams.get('username');
  const error = searchParams.get('error');

  useEffect(() => {
    const syncStatus = async () => {
      try {
        await refreshGitHubStatus();
      } finally {
        setHydrating(false);
      }
    };

    syncStatus();
  }, [refreshGitHubStatus]);

  const isSuccess = status === 'success';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        {hydrating ? (
          <div className="py-8">
            <Loader2 className="w-10 h-10 text-brand-600 animate-spin mx-auto mb-4" />
            <h3 className="font-bold text-slate-800 text-base">Hydrating GitHub Session...</h3>
            <p className="text-xs text-slate-500 mt-1">Verifying encrypted connection with backend</p>
          </div>
        ) : isSuccess ? (
          <div className="py-6 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">GitHub Connected Successfully!</h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Your account is linked to <span className="font-bold text-slate-900">@{username}</span>.
                Access token has been safely encrypted at rest.
              </p>
            </div>
            <div className="pt-4">
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate('/dashboard')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-6 space-y-4">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">GitHub Connection Failed</h2>
              <p className="text-xs sm:text-sm text-rose-700 mt-1">
                {error ? `Reason: ${error}` : 'The authorization flow could not be completed.'}
              </p>
            </div>
            <div className="pt-4">
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate('/dashboard')}
                className="w-full"
              >
                Return to Dashboard
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default CallbackPage;
