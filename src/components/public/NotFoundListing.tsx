import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, ArrowLeft, Search, Sparkles } from 'lucide-react';

interface NotFoundListingProps {
  requestedSlug?: string;
}

export const NotFoundListing: React.FC<NotFoundListingProps> = ({ requestedSlug }) => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto my-auto space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400 shadow-2xl">
        <Building2 className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
          404 — Property Not Located
        </span>
        <h1 className="text-2xl font-extrabold text-zinc-100 tracking-tight">
          Estate Listing Unavailable
        </h1>
        <p className="text-xs text-zinc-400 leading-relaxed">
          The requested luxury listing page {requestedSlug && <code className="font-mono text-amber-300/90">/p/{requestedSlug}</code>} could not be found or has been moved.
        </p>
      </div>

      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
        <Link
          to="/p/the-grand-luminary-villa"
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20"
        >
          <Sparkles className="w-4 h-4" />
          <span>View Sample Estate</span>
        </Link>

        <Link
          to="/admin"
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 font-medium text-xs flex items-center justify-center gap-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Agency Dashboard</span>
        </Link>
      </div>
    </div>
  );
};
