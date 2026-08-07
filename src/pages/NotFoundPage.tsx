import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-500 flex items-center justify-center mb-4">
        <Building2 className="w-6 h-6" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Page Not Found</h1>
      <p className="text-xs text-zinc-400 mt-1 max-w-xs">
        The route you are looking for does not exist or has been relocated.
      </p>
      <Link
        to="/admin"
        className="mt-6 inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-xs px-4 py-2 rounded-xl transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Dashboard</span>
      </Link>
    </div>
  );
};
