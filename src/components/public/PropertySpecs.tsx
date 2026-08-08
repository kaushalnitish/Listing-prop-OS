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
    <div className="space-y-8 sm:space-y-10">
      {/* Title & Headline Block */}
      <div className="space-y-3 sm:space-y-4 max-w-3xl">
        {locationText && (
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-zinc-500">
            <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <span className="truncate">{locationText}</span>
          </div>
        )}

        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-light tracking-tight text-white leading-[1.15] break-words">
          {title}
        </h1>

        {tagline && (
          <p className="text-sm sm:text-base text-zinc-400 font-normal leading-relaxed pt-0.5">
            {tagline}
          </p>
        )}

        {/* Price Presentation - Integrated & Understated */}
        <div className="pt-2 flex items-baseline gap-3">
          <span className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-zinc-500">
            Offered At
          </span>
          <span className="text-xl sm:text-2xl font-light text-zinc-100 tracking-tight">
            {currency}{formattedPrice}
          </span>
        </div>
      </div>

      {/* Key Architectural Specs Bar — Frosted Glassmorphism Panel */}
      <div className="relative rounded-2xl bg-zinc-900/40 backdrop-blur-md border border-white/[0.08] p-5 sm:p-6 lg:p-7 shadow-2xl shadow-black/40 overflow-hidden">
        {/* Frosted architectural glass gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          <div>
            <p className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.18em] text-zinc-500">
              Bedrooms
            </p>
            <p className="text-xl sm:text-2xl font-light text-zinc-100 mt-1">
              {safeBedrooms}
            </p>
          </div>

          <div>
            <p className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.18em] text-zinc-500">
              Bathrooms
            </p>
            <p className="text-xl sm:text-2xl font-light text-zinc-100 mt-1">
              {safeBathrooms}
            </p>
          </div>

          <div>
            <p className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.18em] text-zinc-500">
              Living Area
            </p>
            <p className="text-xl sm:text-2xl font-light text-zinc-100 mt-1">
              {safeSqFt}{' '}
              {safeSqFt !== '—' && (
                <span className="text-xs text-zinc-500 font-normal">sq ft</span>
              )}
            </p>
          </div>

          <div>
            <p className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.18em] text-zinc-500">
              Property Type
            </p>
            <p className="text-base sm:text-lg font-light text-zinc-100 mt-1 break-words">
              {safePropertyType}
            </p>
          </div>
        </div>
      </div>

      {/* Secondary Details (Built year & Parking) */}
      {(hasYearBuilt || hasParking) && (
        <div className="flex flex-wrap items-center gap-6 text-xs text-zinc-400 font-mono tracking-wider">
          {hasYearBuilt && (
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              <span>Year Built: {specs.yearBuilt}</span>
            </div>
          )}
          {hasParking && (
            <div className="flex items-center gap-2">
              <Car className="w-3.5 h-3.5 text-zinc-500" />
              <span>Garage Spaces: {specs.parkingSpaces}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};


