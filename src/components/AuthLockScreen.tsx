import React, { useState } from 'react';
import { Eye, EyeOff, KeyRound, Lock, ShieldCheck } from 'lucide-react';
import { getStoredAuth, setupCredentials, verifyCredentials } from '../storage/auth';

interface AuthLockScreenProps {
  onAuthenticated: (username: string) => void;
}

export function AuthLockScreen({ onAuthenticated }: AuthLockScreenProps) {
  const storedAuth = getStoredAuth();
  const isFirstTimeSetup = !storedAuth;

  const [username, setUsername] = useState(storedAuth?.username || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedUser = username.trim();
    if (!trimmedUser) {
      setError('Please enter a username.');
      return;
    }

    if (!password) {
      setError('Please enter a password.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isFirstTimeSetup) {
        if (password.length < 4) {
          setError('Password must be at least 4 characters long.');
          setIsSubmitting(false);
          return;
        }

        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          setIsSubmitting(false);
          return;
        }

        await setupCredentials(trimmedUser, password);
        onAuthenticated(trimmedUser);
      } else {
        const isValid = await verifyCredentials(trimmedUser, password);
        if (isValid) {
          onAuthenticated(trimmedUser);
        } else {
          setError('Incorrect username or password.');
          setIsSubmitting(false);
        }
      }
    } catch {
      setError('An error occurred during authentication.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 text-slate-900">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center mx-auto shadow-sm">
            {isFirstTimeSetup ? <KeyRound className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {isFirstTimeSetup ? 'Setup ClarityOS Passcode' : 'Unlock ClarityOS'}
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
            {isFirstTimeSetup
              ? 'Choose a username and master password to secure your personal productivity workspace.'
              : 'Enter your credentials to access your Eisenhower Matrix, Goals, and Second Brain.'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="auth-username"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Username
              </label>
              <input
                id="auth-username"
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g., vivek"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-400 transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="auth-password"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete={isFirstTimeSetup ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full min-h-[44px] pl-3.5 pr-11 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-slate-700 transition-colors flex items-center justify-center"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {isFirstTimeSetup && (
              <div>
                <label
                  htmlFor="auth-confirm-password"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Confirm Password
                </label>
                <input
                  id="auth-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-400 transition-colors"
                />
              </div>
            )}

            {error && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[44px] px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-xs whitespace-nowrap"
            >
              {isFirstTimeSetup ? (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Set Password &amp; Open Workspace</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Unlock Workspace</span>
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-slate-400">
          Protected with client-side SHA-256 cryptographic hashing.
        </p>
      </div>
    </div>
  );
}
