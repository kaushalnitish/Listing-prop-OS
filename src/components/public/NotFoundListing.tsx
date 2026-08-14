import React from 'react';
import { Building2, ArrowLeft } from 'lucide-react';

interface NotFoundListingProps {
  requestedSlug?: string;
}

export const NotFoundListing: React.FC<NotFoundListingProps> = ({ requestedSlug }) => {
  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto my-auto space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-white border border-stone-200/80 flex items-center justify-center text-stone-700 shadow-sm">
        <Building2 className="w-8 h-8 text-emerald-800" />
      </div>

      <div className="space-y-3">
        <span className="inline-block text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60">
          Property Unavailable
        </span>
        <h1 className="text-2xl font-light text-stone-900 tracking-tight">
          Estate Listing Unavailable
        </h1>
        <p className="text-xs text-stone-600 leading-relaxed max-w-sm">
          The requested property listing showcase {requestedSlug && <code className="font-mono text-stone-800 font-semibold">/p/{requestedSlug}</code>} is currently unavailable or may have been updated.
        </p>
        <p className="text-[11px] text-stone-500 pt-1">
          Please contact your property advisor to receive an updated listing link.
        </p>
      </div>

      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
        <button
          type="button"
          onClick={handleGoBack}
          className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-white/80 hover:bg-white text-stone-800 border border-stone-200/80 backdrop-blur-md font-medium text-xs flex items-center justify-center gap-2 transition-all shadow-xs hover:shadow-md active:scale-[0.98]"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-stone-600" />
          <span>Return to Previous</span>
        </button>
        <a
          href="/sample"
          className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all shadow-xs hover:shadow-md active:scale-[0.98]"
        >
          <span>View Sample Property</span>
        </a>
      </div>
    </div>
  );
};

