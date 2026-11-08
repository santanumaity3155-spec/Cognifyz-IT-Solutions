import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, Lock, Mail, User, Shield } from 'lucide-react';
import { AuthLayout } from '../../layouts/AuthLayout';
import PasswordStrengthMeter, { evaluatePasswordCriteria } from '../../components/common/PasswordStrengthMeter';
import authService from '../../services/authService';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const validate = (): string | null => {
    if (!name.trim()) return 'Full name is required.';
    if (name.trim().length < 2) return 'Full name must be at least 2 characters long.';
    if (!email.trim()) return 'Email address is required.';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) return 'Please provide a valid email address.';

    if (!password) return 'Password is required.';

    const criteria = evaluatePasswordCriteria(password);
    const unmet = criteria.filter((c) => !c.met);
    if (unmet.length > 0) {
      return `Password does not meet requirements: ${unmet[0].label}.`;
    }

    if (!confirmPassword) return 'Please confirm your password.';
    if (password !== confirmPassword) return 'Passwords do not match.';

    if (!agreeTerms) return 'You must agree to the terms of service.';

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const validationError = validate();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setLoading(true);

    try {
      const response = await authService.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      setSuccessMessage(
        response.message || 'Account registered successfully! Redirecting to login...'
      );

      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create an Account"
      subtitle="Join Forma to securely store and manage your student academic records."
    >
      {/* Error Alert */}
      {errorMessage && (
        <div
          role="alert"
          className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start space-x-2.5 text-xs animate-in fade-in"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Success Alert */}
      {successMessage && (
        <div
          role="status"
          className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-start space-x-2.5 text-xs animate-in fade-in"
        >
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Full Name */}
        <div>
          <label htmlFor="register-name" className="block text-xs font-semibold text-slate-300 mb-1.5">
            Full Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <User className="w-4 h-4" />
            </div>
            <input
              id="register-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sarah Connor"
              disabled={loading}
              className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition disabled:opacity-50"
            />
          </div>
        </div>

        {/* Email Address */}
        <div>
          <label htmlFor="register-email" className="block text-xs font-semibold text-slate-300 mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sarah.connor@example.com"
              disabled={loading}
              className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition disabled:opacity-50"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label htmlFor="register-password" className="block text-xs font-semibold text-slate-300 mb-1.5">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              className="w-full pl-9 pr-10 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {/* Interactive Password Strength Indicator */}
          <PasswordStrengthMeter password={password} />
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="register-confirm-password" className="block text-xs font-semibold text-slate-300 mb-1.5">
            Confirm Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="register-confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              className="w-full pl-9 pr-10 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition focus:outline-none"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Account Role Notice */}
        <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800 flex items-center space-x-2 text-[11px] text-slate-400">
          <Shield className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
          <span>New accounts are assigned the standard <strong>Student</strong> role.</span>
        </div>

        {/* Terms Checkbox */}
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <input
            id="register-terms"
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-brand-600 focus:ring-brand-500 focus:ring-offset-slate-900"
          />
          <label htmlFor="register-terms" className="cursor-pointer select-none">
            I agree to the Forma Platform Terms of Service and Privacy Policy
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-2.5 px-4 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Creating your account...</span>
            </>
          ) : (
            <span>Create Student Account</span>
          )}
        </button>

        {/* Navigation to Login */}
        <div className="text-center pt-2 text-xs text-slate-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-brand-400 hover:text-brand-300 underline underline-offset-2 transition"
          >
            Sign in here
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default RegisterPage;

