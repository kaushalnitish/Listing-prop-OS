import React from 'react';
import { PropertyLocation } from '../../types';
import { ExternalLink, Navigation } from 'lucide-react';

interface LocationMapProps {
  location: PropertyLocation;
}

export const LocationMap: React.FC<LocationMapProps> = ({ location }) => {
  const fullAddress = [
    location.address,
    location.neighborhood,
    location.city,
    location.state,
    location.country,
  ]
    .filter(Boolean)
    .join(', ');

  const googleMapsSearchUrl =
    location.googleMapsUrl ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
    fullAddress
  )}&t=&z=14&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="rounded-2xl sm:rounded-3xl bg-white/75 backdrop-blur-md border border-stone-200/80 p-6 sm:p-8 shadow-sm space-y-6 w-full max-w-full">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1 max-w-xl">
          <h2 className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-stone-500">
            Location & Context
          </h2>
          <p className="text-sm sm:text-base font-normal text-stone-900 flex items-center gap-2 min-w-0">
            <Navigation className="w-4 h-4 text-emerald-800 shrink-0" />
            <span className="break-words min-w-0">{fullAddress}</span>
          </p>
        </div>

        <a
          href={googleMapsSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3.5 py-1.5 rounded-full bg-white border border-stone-200/80 text-stone-800 hover:text-stone-950 hover:bg-stone-50 text-xs font-mono flex items-center gap-2 transition-all shadow-2xs"
        >
          <ExternalLink className="w-3.5 h-3.5 text-stone-500" />
          <span>Open Maps</span>
        </a>
      </div>

      {/* Nearby Highlights list if present */}
      {location.nearbyHighlights && location.nearbyHighlights.length > 0 && (
        <div className="space-y-2 pt-1">
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-stone-500">
            Nearby Landmarks
          </p>
          <div className="flex flex-wrap gap-2">
            {location.nearbyHighlights.map((highlight, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-full bg-stone-50 border border-stone-200/80 text-xs text-stone-800 font-normal shadow-2xs"
              >
                {highlight}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Embedded Google Maps Container */}
      <div className="w-full h-60 sm:h-72 rounded-xl sm:rounded-2xl overflow-hidden border border-stone-200/80 relative bg-stone-100 shadow-2xs">
        <iframe
          title="Property Location Map"
          src={mapEmbedUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen={false}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="w-full h-full opacity-90 hover:opacity-100 transition-opacity"
        />
      </div>
    </div>
  );
};

