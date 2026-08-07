import React from 'react';

export const ListingSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-zinc-950 pb-28 animate-pulse space-y-12 sm:space-y-16">
      {/* Hero Gallery Skeleton */}
      <div className="relative w-full aspect-[16/9] lg:aspect-[21/9] bg-zinc-900">
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />
      </div>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-8 space-y-12">
        {/* Specs Skeleton */}
        <div className="space-y-4">
          <div className="h-4 w-40 bg-zinc-800/80 rounded" />
          <div className="h-12 w-3/4 bg-zinc-800/80 rounded-lg" />
          <div className="h-6 w-1/2 bg-zinc-800/60 rounded" />
          <div className="h-8 w-48 bg-zinc-800/60 rounded pt-2" />
        </div>

        {/* Quick Specs Bar Skeleton */}
        <div className="border-y border-zinc-800/80 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div className="h-16 bg-zinc-900 rounded-xl" />
          <div className="h-16 bg-zinc-900 rounded-xl" />
          <div className="h-16 bg-zinc-900 rounded-xl" />
          <div className="h-16 bg-zinc-900 rounded-xl" />
        </div>

        {/* Narrative Skeleton */}
        <div className="space-y-3">
          <div className="h-4 w-32 bg-zinc-800 rounded" />
          <div className="h-4 w-full bg-zinc-900 rounded" />
          <div className="h-4 w-5/6 bg-zinc-900 rounded" />
          <div className="h-4 w-4/6 bg-zinc-900 rounded" />
        </div>
      </div>
    </div>
  );
};

