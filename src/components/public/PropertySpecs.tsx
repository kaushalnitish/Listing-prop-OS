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
  hideHeader?: boolean;
  hideDetails?: boolean;
}

export const PropertySpecs: React.FC<PropertySpecsProps> = ({
  price,
  currency,
  title,
  tagline,
  specs,
  location,
  hideHeader = false,
  hideDetails = false,
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
    <div className="space-y-6 sm:space-y-8 w-full max-w-full min-w-0">
      {/* Title, Headline & Price Block — Subtle Warm White Glass Card */}
      {!hideHeader && (
        <div className="rounded-2xl sm:rounded-3xl bg-white/75 backdrop-blur-md border border-stone-200/80 p-4 sm:p-8 lg:p-10 shadow-sm relative overflow-hidden space-y-4 w-full max-w-full min-w-0">
          {locationText && (
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-stone-500 font-normal min-w-0">
              <MapPin className="w-3.5 h-3.5 text-stone-500 shrink-0" />
              <span className="truncate min-w-0">{locationText}</span>
            </div>
          )}

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-normal tracking-tight text-stone-900 leading-[1.2] break-words min-w-0">
            {title}
          </h1>

          {tagline && (
            <p className="text-xs sm:text-sm text-stone-500 font-normal leading-relaxed pt-0.5 break-words min-w-0">
              {tagline}
            </p>
          )}

          {/* Price Presentation */}
          <div className="pt-3 flex flex-wrap items-baseline gap-2.5 sm:gap-4 min-w-0 border-t border-stone-200/60">
            <span className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-stone-500 font-normal shrink-0">
              Offered At
            </span>
            <span className="text-xl sm:text-2xl lg:text-3xl font-normal text-stone-900 tracking-tight break-words min-w-0">
              {currency}{formattedPrice}
            </span>
          </div>
        </div>
      )}

      {/* Section B: Property Details Section */}
      {!hideDetails && (
        <>
          <div className="space-y-6 pt-2 w-full max-w-full min-w-0">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-stone-200/80 pb-4 min-w-0">
              <div className="space-y-1 max-w-xl min-w-0">
                <h2 className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-stone-500 font-normal">
                  PROPERTY DETAILS
                </h2>
                <p className="text-xl sm:text-2xl lg:text-3xl font-normal text-stone-900 tracking-tight leading-snug break-words">
                  Every detail, designed for your comfort.
                </p>
              </div>
              <p className="text-xs sm:text-sm text-stone-500 font-normal leading-relaxed max-w-md break-words min-w-0">
                This {safeBedrooms !== '—' ? `${safeBedrooms} BHK` : ''} {safePropertyType} offers a thoughtful combination of modern design, prime location and practical spaces crafted for everyday living.
              </p>
            </div>

            {/* Spec Cards Grid */}
            <div className="rounded-2xl sm:rounded-3xl bg-white/85 backdrop-blur-md border border-stone-200/80 p-4 sm:p-6 lg:p-8 shadow-sm relative overflow-hidden w-full max-w-full min-w-0">
              <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8 w-full min-w-0">
                <div className="min-w-0 p-3 sm:p-4 rounded-xl bg-stone-50/60 border border-stone-200/50">
                  <p className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.18em] text-stone-500 font-normal truncate">
                    Bedrooms
                  </p>
                  <p className="text-lg sm:text-2xl font-normal text-stone-900 mt-1 truncate">
                    {safeBedrooms}
                  </p>
                </div>

                <div className="min-w-0 p-3 sm:p-4 rounded-xl bg-stone-50/60 border border-stone-200/50">
                  <p className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.18em] text-stone-500 font-normal truncate">
                    Bathrooms
                  </p>
                  <p className="text-lg sm:text-2xl font-normal text-stone-900 mt-1 truncate">
                    {safeBathrooms}
                  </p>
                </div>

                <div className="min-w-0 p-3 sm:p-4 rounded-xl bg-stone-50/60 border border-stone-200/50">
                  <p className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.18em] text-stone-500 font-normal truncate">
                    Living Area
                  </p>
                  <p className="text-base sm:text-2xl font-normal text-stone-900 mt-1 break-words">
                    {safeSqFt}{' '}
                    {safeSqFt !== '—' && (
                      <span className="text-xs text-stone-500 font-normal ml-0.5">sq ft</span>
                    )}
                  </p>
                </div>

                <div className="min-w-0 p-3 sm:p-4 rounded-xl bg-stone-50/60 border border-stone-200/50">
                  <p className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.18em] text-stone-500 font-normal truncate">
                    Property Type
                  </p>
                  <p className="text-xs sm:text-base font-normal text-stone-900 mt-1 leading-snug break-words">
                    {safePropertyType}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section C: Year Built / Garage Section */}
          {(hasYearBuilt || hasParking) && (
            <div className="rounded-xl sm:rounded-2xl bg-white/75 backdrop-blur-md border border-stone-200/80 p-3.5 sm:p-5 shadow-2xs flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm text-stone-700 font-mono font-normal tracking-wide w-full max-w-full min-w-0">
              {hasYearBuilt && (
                <div className="flex items-center gap-2 min-w-0">
                  <Calendar className="w-4 h-4 text-stone-500 shrink-0" />
                  <span className="truncate">Year Built: {specs.yearBuilt}</span>
                </div>
              )}
              {hasParking && (
                <div className="flex items-center gap-2 min-w-0">
                  <Car className="w-4 h-4 text-stone-500 shrink-0" />
                  <span className="truncate">Garage Spaces: {specs.parkingSpaces}</span>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};


