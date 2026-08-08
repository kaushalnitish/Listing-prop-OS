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
    return <MapPin className="w-4 h-4 text-emerald-800 shrink-0" />;
  }
  if (
    lower.includes('secure') ||
    lower.includes('gated') ||
    lower.includes('cctv') ||
    lower.includes('guard') ||
    lower.includes('safety') ||
    lower.includes('society')
  ) {
    return <ShieldCheck className="w-4 h-4 text-emerald-800 shrink-0" />;
  }
  if (
    lower.includes('outlet') ||
    lower.includes('commercial') ||
    lower.includes('shop') ||
    lower.includes('market') ||
    lower.includes('mall') ||
    lower.includes('brand')
  ) {
    return <ShoppingBag className="w-4 h-4 text-emerald-800 shrink-0" />;
  }
  if (
    lower.includes('warranty') ||
    lower.includes('service') ||
    lower.includes('after-sale') ||
    lower.includes('quality') ||
    lower.includes('wooden') ||
    lower.includes('work')
  ) {
    return <Award className="w-4 h-4 text-emerald-800 shrink-0" />;
  }
  if (
    lower.includes('floor') ||
    lower.includes('roof') ||
    lower.includes('option') ||
    lower.includes('rights') ||
    lower.includes('level') ||
    lower.includes('structure')
  ) {
    return <Layers className="w-4 h-4 text-emerald-800 shrink-0" />;
  }
  return <CheckCircle2 className="w-4 h-4 text-emerald-800 shrink-0" />;
};

export const PropertyStory: React.FC<PropertyStoryProps> = ({
  description,
  highlights = [],
  amenities = [],
}) => {
  return (
    <div className="space-y-12 sm:space-y-16">
      {/* Narrative Overview */}
      <div className="space-y-3 sm:space-y-4">
        <h2 className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-stone-500">
          Overview
        </h2>
        <div className="text-sm sm:text-base text-stone-700 leading-relaxed sm:leading-7 font-normal whitespace-pre-line max-w-2xl sm:max-w-3xl space-y-4">
          {description}
        </div>
      </div>

      {/* KEY HIGHLIGHTS — Single Refined Light Glassmorphism Panel */}
      {highlights.length > 0 && (
        <div className="relative rounded-2xl bg-white/90 backdrop-blur-md border border-stone-200/80 p-6 sm:p-8 shadow-xs overflow-hidden">
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-800" />
              <h2 className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-stone-600">
                Key Highlights
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
              {highlights.map((highlight, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3.5 pb-4 sm:pb-0 border-b border-stone-100 sm:border-b-0 last:border-b-0"
                >
                  <div className="p-2 rounded-xl bg-stone-50 border border-stone-200/60 shrink-0 mt-0.5 shadow-2xs">
                    {getHighlightIcon(highlight)}
                  </div>
                  <p className="text-xs sm:text-sm font-normal text-stone-800 leading-relaxed pt-0.5">
                    {highlight}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Property Amenities List */}
      {amenities.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-stone-200/80">
          <h2 className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-stone-500">
            Property Amenities
          </h2>

          <div className="flex flex-wrap gap-2 sm:gap-2.5">
            {amenities.map((amenity) => (
              <span
                key={amenity}
                className="px-3.5 py-1.5 rounded-full bg-white border border-stone-200/80 text-xs font-normal text-stone-800 tracking-wide hover:border-stone-300 transition-colors shadow-2xs"
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


