import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-stone-200/80 bg-white py-6 text-center text-xs text-stone-500">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>© {new Date().getFullYear()} Listing OS — Real Estate Listing Platform</p>
        <p className="text-stone-400 font-normal text-[11px]">Property Management Platform</p>
      </div>
    </footer>
  );
};
