import React from 'react';
import { PropertyListing } from '../../types';
import { MapPin, Home, ShieldCheck, Navigation } from 'lucide-react';

interface PropertyHighlightsBandProps {
  listing?: PropertyListing;
}

export const PropertyHighlightsBand: React.FC<PropertyHighlightsBandProps> = ({
  listing,
}) => {
  // Extract or build dynamic highlight items matching the listing
  const locationDesc =
    listing?.location?.address ||
    listing?.highlights?.find(
      (h) =>
        h.toLowerCase().includes('location') ||
        h.toLowerCase().includes('highway')
    ) ||
    'Located near Chandigarh–Kharar Main Highway';

  const layoutDesc = listing?.specs
    ? `${listing.specs.bedrooms || 3} BHK ${
        listing.specs.propertyType || 'independent floor'
      } with optimized space planning`
    : '3 BHK independent floor with optimized space planning';

  const securityDesc =
    listing?.highlights?.find(
      (h) =>
        h.toLowerCase().includes('gated') ||
        h.toLowerCase().includes('secure') ||
        h.toLowerCase().includes('society')
    ) || 'Gated society with 24/7 security for peace of mind';

  const connectivityDesc =
    listing?.highlights?.find(
      (h) =>
        h.toLowerCase().includes('minutes') ||
        h.toLowerCase().includes('outlet') ||
        h.toLowerCase().includes('commercial')
    ) || 'Close to 100+ commercial outlets and daily essentials';

  const highlights = [
    {
      icon: MapPin,
      title: 'Prime Location',
      description: locationDesc,
    },
    {
      icon: Home,
      title: 'Modern Layout',
      description: layoutDesc,
    },
    {
      icon: ShieldCheck,
      title: 'Secure Community',
      description: securityDesc,
    },
    {
      icon: Navigation,
      title: 'Excellent Connectivity',
      description: connectivityDesc,
    },
  ];

  return (
    <div className="w-full bg-zinc-950 text-stone-100 py-10 sm:py-14 my-6 sm:my-10 border-y border-zinc-800/80 shadow-inner max-w-full overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-8 lg:px-12 space-y-8 min-w-0">
        {/* Header Eyebrow */}
        <div className="min-w-0">
          <h2 className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.22em] text-stone-400 font-normal truncate">
            PROPERTY HIGHLIGHTS
          </h2>
          <div className="h-px w-8 bg-stone-700 mt-2" />
        </div>

        {/* 4-Column Grid with thin dividers on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x lg:divide-zinc-800/90 min-w-0">
          {highlights.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex flex-col space-y-2.5 lg:px-6 first:lg:pl-0 last:lg:pr-0 min-w-0"
              >
                <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-stone-200 shrink-0">
                  <Icon className="w-4 h-4 stroke-[1.75]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-medium text-stone-100 tracking-tight break-words">
                    {item.title}
                  </h3>
                  <p className="text-xs text-stone-400 font-normal leading-relaxed mt-1 line-clamp-3 break-words">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
