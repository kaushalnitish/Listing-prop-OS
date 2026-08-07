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
  const formattedPrice = new Intl.NumberFormat('en-US').format(price);

  const locationText = [
    location.neighborhood,
    location.city,
    location.state,
    location.country,
  ]
    .filter(Boolean)
    .join(' • ');

  return (
    <div className="space-y-10 sm:space-y-12">
      {/* Title & Headline Block */}
      <div className="space-y-4 max-w-4xl">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-zinc-400">
          <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span>{locationText}</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-light tracking-tight text-white leading-[1.1]">
          {title}
        </h1>

        {tagline && (
          <p className="text-base sm:text-lg text-zinc-400 font-normal leading-relaxed pt-1">
            {tagline}
          </p>
        )}

        {/* Price Presentation - Understated & High-End */}
        <div className="pt-2 flex items-baseline gap-3">
          <span className="text-xs uppercase tracking-widest font-mono text-zinc-400">
            Offered At
          </span>
          <span className="text-2xl sm:text-3xl font-light text-white tracking-tight">
            {currency}{formattedPrice}
          </span>
        </div>
      </div>

      {/* Key Architectural Specs Bar */}
      <div className="border-y border-zinc-800/80 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-widest text-zinc-400">Bedrooms</p>
          <p className="text-2xl sm:text-3xl font-light text-white mt-1">
            {specs.bedrooms}
          </p>
        </div>

        <div>
          <p className="text-[11px] font-mono uppercase tracking-widest text-zinc-400">Bathrooms</p>
          <p className="text-2xl sm:text-3xl font-light text-white mt-1">
            {specs.bathrooms}
          </p>
        </div>

        <div>
          <p className="text-[11px] font-mono uppercase tracking-widest text-zinc-400">Living Area</p>
          <p className="text-2xl sm:text-3xl font-light text-white mt-1">
            {new Intl.NumberFormat('en-US').format(specs.squareFeet)}{' '}
            <span className="text-xs text-zinc-400 font-normal">sq ft</span>
          </p>
        </div>

        <div>
          <p className="text-[11px] font-mono uppercase tracking-widest text-zinc-400">Property Type</p>
          <p className="text-lg sm:text-xl font-light text-white mt-1 truncate">
            {specs.propertyType}
          </p>
        </div>
      </div>

      {/* Secondary Details (Built year & Parking) */}
      {(specs.yearBuilt || specs.parkingSpaces) && (
        <div className="flex flex-wrap items-center gap-6 text-xs text-zinc-400 font-mono tracking-wider">
          {specs.yearBuilt && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-zinc-400" />
              <span>Year Built: {specs.yearBuilt}</span>
            </div>
          )}
          {specs.parkingSpaces && (
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-zinc-400" />
              <span>Garage Spaces: {specs.parkingSpaces}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

