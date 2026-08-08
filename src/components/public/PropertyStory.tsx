import React from 'react';
import {
  MapPin,
  ShieldCheck,
  ShoppingBag,
  Award,
  Layers,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

interface PropertyStoryProps {
  description: string;
  highlights?: string[];
  amenities?: string[];
}

const getHighlightIcon = (text: string) => {
  const lower = text.toLowerCase();
  if (
    lower.includes('location') ||
    lower.includes('sector') ||
    lower.includes('minutes') ||
    lower.includes('near') ||
    lower.includes('highway') ||
    lower.includes('chandigarh') ||
    lower.includes('road')
  ) {
    return <MapPin className="w-4 h-4 text-zinc-400 shrink-0" />;
  }
  if (
    lower.includes('secure') ||
    lower.includes('gated') ||
    lower.includes('cctv') ||
    lower.includes('guard') ||
    lower.includes('safety') ||
    lower.includes('society')
  ) {
    return <ShieldCheck className="w-4 h-4 text-zinc-400 shrink-0" />;
  }
  if (
    lower.includes('outlet') ||
    lower.includes('commercial') ||
    lower.includes('shop') ||
    lower.includes('market') ||
    lower.includes('mall') ||
    lower.includes('brand')
  ) {
    return <ShoppingBag className="w-4 h-4 text-zinc-400 shrink-0" />;
  }
  if (
    lower.includes('warranty') ||
    lower.includes('service') ||
    lower.includes('after-sale') ||
    lower.includes('quality') ||
    lower.includes('wooden') ||
    lower.includes('work')
  ) {
    return <Award className="w-4 h-4 text-zinc-400 shrink-0" />;
  }
  if (
    lower.includes('floor') ||
    lower.includes('roof') ||
    lower.includes('option') ||
    lower.includes('rights') ||
    lower.includes('level') ||
    lower.includes('structure')
  ) {
    return <Layers className="w-4 h-4 text-zinc-400 shrink-0" />;
  }
  return <CheckCircle2 className="w-4 h-4 text-zinc-400 shrink-0" />;
};

export const PropertyStory: React.FC<PropertyStoryProps> = ({
  description,
  highlights = [],
  amenities = [],
}) => {
  return (
    <div className="space-y-12 sm:space-y-16">
      {/* Narrative Overview (Pure Editorial Text Section, No Card) */}
      <div className="space-y-3 sm:space-y-4">
        <h2 className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-zinc-500">
          Overview
        </h2>
        <div className="text-sm sm:text-base text-zinc-300 leading-relaxed sm:leading-7 font-light whitespace-pre-line max-w-2xl sm:max-w-3xl space-y-4">
          {description}
        </div>
      </div>

      {/* KEY HIGHLIGHTS — Single Frosted Glassmorphism Architectural Panel */}
      {highlights.length > 0 && (
        <div className="relative rounded-2xl bg-zinc-900/40 backdrop-blur-md border border-white/[0.08] p-6 sm:p-8 shadow-2xl shadow-black/40 overflow-hidden">
          {/* Frosted architectural glass gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-transparent pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
              <h2 className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-zinc-400">
                Key Highlights
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
              {highlights.map((highlight, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3.5 pb-4 sm:pb-0 border-b border-white/[0.04] sm:border-b-0 last:border-b-0"
                >
                  <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] shrink-0 mt-0.5 shadow-sm">
                    {getHighlightIcon(highlight)}
                  </div>
                  <p className="text-xs sm:text-sm font-normal text-zinc-200 leading-relaxed pt-0.5">
                    {highlight}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Luxury Amenities List */}
      {amenities.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-white/[0.08]">
          <h2 className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-zinc-500">
            Property Amenities
          </h2>

          <div className="flex flex-wrap gap-2 sm:gap-2.5">
            {amenities.map((amenity) => (
              <span
                key={amenity}
                className="px-3.5 py-1.5 rounded-full bg-zinc-900/50 border border-white/[0.08] text-xs font-normal text-zinc-300 tracking-wide hover:border-zinc-700 transition-colors"
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


