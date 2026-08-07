import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-zinc-800/60 bg-zinc-950 py-6 text-center text-xs text-zinc-400">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>© {new Date().getFullYear()} Lumina Studio — Internal Real Estate Listing Engine</p>
        <p className="text-zinc-400 font-mono text-[11px]">Mobile-First Luxury Listing Architecture</p>
      </div>
    </footer>
  );
};
