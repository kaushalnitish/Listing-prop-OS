import React from 'react';
import { Check } from 'lucide-react';

interface PropertyStoryProps {
  description: string;
  highlights?: string[];
  amenities?: string[];
}

export const PropertyStory: React.FC<PropertyStoryProps> = ({
  description,
  highlights = [],
  amenities = [],
}) => {
  return (
    <div className="space-y-12 sm:space-y-16">
      {/* Narrative Overview */}
      <div className="space-y-4">
        <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-400">
          Overview
        </h2>
        <p className="text-base sm:text-lg text-zinc-300 leading-relaxed font-light whitespace-pre-line max-w-3xl">
          {description}
        </p>
      </div>

      {/* Feature Highlights */}
      {highlights.length > 0 && (
        <div className="space-y-6 pt-4 border-t border-zinc-800/80">
          <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-400">
            Key Highlights
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {highlights.map((highlight, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 text-zinc-200"
              >
                <div className="p-1 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-300 mt-0.5 shrink-0">
                  <Check className="w-3 h-3" />
                </div>
                <span className="text-sm font-normal text-zinc-200 leading-snug">
                  {highlight}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Luxury Amenities List */}
      {amenities.length > 0 && (
        <div className="space-y-6 pt-4 border-t border-zinc-800/80">
          <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-400">
            Estate Amenities
          </h2>

          <div className="flex flex-wrap gap-2.5">
            {amenities.map((amenity) => (
              <span
                key={amenity}
                className="px-4 py-2 rounded-full bg-zinc-900/80 border border-zinc-800 text-xs sm:text-sm font-medium text-zinc-200 tracking-wide"
              >
                {amenity}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

