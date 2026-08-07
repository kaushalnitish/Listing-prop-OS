import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { loginAdmin } from '../../lib/auth';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/admin';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!pin.trim()) {
      setError('Enter your access passkey');
      return;
    }

    const success = loginAdmin(pin);
    if (success) {
      navigate(from, { replace: true });
    } else {
      setError('Invalid access passkey');
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col items-center justify-between p-6 sm:p-12 font-sans selection:bg-zinc-800 selection:text-zinc-100">
      {/* Top Brand Marker */}
      <div className="w-full max-w-sm flex items-center justify-between pt-4">
        <span className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-500">
          Lumina Studio
        </span>
        <span className="text-[11px] font-mono text-zinc-600">
          v1.0 • Internal
        </span>
      </div>

      {/* Center Frameless Form */}
      <div className="w-full max-w-xs my-auto space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-light tracking-tight text-white">
            Private Access
          </h1>
          <p className="text-xs text-zinc-500 font-normal tracking-wide">
            Enter authorized passkey to continue
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <div className="relative">
              <input
                type="password"
                placeholder="Passkey"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  if (error) setError(null);
                }}
                autoFocus
                className="w-full bg-zinc-950/80 border border-zinc-800/80 rounded-xl px-4 py-3 text-sm text-center text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all font-mono tracking-widest"
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 font-normal text-center tracking-wide pt-1 animate-in fade-in duration-150">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-white hover:bg-zinc-200 text-zinc-950 font-medium py-3 rounded-xl text-xs uppercase tracking-wider transition-all duration-200 active:scale-[0.99] flex items-center justify-center gap-2 group shadow-sm"
          >
            <span>Authenticate</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </form>
      </div>

      {/* Footer minimal tag */}
      <div className="w-full max-w-sm text-center pb-4">
        <p className="text-[11px] font-mono text-zinc-600 tracking-wider">
          Restricted to authorized estate directors
        </p>
      </div>
    </div>
  );
};

