import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { verifyAndLoginPasscode } from '../../lib/auth';

interface PrivateAccessPageProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

export const PrivateAccessPage: React.FC<PrivateAccessPageProps> = ({
  onSuccess,
  redirectTo,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine target path after successful unlock
  const fromPath =
    redirectTo ||
    (location.state as any)?.from?.pathname ||
    (location.pathname !== '/access' && location.pathname !== '/login' && location.pathname !== '/'
      ? location.pathname
      : '/admin');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = passcode.trim();
    if (!trimmed) {
      setError('Please enter your access code');
      return;
    }

    setIsSubmitting(true);

    // Validate passcode
    const isValid = verifyAndLoginPasscode(trimmed);

    if (isValid) {
      if (onSuccess) {
        onSuccess();
      } else {
        navigate(fromPath, { replace: true });
      }
    } else {
      setIsSubmitting(false);
      setError('Incorrect access code');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-900 flex flex-col justify-between items-center px-4 py-8 sm:py-12 antialiased selection:bg-stone-200">
      {/* Top Brand Marker */}
      <header className="w-full max-w-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-stone-900 flex items-center justify-center text-white shadow-2xs">
            <Lock className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-800">
            Listing OS
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100/80 border border-stone-200/60 text-[11px] font-medium text-stone-500">
          <ShieldCheck className="w-3 h-3 text-stone-600" />
          <span>Restricted</span>
        </div>
      </header>

      {/* Main Access Card */}
      <main className="w-full max-w-sm my-auto py-6">
        <div className="bg-white rounded-2xl border border-stone-200/80 p-6 sm:p-8 shadow-sm">
          {/* Header */}
          <div className="text-center space-y-2 mb-6">
            <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-stone-100 text-stone-900 mb-1 border border-stone-200/60">
              <Lock className="w-5 h-5 text-stone-700" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
              PRIVATE ACCESS
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 leading-relaxed max-w-xs mx-auto">
              This platform is currently private.
              <br />
              Enter your access code to continue.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="passcode-input" className="sr-only">
                Access Code
              </label>
              <div className="relative">
                <input
                  id="passcode-input"
                  type={showPasscode ? 'text' : 'password'}
                  inputMode="numeric"
                  autoComplete="current-password"
                  placeholder="Access Code"
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    if (error) setError(null);
                  }}
                  autoFocus
                  className={`w-full bg-stone-50/70 border rounded-xl px-4 py-3.5 pr-11 text-sm text-center text-stone-900 placeholder:text-stone-400 focus:outline-none focus:bg-white transition-all font-mono tracking-widest ${
                    error
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                      : 'border-stone-200 focus:border-stone-900 focus:ring-1 focus:ring-stone-900'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-stone-400 hover:text-stone-700 transition-colors"
                  aria-label={showPasscode ? 'Hide passcode' : 'Show passcode'}
                  tabIndex={-1}
                >
                  {showPasscode ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div
                  role="alert"
                  className="pt-1.5 text-center text-xs font-medium text-rose-600 animate-in fade-in duration-150"
                >
                  {error}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-stone-900 hover:bg-stone-800 active:scale-[0.99] text-white font-medium py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-2 group shadow-2xs cursor-pointer min-h-[44px]"
            >
              <span>{isSubmitting ? 'Verifying...' : 'Continue'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </form>
        </div>
      </main>

      {/* Footer minimal tag */}
      <footer className="w-full max-w-md text-center py-2">
        <p className="text-[11px] text-stone-400 font-normal tracking-wide">
          Listing OS &copy; {new Date().getFullYear()} &bull; Authorized Access Only
        </p>
      </footer>
    </div>
  );
};
