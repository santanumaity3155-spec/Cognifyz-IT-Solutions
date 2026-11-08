import React from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthMeterProps {
  password: string;
}

export interface PasswordCriterion {
  id: string;
  label: string;
  met: boolean;
}

export const evaluatePasswordCriteria = (password: string): PasswordCriterion[] => [
  {
    id: 'length',
    label: 'At least 8 characters',
    met: password.length >= 8,
  },
  {
    id: 'upper',
    label: 'Uppercase letter (A-Z)',
    met: /[A-Z]/.test(password),
  },
  {
    id: 'lower',
    label: 'Lowercase letter (a-z)',
    met: /[a-z]/.test(password),
  },
  {
    id: 'number',
    label: 'Numeric digit (0-9)',
    met: /[0-9]/.test(password),
  },
  {
    id: 'special',
    label: 'Special character (!@#$%)',
    met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  },
];

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  if (!password) return null;

  const criteria = evaluatePasswordCriteria(password);
  const metCount = criteria.filter((c) => c.met).length;
  const percentage = (metCount / criteria.length) * 100;

  let strengthLabel = 'Weak';
  let strengthColor = 'bg-rose-500';
  let textColor = 'text-rose-400';

  if (metCount >= 5) {
    strengthLabel = 'Very Strong';
    strengthColor = 'bg-emerald-500';
    textColor = 'text-emerald-400';
  } else if (metCount >= 4) {
    strengthLabel = 'Strong';
    strengthColor = 'bg-emerald-400';
    textColor = 'text-emerald-300';
  } else if (metCount >= 3) {
    strengthLabel = 'Moderate';
    strengthColor = 'bg-amber-400';
    textColor = 'text-amber-400';
  }

  return (
    <div className="mt-2 space-y-2 text-xs" data-testid="password-strength-meter">
      {/* Strength Bar */}
      <div className="flex items-center justify-between text-xs font-medium">
        <span className="text-slate-400">Password Strength:</span>
        <span className={`font-semibold ${textColor}`}>{strengthLabel}</span>
      </div>
      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${strengthColor} transition-all duration-300 rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Criteria Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
        {criteria.map((c) => (
          <div
            key={c.id}
            className={`flex items-center space-x-1.5 ${
              c.met ? 'text-emerald-400' : 'text-slate-500'
            }`}
          >
            {c.met ? (
              <Check className="w-3.5 h-3.5 flex-shrink-0 text-emerald-400" />
            ) : (
              <X className="w-3.5 h-3.5 flex-shrink-0 text-slate-600" />
            )}
            <span className="text-[11px]">{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PasswordStrengthMeter;

