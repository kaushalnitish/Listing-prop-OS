import React from 'react';
import { PropertySpecs as SpecsTypes, PropertyLocation } from '../../types';
import { MapPin, Calendar, Car } from 'lucide-react';

interface PropertySpecsProps {
  price: number;
  currency: string;
  title: string;
  tagline?: string;
  specs: SpecsTypes;
  location: PropertyLocation;
}

export const PropertySpecs: React.FC<PropertySpecsProps> = ({
  price,
  currency,
  title,
  tagline,
  specs,
  location,
}) => {
  const formattedPrice =
    typeof price === 'number' && !isNaN(price) && price >= 0
      ? new Intl.NumberFormat('en-US').format(price)
      : '—';

  const locationText = [
    location?.neighborhood,
    location?.city,
    location?.state,
    location?.country,
  ]
    .filter(Boolean)
    .join(' • ');

  // Sanitize spec values to avoid negative/invalid data such as "-13"
  const safeBedrooms =
    typeof specs?.bedrooms === 'number' && !isNaN(specs.bedrooms) && specs.bedrooms >= 0
      ? specs.bedrooms
      : '—';

  const safeBathrooms =
    typeof specs?.bathrooms === 'number' && !isNaN(specs.bathrooms) && specs.bathrooms >= 0
      ? specs.bathrooms
      : '—';

  const safeSqFt =
    typeof specs?.squareFeet === 'number' && !isNaN(specs.squareFeet) && specs.squareFeet > 0
      ? new Intl.NumberFormat('en-US').format(specs.squareFeet)
      : '—';

  const safePropertyType = specs?.propertyType || 'Residential';

  const hasYearBuilt = typeof specs?.yearBuilt === 'number' && specs.yearBuilt > 1800;
  const hasParking = typeof specs?.parkingSpaces === 'number' && specs.parkingSpaces > 0;

  return (
    <div className="space-y-6 sm:space-y-8 w-full max-w-full">
      {/* Title, Headline & Price Block — Subtle Warm White Glass Card */}
      <div className="rounded-2xl sm:rounded-3xl bg-white/75 backdrop-blur-md border border-stone-200/80 p-5 sm:p-8 lg:p-10 shadow-sm relative overflow-hidden space-y-4 w-full">
        {locationText && (
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-stone-500 min-w-0">
            <MapPin className="w-3.5 h-3.5 text-stone-500 shrink-0" />
            <span className="truncate min-w-0">{locationText}</span>
          </div>
        )}

        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-light tracking-tight text-stone-900 leading-[1.15] break-words">
          {title}
        </h1>

        {tagline && (
          <p className="text-sm sm:text-base text-stone-600 font-normal leading-relaxed pt-0.5 break-words">
            {tagline}
          </p>
        )}

        {/* Price Presentation */}
        <div className="pt-2 flex items-baseline gap-3 min-w-0 border-t border-stone-200/60">
          <span className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-stone-500 shrink-0">
            Offered At
          </span>
          <span className="text-2xl sm:text-3xl font-light text-stone-900 tracking-tight break-all">
            {currency}{formattedPrice}
          </span>
        </div>
      </div>

      {/* Section B: Key Architectural Stats Card — Premium Warm White Glass Panel */}
      <div className="rounded-2xl sm:rounded-3xl bg-white/85 backdrop-blur-md border border-stone-200/80 p-5 sm:p-6 lg:p-8 shadow-sm relative overflow-hidden w-full max-w-full">
        <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 w-full">
          <div className="min-w-0 p-3 sm:p-4 rounded-xl bg-stone-50/50 border border-stone-200/40">
            <p className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.18em] text-stone-500 truncate">
              Bedrooms
            </p>
            <p className="text-xl sm:text-2xl font-light text-stone-900 mt-1 truncate">
              {safeBedrooms}
            </p>
          </div>

          <div className="min-w-0 p-3 sm:p-4 rounded-xl bg-stone-50/50 border border-stone-200/40">
            <p className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.18em] text-stone-500 truncate">
              Bathrooms
            </p>
            <p className="text-xl sm:text-2xl font-light text-stone-900 mt-1 truncate">
              {safeBathrooms}
            </p>
          </div>

          <div className="min-w-0 p-3 sm:p-4 rounded-xl bg-stone-50/50 border border-stone-200/40">
            <p className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.18em] text-stone-500 truncate">
              Living Area
            </p>
            <p className="text-xl sm:text-2xl font-light text-stone-900 mt-1 truncate">
              {safeSqFt}{' '}
              {safeSqFt !== '—' && (
                <span className="text-xs text-stone-500 font-normal">sq ft</span>
              )}
            </p>
          </div>

          <div className="min-w-0 p-3 sm:p-4 rounded-xl bg-stone-50/50 border border-stone-200/40">
            <p className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.18em] text-stone-500 truncate">
              Property Type
            </p>
            <p className="text-base sm:text-lg font-light text-stone-900 mt-1 break-words">
              {safePropertyType}
            </p>
          </div>
        </div>
      </div>

      {/* Section C: Year Built / Garage Section — Secondary Warm Glass Card */}
      {(hasYearBuilt || hasParking) && (
        <div className="rounded-xl sm:rounded-2xl bg-white/75 backdrop-blur-md border border-stone-200/80 p-4 sm:p-5 shadow-2xs flex flex-wrap items-center gap-6 text-xs text-stone-700 font-mono tracking-wider w-full">
          {hasYearBuilt && (
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-stone-500 shrink-0" />
              <span>Year Built: {specs.yearBuilt}</span>
            </div>
          )}
          {hasParking && (
            <div className="flex items-center gap-2">
              <Car className="w-3.5 h-3.5 text-stone-500 shrink-0" />
              <span>Garage Spaces: {specs.parkingSpaces}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};


