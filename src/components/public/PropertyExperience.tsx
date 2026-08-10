import React from 'react';
import { PropertyListing } from '../../types';
import { Layers, Sun, ShieldCheck, Car } from 'lucide-react';

interface PropertyExperienceProps {
  listing?: PropertyListing;
}

export const PropertyExperience: React.FC<PropertyExperienceProps> = ({
  listing,
}) => {
  const sqFtText =
    listing?.specs?.squareFeet && listing.specs.squareFeet > 0
      ? `${new Intl.NumberFormat('en-US').format(
          listing.specs.squareFeet
        )} sq ft layout`
      : '1,242 sq ft layout';

  const experienceItems = [
    {
      icon: Layers,
      title: 'Spacious Rooms',
      desc: sqFtText,
    },
    {
      icon: Sun,
      title: 'Ample Natural Light',
      desc: 'Optimized orientation for sun-lit living spaces',
    },
    {
      icon: ShieldCheck,
      title: 'Quality Construction',
      desc: '5-year wooden work warranty & quality finishes',
    },
    {
      icon: Car,
      title: 'Covered Parking',
      desc: 'Dedicated parking inside secure gated society',
    },
  ];

  // Pick the second photo if available, or cover photo, or luxury property photo
  const displayImage =
    listing?.images?.[1]?.url ||
    listing?.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80';

  return (
    <div className="w-full bg-[#FAF9F6] py-10 sm:py-14 border-b border-stone-200/80 my-4 max-w-full overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-8 lg:px-12 space-y-8 sm:space-y-12 min-w-0">
        {/* Header Block */}
        <div className="max-w-2xl space-y-2 min-w-0">
          <p className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-stone-500 font-normal truncate">
            DESIGNED FOR BETTER LIVING
          </p>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-normal text-stone-900 tracking-tight leading-[1.2] break-words">
            Spaces that elevate your everyday.
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 font-normal leading-relaxed pt-1 break-words">
            Thoughtful amenities and a secure environment crafted for modern families.
          </p>
        </div>

        {/* Content Layout: 4 benefit cards + Editorial Property Photo */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-w-0">
          {/* Left: 4 Benefit Cards Grid */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 min-w-0">
            {experienceItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="p-4 sm:p-5 rounded-2xl bg-white/80 border border-stone-200/80 shadow-2xs space-y-2.5 min-w-0"
                >
                  <div className="w-8 h-8 rounded-xl bg-stone-100 border border-stone-200/80 flex items-center justify-center text-stone-700 shrink-0">
                    <Icon className="w-4 h-4 stroke-[1.75]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-medium text-stone-900 break-words">
                      {item.title}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-stone-500 font-normal leading-relaxed mt-0.5 break-words">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Editorial Property Photo */}
          <div className="lg:col-span-5 relative aspect-[4/3] lg:aspect-[3/4] rounded-2xl sm:rounded-3xl overflow-hidden border border-stone-200/80 shadow-md bg-stone-100">
            <img
              src={displayImage}
              alt="Property Experience"
              width="800"
              height="1000"
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-[1.02]"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-900/30 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
};
